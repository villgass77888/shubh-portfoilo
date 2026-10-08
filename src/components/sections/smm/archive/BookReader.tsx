import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import type { Brochure } from '../../../../data/archive';
import { prefersReducedMotion } from './bits';
import ReaderShell from './ReaderShell';
import type { StageSize } from './ReaderShell';

type Props = {
  brochure: Brochure;
  from: DOMRect | null;
  shelfRect: () => DOMRect | null;
  onClose: () => void;
};

/** Landscape pages (decks) and phones show one page at a time; portrait books show spreads */
const isSingle = (b: Brochure, stageW: number) => b.pageAspect > 1.15 || stageW < 760;

/** The size of one page for a given stage */
function pageSize(b: Brochure, stage: StageSize): StageSize {
  const single = isSingle(b, stage.w);
  const availW = stage.w * (stage.w < 760 ? 0.92 : 0.9);
  const availH = stage.h * 0.96;
  const h = Math.floor(Math.min(availH, availW / (single ? 1 : 2) / b.pageAspect));
  return { w: Math.floor(h * b.pageAspect), h };
}

/**
 * A brochure, read like a book: the cover opens with a real page curl, the right half of
 * the stage turns forward, the left half back. Swipe and the arrow keys do the same.
 * The page-turning engine (page-flip) is only fetched when a book is opened.
 */
