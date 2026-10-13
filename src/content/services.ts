/* ═══════════════════════════════════════════════════
   SERVICE PAGES + ABOUT — wording for /services/<slug> and /about
   Drafts written from the work on this site. No prices, timelines or results are stated
   anywhere: where a client would ask for one, the answer says it is agreed in the quote.
   `approved: true` = waiting for Shubh's sign-off (the build lists them).
   Order = navigation order: brand identity, website, social media, packaging, streetwear.
   ═══════════════════════════════════════════════════ */

import { inPlace, place, site } from './site';

export type Faq = { q: string; a: string };

export type Service = {
  slug: string;
  /** Menu / footer label */
  label: string;
  /** Anton title on the page (the H1) */
  heading: string;
  serviceType: string;
  keyword: string;
  /** <title> without the suffix */
  title: string;
  description: string;
  /** One line for llms.txt and link lists */
  summary: string;
  answer: string;
  body: { h: string; p: string[] }[];
  process: { label: string; text: string }[];
  /** Case-study slugs shown as related work (3–6) */
  cases: string[];
  faq: Faq[];
  approved: boolean;
};

const quote = `Send a short brief by email (${site.email}) or phone (${site.phone}): what the business does, what you need and when you need it. You get back a scope, a timeline and a quote before any work starts.`;

