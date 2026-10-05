import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';

gsap.registerPlugin(ScrollTrigger);

/** Magnification of the lettering inside the crop viewfinder */
const ZOOM = 1.25;
/** Pointer-follow stiffness (1/s) — lower = heavier lag */
const FOLLOW = 7;
/** Angular speed of the idle drift: one full figure-eight every 18s */
const DRIFT_SPEED = (Math.PI * 2) / 18;
/** Room kept between the frame and the scene edge (the readouts live in the vertical one) */
const PAD_X = 14;
const PAD_Y = 30;

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.2'/%3E%3C/svg%3E")`;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));
const pad4 = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, '0');

/**
 * The lettering block. Rendered twice from this one component — once as the real
 * thing and once (aria-hidden) inside the viewfinder — so the magnified copy can
 * never drift from the original. Only the live copy carries the reveal class.
 */
function Lettering({ clone = false }: { clone?: boolean }) {
  const word = clone ? 'ty-big' : 'ty-big ty-word';
  return (
    <div className="ty-lettering" aria-hidden={clone ? true : undefined}>
      <div className="ty-bigs">
        <div className="ty-line">
          <span className={word}>THANK</span>
        </div>
        <div className="ty-line">
          <span className={word}>YOU</span>
        </div>
      </div>
      <div className="ty-sub">
        <span className="ty-meta">FOR SCROLLING THIS FAR</span>
      </div>
      <div className="ty-sub">
        <span className="ty-hand">seriously, it means a lot ♥</span>
      </div>
    </div>
  );
}

/**
 * Outro scene 1 — the THANK YOU on black, with film grain, a drifting light leak
 * and a square crop viewfinder (3×3 grid) that follows the cursor and shows the
 * lettering enlarged inside it.
 */
