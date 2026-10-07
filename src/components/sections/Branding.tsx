import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { brands } from '../../data/portfolio';
import type { BrandEntry, MoodboardFrame } from '../../data/portfolio';
import ChapterCard from '../global/ChapterCard';
import { MarqueeDivider } from '../global/Marquee';
import Lightbox from './branding/Lightbox';

gsap.registerPlugin(ScrollTrigger);

/* ── Helpers ───────────────────────────────────────── */

const PIN_QUERY = '(min-width: 900px) and (min-height: 560px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
/** The chapter's own colour (BackgroundStage), shown behind the title card */
const BASE_STAGE = '#0B0F2E';

/**
 * matchMedia hook that reads the real value on the first render, so the
 * pinned ScrollTriggers are created once, in document order, on mount.
 */
function useMatch(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Deterministic PRNG so every load produces the identical entrance */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type BoardModel = {
  /** frame indices (into brand.frames) in entrance order */
  sequence: number[];
  /** entrance rank per frame index */
  rank: number[];
  /** stacking level per frame index (0 = flat, >0 = sits on top of a neighbour) */
  lift: number[];
};

/**
 * Entrance order + stacking. A frame that overlaps its neighbours (the phone
 * cards that break out of their row) must sit on top, exactly like the
 * reference: the frame touching more neighbours wins, then the smaller one,
 * then the later one.
 */
function buildModel(brand: BrandEntry): BoardModel {
  const frames = brand.frames;
  const sequence = frames.map((_, i) => i).sort((a, b) => frames[a].order - frames[b].order || a - b);
  const rank: number[] = [];
  sequence.forEach((frameIdx, r) => {
    rank[frameIdx] = r;
  });

  const EPS = 0.0005;
  const hits = (a: MoodboardFrame, b: MoodboardFrame) =>
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > EPS &&
    Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > EPS;

  const touching = frames.map((a, i) => frames.filter((b, j) => j !== i && hits(a, b)).length);
  const lift = frames.map((a, i) => {
    let wins = 0;
    frames.forEach((b, j) => {
      if (j === i || !hits(a, b)) return;
      const areaA = a.w * a.h;
      const areaB = b.w * b.h;
      const onTop =
        touching[i] !== touching[j]
          ? touching[i] > touching[j]
          : areaA !== areaB
            ? areaA < areaB
            : rank[i] > rank[j];
      if (onTop) wins += 1;
    });
    return wins;
  });

  return { sequence, rank, lift };
}

const pct = (n: number) => `${(n * 100).toFixed(4)}%`;

/* ── Component ─────────────────────────────────────── */

/**
 * Branding Section — brand kit moodboards.
 * Every board is a faithful, scaled rebuild of the designer's reference
 * layout (absolute frames from layout.json). On desktop each brand is one
 * pinned scene whose frames fly in and self-arrange, scrubbed to scroll.
 */
export default function Branding() {
  const sectionRef = useRef<HTMLElement>(null);
  const createdOnce = useRef(false);

  const wide = useMatch(PIN_QUERY);
  const reduced = useMatch(REDUCED_QUERY);
  const pin = wide && !reduced;

  const models = useMemo(() => brands.map(buildModel), []);
  const [armed, setArmed] = useState<boolean[]>(() => brands.map(() => false));
  const [lightbox, setLightbox] = useState<{ brand: number; index: number } | null>(null);

  // Start loading a board's frames well before its scene arrives (the frames
  // wait far off-screen, where native lazy-loading would fetch them too late).
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('.bk-scene'));
    if (typeof IntersectionObserver === 'undefined') {
      setArmed(brands.map(() => true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = scenes.indexOf(entry.target as HTMLElement);
          io.unobserve(entry.target);
          if (idx < 0) return;
          setArmed((prev) => (prev[idx] ? prev : prev.map((v, i) => (i === idx ? true : v))));
        });
      },
      { rootMargin: '150% 0px 150% 0px' },
    );
    scenes.forEach((scene) => io.observe(scene));
    return () => io.disconnect();
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = sectionRef.current;
    if (!root || reduced) return;

    const ctx = gsap.context(() => {
      const scenes = gsap.utils.toArray<HTMLElement>('.bk-scene');

      scenes.forEach((scene, bIdx) => {
        const brand = brands[bIdx];
        const model = models[bIdx];
        const fit = scene.querySelector<HTMLElement>('.bk-fit');
        const board = scene.querySelector<HTMLElement>('.bk-board');
        if (!brand || !model || !fit || !board) return;

        // Repaint the page for this brand. Entering back fires at "bottom 85%" so it
        // lands after BackgroundStage's own leave-back of the next section (top 80%).
        const paint = (color: string) => window.dispatchEvent(new CustomEvent('stage:color', { detail: color }));
        ScrollTrigger.create({
          trigger: scene,
          start: 'top 60%',
          end: 'bottom 85%',
          onEnter: () => paint(brand.stage),
          onEnterBack: () => paint(brand.stage),
          onLeaveBack: () => paint(bIdx > 0 ? brands[bIdx - 1].stage : BASE_STAGE),
        });

        const frameEls = Array.from(board.querySelectorAll<HTMLElement>('.bk-frame'));
        const introBits = scene.querySelectorAll('.bk-intro-bit');

        // Brand intro — visible by default, only animates once its trigger fires
        const introTween = gsap.from(introBits, {
          opacity: 0,
          y: 18,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.07,
          paused: true,
          immediateRender: false,
          clearProps: 'transform,opacity',
        });
        ScrollTrigger.create({
          trigger: scene,
          start: 'top 85%',
          once: true,
          onEnter: () => introTween.play(),
        });

        if (!pin) {
          // ── Mobile / narrow: no pin, one simple stagger in entrance order ──
          const ordered = model.sequence.map((i) => frameEls[i]).filter(Boolean);
          const boardTween = gsap.from(ordered, {
            opacity: 0,
            y: 22,
            x: (i: number) => (brand.frames[model.sequence[i]].from === 'left' ? -28 : 28),
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.05,
            paused: true,
            immediateRender: false,
            clearProps: 'transform,opacity',
          });
          ScrollTrigger.create({
            trigger: fit,
            start: 'top 88%',
            once: true,
            onEnter: () => boardTween.play(),
          });
          return;
        }

        // ── Desktop: one pinned scene, frames self-arrange, scrubbed ──
        const count = frameEls.length;
        const STAGGER = 0.4; // each 1.0-long flight overlaps the previous by 60%
        const endPct = Math.round(gsap.utils.clamp(180, 250, 140 + count * 7));

        const tl = gsap.timeline({
          defaults: { overwrite: false },
          scrollTrigger: {
            trigger: scene,
            start: 'top top',
            end: `+=${endPct}%`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        const rand = seeded(hash(brand.slug));

        frameEls.forEach((el, i) => {
          const frame = brand.frames[i];
          if (!frame) return;
          const r1 = rand();
          const r2 = rand();
          const r3 = rand();
          const dir = frame.from === 'left' ? -1 : 1;
          const t0 = model.rank[i] * STAGGER;
          const tilt = -dir * (10 + r3 * 8); // 10–18°, leaning into the direction of travel
          const flash = el.querySelector('.bk-flash');

          // Start fully off-screen on its side: 60–110vw, more if the slot needs it
          const startX = () => {
            const vw = window.innerWidth;
            const bw = board.offsetWidth;
            const boardLeft = fit.getBoundingClientRect().left;
            const clear =
              dir < 0 ? boardLeft + (frame.x + frame.w) * bw : vw - (boardLeft + frame.x * bw);
            return dir * Math.max(vw * (0.6 + r1 * 0.5), clear + vw * 0.08);
          };
          const startY = () => (r2 * 2 - 1) * 0.15 * window.innerHeight;
          // Lands just past its slot (2–4% of board width), then snaps back
          const overshoot = () => -dir * (0.02 + r1 * 0.02) * board.offsetWidth;

          tl.fromTo(
            el,
            { x: startX, rotation: tilt, scale: 0.85, filter: 'blur(4px)' },
            { x: overshoot, rotation: tilt * 0.08, scale: 1, filter: 'blur(0px)', duration: 0.85, ease: 'power3.out' },
            t0,
          );
          // y eases differently from x, so the flight follows a slight arc
          tl.fromTo(el, { y: startY }, { y: 0, duration: 0.85, ease: 'power2.inOut' }, t0);
          tl.to(el, { x: 0, rotation: 0, duration: 0.15, ease: 'back.out(2)' }, t0 + 0.85);

          if (flash) {
            tl.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: 'none' }, t0 + 0.85);
            tl.to(flash, { opacity: 0, duration: 0.25, ease: 'power1.in' }, t0 + 0.95);
          }
        });

        // Completion beat, then hold so the finished board can be read
        const assembled = Math.max(0, count - 1) * STAGGER + 1;
        tl.to(board, { scale: 1.01, duration: 0.12, ease: 'power1.out' }, assembled);
        tl.to(board, { scale: 1, duration: 0.28, ease: 'power2.out' }, assembled + 0.12);
        tl.to({}, { duration: (assembled + 0.4) * 0.3 });
      });
    }, root);

    // Recreated after a breakpoint change: put the pins back in page order
    if (createdOnce.current) {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }
    createdOnce.current = true;

    return () => ctx.revert();
  }, [pin, reduced, models]);

  const open = lightbox ? brands[lightbox.brand] : null;
  const openModel = lightbox ? models[lightbox.brand] : null;

  return (
    <section
      ref={sectionRef}
      id="section-branding"
      className={pin ? 'bk bk--pin' : 'bk bk--flow'}
      style={{ position: 'relative', zIndex: 'var(--z-content)' as any, color: 'var(--bone)' }}
    >
      <MarqueeDivider text="BRANDING ✦✦✦ VISUAL IDENTITY ✦✦✦" />
      <ChapterCard chapterIndex={2} title="BRANDING / VISUAL IDENTITY" />

      {brands.map((brand, bIdx) => {
        const model = models[bIdx];
        const boardVars = { '--a': brand.aspect, '--r': brand.radius } as CSSProperties;

        return (
          <div key={brand.slug} className="bk-scene" data-brand={brand.slug} style={{ '--accent': brand.accent } as CSSProperties}>
            {/* Brand intro */}
            <div className="bk-intro">
              <div>
                <div className="bk-intro-bit bk-meta">
                  <span>
                    {brand.industry.toUpperCase()} ✦ {brand.year}
                  </span>
                  <span className="bk-chips" aria-label="Brand colours">
                    {[brand.primary, brand.secondary].filter(Boolean).map((hex) => (
                      <span key={hex} className="bk-chip" title={hex}>
                        <i style={{ backgroundColor: hex }} />
                        {hex}
                      </span>
                    ))}
                  </span>
                </div>
                <h3 className="bk-intro-bit bk-name">{brand.name}</h3>
                <p className="bk-intro-bit bk-hook">{brand.hookLine}</p>
              </div>

              <div className="bk-story">
                <p className="bk-intro-bit">
                  <strong>THE BRIEF</strong>
                  {brand.theBrief}
                </p>
                <p className="bk-intro-bit">
                  <strong>THE IDEA</strong>
                  {brand.theIdea}
                </p>
                <p className="bk-intro-bit">
                  <strong>THE IDENTITY</strong>
                  {brand.theIdentity}
                </p>
              </div>
            </div>

            <div className="bk-hint" aria-hidden="true">
              DRAG ↔ TO EXPLORE THE BOARD
            </div>

            {/* Moodboard — absolute frames from layout.json, scaled from the reference */}
            <div className="bk-fit" style={boardVars}>
              <div
                className="bk-board"
                role="group"
                aria-label={`${brand.name} brand kit moodboard`}
                style={{ aspectRatio: String(brand.aspect) }}
              >
                <span className="bk-snap" style={{ left: 0, scrollSnapAlign: 'start' }} />
                <span className="bk-snap" style={{ right: 0, scrollSnapAlign: 'end' }} />

                {brand.frames.map((frame, fIdx) => {
                  const label = frame.label ?? `FRAME ${String(fIdx + 1).padStart(2, '0')}`;
                  const lift = model.lift[fIdx];
                  return (
                    <div
                      key={frame.src}
                      className={lift > 0 ? 'bk-frame bk-frame--top' : 'bk-frame'}
                      style={
                        {
                          left: pct(frame.x),
                          // y / h are normalised to board WIDTH; top/height % are relative to board HEIGHT
                          top: pct(frame.y * brand.aspect),
                          width: pct(frame.w),
                          height: pct(frame.h * brand.aspect),
                          '--z': 1 + lift,
                        } as CSSProperties
                      }
                    >
                      <button
                        type="button"
                        className="bk-card"
                        data-cursor="VIEW"
                        aria-label={`View ${brand.name} — ${label.toLowerCase()}`}
                        onClick={() => setLightbox({ brand: bIdx, index: model.rank[fIdx] })}
                      >
                        <img
                          src={frame.src}
                          alt={`${brand.name} brand identity — ${label.toLowerCase()}`}
                          loading={armed[bIdx] ? 'eager' : 'lazy'}
                          decoding="async"
                          draggable={false}
                        />
                        <span className="bk-label" aria-hidden="true">
                          {label}
                        </span>
                      </button>
                      <span className="bk-flash" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {lightbox && open && openModel && (
        <Lightbox
          brandName={open.name}
          frames={openModel.sequence.map((i) => open.frames[i])}
          index={lightbox.index}
          onIndexChange={(index) => setLightbox({ brand: lightbox.brand, index })}
          onClose={() => setLightbox(null)}
        />
      )}

      <style>{`
        .bk { overflow-x: clip; }

        /* ── Brand intro strip ── */
        .bk-intro {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 1rem;
          width: 100%;
          max-width: 1560px;
          margin: 0 auto;
          flex: none;
        }
        .bk-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem 1rem;
          font-family: var(--font-meta);
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          color: var(--accent, var(--signal));
          margin-bottom: 0.5rem;
        }
        .bk-chips { display: inline-flex; gap: 0.75rem; }
        .bk-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: rgba(244, 241, 234, 0.75);
          letter-spacing: 0.06em;
        }
        .bk-chip i {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: 1px solid rgba(244, 241, 234, 0.4);
          display: inline-block;
        }
        .bk-name {
          font-family: var(--font-display);
          font-size: clamp(2.1rem, 3.7vw, 3.9rem);
          font-weight: 400;
          line-height: 0.95;
          text-transform: uppercase;
          color: var(--bone);
          margin: 0;
        }
        .bk-hook {
          font-family: var(--font-handwritten);
          font-size: clamp(1.3rem, 1.7vw, 1.75rem);
          line-height: 1.1;
          color: var(--accent, var(--signal));
          margin: 0.45rem 0 0;
        }
        .bk-story {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.75rem 1.75rem;
        }
        .bk-story p {
          font-family: var(--font-body);
          font-size: clamp(0.78rem, 0.9vw, 0.9rem);
          line-height: 1.45;
          color: rgba(244, 241, 234, 0.82);
          margin: 0;
        }
        .bk-story strong {
          display: block;
          font-family: var(--font-meta);
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--bone);
          margin-bottom: 0.3rem;
        }
        @media (min-width: 640px) {
          .bk-story { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 900px) {
          .bk--flow .bk-intro {
            grid-template-columns: minmax(0, 0.8fr) minmax(0, 2fr);
            gap: 2.5rem;
            align-items: end;
          }
        }

        .bk-hint {
          display: none;
          font-family: var(--font-meta);
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          color: rgba(244, 241, 234, 0.7);
          margin-top: 1.25rem;
        }

        /* ── Board ── */
        .bk-board {
          position: relative;
          container-type: inline-size;
          margin: 0 auto;
          flex: none;
        }
        .bk-snap { position: absolute; top: 0; width: 1px; height: 1px; pointer-events: none; }
        .bk-frame {
          position: absolute;
          z-index: var(--z, 1);
          will-change: transform;
        }
        .bk-card {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          padding: 0;
          margin: 0;
          border: 0;
          background: none;
          cursor: pointer;
          border-radius: calc(var(--r) * 100cqw);
          filter: drop-shadow(0 0.35cqw 0.8cqw rgba(0, 0, 0, 0.45));
          transition: transform 0.35s var(--ease-bounce), filter 0.35s ease, opacity 0.3s ease;
        }
        /* a frame sitting on top of its neighbours carries part of them in its crop: no resting shadow */
        .bk-frame--top .bk-card { filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0)); }
        .bk-card img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: fill;
          user-select: none;
          -webkit-user-drag: none;
        }
        .bk-card:focus-visible {
          outline: 2px solid var(--signal);
          outline-offset: 3px;
        }
        .bk-label {
          position: absolute;
          left: 0.6cqw;
          bottom: 0.6cqw;
          max-width: calc(100% - 1.2cqw);
          padding: 0.25em 0.55em;
          font-family: var(--font-meta);
          font-size: clamp(8px, 0.72cqw, 11px);
          letter-spacing: 0.1em;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #F4F1EA;
          background: rgba(11, 15, 46, 0.86);
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.25s ease, transform 0.25s ease;
          pointer-events: none;
        }
        .bk-card:focus-visible .bk-label { opacity: 1; transform: none; }

        /* landing flash — a --signal selection box */
        .bk-flash {
          position: absolute;
          inset: -3px;
          border: 1.5px solid var(--signal);
          opacity: 0;
          pointer-events: none;
        }
        .bk-flash i {
          position: absolute;
          width: 7px;
          height: 7px;
          background: var(--bone);
          border: 1.5px solid var(--signal);
        }
        .bk-flash i:nth-child(1) { top: -4px; left: -4px; }
        .bk-flash i:nth-child(2) { top: -4px; right: -4px; }
        .bk-flash i:nth-child(3) { bottom: -4px; left: -4px; }
        .bk-flash i:nth-child(4) { bottom: -4px; right: -4px; }

        @media (hover: hover) {
          .bk-board .bk-frame:hover { z-index: 60; }
          .bk-board .bk-frame:hover .bk-card {
            opacity: 1;
            transform: translateY(-8px) scale(1.03);
            filter: drop-shadow(0 1.1cqw 2cqw rgba(0, 0, 0, 0.65));
          }
          .bk-board .bk-frame:hover .bk-label { opacity: 1; transform: none; }
        }

        /* ── Desktop: pinned scene, board on the left, brand story in a column on the right ── */
        .bk--pin .bk-scene {
          height: 100vh;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: clamp(24px, 2.6vw, 48px);
          padding: clamp(64px, 9vh, 84px) 3vw clamp(18px, 3.5vh, 36px) 2.5vw;
          overflow: hidden;
        }
        .bk--pin .bk-fit {
          order: 1;
          flex: 1 1 0;
          min-width: 0;
          height: 100%;
          container-type: size;
          display: grid;
          place-items: center start;
        }
        .bk--pin .bk-board { margin: 0; }
        .bk--pin .bk-intro {
          order: 2;
          flex: none;
          width: clamp(250px, 22vw, 340px);
          margin: 0;
          gap: clamp(1rem, 3vh, 2rem);
        }
        .bk--pin .bk-story { grid-template-columns: minmax(0, 1fr); gap: clamp(0.7rem, 2vh, 1.2rem); }
        .bk--pin .bk-name { font-size: clamp(2.2rem, 3.6vw, 4rem); }
        .bk--pin .bk-board { width: min(100cqw, calc(100cqh * var(--a))); }

        /* ── Mobile / reduced motion: normal flow ── */
        .bk--flow .bk-scene { padding: 3.5rem 4vw 5rem; }
        .bk--flow .bk-fit { margin-top: 1.75rem; }
        .bk--flow .bk-board { width: 100%; max-width: calc(86vh * var(--a)); }

        @media (max-width: 639px) {
          .bk--flow .bk-hint { display: block; }
          .bk--flow .bk-fit {
            margin: 0.5rem -4vw 0;
            padding: 16px 4vw 22px;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x proximity;
            scroll-padding-inline: 4vw;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .bk--flow .bk-fit::-webkit-scrollbar { display: none; }
          .bk--flow .bk-board { width: 170vw; max-width: none; }
        }

        .bk-lightbox { animation: bk-fade 0.25s ease both; }
        .bk-lightbox-img { animation: bk-pop 0.35s var(--ease-enter) both; }
        @keyframes bk-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bk-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .bk-lightbox, .bk-lightbox-img { animation: none; }
          .bk-card, .bk-label { transition: none; }
        }
      `}</style>
    </section>
  );
}
