import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import gsap from 'gsap';
import { archive, imagesOf, smallest } from '../../../../data/archive';
import type { ArchiveBrand } from '../../../../data/archive';
import { archiveContent } from '../../../../content/archive';
import { prefersReducedMotion, useEntered } from './bits';
import { Chars, SelMarks } from './marks';
import type { ArchiveNav, ArchiveRoute } from './route';

/* The sketch's zigzag: [row, column] of each brand tile on the 3-column grid, in menu order. */
const CELLS: Array<[number, number]> = [
  [1, 1],
  [2, 2],
  [3, 1],
  [3, 3],
  [4, 2],
  [5, 3],
];
/** The empty middle box of the sketch: the counter tile sits here */
const COUNTER: [number, number] = [3, 2];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Pointer position inside an element, in % (for the colour flood) and −1…1 (for the fan) */
function track(e: ReactPointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty('--fx', `${(x * 100).toFixed(1)}%`);
  el.style.setProperty('--fy', `${(y * 100).toFixed(1)}%`);
  return { el, x, y };
}

function BrandTile({ brand, index, onOpen }: { brand: ArchiveBrand; index: number; onOpen: () => void }) {
  const [row, col] = CELLS[index] ?? [index + 1, 1];
  const thumbs = brand.items.slice(0, 3).map((it) => smallest(imagesOf(it)[0]));

  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse') return;
    const { el, x, y } = track(e);
    // the fan leans a little towards the pointer
    el.style.setProperty('--mx', (x * 2 - 1).toFixed(3));
    el.style.setProperty('--my', (y * 2 - 1).toFixed(3));
  };
  const onLeave = (e: ReactPointerEvent<HTMLButtonElement>) => {
    // the flood retracts towards the point where the pointer left
    const { el } = track(e);
    el.style.setProperty('--mx', '0');
    el.style.setProperty('--my', '0');
  };

  return (
    <div className="ar-tile-cell" style={{ gridRow: row, gridColumn: col }}>
      <button
        type="button"
        className="ar-tile ar-sel ar-sel--hover"
        data-cursor="OPEN"
        style={{ '--c': brand.color } as CSSProperties}
        aria-label={`${brand.name}, ${brand.count} creatives`}
        onClick={onOpen}
        onPointerEnter={track}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {/* three creatives that fan out from behind the top edge */}
        <span className="ar-tile-fan" aria-hidden="true">
          {thumbs.map((src, i) => (
            <img key={src} className={`ar-tile-card ar-tile-card--${i}`} src={src} alt="" loading="lazy" decoding="async" draggable={false} />
          ))}
        </span>
        <span className="ar-tile-face">
          <span className="ar-tile-flood" aria-hidden="true" />
          <span className="ar-tile-num">{pad2(index + 1)}</span>
          <span className="ar-tile-name">{brand.name}</span>
          <span className="ar-tile-count">{brand.count} CREATIVES</span>
          <span className="ar-tile-thumbs" aria-hidden="true">
            {thumbs.map((src) => (
              <img key={src} src={src} alt="" loading="lazy" decoding="async" draggable={false} />
            ))}
          </span>
        </span>
        <SelMarks />
      </button>
    </div>
  );
}

type Format = { word: string; count: number; to: ArchiveRoute; kind: 'flyers' | 'brochures' | 'emailers' };

