import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/** Rendered size relative to the delivered pixel-art PNGs */
const SCALE = 0.19;

/** The four delivered cursors; `hot` is the pointing pixel in the source image */
const CURSORS = {
  arrow: { src: '/assets/cursor/arrow.png', w: 107, h: 167, hot: [3, 3] },
  arrowClick: { src: '/assets/cursor/arrow-click.png', w: 146, h: 204, hot: [42, 40] },
  hand: { src: '/assets/cursor/hand.png', w: 135, h: 171, hot: [46, 5] },
  handClick: { src: '/assets/cursor/hand-click.png', w: 141, h: 207, hot: [52, 41] },
} as const;

type CursorKey = keyof typeof CURSORS;

const HOVERABLE =
  'a, button, [role="button"], [data-cursor], input, select, textarea, label, summary, [tabindex]:not([tabindex="-1"]), [style*="cursor: pointer"]';

/**
 * CustomCursor — pixel-art pointer (arrow / hand, with click states) plus the
 * lagging ring that carries the VIEW / OPEN / HI THERE labels.
 * Hidden on touch devices.
 */
export default function CustomCursor() {
  const pointerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  const [cursor, setCursor] = useState<CursorKey>('arrow');
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouch(true);
      return;
    }

    const pointer = pointerRef.current;
    const ring = ringRef.current;
    if (!pointer || !ring) return;

    document.documentElement.classList.add('has-custom-cursor');

    const quickX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3.out' });
    const quickY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3.out' });

    let overHoverable = false;
    let pressed = false;
    const sync = () => setCursor(overHoverable ? (pressed ? 'handClick' : 'hand') : pressed ? 'arrowClick' : 'arrow');

    const onMove = (e: MouseEvent) => {
      gsap.set(pointer, { x: e.clientX, y: e.clientY, opacity: 1 });
      quickX(e.clientX);
      quickY(e.clientY);

      // Check for interactive elements
      const target = e.target as HTMLElement | null;
      const cursorLabel = target?.closest?.('[data-cursor]');
      if (cursorLabel) {
        const newLabel = (cursorLabel as HTMLElement).dataset.cursor || '';
        setLabel(newLabel);
        gsap.to(ring, { width: 110, height: 110, duration: 0.3, ease: 'back.out(1.7)' });
      } else {
        setLabel('');
        gsap.to(ring, { width: 40, height: 40, duration: 0.3, ease: 'power2.out' });
      }

      const hoverable = !!target?.closest?.(HOVERABLE);
      if (hoverable !== overHoverable) {
        overHoverable = hoverable;
        sync();
      }
    };
    const onDown = () => {
      pressed = true;
      sync();
    };
    const onUp = () => {
      pressed = false;
      sync();
    };
    const onLeave = () => gsap.set(pointer, { opacity: 0 });

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      {/* Pointer — all four images stay mounted so swapping never flashes */}
      <div
        ref={pointerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 'calc(var(--z-preloader) + 1)' as any,
        }}
      >
        {(Object.keys(CURSORS) as CursorKey[]).map((key) => {
          const c = CURSORS[key];
          return (
            <img
              key={key}
              src={c.src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: -c.hot[0] * SCALE,
                top: -c.hot[1] * SCALE,
                width: c.w * SCALE,
                height: c.h * SCALE,
                maxWidth: 'none',
                imageRendering: 'pixelated',
                visibility: cursor === key ? 'visible' : 'hidden',
              }}
            />
          );
        })}
      </div>
      {/* Ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: label ? 'none' : '1.5px solid var(--ink)',
          backgroundColor: label ? 'var(--acid)' : 'transparent',
          mixBlendMode: label ? 'normal' : 'difference',
          pointerEvents: 'none',
          zIndex: 'var(--z-cursor)' as any,
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.3s, border 0.3s',
        }}
      >
        {label && (
          <span
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        )}
      </div>
    </>
  );
}
