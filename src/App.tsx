import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { LANDSCAPE_PHONE } from './lib/device';

// Global components
import Preloader from './components/global/Preloader';
import GrainOverlay from './components/global/GrainOverlay';
import BackgroundStage from './components/global/BackgroundStage';
import CustomCursor from './components/global/CustomCursor';
import Nav from './components/global/Nav';
import ScrollProgress from './components/global/ScrollProgress';

// Sections
import Hero from './components/sections/Hero';
import Logos from './components/sections/Logos';
import Branding from './components/sections/Branding';
import WebDesigns from './components/sections/WebDesigns';
import SmmCreatives from './components/sections/SmmCreatives';
import Packaging from './components/sections/Packaging';
import Streetwear from './components/sections/Streetwear';
import Outro from './components/sections/Outro';

gsap.registerPlugin(ScrollTrigger);
// Safari's toolbar grows and shrinks while scrolling: a height-only change must not re-measure every pin
ScrollTrigger.config({ ignoreMobileResize: true });

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis smooth scroll + sync with GSAP
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    // Scenes that need to hold the scroll (e.g. the streetwear intro) reach Lenis through this
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf as any);
    };
  }, []);

  // A reload starts at the top, so every scene animates from a known state
  // (Safari otherwise restores the old position before anything is measured)
  useEffect(() => {
    if (location.hash) return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  // Re-measure once fonts and media have their final size, and after a rotation
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);

    // rotating: rebuild for the new layout, then return to the section the visitor was on
    const mq = window.matchMedia('(orientation: landscape)');
    const landscapePhone = window.matchMedia(LANDSCAPE_PHONE);
    const markLayout = () => {
      if (landscapePhone.matches) document.documentElement.dataset.layout = 'landscape-phone';
      else delete document.documentElement.dataset.layout;
    };
    markLayout();
    // where the visitor is (section + how far into it), kept current while scrolling
    let here: { el: HTMLElement; into: number } | null = null;
    let raf = 0;
    const track = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      const el = Array.from(document.querySelectorAll<HTMLElement>('main > section')).find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      });
      here = el ? { el, into: (mid - el.getBoundingClientRect().top) / el.offsetHeight } : null;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(track);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    let timer = 0;
    const onRotate = () => {
      const was = here;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        markLayout();
        ScrollTrigger.refresh();
        if (!was) return;
        const y = Math.max(0, was.el.getBoundingClientRect().top + window.scrollY + was.into * was.el.offsetHeight - window.innerHeight / 2);
        if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
      }, 300);
    };
    mq.addEventListener('change', onRotate);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('load', refresh);
      mq.removeEventListener('change', onRotate);
    };
  }, []);

  const handlePreloaderComplete = useCallback(() => {
    setLoaded(true);
    // Refresh ScrollTrigger after content renders
    setTimeout(() => ScrollTrigger.refresh(), 100);
  }, []);

  return (
    <>
      {/* Preloader */}
      {!loaded && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Fixed layers */}
      <BackgroundStage />
      <GrainOverlay />
      <CustomCursor />
      <Nav />
      <ScrollProgress />

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 'var(--z-content)' as any }}>
        <Hero />
        <Logos />
        <Branding />
        <WebDesigns />
        <SmmCreatives />
        <Packaging />
        <Streetwear />
        <Outro />
      </main>
    </>
  );
}
