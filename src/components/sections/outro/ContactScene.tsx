import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { contacts, siteInfo } from '../../../data/portfolio';
import type { ContactChannel } from '../../../data/portfolio';
import { MarqueeDivider } from '../../global/Marquee';

gsap.registerPlugin(ScrollTrigger);

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/** Fixed glyph set for the scramble: Anton glyphs of similar width, so the line barely breathes. */
const GLYPHS = 'abdeghknopqsuvxyz023456789#$&/+';
const SCRAMBLE_SECONDS = 0.48;
/** How many times the unresolved glyphs change during one scramble. */
const SCRAMBLE_TICKS = 13;

const ARIA_LABEL: Record<ContactChannel['key'], (c: ContactChannel) => string> = {
  email: (c) => `Send a mail to ${c.display}`,
  phone: (c) => `Call ${c.display}`,
  instagram: (c) => `Open Instagram ${c.display}`,
  linkedin: (c) => `Open LinkedIn ${c.display}`,
};

/**
 * One frame of the scramble from `from` to `to` at progress p (0 → 1).
 * `done` is the part of the new handle already resolved (left → right), `noise` the glyphs still
 * spinning. Deterministic: same inputs, same frame, and p = 1 is exactly `to`.
 */
function scrambleFrame(from: string, to: string, p: number) {
  const shown = Math.min(to.length, Math.floor(to.length * p));
  const grow = 1 - (1 - Math.min(1, p / 0.6)) ** 2;
  const length = Math.max(shown, Math.round(from.length + (to.length - from.length) * grow));
  const tick = Math.floor(p * SCRAMBLE_TICKS);
  let noise = '';
  for (let i = shown; i < length; i++) {
    noise += to[i] === ' ' ? ' ' : GLYPHS[(i * 7 + tick * 13 + ((i + 3) * (tick + 1)) % 11) % GLYPHS.length];
  }
  return { done: to.slice(0, shown), noise };
}

/** Clipboard API first; the old execCommand path when it is missing or rejects. Never throws. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const previous = document.activeElement as HTMLElement | null;
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(field);
    field.focus({ preventScroll: true });
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    previous?.focus?.({ preventScroll: true });
    return ok;
  } catch {
    return false;
  }
}

/**
 * Outro scene 2 — contact footer on light paper.
 *
 * The giant line is a real link to the active channel (mail by default). The pills pick the
 * channel: the line scrambles into that handle and a click on it then calls / opens it.
 */
