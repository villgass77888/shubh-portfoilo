import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { archive } from '../../../../data/archive';
import type { Brochure } from '../../../../data/archive';
import { archiveContent } from '../../../../content/archive';
import { PageHead, useReveal } from './bits';
import ReaderShell from './ReaderShell';
import type { StageSize } from './ReaderShell';
import type { ArchiveNav } from './route';

/* The readers (and the page-turning engine behind the book) load when a brochure is opened */
const BookReader = lazy(() => import('./BookReader'));
const GatefoldViewer = lazy(() => import('./GatefoldViewer'));

const coverOf = (b: Brochure) => b.cover ?? b.pages[0].src;

/** Light spines get dark lettering */
function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.6 ? '#0D0D0D' : '#F4F1EA';
}

/** Book width on the shelf before scaling: decks are wider, portrait books narrower */
const shelfWidth = (ar: number) => (ar >= 1.25 ? 250 : ar > 0.9 ? 210 : 196);

type BookProps = { brochure: Brochure; hidden: boolean; onOpen: (b: Brochure, cover: Element | null) => void };

/**
 * A brochure standing on the shelf: a real box in CSS 3D (cover, spine, page block, back),
 * turned so the spine shows. On hover it turns to the viewer and the cover swings open
 * on the first inside page.
 */
function ShelfBook({ brochure: b, hidden, onOpen }: BookProps) {
  const reveal = useReveal(70);
  const w = shelfWidth(b.pageAspect);
  const vars = {
    '--bw': w,
    '--bh': Math.round(w / b.pageAspect),
    '--spine': b.spineColor,
    '--spine-ink': inkOn(b.spineColor),
  } as CSSProperties;
  const inside = b.pages[1]?.src ?? b.pages[0].src;
  const tag = b.kind === 'gatefold' ? 'GATEFOLD' : b.kind === 'scroll' ? 'LONG SCROLL' : null;

  return (
    <div ref={reveal} className={`ar-book-cell${hidden ? ' is-away' : ''}`}>
      <button
        type="button"
        className="ar-book"
        data-cursor="READ"
        data-slug={b.slug}
        style={vars}
        aria-label={`Read ${b.name}, ${b.pageCount} pages`}
        onClick={(e) => onOpen(b, e.currentTarget.querySelector('.ar-book-cover'))}
      >
        <span className="ar-book-3d">
          <span className="ar-book-back" />
          <span className="ar-book-edge" />
          <span className="ar-book-top" />
          <span className="ar-book-spine">
            <em>{b.name}</em>
          </span>
          <span className="ar-book-first" style={{ backgroundImage: `url(${inside})`, backgroundPosition: b.kind === 'scroll' ? 'top' : 'center' }} />
          <span className="ar-book-cover">
            <img src={coverOf(b)} alt="" loading="lazy" decoding="async" draggable={false} />
          </span>
        </span>
        <span className="ar-book-shadow" aria-hidden="true" />
        {tag && (
          <span className="ar-book-tag" aria-hidden="true">
            {tag}
          </span>
        )}
      </button>
      <i className="ar-shelf-line" aria-hidden="true" />
      <div className="ar-book-name">{b.name}</div>
      <div className="ar-book-pages">
        {b.pageCount} {b.kind === 'scroll' ? 'SHEETS' : 'PAGES'}
      </div>
    </div>
  );
}

type Props = { open?: string; nav: ArchiveNav };

