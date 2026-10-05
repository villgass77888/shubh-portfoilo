import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import type { WebsiteEntry } from '../../../data/portfolio';
import BrowserFrame from './WebCard';

interface WebLightboxProps {
  site: WebsiteEntry;
  index: number;
  total: number;
  reducedMotion: boolean;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Lightbox for one website: the full recording in a browser-chrome frame,
 * play / pause, project copy, ESC + close button, focus trap and focus restore.
 * Portalled to <body> so it escapes the pinned / transformed stage.
 */
export default function WebLightbox({ site, index, total, reducedMotion, onClose }: WebLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);

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
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button, a[href]'),
      );
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

  // Autoplay the full recording (it is muted), unless the user prefers reduced motion
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reducedMotion) return;
    v.play().catch(() => {});
    return () => v.pause();
  }, [reducedMotion, site.slug]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const onTime = (e: SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (barRef.current && v.duration) {
      barRef.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
    }
  };

  const controlBtn: CSSProperties = {
    fontFamily: 'var(--font-meta)',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#0D0D0D',
    backgroundColor: 'var(--acid)',
    border: '2px solid #0D0D0D',
    borderRadius: 6,
    padding: '0.5em 0.9em',
    cursor: 'pointer',
    flex: 'none',
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${site.name} website recording`}
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-lightbox)' as unknown as number,
        backgroundColor: 'rgba(10,10,10,0.94)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        cursor: 'auto',
        color: '#F4F1EA',
        animation: reducedMotion ? undefined : 'webLbFade 0.3s ease-out both',
      }}
    >
      <div
        style={{
          width: 'min(1180px, 100%, max(118vh, 560px))',
          margin: '0 auto',
          padding: 'clamp(4rem, 9vh, 5.5rem) clamp(1rem, 3vw, 2.5rem) 3rem',
          animation: reducedMotion ? undefined : 'webLbRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Browser frame with the full recording */}
        <BrowserFrame
          site={site}
          source="full"
          preload="metadata"
          videoRef={videoRef}
          barHeight="clamp(26px, 2.6vw, 38px)"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={onTime}
          style={{ borderRadius: 10, boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}
        />

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginTop: '0.9rem' }}>
          <button type="button" onClick={toggle} style={controlBtn} aria-label={playing ? 'Pause recording' : 'Play recording'}>
            {playing ? '❚❚ Pause' : '▶ Play'}
          </button>
          <span
            aria-hidden="true"
            style={{
              flex: 1,
              height: 3,
              backgroundColor: 'rgba(244,241,234,0.18)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <span
              ref={barRef}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--acid)',
                transform: 'scaleX(0)',
                transformOrigin: 'left center',
              }}
            />
          </span>
          <span style={{ fontFamily: 'var(--font-meta)', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'rgba(244,241,234,0.6)' }}>
            {pad(index + 1)} / {pad(total)}
          </span>
        </div>

        {/* Copy */}
        <div style={{ marginTop: '1.75rem' }}>
          <p style={{ fontFamily: 'var(--font-meta)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--acid)', marginBottom: '0.5rem' }}>
            {site.client}
          </p>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontStretch: '125%',
              fontSize: 'clamp(1.6rem, 3.4vw, 3rem)',
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            }}
          >
            {site.name}
          </h3>
        </div>

        <div className="web-lb-copy">
          {/* Left: the site's story */}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-handwritten)', fontSize: 'clamp(1.4rem, 2.2vw, 1.9rem)', lineHeight: 1.1, color: 'var(--sun)', marginBottom: '0.7rem' }}>
              {site.hookLine}
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.55, color: 'rgba(244,241,234,0.78)' }}>{site.body}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0' }}>
              {site.highlights.map((h) => (
                <li key={h} style={{ fontFamily: 'var(--font-meta)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.3rem 0', borderTop: '1px solid rgba(244,241,234,0.16)' }}>
                  ✦ {h}
                </li>
              ))}
            </ul>
            {site.url && (
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="VISIT"
                style={{ ...controlBtn, display: 'inline-block', marginTop: '1.1rem', textDecoration: 'none' }}
              >
                Visit live site ↗
              </a>
            )}
          </div>

          {/* Right: tech stack */}
          <aside className="web-lb-tech" aria-label={`Tech stack used for ${site.name}`}>
            <p
              style={{
                fontFamily: 'var(--font-meta)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--acid)',
                marginBottom: '0.85rem',
              }}
            >
              Tech stack
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {site.tech.map((t) => (
                <li
                  key={t}
                  style={{
                    fontFamily: 'var(--font-meta)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#F4F1EA',
                    border: '1.5px solid rgba(244,241,234,0.7)',
                    borderRadius: 6,
                    padding: '0.45em 0.8em',
                  }}
                >
                  {t}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close website preview"
        style={{
          ...controlBtn,
          position: 'fixed',
          top: 'clamp(0.75rem, 2vh, 1.5rem)',
          right: 'clamp(0.75rem, 2vw, 1.5rem)',
          backgroundColor: '#F4F1EA',
        }}
      >
        Close ✕
      </button>

      <style>{`
        .web-lb-copy { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-top: 1rem; }
        .web-lb-tech { border-top: 1px solid rgba(244,241,234,0.22); padding-top: 1.1rem; }
        @media (min-width: 900px) {
          .web-lb-copy { grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 3rem; align-items: start; }
          .web-lb-tech { border-top: 0; border-left: 1px solid rgba(244,241,234,0.22); padding: 0.2rem 0 0.4rem 2rem; }
        }
        @keyframes webLbFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes webLbRise { from { opacity: 0; transform: translateY(28px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>,
    document.body,
  );
}
