# Cinematic Portfolio Website — Full Build Prompt

Sep 30, 2026 · @Shubh

## 0. Read me first (how to run this file)

This file is the complete spec for building Shubh Panda's portfolio site. Give it to the coding agent (Claude Code, Cursor or similar) as the single source of truth.

**Project folder before you start**

```
portfolio/
  MASTER_PROMPT.md     this file
  raw-assets/          the whole "portfolio assets" folder, copied unchanged
  references/          the 3 inspiration files (listed below)
```

**Kickoff message to paste to the agent**

> Read MASTER\_PROMPT.md completely, then build the whole site end to end. Follow the build order in section 12 and the asset map in section 13. Do not ask me questions: wherever something is missing, use the fallback in section 15. Look at the files in references/ before building the chapter openers, the web designs and the SMM sections. After each section, run the app, check it at 1440px and 390px wide, and fix any problems before moving on. At the end, print the TODO checklist from section 15.

**Reading guide**

- Section 1 is context only (analysis of the references).
- Sections 2–4 are the stack, design system and global components, applied everywhere.
- Sections 5–11 are one section of the site each, in page order.
- Section 12 is the data model, performance, accessibility and build order. Section 13 says where every asset is and how it is processed. Section 14 is the copy and brand facts. Section 15 is what to do when something is missing.
- If two parts disagree, the later and more specific section wins (13, 14 and 15 over earlier examples; for instance, 11 logos plus a call-to-action cell, not 12 logos). In particular, wherever sections 2–12 mention notes.txt, frames/ or layout-reference.png for the moodboards, use the numbered PNGs in section 13 and the data in sections 14 and 15 instead.

**Rules for the agent**

- Never edit anything inside `raw-assets/`. All processing writes to `public/assets/` through the prepare-assets script.
- Use the exact brand names and spellings from section 14, and never invent claims, numbers, results or quotes.
- Commit after each finished section with a clear message.
- `tsc --noEmit` and `vite build` must pass before you say you are done.
- Test with `prefers-reduced-motion` on and on a 390px-wide screen.

**Reference files (put these in `references/`)**

| File | Use it for |
| --- | --- |
| `01-behance-portfolio.pdf` | Paper surfaces, torn edges, marquee strips, selection-box titles, the logo specimen grid, the "Gracias" outro. Chapter openers in this build are type only, with no photos (section 4). |
| `02-smm-phone-fan.png` | The exact SMM layout in section 9: tilted phone with 4 overlapping posts fanned at about -5°. |
| `03-web-tilted-cards.png` | The tilted desktop-card spread on a desk in section 8 (about -28°, overlapping cards, colour accent blocks). |

**Definition of done**

- All 7 sections play in order with every transition described here, on desktop and mobile.
- Every asset in section 13 is used, and every fallback in section 15 is listed in the final checklist.
- The build passes, scrolling stays smooth, and nothing important is hidden when motion is reduced.

## 1. Reference analysis

The references share one idea worth stealing: the work is never shown flat. It is always physically staged on a textured surface, tilted, taped, stacked or held by a device, so the viewer feels like they are walking through a designer's desk, not a gallery grid.

### Behance portfolio (the long screenshot)

- **Two surfaces, alternating.** Light crumpled paper with a faint graph grid for "personal" moments (intro, logo grid, outro), and near-black crumpled paper with a grid for "work" moments (branding, posters, SMM). The switch between them is a torn-paper edge, not a straight cut.
- **Chapter title cards.** Every category opens with a full-bleed moody photo of the designer at work, a huge red condensed-bold title (LOGOS & MARKS, BRANDING / VISUAL IDENTITY) inside a Figma/Illustrator-style selection box with corner handles, plus tiny red corner meta text: portfolio name, GPS coordinates, year.
- **Marquee tickers.** Black strips with white bold caps and a repeated glyph (`+++` style stars) run between every chapter. They are the rhythm of the whole page.
- **Swiss grid for logos.** Logos sit in a hairline-bordered 3-column grid on cream, each cell labelled with a tiny type tag (LOGOTYPE, EMBLEM, WORDMARK) and the brand name. Very clean against the chaos elsewhere.
- **Process as artefact.** Branding projects show a crumpled sketch sheet (handwritten notes, colour swatches, arrows) as the hero, followed by a bento-style collage of the final identity applications.
- **Collage elements.** Polaroids with handwritten quotes, a cut-out portrait with a thick red outline sticker border, a big white name knocked behind the portrait, a small hand-drawn avatar inside the word PORTFOLIO, handwritten signature arrows.
- **Outro.** A dark band, a half-lit face, an embedded playlist card, then "GRACIAS" on light paper with contact details in a single row.

### SMM presentation reference (phone + posts)

- A black iPhone mockup sits at a slight tilt on light textured paper, showing a real Instagram post UI (header, caption, date).
- The actual post creatives break out of the phone: 4 square posts overlap in a horizontal fan, all rotated about -5 degrees in the same direction, the second one sitting directly over the phone screen so it reads as "the post on the phone".
- Each post has a soft drop shadow and a thin gradient edge, so they feel like printed cards lying on paper.
- Section label top-left: bold caps client name, then the campaign in square brackets, e.g. `SOCIAL MEDIA - CLIENT NAME [ CAMPAIGN 2026 ]`.

### Web design reference (tilted desktop cards)

- 4 to 6 full-page website screenshots laid out as flat cards on a beige paper surface, all rotated about -30 degrees on one shared axis, like prints spread on a table seen from above.
- Cards overlap and bleed off the frame edges, which creates depth without any 3D perspective. Small colour blocks (lime, pink, yellow) peek out between cards as accents.

### What we take into your site

1. The staged-on-paper presentation for every piece of work.
2. Chapter title cards with the selection-box title and meta corners.
3. Marquee tickers as section dividers.
4. Light/dark paper surfaces that swap with torn or grunge wipes.
5. The exact phone + fanned posts layout for every SMM brand.
6. The tilted card spread for websites.

What we add: a real scroll-driven story (pinning, morphing, horizontal tracks), your own 360 video, and motion on every element, so it goes from a static Behance page to a cinematic site.

## 2. Master prompt: project brief and tech stack

This section and everything after it is the spec; the whole file is the prompt (see section 0).

### Brief

Build a single-page personal portfolio website in React for **Shubh Panda**, a graphic designer, web developer and brand manager based in India. The site must feel like a cinematic, premium, scroll-driven film about his work. The style is "crazy but clean": a disciplined Swiss grid underneath, with brutalist type, Y2K chrome and glitch accents, and retro print textures (paper grain, halftone, photocopy noise, tape, stickers) on top. Every element animates in, reacts on hover, and responds to scroll. Nothing appears statically.

Story order, one continuous scroll:

