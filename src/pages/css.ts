/* Styles for the inner pages (case studies, services, about, contact, work, archive).
   Only the site's own tokens: Anton titles in signal red, Archivo 900 stretched headings,
   Space Mono labels, paper background, stickers. */
export const pagesCss = `
.pg {
  --pad: clamp(1.25rem, 5vw, 5rem);
  /* the signal red, deepened so small labels pass AA contrast on paper */
  --red-text: #C81E10;
  position: relative;
  z-index: var(--z-content);
  min-height: 100vh;
  background: var(--bg-hero);
  color: var(--ink);
  font-family: var(--font-body);
}
.pg a { color: inherit; }
.pg-wait { opacity: 0; transform: translateY(22px); }
[data-rv] { transition: opacity 0.7s ease, transform 0.8s var(--ease-enter); }

.pg-header {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem var(--pad);
  background: color-mix(in srgb, var(--bg-hero) 90%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.pg-logo, .pg-nav { font-family: var(--font-heading); font-weight: 900; font-stretch: 125%; letter-spacing: 0.08em; text-decoration: none; }
.pg-logo { font-size: 0.85rem; white-space: nowrap; }
.pg-nav { display: flex; align-items: center; gap: clamp(0.7rem, 2.2vw, 1.8rem); font-size: 0.72rem; }
.pg-nav a { text-decoration: none; }
.pg-nav a:not(.sticker):hover, .pg-nav a:not(.sticker):focus-visible { color: var(--signal); }
.pg-nav-cta { --sticker-rotate: -2deg; font-size: 0.65rem; }

.pg-main { max-width: 1500px; margin: 0 auto; padding: clamp(1.2rem, 3vh, 2.5rem) var(--pad) clamp(4rem, 10vh, 7rem); }
.pg-crumbs ol { display: flex; flex-wrap: wrap; gap: 0.5em; list-style: none; margin: 0; padding: 0; font-family: var(--font-meta); font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase; }
.pg-crumbs li + li::before { content: '/'; margin-right: 0.5em; opacity: 0.45; }
.pg-crumbs a { opacity: 0.6; text-decoration: none; }
.pg-crumbs a:hover { opacity: 1; }
.pg-crumbs [aria-current] { color: var(--red-text); }

.pg-kicker { margin: clamp(2rem, 6vh, 4rem) 0 0.9rem; font-family: var(--font-meta); font-size: 0.7rem; letter-spacing: 0.14em; color: var(--red-text); text-transform: uppercase; }
.pg-h1 { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: clamp(3rem, 11vw, 10rem); line-height: 0.9; letter-spacing: -0.01em; text-transform: uppercase; color: var(--signal); text-wrap: balance; }
.pg-h1-sub { display: block; margin-top: 0.9rem; font-family: var(--font-heading); font-weight: 900; font-stretch: 125%; font-size: clamp(0.95rem, 1.8vw, 1.5rem); line-height: 1.15; letter-spacing: 0.03em; color: var(--ink); }
.pg-lead { max-width: 62ch; margin: 1.6rem 0 0; font-size: clamp(1.05rem, 1.5vw, 1.35rem); line-height: 1.45; }

.pg-sec { display: grid; grid-template-columns: minmax(0, 15rem) minmax(0, 1fr); gap: 1rem 3rem; margin-top: clamp(3rem, 9vh, 6rem); }
.pg-h2 { margin: 0; font-family: var(--font-heading); font-weight: 900; font-stretch: 125%; font-size: clamp(1.1rem, 1.7vw, 1.5rem); line-height: 1.1; letter-spacing: 0.03em; text-transform: uppercase; }
.pg-h2::before { content: '✦ '; color: var(--signal); }
.pg-h3 { margin: 0 0 0.4rem; font-family: var(--font-heading); font-weight: 800; font-size: clamp(1rem, 1.25vw, 1.2rem); line-height: 1.25; }
.pg-body { min-width: 0; }
.pg-body p { max-width: 68ch; margin: 0 0 1.1em; font-size: clamp(0.98rem, 1.1vw, 1.1rem); line-height: 1.6; }
.pg-body p a, .pg-cta-p a, .pg-dl a { text-decoration: underline; text-decoration-color: var(--signal); text-underline-offset: 0.2em; }
.pg-list { max-width: 68ch; margin: 0; padding: 0; list-style: none; border-top: 1px solid rgba(13, 13, 13, 0.18); }
.pg-list li { padding: 0.7rem 0; border-bottom: 1px solid rgba(13, 13, 13, 0.18); font-size: clamp(0.95rem, 1.05vw, 1.05rem); line-height: 1.4; }
.pg-list li::before { content: '→ '; color: var(--red-text); font-family: var(--font-meta); }
.pg-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
.pg-chips li { padding: 0.45em 0.9em; border: 1.5px solid var(--ink); border-radius: 999px; font-family: var(--font-meta); font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
.pg-chips a { text-decoration: none; }
.pg-chips li:has(a):hover { background: var(--ink); color: var(--bone); }

/* the packaging info column, as a process list */
.pg-steps { max-width: 68ch; margin: 0; padding: 0; list-style: none; counter-reset: step; border-top: 1px solid rgba(13, 13, 13, 0.18); }
.pg-steps li { counter-increment: step; display: grid; grid-template-columns: 3.2rem minmax(0, 1fr); padding: 1rem 0 1rem 0.9rem; border-bottom: 1px solid rgba(13, 13, 13, 0.18); border-left: 3px solid var(--signal); }
.pg-steps li::before { content: counter(step, decimal-leading-zero); font-family: var(--font-meta); font-size: 0.72rem; color: var(--red-text); padding-top: 0.15rem; }
.pg-steps b { display: block; margin-bottom: 0.3rem; font-family: var(--font-meta); font-weight: 400; font-size: 0.7rem; letter-spacing: 0.24em; }
.pg-steps span { font-size: clamp(0.95rem, 1.05vw, 1.05rem); line-height: 1.5; }

/* media */
.pg .pg-media { margin-top: clamp(2.5rem, 7vh, 4.5rem); }
.pg-cap { margin: 0.7rem 0 0; font-family: var(--font-meta); font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.65; }
.pg-board { position: relative; width: 100%; filter: drop-shadow(0 18px 34px rgba(0, 0, 0, 0.22)); }
.pg-board img { position: absolute; display: block; max-width: none; object-fit: fill; }
.pg-stage { padding: clamp(1rem, 3vw, 2.5rem); border-radius: 14px; }
.pg-video { display: block; width: 100%; height: auto; border: 2px solid var(--ink); border-radius: 14px; background: #000; box-shadow: var(--shadow-sticker); }
.pg-grid { columns: 3 240px; column-gap: 1rem; margin: 0; padding: 0; list-style: none; }
.pg-grid > * { break-inside: avoid; margin: 0 0 1rem; }
.pg-grid img, .pg-fig img { display: block; width: 100%; height: auto; border-radius: 8px; background: #d9d4c8; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16); }
.pg-fig { margin: 0; }
.pg-fig--flat img { background: #fff; padding: 4%; }
.pg-fig--cut img { background: none; box-shadow: none; }
.pg-grid--2 { columns: 2 300px; }
.pg-grid--wide { columns: 4 200px; }
.pg-long { max-width: 720px; }
.pg-logo-tile { display: grid; place-items: center; width: min(100%, 26rem); aspect-ratio: 16 / 10; padding: 12%; border: 2px solid var(--ink); border-radius: 14px; box-shadow: var(--shadow-sticker); }
.pg-logo-tile img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
.pg-portrait { display: block; width: min(100%, 22rem); height: auto; border: 2px solid var(--ink); border-radius: 14px; box-shadow: var(--shadow-sticker); background: var(--paper); }

/* cards */
.pg-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr)); gap: 1.4rem; margin: 0; padding: 0; list-style: none; }
.pg-card { display: flex; flex-direction: column; height: 100%; border: 2px solid var(--ink); border-radius: 14px; overflow: hidden; background: var(--bone); text-decoration: none; box-shadow: var(--shadow-sticker); transition: transform 0.35s var(--ease-bounce); }
.pg-card:hover, .pg-card:focus-visible { transform: translate(-3px, -4px) rotate(-0.6deg); }
.pg-card-img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: #d9d4c8; border-bottom: 2px solid var(--ink); }
.pg-card-img--contain { object-fit: contain; padding: 8%; }
.pg-card-body { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.9rem 1rem 1.1rem; }
.pg-card-meta { font-family: var(--font-meta); font-size: 0.6rem; letter-spacing: 0.12em; color: var(--red-text); text-transform: uppercase; }
.pg-card-name { font-family: var(--font-heading); font-weight: 900; font-stretch: 125%; font-size: 1.05rem; line-height: 1.1; text-transform: uppercase; }
.pg-card-line { font-size: 0.88rem; line-height: 1.4; opacity: 0.8; }
.pg-filter { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 2rem 0 1.6rem; }
.pg-filter button { padding: 0.5em 1em; border: 1.5px solid var(--ink); border-radius: 999px; background: none; color: var(--ink); font-family: var(--font-meta); font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; }
.pg-filter button[aria-pressed='true'] { background: var(--ink); color: var(--bone); }

.pg-faq { max-width: 68ch; border-top: 1px solid rgba(13, 13, 13, 0.18); }
.pg-faq > div { padding: 1.1rem 0; border-bottom: 1px solid rgba(13, 13, 13, 0.18); }
.pg-faq p { margin: 0; }
.pg-dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 0.6rem 1.5rem; max-width: 40rem; margin: 0; }
.pg-dl dt { font-family: var(--font-meta); font-size: 0.68rem; letter-spacing: 0.14em; color: var(--red-text); padding-top: 0.3em; }
.pg-dl dd { margin: 0; font-size: clamp(1rem, 1.3vw, 1.25rem); overflow-wrap: anywhere; }

.pg-next { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.4rem 1.2rem; margin-top: clamp(3.5rem, 10vh, 7rem); padding-top: 1.5rem; border-top: 2px solid var(--ink); text-decoration: none; }
.pg-next small { font-family: var(--font-meta); font-size: 0.68rem; letter-spacing: 0.14em; color: var(--red-text); }
.pg-next strong { font-family: var(--font-display); font-weight: 400; font-size: clamp(2.2rem, 7vw, 6rem); line-height: 0.95; text-transform: uppercase; transition: color 0.25s ease; }
.pg-next:hover strong, .pg-next:focus-visible strong { color: var(--signal); }

.pg-cta { margin-top: clamp(3.5rem, 10vh, 7rem); padding: clamp(1.8rem, 5vw, 3.5rem); border: 2px solid var(--ink); border-radius: 18px; background: var(--acid); box-shadow: var(--shadow-sticker); }
.pg-cta-h { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: clamp(2rem, 6vw, 4.5rem); line-height: 0.95; text-transform: uppercase; }
.pg-cta-p { max-width: 52ch; margin: 1rem 0 1.5rem; font-size: clamp(1rem, 1.2vw, 1.15rem); line-height: 1.5; overflow-wrap: anywhere; }
.pg-cta-btn { --sticker-rotate: -2deg; font-size: 0.8rem; text-decoration: none; }
.pg-bleed { margin: clamp(3rem, 8vh, 5rem) calc(var(--pad) * -1) 0; }

.pg-footer { position: relative; z-index: 1; padding: clamp(2.5rem, 7vh, 4.5rem) var(--pad) 1.6rem; background: var(--ink); color: var(--bone); }
.pg-footer-grid { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 2rem; max-width: 1500px; margin: 0 auto; }
.pg-footer ul { margin: 0; padding: 0; list-style: none; }
.pg-footer li { margin: 0 0 0.5rem; font-size: 0.92rem; overflow-wrap: anywhere; }
.pg-footer a { text-decoration: none; opacity: 0.85; }
.pg-footer a:hover, .pg-footer a:focus-visible { opacity: 1; color: var(--acid); }
.pg-footer-name { margin: 0; font-family: var(--font-heading); font-weight: 900; font-stretch: 125%; font-size: 1.1rem; letter-spacing: 0.08em; }
.pg-footer-role { margin: 0.5rem 0 0; font-family: var(--font-meta); font-size: 0.68rem; letter-spacing: 0.08em; opacity: 0.7; }
.pg-footer-h { margin: 0 0 0.9rem; font-family: var(--font-meta); font-size: 0.64rem; letter-spacing: 0.16em; color: var(--signal); }
.pg-footer-fine { max-width: 1500px; margin: 2.5rem auto 0; padding-top: 1.2rem; border-top: 1px solid rgba(244, 241, 234, 0.2); font-family: var(--font-meta); font-size: 0.62rem; letter-spacing: 0.1em; opacity: 0.6; }

@media (max-width: 800px) {
  .pg-sec { grid-template-columns: minmax(0, 1fr); }
  .pg-footer-grid { grid-template-columns: 1fr 1fr; }
  .pg-nav a:not(.sticker):nth-child(n + 3) { display: none; }
  .pg-grid, .pg-grid--wide { columns: 2 140px; column-gap: 0.7rem; }
  .pg-grid > * { margin-bottom: 0.7rem; }
}
@media (max-width: 480px) {
  .pg-nav a:not(.sticker):nth-child(n + 2) { display: none; }
  .pg-logo { font-size: 0.78rem; }
}
@media (prefers-reduced-motion: reduce) {
  [data-rv], .pg-card { transition: none; }
}
`;
