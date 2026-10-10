/**
 * Rebuilds each brand moodboard from its designer files.
 *
 * Every brand folder holds the arranged board (00_Full_Board.png) and its cards as
 * numbered cutouts (01_Logo.png …), each a 1:1 pixel crop of the board. Each card is
 * located on the board by template matching (coarse pass on a ~420px-wide copy, then a
 * full-resolution refine), written as WebP to public/assets/branding/<slug>/, and its
 * box, normalised to the board width, goes to src/data/branding/<slug>.layout.json.
 * Boards drawn at 2x also get a half-size copy of every card (NN-sm.webp) for 1x screens.
 *
 * Run: node scripts/extract-moodboard-layouts.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const RAW = path.join(process.cwd(), 'raw-assets/brand moodboards');
const OUT = path.join(process.cwd(), 'src/data/branding');
const PUBLIC = path.join(process.cwd(), 'public/assets/branding');
const REFERENCE = '00_Full_Board.png';

const BRANDS = {
  Senquira: 'senquira',
  'Do Bhaiyo Ki Dukaan': 'dbkd',
  'Swaroop Realty': 'swaroop-realty',
  'Chemist Box': 'chemist-box',
};

/** Width the coarse search runs at */
const COARSE_W = 420;
/** Boards wider than this are 2x artwork: their cards get a half-size copy too */
const HIDPI_W = 2400;

