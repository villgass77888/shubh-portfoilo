import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { LayerRoot } from './layers';
import { prefersReducedMotion, useEscape } from './bits';

export type StageSize = { w: number; h: number };

type Props = {
  name: string;
  /** What kind of thing is open, e.g. "BROCHURE" / "DOUBLE GATEFOLD" */
  kind: string;
  /** Cover image that flies from the shelf to the centre and back */
  cover: string;
  coverAspect: number;
  /** Where the cover was on screen when it was clicked (null: opened by link) */
  from: DOMRect | null;
  /** Where the cover is on the shelf right now, for the way back */
  shelfRect: () => DOMRect | null;
  /** Size the closed cover takes in the stage, so the flight lands exactly on it */
  coverSize: (stage: StageSize) => StageSize;
  /** Page counter, e.g. "PAGES 4–5 / 24" */
  counter: string;
  /** 0–1 */
  progress: number;
  hint?: string;
  onClose: () => void;
  children: (stage: StageSize, ready: boolean) => ReactNode;
};

/**
 * The frame around every brochure reader: dark scrim over the shelf, name + close on top,
 * counter + progress underneath. The clicked cover flies in to the centre before the reader
 * takes over, and flies back to its place on the shelf when it closes.
 */
export default function ReaderShell({ name, kind, cover, coverAspect, from, shelfRect, coverSize, counter, progress, hint, onClose, children }: Props) {
  const layer = useContext(LayerRoot);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flyRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [stage, setStage] = useState<StageSize>({ w: 0, h: 0 });
  // the reader itself appears once the cover has landed
  const [ready, setReady] = useState(!from || prefersReducedMotion());
  const closing = useRef(false);
  const landed = useRef(false);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(measure, 150);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
    // the shell renders nothing until the overlay's layer element exists
  }, [layer]);

  /** Rect of the closed cover, centred in the stage */
  const centreRect = useCallback(() => {
    const el = stageRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const size = coverSize({ w: r.width, h: r.height });
    return { left: r.left + (r.width - size.w) / 2, top: r.top + (r.height - size.h) / 2, width: size.w, height: size.h };
  }, [coverSize]);

  // fly in
  useLayoutEffect(() => {
    const fly = flyRef.current;
    if (landed.current || !stage.w) return;
    landed.current = true;
    const to = centreRect();
    if (!fly || !from || !to || prefersReducedMotion()) {
      setReady(true);
      return;
    }
    gsap.set(fly, { display: 'block', left: from.left, top: from.top, width: from.width, height: from.height, opacity: 1, rotation: -4 });
    gsap.to(fly, {
      left: to.left,
      top: to.top,
      width: to.width,
      height: to.height,
      rotation: 0,
      duration: 0.75,
      ease: 'expo.inOut',
      onComplete: () => {
        setReady(true);
        gsap.to(fly, { opacity: 0, duration: 0.25, delay: 0.12, onComplete: () => gsap.set(fly, { display: 'none' }) });
      },
    });
  }, [stage.w, from, centreRect]);

  /** Close: the cover flies back to the shelf, then the route steps back */
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const fly = flyRef.current;
    const root = rootRef.current;
    const at = centreRect();
    const to = shelfRect();
    if (!fly || !root || !at || !to || prefersReducedMotion()) {
      onClose();
      return;
    }
    gsap.killTweensOf(fly);
    gsap.set(fly, { display: 'block', left: at.left, top: at.top, width: at.width, height: at.height, opacity: 0, rotation: 0 });
    gsap
      .timeline({ onComplete: onClose })
      .to(fly, { opacity: 1, duration: 0.15 }, 0)
      .to(root.querySelectorAll('.ar-rd-stage > *, .ar-rd-foot, .ar-rd-bar'), { opacity: 0, duration: 0.2 }, 0)
      .to(root.querySelector('.ar-rd-scrim'), { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, 0.1)
      .to(fly, { left: to.left, top: to.top, width: to.width, height: to.height, rotation: -3, duration: 0.6, ease: 'expo.inOut' }, 0.08);
  }, [centreRect, shelfRect, onClose]);

  useEscape(close);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, [layer]);

  if (!layer) return null;

  return createPortal(
    <div ref={rootRef} className={`ar-rd${ready ? ' is-ready' : ''}`} data-ar-modal role="dialog" aria-modal="true" aria-label={`${name} — reader`}>
      <div className="ar-rd-scrim" onClick={close} />
      <div className="ar-rd-bar">
        <div className="ar-rd-name">
          <b>{name}</b>
          <span>{kind}</span>
        </div>
        <button ref={closeRef} type="button" className="ar-stick ar-stick--acid" data-cursor="CLOSE" onClick={close}>
          ✕ CLOSE
        </button>
      </div>
      <div ref={stageRef} className="ar-rd-stage">
        {stage.w > 0 && children(stage, ready)}
      </div>
      <div className="ar-rd-foot">
        <span className="ar-rd-count" aria-live="polite">
          {counter}
        </span>
        <i className="ar-rd-progress" aria-hidden="true">
          <b style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }} />
        </i>
        {hint && <span className="ar-rd-hint">{hint}</span>}
      </div>
      <img ref={flyRef} className="ar-rd-fly" src={cover} alt="" aria-hidden="true" draggable={false} style={{ aspectRatio: String(coverAspect) }} />
    </div>,
    layer,
  );
}

