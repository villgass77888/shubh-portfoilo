import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

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
