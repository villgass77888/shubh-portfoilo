/**
 * IndexNow: tells Bing and Yandex (Bing also feeds ChatGPT search) which URLs changed.
 * Run after a deploy: `npm run indexnow` (reads the URL list from dist/sitemap-pages.xml).
 * The key is site.indexNowKey; the build serves it at /<key>.txt.
 */
import fs from 'fs';
import path from 'path';

const xml = fs.readFileSync(path.join(process.cwd(), 'dist/sitemap-pages.xml'), 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) throw new Error('no URLs in dist/sitemap-pages.xml: run the build first');
const host = new URL(urlList[0]).host;
const key = fs.readdirSync(path.join(process.cwd(), 'dist')).find((f) => /^[a-f0-9]{32}\.txt$/.test(f))?.replace('.txt', '');
if (!key) throw new Error('IndexNow key file not found in dist/');

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${urlList.length} URLs for ${host} → HTTP ${res.status}`);