async function raw(input, scale = 1) {
  let img = sharp(input).ensureAlpha();
  if (scale !== 1) {
    const m = await sharp(input).metadata();
    img = img.resize(Math.max(1, Math.round(m.width / scale)), Math.max(1, Math.round(m.height / scale)), { kernel: 'cubic', fit: 'fill' });
  }
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** Mean absolute RGB difference of `card` placed at (ox, oy) on `ref`, over opaque card pixels. */
function score(ref, card, ox, oy, step) {
  let sum = 0;
  let n = 0;
  for (let y = 0; y < card.h; y += step) {
    const ry = oy + y;
    if (ry < 0 || ry >= ref.h) continue;
    for (let x = 0; x < card.w; x += step) {
      const rx = ox + x;
      if (rx < 0 || rx >= ref.w) continue;
      const ci = (y * card.w + x) * 4;
      if (card.data[ci + 3] < 250) continue;
      const ri = (ry * ref.w + rx) * 4;
      sum += Math.abs(card.data[ci] - ref.data[ri]) + Math.abs(card.data[ci + 1] - ref.data[ri + 1]) + Math.abs(card.data[ci + 2] - ref.data[ri + 2]);
      n++;
    }
  }
  return n ? sum / (n * 3) : Infinity;
}

function categoryOf(words) {
  if (words === 'logo') return 'logo';
  if (/logo|symbol/.test(words)) return 'variation';
  if (/colour|color|palette/.test(words)) return 'color';
  if (/typography/.test(words)) return 'type';
  if (/pattern|graphic system/.test(words)) return 'pattern';
  if (/exterior|storefront|gate|villa|resort|river|fashion|heritage|pharmacist|macro|hero/.test(words)) return 'photo';
  return 'mockup';
}

function labelOf(words) {
  if (words === 'logo') return 'PRIMARY LOGO';
  if (words === 'palette') return 'COLOUR PALETTE';
  return words.toUpperCase();
}

/** Corner radius: transparent run along the top-left corner of the card. */
function cornerRadius(card) {
  let r = 0;
  while (r < card.w && card.data[r * 4 + 3] < 128) r++;
  return r;
}

async function locate(refFull, refCoarse, scale, file) {
  const full = await raw(file);
  const coarse = await raw(file, scale);

  let best = { s: Infinity, x: 0, y: 0 };
  for (let y = 0; y <= refCoarse.h - coarse.h + 1; y++) {
    for (let x = 0; x <= refCoarse.w - coarse.w + 1; x++) {
      const s = score(refCoarse, coarse, x, y, 2);
      if (s < best.s) best = { s, x, y };
    }
  }

  let fine = { s: Infinity, x: 0, y: 0 };
  const pad = Math.ceil(scale * 2);
  const cx = Math.round(best.x * scale);
  const cy = Math.round(best.y * scale);
  for (let y = cy - pad; y <= cy + pad; y++) {
    for (let x = cx - pad; x <= cx + pad; x++) {
      const s = score(refFull, full, x, y, 3);
      if (s < fine.s) fine = { s, x, y };
    }
  }
  return { ...fine, w: full.w, h: full.h, radius: cornerRadius(full) };
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const [folder, slug] of Object.entries(BRANDS)) {
    const dir = path.join(RAW, folder);
    const dest = path.join(PUBLIC, slug);
    const refPath = path.join(dir, REFERENCE);
    const refFull = await raw(refPath);
    const scale = refFull.w / COARSE_W;
    const refCoarse = await raw(refPath, scale);
    const W = refFull.w;

    // the board is re-published from scratch: old cards must not linger
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });

    const files = fs.readdirSync(dir).filter((f) => /^\d+_.+\.png$/i.test(f) && f !== REFERENCE).sort();
    const frames = [];
    for (const f of files) {
      const hit = await locate(refFull, refCoarse, scale, path.join(dir, f));
      const [, num, words] = f.match(/^(\d+)_(.+)\.png$/i);
      if (hit.s > 12) console.warn(`  ! weak match for ${slug}/${f} (diff ${hit.s.toFixed(1)})`);
      const webp = { quality: 82, alphaQuality: 90, effort: 6 };
      await sharp(path.join(dir, f)).webp(webp).toFile(path.join(dest, `${num}.webp`));
      let srcset;
      if (W > HIDPI_W) {
        const half = Math.round(hit.w / 2);
        await sharp(path.join(dir, f)).resize({ width: half }).webp(webp).toFile(path.join(dest, `${num}-sm.webp`));
        srcset = `/assets/branding/${slug}/${num}-sm.webp ${half}w, /assets/branding/${slug}/${num}.webp ${hit.w}w`;
      }
      frames.push({ num, words: words.replace(/_/g, ' ').toLowerCase(), srcset, ...hit });
    }
    await sharp(refPath).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 78, effort: 6 }).toFile(path.join(dest, 'board.webp'));

    // Column structure for the mobile reflow: 6 equal columns across the board.
    const COLS = 6;
    const radius = Math.round(frames.reduce((a, f) => a + f.radius, 0) / frames.length);
    const r4 = (n) => Math.round(n * 10000) / 10000;

    const out = {
      slug,
      reference: `/assets/branding/${slug}/board.webp`,
      refWidth: W,
      refHeight: refFull.h,
      aspect: r4(W / refFull.h),
      radius: r4(radius / W),
      frames: frames.map((f, i) => {
        const cx = (f.x + f.w / 2) / W;
        const near = Math.abs(cx - 0.5) < 0.1;
        return {
          src: `/assets/branding/${slug}/${f.num}.webp`,
          ...(f.srcset ? { srcset: f.srcset } : {}),
          x: r4(f.x / W),
          y: r4(f.y / W),
          w: r4(f.w / W),
          h: r4(f.h / W),
          col: Math.min(COLS - 1, Math.floor((f.x / W) * COLS)),
          colSpan: Math.max(1, Math.round((f.w / W) * COLS)),
          order: i,
          from: near ? (i % 2 === 0 ? 'left' : 'right') : cx < 0.5 ? 'left' : 'right',
          category: categoryOf(f.words),
          label: labelOf(f.words),
        };
      }),
    };

    fs.writeFileSync(path.join(OUT, `${slug}.layout.json`), JSON.stringify(out, null, 2) + '\n');
    console.log(`${slug}: ${frames.length} frames, board ${W}x${refFull.h}, radius ${radius}px`);
    for (const f of frames) console.log(`  ${f.num} ${f.words.padEnd(26)} x=${String(f.x).padStart(4)} y=${String(f.y).padStart(4)} ${f.w}x${f.h} diff=${f.s.toFixed(2)}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
