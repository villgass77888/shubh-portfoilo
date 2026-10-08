import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { ArchiveImage } from '../../../../data/archive';
import { avifSet } from '../../../../data/archive';
import { LayerRoot } from './layers';
import { useEscape } from './bits';

export type Slide = {
  image: ArchiveImage;
  caption: string;
  /** Set when the slide belongs to a carousel: drives the dots */
  group?: { index: number; count: number };
};

type Props = {
  slides: Slide[];
  start: number;
  title: string;
  onClose: () => void;
  /** Flyers: click or pinch to zoom up to 2.5×, drag to pan */
  zoom?: boolean;
  /** Emailers: one long image at its native width, scrolled */
  tall?: boolean;
};

const MAX_ZOOM = 2.5;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * The archive's lightbox. Same dark stage, round buttons and dots as the site's SMM lightbox,
 * with what the archive needs on top: carousel groups, zoom + pan, and a tall scrolling mode.
 * Arrow keys and swipe step through the slides; ESC closes.
 */
export default function Lightbox({ slides, start, title, onClose, zoom = false, tall = false }: Props) {
  const layer = useContext(LayerRoot);
  const total = slides.length;
  const [index, setIndex] = useState(() => clamp(start, 0, Math.max(0, total - 1)));
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; view: typeof view; dist: number; moved: number; onImage: boolean } | null>(null);

  const go = useCallback((dir: number) => setIndex((i) => (i + dir + total) % total), [total]);
  useEscape(onClose);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go]);

  useEffect(() => setView({ s: 1, x: 0, y: 0 }), [index]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slide = slides[index];
  const image = slide?.image;
  const ar = image ? image.w / image.h : 1;
  const pad = stage.w < 700 ? 16 : 72;
  const fitW = image ? Math.max(1, Math.min(stage.w - pad * 2, (stage.h - 16) * ar, image.w)) : 1;
  const fitH = fitW / ar;

  /** Keep the image from being dragged off the stage */
  const bound = useCallback(
    (v: { s: number; x: number; y: number }) => {
      const mx = Math.max(0, (fitW * v.s - stage.w) / 2 + 24);
      const my = Math.max(0, (fitH * v.s - stage.h) / 2 + 24);
      return { s: v.s, x: v.s <= 1 ? 0 : clamp(v.x, -mx, mx), y: v.s <= 1 ? 0 : clamp(v.y, -my, my) };
    },
    [fitW, fitH, stage.w, stage.h],
  );

  /** Point relative to the centre of the stage */
  const fromCentre = (clientX: number, clientY: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
  };

  /** Zoom to scale `s`, keeping the point under the pointer where it is */
  const zoomAt = useCallback(
    (s: number, clientX: number, clientY: number) => {
      const v = viewRef.current;
      const p = fromCentre(clientX, clientY);
      const next = clamp(s, 1, MAX_ZOOM);
      const k = next / v.s;
      setView(bound({ s: next, x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k }));
    },
    [bound],
  );

  // wheel zoom (needs a non-passive listener to stop the page behind)
  useEffect(() => {
    const el = stageRef.current;
    if (!el || tall) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!zoom) return;
      zoomAt(viewRef.current.s * (e.deltaY < 0 ? 1.18 : 0.85), e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, tall, zoomAt]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (tall || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    gesture.current = {
      x: e.clientX,
      y: e.clientY,
      view: viewRef.current,
      dist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0,
      moved: 0,
      onImage: !!(e.target as HTMLElement).closest('.ar-lb-frame'),
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && zoom && g.dist > 0) {
      // pinch
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      g.moved = 99;
      setDragging(true);
      setView(bound({ ...g.view, s: clamp(g.view.s * (d / g.dist), 1, MAX_ZOOM) }));
      return;
    }
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    g.moved = Math.max(g.moved, Math.hypot(dx, dy));
    if (g.view.s > 1 && g.moved > 4) {
      setDragging(true);
      setView(bound({ s: g.view.s, x: g.view.x + dx, y: g.view.y + dy }));
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (!g || pointers.current.size) return;
    gesture.current = null;
    setDragging(false);
    const dx = e.clientX - g.x;
    if (g.moved < 6) {
      // a click: zoom in / out on the image, close on the empty stage
      if (!g.onImage) onClose();
      else if (zoom) {
        if (viewRef.current.s > 1) setView({ s: 1, x: 0, y: 0 });
        else zoomAt(MAX_ZOOM, e.clientX, e.clientY);
      }
      return;
    }
    if (g.view.s <= 1 && viewRef.current.s <= 1 && Math.abs(dx) > 48 && total > 1) go(dx < 0 ? 1 : -1);
  };

  if (!layer || !slide || !image) return null;

  const zoomed = view.s > 1.01;
  // ask for a sharper file once zoomed in
  const sizes = `${Math.ceil(fitW * (zoomed ? MAX_ZOOM : 1))}px`;
  const g = slide.group;

  return createPortal(
    <div className={`ar-lb${tall ? ' ar-lb--tall' : ''}`} data-ar-modal role="dialog" aria-modal="true" aria-label={`${title} — larger view`}>
      <div className="ar-lb-bar">
        <div className="ar-lb-id">
          <b>{title}</b>
          <span aria-live="polite">
            {slide.caption}
            {total > 1 ? ` ✦ ${index + 1} / ${total}` : ''}
          </span>
        </div>
        {zoom && <span className="ar-lb-hint">{zoomed ? 'DRAG TO PAN ✦ CLICK TO RESET' : 'CLICK OR PINCH TO ZOOM'}</span>}
        <button ref={closeRef} type="button" className="ar-lb-btn" data-cursor="CLOSE" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      {tall ? (
        <div
          className="ar-lb-scroll"
          data-lenis-prevent
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <picture key={image.src} className="ar-lb-long" style={{ aspectRatio: `${image.w} / ${image.h}`, backgroundImage: `url(${image.lqip})` }}>
            <source type="image/avif" srcSet={avifSet(image.srcset)} sizes="(max-width: 760px) 94vw, 720px" />
            <img src={image.src} srcSet={image.srcset} sizes="(max-width: 760px) 94vw, 720px" alt={slide.caption} width={image.w} height={image.h} decoding="async" draggable={false} />
          </picture>
        </div>
      ) : (
        <div
          ref={stageRef}
          className={`ar-lb-stage${dragging ? ' is-drag' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
            gesture.current = null;
            setDragging(false);
          }}
        >
          {stage.w > 0 && (
            <div
              className="ar-lb-frame"
              data-cursor={zoom ? (zoomed ? 'DRAG' : 'ZOOM') : undefined}
              style={{
                width: fitW,
                height: fitH,
                transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`,
                backgroundImage: `url(${image.lqip})`,
                borderRadius: image.type === 'story' || image.type === 'reel-cover' ? 14 : 6,
              }}
            >
              <picture key={image.src}>
                <source type="image/avif" srcSet={avifSet(image.srcset)} sizes={sizes} />
                <img src={image.src} srcSet={image.srcset} sizes={sizes} alt={`${title} — ${slide.caption}`} decoding="async" draggable={false} />
              </picture>
            </div>
          )}
          {total > 1 && (
            <>
              <button type="button" className="ar-lb-btn ar-lb-prev" data-cursor="PREV" onClick={() => go(-1)} aria-label="Previous">
                ←
              </button>
              <button type="button" className="ar-lb-btn ar-lb-next" data-cursor="NEXT" onClick={() => go(1)} aria-label="Next">
                →
              </button>
            </>
          )}
        </div>
      )}

      {/* carousel dots: the slides of the set this creative belongs to */}
      <div className="ar-lb-dots">
        {g &&
          g.count > 1 &&
          Array.from({ length: g.count }, (_, k) => (
            <button
              key={k}
              type="button"
              className={`ar-lb-dot${k === g.index ? ' is-on' : ''}`}
              onClick={() => setIndex(index - g.index + k)}
              aria-label={`Slide ${k + 1} of ${g.count}`}
              aria-current={k === g.index ? 'true' : undefined}
            >
              <i />
            </button>
          ))}
      </div>
    </div>,
    layer,
  );
}

