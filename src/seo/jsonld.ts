/* JSON-LD for every page: one @graph, generated from site.ts, seo.ts and the page's own data.
   Runs at build time only (the prerender writes it into the <head>). */

import { caseBySlug, caseStudies } from '../content/caseStudies';
import { archiveContent } from '../content/archive';
import { pages } from '../content/seo';
import type { PageMeta } from '../content/seo';
import { serviceBySlug, services } from '../content/services';
import { abs, oneLiner, site, socialList } from '../content/site';
import { websites } from '../data/portfolio';
import { caseMedia } from '../pages/media';

type Node = Record<string, unknown>;
/** `date(publicPath)` = ISO date the file entered the repository (used as a video's uploadDate) */
export type LdContext = { date: (file: string) => string | undefined };

const PERSON = `${site.domain}/#person`;
const WEBSITE = `${site.domain}/#website`;
const SERVICE = `${site.domain}/#service`;

const address = (): Node => ({
  '@type': 'PostalAddress',
  ...(site.city ? { addressLocality: site.city } : {}),
  ...(site.region ? { addressRegion: site.region } : {}),
  addressCountry: site.country,
});

/** The home city, the other cities served, and the country */
const areaServed = (): Node[] => [
  ...[{ city: site.city, region: site.region }, ...site.serves].filter((c) => c.city).map((c) => ({ '@type': 'City', name: c.city, containedInPlace: { '@type': 'AdministrativeArea', name: c.region } })),
  { '@type': 'Country', name: 'India' },
];

const person = (): Node => ({
  '@type': 'Person',
  '@id': PERSON,
  name: site.name,
  alternateName: site.alternateName,
  jobTitle: site.jobTitle,
  description: oneLiner(),
  url: site.domain,
  image: abs(site.portrait),
  email: `mailto:${site.email}`,
  telephone: site.phone.replace(/\s/g, ''),
  address: address(),
  sameAs: socialList(),
  knowsAbout: site.knowsAbout,
});

const website = (): Node => ({
  '@type': 'WebSite',
  '@id': WEBSITE,
  url: site.domain,
  name: site.name,
  description: oneLiner(),
  inLanguage: 'en-IN',
  publisher: { '@id': PERSON },
});

const professionalService = (): Node => ({
  '@type': 'ProfessionalService',
  '@id': SERVICE,
  name: site.business,
  url: site.domain,
  image: abs(site.portrait),
  founder: { '@id': PERSON },
  email: `mailto:${site.email}`,
  telephone: site.phone.replace(/\s/g, ''),
  address: address(),
  areaServed: areaServed(),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Design services',
    itemListElement: services.map((s) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.serviceType, url: abs(`/services/${s.slug}`) },
    })),
  },
});

