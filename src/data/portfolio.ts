/* ═══════════════════════════════════════════════════
   PORTFOLIO DATA — Single source of truth
   ═══════════════════════════════════════════════════ */

import senquiraLayout from './branding/senquira.layout.json';
import dbkdLayout from './branding/dbkd.layout.json';
import swaroopLayout from './branding/swaroop-realty.layout.json';
import chemistBoxLayout from './branding/chemist-box.layout.json';
import smmManifest from './smm.manifest.json';
import { smmHero } from './smmHero';

// ── Types ──

export type LogoEntry = {
  name: string;
  tag: 'LOGOTYPE' | 'EMBLEM' | 'MONOGRAM' | 'BADGE' | 'WORDMARK' | 'COMBINATION MARK';
  src: string;
  whiteSrc?: string;
  /** Real dominant colour of the mark, sampled from the artwork. */
  color: string;
  /** Extra colours present in the artwork (shown as chips next to `color`). */
  palette?: string[];
  /** Cell backdrop on hover/focus, chosen so the true-colour logo reads on it. */
  hoverBg: string;
  /** Aspect ratio (w / h) of the visible artwork, after trimming transparent padding. */
  ratio: number;
  /** Visible artwork bounds inside the file as fractions [x, y, w, h]. Omit when the file is already tight. */
  crop?: [number, number, number, number];
  /** File has no transparency, so it cannot be used as a silhouette mask. */
  solid?: boolean;
  /**
   * Single-colour artwork used for the idle ink silhouette instead of `src`
   * (the full-colour `src` is still what hover reveals). Has its own bounds.
   */
  idleSrc?: string;
  idleRatio?: number;
  idleCrop?: [number, number, number, number];
  typeface?: string;
  story: string;
  slug: string;
};

export type MoodboardFrame = {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  col: number;
  colSpan: number;
  order: number;
  from: 'left' | 'right';
  category?: 'logo' | 'variation' | 'color' | 'type' | 'pattern' | 'mockup' | 'photo' | 'other';
  label?: string;
};

export type BrandEntry = {
  name: string;
  slug: string;
  brief: string;
  hookLine: string;
  theBrief: string;
  theIdea: string;
  theIdentity: string;
  industry: string;
  year: number;
  primary: string;
  secondary?: string;
  fontName?: string;
  /** Page background while this brand's board is on screen */
  stage: string;
  /** Small-text accent that reads on `stage` */
  accent: string;
  /** Board width / height, measured from the designer's reference layout */
  aspect: number;
  /** Card corner radius as a fraction of the board width */
  radius: number;
  /** The designer's arranged reference image (source of truth for the layout) */
  reference: string;
  frames: MoodboardFrame[];
};

export type WebsiteEntry = {
  name: string;
  slug: string;
  client: string;
  tech: string[];
  url?: string;
  /** Full-resolution recording (lightbox) */
  video: string;
  /** Light 1280px derivative used inside the tilted cards */
  cardVideo: string;
  poster: string;
  mobileVideo?: string;
  hookLine: string;
  body: string;
  highlights: string[];
  result?: string;
};

export type SmmEntry = {
  brand: string;
  slug: string;
  campaign: string;
  handle: string;
  avatar: string | null;
  caption: string;
  date: string;
  primary: string;
  /** The 4 posts shown in the fan (picked in smmHero.ts) */
  posts: string[];
  /** Every post + story, for SEE ALL and the lightbox */
  all: string[];
  reels: string[];
  stories: string[];
  stats?: string;
};

// ── Site Info ──

