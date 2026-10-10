import { useCallback, useEffect, useState } from 'react';
import { allPackProjects, honey } from '../../data/packaging';
import type { PackProject } from '../../data/packaging';
import ChapterCard from '../global/ChapterCard';
import { MarqueeDivider } from '../global/Marquee';
import FeaturedScene from './packaging/FeaturedScene';
import StudioShelf from './packaging/StudioShelf';
import MoreGrid from './packaging/MoreGrid';
import PackViewer from './packaging/PackViewer';
import { SHEET, packagingCss } from './packaging/styles';

const COMPACT_QUERY = '(max-width: 768px)';
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

type Open = { project: PackProject; key: string; origin: { x: number; y: number } | null };

/**
 * Packaging — chapter 06. Entry (marquee + title card), then the featured project told by two
 * transparent videos (the Croppd Honey label wraps onto its jar), the jar "from studio to
 * shelf", and the other projects as small clusters. Everything opens in one full-screen viewer.
 */
export default function Packaging() {
  const compact = useMatch(COMPACT_QUERY);
  const reduced = useMatch(REDUCED_QUERY);
  const [open, setOpen] = useState<Open | null>(null);

  // a link straight to a project: #packaging/croppd-honey
  useEffect(() => {
    const m = /^#packaging\/([a-z0-9-]+)/i.exec(window.location.hash);
    const project = m && allPackProjects.find((p) => p.slug === m[1].toLowerCase());
    if (project) setOpen({ project, key: project.gallery[0].key, origin: null });
  }, []);

  const openHoney = useCallback((key: string, origin: { x: number; y: number }) => setOpen({ project: honey, key, origin }), []);
  const openProject = useCallback((project: PackProject, key: string, origin: { x: number; y: number }) => setOpen({ project, key, origin }), []);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section
      id="section-packaging"
      style={{
        position: 'relative',
        zIndex: 'var(--z-content)',
        color: 'var(--ink)',
        overflowX: 'clip',
        // Own paper sheet: the fixed page backdrop can already be the Outro's black while
        // this section is on screen, which made every ink label here unreadable.
        background: `linear-gradient(to bottom, ${SHEET} calc(100% - 4rem), transparent 100%)`,
      }}
    >
      <style>{packagingCss}</style>
      <MarqueeDivider text="PACKAGING ✦✦✦ DIELINE TO SHELF ✦✦✦" />
      <ChapterCard chapterIndex={5} title="PACKAGING DESIGN" />

      {/* the quiet cream stage: the featured project, then the same jar out in the world */}
      <div className="pk-cream">
        <FeaturedScene compact={compact} reduced={reduced} onOpen={openHoney} />
        <StudioShelf reduced={reduced} onOpen={openHoney} />
      </div>

      <MoreGrid reduced={reduced} onOpen={openProject} />

      {open && <PackViewer key={open.project.slug} project={open.project} start={open.key} origin={open.origin} onClose={close} />}
    </section>
  );
}
