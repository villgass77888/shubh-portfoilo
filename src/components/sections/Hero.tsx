import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import gsap from 'gsap';
import { siteInfo } from '../../data/portfolio';

/** Adobe-style app tile: rounded square with the two-letter mark */
function AdobeTile({ letters, bg, fg }: { letters: string; bg: string; fg: string }) {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
      <rect x="1.5" y="1.5" width="45" height="45" rx="9" fill={bg} stroke={fg} strokeWidth="2" />
      <text x="24" y="32" textAnchor="middle" fontFamily="Archivo, Arial, sans-serif" fontWeight="700" fontSize="21" fill={fg}>
        {letters}
      </text>
    </svg>
  );
}

const tools: { name: string; icon: ReactNode }[] = [
  { name: 'Photoshop', icon: <AdobeTile letters="Ps" bg="#001E36" fg="#31A8FF" /> },
  { name: 'Illustrator', icon: <AdobeTile letters="Ai" bg="#330000" fg="#FF9A00" /> },
  { name: 'InDesign', icon: <AdobeTile letters="Id" bg="#49021F" fg="#FF3366" /> },
  { name: 'Premiere Pro', icon: <AdobeTile letters="Pr" bg="#00005B" fg="#9999FF" /> },
  {
    name: 'CapCut',
    icon: (
      <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
        <rect x="1.5" y="1.5" width="45" height="45" rx="9" fill="#0D0D0D" />
        <g transform="translate(9.79, 9.9) scale(1.175)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M24.189 6.442V2.671l-4.535 2.383V4.91c.002-1.505-1.078-2.411-2.638-2.411H2.64C.993 2.5 0 3.407 0 4.91V8.72L6.354 12 0 15.316v3.8C0 20.595 1 21.5 2.64 21.5h14.373c1.56 0 2.639-.907 2.639-2.382v-.197l4.536 2.409v-3.828L13.64 12 24.19 6.443zM9.982 13.873l7.797 4.083H2.157l7.825-4.083zm7.741-7.828l-7.742 4.057-7.825-4.057h15.567z"
            fill="#FFFFFF"
          />
        </g>
      </svg>
    ),
  },
  {
    name: 'Figma',
    icon: (
      <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
        <rect x="1.5" y="1.5" width="45" height="45" rx="9" fill="#1E1E1E" />
        <path d="M18 9h6v10h-6a5 5 0 0 1 0-10z" fill="#F24E1E" />
        <path d="M24 9h6a5 5 0 0 1 0 10h-6z" fill="#FF7262" />
        <path d="M18 19h6v10h-6a5 5 0 0 1 0-10z" fill="#A259FF" />
        <circle cx="29" cy="24" r="5" fill="#1ABCFE" />
        <path d="M18 29h6v5a5 5 0 1 1-6-5z" fill="#0ACF83" />
      </svg>
    ),
  },
];