/** The shelf of brochures, and whichever one is open in a reader on top of it. */
export default function BrochuresPage({ open, nav }: Props) {
  const list = archive.brochures;
  const current = open ? list.find((b) => b.slug === open) : undefined;
  const origin = useRef<DOMRect | null>(null);
  // keeps the book off the shelf until its cover has flown back
  const [away, setAway] = useState<string | null>(open ?? null);

  useEffect(() => {
    if (open) setAway(open);
    else {
      origin.current = null;
      setAway(null);
    }
  }, [open]);

  const onOpen = useCallback(
    (b: Brochure, cover: Element | null) => {
      origin.current = cover?.getBoundingClientRect() ?? null;
      nav.go({ page: 'brochures', open: b.slug });
    },
    [nav],
  );
  const onClose = useCallback(() => nav.back(), [nav]);
  const shelfRect = useCallback(
    () => (current ? document.querySelector(`.ar-book[data-slug="${current.slug}"] .ar-book-cover`)?.getBoundingClientRect() ?? null : null),
    [current],
  );

  return (
    <article className="ar-format">
      <PageHead title="Brochures" meta={`${list.length} BROCHURES`}>
        <p className="ar-about">{archiveContent.brochures.intro}</p>
      </PageHead>

      <div className="ar-shelf">
        {list.map((b) => (
          <ShelfBook key={b.slug} brochure={b} hidden={away === b.slug} onOpen={onOpen} />
        ))}
      </div>

      {current && (
        <Suspense fallback={null}>
          {current.kind === 'gatefold' && current.gatefold ? (
            <GatefoldViewer key={current.slug} brochure={current} from={origin.current} shelfRect={shelfRect} onClose={onClose} />
          ) : current.kind === 'scroll' ? (
            <ScrollReader key={current.slug} brochure={current} from={origin.current} shelfRect={shelfRect} onClose={onClose} />
          ) : (
            <BookReader key={current.slug} brochure={current} from={origin.current} shelfRect={shelfRect} onClose={onClose} />
          )}
        </Suspense>
      )}
    </article>
  );
}

type ReaderProps = { brochure: Brochure; from: DOMRect | null; shelfRect: () => DOMRect | null; onClose: () => void };

/**
 * Long-scroll sheets (Edulogix: five very tall pages) are not a book. They are read
 * top to bottom, one sheet at a time, with the sheets as tabs.
 */
