import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import AlphaVideo from '../../global/AlphaVideo';
import type { AlphaVideoHandle } from '../../global/AlphaVideo';
import { avifSet, honeyVideo } from '../../../data/packaging';
import type { PackImage, PackProject } from '../../../data/packaging';
import PackInfo from './PackInfo';

type Props = {
  project: PackProject;
  /** Gallery item to open on */
  start: string;
  /** Click point: the cream sheet grows out of it */
  origin: { x: number; y: number } | null;
  onClose: () => void;
};

type Lenis = { stop: () => void; start: () => void };
const lenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;
const MAX_ZOOM = 3;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function Picture({ image, sizes, alt, className }: { image: PackImage; sizes: string; alt: string; className?: string }) {
  return (
    <picture className={className}>
      {image.srcset && <source type="image/avif" srcSet={avifSet(image.srcset)} sizes={sizes} />}
      <img src={image.src} srcSet={image.srcset} sizes={image.srcset ? sizes : undefined} alt={alt} decoding="async" draggable={false} />
    </picture>
  );
}

/**
 * Full-screen packaging viewer: the big media on the left with a filmstrip, the project's
 * story on the right. Flat artwork (labels, dielines) zooms and pans; the Croppd Honey jar
 * can replay its two videos. Close with the sticker, ESC or the browser's back button.
 */
