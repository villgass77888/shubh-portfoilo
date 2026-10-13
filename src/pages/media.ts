/* What each case study shows: its images, videos and logo, read from the chapter data. */

import dims from '../data/dims.generated.json';
import { brands, logos, smm, websites } from '../data/portfolio';
import type { BrandEntry, LogoEntry, WebsiteEntry } from '../data/portfolio';
import { allPackProjects } from '../data/packaging';
import type { PackProject } from '../data/packaging';
import { streetwear } from '../data/streetwear';
import type { StreetwearDesign } from '../data/streetwear';
import { altFor } from '../content/seo';
import type { CaseStudy } from '../content/caseStudies';

export type Img = { src: string; alt: string; w?: number; h?: number; srcset?: string; label?: string; flat?: boolean };

const sizes = dims as unknown as Record<string, [number, number]>;
export const sized = (src: string, alt: string, extra: Partial<Img> = {}): Img => {
  const d = sizes[src];
  return { src, alt, w: d?.[0], h: d?.[1], ...extra };
};

/** "PRIMARY LOGO" → "Primary logo" */
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const lower = (s: string) => s.toLowerCase();

export type CaseMedia = {
  brand?: BrandEntry;
  board: Img[];
  web?: WebsiteEntry;
  social: Img[];
  pack?: PackProject;
  packImages: Img[];
  logo?: LogoEntry;
  tees: { design: StreetwearDesign; image: Img }[];
  /** Card image for lists */
  thumb: Img;
  /** Key images, most important first (JSON-LD, image sitemap, OG) */
  images: Img[];
};

export function caseMedia(c: CaseStudy): CaseMedia {
  const brand = brands.find((b) => b.slug === c.brand);
  const web = websites.find((w) => w.slug === c.web);
  const feed = smm.find((s) => s.slug === c.smm);
  const pack = allPackProjects.find((p) => p.slug === c.pack);
  const logo = logos.find((l) => l.slug === c.logo);

  const board = (brand?.frames ?? []).map((f) =>
    sized(f.src, altFor(sentence(f.label ?? 'Brand board'), brand!.name, `${lower(brand!.industry)} brand identity`), { srcset: f.srcset, label: f.label }),
  );
  const social = (feed?.all ?? []).map((src, i) => sized(src, altFor(`Social media ${/story/.test(src) ? 'story' : 'post'} ${i + 1}`, feed!.brand, 'social media design')));
  const packImages = (pack?.gallery ?? [])
    .filter((m) => m.image.src)
    .map((m) => ({ src: m.image.src, srcset: m.image.srcset, w: m.image.w, h: m.image.h, alt: altFor(m.label, pack!.name, 'packaging design'), label: m.label, flat: m.flat }));
  const tees =
    c.slug === 'streetwear'
      ? streetwear.map((design) => ({ design, image: sized(design.model, altFor(`${design.name} t-shirt on a model`, 'streetwear', 't-shirt graphic design')) }))
      : [];
  const poster = web ? sized(web.poster, altFor('Website home page', web.name, 'website design')) : undefined;
  const mark = logo ? sized(logo.src, altFor(`${sentence(logo.tag)} logo`, logo.name, 'logo design')) : undefined;

  // feed order puts the phone post second
  const feedLead = feed ? sized(feed.posts[1] ?? feed.posts[0], altFor('Social media post', feed.brand, 'social media design')) : undefined;
  const images = [...board, ...(poster ? [poster] : []), ...packImages, ...social, ...tees.map((t) => t.image), ...(mark ? [mark] : [])];
  const thumb = board[0] ?? poster ?? packImages[0] ?? feedLead ?? tees[0]?.image ?? mark ?? { src: '', alt: '' };

  return { brand, board, web, social, pack, packImages, logo, tees, thumb, images };
}
