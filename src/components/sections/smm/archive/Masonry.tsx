import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ArchiveImage } from '../../../../data/archive';
import { Pic, useReveal } from './bits';

export type MasonryItem = {
  key: string;
  /** One image, or the slides of a carousel (cover first) */
  images: ArchiveImage[];
  /** Take the full width of the grid (wide flyers) */
  span?: boolean;
  /** Filtered out: the tile shrinks away, the rest glide into place */
  hidden?: boolean;
  /** Small caption strip under the image */
  label?: string;
  alt: string;
};

type Props = {
  items: MasonryItem[];
  columnsFor: (width: number) => number;
  gap: number;
  /** `sizes` for a one-column-wide tile */
  sizes: string;
  onOpen: (key: string) => void;
};

type Box = { x: number; y: number; w: number; h: number };

/** Extra room a carousel tile keeps top-right for the two sheets stacked behind its cover */
const STACK = 12;
const LABEL = 30;

/**
 * A real masonry: every tile goes into the currently shortest column, in data order.
 * Heights come from the manifest, so nothing moves while images load; positions are plain
 * transforms, so a filter change or a resize glides instead of jumping.
 */
export default function Masonry({ items, columnsFor, gap, sizes, onOpen }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const last = useRef(new Map<string, Box>());
  const reveal = useReveal();

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => setWidth(el.clientWidth), 120);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  // positions animate only after the first layout has been painted
  useEffect(() => {
    if (!width || ready) return;
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [width, ready]);

  const cols = Math.max(1, columnsFor(width));
  const colW = (width - gap * (cols - 1)) / cols;

  const layout = useMemo(() => {
    const boxes = new Map<string, Box>();
    if (!width) return { boxes, height: 0 };
    const heights: number[] = new Array(cols).fill(0);
    for (const item of items) {
      if (item.hidden) continue;
      const img = item.images[0];
      const extra = (item.images.length > 1 ? STACK : 0) + (item.label ? LABEL : 0);
      if (item.span && cols > 1) {
        const y = Math.max(...heights);
        const h = (width * img.h) / img.w + extra;
        boxes.set(item.key, { x: 0, y, w: width, h });
        heights.fill(y + h + gap);
        continue;
      }
      let c = 0;
      for (let i = 1; i < cols; i++) if (heights[i] < heights[c] - 0.5) c = i;
      const imgW = colW - (item.images.length > 1 ? STACK : 0);
      const h = (imgW * img.h) / img.w + extra;
      boxes.set(item.key, { x: c * (colW + gap), y: heights[c], w: colW, h });
      heights[c] += h + gap;
    }
    return { boxes, height: Math.max(0, Math.max(...heights) - gap) };
  }, [items, width, cols, colW, gap]);

  layout.boxes.forEach((box, key) => last.current.set(key, box));

  return (
    <div ref={rootRef} className={`ar-mas${ready ? ' is-ready' : ''}`} style={{ height: layout.height || undefined }}>
      {width > 0 &&
        items.map((item, i) => {
          const box = layout.boxes.get(item.key) ?? last.current.get(item.key);
          if (!box) return null;
          return (
            <div
              key={item.key}
              className={`ar-mt-wrap${item.hidden ? ' is-out' : ''}`}
              style={{ width: box.w, height: box.h, transform: `translate3d(${box.x}px, ${box.y}px, 0)` }}
            >
              <Tile item={item} sizes={item.span ? '(max-width: 1400px) 94vw, 1400px' : sizes} eager={i < cols * 2} onOpen={onOpen} reveal={reveal} odd={i % 2 === 1} />
            </div>
          );
        })}
    </div>
  );
}

type TileProps = {
  item: MasonryItem;
  sizes: string;
  eager: boolean;
  odd: boolean;
  onOpen: (key: string) => void;
  reveal: (el: HTMLElement | null) => void;
};