export const services: Service[] = [
  {
    slug: 'brand-identity-design',
    label: 'Brand identity',
    heading: 'Brand Identity Design',
    serviceType: 'Brand identity design',
    keyword: 'brand identity designer India',
    title: 'Brand Identity Designer India: Logos & Kits',
    description: 'Brand identity designer in India for cafés, restaurants and small businesses: logo design, colour and type systems, brand guidelines and applications.',
    summary: 'logos, brand guidelines and brand kits',
    answer: `Shubh Panda is a brand identity designer in India who designs logos, colour and type systems, brand guidelines and the applications that carry them, for cafés, restaurants and growing small businesses.`,
    body: [
      {
        h: 'What a brand identity covers',
        p: [
          'A logo is the start of an identity, not the whole of it. A brand identity is the full set of decisions that makes a business recognisable: the mark, the colours, the typefaces, the patterns and the way they are used on real things. When those decisions are made once and written down, every sign, bag, menu and post after that takes less time and looks like it belongs.',
          'Each identity here is built as a brand kit. It begins with the logo and its variations, then a named colour palette, a pairing of typefaces for headlines and text, and a clear-space rule that keeps the mark readable. From there the system is applied to the surfaces the business actually uses.',
        ],
      },
      {
        h: 'Logo design for small business, cafés and restaurants',
        p: [
          'Small businesses need a logo that works hard at small sizes: on a cup, a bill, a shop board and a profile picture. The marks in this portfolio range from wordmarks and logotypes to emblems, monograms and combination marks, each chosen for where it will be seen most. Aura Rosetry, a café in Mumbai, uses an elegant emblem. That Coffee uses a bold combination mark. Croppd uses a simple logotype that sits above a hand-drawn product name.',
        ],
      },
      {
        h: 'From guidelines to the real world',
        p: [
          'Brand guidelines design matters only if the rules survive contact with the street. That is why each project is shown in use. For Senquira, a luxury perfume brand, the identity runs across bottle labels, boxes, a discovery set and a billboard. For Do Bhaion Ki Dukan, an ethnic wear store, it covers the storefront, shopping bags, tags and a brand pattern. For Swaroop Realty in Vrindavan it reaches the entrance gate, business cards and property hoardings, and for the pharmacy chain Chemist Box it covers the shop exterior, staff ID cards and delivery packaging.',
          'Because the same designer also builds websites and social media creatives, an identity can be carried straight into a site and a content system without being handed to another team and reinterpreted.',
        ],
      },
    ],
    process: [
      { label: 'BRIEF', text: 'A conversation about the business, its customers and where the brand will be seen most.' },
      { label: 'DIRECTION', text: 'A visual direction: references, a first palette and type, and the idea the logo is built on.' },
      { label: 'SYSTEM', text: 'The logo and its variations, colours, typefaces, patterns and usage rules, built as one kit.' },
      { label: 'APPLICATIONS', text: 'The identity applied to real surfaces such as packaging, signage, stationery and social templates.' },
    ],
    cases: ['senquira', 'do-bhaion-ki-dukan', 'swaroop-realty', 'chemist-box', 'croppd-honey', 'aura-rosetry'],
    faq: [
      { q: 'What is included in a brand identity?', a: 'A logo with its variations, a colour palette, a typeface pairing, supporting patterns or graphics, usage rules, and the identity applied to the items your business uses, such as packaging, signage, stationery and social media templates. The exact list is set in the quote.' },
      { q: 'How long does a brand identity take?', a: 'It depends on how many applications are needed and how quickly feedback comes back. A timeline is agreed with the quote, before work starts.' },
      { q: 'Can you design only a logo?', a: 'Yes. Several clients in this portfolio, such as Reish, Organic Miles and DJ Abhishek, have a logo alone. A logo can be extended into a full identity later.' },
      { q: 'Do you work with businesses outside your city?', a: `Yes. The brands shown here are based in different parts of India, including Vrindavan and Mumbai. Projects are run remotely by email and phone from ${place()}.` },
      { q: 'How do I get a quote for a brand identity?', a: quote },
    ],
    approved: true,
  },
  {
    slug: 'website-design-development',
    label: 'Website',
    heading: 'Website Design & Development',
    serviceType: 'Website design and development',
    keyword: 'website designer for restaurants and cafés',
    title: 'Website Designer for Restaurants and Cafés',
    description: 'Website designer for restaurants and cafés in India: React and WordPress sites with animated menus, smooth scrolling and layouts built for phones first.',
    summary: 'React websites for restaurants, cafés and small businesses',
    answer: `Shubh Panda is a website designer for restaurants and cafés in India who designs and builds the site himself, in React or WordPress, so the design and the code stay in the same hands.`,
    body: [
      {
        h: 'Websites that feel like the place',
        p: [
          'A restaurant or café website has one job before any other: make someone want to come in. Hours, menu and location matter, but people decide with their eyes first. The sites in this portfolio are designed around atmosphere, then made practical.',
          'Ghoomar Thali, a Rajasthani restaurant chain, opens on an immersive cultural hero and presents its menu as an animated carousel. Aura Rosetry, a premium café in Mumbai, uses warm tones and an interactive menu that stays light on a phone. That Coffee tells the origin story of its beans before it asks for an order.',
        ],
      },
      {
        h: 'React website developer, and WordPress when it fits',
        p: [
          'Most of these sites are built in React with GSAP and ScrollTrigger for scroll-linked animation, Lenis for smooth scrolling and Framer Motion for layout transitions. That stack is used when motion is part of the brand, as it is for a restaurant that sells an experience.',
          'When a team needs to edit pages and products without a developer, the site is built on WordPress instead. That Coffee runs on a custom WordPress storefront, and Kangaroo Agency uses custom plugins so its team can publish case studies on its own. The pharmacy chain Chemist Box has a Next.js site with fast search, filters and a store locator.',
        ],
      },
      {
        h: 'Small business website design, done by one person',
        p: [
          'For a small business, a website is usually the first full expression of its brand. Because the same person designs the identity and writes the front end, nothing is lost between a design file and the live page: spacing, type and motion arrive as they were drawn. Sites are designed for phones first, then extended to larger screens.',
          'Beyond restaurants and cafés, the same approach has been used for real estate in Vrindavan (Swaroop Realty), a marine supplement brand (Origanimo) and a social media agency (Kangaroo Agency).',
        ],
      },
    ],
    process: [
      { label: 'BRIEF', text: 'What the site must do, who visits it, and what content and photography already exist.' },
      { label: 'DESIGN', text: 'Page layouts and a motion plan, designed for phones first and reviewed before any code is written.' },
      { label: 'BUILD', text: 'Front-end development in React or WordPress, with animation, responsive layouts and real content.' },
      { label: 'LAUNCH', text: 'Testing across screen sizes, final fixes and a handover so the site can be updated.' },
    ],
    cases: ['ghoomar-thali', 'aura-rosetry', 'that-coffee', 'chemist-box', 'swaroop-realty', 'origanimo'],
    faq: [
      { q: 'Do you both design and develop the website?', a: 'Yes. The design and the front-end code are done by the same person, so the live site matches the approved design.' },
      { q: 'Which platform will my website be built on?', a: 'It depends on what the site needs. Animated, experience-led sites are built in React. Sites that a team must edit often, or that sell products, are built on WordPress. The choice is explained in the quote.' },
      { q: 'Will my website work on mobile phones?', a: 'Yes. Layouts are designed for phones first and then adapted to tablets and desktops.' },
      { q: 'Can you redesign a website I already have?', a: 'Yes. Share the current site and what is not working, and the scope is set from there.' },
      { q: 'How much does a restaurant or café website cost?', a: `The price depends on the number of pages, the amount of animation and whether a menu or store has to be managed. ${quote}` },
    ],
    approved: true,
  },
  {
    slug: 'social-media-design',
    label: 'Social media',
    heading: 'Social Media Design',
    serviceType: 'Social media creative design',
    keyword: 'social media creative designer',
    title: 'Social Media Creative Designer for Brands',
    description: 'Social media creative designer for brands in India: Instagram posts, carousels, stories and campaign creatives built as one consistent system for the grid.',
    summary: 'posts, carousels, stories and campaigns',
    answer: `Shubh Panda is a social media creative designer who designs Instagram posts, carousels, stories and campaign creatives for brands, built as one consistent system and not as one-off posts.`,
    body: [
      {
        h: 'A system for the feed, not single posts',
        p: [
          'A brand is recognised on social media when its posts share something: a colour, a type style, a way of framing a photograph. The work here starts by setting those rules, then produces posts inside them. A follower who has seen two posts should recognise the third before reading the name.',
          'The same idea is adapted for each client. Alright TV, a streaming channel, gets one colour per show. Elan Wallcovers lets large interiors lead and keeps type quiet. Stories for You, a photo album studio, uses scrapbook layouts in warm paper tones.',
        ],
      },
      {
        h: 'Instagram post design for brands',
        p: [
          'Feed posts are designed in portrait and square formats so they take up as much of a phone screen as possible. Carousel and story design follows the same system: a carousel moves from a feeling to the facts, slide by slide, and stories use a tall format for quick, everyday updates.',
          'For Vareeka, a jewellery label, a Rakhi campaign opens on a sibling moment and then shows the gift sets, bundles and offer prices in order. For Senquira, a perfume brand, the launch posts use headlines written like secrets on dark, glossy backgrounds.',
        ],
      },
      {
        h: 'Design that supports social media management',
        p: [
          'Social media management design is easier to keep up when the templates are solid. Layouts are built so that new posts can be made quickly without drifting off-brand, whether the account is run by an in-house team or an agency. Shubh has produced social creatives both as a freelancer and inside agency teams, for industries that include hospitality, jewellery, home interiors, travel, entertainment and industrial products.',
          'Beyond the featured brands, the creatives archive on this site holds more than a hundred further posts, stories and carousels for Honeymoon Inn, Jakpower, SRJ, Jovira, Terso and Unipin.',
        ],
      },
    ],
    process: [
      { label: 'BRIEF', text: 'The brand, its audience, the platforms and what the posts should make people do.' },
      { label: 'SYSTEM', text: 'Colours, type, layouts and formats for the grid, shown as a first set of sample posts.' },
      { label: 'CREATIVES', text: 'Posts, carousels and stories designed in batches inside that system.' },
      { label: 'DELIVERY', text: 'Final files sized for each platform, ready to schedule.' },
    ],
    cases: ['alright-tv', 'elan-wallcovers', 'vareeka', 'udman-square', 'stories-for-you', 'blink-brand-solutions'],
    faq: [
      { q: 'What kinds of social media creatives do you design?', a: 'Feed posts, carousels, stories, reel covers and campaign creatives for festivals, launches and offers.' },
      { q: 'Do you also write captions and manage the account?', a: 'This service is about the design of the creatives. If captions, scheduling or account management are needed, mention it in the brief and it is covered in the quote.' },
      { q: 'How many posts are included?', a: 'The number of posts and how often they are delivered is set per client. It is agreed in the quote, usually as a monthly batch.' },
      { q: 'Can you match my existing brand guidelines?', a: 'Yes. If a brand kit exists, the social system is built on it. If it does not, a simple colour and type system for the feed is defined first.' },
      { q: 'How do I start?', a: quote },
    ],
    approved: true,
  },
  {
    slug: 'packaging-design',
    label: 'Packaging',
    heading: 'Packaging Design',
    serviceType: 'Packaging design',
    keyword: 'packaging designer India',
    title: 'Packaging Designer India: Labels & Pouches',
    description: 'Packaging designer in India for food and skincare brands: jar labels, stand-up pouches and cartons, taken from concept to print-ready dieline and mockup.',
    summary: 'labels, pouches and dielines',
    answer: `Shubh Panda is a packaging designer in India who designs labels, pouches and cartons for food and skincare brands, from the first concept to a print-ready dieline.`,
    body: [
      {
        h: 'Packaging that reads from across the aisle',
        p: [
          'A pack has about a second on a shelf. In that second it has to say what the product is and why this one is different. Every project here begins with that single message, then builds the colour, illustration and type around it.',
          'For ProFoods Makhana, the message is healthy without being boring, carried by a confident yellow pouch and an illustrated farmer. For Arban Beauty, one sliced orange on a white carton says Vitamin C before any text is read.',
        ],
      },
      {
        h: 'Food packaging design and label design',
        p: [
          'Food packaging design has rules that sit beside the creative work: nutrition tables, ingredient lists, net weight, licence numbers and veg marks all need a place. Good label design plans for them from the start, so they do not crowd the front of the pack.',
          'The Croppd Honey jar shows how. Its wrap-around label was planned flat first: the story on the left, the hand-drawn wordmark up front, nutrition and legal details on the right, so nothing lands on the seam. The front stays clear for the name and the claims.',
        ],
      },
      {
        h: 'Pouch and dieline design, checked in mockup',
        p: [
          'Pouch and dieline design means laying artwork out on the flat template a printer uses, with every face, fold and seal accounted for. Milletopia’s 200 g stand-up pouches were built this way as a range: one layout, one wordmark in English and Hindi, and a different colour for each recipe.',
          'Before anything is sent to print, the design is checked as a mockup, alone in a studio shot and lined up on a store shelf, because a pack that works by itself can still disappear in a row. Each packaging case study on this site shows the flat artwork next to those views.',
        ],
      },
    ],
    process: [
      { label: 'BRIEF', text: 'The product, the buyer, the pack format and size, and the information the pack must carry.' },
      { label: 'CONCEPT', text: 'One clear idea for the shelf, with colour, illustration and type directions.' },
      { label: 'DIELINE', text: 'Artwork laid out on the pack template, including nutrition, ingredients and legal panels.' },
      { label: 'ON SHELF', text: 'Mockups in studio and in store to test the pack before the print files are released.' },
    ],
    cases: ['croppd-honey', 'profoods-makhana', 'milletopia', 'arban-beauty'],
    faq: [
      { q: 'What types of packaging do you design?', a: 'Jar and bottle labels, stand-up and snack pouches, and cartons. The projects on this site cover honey, makhana snacks, ready-to-eat millet foods and skincare.' },
      { q: 'Do you provide print-ready files?', a: 'Artwork is prepared on the dieline, the flat template used for printing. The file format your printer needs is confirmed with the quote.' },
      { q: 'Do I need a dieline before starting?', a: 'If your printer or pack supplier has a dieline, share it. If the format is still open, that is settled first, since the artwork is built to its exact size.' },
      { q: 'Can you design a full range of products?', a: 'Yes. Ranges are designed as a system, with a fixed layout and a colour or image that changes per variant, as with the Milletopia pouches.' },
      { q: 'How do I get a quote for packaging design?', a: quote },
    ],
    approved: true,
  },
  {
    slug: 'streetwear-design',
    label: 'Streetwear',
    heading: 'Streetwear Design',
    serviceType: 'Streetwear t-shirt graphic design',
    keyword: 'streetwear t-shirt graphic designer',
    title: 'Streetwear T-Shirt Graphic Designer, India',
    description: 'Streetwear t-shirt graphic designer: custom tee graphics and front and back print artwork for streetwear brands, prepared for white and black tees.',
    summary: 't-shirt graphics and front and back print artwork',
    answer: `Shubh Panda is a streetwear t-shirt graphic designer who creates custom tee graphics and front and back print artwork for streetwear brands.`,
    body: [
      {
        h: 'Graphics first',
        p: [
          'In streetwear the graphic is the product. The cotton just carries it. A tee sells because of what is printed on it, so the work here treats each design as a finished piece of artwork with its own title, type and attitude.',
          'The collection on this site has ten designs, among them Fallen Angels, Money Talk, In Glock We Trust, Don’t Kill My Vibe and Wasted. They lean on loud type, collage and rough, hand-made texture.',
        ],
      },
      {
        h: 'Custom tee graphic design, front and back',
        p: [
          'Custom tee graphic design has to respect the garment. A chest print and a full back print are different sizes with different jobs: the front is read face to face, the back is read from behind, across a street. Front and back print design here is planned as a pair, usually a small mark on the front and a large statement piece on the back.',
          'Each graphic is prepared on a white or black sheet to match the tee it will print on, since colours that work on white fabric can sink into black, and the other way round.',
        ],
      },
      {
        h: 'Streetwear brand artwork, shown on the body',
        p: [
          'Streetwear brand artwork is judged on a person, not on a flat mock. Every design in the collection is shown on a model, so the scale and placement of the print can be checked where it will actually be worn. The case study lists each design with its print type and tee colour, and each design has its own page with the artwork behind the print.',
          'The same eye for type and texture runs through the rest of this portfolio, from brand identities to social media campaigns, so a streetwear label can extend its graphics into a logo, packaging or a launch feed with the same designer.',
        ],
      },
    ],
    process: [
      { label: 'BRIEF', text: 'The label, its audience, the theme of the drop and the tee colours it will print on.' },
      { label: 'CONCEPT', text: 'Titles, type directions and rough layouts for each graphic.' },
      { label: 'ARTWORK', text: 'Finished front and back artwork, prepared separately for light and dark tees.' },
      { label: 'ON MODEL', text: 'Each design placed on a model to check size and position before it goes to print.' },
    ],
    cases: ['streetwear', 'senquira', 'alright-tv'],
    faq: [
      { q: 'What do you design for streetwear brands?', a: 'T-shirt graphics: front prints, back prints and matched front and back sets, built as finished artwork for each design.' },
      { q: 'Can you design both a front and a back print?', a: 'Yes. Half of the designs in this collection are front and back sets, planned together so the two prints belong to each other.' },
      { q: 'Do you prepare artwork for both white and black tees?', a: 'Yes. Artwork is prepared for the tee colour it will print on, because the same colours behave differently on light and dark fabric.' },
      { q: 'Which file format will I receive for printing?', a: 'It depends on how the tees are printed. The format your printer needs is confirmed with the quote.' },
      { q: 'How do I commission a tee graphic?', a: quote },
    ],
    approved: true,
  },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);

