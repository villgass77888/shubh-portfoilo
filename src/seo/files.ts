/* The machine-readable files, generated from the same content as the pages:
   robots.txt, the sitemaps, llms.txt and llms-full.txt, the web manifest. */

import { caseStudies } from '../content/caseStudies';
import { pages } from '../content/seo';
import type { PageMeta } from '../content/seo';
import { about, services } from '../content/services';
import { abs, oneLiner, site } from '../content/site';
import { caseMedia } from '../pages/media';
import { archiveImages } from '../pages/ArchivePages';

const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended'];

export const robotsTxt = () =>
  [`# ${site.name} portfolio`, 'User-agent: *', 'Allow: /', '', '# AI and answer engines are welcome', ...AI_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /']), '', `Sitemap: ${site.domain}/sitemap.xml`, ''].join('\n');

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const indexable = () => pages.filter((p) => p.index);

export const sitemapIndex = (today: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['sitemap-pages.xml', 'sitemap-images.xml']
    .map((f) => `  <sitemap><loc>${site.domain}/${f}</loc><lastmod>${today}</lastmod></sitemap>`)
    .join('\n')}\n</sitemapindex>\n`;

/** `lastmod(page)` = date of the last commit that touched the page's content */
export const sitemapPages = (lastmod: (p: PageMeta) => string | undefined) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable()
    .map((p) => {
      const d = lastmod(p);
      return `  <url><loc>${xml(abs(p.path))}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`;
    })
    .join('\n')}\n</urlset>\n`;

/** Key images of a page: the case study's work, or the first creatives of an archive page */
export const keyImages = (p: PageMeta): string[] => {
  if (p.kind === 'case') {
    const c = caseStudies.find((x) => x.slug === p.slug);
    return c ? caseMedia(c).images.slice(0, 10).map((i) => i.src) : [];
  }
  return archiveImages(p);
};

export const sitemapImages = () =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${indexable()
    .map((p) => ({ p, images: keyImages(p) }))
    .filter((x) => x.images.length)
    .map(({ p, images }) => `  <url><loc>${xml(abs(p.path))}</loc>${images.map((src) => `<image:image><image:loc>${xml(abs(src))}</image:loc></image:image>`).join('')}</url>`)
    .join('\n')}\n</urlset>\n`;

/** The picture on a page's Open Graph card */
export const ogImageFor = (p: PageMeta): string | undefined => {
  if (p.kind === 'home' || p.kind === 'about' || p.kind === 'contact') return site.portrait;
  const thumbOf = (slug?: string) => {
    const c = caseStudies.find((x) => x.slug === slug);
    return c ? caseMedia(c).thumb.src : undefined;
  };
  if (p.kind === 'service') return thumbOf(services.find((s) => s.slug === p.slug)?.cases[0]);
  if (p.kind === 'services' || p.kind === 'work') return thumbOf(caseStudies[0].slug);
  if (p.kind === 'archive') return keyImages(pages.find((x) => x.kind === 'archive-brand')!)[0];
  return keyImages(p)[0];
};

/* ── llms.txt (llmstxt.org format) ── */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const header = () => [`# ${site.name}`, '', `> ${oneLiner()}`, '', `- Contact: ${site.email} · ${site.phone}`, `- Portfolio: ${site.domain}`, ''];

export const llmsTxt = () =>
  [
    ...header(),
    '## Services',
    ...services.map((s) => `- [${s.heading}](${abs(`/services/${s.slug}`)}): ${s.summary}`),
    `- [Contact](${abs('/contact')}): enquiries for branding, websites, social media, packaging and streetwear`,
    '',
    '## Case studies',
    ...caseStudies.map((c) => `- [${c.name}](${abs(`/work/${c.slug}`)}): ${c.summary}`),
    '',
    '## About',
    `- [About ${site.name}](${abs('/about')})`,
    `- [All work](${abs('/work')})`,
    `- [Creatives archive](${abs('/work/archive')}): more social media posts, flyers, emailers and brochures`,
    '',
    '## Optional',
    `- [Full text of all case studies](${abs('/llms-full.txt')})`,
    '',
  ].join('\n');

export const llmsFullTxt = () =>
  [
    ...header(),
    '---',
    '',
    `## ${about.heading}`,
    `URL: ${abs('/about')}`,
    '',
    about.answer,
    '',
    ...about.body.flatMap((b) => [`### ${b.h}`, '', ...b.p.flatMap((p) => [p, ''])]),
    ...services.flatMap((s) => [
      '---',
      '',
      `## ${s.heading}`,
      `URL: ${abs(`/services/${s.slug}`)}`,
      '',
      s.answer,
      '',
      ...s.body.flatMap((b) => [`### ${b.h}`, '', ...b.p.flatMap((p) => [p, ''])]),
      '### Process',
      '',
      ...s.process.map((step, i) => `${i + 1}. ${cap(step.label.toLowerCase())}: ${step.text}`),
      '',
      '### Questions',
      '',
      ...s.faq.flatMap((f) => [`**${f.q}**`, f.a, '']),
    ]),
    ...caseStudies.flatMap((c) => [
      '---',
      '',
      `## ${c.name}: ${c.keyword}`,
      `URL: ${abs(`/work/${c.slug}`)}`,
      '',
      c.answer,
      '',
      '### Brief',
      '',
      ...c.brief.flatMap((p) => [p, '']),
      '### Approach',
      '',
      ...c.approach.flatMap((p) => [p, '']),
      '### Delivered',
      '',
      ...c.delivered.map((d) => `- ${d}`),
      '',
      '### Tools',
      '',
      c.tools.join(', '),
      '',
    ]),
  ].join('\n');

export const webManifest = () =>
  JSON.stringify(
    {
      name: `${site.name} — ${site.jobTitle}`,
      short_name: site.name,
      description: oneLiner(),
      start_url: '/',
      display: 'standalone',
      background_color: site.themeColor,
      theme_color: site.themeColor,
      icons: [
        { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    null,
    2,
  ) + '\n';

/** Unapproved drafts and words-per-page, for the build log */
export const contentReport = () => {
  const words = (parts: string[]) => parts.join(' ').split(/\s+/).filter(Boolean).length;
  const rows = [
    { page: '/about', approved: about.approved, words: words([about.answer, ...about.body.flatMap((b) => [b.h, ...b.p])]) },
    ...services.map((s) => ({
      page: `/services/${s.slug}`,
      approved: s.approved,
      words: words([s.answer, ...s.body.flatMap((b) => [b.h, ...b.p]), ...s.process.map((p) => p.text), ...s.faq.flatMap((f) => [f.q, f.a])]),
    })),
    ...caseStudies.map((c) => ({ page: `/work/${c.slug}`, approved: c.approved, words: words([c.answer, ...c.brief, ...c.approach, ...c.delivered, ...c.tools]) })),
  ];
  const lengths = pages
    .filter((p) => p.index)
    .flatMap((p) => [
      ...(p.title.length < 50 || p.title.length > 60 ? [`title ${p.title.length} chars: ${p.path}  "${p.title}"`] : []),
      ...(p.description.length < 140 || p.description.length > 160 ? [`description ${p.description.length} chars: ${p.path}`] : []),
    ]);
  const dupes = (key: 'title' | 'description') => {
    const seen = new Map<string, string>();
    const out: string[] = [];
    pages.forEach((p) => {
      const other = seen.get(p[key]);
      if (other) out.push(`duplicate ${key}: ${other} and ${p.path}`);
      seen.set(p[key], p.path);
    });
    return out;
  };
  return { rows, lengths: [...lengths, ...dupes('title'), ...dupes('description')] };
};
