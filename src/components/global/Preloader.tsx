import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
}

const CYCLING_WORDS = ['LOGOS', 'BRANDING', 'WEB', 'SOCIAL', 'PACKAGING', 'LOADING TASTE...'];

/**
 * Preloader — black screen with counter, neon name flicker, cycling words.
 * Burns away to reveal the hero.
 */
export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Cycling words
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Counter animation
  useEffect(() => {
    const counter = { val: 0 };
    gsap.to(counter, {
      val: 100,
      duration: 2.4,
      ease: 'power2.out',
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.floor(counter.val)).padStart(3, '0');
        }
      },
    });

    // Progress line
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        scaleX: 1,
        duration: 2.4,
        ease: 'power2.out',
        transformOrigin: 'left',
      });
    }

    // Exit animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      // Lets the hero time its entrance to the burn-away
      window.dispatchEvent(new Event('preloader:exit'));
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete();
        },
      });

      // Burn away from centre
      tl.to(containerRef.current, {
        clipPath: 'circle(0% at 50% 50%)',
        duration: 1,
        ease: 'power3.in',
      });
    }, 2800);

    return () => clearTimeout(exitTimer);
  }, [onComplete]);

  // Name letters with flicker
  const nameChars = 'SHUBH PANDA'.split('');

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-preloader)' as any,
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        clipPath: 'circle(150% at 50% 50%)',
        transition: isExiting ? 'none' : undefined,
      }}
    >
      {/* Grain on preloader */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.2'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
          opacity: 0.15,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Name */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 8vw, 7rem)',
          color: 'var(--bone)',
          letterSpacing: '-0.02em',
          display: 'flex',
          gap: '0.05em',
        }}
      >
        {nameChars.map((char, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              animation: `neonFlicker ${0.8 + Math.random() * 0.4}s ${i * 0.08}s both`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>

      {/* Cycling words */}
      <div
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.75rem',
          letterSpacing: '0.12em',
          color: 'var(--signal)',
          marginTop: '1rem',
          height: '1.2em',
          overflow: 'hidden',
        }}
      >
        {CYCLING_WORDS[wordIndex]}
      </div>

      {/* Counter */}
      <span
        ref={counterRef}
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '2rem',
          fontFamily: 'var(--font-meta)',
          fontSize: '0.75rem',
          color: 'var(--bone)',
          letterSpacing: '0.1em',
        }}
      >
        000
      </span>

      {/* Progress line */}
      <div
        ref={progressRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 2,
          backgroundColor: 'var(--signal)',
          transformOrigin: 'left',
          transform: 'scaleX(0)',
        }}
      />

      <style>{`
        @keyframes neonFlicker {
          0%   { opacity: 0; }
          10%  { opacity: 0.8; }
          20%  { opacity: 0.2; }
          30%  { opacity: 0.9; }
          50%  { opacity: 0.4; }
          70%  { opacity: 1; }
          80%  { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
