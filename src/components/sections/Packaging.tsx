import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { packaging } from '../../data/portfolio';
import type { PackagingTile } from '../../data/portfolio';
import ChapterCard from '../global/ChapterCard';
import { MarqueeDivider } from '../global/Marquee';

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────── */
/* Types + helpers                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

type LightboxImage = {
  src: string;
  alt: string;
  label: string;
  /** Flat artwork (dieline / label) — shown on a white sheet. */
  flat?: boolean;
};

type LightboxState = {
  title: string;
  subtitle: string;
  images: LightboxImage[];
};

/**
 * Tiles whose photo is a product (or flat artwork) centred on a plain
 * background in a tile of a different aspect ratio: a hard `cover` crop would
 * cut the product, so these are shown whole (contain). `bg` continues the
 * photo's own studio backdrop across the rest of the tile and `position`
 * keeps the product clear of the caption.
 */
const CONTAIN_TILES: Record<string, { flat: boolean; bg: string; position?: string }> = {
  // square pouch render (backdrop #f4f4f4 → #efefef) in a 2x1 tile
  milletopia: { flat: false, bg: 'linear-gradient(to right, #f4f4f4 45%, #efefef 85%)', position: '88% 50%' },
  // the carton dieline itself, in a 2x1 tile
  'arban-beauty': { flat: true, bg: '#fff' },
  'profoods-makhana-2': { flat: true, bg: '#fff' },
};

/** Paper tone of this section (same as the page backdrop for the packaging chapter). */
const SHEET = '#F0E6CC';

/**
 * Mirrors CSS `grid-auto-flow: dense` placement to find how many cells are
 * left empty at the end of the last row, so a note tile can close the grid.
 */
function trailingGap(tiles: PackagingTile[], cols: number): number {
  const rows: boolean[][] = [];
  const cell = (r: number, c: number) => {
    while (rows.length <= r) rows.push(new Array<boolean>(cols).fill(false));
    return rows[r][c];
  };
  for (const t of tiles) {
    const w = Math.min(t.size === '2x1' ? 2 : 1, cols);
    const h = t.size === '1x2' ? 2 : 1;
    let placed = false;
    for (let r = 0; !placed; r++) {
      for (let c = 0; c + w <= cols && !placed; c++) {
        let free = true;
        for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) if (cell(r + dr, c + dc)) free = false;
        if (free) {
          for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) rows[r + dr][c + dc] = true;
          placed = true;
        }
      }
    }
  }
  const last = rows[rows.length - 1];
  if (!last) return 0;
  let gap = 0;
  for (let c = cols - 1; c >= 0 && !last[c]; c--) gap++;
  return gap;
}

