/**
 * Rebuilds each brand moodboard layout from its reference image.
 *
 * Every card PNG is a 1:1 pixel crop of "whole image sequence layout understanding.png",
 * so each card is located by template matching (coarse pass at 1/4 scale, then a
 * full-resolution refine) and written, normalised to the reference width, to
 * src/data/branding/<slug>.layout.json.
 *
 * Run: node scripts/extract-moodboard-layouts.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const RAW = path.join(process.cwd(), 'public/assets/portfolio assets/brand guidelines moodboard');
const OUT = path.join(process.cwd(), 'src/data/branding');
const REFERENCE = 'whole image sequence layout understanding.png';

const BRANDS = {
  senquira_cards: 'senquira',
  do_bhaion_ki_dukan_cards: 'dbkd',
  swaroop_realty_cards: 'swaroop-realty',
  chemistbox_cards: 'chemist-box',
};

const COARSE = 4;

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
  if (words === 'primary_logo') return 'logo';
  if (/logo|monogram/.test(words)) return 'variation';
  if (/colour|color/.test(words)) return 'color';
  if (/typography|tagline|values/.test(words)) return 'type';
  if (/pattern|icons/.test(words)) return 'pattern';
  if (/interior|exterior|building|property|outfit|storefront/.test(words)) return 'photo';
  return 'mockup';
}

/** Corner radius: transparent run length along the top-left corner of the card. */
function cornerRadius(card) {
  let r = 0;
  while (r < card.w && card.data[r * 4 + 3] < 128) r++;
  return r;
}

async function locate(refFull, refCoarse, file) {
  const full = await raw(file);
  const coarse = await raw(file, COARSE);

  let best = { s: Infinity, x: 0, y: 0 };
  for (let y = 0; y <= refCoarse.h - coarse.h + 1; y++) {
    for (let x = 0; x <= refCoarse.w - coarse.w + 1; x++) {
      const s = score(refCoarse, coarse, x, y, 2);
      if (s < best.s) best = { s, x, y };
    }
  }

  let fine = { s: Infinity, x: 0, y: 0 };
  const pad = COARSE * 2;
  for (let y = best.y * COARSE - pad; y <= best.y * COARSE + pad; y++) {
    for (let x = best.x * COARSE - pad; x <= best.x * COARSE + pad; x++) {
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
    const refPath = path.join(dir, REFERENCE);
    const refFull = await raw(refPath);
    const refCoarse = await raw(refPath, COARSE);
    const W = refFull.w;

    const files = fs.readdirSync(dir).filter((f) => /^\d+_.+\.png$/i.test(f)).sort();
    const frames = [];
    for (const f of files) {
      const hit = await locate(refFull, refCoarse, path.join(dir, f));
      const [, num, words] = f.match(/^(\d+)_(.+)\.png$/i);
      if (hit.s > 12) console.warn(`  ! weak match for ${slug}/${f} (diff ${hit.s.toFixed(1)})`);
      frames.push({ num, words, ...hit });
    }

    // Column structure for the mobile reflow: 6 equal columns across the board.
    const COLS = 6;
    const radius = Math.round(frames.reduce((a, f) => a + f.radius, 0) / frames.length);
    const r4 = (n) => Math.round(n * 10000) / 10000;

    const out = {
      slug,
      reference: `/assets/branding/${slug}/${String(files.length + 1).padStart(2, '0')}.webp`,
      refWidth: W,
      refHeight: refFull.h,
      aspect: r4(W / refFull.h),
      radius: r4(radius / W),
      frames: frames.map((f, i) => {
        const cx = (f.x + f.w / 2) / W;
        const near = Math.abs(cx - 0.5) < 0.1;
        return {
          src: `/assets/branding/${slug}/${f.num}.webp`,
          x: r4(f.x / W),
          y: r4(f.y / W),
          w: r4(f.w / W),
          h: r4(f.h / W),
          col: Math.min(COLS - 1, Math.floor((f.x / W) * COLS)),
          colSpan: Math.max(1, Math.round((f.w / W) * COLS)),
          order: i,
          from: near ? (i % 2 === 0 ? 'left' : 'right') : cx < 0.5 ? 'left' : 'right',
          category: categoryOf(f.words),
          label: f.words.replace(/_/g, ' ').toUpperCase(),
        };
      }),
    };

    fs.writeFileSync(path.join(OUT, `${slug}.layout.json`), JSON.stringify(out, null, 2) + '\n');
    console.log(`${slug}: ${frames.length} frames, radius ${radius}px`);
    for (const f of frames) console.log(`  ${f.num} ${f.words.padEnd(26)} x=${String(f.x).padStart(4)} y=${String(f.y).padStart(4)} ${f.w}x${f.h} diff=${f.s.toFixed(2)}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
