import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { archive } from '../../../../data/archive';
import { ScrollRoot, bitsCss, prefersReducedMotion, runEscape } from './bits';
import { LayerRoot } from './layers';
import { levelOf, sameRoute } from './route';
import type { ArchiveNav, ArchiveRoute } from './route';
import ArchiveMenu, { menuCss } from './ArchiveMenu';
import BrandPage, { brandCss } from './BrandPage';
import FlyersPage from './FlyersPage';
import EmailersPage, { emailersCss } from './EmailersPage';
import BrochuresPage, { brochuresCss } from './BrochuresPage';
import { masonryCss } from './Masonry';
import { lightboxCss } from './Lightbox';
import { readerCss } from './ReaderShell';

type Props = {
  /** null while the overlay plays its exit */
  route: ArchiveRoute | null;
  nav: ArchiveNav;
  onExited: () => void;
};

type PageLenis = { stop: () => void; start: () => void };
const pageLenis = () => (window as unknown as { __lenis?: PageLenis }).__lenis;

/* same grunge texture the fixed BackgroundStage lays under every chapter */
const GRUNGE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`;

/** A link that names something the archive does not have falls back one level */
function resolve(r: ArchiveRoute): ArchiveRoute {
  if (r.page === 'brand' && !archive.brands.some((b) => b.slug === r.slug)) return { page: 'menu' };
  if (r.page === 'brochures' && r.open && !archive.brochures.some((b) => b.slug === r.open)) return { page: 'brochures' };
  return r;
}

/** The trail in the top bar: ARCHIVE / BROCHURES / KANGAROO AGENCY */
function crumbsOf(r: ArchiveRoute): Array<{ label: string; to: ArchiveRoute }> {
  const trail: Array<{ label: string; to: ArchiveRoute }> = [{ label: 'ARCHIVE', to: { page: 'menu' } }];
  if (r.page === 'brand') trail.push({ label: archive.brands.find((b) => b.slug === r.slug)?.name ?? r.slug, to: r });
  else if (r.page !== 'menu') trail.push({ label: r.page, to: { page: r.page } });
  if (r.page === 'brochures' && r.open) trail.push({ label: archive.brochures.find((b) => b.slug === r.open)?.name ?? r.open, to: r });
  return trail;
}

/**
 * The creatives archive: a full-screen sheet of the site's paper above the whole page, with its
 * own smooth scroll. It rises from the bottom with a torn top edge; the pages inside change
 * behind a short ink wipe, so the overlay always feels like one continuous object.
 */
export default function ArchiveOverlay({ route, nav, onExited }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const reduced = useMemo(prefersReducedMotion, []);

  // the page that is rendered; trails `route` by the length of the ink wipe
  const [shown, setShown] = useState<ArchiveRoute>(() => resolve(route ?? { page: 'menu' }));
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const open = route !== null;

  // ── hold the page behind, rise in, sink out ──
  useLayoutEffect(() => {
    let page = pageLenis();
    page?.stop();
    // a visit that starts on an archive link can get here before the page's Lenis exists
    const late = window.setTimeout(() => {
      if (!page) {
        page = pageLenis();
        page?.stop();
      }
    }, 400);
    if (!reduced) {
      gsap.set(sheetRef.current, { yPercent: 106 });
      gsap.set(scrimRef.current, { opacity: 0 });
    }
    return () => {
      window.clearTimeout(late);
      page?.start();
    };
  }, [reduced]);

  useEffect(() => {
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (!sheet || !scrim) return;
    if (reduced) {
      if (!open) onExited();
      return;
    }
    const tl = gsap.timeline();
    if (open) {
      tl.to(scrim, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0).to(sheet, { yPercent: 0, duration: 0.8, ease: 'expo.inOut', clearProps: 'transform' }, 0);
    } else {
      tl.to(sheet, { yPercent: 106, duration: 0.6, ease: 'expo.in' }, 0).to(scrim, { opacity: 0, duration: 0.45, ease: 'power1.in' }, 0.25).add(onExited);
    }
    return () => {
      tl.kill();
    };
  }, [open, reduced, onExited]);

  // ── its own smooth scroll ──
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    if (!scroller || !content || reduced) return;
    const lenis = new Lenis({ wrapper: scroller, content, lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [scroller, content, reduced]);

  const toTop = useCallback(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
    else scroller?.scrollTo(0, 0);
  }, [scroller]);

  // ── between levels: an ink panel sweeps across, the next page builds in behind it ──
  useEffect(() => {
    if (!route) return;
    const next = resolve(route);
    const prev = shownRef.current;
    if (sameRoute(next, prev)) return;
    // opening / closing a brochure happens on top of the shelf: no page change
    if (next.page === 'brochures' && prev.page === 'brochures') {
      setShown(next);
      return;
    }
    const ink = inkRef.current;
    if (reduced || !ink) {
      setShown(next);
      toTop();
      return;
    }
    const deeper = levelOf(next) >= levelOf(prev);
    const tl = gsap.timeline();
    tl.set(ink, { transformOrigin: deeper ? '0% 50%' : '100% 50%', visibility: 'visible' })
      .to(ink, { scaleX: 1, duration: 0.35, ease: 'power3.in' })
      .add(() => {
        setShown(next);
        toTop();
      })
      .set(ink, { transformOrigin: deeper ? '100% 50%' : '0% 50%' }, '+=0.06')
      .to(ink, { scaleX: 0, duration: 0.35, ease: 'power3.out' })
      .set(ink, { visibility: 'hidden' });
    return () => {
      tl.kill();
    };
  }, [route, reduced, toTop]);

  // ── keyboard: ESC steps back through whatever is open, Tab stays inside ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (!runEscape()) nav.back();
        return;
      }
      if (e.key !== 'Tab') return;
      // the top-most modal layer (lightbox, reader) keeps the focus if there is one
      const modals = root.querySelectorAll<HTMLElement>('[data-ar-modal]');
      const scope = modals.length ? modals[modals.length - 1] : root;
      const list = Array.from(scope.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null,
      );
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !scope.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !scope.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [nav]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const crumbs = crumbsOf(shown);
  const brand = shown.page === 'brand' ? archive.brands.find((b) => b.slug === shown.slug) : undefined;
  const pageKey = shown.page === 'brand' ? `brand-${shown.slug}` : shown.page;

  return (
    <div ref={rootRef} className="ar-root" role="dialog" aria-modal="true" aria-label="Creatives archive" data-lenis-prevent>
      <style>{CSS}</style>
      <div ref={scrimRef} className="ar-scrim" aria-hidden="true" />
      <div ref={sheetRef} className="ar-sheet">
        <div className="ar-torn" aria-hidden="true" />
        <div className="ar-noise" aria-hidden="true" />

        <div ref={setScroller} className="ar-scroll">
          <div ref={setContent} className="ar-content">
            <header className="ar-bar">
              <nav className="ar-crumbs" aria-label="Archive">
                {crumbs.map((c, i) => {
                  const here = i === crumbs.length - 1;
                  return (
                    <span key={c.label}>
                      {i > 0 && <i aria-hidden="true">/</i>}
                      {here ? (
                        <b aria-current="page">{c.label}</b>
                      ) : (
                        <button type="button" onClick={() => nav.upTo(c.to)}>
                          {c.label}
                        </button>
                      )}
                    </span>
                  );
                })}
              </nav>
              <div className="ar-bar-actions">
                {shown.page !== 'menu' && (
                  <button type="button" className="ar-stick ar-stick--bone" data-cursor="BACK" onClick={() => nav.back()}>
                    ← BACK
                  </button>
                )}
                <button ref={closeRef} type="button" className="ar-stick ar-stick--acid" data-cursor="CLOSE" onClick={() => nav.close()}>
                  ✕ CLOSE
                </button>
              </div>
            </header>

            <ScrollRoot.Provider value={scroller}>
              <LayerRoot.Provider value={layer}>
                <main key={pageKey} className="ar-page">
                  {shown.page === 'menu' && <ArchiveMenu nav={nav} />}
                  {brand && <BrandPage brand={brand} nav={nav} />}
                  {shown.page === 'flyers' && <FlyersPage />}
                  {shown.page === 'emailers' && <EmailersPage />}
                  {shown.page === 'brochures' && <BrochuresPage open={shown.open} nav={nav} />}
                </main>
              </LayerRoot.Provider>
            </ScrollRoot.Provider>
          </div>
        </div>

        {/* lightbox + readers mount here: above the bar, outside the scroll */}
        <div ref={setLayer} className="ar-layers" />
        <div ref={inkRef} className="ar-ink" aria-hidden="true" />
      </div>
    </div>
  );
}

const CSS = `
.ar-root {
  --paper-sheet: #F3F0E8;
  position: fixed;
  inset: 0;
  /* above the nav, under the film grain and the custom cursor (so its labels still show) */
  z-index: 140;
  color: var(--ink);
}
.ar-scrim {
  position: absolute;
  inset: 0;
  background: rgba(13, 13, 13, 0.4);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
.ar-sheet { position: absolute; inset: 0; background: var(--paper-sheet); }
/* torn top edge of the sheet as it wipes up */
.ar-torn {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% - 1px);
  height: 46px;
  background: var(--paper-sheet);
  clip-path: polygon(0% 100%, 0% 46%, 3% 22%, 6% 58%, 9% 30%, 13% 64%, 16% 18%, 20% 52%, 24% 26%, 27% 70%, 31% 34%, 35% 60%, 38% 12%, 42% 48%, 46% 28%, 49% 66%, 53% 20%, 57% 56%, 60% 32%, 64% 68%, 67% 16%, 71% 50%, 75% 24%, 78% 62%, 82% 36%, 86% 58%, 89% 14%, 93% 46%, 96% 26%, 100% 54%, 100% 100%);
}
.ar-noise {
  position: absolute;
  inset: 0;
  background-image: ${GRUNGE};
  background-size: 256px 256px;
  mix-blend-mode: multiply;
  opacity: 0.2;
  pointer-events: none;
}
.ar-scroll { position: absolute; inset: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; }
.ar-content { position: relative; min-height: 100%; overflow-x: clip; }
.ar-page { padding: 0 clamp(1rem, 4vw, 4rem) clamp(4rem, 12vh, 8rem); }

