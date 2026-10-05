import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';
import type { SmmEntry } from '../../../data/portfolio';
import { creativeLabel, isStory } from './SmmLightbox';

interface SmmWallProps {
  brand: SmmEntry;
  /** true while the lightbox is open on top of the wall (it owns the keyboard then) */
  suspended: boolean;
  onOpen: (index: number) => void;
  onClose: () => void;
}

/**
 * "SEE ALL →" — full-screen masonry wall (CSS columns) of every creative of a brand,
 * cascading in over a backdrop tinted with the brand's primary colour.
 */
export default function SmmWall({ brand, suspended, onOpen, onClose }: SmmWallProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const suspendedRef = useRef(suspended);
  suspendedRef.current = suspended;

  // Focus management + keyboard
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (suspendedRef.current) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
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
  }, [onClose]);

  // Cascade-in
  useIsomorphicLayoutEffect(() => {
    if (!dialogRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.smm-wall-cell', {
        opacity: 0,
        y: 48,
        scale: 0.92,
        rotation: () => gsap.utils.random(-4, 4),
        duration: 0.6,
        ease: 'back.out(1.4)',
        delay: (i: number) => 0.1 + i * 0.03 + Math.random() * 0.18,
        clearProps: 'transform,opacity',
      });
    }, dialogRef);
    return () => ctx.revert();
  }, [brand.slug]);

  const p = brand.primary;

  return createPortal(
    <div
      ref={dialogRef}
      className="smm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`All ${brand.brand} social media creatives`}
      data-lenis-prevent
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-lightbox)' as unknown as number,
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        cursor: 'auto',
        color: '#0D0D0D',
        background: [
          `radial-gradient(circle at 12% 8%, color-mix(in srgb, ${p} 55%, transparent), transparent 42%)`,
          `radial-gradient(circle at 92% 30%, color-mix(in srgb, ${p} 38%, transparent), transparent 46%)`,
          `radial-gradient(circle at 40% 100%, color-mix(in srgb, ${p} 45%, transparent), transparent 50%)`,
          `color-mix(in srgb, ${p} 16%, #ECE8DF)`,
        ].join(', '),
      }}
    >
      <div
        style={{
          width: 'min(1400px, 100%)',
          minHeight: 'calc(100% + 1px)',
          margin: '0 auto',
          padding: 'clamp(1rem, 3vh, 2rem) clamp(1rem, 3vw, 2.5rem) 4rem',
        }}
      >
        {/* header */}
        <div
          style={{
            position: 'sticky',
            top: 'clamp(0.75rem, 2vh, 1.25rem)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: 'clamp(1.25rem, 4vh, 2.5rem)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontStretch: '125%',
                fontSize: 'clamp(1rem, 2.4vw, 2rem)',
                letterSpacing: '0.03em',
                lineHeight: 1.05,
                textTransform: 'uppercase',
              }}
            >
              {brand.brand}
            </h3>
            <div style={{ fontFamily: 'var(--font-meta)', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
              [ {brand.campaign} ]{brand.stats ? ` ✦ ${brand.stats}` : ''}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="smm-lb-btn"
            onClick={onClose}
            style={{
              flex: 'none',
              fontFamily: 'var(--font-meta)',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#F4F1EA',
              backgroundColor: '#0D0D0D',
              border: '2px solid #0D0D0D',
              borderRadius: 8,
              padding: '0.6em 1em',
              cursor: 'pointer',
            }}
          >
            Close ✕
          </button>
        </div>

        {/* masonry */}
        <div style={{ columns: '150px 4', columnGap: 'clamp(0.6rem, 1.4vw, 1.25rem)' }}>
          {brand.all.map((src, i) => (
            <div
              key={src}
              className="smm-wall-cell"
              style={{ breakInside: 'avoid', marginBottom: 'clamp(0.6rem, 1.4vw, 1.25rem)' }}
            >
              <button
                type="button"
                className="smm-wall-item"
                onClick={() => onOpen(i)}
                aria-label={`Open ${brand.brand} ${creativeLabel(src)}`}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 0,
                  border: 0,
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(13,13,13,0.08)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
                  cursor: 'pointer',
                  aspectRatio: isStory(src) ? '9 / 16' : undefined,
                }}
              >
                <img
                  src={src}
                  alt={`${brand.brand} — ${creativeLabel(src)}`}
                  loading="lazy"
                  decoding="async"
                  style={{ display: 'block', width: '100%', height: isStory(src) ? '100%' : 'auto', objectFit: 'cover' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