export default function PackViewer({ project, start, origin, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const items = project.gallery;
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((m) => m.key === start)));
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  // the jar's two videos, played back to back
  const [replay, setReplay] = useState<0 | 1 | 2>(0);
  const v1 = useRef<AlphaVideoHandle>(null);
  const v2 = useRef<AlphaVideoHandle>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; view: typeof view; dist: number; moved: number; onMedia: boolean } | null>(null);
  const closing = useRef(false);

  const item = items[index];
  const total = items.length;
  const go = useCallback((dir: number) => setIndex((i) => (i + dir + total) % total), [total]);
  const canReplay = project.slug === 'croppd-honey' && item?.key === 'jar' && honeyVideo.available;

  // ── open: hold the page, give this view its own history entry, grow the sheet from the click ──
  useLayoutEffect(() => {
    const root = rootRef.current;
    lenis()?.stop();
    const hash = `#packaging/${project.slug}`;
    if (window.location.hash !== hash) history.pushState({ pack: project.slug }, '', hash);
    const x = origin ? `${origin.x}px` : '50%';
    const y = origin ? `${origin.y}px` : '50%';
    const tl = gsap.timeline({ onComplete: () => gsap.set(root, { clearProps: 'clipPath' }) });
    if (!reduced) {
      tl.fromTo(root, { clipPath: `circle(0% at ${x} ${y})` }, { clipPath: `circle(150% at ${x} ${y})`, duration: 0.7, ease: 'expo.inOut' }, 0).fromTo(
        '.pkv-media',
        { scale: 0.86, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'expo.out' },
        0.3,
      );
    }
    const t = window.setTimeout(() => setEntered(true), reduced ? 0 : 380);
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      tl.kill();
      window.clearTimeout(t);
      lenis()?.start();
      previous?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** The sheet shrinks back to where it came from, then the page is given back */
  const finish = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const root = rootRef.current;
    if (!root || reduced) return onClose();
    const x = origin ? `${origin.x}px` : '50%';
    const y = origin ? `${origin.y}px` : '50%';
    gsap.fromTo(root, { clipPath: `circle(150% at ${x} ${y})` }, { clipPath: `circle(0% at ${x} ${y})`, duration: 0.5, ease: 'expo.in', onComplete: onClose });
  }, [onClose, origin, reduced]);

  const close = useCallback(() => {
    // leave through history when this view pushed an entry, so Back and Close agree
    if (history.state && history.state.pack) history.back();
    else {
      if (window.location.hash.startsWith('#packaging')) history.replaceState(null, '', window.location.pathname + window.location.search);
      finish();
    }
  }, [finish]);

  useEffect(() => {
    const onPop = () => {
      if (!window.location.hash.startsWith('#packaging')) finish();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab' && rootRef.current) {
        const list = Array.from(rootRef.current.querySelectorAll<HTMLElement>('button')).filter((el) => el.offsetParent !== null);
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('popstate', onPop);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('keydown', onKey);
    };
  }, [close, finish, go]);

  useEffect(() => {
    setView({ s: 1, x: 0, y: 0 });
    setReplay(0);
  }, [index]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── fitted size of the current item ──
  const image = item.image;
  const ar = image.w / image.h;
  const padX = stage.w < 700 ? 12 : 40;
  const fitW = Math.max(1, Math.min(stage.w - padX * 2, (stage.h - 24) * ar));
  const fitH = fitW / ar;
  const zoomable = !!item.flat;
  const zoomed = view.s > 1.01;

  const bound = useCallback(
    (v: { s: number; x: number; y: number }) => {
      const mx = Math.max(0, (fitW * v.s - stage.w) / 2 + 30);
      const my = Math.max(0, (fitH * v.s - stage.h) / 2 + 30);
      return { s: v.s, x: v.s <= 1 ? 0 : clamp(v.x, -mx, mx), y: v.s <= 1 ? 0 : clamp(v.y, -my, my) };
    },
    [fitW, fitH, stage.w, stage.h],
  );
  const zoomAt = useCallback(
    (s: number, clientX: number, clientY: number) => {
      const r = stageRef.current!.getBoundingClientRect();
      const p = { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
      const v = viewRef.current;
      const next = clamp(s, 1, MAX_ZOOM);
      const k = next / v.s;
      setView(bound({ s: next, x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k }));
    },
    [bound],
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (zoomable) zoomAt(viewRef.current.s * (e.deltaY < 0 ? 1.2 : 0.83), e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomable, zoomAt]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const onMedia = !!(e.target as HTMLElement).closest('.pkv-media');
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    gesture.current = { x: e.clientX, y: e.clientY, view: viewRef.current, dist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0, moved: 0, onMedia };
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && zoomable && g.dist > 0) {
      g.moved = 99;
      setDragging(true);
      setView(bound({ ...g.view, s: clamp(g.view.s * (Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) / g.dist), 1, MAX_ZOOM) }));
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
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (!g || pointers.current.size) return;
    gesture.current = null;
    setDragging(false);
    const dx = e.clientX - g.x;
    if (g.moved < 6) {
      if (zoomable && g.onMedia) {
        if (viewRef.current.s > 1) setView({ s: 1, x: 0, y: 0 });
        else zoomAt(MAX_ZOOM, e.clientX, e.clientY);
      }
      return;
    }
    if (g.view.s <= 1 && viewRef.current.s <= 1 && Math.abs(dx) > 48 && total > 1) go(dx < 0 ? 1 : -1);
  };

  // ── ▶ REPLAY: video 1, then video 2, then back to the still ──
  useEffect(() => {
    if (replay === 1) {
      v1.current?.seek(0);
      v1.current?.play().catch(() => setReplay(0));
    } else if (replay === 2) {
      v2.current?.seek(0);
      v2.current?.play().catch(() => setReplay(0));
    }
  }, [replay]);

  const sizes = `${Math.ceil(fitW * (zoomed ? MAX_ZOOM : 1))}px`;

  return createPortal(
    <div ref={rootRef} className="pkv" role="dialog" aria-modal="true" aria-label={`${project.name} packaging, full screen`} data-lenis-prevent>
      <div className="pkv-paper" aria-hidden="true" />
      <button ref={closeRef} type="button" className="sticker sticker--acid pkv-close" data-cursor="CLOSE" onClick={close}>
        ✕ CLOSE
      </button>

      <div className="pkv-left">
        <div
          ref={stageRef}
          className={`pkv-stage${dragging ? ' is-drag' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
            gesture.current = null;
            setDragging(false);
          }}
        >
          {stage.w > 0 && (
            <div
              key={item.key}
              className={`pkv-media${item.flat ? ' pkv-media--flat' : ''}${item.cutout ? ' pkv-media--cutout' : ''}`}
              data-cursor={zoomable ? (zoomed ? 'DRAG' : 'ZOOM') : undefined}
              style={{ width: fitW, height: fitH, transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`, backgroundImage: image.lqip ? `url(${image.lqip})` : undefined }}
            >
              <Picture image={image} sizes={sizes} alt={`${project.name} — ${item.label}`} className={replay ? 'is-hidden' : undefined} />
              {canReplay && replay === 1 && <AlphaVideo ref={v1} src={honeyVideo.wrap.src} playbackRate={honeyVideo.wrap.duration / honeyVideo.beat} preload="auto" onEnded={() => setReplay(2)} className="pkv-video pkv-video--wrap" />}
              {canReplay && replay === 2 && <AlphaVideo ref={v2} src={honeyVideo.land.src} playbackRate={honeyVideo.land.duration / honeyVideo.beat} preload="auto" onEnded={() => setReplay(0)} className="pkv-video pkv-video--land" />}
            </div>
          )}
          {canReplay && !replay && (
            <button type="button" className="sticker sticker--acid pkv-replay" onClick={() => setReplay(1)}>
              ▶ REPLAY
            </button>
          )}
          {zoomable && <span className="pkv-hint">{zoomed ? 'DRAG TO PAN ✦ CLICK TO RESET' : 'CLICK OR PINCH TO ZOOM'}</span>}
          {total > 1 && (
            <>
              <button type="button" className="pkv-arrow pkv-arrow--prev" data-cursor="PREV" onClick={() => go(-1)} aria-label="Previous image">
                ←
              </button>
              <button type="button" className="pkv-arrow pkv-arrow--next" data-cursor="NEXT" onClick={() => go(1)} aria-label="Next image">
                →
              </button>
            </>
          )}
        </div>

        <div className="pkv-strip" role="tablist" aria-label="Gallery">
          {items.map((m, i) => (
            <button key={m.key} type="button" role="tab" aria-selected={i === index} className={`pkv-thumb${i === index ? ' is-on' : ''}${m.cutout ? ' pkv-thumb--cutout' : ''}`} onClick={() => setIndex(i)} aria-label={m.label}>
              <img src={m.image.srcset ? m.image.srcset.split(',')[0].trim().split(' ')[0] : m.image.src} alt="" loading="lazy" decoding="async" draggable={false} style={{ objectPosition: m.objectPosition }} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="pkv-right" data-lenis-prevent>
        <PackInfo project={project} kicker={`${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')} ✦ ${item.label.toUpperCase()}`} entered={entered} />
      </aside>
    </div>,
    document.body,
  );
}
