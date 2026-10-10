/**
 * Packaging chapter assets.
 *
 * - Croppd Honey (the featured project): the two transparent videos from
 *   raw-assets/brand pkg/croppd honey/ ("1st .webm", "2nd .webm") are copied as croppd-1 / croppd-2,
 *   get a stacked-alpha H.264 twin for Safari + iOS (colour left, alpha matte right) and
 *   first / last frame posters; its photos are written as AVIF + WebP at several widths.
 * - Every other packaging image already in public/assets/packaging/ is measured, given a
 *   placeholder and a sampled palette.
 * Everything lands in src/data/packaging.generated.json.
 *
 * Run on its own:  npx tsx scripts/prepare-packaging.ts
 * It is also called from scripts/prepare-assets.ts. Safe to re-run.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const RAW_NEW = path.join(process.cwd(), 'raw-assets/brand pkg/croppd honey');
const RAW_OLD = path.join(process.cwd(), 'public/assets/portfolio assets/brand pkg/croppd honey');
const OUT = path.join(process.cwd(), 'public/assets/packaging');
const DATA = path.join(process.cwd(), 'src/data/packaging.generated.json');
const HONEY = path.join(OUT, 'croppd-honey');

type Img = { src: string; srcset?: string; w: number; h: number; lqip: string };

const url = (file: string) => '/' + path.relative(path.join(process.cwd(), 'public'), file).replace(/\\/g, '/');
const firstExisting = (...files: string[]) => files.find((f) => fs.existsSync(f));
const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const ff = (args: string) => execSync(`ffmpeg -y -loglevel error ${args}`, { stdio: ['ignore', 'ignore', 'inherit'] });

async function lqip(file: string) {
  const buf = await sharp(file, { limitInputPixels: false }).resize({ width: 24 }).webp({ quality: 35 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

/** AVIF + WebP at each width that fits the source */
async function responsive(src: string, name: string, widths: number[]): Promise<Img> {
  const meta = await sharp(src, { limitInputPixels: false }).metadata();
  const W = meta.width ?? 1;
  const H = meta.height ?? 1;
  const list = [...new Set(widths.map((w) => Math.min(w, W)))].sort((a, b) => a - b);
  const out: string[] = [];
  for (const w of list) {
    const base = path.join(HONEY, `${name}-${w}`);
    if (!fs.existsSync(`${base}.webp`) || !fs.existsSync(`${base}.avif`)) {
      console.log(`Processing: ${path.relative(process.cwd(), base)}.webp/.avif`);
      const img = sharp(src, { limitInputPixels: false }).rotate().resize({ width: w });
      await img.clone().webp({ quality: 82, effort: 5 }).toFile(`${base}.webp`);
      await img.clone().avif({ quality: 54, effort: 4 }).toFile(`${base}.avif`);
    }
    out.push(`${url(`${base}.webp`)} ${w}w`);
  }
  const mid = list.reduce((a, b) => (Math.abs(b - 1600) < Math.abs(a - 1600) ? b : a));
  return { src: url(path.join(HONEY, `${name}-${mid}.webp`)), srcset: out.join(', '), w: W, h: H, lqip: await lqip(src) };
}

/** Three distinct colours that carry the artwork: coarse buckets ranked by area and saturation */
async function palette(file: string): Promise<string[]> {
  const d = await sharp(file, { limitInputPixels: false }).resize(64, 64, { fit: 'fill' }).flatten({ background: '#ffffff' }).toColourspace('srgb').raw().toBuffer();
  const buckets = new Map<number, { n: number; r: number; g: number; b: number; s: number }>();
  for (let i = 0; i < d.length; i += 3) {
    const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const max = Math.max(r, g, b);
    const sat = max ? (max - Math.min(r, g, b)) / max : 0;
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0, s: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    e.s += sat;
    buckets.set(key, e);
  }
  const ranked = [...buckets.values()]
    .map((e) => ({ c: [e.r / e.n, e.g / e.n, e.b / e.n], score: e.n * (0.35 + e.s / e.n) }))
    .sort((a, b) => b.score - a.score);
  const picked: number[][] = [];
  for (const { c } of ranked) {
    if (picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 70)) picked.push(c);
    if (picked.length === 3) break;
  }
  return picked.map((c) => hex(c[0], c[1], c[2]));
}