export const siteInfo = {
  name: 'SHUBH PANDA',
  title: 'Graphic Designer ✦ Web Developer ✦ Brand Manager',
  tagline: 'Design that speaks before you do.',
  intro: 'I’m a multidisciplinary Graphic Designer with 4+ years of experience building bold visual identities, campaigns and digital experiences designed to stand out. My work spans branding, brand strategy, social media, advertising, packaging, e-commerce, web UI/UX and motion graphics, while I’m equally obsessed with exploring what’s next. I work extensively with AI-driven creative tools, from image and video generation to prompt engineering, ControlNet and LoRA training, blending strong design thinking with emerging technology to create work that feels fresh, experimental and ahead of the curve. For me, design isn’t just about making things look good; it’s about creating a visual world people remember.',
  coordinates: '20.27° N, 73.01° E',
  year: 2026,
  email: 'shubhpanda8@gmail.com',
  phone: '+91 92651 30339',
  socials: {
    instagram: 'https://instagram.com/1xshubh',
    linkedin: 'https://linkedin.com/in/shubhpanda',
  },
};

// ── Contact channels (outro) ──
// `display` is what the big line shows when the channel is picked; `href` is where a click on it goes.

export type ContactChannel = {
  key: 'email' | 'phone' | 'instagram' | 'linkedin';
  label: string;
  display: string;
  href: string;
  /** Short verb for the cursor label and the hint line */
  action: 'MAIL' | 'CALL' | 'OPEN';
  hint: string;
};

export const contacts: ContactChannel[] = [
  { key: 'email', label: 'EMAIL', display: 'shubhpanda8@gmail.com', href: 'mailto:shubhpanda8@gmail.com', action: 'MAIL', hint: 'CLICK TO SEND A MAIL' },
  { key: 'phone', label: 'PHONE', display: '+91 92651 30339', href: 'tel:+919265130339', action: 'CALL', hint: 'CLICK TO CALL' },
  { key: 'instagram', label: 'INSTAGRAM', display: '@1xshubh', href: 'https://instagram.com/1xshubh', action: 'OPEN', hint: 'CLICK TO OPEN INSTAGRAM' },
  { key: 'linkedin', label: 'LINKEDIN', display: 'in/shubhpanda', href: 'https://linkedin.com/in/shubhpanda', action: 'OPEN', hint: 'CLICK TO OPEN LINKEDIN' },
];

// ── Chapter Meta ──

export const TOTAL_CHAPTERS = 8;

/** Section ids in page order (`#section-<id>`), one per chapter. */
export const sectionIds = ['hero', 'logos', 'branding', 'web', 'smm', 'packaging', 'streetwear', 'outro'] as const;

export const chapters = [
  { num: 1, total: TOTAL_CHAPTERS, title: 'HERO', label: 'INTRO' },
  { num: 2, total: TOTAL_CHAPTERS, title: 'LOGOS & MARKS', label: 'LOGOS' },
  { num: 3, total: TOTAL_CHAPTERS, title: 'BRANDING / VISUAL IDENTITY', label: 'BRANDING' },
  { num: 4, total: TOTAL_CHAPTERS, title: 'WEB DESIGN & DEVELOPMENT', label: 'WEB' },
  { num: 5, total: TOTAL_CHAPTERS, title: 'SOCIAL MEDIA CREATIVES', label: 'SOCIAL' },
  { num: 6, total: TOTAL_CHAPTERS, title: 'PACKAGING DESIGN', label: 'PACKAGING' },
  { num: 7, total: TOTAL_CHAPTERS, title: 'STREETWEAR', label: 'STREETWEAR' },
  { num: 8, total: TOTAL_CHAPTERS, title: 'OUTRO', label: 'FIN' },
];

// ── Logos (11 + 1 CTA) ──

