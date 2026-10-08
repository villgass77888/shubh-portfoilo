import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import gsap from 'gsap';
import type { Brochure, BrochurePage } from '../../../../data/archive';
import { prefersReducedMotion } from './bits';
import ReaderShell from './ReaderShell';
import type { StageSize } from './ReaderShell';

type Props = {
  brochure: Brochure;
  from: DOMRect | null;
  shelfRect: () => DOMRect | null;
  onClose: () => void;
};

type Step = 'cover' | 'gates' | 'inside' | 'focus' | 'back';

/**
 * Angles of the four hinged panels + the camera.
 *   L / R: the left and right centre panels, hinged on the spine (180 = folded over the other half)
 *   A / D: the outer flaps, hinged on the centre panels (±180 = folded in, the gates are shut)
 */
type Pose = { L: number; R: number; A: number; D: number; s: number; x: number };

const LABEL: Record<Step, string> = { cover: 'COVER', gates: 'THE GATES', inside: 'INSIDE', focus: 'INSIDE', back: 'BACK' };

function panelSize(b: Brochure, stage: StageSize): StageSize {
  const h = Math.floor(Math.min(stage.h * 0.94, (stage.w * 0.9) / b.pageAspect));
  return { w: Math.floor(h * b.pageAspect), h };
}

/**
 * Brij Garden is a double gatefold, so it gets its own viewer instead of the book.
 * As delivered it reads: cover → (opens like a book) the two closed gates → (the gates swing
 * apart like double doors) the four-panel inside → the back. Every panel is a two-sided
 * element on a real hinge, so the flaps are visibly two-sided while they swing.
 */
