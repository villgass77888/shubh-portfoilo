/* ═══════════════════════════════════════════════════
   CREATIVES ARCHIVE — wording
   Everything a visitor reads in the "EXPLORE ALL CREATIVES" overlay lives here, so it can be
   edited without touching the generated data (src/data/archive.generated.json).
   ═══════════════════════════════════════════════════ */

export const archiveContent = {
  trigger: {
    title: 'EXPLORE ALL CREATIVES',
    subtitle: 'There’s more I got.',
    sticker: '+100 MORE',
  },

  menuTitle: 'SOCIAL MEDIA CREATIVES',

  /**
   * Brand pages. `about` is 2–3 sentences, max 60 words.
   * aboutTodo: true = written only from what the creatives show; replace with the real brief
   * and delete the flag. `color` overrides the colour the build samples from the creatives
   * (the sampler lands on warm skin and gold tones for most of these, so each brand's own
   * colour is set by hand here; delete a line to fall back to the sampled one).
   */
  brands: {
    'honeymoon-inn': {
      name: 'Honeymoon Inn',
      color: '#C1272D',
      about:
        'Story sets for Honeymoon Inn, a hotel brand with stays in Manali, Mussoorie and Shimla. Each pair is a two-tap story: a question first, the room rates and the offer second. Mountain photography, stamps and torn-paper edges keep it feeling like a postcard.',
      aboutTodo: true,
    },
    jakpower: {
      name: 'Jakpower',
      color: '#0F5FA8',
      about:
        'Feed and LinkedIn posts for Jakpower (Jakson & Company), carrying Kirloskar pumps. Product posts with technical specs, sustainability messages and event coverage, from an eye-test camp to a hotel managers’ meet. One clean blue-and-teal system holds products and people together.',
      aboutTodo: true,
    },
    srj: {
      name: 'SRJ',
      color: '#4B1D5E',
      about:
        'Posts, stories and carousels for SRJ Jewellers, a gold jewellery house in Bilaspur. Bridal looks, product posts with weight and price, festival greetings, customer testimonials, and explainers on karat, hallmark and HUID, written in Hindi and dressed in royal purple, maroon and gold.',
      aboutTodo: true,
    },
    jovira: {
      name: 'Jovira',
      color: '#9A5B66',
      about:
        'Six offer ads for Jovira jewellery. Each one stages a small set of pieces on its own backdrop, from blush silk to deep navy and olive, with the discount set in tall serif type so the offer reads before the thumb moves on.',
      aboutTodo: true,
    },
    terso: {
      name: 'Terso',
      color: '#B26B2A',
      about:
        'Ad sets and story ads for Terso, a sweat-control range: an antiperspirant stick, a hand cream and a lotion. Warm beige studio shots carry short question-and-answer lines that explain the difference between smelling fresh and staying dry.',
      aboutTodo: true,
    },
    unipin: {
      name: 'Unipin',
      color: '#E8590C',
      about:
        'Stories, carousels and reel covers for UniPin, a top-up platform for games. Giveaway announcements, quiz stories for its 15th year and a Spider-Man carousel about topping up BGMI UC and Valorant VP, all in loud orange with the game art up front.',
      aboutTodo: true,
    },
  } as Record<string, { name: string; about: string; aboutTodo?: boolean; color?: string }>,

  flyers: {
    intro: 'Large-format print. Flyers and billboards built to land from across the street.',
    /** Titles are matched on a part of the original file name. */
    titles: [
      { match: 'fallen', title: 'Fallen Angels' },
      { match: 'go kart', title: 'Go Kart' },
      { match: 'billboard-2', title: 'Brij Garden, Plots | Villas' },
      { match: 'billboard', title: 'Brij Garden, Plots & Villas' },
      { match: 'hydration', title: 'Hydration Upgraded' },
      { match: 'artboard 2', title: 'Independence Day Special' },
    ],
  },

  emailers: {
    intro: 'Emailers made to be read on the way down.',
    /** Keyed by the emailer's slug (its file name). Subject: max 8 words, from what the emailer shows. */
    items: {
      'emailer-honeymoon-inn': { from: 'Honeymoon Inn', subject: 'Your mountain getaway begins when you board' },
      newsletter: { from: 'Travel Newsletter', subject: 'Why Taiwan should be on your travel list' },
    } as Record<string, { from: string; subject: string }>,
  },

  brochures: {
    intro: 'Brochures, decks and guidelines. Pull one off the shelf and flip through.',
    names: {
      'brij-garden': 'Brij Garden, Swaroop Realty',
      'kangaroo-agency': 'Kangaroo Agency',
      'organic-miles': 'Organic Miles',
      'quinite-group': 'Quinite Group',
      'dj-abhishek-bhatia': 'DJ Abhishek Bhatia',
      'pioneer-araya-the-54': 'Pioneer Araya — The 54',
      'tower-ii': 'Tower II',
      edulogix: 'Edulogix',
      'orange-mouse': 'Orange Mouse',
      'friday-intel': 'Friday Intel',
      'maison-aditi': 'Maison Aditi',
    } as Record<string, string>,
  },
};
