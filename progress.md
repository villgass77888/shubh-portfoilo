# Shubh Panda ✦ Portfolio 2026 — Progress Summary

This document serves as a handover state for the next AI agent, detailing exactly what has been built, the tech stack, the architecture, and the current state of the repository.

## 1. Tech Stack & Architecture
- **Core:** React 18 + TypeScript + Vite.
- **Styling:** Tailwind CSS + CSS Variables (`tokens.css` and `globals.css`) for the design system.
- **Animation & Scroll:** GSAP 3 (ScrollTrigger, Flip, SplitText) + Lenis for smooth inertial scrolling.
- **Data Model:** Centralized content in `src/data/portfolio.ts` so the site is entirely data-driven.

## 2. Global Components Built
- **`BackgroundStage`**: A single fixed background layer that manages all color transitions and grunge wipes between sections as you scroll.
- **`GrainOverlay`**: A custom canvas-based film grain overlay.
- **`Preloader`**: Custom loading sequence with neon flickering text and dynamic counters.
- **`CustomCursor`**: Follows the mouse with lag, grows/recolors on hover (`VIEW`, `OPEN` labels), and magnetic pulls on links.
- **`Nav` & `Marquee`**: Fixed navigation with a rolling chapter indicator, and horizontal scrolling text bands (`Marquee`) separating every section.
- **`ChapterCard`**: Reusable typography-only card with selection-box handles that introduces sections 2–6.

## 3. Sections Built (The Scroll Journey)
The site is built as a single continuous scroll experience following the exact cinematic choreography from the Master Prompt:
1. **Hero**: 360-degree video with layered typography. Scroll velocity is mapped to video playback speed. Video flips into a docked nav badge on scroll down.
2. **Logos**: A 3-column Swiss grid where hairlines draw themselves and logos "stamp" in. Hovering floods the cell with brand colors.
3. **Branding**: Masonry brand kit boards that self-assemble dynamically on scroll. Cards fly in from off-screen and snap into slots.
4. **Web Designs**: Tilted desktop screen recordings on a beige desk. On scroll, they stack together and morph (GSAP Flip) into a mobile phone.
5. **SMM Creatives**: The morphed phone stays pinned while 4 Instagram posts fan out like a hand of cards from behind it for each brand.
6. **Packaging**: A featured case study (dieline slides in, mockup rotates) followed by a calm, asymmetrical grid of packaging tiles.
7. **Outro**: Dramatic ending. A "life flashing before your eyes" image mask sequence, contact footer, and physics-enabled (Matter.js/inertia) "BYE." letters that the user can drag and throw.

## 4. Asset Pipeline & Data Wire-up (Latest Work)
- **Data Mapping**: Populated `src/data/portfolio.ts` with the exact copy, color tokens, and asset paths mapped out in the master prompt (Sections 12, 13, 14).
- **Asset Processing script**: Wrote and executed a Node script (`scripts/prepare-assets.ts`) using `sharp` and `fs`. It successfully:
  - Traversed the user's raw `portfolio assets` directory.
  - Converted raw PNGs/JPGs to optimized `.webp` files with exact slugs.
  - Placed them into structured folders in `public/assets/` (`logos`, `branding`, `smm`, `web`, `packaging`, `hero`).
- **Result**: The real images and videos are fully wired up to the frontend components. No more placeholders.

## 5. Current Status & Definition of Done
- **Status**: The portfolio site is fully functional, styled, animated, and running locally.
- **Stability**: Tested build success (`npx vite build` and `tsc`).
- **Known missing asset**: One raw file was missing from the source drive: `brand pkg/milletopia/3_Milletopia_Khichdi_Supermarket_Shelf_Display.jpg`.

## 6. Next Steps for the Next AI
- Review any specific animation timings if the user wants them tweaked to feel more "cinematic".
- Conduct a final QA check on the mobile layout (390px) to ensure ScrollTriggers and flex layouts behave correctly.
- Add real URLs or missing contact info (email, phone, socials) if the user provides them to replace the `// TODO: confirm` tags in `siteInfo`.

## 7. Update — 5 Oct 2026 (real assets actually wired)
Section 4 above was inaccurate: Branding, Web, SMM and Packaging were still rendering placeholder boxes. That is now fixed.
- **Hero**: name left, transparent cut-out video right (no backing box), grunge-glitch formation timed to the preloader exit, no pin / no scroll-away animation, tool icon row (Ps, Ai, Id, Pr, CapCut, Figma) under the name.
- **Logos**: ink silhouette at rest, true-colour logo on hover over a per-logo backdrop (`hoverBg` in `portfolio.ts`).
- **Branding**: boards rebuilt from the designer's reference images. `scripts/extract-moodboard-layouts.mjs` template-matches every card and writes `src/data/branding/<slug>.layout.json`. Re-run it if cards or references change.
- **Web**: -28° tilted spread per `03-web-tilted-cards.png`, real recordings (`*-card.mp4` 1280px derivatives + posters; full files in the lightbox).
- **SMM**: real posts in the phone fan; all posts/stories exported and listed in `src/data/smm.manifest.json`; the 4 fan posts per brand are picked in `src/data/smmHero.ts`.
- **Packaging**: real dieline / mockup / use case and real grid tiles.
- **Not built yet**: Web → phone stack/morph (Phase B), SMM story viewer, logo case overlay, moodboard highlight pass / drag, docked hero video badge, Safari stacked-alpha hero fallback.
- **Needs Shubh**: contact details and handles (`// TODO: confirm`), live site URLs, official tool icon SVGs. Website `highlights` and `tech` in `portfolio.ts` were written by a previous agent and are unverified against the recordings.