export default function GatefoldViewer({ brochure, from, shelfRect, onClose }: Props) {
  const g = brochure.gatefold!;
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [canFocus, setCanFocus] = useState(true);
  const [panel, setPanel] = useState(1);

  const steps = useMemo<Step[]>(() => (mobile || !canFocus ? ['cover', 'gates', 'inside', 'back'] : ['cover', 'gates', 'inside', 'focus', 'back']), [mobile, canFocus]);
  const at = Math.min(step, steps.length - 1);
  const name = steps[at];

  const move = useCallback((dir: 1 | -1) => setStep((s) => Math.min(steps.length - 1, Math.max(0, Math.min(s, steps.length - 1) + dir))), [steps.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [move]);

  const coverSize = useCallback((stage: StageSize) => panelSize(brochure, stage), [brochure]);
  const showPanel = name === 'focus' || (name === 'inside' && mobile);
  const counter = showPanel ? `INSIDE · ${panel}/${g.inside.length}` : LABEL[name];

  return (
    <>
    <style>{gatefoldCss}</style>
    <ReaderShell
      name={brochure.name}
      kind="DOUBLE GATEFOLD"
      cover={g.cover.src}
      coverAspect={brochure.pageAspect}
      from={from}
      shelfRect={shelfRect}
      coverSize={coverSize}
      counter={counter}
      progress={at / (steps.length - 1)}
      hint="CLICK THE SIDES ✦ ← → ✦ SWIPE"
      onClose={onClose}
    >
      {(stage) => <Sheet brochure={brochure} stage={stage} name={name} move={move} onMobile={setMobile} onCanFocus={setCanFocus} onPanel={setPanel} />}
    </ReaderShell>
    </>
  );
}

type SheetProps = {
  brochure: Brochure;
  stage: StageSize;
  name: Step;
  move: (dir: 1 | -1) => void;
  onMobile: (m: boolean) => void;
  onCanFocus: (c: boolean) => void;
  onPanel: (n: number) => void;
};

function Face({ page, side, width, shade }: { page: BrochurePage; side: 'in' | 'out'; width: number; shade?: string }) {
  return (
    <span className={`ar-gf-face ar-gf-face--${side}`} style={{ backgroundImage: `url(${page.lqip})` }}>
      <img src={page.src} srcSet={`${page.src} 707w, ${page.hi} 1414w`} sizes={`${Math.round(width)}px`} alt="" decoding="async" draggable={false} />
      {shade && <i className="ar-gf-shade" style={{ opacity: `var(${shade})` } as CSSProperties} />}
    </span>
  );
}

function Sheet({ brochure, stage, name, move, onMobile, onCanFocus, onPanel }: SheetProps) {
  const g = brochure.gatefold!;
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const reduced = useMemo(prefersReducedMotion, []);
  const mobile = stage.w < 760;
  const size = panelSize(brochure, stage);
  const pw = size.w;
  const n = g.inside.length;
  // how far the camera can travel across the four panels at full height
  const maxPan = Math.max(0, (n * pw - stage.w * 0.9) / 2);
  const canFocus = maxPan > 24;

  useEffect(() => onMobile(mobile), [mobile, onMobile]);
  useEffect(() => onCanFocus(canFocus), [canFocus, onCanFocus]);

  const poseOf = useCallback(
    (s: Step): Pose => {
      const fit2 = Math.min(1, (stage.w * 0.94) / (2 * pw));
      const fit4 = Math.min(1, (stage.w * 0.96) / (n * pw));
      switch (s) {
        case 'cover':
          return { L: 180, R: 0, A: 180, D: -180, s: 1, x: -pw / 2 };
        case 'gates':
          return { L: 0, R: 0, A: 180, D: -180, s: fit2, x: 0 };
        case 'inside':
          return { L: 0, R: 0, A: 0, D: 0, s: fit4, x: 0 };
        case 'focus':
          return { L: 0, R: 0, A: 0, D: 0, s: 1, x: maxPan };
        default:
          return { L: 0, R: -180, A: 180, D: -180, s: 1, x: pw / 2 };
      }
    },
    [stage.w, pw, n, maxPan],
  );

  const pose = useRef<Pose>(poseOf('cover'));
  const shown = useRef<Step>('cover');
  const [strip, setStrip] = useState(false);

  /** Write the pose to CSS variables; the transforms are composed in CSS */
  const apply = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const p = pose.current;
    const st = el.style;
    st.setProperty('--L', String(p.L));
    st.setProperty('--R', String(p.R));
    st.setProperty('--A', String(p.A));
    st.setProperty('--D', String(p.D));
    st.setProperty('--s', String(p.s));
    st.setProperty('--x', `${p.x}px`);
    // shadows are deepest mid-swing and gone when a panel lies flat
    st.setProperty('--shA', (0.5 * Math.sin((p.A * Math.PI) / 180)).toFixed(3));
    st.setProperty('--shD', (0.5 * Math.sin((-p.D * Math.PI) / 180)).toFixed(3));
    st.setProperty('--shL', (0.45 * Math.sin((p.L * Math.PI) / 180)).toFixed(3));
    st.setProperty('--shR', (0.45 * Math.sin((-p.R * Math.PI) / 180)).toFixed(3));
    if (shown.current === 'focus' && maxPan > 0) onPanel(Math.round(((maxPan - p.x) / (2 * maxPan)) * (n - 1)) + 1);
  }, [maxPan, n, onPanel]);

  // first paint + resize: snap to the current step
  useLayoutEffect(() => {
    gsap.killTweensOf(pose.current);
    Object.assign(pose.current, poseOf(shown.current));
    apply();
  }, [poseOf, apply]);

  // step change
  useEffect(() => {
    const prev = shown.current;
    if (prev === name) return;
    shown.current = name;
    const target = poseOf(name);
    const p = pose.current;
    gsap.killTweensOf(p);
    setStrip(false);
    if (reduced) {
      // no swinging: a short crossfade between the states
      const el = rootRef.current;
      gsap.timeline()
        .to(el, { opacity: 0, duration: 0.15 })
        .add(() => {
          Object.assign(p, target);
          apply();
          if (mobile && name === 'inside') setStrip(true);
        })
        .to(el, { opacity: 1, duration: 0.2 });
      return;
    }
    const tl = gsap.timeline({ onUpdate: apply });
    const flapsShut = Math.abs(target.A) > 90;
    const flapsOpenNow = Math.abs(p.A) < 90;
    const halvesFlat = Math.abs(p.L) < 1 && Math.abs(p.R) < 1;
    if ((flapsShut && flapsOpenNow && (target.L !== 0 || target.R !== 0)) || (!flapsShut && !halvesFlat)) {
      // two moves: the gates and the halves never swing through each other
      tl.to(p, { ...poseOf('gates'), duration: 0.8, ease: 'expo.inOut' }).to(p, { ...target, duration: 0.9, ease: 'expo.inOut' });
    } else {
      tl.to(p, { ...target, duration: name === 'focus' || prev === 'focus' ? 0.85 : 1, ease: 'expo.inOut' });
    }
    if (mobile && name === 'inside') tl.add(() => setStrip(true));
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // phones: once the gates are open the inside becomes a swipeable strip of full-width panels
  useEffect(() => {
    const el = stripRef.current;
    if (!strip || !el) return;
    el.scrollLeft = 0;
    onPanel(1);
    const onScroll = () => {
      const first = el.firstElementChild as HTMLElement | null;
      if (first) onPanel(Math.min(n, Math.max(1, Math.round(el.scrollLeft / (first.offsetWidth + 12)) + 1)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [strip, n, onPanel]);

  // focus: the camera follows the cursor across the spread (drag on touch)
  const onMoveFocus = (e: ReactPointerEvent) => {
    if (shown.current !== 'focus' || maxPan <= 0) return;
    const r = rootRef.current!.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    gsap.to(pose.current, { x: maxPan * (1 - 2 * t), duration: 0.7, ease: 'power3.out', overwrite: 'auto', onUpdate: apply });
  };

  const onDown = (e: ReactPointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: ReactPointerEvent, side: 1 | -1) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) move(side);
  };

  const vars = { '--pw': `${pw}px`, '--ph': `${size.h}px` } as CSSProperties;

  return (
    <div ref={rootRef} className={`ar-gf${strip ? ' is-strip' : ''}`} style={vars} onPointerMove={onMoveFocus}>
      <div className="ar-gf-cam">
        <div className="ar-gf-sheet">
          {/* left centre panel: inside 2, its outside is the front cover */}
          <div className="ar-gf-half ar-gf-half--l">
            <Face page={g.inside[1] ?? g.cover} side="in" width={pw} shade="--shA" />
            <Face page={g.cover} side="out" width={pw} shade="--shL" />
            <div className="ar-gf-flap ar-gf-flap--l">
              <Face page={g.inside[0] ?? g.cover} side="in" width={pw} />
              <Face page={g.gates[0] ?? g.cover} side="out" width={pw} />
            </div>
          </div>
          {/* right centre panel: inside 3, its outside is the back cover */}
          <div className="ar-gf-half ar-gf-half--r">
            <Face page={g.inside[2] ?? g.back} side="in" width={pw} shade="--shD" />
            <Face page={g.back} side="out" width={pw} shade="--shR" />
            <div className="ar-gf-flap ar-gf-flap--r">
              <Face page={g.inside[3] ?? g.back} side="in" width={pw} />
              <Face page={g.gates[1] ?? g.back} side="out" width={pw} />
            </div>
          </div>
        </div>
      </div>

      {mobile && (
        <div ref={stripRef} className="ar-gf-strip" data-lenis-prevent aria-hidden={!strip}>
          {g.inside.map((p, i) => (
            <img key={p.src} src={p.src} srcSet={`${p.src} 707w, ${p.hi} 1414w`} sizes="86vw" alt={`${brochure.name}, inside panel ${i + 1}`} loading="lazy" decoding="async" draggable={false} />
          ))}
        </div>
      )}

      <button type="button" className="ar-rd-zone ar-rd-zone--prev" data-cursor="← PREV" aria-label="Previous step" onPointerDown={onDown} onPointerUp={(e) => onUp(e, -1)} onKeyDown={(e) => e.key === 'Enter' && move(-1)} />
      <button type="button" className="ar-rd-zone ar-rd-zone--next" data-cursor="NEXT →" aria-label="Next step" onPointerDown={onDown} onPointerUp={(e) => onUp(e, 1)} onKeyDown={(e) => e.key === 'Enter' && move(1)} />

      {/* phones have no cursor labels: two plain buttons under the strip */}
      <div className="ar-gf-nav">
        <button type="button" onClick={() => move(-1)} aria-label="Previous step">
          ←
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Next step">
          →
        </button>
      </div>
    </div>
  );
}

const gatefoldCss = `
.ar-gf {
  --L: 180; --R: 0; --A: 180; --D: -180; --s: 1; --x: 0px;
  --shA: 0; --shD: 0; --shL: 0; --shR: 0;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 2600px;
  overflow: hidden;
}
.ar-gf-cam {
  flex: none;
  transform: translateX(var(--x)) scale(var(--s));
  transform-style: preserve-3d;
  will-change: transform;
}
/* the sheet is two panels wide (the centre panels); the flaps hang off its sides */
.ar-gf-sheet { position: relative; width: calc(var(--pw) * 2); height: var(--ph); transform-style: preserve-3d; }
.ar-gf-half, .ar-gf-flap { position: absolute; top: 0; width: var(--pw); height: var(--ph); transform-style: preserve-3d; }
/* each folded layer sits a hair above the one under it, so nothing is ever coplanar */
.ar-gf-half--l { left: 0; transform-origin: 100% 50%; transform: translateZ(calc(var(--L) / 180 * 4px)) rotateY(calc(var(--L) * 1deg)); }
.ar-gf-half--r { left: var(--pw); transform-origin: 0 50%; transform: translateZ(calc(var(--R) / -180 * 4px)) rotateY(calc(var(--R) * 1deg)); }
.ar-gf-flap--l { right: 100%; transform-origin: 100% 50%; transform: translateZ(calc(var(--A) / 180 * 1.5px)) rotateY(calc(var(--A) * 1deg)); }
.ar-gf-flap--r { left: 100%; transform-origin: 0 50%; transform: translateZ(calc(var(--D) / -180 * 1.5px)) rotateY(calc(var(--D) * 1deg)); }
.ar-gf-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-color: #E8EEF0;
  background-size: cover;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
.ar-gf-face--out { transform: rotateY(180deg); }
.ar-gf-face img { display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; }
.ar-gf-shade { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.2)); pointer-events: none; }
.ar-gf-half--r > .ar-gf-face--in .ar-gf-shade { background: linear-gradient(to left, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.2)); }
.ar-gf-face--out .ar-gf-shade { background: rgba(0, 0, 0, 0.7); }
.ar-gf-sheet::after {
  /* soft floor shadow under the sheet */
  content: '';
  position: absolute;
  left: -40%;
  right: -40%;
  bottom: -5%;
  height: 8%;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.5), transparent 65%);
  transform: translateZ(-40px);
  pointer-events: none;
}

.ar-gf-strip {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 7vw;
  overflow-x: auto;
  overscroll-behavior: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}
.ar-gf-strip::-webkit-scrollbar { display: none; }
.ar-gf-strip img { flex: none; width: 86vw; max-width: none; max-height: 100%; object-fit: contain; scroll-snap-align: center; border-radius: 2px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); }
.ar-gf.is-strip .ar-gf-strip { opacity: 1; pointer-events: auto; }
.ar-gf.is-strip .ar-gf-cam { opacity: 0; transition: opacity 0.3s ease; }
.ar-gf.is-strip .ar-rd-zone { display: none; }

.ar-gf-nav { display: none; }
@media (max-width: 760px) {
  .ar-gf-nav {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0.25rem;
    z-index: 6;
    display: flex;
    justify-content: center;
    gap: 0.8rem;
  }
  .ar-gf-nav button {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1.5px solid rgba(244, 241, 234, 0.5);
    background: rgba(20, 20, 20, 0.7);
    color: #F4F1EA;
    font-size: 1.05rem;
  }
}
`;