export default function ContactScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLSpanElement>(null);
  const noiseRef = useRef<HTMLSpanElement>(null);
  /** What the giant line shows right now (mid-scramble included). */
  const shownRef = useRef(contacts[0].display);
  const playedRef = useRef(0);
  const toastTimer = useRef<number | undefined>(undefined);
  const stopTopRef = useRef<(() => void) | null>(null);

  /** `n` counts picks, so picking the active channel again replays the scramble. */
  const [pick, setPick] = useState({ index: 0, n: 0 });
  const [toast, setToast] = useState<{ ok: boolean; n: number } | null>(null);

  const channel = contacts[pick.index];
  const external = /^https?:/i.test(channel.href);

  // Entrance: the items rise in as the scene scrolls into view.
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia(REDUCE_QUERY).matches) return;

    let io: IntersectionObserver | undefined;
    const ctx = gsap.context(() => {
      const enter = gsap.fromTo(
        '.ct-item',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: root,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      // Safety net: if the scene is well inside the viewport and the trigger has not fired
      // (stale positions after a late layout shift), show the content anyway.
      if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1];
            if (entry.isIntersecting && entry.intersectionRatio >= 0.35 && enter.progress() === 0) enter.play();
          },
          { threshold: [0.35, 0.7] },
        );
        io.observe(root);
      }
    }, root);

    return () => {
      io?.disconnect();
      ctx.revert();
    };
  }, []);

  // The giant line: scramble into the picked channel's handle.
  useIsomorphicLayoutEffect(() => {
    const done = doneRef.current;
    const noise = noiseRef.current;
    if (!done || !noise) return;
    const target = contacts[pick.index].display;

    const settle = () => {
      done.textContent = target;
      noise.textContent = '';
      shownRef.current = target;
    };

    // First paint (nothing picked yet) and reduced motion: no animation.
    if (playedRef.current === pick.n || window.matchMedia(REDUCE_QUERY).matches) {
      playedRef.current = pick.n;
      settle();
      return;
    }
    playedRef.current = pick.n;

    const from = shownRef.current;
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      duration: SCRAMBLE_SECONDS,
      ease: 'none',
      onUpdate: () => {
        const frame = scrambleFrame(from, target, state.p);
        done.textContent = frame.done;
        noise.textContent = frame.noise;
        shownRef.current = frame.done + frame.noise;
      },
      onComplete: settle,
    });

    // A newer pick (or unmount) takes over from whatever is on screen.
    return () => {
      tween.kill();
    };
  }, [pick]);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      stopTopRef.current?.();
    },
    [],
  );

  const copy = useCallback(async () => {
    const ok = await copyText(channel.display);
    setToast((prev) => ({ ok, n: (prev?.n ?? 0) + 1 }));
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2000);
  }, [channel.display]);

  /**
   * Scroll to the very top. Lenis ignores native scrolling while it is gliding and would pull a
   * plain window.scrollTo straight back, so: a middle-button pointerdown on window makes Lenis
   * drop its inertia (its own reset hook), then the scroll is stepped here; Lenis follows every
   * step as a native scroll. Any wheel / touch / key press hands control back to the visitor.
   */
  const backToTop = useCallback(() => {
    stopTopRef.current?.();
    const start = window.scrollY;
    if (start < 1) return;
    window.dispatchEvent(new PointerEvent('pointerdown', { button: 1 }));

    if (window.matchMedia(REDUCE_QUERY).matches) {
      window.scrollTo(0, 0);
      return;
    }

    const pos = { y: start };
    const interrupts = ['wheel', 'touchstart', 'keydown'] as const;
    const stop = () => {
      tween.kill();
      interrupts.forEach((type) => window.removeEventListener(type, stop));
      stopTopRef.current = null;
    };
    const tween = gsap.to(pos, {
      y: 0,
      duration: gsap.utils.clamp(0.9, 2, start / 14000),
      ease: 'power3.inOut',
      onUpdate: () => window.scrollTo(0, pos.y),
      onComplete: () => {
        window.scrollTo(0, 0);
        stop();
      },
    });
    interrupts.forEach((type) => window.addEventListener(type, stop, { passive: true }));
    stopTopRef.current = stop;
  }, []);

  return (
    <div ref={rootRef} className="ct-root">
      {/* ── Padded content ── */}
      <div className="ct-main">
        <div className="ct-item ct-sparkles" aria-hidden="true">
          ✦ ✧ ✱
        </div>

        <h2 className="ct-item ct-heading">LET'S MAKE SOMETHING LOUD</h2>

        {/* Giant line — a link to the active channel */}
        <div className="ct-item">
          <div className="ct-line-box">
            <a
              className="ct-line"
              href={channel.href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              aria-label={ARIA_LABEL[channel.key](channel)}
              data-cursor={channel.action}
            >
              {/* Filled imperatively (see the scramble effect) so screen readers only get the label. */}
              <span className="ct-line-text" aria-hidden="true">
                <span ref={doneRef} />
                <span ref={noiseRef} className="ct-line-noise" />
              </span>
              <span className="ct-line-underline" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Hint + copy */}
        <div className="ct-item ct-hint-row">
          <span className="ct-hint">
            <span key={channel.key} className="ct-hint-text">
              {channel.hint} <span aria-hidden="true">↗</span>
            </span>
          </span>
          <button
            type="button"
            className="ct-copy"
            onClick={copy}
            data-cursor="COPY"
            aria-label={`Copy ${channel.display}`}
          >
            COPY
          </button>
        </div>

        {/* Channel pills — pick what the giant line points to */}
        <div className="ct-item ct-pills" role="group" aria-label="Contact channel">
          {contacts.map((item, i) => (
            <button
              key={item.key}
              type="button"
              className="ct-pill"
              aria-pressed={i === pick.index}
              data-cursor={item.label}
              onClick={() => setPick((prev) => ({ index: i, n: prev.n + 1 }))}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Services marquee: full-bleed, outside the padded blocks ── */}
      <div className="ct-strip">
        <MarqueeDivider text="LOGOS ✦ BRANDING ✦ WEB ✦ SOCIAL ✦ PACKAGING ✦ AVAILABLE FOR FREELANCE 2026 ✦" />
      </div>

      {/* ── Small print ── */}
      <div className="ct-foot">
        <div className="ct-item ct-small">
          <span>
            © {siteInfo.year} {siteInfo.name}
          </span>
          <span className="ct-small-sep" aria-hidden="true">
            ✦
          </span>
          <span>DESIGNED &amp; DEVELOPED BY ME</span>
          <span className="ct-small-sep" aria-hidden="true">
            ✦
          </span>
          <button type="button" className="ct-top" onClick={backToTop} data-cursor="TOP">
            BACK TO TOP <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>

      {/* Copied toast — outside every animated item so position: fixed stays viewport-relative */}
      <div className="ct-toast" role="status" aria-live="polite">
        {toast && (
          <div key={toast.n} className="ct-toast-pop">
            <span className={`sticker ${toast.ok ? 'sticker--acid' : 'sticker--signal'}`} style={{ fontSize: '0.7rem' }}>
              {toast.ok ? 'COPIED ✦' : 'COULD NOT COPY'}
            </span>
          </div>
        )}
      </div>

      <style>{`
        .ct-root {
          position: relative;
          background-color: var(--paper);
          color: var(--ink);
          text-align: center;
          --ct-pad: clamp(1.25rem, 4vw, 2rem);
          --ct-soft: color-mix(in srgb, var(--ink) 58%, transparent);
        }
        .ct-main { padding: clamp(4rem, 9vw, 6rem) var(--ct-pad) 0; }

        .ct-sparkles {
          font-family: var(--font-meta);
          font-size: 1.5rem;
          letter-spacing: 0.5em;
          padding-left: 0.5em; /* letter-spacing trails the last glyph: keep the row optically centred */
          color: var(--signal);
          margin-bottom: 1.5rem;
        }
        .ct-heading {
          font-family: var(--font-heading);
          font-weight: 900;
          font-stretch: 125%;
          font-size: clamp(1.5rem, 4vw, 3rem);
          letter-spacing: 0.04em;
          line-height: 1.15;
          text-wrap: balance;
          margin-bottom: clamp(1.25rem, 3vw, 2rem);
        }

        /* Giant line: one line, fixed-height box so nothing below moves when the handle changes */
        .ct-line-box {
          --ct-fs: clamp(1.15rem, 7vw, 4.6rem);
          height: calc(var(--ct-fs) * 1.3);
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }
        .ct-line {
          position: relative;
          display: inline-block;
          font-family: var(--font-display);
          font-size: var(--ct-fs);
          line-height: 1.1;
          white-space: pre;
          color: var(--ink);
          text-decoration: none;
          transition: color 0.3s;
          -webkit-tap-highlight-color: transparent;
        }
        .ct-line-noise { color: var(--signal); opacity: 0.72; }
        .ct-line-underline {
          position: absolute;
          left: 0;
          right: 0;
          bottom: -5px;
          height: 4px;
          background: var(--chrome);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s var(--ease-enter);
        }
        @media (hover: hover) {
          .ct-line:hover { color: var(--signal); }
          .ct-line:hover .ct-line-underline { transform: scaleX(1); }
        }
        .ct-line:active,
        .ct-line:focus-visible { color: var(--signal); outline: none; }
        .ct-line:focus-visible .ct-line-underline { transform: scaleX(1); }

        .ct-hint-row {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.5rem 0.9rem;
          min-height: 1.9rem;
          margin-top: clamp(0.85rem, 2vw, 1.25rem);
          font-family: var(--font-meta);
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .ct-hint { color: var(--ct-soft); }
        .ct-hint-text { display: inline-block; animation: ct-hint-in 0.35s var(--ease-enter) both; }
        .ct-copy {
          padding: 0.3rem 0.7rem;
          border: 1px solid color-mix(in srgb, var(--ink) 40%, transparent);
          border-radius: 999px;
          font: inherit;
          letter-spacing: inherit;
          color: var(--ink);
          transition: background-color 0.25s, color 0.25s, border-color 0.25s;
        }
        .ct-copy:active { background-color: var(--ink); color: var(--bone); border-color: var(--ink); }

        .ct-pills {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: clamp(1.75rem, 4vw, 2.75rem);
        }
        .ct-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.6rem 1.2rem;
          border: 1px solid var(--ink);
          border-radius: 999px;
          background-color: transparent;
          font-family: var(--font-meta);
          font-size: 0.65rem;
          line-height: 1.6;
          letter-spacing: 0.08em;
          color: var(--ink);
          transition: background-color 0.3s var(--ease-enter), color 0.3s var(--ease-enter), transform 0.3s var(--ease-bounce);
          -webkit-tap-highlight-color: transparent;
        }
        .ct-pill[aria-pressed="true"] { background-color: var(--ink); color: var(--bone); }
        .ct-pill:active { transform: scale(0.96); }
        @media (hover: hover) {
          .ct-pill:hover { background-color: var(--ink); color: var(--bone); transform: translateY(-2px); }
          .ct-pill:hover:active { transform: translateY(0) scale(0.97); }
          .ct-copy:hover { background-color: var(--ink); color: var(--bone); border-color: var(--ink); }
          .ct-top:hover { color: var(--signal); }
        }
        .ct-pill:focus-visible,
        .ct-copy:focus-visible,
        .ct-top:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; }

        /* Room for the rotated ends of the two strips (they swing ~1.9vw past their box) */
        .ct-strip { padding: calc(2vw + 2.5rem) 0 calc(2vw + 2.25rem); }

        .ct-foot { padding: 0 var(--ct-pad) clamp(3rem, 6vw, 4rem); }
        .ct-small {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.6rem 1.5rem;
          font-family: var(--font-meta);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: var(--ct-soft);
        }
        .ct-top {
          padding: 0.4rem 0;
          font: inherit;
          letter-spacing: inherit;
          color: inherit;
          transition: color 0.2s;
        }

        .ct-toast {
          position: fixed;
          left: 50%;
          bottom: 2rem;
          transform: translateX(-50%);
          z-index: calc(var(--z-cursor) - 1);
          pointer-events: none;
        }
        .ct-toast-pop { animation: ct-toast-in 0.3s ease both; }

        @keyframes ct-toast-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ct-hint-in {
          from { opacity: 0; transform: translateY(0.5em); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 560px) {
          .ct-pills {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.6rem;
            max-width: 20rem;
            margin-left: auto;
            margin-right: auto;
          }
          .ct-pill { padding: 0.8rem 0.5rem; }
          .ct-copy { padding: 0.45rem 0.85rem; }
          .ct-small { flex-direction: column; gap: 0.35rem; }
          .ct-small-sep { display: none; }
          .ct-top { padding: 0.6rem 0.75rem; }
        }
      `}</style>
    </div>
  );
}
