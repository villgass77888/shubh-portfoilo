import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { websites } from '../../data/portfolio';
import ChapterCard from '../global/ChapterCard';
import { MarqueeDivider } from '../global/Marquee';
import BrowserFrame from './web/WebCard';
import WebLightbox from './web/WebLightbox';
import WebStack from './web/WebStack';

gsap.registerPlugin(ScrollTrigger);

/* ── Plane geometry ──
   Everything inside the tilted plane is measured in "u" (see --u on the stage / unit() below),
   relative to the plane's centre, which sits on the stage centre. */
const U_VW = 0.9; // u = max(U_VW vw, U_VH vh)
const U_VH = 1.5;
const CARD_W = 37;
const BAR_H = 1.3;
const CARD_H = BAR_H + (CARD_W * 905) / 1900; // chrome bar + 1900x905 recording
const TILT = -28;
const RAD = (-TILT * Math.PI) / 180;
const COS = Math.cos(RAD);
const SIN = Math.sin(RAD);

/* Centre-stage ("featured") card: share of the viewport it may take, and how far above centre it sits
   (so the caption strip fits underneath). */
const BIG_VW = 0.66;
const BIG_VH = 0.66;
const BIG_LIFT_VH = 0.04;

const GAP = 1.5;
const COL = CARD_W + GAP;
const ROW = CARD_H + GAP;

/** Card slot centres (u, relative to the plane centre), in landing order. */
const SIDE_A = 0.9; // side columns are staggered against the centre column by a tenth of a row
const SIDE_B = 0.1;
const SLOTS: { x: number; y: number }[] = [
  { x: 0, y: 0 }, // centre column, middle (the hero card)
  { x: -COL, y: -ROW * SIDE_A }, // left column, top
  { x: COL, y: -ROW * SIDE_B }, // right column, top
  { x: 0, y: -ROW }, // centre column, top
  { x: -COL, y: ROW * SIDE_B }, // left column, bottom
  { x: COL, y: ROW * SIDE_A }, // right column, bottom
  { x: 0, y: ROW }, // centre column, bottom
];

const EDGE = COL - CARD_W / 2; // inner edge of the side columns
/** Solid colour blocks tucked against card seams. x/y = top-left (u, from the plane centre); `after` = card index they follow. */
const BLOCKS: { x: number; y: number; w: number; h: number; color: string; over?: boolean; after: number }[] = [
  // above the left column, bleeding off the top-left corner
  { x: -EDGE - 15, y: -ROW * SIDE_A - CARD_H / 2 - GAP - 16, w: 15, h: 16, color: 'var(--sun)', after: 3 },
  // below the right column, bleeding off the bottom-right corner
  { x: EDGE, y: ROW * SIDE_A + CARD_H / 2 + GAP, w: 15, h: 16, color: 'var(--sun)', after: 6 },
  // under the left column, against the bottom-centre card
  { x: -EDGE - 13, y: ROW * SIDE_B + CARD_H / 2 + GAP, w: 13, h: 9, color: 'var(--bubblegum)', after: 6 },
  // above the right column, against the top-centre card
  { x: EDGE, y: -ROW * SIDE_B - CARD_H / 2 - GAP - 9, w: 13, h: 9, color: 'var(--acid)', after: 3 },
  // small tabs overlapping card corners at the seams
  { x: -EDGE - 0.5, y: -CARD_H / 2 - GAP - 2.2, w: 9, h: 4.4, color: 'var(--acid)', over: true, after: 3 },
  { x: EDGE + CARD_W - 20, y: CARD_H / 2 - 3.4, w: 9, h: 4.4, color: 'var(--bubblegum)', over: true, after: 5 },
];

const N = websites.length;
/* One timeline unit per card: appear → hold → fly to slot. */
const T_APPEAR = 0.2;
const T_FLY = 0.56;
const T_FLY_DUR = 0.36;
const T_TRAVEL = T_FLY_DUR * 0.78; // the flight itself; the rest of T_FLY_DUR is the settle
const T_LANDED = 0.9;
const TAIL = 0.5; // the finished spread holds before the pin releases
const TOTAL = N + TAIL;

const u = (n: number) => `calc(var(--u) * ${n})`;
const pad = (n: number) => String(n).padStart(2, '0');

/** matchMedia hook that is correct on the very first render (avoids building the pin on mobile). */
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