export default function BookReader({ brochure, from, shelfRect, onClose }: Props) {
  const total = brochure.pages.length;
  const [page, setPage] = useState(0);
  const [single, setSingle] = useState(false);
  const flipRef = useRef<PageFlip | null>(null);
  const pageRef = useRef(0);
  pageRef.current = page;

  const turn = useCallback((dir: 1 | -1) => {
    const pf = flipRef.current;
    if (!pf) return;
    if (prefersReducedMotion()) {
      // no curl: jump one step and let the fade carry it
      const step = pf.getOrientation() === 'portrait' || pageRef.current === 0 ? 1 : 2;
      pf.turnToPage(Math.min(total - 1, Math.max(0, pageRef.current + dir * step)));
      setPage(pf.getCurrentPageIndex());
      return;
    }
    if (dir > 0) pf.flipNext('bottom');
    else pf.flipPrev('bottom');
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        turn(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        turn(-1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [turn]);

  // counter: spreads read "PAGES 4–5 / 24", single pages "PAGE 4 / 24"
  let counter = `PAGE ${page + 1} / ${total}`;
  if (page === 0) counter = `COVER ✦ 1 / ${total}`;
  else if (!single && page + 1 < total) counter = `PAGES ${page + 1}–${page + 2} / ${total}`;
  else if (page >= total - 1) counter = `BACK COVER ✦ ${total} / ${total}`;

  const coverSize = useCallback((stage: StageSize) => pageSize(brochure, stage), [brochure]);
  const first = brochure.pages[0];

  return (
    <>
    <style>{bookCss}</style>
    <ReaderShell
      name={brochure.name}
      kind={`BROCHURE ✦ ${total} PAGES`}
      cover={first.src}
      coverAspect={brochure.pageAspect}
      from={from}
      shelfRect={shelfRect}
      coverSize={coverSize}
      counter={counter}
      progress={total > 1 ? Math.min(1, (single || page === 0 ? page : page + 1) / (total - 1)) : 1}
      hint="CLICK THE SIDES ✦ ← → ✦ SWIPE"
      onClose={onClose}
    >
      {(stage) => <Book brochure={brochure} stage={stage} page={page} onPage={setPage} onMode={setSingle} flipRef={flipRef} turn={turn} />}
    </ReaderShell>
    </>
  );
}

type BookProps = {
  brochure: Brochure;
  stage: StageSize;
  page: number;
  onPage: (i: number) => void;
  onMode: (single: boolean) => void;
  flipRef: { current: PageFlip | null };
  turn: (dir: 1 | -1) => void;
};

function Book({ brochure, stage, page, onPage, onMode, flipRef, turn }: BookProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const single = isSingle(brochure, stage.w);
  const size = pageSize(brochure, stage);
  const total = brochure.pages.length;
  const startPage = useRef(0);
  startPage.current = page;

  useEffect(() => onMode(single), [single, onMode]);

  // Build the book. page-flip owns (and on destroy removes) its element, so it is created by hand.
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    let alive = true;
    let pf: PageFlip | null = null;
    const block = document.createElement('div');
    block.className = 'ar-bk-block';
    // sharper files only where the page is drawn large
    const hi = size.h * Math.min(2, window.devicePixelRatio || 1) > 1100;
    const imgs: HTMLImageElement[] = [];
    const pages = brochure.pages.map((p, i) => {
      const el = document.createElement('div');
      el.className = 'ar-bk-page';
      el.style.backgroundImage = `url(${p.lqip})`;
      const img = document.createElement('img');
      img.alt = `${brochure.name}, page ${i + 1}`;
      img.decoding = 'async';
      img.draggable = false;
      img.dataset.src = hi ? p.hi : p.src;
      img.addEventListener('load', () => img.classList.add('is-loaded'));
      imgs.push(img);
      el.appendChild(img);
      block.appendChild(el);
      return el;
    });
    /** Fetch the pages around the open spread: two behind, five ahead */
    const loadAround = (i: number) => {
      for (let k = Math.max(0, i - 2); k <= Math.min(total - 1, i + 5); k++) {
        const img = imgs[k];
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
      }
    };
    holder.appendChild(block);
    loadAround(startPage.current);

    import('page-flip/dist/js/page-flip.module.js')
      .then(({ PageFlip: Flip }) => {
        if (!alive) return;
        pf = new Flip(block, {
          width: size.w,
          height: size.h,
          size: 'fixed',
          startPage: startPage.current,
          showCover: true,
          usePortrait: true,
          drawShadow: true,
          maxShadowOpacity: 0.45,
          flippingTime: 720,
          autoSize: true,
          // the two halves of the stage turn the pages (see the zones below)
          useMouseEvents: false,
          mobileScrollSupport: false,
        });
        pf.loadFromHTML(pages);
        pf.on('flip', (e) => {
          const i = Number(e.data);
          onPage(i);
          loadAround(i);
        });
        flipRef.current = pf;
        holder.classList.add('is-built');
      })
      .catch(() => {
        if (alive) setFailed(true);
      });

    return () => {
      alive = false;
      flipRef.current = null;
      holder.classList.remove('is-built');
      try {
        pf?.destroy();
      } catch {
        /* page-flip removes its own element */
      }
      block.remove();
    };
    // rebuilt when the page size or the mode changes (resize, rotation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brochure, size.w, size.h, single]);

  // a closed book sits on one side of the spread: slide it to the centre
  let shift = 0;
  if (!single) {
    if (page === 0) shift = -size.w / 2;
    else if (page >= total - 1 && total % 2 === 0) shift = size.w / 2;
  }

  const onDown = (e: ReactPointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: ReactPointerEvent, side: 1 | -1) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    // a swipe turns in its own direction, a tap or click turns towards its side
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) turn(side);
  };

  if (failed) return <Fallback brochure={brochure} page={page} single={single} size={size} onPage={onPage} />;

  return (
    <div className="ar-bk">
      <div
        ref={holderRef}
        className={`ar-bk-holder${single ? ' ar-bk-holder--single' : ''}`}
        // 2px of slack: a rounded-down width must not tip the spread into single-page mode
        style={{ width: single ? size.w : size.w * 2 + 2, height: size.h, transform: `translateX(${shift}px)` }}
      />
      <button type="button" className="ar-rd-zone ar-rd-zone--prev" data-cursor="← PREV" aria-label="Previous page" onPointerDown={onDown} onPointerUp={(e) => onUp(e, -1)} onKeyDown={(e) => e.key === 'Enter' && turn(-1)} />
      <button type="button" className="ar-rd-zone ar-rd-zone--next" data-cursor="NEXT →" aria-label="Next page" onPointerDown={onDown} onPointerUp={(e) => onUp(e, 1)} onKeyDown={(e) => e.key === 'Enter' && turn(1)} />
    </div>
  );
}

/** If the page-turning engine cannot load: the same pages, switched with a plain fade. */
function Fallback({ brochure, page, single, size, onPage }: { brochure: Brochure; page: number; single: boolean; size: StageSize; onPage: (i: number) => void }) {
  const total = brochure.pages.length;
  const step = (dir: 1 | -1) => {
    const by = single || page === 0 ? 1 : 2;
    onPage(Math.min(total - 1, Math.max(0, page + dir * by)));
  };
  const shown = single || page === 0 || page >= total - 1 ? [page] : [page, page + 1];
  return (
    <div className="ar-bk">
      <div className="ar-bk-flat" key={page}>
        {shown.map((i) => (
          <img key={i} src={brochure.pages[i].src} alt={`${brochure.name}, page ${i + 1}`} style={{ width: size.w, height: size.h }} draggable={false} />
        ))}
      </div>
      <button type="button" className="ar-rd-zone ar-rd-zone--prev" data-cursor="← PREV" aria-label="Previous page" onClick={() => step(-1)} />
      <button type="button" className="ar-rd-zone ar-rd-zone--next" data-cursor="NEXT →" aria-label="Next page" onClick={() => step(1)} />
    </div>
  );
}

const bookCss = `
.ar-bk { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.ar-bk-holder {
  position: relative;
  flex: none;
  transition: transform 0.72s var(--ease-enter), opacity 0.3s ease;
  filter: drop-shadow(0 30px 50px rgba(0, 0, 0, 0.5));
  opacity: 0;
}
.ar-bk-holder.is-built { opacity: 1; }
.ar-bk-block { margin: 0 auto; }
.ar-bk-page { background-color: #F4F1EA; background-size: cover; background-position: center; overflow: hidden; }
.ar-bk-page img { display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; opacity: 0; transition: opacity 0.35s ease; }
.ar-bk-page img.is-loaded { opacity: 1; }
/* the fold down the middle of an open spread */
.ar-bk-page.--left::after, .ar-bk-page.--right::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 9%;
  pointer-events: none;
}
.ar-bk-page.--left::after { right: 0; background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.16)); }
.ar-bk-page.--right::after { left: 0; background: linear-gradient(to left, transparent, rgba(0, 0, 0, 0.16)); }
.ar-bk-holder--single .ar-bk-page::after { display: none; }
.ar-bk-flat { display: flex; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5); animation: arFade 0.35s ease both; }
.ar-bk-flat img { display: block; max-width: none; object-fit: cover; }
`;
