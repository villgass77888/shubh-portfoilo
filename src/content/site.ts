/* ═══════════════════════════════════════════════════
   SITE IDENTITY — the single source of truth
   Every name, contact detail and profile link the site shows or describes
   (pages, JSON-LD, llms.txt, sitemaps, OG images) is read from here.
   Lines marked TODO(Shubh) need a real value; the build prints them.
   ═══════════════════════════════════════════════════ */

export const site = {
  /** The live domain: https, bare (www redirects to it in vercel.json), no trailing slash. */
  domain: 'https://shubhpanda.com',
  /** Home base: the address in the structured data. */
  city: 'South Delhi',
  region: 'Delhi',
  /** Other cities the work is aimed at (described as "also working with clients in", never as a base). */
  serves: [
    { city: 'Vapi', region: 'Gujarat' },
    { city: 'Ahmedabad', region: 'Gujarat' },
  ],
  country: 'IN',

  name: 'Shubh Panda',
  alternateName: 'Shubha Panda',
  jobTitle: 'Graphic Designer, Web Developer & Brand Manager',
  business: 'Shubh Panda Design',
  since: 2020,

  email: 'shubhpanda8@gmail.com',
  phone: '+91 92651 30339',

  /** Full profile URLs. Leave a profile empty if it does not exist: it is then left out everywhere. */
  socials: {
    instagram: 'https://instagram.com/1xshubh',
    linkedin: 'https://linkedin.com/in/shubhpanda',
    behance: '', // TODO(Shubh)
    dribbble: '', // TODO(Shubh)
    pinterest: '', // TODO(Shubh)
  },

  /** Square photo, cut from the hero video by scripts/prerender.mjs */
  portrait: '/assets/hero/shubh-panda-portrait.jpg',
  /** First frame of the hero video (transparent), used as its poster */
  heroPoster: '/assets/hero/shubh-360-poster.webp',

  experience: ['Kangaroo Agency', 'Quinite Technologies', 'Freelance'],
  tools: ['Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Adobe Premiere Pro', 'CapCut', 'Figma'],
  knowsAbout: [
    'Graphic design',
    'Brand identity design',
    'Logo design',
    'Website design',
    'React web development',
    'Social media design',
    'Packaging design',
    'Streetwear graphics',
    'Brand management',
  ],

  themeColor: '#080808',
  paper: '#F3F0E8',
  /** IndexNow key: the same value is served as /<key>.txt */
  indexNowKey: '7c1e4f0a9b3d4e6f8a2c5d7e9f1b3a5c',
};

/** "Surat, India" when a city is set, otherwise "India" */
export const place = () => (site.city ? `${site.city}, ${site.region ? `${site.region}, ` : ''}India` : 'India');
/** "South Delhi, Vapi and Ahmedabad" */
export const areas = () => {
  const names = [site.city, ...site.serves.map((s) => s.city)].filter(Boolean);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] || 'India';
};
/** "in South Delhi, Vapi and Ahmedabad" */
export const inPlace = () => `in ${areas()}`;

/** The one description used everywhere an identity line is needed */
export const oneLiner = () =>
  `${site.name} is a graphic designer, web developer and brand manager based in ${place()}, freelancing since ${site.since}, and works with clients in ${site.serves.map((s) => s.city).join(' and ')} too. He designs brand identities, websites, social media creatives, packaging and streetwear graphics for cafés, restaurants and growing brands across India.`;

export const socialList = () => Object.values(site.socials).filter(Boolean);
export const abs = (path: string) => (/^https?:/.test(path) ? path : site.domain + (path === '/' ? '' : path) || site.domain);

/** What still needs a real value */
export const siteTodos = (): string[] => {
  const out: string[] = [];
  if (!site.city) out.push('site.city / site.region: the city and state to rank in (titles say "India" until set)');
  (['behance', 'dribbble', 'pinterest'] as const).forEach((k) => {
    if (!site.socials[k]) out.push(`site.socials.${k}: profile URL (left out of sameAs until set)`);
  });
  return out;
};