export const logos: LogoEntry[] = [
  {
    name: 'Senquira', tag: 'WORDMARK', slug: 'senquira',
    src: '/assets/logos/senquira.webp',
    color: '#F8F8F8', hoverBg: '#17120F', ratio: 4.571,
    typeface: 'Custom Serif',
    story: 'A luxury perfume house where every letter drips with seduction and mystery.',
  },
  {
    name: 'Do Bhaion Ki Dukan', tag: 'COMBINATION MARK', slug: 'dbkd',
    src: '/assets/logos/dbkd.webp',
    whiteSrc: '/assets/logos/dbkd-white.webp',
    color: '#D8C878', palette: ['#A88848'], hoverBg: '#15120C', ratio: 2.185,
    typeface: 'Nohemi',
    story: 'Premium ethnic wear distilled into one golden emblem — heritage meets high fashion.',
  },
  {
    name: 'Chemist Box', tag: 'COMBINATION MARK', slug: 'chemist-box',
    src: '/assets/logos/chemist-box.webp',
    whiteSrc: '/assets/logos/chemist-box-white.png',
    color: '#08A848', palette: ['#0868F8', '#081828'], hoverBg: '#EEF7F1', ratio: 3.331,
    crop: [0.1456, 0.3637, 0.7515, 0.2774],
    idleSrc: '/assets/logos/chemist-box-white.png', idleRatio: 3.334,
    typeface: 'Poppins',
    story: 'India\'s growing pharmacy chain: trust, care and a green cross that means business.',
  },
  {
    name: 'Swaroop Realty', tag: 'COMBINATION MARK', slug: 'swaroop-realty',
    src: '/assets/logos/swaroop-realty.webp',
    whiteSrc: '/assets/logos/swaroop-realty-white.webp',
    color: '#183888', palette: ['#88C8E8'], hoverBg: '#EAF1FB', ratio: 3.178,
    crop: [0.0758, 0.2181, 0.8938, 0.5],
    idleSrc: '/assets/logos/swaroop-realty-white.webp', idleRatio: 3.169,
    idleCrop: [0.0723, 0.2118, 0.8975, 0.5035],
    typeface: 'Cormorant',
    story: 'Heritage real estate in Vrindavan — the mark carries centuries of craft in its curves.',
  },
  {
    name: 'Croppd', tag: 'LOGOTYPE', slug: 'croppd',
    src: '/assets/logos/croppd.webp',
    whiteSrc: '/assets/logos/croppd-white.webp',
    color: '#282828', hoverBg: '#F4E4BC', ratio: 5.19,
    typeface: 'Custom Sans',
    story: 'Raw honey, zero preservatives — a name you can taste.',
  },
  {
    name: 'That Coffee', tag: 'COMBINATION MARK', slug: 'that-coffee',
    src: '/assets/logos/that-coffee.webp',
    whiteSrc: '/assets/logos/that-coffee-white.webp',
    color: '#085808', palette: ['#080808'], hoverBg: '#EEF4EA', ratio: 3.511,
    crop: [0, 0.1168, 1, 0.6642],
    typeface: 'Outfit',
    story: 'For the coffee-obsessed: artsy, bold, a little rebellious.',
  },
  {
    name: 'Reish', tag: 'WORDMARK', slug: 'reish',
    src: '/assets/logos/reish.webp',
    whiteSrc: '/assets/logos/reish-white.webp',
    color: '#181818', hoverBg: '#EFE0CB', ratio: 2.296,
    typeface: 'Playfair Display',
    story: 'Luxury Arabian perfumery — amber, oud and leather, sealed in letterforms.',
  },
  {
    name: 'Aura Rosetry', tag: 'EMBLEM', slug: 'aura-rosetry',
    src: '/assets/logos/aura-rosetry.webp',
    color: '#F8F8F8', hoverBg: '#2A1A12', ratio: 1.341,
    crop: [0.166, 0.1364, 0.6719, 0.7522],
    typeface: 'Cormorant',
    story: 'A premium Mumbai café where the logo is as elegant as the latte art.',
  },
  {
    name: 'Organic Miles', tag: 'WORDMARK', slug: 'organic-miles',
    src: '/assets/logos/organic-miles.webp',
    color: '#F8F8F8', hoverBg: '#1F3A26', ratio: 2.341,
    typeface: 'Nunito',
    story: 'Organic fruit pulps that travel miles to reach your kitchen — no shortcuts.',
  },
  {
    name: 'DJ Abhishek', tag: 'WORDMARK', slug: 'dj-abhishek',
    src: '/assets/logos/dj-abhishek.webp',
    color: '#080808', palette: ['#F8F8F8'], hoverBg: '#FFFFFF', ratio: 7.393, solid: true,
    typeface: 'Bebas Neue',
    story: 'A Mumbai DJ\'s monogram that hits as hard as his drops.',
  },
  {
    name: 'Kangaroo Agency', tag: 'COMBINATION MARK', slug: 'kangaroo-agency',
    src: '/assets/logos/kangaroo-agency.webp',
    color: '#080808', hoverBg: '#FFFFFF', ratio: 3.935,
    typeface: 'Archivo',
    story: 'Social media management from India to Australia — the kangaroo jumps borders.',
  },
];

