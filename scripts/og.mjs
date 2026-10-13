/**
 * Open Graph images, one 1200 × 630 PNG per indexable page, in the site's own style:
 * paper with grain, the title in red Anton, the page's lead image, SHUBH PANDA in Space Mono.
 * Called by scripts/prerender.mjs; fonts are fetched once and cached in node_modules/.cache.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const CACHE = path.join(process.cwd(), 'node_modules/.cache/og-fonts');
const FONTS = [
  { name: 'Anton', weight: 400, file: 'Anton-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf' },
  { name: 'Space Mono', weight: 400, file: 'SpaceMono-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Regular.ttf' },
  { name: 'Space Mono', weight: 700, file: 'SpaceMono-Bold.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Bold.ttf' },
];

async function loadFonts() {
  fs.mkdirSync(CACHE, { recursive: true });
  const out = [];
  for (const f of FONTS) {
    const file = path.join(CACHE, f.file);
    if (!fs.existsSync(file)) {
      const res = await fetch(f.url);
      if (!res.ok) throw new Error(`font ${f.file}: HTTP ${res.status}`);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    out.push({ name: f.name, weight: f.weight, style: 'normal', data: fs.readFileSync(file) });
  }
  return out;
}

/** Paper with the same kind of grain the site lays over everything */
async function paper(color) {
  const noise = Buffer.alloc(W * H * 4);
  let seed = 7;
  for (let i = 0; i < W * H; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = seed >>> 24;
    noise[i * 4] = noise[i * 4 + 1] = noise[i * 4 + 2] = v < 128 ? 0 : 255;
    noise[i * 4 + 3] = 9;
  }
  return sharp({ create: { width: W, height: H, channels: 4, background: color } })
    .composite([{ input: noise, raw: { width: W, height: H, channels: 4 } }])
    .png()
    .toBuffer();
}

const h = (type, style, children, props = {}) => ({ type, props: { style, children, ...props } });

/**
 * @param {{ slug: string, title: string, kicker: string, image?: string }[]} items  `image` is a path under public/
 * @param {{ outDir: string, publicDir: string, name: string, host: string, paper: string }} opts
 */
export async function buildOg(items, opts) {
  const { default: satori } = await import('satori');
  const fonts = await loadFonts();
  const bg = await paper(opts.paper);
  fs.mkdirSync(opts.outDir, { recursive: true });

  for (const item of items) {
    let picture = null;
    const file = item.image && path.join(opts.publicDir, item.image);
    if (file && fs.existsSync(file)) {
      const buf = await sharp(file).resize(440, 518, { fit: 'cover', position: 'attention' }).flatten({ background: opts.paper }).png().toBuffer();
      picture = `data:image/png;base64,${buf.toString('base64')}`;
    }
    const size = item.title.length > 34 ? 68 : item.title.length > 22 ? 86 : 112;
    const tree = h('div', { width: W, height: H, display: 'flex', padding: 56, gap: 48, color: '#0D0D0D', fontFamily: 'Space Mono' }, [
      h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, flexBasis: 0 }, [
        h('div', { display: 'flex', fontSize: 22, letterSpacing: 4, color: '#FF2B1C' }, item.kicker.toUpperCase()),
        h('div', { display: 'flex', fontFamily: 'Anton', fontSize: size, lineHeight: 0.98, color: '#FF2B1C', textTransform: 'uppercase' }, item.title),
        h('div', { display: 'flex', flexDirection: 'column', gap: 6 }, [
          h('div', { display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: 5 }, opts.name.toUpperCase()),
          h('div', { display: 'flex', fontSize: 19, letterSpacing: 2, opacity: 0.65 }, opts.host),
        ]),
      ]),
      ...(picture
        ? [h('div', { display: 'flex', width: 446, height: 518, border: '3px solid #0D0D0D', borderRadius: 18, overflow: 'hidden', boxShadow: '8px 8px 0 #0D0D0D' }, [h('img', { width: 440, height: 518, objectFit: 'cover' }, undefined, { src: picture, width: 440, height: 518 })])]
        : []),
    ]);
    const svg = await satori(tree, { width: W, height: H, fonts });
    await sharp(bg)
      .composite([{ input: Buffer.from(svg) }])
      .png({ compressionLevel: 9, palette: false })
      .toFile(path.join(opts.outDir, `${item.slug}.png`));
  }
  return items.length;
}