export default function ThankYouScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const vfRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    const vf = vfRef.current;
    const clone = cloneRef.current;
    if (!root || !scene || !vf || !clone) return;

    const lettering = scene.querySelector<HTMLElement>(':scope > .ty-lettering');
    const bigs = lettering?.querySelector<HTMLElement>('.ty-bigs');
    if (!lettering || !bigs) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Viewfinder state (scene coordinates, px) ── */
    const st = {
      w: 0,
      h: 0,
      half: 0,
      // lettering centre + drift amplitudes
      lx: 0,
      ly: 0,
      ax: 0,
      ay: 0,
      // bounds for the frame centre
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      // smoothed frame centre
      x: 0,
      y: 0,
      /** 0 = idle drift, 1 = on the cursor */
      mix: 0,
      /** drift clock (s) — only advances while the scene is on screen */
      t: 0,
      inside: false,
      placed: false,
    };
    /** Last known mouse position: client coords + frozen scene coords */
    const ptr = { seen: false, cx: 0, cy: 0, sx: 0, sy: 0 };
    let lastRx = -1;
    let lastRy = -1;

    const render = (rect: DOMRect, settled: boolean) => {
      let px = st.x - st.half;
      let py = st.y - st.half;
      if (settled) {
        // at rest: land the hairlines on whole screen pixels
        px = Math.round(px + rect.left) - rect.left;
        py = Math.round(py + rect.top) - rect.top;
      }
      const cx = px + st.half;
      const cy = py + st.half;
      // Lens and counter-transform come from the SAME centre in the same tick,
      // so the magnified lettering can never swim against the frame.
      vf.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0)`;
      clone.style.transform = `translate3d(${(st.half - cx * ZOOM).toFixed(2)}px, ${(st.half - cy * ZOOM).toFixed(2)}px, 0) scale(${ZOOM})`;

      const rx = Math.round(cx);
      const ry = Math.round(cy);
      if ((rx !== lastRx || ry !== lastRy) && readoutRef.current) {
        lastRx = rx;
        lastRy = ry;
        readoutRef.current.textContent = `X ${pad4(rx)}  Y ${pad4(ry)}`;
      }
    };

    const measure = () => {
      const rect = scene.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      st.w = rect.width;
      st.h = rect.height;

      // side ≈ clamp(190px, 26vw, 380px) on desktop, ≈ 58vw on phones; snapped to a
      // multiple of 6 so the half and the thirds are whole pixels (crisp hairlines)
      const want = Math.max(Math.min(st.w * 0.48, 210), clamp(st.w * 0.21, 150, 310));
      const fit = Math.min(st.w - PAD_X * 2, st.h - PAD_Y * 2);
      const side = Math.max(60, Math.round(Math.min(want, fit) / 6) * 6);
      st.half = side / 2;

      root.style.setProperty('--ty-w', `${st.w}px`);
      root.style.setProperty('--ty-h', `${st.h}px`);
      root.style.setProperty('--ty-side', `${side}px`);
      root.style.setProperty('--ty-third', `${side / 3}px`);

      st.minX = st.half + PAD_X;
      st.maxX = st.w - st.half - PAD_X;
      st.minY = st.half + PAD_Y;
      st.maxY = st.h - st.half - PAD_Y;

      // layout boxes (offset*) are immune to the reveal's transforms
      st.lx = clamp(lettering.offsetLeft + bigs.offsetLeft + bigs.offsetWidth / 2, st.minX, st.maxX);
      st.ly = clamp(lettering.offsetTop + bigs.offsetTop + bigs.offsetHeight / 2, st.minY, st.maxY);
      st.ax = reduced ? 0 : Math.max(0, Math.min(bigs.offsetWidth * 0.36, st.maxX - st.lx, st.lx - st.minX));
      st.ay = reduced ? 0 : Math.max(0, Math.min(bigs.offsetHeight * 0.24, st.maxY - st.ly, st.ly - st.minY));

      if (!st.placed) {
        st.placed = true;
        st.x = st.lx;
        st.y = st.ly;
      } else {
        st.x = clamp(st.x, st.minX, st.maxX);
        st.y = clamp(st.y, st.minY, st.maxY);
      }
      render(rect, reduced);
    };

    const tick = (_time: number, deltaMs: number) => {
      if (!st.placed) return;
      const dt = Math.min(deltaMs || 16.7, 64) / 1000;
      const rect = scene.getBoundingClientRect();

      // Hit-test every frame (not on pointer events) so scrolling the scene under
      // a resting mouse still counts as entering / leaving.
      const inside =
        ptr.seen && ptr.cx >= rect.left && ptr.cx <= rect.right && ptr.cy >= rect.top && ptr.cy <= rect.bottom;
      if (inside) {
        ptr.sx = ptr.cx - rect.left;
        ptr.sy = ptr.cy - rect.top;
      }
      if (inside !== st.inside) {
        st.inside = inside;
        if (reduced) {
          st.mix = inside ? 1 : 0;
        } else {
          gsap.to(st, {
            mix: inside ? 1 : 0,
            duration: inside ? 0.5 : 1.3,
            ease: inside ? 'power2.out' : 'power2.inOut',
            overwrite: true,
          });
        }
      }

      // idle: slow figure-eight across the lettering
      st.t += dt;
      const dx = st.lx + st.ax * Math.sin(DRIFT_SPEED * st.t);
      const dy = st.ly + st.ay * Math.sin(DRIFT_SPEED * 2 * st.t);

      const tx = clamp(dx + (ptr.sx - dx) * st.mix, st.minX, st.maxX);
      const ty = clamp(dy + (ptr.sy - dy) * st.mix, st.minY, st.maxY);

      let settled = reduced;
      if (reduced) {
        st.x = tx;
        st.y = ty;
      } else {
        const k = 1 - Math.exp(-FOLLOW * dt);
        st.x += (tx - st.x) * k;
        st.y += (ty - st.y) * k;
        if (st.mix === 1 && Math.abs(tx - st.x) < 0.08 && Math.abs(ty - st.y) < 0.08) {
          st.x = tx;
          st.y = ty;
          settled = true;
        }
      }
      render(rect, settled);
    };

    /* ── Pointer tracking (mouse / pen only — touch keeps the idle drift) ── */
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      ptr.seen = true;
      ptr.cx = e.clientX;
      ptr.cy = e.clientY;
    };
    const onPointerGone = () => {
      ptr.seen = false;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerGone);

    /* ── Scroll / time animation ── */
    let leak: gsap.core.Tween | null = null;
    const ctx = gsap.context(() => {
      if (reduced) return; // static: everything visible, viewfinder centred

      const brackets = gsap.utils.toArray<HTMLElement>('.ty-br');
      const ticks = gsap.utils.toArray<HTMLElement>('.ty-tk');

      // Word reveal, then the frame "draws on". One timeline, so reversing it
      // (scrolling back above the scene) hides the viewfinder before the words.
      const tl = gsap.timeline({ paused: true });
      tl.from('.ty-word', {
        filter: 'blur(30px)',
        scaleY: 2,
        opacity: 0,
        stagger: 0.3,
        duration: 1,
        ease: 'expo.out',
      })
        .addLabel('frame')
        .fromTo(
          '.ty-vf-in',
          { autoAlpha: 0, scale: 1.14 },
          { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out' },
          'frame',
        )
        .from(brackets, { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(2.6)', stagger: 0.05 }, 'frame+=0.1')
        .from('.ty-gv', { scaleY: 0, duration: 0.55, ease: 'power3.out', stagger: 0.08 }, 'frame+=0.14')
        .from('.ty-gh', { scaleX: 0, duration: 0.55, ease: 'power3.out', stagger: 0.08 }, 'frame+=0.22')
        .from(ticks, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.out', stagger: 0.04 }, 'frame+=0.3')
        .from('.ty-cross', { scale: 0, rotation: -90, duration: 0.45, ease: 'back.out(2)' }, 'frame+=0.3')
        .from('.ty-tag', { autoAlpha: 0, y: 5, duration: 0.35, ease: 'power2.out', stagger: 0.07 }, 'frame+=0.38');

      ScrollTrigger.create({
        trigger: scene,
        start: 'top 50%',
        onEnter: () => tl.timeScale(1).play(),
        onLeaveBack: () => tl.timeScale(2).reverse(),
      });

      // Small lines (live + magnified copy fade together)
      gsap.from('.ty-sub', {
        opacity: 0,
        duration: 0.5,
        scrollTrigger: {
          trigger: scene,
          start: 'top 30%',
          toggleActions: 'play none none reverse',
        },
      });

      // Light leak drift
      leak = gsap.to('.ty-leak', {
        x: '30vw',
        y: '-10vh',
        duration: 8,
        ease: 'none',
        repeat: -1,
        yoyo: true,
        paused: true,
      });
    }, root);

    /* ── Run only while the scene is on screen ── */
    let running = false;
    const setRunning = (on: boolean) => {
      if (on === running) return;
      running = on;
      if (on) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
      leak?.paused(!on);
    };
    const io = new IntersectionObserver((entries) => {
      setRunning(entries[entries.length - 1].isIntersecting);
    });
    io.observe(scene);

    const ro = new ResizeObserver(measure);
    ro.observe(scene);
    ro.observe(bigs);
    measure();

    return () => {
      io.disconnect();
      ro.disconnect();
      setRunning(false);
      gsap.killTweensOf(st);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('mouseleave', onPointerGone);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="ty-root">
      <style>{STYLES}</style>

      <div ref={sceneRef} className="ty-scene outro-scene1">
        {/* Light leak */}
        <div className="ty-leak" />

        {/* Film grain */}
        <div className="ty-grain" style={{ backgroundImage: GRAIN }} />

        {/* THANK YOU */}
        <Lettering />

        {/* Square crop viewfinder — follows the cursor, shows the lettering enlarged */}
        <div ref={vfRef} className="ty-vf" aria-hidden="true">
          <div className="ty-vf-in">
            <div className="ty-lens">
              <div ref={cloneRef} className="ty-clone">
                <Lettering clone />
              </div>
              <div className="ty-lens-grain" style={{ backgroundImage: GRAIN }} />
            </div>

            <div className="ty-border" />
            <span className="ty-gv ty-gv--a" />
            <span className="ty-gv ty-gv--b" />
            <span className="ty-gh ty-gh--a" />
            <span className="ty-gh ty-gh--b" />

            <span className="ty-br ty-br--tl" />
            <span className="ty-br ty-br--tr" />
            <span className="ty-br ty-br--br" />
            <span className="ty-br ty-br--bl" />

            <span className="ty-tk ty-tk--t" />
            <span className="ty-tk ty-tk--r" />
            <span className="ty-tk ty-tk--b" />
            <span className="ty-tk ty-tk--l" />

            <span className="ty-cross" />

            <span className="ty-tag ty-tag--ratio">1:1</span>
            <span className="ty-tag ty-tag--zoom">×{ZOOM.toFixed(2)}</span>
            <span ref={readoutRef} className="ty-tag ty-tag--pos">
              {'X 0000  Y 0000'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const STYLES = `
