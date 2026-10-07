import { useRef } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SectionBg {
  color: string;
  id: string;
}

const sectionBgs: SectionBg[] = [
  { color: '#F6F3EC', id: 'hero' },
  { color: '#ECE8DF', id: 'logos' },
  { color: '#0B0F2E', id: 'branding' },
  { color: '#D9CDB8', id: 'web' },
  { color: '#ECE8DF', id: 'smm' },
  { color: '#F0E6CC', id: 'packaging' },
  { color: '#F3F0E8', id: 'streetwear' },
  { color: '#000', id: 'outro' },
];

/**
 * BackgroundStage — one fixed full-screen layer behind all sections.
 * As each section scrolls in, the background transitions to the next color.
 */
export default function BackgroundStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      sectionBgs.forEach((bg, i) => {
        if (i === 0) return; // hero is the initial state

        const trigger = document.getElementById(`section-${bg.id}`);
        if (!trigger) return;

        ScrollTrigger.create({
          trigger,
          // Refresh after the sections' pins so positions include their pin spacing
          refreshPriority: -1,
          start: 'top 80%',
          end: 'top 20%',
          scrub: 1,
          onEnter: () => {
            if (currentRef.current) {
              gsap.to(currentRef.current, {
                backgroundColor: bg.color,
                duration: 0.8,
                ease: 'power2.inOut',
              });
            }
          },
          onLeaveBack: () => {
            const prevColor = sectionBgs[i - 1]?.color || '#F6F3EC';
            if (currentRef.current) {
              gsap.to(currentRef.current, {
                backgroundColor: prevColor,
                duration: 0.8,
                ease: 'power2.inOut',
              });
            }
          },
        });
      });
    }, stageRef);

    // Sections can repaint the stage themselves (e.g. one colour per brand in Branding)
    const onColor = (e: Event) => {
      const color = (e as CustomEvent<string>).detail;
      if (currentRef.current && color) {
        gsap.to(currentRef.current, { backgroundColor: color, duration: 0.9, ease: 'power2.inOut', overwrite: 'auto' });
      }
    };
    window.addEventListener('stage:color', onColor);

    return () => {
      window.removeEventListener('stage:color', onColor);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-bg)' as any,
        pointerEvents: 'none',
      }}
    >
      {/* Current color layer */}
      <div
        ref={currentRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: sectionBgs[0].color,
        }}
      />

      {/* Grunge texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
          mixBlendMode: 'multiply',
          opacity: 0.12,
          animation: 'driftTexture 20s linear infinite',
        }}
      />

      {/* Next color (for wipe transitions) */}
      <div
        ref={nextRef}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
        }}
      />

      <style>{`
        @keyframes driftTexture {
          0%   { background-position: 0 0; }
          100% { background-position: 256px 256px; }
        }
      `}</style>
    </div>
  );
}
