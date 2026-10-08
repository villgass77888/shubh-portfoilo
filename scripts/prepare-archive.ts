/**
 * SMM Creatives Archive assets (the "EXPLORE ALL CREATIVES" overlay).
 *
 * Reads raw-assets/smm-archive/ (six brand folders, Flyers/, Emailer/, Brochures/) and writes
 * optimised files to public/assets/archive/ plus the generated manifest
 * src/data/archive.generated.json (sizes, placeholders, sampled colours, carousel groups, pages).
 *
 * Run on its own:  npx tsx scripts/prepare-archive.ts
 * It is also called at the end of scripts/prepare-assets.ts. Safe to re-run: a source that has
 * not changed since the last run (same size + date, outputs still on disk) is skipped.
 * No original file is ever copied to public/.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const RAW = path.join(process.cwd(), 'raw-assets/smm-archive');
const OUT = path.join(process.cwd(), 'public/assets/archive');
const DATA = path.join(process.cwd(), 'src/data/archive.generated.json');
const CACHE = path.join(RAW, '.cache.json');
const REPORT = path.join(RAW, 'report.log');
const URL_BASE = '/assets/archive';

type ImgType = 'post' | 'story' | 'reel-cover' | 'banner';

type BrandConfig = {
  dir: string;
  slug: string;
  /** Explicit carousels, by file name without extension, in slide order. Win over the automatic grouping. */
  groups?: string[][];
  /** Files that must stay single tiles even though their names share a stem ('all' = never group). */
  singles?: string[] | 'all';
};

/* Menu order. The overrides exist where the file names alone would group the wrong things. */
const BRANDS: BrandConfig[] = [
  { dir: 'Honeymoon Inn', slug: 'honeymoon-inn' },
  { dir: 'Jakpower', slug: 'jakpower', singles: ['post-1', 'Post-2'] },
  {
    dir: 'SRJ',
    slug: 'srj',
    groups: [
      ['cover', 'bridal-slide  (1)', 'bridal-slide  (2)', 'bridal-slide  (3)', 'bridal-slide  (4)', 'bridal-slide  (5)', 'bridal-slide  (6)'],
      ['testimonial cover', 'testimonial-post-1', 'testimonial-post-3', 'testimonial-post-4', 'testimonial-post-5'],
      ['14', '15', '17'],
      ['12', '13'],
      ['20', '19'],
      ['gold ki sudhta slide 1- wb', 'huid'],
      ['side', 'necklace'],
      ['8.2v2', '8.2v3'],
      ['1 (1)', '1.2', '1'],
      ['story-5.1', 'story-5.2', 'story-5.3'],
      ['jewellery-detailed-craftmanship', 'jewellery-polising-and-designing-thing'],
    ],
    singles: ['story-5.3 (1)'],
  },
  { dir: 'Jovira', slug: 'jovira', singles: 'all' },
  { dir: 'Terso', slug: 'terso', singles: ['story-ad-1', 'story-ad-2'] },
  {
    dir: 'Unipin',
    slug: 'unipin',
    groups: [
      ['Untitled-1Artboard-1', 'Untitled-1Artboard-2_1', 'Untitled-1Artboard-2_2', 'Untitled-1Artboard-2_3', 'Untitled-1Artboard-3', 'Untitled-1Artboard-4'],
      ['sl1', 'sl2', 'sl3'],
      ['1', '2', 'story 1 copy 2'],
      ['Artboard 1 copy 2', 'story  (1)'],
    ],
    singles: ['reel cover  (2)', 'reel cover  (3)', 'story  (3)'],
  },
];

/** Flyers page order (matched on a part of the file name). Anything not listed follows, by date. */
const FLYER_ORDER = ['fallen', 'go kart', 'billboard.', 'hydration', 'artboard 2', 'billboard-2'];

type BrochureConfig = { match: string; slug: string; kind?: 'book' | 'gatefold' | 'scroll' };

