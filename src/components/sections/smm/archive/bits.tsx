import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ArchiveImage } from '../../../../data/archive';
import { avifSet } from '../../../../data/archive';
import { Chars, SelMarks } from './marks';

/** The overlay's own scroll container: the root for every in-view observer inside it */
export const ScrollRoot = createContext<HTMLElement | null>(null);

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── ESC: the top-most open layer (lightbox, reader, page) decides what it means ── */
const escStack: Array<{ run: () => void }> = [];

export function useEscape(handler: () => void, active = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const entry = { run: () => ref.current() };
    escStack.push(entry);
    return () => {
      const i = escStack.indexOf(entry);
      if (i >= 0) escStack.splice(i, 1);
    };
  }, [active]);
}

export function runEscape(): boolean {
  const top = escStack[escStack.length - 1];
  if (!top) return false;
  top.run();
  return true;
}

/* ── responsive picture: AVIF + WebP, blurred placeholder underneath, fades in on load ── */
type PicProps = {
  image: ArchiveImage;
  sizes: string;
  alt?: string;
  eager?: boolean;
  /** Fill the parent (object-fit: cover) instead of taking the image's own aspect ratio */
  fill?: boolean;
  className?: string;
};

export function Pic({ image, sizes, alt = '', eager = false, fill = false, className = '' }: PicProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <span
      className={`ar-pic${fill ? ' ar-pic--fill' : ''}${loaded ? ' is-loaded' : ''}${className ? ` ${className}` : ''}`}
      style={{ backgroundImage: `url(${image.lqip})`, aspectRatio: fill ? undefined : `${image.w} / ${image.h}` }}
    >
      <picture>
        <source type="image/avif" srcSet={avifSet(image.srcset)} sizes={sizes} />
        <img
          ref={ref}
          src={image.src}
          srcSet={image.srcset}
          sizes={sizes}
          alt={alt}
          width={image.w}
          height={image.h}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
        />
      </picture>
    </span>
  );
}

/**
 * In-view reveal for a list: returns a ref callback; each element gets `is-in` the first time
 * it enters the overlay's viewport, with a small stagger inside each batch.
 */
export function useReveal(step = 40) {
  const root = useContext(ScrollRoot);
  const ioRef = useRef<IntersectionObserver | null>(null);
  // everything registered and not revealed yet: re-observed whenever the observer is rebuilt
  // (the scroll root only exists after the overlay's first render)
  const waiting = useRef(new Set<HTMLElement>());

  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      waiting.current.forEach((el) => el.classList.add('is-in'));
      waiting.current.clear();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
        batch.forEach((el, i) => {
          el.style.setProperty('--rd', `${i * step}ms`);
          el.classList.add('is-in');
          io.unobserve(el);
          waiting.current.delete(el);
        });
      },
      { root, rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
    );
    ioRef.current = io;
    waiting.current.forEach((el) => {
      if (el.isConnected) io.observe(el);
      else waiting.current.delete(el);
    });
    return () => {
      io.disconnect();
      ioRef.current = null;
    };
  }, [root, step]);

  return useCallback((el: HTMLElement | null) => {
    if (!el || el.classList.contains('is-in')) return;
    waiting.current.add(el);
    ioRef.current?.observe(el);
  }, []);
}

/** True one frame after mount (and after `delay` ms): lets CSS entrances start from their hidden state */
export function useEntered(delay = 0) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let raf = 0;
    const t = window.setTimeout(() => {
      raf = requestAnimationFrame(() => setOn(true));
    }, delay);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [delay]);
  return on;
}

/* ── the head every page below the menu shares: big red title in its selection box ── */
type HeadProps = {
  title: string;
  meta: string;
  children?: ReactNode;
  /** Brand colour for the accents on this page */
  color?: string;
  wide?: boolean;
};

export function PageHead({ title, meta, children, color, wide }: HeadProps) {
  const on = useEntered(260);
  return (
    <header className={`ar-head${on ? ' is-in' : ''}${wide ? ' ar-head--wide' : ''}`} style={color ? ({ '--c': color } as CSSProperties) : undefined}>
      <h2 className={`ar-title ar-sel${on ? ' is-on' : ''}`} aria-label={title}>
        <Chars text={title} />
        <SelMarks />
      </h2>
      <p className="ar-metaline">
        {color && <i className="ar-swatch" aria-hidden="true" />}
        {meta}
      </p>
      {children}
    </header>
  );
}

export const bitsCss = `
.ar-pic { display: block; position: relative; overflow: hidden; background-color: #ddd8cc; background-size: cover; background-position: center; }
.ar-pic picture { display: block; width: 100%; height: 100%; }
.ar-pic img { display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; opacity: 0; transition: opacity 0.4s ease; }
.ar-pic.is-loaded img { opacity: 1; }
.ar-pic--fill { position: absolute; inset: 0; }

.ar-head {
  --c: var(--signal);
  width: min(1400px, 100%);
  margin: 0 auto;
  padding: clamp(1.5rem, 5vh, 3.5rem) 0 clamp(1.5rem, 4vh, 2.75rem);
}
.ar-title {
  display: inline-block;
  max-width: 100%;
  margin: 0;
  padding: 0.06em 0.2em 0.1em;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(3rem, 11vw, 11.5rem);
  line-height: 0.95;
  text-transform: uppercase;
  color: var(--signal);
}
.ar-metaline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6em;
  margin: clamp(1rem, 2.4vh, 1.6rem) 0 0;
  font-family: var(--font-meta);
  font-size: clamp(0.62rem, 0.8vw, 0.76rem);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ar-swatch { width: 0.9em; height: 0.9em; border-radius: 50%; background: var(--c); border: 1.5px solid var(--ink); }
.ar-about {
  max-width: 60ch;
  margin: 0.9rem 0 0;
  font-family: var(--font-body);
  font-size: clamp(0.95rem, 1.25vw, 1.2rem);
  line-height: 1.5;
}
.ar-head .ar-metaline, .ar-head .ar-about, .ar-head .ar-chips {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.8s var(--ease-enter);
}
.ar-head.is-in .ar-metaline { opacity: 1; transform: none; transition-delay: 0.35s; }
.ar-head.is-in .ar-about { opacity: 1; transform: none; transition-delay: 0.45s; }
.ar-head.is-in .ar-chips { opacity: 1; transform: none; transition-delay: 0.55s; }
@media (prefers-reduced-motion: reduce) {
  .ar-head .ar-metaline, .ar-head .ar-about, .ar-head .ar-chips { opacity: 1; transform: none; transition: none; }
  .ar-pic img { transition: none; }
}
`;
