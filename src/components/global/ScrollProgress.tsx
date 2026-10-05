import { useRef, useEffect, useState } from 'react';
import { chapters } from '../../data/portfolio';

/**
 * Scroll Progress — thin vertical bar on the right edge with chapter ticks.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [hoveredTick, setHoveredTick] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      setProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={barRef}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '2px',
        height: '100vh',
        zIndex: 'var(--z-nav)' as any,
        pointerEvents: 'none',
      }}
    >
      {/* Track */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(255,43,28,0.1)',
      }} />

      {/* Fill */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${progress * 100}%`,
        backgroundColor: 'var(--signal)',
        transition: 'height 0.1s linear',
      }} />

      {/* Chapter ticks */}
      {chapters.map((ch, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${((i + 0.5) / chapters.length) * 100}%`,
            right: 0,
            width: '8px',
            height: '1px',
            backgroundColor: 'var(--signal)',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
          onMouseEnter={() => setHoveredTick(i)}
          onMouseLeave={() => setHoveredTick(null)}
          onClick={() => {
            const sectionIds = ['hero', 'logos', 'branding', 'web', 'smm', 'packaging', 'outro'];
            document.getElementById(`section-${sectionIds[i]}`)?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {/* Tooltip */}
          {hoveredTick === i && (
            <div style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-meta)',
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
              color: 'var(--signal)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              padding: '2px 8px',
              borderRadius: '3px',
              pointerEvents: 'none',
            }}>
              {ch.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
