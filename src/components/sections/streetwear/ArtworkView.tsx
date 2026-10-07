import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import type { StreetwearDesign } from '../../../data/streetwear';

type Props = {
  design: StreetwearDesign;
  /** Click point inside the stage, in % — the sheet grows from here */
  origin: { x: number; y: number };
  compact: boolean;
  reduced: boolean;
  onClose: () => void;
};

type Sheet = { key: string; label: string; src: string; from: 'left' | 'right' | 'top' };

function sheetsOf(d: StreetwearDesign): Sheet[] {
  if (d.art.front && d.art.back) {
    return [
      { key: 'front', label: 'FRONT ARTWORK', src: d.art.front, from: 'left' },
      { key: 'back', label: 'BACK ARTWORK', src: d.art.back, from: 'right' },
    ];
  }
  const only = d.art.single ?? d.art.front ?? d.art.back;
  return only ? [{ key: 'art', label: 'ARTWORK', src: only, from: 'top' }] : [];
}

/**
 * The artwork behind a design, on a white or black sheet that grows out of the click point
 * and covers the model stage (a full-screen sheet on phones).
 */
export default function ArtworkView({ design, origin, compact, reduced, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const [bg, setBg] = useState(design.artBg);
  const [zoom, setZoom] = useState(false);
  const sheets = sheetsOf(design);

  // a new design brings its own sheet colour
  useEffect(() => setBg(design.artBg), [design.id, design.artBg]);

  // open
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const restore = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    if (!reduced) {
      if (compact) gsap.fromTo(root, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' });
      else
        gsap.fromTo(
          root,
          { clipPath: `circle(0% at ${origin.x}% ${origin.y}%)` },
          { clipPath: `circle(150% at ${origin.x}% ${origin.y}%)`, duration: 0.7, ease: 'expo.inOut' },
        );
    }
    return () => restore?.focus?.({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    const root = rootRef.current;
    if (closing.current) return;
    if (!root || reduced) return onClose();
    closing.current = true;
    if (compact) gsap.to(root, { yPercent: 100, duration: 0.45, ease: 'power3.in', onComplete: onClose });
    else gsap.to(root, { clipPath: 'circle(0% at 94% 7%)', duration: 0.5, ease: 'power3.inOut', onComplete: onClose });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (zoom) setZoom(false);
        else close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  return (
    <div
      ref={rootRef}
      className={`sw-art sw-art--${bg}${compact ? ' sw-art--sheet' : ''}`}
      role="dialog"
      aria-label={`${design.name} artwork`}
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('sw-art-sheets')) close();
      }}
    >
      <div className="sw-art-bar">
        <span className="sw-art-title">{design.name}</span>
        <span className="sw-art-controls">
          <button type="button" className="sticker sticker--chrome" data-cursor="FLIP" onClick={() => setBg((b) => (b === 'white' ? 'black' : 'white'))}>
            BG ◐
          </button>
          <button ref={closeRef} type="button" className="sticker sticker--acid" data-cursor="CLOSE" onClick={close}>
            ✕ BACK TO MODEL
          </button>
        </span>
      </div>

      {/* keyed by design: selecting another card while open slides the new sheets in */}
      <div key={design.id} className={`sw-art-sheets sw-art-sheets--${sheets.length}`}>
        {sheets.map((s, i) => (
          <figure key={s.key} className={`sw-sheet sw-sheet--${s.from} sw-sheet--${s.key}`} style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
            <button type="button" className="sw-sheet-btn" data-cursor="VIEW" aria-label={`View ${s.label.toLowerCase()} larger`} onClick={() => setZoom(true)}>
              <img src={s.src} alt={`${design.name} — ${s.label.toLowerCase()}`} draggable={false} />
            </button>
            <figcaption>{s.label}</figcaption>
          </figure>
        ))}
      </div>

      {/* Larger look: a panel at 75% of the screen, centred; front and back share it, top and bottom */}
      {zoom &&
        createPortal(
          <div className="sw-zoom" role="dialog" aria-label={`${design.name} artwork, larger`} onClick={() => setZoom(false)} data-lenis-prevent>
            <div className={`sw-zoom-panel sw-art--${bg} sw-zoom-panel--${sheets.length}`}>
              {sheets.map((s) => (
                <figure key={s.key} className={`sw-zoom-item sw-zoom-item--${s.key}`}>
                  <img src={s.src} alt={`${design.name} — ${s.label.toLowerCase()}`} draggable={false} />
                  <figcaption>{s.label}</figcaption>
                </figure>
              ))}
              <span className="sw-zoom-label">CLICK OR ESC TO CLOSE</span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
