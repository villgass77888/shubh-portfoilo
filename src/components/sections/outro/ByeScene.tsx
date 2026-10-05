import { useRef } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';
import { siteInfo } from '../../../data/portfolio';

gsap.registerPlugin(ScrollTrigger);

const LETTERS = ['B', 'Y', 'E'];
const WORDS = ['UNTIL', 'WE', 'WORK', 'TOGETHER', 'SOON'];
/** Hover tilt per letter, in degrees — fixed so the card is identical on every load */
const TILTS = [-1.4, 1.1, -1.1];

const css = `
  .bye-root {
    position: relative;
    background: #000;
    color: var(--bone);
  }

  /* Fade to black out of the paper scene above — eased stops, no hard line */
  .bye-fade {
    height: 42vh;
    background: linear-gradient(to bottom, var(--paper), #000);
    background: linear-gradient(
      to bottom,
      var(--paper) 0%,
      color-mix(in srgb, var(--paper) 97%, #000) 8%,
      color-mix(in srgb, var(--paper) 88%, #000) 20%,
      color-mix(in srgb, var(--paper) 72%, #000) 34%,
      color-mix(in srgb, var(--paper) 50%, #000) 50%,
      color-mix(in srgb, var(--paper) 28%, #000) 66%,
      color-mix(in srgb, var(--paper) 12%, #000) 80%,
      color-mix(in srgb, var(--paper) 3%, #000) 92%,
      #000 100%
    );
  }

  /* The cinema frame — exactly one viewport tall, the last thing on the page */
  .bye-frame {
    --bye-bar: 9vh;
    --bye-size: min(34vw, 50vh);
    position: relative;
    isolation: isolate;
    overflow: hidden;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: calc(var(--bye-bar) + clamp(0.75rem, 3vh, 2.5rem)) clamp(1.25rem, 5vw, 4rem);
    background: #000;
  }
  @supports (height: 100svh) {
    .bye-frame {
      --bye-bar: 9svh;
      --bye-size: min(34vw, 50svh);
      min-height: 100svh;
    }
  }

  .bye-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  /* Projector flicker — black sheet whose opacity is the frame's brightness */
  .bye-flicker {
    z-index: 5;
    background: #000;
    opacity: 0;
  }

  /* Letterbox */
  .bye-bar {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 6;
    height: var(--bye-bar);
    background: #000;
    pointer-events: none;
  }
  .bye-bar--top { top: 0; }
  .bye-bar--bottom { bottom: 0; }

  .bye-credit {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 7;
    height: var(--bye-bar);
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 0.34em;
    font-family: var(--font-meta);
    font-size: clamp(0.56rem, 0.72vw, 0.68rem);
    letter-spacing: 0.34em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
    color: color-mix(in srgb, var(--bone) 52%, transparent);
  }

  /* Title block */
  .bye-push {
    position: relative;
    z-index: 2;
    max-width: 100%;
  }
  .bye-live .bye-push { will-change: transform; }
  .bye-title {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    font-weight: 400;
  }
  .bye-kicker {
    display: block;
    padding-left: 0.5em;
    margin-bottom: calc(var(--bye-size) * 0.075);
    font-family: var(--font-meta);
    font-size: clamp(0.6rem, 0.8vw, 0.74rem);
    letter-spacing: 0.5em;
    line-height: 1.4;
    white-space: nowrap;
    color: color-mix(in srgb, var(--bone) 62%, transparent);
  }
  .bye-word {
    position: relative;
    display: inline-flex;
    font-family: var(--font-display);
    font-size: var(--bye-size);
    line-height: 0.85;
    color: var(--bone);
    user-select: none;
    -webkit-user-select: none;
  }
  .bye-letter,
  .bye-gl {
    display: inline-block;
  }
  .bye-letter + .bye-letter,
  .bye-gl + .bye-gl {
    margin-left: -0.012em;
  }
  .bye-letter-in {
    display: inline-block;
    transform-origin: 50% 88%;
    transition: transform 0.7s var(--ease-enter);
  }
  @media (hover: hover) and (pointer: fine) {
    .bye-letter:hover .bye-letter-in {
      transform: translate3d(0, -0.018em, 0) rotate(var(--bye-tilt, 0deg));
    }
  }

  .bye-sub {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 100%;
    margin-top: calc(var(--bye-size) * 0.085);
    font-size: clamp(0.8rem, 2.1vw, 1.9rem);
  }
  .bye-rule {
    display: block;
    align-self: stretch;
    height: 1px;
    margin-inline: -1.1em;
    background: var(--bone);
    opacity: 0.38;
    transform-origin: 50% 50%;
  }
  .bye-line {
    display: block;
    margin-block: 0.82em;
    font-family: var(--font-heading);
    font-weight: 900;
    font-stretch: 125%;
    letter-spacing: 0.28em;
    line-height: 1.3;
    text-wrap: balance;
    color: var(--bone);
    opacity: 0.9;
  }
  .bye-mask {
    display: inline-block;
    overflow: hidden;
    vertical-align: top;
    margin-right: -0.28em;
    padding-block: 0.06em;
  }
  .bye-w {
    display: inline-block;
  }

  /* Phones — bigger BYE, thinner bars, the line breaks into two balanced rows */
  @media (max-width: 640px) {
    .bye-frame {
      --bye-bar: 6vh;
      --bye-size: min(56vw, 42vh);
    }
    @supports (height: 100svh) {
      .bye-frame {
        --bye-bar: 6svh;
        --bye-size: min(56vw, 42svh);
      }
    }
    .bye-sub {
      font-size: clamp(0.9rem, 4.3vw, 1.2rem);
    }
    .bye-rule { margin-inline: 0; }
    .bye-line { max-width: 16.4em; }
  }
`;

