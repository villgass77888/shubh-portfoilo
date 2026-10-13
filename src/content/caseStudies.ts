/* ═══════════════════════════════════════════════════
   CASE STUDIES — wording for /work/<slug>
   One page per client. Drafted only from what the work on this site shows; nothing here is a
   measured result. `approved: true` = Shubh has not signed the text off yet (the build lists them).
   Media is not listed here: each page pulls its images from the chapter data by the keys below.
   ═══════════════════════════════════════════════════ */

export type WorkType = 'Branding' | 'Web' | 'Social' | 'Packaging' | 'Streetwear';

export type CaseStudy = {
  slug: string;
  name: string;
  /** "a luxury perfume brand" */
  client: string;
  types: WorkType[];
  /** One primary keyword, owned by this page only */
  keyword: string;
  /** <title> without the " | Shubh Panda" suffix (36–46 characters) */
  title: string;
  /** Meta description, 140–160 characters */
  description: string;
  /** One line for lists and llms.txt */
  summary: string;
  /** Answer-first sentence: what this page is, in plain words */
  answer: string;
  brief: string[];
  approach: string[];
  delivered: string[];
  tools: string[];
  approved: boolean;
  /** Keys into the chapter data */
  brand?: string;
  web?: string;
  smm?: string;
  pack?: string;
  logo?: string;
  brochure?: string;
};

const AI = 'Adobe Illustrator';
const PS = 'Adobe Photoshop';
const ID = 'Adobe InDesign';
const FIGMA = 'Figma';

