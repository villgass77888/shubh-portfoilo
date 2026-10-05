import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { logos } from '../../data/portfolio';
import type { LogoEntry } from '../../data/portfolio';
import ChapterCard from '../global/ChapterCard';
import { MarqueeDivider } from '../global/Marquee';

gsap.registerPlugin(ScrollTrigger);

// ── Helpers ──

/** Largest share of the (square) cell the logo artwork may occupy, in %. */
const MAX_W = 72;
const MAX_H = 46;
/** Very wide wordmarks get more width, otherwise they end up tiny next to the stacked marks. */
const WIDE_RATIO = 4.5;
const MAX_W_WIDE = 84;

/** Same paper tone the page backdrop uses for this section. */
const SHEET = '#ECE8DF';
const INK_ON_LIGHT = '#0D0D0D';
const BONE_ON_DARK = '#F4F1EA';

/** Relative luminance of a #RRGGBB colour (0 = black, 1 = white). */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channel = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** Box (in % of the cell) that contains artwork of the given aspect ratio. */
function logoBox(ratio: number): CSSProperties {
  const maxW = ratio >= WIDE_RATIO ? MAX_W_WIDE : MAX_W;
  const fitsWidth = ratio >= maxW / MAX_H;
  const w = fitsWidth ? maxW : MAX_H * ratio;
  const h = fitsWidth ? maxW / ratio : MAX_H;
  return {
    position: 'absolute',
    left: `${(100 - w) / 2}%`,
    top: `${(100 - h) / 2}%`,
    width: `${w}%`,
    height: `${h}%`,
  };
}

/**
 * Positions a full image so that only its visible artwork (`crop`, as
 * fractions of the file) fills the parent box. Used identically by the ink
 * silhouette and the true-colour image so they register perfectly.
 */
function artLayer(crop: LogoEntry['crop']): CSSProperties {
  const [x, y, w, h] = crop ?? [0, 0, 1, 1];
  return {
    position: 'absolute',
    left: `${(-x / w) * 100}%`,
    top: `${(-y / h) * 100}%`,
    width: `${100 / w}%`,
    height: `${100 / h}%`,
    maxWidth: 'none',
  };
}

/** Sets the flood origin on a cell's backdrop without animating the move. */
function setFloodOrigin(cell: HTMLElement, clientX?: number, clientY?: number) {
  const flood = cell.querySelector<HTMLElement>('.logo-flood');
  if (!flood) return;
  let ox = 50;
  let oy = 50;
  if (clientX !== undefined && clientY !== undefined) {
    const r = cell.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      ox = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
      oy = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    }
  }
  flood.style.transition = 'none';
  flood.style.setProperty('--ox', `${ox}%`);
  flood.style.setProperty('--oy', `${oy}%`);
  void flood.offsetWidth; // commit the new origin before the radius animates
  flood.style.transition = '';
}

const HANDLES: CSSProperties[] = [
  { top: -4, left: -4 },
  { top: -4, right: -4 },
  { bottom: -4, left: -4 },
  { bottom: -4, right: -4 },
];

/**
 * Logos Section — Swiss specimen grid of 11 logos + CTA cell.
 * At rest every mark is a uniform ink silhouette; on hover / focus / tap the
 * cell floods from the pointer and the real full-colour logo is revealed.
 */