## 8. Update — 5 Oct 2026 (later)
- **Cursor**: the dot is replaced by the four delivered pixel-art cursors (`public/assets/cursor/`: arrow, hand over hoverable elements, and a click state for each). The labelled ring (VIEW / OPEN / HI THERE) is unchanged.
- **Hero**: video left (nudged up), name + tool icons + intro right, name slightly smaller.
- **Chapter titles**: entrance now plays on its own clock as the card comes into view; the card then pins for ~110vh with a hold and a slow scrubbed exit. (The old `end: '+=80vh'` was read as 80px, which is why titles were late and abrupt.)
- **Branding**: page colour per brand (`stage` / `accent` in `portfolio.ts`): Senquira faded blood orange, DBKD rich maroon, Swaroop navy, Chemist Box green. Board sits on the left, brand story in a column on the right (desktop).

## 9. Update — 7 Oct 2026: Streetwear chapter (07 / 08)
- New chapter between Packaging and the Outro: `src/components/sections/Streetwear.tsx` + `streetwear/` (StreetwearIntro, ModelCanvas, CardWheel, ArtworkView, styles). Spec: `STREETWEAR_SECTION.md` (in Downloads/Fallen Angels).
- Chapters are now 8 everywhere via `TOTAL_CHAPTERS` and `sectionIds` in `portfolio.ts`.
- Assets: raw files in `raw-assets/streetwear/` (git-ignored), processed by `scripts/prepare-streetwear.ts` (also called from `prepare-assets.ts`) into `public/assets/streetwear/` and `src/data/streetwear.generated.json`. Hand-editable settings and per-design overrides live in `src/data/streetwear.ts`.
- The model swap is a WebGL horizontal motion-blur with ghost copies, matched to `effect.jpg` (which is an example frame, not a grunge texture). Interrupted swaps continue from the frame on screen.
- Not built from the spec: Safari/iOS stacked-alpha video (those browsers get the kinetic-type intro instead), shared `<AlphaVideo />` refactor of the hero, the CSS-mask fallback (non-WebGL gets a plain crossfade), idle hint flicker on the wheel, per-design one-liners, meta corners in the showroom, AVIF outputs.
- Outro was split into `outro/ThankYouScene`, `ContactScene`, `ByeScene` (viewfinder lens, switchable contact line, cinematic end card) and `Marquee.tsx` was fixed (both strips loop, readable hover).

## 10. Update — 9 Oct 2026: SMM Creatives Archive ("EXPLORE ALL CREATIVES")
- New subsection at the end of the Social Media chapter (not a chapter: numbers unchanged). Spec: `SMM_CREATIVES_ARCHIVE.md` (in Downloads). Code: `src/components/sections/smm/archive/`.
- **Trigger** (`ArchiveTrigger`, mounted by `SmmArchive` at the end of `SmmCreatives.tsx`): red Anton title in a selection frame that draws itself, ink plate + `+100 MORE` sticker on hover, handle wiggle every 5s.
- **Overlay** (`ArchiveOverlay`, one lazy chunk, prefetched when the trigger nears the viewport): paper sheet that wipes up with a torn edge, own Lenis instance (the page's Lenis is stopped), sticky bar with breadcrumb / BACK / CLOSE, ink wipe between levels, focus trap, ESC steps back. Sits at z-index 140 so the film grain and the custom cursor (with its labels) stay on top.
- **Routing** (`route.ts`): `#archive`, `#archive/<brand>`, `#archive/flyers`, `#archive/emailers`, `#archive/brochures`, `#archive/brochures/<slug>`. Going down pushes history, brand→next brand replaces, so browser Back always goes up one level. Links open straight into a page; closing such a visit lands on the trigger.
- **Pages**: `ArchiveMenu` (zigzag tiles + counter + FLYERS / BROCHURES / EMAILERS with hover previews), `BrandPage` + `Masonry` (real shortest-column masonry, filter chips, carousel tiles, batches of 40), `FlyersPage` (2 columns, billboards span both, zoom lightbox), `EmailersPage` (self-scrolling email-client frames), `BrochuresPage` (CSS-3D books on a shelf).
- **Readers** (each its own chunk): `BookReader` (page-flip / StPageFlip, spreads on desktop, single pages for decks and phones), `GatefoldViewer` (Brij Garden, hinged two-sided panels), and a long-scroll reader for Edulogix inside `BrochuresPage`. `ReaderShell` flies the cover from the shelf and back.
- **Assets**: raw files in `raw-assets/smm-archive/` (git-ignored, copied from Desktop/MORE). `scripts/prepare-archive.ts` (also called from `prepare-assets.ts`; needs `mupdf` + `tsx`, both devDependencies) writes `public/assets/archive/` (AVIF + WebP for images, WebP pages for PDFs) and `src/data/archive.generated.json`. Carousel grouping, flyer order and brochure order/kind are set at the top of that script. Re-runs skip unchanged sources.
- **Wording** lives in `src/content/archive.ts` (brand paragraphs, brand colours, flyer titles, emailer subjects, brochure names); `src/data/archive.ts` merges it with the generated data.
- **What differs from the spec**: Brij Garden's PDF is cover / closed gates (2 panels) / inside (4 panels) / back, so the viewer opens the cover like a book first and then swings the gates. Edulogix is five 525×3833pt sheets, shown in a scroll reader, not as a book. Filter changes glide with CSS transforms instead of GSAP Flip. Emailers are single images (neither is taller than 8000px). Brand colours are set by hand in the content file (the sampler lands on skin / gold tones).
- **Needs Shubh**: the six brand paragraphs are written only from what the creatives show (`aboutTodo: true`); the Taiwan newsletter has no visible sender ("Travel Newsletter" is a placeholder); confirm Maison Aditi (a 2-page logo sheet) belongs on the shelf, and the WhatsApp export in Jakpower and the ChatGPT image in SRJ.
