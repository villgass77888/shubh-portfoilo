import { useCallback, useEffect, useState } from 'react';

/**
 * Where the visitor is inside the creatives archive. Every state has a hash
 * (#archive, #archive/srj, #archive/flyers, #archive/brochures/kangaroo-agency), so the browser's
 * back button steps back one level and a shared link opens straight into that page.
 */
export type ArchiveRoute =
  | { page: 'menu' }
  | { page: 'brand'; slug: string }
  | { page: 'flyers' }
  | { page: 'emailers' }
  | { page: 'brochures'; open?: string };

export function parseHash(hash: string): ArchiveRoute | null {
  const m = /^#archive(?:\/([a-z0-9-]+))?(?:\/([a-z0-9-]+))?\/?$/i.exec(hash);
  if (!m) return null;
  const a = m[1]?.toLowerCase();
  const b = m[2]?.toLowerCase();
  if (!a) return { page: 'menu' };
  if (a === 'flyers') return { page: 'flyers' };
  if (a === 'emailers') return { page: 'emailers' };
  if (a === 'brochures') return b ? { page: 'brochures', open: b } : { page: 'brochures' };
  return { page: 'brand', slug: a };
}

export function toHash(r: ArchiveRoute): string {
  switch (r.page) {
    case 'menu':
      return '#archive';
    case 'brand':
      return `#archive/${r.slug}`;
    case 'brochures':
      return r.open ? `#archive/brochures/${r.open}` : '#archive/brochures';
    default:
      return `#archive/${r.page}`;
  }
}

/** 0 = menu, 1 = a brand / format page, 2 = an open brochure */
export const levelOf = (r: ArchiveRoute) => (r.page === 'menu' ? 0 : r.page === 'brochures' && r.open ? 2 : 1);

export function parentOf(r: ArchiveRoute): ArchiveRoute | null {
  if (r.page === 'menu') return null;
  if (r.page === 'brochures' && r.open) return { page: 'brochures' };
  return { page: 'menu' };
}

export const sameRoute = (a: ArchiveRoute | null, b: ArchiveRoute | null) => !!a && !!b && toHash(a) === toHash(b);

/**
 * History entry written by the archive. `depth` is how many archive entries sit below this one;
 * `deep` marks a session that started on an archive link (there is no page entry to go back to).
 */
type Entry = { archive: true; depth: number; deep?: boolean };
const entry = (): Entry | null => (history.state && history.state.archive ? (history.state as Entry) : null);

export type ArchiveNav = {
  /** Open the archive from the page */
  open: (r?: ArchiveRoute) => void;
  /** Go one level down (adds a history entry) */
  go: (r: ArchiveRoute) => void;
  /** Move sideways, e.g. brand to next brand (no history entry, so Back still returns to the menu) */
  swap: (r: ArchiveRoute) => void;
  /** One level up; from the menu this closes the archive */
  back: () => void;
  /** Jump up to an ancestor (breadcrumb) */
  upTo: (r: ArchiveRoute) => void;
  close: () => void;
};

export function useArchiveRoute(): { route: ArchiveRoute | null; deep: boolean; nav: ArchiveNav } {
  const [route, setRoute] = useState<ArchiveRoute | null>(() => (typeof window === 'undefined' ? null : parseHash(window.location.hash)));
  const [deep, setDeep] = useState(false);

  useEffect(() => {
    // a session that starts on an archive link: mark the entry so close knows there is nothing behind it
    if (parseHash(window.location.hash) && !entry()) {
      history.replaceState({ archive: true, depth: 0, deep: true } satisfies Entry, '', window.location.href);
      setDeep(true);
    }
    const sync = () => {
      const next = parseHash(window.location.hash);
      if (next && !entry()) history.replaceState({ archive: true, depth: 0, deep: true } satisfies Entry, '', window.location.href);
      setDeep(!!entry()?.deep);
      setRoute(next);
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  const open = useCallback((r: ArchiveRoute = { page: 'menu' }) => {
    history.pushState({ archive: true, depth: 0 } satisfies Entry, '', toHash(r));
    setDeep(false);
    setRoute(r);
  }, []);

  const go = useCallback((r: ArchiveRoute) => {
    const cur = entry();
    history.pushState({ archive: true, depth: (cur?.depth ?? 0) + 1, deep: cur?.deep } satisfies Entry, '', toHash(r));
    setRoute(r);
  }, []);

  const swap = useCallback((r: ArchiveRoute) => {
    history.replaceState(entry() ?? ({ archive: true, depth: 0 } satisfies Entry), '', toHash(r));
    setRoute(r);
  }, []);

  const close = useCallback(() => {
    const cur = entry();
    if (cur && !cur.deep) {
      // back past everything the archive pushed; popstate then clears the route
      history.go(-(cur.depth + 1));
      return;
    }
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setRoute(null);
  }, []);

  const back = useCallback(() => {
    const cur = entry();
    const here = parseHash(window.location.hash);
    if (cur && cur.depth > 0) {
      history.back();
      return;
    }
    const up = here && parentOf(here);
    if (up) {
      // arrived here by link: there is no entry for the parent, so rewrite this one
      history.replaceState(cur, '', toHash(up));
      setRoute(up);
      return;
    }
    close();
  }, [close]);

  const upTo = useCallback((r: ArchiveRoute) => {
    const cur = entry();
    const here = parseHash(window.location.hash);
    if (!here) return;
    const steps = levelOf(here) - levelOf(r);
    if (steps <= 0) return;
    if (cur && cur.depth >= steps) {
      history.go(-steps);
      return;
    }
    history.replaceState(cur, '', toHash(r));
    setRoute(r);
  }, []);

  return { route, deep, nav: { open, go, swap, back, upTo, close } };
}