/**
 * Outro scene 3 — the end card.
 * Fade to black out of the contact footer, then a letterboxed frame:
 * "BYE" / "UNTIL WE WORK TOGETHER SOON", revealed like the closing card of a film.
 */
export default function ByeScene() {
  const rootRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Reduced motion: the CSS at-rest state already is the finished card
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const frame = root.querySelector<HTMLElement>('.bye-frame');
      if (!frame) return;
      let live = false;



      // The slow push-in that follows the reveal
      const pushIn = gsap.fromTo(
        '.bye-push',
        { scale: 1 },
        { scale: 1.045, duration: 14, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true },
      );

      const reveal = gsap.timeline({
        scrollTrigger: {
          trigger: frame,
          start: 'top 62%',
          toggleActions: 'play none none reverse',
        },
        onComplete: () => {
          if (live) pushIn.play();
        },
        onReverseComplete: () => {
          pushIn.pause(0);
        },
      });

      reveal
        // 1 — projector comes on: brightness dips twice
        .fromTo('.bye-flicker', { opacity: 1 }, { opacity: 0.2, duration: 0.12, ease: 'none' }, 0)
        .to('.bye-flicker', { opacity: 0.8, duration: 0.06, ease: 'none' })
        .to('.bye-flicker', { opacity: 0.08, duration: 0.13, ease: 'none' })
        .to('.bye-flicker', { opacity: 0.52, duration: 0.05, ease: 'none' })
        .to('.bye-flicker', { opacity: 0, duration: 0.55, ease: 'power2.out' })
        // 2 — letterbox closes in
        .fromTo('.bye-bar--top', { yPercent: -101 }, { yPercent: 0, duration: 1.1, ease: 'power3.out' }, 0.2)
        .fromTo('.bye-bar--bottom', { yPercent: 101 }, { yPercent: 0, duration: 1.1, ease: 'power3.out' }, 0.2)
        // 3 — BYE comes out of a vertical blur, letter by letter
        .fromTo(
          '.bye-letter',
          { filter: 'blur(28px)', scaleY: 1.7, opacity: 0 },
          { filter: 'blur(0px)', scaleY: 1, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.14 },
          0.6,
        )
        // 4 — hairlines draw outward from the centre
        .fromTo('.bye-rule', { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'expo.inOut', stagger: 0.12 }, 1.45)
        // 5 — the line rises word by word from behind its masks
        .fromTo('.bye-w', { yPercent: 110 }, { yPercent: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09 }, 1.95)
        // 6 — kicker and credit
        .fromTo('.bye-kicker, .bye-credit', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power1.out', stagger: 0.18 }, 2.7);

      // Ambient motion only runs while the frame is visible. The same observer is a
      // safety net: if the frame is mostly on screen and the reveal never started,
      // start it — the card must never be left black.
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          live = entry.isIntersecting;
          root.classList.toggle('bye-live', live);
          if (!live) pushIn.pause();
          else if (reveal.progress() === 1) pushIn.play();
          if (entry.intersectionRatio >= 0.6 && reveal.progress() === 0) reveal.play();
        },
        { threshold: [0, 0.6] },
      );
      io.observe(frame);

      return () => {
        io.disconnect();
        root.classList.remove('bye-live');
      };
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bye-root">
      <div className="bye-fade" aria-hidden="true" />

      <div className="bye-frame">


        {/* Title */}
        <div className="bye-push">
          <h2 className="bye-title" aria-label="Bye — until we work together soon">
            <span className="bye-kicker" aria-hidden="true">✦ FIN ✦</span>

            <span className="bye-word" aria-hidden="true">
              {LETTERS.map((char, i) => (
                <span key={char} className="bye-letter" style={{ '--bye-tilt': `${TILTS[i]}deg` } as CSSProperties}>
                  <span className="bye-letter-in">{char}</span>
                </span>
              ))}
            </span>

            <span className="bye-sub" aria-hidden="true">
              <span className="bye-rule" />
              <span className="bye-line">
                {WORDS.map((word, i) => (
                  <span key={word}>
                    <span className="bye-mask">
                      <span className="bye-w">{word}</span>
                    </span>
                    {i < WORDS.length - 1 ? ' ' : null}
                  </span>
                ))}
              </span>
              <span className="bye-rule" />
            </span>
          </h2>
        </div>

        {/* Film finish */}
        <div className="bye-layer bye-flicker" aria-hidden="true" />

        {/* Letterbox */}
        <div className="bye-bar bye-bar--top" aria-hidden="true" />
        <div className="bye-bar bye-bar--bottom" aria-hidden="true" />
        <p className="bye-credit">© {siteInfo.year} {siteInfo.name}</p>
      </div>

      <style>{css}</style>
    </div>
  );
}
