/* The per-page <head>, built from one PageMeta. Used by the prerender (every route) and,
   for the overlays that change the URL without a page load, by setHead() in the browser. */

import type { PageMeta } from '../content/seo';
import { abs, site } from '../content/site';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const robotsFor = (m: PageMeta) => (m.index ? 'index, follow, max-image-preview:large' : 'noindex, follow');

export function headFor(m: PageMeta, graph: unknown[], preload: string[] = []): string {
  const url = abs(m.path);
  const image = abs(`/og/${m.og}.png`);
  const alt = `${m.h1}: ${m.title.split(' | ')[0]}`;
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="${robotsFor(m)}" />`,
    `<meta name="author" content="${site.name}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="${m.ogType}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(alt)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:site_name" content="${site.name}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    m.path === '/' ? `<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM summary" />` : '',
    ...preload,
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`,
  ];
  return tags.filter(Boolean).join('\n    ');
}

/** Browser: an overlay moved the URL (archive, packaging viewer). Keep title and canonical in step. */
export function setHead(title: string, path: string) {
  if (typeof document === 'undefined') return;
  document.title = title;
  const url = site.domain + (path === '/' ? '' : path);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', url);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
}
