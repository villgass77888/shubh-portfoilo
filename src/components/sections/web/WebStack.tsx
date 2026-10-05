import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';
import { websites } from '../../../data/portfolio';
import BrowserFrame from './WebCard';

gsap.registerPlugin(ScrollTrigger);

interface WebStackProps {
  reducedMotion: boolean;
  /** Pause everything (e.g. while the lightbox is open). */
  paused: boolean;
  onOpen: (index: number) => void;
}

const ACCENTS = ['var(--acid)', 'var(--bubblegum)', 'var(--sun)'];
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Mobile / reduced-motion layout: a vertical stack of tilted cards (alternating ±4°)
 * entering from left / right, each followed by its copy. Videos play only while visible.
 */
export default function WebStack({ reducedMotion, paused, onOpen }: WebStackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const visibleRef = useRef<boolean[]>([]);
  const pausedRef = useRef(paused);

  // Entrances (skipped entirely with reduced motion: cards are simply there)
  useIsomorphicLayoutEffect(() => {
    if (!rootRef.current || reducedMotion) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.web-stack-enter');
      items.forEach((el, i) => {
        gsap.from(el, {
          xPercent: i % 2 === 0 ? -55 : 55,
          rotation: i % 2 === 0 ? -6 : 6,
          opacity: 0,
          duration: 0.9,
          ease: 'back.out(1.2)',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  // Play only what is on screen
  useEffect(() => {
    pausedRef.current = paused;
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (!paused && !reducedMotion && visibleRef.current[i]) v.play().catch(() => {});
      else v.pause();
    });
  }, [paused, reducedMotion]);

  useEffect(() => {
    const vids = videoRefs.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const i = vids.indexOf(entry.target as HTMLVideoElement);
          if (i < 0) return;
          visibleRef.current[i] = entry.isIntersecting;
          const v = vids[i];
          if (!v) return;
          if (entry.isIntersecting && !pausedRef.current && !reducedMotion) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.35 },
    );
    vids.forEach((v) => v && io.observe(v));
    return () => {
      io.disconnect();
      vids.forEach((v) => v?.pause());
    };
  }, [reducedMotion]);

  return (
    <div ref={rootRef} className="web-stack" style={{ position: 'relative', overflow: 'hidden', color: 'var(--ink)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '3rem 1.25rem 5rem' }}>
        <p style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.7rem', lineHeight: 1.1, marginBottom: '0.4rem' }}>
          Sites that feel as good as they look.
        </p>
        <p style={{ fontFamily: 'var(--font-meta)', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--signal)', marginBottom: '3rem' }}>
          {websites.length} SITES ✦ REACT / NEXT.JS / WORDPRESS / WEBGL
        </p>

        {websites.map((site, i) => {
          const tilt = i % 2 === 0 ? -4 : 4;
          return (
            <article key={site.slug} className={`web-stack-item${i % 2 ? ' web-stack-item--flip' : ''}`}>
              <div className="web-stack-enter" style={{ position: 'relative' }}>
                {/* Accent block peeking from behind the card */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    width: i % 3 === 0 ? '34%' : '22%',
                    height: i % 2 === 0 ? '38%' : '26%',
                    backgroundColor: ACCENTS[i % ACCENTS.length],
                    top: i % 2 === 0 ? '-9%' : 'auto',
                    bottom: i % 2 === 0 ? 'auto' : '-10%',
                    left: i % 2 === 0 ? 'auto' : '-3%',
                    right: i % 2 === 0 ? '-3%' : 'auto',
                    transform: `rotate(${tilt}deg)`,
                    borderRadius: 3,
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  data-cursor="OPEN"
                  aria-label={`Open the ${site.name} website recording`}
                  onClick={() => onOpen(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpen(i);
                    }
                  }}
                  style={{
                    position: 'relative',
                    transform: `rotate(${tilt}deg)`,
                    boxShadow: '0 14px 34px rgba(40,28,10,0.3)',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  <BrowserFrame
                    site={site}
                    source="card"
                    barHeight="clamp(16px, 4.6vw, 26px)"
                    videoRef={(el) => {
                      videoRefs.current[i] = el;
                    }}
                  />
                </div>
              </div>

              <div className="web-stack-copy">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 900,
                      fontStretch: '125%',
                      fontSize: 'clamp(1.35rem, 5.4vw, 2.2rem)',
                      lineHeight: 1,
                      textTransform: 'uppercase',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {site.name}
                  </h3>
                  <span style={{ fontFamily: 'var(--font-meta)', fontSize: '0.7rem', color: 'var(--signal)', whiteSpace: 'nowrap' }}>
                    {pad(i + 1)} / {pad(websites.length)}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-meta)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.4rem' }}>
                  {site.client}
                </p>
                <p style={{ fontFamily: 'var(--font-handwritten)', fontSize: '1.55rem', lineHeight: 1.1, color: 'var(--signal)', margin: '0.5rem 0' }}>
                  {site.hookLine}
                </p>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'rgba(13,13,13,0.78)' }}>{site.body}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0' }}>
                  {site.highlights.map((h) => (
                    <li key={h} style={{ fontFamily: 'var(--font-meta)', fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0' }}>
                      ✦ {h}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.8rem' }}>
                  {site.tech.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontFamily: 'var(--font-meta)',
                        fontSize: '0.62rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding: '0.25em 0.6em',
                        border: '1.5px solid var(--ink)',
                        borderRadius: 4,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {site.url && (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="VISIT"
                      style={{ fontFamily: 'var(--font-meta)', fontSize: '0.62rem', letterSpacing: '0.06em', padding: '0.25em 0.6em', color: 'var(--signal)' }}
                    >
                      LIVE ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <style>{`
        .web-stack-item { display: grid; grid-template-columns: 1fr; gap: 1.9rem; margin-bottom: 4rem; padding: 0 0.4rem; }
        .web-stack-item:last-child { margin-bottom: 0; }
        @media (min-width: 900px) {
          .web-stack-item { grid-template-columns: 1.5fr 1fr; gap: 4rem; align-items: center; margin-bottom: 6rem; }
          .web-stack-item--flip { grid-template-columns: 1fr 1.5fr; }
          .web-stack-item--flip > .web-stack-enter { order: 2; }
        }
      `}</style>
    </div>
  );
}