/* Shelf order. Files are matched on a part of their name (several have double / trailing spaces). */
const BROCHURES: BrochureConfig[] = [
  { match: 'brij garden', slug: 'brij-garden', kind: 'gatefold' },
  { match: 'kangaroo', slug: 'kangaroo-agency' },
  { match: 'organic miles', slug: 'organic-miles' },
  { match: 'quinite', slug: 'quinite-group' },
  { match: 'abhishek', slug: 'dj-abhishek-bhatia' },
  { match: 'pioneer araya', slug: 'pioneer-araya-the-54' },
  { match: 'tower ii', slug: 'tower-ii' },
  // five very tall pages (a long-scroll product sheet), not a book
  { match: 'edulogix', slug: 'edulogix', kind: 'scroll' },
  { match: 'orange mouse', slug: 'orange-mouse' },
  { match: 'friday intel', slug: 'friday-intel' },
  { match: 'maison aditi', slug: 'maison-aditi' },
];

/* ───────────────────────── helpers ───────────────────────── */

const report: string[] = [];
const note = (line: string) => {
  report.push(line);
  console.log(`  ! ${line}`);
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const stripExt = (f: string) => f.replace(/\.[a-z0-9]+$/i, '');
const norm = (s: string) => s.toLowerCase().replace(/[\s._-]+/g, ' ').trim();
const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const sigOf = (file: string) => {
  const st = fs.statSync(file);
  return `${st.size}:${Math.round(st.mtimeMs)}`;
};
const input = (src: string | Buffer, raw?: sharp.Raw) =>
  sharp(src as never, { limitInputPixels: false, ...(raw ? { raw } : {}) });

type Cache = { images: Record<string, { sig: string; entry: Processed }>; brochures: Record<string, { sig: string; entry: unknown }> };
const cache: Cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { images: {}, brochures: {} };
const saveCache = () => fs.writeFileSync(CACHE, JSON.stringify(cache));

type Variant = { w: number; h: number; url: string };
type Processed = {
  file: string;
  w: number;
  h: number;
  lqip: string;
  variants: Variant[];
  /** 64-bit difference hash, hex */
  hash: string;
  /** weight per hue bin + its summed colour, for the brand colour */
  hues: number[][];
  mtime: number;
};

const urlToFile = (url: string) => path.join(process.cwd(), 'public', url);

/** Target widths ≤ the source, dropping a step that is within 15% of the one above it. */
function pickWidths(srcW: number, steps: number[]): number[] {
  const out = steps.filter((w) => w <= srcW);
  if (!out.length || srcW > out[out.length - 1] * 1.15) out.push(Math.min(srcW, steps[steps.length - 1]));
  return [...new Set(out)].sort((a, b) => a - b);
}

async function lqipOf(img: sharp.Sharp, width = 24): Promise<string> {
  const buf = await img.clone().resize({ width }).webp({ quality: 35, effort: 6 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function dhash(img: sharp.Sharp): Promise<string> {
  const d = await img.clone().greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += d[y * 9 + x] > d[y * 9 + x + 1] ? '1' : '0';
  return BigInt('0b' + bits).toString(16).padStart(16, '0');
}
const hamming = (a: string, b: string) => {
  let x = BigInt('0x' + a) ^ BigInt('0x' + b);
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
};

/** 24 hue bins: [weight, r·w, g·w, b·w]; weight favours saturated, not-too-dark pixels. */
async function hueBins(img: sharp.Sharp): Promise<number[][]> {
  const d = await img.clone().resize(32, 32, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  const bins = Array.from({ length: 24 }, () => [0, 0, 0, 0]);
  for (let i = 0; i < d.length; i += 3) {
    const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.25 || max < 50) continue;
    let h = 0;
    if (max !== min) {
      if (max === r) h = ((g - b) / (max - min) + 6) % 6;
      else if (max === g) h = (b - r) / (max - min) + 2;
      else h = (r - g) / (max - min) + 4;
    }
    const w = sat * sat * (max / 255);
    const bin = bins[Math.min(23, Math.floor((h / 6) * 24))];
    bin[0] += w;
    bin[1] += r * w;
    bin[2] += g * w;
    bin[3] += b * w;
  }
  return bins.map((b) => b.map((v) => Math.round(v * 100) / 100));
}

/** The dominant saturated colour of a set of images, deepened so white type reads on it. */
function brandColor(all: number[][][]): string {
  const sum = Array.from({ length: 24 }, () => [0, 0, 0, 0]);
  for (const bins of all) bins.forEach((b, i) => b.forEach((v, k) => (sum[i][k] += v)));
  // smooth over neighbours so one hue split across two bins still wins
  let best = 0;
  let bestW = -1;
  for (let i = 0; i < 24; i++) {
    const w = sum[i][0] + 0.5 * (sum[(i + 1) % 24][0] + sum[(i + 23) % 24][0]);
    if (w > bestW) {
      bestW = w;
      best = i;
    }
  }
  const b = sum[best];
  if (!b[0]) return '#0D0D0D';
  let [r, g, bl] = [b[1] / b[0], b[2] / b[0], b[3] / b[0]];
  // keep the hue, deepen it until white type reads on it (relative luminance ≤ 0.2)
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = () => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
  for (let i = 0; i < 40 && lum() > 0.2; i++) [r, g, bl] = [r * 0.96, g * 0.96, bl * 0.96];
  return hex(r, g, bl);
}

type SizeRule = { steps: number[]; by: 'width' | 'long'; webp: number; avif: number };
const RULE_BRAND: SizeRule = { steps: [600, 1000, 1600, 2400], by: 'width', webp: 78, avif: 50 };
const RULE_FLYER: SizeRule = { steps: [1000, 1600, 2400, 3200], by: 'long', webp: 80, avif: 52 };
const RULE_EMAIL: SizeRule = { steps: [720, 1440], by: 'width', webp: 82, avif: 55 };

/** One source image → AVIF + WebP at every width, a placeholder, a hash and hue bins. */
async function processImage(srcFile: string, outDir: string, name: string, rule: SizeRule): Promise<Processed> {
  const rel = path.relative(RAW, srcFile).replace(/\\/g, '/');
  const sig = `${sigOf(srcFile)}:${rule.steps.join(',')}:${name}`;
  const hit = cache.images[rel];
  if (hit && hit.sig === sig && hit.entry.variants.every((v) => fs.existsSync(urlToFile(v.url)) && fs.existsSync(urlToFile(v.url.replace(/\.webp$/, '.avif'))))) {
    return hit.entry;
  }

  console.log(`Processing: ${rel}`);
  const meta = await input(srcFile).metadata();
  const W = meta.width ?? 1;
  const H = meta.height ?? 1;
  // decode the (sometimes 135-megapixel) source once, at the largest size that is needed
  const long = Math.max(W, H);
  const top = rule.by === 'width' ? Math.min(W, rule.steps[rule.steps.length - 1]) : Math.round((Math.min(long, rule.steps[rule.steps.length - 1]) / long) * W);
  const { data, info } = await input(srcFile).rotate().resize({ width: top }).flatten({ background: '#ffffff' }).toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  const base = () => input(data, { width: info.width, height: info.height, channels: info.channels });

  const widths =
    rule.by === 'width'
      ? pickWidths(info.width, rule.steps)
      : pickWidths(Math.max(info.width, info.height), rule.steps).map((l) => Math.round((l / Math.max(info.width, info.height)) * info.width));

  fs.mkdirSync(outDir, { recursive: true });
  const variants: Variant[] = [];
  for (const w of widths) {
    const h = Math.round((w / info.width) * info.height);
    const url = `${URL_BASE}/${path.relative(OUT, outDir).replace(/\\/g, '/')}/${name}-${w}.webp`;
    const resized = base().resize({ width: w });
    await resized.clone().webp({ quality: rule.webp, effort: 5 }).toFile(urlToFile(url));
    await resized.clone().avif({ quality: rule.avif, effort: 4 }).toFile(urlToFile(url.replace(/\.webp$/, '.avif')));
    variants.push({ w, h, url });
  }

  const entry: Processed = {
    file: path.basename(srcFile),
    w: info.width,
    h: info.height,
    lqip: await lqipOf(base()),
    variants,
    hash: await dhash(base()),
    hues: await hueBins(base()),
    mtime: Math.round(fs.statSync(srcFile).mtimeMs),
  };
  cache.images[rel] = { sig, entry };
  saveCache();
  return entry;
}

const toImage = (p: Processed, type: ImgType) => {
  // the grid's default candidate: the one closest to 1000px wide
  const main = p.variants.reduce((a, b) => (Math.abs(b.w - 1000) < Math.abs(a.w - 1000) ? b : a));
  return {
    src: main.url,
    srcset: p.variants.map((v) => `${v.url} ${v.w}w`).join(', '),
    w: p.w,
    h: p.h,
    lqip: p.lqip,
    type,
    file: p.file,
  };
};

const IMG_RE = /\.(png|jpe?g|webp)$/i;
const listImages = (dir: string) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => IMG_RE.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    : [];

function typeOf(file: string, w: number, h: number): ImgType {
  const ar = w / h;
  if (ar > 1.6) return 'banner';
  if (/reel/i.test(file)) return 'reel-cover';
  return ar < 0.62 ? 'story' : 'post';
}

/** "Post-3.1" → { key: "post 3", n: 1 }: the stem and the trailing .N / _N / -N / (N) / -cover part. */
function seriesOf(file: string): { key: string; n: number } | null {
  const base = stripExt(file).trim();
  let m: RegExpExecArray | null;
  if ((m = /^(.+?)[\s._-]*cover$/i.exec(base)) && /[\s._-]cover$/i.test(base)) return { key: norm(m[1]), n: 0 };
  if ((m = /^(.+?)\s*\((\d+)\)$/.exec(base))) return { key: norm(m[1]), n: Number(m[2]) };
  if ((m = /^(.+)[._-](\d+)$/.exec(base))) return { key: norm(m[1]), n: Number(m[2]) };
  return null;
}

/* ───────────────────────── brands ───────────────────────── */

async function prepareBrand(cfg: BrandConfig) {
  const dir = path.join(RAW, cfg.dir);
  const files = listImages(dir);
  if (!files.length) {
    note(`${cfg.dir}: folder missing or empty`);
    return null;
  }

  const used = new Set<string>();
  const done: Processed[] = [];
  for (const f of files) {
    let name = slugify(stripExt(f));
    while (used.has(name)) name += '-b';
    used.add(name);
    done.push(await processImage(path.join(dir, f), path.join(OUT, cfg.slug), name, RULE_BRAND));
  }

  // duplicates: pixel-identical files are dropped, near-identical ones are only reported
  const keep: Processed[] = [];
  for (const p of done) {
    const twin = keep.find((k) => k.w === p.w && k.h === p.h && hamming(k.hash, p.hash) === 0);
    if (twin) {
      note(`${cfg.dir}: "${p.file}" is identical to "${twin.file}" — kept one`);
      continue;
    }
    const near = keep.find((k) => hamming(k.hash, p.hash) <= 3);
    if (near) note(`${cfg.dir}: "${p.file}" looks very close to "${near.file}" — kept both`);
    keep.push(p);
  }

  const byBase = new Map(keep.map((p) => [norm(stripExt(p.file)), p]));
  const taken = new Set<Processed>();
  const groups: Processed[][] = [];

  for (const g of cfg.groups ?? []) {
    const members = g.map((n) => byBase.get(norm(n))).filter((p): p is Processed => !!p && !taken.has(p));
    if (members.length !== g.length) note(`${cfg.dir}: explicit group [${g.join(', ')}] matched ${members.length}/${g.length} files`);
    if (members.length) {
      members.forEach((p) => taken.add(p));
      groups.push(members);
    }
  }

  const single = new Set(cfg.singles === 'all' ? [] : (cfg.singles ?? []).map(norm));
  const series = new Map<string, { p: Processed; n: number }[]>();
  for (const p of keep) {
    if (taken.has(p)) continue;
    const s = cfg.singles === 'all' || single.has(norm(stripExt(p.file))) ? null : seriesOf(p.file);
    if (!s || !s.key) {
      groups.push([p]);
      continue;
    }
    if (!series.has(s.key)) series.set(s.key, []);
    series.get(s.key)!.push({ p, n: s.n });
  }
  for (const list of series.values()) groups.push(list.sort((a, b) => a.n - b.n).map((x) => x.p));

  const rank: Record<ImgType, number> = { post: 0, story: 1, 'reel-cover': 2, banner: 3 };
  // newest first, by day: files saved in one sitting keep their name order
  const day = (ms: number) => Math.floor(ms / 86_400_000);
  const items = groups
    .map((g) => {
      const images = g.map((p) => toImage(p, typeOf(p.file, p.w, p.h)));
      return { images, rank: rank[images[0].type], mtime: Math.max(...g.map((p) => p.mtime)) };
    })
    .sort((a, b) => a.rank - b.rank || day(b.mtime) - day(a.mtime) || a.images[0].file.localeCompare(b.images[0].file, undefined, { numeric: true }))
    .map(({ images }) => (images.length > 1 ? { kind: 'carousel' as const, images } : { kind: 'single' as const, image: images[0] }));

  return { slug: cfg.slug, color: brandColor(keep.map((p) => p.hues)), count: keep.length, items };
}

/* ───────────────────────── flyers + emailers ───────────────────────── */

async function prepareFlyers() {
  const dir = path.join(RAW, 'Flyers');
  const done: Processed[] = [];
  for (const f of listImages(dir)) {
    done.push(await processImage(path.join(dir, f), path.join(OUT, 'flyers'), slugify(stripExt(f).replace(/^copy of /i, '')), RULE_FLYER));
  }
  const pos = (p: Processed) => {
    const i = FLYER_ORDER.findIndex((k) => p.file.toLowerCase().includes(k));
    return i < 0 ? FLYER_ORDER.length : i;
  };
  return done.sort((a, b) => pos(a) - pos(b) || b.mtime - a.mtime).map((p) => toImage(p, p.w / p.h > 1.3 ? 'banner' : 'post'));
}

async function prepareEmailers() {
  const dir = path.join(RAW, 'Emailer');
  const out = [];
  for (const f of listImages(dir)) {
    const slug = slugify(stripExt(f));
    const p = await processImage(path.join(dir, f), path.join(OUT, 'emailers'), slug, RULE_EMAIL);
    if (p.h > 8000) note(`Emailer "${f}" is taller than 8000px at full size — it is shipped as one image`);
    out.push({ slug, image: toImage(p, 'post') });
  }
  return out;
}

/* ───────────────────────── brochures ───────────────────────── */

type PageOut = { src: string; hi: string; w: number; h: number; lqip: string };

async function writePage(raw: { data: Buffer; width: number; height: number }, crop: { left: number; width: number } | null, outDir: string, name: string, sizes: [number, number], by: 'long' | 'width'): Promise<PageOut> {
  let img = input(raw.data, { width: raw.width, height: raw.height, channels: 3 });
  let w = raw.width;
  if (crop) {
    img = img.extract({ left: crop.left, top: 0, width: crop.width, height: raw.height });
    w = crop.width;
  }
  const buf = await img.raw().toBuffer();
  const base = () => input(buf, { width: w, height: raw.height, channels: 3 });
  const long = Math.max(w, raw.height);
  const out: string[] = [];
  for (const s of sizes) {
    const width = by === 'width' ? Math.min(s, w) : Math.round((Math.min(s, long) / long) * w);
    const url = `${URL_BASE}/brochures/${path.basename(outDir)}/${name}-${s}.webp`;
    await base().resize({ width }).webp({ quality: s === sizes[0] ? 76 : 72, effort: 5 }).toFile(urlToFile(url));
    out.push(url);
  }
  return { src: out[0], hi: out[1], w, h: raw.height, lqip: await lqipOf(base(), 16) };
}

async function prepareBrochures() {
  const dir = path.join(RAW, 'Brochures');
  if (!fs.existsSync(dir)) return [];
  const pdfs = fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
  const out: unknown[] = [];
  let mupdf: typeof import('mupdf') | null = null;

  for (const cfg of BROCHURES) {
    const file = pdfs.find((f) => norm(f).includes(norm(cfg.match)));
    if (!file) {
      note(`Brochure "${cfg.match}": no file found — left off the shelf`);
      continue;
    }
    const src = path.join(dir, file);
    const kind = cfg.kind ?? 'book';
    const sig = `${sigOf(src)}:${kind}:v3`;
    const outDir = path.join(OUT, 'brochures', cfg.slug);
    const hit = cache.brochures[cfg.slug];
    const filesOf = (e: unknown) => JSON.stringify(e).match(/\/assets\/archive\/[^"]+\.webp/g) ?? [];
    if (hit && hit.sig === sig && filesOf(hit.entry).every((u) => fs.existsSync(urlToFile(u)))) {
      out.push(hit.entry);
      continue;
    }

    console.log(`Rendering: Brochures/${file}`);
    fs.mkdirSync(outDir, { recursive: true });
    try {
      mupdf ??= await import('mupdf');
      const doc = mupdf.Document.openDocument(fs.readFileSync(src), 'application/pdf');
      const count = doc.countPages();
      const bounds: { w: number; h: number }[] = [];
      for (let i = 0; i < count; i++) {
        const page = doc.loadPage(i);
        const [x0, y0, x1, y1] = page.getBounds();
        bounds.push({ w: x1 - x0, h: y1 - y0 });
        page.destroy();
      }
      // one page at a time: render, cut, encode, free
      const render = (i: number, scale: number) => {
        const page = doc.loadPage(i);
        const pix = page.toPixmap(mupdf!.Matrix.scale(scale, scale), mupdf!.ColorSpace.DeviceRGB, false, true);
        const [width, height, n, stride] = [pix.getWidth(), pix.getHeight(), pix.getNumberOfComponents(), pix.getStride()];
        if (n !== 3) throw new Error(`unexpected pixel format (${n} components)`);
        const px = pix.getPixels();
        let data = Buffer.from(px.buffer, px.byteOffset, px.byteLength);
        if (stride === width * 3) data = Buffer.from(data);
        else {
          // rows are padded: copy them out tightly
          const tight = Buffer.alloc(width * height * 3);
          for (let y = 0; y < height; y++) data.copy(tight, y * width * 3, y * stride, y * stride + width * 3);
          data = tight;
        }
        const raw = { data, width, height };
        pix.destroy();
        page.destroy();
        return raw;
      };
      const pad = (n: number) => String(n).padStart(2, '0');
      let entry: Record<string, unknown>;

      if (kind === 'gatefold') {
        // As delivered: cover (1 panel) · the closed gates (2 panels) · the inside (4 panels) · back (1 panel)
        const panelW = Math.min(...bounds.map((b) => b.w));
        const cuts = bounds.map((b) => Math.max(1, Math.round(b.w / panelW)));
        if (cuts.join() !== '1,2,4,1') note(`${file}: expected pages of 1, 2, 4 and 1 panels, found ${cuts.join(', ')}`);
        const sheets: PageOut[][] = [];
        for (let i = 0; i < count; i++) {
          const n = cuts[i];
          const raw = render(i, 2000 / Math.max(bounds[i].w / n, bounds[i].h));
          const each = Math.floor(raw.width / n);
          const row: PageOut[] = [];
          for (let k = 0; k < n; k++) {
            row.push(await writePage(raw, n > 1 ? { left: k * each, width: each } : null, outDir, `s${i + 1}-${k + 1}`, [1000, 2000], 'long'));
          }
          sheets.push(row);
        }
        const [cover, gates, inside, back] = [sheets[0][0], sheets[1] ?? [], sheets[2] ?? [], sheets[count - 1][0]];
        entry = {
          slug: cfg.slug,
          kind,
          pageCount: count,
          pageAspect: cover.w / cover.h,
          pages: [cover, ...gates, ...inside, back],
          gatefold: { cover, gates, inside, back, panelWidths: inside.map(() => 1 / Math.max(1, inside.length)) },
        };
        note(`${file}: ${count} pages = cover, closed gates (2 panels), inside (4 equal panels), back. Built as: cover opens like a book, then the gates swing apart.`);
      } else if (kind === 'scroll') {
        const pages: PageOut[] = [];
        for (let i = 0; i < count; i++) {
          const raw = render(i, 1050 / bounds[i].w);
          pages.push(await writePage(raw, null, outDir, `p${pad(i + 1)}`, [640, 1050], 'width'));
          if (i === 0) {
            // shelf cover: the top of the first sheet at A4 proportions
            const h = Math.round(raw.width * 1.414);
            await input(raw.data, { width: raw.width, height: raw.height, channels: 3 })
              .extract({ left: 0, top: 0, width: raw.width, height: Math.min(h, raw.height) })
              .resize({ width: 800 })
              .webp({ quality: 78 })
              .toFile(path.join(outDir, 'cover.webp'));
          }
        }
        entry = { slug: cfg.slug, kind, pageCount: count, pageAspect: 1 / 1.414, cover: `${URL_BASE}/brochures/${cfg.slug}/cover.webp`, pages };
        note(`${file}: ${count} pages of ${Math.round(bounds[0].w)}×${Math.round(bounds[0].h)}pt — a long-scroll sheet, shown in a scroll reader instead of a book`);
      } else {
        // a page about twice as wide as the single pages is a spread: cut it in two
        const minW = Math.min(...bounds.map((b) => b.w));
        const isSpread = (b: { w: number }) => b.w / minW > 1.75 && b.w / minW < 2.25;
        const mixed = bounds.some(isSpread);
        const pages: PageOut[] = [];
        for (let i = 0; i < count; i++) {
          const split = mixed && isSpread(bounds[i]);
          const raw = render(i, 2000 / Math.max(split ? bounds[i].w / 2 : bounds[i].w, bounds[i].h));
          if (split) {
            const half = Math.floor(raw.width / 2);
            pages.push(await writePage(raw, { left: 0, width: half }, outDir, `p${pad(pages.length + 1)}`, [1000, 2000], 'long'));
            pages.push(await writePage(raw, { left: raw.width - half, width: half }, outDir, `p${pad(pages.length + 1)}`, [1000, 2000], 'long'));
          } else {
            pages.push(await writePage(raw, null, outDir, `p${pad(pages.length + 1)}`, [1000, 2000], 'long'));
          }
        }
        // the most common page shape is the book's shape
        const tally = new Map<string, number>();
        pages.forEach((p) => tally.set((p.w / p.h).toFixed(2), (tally.get((p.w / p.h).toFixed(2)) ?? 0) + 1));
        const pageAspect = Number([...tally.entries()].sort((a, b) => b[1] - a[1])[0][0]);
        if (mixed) note(`${file}: ${count} PDF pages, ${bounds.filter(isSpread).length} of them spreads — split into ${pages.length} book pages`);
        entry = { slug: cfg.slug, kind, pageCount: pages.length, pageAspect, pages };
      }
      doc.destroy();

      const coverFile = urlToFile((entry.cover as string) ?? (entry.pages as PageOut[])[0].src);
      const { dominant } = await sharp(coverFile).stats();
      // spine: the cover's dominant colour, a little deeper
      entry.spineColor = hex(dominant.r * 0.82, dominant.g * 0.82, dominant.b * 0.82);
      cache.brochures[cfg.slug] = { sig, entry };
      saveCache();
      out.push(entry);
    } catch (err) {
      note(`${file}: could not be rendered (${(err as Error).message}) — left off the shelf`);
    }
  }
  return out;
}

/* ───────────────────────── run ───────────────────────── */

export async function prepareArchive() {
  if (!fs.existsSync(RAW)) {
    console.log(`Archive: ${path.relative(process.cwd(), RAW)} not found, skipping.`);
    return;
  }
  console.log('Preparing SMM creatives archive…');
  fs.mkdirSync(OUT, { recursive: true });

  const brands = [];
  for (const cfg of BRANDS) {
    const b = await prepareBrand(cfg);
    if (b) brands.push(b);
  }
  const flyers = await prepareFlyers();
  const emailers = await prepareEmailers();
  const brochures = await prepareBrochures();

  fs.writeFileSync(DATA, JSON.stringify({ brands, flyers, emailers, brochures }) + '\n');
  fs.writeFileSync(REPORT, report.join('\n') + '\n');

  const total = brands.reduce((n, b) => n + b.count, 0);
  console.log(`Archive ready: ${brands.length} brands / ${total} creatives, ${flyers.length} flyers, ${emailers.length} emailers, ${brochures.length} brochures.`);
  brands.forEach((b) => console.log(`  ${b.slug}: ${b.count} creatives in ${b.items.length} tiles, colour ${b.color}`));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareArchive().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
