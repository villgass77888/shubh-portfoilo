import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';
import { prepareStreetwear } from './prepare-streetwear';

const RAW_DIR = path.join(process.cwd(), 'public/assets/portfolio assets');
const OUT_DIR = path.join(process.cwd(), 'public/assets');

const dirs = ['logos', 'branding', 'web', 'smm', 'packaging', 'hero'];
dirs.forEach(d => {
  const p = path.join(OUT_DIR, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

async function processImage(src: string, dest: string, maxSide?: number) {
  if (!fs.existsSync(src)) {
    console.log(`Skipping missing source: ${src}`);
    return;
  }
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  
  const needsUpdate = !fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs;
  if (needsUpdate) {
    console.log(`Processing image: ${dest}`);
    let img = sharp(src);
    if (maxSide) img = img.resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true });
    await img.webp({ quality: 80 }).toFile(dest);
  }
}

function copyFile(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    console.log(`Skipping missing source: ${src}`);
    return;
  }
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const needsUpdate = !fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs;
  if (needsUpdate) {
    console.log(`Copying file: ${dest}`);
    fs.copyFileSync(src, dest);
  }
}

async function run() {
  console.log('Starting asset preparation...');

  // 1. Logos
  const logoMap: Record<string, any> = {
    'senquira.png': { slug: 'senquira' },
    'DBKD Logo Golden Variant.png': { slug: 'dbkd' },
    'DBKD Logo white.png': { slug: 'dbkd', white: true },
    'chemist box.png': { slug: 'chemist-box' },
    'chemist box white.png': { slug: 'chemist-box', white: true },
    'swaroop logo.png': { slug: 'swaroop-realty' },
    'swaroop white.png': { slug: 'swaroop-realty', white: true },
    'croppd.png': { slug: 'croppd' },
    'croppd white.png': { slug: 'croppd', white: true },
    'that coffee.png': { slug: 'that-coffee' },
    'that coffee white.png': { slug: 'that-coffee', white: true },
    'Reish.png': { slug: 'reish' },
    'Reish white.png': { slug: 'reish', white: true },
    'logo.png': { slug: 'aura-rosetry' },
    'organic miles.png': { slug: 'organic-miles' },
    'dj abhishek.png': { slug: 'dj-abhishek' },
    'Kangaroo Agency.png': { slug: 'kangaroo-agency' }
  };

  const logosDir = path.join(RAW_DIR, 'brand logos');
  if (fs.existsSync(logosDir)) {
    for (const [file, info] of Object.entries(logoMap)) {
      const src = path.join(logosDir, file);
      const dest = path.join(OUT_DIR, 'logos', `${info.slug}${info.white ? '-white' : ''}.webp`);
      await processImage(src, dest);
    }
  }

  // 2. Branding (Moodboards)
  const brandingMap: Record<string, string> = {
    'senquira_cards': 'senquira',
    'do_bhaion_ki_dukan_cards': 'dbkd',
    'swaroop_realty_cards': 'swaroop-realty',
    'chemistbox_cards': 'chemist-box'
  };

  const brandingDir = path.join(RAW_DIR, 'brand guidelines moodboard');
  if (fs.existsSync(brandingDir)) {
    for (const [folder, slug] of Object.entries(brandingMap)) {
      const folderPath = path.join(brandingDir, folder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png'));
        files.sort();
        for (let i = 0; i < files.length; i++) {
          const src = path.join(folderPath, files[i]);
          const dest = path.join(OUT_DIR, 'branding', slug, `${String(i + 1).padStart(2, '0')}.webp`);
          await processImage(src, dest);
        }
      }
    }
  }

  // 3. Web
  const webMap: Record<string, string> = {
    'Kangaroo Agency.mp4': 'kangaroo-agency',
    'origanimo.mp4': 'origanimo',
    'chemist box.mp4': 'chemist-box',
    'swaroop realty.mp4': 'swaroop-realty',
    'that coffee.mp4': 'that-coffee',
    'Aura Rosetry.mp4': 'aura-rosetry',
    'ghoomar thali.mp4': 'ghoomar-thali'
  };

  const webDir = path.join(RAW_DIR, 'website ss');
  if (fs.existsSync(webDir)) {
    for (const [file, slug] of Object.entries(webMap)) {
      const src = path.join(webDir, file);
      const dest = path.join(OUT_DIR, 'web', `${slug}.mp4`);
      copyFile(src, dest);

      // Light derivative for the tilted cards (the full recording is kept for the lightbox) + poster
      const card = path.join(OUT_DIR, 'web', `${slug}-card.mp4`);
      const poster = path.join(OUT_DIR, 'web', `${slug}-poster.webp`);
      if (fs.existsSync(src) && !fs.existsSync(card)) {
        console.log(`Encoding video: ${card}`);
        execSync(`ffmpeg -y -loglevel error -i "${src}" -vf "scale=1280:-2,fps=30" -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -an -movflags +faststart "${card}"`);
      }
      if (fs.existsSync(src) && !fs.existsSync(poster)) {
        console.log(`Extracting poster: ${poster}`);
        execSync(`ffmpeg -y -loglevel error -ss 2 -i "${src}" -frames:v 1 -vf "scale=1280:-2" "${poster}"`);
      }
    }
  }

  // 4. SMM
  const smmFolders = [
    { name: 'Alright TV', slug: 'alright-tv', avatar: 'avatar.webp' },
    { name: 'Elan Wallcovers', slug: 'elan-wallcovers', avatar: 'avatar.webp' },
    { name: 'vareeka', slug: 'vareeka', avatar: 'avatar.webp' },
    { name: 'Udman Square', slug: 'udman-square', avatar: 'UDMAN SQUARE WHITE LOGO.png' },
    { name: 'Senquira', slug: 'senquira', avatar: '../../brand logos/senquira.png' }, // from logos
    { name: 'Stories for you', slug: 'stories-for-you', avatar: 'avatar.webp' },
    { name: 'Blink Brand solutions', slug: 'blink-brand-solutions', avatar: 'avatar.webp' }
  ];

  const smmDir = path.join(RAW_DIR, 'social media posts');
  const smmManifest: Record<string, { avatar: string | null; posts: string[]; stories: string[] }> = {};
  if (fs.existsSync(smmDir)) {
    for (const folder of smmFolders) {
      const folderPath = path.join(smmDir, folder.name);
      if (fs.existsSync(folderPath)) {
        // Avatar
        const avatarSrc = path.join(folderPath, folder.avatar);
        const avatarDest = path.join(OUT_DIR, 'smm', folder.slug, 'avatar.webp');
        if (fs.existsSync(avatarSrc)) {
          await processImage(avatarSrc, avatarDest);
        }

        // Sort every file by aspect ratio: ~1:1 / 4:5 → posts, ~9:16 → stories
        const files = fs.readdirSync(folderPath)
          .filter(f => f.match(/\.(png|jpe?g|webp)$/i) && f !== folder.avatar)
          .sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
        const posts: string[] = [];
        const stories: string[] = [];
        for (const f of files) {
          const src = path.join(folderPath, f);
          const meta = await sharp(src).metadata();
          const isStory = (meta.width ?? 1) / (meta.height ?? 1) < 0.65;
          const list = isStory ? stories : posts;
          const name = `${isStory ? 'story' : 'post'}-${String(list.length + 1).padStart(2, '0')}.webp`;
          await processImage(src, path.join(OUT_DIR, 'smm', folder.slug, name), 1350);
          list.push(`/assets/smm/${folder.slug}/${name}`);
        }
        smmManifest[folder.slug] = {
          avatar: fs.existsSync(avatarSrc) ? `/assets/smm/${folder.slug}/avatar.webp` : null,
          posts,
          stories,
        };
      }
    }
    fs.writeFileSync(path.join(process.cwd(), 'src/data/smm.manifest.json'), JSON.stringify(smmManifest, null, 2) + '\n');
  }

  // 5. Packaging
  const pkgDir = path.join(RAW_DIR, 'brand pkg');
  if (fs.existsSync(pkgDir)) {
    // Featured
    const profoodsDir = path.join(pkgDir, 'profoods makhana');
    if (fs.existsSync(profoodsDir)) {
      await processImage(path.join(profoodsDir, 'Makhana Pouch Dieline Packaging Layout.png'), path.join(OUT_DIR, 'packaging', 'profoods-makhana', 'dieline.webp'));
      await processImage(path.join(profoodsDir, 'Premium Yellow Makhana Pouch.png'), path.join(OUT_DIR, 'packaging', 'profoods-makhana', 'mockup.webp'));
      await processImage(path.join(profoodsDir, 'Premium Yellow Makhana Pouch usecase.png'), path.join(OUT_DIR, 'packaging', 'profoods-makhana', 'usecase.webp'));
    }

    // Milletopia
    const milletopiaDir = path.join(pkgDir, 'milletopia');
    if (fs.existsSync(milletopiaDir)) {
      await processImage(path.join(milletopiaDir, '1_Milletopia_Khichdi_3D_Pouch_Mockup.jpg'), path.join(OUT_DIR, 'packaging', 'milletopia', 'mockup.webp'));
      await processImage(path.join(milletopiaDir, 'Milletopia_200g_Standup_Pouch_Dieline_HD.png'), path.join(OUT_DIR, 'packaging', 'milletopia', 'dieline.webp'));
      await processImage(path.join(milletopiaDir, '2_Milletopia_Khichdi_Studio_Shot.jpg'), path.join(OUT_DIR, 'packaging', 'milletopia', 'studio.webp'));
      await processImage(path.join(milletopiaDir, '3_Milletopia_Supermarket_Shelf_Display.jpg'), path.join(OUT_DIR, 'packaging', 'milletopia', 'shelf.webp'));
    }
    
    // Croppd Honey
    const croppdDir = path.join(pkgDir, 'croppd honey');
    if (fs.existsSync(croppdDir)) {
      await processImage(path.join(croppdDir, 'slide_1_hero.png'), path.join(OUT_DIR, 'packaging', 'croppd-honey', 'hero.webp'));
      await processImage(path.join(croppdDir, 'Cropd_Honey_Studio_Shot.jpg'), path.join(OUT_DIR, 'packaging', 'croppd-honey', 'studio.webp'));
      await processImage(path.join(croppdDir, 'croppd honey label.png'), path.join(OUT_DIR, 'packaging', 'croppd-honey', 'label.webp'));
      await processImage(path.join(croppdDir, 'Cropd_Honey_Store_Shelf.jpg'), path.join(OUT_DIR, 'packaging', 'croppd-honey', 'shelf.webp'));
    }

    // Arban Beauty
    const arbanDir = path.join(pkgDir, 'arban beauty');
    if (fs.existsSync(arbanDir)) {
      await processImage(path.join(arbanDir, 'Arban Beauty Vitc pkging.png'), path.join(OUT_DIR, 'packaging', 'arban-beauty', 'mockup.webp'));
      await processImage(path.join(arbanDir, 'arban 2.jpg'), path.join(OUT_DIR, 'packaging', 'arban-beauty', 'lineup.webp'));
      await processImage(path.join(arbanDir, 'arban 3.jpg'), path.join(OUT_DIR, 'packaging', 'arban-beauty', 'collection.webp'));
      await processImage(path.join(arbanDir, 'arban 4.jpg'), path.join(OUT_DIR, 'packaging', 'arban-beauty', 'shelf.webp'));
    }
  }

  // 6. Hero
  const heroSrc = path.join(RAW_DIR, 'hero video.webm');
  const heroDest = path.join(OUT_DIR, 'hero', 'shubh-360.webm');
  copyFile(heroSrc, heroDest);

  // 7. Streetwear chapter (models, cards, artwork, intro video)
  await prepareStreetwear();

  console.log('Asset preparation complete.');
}

run().catch(console.error);