// ── Brands (Moodboards) ──

export const brands: BrandEntry[] = [
  {
    name: 'Senquira', slug: 'senquira',
    hookLine: 'Seduction, bottled.',
    theBrief: 'A luxury perfume brand that wanted its identity to own the room before the wearer even walks in.',
    theIdea: 'Treat each visual like a fragrance note — dark, layered, impossible to ignore.',
    theIdentity: 'Moody typography, gold foil accents and packaging that whispers luxury from arm\'s length.',
    brief: 'Luxury perfume branding', industry: 'Fragrance', year: 2024, primary: '#8B6F4E', stage: '#A64B2E', accent: '#FFE2C4',
    ...boardFrom(senquiraLayout),
  },
  {
    name: 'Do Bhaion Ki Dukan', slug: 'dbkd',
    hookLine: 'Where heritage drapes modern.',
    theBrief: 'A premium Indian ethnic wear brand needed an identity rich enough to match its fabrics.',
    theIdea: 'Blend royal Indian motifs with clean modern type — traditional craftsmanship, contemporary confidence.',
    theIdentity: 'Golden palette, ornamental patterns and typography that reads like an invitation to a royal feast.',
    brief: 'Ethnic fashion branding', industry: 'Fashion', year: 2024, primary: '#C7A34F', stage: '#560D1B', accent: '#E9C47C',
    ...boardFrom(dbkdLayout),
  },
  {
    name: 'Swaroop Realty', slug: 'swaroop-realty',
    hookLine: 'Heritage you can own.',
    theBrief: 'A Vrindavan real estate company selling plots, land, villas and large projects needed an identity as rooted as the city it builds in.',
    theIdea: 'Treat property like heritage, not inventory. Sculpted forms, a navy-led palette and calm, confident type.',
    theIdentity: 'One system carried from the primary mark to signage, business cards, a brand book and property hoardings.',
    brief: 'Real estate identity', industry: 'Real Estate', year: 2024, primary: '#1A2744', stage: '#0B0F2E', accent: '#FF2B1C',
    ...boardFrom(swaroopLayout),
  },
  {
    name: 'Chemist Box', slug: 'chemist-box',
    hookLine: 'Health, without the markup.',
    theBrief: 'An Indian pharmacy chain expanding across India needed a brand that said affordable quality at first glance.',
    theIdea: 'A clean, trustworthy system — green for health, sharp for retail, warm for the neighbourhood chemist vibe.',
    theIdentity: 'From store signage to digital, one green-and-white system that scales from a Bihar shopfront to a national chain.',
    brief: 'Pharmacy chain branding', industry: 'Healthcare Retail', year: 2025, primary: '#2AAE4A', stage: '#0E5A34', accent: '#C8FF2E',
    ...boardFrom(chemistBoxLayout),
  },
];

// ── Websites ──