/**
 * Web Designs: each website recording takes centre stage — big and upright — is held there,
 * then flies to its own slot on a beige desk where all cards share one -28° tilt.
 */
export default function WebDesigns() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const landedRef = useRef(0);
  const shownRef = useRef(0);

  const isWide = useMatch('(min-width: 900px)');
  const reducedMotion = useMatch('(prefers-reduced-motion: reduce)');
  const desktop = isWide && !reducedMotion;

  /** Cards resting in their slot. */
  const [landed, setLanded] = useState(0);
  /** Cards that are visible at all (landed + the one centre stage / in flight). */
  const [shown, setShown] = useState(0);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setOpenIndex(null), []);
  // Hover only counts on cards that have landed, and never while another card is centre stage / in flight
  // (otherwise hovering the spread behind it would dim the featured card).
  const hov = hovered !== null && hovered < landed && shown === landed ? hovered : null;

  /* ── Scene ── */
  useIsomorphicLayoutEffect(() => {
    if (!desktop || !sectionRef.current || !stageRef.current) return;
    const stage = stageRef.current;

    const ctx = gsap.context(() => {
      const unit = () => Math.max((window.innerWidth * U_VW) / 100, (window.innerHeight * U_VH) / 100);
      const vw = () => stage.clientWidth || window.innerWidth;
      const vh = () => stage.clientHeight || window.innerHeight;
      /** Scale that takes a slot-sized card to its centre-stage size. */
      const bigScale = () =>
        Math.min((BIG_VW * vw()) / (CARD_W * unit()), (BIG_VH * vh()) / (CARD_H * unit()));
      /** Screen-space offset (from the stage centre) → plane-local offset (inverse of the plane tilt). */
      const toLocal = (dx: number, dy: number) => ({ x: dx * COS - dy * SIN, y: dx * SIN + dy * COS });
      /** Plane-local translation that puts card i's centre on the stage centre (+ optional screen-space drop). */
      const bigX = (i: number, drop = 0) => toLocal(0, (drop - BIG_LIFT_VH) * vh()).x - SLOTS[i].x * unit();
      const bigY = (i: number, drop = 0) => toLocal(0, (drop - BIG_LIFT_VH) * vh()).y - SLOTS[i].y * unit();

      const slots = gsap.utils.toArray<HTMLElement>('.web-slot');
      const caps = gsap.utils.toArray<HTMLElement>('.web-cap');
      const blocks = gsap.utils.toArray<HTMLElement>('.web-block');
      const scrim = stage.querySelector<HTMLElement>('.web-scrim');

      let preShown = false;
      let main: gsap.core.Timeline | null = null;

      const sync = () => {
        const t = main ? main.time() : 0;
        let nLanded: number;
        let nShown: number;
        if (t >= N) {
          nLanded = N;
          nShown = N;
        } else {
          const seg = Math.floor(t);
          const f = t - seg;
          nLanded = seg + (f >= T_LANDED ? 1 : 0);
          nShown = seg + (f > 0.03 ? 1 : 0);
        }
        if (preShown) nShown = Math.max(nShown, 1);
        if (nLanded !== landedRef.current) {
          landedRef.current = nLanded;
          setLanded(nLanded);
        }
        if (nShown !== shownRef.current) {
          shownRef.current = nShown;
          setShown(nShown);
        }
      };

      // Card 01 rises to centre stage while the stage scrolls into view, so the pin never opens on an empty desk.
      gsap.fromTo(
        slots[0].querySelector('.web-enter'),
        { opacity: 0, scale: 0.72, yPercent: 22 },
        {
          opacity: 1,
          scale: 1,
          yPercent: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: stage,
            start: 'top 80%',
            end: 'top top',
            scrub: 0.5,
            onUpdate: (self) => {
              preShown = self.progress > 0.25;
              sync();
            },
          },
        },
      );

      // …and its caption strip follows once the card is nearly in place (the strip container fades, not the caption).
      gsap.fromTo(
        '.web-caps',
        { opacity: 0 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: stage, start: 'top 30%', end: 'top 2%', scrub: 0.5 },
        },
      );

      // Pinned: one card per scroll step — centre stage, hold, fly to its slot.
      main = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: sync,
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: `+=${Math.round(TOTAL * 100)}%`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // A refresh (resize, reload with a restored scroll position) moves the playhead without an update event.
          onRefresh: () => sync(),
        },
      });
      const tl = main;

      slots.forEach((slot, i) => {
        const first = i === 0;
        const restShadow = slot.querySelector('.web-shadow');
        const bigShadow = slot.querySelector('.web-shadow-big');
        const label = slot.querySelector('.web-label');

        // Appear: centre screen, big, upright (counter-rotated against the plane). Card 01 is already there.
        tl.fromTo(
          slot,
          {
            x: () => bigX(i, first ? 0 : 0.07),
            y: () => bigY(i, first ? 0 : 0.07),
            rotation: -TILT,
            scale: () => bigScale() * (first ? 1 : 0.7),
            opacity: first ? 1 : 0,
          },
          {
            x: () => bigX(i),
            y: () => bigY(i),
            rotation: -TILT,
            scale: bigScale,
            opacity: 1,
            duration: T_APPEAR,
            ease: 'power3.out',
          },
          i,
        );
        tl.set(slot, { zIndex: 100 }, i);

        // Fly to the slot: shrink, take the shared tilt, settle with a small overshoot.
        tl.fromTo(
          slot,
          { x: () => bigX(i), y: () => bigY(i) },
          { x: 0, y: 0, duration: T_TRAVEL, ease: 'power2.inOut', immediateRender: false },
          i + T_FLY,
        );
        // …slightly past the slot size / tilt, then back: the overshoot.
        tl.fromTo(
          slot,
          { scale: bigScale, rotation: -TILT },
          { scale: 0.955, rotation: -2.2, duration: T_TRAVEL, ease: 'power2.inOut', immediateRender: false },
          i + T_FLY,
        );
        tl.fromTo(
          slot,
          { scale: 0.955, rotation: -2.2 },
          { scale: 1, rotation: 0, duration: T_FLY_DUR - T_TRAVEL, ease: 'sine.out', immediateRender: false },
          i + T_FLY + T_TRAVEL,
        );
        tl.fromTo(bigShadow, { opacity: 1 }, { opacity: 0, duration: T_FLY_DUR * 0.8, immediateRender: false }, i + T_FLY);
        tl.fromTo(restShadow, { opacity: 0 }, { opacity: 1, duration: T_FLY_DUR * 0.6 }, i + T_FLY + T_FLY_DUR * 0.4);
        tl.set(slot, { zIndex: i + 1 }, i + T_FLY + T_FLY_DUR);
        tl.fromTo(
          label,
          { scale: 0, rotation: -14 },
          { scale: 1, rotation: 0, duration: 0.1, ease: 'back.out(2.2)' },
          i + T_LANDED,
        );

        // Caption strip under the featured card.
        if (caps[i]) {
          tl.fromTo(
            caps[i],
            { opacity: first ? 1 : 0, y: first ? 0 : 14 },
            { opacity: 1, y: 0, duration: first ? 0.01 : 0.14, ease: 'power2.out' },
            i + (first ? 0 : 0.08),
          );
          tl.fromTo(
            caps[i],
            { opacity: 1, y: 0 },
            { opacity: 0, y: -10, duration: 0.1, ease: 'power2.in', immediateRender: false },
            i + T_FLY - 0.06,
          );
        }

        // Dim the already-placed cards while this one is the subject.
        if (scrim && !first) {
          tl.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: T_APPEAR, immediateRender: false }, i);
          tl.fromTo(scrim, { opacity: 1 }, { opacity: 0, duration: T_FLY_DUR * 0.8, immediateRender: false }, i + T_FLY);
        }
      });

      BLOCKS.forEach((b, i) => {
        if (!blocks[i]) return;
        tl.fromTo(blocks[i], { scale: 0 }, { scale: 1, duration: 0.1, ease: 'back.out(2)' }, b.after + T_LANDED);
      });

      // Hold the finished spread.
      tl.to({}, { duration: TAIL }, N);

      // The scene can be (re)built with the page already scrolled into or past the pin: bring the React state in line.
      sync();
      gsap.delayedCall(0.3, sync);
    }, sectionRef);

    return () => {
      ctx.revert();
      landedRef.current = 0;
      shownRef.current = 0;
      setLanded(0);
      setShown(0);
    };
  }, [desktop]);

  /* ── Is the stage on screen? ── */
  useEffect(() => {
    if (!desktop || !stageRef.current) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    io.observe(stageRef.current);
    return () => {
      io.disconnect();
      setInView(false);
    };
  }, [desktop]);

  /* ── Videos: only landed / featured cards, only while the stage is on screen ── */
  useEffect(() => {
    if (!desktop) return;
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      v.playbackRate = hov === i ? 2.5 : 1;
      if (inView && openIndex === null && i < shown) {
        if (v.paused) v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, [desktop, inView, shown, hov, openIndex]);

  return (
    <section ref={sectionRef} id="section-web" style={{ position: 'relative', zIndex: 'var(--z-content)' as any }}>
      <MarqueeDivider text="WEB DESIGN ✦✦✦ DEVELOPMENT ✦✦✦" />
      <ChapterCard chapterIndex={3} title="WEB DESIGN & DEVELOPMENT" />

      {desktop ? (
        <div className="web-desktop">
          {/* Stage: the desk. Crops the tilted plane. */}
          <div
            ref={stageRef}
            className="web-stage"
            style={{
              ['--u' as string]: `max(${U_VW}vw, ${U_VH}vh)`,
              ['--big-w' as string]: `min(${BIG_VW * 100}vw, ${(BIG_VH * 100 * CARD_W) / CARD_H}vh)`,
              ['--big-h' as string]: `min(${(BIG_VW * 100 * CARD_H) / CARD_W}vw, ${BIG_VH * 100}vh)`,
              position: 'relative',
              width: '100%',
              height: '100vh',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-web)',
              color: 'var(--ink)',
            }}
          >
            {/* Tilted table plane: a zero-size origin on the stage centre */}
            <div
              className="web-plane"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 0,
                height: 0,
                transform: `rotate(${TILT}deg)`,
              }}
            >
              {/* Accent blocks */}
              {BLOCKS.map((b, i) => (
                <span
                  key={i}
                  className="web-block"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: u(b.x),
                    top: u(b.y),
                    width: u(b.w),
                    height: u(b.h),
                    backgroundColor: b.color,
                    zIndex: b.over ? 20 : 0,
                    boxShadow: b.over ? '0 0.4vw 1.2vw rgba(40,28,10,0.22)' : 'none',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {/* Dims the placed cards while one is centre stage (sits under the featured card) */}
              <span
                className="web-scrim"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: u(-160),
                  top: u(-160),
                  width: u(320),
                  height: u(320),
                  backgroundColor: 'rgba(26,18,8,0.4)',
                  opacity: 0,
                  zIndex: 90,
                  pointerEvents: 'none',
                }}
              />

              {/* Cards */}
              {websites.map((s, i) => {
                const slot = SLOTS[i % SLOTS.length];
                const isShown = i < shown;
                const isHover = hov === i;
                const dim = hov !== null && !isHover;
                // Right-column cards bleed off the right edge: hang their sticker on the left so it stays readable.
                const labelLeft = slot.x > 0;
                return (
                  <div
                    key={s.slug}
                    className={`web-slot${isHover ? ' is-hover' : ''}`}
                    role="button"
                    tabIndex={isShown ? 0 : -1}
                    aria-hidden={isShown ? undefined : true}
                    aria-label={`Open the ${s.name} website recording`}
                    data-cursor="OPEN"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                    onClick={() => setOpenIndex(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenIndex(i);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: u(slot.x - CARD_W / 2),
                      top: u(slot.y - CARD_H / 2),
                      width: u(CARD_W),
                      zIndex: i + 1,
                      cursor: 'pointer',
                      outline: 'none',
                      pointerEvents: isShown ? 'auto' : 'none',
                      willChange: 'transform, opacity',
                    }}
                  >
                    <div className="web-enter">
                      <div
                        className="web-card-inner"
                        style={{
                          position: 'relative',
                          transform: isHover ? 'scale(1.04)' : 'scale(1)',
                          opacity: dim ? 0.6 : 1,
                          transition: 'transform 0.45s var(--ease-bounce), opacity 0.35s ease',
                        }}
                      >
                        {/* Resting shadow (fades in as the card lands) */}
                        <span
                          className="web-shadow"
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 6,
                            boxShadow: '-0.7vw 1.1vw 2vw rgba(40,28,10,0.3), -0.2vw 0.3vw 0.6vw rgba(40,28,10,0.22)',
                          }}
                        />
                        {/* Strong shadow while centre stage */}
                        <span
                          className="web-shadow-big"
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 6,
                            boxShadow: '0 1.6vw 3.4vw rgba(20,12,2,0.55), 0 0.3vw 0.8vw rgba(20,12,2,0.35)',
                          }}
                        />
                        {/* Deeper shadow while lifted */}
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 6,
                            boxShadow: '-1.6vw 2.6vw 4vw rgba(30,20,6,0.45)',
                            opacity: isHover ? 1 : 0,
                            transition: 'opacity 0.35s ease',
                          }}
                        />
                        <BrowserFrame
                          site={s}
                          source="card"
                          barHeight={u(BAR_H)}
                          videoRef={(el) => {
                            videoRefs.current[i] = el;
                          }}
                        />
                      </div>
                    </div>

                    {/* Label sticker */}
                    <div
                      className="web-label"
                      style={{
                        position: 'absolute',
                        left: labelLeft ? u(1.2) : undefined,
                        right: labelLeft ? undefined : u(1.2),
                        bottom: u(-1.1),
                        zIndex: 2,
                        transformOrigin: labelLeft ? '20% 50%' : '80% 50%',
                        pointerEvents: 'none',
                      }}
                    >
                      <span
                        className="sticker sticker--acid"
                        style={{
                          ['--sticker-rotate' as string]: i % 2 ? '3deg' : '-3deg',
                          fontSize: 'clamp(0.56rem, calc(var(--u) * 0.72), 0.85rem)',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          cursor: 'inherit',
                        }}
                      >
                        {s.name}
                        <span
                          style={{
                            backgroundColor: 'var(--ink)',
                            color: 'var(--acid)',
                            borderRadius: 4,
                            padding: '0.1em 0.5em',
                            marginLeft: '0.3em',
                            fontWeight: 400,
                          }}
                        >
                          {s.tech[0]}
                        </span>
                        {s.url && <span>LIVE ↗</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Caption strip: sits just below the centre-stage card, never over it */}
            <div
              className="web-caps"
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '50%',
                top: `calc(50% - ${BIG_LIFT_VH * 100}vh + var(--big-h) / 2 + clamp(10px, 1.8vh, 18px))`,
                width: 'var(--big-w)',
                marginLeft: 'calc(var(--big-w) / -2)',
                zIndex: 70,
                pointerEvents: 'none',
              }}
            >
              {websites.map((s, i) => (
                <div key={s.slug} className="web-cap" style={{ opacity: 0 }}>
                  <span className="web-cap-count">
                    {pad(i + 1)} / {pad(N)}
                  </span>
                  <span className="web-cap-name">{s.name}</span>
                  <span className="web-cap-client">{s.client}</span>
                  <span className="web-cap-hook">{s.hookLine}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <WebStack reducedMotion={reducedMotion} paused={openIndex !== null} onOpen={setOpenIndex} />
      )}

      {openIndex !== null && (
        <WebLightbox
          site={websites[openIndex]}
          index={openIndex}
          total={websites.length}
          reducedMotion={reducedMotion}
          onClose={closeLightbox}
        />
      )}

      <style>{`
        .web-slot:focus-visible .web-card-inner { outline: 3px solid var(--signal); outline-offset: 4px; }
        .web-slot.is-hover { z-index: 40 !important; }
        .web-cap {
          position: absolute; left: 0; top: 0; width: 100%;
          display: flex; align-items: center; gap: clamp(0.6rem, 1.2vw, 1.1rem);
          padding: clamp(0.35rem, 0.9vh, 0.6rem) clamp(0.7rem, 1.2vw, 1.1rem);
          background: var(--bg-web); color: var(--ink);
          border: 2px solid var(--ink); border-radius: 6px; box-shadow: 4px 4px 0 var(--ink);
          white-space: nowrap; will-change: transform, opacity;
        }
        .web-cap-count { font-family: var(--font-meta); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; color: var(--signal); flex: none; }
        .web-cap-name {
          font-family: var(--font-heading); font-weight: 900; font-stretch: 125%;
          font-size: clamp(0.95rem, 1.5vw, 1.6rem); line-height: 1; text-transform: uppercase; letter-spacing: -0.01em; flex: none;
        }
        .web-cap-client {
          font-family: var(--font-meta); font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 0.25em 0.6em; border: 1.5px solid var(--ink); border-radius: 4px; flex: none;
        }
        .web-cap-hook {
          font-family: var(--font-handwritten); font-size: clamp(1.05rem, 1.6vw, 1.75rem); line-height: 1; color: var(--signal);
          flex: 1; min-width: 0; text-align: right; overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>
    </section>
  );
}