export const caseStudies: CaseStudy[] = [
  {
    slug: 'senquira',
    name: 'Senquira',
    client: 'a luxury perfume brand',
    types: ['Branding', 'Social'],
    keyword: 'luxury perfume brand identity design',
    title: 'Senquira: Luxury Perfume Brand Identity Design',
    description: 'Luxury perfume brand identity design for Senquira: wordmark, crimson and navy palette, typography, packaging, campaign lines and launch posts.',
    summary: 'brand identity and social media for a luxury perfume brand',
    answer:
      'Shubh Panda designed the brand identity for Senquira, a luxury perfume brand, including the wordmark, colour palette, typography, packaging and campaign applications, along with its launch posts for social media.',
    brief: [
      'Senquira is a luxury perfume house that wanted an identity strong enough to own the room before the wearer walks in. The brief asked for a brand that feels seductive and expensive, and that could stretch from a bottle label to a billboard to an Instagram grid without losing its voice.',
    ],
    approach: [
      'This luxury perfume brand identity design starts from one idea: treat every visual like a fragrance note, dark, layered and hard to ignore. The wordmark is a high-contrast serif with a sweeping Q, set wide so it reads as a signature rather than a label. Around it sits a palette of crimson, blood red, sunset orange and dark navy, the colours of amber glass in low light.',
      'Typography pairs the italic display face Editor’s Note with Raleway for small print, so headlines such as “Leave your mark.” and “A scent that stays.” feel personal while product details stay clean. A logo safe-zone rule keeps the wordmark breathing on every surface, and the same rules carry into the social posts, where each headline is written like a secret.',
      'On social media, five launch posts carry the identity into the feed: a gold cocktail-glass cover, a pale “Perfume Crimes” post, a split red-and-gold layout and a warm, leather-toned product post. Each one uses the same wordmark, the same serif headlines and the same four colours, so the feed reads as an extension of the packaging and not as a separate campaign.',
    ],
    delivered: [
      'Wordmark logo with a logo safe-zone rule',
      'Colour palette: crimson, blood red, sunset orange and dark navy',
      'Typography system: Editor’s Note and Raleway',
      'Packaging: bottle label, outer box and a three-bottle discovery set',
      'Campaign lines and a billboard layout',
      'Product visuals for the Dirty Secret, F.M.G and Signed By Her fragrances',
      'Launch posts for Instagram',
    ],
    tools: [AI, PS, ID],
    approved: true,
    brand: 'senquira',
    smm: 'senquira',
    logo: 'senquira',
  },
  {
    slug: 'do-bhaion-ki-dukan',
    name: 'Do Bhaion Ki Dukan',
    client: 'a multibrand ethnic wear store',
    types: ['Branding'],
    keyword: 'ethnic wear brand identity design',
    title: 'Do Bhaion Ki Dukan: Ethnic Wear Brand Identity',
    description: 'Ethnic wear brand identity design for Do Bhaion Ki Dukan: DB monogram, maroon and gold palette, storefront, shopping bags, tags and billboard.',
    summary: 'brand identity for a multibrand ethnic wear store',
    answer:
      'Shubh Panda designed the brand identity for Do Bhaion Ki Dukan, a multibrand ethnic wear store, including the DB monogram logo, colour palette, typography, brand pattern, packaging, stationery and store signage.',
    brief: [
      'Do Bhaion Ki Dukan is a premium Indian ethnic wear store that needed an identity rich enough to match its fabrics. The brand carries a long family history, summed up in its line “Serving Style Since 1969”, and sells ethnic, traditional, formal and casual wear under one roof, so the identity had to feel royal without feeling dated.',
    ],
    approach: [
      'The ethnic wear brand identity design blends royal Indian motifs with clean modern type. A gold DB monogram sits above the full name and the tagline “Your Brand - Your Store”, on a deep maroon field. The palette is kept to three colours, maroon, gold and ivory white, so the clothes always stay the loudest thing in the room.',
      'A classic serif carries the heritage lines and a modern sans handles everyday information. The monogram repeats into a brand pattern for wrapping, bags and tags, and the same system is shown on the storefront, on shopping bags and boxes, on stationery and on a highway billboard, so the store reads as one brand from the street to the billing counter.',
      'The board also shows how the identity behaves next to fashion photography. Ethnic and modern looks are shot against warm sandstone, so the maroon and gold of the brand frame the clothes without competing with them. Small details finish the system: a woven label stitched into the garment, hang tags in maroon and ivory, and the heritage line “Royal Heritage | Multibrand Store” under the larger headlines.',
    ],
    delivered: [
      'DB monogram and full logo lock-up',
      'Colour palette: maroon, gold and ivory white',
      'Typography pairing: classic serif and modern sans',
      'Repeat brand pattern built from the monogram',
      'Shopping bag and gift box packaging',
      'Stationery, hang tags and woven fabric labels',
      'Storefront signage and billboard layout',
    ],
    tools: [AI, PS, ID],
    approved: true,
    brand: 'dbkd',
    logo: 'dbkd',
  },
  {
    slug: 'swaroop-realty',
    name: 'Swaroop Realty',
    client: 'a real estate company in Vrindavan',
    types: ['Branding', 'Web'],
    keyword: 'real estate branding and website design',
    title: 'Swaroop Realty: Real Estate Branding & Website',
    description: 'Real estate branding and website design for Swaroop Realty, Vrindavan: logo, navy palette, signage, business cards, React website and a gatefold brochure.',
    summary: 'brand identity, website and gatefold brochure for a real estate company in Vrindavan',
    answer:
      'Shubh Panda designed the branding and website for Swaroop Realty, a real estate company in Vrindavan that sells plots, land, villas and larger developments, and also designed the gatefold brochure for its Brij Garden project.',
    brief: [
      'Swaroop Realty builds and sells property in Vrindavan: plots, land, villas, resorts and large projects. It needed an identity as rooted as the city it builds in, and a website that makes a buyer feel the place before a site visit.',
    ],
    approach: [
      'The real estate branding and website design treats property like heritage, not inventory. The symbol is a sculpted, layered form in royal blue, paired with a calm serif wordmark and the line “Land | Villas | Resorts | Developments”. The palette runs from royal blue and midnight to ivory, sandstone and champagne, and type pairs Playfair Display with Outfit.',
      'One system carries from the primary mark to the entrance gate, business cards, a brand book and property hoardings, with a clear-space rule for the logo. The website was built in React with GSAP, ScrollTrigger and Lenis, so smooth inertia scrolling walks a visitor through each property, with interactive site maps along the way. For the Brij Garden project the same identity was folded into a gatefold brochure and large-format billboards.',
      'The brand symbol is explained on the board in four words: timeless, rooted, harmonious and forward. Photography follows the same mood, with warm evening light on sandstone architecture, the Vrindavan skyline across the river and a resort pool at dusk, under lines such as “A place to belong.” and “A richer way of life.”',
    ],
    delivered: [
      'Logo symbol, wordmark and clear-space rule',
      'Colour palette: royal blue, midnight, ivory, sandstone and champagne',
      'Typography system: Playfair Display and Outfit',
      'Business cards, brand book and brochure covers',
      'Entrance gate signage and property billboards',
      'Website design and development in React',
      'Brij Garden gatefold brochure and billboards',
    ],
    tools: [AI, PS, ID, 'React', 'GSAP ScrollTrigger', 'Lenis'],
    approved: true,
    brand: 'swaroop-realty',
    web: 'swaroop-realty',
    logo: 'swaroop-realty',
    brochure: 'brij-garden',
  },
  {
    slug: 'chemist-box',
    name: 'Chemist Box',
    client: 'an Indian pharmacy chain',
    types: ['Branding', 'Web'],
    keyword: 'pharmacy brand identity and website design',
    title: 'Chemist Box: Pharmacy Brand Identity & Website',
    description: 'Pharmacy brand identity and website design for Chemist Box: logo, green and blue system, store signage, staff ID, shopping bags and a fast Next.js site.',
    summary: 'brand identity and website for an Indian pharmacy chain',
    answer:
      'Shubh Panda designed the brand identity and website for Chemist Box, an Indian pharmacy chain, including the logo, colour system, typography, store signage, packaging, staff stationery and a searchable website.',
    brief: [
      'Chemist Box is a pharmacy chain expanding across India. It needed a brand that says affordable quality at first glance, and that works the same on a neighbourhood shopfront, a delivery box and a phone screen.',
    ],
    approach: [
      'The pharmacy brand identity and website design is built to be clean and trustworthy: green for health, blue for retail sharpness, and a warm, friendly tone for the neighbourhood chemist. The logo joins a cross and a box into one mark beside the name and the line “Health Delivered”. Colours are named for their job: navy, pharmacy blue, care green and aqua, with Poppins for headlines and Inter for text.',
      'A rounded graphic system made from the logo’s shapes ties campaigns together, from “Everyday care. Better value.” to “Care that fits your budget.” The identity is shown on the store exterior, the pharmacist’s counter, home-delivery kit, shopping bags, staff ID cards and a billboard. The website mirrors the same promise with clear categories, fast search and filters, and a store locator map.',
      'Because a pharmacy chain grows shop by shop, every element is designed to be repeated easily: the same exterior sign with the logo and tagline, the same window panels for genuine medicines and home delivery, and the same discount roundel. Delivery staff carry the brand on helmets, uniforms and boxes, so the promise in the tagline, “Health Delivered”, is seen on the street as well as in the store.',
    ],
    delivered: [
      'Logo and tagline lock-up',
      'Colour palette: navy, pharmacy blue, care green, aqua and white',
      'Typography system: Poppins and Inter',
      'Graphic system built from the logo’s shapes',
      'Store exterior signage and billboard',
      'Shopping bag, delivery box, stationery and staff ID',
      'Website with search, filters and a store locator',
    ],
    tools: [AI, PS, FIGMA, 'Next.js'],
    approved: true,
    brand: 'chemist-box',
    web: 'chemist-box',
    logo: 'chemist-box',
  },
  {
    slug: 'ghoomar-thali',
    name: 'Ghoomar Thali',
    client: 'a Rajasthani restaurant chain',
    types: ['Web'],
    keyword: 'Rajasthani restaurant website design',
    title: 'Ghoomar Thali: Rajasthani Restaurant Website',
    description: 'Rajasthani restaurant website design for Ghoomar Thali: an immersive cultural hero, animated menu carousel and smooth scrolling, built in React and GSAP.',
    summary: 'website for a Rajasthani restaurant chain',
    answer:
      'Shubh Panda designed and developed the website for Ghoomar Thali, a premium Rajasthani restaurant chain where dinner comes with magic shows, kathputli puppetry and dhol-nagada.',
    brief: [
      'Ghoomar Thali is a premium Rajasthani restaurant chain. A meal there is a full evening of culture: a thali served alongside magic, kathputli puppetry and dhol-nagada. The website had to feel like stepping into that courtyard, not like reading a menu card.',
    ],
    approach: [
      'This Rajasthani restaurant website design opens on an immersive cultural hero, so the first thing a visitor meets is the atmosphere of the place. From there the page moves like a guided walk: sections glide in on scroll, and the motion is timed so that food, music and performance each get their own moment.',
      'The site is built in React. GSAP and ScrollTrigger drive the scroll-linked scenes, Framer Motion handles the layout transitions, and Lenis gives the whole page a smooth, weighted scroll. The menu is an animated carousel instead of a long list, so dishes can be browsed one at a time, the way they arrive at the table.',
      'Restaurant sites are mostly opened on a phone, often by someone deciding where to eat that evening. The layouts were therefore designed for a small screen first, with large type, clear sections and animation that stays smooth on an ordinary phone. On a desktop the same scenes open up into wider compositions.',
      'The web chapter of this portfolio shows a screen recording of the finished site, so the pacing of the scroll and the movement of the menu carousel can be seen as a visitor experiences them. For a restaurant brand built on performance and hospitality, that movement is part of the identity, not decoration added at the end.',
    ],
    delivered: [
      'Website design and front-end development',
      'Immersive cultural hero section',
      'Scroll-driven storytelling sections',
      'Animated menu carousel',
      'Responsive layouts for phone and desktop',
    ],
    tools: [FIGMA, 'React', 'GSAP ScrollTrigger', 'Framer Motion', 'Lenis'],
    approved: true,
    web: 'ghoomar-thali',
  },
  {
    slug: 'that-coffee',
    name: 'That Coffee',
    client: 'a coffee brand',
    types: ['Branding', 'Web'],
    keyword: 'coffee brand website design',
    title: 'That Coffee: Coffee Brand Website Design',
    description: 'Coffee brand website design for That Coffee: a bold typographic hero, origin storytelling and a custom WordPress storefront, plus the combination-mark logo.',
    summary: 'logo and online store for a coffee brand',
    answer:
      'Shubh Panda designed the logo and the website for That Coffee, a coffee brand for people who care about where their beans come from as much as how they taste.',
    brief: [
      'That Coffee sells coffee to people who are obsessed with it. The brand is artsy, bold and a little rebellious, and it needed a logo with that attitude and a store that could tell the origin story of the beans while still being easy to buy from.',
    ],
    approach: [
      'The logo is a combination mark set in Outfit: a simple symbol with a confident, rounded wordmark that holds up on a cup, a bag and a browser tab. The coffee brand website design then gives that voice room, opening on a bold typographic hero instead of a stock photograph of a latte.',
      'Below the hero, the page tells the story of each origin before it asks for an order, so flavour notes and sourcing sit side by side. The site runs on a custom WordPress storefront, which keeps products, stock and content in one place for the team that runs it day to day.',
      'Coffee is bought with the eyes and the imagination, so the pages give most of their space to large type and photography, and keep buttons and prices clear but quiet. The typographic hero sets a confident tone before a single product appears, which suits a brand that describes itself as bold and a little rebellious.',
      'A screen recording of the site sits in the web chapter of this portfolio. It shows how the store moves from the hero to the origin story and on to the products, in the order a first-time visitor would follow. The logo appears in the logo chapter, beside the other marks.',
    ],
    delivered: [
      'Combination-mark logo',
      'Website design',
      'Custom WordPress storefront',
      'Bold typographic hero section',
      'Origin story pages for the coffee',
    ],
    tools: [AI, FIGMA, 'WordPress'],
    approved: true,
    web: 'that-coffee',
    logo: 'that-coffee',
  },
  {
    slug: 'aura-rosetry',
    name: 'Aura Rosetry',
    client: 'a premium café in Mumbai',
    types: ['Branding', 'Web'],
    keyword: 'café website design Mumbai',
    title: 'Aura Rosetry: Café Website Design, Mumbai',
    description: 'Café website design for Aura Rosetry, Mumbai: warm tones, an animated menu and smooth scrolling built in React, GSAP and Framer Motion, plus the emblem logo.',
    summary: 'logo and website for a premium café in Mumbai',
    answer:
      'Shubh Panda designed the emblem logo and the website for Aura Rosetry, a premium café in Mumbai, with an animated menu and smooth, scroll-led storytelling.',
    brief: [
      'Aura Rosetry is a premium café in Mumbai where every detail is considered, down to the latte art. It needed a logo as elegant as the room and a website that makes a visitor hungry before they have booked a table.',
    ],
    approach: [
      'The logo is an emblem set in Cormorant, a serif with fine, calligraphic strokes that suits a café built on craft. For the website the palette stays warm and the type stays quiet, so the photography of the food and the space does the selling.',
      'This café website design for a Mumbai audience is built in React. GSAP and ScrollTrigger pace the story as the page scrolls, Lenis smooths the movement, and Framer Motion animates layout changes so that sections fold into each other instead of jumping. The menu is interactive: categories and dishes respond as they are explored, which keeps a long menu light to read on a phone.',
      'A café menu changes often, and most guests read it on a phone, at the table or on the way there. The menu interactions were built to be thumb-friendly, with large touch targets and short lists, and the animation is kept light so that it never gets between a guest and the dish they are looking for.',
      'The finished site can be seen as a screen recording in the web chapter of this portfolio, which shows how the scroll, the transitions and the menu behave together. The emblem appears in the logo chapter, beside the other marks.',
    ],
    delivered: [
      'Emblem logo',
      'Website design and front-end development',
      'Animated, interactive menu',
      'Scroll-led storytelling sections',
      'Responsive layouts for phone and desktop',
    ],
    tools: [AI, FIGMA, 'React', 'GSAP ScrollTrigger', 'Framer Motion', 'Lenis'],
    approved: true,
    web: 'aura-rosetry',
    logo: 'aura-rosetry',
  },
  {
    slug: 'origanimo',
    name: 'Origanimo',
    client: 'a marine-derived supplement brand',
    types: ['Web'],
    keyword: 'supplement brand website design',
    title: 'Origanimo: Supplement Brand Website Design',
    description: 'Supplement brand website design for Origanimo: interactive WebGL visuals, GSAP scroll choreography and clear ingredient breakdowns in ocean-led tones.',
    summary: 'website for an organic, marine-derived supplement brand',
    answer:
      'Shubh Panda designed and developed the website for Origanimo, a brand of organic, marine-derived supplements made without synthetic chemicals.',
    brief: [
      'Origanimo makes organic supplements from marine sources, with no synthetic chemicals. Buyers of supplements read labels closely, so the site had to carry that purity onto the screen and explain what is inside each product without sounding like a pharmacy leaflet.',
    ],
    approach: [
      'The supplement brand website design uses clinical precision and ocean-inspired tones: a clean grid, generous white space and colour drawn from the sea. Interactive WebGL visuals give the brand a living, fluid backdrop that plain photographs could not.',
      'GSAP choreographs the scroll, so each section arrives in order: what the product is, where it comes from and what it contains. Ingredients are broken down one by one in plain language, which lets a careful buyer check the formula quickly. The front end is written in JavaScript with WebGL and GSAP, without a heavy framework on top.',
      'People comparing supplements want proof more than promises. The structure of the page answers the questions a careful buyer asks, in the order they ask them: what it is, where it comes from and what is in it. Motion is used to guide the eye from one answer to the next, and never to hide information behind an effect.',
      'WebGL was chosen for the visuals because the product comes from the sea: a fluid, moving surface says marine more directly than a stock photograph. Keeping the build to plain JavaScript also keeps the page light, which matters for a site that leans on graphics. A screen recording in the web chapter of this portfolio shows the visuals and the scroll choreography running together on the finished site.',
    ],
    delivered: [
      'Website design and front-end development',
      'Interactive WebGL visuals',
      'GSAP scroll choreography',
      'Ingredient breakdown sections',
      'Responsive layouts for phone and desktop',
    ],
    tools: [FIGMA, 'JavaScript', 'WebGL', 'GSAP'],
    approved: true,
    web: 'origanimo',
  },
  {
    slug: 'kangaroo-agency',
    name: 'Kangaroo Agency',
    client: 'a social media agency',
    types: ['Branding', 'Web'],
    keyword: 'agency website and brochure design',
    title: 'Kangaroo Agency: Website & Brochure Design',
    description: 'Agency website and brochure design for Kangaroo Agency: combination-mark logo, a WordPress site with custom plugins and a 15-page company brochure.',
    summary: 'logo, website and brochure for a social media agency',
    answer:
      'Shubh Panda designed the logo, the website and the company brochure for Kangaroo Agency, a social media agency that manages brands across India, the United States and Australia.',
    brief: [
      'Kangaroo Agency manages social media for brands across India, the US and Australia. An agency’s own site is its hardest pitch: it had to prove the team knows what it is doing, show the work clearly, and be simple for the agency to update.',
    ],
    approach: [
      'The logo is a combination mark set in Archivo. The kangaroo was chosen because it jumps borders, which is exactly what the agency does for its clients. The agency website and brochure design then carry one idea across screen and print: practise what you preach.',
      'The website is built on WordPress with custom plugins, so case studies can be added and arranged by the team without touching code. Work is grouped by region to show the multi-region portfolio at a glance. The 15-page brochure tells the same story as a printed deck, laid out as a book that can be handed over in a meeting.',
      'An agency site has two audiences: brands looking for a partner, and people who might join the team. Both want to see real work quickly, so the case studies sit close to the top and each one follows the same template: the brand, the brief and the creative. The custom plugins exist so that adding a new case study is a matter of filling in fields, not rebuilding a page.',
      'The brochure can be read page by page in the creatives archive of this portfolio, and a screen recording of the website sits in the web chapter. The logo appears in the logo chapter, where the mark is shown in its original colours.',
    ],
    delivered: [
      'Combination-mark logo',
      'Website design',
      'WordPress build with custom plugins',
      'Case study showcase templates',
      '15-page company brochure',
    ],
    tools: [AI, ID, FIGMA, 'WordPress'],
    approved: true,
    web: 'kangaroo-agency',
    logo: 'kangaroo-agency',
    brochure: 'kangaroo-agency',
  },
  {
    slug: 'croppd-honey',
    name: 'Croppd Honey',
    client: 'a raw honey brand',
    types: ['Packaging', 'Branding'],
    keyword: 'honey jar label design',
    title: 'Croppd Honey: Honey Jar Label Design & Logo',
    description: 'Honey jar label design for Croppd: a hand-drawn wordmark, watercolour blossoms and a wrap-around label for a 250 g glass jar of raw, unprocessed honey.',
    summary: 'logo and wrap-around jar label for raw honey',
    answer:
      'Shubh Panda designed the Croppd logo and the wrap-around label for Croppd Honey, a 250 g glass jar of raw, unprocessed honey with no preservatives.',
    brief: [
      'Croppd sells raw, unprocessed honey with zero preservatives. On a shelf where every jar claims to be pure, the label had to make this one feel honest at a glance, and still carry nutrition, ingredients and legal marks without crowding the front.',
    ],
    approach: [
      'The honey jar label design uses a hand-drawn “Honey” wordmark, watercolour blossoms and a dripping comb on warm cream paper, so the jar feels poured rather than manufactured. The Croppd logotype sits above it in a custom sans, with the line “From Hive to Jar” below.',
      'The label was planned flat first, as one wrap-around piece: the story on the left, the wordmark up front, and nutrition and legal details on the right, so nothing lands on the seam. The front states the claims plainly: 100% pure and natural, no added sugar, no preservatives. The back carries nutrition per 100 g and per 20 g serving, the ingredient line, the FSSAI licence, the veg mark and the barcode. The finished jar was then shown in a studio shot and stacked on a shop counter, to check it reads the same in both.',
      'On the home page of this portfolio the label is shown as a short sequence: it starts flat, wraps onto the jar under its burlap cap, and the jar then lands on a wooden board with a dipper and a piece of honeycomb. The sequence follows the order the design was made in, from flat artwork to finished object. The three brand colours, a warm cream, a honey amber and a deep brown, are all taken from the product itself.',
    ],
    delivered: [
      'Croppd logotype',
      'Hand-drawn “Honey” wordmark and watercolour illustrations',
      'Wrap-around label for a 250 g glass jar',
      'Nutrition, ingredient and regulatory panel',
      'Studio and in-store product visuals',
    ],
    tools: [AI, PS],
    approved: true,
    pack: 'croppd-honey',
    logo: 'croppd',
  },
  {
    slug: 'profoods-makhana',
    name: 'ProFoods Makhana',
    client: 'a makhana snack brand',
    types: ['Packaging'],
    keyword: 'makhana pouch packaging design',
    title: 'ProFoods: Makhana Pouch Packaging Design',
    description: 'Makhana pouch packaging design for ProFoods: a confident yellow snack pouch with an illustrated farmer, a print-ready dieline and in-hand mockups.',
    summary: 'snack pouch packaging for a makhana brand',
    answer:
      'Shubh Panda designed the pouch packaging for ProFoods Makhana, a superfood makhana snack for calorie-conscious, nutrition-focused people.',
    brief: [
      'ProFoods makes makhana, a light superfood snack, for people who count calories but refuse to snack on something boring. The pouch had to read as healthy from across the aisle without looking like medicine.',
    ],
    approach: [
      'The makhana pouch packaging design is built on a confident yellow that stands apart from the greens and browns common on health-food shelves. An illustrated farmer with his basket of makhana gives the pack a face and a source, which says natural more quickly than a list of claims.',
      'The artwork was laid out on the pouch dieline, with the front, back and gussets planned together so that the illustration, the product name and the nutrition panel each land on the right face once the pouch is formed and filled. The design was then mocked up in the hand and on a table, to judge it in a real snacking moment and not only as a flat file.',
      'Yellow was chosen with the shelf in mind. Health snacks tend to sit in rows of green, white and kraft brown, and a block of strong yellow is visible from several steps away. Dark type on that yellow keeps the product name readable at a distance, and white is held back for the details.',
      'The illustration does a second job as well. Makhana is a traditional food, and showing the person who harvests it connects a modern, calorie-counted snack to where it comes from. The full gallery for this project shows the flat dieline beside the finished pouch, so the path from print layout to object is easy to follow.',
    ],
    delivered: [
      'Front and back pouch artwork',
      'Illustrated farmer character',
      'Print-ready dieline layout',
      'Pouch mockup and in-use visual',
    ],
    tools: [AI, PS],
    approved: true,
    pack: 'profoods-makhana',
  },
  {
    slug: 'milletopia',
    name: 'Milletopia',
    client: 'a ready-to-eat millet food brand',
    types: ['Packaging'],
    keyword: 'millet food packaging design',
    title: 'Milletopia: Millet Food Packaging Design',
    description: 'Millet food packaging design for Milletopia: a 200 g stand-up pouch system for khichdi, noodles, pasta and kheer, one colour per recipe, in English and Hindi.',
    summary: 'stand-up pouch range for ready-to-eat millet foods',
    answer:
      'Shubh Panda designed the stand-up pouch packaging for Milletopia, a range of ready-to-eat millet foods such as khichdi, noodles, pasta and kheer.',
    brief: [
      'Milletopia makes ready-to-eat, easy-to-make foods from millets such as jowar and bajra: khichdi, noodles, pasta and kheer, for fitness-minded eaters. The range needed one look that could cover very different dishes and still be told apart quickly on a shelf.',
    ],
    approach: [
      'The millet food packaging design is a warm 200 g stand-up pouch with the finished dish shown in its bowl up front, so a shopper sees the meal before reading a word. The name is set in both English and Hindi.',
      'Each recipe gets its own colour while the wordmark, layout and photography style stay fixed. Lined up side by side, khichdi, kheer and noodles read as one family with clear variants. The artwork was prepared on the pouch dieline and then tested as a mockup, in a studio shot and on a supermarket shelf.',
      'A range is harder to design than a single pack, because every decision has to work several times over. Here the fixed parts are the wordmark, the position of the bowl and the layout of the information, and the changing part is the colour. A shopper who has bought the khichdi once can find the kheer by its shape and pick it by its colour.',
      'Setting the name in both English and Hindi widens who can read the pack at a glance, which matters for a staple food sold across India. The gallery for this project shows the flat dieline, the pouch mockup, a studio shot and the pouches lined up on a supermarket shelf, so each stage of the work can be compared with the next.',
    ],
    delivered: [
      'Stand-up pouch artwork for a 200 g pack',
      'Colour-coded system, one colour per recipe',
      'Bilingual naming in English and Hindi',
      'Print-ready dieline layout',
      'Studio and supermarket shelf visuals',
    ],
    tools: [AI, PS],
    approved: true,
    pack: 'milletopia',
  },
  {
    slug: 'arban-beauty',
    name: 'Arban Beauty',
    client: 'an organic skincare brand',
    types: ['Packaging'],
    keyword: 'skincare packaging design',
    title: 'Arban Beauty: Skincare Packaging Design',
    description: 'Skincare packaging design for Arban Beauty: a clean white Vitamin C carton and dropper bottle with a green leaf emblem and one sliced orange.',
    summary: 'carton and bottle packaging for an organic skincare range',
    answer:
      'Shubh Panda designed the carton and bottle packaging for the Vitamin C range of Arban Beauty, an organic, nature-led skincare brand.',
    brief: [
      'Arban Beauty makes organic, nature-led skincare built on natural ingredients and vitamins. For its Vitamin C range, the pack had to say what the product is in one look and feel as clean as the formula inside.',
    ],
    approach: [
      'The skincare packaging design uses a clean white carton, a green leaf emblem and a single sliced orange. The orange does the explaining: Vitamin C reads at a glance, before any text. White space keeps the pack calm, which suits a product that goes on the face.',
      'The carton and the dropper bottle carry the same orange and the same green, so they are recognisable alone on a plinth or lined up in a store. The carton was drawn flat as a print layout first, then shown as a full product line-up, as a collection display and on a shelf.',
      'Skincare buyers read packs closely, and often in a hurry. The front of the carton keeps to three things: the brand, the product and the cue for the key ingredient. Everything else moves to the sides and the back, where there is room to set it clearly.',
      'Using one fruit as the signal for one ingredient also gives the brand a pattern it can repeat. Another range could take another natural cue and keep the same white carton and green leaf, so the family can grow without a redesign. The gallery for this project shows the flat carton artwork, the product line-up, a collection display and the range on a shelf.',
    ],
    delivered: [
      'Carton artwork, drawn flat for print',
      'Dropper bottle label',
      'Green leaf emblem',
      'Product line-up and collection display visuals',
      'On-shelf visual',
    ],
    tools: [AI, PS],
    approved: true,
    pack: 'arban-beauty',
  },
  {
    slug: 'streetwear',
    name: 'Streetwear Tee Graphics',
    client: 'streetwear t-shirts',
    types: ['Streetwear'],
    keyword: 'streetwear t-shirt graphic design',
    title: 'Streetwear T-Shirt Graphic Design: 10 Tees',
    description: 'Streetwear t-shirt graphic design by Shubh Panda: ten tee graphics with front and back prints on white and black tees, each shown on a model.',
    summary: 'ten streetwear t-shirt graphics with front and back prints',
    answer:
      'Shubh Panda designed this collection of ten streetwear t-shirt graphics, with front prints and front-and-back prints for white and black tees.',
    brief: [
      'This is a set of graphics made for streetwear tees. The rule for the collection is simple: graphics first, the cotton just carries them. Each design had to work as a print on fabric, at chest size and at full back size, on a white or a black tee.',
    ],
    approach: [
      'The streetwear t-shirt graphic design work here leans on loud type, collage and hand-made texture. Titles such as Fallen Angels, Money Talk, In Glock We Trust and Wasted set the tone, and each one is built as finished artwork: a front print alone, or a small front print paired with a large back piece.',
      'Every design is prepared as a clean artwork file on a white or black sheet, matched to the tee colour it prints on, and then shown on a model so the scale and placement can be judged on a body and not only on a flat mock. On the home page the designs sit on a wheel: pick a card to swap the model, and click the model to see the artwork behind the print.',
      'The collection is split evenly between the two formats: five designs are front prints and five are front-and-back sets. Six are made for white tees and four for black. Fallen Angels appears twice, as two separate takes on the same title. Each design has its own page with the model shot and the artwork behind the print.',
      'Type does most of the work in these graphics. Lettering is drawn, distorted or set tight until the title becomes an image in its own right, usually with a single accent colour picked out against black and white.',
    ],
    delivered: [
      'Ten t-shirt graphics',
      'Front print artwork',
      'Front and back print sets',
      'Artwork prepared for white and black tees',
      'On-model visuals for each design',
    ],
    tools: [AI, PS],
    approved: true,
  },
  {
    slug: 'alright-tv',
    name: 'Alright TV',
    client: 'a streaming entertainment channel',
    types: ['Social'],
    keyword: 'Alright TV social media design',
    title: 'Alright TV Social Media Design: Show Posters',
    description: 'Alright TV social media design: show posters and tune-in posts for a streaming channel, with loud type and one colour per show so each title stands out.',
    summary: 'show posters and tune-in posts for a streaming channel',
    answer: 'Shubh Panda designed social media creatives for Alright TV, a streaming entertainment channel, including show posters and tune-in posts for its series.',
    brief: [
      'Alright TV releases new shows to a feed that scrolls fast. Each post had to name the show, set its mood and tell viewers when to watch, in the second or two before the thumb moves on.',
    ],
    approach: [
      'The Alright TV social media design gives every show its own colour: a cool blue for drama, a bright yellow for a quiz-style “green flag or red flag?” post, pink for a romance and a sepia tone for a crime thriller. Type is large and loud, the cast is the hero of each frame, and the channel logo and the schedule sit in the same place each time, so a viewer learns where to look. The posts are built in portrait feed format, which takes up the most space on a phone screen.',
      'The set shown here has seven feed posts. Among them are show posters for Dil Se Deewangi Tak, Love Marriage and Gangs of Gorakhpur, and a quiz-style post built around the question “Be honest: green flag or red flag?”. The posters carry the day and time of the show, so one post works as both an announcement and a reminder.',
      'Entertainment posts compete with everything else in a feed, including the shows themselves. Giving each title one strong colour makes a post readable as a thumbnail on the profile grid, where a viewer scanning nine squares can still tell a drama from a comedy. The same system leaves room for new shows: a new title takes a new colour, and the layout stays as it is.',
    ],
    delivered: ['Show poster posts', 'Tune-in and schedule posts', 'Engagement posts built around a question', 'Portrait feed formats for Instagram'],
    tools: [PS, AI],
    approved: true,
    smm: 'alright-tv',
  },
  {
    slug: 'elan-wallcovers',
    name: 'Elan Wallcovers',
    client: 'a wallcovering studio',
    types: ['Social'],
    keyword: 'Elan Wallcovers social media design',
    title: 'Elan Wallcovers Social Media Design: Feed',
    description: 'Elan Wallcovers social media design: feed posts and stories for a wallcovering studio, with large interiors, quiet type and colours drawn from the walls.',
    summary: 'feed posts and stories for a wallcovering studio',
    answer: 'Shubh Panda designed social media creatives for Elan Wallcovers, a wallcovering studio, including feed posts and stories built around its interiors and textures.',
    brief: [
      'Elan Wallcovers sells what goes on a wall, which is hard to show in a small square. The feed had to make texture and scale visible, and feel like an interiors magazine more than a catalogue.',
    ],
    approach: [
      'The Elan Wallcovers social media design lets rooms do the talking. Each post leads with one large interior or one close texture, and the type stays small and quiet around it. Headlines such as “Luxury, layered” and “Timeless textures” are set in a refined serif, and each layout takes its palette from the wall it shows: beige, deep orange and magenta, poolside blue or mossy green. Stories use the same system in a tall format, so the brand looks the same wherever it is seen.',
      'The set shown here has six feed posts and seven stories. The posts cover the studio’s main themes, among them “Walls Matters”, “Luxury, layered”, “Textures & Tones” and “Timeless textures”, and each one is built around a single room or a single material.',
      'Interior products are bought slowly, after a lot of looking. The feed is designed for that kind of browsing: calm layouts, generous margins and no hard-sell graphics, so a follower can save a post the way they would tear a page out of a magazine. Because the palette is always taken from the wallcovering itself, the grid changes colour from post to post and still feels like one brand. The stories follow the same rules, so a viewer moving between the two formats never feels a change of voice.',
    ],
    delivered: ['Feed posts', 'Instagram stories', 'Texture and material close-up layouts', 'A consistent type and colour system for the grid'],
    tools: [PS, AI],
    approved: true,
    smm: 'elan-wallcovers',
  },
  {
    slug: 'vareeka',
    name: 'Vareeka',
    client: 'a jewellery label',
    types: ['Social'],
    keyword: 'Vareeka social media design',
    title: 'Vareeka Social Media Design: Rakhi Campaign',
    description: 'Vareeka social media design: a Rakhi campaign for a jewellery label, with sibling moments up front and the gift sets, bundles and offer prices close behind.',
    summary: 'a Rakhi gifting campaign for a jewellery label',
    answer: 'Shubh Panda designed a Rakhi social media campaign for Vareeka, a jewellery label, presenting its gift sets and bundles for the festival.',
    brief: [
      'For Rakhi, Vareeka wanted to sell jewellery as a gift from a brother to a sister. The campaign had to carry emotion and still be clear about what is in each set and what it costs.',
    ],
    approach: [
      'The Vareeka social media design opens on a soft sibling moment with the line “This Rakhi, choose a gift that says more than words ever could”, then moves to the product. A carousel takes the viewer from the feeling to the facts: The Chosen Set of earrings and a pendant, a page of four bundles, a close-up of two pieces, and a limited-time bundle offer. Ivory backgrounds and a purple band hold every slide together, and each price sits in the same round badge, so the offer is easy to find.',
      'The campaign shown here has five posts. It runs in the order a buyer thinks: the occasion first, then the hero set at its offer price, then the wider choice of four bundles, and last the limited-time reminder. Prices are printed on the creatives themselves, so nobody has to open a caption to find them.',
      'Festival campaigns are short and crowded, and every jewellery brand posts for Rakhi. Leading with the relationship between a brother and a sister, and not with the product, gives the set a reason to be noticed, while the fixed purple band and the round price badge make each slide recognisable as Vareeka. The same structure can be reused for other gifting occasions by changing the photograph and the headline.',
    ],
    delivered: ['Rakhi campaign key visual', 'Carousel slides for gift sets and bundles', 'Product close-up posts', 'Limited-time offer post'],
    tools: [PS, AI],
    approved: true,
    smm: 'vareeka',
  },
  {
    slug: 'udman-square',
    name: 'Udman Square',
    client: 'an events venue',
    types: ['Social'],
    keyword: 'Udman Square social media design',
    title: 'Udman Square Social Media Design: Venue Posts',
    description: 'Udman Square social media design: posts and stories for an events venue, with chandeliers, banquet halls and collage layouts that sell the evening.',
    summary: 'posts and stories for an events venue',
    answer: 'Shubh Panda designed social media creatives for Udman Square, an events venue, including feed posts and stories that show its banquet spaces.',
    brief: [
      'Udman Square hosts events. People choose a venue with their eyes, so the feed had to show the halls at their best and make a visitor picture their own evening there.',
    ],
    approach: [
      'The Udman Square social media design treats each post like an invitation. A black-and-gold layout shows the banquet hall, a red frame leads through the chandelier-lit entrance, and cream and white collages gather several corners of the venue in one post. Type is elegant and kept small, and photographs fill most of the frame. Stories repeat the same look in a tall format for day-to-day updates.',
      'The set shown here has five feed posts and four stories. The posts move between two kinds of image: wide views that show the scale of a hall, and closer details such as the chandeliers at the entrance. Collage posts let several of these sit together, which is useful for a venue with more than one space to show. Captions close on the venue’s line, “Where events become memories.”',
      'A venue is booked for one important day, so trust matters more than novelty. The design stays formal and steady: black, gold and cream, elegant type and plenty of room around each photograph. Nothing in the layout dates quickly, which means posts stay usable on the profile long after an event has passed.',
      'For a business like this, the profile grid works as a brochure. Someone planning an event will usually scroll the whole page before they call, so the posts are designed to look right side by side as well as one at a time.',
    ],
    delivered: ['Feed posts for the venue', 'Photo collage layouts', 'Instagram stories', 'A consistent black, gold and cream system'],
    tools: [PS, AI],
    approved: true,
    smm: 'udman-square',
  },
  {
    slug: 'stories-for-you',
    name: 'Stories for You',
    client: 'a photo album studio',
    types: ['Social'],
    keyword: 'Stories for You social media design',
    title: 'Stories for You Social Media Design: Albums',
    description: 'Stories for You social media design: posts and stories for a photo album studio, in warm paper tones with real album spreads and gentle headlines.',
    summary: 'posts and stories for a photo album studio',
    answer: 'Shubh Panda designed social media creatives for Stories for You, a photo album studio, including feed posts and a set of Instagram stories.',
    brief: [
      'Stories for You makes printed photo albums. Its audience keeps thousands of photos on a phone and rarely prints one, so the posts had to make holding a printed memory feel worth it again.',
    ],
    approach: [
      'The Stories for You social media design uses warm paper tones, soft blues and real album spreads. Headlines are gentle and direct: “Relive every moment”, “Hold on to the moments that matter”, “Every page is a chance”. Layouts borrow from scrapbooks, with taped photos, handwriting and overlapping prints, so each post looks like a page from the product itself. Most of the set is made as stories, in a tall format suited to quick, personal updates.',
      'The set shown here has three feed posts and eight stories. Stories are the larger part on purpose: they are the format people use for personal moments, which is exactly what the product is about. Each story pairs one photograph or album spread with one short line.',
      'The tone is quiet. There are no discounts shouting from the corners and no crowded layouts, because the product is sentimental and is bought as a gift or a keepsake. Paper textures, tape and handwriting make the posts feel made by hand, and the soft palette keeps the photographs, the real subject, in front. The captions end on the idea the brand is built on: every page holds a memory worth keeping.',
      'Because every layout is a variation on a scrapbook page, new posts can be made from fresh photographs without redesigning anything, which keeps the feed personal.',
    ],
    delivered: ['Feed posts', 'A set of Instagram stories', 'Scrapbook-style photo layouts', 'Headline and caption lines'],
    tools: [PS, AI],
    approved: true,
    smm: 'stories-for-you',
  },
  {
    slug: 'blink-brand-solutions',
    name: 'Blink Brand Solutions',
    client: 'a custom travel company',
    types: ['Social'],
    keyword: 'Blink Brand Solutions social media design',
    title: 'Blink Brand Solutions Social Media Design',
    description: 'Blink Brand Solutions social media design: travel posts for a custom-trips company, in postcard colour with clear offers and one destination per post.',
    summary: 'travel posts for a custom-trips company',
    answer: 'Shubh Panda designed social media creatives for Blink Brand Solutions, a company that plans customised trips, with one destination featured in each post.',
    brief: [
      'Blink Brand Solutions plans customised trips. Travel feeds are crowded with the same beaches and skylines, so each post needed a single clear destination and a reason to enquire.',
    ],
    approach: [
      'The Blink Brand Solutions social media design keeps to one destination per post. A large photograph sets the place, postcard colours frame it, and the offer is written plainly beside it. The brand line, “Your trip, your way”, runs through the set. Keeping the layout fixed while the destination changes lets the feed read as a series, so a follower who sees two posts knows the third.',
      'The set shown here has seven feed posts. Each one is built the same way: the destination as a full photograph, the name of the place in large type, and the offer in a clear block. The repeated structure turns separate posts into a recognisable series.',
      'Travel is sold on a feeling and bought on details. The photographs supply the feeling, and the layout makes sure the details, where the trip goes and how to enquire, are never more than a glance away. Postcard-style colour gives the set a friendly, holiday tone, and the brand line reminds the viewer that every trip can be customised.',
      'A fixed template also makes the account quicker to run. A new destination needs only a new photograph, a new headline and the offer text, so the feed can keep up with the seasons without each post becoming a design project. For a small travel company that speed matters as much as the look.',
    ],
    delivered: ['Destination posts', 'Offer and package posts', 'A fixed layout system for the series', 'Portrait feed formats for Instagram'],
    tools: [PS, AI],
    approved: true,
    smm: 'blink-brand-solutions',
  },
];

export const caseBySlug = (slug: string) => caseStudies.find((c) => c.slug === slug);