export const websites: WebsiteEntry[] = [
  {
    name: 'Kangaroo Agency', slug: 'kangaroo-agency', client: 'Agency',
    tech: ['WordPress', 'Custom Plugins'],
    video: '/assets/web/kangaroo-agency.mp4', cardVideo: '/assets/web/kangaroo-agency-card.mp4', poster: '/assets/web/kangaroo-agency-poster.webp',
    hookLine: 'The agency that practises what it preaches.',
    body: 'Kangaroo Agency manages social media for brands across India, the US and Australia. Their own site had to prove they know what they\'re doing.',
    highlights: ['Custom plugin architecture', 'Case study showcases', 'Multi-region portfolio'],
  },
  {
    name: 'Origanimo', slug: 'origanimo', client: 'Supplements',
    tech: ['WebGL', 'GSAP', 'JavaScript'],
    video: '/assets/web/origanimo.mp4', cardVideo: '/assets/web/origanimo-card.mp4', poster: '/assets/web/origanimo-poster.webp',
    hookLine: 'Clean supplements, cleaner website.',
    body: 'Organic, marine-derived supplements with no synthetic chemicals. The site brings that purity to the screen with clinical precision and ocean-inspired tones.',
    highlights: ['Interactive WebGL visuals', 'GSAP scroll choreography', 'Clean ingredient breakdowns'],
  },
  {
    name: 'Chemist Box', slug: 'chemist-box', client: 'Pharmacy',
    tech: ['Next.js', 'Vite'],
    video: '/assets/web/chemist-box.mp4', cardVideo: '/assets/web/chemist-box-card.mp4', poster: '/assets/web/chemist-box-poster.webp',
    hookLine: 'Your neighbourhood chemist, nationwide.',
    body: 'India\'s growing pharmacy chain needed a site that feels as reliable as the medicines it stocks — clear categories, fast search, and trust at every click.',
    highlights: ['Lightning-fast search & filter', 'Store locator map', 'Optimized Next.js architecture'],
  },
  {
    name: 'Swaroop Realty', slug: 'swaroop-realty', client: 'Real Estate',
    tech: ['React.js', 'GSAP', 'ScrollTrigger', 'Lenis'],
    video: '/assets/web/swaroop-realty.mp4', cardVideo: '/assets/web/swaroop-realty-card.mp4', poster: '/assets/web/swaroop-realty-poster.webp',
    hookLine: 'Vrindavan, one plot at a time.',
    body: 'Heritage-led real estate in Vrindavan. The site mirrors the brand\'s promise: rooted tradition, modern living, and the feeling of owning a piece of history.',
    highlights: ['Lenis smooth inertia scrolling', 'ScrollTrigger property journeys', 'Interactive site maps'],
  },
  {
    name: 'That Coffee', slug: 'that-coffee', client: 'Café',
    tech: ['WordPress'],
    video: '/assets/web/that-coffee.mp4', cardVideo: '/assets/web/that-coffee-card.mp4', poster: '/assets/web/that-coffee-poster.webp',
    hookLine: 'Brew it, sell it, ship it.',
    body: 'That Coffee\'s site is as artsy as its beans are bold — a custom store built for coffee obsessives who care about origin as much as flavour.',
    highlights: ['Custom WordPress storefront', 'Origin story storytelling', 'Bold typographic hero'],
  },
  {
    name: 'Aura Rosetry', slug: 'aura-rosetry', client: 'Café',
    tech: ['React.js', 'GSAP', 'ScrollTrigger', 'Framer Motion', 'Lenis'],
    video: '/assets/web/aura-rosetry.mp4', cardVideo: '/assets/web/aura-rosetry-card.mp4', poster: '/assets/web/aura-rosetry-poster.webp',
    hookLine: 'Mumbai\'s most elegant cuppa.',
    body: 'A premium café in Mumbai where every pixel is as considered as the latte art. Warm tones, smooth interactions and a menu that makes you hungry.',
    highlights: ['Framer Motion layout transitions', 'ScrollTrigger & Lenis glide', 'Animated menu interactions'],
  },
  {
    name: 'Ghoomar Thali', slug: 'ghoomar-thali', client: 'Restaurant',
    tech: ['React.js', 'GSAP', 'ScrollTrigger', 'Framer Motion', 'Lenis'],
    video: '/assets/web/ghoomar-thali.mp4', cardVideo: '/assets/web/ghoomar-thali-card.mp4', poster: '/assets/web/ghoomar-thali-poster.webp',
    hookLine: 'Rajasthan, minus the train ticket.',
    body: 'A premium Rajasthani restaurant chain where dinner comes with the full culture: magic, kathputli puppetry and dhol-nagada. The site had to feel like stepping into that courtyard.',
    highlights: ['Immersive cultural hero section', 'Framer Motion & Lenis choreography', 'Animated menu carousel'],
  },
];

