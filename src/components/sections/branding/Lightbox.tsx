import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { MoodboardFrame } from '../../../data/portfolio';

interface LightboxProps {
  brandName: string;
  /** Frames in entrance order */
  frames: MoodboardFrame[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}

const btn: CSSProperties = {
  fontFamily: 'var(--font-meta)',
  fontSize: '0.7rem',
  letterSpacing: '0.12em',
  color: '#F4F1EA',
  border: '1px solid rgba(244,241,234,0.45)',
  background: 'rgba(11,15,46,0.6)',
  padding: '0.7rem 1rem',
  minWidth: 44,
  minHeight: 44,
  cursor: 'pointer',
};

/**
 * Lightbox for one brand's moodboard frames.
 * Arrow keys / buttons step through the frames in entrance order,
 * ESC closes, focus is trapped while open and restored on close.
 */
export default function Lightbox({ brandName, frames, index, onIndexChange, onClose }: LightboxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [natural, setNatural] = useState<Record<string, number>>({});

  const count = frames.length;
  const frame = frames[index];

  const step = useCallback(
    (dir: number) => onIndexChange((index + dir + count) % count),
    [index, count, onIndexChange],
  );

  // Lock page scroll + restore focus to the opener on close
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      root.style.overflow = prevOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  // Preload the neighbours so stepping is instant
  useEffect(() => {
    [frames[(index + 1) % count], frames[(index - 1 + count) % count]].forEach((f) => {
      if (!f) return;
      const img = new Image();
      img.src = f.src;
    });
  }, [index, count, frames]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'Tab') {
      const focusables = rootRef.current?.querySelectorAll<HTMLElement>('button');
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !rootRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    } else if ([' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      // keep the page behind from scrolling (buttons still activate on Space via click)
      if (e.key !== ' ' || (e.target as HTMLElement).tagName !== 'BUTTON') e.preventDefault();
    }
  };

  if (!frame) return null;

  const ratio = frame.w / frame.h;
  const nat = natural[frame.src];
  // Fit the viewport, but never blow a small crop up beyond 2x its real pixels
  const width = `min(92vw, ${(74 * ratio).toFixed(3)}vh${nat ? `, ${nat * 2}px` : ''})`;
  const label = frame.label ?? 'FRAME';

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${brandName} — ${label}`}
      data-lenis-prevent
      className="bk-lightbox"
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-lightbox)' as unknown as number,
        background: 'rgba(5,7,24,0.94)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '4.5rem 4vw 1.5rem',
        overscrollBehavior: 'contain',
        touchAction: 'none',
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        data-cursor="CLOSE"
        aria-label="Close"
        style={{ ...btn, position: 'absolute', top: '1rem', right: '4vw' }}
      >
        CLOSE ✕
      </button>

      <img
        key={frame.src}
        className="bk-lightbox-img"
        src={frame.src}
        alt={`${brandName} brand identity — ${label.toLowerCase()}`}
        decoding="async"
        onLoad={(e) => {
          const w = e.currentTarget.naturalWidth;
          if (w) setNatural((prev) => (prev[frame.src] === w ? prev : { ...prev, [frame.src]: w }));
        }}
        style={{
          width,
          aspectRatio: `${frame.w} / ${frame.h}`,
          height: 'auto',
          display: 'block',
          filter: 'drop-shadow(0 24px 60px rgba(0,0,0,0.6))',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          width: 'min(92vw, 720px)',
        }}
      >
        <button type="button" onClick={() => step(-1)} data-cursor="PREV" aria-label="Previous frame" style={btn}>
          ← PREV
        </button>
        <div
          aria-live="polite"
          style={{
            fontFamily: 'var(--font-meta)',
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            color: '#F4F1EA',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: 'var(--signal)' }}>
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          <br />
          {brandName.toUpperCase()} ✦ {label}
        </div>
        <button type="button" onClick={() => step(1)} data-cursor="NEXT" aria-label="Next frame" style={btn}>
          NEXT →
        </button>
      </div>
    </div>,
    document.body,
  );
}