export const readerCss = `
.ar-rd {
  position: absolute;
  inset: 0;
  z-index: 25;
  display: flex;
  flex-direction: column;
  color: #F4F1EA;
  overscroll-behavior: contain;
}
.ar-rd-scrim {
  position: absolute;
  inset: 0;
  background: rgba(12, 12, 12, 0.88);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  animation: arFade 0.4s ease both;
}
.ar-rd-bar, .ar-rd-foot, .ar-rd-stage { position: relative; }
.ar-rd-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: clamp(0.75rem, 2vh, 1.25rem) clamp(1rem, 3vw, 2rem);
  animation: arFade 0.4s ease 0.2s both;
}
.ar-rd-name { min-width: 0; }
.ar-rd-name b {
  display: block;
  font-family: var(--font-heading);
  font-weight: 900;
  font-stretch: 125%;
  font-size: clamp(0.85rem, 1.4vw, 1.15rem);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ar-rd-name span, .ar-rd-count, .ar-rd-hint {
  font-family: var(--font-meta);
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ar-rd-name span { display: block; margin-top: 2px; opacity: 0.6; }
.ar-rd-stage { flex: 1 1 0; min-height: 0; display: flex; align-items: center; justify-content: center; }
.ar-rd-stage > * { opacity: 0; transition: opacity 0.3s ease; }
.ar-rd.is-ready .ar-rd-stage > * { opacity: 1; }
.ar-rd-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1.5rem);
  padding: clamp(0.7rem, 2vh, 1.1rem) clamp(1rem, 3vw, 2rem) clamp(0.9rem, 2.4vh, 1.4rem);
  animation: arFade 0.4s ease 0.3s both;
}
.ar-rd-count { flex: none; min-width: 11em; }
.ar-rd-progress { flex: 1 1 0; height: 2px; background: rgba(244, 241, 234, 0.22); }
.ar-rd-progress b { display: block; height: 100%; background: var(--acid); transform-origin: 0 50%; transition: transform 0.6s var(--ease-enter); }
.ar-rd-hint { flex: none; opacity: 0.55; }
.ar-rd-fly {
  position: fixed;
  z-index: 5;
  display: none;
  max-width: none;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

/* the two halves of the stage that turn the page */
.ar-rd-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  z-index: 4;
  opacity: 0 !important;
  touch-action: pan-y;
}
.ar-rd-zone--prev { left: 0; }
.ar-rd-zone--next { right: 0; }
.ar-rd-zone:focus-visible { opacity: 1 !important; outline: 2px dashed var(--acid); outline-offset: -8px; }

/* stickers used inside the archive (the site's .sticker without its hover rules) */
.ar-stick {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  flex: none;
  padding: 0.55em 0.9em;
  font-family: var(--font-meta);
  font-size: clamp(0.6rem, 0.76vw, 0.72rem);
  letter-spacing: 0.08em;
  line-height: 1;
  white-space: nowrap;
  color: var(--ink);
  border: 2px solid var(--ink);
  border-radius: var(--radius-sticker);
  box-shadow: 3px 3px 0 var(--ink);
  transform: rotate(var(--r, -2deg));
  transition: transform 0.25s var(--ease-bounce), box-shadow 0.25s ease;
}
.ar-stick--acid { background: var(--acid); }
.ar-stick--bone { background: var(--bone); --r: 1.5deg; }
.ar-stick:hover, .ar-stick:focus-visible { transform: rotate(0deg) translate(-1px, -1px) scale(1.04); box-shadow: 5px 5px 0 var(--ink); outline: none; }
.ar-rd .ar-stick { box-shadow: 3px 3px 0 rgba(244, 241, 234, 0.9); }
@media (max-width: 700px) {
  .ar-rd-hint { display: none; }
  .ar-rd-count { min-width: 0; }
}
`;
