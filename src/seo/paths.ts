/* Path helpers with no content behind them, so the entry bundle can use them. */

/** "/work/senquira/" → "/work/senquira" */
export const normalizePath = (path: string) => {
  const p = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  return p.length > 1 ? p.replace(/\/+$/, '') : '/';
};

/** Old hash links (#archive/srj, #packaging/croppd-honey) → the real route, or null */
export const legacyHash = (hash: string): string | null => {
  const a = /^#archive(\/[a-z0-9-]+)?(\/[a-z0-9-]+)?\/?$/i.exec(hash);
  if (a) return `/work/archive${(a[1] ?? '').toLowerCase()}${(a[2] ?? '').toLowerCase()}`;
  const p = /^#packaging\/([a-z0-9-]+)/i.exec(hash);
  if (p) return `/work/packaging/${p[1].toLowerCase()}`;
  return null;
};

/**
 * The home page is open and an overlay changed the URL (archive, packaging viewer): bring the
 * title and canonical in step. The page table is fetched only then, so it never weighs on the
 * first load. `null` puts the home page's own head back.
 */
let homeTitle: string | null = null;
export function syncHead(path: string | null) {
  if (typeof document === 'undefined') return;
  if (homeTitle === null) homeTitle = document.title;
  if (path === null) {
    void import('./head').then(({ setHead }) => setHead(homeTitle!, '/'));
    return;
  }
  void Promise.all([import('../content/seo'), import('./head')]).then(([{ pageFor }, { setHead }]) => {
    const meta = pageFor(path);
    if (meta && normalizePath(window.location.pathname) === meta.path) setHead(meta.title, meta.path);
  });
}