export async function preparePackaging() {
  console.log('Preparing packaging assets…');
  fs.mkdirSync(HONEY, { recursive: true });
  const images: Record<string, Img> = {};
  const video: Record<string, unknown> = { available: false };

  // ── Croppd Honey: the two transparent videos ──
  const sources = [
    { raw: '1st .webm', name: 'croppd-1' },
    { raw: '2nd .webm', name: 'croppd-2' },
  ];
  if (sources.every((s) => fs.existsSync(path.join(RAW_NEW, s.raw)))) {
    for (const s of sources) {
      const src = path.join(RAW_NEW, s.raw);
      const webm = path.join(HONEY, `${s.name}.webm`);
      const mp4 = path.join(HONEY, `${s.name}-stacked.mp4`);
      if (!fs.existsSync(webm)) {
        // kept as delivered unless it is heavy
        if (fs.statSync(src).size > 3_000_000) ff(`-c:v libvpx-vp9 -i "${src}" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 32 -an "${webm}"`);
        else fs.copyFileSync(src, webm);
        console.log(`Video: ${path.relative(process.cwd(), webm)}`);
      }
      if (!fs.existsSync(mp4)) {
        // Safari / iOS cannot play VP9 alpha: colour in the left half, the alpha matte in the right half
        ff(`-c:v libvpx-vp9 -i "${src}" -filter_complex "[0:v]format=rgba,split[c][a];[c]format=rgb24[cc];[a]alphaextract,format=rgb24[aa];[cc][aa]hstack=inputs=2,format=yuv420p" -c:v libx264 -crf 21 -preset slow -movflags +faststart -an "${mp4}"`);
        console.log(`Video: ${path.relative(process.cwd(), mp4)}`);
      }
      const frames = Number(execSync(`ffprobe -v error -c:v libvpx-vp9 -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "${src}"`).toString().trim());
      const duration = Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${src}"`).toString().trim());
      for (const [tag, n] of [['first', 0], ['last', frames - 1]] as const) {
        const poster = path.join(HONEY, `${s.name}-${tag}.webp`);
        if (fs.existsSync(poster)) continue;
        const tmp = path.join(HONEY, `.${s.name}-${tag}.png`);
        ff(`-c:v libvpx-vp9 -i "${src}" -vf "select=eq(n\\,${n}),format=rgba" -fps_mode passthrough -frames:v 1 "${tmp}"`);
        await sharp(tmp).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(poster);
        fs.unlinkSync(tmp);
      }
      video[s.name] = { src: url(path.join(HONEY, s.name)), duration, first: url(path.join(HONEY, `${s.name}-first.webp`)), last: url(path.join(HONEY, `${s.name}-last.webp`)) };
    }
    const meta = await sharp(path.join(HONEY, 'croppd-1-first.webp')).metadata();
    video.available = true;
    video.w = meta.width;
    video.h = meta.height;
  } else {
    console.log(`  ! Croppd Honey videos not found in ${path.relative(process.cwd(), RAW_NEW)}`);
  }

  // ── Croppd Honey: photos at several widths (the label keeps its full width for zoom) ──
  const honey: Array<[string, string, number[]]> = [
    ['label', 'croppd honey label.png', [1000, 1600, 2400, 3200]],
    ['studio', 'Cropd_Honey_Studio_Shot.jpg', [1000, 1600, 2400]],
    ['shelf', 'Cropd_Honey_Store_Shelf.jpg', [1000, 1600, 2400]],
    ['hero', 'slide_1_hero.png', [1000, 1600, 2400]],
  ];
  for (const [name, file, widths] of honey) {
    const src = firstExisting(path.join(RAW_NEW, file), path.join(RAW_OLD, file));
    if (!src) {
      console.log(`  ! Croppd Honey: ${file} not found`);
      continue;
    }
    images[`croppd-honey/${name}`] = await responsive(src, name, widths);
  }

  // ── the other projects: measure what is already exported ──
  const swatches: Record<string, string[]> = {};
  for (const slug of fs.readdirSync(OUT)) {
    const dir = path.join(OUT, slug);
    if (slug === 'croppd-honey' || !fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.webp')).sort()) {
      const file = path.join(dir, f);
      const meta = await sharp(file).metadata();
      images[`${slug}/${f.replace(/\.webp$/, '')}`] = { src: url(file), w: meta.width ?? 1, h: meta.height ?? 1, lqip: await lqip(file) };
    }
    const mock = path.join(dir, 'mockup.webp');
    if (fs.existsSync(mock)) swatches[slug] = await palette(mock);
  }
  const label = images['croppd-honey/label'];
  if (label) swatches['croppd-honey'] = await palette(path.join(process.cwd(), 'public', label.src));

  fs.writeFileSync(DATA, JSON.stringify({ video, images, swatches }, null, 1) + '\n');
  console.log(`Packaging ready: ${Object.keys(images).length} images, videos ${video.available ? 'ready' : 'missing'}.`);
  console.log('  sampled palettes:', JSON.stringify(swatches));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  preparePackaging().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
