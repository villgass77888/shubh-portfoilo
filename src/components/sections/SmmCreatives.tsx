import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { smm } from '../../data/portfolio';
import type { SmmEntry } from '../../data/portfolio';
import ChapterCard from '../global/ChapterCard';
import { MarqueeDivider } from '../global/Marquee';
import SmmPhone, { imgLoad, smmRatio } from './smm/SmmPhone';
import type { ImgLoad } from './smm/SmmPhone';
import SmmLightbox, { creativeLabel } from './smm/SmmLightbox';
import SmmWall from './smm/SmmWall';
import SmmArchive from './smm/archive/SmmArchive';
import { smmCss } from './smm/smmStyles';

gsap.registerPlugin(ScrollTrigger);

const SPARKS = [0, 1, 2, 3, 4, 5];

/** Paper tone of this section (same as the page backdrop for the social chapter). */
const SHEET = '#ECE8DF';

const N = smm.length;
/** Scroll per brand while the scene is pinned, in % of the viewport height */
const STEP = 95;
/** How far past a brand boundary (in brand units) the scroll must be before the brand flips */
const HYSTERESIS = 0.06;
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
const DESKTOP_QUERY = '(min-width: 768px)';
/** Travel of the label / counter / stats roll, px */
const ROLL = 18;

const pad2 = (n: number) => String(n).padStart(2, '0');
const clampIndex = (i: number) => Math.min(N - 1, Math.max(0, i));

/** Where a post rests when it is gathered back (the start of a deal-out / end of a gather). */
function gathered(slot: number, desktop: boolean): gsap.TweenVars {
  if (desktop) {
    // back under post 2's slot, in % of a card
    return [
      { xPercent: 94, yPercent: 0, rotation: 9, scale: 1 },
      { xPercent: 0, yPercent: 0, rotation: 0, scale: 0.9 },
      { xPercent: -94, yPercent: 0, rotation: -8, scale: 1 },
      { xPercent: -188, yPercent: 0, rotation: -11, scale: 1 },
    ][slot];
  }
  // 2×2 cluster: towards its centre
  return {
    xPercent: slot % 2 ? -47 : 47,
    yPercent: slot > 1 ? -47 : 47,
    rotation: slot % 2 ? 8 : -8,
    scale: 0.82,
  };
}

const DEALT: gsap.TweenVars = { xPercent: 0, yPercent: 0, rotation: 0, scale: 1, opacity: 1 };