/** The archive's front page: six brand tiles in the sketch's zigzag, then the three formats. */
export default function ArchiveMenu({ nav }: { nav: ArchiveNav }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const on = useEntered(240);
  const { brands, flyers, brochures, emailers } = archive;

  const formats: Format[] = [
    { word: 'FLYERS', count: flyers.length, to: { page: 'flyers' }, kind: 'flyers' },
    { word: 'BROCHURES', count: brochures.length, to: { page: 'brochures' }, kind: 'brochures' },
    { word: 'EMAILERS', count: emailers.length, to: { page: 'emailers' }, kind: 'emailers' },
  ];
  const book = brochures.find((b) => b.kind === 'book') ?? brochures[0];

  // Each time the menu shows: tiles fly in along the zigzag from alternating sides, then the counter pops
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tiles = gsap.utils.toArray<HTMLElement>('.ar-tile-cell');
      const from = (i: number) => (i % 2 ? 1 : -1);
      tiles.forEach((el, i) => {
        gsap.fromTo(
          el,
          { x: from(i) * window.innerWidth * 0.75, rotation: from(i) * 8, opacity: 0 },
          { x: 0, rotation: 0, opacity: 1, duration: 0.95, delay: 0.3 + i * 0.09, ease: 'back.out(1.25)', clearProps: 'transform,opacity' },
        );
      });
      const landed = 0.3 + tiles.length * 0.09 + 0.55;
      gsap.fromTo('.ar-counter', { scale: 0, rotation: -14 }, { scale: 1, rotation: 0, duration: 0.55, delay: landed, ease: 'back.out(2.6)', clearProps: 'transform' });
      gsap.fromTo('.ar-fmts > *', { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: landed - 0.15, stagger: 0.07, ease: 'expo.out', clearProps: 'transform,opacity' });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className={`ar-menu${on ? ' is-in' : ''}`}>
      <h2 className={`ar-menu-title ar-sel${on ? ' is-on' : ''}`} aria-label={archiveContent.menuTitle}>
        <Chars text={archiveContent.menuTitle} />
        <SelMarks />
      </h2>

      <div className="ar-zig">
        {brands.slice(0, 3).map((b, i) => (
          <BrandTile key={b.slug} brand={b} index={i} onOpen={() => nav.go({ page: 'brand', slug: b.slug })} />
        ))}
        <div className="ar-counter-cell" style={{ gridRow: COUNTER[0], gridColumn: COUNTER[1] }}>
          <div className="ar-counter">
            <b>{brands.length}</b> BRANDS <i>✦</i> <b>{archive.totalCreatives}</b> CREATIVES
          </div>
        </div>
        {brands.slice(3).map((b, i) => (
          <BrandTile key={b.slug} brand={b} index={i + 3} onOpen={() => nav.go({ page: 'brand', slug: b.slug })} />
        ))}
      </div>

      <nav className="ar-fmts" aria-label="Formats">
        {formats.map((f, i) => (
          <span key={f.kind} className="ar-fmt-wrap">
            {i > 0 && (
              <i className="ar-fmt-sep" aria-hidden="true">
                ✦
              </i>
            )}
            <button type="button" className="ar-fmt ar-sel ar-sel--hover" data-cursor="OPEN" aria-label={`${f.word}, ${f.count}`} onClick={() => nav.go(f.to)}>
              <span className={`ar-fmt-pre ar-fmt-pre--${f.kind}`} aria-hidden="true">
                {f.kind === 'flyers' &&
                  flyers.slice(0, 2).map((fl) => <img key={fl.src} className="ar-fmt-flyer" src={smallest(fl)} alt="" loading="lazy" decoding="async" draggable={false} />)}
                {f.kind === 'brochures' && book && (
                  <span className="ar-fmt-book">
                    <span className="ar-fmt-book-page" />
                    <img className="ar-fmt-book-cover" src={book.cover ?? book.pages[0].src} alt="" loading="lazy" decoding="async" draggable={false} />
                  </span>
                )}
                {f.kind === 'emailers' && emailers[0] && (
                  <span className="ar-fmt-env">
                    <i className="ar-fmt-env-flap" />
                    <img className="ar-fmt-env-letter" src={smallest(emailers[0].image)} alt="" loading="lazy" decoding="async" draggable={false} />
                    <i className="ar-fmt-env-front" />
                  </span>
                )}
              </span>
              <span className="ar-fmt-plate" aria-hidden="true" />
              <span className="ar-fmt-word" aria-hidden="true">
                {f.word}
              </span>
              <sup className="ar-fmt-n" aria-hidden="true">
                {pad2(f.count)}
              </sup>
              <SelMarks />
            </button>
          </span>
        ))}
      </nav>
    </section>
  );
}

