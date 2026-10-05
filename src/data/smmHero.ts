/**
 * The 4 posts shown in each SMM brand's fan, left to right.
 * Post 2 (index 1) is the one sitting on the phone screen.
 * Paths come from src/data/smm.manifest.json — swap freely.
 */
export const smmHero: Record<string, string[]> = {
  // Show posters: blue drama, yellow "green flag", pink romance, sepia thriller
  'alright-tv': [
    '/assets/smm/alright-tv/post-01.webp',
    '/assets/smm/alright-tv/post-06.webp',
    '/assets/smm/alright-tv/post-04.webp',
    '/assets/smm/alright-tv/post-02.webp',
  ],
  // Beige "Walls Matters", orange/magenta drapes, blue poolside, green textures
  'elan-wallcovers': [
    '/assets/smm/elan-wallcovers/post-01.webp',
    '/assets/smm/elan-wallcovers/post-02.webp',
    '/assets/smm/elan-wallcovers/post-04.webp',
    '/assets/smm/elan-wallcovers/post-03.webp',
  ],
  // Rakhi carousel: "swipe" cover, the sibling shot, product close-up, bundle offer
  vareeka: [
    '/assets/smm/vareeka/post-04.webp',
    '/assets/smm/vareeka/post-01.webp',
    '/assets/smm/vareeka/post-02.webp',
    '/assets/smm/vareeka/post-03.webp',
  ],
  // Mono/gold banquet, red chandelier entrance, cream collage, white collage
  'udman-square': [
    '/assets/smm/udman-square/post-04.webp',
    '/assets/smm/udman-square/post-02.webp',
    '/assets/smm/udman-square/post-03.webp',
    '/assets/smm/udman-square/post-05.webp',
  ],
  // Gold martini cover, pale "Perfume Crimes", red/gold split, warm leather
  senquira: [
    '/assets/smm/senquira/post-01.webp',
    '/assets/smm/senquira/post-04.webp',
    '/assets/smm/senquira/post-05.webp',
    '/assets/smm/senquira/post-02.webp',
  ],
  // Only 3 posts exist — the 4th is a story whose centre crop still reads
  'stories-for-you': [
    '/assets/smm/stories-for-you/post-01.webp',
    '/assets/smm/stories-for-you/post-02.webp',
    '/assets/smm/stories-for-you/post-03.webp',
    '/assets/smm/stories-for-you/story-05.webp',
  ],
  // Taiwan carousel, slides 1–4 in order
  'blink-brand-solutions': [
    '/assets/smm/blink-brand-solutions/post-01.webp',
    '/assets/smm/blink-brand-solutions/post-02.webp',
    '/assets/smm/blink-brand-solutions/post-03.webp',
    '/assets/smm/blink-brand-solutions/post-04.webp',
  ],
};

/**
 * Card ratio (width / height) used for each brand's fan, taken from the
 * natural size of its hero images: 1 = square (1350×1350), 0.8 = 4:5 (1080×1350).
 * Brands not listed fall back to 4:5.
 */
export const smmHeroRatio: Record<string, number> = {
  'alright-tv': 0.8,
  'elan-wallcovers': 0.8,
  vareeka: 1,
  'udman-square': 0.8,
  senquira: 0.8,
  'stories-for-you': 0.8,
  'blink-brand-solutions': 1,
};