/**
 * Hero Section — the 360° cut-out video on the left, name, tools and intro on the right.
 * The video forms in place out of a grunge glitch; everything stays put on scroll.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const displaceRef = useRef<SVGFEDisplacementMapElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (!sectionRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cleanup = () => {};
    const ctx = gsap.context(() => {
      // Plays as the preloader burns away (see the listener below)
      const introTl = gsap.timeline({ paused: true });

      // Name reveal
      introTl.from('.hero-name-char', {
        yPercent: 110,
        rotate: (i: number) => ((i * 37) % 17) - 8,
        stagger: 0.04,
        duration: 0.8,
        ease: 'expo.out',
      });

      // Video: grunge glitch formation, in place.
      // The turbulence displacement tears the figure apart, then it locks together in steps.
      const grunge = { scale: 260 };
      const applyGrunge = () => displaceRef.current?.setAttribute('scale', String(grunge.scale));
      applyGrunge();
      gsap.set('.hero-video-glitch', { opacity: 0 });

      introTl.set('.hero-video-glitch', { opacity: 1 }, 0.1);
      // Slices of the figure flash in at random heights before the whole thing locks
      const slices: [number, number, number][] = [
        [12, 71, -22],
        [58, 9, 18],
        [31, 38, -9],
        [4, 55, 26],
        [66, 2, -14],
        [18, 22, 7],
        [40, 30, -30],
        [0, 41, -4],
        [52, 0, 16],
        [9, 0, 11],
        [0, 12, -6],
        [0, 0, 0],
      ];
      slices.forEach(([top, bottom, x], i) => {
        introTl.set('.hero-video-glitch', { clipPath: `inset(${top}% 0 ${bottom}% 0)`, x }, 0.1 + i * 0.1);
      });
      introTl.to(grunge, { scale: 0, duration: 1.4, ease: 'steps(10)', onUpdate: applyGrunge }, 0.1);
      // RGB split settling to the clean cut-out outline
      introTl.fromTo(
        '.hero-video',
        { filter: 'drop-shadow(-14px 0 0 rgba(255,43,28,0.85)) drop-shadow(14px 0 0 rgba(46,59,255,0.85))' },
        { filter: 'drop-shadow(0px 0 0 rgba(255,43,28,0)) drop-shadow(0px 0 0 rgba(46,59,255,0))', duration: 1.4, ease: 'steps(8)' },
        0.1,
      );
      // Last flicker as it locks
      introTl.to('.hero-video-glitch', { opacity: 0.35, duration: 0.05, repeat: 3, yoyo: true, ease: 'steps(1)' }, 1.4);
      introTl.set('.hero-video-glitch', { opacity: 1, clearProps: 'clipPath,x' });
      introTl.set('.hero-video', { clearProps: 'filter' });
      introTl.set('.hero-video-wrap', { filter: 'none' });

      // Tool icons
      introTl.from('.hero-tool', {
        y: 24,
        opacity: 0,
        stagger: 0.07,
        duration: 0.5,
        ease: 'back.out(1.7)',
      }, 0.7);

      introTl.from('.hero-fade', { opacity: 0, y: 16, stagger: 0.08, duration: 0.6, ease: 'power2.out' }, 1);

      // Start under the last of the burn; fall back to a timer if the preloader never reports
      let started = false;
      const start = (delay: number) => {
        if (started) return;
        started = true;
        gsap.delayedCall(delay, () => introTl.play());
      };
      const onExit = () => start(0.6);
      window.addEventListener('preloader:exit', onExit);
      const fallback = window.setTimeout(() => start(0), 5000);
      cleanup = () => {
        window.removeEventListener('preloader:exit', onExit);
        window.clearTimeout(fallback);
      };
    }, sectionRef);

    return () => {
      cleanup();
      ctx.revert();
    };
  }, []);

  // Background colour that chases the cursor on springs, orbiting it in a circle
  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const blobs = Array.from(section.querySelectorAll<HTMLElement>('.hero-orb')).map((el, i) => ({
      el,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: i * 2.1,
      radius: [70, 120, 170][i] ?? 100, // orbit radius around the cursor
      spin: [2.6, -1.8, 1.2][i] ?? 1, // rad/s, sign = direction
      stiffness: [38, 24, 15][i] ?? 20, // heavier blobs lag more
      damping: [7, 6, 5][i] ?? 6, // under-damped: they overshoot and wobble
      size: el.offsetWidth,
    }));

    const mouse = { x: 0, y: 0, lastX: 0, lastY: 0, speed: 0, seen: false };
    let visible = false;
    let running = false;

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 50) / 1000;
      const dx = mouse.x - mouse.lastX;
      const dy = mouse.y - mouse.lastY;
      mouse.lastX = mouse.x;
      mouse.lastY = mouse.y;
      // smoothed cursor speed (px/s): fast moves fling the orbit wider and spin it faster
      mouse.speed += (Math.min(Math.hypot(dx, dy) / Math.max(dt, 0.001), 3000) - mouse.speed) * Math.min(1, dt * 6);
      const flick = mouse.speed / 3000;

      for (const b of blobs) {
        b.angle += b.spin * (1 + flick * 3) * dt;
        const r = b.radius * (1 + flick * 0.9);
        const tx = mouse.x + Math.cos(b.angle) * r;
        const ty = mouse.y + Math.sin(b.angle) * r;
        // damped spring toward the orbiting target
        b.vx += ((tx - b.x) * b.stiffness - b.vx * b.damping) * dt;
        b.vy += ((ty - b.y) * b.stiffness - b.vy * b.damping) * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.el.style.transform = `translate3d(${b.x - b.size / 2}px, ${b.y - b.size / 2}px, 0)`;
      }
    };
    const start = () => {
      if (running) return;
      running = true;
      gsap.ticker.add(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    };

    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      if (!mouse.seen) {
        // first contact: start every blob at the cursor so nothing streaks in from the corner
        mouse.seen = true;
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        for (const b of blobs) {
          b.x = mouse.x;
          b.y = mouse.y;
        }
      }
      if (!visible) {
        visible = true;
        start();
        gsap.to(blobs.map((b) => b.el), { opacity: 1, duration: 0.8, ease: 'power2.out', overwrite: true });
      }
    };
    const onLeave = () => {
      visible = false;
      gsap.to(blobs.map((b) => b.el), {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => {
          if (!visible) stop();
        },
      });
    };

    section.addEventListener('mousemove', onMove);
    section.addEventListener('mouseleave', onLeave);
    return () => {
      section.removeEventListener('mousemove', onMove);
      section.removeEventListener('mouseleave', onLeave);
      stop();
    };
  }, []);

  return (
    <section ref={sectionRef} id="section-hero" className="hero">
      {/* Cursor-chasing colour wash (behind everything) */}
      <div className="hero-orbs" aria-hidden="true">
        <div className="hero-orb hero-orb--a" />
        <div className="hero-orb hero-orb--b" />
        <div className="hero-orb hero-orb--c" />
      </div>

      {/* Grunge filter used by the video formation */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="hero-grunge" x="-30%" y="-10%" width="160%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.35" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap ref={displaceRef} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="hero-grid">
        {/* Name + tools (right column on desktop) */}
        <div className="hero-left">
          <div className="hero-fade" style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontStretch: '125%', fontSize: '0.9rem', letterSpacing: '0.08em', color: 'var(--ink)' }}>
              PORTFOLIO
            </span>
            <span style={{ fontFamily: 'var(--font-meta)', fontSize: '0.7rem', color: 'var(--signal)', letterSpacing: '0.1em', marginLeft: '0.75rem' }}>
              {siteInfo.year}
            </span>
          </div>

          <h1 className="hero-name" aria-label={siteInfo.name}>
            {['SHUBH', 'PANDA'].map((word) => (
              <span key={word} className="hero-name-line" aria-hidden="true">
                {word.split('').map((c, i) => (
                  <span key={i} className="hero-name-char">{c}</span>
                ))}
              </span>
            ))}
          </h1>

          <ul className="hero-tools" aria-label="Tools">
            {tools.map((tool) => (
              <li key={tool.name} className="hero-tool" title={tool.name} aria-label={tool.name}>
                {tool.icon}
              </li>
            ))}
          </ul>

          <div className="hero-fade hero-intro">
            <p className="hero-intro-text">{siteInfo.intro}</p>
            <span style={{ fontFamily: 'var(--font-meta)', fontSize: '0.65rem', color: 'var(--signal)', letterSpacing: '0.08em' }}>
              ✦ Freelance since 2020
            </span>
          </div>
        </div>

        {/* Video (left column on desktop) */}
        <div className="hero-right">
          <div className="hero-video-wrap" data-cursor="HI THERE">
            <div className="hero-video-glitch">
              <video
                className="hero-video"
                src="/assets/hero/shubh-360.webm"
                muted
                loop
                playsInline
                autoPlay
                preload="auto"
              />
            </div>
          </div>
          <div className="hero-fade hero-note">← that's me. yes, i'm a bit dizzy</div>
        </div>
      </div>

      <div className="hero-fade hero-scroll">
        <span>SCROLL TO ENTER THE WORK</span>
        <span style={{ fontSize: '1.2rem', animation: 'bounceArrow 1.5s ease infinite' }}>↓</span>
      </div>

      {/* Ticker */}
      <div className="hero-ticker">
        <div className="hero-ticker-track">{Array(6).fill(`${siteInfo.title} ✦ `).join('')}</div>
      </div>

      <style>{`
        .hero {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .hero-orbs {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .hero-orb {
          position: absolute;
          top: 0;
          left: 0;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          opacity: 0;
          mix-blend-mode: multiply;
          will-change: transform, opacity;
        }
        .hero-orb--a { background: radial-gradient(circle, rgba(255, 43, 28, 0.2) 0%, rgba(255, 43, 28, 0) 68%); }
        .hero-orb--b { width: 460px; height: 460px; background: radial-gradient(circle, rgba(255, 98, 200, 0.22) 0%, rgba(255, 98, 200, 0) 68%); }
        .hero-orb--c { width: 540px; height: 540px; background: radial-gradient(circle, rgba(255, 216, 58, 0.34) 0%, rgba(255, 216, 58, 0) 68%); }
        .hero-grid {
          position: relative;
          z-index: 1;
          flex: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
          align-items: center;
          gap: 2vw;
          padding: clamp(4.5rem, 9vh, 6rem) 5vw clamp(3rem, 6vh, 4.5rem);
        }
        .hero-name {
          font-family: var(--font-display);
          font-size: min(12.5vw, 20vh);
          font-weight: 400;
          color: var(--ink);
          line-height: 0.85;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .hero-name-line { display: block; overflow: hidden; padding-top: 0.04em; }
        .hero-name-char { display: inline-block; }
        .hero-tools {
          display: flex;
          flex-wrap: nowrap;
          gap: clamp(0.5rem, 1.1vw, 1rem);
          list-style: none;
          margin: clamp(1rem, 3vh, 2rem) 0 0;
          padding: 0;
        }
        .hero-tool {
          width: clamp(34px, 3.6vw, 54px);
          height: clamp(34px, 3.6vw, 54px);
          flex: 0 0 auto;
          filter: drop-shadow(3px 3px 0 var(--ink));
        }
        /* hover lives on the svg so it never fights the GSAP entrance on the li */
        .hero-tool > svg { display: block; transition: transform 0.3s var(--ease-bounce); }
        .hero-tool:hover > svg { transform: translateY(-4px) rotate(-4deg); }
        .hero-intro { max-width: 620px; margin-top: clamp(0.9rem, 2.4vh, 1.5rem); }
        .hero-intro-text {
          font-family: var(--font-body);
          font-size: clamp(0.7rem, 1.65vh, 0.88rem);
          line-height: 1.5;
          color: var(--ink);
          margin: 0 0 0.45rem;
        }
        .hero-left { order: 2; padding-left: clamp(0.5rem, 4vw, 4.5rem); }
        .hero-right {
          order: 1;
          position: relative;
          translate: 0 -3.5vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .hero-video-wrap {
          /* leave room for the nav-side padding and the ticker so the hero never exceeds the viewport */
          height: min(80vh, calc(100vh - 11.5rem), 760px);
          aspect-ratio: 9 / 16;
          max-width: 100%;
          filter: url(#hero-grunge);
        }
        .hero-video-glitch { width: 100%; height: 100%; }
        .hero-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        .hero-note {
          position: absolute;
          top: 16%;
          right: 0;
          font-family: var(--font-handwritten);
          font-size: 1.2rem;
          color: var(--ink);
          rotate: -5deg;
        }
        .hero-scroll {
          position: absolute;
          right: 5vw;
          bottom: 3.25rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-meta);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: var(--ink);
        }
        .hero-ticker {
          position: relative;
          z-index: 1;
          overflow: hidden;
          background-color: var(--ink);
          padding: 8px 0;
        }
        .hero-ticker-track {
          display: flex;
          white-space: nowrap;
          width: max-content;
          font-family: var(--font-heading);
          font-weight: 900;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          color: #F4F1EA;
          animation: scrollTicker 20s linear infinite;
        }
        @keyframes scrollTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes bounceArrow {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(8px); }
        }
        @media (max-width: 800px) {
          .hero-grid {
            grid-template-columns: 1fr;
            padding: 5.5rem 1.25rem 2rem;
            gap: 1.5rem;
          }
          .hero-left { order: 1; padding-left: 0; }
          .hero-right { order: 2; translate: none; }
          .hero-name { font-size: 24vw; }
          .hero-intro { max-width: none; }
          .hero-intro-text { font-size: 0.82rem; }
          .hero-tool { width: clamp(34px, 11.5vw, 48px); height: clamp(34px, 11.5vw, 48px); }
          .hero-video-wrap { height: 62vh; }
          .hero-note { top: 4%; font-size: 1rem; }
          .hero-scroll { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-ticker-track { animation: none; }
        }
      `}</style>
    </section>
  );
}
