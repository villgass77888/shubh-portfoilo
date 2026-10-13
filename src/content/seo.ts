/* ═══════════════════════════════════════════════════
   SEO — the site map and keyword plan
   Every route the site serves, with its one primary keyword, title, description, breadcrumb
   and indexing rule. The prerender, the <head>, JSON-LD, sitemaps, llms.txt and OG images
   are all generated from this list, so they cannot disagree.
   ═══════════════════════════════════════════════════ */

import { archiveContent } from './archive';
import { caseStudies } from './caseStudies';
import { about, services } from './services';
import { inPlace, site } from './site';
import { allPackProjects } from '../data/packaging';
import { streetwear } from '../data/streetwear';
import { normalizePath } from '../seo/paths';

export type Crumb = { name: string; path: string };

export type PageKind =
  | 'home'
  | 'about'
  | 'contact'
  | 'work'
  | 'case'
  | 'services'
  | 'service'
  | 'archive'
  | 'archive-brand'
  | 'flyers'
  | 'emailers'
  | 'brochures'
  | 'brochure'
  | 'packaging'
  | 'tee'
  | '404';

export type PageMeta = {
  path: string;
  kind: PageKind;
  slug?: string;
  /** Full <title> */
  title: string;
  description: string;
  keyword?: string;
  /** The page's one H1 */
  h1: string;
  /** false = noindex, follow (thin gallery pages) */
  index: boolean;
  ogType: 'website' | 'article';
  /** /og/<og>.png */
  og: string;
  crumbs: Crumb[];
  /** Files whose last commit dates the page in the sitemap */
  sources: string[];
};

const SUFFIX = ' | Shubh Panda';
const t = (lead: string) => lead + SUFFIX;
/** The longest ending that keeps the title within 60 characters */
const fit = (lead: string, endings: string[]) => t(lead + (endings.find((e) => (lead + e + SUFFIX).length <= 60) ?? ''));
/** Cut at a word, at most `max` characters */
export const clip = (text: string, max = 158) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '…';
};

/** Alt text pattern: "<what it is> for <brand>, <type of work> by Shubh Panda" */
export const altFor = (what: string, brand: string, work: string) => `${what} for ${brand}, ${work} by ${site.name}`;

/** Navigation order everywhere: the order of the chapters on the home page */
export const serviceNav = services.map((s) => ({ label: s.label, path: `/services/${s.slug}` }));

const HOME: Crumb = { name: 'Home', path: '/' };
const WORK: Crumb = { name: 'Work', path: '/work' };
const SERVICES: Crumb = { name: 'Services', path: '/services' };
const ARCHIVE: Crumb = { name: 'Archive', path: '/work/archive' };
const BROCHURES: Crumb = { name: 'Brochures', path: '/work/archive/brochures' };