/** Chrome-pink Y2K heart that pops on post 2 when the fan finishes */
function HeartBurst({ id }: { id: string }) {
  return (
    <span className="smm-heart" aria-hidden="true">
      {SPARKS.map((s) => (
        <svg key={s} className="smm-spark" viewBox="0 0 24 24">
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="#fff" />
        </svg>
      ))}
      <svg className="smm-heart-main" viewBox="0 0 24 24">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#ff9bdc" />
            <stop offset="0.7" stopColor="#ff2b1c" />
            <stop offset="1" stopColor="#ffd0ee" />
          </linearGradient>
        </defs>
        <path
          d="M12 21s-8-5.2-8-11.2A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8 3.2C20 15.8 12 21 12 21z"
          fill={`url(#${id})`}
          stroke="#fff"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

interface SceneProps {
  /** Every brand (the pinned scene: stacked layers) or a single one (static list) */
  brands: SmmEntry[];
  /** Index of brands[0] in the full list */
  first: number;
  /** Index (in the full list) of the brand that is showing */
  active: number;
  pinned: boolean;
  load: (index: number) => ImgLoad;
  onOpenPost: (brand: SmmEntry, src: string) => void;
  onSeeAll: (brand: SmmEntry) => void;
  onStep?: (dir: 1 | -1) => void;
}

/**
 * The scene: label + counter, ONE tilted phone, the fan of 4 posts, stats + SEE ALL.
 * Everything brand-specific is a layer tagged with data-i so GSAP can swap brands in place.
 */
function SmmScene({ brands, first, active, pinned, load, onOpenPost, onSeeAll, onStep }: SceneProps) {
  const current = brands[active - first] ?? brands[0];

  return (
    <div className={`smm-scene ${pinned ? 'smm-scene--pinned' : 'smm-scene--static'}`} data-brand={current.slug}>
      {/* brand-tinted spray vignette */}
      {brands.map((brand, i) => (
        <div key={brand.slug} className="smm-vig" data-i={first + i} aria-hidden="true" style={{ '--p': brand.primary } as CSSProperties} />
      ))}

      {/* Section label, top-left + counter / brand stepper, top-right */}
      <div className="smm-head">
        <div className="smm-rollbox smm-titles">
          {brands.map((brand, i) => (
            <h3 key={brand.slug} className="smm-roll smm-title" data-i={first + i}>
              <span style={{ fontWeight: 900, fontStretch: '125%' }}>SOCIAL MEDIA — {brand.brand}</span>
              <span style={{ fontWeight: 400, opacity: 0.75 }}>[ {brand.campaign} ]</span>
            </h3>
          ))}
        </div>

        <div className="smm-count">
          {pinned && (
            <button
              type="button"
              className="smm-step"
              data-cursor="PREV"
              aria-label="Previous brand"
              aria-disabled={active === 0}
              onClick={() => onStep?.(-1)}
            >
              ‹
            </button>
          )}
          <span className="smm-count-num" aria-hidden={pinned || undefined}>
            <span className="smm-rollbox">
              {brands.map((brand, i) => (
                <span key={brand.slug} className="smm-roll" data-i={first + i}>
                  {pad2(first + i + 1)}
                </span>
              ))}
            </span>
            <span>/ {pad2(N)}</span>
          </span>
          {pinned && (
            <button
              type="button"
              className="smm-step"
              data-cursor="NEXT"
              aria-label="Next brand"
              aria-disabled={active === N - 1}
              onClick={() => onStep?.(1)}
            >
              ›
            </button>
          )}
        </div>
        {pinned && (
          <p className="smm-sr" aria-live="polite">
            Brand {active + 1} of {N}: {current.brand}
          </p>
        )}
      </div>

      {/* Stage: phone + fan share one coordinate system (see smmStyles.ts) */}
      <div className="smm-stage">
        <div className="smm-phone-par">
          <div className="smm-phone-in">
            <SmmPhone brands={brands} current={current} first={first} load={load} />
          </div>
        </div>

        <div className="smm-fans-par">
          {brands.map((brand, i) => (
            <div
              key={brand.slug}
              className={pinned ? 'smm-fanlayer' : 'smm-fanlayer is-live'}
              data-i={first + i}
              style={{ '--ar': smmRatio(brand), '--p': brand.primary } as CSSProperties}
            >
              <div className="smm-fan">
                {brand.posts.map((src, slot) => (
                  <div className="smm-slot" key={src}>
                    <div className="smm-deal">
                      <button
                        type="button"
                        className="smm-card"
                        data-cursor="VIEW"
                        onClick={() => onOpenPost(brand, src)}
                        aria-label={`Open ${brand.brand} ${creativeLabel(src)} in the gallery`}
                      >
                        <img
                          {...imgLoad(src, load(first + i))}
                          alt={`${brand.brand} social media ${creativeLabel(src)}`}
                          decoding="async"
                          draggable={false}
                        />
                      </button>
                    </div>
                    {slot === 1 && <HeartBurst id={`smm-heart-${brand.slug}`} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats + SEE ALL */}
      <div className="smm-meta">
        <div className="smm-rollbox">
          {brands.map((brand, i) => (
            <span key={brand.slug} className="smm-roll smm-stat" data-i={first + i}>
              {brand.stats}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="sticker sticker--signal smm-see-all"
          style={{ '--sticker-rotate': '-2deg' } as CSSProperties}
          data-cursor="VIEW"
          onClick={() => onSeeAll(current)}
          aria-label={`See all ${current.brand} creatives`}
        >
          SEE ALL <span className="smm-see-all-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

interface Layer {
  fan: HTMLElement;
  deals: HTMLElement[];
  screen: HTMLElement;
  pops: HTMLElement[];
  rolls: HTMLElement[];
  vig: HTMLElement;
  heart: Element | null;
  sparks: Element[];
}

type LayerState = 'hidden' | 'in' | 'out';

const lazyLoad = (): ImgLoad => 'lazy';

/**
 * Smooth-scroll the page to `top` without fighting Lenis. While Lenis is gliding (wheel inertia)
 * it ignores native scrolling and would pull a plain window.scrollTo straight back, so:
 * 1. a middle-button pointerdown on window makes Lenis drop its inertia (Lenis' own reset hook),
 * 2. the exact distance is handed to Lenis as a wheel delta, so it eases there with its own lerp.
 * Without Lenis (html.lenis missing) the browser's smooth scroll is used.
 */
function scrollToY(top: number) {
  const html = document.documentElement;
  if (!html.classList.contains('lenis')) {
    window.scrollTo({ top, behavior: 'smooth' });
    return;
  }
  window.dispatchEvent(new PointerEvent('pointerdown', { button: 1 }));
  const delta = top - window.scrollY;
  if (Math.abs(delta) < 1) return;
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: delta, deltaMode: 0, cancelable: true }));
}

/**
 * SMM Creatives — ONE pinned phone presents every brand in turn: 4 real posts fanned over
 * the tilted phone, post 2 sitting on the phone screen. Scrolling (or the ‹ › buttons)
 * gathers the posts back while the screen swipes away, then deals out the next brand.
 * Click a post for the carousel lightbox, SEE ALL for the masonry wall.
 */
export default function SmmCreatives() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [warm, setWarm] = useState<boolean[]>(() => smm.map(() => false));
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && window.matchMedia(REDUCE_QUERY).matches);
  const [lightbox, setLightbox] = useState<{ slug: string; index: number } | null>(null);
  const [wall, setWall] = useState<string | null>(null);

  const openPost = useCallback((brand: SmmEntry, src: string) => {
    setLightbox({ slug: brand.slug, index: Math.max(brand.all.indexOf(src), 0) });
  }, []);
  const openWall = useCallback((brand: SmmEntry) => setWall(brand.slug), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const closeWall = useCallback(() => setWall(null), []);

  /** Request the images of a brand and its neighbours (never un-requests anything). */
  const warmAround = useCallback((index: number) => {
    setWarm((prev) => {
      let next = prev;
      for (let i = index - 1; i <= index + 2; i++) {
        if (i >= 0 && i < N && !next[i]) {
          if (next === prev) next = prev.slice();
          next[i] = true;
        }
      }
      return next;
    });
  }, []);

  /** ‹ › : scroll to the middle of the adjacent brand's stretch of the pin */
  const step = useCallback((dir: 1 | -1) => {
    const st = pinRef.current;
    if (!st) return;
    const target = clampIndex(activeRef.current + dir);
    if (target === activeRef.current) return;
    const top = st.start + ((target + 0.5) / N) * (st.end - st.start);
    scrollToY(top);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(REDUCE_QUERY);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = sectionRef.current;
    // Reduced motion renders the static list instead: nothing to pin or animate.
    if (!root || reduce) return;
    const scene = root.querySelector<HTMLElement>('.smm-scene--pinned');
    if (!scene) return;

    const cleanups: Array<() => void> = [];
    let ctx: gsap.Context | undefined;
    /** Record tweens made later (scroll callbacks) in the context so unmount reverts them too. */
    const inCtx = (fn: () => void) => {
      if (ctx) ctx.add(fn);
      else fn();
    };

    ctx = gsap.context(() => {
      const q = gsap.utils.selector(scene);
      const layers: Layer[] = smm.map((_, i) => {
        const at = (cls: string) => q(`${cls}[data-i="${i}"]`) as HTMLElement[];
        const fan = at('.smm-fanlayer')[0];
        const screen = at('.smm-screen')[0];
        return {
          fan,
          deals: Array.from(fan.querySelectorAll<HTMLElement>('.smm-deal')),
          screen,
          pops: Array.from(screen.querySelectorAll<HTMLElement>('.smm-pop')),
          rolls: at('.smm-roll'),
          vig: at('.smm-vig')[0],
          heart: fan.querySelector('.smm-heart-main'),
          sparks: Array.from(fan.querySelectorAll('.smm-spark')),
        };
      });
      const phoneIn = q('.smm-phone-in')[0] as HTMLElement;
      const chrome = q('.smm-count, .smm-meta') as HTMLElement[];
      const state: LayerState[] = smm.map(() => 'hidden');
      const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

      let cur = 0;
      let entered = false;
      let tl: gsap.core.Timeline | null = null;

      /** Hard reset of one brand: nothing of it is rendered. */
      const hide = (i: number) => {
        const L = layers[i];
        gsap.set([L.fan, L.screen, L.vig, ...L.rolls], { autoAlpha: 0 });
        L.fan.classList.remove('is-live');
        state[i] = 'hidden';
      };

      /** OUT: posts gather back under post 2 while the screen swipes away. */
      const playOut = (t: gsap.core.Timeline, i: number, dir: number, desktop: boolean) => {
        const L = layers[i];
        state[i] = 'out';
        t.to(L.screen, { autoAlpha: 0, yPercent: -dir * 14, filter: 'blur(7px)', duration: 0.5, ease: 'power2.in' }, 0)
          .to(L.rolls, { autoAlpha: 0, y: -dir * ROLL, duration: 0.28, ease: 'power2.in', stagger: 0.02 }, 0)
          .to(L.vig, { autoAlpha: 0, duration: 0.8, ease: 'power1.inOut' }, 0);

        const [d1, d2, d3, d4] = L.deals;
        if (desktop) {
          // outermost first; post 2 lets go last
          [d4, d3, d1].forEach((d, k) => {
            t.to(d, { ...gathered(L.deals.indexOf(d), true), opacity: 0, duration: 0.4, ease: 'power3.in' }, k * 0.04);
          });
          t.to(d2, { ...gathered(1, true), opacity: 0, duration: 0.28, ease: 'power2.in' }, 0.2);
        } else {
          L.deals.forEach((d, k) => {
            t.to(d, { ...gathered(k, false), opacity: 0, duration: 0.42, ease: 'power3.in' }, (3 - k) * 0.04);
          });
        }
        t.add(() => hide(i), 0.82);
      };

      /** IN: the mirror image — the screen swipes in, post 2 lands on it, the rest deal out. */
      const playIn = (t: gsap.core.Timeline, i: number, dir: number, desktop: boolean, at: number) => {
        const L = layers[i];
        const fresh = state[i] === 'hidden';
        state[i] = 'in';

        if (fresh) {
          gsap.set(L.fan, { autoAlpha: 1 });
          gsap.set(L.screen, { autoAlpha: 0, yPercent: dir * 14, filter: 'blur(7px)' });
          gsap.set(L.rolls, { autoAlpha: 0, y: dir * ROLL });
          gsap.set(L.vig, { autoAlpha: 0 });
          L.deals.forEach((d, k) => gsap.set(d, { ...gathered(k, desktop), opacity: 0 }));
          gsap.set(L.pops, { scale: 0 });
        }

        t.to(L.screen, { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }, at)
          .to(L.rolls, { autoAlpha: 1, y: 0, duration: 0.65, ease: 'expo.out', stagger: 0.04 }, at)
          .to(L.vig, { autoAlpha: 1, duration: 0.8, ease: 'power1.inOut' }, Math.max(at - 0.3, 0))
          .to(L.pops, { scale: 1, duration: 0.4, ease: 'back.out(2.2)', stagger: 0.08 }, at + 0.22);

        const [d1, d2, d3, d4] = L.deals;
        let done = at + 0.95;
        if (desktop) {
          t.to(d2, { ...DEALT, duration: 0.5, ease: 'back.out(2.4)' }, at + 0.06);
          [d1, d3, d4].forEach((d, k) => {
            t.to(d, { ...DEALT, duration: 0.7, ease: 'back.out(1.7)' }, at + 0.24 + k * 0.1);
          });
          done = at + 0.24 + 0.2 + 0.55;
        } else {
          L.deals.forEach((d, k) => {
            t.to(d, { ...DEALT, duration: 0.6, ease: 'back.out(1.6)' }, at + 0.12 + k * 0.09);
          });
          done = at + 0.12 + 0.27 + 0.5;
        }

        // posts become hoverable / clickable once they have landed
        t.add(() => L.fan.classList.add('is-live'), done);

        // like-heart burst on post 2 (pops, then fades like a double-tap)
        if (L.heart) {
          t.fromTo(
            L.heart,
            { opacity: 0, scale: 0, rotation: -25 },
            { opacity: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(3)', immediateRender: false },
            done - 0.1,
          )
            .fromTo(
              L.sparks,
              { opacity: 1, scale: 0, xPercent: 0, yPercent: 0 },
              {
                opacity: 0,
                scale: 1,
                xPercent: (k: number) => Math.cos((k / L.sparks.length) * Math.PI * 2) * 380,
                yPercent: (k: number) => Math.sin((k / L.sparks.length) * Math.PI * 2) * 380,
                duration: 0.7,
                ease: 'power2.out',
                immediateRender: false,
              },
              '<0.05',
            )
            .to(L.heart, { opacity: 0, scale: 1.3, duration: 0.35, ease: 'power1.in' }, '+=0.1');
        }
      };

      /**
       * Show brand `next`. Whatever was in flight is killed; only the brand that was showing
       * (outgoing) and `next` (incoming) stay rendered, so two brands can never be left on screen.
       */
      const show = (next: number, dir: number) => {
        const prev = cur;
        const desktop = isDesktop();
        if (tl) tl.kill();
        layers.forEach((L, i) => {
          if (i !== prev && i !== next) hide(i);
          L.fan.classList.remove('is-live');
          if (L.heart) gsap.set([L.heart, ...L.sparks], { opacity: 0 });
        });
        cur = next;
        activeRef.current = next;
        setActive(next);
        warmAround(next);

        tl = gsap.timeline();
        const swap = prev !== next && state[prev] !== 'hidden';
        if (swap) playOut(tl, prev, dir, desktop);
        playIn(tl, next, dir, desktop, swap ? 0.36 : 0);
      };

      const change = (next: number) => {
        if (next === cur) return;
        if (!entered) {
          // nothing is on screen yet: just remember where we are
          cur = next;
          activeRef.current = next;
          setActive(next);
          return;
        }
        const dir = next > cur ? 1 : -1;
        inCtx(() => show(next, dir));
      };

      /** First arrival: the phone rises in and the current brand deals out. */
      const enter = () => {
        if (entered) return;
        entered = true;
        inCtx(() => {
          gsap.to(phoneIn, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' });
          gsap.to(chrome, { autoAlpha: 1, duration: 0.6, ease: 'power1.out', delay: 0.2 });
          show(cur, 1);
        });
      };

      // Initial state: an empty stage waiting for its entrance.
      layers.forEach((_, i) => hide(i));
      gsap.set(phoneIn, { autoAlpha: 0, y: 70 });
      // counter / stepper and stats / SEE ALL wait for the first brand too (no orphan "‹ / 07 ›")
      gsap.set(chrome, { autoAlpha: 0 });

      // Images: start fetching the first brands well before the scene shows up.
      ScrollTrigger.create({
        trigger: scene,
        start: 'top 350%',
        once: true,
        onEnter: () => warmAround(cur),
      });

      ScrollTrigger.create({
        trigger: scene,
        start: 'top 62%',
        once: true,
        onEnter: enter,
      });

      const sync = (self: ScrollTrigger) => {
        const raw = self.progress * N;
        let next = cur;
        if (raw >= cur + 1 + HYSTERESIS) next = clampIndex(Math.floor(raw - HYSTERESIS));
        else if (raw < cur - HYSTERESIS) next = clampIndex(Math.floor(raw + HYSTERESIS));
        change(next);
      };

      pinRef.current = ScrollTrigger.create({
        trigger: scene,
        start: 'top top',
        end: `+=${N * STEP}%`,
        pin: true,
        anticipatePin: 1,
        onUpdate: sync,
        onRefresh: sync,
        // safety net: the scene can never be pinned while still empty
        onToggle: (self) => {
          if (self.isActive) enter();
        },
      });

      // Mouse parallax: the phone moves least, the fan most
      const phonePar = q('.smm-phone-par')[0];
      const fansPar = q('.smm-fans-par')[0];
      if (phonePar && fansPar && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const opts = { duration: 0.7, ease: 'power3.out' };
        const px = gsap.quickTo(phonePar, 'x', opts);
        const py = gsap.quickTo(phonePar, 'y', opts);
        const fx = gsap.quickTo(fansPar, 'x', opts);
        const fy = gsap.quickTo(fansPar, 'y', opts);
        const onMove = (e: PointerEvent) => {
          if (!isDesktop()) return;
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          px(nx * -8);
          py(ny * -6);
          fx(nx * -22);
          fy(ny * -14);
        };
        const onLeave = () => {
          px(0);
          py(0);
          fx(0);
          fy(0);
        };
        scene.addEventListener('pointermove', onMove);
        scene.addEventListener('pointerleave', onLeave);
        cleanups.push(() => {
          scene.removeEventListener('pointermove', onMove);
          scene.removeEventListener('pointerleave', onLeave);
        });
      }
    }, root);

    return () => {
      cleanups.forEach((fn) => fn());
      pinRef.current = null;
      ctx?.revert();
    };
  }, [reduce, warmAround]);

  const pinnedLoad = useCallback((i: number): ImgLoad => (warm[i] ? 'eager' : 'hold'), [warm]);

  const lightboxBrand = lightbox ? smm.find((b) => b.slug === lightbox.slug) : undefined;
  const wallBrand = wall ? smm.find((b) => b.slug === wall) : undefined;

  return (
    <section
      ref={sectionRef}
      id="section-smm"
      style={{
        position: 'relative',
        zIndex: 'var(--z-content)' as any,
        // Own paper sheet: the fixed page backdrop can already be the next chapter's colour
        // (even the Outro's black) while the last brands are on screen. Feathered at the top only:
        // Packaging starts on its own sheet right below, so no backdrop may show between the two.
        background: `linear-gradient(to bottom, transparent 0, ${SHEET} 7rem)`,
      }}
    >
      <MarqueeDivider text="SOCIAL MEDIA ✦✦✦ CREATIVES ✦✦✦" />
      <ChapterCard chapterIndex={4} title="SOCIAL MEDIA CREATIVES" />

      <style>{smmCss}</style>

      {reduce ? (
        // Reduced motion: a plain list, one static scene per brand, everything visible.
        smm.map((brand, i) => (
          <SmmScene
            key={brand.slug}
            brands={[brand]}
            first={i}
            active={i}
            pinned={false}
            load={lazyLoad}
            onOpenPost={openPost}
            onSeeAll={openWall}
          />
        ))
      ) : (
        <SmmScene
          brands={smm}
          first={0}
          active={active}
          pinned
          load={pinnedLoad}
          onOpenPost={openPost}
          onSeeAll={openWall}
          onStep={step}
        />
      )}

      {/* EXPLORE ALL CREATIVES → the full archive (its own overlay, loaded on demand) */}
      <SmmArchive tint={smm[N - 1]?.primary} />

      {wallBrand && (
        <SmmWall brand={wallBrand} suspended={!!lightbox} onOpen={(index) => setLightbox({ slug: wallBrand.slug, index })} onClose={closeWall} />
      )}
      {lightbox && lightboxBrand && (
        <SmmLightbox
          key={`${lightbox.slug}-${lightbox.index}`}
          brand={lightboxBrand}
          startIndex={lightbox.index}
          onClose={closeLightbox}
        />
      )}
    </section>
  );
}