/* ── top bar ── */
.ar-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: clamp(0.7rem, 1.8vh, 1.1rem) clamp(1rem, 4vw, 4rem);
  background: linear-gradient(to bottom, var(--paper-sheet) 62%, rgba(243, 240, 232, 0));
}
.ar-crumbs {
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-family: var(--font-meta);
  font-size: clamp(0.6rem, 0.78vw, 0.74rem);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ar-crumbs i { margin: 0 0.6em; font-style: normal; opacity: 0.4; }
.ar-crumbs button { padding: 0.3em 0; color: inherit; font: inherit; letter-spacing: inherit; text-transform: inherit; opacity: 0.55; border-bottom: 1.5px solid transparent; transition: opacity 0.2s ease, border-color 0.2s ease; }
.ar-crumbs button:hover, .ar-crumbs button:focus-visible { opacity: 1; border-color: var(--signal); outline: none; }
.ar-crumbs b { font-weight: 700; }
.ar-bar-actions { flex: none; display: flex; align-items: center; gap: 0.8rem; }

.ar-layers { position: absolute; inset: 0; z-index: 20; pointer-events: none; }
.ar-layers > * { pointer-events: auto; }
.ar-ink {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: var(--ink);
  transform: scaleX(0);
  visibility: hidden;
  pointer-events: none;
}
.ar-root button:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; }
${bitsCss}
${menuCss}
${brandCss}
${masonryCss}
${emailersCss}
${brochuresCss}
${lightboxCss}
${readerCss}
`;