export const lightboxCss = `
.ar-lb {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  color: #F4F1EA;
  background: rgba(10, 10, 10, 0.95);
  touch-action: none;
  overscroll-behavior: contain;
  animation: arFade 0.25s ease both;
}
@keyframes arFade { from { opacity: 0; } to { opacity: 1; } }
.ar-lb-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: clamp(0.75rem, 2vh, 1.25rem) clamp(1rem, 3vw, 2rem);
}
.ar-lb-id { min-width: 0; }
.ar-lb-id b {
  display: block;
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: clamp(0.85rem, 1.4vw, 1.1rem);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.ar-lb-id span, .ar-lb-hint {
  font-family: var(--font-meta);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.65;
}
.ar-lb-id span { display: block; margin-top: 2px; }
.ar-lb-hint { margin-left: auto; white-space: nowrap; }
.ar-lb-btn {
  width: 44px;
  height: 44px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid rgba(244, 241, 234, 0.5);
  background: rgba(20, 20, 20, 0.7);
  color: #F4F1EA;
  font-size: 1.1rem;
  line-height: 1;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.25s var(--ease-bounce);
}
.ar-lb-btn:hover, .ar-lb-btn:focus-visible { background: #F4F1EA; color: #0D0D0D; }
.ar-lb-btn:focus-visible { outline: 2px solid var(--acid); outline-offset: 3px; }
.ar-lb-stage {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ar-lb-frame {
  flex: none;
  overflow: hidden;
  background-size: cover;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  transition: transform 0.4s var(--ease-enter);
  will-change: transform;
  user-select: none;
  -webkit-user-select: none;
}
.ar-lb-stage.is-drag .ar-lb-frame { transition: none; }
.ar-lb-frame picture, .ar-lb-frame img { display: block; width: 100%; height: 100%; max-width: none; }
.ar-lb-frame img { object-fit: cover; animation: arFade 0.35s ease both; }
.ar-lb-prev, .ar-lb-next { position: absolute; top: 50%; margin-top: -22px; }
.ar-lb-prev { left: clamp(0.5rem, 2vw, 1.5rem); }
.ar-lb-next { right: clamp(0.5rem, 2vw, 1.5rem); }
.ar-lb-dots {
  flex: none;
  min-height: clamp(2.4rem, 7vh, 3.6rem);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 0 1rem;
}
.ar-lb-dot { width: 18px; height: 24px; display: flex; align-items: center; justify-content: center; }
.ar-lb-dot i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(244, 241, 234, 0.4);
  transition: transform 0.25s ease, background-color 0.25s ease;
}
.ar-lb-dot.is-on i { background: #0095f6; transform: scale(1.25); }

/* tall mode: the full-length emailer, scrolled */
.ar-lb--tall { touch-action: auto; }
.ar-lb-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.5rem 3vw 3rem;
}
.ar-lb-long {
  display: block;
  width: min(720px, 100%);
  margin: 0 auto;
  background-size: cover;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
}
.ar-lb-long img { display: block; width: 100%; height: auto; }
.ar-lb--tall .ar-lb-dots { display: none; }
@media (max-width: 700px) {
  .ar-lb-hint { display: none; }
  .ar-lb-prev, .ar-lb-next { top: auto; bottom: 0.5rem; }
}
`;