.ty-scene {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background-color: var(--bg-outro);
  overflow: hidden;
}
.ty-leak {
  position: absolute;
  left: calc(50% - 25vw);
  top: calc(50% - 25vh);
  width: 50vw;
  height: 50vh;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255,120,60,0.15), transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}
.ty-grain {
  position: absolute;
  inset: 0;
  background-size: 200px;
  opacity: 0.14;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* ── Lettering (shared by the real block and the magnified copy) ── */
.ty-lettering {
  position: relative;
  z-index: 2;
  text-align: center;
}
.ty-line { overflow: hidden; }
.ty-big {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(3rem, 22vw, 18rem);
  line-height: 0.85;
  color: var(--bone);
}
.ty-sub { margin-top: 1.5rem; }
.ty-meta {
  font-family: var(--font-meta);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--bone);
  opacity: 0.6;
}
.ty-hand {
  font-family: var(--font-handwritten);
  font-size: 1.2rem;
  color: var(--bone);
  opacity: 0.7;
}

/* ── Viewfinder ── */
.ty-vf {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  width: var(--ty-side, clamp(150px, 21vw, 310px));
  height: var(--ty-side, clamp(150px, 21vw, 310px));
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform;
}
.ty-vf-in {
  position: absolute;
  inset: 0;
}
.ty-lens {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-color: var(--ink);
}
/* a layer exactly the size of the scene, laid out exactly like it */
.ty-clone {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--ty-w, 100vw);
  height: var(--ty-h, 100vh);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  transform-origin: 0 0;
  will-change: transform;
}
.ty-lens-grain {
  position: absolute;
  inset: 0;
  background-size: 200px;
  opacity: 0.1;
  mix-blend-mode: overlay;
}

