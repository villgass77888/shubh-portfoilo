import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { SmmEntry } from '../../../data/portfolio';

export const isStory = (src: string) => /\/story-\d+\./.test(src);

/** "post-03.webp" → "post 3", "story-05.webp" → "story 5" */
export function creativeLabel(src: string): string {
  const m = /\/(post|story)-0*(\d+)\./.exec(src);
  return m ? `${m[1]} ${m[2]}` : 'creative';
}

interface SmmLightboxProps {
  brand: SmmEntry;
  startIndex: number;
  onClose: () => void;
}

const roundBtn: CSSProperties = {
  width: 44,
  height: 44,
  flex: 'none',
  borderRadius: '50%',
  border: '1.5px solid rgba(244,241,234,0.5)',
  backgroundColor: 'rgba(20,20,20,0.7)',
  color: '#F4F1EA',
  fontSize: '1.1rem',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * Carousel of every creative of one brand (posts, then stories).
 * Prev / next, arrow keys, swipe, Instagram-style dots, ESC, focus trap + restore.
 */
export default function SmmLightbox({ brand, startIndex, onClose }: SmmLightboxProps) {
  const items = brand.all;
  const total = items.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(startIndex, 0), Math.max(total - 1, 0)));
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dragX = useRef<number | null>(null);

  const go = useCallback((dir: number) => setIndex((i) => (i + dir + total) % total), [total]);

  // Focus management + keyboard
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [onClose, go]);

  // Nothing scrolls in here, so keep the wheel from moving the page behind
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', stop, { passive: false });
    return () => el.removeEventListener('wheel', stop);
  }, []);

  const onPointerDown = (e: ReactPointerEvent) => {
    dragX.current = e.clientX;
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    if (dragX.current === null) return;
    const dx = e.clientX - dragX.current;
    dragX.current = null;
    if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
  };

  if (!total) return null;
  const src = items[index];
  const story = isStory(src);

  return createPortal(
    <div
      ref={dialogRef}
      className="smm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${brand.brand} social media creatives`}
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-lightbox)' as unknown as number,
        backgroundColor: 'rgba(10,10,10,0.95)',
        color: '#F4F1EA',
        cursor: 'auto',
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none',
        overscrollBehavior: 'contain',
      }}
    >
      {/* top bar */}
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: 'clamp(0.75rem, 2vh, 1.25rem) clamp(1rem, 3vw, 2rem)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(0.85rem, 1.4vw, 1.1rem)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {brand.brand}
          </div>
          <div aria-live="polite" style={{ fontFamily: 'var(--font-meta)', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65, marginTop: 2 }}>
            {creativeLabel(src)} ✦ {index + 1} / {total}
          </div>
        </div>
        <button ref={closeRef} type="button" className="smm-lb-btn" onClick={onClose} aria-label="Close" style={roundBtn}>
          ✕
        </button>
      </div>

      {/* image + arrows */}
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragX.current = null;
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ position: 'relative', flex: '1 1 0', minHeight: 0 }}
      >
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          style={{
            position: 'absolute',
            inset: 0,
            padding: '0 clamp(0.5rem, 5vw, 5rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
        <img
          key={src}
          className="smm-lb-img"
          src={src}
          alt={`${brand.brand} — ${creativeLabel(src)}`}
          decoding="async"
          draggable={false}
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: story ? '100%' : 'auto',
            aspectRatio: story ? '9 / 16' : undefined,
            objectFit: 'contain',
            borderRadius: story ? 14 : 6,
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            userSelect: 'none',
          }}
        />
        </div>
        {total > 1 && (
          <>
            <button
              type="button"
              className="smm-lb-btn"
              onClick={() => go(-1)}
              aria-label="Previous creative"
              style={{ ...roundBtn, position: 'absolute', left: 'clamp(0.5rem, 2vw, 1.5rem)', top: '50%', transform: 'translateY(-50%)' }}
            >
              ←
            </button>
            <button
              type="button"
              className="smm-lb-btn"
              onClick={() => go(1)}
              aria-label="Next creative"
              style={{ ...roundBtn, position: 'absolute', right: 'clamp(0.5rem, 2vw, 1.5rem)', top: '50%', transform: 'translateY(-50%)' }}
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Instagram-style dots */}
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 2,
          padding: 'clamp(0.6rem, 2vh, 1.1rem) 1rem clamp(0.9rem, 3vh, 1.5rem)',
        }}
      >
        {items.map((item, i) => {
          const active = i === index;
          return (
            <button
              key={item}
              type="button"
              className="smm-lb-btn"
              onClick={() => setIndex(i)}
              aria-label={`Show ${creativeLabel(item)}`}
              aria-current={active ? 'true' : undefined}
              style={{ width: 18, height: 24, padding: 0, border: 0, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: active ? '#0095f6' : 'rgba(244,241,234,0.4)',
                  transform: active ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.25s ease, background-color 0.25s ease',
                }}
              />
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
