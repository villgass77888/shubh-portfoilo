/**
 * Layout CSS for the SMM scene. It lives here (not in inline style objects)
 * because the composition needs media queries, :hover and sibling selectors.
 *
 * ONE scene, ONE phone. Everything that differs per brand is a stacked layer with a
 * data-i index (screen content, fan of 4 posts, title / counter / stats, vignette);
 * SmmCreatives.tsx swaps the layers with GSAP. Without JS / with reduced motion the
 * layers are simply visible (one brand per static scene).
 *
 * Everything is sized from one variable, --u. The desktop stage is 96u × 52.5u:
 *   - the phone body is 22.4u × 49.5u, its screen 21u wide
 *   - the phone's post area is 21u wide and starts 11.5u below the phone top
 *   - each fan card is 24u wide (--w), so post 2 covers the phone's post area
 *     with a small overhang, exactly like the reference
 *   - the phone rotates -6° around a FIXED pivot: the centre of a 4:5 post area
 *     (x = 37u, y = 26.125u in the stage). The phone therefore never moves.
 *   - a fan layer rotates -5° around the centre of ITS post 2. For a 4:5 brand that
 *     is the pivot itself; for a 1:1 brand the post area is shorter, so its centre is
 *     --d higher in the phone, i.e. (d·sin 6°, d·cos 6°) away from the pivot on the stage.
 */