.ty-border {
  position: absolute;
  inset: 0;
  border: 1px solid var(--bone);
  opacity: 0.7;
  /* dark keylines either side so the edge still reads where it crosses a letter */
  box-shadow: 0 0 0 1px var(--bg-outro), inset 0 0 0 1px var(--bg-outro);
}
.ty-gv,
.ty-gh {
  position: absolute;
  background-color: var(--bone);
  opacity: 0.34;
  mix-blend-mode: difference;
}
.ty-gv { top: 1px; bottom: 1px; width: 1px; transform-origin: 50% 0; }
.ty-gh { left: 1px; right: 1px; height: 1px; transform-origin: 0 50%; }
.ty-gv--a { left: var(--ty-third, 33.333%); }
.ty-gv--b { left: calc(var(--ty-third, 33.333%) * 2); }
.ty-gh--a { top: var(--ty-third, 33.333%); }
.ty-gh--b { top: calc(var(--ty-third, 33.333%) * 2); }

/* crop handles: L brackets on the corners, short bars on the edge midpoints */
.ty-br {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 0 solid var(--signal);
}
.ty-br--tl { left: -3px; top: -3px; border-left-width: 3px; border-top-width: 3px; transform-origin: 0 0; }
.ty-br--tr { right: -3px; top: -3px; border-right-width: 3px; border-top-width: 3px; transform-origin: 100% 0; }
.ty-br--br { right: -3px; bottom: -3px; border-right-width: 3px; border-bottom-width: 3px; transform-origin: 100% 100%; }
.ty-br--bl { left: -3px; bottom: -3px; border-left-width: 3px; border-bottom-width: 3px; transform-origin: 0 100%; }

.ty-tk {
  position: absolute;
  background-color: var(--signal);
}
.ty-tk--t, .ty-tk--b { left: calc(50% - 9px); width: 18px; height: 3px; }
.ty-tk--l, .ty-tk--r { top: calc(50% - 9px); width: 3px; height: 18px; }
.ty-tk--t { top: -3px; }
.ty-tk--b { bottom: -3px; }
.ty-tk--l { left: -3px; }
.ty-tk--r { right: -3px; }

.ty-cross {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
}
.ty-cross::before,
.ty-cross::after {
  content: '';
  position: absolute;
  background-color: var(--signal);
}
.ty-cross::before { left: -7px; top: 0; width: 15px; height: 1px; }
.ty-cross::after { left: 0; top: -7px; width: 1px; height: 15px; }

/* readouts sit on small plates so they stay legible when they pass over a letter */
.ty-tag {
  position: absolute;
  padding: 4px 6px;
  font-family: var(--font-meta);
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: pre;
  color: var(--bone);
  background-color: var(--bg-outro);
}
.ty-tag--ratio {
  left: -3px;
  bottom: calc(100% + 8px);
  background-color: var(--signal);
  font-weight: 700;
}
.ty-tag--zoom {
  left: -3px;
  top: calc(100% + 8px);
  color: color-mix(in srgb, var(--bone) 62%, transparent);
}
.ty-tag--pos {
  right: -3px;
  top: calc(100% + 8px);
}

@media (max-width: 640px) {
  .ty-br { width: 16px; height: 16px; }
  .ty-tk--t, .ty-tk--b { left: calc(50% - 6px); width: 12px; }
  .ty-tk--l, .ty-tk--r { top: calc(50% - 6px); height: 12px; }
  .ty-tag { font-size: 9px; padding: 3px 5px; }
}
`;
