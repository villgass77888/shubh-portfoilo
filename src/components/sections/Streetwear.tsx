import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import { defaultDesign, showroomLayout, streetwear, streetwearCopy } from '../../data/streetwear';
import ChapterCard from '../global/ChapterCard';
import { MarqueeDivider } from '../global/Marquee';
import StreetwearIntro from './streetwear/StreetwearIntro';
import ModelCanvas, { modelBox } from './streetwear/ModelCanvas';
import type { ModelBox, ModelCanvasHandle } from './streetwear/ModelCanvas';
import CardWheel from './streetwear/CardWheel';
import ArtworkView from './streetwear/ArtworkView';
import { streetwearCss } from './streetwear/styles';

gsap.registerPlugin(ScrollTrigger);

const COMPACT_QUERY = '(max-width: 900px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/** matchMedia hook that is correct on the first render (pins are created once, in page order). */
function useMatch(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

const PAPER = '#F3F0E8';

/**
 * Halftone wipe: a screen of paper dots that are tiny at the top and swell until they fuse into
 * solid paper further down. `p` (0–1) is how far the fused edge has climbed.
 */
function drawWipe(canvas: HTMLCanvasElement, p: number) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx || !w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PAPER;

  const cell = 12;
  const band = 0.85; // share of the height the dots take to go from nothing to fused
  const edge = 1 - p; // where the first dots appear, as a share of the height
  const solidY = (edge + band) * h;
  if (solidY < h) ctx.fillRect(0, solidY - 1, w, h - solidY + 1);

  const cos = Math.cos(Math.PI / 6);
  const sin = Math.sin(Math.PI / 6);
  const n = Math.ceil(Math.hypot(w, h) / cell / 2) + 1;
  ctx.beginPath();
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const x = w / 2 + (i * cos - j * sin) * cell;
      const y = h / 2 + (i * sin + j * cos) * cell;
      if (x < -cell || x > w + cell || y < -cell || y > Math.min(h, solidY) + cell) continue;
      const c = (y / h - edge) / band;
      if (c <= 0) continue;
      // area grows evenly with distance; 0.71 × cell is where neighbours fuse
      const r = Math.sqrt(Math.min(1, c)) * cell * 0.74;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

/**
 * Streetwear — chapter 07. Halftone wipe out of Packaging, title, intro video, then the
 * showroom: the model on the left, ten tee cards as a circular hand of playing cards on the right.
 * Click a card to swap the model, click the model to see the artwork behind the print.
 */
export default function Streetwear() {
  const sectionRef = useRef<HTMLElement>(null);
  const showroomRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<ModelCanvasHandle>(null);
  const wipeRef = useRef<HTMLCanvasElement>(null);

  const compact = useMatch(COMPACT_QUERY);
  const reduced = useMatch(REDUCED_QUERY);

  const [selected, setSelected] = useState(() => Math.max(0, streetwear.findIndex((d) => d.id === defaultDesign)));
  const [entered, setEntered] = useState(false);
  const [dealt, setDealt] = useState(false);
  const [art, setArt] = useState<{ x: number; y: number } | null>(null);
  const [hintGone, setHintGone] = useState(false);
  const [overModel, setOverModel] = useState(false);
  const [box, setBox] = useState<ModelBox | null>(null);
  const [touch, setTouch] = useState(false);

  const design = streetwear[selected];
  const select = useCallback((i: number) => setSelected(i), []);

  useEffect(() => setTouch(window.matchMedia('(hover: none)').matches), []);

  // model box → floor shadow, hint chip and the keyboard button follow it
  useIsomorphicLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setBox(modelBox(stage.clientWidth, stage.clientHeight, design.modelAspect, compact));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [design.modelAspect, compact]);

  // halftone wipe: the fused edge climbs as the chapter scrolls in
  useIsomorphicLayoutEffect(() => {
    const canvas = wipeRef.current;
    if (!canvas) return;
    let p = reduced ? 1 : 0;
    const draw = () => drawWipe(canvas, p);
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    const sync = (self: ScrollTrigger) => {
      p = self.progress;
      draw();
    };
    const st = reduced
      ? null
      : ScrollTrigger.create({ trigger: canvas.parentElement, start: 'top bottom', end: 'bottom 40%', onUpdate: sync, onRefresh: sync });
    draw();
    return () => {
      ro.disconnect();
      st?.kill();
    };
  }, [reduced]);

  // showroom entrance
  useIsomorphicLayoutEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    if (reduced) {
      setEntered(true);
      setDealt(true);
      return;
    }
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: showroomRef.current,
        start: 'top 65%',
        once: true,
        onEnter: () => {
          setEntered(true);
          const tl = gsap.timeline();
          // the model scans in from the floor up
          tl.fromTo('.sw-model-wrap', { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.04 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.9, ease: 'expo.out', clearProps: 'clipPath,transform' }, 0.1);
          tl.fromTo('.sw-scan', { y: 0, opacity: 1 }, { y: () => -(stageRef.current?.clientHeight ?? 700) * 0.86, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0.1);
          tl.fromTo('.sw-floor', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.35);
          tl.call(() => setDealt(true), [], 0.3);
          tl.fromTo('.sw-info > *', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, 0.7);
          tl.fromTo('.sw-ghost', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.6);
          tl.fromTo('.sw-hint', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'bounce.out' }, 1.3);
          tl.fromTo('.sw-caption', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.2);
        },
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // ── model: silhouette hover + click ──
  const onStageMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (art || e.pointerType !== 'mouse') return;
    setOverModel(!!canvasRef.current?.hitTest(e.clientX, e.clientY));
  };
  const openArt = (clientX?: number, clientY?: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    setArt({
      x: clientX === undefined ? 50 : ((clientX - r.left) / r.width) * 100,
      y: clientY === undefined ? 55 : ((clientY - r.top) / r.height) * 100,
    });
    setHintGone(true);
    setOverModel(false);
  };
  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (art) return;
    if (canvasRef.current?.hitTest(e.clientX, e.clientY)) openArt(e.clientX, e.clientY);
  };

  const meta = [design.print, design.teeColor && design.teeColor !== 'other' ? `${design.teeColor.toUpperCase()} TEE` : null].filter(Boolean).join(' ✦ ');
  const vars = {
    '--stage': `${showroomLayout.stage}fr`,
    '--rail': `${showroomLayout.rail}fr`,
    '--sw-accent': design.accent ?? '#FF2B1C',
  } as CSSProperties;
  const boxStyle: CSSProperties | undefined = box ? { left: box.x, top: box.y, width: box.w, height: box.h } : undefined;

  return (
    <section ref={sectionRef} id="section-streetwear" className={`sw${entered ? ' is-entered' : ''}`} style={{ position: 'relative', zIndex: 'var(--z-content)' as any }}>
      {/* Halftone dot wipe out of the Packaging cardboard */}
      <div className="sw-wipe" aria-hidden="true">
        <canvas ref={wipeRef} />
      </div>

      <div className="sw-body" style={vars}>
        <div className="sw-noise" aria-hidden="true" />

        <MarqueeDivider text={streetwearCopy.marquee} />
        <ChapterCard chapterIndex={6} title="STREETWEAR" subtitle="TEE GRAPHICS" />

        <StreetwearIntro reduced={reduced} />

        {/* ── Showroom ── */}
        <div ref={showroomRef} className="sw-showroom">
          <div
            ref={stageRef}
            className={`sw-stage${overModel ? ' is-over' : ''}${art ? ' is-art' : ''}`}
            onPointerMove={onStageMove}
            onPointerLeave={() => setOverModel(false)}
            onClick={onStageClick}
            data-cursor={overModel ? 'ARTWORK' : undefined}
          >
            <div className="sw-bloom" aria-hidden="true" />
            <div className="sw-ghost" aria-hidden="true">
              <span key={design.id}>{design.name}</span>
            </div>
            <div className="sw-floor" aria-hidden="true" style={box ? { left: box.x + box.w * 0.08, width: box.w * 0.84, top: box.y + box.h - box.h * 0.022 } : undefined} />

            <div className="sw-model-wrap">
              <ModelCanvas ref={canvasRef} designs={streetwear} index={selected} compact={compact} reduced={reduced} />
              <div className="sw-scan" aria-hidden="true" />
            </div>

            {/* keyboard / screen-reader way into the artwork */}
            <button type="button" className="sw-model-btn" style={boxStyle} aria-label={`View artwork for ${design.name}`} onClick={(e) => { e.stopPropagation(); openArt(); }} />

            <div className="sw-info">
              <span className="sw-count">
                {String(design.order).padStart(2, '0')} / {String(streetwear.length).padStart(2, '0')}
              </span>
              <h3 className="sw-name" key={design.id}>
                {design.name}
              </h3>
              <span className="sw-meta">{meta}</span>
              <span className="sw-kicker">{streetwearCopy.kicker}</span>
            </div>

            {!hintGone && (
              <span className="sw-hint" style={box ? { left: box.x + box.w / 2, top: Math.max(64, box.y - 34) } : undefined}>
                <span className="sticker sticker--acid">{streetwearCopy.hint}</span>
              </span>
            )}

            {art && <ArtworkView design={design} origin={art} compact={compact} reduced={reduced} onClose={() => setArt(null)} />}
          </div>

          <div className="sw-rail">
            <CardWheel designs={streetwear} selected={selected} onSelect={select} dealt={dealt} reduced={reduced} />
            <p className="sw-caption">{touch ? streetwearCopy.wheelCaptionTouch : streetwearCopy.wheelCaption}</p>
          </div>
        </div>

        {/* Fade to black into the Outro */}
        <div className="sw-exit" aria-hidden="true" />
      </div>

      <style>{streetwearCss}</style>
    </section>
  );
}
