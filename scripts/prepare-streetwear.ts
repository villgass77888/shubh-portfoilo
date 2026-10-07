/**
 * Streetwear chapter assets.
 *
 * Reads raw-assets/streetwear/ (models/, "tees (card display)"/, optional intro video)
 * and writes optimised files to public/assets/streetwear/ plus the generated design list
 * src/data/streetwear.generated.json (measured aspects + sampled colours).
 *
 * Run on its own:  npx tsx scripts/prepare-streetwear.ts
 * It is also called at the end of scripts/prepare-assets.ts. Safe to re-run.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const RAW = path.join(process.cwd(), 'raw-assets/streetwear');
const OUT = path.join(process.cwd(), 'public/assets/streetwear');
const DATA = path.join(process.cwd(), 'src/data/streetwear.generated.json');

/** Display names by design number (the number after the last " - " in the file name). */
const NAMES: Record<string, string> = {
  '712945': 'Autism',
  '688252': "Don't Kill My Vibe",
  '684528': 'Fallen Angels',
  '699361': 'Fallen Angels',
  '691784': 'I Wipe My Tears With Money',
  '684562': 'In Glock We Trust',
  '689934': 'Money Talk',
  '686922': 'TroubleMakers',
  '686250': 'Trust No Bitch',
  '694330': 'Wasted',
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

async function writeIfMissing(dest: string, make: () => Promise<unknown>) {
  if (fs.existsSync(dest)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  console.log(`Processing: ${path.relative(process.cwd(), dest)}`);
  await make();
}

/** Median luminance of the central region of the card → tee colour. */
async function sampleTee(card: string): Promise<{ teeColor: 'white' | 'black' | 'other'; accent: string | null }> {
  const { data, info } = await sharp(card).resize(120, 120, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const lum: number[] = [];
  let best = { s: 0, r: 0, g: 0, b: 0 };
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 3;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const central = x > 36 && x < 84 && y > 30 && y < 96;
      if (central) lum.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
      // most saturated, reasonably bright pixel → accent
      const sat = max === 0 ? 0 : (max - min) / max;
      const score = sat * (max / 255);
      if (score > best.s) best = { s: score, r, g, b };
    }
  }
  lum.sort((a, b) => a - b);
  const median = lum[Math.floor(lum.length / 2)];
  const teeColor = median > 170 ? 'white' : median < 80 ? 'black' : 'other';
  return { teeColor, accent: best.s > 0.35 ? hex(best.r, best.g, best.b) : null };
}

/** Dark ink → white sheet, light ink → black sheet. */
async function sampleArtBg(art: string): Promise<'white' | 'black'> {
  const { data, info } = await sharp(art).resize(160, 160, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let n = 0;
  for (let i = 0; i < info.width * info.height * 4; i += 4) {
    if (data[i + 3] > 128) {
      sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      n++;
    }
  }
  return n > 0 && sum / n > 128 ? 'black' : 'white';
}

export async function prepareStreetwear() {
  if (!fs.existsSync(RAW)) {
    console.log('Streetwear: raw-assets/streetwear not found, skipping.');
    return;
  }

  const modelsDir = path.join(RAW, 'models');
  const teesDir = path.join(RAW, 'tees (card display)');
  const teeFolders = fs.readdirSync(teesDir);
  const designs: Record<string, unknown>[] = [];

  for (const file of fs.readdirSync(modelsDir).filter((f) => /\.png$/i.test(f)).sort()) {
    const m = file.match(/^(\d+)\s*-\s*.+-\s*(\d+)\.png$/i);
    if (!m) continue;
    const [, order, num] = m;
    const name = NAMES[num];
    const folder = teeFolders.find((f) => f.trim().endsWith(num));
    if (!name || !folder) {
      console.warn(`Streetwear: no tee folder / name for ${file}, skipping.`);
      continue;
    }
    const slug = `${slugify(name)}-${num}`;
    const files = fs.readdirSync(path.join(teesDir, folder));
    const pick = (re: RegExp) => {
      const f = files.find((x) => re.test(x));
      return f ? path.join(teesDir, folder, f) : null;
    };

    // Model: trim transparent padding, keep alpha
    const modelOut = path.join(OUT, 'models', `${slug}.webp`);
    await writeIfMissing(modelOut, () =>
      sharp(path.join(modelsDir, file)).trim().resize({ height: 1600, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100 }).toFile(modelOut),
    );
    const mm = await sharp(modelOut).metadata();

    // Card
    const cardSrc = pick(/^0[23]\s*-\s*(front|back)\.jpe?g$/i)!;
    const cardOut = path.join(OUT, 'cards', `${slug}.webp`);
    await writeIfMissing(cardOut, () => sharp(cardSrc).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 84 }).toFile(cardOut));
    const cm = await sharp(cardOut).metadata();

    // Artwork (never upscaled; alpha kept)
    const art: Record<string, string> = {};
    const frontSrc = pick(/front artwork/i);
    const backSrc = pick(/back artwork/i);
    const singleSrc = pick(/^\d+\s*-\s*artwork/i);
    const arts: [string, string | null][] = [['front', frontSrc], ['back', backSrc], ['single', singleSrc]];
    for (const [key, src] of arts) {
      if (!src) continue;
      const out = path.join(OUT, 'art', `${slug}-${key === 'single' ? 'art' : key}.webp`);
      await writeIfMissing(out, () => sharp(src).webp({ quality: 92, alphaQuality: 100 }).toFile(out));
      art[key] = `/assets/streetwear/art/${path.basename(out)}`;
    }

    const { teeColor, accent } = await sampleTee(cardSrc);
    // Art drawn for a black tee reads best on a black sheet, whatever its mean ink luminance
    const artBg = teeColor === 'black' ? 'black' : await sampleArtBg((backSrc ?? singleSrc ?? frontSrc)!);

    designs.push({
      id: slug,
      order: Number(order),
      name,
      model: `/assets/streetwear/models/${slug}.webp`,
      card: `/assets/streetwear/cards/${slug}.webp`,
      cardAspect: +((cm.width ?? 1) / (cm.height ?? 1)).toFixed(4),
      modelAspect: +((mm.width ?? 1) / (mm.height ?? 1)).toFixed(4),
      art,
      print: frontSrc && backSrc ? 'FRONT + BACK PRINT' : 'FRONT PRINT',
      teeColor,
      accent: accent ?? '#FF2B1C',
      artBg,
      sampled: true,
    });
  }

  designs.sort((a, b) => (a.order as number) - (b.order as number));

  // Intro video → VP9 WebM with alpha + poster
  let intro = { available: false, duration: 0 };
  const introSrc = ['mov', 'webm', 'mp4'].map((e) => path.join(RAW, `streetwear-intro.${e}`)).find((p) => fs.existsSync(p));
  if (introSrc) {
    const webm = path.join(OUT, 'intro.webm');
    const poster = path.join(OUT, 'intro-poster.webp');
    fs.mkdirSync(OUT, { recursive: true });
    if (!fs.existsSync(webm)) {
      console.log('Encoding streetwear intro (VP9 + alpha)…');
      execSync(`ffmpeg -y -loglevel error -i "${introSrc}" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 30 -an "${webm}"`);
    }
    if (!fs.existsSync(poster)) {
      execSync(`ffmpeg -y -loglevel error -c:v libvpx-vp9 -sseof -0.1 -i "${webm}" -frames:v 1 "${poster}"`);
    }
    const probe = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream_tags=alpha_mode:format=duration -of default=nw=1 "${webm}"`).toString();
    const hasAlpha = /alpha_mode=1/i.test(probe);
    const duration = Number(probe.match(/duration=([\d.]+)/)?.[1] ?? 0);
    if (!hasAlpha) console.warn('Streetwear intro: converted file has NO alpha — the kinetic-type fallback will be used.');
    intro = { available: hasAlpha, duration };
  }

  fs.writeFileSync(DATA, JSON.stringify({ intro, designs }, null, 2) + '\n');
  console.log(`Streetwear: ${designs.length} designs, intro ${intro.available ? `ready (${intro.duration.toFixed(2)}s)` : 'not available'}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareStreetwear().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