const metaStyle: CSSProperties = {
  fontFamily: 'var(--font-meta)',
  fontSize: '0.62rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Lightbox                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function Lightbox({ data, onClose }: { data: LightboxState; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        // Single focusable control: keep focus inside the dialog.
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${data.title} — ${data.subtitle}`}
      data-lenis-prevent
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-lightbox)',
        backgroundColor: 'rgba(8,8,8,0.94)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        cursor: 'zoom-out',
        color: '#F4F1EA',
        animation: 'pkgLightboxIn 0.3s ease-out both',
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 2,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '2px solid #F4F1EA',
          background: '#0D0D0D',
          color: '#F4F1EA',
          fontFamily: 'var(--font-meta)',
          fontSize: '1rem',
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>

      <div
        style={{
          minHeight: '100%',
          maxWidth: 1400,
          margin: '0 auto',
          padding: 'clamp(4rem, 8vh, 5rem) clamp(1rem, 4vw, 3rem) 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1.5rem',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 4vw, 3rem)',
              lineHeight: 0.95,
              textTransform: 'uppercase',
            }}
          >
            {data.title}
          </div>
          <div style={{ ...metaStyle, opacity: 0.7, marginTop: '0.5rem' }}>{data.subtitle}</div>
        </div>

        <div className="pkg-lb-images">
          {data.images.map((img) => (
            <figure
              key={img.src}
              onClick={(e) => e.stopPropagation()}
              style={{ margin: 0, cursor: 'auto', flex: img.flat ? '1.4 1 0' : '1 1 0', minWidth: 0 }}
            >
              <div
                style={{
                  backgroundColor: img.flat ? '#fff' : 'transparent',
                  padding: img.flat ? 'clamp(0.5rem, 1.5vw, 1.25rem)' : 0,
                  borderRadius: 6,
                  minHeight: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  decoding="async"
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: '76vh',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: img.flat ? 0 : 6,
                  }}
                />
              </div>
              <figcaption style={{ ...metaStyle, opacity: 0.6, marginTop: '0.6rem' }}>{img.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Grid tile                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function Tile({ tile, index, onOpen }: { tile: PackagingTile; index: number; onOpen: (t: PackagingTile) => void }) {
  const alt = tile.dieline ?? tile.hoverImage;
  // The flat artwork can be very large — only fetch it once the tile is hovered/focused.
  const [armed, setArmed] = useState(false);
  const arm = () => setArmed(true);
  const contain = CONTAIN_TILES[tile.slug];
  const tapeLeft = index % 2 === 1;

  return (
    <div className="pkg-tile" data-size={tile.size}>
      <button
        type="button"
        className="pkg-tile-inner"
        data-cursor="VIEW"
        aria-label={`${tile.brand} — ${tile.product}. Open larger view`}
        onClick={() => onOpen(tile)}
        onPointerEnter={arm}
        onFocus={arm}
      >
        <span className="pkg-tile-media" style={{ background: contain ? contain.bg : '#d9cfb6' }}>
          <img
            src={tile.mockup}
            alt={`${tile.brand} packaging — ${tile.product}`}
            loading="lazy"
            decoding="async"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: contain ? 'contain' : 'cover',
              objectPosition: contain?.position,
              padding: contain?.flat ? '0.5rem 0.5rem 2.75rem' : 0,
              // feather the photo's side edges into the tile backdrop
              maskImage: contain && !contain.flat ? 'linear-gradient(to right, transparent 45.5%, #000 52%)' : undefined,
              WebkitMaskImage: contain && !contain.flat ? 'linear-gradient(to right, transparent 45.5%, #000 52%)' : undefined,
            }}
          />
          {alt && armed && (
            <span className="pkg-tile-alt" aria-hidden="true">
              <img
                src={alt}
                alt=""
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </span>
          )}
          {alt && (
            <span className="pkg-tile-flag" aria-hidden="true">
              FLAT ARTWORK ↺
            </span>
          )}
        </span>

        <span className="pkg-tile-caption">
          <span className="pkg-tile-brand">{tile.brand}</span>
          <span className="pkg-tile-product">{tile.product}</span>
        </span>

        <span
          className="tape"
          aria-hidden="true"
          style={
            {
              top: -7,
              [tapeLeft ? 'left' : 'right']: -14,
              '--tape-rotate': tapeLeft ? '-38deg' : '38deg',
              width: 56,
              height: 18,
              pointerEvents: 'none',
            } as CSSProperties
          }
        />
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Section                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Packaging Section — featured project (dieline / brand intro / mockup, then
 * the use case), followed by a relaxed asymmetric grid of more packaging.
 */
export default function Packaging() {
  const sectionRef = useRef<HTMLElement>(null);
  const feat = packaging.featured;
  const reduced = useReducedMotion();
  const flatName = feat.flatName ?? 'Dieline';
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const gapDesktop = trailingGap(packaging.more, 4);
  const gapMobile = trailingGap(packaging.more, 2);

  const openTile = useCallback((tile: PackagingTile) => {
    const flatMain = CONTAIN_TILES[tile.slug]?.flat ?? false;
    const images: LightboxImage[] = [
      {
        src: tile.mockup,
        alt: `${tile.brand} packaging — ${tile.product}`,
        label: flatMain ? 'Dieline' : 'Mockup',
        flat: flatMain,
      },
    ];
    const flat = tile.dieline ?? tile.hoverImage;
    if (flat) {
      images.push({
        src: flat,
        alt: `${tile.brand} flat artwork`,
        label: tile.dieline ? 'Dieline' : 'Flat label artwork',
        flat: true,
      });
    }
    setLightbox({ title: tile.brand, subtitle: tile.product, images });
  }, []);

  const openFeatured = (which: 'dieline' | 'mockup' | 'usecase') => {
    const map: Record<typeof which, LightboxImage> = {
      dieline: { src: feat.dieline, alt: `${feat.brand} ${flatName.toLowerCase()}, flat artwork`, label: flatName, flat: true },
      mockup: { src: feat.mockup, alt: `${feat.brand} packaging mockup`, label: 'Mockup' },
      usecase: { src: feat.usecase, alt: `${feat.brand} in use`, label: 'Use case' },
    };
    setLightbox({ title: feat.brand, subtitle: `${feat.product} ✦ ${feat.client} ✦ ${feat.year}`, images: [map[which]] });
  };

  useIsomorphicLayoutEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    // Reduced motion: everything stays in its static resting state.
    if (reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const desktop = window.matchMedia('(min-width: 901px)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let removeTilt: (() => void) | undefined;

    const ctx = gsap.context(() => {
      // 1. Brand intro
      gsap.from('.pkg-intro', {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.pkg-cell-intro', start: 'top 82%', once: true },
      });
      gsap.from('.pkg-chip', {
        scale: 0,
        stagger: 0.08,
        duration: 0.5,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: '.pkg-chips', start: 'top 90%', once: true },
      });
      gsap.from('.pkg-connector-line', {
        scaleX: 0,
        duration: 1,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: '.pkg-connector', start: 'top 92%', once: true },
      });

      // 2. Dieline from the left (-8° → -3°) + plotter scan line / clip reveal
      gsap
        .timeline({
          delay: desktop ? 0.25 : 0,
          scrollTrigger: { trigger: '.pkg-cell-dieline', start: 'top 82%', once: true },
        })
        .from('.pkg-dieline-enter', { x: -160, rotation: -5, opacity: 0, duration: 1.1, ease: 'expo.out' }, 0)
        .fromTo(
          '.pkg-dieline-reveal',
          { clipPath: 'inset(0% 100% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power2.inOut', immediateRender: true },
          0.3,
        )
        .fromTo(
          '.pkg-scan',
          { xPercent: -100, opacity: 1 },
          { xPercent: 0, duration: 1.3, ease: 'power2.inOut', immediateRender: true },
          0.3,
        )
        .to('.pkg-scan', { opacity: 0, duration: 0.3 });

      // 3. Mockup from the right (+10° → +2°)
      gsap.from('.pkg-mockup-enter', {
        x: 160,
        rotation: 8,
        opacity: 0,
        duration: 1.1,
        delay: desktop ? 0.45 : 0,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.pkg-cell-mockup', start: 'top 82%', once: true },
      });

      // 4. Use case: curtain open + slow Ken Burns
      gsap.fromTo(
        '.pkg-usecase-curtain',
        { clipPath: 'inset(0% 50% 0% 50%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.2,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: '.pkg-cell-usecase', start: 'top 78%', once: true },
        },
      );
      gsap.fromTo(
        '.pkg-usecase-img',
        { scale: 1.14 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.pkg-cell-usecase', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
      gsap.from('.pkg-usecase-text > *', {
        opacity: 0,
        y: 30,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.pkg-usecase-text', start: 'top 85%', once: true },
      });

      // 5. More packaging — soft entrances only
      const tiles = gsap.utils.toArray<HTMLElement>('.pkg-tile');
      gsap.set(tiles, { opacity: 0, y: 40 });
      ScrollTrigger.batch(tiles, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08, overwrite: true }),
      });

      // Mockup turntable feel: rotateY tied to mouse X
      const tilt = root.querySelector<HTMLElement>('.pkg-mockup-tilt');
      const stage = root.querySelector<HTMLElement>('.pkg-featured');
      if (canHover && tilt && stage) {
        gsap.set(tilt, { transformPerspective: 900 });
        const rotY = gsap.quickTo(tilt, 'rotationY', { duration: 0.7, ease: 'power3.out' });
        const onMove = (e: MouseEvent) => rotY((e.clientX / window.innerWidth - 0.5) * 24);
        const onLeave = () => rotY(0);
        stage.addEventListener('mousemove', onMove);
        stage.addEventListener('mouseleave', onLeave);
        removeTilt = () => {
          stage.removeEventListener('mousemove', onMove);
          stage.removeEventListener('mouseleave', onLeave);
        };
      }
    }, sectionRef);

    return () => {
      removeTilt?.();
      ctx.revert();
    };
  }, [reduced]);

  const phases: Array<[string, string]> = [
    ['Brief', feat.briefText],
    ['Concept', feat.conceptText],
    [flatName, feat.dielineText],
    ['On shelf', feat.onShelfText],
  ];

  const plainButton: CSSProperties = {
    display: 'block',
    width: '100%',
    padding: 0,
    border: 0,
    background: 'none',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'inherit',
    cursor: 'pointer',
  };

  return (
    <section
      ref={sectionRef}
      id="section-packaging"
      style={{
        position: 'relative',
        zIndex: 'var(--z-content)',
        color: 'var(--ink)',
        overflowX: 'clip',
        // Own paper sheet: the fixed page backdrop can already be the Outro's black while
        // this section is on screen, which made every ink label here unreadable.
        background: `linear-gradient(to bottom, ${SHEET} calc(100% - 4rem), transparent 100%)`,
      }}
    >
      <MarqueeDivider text="PACKAGING ✦✦✦ DIELINE TO SHELF ✦✦✦" />
      <ChapterCard chapterIndex={5} title="PACKAGING DESIGN" />

      {/* ── Featured project ── */}
      <div className="pkg-featured">
        {/* Dieline (left) */}
        <div className="pkg-cell-dieline">
          <div className="pkg-dieline-enter">
            <div style={{ position: 'relative', transform: 'rotate(-3deg)' }}>
              <button
                type="button"
                data-cursor="MEASURE"
                aria-label={`${feat.brand} ${flatName.toLowerCase()}. Open larger view`}
                onClick={() => openFeatured('dieline')}
                className="pkg-lift"
                style={plainButton}
              >
                <span
                  style={{
                    display: 'block',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    borderRadius: 3,
                    padding: '0.6rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                  }}
                >
                  <span className="pkg-dieline-reveal" style={{ display: 'block', aspectRatio: feat.flatAspect ?? '5 / 4' }}>
                    <img
                      src={feat.dieline}
                      alt={`${feat.brand} ${flatName.toLowerCase()} laid flat`}
                      loading="lazy"
                      decoding="async"
                      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </span>
                  {/* Plotter scan line (only visible while the entrance plays) */}
                  <span
                    className="pkg-scan"
                    aria-hidden="true"
                    style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: 0,
                        width: 70,
                        background: 'linear-gradient(to left, rgba(255,43,28,0.28), rgba(255,43,28,0))',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: 0,
                        width: 2,
                        backgroundColor: 'var(--signal)',
                        boxShadow: '0 0 12px var(--signal)',
                      }}
                    />
                  </span>
                </span>
              </button>
              <div
                className="tape"
                aria-hidden="true"
                style={{ top: -10, left: -18, '--tape-rotate': '-32deg', pointerEvents: 'none' } as CSSProperties}
              />
              <div
                className="tape"
                aria-hidden="true"
                style={{ bottom: -10, right: -18, '--tape-rotate': '-28deg', pointerEvents: 'none' } as CSSProperties}
              />
            </div>
            <div style={{ ...metaStyle, opacity: 0.55, marginTop: '1.5rem' }}>01 — {flatName}, flat</div>
          </div>
        </div>

        {/* Brand intro (centre) */}
        <div className="pkg-cell-intro">
          <div className="pkg-intro" style={{ ...metaStyle, opacity: 0.6, marginBottom: '0.75rem' }}>
            Featured project
          </div>
          <h3
            className="pkg-intro"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 4.2vw, 3.6rem)',
              lineHeight: 0.92,
              textTransform: 'uppercase',
              margin: '0 0 1.5rem',
            }}
          >
            {feat.brand}
          </h3>

          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {phases.map(([label, text], i) => (
              <li
                key={label}
                className="pkg-intro"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6rem 1fr',
                  gap: '0.5rem',
                  padding: '0.7rem 0',
                  borderTop: '1px solid rgba(13,13,13,0.18)',
                }}
              >
                <span style={{ ...metaStyle, color: 'var(--signal)', paddingTop: '0.15rem' }}>0{i + 1}</span>
                <span>
                  <span style={{ ...metaStyle, display: 'block', fontWeight: 700, marginBottom: '0.25rem' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.86rem', lineHeight: 1.55, display: 'block' }}>
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="pkg-chips pkg-intro" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {feat.colors.map((c) => (
              <span
                key={c}
                className="pkg-chip"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', ...metaStyle, fontSize: '0.55rem' }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    backgroundColor: c,
                    border: '1px solid rgba(13,13,13,0.35)',
                    display: 'inline-block',
                  }}
                />
                {c}
              </span>
            ))}
          </div>

          <div className="pkg-intro" style={{ ...metaStyle, opacity: 0.65, marginTop: '1rem' }}>
            {feat.product} ✦ {feat.client} ✦ {feat.year}
          </div>

          <div className="pkg-connector" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.75rem' }}>
            <span
              className="pkg-connector-line"
              aria-hidden="true"
              style={{ flex: 1, height: 1, backgroundColor: 'var(--ink)', opacity: 0.45, transformOrigin: 'left center' }}
            />
            <span style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.35rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
              {flatName === 'Label' ? 'wraps around →' : 'folds into →'}
            </span>
          </div>
        </div>

        {/* Mockup (right) */}
        <div className="pkg-cell-mockup">
          <div className="pkg-mockup-enter">
            <div style={{ transform: 'rotate(2deg)' }}>
              <div className="pkg-mockup-tilt">
                <button
                  type="button"
                  data-cursor="SPIN"
                  aria-label={`${feat.brand} mockup. Open larger view`}
                  onClick={() => openFeatured('mockup')}
                  style={{
                    ...plainButton,
                    aspectRatio: '2 / 3',
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: '#e9e9ea',
                    boxShadow: '0 18px 50px rgba(0,0,0,0.28)',
                  }}
                >
                  <img
                    src={feat.mockup}
                    alt={`${feat.brand} packaging mockup`}
                    loading="lazy"
                    decoding="async"
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              </div>
            </div>
            <div style={{ ...metaStyle, opacity: 0.55, marginTop: '1.5rem', textAlign: 'right' }}>02 — Mockup, filled</div>
          </div>
        </div>

        {/* Use case (portrait photo: tall card beside a text block) */}
        <div className="pkg-cell-usecase">
          <button
            type="button"
            data-cursor="IN THE WILD"
            aria-label={`${feat.brand} use case photo. Open larger view`}
            onClick={() => openFeatured('usecase')}
            className="pkg-usecase-curtain"
            style={{
              ...plainButton,
              aspectRatio: feat.usecaseAspect ?? '2 / 3',
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#c9a877',
              boxShadow: '0 14px 44px rgba(0,0,0,0.24)',
            }}
          >
            <img
              className="pkg-usecase-img"
              src={feat.usecase}
              alt={`${feat.brand} in use`}
              loading="lazy"
              decoding="async"
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        </div>
        <div className="pkg-usecase-text">
          <div style={{ ...metaStyle, opacity: 0.6 }}>03 — Use case</div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3rem, 8vw, 7rem)',
              lineHeight: 0.88,
              textTransform: 'uppercase',
              margin: '0.75rem 0 1.25rem',
            }}
          >
            In the
            <br />
            <span style={{ color: 'var(--signal)' }}>wild</span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', lineHeight: 1.5, maxWidth: '26em', margin: 0 }}>
            {feat.onShelfText}
          </p>
          <div style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.5rem', marginTop: '1.25rem', transform: 'rotate(-2deg)', transformOrigin: 'left center' }}>
            ← off the artboard, onto the table
          </div>
        </div>
      </div>

      {/* ── More packaging ── */}
      <div className="pkg-more-wrap">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontStretch: '125%',
              fontSize: '0.95rem',
              letterSpacing: '0.06em',
              margin: 0,
            }}
          >
            MORE PACKAGING
          </h3>
          <span style={{ ...metaStyle, opacity: 0.55 }}>Dieline → mockup → shelf</span>
        </div>

        <div className="pkg-more-inner">
          <div className="pkg-more-grid">
            {packaging.more.map((tile, i) => (
              <Tile key={tile.slug} tile={tile} index={i} onOpen={openTile} />
            ))}
            {(gapDesktop > 0 || gapMobile > 0) && (
              <div
                className={`pkg-tile pkg-filler${gapDesktop === 0 ? ' pkg-filler--no-d' : ''}${gapMobile === 0 ? ' pkg-filler--no-m' : ''}`}
                aria-hidden="true"
                style={{ '--pkg-fd': Math.max(gapDesktop, 1), '--pkg-fm': Math.max(gapMobile, 1) } as CSSProperties}
              >
                <span style={{ fontFamily: 'var(--font-handwritten)', fontSize: 'clamp(1.2rem, 2.4vw, 2rem)', lineHeight: 1.1 }}>
                  open any tile to see it big ✦
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightbox && <Lightbox data={lightbox} onClose={closeLightbox} />}

      <style>{`
        @keyframes pkgLightboxIn { from { opacity: 0; } to { opacity: 1; } }

        /* ── Featured: 12-col grid ── */
        .pkg-featured {
          max-width: 1280px;
          margin: 0 auto;
          padding: 5rem 2rem 4rem;
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          column-gap: 1.5rem;
          row-gap: 6rem;
          align-items: center;
        }
        .pkg-cell-dieline { grid-column: 1 / span 4; grid-row: 1; min-width: 0; }
        .pkg-cell-intro   { grid-column: 5 / span 4; grid-row: 1; min-width: 0; padding: 0 0.75rem; }
        .pkg-cell-mockup  { grid-column: 9 / span 4; grid-row: 1; min-width: 0; padding: 0 1.25rem; }
        .pkg-cell-usecase { grid-column: 2 / span 4; grid-row: 2; min-width: 0; }
        .pkg-usecase-text { grid-column: 7 / span 6; grid-row: 2; min-width: 0; }
        .pkg-mockup-tilt  { transform-style: preserve-3d; will-change: transform; }
        .pkg-lift { transition: transform 0.35s var(--ease-bounce); }
        .pkg-lift:hover { transform: translateY(-4px) scale(1.015); }
        .pkg-featured button:focus-visible,
        .pkg-tile-inner:focus-visible { outline: 3px solid var(--signal); outline-offset: 4px; }

        /* ── More packaging: asymmetric dense grid ── */
        .pkg-more-wrap { max-width: 1280px; margin: 0 auto; padding: 4rem 2rem 6rem; }
        .pkg-more-inner { container-type: inline-size; }
        .pkg-more-grid {
          --pkg-gap: 1.1rem;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-auto-flow: dense;
          grid-auto-rows: 280px;
          grid-auto-rows: calc((100cqw - 3 * var(--pkg-gap)) / 4);
          gap: var(--pkg-gap);
        }
        .pkg-tile { position: relative; min-width: 0; min-height: 0; }
        .pkg-tile[data-size="2x1"] { grid-column: span 2; }
        .pkg-tile[data-size="1x2"] { grid-row: span 2; }
        .pkg-tile-inner {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          background: none;
          color: var(--ink);
          font: inherit;
          text-align: left;
          cursor: pointer;
          transition: transform 0.35s var(--ease-bounce);
        }
        .pkg-tile-media {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 6px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.16);
          transition: box-shadow 0.35s ease;
        }
        .pkg-tile-alt {
          position: absolute;
          inset: 0;
          background: #fff;
          padding: 0.75rem 0.75rem 3rem;
          opacity: 0;
          transition: opacity 0.45s ease;
        }
        .pkg-tile-flag {
          position: absolute;
          top: 0.6rem;
          left: 0.6rem;
          font-family: var(--font-meta);
          font-size: 0.5rem;
          letter-spacing: 0.1em;
          background: var(--ink);
          color: #F4F1EA;
          padding: 0.25rem 0.45rem;
          border-radius: 2px;
        }
        .pkg-tile-caption {
          position: absolute;
          left: 0.6rem;
          bottom: 0.6rem;
          max-width: calc(100% - 1.2rem);
          background: #F4F1EA;
          color: #0D0D0D;
          padding: 0.4rem 0.6rem 0.45rem;
          border-radius: 2px;
          box-shadow: 2px 2px 0 rgba(13,13,13,0.85);
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .pkg-tile-brand {
          font-family: var(--font-display);
          font-size: clamp(0.85rem, 1.3vw, 1.15rem);
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .pkg-tile-product {
          font-family: var(--font-meta);
          font-size: 0.56rem;
          letter-spacing: 0.04em;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (hover: hover) {
          .pkg-tile-inner:hover { transform: translateY(-6px); }
          .pkg-tile-inner:hover .pkg-tile-media { box-shadow: 0 16px 36px rgba(0,0,0,0.26); }
          .pkg-tile-inner:hover .pkg-tile-alt { opacity: 1; }
        }
        .pkg-tile-inner:focus-visible .pkg-tile-alt { opacity: 1; }

        .pkg-filler {
          grid-column: span var(--pkg-fd, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 1rem;
          border: 1.5px dashed rgba(13,13,13,0.35);
          border-radius: 6px;
          color: var(--ink);
        }
        .pkg-filler--no-d { display: none; }

        /* ── Lightbox images ── */
        .pkg-lb-images { display: flex; gap: 1.5rem; align-items: flex-start; }

        /* ── Mobile / tablet ── */
        @media (max-width: 900px) {
          .pkg-featured {
            grid-template-columns: minmax(0, 1fr);
            padding: 3rem 1.25rem 2.5rem;
            row-gap: 3.5rem;
          }
          .pkg-cell-dieline, .pkg-cell-intro, .pkg-cell-mockup, .pkg-cell-usecase, .pkg-usecase-text {
            grid-column: 1; grid-row: auto; padding: 0;
          }
          .pkg-cell-intro   { order: 1; }
          .pkg-cell-dieline { order: 2; padding: 0 0.5rem; }
          .pkg-cell-mockup  { order: 3; max-width: 340px; width: 100%; justify-self: center; }
          .pkg-cell-usecase { order: 4; max-width: 420px; width: 100%; justify-self: center; }
          .pkg-usecase-text { order: 5; }

          .pkg-more-wrap { padding: 3rem 1.25rem 4.5rem; }
          .pkg-more-grid {
            --pkg-gap: 0.75rem;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: 170px;
            grid-auto-rows: calc((100cqw - var(--pkg-gap)) / 2);
          }
          .pkg-tile-caption { left: 0.4rem; bottom: 0.4rem; max-width: calc(100% - 0.8rem); padding: 0.3rem 0.45rem 0.35rem; }
          .pkg-tile-flag { top: 0.4rem; left: 0.4rem; }
          .pkg-filler { grid-column: span var(--pkg-fm, 1); display: flex; }
          .pkg-filler--no-m { display: none; }
          .pkg-lb-images { flex-direction: column; align-items: stretch; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pkg-tile-inner, .pkg-tile-media, .pkg-tile-alt, .pkg-lift { transition: none; }
          .pkg-tile-inner:hover, .pkg-lift:hover { transform: none; }
        }
      `}</style>
    </section>
  );
}
