/* Build-time entry: renders any route to HTML and exposes what the prerender needs. */
import { renderToString } from 'react-dom/server';
import { resolve } from './pages/resolve';

export async function render(path: string): Promise<string> {
  if (path === '/') {
    const { default: App } = await import('./App');
    return renderToString(<App />);
  }
  const { meta, load } = resolve(path);
  const { default: View } = await load();
  return renderToString(<View meta={meta} />);
}

export { pages, notFound } from './content/seo';
export { site, siteTodos } from './content/site';
export { headFor } from './seo/head';
export { graphFor } from './seo/jsonld';
export * as files from './seo/files';
