/**
 * Stills cut from the hero video (public/assets/hero/shubh-360.webm):
 *   shubh-360-poster.webp       first frame, transparent: the video's poster (and the page's LCP image)
 *   shubh-panda-portrait.jpg    square head-and-shoulders on paper: JSON-LD, the About page, OG cards
 * plus favicon-32.png from the existing favicon.png.
 * One-off: run `node scripts/hero-stills.mjs` again only when the hero video changes.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';

const HERO = path.join(process.cwd(), 'public/assets/hero');
const frame = path.join(os.tmpdir(), 'shubh-hero-frame.png');

// libvpx-vp9 keeps the alpha channel (the default decoder drops it)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-c:v', 'libvpx-vp9', '-i', path.join(HERO, 'shubh-360.webm'), '-frames:v', '1', frame]);

const meta = await sharp(frame).metadata();
await sharp(frame).resize({ height: Math.min(meta.height, 1280) }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(path.join(HERO, 'shubh-360-poster.webp'));

// the figure, trimmed of the empty margin, then its top square (head and shoulders)
const trimmed = await sharp(frame).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
const side = Math.min(trimmed.info.width, trimmed.info.height);
const pad = Math.round(side * 0.18);
await sharp(trimmed.data)
  .extract({ left: Math.round((trimmed.info.width - side) / 2), top: 0, width: side, height: side })
  .extend({ top: pad, left: pad, right: pad, bottom: 0, background: '#F3F0E8' })
  .flatten({ background: '#F3F0E8' })
  .resize(1000, 1000, { fit: 'cover', position: 'top' })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(path.join(HERO, 'shubh-panda-portrait.jpg'));

await sharp(path.join(process.cwd(), 'public/favicon.png')).resize(32, 32).png().toFile(path.join(process.cwd(), 'public/favicon-32.png'));
fs.rmSync(frame, { force: true });
console.log('hero stills: poster, portrait and favicon-32 written');
