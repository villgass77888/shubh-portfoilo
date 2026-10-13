/**
 * Measures every image the pages reference and writes src/data/dims.generated.json
 * ({ "/assets/…": [width, height] }), so <img> tags can carry explicit sizes.
 * Run: node scripts/image-dims.mjs   (also run by the build)
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC = path.join(process.cwd(), 'public');
const DIRS = ['assets/web', 'assets/smm', 'assets/logos', 'assets/streetwear', 'assets/hero', 'assets/branding'];
const out = {};

async function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full);
    else if (/\.(webp|png|jpe?g|avif|svg)$/i.test(e.name)) {
      try {
        const m = await sharp(full).metadata();
        if (m.width && m.height) out['/' + path.relative(PUBLIC, full).split(path.sep).join('/')] = [m.width, m.height];
      } catch {
        /* unreadable file: left without a size */
      }
    }
  }
}

for (const d of DIRS) if (fs.existsSync(path.join(PUBLIC, d))) await walk(path.join(PUBLIC, d));
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(path.join(process.cwd(), 'src/data/dims.generated.json'), JSON.stringify(sorted) + '\n');
console.log(`image-dims: ${Object.keys(sorted).length} images`);
