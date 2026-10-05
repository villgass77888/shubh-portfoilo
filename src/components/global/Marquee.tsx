import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface MarqueeProps {
  text: string;
  reverse?: boolean;
  /** Accent color for hover */
  accent?: string;
}

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
/** Seconds one loop takes at timeScale 1. The real pace is set in px/s through timeScale. */
const LOOP_SECONDS = 20;
/** Drift speed, in em of the strip's own type per second. */
const SPEED_EM = 4.2;
/** How far each rotated strip sticks out past its container on either side (% of its width). */
const BLEED = 4;
const MAX_PER_HALF = 48;

/** Copies per half before anything is measured: enough for a 2560px strip at the smallest type size. */
function guessPerHalf(text: string) {
  const unit = Math.max(text.length + 1, 4) * 8;
  return Math.min(MAX_PER_HALF, Math.max(2, Math.ceil(2800 / unit) + 1));
}

/**
 * Marquee strip — one rotated band of endlessly looping text.
 *
 * The track is two identical halves, each at least as wide as the strip, and travels exactly
 * one half per loop (0 → -50%, or -50% → 0 when reversed), so there is never a gap or a jump.
 * Scroll velocity adds speed and a skew; hovering pauses the strip and turns it acid with ink text.
 */
export default function Marquee({ text, reverse = false, accent }: MarqueeProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const skewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<gsap.core.Tween | null>(null);
  const calmRef = useRef<(() => void) | null>(null);
  const live = useRef({ hovered: false, inView: true, reduced: false, base: 1, boost: 0 });
  const [perHalf, setPerHalf] = useState(() => guessPerHalf(text));
  const [hot, setHot] = useState(false);

  /** The one place that decides whether the loop runs, and how fast. Reads refs only. */
  const sync = () => {
    const loop = loopRef.current;
    if (!loop) return;
    const s = live.current;
    if (s.reduced || s.hovered || !s.inView) {
      loop.pause();
      return;
    }
    loop.timeScale(s.base * (1 + s.boost));
    loop.play();
  };

  // Enough copies to fill the strip twice over, whatever the viewport and the type size.
  useIsomorphicLayoutEffect(() => {
    const strip = stripRef.current;
    const track = trackRef.current;
    if (!strip || !track) return;
    const unit = track.querySelector<HTMLElement>('.marquee-unit');

    const measure = () => {
      const unitW = unit?.offsetWidth ?? 0;
      const stripW = strip.offsetWidth;
      if (!unitW || !stripW) return;
      const need = Math.min(MAX_PER_HALF, Math.max(2, Math.ceil(stripW / unitW) + 1));
      setPerHalf((prev) => (prev === need ? prev : need));
      // Same pace in px/s on every strip, however long its text is.
      const fontSize = parseFloat(getComputedStyle(track).fontSize) || 16;
      live.current.base = (fontSize * SPEED_EM * LOOP_SECONDS) / (unitW * need);
      sync();
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(strip);
    if (unit) ro.observe(unit);
    return () => ro.disconnect();
  }, [text]);

  useIsomorphicLayoutEffect(() => {
    const strip = stripRef.current;
    const skew = skewRef.current;
    const track = trackRef.current;
    if (!strip || !skew || !track) return;
    const s = live.current;

    const mql = window.matchMedia(REDUCE_QUERY);
    s.reduced = mql.matches;

    const ctx = gsap.context(() => {
      // Forward: 0 → -50%. Reverse: -50% → 0. Both ends show the same picture, so the loop is seamless.
      const loop = gsap.fromTo(
        track,
        { xPercent: reverse ? -50 : 0 },
        { xPercent: reverse ? 0 : -50, duration: LOOP_SECONDS, ease: 'none', repeat: -1, paused: true },
      );
      // Start the two strips of a divider out of phase so their words never line up.
      if (reverse) loop.progress(0.37);
      loopRef.current = loop;

      // Scroll velocity: skew on a wrapper (never on the travelling track) plus a speed boost.
      const skewTo = gsap.quickTo(skew, 'skewX', { duration: 0.35, ease: 'power3.out' });
      const boostTo = gsap.quickTo(s, 'boost', { duration: 0.4, ease: 'power2.out', onUpdate: sync });
      const calm = () => {
        skewTo(0);
        boostTo(0);
      };
      calmRef.current = calm;
      const settle = gsap.delayedCall(0.14, calm).pause();

      ScrollTrigger.create({
        trigger: strip,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          if (s.reduced || s.hovered) return;
          const velocity = self.getVelocity() / 1000;
          skewTo(gsap.utils.clamp(-10, 10, velocity * 2));
          boostTo(Math.min(3, Math.abs(velocity) * 0.5));
          settle.restart(true);
        },
      });
    }, strip);

    // Only strips near the viewport keep running.
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          s.inView = entries[entries.length - 1].isIntersecting;
          sync();
        },
        { rootMargin: '25% 0px' },
      );
      io.observe(strip);
    }

    const onMotionPref = () => {
      s.reduced = mql.matches;
      if (s.reduced) calmRef.current?.();
      sync();
    };
    mql.addEventListener('change', onMotionPref);
    sync();

    return () => {
      mql.removeEventListener('change', onMotionPref);
      io?.disconnect();
      loopRef.current = null;
      calmRef.current = null;
      s.boost = 0;
      s.inView = true;
      ctx.revert();
    };
  }, [reverse]);

  // Hover pauses the strip (mouse / pen only: a tap must not leave it stuck acid).
  const onEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    live.current.hovered = true;
    calmRef.current?.();
    sync();
    setHot(true);
  };
  const onLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    live.current.hovered = false;
    sync();
    setHot(false);
  };

  const units = Array.from({ length: perHalf }, (_, i) => i);

  return (
    <div
      ref={stripRef}
      className="marquee-strip"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={{
        // Wider than the container so the rotated ends are always off-screen.
        width: `${100 + BLEED * 2}%`,
        marginLeft: `-${BLEED}%`,
        overflow: 'hidden',
        backgroundColor: hot ? accent || 'var(--acid)' : 'var(--ink)',
        color: hot ? 'var(--ink)' : 'var(--bone)',
        padding: '14px 0',
        transform: `rotate(${reverse ? -2 : 2}deg)`,
        transformOrigin: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.3s, color 0.3s',
      }}
    >
      <div ref={skewRef} className="marquee-skew" style={{ willChange: 'transform' }}>
        <div
          ref={trackRef}
          className="marquee-inner"
          style={{
            display: 'flex',
            width: 'max-content',
            whiteSpace: 'pre',
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontStretch: '125%',
            fontSize: 'var(--fs-marquee)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            // No colour of its own: it follows the strip (bone at rest, ink on hover).
            color: 'inherit',
            willChange: 'transform',
          }}
        >
          {[0, 1].map((half) => (
            <div key={half} className="marquee-half" aria-hidden={half === 1 ? true : undefined} style={{ display: 'flex', flex: 'none' }}>
              {units.map((i) => (
                <span
                  key={i}
                  className="marquee-unit"
                  aria-hidden={half === 0 && i > 0 ? true : undefined}
                  style={{ flex: 'none' }}
                >
                  {`${text} `}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * MarqueeDivider — two counter-rotating strips running in opposite directions, full-bleed.
 * The strips are wider than the divider; overflow-x: clip trims them at its edges without
 * creating page overflow, and leaves the rotated ends free to hang above and below.
 *
 * The two strips converge towards the right edge (±2° closes ~3.5vw across the viewport).
 * The 3vw between them makes them meet only at that edge, by less than their own padding,
 * so the lower strip never slices through the upper strip's text.
 */
export function MarqueeDivider({ text }: { text: string }) {
  return (
    <div
      className="marquee-divider"
      style={{ position: 'relative', padding: '0.5rem 0', zIndex: 'var(--z-marquee)' as any, overflowX: 'clip' }}
    >
      <Marquee text={text} />
      <div aria-hidden="true" style={{ marginTop: '3vw' }}>
        <Marquee text={text} reverse />
      </div>
    </div>
  );
}