export default function Logos() {
  const sectionRef = useRef<HTMLElement>(null);
  const lastPointerDown = useRef(0);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!sectionRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.logo-grid',
          start: 'top 82%',
          once: true,
        },
      });

      // 1. The sheet is ruled: horizontals from the left, then verticals from the top.
      tl.from('.logo-line-h', {
        scaleX: 0,
        transformOrigin: 'left center',
        stagger: 0.035,
        duration: 0.6,
        ease: 'power2.out',
      });
      tl.from(
        '.logo-line-v',
        {
          scaleY: 0,
          transformOrigin: 'center top',
          stagger: 0.035,
          duration: 0.6,
          ease: 'power2.out',
        },
        0.25,
      );

      // 2. Marks stamp into their cells in a diagonal wave.
      tl.from(
        '.logo-stamp',
        {
          scale: 1.6,
          opacity: 0,
          rotate: () => gsap.utils.random(-10, 10),
          filter: 'blur(6px)',
          stagger: { amount: 0.8, grid: 'auto', from: 'start' },
          duration: 0.5,
          ease: 'power3.out',
          clearProps: 'transform,opacity,filter',
        },
        0.55,
      );

      // 3. Tags and names follow each mark.
      tl.from(
        '.logo-label',
        {
          opacity: 0,
          stagger: { amount: 0.8 },
          duration: 0.3,
          ease: 'none',
          clearProps: 'opacity',
        },
        0.85,
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Tap / click outside the grid cells clears the revealed state (touch devices).
  useEffect(() => {
    if (activeIdx === null) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest?.('.logo-cell--mark')) setActiveIdx(null);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [activeIdx]);

  const onEnter = useCallback((e: ReactPointerEvent<HTMLDivElement>, i: number) => {
    if (e.pointerType !== 'mouse') return;
    setFloodOrigin(e.currentTarget, e.clientX, e.clientY);
    setActiveIdx(i);
  }, []);

  const onLeave = useCallback((e: ReactPointerEvent<HTMLDivElement>, i: number) => {
    if (e.pointerType !== 'mouse') return;
    // Retract toward the point the cursor left from.
    setFloodOrigin(e.currentTarget, e.clientX, e.clientY);
    setActiveIdx((cur) => (cur === i ? null : cur));
  }, []);

  const onDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, i: number) => {
      lastPointerDown.current = performance.now();
      if (activeIdx === i) return;
      // Touch / pen: first tap floods from the tap point.
      setFloodOrigin(e.currentTarget, e.clientX, e.clientY);
      setActiveIdx(i);
    },
    [activeIdx],
  );

  const onFocus = useCallback((cell: HTMLDivElement, i: number) => {
    // Focus caused by a pointer press is already handled by onDown.
    if (performance.now() - lastPointerDown.current < 600) return;
    setFloodOrigin(cell);
    setActiveIdx(i);
  }, []);

  const onBlur = useCallback((i: number) => {
    setActiveIdx((cur) => (cur === i ? null : cur));
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, i: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeIdx !== i) setFloodOrigin(e.currentTarget);
        setActiveIdx(activeIdx === i ? null : i);
      } else if (e.key === 'Escape') {
        setActiveIdx(null);
      }
    },
    [activeIdx],
  );

  const goToContact = () => {
    document.getElementById('section-outro')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      id="section-logos"
      style={{
        position: 'relative',
        zIndex: 'var(--z-content)' as any,
        // The fixed page backdrop turns navy as soon as the Branding section nears the
        // viewport, which made the ink marks in the last rows disappear. The grid keeps
        // its own paper sheet, feathered into whatever backdrop is behind it.
        background: `linear-gradient(to bottom, transparent 0, ${SHEET} 7rem, ${SHEET} calc(100% - 4.5rem), transparent 100%)`,
      }}
    >
      <MarqueeDivider text="LOGOS & MARKS ✦✦✦ LOGOS & MARKS ✦✦✦" />
      <ChapterCard chapterIndex={1} title="LOGOS & MARKS" />

      <div className="logo-wrap" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '1rem', fontStyle: 'italic' }}>
            Marks that outlive trends.
          </p>
          <span style={{ fontFamily: 'var(--font-meta)', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--signal)' }}>
            {logos.length} MARKS ✦ 2020–2026
          </span>
        </div>

        {/* Grid: outer top/left rules live on the grid, each cell rules its own right/bottom edge */}
        <div className="logo-grid">
          <i className="logo-line-h logo-line--top" aria-hidden="true" />
          <i className="logo-line-v logo-line--left" aria-hidden="true" />

          {logos.map((logo, i) => {
            const active = activeIdx === i;
            const fg = luminance(logo.hoverBg) > 0.4 ? INK_ON_LIGHT : BONE_ON_DARK;
            const chips = [logo.color, ...(logo.palette ?? [])];
            const layer = artLayer(logo.crop);
            // Idle silhouette: a dedicated single-colour file when one exists (its own box and bounds)
            const idleMask = logo.idleSrc ?? logo.src;
            const idleLayer = logo.idleSrc ? artLayer(logo.idleCrop) : layer;
            const ink = (
              <div
                className={`logo-ink${logo.solid && !logo.idleSrc ? ' logo-ink--luma' : ''}`}
                aria-hidden="true"
                style={{
                  ...idleLayer,
                  backgroundColor: 'var(--ink)',
                  maskImage: `url("${idleMask}")`,
                  WebkitMaskImage: `url("${idleMask}")`,
                  maskSize: '100% 100%',
                  WebkitMaskSize: '100% 100%',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                }}
              />
            );

            return (
              <div
                key={logo.slug}
                className={`logo-cell logo-cell--mark${active ? ' is-active' : ''}`}
                /* no data-cursor here: the 110px cursor label would cover the logo being revealed */
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={`${logo.name} logo, ${logo.tag.toLowerCase()}. Show in full colour.`}
                onPointerEnter={(e) => onEnter(e, i)}
                onPointerLeave={(e) => onLeave(e, i)}
                onPointerDown={(e) => onDown(e, i)}
                onFocus={(e) => onFocus(e.currentTarget, i)}
                onBlur={() => onBlur(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                style={{ '--logo-fg': fg } as CSSProperties}
              >
                {/* Backdrop flood (circular clip from the pointer) */}
                <div className="logo-flood" aria-hidden="true" style={{ backgroundColor: logo.hoverBg }} />

                <div className="logo-stamp">
                  {/* A dedicated idle file sits in its own box, sized from its own artwork */}
                  {logo.idleSrc && <div style={logoBox(logo.idleRatio ?? logo.ratio)}>{ink}</div>}

                  {/* Logo: ink silhouette + true-colour image, same box */}
                  <div style={logoBox(logo.ratio)}>
                    {/* Opaque files (white art on a black plate) are masked by luminance instead of alpha */}
                    {!logo.idleSrc && ink}
                    <img
                      className={`logo-true${logo.solid ? ' logo-true--solid' : ''}`}
                      src={logo.src}
                      alt={`${logo.name} logo`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      style={{ ...layer, objectFit: 'contain' }}
                    />

                    {/* Selection box with handles */}
                    <div className="logo-select" aria-hidden="true">
                      {HANDLES.map((pos, hi) => (
                        <span
                          key={hi}
                          className="logo-handle"
                          style={{ ...pos, transitionDelay: active ? `${0.08 + hi * 0.03}s` : '0s' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Type tag */}
                <span className="logo-label logo-tag">{logo.tag}</span>

                {/* Brand name + colour / typeface tag */}
                <div className="logo-foot">
                  <span className="logo-label logo-name">{logo.name}</span>
                  <span className="logo-meta" aria-hidden={!active}>
                    {chips.map((c) => (
                      <span key={c} className="logo-chip" style={{ backgroundColor: c }} title={c} />
                    ))}
                    <span>{logo.typeface || 'Custom'}</span>
                  </span>
                </div>

                <i className="logo-line-h logo-line--bottom" aria-hidden="true" />
                <i className="logo-line-v logo-line--right" aria-hidden="true" />
              </div>
            );
          })}

          {/* CTA Cell */}
          <a
            className="logo-cell logo-cell--cta"
            href="#section-outro"
            data-cursor="TALK"
            aria-label="Your brand next — get in touch"
            onClick={(e) => {
              e.preventDefault();
              goToContact();
            }}
          >
            <div className="logo-stamp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span
                className="logo-cta-text"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
                  textAlign: 'center',
                  lineHeight: 1.1,
                }}
              >
                YOUR<br />BRAND<br />NEXT ✦
              </span>
            </div>
            <i className="logo-line-h logo-line--bottom" aria-hidden="true" />
            <i className="logo-line-v logo-line--right" aria-hidden="true" />
          </a>
        </div>
      </div>

      <style>{`
        .logo-wrap { padding: 4rem 2rem 6rem; }

        .logo-grid {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        /* ── Hairlines (correct at every breakpoint: each cell rules its own edges) ── */
        .logo-line-h, .logo-line-v {
          position: absolute;
          display: block;
          background-color: var(--ink);
          pointer-events: none;
          z-index: 3;
        }
        .logo-line-h { left: 0; right: 0; height: 1px; }
        .logo-line-v { top: 0; bottom: 0; width: 1px; }
        .logo-line--top { top: 0; }
        .logo-line--left { left: 0; }
        .logo-line--bottom { bottom: 0; }
        .logo-line--right { right: 0; }

        /* ── Cells ── */
        .logo-cell {
          position: relative;
          display: block;
          aspect-ratio: 1;
          cursor: pointer;
          color: var(--ink);
          text-decoration: none;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .logo-cell:focus-visible { outline: 2px solid var(--signal); outline-offset: -5px; }

        .logo-flood {
          position: absolute;
          inset: 0;
          z-index: 0;
          --ox: 50%;
          --oy: 50%;
          clip-path: circle(0% at var(--ox) var(--oy));
          transition: clip-path 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .logo-cell.is-active .logo-flood { clip-path: circle(150% at var(--ox) var(--oy)); }

        .logo-stamp { position: absolute; inset: 0; z-index: 1; }

        .logo-ink { transition: opacity 0.3s ease; }
        .logo-true { opacity: 0; transition: opacity 0.3s ease; display: block; }
        /* Opaque artwork: without luminance masks the image itself stays visible at rest */
        .logo-ink--luma { display: none; }
        .logo-true--solid { opacity: 1; }
        @supports (mask-mode: luminance) {
          .logo-ink--luma { display: block; mask-mode: luminance; }
          .logo-true--solid { opacity: 0; }
        }
        .logo-cell.is-active .logo-ink { opacity: 0; }
        .logo-cell.is-active .logo-true { opacity: 1; }

        .logo-select {
          position: absolute;
          inset: -12px;
          border: 1.5px solid var(--signal);
          opacity: 0;
          transform: scale(1.08);
          transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }
        .logo-cell.is-active .logo-select { opacity: 1; transform: scale(1); }
        .logo-handle {
          position: absolute;
          width: 7px;
          height: 7px;
          background-color: var(--signal);
          transform: scale(0);
          transition: transform 0.2s ease;
        }
        .logo-cell.is-active .logo-handle { transform: scale(1); }

        .logo-tag, .logo-foot {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 2;
          text-align: center;
          font-family: var(--font-meta);
          pointer-events: none;
        }
        .logo-tag {
          top: 0.85rem;
          font-size: 0.58rem;
          letter-spacing: 0.12em;
          color: color-mix(in srgb, var(--ink) 65%, transparent);
          transition: color 0.3s ease;
        }
        .logo-foot { bottom: 0.85rem; height: 1rem; }
        .logo-name, .logo-meta {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          line-height: 1rem;
          white-space: nowrap;
        }
        .logo-name {
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink);
          transition: color 0.3s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .logo-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          font-size: 0.55rem;
          letter-spacing: 0.06em;
          color: var(--logo-fg);
          opacity: 0;
          transform: translateY(0.9rem);
          transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .logo-chip {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex: none;
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--logo-fg) 45%, transparent);
        }
        .logo-cell.is-active .logo-tag { color: color-mix(in srgb, var(--logo-fg) 70%, transparent); }
        .logo-cell.is-active .logo-name { color: var(--logo-fg); transform: translateY(-1.25rem); }
        .logo-cell.is-active .logo-meta { opacity: 1; transform: translateY(0); }

        /* ── CTA cell ── */
        .logo-cell--cta { transition: background-color 0.3s ease; }
        .logo-cta-text { color: var(--signal); transition: color 0.3s ease; }
        .logo-cell--cta:hover, .logo-cell--cta:focus-visible { background-color: var(--signal); }
        .logo-cell--cta:hover .logo-cta-text,
        .logo-cell--cta:focus-visible .logo-cta-text { color: var(--bone); }
        .logo-cell--cta:focus-visible { outline-color: var(--ink); }

        @media (max-width: 900px) {
          .logo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 520px) {
          .logo-wrap { padding: 3rem 1rem 4rem; }
          .logo-grid { grid-template-columns: minmax(0, 1fr); }
          .logo-tag { font-size: 0.65rem; top: 1rem; }
          .logo-name { font-size: 0.7rem; }
          .logo-meta { font-size: 0.62rem; }
          .logo-foot { bottom: 1rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-flood, .logo-ink, .logo-true, .logo-select, .logo-handle,
          .logo-name, .logo-meta, .logo-tag { transition-duration: 0.01ms !important; transition-delay: 0s !important; }
        }
      `}</style>
    </section>
  );
}
