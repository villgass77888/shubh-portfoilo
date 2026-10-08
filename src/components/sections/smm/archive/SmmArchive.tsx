import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ArchiveTrigger from './ArchiveTrigger';
import { marksCss } from './marks';
import { useArchiveRoute } from './route';

/* The whole archive (menu, brand pages, lightbox, book reader) is one separate chunk:
   it is fetched when the trigger is about to scroll into view, or on the first click. */
const loadOverlay = () => import('./ArchiveOverlay');
const ArchiveOverlay = lazy(loadOverlay);
const prefetch = () => {
  void loadOverlay();
};

type PageLenis = { scrollTo: (target: number, options?: { immediate?: boolean; force?: boolean }) => void };

/**
 * Creatives Archive — the subsection that closes the Social Media chapter.
 * Renders the trigger in the page and, while a #archive… route is active, the full-screen overlay.
 * `tint` is the last brand's colour: its vignette carries on behind the trigger.
 */
export default function SmmArchive({ tint }: { tint?: string }) {
  const { route, deep, nav } = useArchiveRoute();
  const [mounted, setMounted] = useState(false);
  const arrivedByLink = useRef(false);

  useEffect(() => {
    if (!route) return;
    setMounted(true);
    if (deep) arrivedByLink.current = true;
  }, [route, deep]);

  // A visit that started on an archive link closes onto the trigger, not the top of the page
  useEffect(() => {
    if (route || !arrivedByLink.current) return;
    arrivedByLink.current = false;
    const el = document.getElementById('smm-archive-trigger');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.32;
    const lenis = (window as unknown as { __lenis?: PageLenis }).__lenis;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
  }, [route]);

  const open = useCallback(() => nav.open(), [nav]);
  const onExited = useCallback(() => {
    setMounted(false);
    document.querySelector<HTMLElement>('.ar-trig-btn')?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <style>{marksCss}</style>
      <ArchiveTrigger onOpen={open} onNear={prefetch} tint={tint} />
      {mounted &&
        createPortal(
          <Suspense fallback={<div className="ar-loading">OPENING THE ARCHIVE…</div>}>
            <ArchiveOverlay route={route} nav={nav} onExited={onExited} />
          </Suspense>,
          document.body,
        )}
    </>
  );
}