function Tile({ item, sizes, eager, odd, onOpen, reveal }: TileProps) {
  const n = item.images.length;
  const [slide, setSlide] = useState(0);
  // the other slides are only fetched once the tile has been hovered
  const [armed, setArmed] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const start = () => {
    if (n < 2) return;
    setArmed(true);
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => setSlide((s) => (s + 1) % n), 1400);
  };
  const stop = () => {
    window.clearInterval(timer.current);
    setSlide(0);
  };

  return (
    <button
      ref={reveal}
      type="button"
      className={`ar-mt${n > 1 ? ' ar-mt--stack' : ''}${odd ? ' ar-mt--odd' : ''}`}
      data-cursor="VIEW"
      tabIndex={item.hidden ? -1 : 0}
      aria-hidden={item.hidden || undefined}
      aria-label={`Open ${item.alt}${n > 1 ? `, ${n} slides` : ''}`}
      onClick={() => onOpen(item.key)}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') start();
      }}
      onPointerLeave={stop}
    >
      <span className="ar-mt-lift">
        {n > 1 && (
          <>
            <i className="ar-mt-sheet ar-mt-sheet--2" aria-hidden="true" />
            <i className="ar-mt-sheet" aria-hidden="true" />
          </>
        )}
        <span className="ar-mt-img">
          <Pic image={item.images[0]} sizes={sizes} eager={eager} alt="" />
          {armed &&
            item.images.slice(1).map((img, k) => (
              <span key={img.src} className="ar-mt-layer" style={{ opacity: slide === k + 1 ? 1 : 0 }}>
                <Pic image={img} sizes={sizes} fill eager alt="" />
              </span>
            ))}
          {n > 1 && (
            <span className="ar-mt-badge" aria-hidden="true">
              {slide + 1} / {n}
            </span>
          )}
        </span>
        {item.label && <span className="ar-mt-label">{item.label}</span>}
      </span>
    </button>
  );
}

export const masonryCss = `
/* clip (not hidden): filtered-out tiles keep their old spot below the grid and must not
   stretch the page, while hover lifts and shadows still get room around the edge */
.ar-mas { position: relative; width: 100%; overflow: clip; overflow-clip-margin: 64px; }
.ar-mt-wrap {
  position: absolute;
  left: 0;
  top: 0;
  transition: opacity 0.35s ease, visibility 0s linear 0s;
}
.ar-mas.is-ready .ar-mt-wrap { transition: transform 0.75s var(--ease-enter), width 0.75s var(--ease-enter), opacity 0.35s ease, visibility 0s linear 0s; }
.ar-mt-wrap.is-out {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.3s ease, visibility 0s linear 0.3s !important;
}
.ar-mt-wrap.is-out .ar-mt-lift { transform: scale(0.82); }

.ar-mt {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  text-align: left;
  color: var(--ink);
  outline: none;
  /* entrance: rises in with a slight turn, per batch */
  opacity: 0;
  transform: translateY(40px) rotate(-2deg);
  transition: opacity 0.5s ease var(--rd, 0ms), transform 0.7s var(--ease-enter) var(--rd, 0ms);
}
.ar-mt--odd { transform: translateY(40px) rotate(2deg); }
.ar-mt.is-in { opacity: 1; transform: none; }
.ar-mt-lift {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  transition: transform 0.4s var(--ease-enter);
}
.ar-mt-img {
  position: relative;
  display: block;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  border: 1.5px solid var(--ink);
  border-radius: 10px;
  background: #ddd8cc;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
  transition: box-shadow 0.4s ease;
}
.ar-mt-img > .ar-pic { width: 100%; height: 100%; aspect-ratio: auto !important; }
.ar-mt-layer { position: absolute; inset: 0; transition: opacity 0.6s ease; }
@media (hover: hover) {
  .ar-mt:hover .ar-mt-lift, .ar-mt:focus-visible .ar-mt-lift { transform: translateY(-6px) scale(1.02); }
  .ar-mt:hover .ar-mt-img, .ar-mt:focus-visible .ar-mt-img { box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28); }
}
.ar-mt:focus-visible .ar-mt-img { outline: 3px solid var(--signal); outline-offset: 3px; }

/* carousel: two sheets tucked behind the cover, top-right */
.ar-mt--stack .ar-mt-lift { padding: ${STACK}px ${STACK}px 0 0; }
.ar-mt-sheet {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 6px;
  bottom: 6px;
  border: 1.5px solid var(--ink);
  border-radius: 10px;
  background: #E9E4D8;
  transition: transform 0.4s var(--ease-enter);
}
.ar-mt-sheet--2 { left: 12px; right: 0; top: 0; bottom: 12px; background: #DAD4C6; }
@media (hover: hover) {
  .ar-mt--stack:hover .ar-mt-sheet { transform: translate(2px, -2px) rotate(1.2deg); }
  .ar-mt--stack:hover .ar-mt-sheet--2 { transform: translate(4px, -4px) rotate(2.4deg); }
}
.ar-mt-badge {
  position: absolute;
  top: 0.55rem;
  left: 0.55rem;
  padding: 0.28em 0.6em;
  font-family: var(--font-meta);
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  line-height: 1;
  color: var(--ink);
  background: var(--acid);
  border: 1.5px solid var(--ink);
  border-radius: 5px;
  box-shadow: 2px 2px 0 var(--ink);
}
.ar-mt-label {
  flex: none;
  height: ${LABEL}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-family: var(--font-meta);
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
}
@media (prefers-reduced-motion: reduce) {
  .ar-mt { opacity: 1; transform: none; transition: none; }
  .ar-mas.is-ready .ar-mt-wrap { transition: opacity 0.2s ease; }
}
`;