export const smmCss = `
.smm-scene {
  --pt: clamp(3.75rem, 8vh, 5.5rem);
  --pb: clamp(1rem, 3vh, 2rem);
  --u: max(5.5px, min(0.95vw, (100vh - var(--pt) - var(--pb) - 8.5rem) / 52.5, 15px));
  --w: calc(24 * var(--u));
  position: relative;
  height: 100vh;
  overflow-x: clip;
  display: flex;
  flex-direction: column;
  padding: var(--pt) 4vw var(--pb);
}
.smm-scene--static {
  height: auto;
  min-height: 100vh;
  padding-bottom: clamp(2.5rem, 6vh, 4rem);
}

/* brand-tinted spray vignette + hairline, one per brand */
.smm-vig {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 60% at 50% 52%, transparent 55%, color-mix(in srgb, var(--p) 14%, transparent) 100%),
    radial-gradient(circle at 92% 12%, color-mix(in srgb, var(--p) 16%, transparent), transparent 34%);
  /* feathered top edge: the tint must not draw a hard line while the scene scrolls in */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 7rem);
  mask-image: linear-gradient(to bottom, transparent 0, #000 7rem);
}
.smm-vig::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--p), transparent);
  opacity: 0.35;
}

/* stacked per-brand text: every child shares one grid cell */
.smm-rollbox { display: grid; min-width: 0; }
.smm-rollbox > * { grid-area: 1 / 1; }

.smm-head {
  position: relative;
  z-index: 3;
  flex: none;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.4rem 1.5rem;
}
.smm-titles { flex: 1 1 0; }
.smm-title {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  align-content: flex-start;
  gap: 0.1em 0.5em;
  font-family: var(--font-heading);
  font-size: clamp(1rem, 2.1vw, 1.9rem);
  line-height: 1.1;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--ink);
}
.smm-count {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2rem;
  font-family: var(--font-meta);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  color: var(--ink);
}
.smm-count-num { opacity: 0.6; white-space: nowrap; display: flex; gap: 0.5em; }
.smm-step {
  width: 2rem;
  height: 2rem;
  flex: none;
  padding: 0 0 0.12em;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--ink);
  border-radius: 50%;
  background: transparent;
  color: var(--ink);
  font-family: var(--font-heading);
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1;
  opacity: 0.7;
  cursor: inherit;
  transition: opacity 0.25s ease, background-color 0.25s ease, color 0.25s ease;
}
.smm-step[aria-disabled='true'] { opacity: 0.2; }
.smm-step:focus-visible { outline: 3px solid var(--signal); outline-offset: 2px; opacity: 1; }
@media (hover: hover) {
  .smm-step:not([aria-disabled='true']):hover { opacity: 1; background: var(--ink); color: var(--bone); }
}
.smm-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.smm-stage {
  position: relative;
  flex: none;
  width: calc(96 * var(--u));
  height: calc(52.5 * var(--u));
  margin: auto;
}
.smm-phone-par {
  position: absolute;
  left: calc(25.8 * var(--u));
  top: calc(1.5 * var(--u));
  width: calc(22.4 * var(--u));
  height: calc(49.5 * var(--u));
}
.smm-phone-in { width: 100%; height: 100%; }
.smm-phone {
  position: relative;
  width: 100%;
  height: 100%;
  transform: rotate(-6deg);
  transform-origin: 50% calc(24.625 * var(--u));
}
/* the part of the screen that changes with the brand */
.smm-screens {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
.smm-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.smm-fans-par {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.smm-fanlayer {
  --h: calc(var(--w) / var(--ar));
  --pah: calc(21 * var(--u) / var(--ar));
  --d: calc((var(--pah) - 26.25 * var(--u)) / 2);
  position: absolute;
  left: calc(37 * var(--u) + var(--d) * 0.1045 - 1.44 * var(--w));
  top: calc(26.125 * var(--u) + var(--d) * 0.9945 - var(--h) / 2);
}
.smm-fan {
  display: flex;
  transform: rotate(-5deg);
  transform-origin: 37.696% 50%;
}
.smm-slot {
  position: relative;
  flex: none;
  width: var(--w);
  height: var(--h);
  transition: z-index 0s 0.3s;
}
/* posts only react once their deal-out has finished */
.smm-fanlayer.is-live .smm-slot { pointer-events: auto; }
.smm-slot + .smm-slot { margin-left: calc(var(--w) * -0.06); }
.smm-slot:nth-child(1) { z-index: 1; }
.smm-slot:nth-child(2) { z-index: 4; }
.smm-slot:nth-child(3) { z-index: 3; }
.smm-slot:nth-child(4) { z-index: 2; }
.smm-slot:hover,
.smm-slot:focus-within { z-index: 10; transition-delay: 0s; }
.smm-deal { width: 100%; height: 100%; }
.smm-card {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: calc(0.45 * var(--u));
  overflow: hidden;
  background: #d9d4c8;
  cursor: inherit;
  box-shadow:
    0 calc(0.5 * var(--u)) calc(1.2 * var(--u)) rgba(0, 0, 0, 0.16),
    0 calc(1.6 * var(--u)) calc(3.6 * var(--u)) rgba(0, 0, 0, 0.2);
  transition: transform 0.5s var(--ease-bounce), box-shadow 0.35s ease;
}
.smm-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.smm-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(0.38 * var(--u));
  background: linear-gradient(90deg, var(--signal), var(--bubblegum), var(--p));
}
.smm-card:focus-visible {
  outline: 3px solid var(--signal);
  outline-offset: 3px;
  transform: rotate(5deg) scale(1.12);
}
.smm-heart {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(9 * var(--u));
  height: calc(9 * var(--u));
  margin: calc(-4.5 * var(--u)) 0 0 calc(-4.5 * var(--u));
  pointer-events: none;
}
.smm-heart svg { display: block; width: 100%; height: 100%; overflow: visible; }
.smm-heart-main { opacity: 0; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35)); }
.smm-spark {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(1.6 * var(--u));
  height: calc(1.6 * var(--u));
  margin: calc(-0.8 * var(--u)) 0 0 calc(-0.8 * var(--u));
  opacity: 0;
}

/* stats + SEE ALL */
.smm-meta {
  position: relative;
  z-index: 3;
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem 1.75rem;
  margin-top: 0.75rem;
  /* the stage is centred by auto margins; this row only needs the click targets */
  pointer-events: none;
}
.smm-meta > * { pointer-events: auto; }
.smm-stat {
  justify-self: end;
  font-family: var(--font-meta);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--ink);
  opacity: 0.75;
  white-space: nowrap;
}
.sticker.smm-see-all {
  min-height: 3.5rem;
  padding: 0.85em 1.5em 0.8em;
  gap: 0.55em;
  border: 2px solid var(--ink);
  border-radius: 10px;
  box-shadow: 5px 5px 0 var(--ink);
  font-family: var(--font-heading);
  font-weight: 900;
  font-stretch: 125%;
  font-size: clamp(0.98rem, 1.15vw, 1.1rem);
  line-height: 1;
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.smm-see-all-arrow { display: inline-block; transition: transform 0.3s var(--ease-bounce); }
.smm-see-all:focus-visible { outline: 3px solid var(--ink); outline-offset: 4px; }
@media (hover: hover) {
  .smm-see-all:hover .smm-see-all-arrow { transform: translateX(0.3em); }
}

@media (hover: hover) {
  .smm-slot:hover .smm-card {
    transform: rotate(5deg) scale(1.12);
    box-shadow:
      0 calc(1 * var(--u)) calc(2 * var(--u)) rgba(0, 0, 0, 0.2),
      0 calc(3 * var(--u)) calc(6 * var(--u)) rgba(0, 0, 0, 0.3);
  }
}
@media (hover: hover) and (min-width: 768px) {
  /* neighbours make room for the hovered post */
  .smm-slot:hover ~ .smm-slot .smm-card { transform: translateX(5%); }
  .smm-slot:has(~ .smm-slot:hover) .smm-card { transform: translateX(-5%); }
}

/* Mobile: the same single phone, smaller, with the 4 posts as a 2×2 cluster
   overlapping its lower end. The stage is 36u × 87u. */
@media (max-width: 767px) {
  .smm-scene {
    --pt: 4rem;
    --pb: 0.9rem;
    --u: max(4.4px, min(2.3vw, (100svh - var(--pt) - var(--pb) - 10rem) / 88));
    --w: calc(18 * var(--u));
    height: 100svh;
    padding: var(--pt) 16px var(--pb);
  }
  .smm-scene--static {
    --u: 2.3vw;
    height: auto;
    min-height: 0;
    padding-bottom: 2.5rem;
  }
  .smm-stage {
    width: calc(36 * var(--u));
    height: calc(87 * var(--u));
  }
  .smm-scene--static .smm-stage { margin-top: calc(5 * var(--u)); }
  .smm-phone-par { left: calc(6.8 * var(--u)); top: 0; }
  .smm-fanlayer {
    left: calc(18 * var(--u) - 0.97 * var(--w));
    top: calc(41.5 * var(--u));
  }
  .smm-fan {
    display: grid;
    grid-template-columns: repeat(2, var(--w));
    transform-origin: 50% 50%;
  }
  .smm-slot + .smm-slot { margin-left: 0; }
  .smm-slot:nth-child(even) { margin-left: calc(var(--w) * -0.06); }
  .smm-slot:nth-child(n + 3) { margin-top: calc(var(--w) * -0.06); }
  .smm-meta { justify-content: space-between; flex-wrap: nowrap; gap: 0.75rem; margin-top: 0.5rem; }
  .smm-stat { justify-self: start; white-space: normal; font-size: 0.66rem; }
  .smm-step { width: 2.5rem; height: 2.5rem; }
  .smm-count { gap: 0.4rem; }
}

@media (prefers-reduced-motion: reduce) {
  .smm-card, .smm-slot, .smm-step, .smm-see-all-arrow { transition: none; }
}

/* Lightbox + wall */
@keyframes smmFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes smmRise {
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
.smm-overlay { animation: smmFade 0.3s ease-out both; }
.smm-lb-img { animation: smmRise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
.smm-lb-btn:focus-visible,
.smm-wall-item:focus-visible { outline: 3px solid var(--acid, #c6ff00); outline-offset: 3px; }
.smm-wall-item { transition: transform 0.35s var(--ease-bounce); }
@media (hover: hover) {
  .smm-wall-item:hover { transform: scale(1.03) rotate(-1deg); }
}
@media (prefers-reduced-motion: reduce) {
  .smm-overlay, .smm-lb-img { animation: none; }
  .smm-wall-item { transition: none; }
}
`;
