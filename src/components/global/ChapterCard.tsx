import { useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SelectionBox from './SelectionBox';
import { siteInfo, chapters } from '../../data/portfolio';

gsap.registerPlugin(ScrollTrigger);

const PHONE_QUERY = '(max-width: 767px)';
/** Longest line a phone title may have before it breaks, in characters */
const PHONE_LINE = 12;

/** Phones: break the title into short lines, word by word */
function phoneLines(parts: string[]): string[] {
  const lines: string[] = [];
  parts.forEach((part) => {
    let line = '';
    part.split(' ').forEach((word) => {
      if (line && `${line} ${word}`.length > PHONE_LINE) {
        lines.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    });
    if (line) lines.push(line);
  });
  return lines;
}

interface ChapterCardProps {
  chapterIndex: number; // index into `chapters`
  title: string;
  /** Optional second line, set as large as the first; when given, `title` stays on one line */
  subtitle?: string;
}

/**
 * Chapter Title Card — full-screen title with selection box,
 * kicker, meta corners. Timed entrance, then a pinned hold and scrubbed exit.
 */
export default function ChapterCard({ chapterIndex, title, subtitle }: ChapterCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const onChange = () => setPhone(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Phones: size the title so its longest line fits the screen, centred inside the selection box
  useIsomorphicLayoutEffect(() => {
    const root = containerRef.current;
    if (!root || !phone) return;
    const fit = () => {
      root.style.removeProperty('--ch-fs');
      const lines = Array.from(root.querySelectorAll<HTMLElement>('.chapter-title-char'));
      if (!lines.length) return;
      const base = parseFloat(getComputedStyle(lines[0]).fontSize);
      const widest = Math.max(...lines.map((el) => el.offsetWidth));
      const room = root.clientWidth - 80;
      if (widest > room) root.style.setProperty('--ch-fs', `${((base * room) / widest).toFixed(2)}px`);
    };
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('resize', fit);
      root.style.removeProperty('--ch-fs');
    };
  }, [phone, title, subtitle]);

  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current) return;
    // Reduced motion: no pin, no scrub — the title simply sits there fully visible
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      // Entrance: plays on its own clock as soon as the card is mostly in view,
      // so the title is already there when the card pins (never tied to scroll speed).
      const intro = gsap.timeline({
        defaults: { ease: 'expo.out' },
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 55%',
          toggleActions: 'play none none reverse',
        },
      });

      intro.from('.chapter-kicker', { opacity: 0, y: 14, duration: 0.6 });
      intro.from('.chapter-title-char', { yPercent: 110, duration: 1.1, stagger: 0.09 }, 0.05);
      intro.fromTo('.selection-box', { borderColor: 'rgba(255,43,28,0)' }, { borderColor: 'rgba(255,43,28,1)', duration: 0.6, ease: 'power2.out' }, 0.45);
      intro.from('.sel-handle', { scale: 0, duration: 0.35, stagger: 0.03, ease: 'back.out(2)' }, 0.55);
      intro.from('.meta-corner', { opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' }, 0.6);

      // Hold, then a slow scrubbed exit: the first 45% of the pin is a pure hold
      const exit = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=110%',
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
        },
      });

      exit.to({}, { duration: 0.45 });
      exit.to('.chapter-title-top', { xPercent: -60, opacity: 0, duration: 0.55 }, 0.45);
      exit.to('.chapter-title-bottom', { xPercent: 60, opacity: 0, duration: 0.55 }, 0.45);
      // fromTo with explicit starts: these props are also touched by the entrance
      exit.fromTo('.chapter-fade', { opacity: 1 }, { opacity: 0, duration: 0.35, immediateRender: false }, 0.45);
      exit.fromTo('.selection-box', { borderColor: 'rgba(255,43,28,1)' }, { borderColor: 'rgba(255,43,28,0)', duration: 0.35, immediateRender: false }, 0.45);
      exit.to('.sel-handle', { opacity: 0, duration: 0.3 }, 0.45);
    }, containerRef);

    return () => ctx.revert();
  }, [phone]);

  const ch = chapters[chapterIndex] || chapters[0];
  const titleWords = title.split(' ');
  const midPoint = Math.ceil(titleWords.length / 2);
  const topLine = subtitle ? title : titleWords.slice(0, midPoint).join(' ');
  const bottomLine = subtitle ?? titleWords.slice(midPoint).join(' ');
  // desktop: two halves; phones: short lines that leave left / right alternately
  const lines = phone ? phoneLines(subtitle ? [title, subtitle] : [title]) : [topLine, bottomLine].filter(Boolean);

  return (
    <div
      ref={containerRef}
      className="chapter-card"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Kicker */}
      <div
        className="chapter-kicker chapter-fade"
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: 'var(--fs-meta)',
          letterSpacing: '0.1em',
          color: 'var(--signal)',
          marginBottom: '1.5rem',
        }}
      >
        CHAPTER {String(ch.num).padStart(2, '0')} / {String(ch.total).padStart(2, '0')}
      </div>

      {/* Title with Selection Box */}
      <SelectionBox>
        <div className="chapter-title-pad" style={{ padding: '1rem 2rem' }}>
          {lines.map((line, i) => (
            <div key={`${i}-${line}`} className={i % 2 ? 'chapter-title-bottom' : 'chapter-title-top'} style={{ overflow: 'hidden' }}>
              <span
                className="chapter-title-char"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: subtitle ? 'calc(var(--fs-chapter) * 0.82)' : 'var(--fs-chapter)',
                  whiteSpace: subtitle ? 'nowrap' : undefined,
                  color: 'var(--signal)',
                  display: 'inline-block',
                  lineHeight: 0.85,
                }}
              >
                {line}
              </span>
            </div>
          ))}
        </div>
      </SelectionBox>

      {/* Meta Corners */}
      <div className="meta-corner meta-corner--tl chapter-fade" style={{ position: 'absolute', top: '2rem', left: '2rem', fontFamily: 'var(--font-meta)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--signal)' }}>
        PORTFOLIO OF {siteInfo.name}
      </div>
      <div className="meta-corner meta-corner--tr chapter-fade" style={{ position: 'absolute', top: '2rem', right: '2rem', fontFamily: 'var(--font-meta)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--signal)', textAlign: 'right' }}>
        {siteInfo.coordinates}
      </div>
      <div className="meta-corner meta-corner--bl chapter-fade" style={{ position: 'absolute', bottom: '2rem', left: '2rem', fontFamily: 'var(--font-meta)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--signal)' }}>
        CHAPTER {String(ch.num).padStart(2, '0')} / {String(ch.total).padStart(2, '0')}
      </div>
      <div className="meta-corner meta-corner--br chapter-fade" style={{ position: 'absolute', bottom: '2rem', right: '2rem', fontFamily: 'var(--font-meta)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--signal)', textAlign: 'right' }}>
        {siteInfo.year} PORTFOLIO
      </div>
    </div>
  );
}