export const menuCss = `
.ar-menu { display: flex; flex-direction: column; align-items: center; padding-bottom: clamp(2rem, 8vh, 5rem); }
.ar-menu-title {
  margin: clamp(0.5rem, 3vh, 2rem) 0 0;
  padding: 0.08em 0.24em 0.12em;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2.1rem, 6vw, 5.8rem);
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
  color: var(--signal);
}

/* ── the zigzag ── */
.ar-zig {
  width: min(1200px, 100%);
  margin-top: clamp(4.5rem, 13vh, 8.5rem);
  padding: 0 2px 2px 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
/* tiles touch: neighbours share one 2px line */
.ar-tile-cell, .ar-counter-cell { position: relative; margin: 0 -2px -2px 0; min-width: 0; }
.ar-tile {
  --fx: 50%; --fy: 50%; --mx: 0; --my: 0;
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  aspect-ratio: 2.6;
  padding: 0;
  color: var(--ink);
  text-align: left;
  outline: none;
}
.ar-tile:hover, .ar-tile:focus-visible { z-index: 6; }
.ar-tile-face {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  background: var(--paper-sheet);
  border: 2px solid var(--ink);
}
.ar-tile-flood {
  position: absolute;
  inset: 0;
  background: var(--c);
  clip-path: circle(0% at var(--fx) var(--fy));
  transition: clip-path 0.6s var(--ease-enter);
}
.ar-tile:hover .ar-tile-flood, .ar-tile:focus-visible .ar-tile-flood { clip-path: circle(150% at var(--fx) var(--fy)); }
.ar-tile-num, .ar-tile-count, .ar-tile-name { position: absolute; transition: color 0.3s ease; }
.ar-tile-num, .ar-tile-count { font-family: var(--font-meta); font-size: clamp(0.56rem, 0.72vw, 0.7rem); letter-spacing: 0.1em; line-height: 1; }
.ar-tile-num { top: 0.8rem; left: 0.9rem; }
.ar-tile-count { right: 0.9rem; bottom: 0.8rem; }
.ar-tile-name {
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  font-family: var(--font-heading);
  font-weight: 900;
  font-stretch: 125%;
  font-size: clamp(1rem, 2.15vw, 1.95rem);
  letter-spacing: -0.005em;
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
}
.ar-tile:hover .ar-tile-num, .ar-tile:hover .ar-tile-count, .ar-tile:hover .ar-tile-name,
.ar-tile:focus-visible .ar-tile-num, .ar-tile:focus-visible .ar-tile-count, .ar-tile:focus-visible .ar-tile-name { color: #fff; }
.ar-tile-thumbs { display: none; }

/* the fan: behind the face, so the cards rise out from behind the tile's top edge */
.ar-tile-fan {
  position: absolute;
  left: 50%;
  bottom: 100%;
  z-index: 0;
  width: 27%;
  aspect-ratio: 4 / 5;
  margin-left: -13.5%;
  transform: translate(calc(var(--mx) * 12px), calc(var(--my) * 8px));
  transition: transform 0.5s var(--ease-enter);
  pointer-events: none;
}
.ar-tile-card {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  border: 2px solid var(--ink);
  border-radius: 8px;
  background: #ddd8cc;
  /* no shadow while tucked away: it would show under the tile */
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0);
  transform: translateY(112%);
  transform-origin: 50% 120%;
  transition: transform 0.55s var(--ease-enter), box-shadow 0.3s ease;
}
.ar-tile:hover .ar-tile-card, .ar-tile:focus-visible .ar-tile-card { box-shadow: 0 12px 28px rgba(0, 0, 0, 0.26); }
.ar-tile:hover .ar-tile-card--0, .ar-tile:focus-visible .ar-tile-card--0 { transform: translate(-72%, 26%) rotate(-8deg); }
.ar-tile:hover .ar-tile-card--1, .ar-tile:focus-visible .ar-tile-card--1 { transform: translate(72%, 26%) rotate(8deg); transition-delay: 0.05s; }
.ar-tile:hover .ar-tile-card--2, .ar-tile:focus-visible .ar-tile-card--2 { transform: translate(0, 14%); transition-delay: 0.1s; }
.ar-tile-card--2 { z-index: 1; }

/* the empty box of the sketch: a counter, not a link */
.ar-counter-cell { display: flex; z-index: 2; }
.ar-counter {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.2em 0.5em;
  padding: 0.6rem 1rem;
  font-family: var(--font-meta);
  font-size: clamp(0.62rem, 0.95vw, 0.9rem);
  letter-spacing: 0.08em;
  text-align: center;
  color: var(--ink);
  background: var(--acid);
  border: 2px solid var(--ink);
  box-shadow: 7px 7px 0 var(--ink);
}
.ar-counter b { font-weight: 700; font-size: 1.5em; }
.ar-counter i { font-style: normal; }

/* ── the three formats ── */
.ar-fmts {
  width: min(1200px, 100%);
  margin-top: clamp(4.5rem, 14vh, 9rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ar-fmt-wrap { display: contents; }
.ar-fmt-sep { font-style: normal; font-size: clamp(1rem, 2.4vw, 2.4rem); line-height: 1; color: var(--signal); }
.ar-fmt {
  position: relative;
  display: inline-block;
  padding: 0.06em 0.16em 0.1em;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6.2vw, 6.2rem);
  line-height: 1;
  color: var(--signal);
  outline: none;
}
.ar-fmt-plate {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--ink);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.45s var(--ease-enter);
}
.ar-fmt:hover .ar-fmt-plate, .ar-fmt:focus-visible .ar-fmt-plate { transform: none; }
.ar-fmt-word { position: relative; z-index: 2; }
.ar-fmt-n {
  position: absolute;
  z-index: 2;
  top: 0.5em;
  left: calc(100% + 0.6em);
  font-family: var(--font-meta);
  font-size: 0.12em;
  letter-spacing: 0.08em;
  line-height: 1;
  color: var(--ink);
}
/* previews live in a box clipped at the word's top edge: they rise from behind it */
.ar-fmt-pre { position: absolute; inset: 0; z-index: 0; clip-path: inset(-500% -60% 100% -60%); pointer-events: none; }

.ar-fmt-flyer {
  position: absolute;
  bottom: 100%;
  left: calc(50% - 0.5em);
  width: 1em;
  max-width: none;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border: 2px solid var(--ink);
  border-radius: 6px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  transform: translateY(110%);
  transition: transform 0.55s var(--ease-enter);
}
.ar-fmt:hover .ar-fmt-flyer:nth-child(1), .ar-fmt:focus-visible .ar-fmt-flyer:nth-child(1) { transform: translate(-46%, 14%) rotate(-9deg); }
.ar-fmt:hover .ar-fmt-flyer:nth-child(2), .ar-fmt:focus-visible .ar-fmt-flyer:nth-child(2) { transform: translate(46%, 8%) rotate(7deg); transition-delay: 0.07s; }

.ar-fmt-book {
  position: absolute;
  bottom: 100%;
  left: calc(50% - 0.48em);
  width: 0.96em;
  aspect-ratio: 0.71;
  perspective: 700px;
  transform: translateY(112%) rotate(0deg);
  transition: transform 0.55s var(--ease-enter);
}
.ar-fmt-book-page { position: absolute; inset: 2px 2px 2px 0; background: #F7F4EC; border: 2px solid var(--ink); border-radius: 2px 5px 5px 2px; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25); }
.ar-fmt-book-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  border: 2px solid var(--ink);
  border-radius: 2px 5px 5px 2px;
  transform-origin: 0 50%;
  transition: transform 0.6s var(--ease-enter) 0.18s;
}
.ar-fmt:hover .ar-fmt-book, .ar-fmt:focus-visible .ar-fmt-book { transform: translateY(10%) rotate(-6deg); }
.ar-fmt:hover .ar-fmt-book-cover, .ar-fmt:focus-visible .ar-fmt-book-cover { transform: rotateY(-24deg); }

.ar-fmt-env {
  position: absolute;
  bottom: 100%;
  left: calc(50% - 0.66em);
  width: 1.32em;
  height: 0.86em;
  background: #DAD4C6;
  border: 2px solid var(--ink);
  border-radius: 5px;
  transform: translateY(112%);
  transition: transform 0.55s var(--ease-enter);
}
.ar-fmt-env-letter {
  position: absolute;
  left: 9%;
  top: 8%;
  width: 82%;
  height: 150%;
  max-width: none;
  object-fit: cover;
  object-position: top;
  border: 1.5px solid var(--ink);
  border-radius: 3px;
  clip-path: inset(0 0 42% 0);
  transition: transform 0.6s var(--ease-enter) 0.22s;
}
.ar-fmt-env-front {
  position: absolute;
  inset: 0;
  background: var(--bone);
  clip-path: polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%);
  filter: drop-shadow(0 -2px 0 var(--ink));
}
.ar-fmt-env-flap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 56%;
  z-index: 2;
  background: #EDE8DC;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  filter: drop-shadow(0 2px 0 var(--ink));
  transform-origin: 50% 0;
  transition: transform 0.45s var(--ease-enter) 0.08s, z-index 0s 0.2s;
}
.ar-fmt:hover .ar-fmt-env, .ar-fmt:focus-visible .ar-fmt-env { transform: translateY(26%) rotate(4deg); }
.ar-fmt:hover .ar-fmt-env-flap, .ar-fmt:focus-visible .ar-fmt-env-flap { transform: rotateX(180deg); z-index: 0; }
.ar-fmt:hover .ar-fmt-env-letter, .ar-fmt:focus-visible .ar-fmt-env-letter { transform: translateY(-52%); }

/* reduced motion: nothing fans out or rises; the colour flood and the frame are enough */
@media (prefers-reduced-motion: reduce) {
  .ar-tile-fan, .ar-fmt-pre { display: none; }
}

/* ── phones: one column that keeps the zigzag rhythm ── */
@media (max-width: 768px) {
  .ar-zig { display: flex; flex-direction: column; margin-top: clamp(2rem, 6vh, 3rem); padding: 0; }
  .ar-tile-cell, .ar-counter-cell { margin: 0 0 -2px; width: calc(100% - 8vw); }
  .ar-zig > :nth-child(odd) { align-self: flex-start; }
  .ar-zig > :nth-child(even) { align-self: flex-end; }
  .ar-tile { aspect-ratio: auto; height: 6.4rem; }
  .ar-tile-fan { display: none; }
  /* long names wrap instead of running under the thumbnails */
  .ar-tile-name { inset: 0 9rem 0 0.9rem; justify-content: flex-start; padding: 0; font-size: clamp(0.9rem, 4.5vw, 1.3rem); text-align: left; white-space: normal; }
  .ar-tile-num { top: 0.6rem; }
  .ar-tile-count { right: auto; left: 0.9rem; bottom: 0.6rem; }
  /* the hover fan becomes a still row of three thumbnails inside the tile */
  .ar-tile-thumbs { position: absolute; right: 0.7rem; top: 50%; display: flex; gap: 0.3rem; transform: translateY(-50%); }
  .ar-tile-thumbs img { width: 2.35rem; height: 3rem; max-width: none; object-fit: cover; border: 1.5px solid var(--ink); border-radius: 4px; }
  .ar-tile-thumbs img:nth-child(odd) { transform: rotate(-3deg); }
  .ar-tile-thumbs img:nth-child(even) { transform: rotate(3deg) translateY(-2px); }
  .ar-counter-cell { min-height: 4rem; }
  .ar-counter { box-shadow: 5px 5px 0 var(--ink); }
  .ar-fmts { flex-direction: column; align-items: flex-start; gap: 0.5rem; margin-top: clamp(3rem, 8vh, 4.5rem); }
  .ar-fmt-sep { display: none; }
  .ar-fmt { font-size: clamp(3rem, 17vw, 5rem); }
}
`;