/* ── About ── */

export const about = {
  title: 'About Shubh Panda: Graphic Designer Since 2020',
  description: `About Shubh Panda, graphic designer and web developer ${inPlace()}, designing since ${site.since} for cafés, restaurants and growing brands.`,
  heading: 'About Shubh Panda',
  answer: `Shubh Panda is a graphic designer, web developer and brand manager based in ${place()}, who has been designing since ${site.since} and works with cafés, restaurants and growing brands across India.`,
  body: [
    {
      h: 'A designer who also builds',
      p: [
        'Shubh Panda is a multidisciplinary graphic designer with more than four years of experience building visual identities, campaigns and digital experiences. His work spans branding, brand strategy, social media, advertising, packaging, e-commerce, web UI and UX, and motion graphics.',
        'He is also a web developer. The websites in this portfolio were designed and coded by the same person, in React, Next.js and WordPress, which is why the motion and detail of each design survive into the live site. As a brand manager he looks after how a brand shows up after the launch too: on shelves, in feeds and on screens.',
      ],
    },
    {
      h: 'Experience since 2020',
      p: [
        `Shubh has been a designer since ${site.since}. He has worked with Kangaroo Agency, a social media agency managing brands across India, the United States and Australia, and with Quinite Technologies, and he takes on freelance projects directly with business owners.`,
        'Freelance clients on this site include Senquira (luxury perfume), Do Bhaion Ki Dukan (ethnic wear), Swaroop Realty (real estate in Vrindavan), Chemist Box (a pharmacy chain), Ghoomar Thali (a Rajasthani restaurant chain), Aura Rosetry (a café in Mumbai), That Coffee, Origanimo and Croppd Honey.',
      ],
    },
    {
      h: 'Tools and method',
      p: [
        'Day to day he works in Adobe Photoshop, Illustrator, InDesign and Premiere Pro, with Figma for interface design and CapCut for short-form video. On the web he builds with React, GSAP, Lenis and Framer Motion.',
        'He also works extensively with AI-driven creative tools, from image and video generation to prompt engineering, ControlNet and LoRA training, and combines them with conventional design craft to explore ideas quickly. For him, design is not only about making things look good. It is about creating a visual world people remember.',
      ],
    },
    {
      h: 'Working together',
      p: [
        `Shubh is based in ${place()} and works with clients in ${site.serves.map((s) => s.city).join(' and ')} and across India by email and phone. A project starts with a short brief and a quote, and one person stays responsible for it from the first sketch to the final file.`,
      ],
    },
  ],
  approved: true,
};