1. Hero (360 spinning video of Shubh)
2. Logos
3. Branding / brand kit moodboards (masonry brand kit moodboards that self-assemble)
4. Web designs (tilted desktop cards that stack and morph into a phone)
5. SMM creatives (the phone from section 4 presents each brand's posts)
6. Packaging design (assets enter from the sides with a brand intro)
7. Outro footer (dramatic thank-you and bye)

### Tech stack

- **Vite + React 18 + TypeScript.**
- **GSAP 3 with ScrollTrigger, Flip and SplitText** for all scroll choreography: pinning, scrubbed timelines, horizontal tracks, the desktop-to-phone morph. GSAP and all its plugins are free for commercial use.
- **Lenis** for smooth, inertial scrolling, synced to GSAP's ticker (`lenis.on('scroll', ScrollTrigger.update)` and `gsap.ticker.add(t => lenis.raf(t * 1000))`).
- **Framer Motion** only for component-level micro-interactions (hover, tap, layout, the preloader and nav menu). All scroll-linked animation stays in GSAP so there is one source of truth.
- **Tailwind CSS** for layout utilities, plus CSS custom properties for the design tokens in section 3.
- **An SVG `feTurbulence` filter plus a canvas noise overlay** for grain. No WebGL needed, but an optional `@react-three/fiber` displacement shader can be used for the grunge background wipes if performance allows (see section 3).
- **Content from one `src/data/portfolio.ts` file** so Shubh can add projects without touching components (see section 12).

### Folder structure

```
src/
  components/
    global/   Preloader, Cursor, Nav, Marquee, ChapterCard, GrainOverlay, BackgroundStage, SelectionBox, Sticker
    sections/ Hero, Logos, Branding, WebDesigns, SmmCreatives, Packaging, Outro
  hooks/      useLenis, useIsomorphicLayoutEffect, useReducedMotion, useMediaQuery
  data/       portfolio.ts
  styles/     tokens.css, globals.css
  assets/     video/, logos/, branding/, web/, smm/, packaging/, textures/, fonts/
```

### Non-negotiables

- Every section is its own component with its own `gsap.context()` cleaned up on unmount.
- 60 fps on a mid-range laptop. Animate only `transform`, `opacity`, `clip-path` and `filter` (sparingly).
- Fully responsive with a dedicated mobile choreography, not just scaled-down desktop (details per section).
- Respect `prefers-reduced-motion`: replace scrubbed motion with simple fades and disable the auto-scroll track.

## 3. Design system (the continuous theme)

One rule ties everything together: **ink on paper, with one loud signal colour per chapter.** Structure comes from black hairlines and bold type, never background grid lines; personality comes from texture, type scale and the chapter accent.

### Colour tokens

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | #ECE8DF | Light crumpled paper base |
| `--paper-dark` | #121212 | Dark crumpled paper base |
| `--ink` | #0D0D0D | Text on light, hairlines, strips |
| `--bone` | #F4F1EA | Text on dark |
| `--signal` | #FF2B1C | Primary accent: titles, selection boxes, meta text |
| `--acid` | #C8FF2E | Y2K accent: stickers, hover states, cursor ring |
| `--volt` | #2E3BFF | Electric blue: branding chapter |
| `--bubblegum` | #FF62C8 | Pink: SMM chapter |
| `--sun` | #FFD83A | Yellow: packaging chapter, tape |
| `--chrome` | linear-gradient(180deg, #fff 0%, #9aa0a6 45%, #fff 52%, #5f6368 100%) | Y2K chrome text and badges |

### Section backgrounds and how they change

The background is **one fixed full-screen layer** (`BackgroundStage`) behind all sections, never per-section backgrounds. As each section enters, ScrollTrigger tweens the stage to that section's colour and texture through a grunge wipe, so the page feels like one continuous surface being repainted.

| Section | Base colour | Texture | Transition into it |
| --- | --- | --- | --- |
| Hero | #F6F3EC (warm white) | White crumpled paper + grunge noise + dust speckle + light grain | Preloader burns away (see section 4) |
| Logos | #ECE8DF | Light paper + photocopy noise + dust speckle | Torn-paper edge rips upward |
| Branding | #0B0F2E (deep volt) | Photocopy noise + halftone dots | Ink-bleed mask spreads from centre |
| Web designs | #D9CDB8 (beige desk) | Kraft paper + coffee stain | Horizontal scan-line wipe (Y2K CRT) |
| SMM creatives | #ECE8DF with pink bleed | Light paper + spray-paint vignette in `--bubblegum` | Spray-paint splatter mask |
| Packaging | #F0E6CC (cardboard) | Corrugated cardboard + dieline hairlines | Tape-strip wipe (3 diagonal strips of `--sun` tape slide across, then peel) |
| Outro | #080808 | Pure black, animated film grain + light leak | Everything fades to black like a film ending |

**How to build the grunge wipe:** each transition is a full-screen PNG/WebP mask sequence or an SVG mask with `feTurbulence` + `feDisplacementMap`, applied as `mask-image` on the incoming colour layer and animated from `mask-size: 0%` to `300%` (or `clip-path` with a displaced edge). Scrub it to scroll over roughly 60vh, so the viewer controls the repaint. Keep 2 stacked layers: the current colour underneath, the next colour on top being revealed.

### Typography

| Role | Font (free, Google Fonts) | Style |
| --- | --- | --- |
| Display / chapter titles | Anton | ALL CAPS, 12–22vw, tight tracking (-0.02em), line-height 0.85 |
| Headings / UI / marquee | Archivo (variable, width 62–125) | Black weight, expanded width (wdth 125) for brutal wide caps |
| Body | Archivo | Regular 16–18px, max 60ch |
| Meta / labels / coordinates | Space Mono | 11–12px caps, +0.08em tracking, `--signal` on dark |
| Handwritten notes | Caveat | Arrows, annotations, signatures |

The variable width axis of Archivo is a motion tool: headings animate from `wdth 62` to `wdth 125` on reveal, which feels like the type is being stretched into place.

### Texture layer (always on)

- **Grain:** a fixed full-screen canvas redrawing random noise at 12 fps, `opacity 0.07`, `mix-blend-mode: overlay`, `pointer-events: none`. Increase to 0.12 on dark sections.
- **Paper:** crumpled paper photos as `background-image` on the stage, `background-blend-mode: multiply` over the base colour.
- **Grunge noise (no grid lines anywhere):** a second texture layer of scanned grunge (dust, scratches, ink speckle, photocopy toner noise) as tileable WebP at 10–18% opacity, `mix-blend-mode: multiply` on light sections and `screen` on dark ones. Its `background-position` drifts slowly on a 20s loop so the surface never looks static.
- **Halftone:** a radial-gradient dot pattern used as a mask on images during their reveal, dissolving from dots to solid.

### Recurring motifs (the design language)

1. **Selection box:** a thin `--signal` rectangle with 8 square handles around key titles and hovered works, as if selected in Illustrator. Handles pop in one by one (stagger 0.03s).
2. **Meta corners:** every pinned scene carries 4 tiny Space Mono labels in its corners: `PORTFOLIO OF SHUBH PANDA`, `20.27° N, 73.01° E` (edit to your city), `CHAPTER 02 / 07`, `2026 PORTFOLIO`.
3. **Marquee strips:** black bands with white Archivo Black caps and a `✦✦✦` glyph separator, between every section.
4. **Stickers:** rounded-rectangle acid-green or chrome stickers (`NEW`, `2026`, `CLIENT FAV`, `✦ HIRE ME`) slightly rotated, with a peeling-corner hover.
5. **Tape:** semi-transparent yellow tape strips holding images at corners.
6. **Torn paper edges:** SVG masks for the top/bottom of light sections.
7. **Sparkle glyph set:** `✦ ✧ ✱ ✚` used as bullets, dividers and cursor trail.

### Motion principles

- **Eases:** entrances `expo.out` (0.9–1.2s), exits `power3.in` (0.5s), scrubbed motion `none` (linear, scroll does the easing), playful hovers `back.out(1.7)`.
- **Stagger everything:** grids, letters, handles, cards. Default stagger 0.06s, letters 0.02s.
- **Physicality:** works always enter with rotation (±3–12°) and settle to their final tilt, as if dropped on a desk. Nothing slides in perfectly straight except UI.
- **Signature text reveal (used everywhere):** SplitText into chars, each char comes from `yPercent: 110` inside an overflow-hidden line with a random `rotate` of ±8°, plus the Archivo width stretch on headings.
- **Glitch accent (use sparingly, max once per section):** a 150ms RGB-split (duplicated text in red and blue offset 3px with `mix-blend-mode: screen`) on titles when they finish revealing.

## 4. Global elements

These components appear across the whole site and carry the consistent language between sections.

### Preloader (0–2.8s)

- Black screen, heavy grain. A Space Mono counter `000 → 100` counts in the bottom-left while a thin `--signal` progress line draws across the bottom edge.
- Centre: `SHUBH PANDA` in Anton, each letter flickering on like a failing neon sign (random opacity steps over 0.8s).
- Under it, cycling Space Mono words every 150ms: `LOGOS / BRANDING / WEB / SOCIAL / PACKAGING / LOADING TASTE...`.
- Preload the hero video (`canplaythrough`) and first-section images before exiting.
- **Exit:** the screen "burns" away, a displaced turbulence mask eats the black from the centre outward over 1s, revealing the hero already playing. The name letters fly up and scale into the nav logo position (GSAP Flip).

### Custom cursor

- Default: a 10px `--ink`/`--bone` dot (switches with background luminance via `mix-blend-mode: difference`) plus a 40px outlined ring following with lag (`gsap.quickTo`, duration 0.4).
- Over a work: ring grows to 110px, fills `--acid`, shows a label in Space Mono: `VIEW`, `DRAG`, `PLAY`, `OPEN`.
- Over a moodboard frame: label `DRAG ↔`, and the frame can be pulled out of its slot.
- Trail: moving fast leaves 3–4 fading `✦` sparkles.
- Magnetic pull on buttons and nav links (element moves up to 12px toward the cursor).
- Hidden entirely on touch devices.

### Navigation

- Fixed top bar, transparent, 3 slots: left `SHUBH PANDA ✦` logotype, centre a live chapter indicator `02 / 07 — LOGOS` that rolls to the next label (vertical text roll) as sections change, right a `MENU` button and an acid `LET'S TALK` sticker button.
- Hide on scroll down, reveal on scroll up (`yPercent` tween).
- **Menu overlay:** full-screen `--signal` panel wipes down with a torn bottom edge. Chapter names in giant Anton stacked vertically, each with its number and a hover that swaps the text for a strip of that chapter's thumbnails scrolling sideways. Clicking scrolls with Lenis `scrollTo` and the overlay tears back up.

### Marquee strips (between every section)

- Full-width black band, 56px tall, white Archivo Black expanded caps, e.g. `LOGOS & MARKS ✦✦✦ LOGOS & MARKS ✦✦✦`.
- Two strips per divider moving in opposite directions, rotated ±2°, crossing like caution tape.
- Base speed constant; scroll velocity (from Lenis) adds speed and skews the text (`skewX` up to 10°), so fast scrolling makes the whole page feel faster.
- Hover pauses a strip and turns it `--acid` with black text.

### Chapter title card (opens sections 2–6)

The opening beat of every chapter (sections 2–6): type only, no photos or video, sitting directly on that section's grungy background. Clean and loud, then straight into the content.

1. Pin for about 80vh. The screen shows only the section's grungy background and grain; its colour wipe has already finished.
2. A Space Mono kicker types in above the title: `CHAPTER 02 / 07`.
3. The chapter title (e.g. `LOGOS & MARKS`) in Anton at \~16vw, `--signal`, reveals with the signature char animation and width stretch.
4. The selection box draws around it: 4 lines draw clockwise, then the 8 handles pop in.
5. The 4 meta corners type themselves in (20ms per char).
6. On exit, the title splits (top line slides left, bottom line slides right) while the chapter content rises in underneath.

### Background stage and grain

- One fixed `BackgroundStage` component (see section 3) holds the current and next colour layers plus the paper and grunge noise textures. Each section registers its `bg` config; a ScrollTrigger per section scrubs the wipe between them.
- The grain canvas sits above everything except the cursor.

### Scroll progress

- A 2px `--signal` line on the right edge fills top to bottom, with tiny tick marks at each chapter start. Hovering a tick shows the chapter name.

## 5. Section 1 — Hero (the 360 video)

The hero is your "poster": the spinning video of you sits in the centre like a cut-out on a collage, with huge type layered in front of and behind it.

### Layout (desktop, 100vh, pinned for an extra 150vh)

- **Background:** warm white crumpled paper + grunge noise + grain (see the colour rules below).
- **Back layer:** `SHUBH` and `PANDA` in Anton at \~24vw, solid `--ink` (#0D0D0D), stacked, centred, sitting behind the video. On scroll they drift apart horizontally (SHUBH left, PANDA right) at different speeds for parallax.
- **Middle layer:** the 360 video (hero video.webm), centred, about 70vh tall, autoplay, muted, loop, `playsInline`. Give it a thick **cut-out sticker outline** in `--signal` (as in the reference portrait) by rendering it with a transparent background: the delivered video is already a transparent WebM (see the hero video notes in section 13 for the Safari fallback).
- **Front layer:** a thin strip of Space Mono text across the chest height: `GRAPHIC DESIGNER ✦ WEB DEVELOPER ✦ BRAND MANAGER`, scrolling as a small marquee (black strip, white text, per the white-hero rules below).
- **Top-left:** `PORTFOLIO` in Archivo expanded, with `2026` in Space Mono.
- **Bottom-left:** a short intro paragraph (2 lines) and `✦ Freelance since 2020`.
- **Bottom-right:** `SCROLL TO ENTER THE WORK ↓` with an animated arrow, and 3 small skill stickers (Ps, Ai, React logos as chrome badges) that bob gently.
- **Corners:** the meta corners from section 4.
- **Handwritten annotation:** a Caveat note `← that's me. yes, i'm a bit dizzy` with a drawn arrow pointing at the video, stroke-animated (SVG `stroke-dashoffset`).

### White hero: colour rules

The hero sits on warm white paper (#F6F3EC) with a white-ish grunge texture: crumpled paper, dust speckle and toner noise, grain at about 6% opacity with `mix-blend-mode: multiply`. Everything on it is recoloured for light:

- **Type:** all hero text is `--ink`. Meta corners, the Caveat note and the skill labels are `--ink` too; `--signal` is reserved for the outline around the video and small accents.
- **Stickers:** acid-green (`--acid`) and chrome stickers get a 2px `--ink` border and a hard offset shadow (4px 4px, `--ink`) so they stay readable on white. This is also the brutalist look.
- **Video:** the red `--signal` cut-out outline works best on white. Blend the video onto the paper with `mix-blend-mode: multiply` if it has a white background; if it has alpha, no blend is needed.
- **Tickers:** the strip across the chest is black with white text (reversed), so it reads as a bold band on the white page.
- **Preloader:** stays black. The burn-away reveals the white hero, which makes the entrance a hard black-to-white cut.
- **Docked video badge:** gets an `--ink` ring so it stays visible on every section's background.
- **Transition into Logos:** both sections are light, so the hand-off must not rely on a colour change. The torn edge uses a dark under-shadow and a black marquee strip crossing the seam, and the Logos paper is the slightly warmer `#ECE8DF` so the edge is still visible.

### Intro animation (after preloader, 2.2s total)

1. Video fades in from `scale 1.3, blur 20px` to `scale 1, blur 0` (1.4s, expo.out).
2. The red outline draws around the silhouette (if using a CSS `drop-shadow` outline, animate its spread from 0 to 6px).
3. `SHUBH` and `PANDA` rise letter by letter behind the video (stagger 0.04s), with the Archivo-style width stretch.
4. Stickers drop in from above with rotation and a bounce (`back.out`), one after another.
5. The handwritten arrow draws itself last.

### Scroll choreography (scrubbed over the 150vh pin)

- **Playback control:** while pinned, scroll also speeds up the video: map scroll velocity to `video.playbackRate` (1 → 3) so a fast flick makes you spin faster, then eases back to 1. It makes the hero feel alive and touch-responsive.
- Names split apart and move off-screen left and right.
- Video scales down to 40% and moves toward the top-right corner, then shrinks into a small circular "live" badge that stays docked in the nav for the rest of the site (GSAP Flip into a 44px circle). Clicking it scrolls back to top.
- The dark paper starts tearing from the bottom: the torn edge of the Logos section's light paper slides up over the hero.

### Micro-interactions

- Mouse move tilts the whole layered collage in 3D (max 6°, `rotateX/rotateY` on the wrapper) with the layers moving at different depths.
- Hovering the video: cursor label `HI THERE` and the red outline flickers once.
- Hovering `SHUBH` or `PANDA`: the hovered letter swaps to a random glyph from the sparkle set, then back (letter scramble).

### Mobile

- Video top-centre at 55vh, names stacked below it at 20vw, no 3D tilt. Scroll pin reduced to 80vh; the video-to-badge Flip still happens.

## 6. Section 2 — Logos

The logos chapter is the calm, clean breath after the loud hero: a Swiss specimen grid on light paper, but every cell comes alive.

### Entry

- Torn light paper rips up over the hero (section 5).
- Marquee strip: `LOGOS & MARKS ✦✦✦`.
- Chapter title card `LOGOS & MARKS` (section 4).

### Layout

- Light paper + grunge noise background.
- A **3-column hairline grid** (2 on tablet, 1 on mobile) of square cells, 1px `--ink` borders shared between cells like a specimen sheet. 11 logos plus a call-to-action cell (section 13).
- Each cell: the logo centred in black, a tiny Space Mono type tag top-centre (`LOGOTYPE`, `EMBLEM`, `MONOGRAM`, `BADGE`, `WORDMARK`), and the client name bottom-centre.
- Above the grid, left: a short line in Archivo, `Marks that outlive trends.` Right: a counter `11 MARKS ✦ 2020–2026`.

### Scroll-in transition: "the grid draws itself"

1. The hairlines draw first: all horizontal lines scale in from the left, then vertical lines from the top (scrubbed, like a printer ruling the sheet).
2. Logos then **stamp** into their cells one by one in a diagonal wave (top-left to bottom-right): each starts at `scale 1.6, opacity 0, rotate ±10°, blur 6px` and slams down to `scale 1` with a tiny camera shake on the grid (`x` jitter of 2px, 0.1s). Ink-stamp feel.
3. Type tags and names type in right after each logo lands.

### Per-logo interaction (the "alive" part)

- **Hover:** the cell background floods with the brand's primary colour from the cursor's entry point (circular `clip-path` from mouse position), the logo turns white (logos are transparent PNGs: use CSS filter brightness(0) invert(1), or use the PNG as a mask-image over a solid fill to recolour it any colour), the selection box with handles appears around the logo, and a small tag slides up from the bottom: brand colour chips + the brand's typeface name.
- **Hover out:** the flood retracts toward the exit point.
- **Click:** opens a full-screen **logo case overlay**: the logo animates (Flip) from its cell to centre stage at large size, then its construction is shown: grid/golden-ratio lines draw over it in `--signal` hairlines, then the logo in 3 colourways slides in below, plus a one-line story. Close with `ESC` or an `✕` sticker.
- **Idle life:** every 4s one random logo in the grid does a tiny glitch flicker (RGB split for 120ms) so the grid never feels frozen.

### Exit

- As you scroll past, the grid cells fall away individually with gravity (random `y` 100–300px, rotation, fade), like tiles dropping off a wall, revealing the next wipe.

### Mobile

- 2-column grid on tablets, 1 column on phones with larger cells. Hover becomes tap-to-flood; a second tap opens the overlay.

## 7. Section 3 — Branding / brand kit moodboards

Each brand's identity is shown as a **brand kit moodboard**: a masonry board of individual frames (logo, colours, typography, patterns, mockups, photography). The agent rebuilds every board faithfully from the designer's reference layout, and as the viewer scrolls, each frame flies in from the left or right and self-arranges into its slot in a set order. Brands arrive one after another.

### Entry

- Ink-bleed wipe to deep volt #0B0F2E with photocopy noise and halftone (section 3).
- Marquee: `BRANDING ✦✦✦ VISUAL IDENTITY ✦✦✦`.
- Chapter title card `BRANDING / VISUAL IDENTITY`.

### Inputs per brand (what the agent receives)

For every brand, the designer provides one folder (exact paths are in section 13):

- `brand guidelines moodboard/<brand>_cards/`: every frame of the moodboard as its own numbered, transparent PNG (`01_primary_logo.png` and so on), as listed in section 13.
- `layout-reference.png` (optional, not delivered yet): the complete moodboard as one arranged image. When present it is the source of truth for placement, sizes, gaps and corner radius; when absent, use the fallback layout in section 15.
- There is no `notes.txt`. Brand facts come from section 14, and colour HEX codes and font names are sampled or read from the frames (section 15).

**Step 1: reconstruct each layout into `layout.json` (at build time, never in the browser).**

1. Open `layout-reference.png` and every PNG in `frames/`. Inspect them visually; if you cannot view images, write a Node script using `sharp` with perceptual hashing or OpenCV template matching.
2. Match each frame PNG to its position in the reference by content and aspect ratio. Use every frame exactly once. A frame with no match goes at the end of the board with a console warning; a frame in the reference with no PNG is logged and skipped.
3. Measure each frame's bounding box in the reference and store it normalised to the reference width: `x`, `y`, `w`, `h` as 0–1 values (`y` and `h` also divided by width, so aspect ratio is preserved). Also record the reference's overall aspect ratio, the gap between frames and the corner radius.
4. Detect the column structure (moodboards usually use 3–6 columns, with frames spanning 1–3). Store `col` and `colSpan` per frame for the mobile reflow.
5. Assign each frame's `order` and `from` using the rules in the entrance section below, unless `notes.txt` overrides them.
6. Write `src/data/branding/<brand-slug>.layout.json` and import it into `portfolio.ts`.
7. Generate WebP/AVIF derivatives of each frame at 1x and 2x its rendered size.

### Rendering the masonry board

- **One pinned scene per brand**, stacked vertically so brands arrive one by one. Pin length about 200–250vh per brand, longer for boards with many frames.
- **Brand intro** (left column on desktop, above the board on mobile): brand name in Anton, one-line brief, industry and year in Space Mono, and colour chips from `notes.txt`. It types in just before the first frame arrives.
- **Board sizing:** a `position: relative` container that fills about 70vw (or fits 82vh in height, whichever is smaller), with its height taken from the reference aspect ratio. A board taller than the viewport scales down to fit while pinned rather than scrolling inside.
- **Frame placement:** frames are absolutely positioned from `layout.json` (`left: x × 100%`, `top: y × boardWidth`, `width: w × 100%`), so the board is a faithful rebuild of the reference at any screen size. Gap and corner radius match the reference. Frames keep their transparency and get a soft drop shadow so they sit on the grungy background.
- **Background:** between brands, the background stage tints toward each brand's primary colour (a 20% mix with the chapter's base).

### The self-arranging entrance (the key feature)

The entrance is scrubbed to scroll during the pin, so the viewer drives the assembly and can scroll back to watch the board come apart.

1. **Order:** frames arrive in a designed sequence, never random: the main logo frame first, then logo variations, colour palette, typography, patterns and graphic elements, then mockups, applications and photography last. Within one category, follow the reference's reading order (top-left to bottom-right).
2. **Direction:** a frame whose centre is in the left half of the board enters from the left edge of the viewport; right half from the right. Frames centred within 10% of the middle alternate sides so both sides stay busy.
3. **Start state:** off-screen on its side (`x` = ±60–110vw, randomised but seeded so it is identical on every load), `y` offset ±15vh, `rotate` ±10–18° tilted toward its direction of travel, `scale 0.85`, `filter: blur(4px)`.
4. **Travel:** each frame slides toward its slot on a slight arc, straightening and sharpening as it goes. Stagger so 2–3 frames are in flight at once (each tween overlaps the previous by about 60%).
5. **Self-arranging snap:** the frame lands just beside its slot (overshoot of 2–4% of board width), then snaps exactly into place with `back.out(2)` over the last 15% of its tween. As it lands, already-placed neighbours get a 3–6px spring nudge away and back, as if it pushed its way into the grid.
6. **Landing flash:** a `--signal` selection box flashes around the frame for 250ms (lines draw, handles pop, fade), and its shadow grows from 0 to full.
7. **Completion beat:** when the last frame lands, the whole board settles once (`scale 1.01 → 1`, 0.4s) and the brand name gets the glitch accent.

### After assembly: highlight, interact, exit

- **Slow highlight pass:** with the board assembled, a slight 1.08x zoom and a slow sideways drift (about 30px/s) begin, and frames are highlighted one at a time in entrance order. Neighbours dim to 60%, and the highlighted frame gets a selection box plus a callout label from `notes.txt` (e.g. HEX codes, font names). Scrolling advances the pass; when the viewer stops, the drift continues on its own.
- **Hover a frame:** it lifts (`y -8px`, `scale 1.03`, shadow grows) and the others dim slightly. Cursor label `VIEW`.
- **Drag a frame:** it can be pulled out of its slot a little and springs back on release (GSAP Draggable with an elastic ease).
- **Click a frame:** opens it large in a lightbox; arrows and arrow keys step through the brand's frames in entrance order.
- **Exit to the next brand:** frames leave in reverse order, each flying out to the opposite side it came from, while the next brand's intro types in and its frames begin arriving. After the last brand, the board fades and slides up as the chapter ends.

### Mobile

- No pin. The board reflows into a 2-column masonry using each frame's `colSpan` (spans of 2 or more become full width), in reference reading order.
- Each frame enters as it scrolls into view: left-column frames from the left, right-column frames from the right, full-width frames alternating. Same snap and landing flash, with shorter travel (40vw).
- Tap opens the lightbox. The highlight pass is skipped.

## 8. Section 4 — Web designs (desktop cards that become a phone)

Website screen recordings drop one by one onto a beige desk in the tilted spread from the reference, then gather into a single stack that shrinks into a phone. That phone carries the viewer straight into the SMM chapter.

**Build note:** sections 4 and 5 must be **one pinned scene component** (`WebToSocialScene`) driven by one long GSAP timeline, so the phone element is literally the same DOM node across both chapters. Total pin length about 700–900vh on desktop, split into labelled timeline segments.

### Entry

- CRT scan-line wipe to beige desk #D9CDB8 with kraft paper and a faint coffee-ring stain (section 3). A brief horizontal RGB line sweeps down like an old monitor switching on.
- Marquee: `WEB DESIGN ✦✦✦ DEVELOPMENT ✦✦✦`.
- Chapter title card `WEB DESIGN & DEVELOPMENT`.

### Phase A — the spread builds (scrubbed)

- A tilted "table plane": a wrapper rotated `-28°` (matching the reference), scaled so cards bleed off the frame edges.
- 5–7 website cards, each a **screen-recording video in a desktop-ratio (16:10) frame**. Cards are laid out in 3 staggered columns like the reference, overlapping by about 10%, with small colour blocks (acid, bubblegum, sun) tucked between them as accents.
- Cards arrive **one per scroll step**, each entering from off-screen along the table's diagonal (as if slid across the desk by a hand): start `x/y` offset 120vw along the tilt axis, `rotate +6°` relative, then settle with a slight overshoot. A soft shadow grows as each lands.
- **Every desktop card is live: inside each card, the screenshot auto-scrolls** from top to bottom slowly (translateY over 8–12s, looping with a pause), so every site looks like it's being browsed.
- As each card lands, a label sticker pops beside it: project name, `REACT / WORDPRESS / SHOPIFY` tech chip, and a `LIVE ↗` link.
- A left-side text column (outside the tilted plane) updates per card: project name in Archivo expanded, client type (cafe, restaurant, jewellery, hotel), a one-line result, and a `01 / 06` counter that rolls.

### Card interactions (during Phase A)

- Hover a card: it rises out of the plane (`z` lift via `scale 1.04`, shadow deepens), the others dim, and its auto-scroll speeds up 3x. Cursor label `OPEN`.
- Click: opens the site in a lightbox playing the recording larger in a browser chrome frame with fake traffic-light buttons and play, pause and mute controls, with a `VISIT LIVE SITE ↗` button.

### Phase B — the stack and morph (scrubbed, about 150vh)

1. The table plane rotates back to 0°, and all cards **slide together into one centred stack** (GSAP Flip from spread positions to a pile, each card offset by 4px and ±2° so the pile looks physical).
2. The pile's cards fan out slightly, then compress back as if shuffled once (a 0.4s "shuffle" beat).
3. The top card's frame **morphs from desktop ratio (16:10) to mobile ratio (9:19.5)**: animate width, height and `border-radius` (8px → 48px). The screenshot inside cross-fades to that same site's mobile screenshot.
4. A **phone bezel draws around it**: the black outer frame scales in from the card's edges, then the dynamic island, side buttons and a subtle chrome edge highlight fade in. The remaining desktop cards slide out behind the phone and fade away.
5. A Caveat annotation appears beside the phone: `+ responsive, obviously` with a drawn arrow.
6. The mobile site screenshot scrolls once inside the phone, then the screen **swaps to an Instagram profile grid UI**. This is the hand-off: the marquee `SOCIAL MEDIA ✦✦✦ CREATIVES ✦✦✦` slides across behind the phone and the background spray-paint wipe to the SMM chapter begins while the phone stays centred.

### Mobile

- No tilted plane: cards appear as a vertical stack of tilted cards (alternating ±4°) that enter from left/right on scroll, each playing its site video on loop. Phase B is simplified: the last card morphs into the phone via the same width/height/radius tween with a shorter pin (150vh).

## 9. Section 5 — SMM creatives (the phone presents each brand)

Every brand's posts burst out of the phone and fan into the exact layout from your reference: the phone tilted on paper, 4 square posts overlapping in a horizontal fan, the second post sitting over the phone screen. Brands arrive one by one on scroll; this presentation style is used for **every** SMM creative, no exceptions.

### Background

- Spray-paint splatter wipe into light paper #ECE8DF with a soft `--bubblegum` spray vignette at the edges (section 3). Each brand then tints the spray vignette to its own primary colour (crossfade 0.8s).

### Per-brand layout (matches the reference)

- **Section label, top-left:** `SOCIAL MEDIA — BRAND NAME` in bold Archivo caps, then `[ CAMPAIGN 2026 ]` in a lighter weight with square brackets. Types in on arrival; the brackets snap outward from the centre.
- **Phone:** the same phone from section 4, centre-left, rotated -6°, showing an Instagram post screen: status bar `9:41`, back arrow, `Posts` header with the brand handle, profile row, the post, and caption + date below. The caption and handle come from data.
- **Post fan:** 4 square posts (1:1; also support 4:5) in one row, all rotated -5°, overlapping by about 6%. Post 1 left of the phone, post 2 exactly over the phone's post area, posts 3 and 4 to the right. Each has a soft shadow and a thin gradient bottom edge like the reference.
- **Right or bottom corner:** small meta: `12 POSTS ✦ 3 REELS ✦ +48% REACH` (optional stats from data) and a `SEE ALL →` sticker.

### Brand-in choreography (scrubbed, about 120vh per brand)

1. The phone screen loads the brand's profile: the handle and avatar pop in, a skeleton shimmer runs over the post area for 0.3s.
2. **Post 2 materialises on the phone screen** (fades in inside the screen at its exact position).
3. Then the post **lifts off the screen** (scale 1 → 1.08, shadow grows) and the other three posts **slide out from underneath it**, dealt like playing cards: post 1 slides left, posts 3 and 4 slide right in sequence (stagger 0.12s), each with a small rotation overshoot before settling at -5°.
4. The caption text under the phone types in, the date fades up.
5. A like-heart burst (Y2K chrome heart sticker with 6 sparkle particles) pops on post 2 as the fan finishes.

### Brand-out and the next brand

- The 4 posts **gather back** into the phone screen in reverse order (like cards collected into a deck) and the screen swipes up (Instagram-style vertical swipe) to reveal the next brand's profile.
- The label text scrambles into the next brand's name (character scramble).
- The phone does a small 3D flip on its Y axis (360°, 0.9s) during the swipe on every third brand, just to break the rhythm.

### Interactions

- Hover a post: it straightens to 0°, scales to 1.12, comes to the front, the others push slightly away (spring). Cursor label `VIEW`.
- Click a post: a lightbox opens with that brand's full carousel set (swipeable, dots indicator in Instagram style), plus reels as muted autoplay videos.
- `SEE ALL →` opens a full-screen masonry wall of that brand's creatives that cascade in (stagger 0.03s, random delays) over the brand-coloured spray background.
- Mouse move gives the whole fan a subtle parallax: phone moves least, outer posts move most.

### After the last brand

- The phone drops out of frame downward with a rotation (like it slipped off the desk), and the torn cardboard edge of the packaging section slides in.

### Mobile

- The phone is centred and smaller; posts fan in a 2x2 cluster around it instead of a row, same deal-out motion. The full carousel opens as a bottom sheet.

## 10. Section 6 — Packaging design

The packaging chapter opens with one hero project told as a three-part story (dieline, mockup, use case) whose pieces slide in from the sides around a brand intro, then relaxes into a calmer gallery of more packaging as the page keeps moving up.

### Entry

- Tape-strip wipe: 3 diagonal strips of `--sun` tape slide across the screen, the cardboard background #F0E6CC appears under them, then the tapes peel off one corner first (section 3).
- Marquee: `PACKAGING ✦✦✦ DIELINE TO SHELF ✦✦✦`.
- Chapter title card `PACKAGING DESIGN`.

### Part 1 — featured project (pinned, about 250vh)

**Layout (12-column grid, desktop):**

| Zone | Columns | Content |
| --- | --- | --- |
| Left | 1–4 | **Dieline**: the flat technical die-cut drawing on white, with cut/fold line legend |
| Centre | 5–8 | **Brand intro**: brand logo, name in Anton, 3–4 line story, product type, client, year, and 3 brand colour chips |
| Right | 9–12 | **Mockup**: the photoreal box/bag/label render |
| Bottom, full width | 1–12 | **Use case**: in-context lifestyle photo (product on a shelf, in hand, at the cafe counter) as a wide cinematic strip |

**Scrubbed choreography:**

1. The brand intro types in first in the centre: logo stamps down, name reveals with the char animation, story lines fade up line by line, colour chips pop in.
2. **Dieline enters from the left edge** (transparent PNG), sliding in with a -8° rotation and settling at -3°, taped at 2 corners. As it lands, a thin `--signal` scan line sweeps across it like a plotter cutting, revealing the dieline behind it via a `clip-path` wipe, with a faint red glow trailing the line.
3. **Mockup enters from the right edge**, rotating in from +10° to +2°, then does a slow 3D turntable feel: a subtle `rotateY` of ±12° tied to mouse X (or, if you have a turntable MP4/image sequence of the pack, scrub its frames with scroll).
4. A thin hairline connector with a Caveat label `folds into →` draws from the dieline to the mockup across the intro, linking the two stories.
5. **Use case rises from the bottom** as a wide strip, revealed with a horizontal `clip-path` wipe (like a curtain opening), plus a slow Ken Burns zoom inside.
6. All 4 zones hold for a beat, then the whole composition drifts upward together as the pin releases.

**Hover:** dieline shows a measurement overlay (dimensions in Space Mono); mockup cursor label `SPIN`; use case cursor label `IN THE WILD`.

### Part 2 — more packaging (no pin, gentle motion)

- As scrolling continues, a relaxed **asymmetric grid** of more packaging projects moves up into view with normal scrolling (no pin, no scroll-jacking): mixed sizes (2x1, 1x1, 1x2 tiles), cardboard background continues.
- **Soft entrances only:** each tile fades from `opacity 0, y 40px` to rest (0.8s, `power2.out`), no rotation, no wipes, as requested. Light parallax on images inside tiles (`yPercent` ±8 scrubbed).
- Each tile: image, brand name, product type, and a small tape piece in one corner.
- Hover: image swaps from mockup to dieline (crossfade), tile lifts slightly. Click: opens the same 4-zone layout in a lightbox.

### Exit

- The grid's last row fades to black from the bottom up (a tall gradient scrubbed over 60vh), the grain intensifies, and the background stage goes to #080808 for the outro.

### Mobile

- Part 1 stacks vertically: intro, then dieline sliding from the left, mockup from the right, use case rising, each triggered as it enters. Part 2 becomes a 2-column grid.

## 11. Section 7 — Outro: the dramatic ending

The outro plays like film end credits: black screen, a light leak, a giant thank-you, then your contact details and a playful "bye" that the viewer can interact with.

### Scene 1 — the thank-you (pinned, about 150vh)

- Pure black #080808, animated film grain at 0.14 opacity, and an orange-red **light leak** (a blurred radial gradient) drifting slowly across the frame, like the end of a film reel.
- A projector flicker: the whole screen's brightness pulses subtly twice as the scene starts.
- `THANK YOU` in Anton at \~22vw reveals word by word, each word coming out of a vertical blur (`filter: blur(30px) → 0`, `scaleY 2 → 1`), in bone colour.
- Below it, `FOR SCROLLING THIS FAR` in Space Mono, typed in.
- Then the selection box draws around `THANK YOU` one final time, and a Caveat note appears: `seriously, it means a lot` with a hand-drawn heart.
- On further scroll, `THANK YOU` scales up to fill the screen and **becomes a mask**: through the letters, a fast montage of all your works from every chapter flashes by (one image per 80ms, a "life flashing before your eyes" recap). Then the letters close to black.

### Scene 2 — the contact footer

- The torn light paper edge rips up one last time over the black (bookending the hero), showing light, grungy paper.
- Top: the sparkle glyph row `✦ ✧ ✱` and `LET'S MAKE SOMETHING LOUD` in Archivo expanded.
- A giant email address in Anton that fills the width; hover turns it `--signal` with a chrome underline sweep, click copies it and shows a sticker toast `COPIED ✦`.
- One row of contact items: phone, email, Instagram, Behance, LinkedIn. Each is a magnetic pill button that flips (rotateX 180°) to show the platform name on its back on hover.
- A "services" ticker marquee: `LOGOS ✦ BRANDING ✦ WEB ✦ SOCIAL ✦ PACKAGING ✦ AVAILABLE FOR FREELANCE 2026`.
- Small print row in Space Mono: `© 2026 SHUBH PANDA ✦ DESIGNED & DEVELOPED BY ME ✦ BACK TO TOP ↑`.

### Scene 3 — the bye

- At the very bottom, `BYE.` in Anton at \~40vw, half cut off by the bottom edge of the viewport (brutalist crop).
- Each letter is **physics-driven**: using a light 2D physics library (Matter.js) or GSAP inertia, the letters can be grabbed and thrown by the cursor and bounce off each other and the edges. On touch, tap to knock them.
- The docked 360 video badge from the hero flies down and lands next to `BYE.`, grows back to a medium size, and plays one last spin, then freezes on its front-facing frame. Clicking it smooth-scrolls back to the hero, where the preloader-style burn transition replays in reverse.
- Idle after 6s: the letters slowly sag and slump like melting wax (a small `scaleY` drop with `transform-origin: bottom`), a final tongue-in-cheek beat.

### Mobile

- Scene 1 keeps the reveal but skips the letter-mask montage (replace with a quick 1s crossfade slideshow behind the text). `BYE.` letters respond to tap and device tilt (DeviceOrientation, with permission) instead of drag.

## 12. Content data, assets, performance and build order

### Content data (`src/data/portfolio.ts`)

All sections read from typed arrays so new work is added without editing components:

```ts
// generated per brand by the layout step in section 7; x, y, w, h normalised to the reference width
export type MoodboardFrame = { src: string; x: number; y: number; w: number; h: number; col: number; colSpan: number; order: number; from: 'left' | 'right'; category?: 'logo' | 'variation' | 'color' | 'type' | 'pattern' | 'mockup' | 'photo' | 'other'; label?: string };

export const logos = [
  { name: 'Brand', tag: 'LOGOTYPE', src: '/logos/brand.png', color: '#FF6A00', typeface: 'Nohemi', story: '' },
];

export const brands = [
  { name: 'Brand', brief: '', industry: '', year: 2026, primary: '#2E3BFF',
    reference: '/branding/brand/layout-reference.png', aspect: 1.6, gap: 0.01, radius: 12,
    frames: [] as MoodboardFrame[] /* imported from brand.layout.json */ },
];

export const websites = [
  { name: 'Site', client: 'Cafe', tech: ['React'], url: 'https://', video: '/web/site-desktop.mp4', mobileVideo: '/web/site-mobile.mp4', result: '' },
];

export const smm = [
  { brand: 'Brand', campaign: 'CAMPAIGN 2026', handle: 'brand', avatar: '/smm/brand/avatar.webp', caption: '', date: '',
    primary: '#FF62C8', posts: ['/smm/brand/1.webp', '/smm/brand/2.webp', '/smm/brand/3.webp', '/smm/brand/4.webp'],
    all: [] as string[], reels: [] as string[], stats: '' },
];

export const packaging = {
  featured: { brand: '', story: '', product: '', client: '', year: 2026, colors: [] as string[],
    dieline: '/packaging/f/dieline.png', mockup: '/packaging/f/mockup.webp', usecase: '/packaging/f/usecase.webp' },
  more: [{ brand: '', product: '', mockup: '', dieline: '', size: '2x1' }],
};
```

Provide placeholder content and neutral placeholder images for every array so the site runs before real assets are added.

### Asset specs

| Asset | Format | Size target |
| --- | --- | --- |
| Hero 360 video | WebM VP9 with alpha (delivered); a stacked-alpha H.264 MP4 for Safari and iOS is generated from it | 1080p, 8–12s loop, under 6 MB |
| Logos | Transparent PNG, 2000px+, trimmed tight | under 150 KB each after compression |
| Moodboard frames (transparent PNG) and layout reference, posts, mockups | WebP/AVIF, `srcset` 800/1600px | under 250 KB each |
| Website screenshots | MP4 (H.264) + WebM (VP9), 1440×900 desktop and 390×900 mobile, 8–12s loops at 30fps | under 8 MB each |
| Dieline | Transparent PNG, 3000px+ long side | — |
| Textures (paper, cardboard, grunge masks) | WebP, tileable where possible | under 200 KB each |

### Performance

- Lazy-load every section's images with `loading="lazy"` and preload only the next section's first assets when the previous section is 50% through.
- Pause the hero video and all auto-scroll tickers when their section is off-screen (IntersectionObserver).
- Use `will-change: transform` only during active animations; remove it after.
- Call `ScrollTrigger.refresh()` after images load, and use `ScrollTrigger.matchMedia` (or `gsap.matchMedia`) for desktop vs mobile timelines.
- Target Lighthouse performance 85+ on desktop; keep total initial JS under 250 KB gzipped (code-split sections with `React.lazy`).

### Accessibility

- `prefers-reduced-motion`: no pins, no scrub, no auto-drift, no physics; simple fades and a standard layout.
- All images have alt text from data; lightboxes trap focus and close on `ESC`; custom cursor never replaces focus outlines.
- Keyboard: nav, menu, lightboxes and tracks are fully operable; all lightboxes respond to arrow keys.

### Build order

1. Tokens, fonts, Lenis + GSAP setup, grain overlay, `BackgroundStage` with the wipe system.
2. Global components: cursor, nav, marquee, chapter title card, selection box, stickers.
3. Hero with the video and the video-to-badge Flip.
4. Logos grid.
5. Branding moodboards: the layout.json step first, then rendering and the self-arranging entrance.
6. `WebToSocialScene` (web spread, stack/morph, SMM brands) as one component.
7. Packaging featured + grid.
8. Outro with the mask montage and physics `BYE.`.
9. Preloader last (it depends on knowing which assets to preload), then mobile choreography, reduced motion, and performance pass.

## 13. Asset map

All raw assets live in Shubh's folder `portfolio assets/` (mirrored on Google Drive). Copy it **unchanged** into the project as `raw-assets/`, never edit files there, and write a build script `scripts/prepare-assets.ts` that reads it and writes optimised, slug-named files to `public/assets/`:

- **Images:** `sharp` → WebP + AVIF at 1x and 2x of rendered size; transparent PNGs keep their alpha; trim transparent padding.
- **Videos:** `ffmpeg` → H.264 MP4 (`-crf 28 -an -movflags +faststart`, 1440px wide, 30fps) plus VP9 WebM, and a `-poster.webp` from the first frame. Keep the full recording length (the site's transitions must stay visible) and strip audio.
- Re-running the script must be safe and only rebuild changed files.

### Folder overview

| Raw folder | Section | Output folder |
| --- | --- | --- |
| `brand logos/` | 2 Logos | `public/assets/logos/` |
| `brand guidelines moodboard/` | 3 Branding | `public/assets/branding/<slug>/` |
| `website ss/` | 4 Web designs | `public/assets/web/` |
| `social media posts/` | 5 SMM | `public/assets/smm/<slug>/` |
| `brand pkg/` | 6 Packaging | `public/assets/packaging/<slug>/` |
| `hero/` (delivered as hero video.webm at the root of the folder, see the hero video notes below) | 1 Hero | `public/assets/hero/` |

### Hero video (`hero video.webm`)

Delivered: `raw-assets/hero video.webm`, VP9 WebM with a transparent background, about 2 MB. It is the 360° spinning video of Shubh used in section 5.

- **Verify first.** Run `ffprobe` on the file and log duration, resolution, fps and pixel format. Confirm it really has alpha (`pix_fmt` `yuva420p`, or the `alpha_mode` stream tag set to 1). If it has no alpha, add that to the final checklist and use the multiply-blend fallback from the white-hero rules in section 5.
- **Do not destroy the alpha.** Copy it to `public/assets/hero/shubh-360.webm`. If it must be recompressed, use `ffmpeg -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 32`; the `-auto-alt-ref 0` flag is required or alpha is lost.
- **Poster.** Extract the front-facing frame with alpha as `shubh-360-poster.webp`. Show it before the video loads and instead of the video when `prefers-reduced-motion` is on.
- **Safari and iOS fallback.** Those browsers do not play VP9 alpha WebM with transparency. Generate a stacked-alpha H.264 file, with colour in the left half and the greyscale alpha matte in the right half: `ffmpeg -c:v libvpx-vp9 -i "hero video.webm" -filter_complex "[0:v]split[a][b];[a]alphaextract,format=yuv420p[m];[b]format=yuv420p[c];[c][m]hstack" -c:v libx264 -crf 24 -an shubh-360-stacked.mp4` (the `libvpx-vp9` decoder before `-i` is what keeps alpha readable). In the browser, play it in a hidden `<video>` and draw it to a `<canvas>` every frame (`requestVideoFrameCallback`, falling back to `requestAnimationFrame`), using a small WebGL shader or canvas compositing that reads the left half as colour and the right half as alpha.
- **One component.** Build `<HeroVideo />` that picks the native WebM path or the canvas path by feature detection (use the canvas path on Safari and all iOS browsers), exposes the same `playbackRate` control for the scroll-speed effect in section 5, and the same element the Flip animation shrinks into the nav badge.
- **Playback.** `muted`, `loop`, `playsInline`, `autoplay`, `preload="auto"`; pause it when the hero is off-screen.
- **Outline.** The red cut-out outline around the figure is a stack of CSS `drop-shadow` filters on the video (or on the canvas), which follow the alpha edge.
- **Loop seam.** If a jump is visible where the loop restarts, hide it with a 120ms RGB-split glitch at that moment.

### Logos (`brand logos/`)

11 logos fill 11 cells of the 3-column grid. The 12th cell is a call-to-action cell: `YOUR BRAND NEXT ✦` in Anton on `--signal`, linking to the contact section. Grid order is the table order.

| Brand | Main logo (grid) | White variant (hover flood) | Slug |
| --- | --- | --- | --- |
| Senquira | `senquira.png` | none | `senquira` |
| Do Bhaion Ki Dukan | `DBKD Logo Golden Variant.png` | `DBKD Logo white.png` | `dbkd` |
| Chemist Box | `chemist box.png` | `chemist box white.png` | `chemist-box` |
| Swaroop Realty | `swaroop logo.png` | `swaroop white.png` | `swaroop-realty` |
| Croppd | `croppd.png` | `croppd white.png` | `croppd` |
| That Coffee | `that coffee.png` | `that coffee white.png` | `that-coffee` |
| Reish | `Reish.png` | `Reish white.png` | `reish` |
| Aura Rosetry | `logo.png` | none | `aura-rosetry` |
| Organic Miles | `organic miles.png` | none | `organic-miles` |
| DJ Abhishek | `dj abhishek.png` | none | `dj-abhishek` |
| Kangaroo Agency | `Kangaroo Agency.png` | none | `kangaroo-agency` |

- Output `logos/<slug>.webp` and, where present, `logos/<slug>-white.webp`.
- On hover the cell floods with the brand colour and swaps to the white variant. Brands without one recolour the main logo to white with the PNG used as a CSS `mask-image`.
- Brand colour: sample the dominant non-neutral colour of the main logo (e.g. with `node-vibrant`) and store it in data.
- Type tag (`LOGOTYPE`, `WORDMARK`, `EMBLEM`, `MONOGRAM`, `COMBINATION MARK`): decide by viewing each logo.

### Brand moodboards (`brand guidelines moodboard/`)

Brand order on the page: Senquira, Do Bhaion Ki Dukan, Swaroop Realty, Chemist Box (alternates moods: luxury, ethnic, heritage, everyday).

| Brand | Raw folder | Frames | Output |
| --- | --- | --- | --- |
| Senquira | `senquira_cards/` | 9 (`01_primary_logo` … `09_brand_tagline`) | `branding/senquira/` |
| Do Bhaion Ki Dukan | `do_bhaion_ki_dukan_cards/` | 15 (`01_primary_logo` … `15_fabric_logo`) | `branding/dbkd/` |
| Swaroop Realty | `swaroop_realty_cards/` | 15 (`01_primary_logo` … `15_luxury_tagline`) | `branding/swaroop-realty/` |
| Chemist Box | `chemistbox_cards/` | 16 (`01_primary_logo` … `16_store_poster`) | `branding/chemist-box/` |

- The number prefix is the default entrance `order`.
- Map the words after it to `category`: `primary_logo` → `logo`; any other name containing `logo` or `monogram` → `variation`; `colour` → `color`; `typography` or `tagline` → `type`; `pattern` or `icons` → `pattern`; interiors, exteriors, buildings, property and outfit shots → `photo`; everything else (bags, cards, tags, signage, packaging, posters, devices) → `mockup`.
- Callout `label` = the filename words in caps, e.g. `09_brand_tagline` → `BRAND TAGLINE`.
- No `layout-reference.png` has been delivered yet: use the fallback in section 15.

### Websites (`website ss/`)

Card order (the last one is the top of the stack and becomes the phone):

| # | Site | Raw file | Output |
| --- | --- | --- | --- |
| 1 | Kangaroo Agency | `Kangaroo Agency.mp4` | `web/kangaroo-agency.(mp4\|webm)` |
| 2 | Origanimo | `origanimo.mp4` | `web/origanimo.*` |
| 3 | Chemist Box | `chemist box.mp4` | `web/chemist-box.*` |
| 4 | Swaroop Realty | `swaroop realty.mp4` | `web/swaroop-realty.*` |
| 5 | That Coffee | `that coffee.mp4` | `web/that-coffee.*` |
| 6 | Aura Rosetry | `Aura Rosetry.mp4` | `web/aura-rosetry.*` |
| 7 | Ghoomar Thali | `ghoomar thali.mp4` | `web/ghoomar-thali.*` |

No mobile recordings yet: see section 15.

### SMM creatives (`social media posts/`)

Brand order: Alright TV, Elan Wallcovers, Vareeka, Udman Square, Senquira, Stories for You, Blink Brand Solutions.

| Brand | Raw folder | What's inside | Notes |
| --- | --- | --- | --- |
| Alright TV | `Alright TV/` | 7 posts and carousel slides | `post-1-slide-10` and `first love slide` belong to carousels |
| Elan Wallcovers | `Elan Wallcovers/` | 6 posts (`post (1)`–`(6)`) + 7 stories (`story …`) | Stories use the story viewer below |
| Vareeka | `vareeka/` | 5 posts | Use the `revised` versions; drop older duplicates |
| Udman Square | `Udman Square/` | 9 posts + `UDMAN SQUARE WHITE LOGO.png` | The logo is the avatar, not a post |
| Senquira | `Senquira/` | 5 posts (Instagram downloads) | Avatar: `logos/senquira` |
| Stories for You | `Stories for you/` | 11 posts and carousel artboards | Use `revised` versions |
| Blink Brand Solutions | `Blink Brand solutions/` | 1 carousel, `post-slide-1` … `7` | Fan shows slides 1–4; lightbox shows all 7 in order |

- Sort every file by aspect ratio when processing: about 1:1 or 4:5 → `posts`; about 9:16 → `stories`.
- Files that are slides of one series are grouped into a `carousel` in numeric order.
- **Story viewer (new, for brands with stories):** after the post fan gathers back into the phone, the phone screen becomes an Instagram story viewer (progress bars at the top, 2.5s per story, tap or scroll to advance), while the next 2 stories peek out vertically behind the phone at ±8° like a mini fan. Then the swipe to the next brand happens as usual.
- The 4 hero posts per brand are picked by the agent (section 15).

### Packaging (`brand pkg/`)

**Featured project: ProFoods Makhana** (`brand pkg/profoods makhana/`)

| Zone | Raw file | Output |
| --- | --- | --- |
| Dieline | `Makhana Pouch Dieline Packaging Layout.png` | `packaging/profoods-makhana/dieline.webp` (3000px long side) |
| Mockup | `Premium Yellow Makhana Pouch.png` | `…/mockup.webp` |
| Use case | `Premium Yellow Makhana Pouch usecase.png` | `…/usecase.webp` |

**More packaging grid**, in this order:

| Brand | Raw folder | Tiles |
| --- | --- | --- |
| Milletopia | `milletopia/` | 2x1 tile: `1_Milletopia_Khichdi_3D_Pouch_Mockup.jpg`, hover → `Milletopia_200g_Standup_Pouch_Dieline_HD.png`; 1x1 tiles: `2_…_Studio_Shot.jpg`, `3_…_Supermarket_Shelf_Display.jpg` |
| Croppd Honey | `croppd honey/` | 1x2 tile: `slide_1_hero.png`; 1x1 tiles: `Cropd_Honey_Studio_Shot.jpg` (hover → `croppd honey label.png`), `Cropd_Honey_Store_Shelf.jpg` |
| Arban Beauty | `arban beauty/` | 2x1 tile: `Arban Beauty Vitc pkging.png`; 1x1 tiles: `arban 2.jpg`, `arban 3.jpg`, `arban 4.jpg` |

Hover swap rule: a tile swaps to its flat artwork (dieline or label) when one is listed, otherwise to the brand's use-case or studio shot.

## 14. Brand content and copywriting

The agent writes all site copy itself from the fact sheets below, following these rules, and stores it in `src/content/` (one typed file per section) so Shubh can edit wording without touching components.

### Voice

- Shubh's voice: confident, playful, direct, a little cheeky. Short sentences. Indian context is welcome; Hindi brand names are never translated.
- Every brand gets its own flavour inside that voice: luxury brands read slow and sensual, food brands warm and appetising, health brands clear and trustworthy, heritage brands rooted and dignified.
- **Never invent** numbers, results, client quotes, awards, team sizes or features. Use only what the fact sheets and the visible work show. Website highlights come from what is actually visible in each recording.
- No corporate filler ("leveraging", "solutions-driven", "elevate your brand").
- Spell brand names exactly as written in the fact sheet table.

### Length and format by place

| Place | Format | Length |
| --- | --- | --- |
| Hero tagline | 1 line | max 8 words |
| Hero intro | 2 lines | max 30 words |
| Chapter kicker (under each chapter title) | 1 line | max 10 words |
| Logo cell | brand name + industry tag | 3–4 words |
| Logo case overlay | 1–2 sentence story | max 30 words |
| Moodboard brand intro | hook line, then 3 phases: **The brief / The idea / The identity**, 1–2 sentences each | max 90 words total |
| Moodboard callouts | labels only | max 5 words |
| Website card | hook line + 2 sentences + 3 short highlights from the recording | max 70 words |
| SMM label | `BRAND — [ CAMPAIGN THEME ]`, theme written from the posts | theme max 4 words |
| SMM caption under the phone | in the brand's own voice + 2–3 hashtags | max 2 lines |
| Packaging featured | 4 phases: **Brief → Concept → Dieline → On shelf**, 1–2 sentences each | max 100 words |
| Packaging grid tile | product line | max 12 words |
| Outro | punchy lines as in section 11 | as specified |

### Worked examples (match this tone and depth)

**Moodboard intro — Swaroop Realty**

- Hook: *Heritage you can own.*
- The brief: A Vrindavan real estate company selling plots, land, villas and large projects needed an identity as rooted as the city it builds in.
- The idea: Treat property like heritage, not inventory. Sculpted forms, a navy-led palette and calm, confident type.
- The identity: One system carried from the primary mark to signage, business cards, a brand book and property hoardings.

**Website card — Ghoomar Thali**

- Hook: *Rajasthan, minus the train ticket.*
- Body: A premium Rajasthani restaurant chain where dinner comes with the full culture: magic, kathputli puppetry and dhol-nagada. The site had to feel like stepping into that courtyard.
- Highlights: three points describing what the recording shows (sections, interactions, transitions).

**Packaging featured — ProFoods Makhana**

- Brief: A superfood makhana brand for people who count calories but refuse to snack boring.
- Concept: A confident yellow pouch that reads "healthy" from across the aisle without looking like medicine.
- Dieline: Every panel planned flat first: front story, nutrition, folds and seal zones, so nothing breaks once it's printed and filled.
- On shelf: The use-case shot proves it: the pouch holds its own in a real snacking moment.

### Fact sheets

| Brand | Appears in | What to know |
| --- | --- | --- |
| Alright TV | SMM | OTT platform that produces and streams reality shows, web series and entertainment. |
| Arban Beauty | Packaging | Organic, nature-led skincare built on natural ingredients and vitamins (including a Vitamin C range). |
| Aura Rosetry | Logos, Web | Premium, elegant café in Mumbai made for real coffee lovers. |
| Blink Brand Solutions | SMM | Travel company for personal to corporate international trips; packages customised to each client at value-for-money prices. |
| Chemist Box | Logos, Branding, Web | Indian pharmacy retail chain based in Bihar and expanding across India: generic medicines, nutraceuticals, skincare, home essentials and health devices (BP monitors, glucose meters, heart-rate meters). Good quality at affordable prices. |
| Croppd | Logos, Packaging | Raw, natural, unprocessed honey with zero preservatives; also premium coffee beans, brewing and a café. Parent brand of That Coffee. |
| DJ Abhishek | Logos | DJ Abhishek Bhatia, a Mumbai-based DJ and music producer who built a name early with live remixes and events. |
| Do Bhaion Ki Dukan (DBKD) | Logos, Branding | Premium Indian ethnic wear plus Indo-western and contemporary fashion in rich, high-quality fabrics. |
| Elan Wallcovers | SMM | Elegant wallpapers, wall art and décor sets, plus artistic furniture and artefacts for homes and offices. |
| Ghoomar Thali | Web | Premium Rajasthani restaurant chain across India: authentic food plus culture (magic shows, kathputli, dhol-nagada). A Rajasthan travel arm is coming soon. |
| Kangaroo Agency | Logos, Web | Social media management agency since 2020, working with brands in India, the US and Australia. |
| Milletopia | Packaging | Ready-to-eat, easy-to-make millet foods (jowar, bajra): khichdi, noodles, pasta and kheer, for fitness-minded eaters. |
| Organic Miles | Logos | Organic fruit and vegetable pulps, purées and dry pastes with no preservatives, for retail and B2B. |
| Origanimo | Web | Organic, marine-derived supplements with no synthetic chemicals, additives or preservatives: calcium, selenium, boron, vitamin D3 and multivitamins for men and women. |
| ProFoods Makhana | Packaging (featured) | Superfood makhana for calorie-conscious, nutrition-focused people. |
| Reish | Logos | Luxury perfume house in the Arabian style: amber, oud and leather, plus florals. |
| Senquira | Logos, Branding, SMM | Luxury, seductive perfumes made so the wearer owns the room. |
| Stories for You | SMM | Premium custom photo albums with bespoke covers and nostalgic written storytelling, made to keep memories forever. |
| Swaroop Realty | Logos, Branding, Web | Heritage-led real estate in Vrindavan: plots, land, villas and large projects. |
| That Coffee | Logos, Web | Croppd's coffee sub-brand for artsy, coffee-obsessed people; a different mood from Aura Rosetry. |
| Udman Square | SMM | Event venues and 3- to 5-star hotel properties across Delhi, Noida and Gurgaon for parties and luxury functions. |
| Vareeka | SMM | Jewellery in fine silver, 9K–12K gold, pearls and semi-precious gemstones. |

### About Shubh (hero and outro)

Graphic designer, web developer and brand manager, freelancing since 2020, working with cafés, restaurants and growing brands across India. The bio, contact details and social links are still to come (section 15).

## 15. Missing items and fallbacks

Build the whole site now. Wherever an item below is still missing, use its fallback so nothing looks broken, and make the real file a drop-in replacement (same path, no code changes).

| Missing | Fallback until it arrives | Drop-in path |
| --- | --- | --- |
| Moodboard layout references | The agent composes each board itself as a 4-column masonry (2 on mobile): primary logo frame 2×2 top-left, colour palette and typography 1×1 beside it, then the remaining frames by category order, sized by their aspect ratio so rows end flush. Save it as the same `layout.json` format; adding a reference later and re-running the layout step replaces it. | `raw-assets/brand guidelines moodboard/<brand>_cards/layout-reference.png` |
| Mobile website recordings | If live URLs are added, record each site with Playwright at 390×844 (a smooth scripted scroll, 12–15s) to create the mobile videos. Until then, the phone shows Ghoomar Thali's desktop recording scaled to the screen width, top-aligned, with the screen's top crop slowly panning down. | `raw-assets/website ss/<site> mobile.mp4` |
| 4 hero posts per SMM brand | The agent views every post and picks four: posts only (no stories), the cover or first carousel slide first, strongest compositions, varied colours. Picks are written to `src/content/smm.ts` as a `hero` array so Shubh can swap them. | edit `hero` in `smm.ts` |
| SMM profile pictures and handles | Senquira uses its logo; Udman Square uses its white logo on its brand colour; other brands get a monogram circle in their sampled colour. Handle = `@` + brand name lowercase without spaces, marked `// TODO confirm`. | `raw-assets/social media posts/<brand>/avatar.png` |
| Campaign themes and captions | Written by the agent per section 14 from the fact sheet and what the posts show. | edit `smm.ts` |
| Colour HEX codes and font names for moodboard callouts | Sampled from each brand's colour palette frame and read from its typography frame. Mark values in data with `sampled: true`. | edit `branding/<slug>.ts` |
| Live website URLs | The `VISIT LIVE SITE ↗` button and link stickers stay hidden until a URL exists. | `url` in `web.ts` |
| Bio, email, phone, social links | Clearly marked placeholders in `src/content/site.ts`; the outro and nav render them but show a `TODO` badge in development builds only. | edit `site.ts` |

When the build is done, the agent prints a checklist of every remaining TODO and fallback in use, so Shubh knows exactly what to supply next.