function ScrollReader({ brochure, from, shelfRect, onClose }: ReaderProps) {
  const [sheet, setSheet] = useState(0);
  const viewRef = useRef<HTMLDivElement>(null);
  const total = brochure.pages.length;
  const page = brochure.pages[sheet];

  const go = useCallback((i: number) => setSheet(Math.min(total - 1, Math.max(0, i))), [total]);

  useEffect(() => {
    viewRef.current?.scrollTo({ top: 0 });
  }, [sheet]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(sheet + 1);
      else if (e.key === 'ArrowLeft') go(sheet - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, sheet]);

  const coverSize = useCallback((stage: StageSize) => {
    const h = Math.min(stage.h * 0.9, (stage.w * 0.9) / brochure.pageAspect);
    return { w: h * brochure.pageAspect, h };
  }, [brochure.pageAspect]);

  return (
    <ReaderShell
      name={brochure.name}
      kind={`LONG SCROLL ✦ ${total} SHEETS`}
      cover={coverOf(brochure)}
      coverAspect={brochure.pageAspect}
      from={from}
      shelfRect={shelfRect}
      coverSize={coverSize}
      counter={`SHEET ${sheet + 1} / ${total}`}
      progress={total > 1 ? sheet / (total - 1) : 1}
      hint="SCROLL ✦ ← → FOR THE NEXT SHEET"
      onClose={onClose}
    >
      {() => (
        <div className="ar-sr">
          <div className="ar-sr-tabs" role="tablist" aria-label="Sheets">
            {brochure.pages.map((p, i) => (
              <button key={p.src} type="button" role="tab" aria-selected={i === sheet} className={`ar-sr-tab${i === sheet ? ' is-on' : ''}`} onClick={() => go(i)}>
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
          <div ref={viewRef} className="ar-sr-view" data-lenis-prevent>
            <img
              key={page.src}
              className="ar-sr-img"
              src={page.src}
              srcSet={`${page.src} 640w, ${page.hi} 1050w`}
              sizes="(max-width: 700px) 92vw, 560px"
              alt={`${brochure.name}, sheet ${sheet + 1}`}
              width={page.w}
              height={page.h}
              decoding="async"
              draggable={false}
              style={{ backgroundImage: `url(${page.lqip})` }}
            />
            {sheet < total - 1 && (
              <button type="button" className="ar-stick ar-stick--acid ar-sr-next" onClick={() => go(sheet + 1)}>
                NEXT SHEET →
              </button>
            )}
          </div>
        </div>
      )}
    </ReaderShell>
  );
}

export const brochuresCss = `
.ar-shelf {
  --k: 1;
  width: min(1320px, 100%);
  margin: clamp(1rem, 4vh, 3rem) auto 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  row-gap: clamp(3.5rem, 9vh, 6rem);
}
.ar-book-cell {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease var(--rd, 0ms), transform 0.8s var(--ease-enter) var(--rd, 0ms);
}
.ar-book-cell.is-in { opacity: 1; transform: none; }
.ar-book-cell.is-away .ar-book { visibility: hidden; }

.ar-book {
  --d: calc(24px * var(--k));
  position: relative;
  display: block;
  flex: none;
  width: calc(var(--bw) * var(--k) * 1px);
  height: calc(var(--bh) * var(--k) * 1px);
  padding: 0;
  perspective: 1500px;
  perspective-origin: 50% -12%;
  outline: none;
}
.ar-book-3d {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  transform: rotateY(28deg);
  transition: transform 0.7s var(--ease-enter);
}
.ar-book-3d > span { position: absolute; display: block; }
.ar-book-cover {
  inset: 0;
  transform-origin: 0 50%;
  transform: translateZ(calc(var(--d) / 2));
  transition: transform 0.8s var(--ease-enter);
  box-shadow: inset 4px 0 6px -3px rgba(0, 0, 0, 0.35);
  background: var(--spine);
  overflow: hidden;
  border-radius: 1px 3px 3px 1px;
}
.ar-book-cover img { display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; object-position: top; }
.ar-book-cover::after {
  /* the crease where the cover bends */
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 7%;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.28), rgba(255, 255, 255, 0.18) 45%, transparent);
}
.ar-book-first {
  inset: 2px 2px 2px 0;
  transform: translateZ(calc(var(--d) / 2 - 1px));
  background-color: #F4F1EA;
  background-size: cover;
  box-shadow: inset 12px 0 18px -10px rgba(0, 0, 0, 0.35);
}
.ar-book-back { inset: 0; transform: translateZ(calc(var(--d) / -2)); background: var(--spine); border-radius: 1px 3px 3px 1px; }
.ar-book-spine {
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--d);
  transform-origin: 0 50%;
  transform: translateZ(calc(var(--d) / -2)) rotateY(-90deg);
  background: var(--spine);
  background-image: linear-gradient(to right, rgba(0, 0, 0, 0.22), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.25));
  display: flex !important;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ar-book-spine em {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-style: normal;
  font-family: var(--font-meta);
  font-size: calc(8px * var(--k));
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--spine-ink);
}
/* the page block: fine stacked lines on the fore-edge and the top */
.ar-book-edge {
  top: 2px;
  bottom: 2px;
  right: 0;
  width: var(--d);
  transform-origin: 100% 50%;
  transform: translateZ(calc(var(--d) / -2)) rotateY(90deg);
  background: repeating-linear-gradient(to right, #F7F4EC 0 1.5px, #CFC9BB 1.5px 2.5px);
}
.ar-book-top {
  left: 0;
  right: 2px;
  top: 0;
  height: var(--d);
  transform-origin: 50% 0;
  transform: translateZ(calc(var(--d) / -2)) rotateX(90deg);
  background: repeating-linear-gradient(to bottom, #F7F4EC 0 1.5px, #CFC9BB 1.5px 2.5px);
}
.ar-book-shadow {
  position: absolute;
  left: -6%;
  right: -22%;
  bottom: -9px;
  height: 18px;
  background: radial-gradient(ellipse at 45% 50%, rgba(0, 0, 0, 0.42), transparent 68%);
  filter: blur(4px);
  transition: transform 0.7s var(--ease-enter), opacity 0.7s ease;
}
.ar-book-tag {
  position: absolute;
  top: -0.7rem;
  right: -1.4rem;
  z-index: 3;
  padding: 0.4em 0.65em;
  font-family: var(--font-meta);
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  line-height: 1;
  white-space: nowrap;
  color: var(--ink);
  background: var(--acid);
  border: 2px solid var(--ink);
  border-radius: 6px;
  box-shadow: 3px 3px 0 var(--ink);
  transform: rotate(7deg);
}
@media (hover: hover) {
  .ar-book:hover .ar-book-3d, .ar-book:focus-visible .ar-book-3d { transform: rotateY(8deg) translateY(-14px); }
  .ar-book:hover .ar-book-cover, .ar-book:focus-visible .ar-book-cover { transform: translateZ(calc(var(--d) / 2)) rotateY(-52deg); }
  .ar-book:hover .ar-book-shadow, .ar-book:focus-visible .ar-book-shadow { transform: scale(0.86); opacity: 0.6; }
}
.ar-book:focus-visible { outline: 2px dashed var(--signal); outline-offset: 10px; }

/* the shelf: a thin ink line with a hard shadow, continuous across each row */
.ar-shelf-line {
  display: block;
  align-self: stretch;
  flex: none;
  height: 3px;
  margin-top: 3px;
  background: var(--ink);
  box-shadow: 0 5px 0 rgba(13, 13, 13, 0.16);
}
.ar-book-name {
  margin-top: 1.1rem;
  padding: 0 0.6rem;
  min-height: 2.5em;
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: clamp(0.82rem, 1.05vw, 1rem);
  line-height: 1.25;
  text-align: center;
}
.ar-book-pages { margin-top: 0.2rem; font-family: var(--font-meta); font-size: 0.62rem; letter-spacing: 0.1em; opacity: 0.6; }

@media (max-width: 1100px) {
  .ar-shelf { --k: 0.86; grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 680px) {
  .ar-shelf { --k: 0.6; grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 2.75rem; }
  .ar-book-tag { right: -0.6rem; font-size: 0.5rem; }
}
@media (prefers-reduced-motion: reduce) {
  .ar-book-cell { opacity: 1; transform: none; transition: none; }
}

/* long-scroll reader */
.ar-sr { position: absolute; inset: 0; display: flex; align-items: stretch; justify-content: center; gap: clamp(0.6rem, 2vw, 1.5rem); padding: 0 3vw; }
.ar-sr-tabs { flex: none; display: flex; flex-direction: column; justify-content: center; gap: 0.5rem; }
.ar-sr-tab {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  border: 1.5px solid rgba(244, 241, 234, 0.5);
  color: #F4F1EA;
  font-family: var(--font-meta);
  font-size: 0.66rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.ar-sr-tab.is-on, .ar-sr-tab:hover, .ar-sr-tab:focus-visible { background: var(--acid); color: var(--ink); border-color: var(--acid); outline: none; }
.ar-sr-view {
  width: min(560px, 100%);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(244, 241, 234, 0.4) transparent;
  border-radius: 10px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #0f1c3a;
}
.ar-sr-img { display: block; width: 100%; height: auto; background-size: cover; animation: arFade 0.4s ease both; }
.ar-sr-next { margin: 1.5rem 0 2rem; }
@media (max-width: 700px) {
  .ar-sr { flex-direction: column; padding: 0 4vw; gap: 0.6rem; align-items: center; }
  .ar-sr-tabs { flex-direction: row; }
  .ar-sr-tab { width: 2.3rem; height: 2.3rem; }
  .ar-sr-view { flex: 1 1 0; min-height: 0; }
}
`;
