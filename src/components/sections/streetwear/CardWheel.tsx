import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import gsap from 'gsap';
import type { StreetwearDesign } from '../../../data/streetwear';
import { wheel as wheelCfg } from '../../../data/streetwear';

type Props = {
  designs: StreetwearDesign[];
  selected: number;
  onSelect: (index: number) => void;
  /** Cards stay stacked on the hub until this turns true, then they are dealt out */
  dealt: boolean;
  reduced: boolean;
};

const DEG = Math.PI / 180;
const rot = (x: number, y: number, deg: number): [number, number] => {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return [x * c - y * s, x * s + y * c];
};
const mod = (n: number, m: number) => ((n % m) + m) % m;
/** Equivalent of `target` nearest to `from`, so rotations always take the short way. */
const nearest = (from: number, target: number) => from + (mod(target - from + 180, 360) - 180);

/**
 * The card wheel — ten tee cards fanned like a hand of playing cards bent into a full circle.
 * Every card has its bottom-left corner on the hub; card i is rotated i × step − 90°, later cards
 * sit on top, and the cards that wrap back round are cut along the first card's edges so it shows over them.
 * Hover is resolved from the pointer's angle around the hub (DOM hover flickers on overlapping,
 * rotating cards).
 */
export default function CardWheel({ designs, selected, onSelect, dealt, reduced }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [R, setR] = useState(0);

  const N = designs.length;
  const step = 360 / N;
  const aspect = Math.min(1.15, Math.max(0.75, designs[0]?.cardAspect ?? 0.875));
  const cw = 0.655 * R; // the card's far corner then just reaches R
  const ch = cw / aspect;
  const theta = (i: number) => i * step - 90;
  /** Screen-independent middle of card i's visible wedge, in wheel coordinates */
  const wedgeMid = (i: number) => theta(i) - 90 + step / 2;

  // live values the pointer / ticker code reads
  const live = useRef({ W: 0, open: -1, selected, R: 0, cw: 0, ch: 0, dealt: false });
  live.current.selected = selected;
  live.current.R = R;
  live.current.cw = cw;
  live.current.ch = ch;

  // ── size ──
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => setR(Math.min(0.49 * root.clientWidth, 0.49 * root.clientHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // ── poses ──
  const fullClip = 'polygon(0% 100%, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%)';
  /** Cards far enough round the fan to wrap back onto the first card (stacking order alone can't close the circle) */
  const wraps = (i: number) => i > 0 && i * step > 270;
  /**
   * A wrapping card is cut along the first card's left and top edges, exactly as if the first card
   * lay on top of it — so nothing pokes out over the first card. Follows the selected card's
   * nudge and scale.
   */
  const restClip = (k: number, sel: number, r: number, w: number, h: number) => {
    const off = (i: number): [number, number] => {
      const d = i === sel ? wheelCfg.selectedNudge * r : 0;
      return [d * Math.cos(wedgeMid(i) * DEG), d * Math.sin(wedgeMid(i) * DEG)];
    };
    const sc = (i: number) => (i === sel ? 1.06 : 1);
    const [fx, fy] = off(0);
    const [kx, ky] = off(k);
    // wheel coordinates → card k's own box (origin bottom-left, y down)
    const local = (x: number, y: number): [number, number] => {
      const [u, v] = rot(x - kx, y - ky, -theta(k));
      return [u / sc(k), v / sc(k)];
    };
    const up = (theta(0) - 90) * DEG;
    const a = local(fx, fy);
    const c = local(fx + sc(0) * h * Math.cos(up), fy + sc(0) * h * Math.sin(up));
    const pct = ([u, v]: [number, number]) => `${((u / w) * 100).toFixed(2)}% ${(((h + v) / h) * 100).toFixed(2)}%`;
    // the first card's left edge leaves this card's right side before it reaches its corner
    if (c[0] >= w) {
      const e: [number, number] = [w, a[1] + ((w - a[0]) / (c[0] - a[0])) * (c[1] - a[1])];
      return `polygon(0% 100%, 0% 0%, 100% 0%, ${pct(e)}, ${pct(e)}, ${pct(a)})`;
    }
    const [du, dv] = rot(Math.cos(theta(0) * DEG), Math.sin(theta(0) * DEG), -theta(k));
    const e: [number, number] = [w, c[1] + ((w - c[0]) / du) * dv];
    return `polygon(0% 100%, 0% 0%, 100% 0%, ${pct(e)}, ${pct(c)}, ${pct(a)})`;
  };

  const pose = (i: number, kind: 'rest' | 'open', instant = false) => {
    const el = cardRefs.current[i];
    const { W, R: r, cw: w, ch: h, selected: sel } = live.current;
    if (!el || r === 0) return;
    const current = Number(gsap.getProperty(el, 'rotation')) || 0;
    const isLast = wraps(i);

    if (kind === 'open') {
      const s = wheelCfg.popScale;
      // target centre on the wedge's middle angle, clamped so the upright card stays inside the rail
      let [tx, ty] = rot(wheelCfg.popRadius * r * Math.cos(wedgeMid(i) * DEG), wheelCfg.popRadius * r * Math.sin(wedgeMid(i) * DEG), W);
      const root = rootRef.current!;
      const margin = window.innerWidth * 0.015;
      const limX = Math.max(0, root.clientWidth / 2 - (w * s) / 2 - margin);
      const limY = Math.max(0, root.clientHeight / 2 - (h * s) / 2 - margin);
      tx = gsap.utils.clamp(-limX, limX, tx);
      ty = gsap.utils.clamp(-limY, limY, ty);
      // bottom-left corner of the upright card, back in wheel coordinates
      const [x, y] = rot(tx - (w * s) / 2, ty + (h * s) / 2, -W);
      gsap.set(el, { zIndex: 60 });
      gsap.to(el, {
        x, y, scale: s, rotation: nearest(current, -W),
        clipPath: isLast ? fullClip : undefined,
        duration: instant ? 0 : 0.45, ease: 'expo.out', overwrite: 'auto',
      });
      return;
    }

    const nudged = i === sel;
    const d = nudged ? wheelCfg.selectedNudge * r : 0;
    gsap.to(el, {
      x: d * Math.cos(wedgeMid(i) * DEG),
      y: d * Math.sin(wedgeMid(i) * DEG),
      scale: nudged ? 1.06 : 1,
      rotation: nearest(current, theta(i)),
      clipPath: isLast ? restClip(i, sel, r, w, h) : undefined,
      duration: instant ? 0 : 0.55,
      ease: 'power3.inOut',
      overwrite: 'auto',
      onComplete: () => {
        if (live.current.open !== i) gsap.set(el, { zIndex: i + 1 });
      },
    });
  };

  const setOpen = (i: number) => {
    const prev = live.current.open;
    if (prev === i) return;
    live.current.open = i;
    cardRefs.current[prev]?.classList.remove('is-open');
    if (prev >= 0) pose(prev, 'rest');
    if (i >= 0) {
      cardRefs.current[i]?.classList.add('is-open');
      pose(i, 'open');
    }
    const root = rootRef.current;
    if (root) {
      // no cursor label here: the 110px label circle would sit on top of the opened card
      root.classList.toggle('has-open', i >= 0);
    }
  };

  // lay the cards out whenever the size changes
  useLayoutEffect(() => {
    if (R === 0) return;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { transformOrigin: '0% 100%', zIndex: i + 1 });
      if (!live.current.dealt && !reduced) {
        gsap.set(el, { rotation: 0, x: 0, y: 0, scale: 0.6, opacity: 0, clipPath: wraps(i) ? fullClip : undefined });
      } else {
        gsap.set(el, { opacity: 1 });
        pose(i, live.current.open === i ? 'open' : 'rest', true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [R, reduced]);

  // deal the deck
  useEffect(() => {
    if (!dealt || live.current.dealt || R === 0) return;
    live.current.dealt = true;
    if (reduced) return;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const nudged = i === live.current.selected;
      const d = nudged ? wheelCfg.selectedNudge * R : 0;
      gsap.to(el, { opacity: 1, duration: 0.2, delay: i * 0.06 });
      gsap.to(el, {
        rotation: theta(i),
        x: d * Math.cos(wedgeMid(i) * DEG),
        y: d * Math.sin(wedgeMid(i) * DEG),
        scale: nudged ? 1.06 : 1,
        clipPath: wraps(i) ? restClip(i, live.current.selected, R, cw, ch) : undefined,
        duration: 0.8,
        delay: i * 0.06,
        ease: 'back.out(1.4)',
      });
    });
    gsap.fromTo('.sw-hub', { scale: 0 }, { scale: 1, duration: 0.5, delay: N * 0.06 + 0.35, ease: 'back.out(2.2)' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealt, R]);

  // selected card keeps a small nudge
  useEffect(() => {
    if (!live.current.dealt && !reduced) return;
    cardRefs.current.forEach((_, i) => {
      if (live.current.open !== i) pose(i, 'rest');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // ── drift, drag, pointer-angle hover ──
  useEffect(() => {
    const root = rootRef.current;
    const spin = spinRef.current;
    if (!root || !spin) return;

    const s = { inside: false, lastSeen: -10, drift: 1, vel: 0, dragging: false, down: false, moved: 0, lastAngle: 0, sx: 0, sy: 0, focus: false, px: 0, py: 0, raf: 0 };

    const hub = () => {
      const r = root.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2] as const;
    };
    const angleAt = (x: number, y: number) => {
      const [hx, hy] = hub();
      return Math.atan2(y - hy, x - hx) / DEG;
    };
    const cardAt = (x: number, y: number) => {
      const { R: r, W, open } = live.current;
      const [hx, hy] = hub();
      const dist = Math.hypot(x - hx, y - hy);
      if (dist < 0.12 * r) return -1;
      // inside the wheel the pointer's angle decides, so every wedge stays reachable
      if (dist > 0.9 * r) {
        // an open card pops past the rim: stay on it while the pointer is still over it out there
        if (open >= 0 && dist < 1.45 * r) {
          const b = cardRefs.current[open]?.getBoundingClientRect();
          if (b && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return open;
        }
        return -1;
      }
      return Math.floor(mod(angleAt(x, y) - W + 180, 360) / step) % N;
    };

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 60) / 1000;
      const hold = s.inside || s.focus || live.current.open >= 0 || s.down || !live.current.dealt;
      const idle = !hold && performance.now() / 1000 - s.lastSeen > 1.2;
      s.drift += ((idle ? 1 : 0) - s.drift) * Math.min(1, dt / 0.4);
      const before = live.current.W;
      if (!s.dragging) {
        live.current.W += (reduced ? 0 : wheelCfg.driftDegPerSec * s.drift * dt) + s.vel * dt;
        s.vel *= Math.pow(0.04, dt); // inertia decay
        if (Math.abs(s.vel) < 0.5) s.vel = 0;
      }
      if (live.current.W !== before || s.dragging) gsap.set(spin, { rotation: live.current.W });
    };
    gsap.ticker.add(tick);

    const hover = () => {
      s.raf = 0;
      if (s.dragging || !live.current.dealt) return;
      setOpen(cardAt(s.px, s.py));
    };
    const onMove = (e: PointerEvent) => {
      s.px = e.clientX;
      s.py = e.clientY;
      if (s.down) {
        s.moved = Math.max(s.moved, Math.hypot(e.clientX - s.sx, e.clientY - s.sy));
        const limit = e.pointerType === 'touch' ? 8 : 6;
        if (!s.dragging && s.moved > limit) {
          s.dragging = true;
          setOpen(-1);
          root.dataset.cursor = 'DRAG';
          s.lastAngle = angleAt(e.clientX, e.clientY);
        }
        if (s.dragging) {
          const a = angleAt(e.clientX, e.clientY);
          const d = mod(a - s.lastAngle + 180, 360) - 180;
          live.current.W += d;
          s.vel = s.vel * 0.6 + (d / 0.016) * 0.4;
          s.lastAngle = a;
          return;
        }
      }
      if (e.pointerType === 'mouse' && !s.raf) s.raf = requestAnimationFrame(hover);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      s.down = true;
      s.moved = 0;
      s.vel = 0;
      s.sx = e.clientX;
      s.sy = e.clientY;
      s.inside = true;
      root.setPointerCapture?.(e.pointerId);
    };
    const onUp = (e: PointerEvent) => {
      if (!s.down) return;
      s.down = false;
      root.releasePointerCapture?.(e.pointerId);
      if (s.dragging) {
        s.dragging = false;
        delete root.dataset.cursor;
        s.vel = gsap.utils.clamp(-720, 720, s.vel);
      } else if (live.current.dealt) {
        const i = cardAt(e.clientX, e.clientY);
        if (i >= 0) onSelect(i);
      }
      if (e.pointerType !== 'mouse') {
        s.inside = false;
        s.lastSeen = performance.now() / 1000;
      }
    };
    const onCancel = () => {
      s.down = false;
      s.dragging = false;
      s.inside = false;
      s.lastSeen = performance.now() / 1000;
    };
    const onEnter = () => {
      s.inside = true;
    };
    const onLeave = () => {
      if (s.down) return;
      s.inside = false;
      s.lastSeen = performance.now() / 1000;
      setOpen(-1);
    };
    const onFocusIn = () => {
      s.focus = true;
    };
    const onFocusOut = () => {
      s.focus = false;
      s.lastSeen = performance.now() / 1000;
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onCancel);
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    return () => {
      gsap.ticker.remove(tick);
      cancelAnimationFrame(s.raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onCancel);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N, step, reduced, onSelect]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    cardRefs.current[mod(i + dir, N)]?.focus();
  };

  const hubSize = 0.22 * R * 2 * 0.5 + 0.11 * R; // ≈ 0.22 × R across, a touch larger so every corner is hidden

  return (
    <div ref={rootRef} className="sw-wheel" role="group" aria-label="Streetwear designs">
      <div ref={spinRef} className="sw-wheel-spin">
        {designs.map((d, i) => (
          <button
            key={d.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            type="button"
            className={`sw-card${i === selected ? ' is-selected' : ''}`}
            aria-label={`Select ${d.name}`}
            aria-pressed={i === selected}
            style={{ width: cw, height: ch, top: -ch } as CSSProperties}
            onClick={() => onSelect(i)}
            onFocus={(e) => {
              if (e.currentTarget.matches(':focus-visible')) setOpen(i);
            }}
            onBlur={() => {
              if (live.current.open === i) setOpen(-1);
            }}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <img src={d.card} alt="" draggable={false} loading="lazy" decoding="async" />
            <span className="sw-card-num">{String(d.order).padStart(2, '0')}</span>
            <span className="sw-card-name">{d.name}</span>
            <span className="sw-card-select" aria-hidden="true">
              {Array.from({ length: 8 }, (_, h) => (
                <i key={h} />
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="sw-hub" style={{ width: hubSize, height: hubSize }} aria-hidden="true">
        <span>
          {String(designs[selected]?.order ?? 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
        </span>
        <b>✦</b>
      </div>
    </div>
  );
}