// ── SMM ──

const smmCopy: Omit<SmmEntry, 'avatar' | 'posts' | 'all' | 'stories' | 'stats'>[] = [
  {
    brand: 'Alright TV', slug: 'alright-tv', campaign: 'ENTERTAINMENT 2026',
    handle: '@alrighttv', // TODO: confirm
    caption: 'Streaming something wild this weekend. Stay tuned. 🎬\n#AlrightTV #NewShow #StreamNow',
    date: 'March 2026', primary: '#E53935',
    reels: [],
  },
  {
    brand: 'Elan Wallcovers', slug: 'elan-wallcovers', campaign: 'WALLS THAT SPEAK 2026',
    handle: '@elanwallcovers', // TODO: confirm
    caption: 'Your walls deserve better than paint. ✨\n#ElanWallcovers #InteriorDesign #WallArt',
    date: 'February 2026', primary: '#5C6BC0',
    reels: [],
  },
  {
    brand: 'Vareeka', slug: 'vareeka', campaign: 'JEWELS OF GRACE 2026',
    handle: '@vareeka', // TODO: confirm
    caption: 'Gold, pearls and the confidence to wear them. 💎\n#Vareeka #Jewellery #FineJewels',
    date: 'January 2026', primary: '#FFB300',
    reels: [],
  },
  {
    brand: 'Udman Square', slug: 'udman-square', campaign: 'LUXURY EVENTS 2026',
    handle: '@udmansquare', // TODO: confirm
    caption: 'Where events become memories. 🏨\n#UdmanSquare #LuxuryVenue #Events',
    date: 'April 2026', primary: '#1565C0',
    reels: [],
  },
  {
    brand: 'Senquira', slug: 'senquira', campaign: 'SCENT STORIES 2026',
    handle: '@senquira', // TODO: confirm
    caption: 'Own the room before you walk in. 🖤\n#Senquira #LuxuryPerfume #ScentStories',
    date: 'March 2026', primary: '#8B6F4E',
    reels: [],
  },
  {
    brand: 'Stories for You', slug: 'stories-for-you', campaign: 'MEMORIES FOREVER 2026',
    handle: '@storiesforyou', // TODO: confirm
    caption: 'Every page holds a memory worth keeping. 📖\n#StoriesForYou #PhotoAlbum #Memories',
    date: 'May 2026', primary: '#8D6E63',
    reels: [],
  },
  {
    brand: 'Blink Brand Solutions', slug: 'blink-brand-solutions', campaign: 'TRAVEL SMART 2026',
    handle: '@blinkbrandsolutions', // TODO: confirm
    caption: 'Your trip, your way. We just make it happen. ✈️\n#BlinkTravel #TravelSmart #Customised',
    date: 'June 2026', primary: '#00ACC1',
    reels: [],
  },
];

type SmmAssets = { avatar: string | null; posts: string[]; stories: string[] };

export const smm: SmmEntry[] = smmCopy.map((entry) => {
  const assets = (smmManifest as Record<string, SmmAssets>)[entry.slug];
  const hero = smmHero[entry.slug] ?? [];
  return {
    ...entry,
    avatar: assets.avatar,
    posts: hero.length === 4 ? hero : [...assets.posts, ...assets.stories].slice(0, 4),
    all: [...assets.posts, ...assets.stories],
    stories: assets.stories,
    // Counted from the delivered files, never invented
    stats: [`${assets.posts.length} POSTS`, assets.stories.length ? `${assets.stories.length} STORIES` : '']
      .filter(Boolean)
      .join(' ✦ '),
  };
});

// ── Packaging ── lives in src/data/packaging.ts


// ── Helper: board data from a layout.json (scripts/extract-moodboard-layouts.mjs) ──

type BoardLayout = { aspect: number; radius: number; reference: string; frames: unknown[] };

function boardFrom(layout: BoardLayout) {
  return {
    aspect: layout.aspect,
    radius: layout.radius,
    reference: layout.reference,
    frames: layout.frames as MoodboardFrame[],
  };
}
