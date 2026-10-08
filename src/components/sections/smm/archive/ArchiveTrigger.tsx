import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { archiveContent } from '../../../../content/archive';
import { Chars, SelMarks } from './marks';

type Props = {
  onOpen: () => void;
  /** Fired once when the trigger is about to scroll into view (prefetch the archive) */
  onNear: () => void;
  /** Colour of the brand scene right above: its wash fades out behind the trigger */
  tint?: string;
};

/**
 * The calm beat after the last SMM brand: EXPLORE ALL CREATIVES in its selection box.
 * Types in once at 40% in view, fills with an ink plate on hover, and every five seconds
 * its handles do a small "grab me" wiggle.
 */
export default function ArchiveTrigger({ onOpen, onNear, tint }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [seen, setSeen] = useState(false);
  const copy = archiveContent.trigger;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setSeen(true);

    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.4;
        if (inView) setSeen(true);
      },
      { threshold: [0, 0.4] },
    );
    io.observe(root);

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        onNear();
        near.disconnect();
      },
      { rootMargin: '700px 0px' },
    );
    near.observe(root);

    const timers: number[] = [];
    const hint = window.setInterval(() => {
      const btn = btnRef.current;
      if (!inView || !btn || document.hidden || btn.matches(':hover, :focus-visible')) return;
      btn.classList.add('is-wiggle');
      timers.push(window.setTimeout(() => btn.classList.remove('is-wiggle'), 900));
    }, 5000);

    return () => {
      io.disconnect();
      near.disconnect();
      window.clearInterval(hint);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [onNear]);

  return (
    <div ref={rootRef} id="smm-archive-trigger" className={`ar-trig${seen ? ' is-in' : ''}`} style={tint ? ({ '--tint': tint } as CSSProperties) : undefined}>
      <button
        ref={btnRef}
        type="button"
        className={`ar-trig-btn ar-sel${seen ? ' is-on' : ''}`}
        data-cursor="OPEN"
        aria-label={`${copy.title}: open the full archive of creatives`}
        aria-haspopup="dialog"
        onClick={onOpen}
      >
        <span className="ar-trig-plate" aria-hidden="true" />
        <span className="ar-trig-text">
          <Chars text={copy.title} />
        </span>
        <SelMarks />
        <span className="ar-trig-sticker" aria-hidden="true">
          {copy.sticker}
        </span>
      </button>
      <p className="ar-trig-sub">{copy.subtitle}</p>
    </div>
  );
}
