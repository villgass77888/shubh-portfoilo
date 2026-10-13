import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { setHead } from '../seo/head';
import { resolve } from './resolve';

/** Starts the inner page for `path` in the root */
export async function mount(root: HTMLElement, path: string) {
  const { meta, load } = resolve(path);
  const { default: View } = await load();
  // dev server and the 404 fallback serve the home shell: give the page its own title
  if (!document.title.startsWith(meta.title)) setHead(meta.title, meta.path);
  document.documentElement.classList.add('is-page');
  const app = (
    <StrictMode>
      <View meta={meta} />
    </StrictMode>
  );
  // the prerendered markup of this very page is kept and brought to life in place;
  // anything else in the root (dev server, a host's fallback page) is replaced
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute('href') ?? '';
  const own = root.hasChildNodes() && canonical.replace(/^https?:\/\/[^/]+/, '') === (meta.path === '/' ? '' : meta.path);
  if (own) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