const breadcrumbs = (m: PageMeta): Node => ({
  '@type': 'BreadcrumbList',
  '@id': `${abs(m.path)}#breadcrumb`,
  itemListElement: m.crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

const webPage = (m: PageMeta, type = 'WebPage', extra: Node = {}): Node => ({
  '@type': type,
  '@id': `${abs(m.path)}#webpage`,
  url: abs(m.path),
  name: m.title,
  description: m.description,
  inLanguage: 'en-IN',
  isPartOf: { '@id': WEBSITE },
  about: { '@id': PERSON },
  ...(m.crumbs.length > 1 ? { breadcrumb: { '@id': `${abs(m.path)}#breadcrumb` } } : {}),
  ...extra,
});

const itemList = (paths: string[]): Node => ({
  '@type': 'ItemList',
  itemListElement: paths.map((path, i) => {
    const p = pages.find((x) => x.path === path);
    return { '@type': 'ListItem', position: i + 1, name: p?.h1 ?? path, url: abs(path) };
  }),
});

const video = (name: string, description: string, src: string, poster: string, ctx: LdContext): Node | null => {
  const uploadDate = ctx.date(src);
  // uploadDate is required for a valid VideoObject: no known date, no entry
  if (!uploadDate) return null;
  return { '@type': 'VideoObject', name, description, thumbnailUrl: abs(poster), uploadDate, contentUrl: abs(src), creator: { '@id': PERSON } };
};

export function graphFor(m: PageMeta, ctx: LdContext): Node[] {
  const graph: Node[] = [person(), website()];
  const crumbs = m.crumbs.length > 1 ? [breadcrumbs(m)] : [];
  const children = (prefix: string, kinds: PageMeta['kind'][]) => pages.filter((p) => p.path.startsWith(prefix) && kinds.includes(p.kind)).map((p) => p.path);

  switch (m.kind) {
    case 'home': {
      const hero = video(`${site.name}, 360° portrait`, `A 360° cut-out video of ${site.name}, shown in the hero of his portfolio.`, '/assets/hero/shubh-360.webm', site.heroPoster, ctx);
      graph.push(professionalService(), webPage(m), ...(hero ? [hero] : []));
      break;
    }
    case 'about':
      graph.push(webPage(m, 'ProfilePage', { mainEntity: { '@id': PERSON } }), ...crumbs);
      break;
    case 'contact':
      graph.push(professionalService(), webPage(m, 'ContactPage'), ...crumbs);
      break;
    case 'services':
      graph.push(professionalService(), webPage(m, 'CollectionPage', { mainEntity: itemList(services.map((s) => `/services/${s.slug}`)) }), ...crumbs);
      break;
    case 'service': {
      const s = serviceBySlug(m.slug!)!;
      graph.push(
        professionalService(),
        webPage(m),
        {
          '@type': 'Service',
          '@id': `${abs(m.path)}#service`,
          name: s.heading,
          serviceType: s.serviceType,
          description: s.answer,
          url: abs(m.path),
          provider: { '@id': PERSON },
          areaServed: areaServed(),
        },
        {
          '@type': 'FAQPage',
          '@id': `${abs(m.path)}#faq`,
          mainEntity: s.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        },
        ...crumbs,
      );
      break;
    }
    case 'work':
      graph.push(webPage(m, 'CollectionPage', { mainEntity: itemList(caseStudies.map((c) => `/work/${c.slug}`)) }), ...crumbs);
      break;
    case 'case': {
      const c = caseBySlug(m.slug!)!;
      const media = caseMedia(c);
      const site_ = websites.find((w) => w.slug === c.web);
      const clip = site_ ? video(`${c.name} website walkthrough`, `A screen recording of the ${c.name} website designed by ${site.name}.`, site_.video, site_.poster, ctx) : null;
      graph.push(
        webPage(m),
        {
          '@type': 'CreativeWork',
          '@id': `${abs(m.path)}#work`,
          name: `${c.name}: ${c.keyword}`,
          headline: c.title,
          description: c.answer,
          url: abs(m.path),
          creator: { '@id': PERSON },
          author: { '@id': PERSON },
          image: media.images.slice(0, 10).map((i) => abs(i.src)),
          about: c.slug === 'streetwear' ? { '@type': 'Thing', name: 'Streetwear t-shirt graphics' } : { '@type': 'Organization', name: c.name, description: c.client },
          genre: c.types,
          keywords: c.keyword,
          inLanguage: 'en-IN',
          mainEntityOfPage: { '@id': `${abs(m.path)}#webpage` },
        },
        ...(clip ? [clip] : []),
        ...crumbs,
      );
      break;
    }
    case 'archive':
      graph.push(webPage(m, 'CollectionPage', { mainEntity: itemList(children('/work/archive/', ['archive-brand', 'flyers', 'emailers', 'brochures'])) }), ...crumbs);
      break;
    case 'brochures':
      graph.push(webPage(m, 'CollectionPage', { mainEntity: itemList(Object.keys(archiveContent.brochures.names).map((s) => `/work/archive/brochures/${s}`)) }), ...crumbs);
      break;
    case 'archive-brand':
    case 'flyers':
    case 'emailers':
      graph.push(webPage(m, 'CollectionPage'), ...crumbs);
      break;
    default:
      graph.push(webPage(m), ...crumbs);
  }
  return graph;
}
