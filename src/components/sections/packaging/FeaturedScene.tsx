import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';
import AlphaVideo from '../../global/AlphaVideo';
import type { AlphaVideoHandle } from '../../global/AlphaVideo';
import { honey, honeyVideo } from '../../../data/packaging';
import PackInfo from './PackInfo';

gsap.registerPlugin(ScrollTrigger);

type Layer = 'rest' | 'v1' | 'p1' | 'v2' | 'p2';
type Lenis = { stop: () => void; start: () => void };
const lenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;

type Props = {
  /** ≤ 768px: no pin, no scroll lock */
  compact: boolean;
  reduced: boolean;
  onOpen: (key: string, origin: { x: number; y: number }) => void;
};

/**
 * The featured project, told in two beats. The flat Croppd Honey label rests on the stage;
 * the first scroll plays a transparent video in which it wraps onto the jar, the second
 * scroll plays the jar landing on its board. Scroll triggers a beat, it never scrubs it:
 * each video plays whole, at its own speed, while the page is held.
 */
export default function FeaturedScene({ compact, reduced, onOpen }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const layers = useRef<Partial<Record<Layer, HTMLElement | null>>>({});
  const v1 = useRef<AlphaVideoHandle>(null);
  const v2 = useRef<AlphaVideoHandle>(null);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [skippable, setSkippable] = useState(false);
  const [entered, setEntered] = useState(false);
  // videos are only fetched when they are about to be needed
  const [near, setNear] = useState(false);
  const [armed, setArmed] = useState(false);
  const [hover, setHover] = useState(false);
  const [hinted, setHinted] = useState(false);

  // what the scroll / timers read; mirrors the state above without re-running effects
  const S = useRef({ step: 0, playing: 0, target: 0, token: 0, locked: false, mark: 0 });
  const timers = useRef<number[]>([]);
  const zoom = compact ? honeyVideo.zoom * 1.12 : honeyVideo.zoom;
  const mode: 'pin' | 'flow' | 'still' = reduced ? 'still' : compact ? 'flow' : 'pin';

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const unlock = () => {
    if (!S.current.locked) return;
    S.current.locked = false;
    lenis()?.start();
  };

  const finishRef = useRef<() => void>(() => {});

  /** Show one layer of the stack (label, a video, or a last-frame poster) */
  const show = useCallback((name: Layer, fade = 0) => {
    (Object.keys(layers.current) as Layer[]).forEach((k) => {
      const el = layers.current[k];
      if (el) gsap.to(el, { opacity: k === name ? 1 : 0, duration: fade, ease: 'power1.inOut', overwrite: true });
    });
  }, []);

  /** Rest on a state without playing anything (scrolling back, fast jumps, reduced motion) */
  const settle = useCallback(
    (to: number, fade = 0.4) => {
      const s = S.current;
      s.token++;
      s.playing = 0;
      s.step = to;
      clearTimers();
      v1.current?.pause();
      v2.current?.pause();
      show(to === 0 ? 'rest' : to === 1 ? 'p1' : 'p2', fade);
      gsap.to(boxRef.current, { scale: to === 0 ? 1 : zoom, duration: fade ? 0.6 : 0, ease: 'power2.inOut', overwrite: true });
      setStep(to);
      setPlaying(false);
      setSkippable(false);
      unlock();
    },
    [show, zoom],
  );

  /** Play one beat from its first frame to its last */
  const play = useCallback(
    (n: 1 | 2, hold: boolean) => {
      const s = S.current;
      const video = n === 1 ? v1.current : v2.current;
      if (!video || !honeyVideo.available) return settle(n);
      const token = ++s.token;
      s.playing = n;
      clearTimers();
      setPlaying(true);
      setSkippable(false);
      if (n === 1) setArmed(true);
      if (hold && !s.locked) {
        s.locked = true;
        lenis()?.stop();
      }

      const finish = () => {
        if (token !== s.token) return;
        s.token++;
        s.playing = 0;
        s.step = n;
        s.mark = window.scrollY;
        clearTimers();
        // the poster is the video's own last frame: nothing moves at the swap
        show(n === 1 ? 'p1' : 'p2');
        gsap.set(boxRef.current, { scale: zoom });
        setStep(n);
        setPlaying(false);
        setSkippable(false);
        // a short hold on the last frame, then the page moves again
        timers.current.push(
          window.setTimeout(() => {
            unlock();
            if (S.current.target > n && n === 1 && mode === 'pin') play(2, true);
          }, 200),
        );
      };
      finishRef.current = finish;

      video.seek(0);
      // swap on the first painted frame: the label simply starts to move
      video.whenPainted(() => {
        if (token === s.token) show(n === 1 ? 'v1' : 'v2');
      });
      video.play().catch(finish);
      if (n === 1) gsap.to(boxRef.current, { scale: zoom, duration: honeyVideo.beat * 0.9, delay: 0.05, ease: 'power2.inOut', overwrite: true });
      const length = honeyVideo.beat * 1000;
      timers.current.push(window.setTimeout(() => token === s.token && setSkippable(true), 600));
      // safety net if the ended event never comes
      timers.current.push(window.setTimeout(finish, length + 1500));
    },
    [mode, settle, show, zoom],
  );

  // fetch video 1 once the chapter is close
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !honeyVideo.available) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '1800px 0px' },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    show('rest');
    gsap.set(boxRef.current, { scale: 1 });
    S.current = { step: 0, playing: 0, target: 0, token: S.current.token + 1, locked: false, mark: 0 };
    setStep(0);

    const [t1, t2] = honeyVideo.thresholds;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: root, start: 'top 62%', once: true, onEnter: () => setEntered(true) });

      if (mode === 'pin') {
        // one pinned screen; crossing a threshold fires the next beat once
        const sync = (self: ScrollTrigger) => {
          const s = S.current;
          s.target = self.progress < t1 ? 0 : self.progress < t2 ? 1 : 2;
          if (s.playing) {
            if (s.target < s.playing) settle(s.target);
            return;
          }
          if (s.target > s.step) {
            // a jump through the chapter (menu link, dragged scrollbar) lands on the state, it does not hold the page
            const passing = !self.isActive || Math.abs(self.getVelocity()) > 3200;
            if (passing) settle(s.target, 0.3);
            else play((s.step + 1) as 1 | 2, true);
          } else if (s.target < s.step) settle(s.target);
        };
        ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: `+=${honeyVideo.pin}%`,
          pin: true,
          anticipatePin: 1,
          onUpdate: sync,
          onLeaveBack: () => S.current.step !== 0 && settle(0),
        });
      } else if (mode === 'flow') {
        // phones: the first beat plays when the stage is well in view, the second a quarter-screen later
        ScrollTrigger.create({
          trigger: root,
          start: 'top 35%',
          end: 'bottom top',
          onEnter: () => S.current.step === 0 && !S.current.playing && play(1, false),
          onUpdate: () => {
            const s = S.current;
            if (s.step === 1 && !s.playing && window.scrollY - s.mark > window.innerHeight * 0.25) play(2, false);
          },
          onLeaveBack: () => settle(0, 0.3),
        });
      } else {
        // reduced motion: the three states crossfade at the thresholds, nothing plays by itself
        ScrollTrigger.create({
          trigger: root,
          start: 'top 45%',
          end: 'bottom 55%',
          onUpdate: (self) => {
            const to = self.progress < 0.34 ? 0 : self.progress < 0.67 ? 1 : 2;
            if (to !== S.current.step && !S.current.playing) settle(to);
          },
        });
      }
    }, root);

    return () => {
      clearTimers();
      unlock();
      ctx.revert();
    };
  }, [mode, play, settle, show]);

  const skip = () => finishRef.current();
  /** The ▶ PLAY sticker (phones, reduced motion): watch the next beat on request */
  const playNext = () => {
    const s = S.current;
    if (s.playing) return;
    if (s.step < 2) play((s.step + 1) as 1 | 2, false);
    else {
      settle(0, 0);
      play(1, false);
    }
  };
  const open = (e: React.MouseEvent) => {
    if (S.current.playing) return;
    setHinted(true);
    onOpen(S.current.step === 0 ? 'label' : 'jar', { x: e.clientX || window.innerWidth * 0.32, y: e.clientY || window.innerHeight * 0.5 });
  };

  const now = playing ? Math.max(step, S.current.playing) : step;
  const lit = 2 + now;
  const idle = step === 0 && !playing;
  const beat = Math.max(1, now);

  return (
    <div
      ref={rootRef}
      className={`pkf pkf--${mode}${entered ? ' is-in' : ''}${playing ? ' is-playing' : ''}${idle ? ' is-rest' : ''}${hover && !playing ? ' is-hover' : ''}`}
      data-step={step}
      style={{ '--zoom': zoom } as CSSProperties}
    >
      <div className="pkf-stage">
        <div className="pkf-float">
          <div className="pkf-lift">
            <div ref={boxRef} className="pkf-box" style={{ aspectRatio: String(honeyVideo.aspect) }}>
              <img
                ref={(el) => {
                  layers.current.rest = el;
                }}
                className="pkf-layer"
                src={honeyVideo.wrap.first}
                alt="Croppd Honey wrap-around label, laid flat"
                draggable={false}
              />
              {near && (
                <span
                  ref={(el) => {
                    layers.current.v1 = el;
                  }}
                  className="pkf-layer"
                  style={{ opacity: 0 }}
                >
                  <AlphaVideo ref={v1} src={honeyVideo.wrap.src} playbackRate={honeyVideo.wrap.duration / honeyVideo.beat} preload="auto" onEnded={() => S.current.playing === 1 && finishRef.current()} style={{ width: '100%', height: '100%' }} />
                </span>
              )}
              <img
                ref={(el) => {
                  layers.current.p1 = el;
                }}
                className="pkf-layer"
                style={{ opacity: 0 }}
                src={honeyVideo.wrap.last}
                alt="Croppd Honey jar with its burlap cap and the label wrapped on"
                loading="lazy"
                draggable={false}
              />
              {armed && (
                <span
                  ref={(el) => {
                    layers.current.v2 = el;
                  }}
                  className="pkf-layer"
                  style={{ opacity: 0 }}
                >
                  <AlphaVideo ref={v2} src={honeyVideo.land.src} playbackRate={honeyVideo.land.duration / honeyVideo.beat} preload="auto" onEnded={() => S.current.playing === 2 && finishRef.current()} style={{ width: '100%', height: '100%' }} />
                </span>
              )}
              <img
                ref={(el) => {
                  layers.current.p2 = el;
                }}
                className="pkf-layer"
                style={{ opacity: 0 }}
                src={honeyVideo.land.last}
                alt="Croppd Honey jar on a wooden board with a dipper and a piece of honeycomb"
                loading="lazy"
                draggable={false}
              />
            </div>
          </div>
        </div>
        <i className="pkf-shadow" aria-hidden="true" />

        {/* the object itself is the button: the flat label at rest, the jar afterwards */}
        <button
          type="button"
          className="pkf-hit"
          data-cursor="VIEW"
          aria-label={`Open ${honey.name} full screen`}
          onClick={open}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
          onPointerLeave={() => {
            setHover(false);
            if (step > 0 && hover) setHinted(true);
          }}
        />
        {hover && !hinted && step > 0 && !playing && (
          <span className="sticker sticker--acid pkf-hint" aria-hidden="true">
            CLICK TO OPEN ✦
          </span>
        )}

        <span className="pkf-count" aria-live="polite">
          {String(beat).padStart(2, '0')} / 02
        </span>
        {mode === 'pin' && (
          <span className={`pkf-cue${playing || step === 2 ? ' is-off' : ''}`} aria-hidden="true">
            SCROLL <i>↓</i>
          </span>
        )}
        {mode !== 'pin' && honeyVideo.available && !playing && (
          <button type="button" className="sticker sticker--acid pkf-play" onClick={playNext}>
            ▶ {step === 2 ? 'REPLAY' : 'PLAY'}
          </button>
        )}
        {skippable && mode === 'pin' && (
          <button type="button" className="sticker sticker--acid pkf-skip" data-cursor="SKIP" onClick={skip}>
            SKIP ↓
          </button>
        )}
      </div>

      <PackInfo project={honey} kicker="FEATURED PROJECT" active={lit} entered={entered} className="pkf-info" />
    </div>
  );
}