const page = (p: Omit<PageMeta, 'og' | 'ogType' | 'index'> & Partial<Pick<PageMeta, 'og' | 'ogType' | 'index'>>): PageMeta => ({
  index: true,
  ogType: 'website',
  og: p.path === '/' ? 'home' : p.path.slice(1).replace(/\//g, '-'),
  ...p,
});

const city = site.city || 'India';

export const pages: PageMeta[] = [
  page({
    path: '/',
    kind: 'home',
    title: `Shubh Panda — Graphic Designer in ${city} | Brand & Web`,
    description: `Shubh Panda is a graphic designer ${inPlace()}: brand identity, websites, social media, packaging and streetwear for cafés and brands.`,
    keyword: `graphic designer in ${city}`,
    h1: 'Shubh Panda',
    crumbs: [HOME],
    sources: ['src/data/portfolio.ts', 'src/App.tsx'],
  }),
  page({
    path: '/about',
    kind: 'about',
    title: t(about.title),
    description: about.description,
    keyword: 'Shubh Panda graphic designer',
    h1: about.heading,
    crumbs: [HOME, { name: 'About', path: '/about' }],
    sources: ['src/content/services.ts', 'src/content/site.ts'],
  }),
  page({
    path: '/services',
    kind: 'services',
    title: t('Design Services: Brand, Web, Social, Packaging'),
    description: `Design services ${inPlace()} by Shubh Panda: brand identity, website design, social media creatives, packaging and streetwear graphics.`,
    keyword: 'graphic design services India',
    h1: 'Design Services',
    crumbs: [HOME, SERVICES],
    sources: ['src/content/services.ts'],
  }),
  ...services.map((s) =>
    page({
      path: `/services/${s.slug}`,
      kind: 'service',
      slug: s.slug,
      title: t(s.title),
      description: s.description,
      keyword: s.keyword,
      h1: s.heading,
      crumbs: [HOME, SERVICES, { name: s.label, path: `/services/${s.slug}` }],
      sources: ['src/content/services.ts'],
    }),
  ),
  page({
    path: '/work',
    kind: 'work',
    title: t('Graphic Design Portfolio India: Case Studies'),
    description: 'Graphic design portfolio from India by Shubh Panda: branding, web design, social media, packaging and streetwear case studies for 20 clients.',
    keyword: 'graphic design portfolio India',
    h1: 'Work',
    crumbs: [HOME, WORK],
    sources: ['src/content/caseStudies.ts'],
  }),
  ...caseStudies.map((c) =>
    page({
      path: `/work/${c.slug}`,
      kind: 'case',
      slug: c.slug,
      title: t(c.title),
      description: c.description,
      keyword: c.keyword,
      h1: c.name,
      ogType: 'article',
      crumbs: [HOME, WORK, { name: c.name, path: `/work/${c.slug}` }],
      sources: ['src/content/caseStudies.ts'],
    }),
  ),
  page({
    path: '/contact',
    kind: 'contact',
    title: t(`Hire a Graphic Designer in ${city}`),
    description: `Hire a graphic designer ${inPlace()}. Contact Shubh Panda by email or phone for a quote on branding, websites, social media or packaging.`,
    keyword: `hire graphic designer ${city}`,
    h1: 'Contact',
    crumbs: [HOME, { name: 'Contact', path: '/contact' }],
    sources: ['src/content/site.ts'],
  }),

  /* ── Archive (the creatives archive overlay, as real pages) ── */
  page({
    path: '/work/archive',
    kind: 'archive',
    title: t('Social Media Creatives Archive: Posts & Print'),
    description: 'The social media creatives archive of Shubh Panda: more posts, stories and carousels for six brands, plus flyers, emailers and brochure design.',
    keyword: 'social media creatives archive',
    h1: 'Creatives Archive',
    crumbs: [HOME, WORK, ARCHIVE],
    sources: ['src/content/archive.ts', 'src/data/archive.generated.json'],
  }),
  ...Object.entries(archiveContent.brands).map(([slug, b]) =>
    page({
      path: `/work/archive/${slug}`,
      kind: 'archive-brand',
      slug,
      title: fit(`${b.name} Social Media Creatives`, [': Posts & Stories', ': Posts', '']),
      description: clip(`${b.name} social media creatives by Shubh Panda. ${b.about}`),
      keyword: `${b.name} social media creatives`,
      h1: b.name,
      crumbs: [HOME, WORK, ARCHIVE, { name: b.name, path: `/work/archive/${slug}` }],
      sources: ['src/content/archive.ts', 'src/data/archive.generated.json'],
    }),
  ),
  page({
    path: '/work/archive/flyers',
    kind: 'flyers',
    title: t('Flyer & Billboard Design Portfolio: Print'),
    description: 'Flyer and billboard design portfolio by Shubh Panda: large-format print for events, real estate and product launches, built to land from across the street.',
    keyword: 'flyer design portfolio',
    h1: 'Flyers & Billboards',
    crumbs: [HOME, WORK, ARCHIVE, { name: 'Flyers', path: '/work/archive/flyers' }],
    sources: ['src/content/archive.ts', 'src/data/archive.generated.json'],
  }),
  page({
    path: '/work/archive/emailers',
    kind: 'emailers',
    title: t('Emailer & Newsletter Design Portfolio'),
    description: 'Emailer and newsletter design portfolio by Shubh Panda: long-form email layouts for hospitality and travel brands, made to be read on the way down.',
    keyword: 'emailer design portfolio',
    h1: 'Emailers',
    crumbs: [HOME, WORK, ARCHIVE, { name: 'Emailers', path: '/work/archive/emailers' }],
    sources: ['src/content/archive.ts', 'src/data/archive.generated.json'],
  }),
  page({
    path: '/work/archive/brochures',
    kind: 'brochures',
    title: t('Brochure Design Portfolio: Decks & Guidelines'),
    description: 'Brochure design portfolio by Shubh Panda: company brochures, pitch decks, a gatefold and brand guidelines for real estate, agencies and consumer brands.',
    keyword: 'brochure design portfolio',
    h1: 'Brochures',
    crumbs: [HOME, WORK, ARCHIVE, BROCHURES],
    sources: ['src/content/archive.ts', 'src/data/archive.generated.json'],
  }),

  /* ── Thin gallery pages: reachable and followed, not indexed ── */
  ...Object.entries(archiveContent.brochures.names).map(([slug, name]) =>
    page({
      path: `/work/archive/brochures/${slug}`,
      kind: 'brochure',
      slug,
      title: t(`${name}: Brochure Design`),
      description: clip(`${name} brochure, designed by Shubh Panda. Every page of the brochure, from the cover to the back.`),
      h1: name,
      index: false,
      og: 'work-archive-brochures',
      crumbs: [HOME, WORK, ARCHIVE, BROCHURES, { name, path: `/work/archive/brochures/${slug}` }],
      sources: ['src/data/archive.generated.json'],
    }),
  ),
  ...allPackProjects.map((p) =>
    page({
      path: `/work/packaging/${p.slug}`,
      kind: 'packaging',
      slug: p.slug,
      title: t(`${p.name}: Packaging Gallery`),
      description: clip(`${p.name} packaging by Shubh Panda: ${p.gallery.map((m) => m.label.toLowerCase()).join(', ')}. ${p.line}`),
      h1: p.name,
      index: false,
      og: `work-${p.slug}`,
      crumbs: [HOME, WORK, { name: p.name, path: `/work/${p.slug}` }, { name: 'Gallery', path: `/work/packaging/${p.slug}` }],
      sources: ['src/data/packaging.ts'],
    }),
  ),
  ...streetwear.map((d) =>
    page({
      path: `/work/streetwear/${d.id}`,
      kind: 'tee',
      slug: d.id,
      title: t(`${d.name} (${String(d.order).padStart(2, '0')}): Streetwear T-Shirt Graphic`),
      description: clip(`${d.name}, design ${d.order} of ${streetwear.length}, a streetwear t-shirt graphic by Shubh Panda: ${d.print.toLowerCase()} on a ${d.teeColor ?? 'white'} tee, shown on a model with the artwork behind the print.`),
      h1: d.name,
      index: false,
      og: 'work-streetwear',
      crumbs: [HOME, WORK, { name: 'Streetwear', path: '/work/streetwear' }, { name: d.name, path: `/work/streetwear/${d.id}` }],
      sources: ['src/data/streetwear.generated.json'],
    }),
  ),
];

export const notFound: PageMeta = page({
  path: '/404',
  kind: '404',
  title: t('Page Not Found'),
  description: 'This page does not exist. Go to the work, the services, the about page or the contact page of Shubh Panda.',
  h1: 'Page not found',
  index: false,
  og: 'home',
  crumbs: [HOME],
  sources: [],
});

export const pageFor = (path: string) => pages.find((p) => p.path === normalizePath(path));

