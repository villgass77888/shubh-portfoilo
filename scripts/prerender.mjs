/**
 * Prerender: turns the client build in dist/ into one static HTML file per route, each with its
 * own <head> (title, description, canonical, Open Graph, JSON-LD), and writes the technical
 * files next to them (robots.txt, sitemaps, llms.txt, llms-full.txt, manifest, OG images,
 * 404.html, host headers). Everything is generated from src/content/site.ts and seo.ts.
 *
 * Every visitor gets this same HTML; the browser then starts the same React app on top of it.
 * Run by `npm run build` after `vite build`.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createServer } from 'vite';
import { buildOg } from './og.mjs';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

const git = (args) => {
  try {
    return execSync(`git ${args}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};
/** Date of the last commit that touched any of the files (YYYY-MM-DD) */
const lastCommit = (files) =>
  files
    .map((f) => git(`log -1 --format=%cI -- "${f}"`))
    .filter(Boolean)
    .sort()
    .pop()
    ?.slice(0, 10);
/** When a public file entered the repository (ISO date-time) */
const firstCommit = (publicPath) => git(`log --diff-filter=A --format=%cI -- "public${publicPath}"`).split('\n').filter(Boolean).pop();

const vite = await createServer({ root: ROOT, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true } });
let failed = false;

try {
  const ssr = await vite.ssrLoadModule('/src/entry-server.tsx');
  const { pages, notFound, site, siteTodos, headFor, graphFor, files, render } = ssr;

  let template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  // the stylesheet is small: inlined, it stops being a render-blocking request
  template = template.replace(/<link rel="stylesheet"[^>]*href="\/(_app\/[^"]+\.css)"[^>]*>/, (tag, file) => {
    const css = fs.readFileSync(path.join(DIST, file), 'utf8');
    return css.includes('</style') ? tag : `<style>${css}</style>`;
  });
  if (!template.includes('<!--seo:start-->') || !template.includes('<div id="root"></div>')) throw new Error('dist/index.html is missing the <!--seo:start--> block or the empty #root');

  // chunks a route needs, so the browser can fetch them in parallel with the entry
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, '.vite/manifest.json'), 'utf8'));
  const chunksOf = (key, seen = new Set()) => {
    const entry = manifest[key];
    if (!entry || seen.has(entry.file)) return seen;
    seen.add(entry.file);
    (entry.imports ?? []).forEach((k) => chunksOf(k, seen));
    return seen;
  };
  const preloads = (keys) =>
    [...new Set(keys.flatMap((k) => [...chunksOf(k)]))].filter((f) => !template.includes(f)).map((f) => `<link rel="modulepreload" crossorigin href="/${f}" />`);
  const ARCHIVE = ['archive', 'archive-brand', 'flyers', 'emailers', 'brochures', 'brochure'];
  const preloadFor = (p) =>
    p.path === '/'
      ? [`<link rel="preload" as="image" href="${site.heroPoster}" fetchpriority="high" />`, ...preloads(['src/App.tsx'])]
      : preloads(['src/pages/boot.tsx', p.kind === 'contact' ? 'src/pages/ContactPage.tsx' : ARCHIVE.includes(p.kind) ? 'src/pages/ArchivePages.tsx' : 'src/pages/Pages.tsx']);

  const ctx = { date: firstCommit };
  const problems = [];
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };

  for (const p of [...pages, notFound]) {
    const body = await render(p.path);
    const h1 = (body.match(/<h1[\s>]/g) ?? []).length;
    if (h1 !== 1) problems.push(`${p.path}: ${h1} <h1> elements`);
    const html = template
      .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, () => headFor(p, graphFor(p, ctx), preloadFor(p)))
      .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
    const out = p.path === '/' ? 'index.html' : p.kind === '404' ? '404.html' : `${p.path.slice(1)}.html`;
    write(path.join(DIST, out), html);
  }

  /* ── technical files ── */
  const today = new Date().toISOString().slice(0, 10);
  write(path.join(DIST, 'robots.txt'), files.robotsTxt());
  write(path.join(DIST, 'sitemap.xml'), files.sitemapIndex(today));
  write(path.join(DIST, 'sitemap-pages.xml'), files.sitemapPages((p) => lastCommit(p.sources) ?? today));
  write(path.join(DIST, 'sitemap-images.xml'), files.sitemapImages());
  write(path.join(DIST, 'llms.txt'), files.llmsTxt());
  write(path.join(DIST, 'llms-full.txt'), files.llmsFullTxt());
  write(path.join(DIST, 'site.webmanifest'), files.webManifest());
  write(path.join(DIST, `${site.indexNowKey}.txt`), site.indexNowKey);
  // cache and redirect rules for the host live in vercel.json
  fs.rmSync(path.join(DIST, '.vite'), { recursive: true, force: true });

  /* ── Open Graph images ── */
  const indexable = pages.filter((p) => p.index);
  const ogItems = indexable.map((p) => ({
    slug: p.og,
    title: p.kind === 'home' ? site.name : p.h1,
    kicker: p.kind === 'home' ? site.jobTitle : p.keyword ?? p.crumbs.at(-2)?.name ?? 'Portfolio',
    image: files.ogImageFor(p),
  }));
  let og = 0;
  try {
    og = await buildOg(ogItems, { outDir: path.join(DIST, 'og'), publicDir: PUBLIC, name: site.name, host: site.domain.replace(/^https?:\/\//, ''), paper: site.paper });
  } catch (e) {
    problems.push(`OG images not generated: ${e.message}`);
  }

  /* ── report ── */
  const report = files.contentReport();
  const vercel = fs.existsSync(path.join(ROOT, 'vercel.json')) ? fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8') : '';
  const host = site.domain.replace(/^https?:\/\//, '');
  if (vercel && !vercel.includes(host)) problems.push(`vercel.json redirects do not mention ${host}: update the www redirect`);

  console.log(`\nprerender: ${pages.length} pages (${indexable.length} indexable) + 404, ${og} OG images, sitemaps, robots.txt, llms.txt, llms-full.txt`);
  const todos = siteTodos();
  if (todos.length) console.log(`\nTODO(Shubh) in src/content/site.ts:\n${todos.map((t) => `  - ${t}`).join('\n')}`);
  const drafts = report.rows.filter((r) => !r.approved);
  if (drafts.length) console.log(`\nUnapproved drafts (${drafts.length}), set approved: true once checked:\n${drafts.map((r) => `  - ${r.page.padEnd(42)} ${String(r.words).padStart(4)} words`).join('\n')}`);
  if (report.lengths.length) console.log(`\nTitle / description lengths to adjust:\n${report.lengths.map((l) => `  - ${l}`).join('\n')}`);
  if (problems.length) {
    console.log(`\nProblems:\n${problems.map((l) => `  - ${l}`).join('\n')}`);
    failed = problems.some((l) => /<h1>/.test(l));
  }
} catch (e) {
  console.error(e);
  failed = true;
} finally {
  await vite.close();
}
process.exit(failed ? 1 : 0);
