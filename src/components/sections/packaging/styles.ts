/* same grunge texture the fixed BackgroundStage lays under every chapter */
const GRUNGE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`;

/** Cardboard tone of the rest of the chapter */
export const SHEET = '#F0E6CC';

export const packagingCss = `
/* ── the quiet cream stage: featured scene + "from studio to shelf" ── */
.pk-cream {
  position: relative;
  isolation: isolate;
  background: linear-gradient(90deg, #FBF8F2 0%, #F6EFDF 55%, #F2E8D2 100%);
}
.pk-cream::before {
  /* fades in from the cardboard above and back out into it below: no seam either side */
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(to bottom, ${SHEET} 0, rgba(240, 230, 204, 0) 22vh),
    linear-gradient(to top, ${SHEET} 0, rgba(240, 230, 204, 0) 26vh);
  pointer-events: none;
}
.pk-cream::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: ${GRUNGE};
  background-size: 256px 256px;
  mix-blend-mode: multiply;
  opacity: 0.06;
  pointer-events: none;
}

.pk-kicker {
  margin: 0;
  font-family: var(--font-meta);
  font-size: clamp(0.62rem, 0.8vw, 0.75rem);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0.5;
}
.pk-title {
  margin: 0.5rem 0 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2.2rem, 4.6vw, 4.6rem);
  line-height: 0.95;
  text-transform: uppercase;
  color: var(--ink);
}

/* ═════════ Featured scene ═════════ */
.pkf {
  position: relative;
  height: 100vh;
  height: 100svh;
  display: grid;
  grid-template-columns: 64fr 36fr;
  align-items: center;
  color: var(--ink);
}
.pkf-stage {
  --bw: min(80cqw, calc(78cqh * 1.7778));
  --bh: calc(var(--bw) / 1.7778);
  --sy: 0.36;
  --sw: 0.86;
  position: relative;
  height: 100%;
  min-width: 0;
  container-type: size;
  display: grid;
  place-items: center;
}
.pkf-float { width: var(--bw); }
.pkf.is-rest .pkf-float { animation: pkfFloat 6s ease-in-out infinite; }
@keyframes pkfFloat {
  0%, 100% { transform: translateY(-6px) rotate(-1deg); }
  50% { transform: translateY(6px) rotate(1deg); }
}
.pkf-lift { transition: transform 0.5s var(--ease-enter); }
.pkf.is-hover:not([data-step="0"]) .pkf-lift { transform: scale(1.02); }
.pkf-box { position: relative; width: 100%; pointer-events: none; will-change: transform; }
.pkf-layer { position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; object-fit: contain; }

.pkf-shadow {
  position: absolute;
  left: 50%;
  top: calc(50% + var(--bh) * var(--sy));
  width: calc(var(--bw) * var(--sw));
  height: 4.5cqh;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse at center, rgba(74, 48, 14, 0.26), rgba(74, 48, 14, 0) 68%);
  filter: blur(7px);
  pointer-events: none;
  transition: top 0.9s var(--ease-enter), width 0.9s var(--ease-enter), opacity 0.5s ease, transform 0.5s var(--ease-enter);
}
.pkf[data-step="1"] .pkf-stage { --sy: calc(0.392 * var(--zoom)); --sw: calc(0.24 * var(--zoom)); }
.pkf[data-step="2"] .pkf-stage { --sy: calc(0.408 * var(--zoom)); --sw: calc(0.47 * var(--zoom)); }
.pkf.is-playing .pkf-shadow { opacity: 0; }
.pkf.is-hover:not([data-step="0"]) .pkf-shadow { transform: translate(-50%, -50%) scaleX(0.9); }

/* the label (at rest) or the jar (afterwards) is the button */
.pkf-hit {
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--bw);
  height: calc(var(--bh) * 0.62);
  transform: translate(-50%, -50%);
  border-radius: 14px;
  outline: none;
}
.pkf:not([data-step="0"]) .pkf-hit { width: calc(var(--bw) * 0.36 * var(--zoom)); height: calc(var(--bh) * 0.82 * var(--zoom)); }
.pkf.is-playing .pkf-hit { pointer-events: none; }
.pkf-hit:focus-visible { outline: 2px dashed var(--signal); outline-offset: 6px; }
.pkf-hint {
  position: absolute;
  left: calc(50% + var(--bw) * 0.17 * var(--zoom));
  top: calc(50% - var(--bh) * 0.3 * var(--zoom));
  font-size: 0.62rem;
  white-space: nowrap;
  pointer-events: none;
  animation: pkPop 0.35s var(--ease-bounce) both;
}
@keyframes pkPop { from { opacity: 0; transform: scale(0.6) rotate(-10deg); } }

.pkf-count, .pkf-cue {
  position: absolute;
  bottom: clamp(1.2rem, 4vh, 2.4rem);
  font-family: var(--font-meta);
  font-size: 0.68rem;
  letter-spacing: 0.16em;
}
.pkf-count { left: clamp(1.25rem, 4vw, 4rem); opacity: 0.6; }
.pkf-cue { left: 50%; transform: translateX(-50%); opacity: 0.6; transition: opacity 0.4s ease; }
.pkf-cue i { display: inline-block; font-style: normal; animation: pkBob 1.4s ease-in-out infinite; }
.pkf-cue.is-off { opacity: 0; }
@keyframes pkBob { 0%, 100% { transform: translateY(-2px); } 50% { transform: translateY(4px); } }
.pkf-skip, .pkf-play { position: absolute; bottom: clamp(1rem, 3.4vh, 2.2rem); font-size: 0.7rem; padding: 0.5em 1em; }
.pkf-skip { right: 2vw; animation: pkPop 0.35s var(--ease-bounce) both; }
.pkf-play { left: 50%; margin-left: -3.2em; }

.pkf-info { max-width: calc(460px + 4vw); padding-right: 4vw; min-width: 0; }

/* ═════════ Info column (scene + viewer) ═════════ */
.pki-kicker {
  margin: 0;
  font-family: var(--font-meta);
  font-size: clamp(0.62rem, 0.8vw, 0.75rem);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.6s ease;
}
.pki.is-in .pki-kicker { opacity: 0.45; }
.pki-title {
  margin: 0.7rem 0 clamp(0.8rem, 2.4vh, 1.5rem);
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(48px, 5.6vw, 96px);
  line-height: 0.94;
  text-transform: uppercase;
  color: var(--ink);
}
.pki-steps { list-style: none; margin: 0; padding: 0; }
.pki-step {
  position: relative;
  display: grid;
  grid-template-columns: 2.3rem minmax(0, 1fr);
  padding: clamp(0.55rem, 1.7vh, 1rem) 0 clamp(0.55rem, 1.7vh, 1rem) 0.9rem;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.7s var(--ease-enter);
}
.pki.is-in .pki-step { opacity: 0.35; transform: none; transition-delay: calc(0.45s + var(--i) * 0.08s), calc(0.45s + var(--i) * 0.08s); }
.pki.is-in .pki-step.is-on { opacity: 1; }
/* hairline above each step, drawn left to right */
.pki-step::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: rgba(13, 13, 13, 0.12);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.9s var(--ease-enter) calc(0.3s + var(--i) * 0.08s);
}
.pki.is-in .pki-step::before { transform: none; }
/* the bar that grows down the left edge of an active step */
.pki-step::after {
  content: '';
  position: absolute;
  left: 0;
  top: clamp(0.55rem, 1.7vh, 1rem);
  bottom: clamp(0.55rem, 1.7vh, 1rem);
  width: 3px;
  background: var(--signal);
  transform: scaleY(0);
  transform-origin: 50% 0;
  transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
.pki.is-in .pki-step.is-on::after { transform: none; }
.pki-num { font-family: var(--font-meta); font-size: 0.72rem; line-height: 1.5; color: var(--signal); }
.pki-body { min-width: 0; }
.pki-label { display: block; margin-bottom: 0.3rem; font-family: var(--font-meta); font-size: 0.7rem; letter-spacing: 0.25em; line-height: 1.5; }
.pki-text {
  display: block;
  max-width: 40ch;
  font-family: var(--font-body);
  font-size: clamp(0.82rem, min(1.15vw, 1.95vh), 1.06rem);
  line-height: 1.55;
  transform: translateY(10px);
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}
.pki-step.is-on .pki-text { transform: none; }

.pki-swatches { display: flex; flex-wrap: wrap; gap: 0.5rem 1.1rem; margin-top: clamp(0.7rem, 2vh, 1.2rem); padding-top: clamp(0.7rem, 2vh, 1.2rem); border-top: 1px solid rgba(13, 13, 13, 0.12); }
.pki-sw {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  font-family: var(--font-meta);
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  color: var(--ink);
  transform: scale(0);
  transition: transform 0.4s var(--ease-bounce);
}
.pki.is-in .pki-sw { transform: scale(1); transition-delay: calc(0.95s + var(--i) * 0.08s); }
.pki-sw i { width: 24px; height: 24px; border-radius: 4px; border: 1px solid rgba(13, 13, 13, 0.15); transition: transform 0.25s var(--ease-bounce); }
.pki-sw:hover i, .pki-sw:focus-visible i { transform: scale(1.18) rotate(-6deg); }
.pki-copied {
  position: absolute;
  left: 0;
  bottom: calc(100% + 6px);
  padding: 0.35em 0.6em;
  font-weight: 400;
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  white-space: nowrap;
  color: var(--ink);
  background: var(--acid);
  border: 1.5px solid var(--ink);
  border-radius: 5px;
  box-shadow: 2px 2px 0 var(--ink);
  transform: rotate(-4deg);
  animation: pkPop 0.3s var(--ease-bounce) both;
}
.pki-meta { margin: clamp(0.7rem, 2vh, 1.1rem) 0 0; font-family: var(--font-meta); font-size: 0.64rem; letter-spacing: 0.1em; opacity: 0; transition: opacity 0.6s ease 1.1s; }
.pki.is-in .pki-meta { opacity: 0.55; }

/* ═════════ From studio to shelf ═════════ */
.pks { width: min(1360px, 100%); margin: 0 auto; padding: 14vh clamp(1.25rem, 4vw, 3rem); color: var(--ink); }
.pks-head {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  padding-bottom: clamp(1rem, 2.6vh, 1.6rem);
}
.pks-head::after, .pkm-top::after, .pkm-head::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: rgba(13, 13, 13, 0.18);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 1.1s var(--ease-enter) 0.2s;
}
.pks-head.is-in::after, .pkm-top.is-in::after, .pkm-head.is-in::after { transform: none; }
.pks-intro { max-width: 44ch; margin: 0; font-family: var(--font-body); font-size: clamp(0.92rem, 1.2vw, 1.06rem); line-height: 1.55; opacity: 0; transform: translateY(12px); transition: opacity 0.6s ease 0.45s, transform 0.7s var(--ease-enter) 0.45s; }
.pks-head.is-in .pks-intro { opacity: 1; transform: none; }

.pks-row { display: grid; grid-template-columns: var(--cols); gap: 2.4vw; margin-top: clamp(1.8rem, 5vh, 3rem); align-items: start; }
.pks-shot { margin: 0; min-width: 0; }
.pks-frame {
  position: relative;
  display: block;
  width: 100%;
  max-height: 640px;
  aspect-ratio: var(--ar);
  padding: 0;
  border-radius: 10px;
  outline: none;
}
.pks-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 10px;
  border: 1.5px solid rgba(13, 13, 13, 0.15);
  box-shadow: 0 22px 54px rgba(60, 40, 10, 0.2);
  /* curtain: opens from the centre outwards */
  clip-path: inset(0 50% 0 50% round 10px);
  transition: clip-path 1s var(--ease-enter) calc(var(--i) * 0.15s), box-shadow 0.4s ease;
}
.pks-shot.is-in .pks-clip { clip-path: inset(0 0 0 0 round 10px); }
.pks-par { position: absolute; left: 0; right: 0; top: -6%; height: 112%; }
.pks-par picture { display: block; width: 100%; height: 100%; }
.pks-par img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  background-size: cover;
  transform: scale(1.08);
  transition: transform 1.2s var(--ease-enter) calc(var(--i) * 0.15s);
}
.pks-shot.is-in .pks-par img { transform: scale(1); }
.pks-tag {
  position: absolute;
  top: -0.7rem;
  left: 1.1rem;
  padding: 0.42em 0.7em;
  font-family: var(--font-meta);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  line-height: 1;
  color: var(--ink);
  background: var(--bone);
  border: 1.5px solid var(--ink);
  border-radius: 5px;
  box-shadow: 2px 2px 0 var(--ink);
  transform: rotate(-2deg);
}
.pks-shot--1 .pks-tag { left: auto; right: 1.1rem; transform: rotate(2deg); }
.pks-tape { top: -9px; left: -20px; width: 64px; height: 20px; --tape-rotate: -34deg; pointer-events: none; transition: transform 0.4s var(--ease-enter); }
.pks-shot--1 .pks-tape { left: auto; right: -20px; --tape-rotate: 34deg; }
@media (hover: hover) {
  .pks-frame:hover .pks-par img, .pks-frame:focus-visible .pks-par img { transform: scale(1.04); transition-duration: 0.6s; transition-delay: 0s; }
  .pks-frame:hover .pks-clip, .pks-frame:focus-visible .pks-clip { box-shadow: 0 30px 70px rgba(60, 40, 10, 0.32); }
  .pks-frame:hover .pks-tape { transform: rotate(var(--tape-rotate)) translateY(-4px) scale(1.05); }
}
.pks-frame:focus-visible .pks-clip { outline: 2px solid var(--signal); outline-offset: 4px; }
.pks-cap { display: grid; grid-template-columns: 2.3rem minmax(0, 1fr); max-width: 46ch; margin-top: 1.2rem; }
.pks-cap > * { opacity: 0; transform: translateY(12px); transition: opacity 0.6s ease, transform 0.7s var(--ease-enter); }
.pks-shot.is-in .pks-cap > * { opacity: 1; transform: none; }
.pks-shot.is-in .pks-cap-num { transition-delay: 0.5s; }
.pks-shot.is-in .pks-cap-label { transition-delay: 0.56s; }
.pks-shot.is-in .pks-cap-text { transition-delay: 0.62s; }
.pks-cap-num { font-family: var(--font-meta); font-size: 0.72rem; line-height: 1.5; color: var(--signal); }
.pks-cap-label { font-family: var(--font-meta); font-size: 0.7rem; letter-spacing: 0.25em; line-height: 1.5; }
.pks-cap-text { grid-column: 2; margin-top: 0.3rem; font-family: var(--font-body); font-size: clamp(0.88rem, 1.12vw, 1.02rem); line-height: 1.55; }

.pks-facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: clamp(2.2rem, 7vh, 4rem) 0 0; border-top: 1px solid rgba(13, 13, 13, 0.18); }
.pks-facts > div { padding: 1.1rem 1.2rem 0 1.2rem; border-left: 1px solid rgba(13, 13, 13, 0.14); opacity: 0; transform: translateY(14px); transition: opacity 0.6s ease calc(var(--i) * 0.09s), transform 0.7s var(--ease-enter) calc(var(--i) * 0.09s); }
.pks-facts > div:first-child { padding-left: 0; border-left: 0; }
.pks-facts.is-in > div { opacity: 1; transform: none; }
.pks-facts dt { font-family: var(--font-meta); font-size: 0.64rem; letter-spacing: 0.22em; opacity: 0.55; }
.pks-facts dd { margin: 0.5rem 0 0; font-family: var(--font-body); font-size: clamp(0.84rem, 1.02vw, 0.96rem); line-height: 1.5; }

/* ═════════ More packaging ═════════ */
.pkm { width: min(1360px, 100%); margin: 0 auto; padding: 10vh clamp(1.25rem, 4vw, 3rem) 6rem; color: var(--ink); }
.pkm-top { position: relative; padding-bottom: clamp(1rem, 2.6vh, 1.6rem); }
.pkm-cluster { margin-top: clamp(3rem, 9vh, 5.5rem); container-type: inline-size; }
.pkm-head { position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; padding-bottom: 1rem; }
.pkm-name { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: clamp(1.8rem, 3.4vw, 3.4rem); line-height: 0.95; text-transform: uppercase; }
.pkm-about { max-width: 46ch; text-align: right; }
.pkm-meta { margin: 0; font-family: var(--font-meta); font-size: 0.62rem; letter-spacing: 0.14em; opacity: 0.55; }
.pkm-line { margin: 0.35rem 0 0; font-family: var(--font-body); font-size: clamp(0.86rem, 1.08vw, 1rem); line-height: 1.45; }
.pkm-head > * { opacity: 0; transform: translateY(14px); transition: opacity 0.6s ease, transform 0.8s cubic-bezier(0.25, 1, 0.5, 1); }
.pkm-head.is-in > * { opacity: 1; transform: none; }

/* one row per project: every tile at its photo's own proportions, all the same height */
.pkm-row {
  --gap: clamp(0.7rem, 1.4vw, 1.25rem);
  --h: min(56vh, 560px, calc((100cqw - (var(--n) - 1) * var(--gap)) / var(--sum)));
  display: flex;
  gap: var(--gap);
  margin-top: 1.4rem;
}
.pkm-tile {
  --px: 0; --py: 0;
  position: relative;
  flex: none;
  height: var(--h);
  width: calc(var(--h) * var(--ar));
  padding: 0;
  color: var(--ink);
  outline: none;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1) calc(var(--i) * 0.06s), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1) calc(var(--i) * 0.06s);
}
.pkm-row.is-in .pkm-tile { opacity: 1; transform: none; }
.pkm-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border: 2px solid var(--ink);
  border-radius: 12px;
  background-color: #E4DAC2;
  background-size: cover;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
  transition: transform 0.45s var(--ease-enter), box-shadow 0.45s ease;
}
.pkm-media > img { display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; transition: transform 0.7s var(--ease-enter); }
.pkm-tile--flat .pkm-media { background: #fff; }
.pkm-tile--flat .pkm-media > img { object-fit: contain; padding: 4%; }
/* the flat artwork that wipes in from the side the pointer came from */
.pkm-swap { position: absolute; inset: 0; background: #fff; transition: clip-path 0.6s var(--ease-enter); }
.pkm-swap img { display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; }
.pkm-swap--flat img { object-fit: contain; padding: 5%; }
.pkm-tile[data-from="left"] .pkm-swap { clip-path: inset(0 100% 0 0); }
.pkm-tile[data-from="right"] .pkm-swap { clip-path: inset(0 0 0 100%); }
.pkm-tile[data-from="top"] .pkm-swap { clip-path: inset(0 0 100% 0); }
.pkm-tile[data-from="bottom"] .pkm-swap { clip-path: inset(100% 0 0 0); }
.pkm-label {
  position: absolute;
  left: 0.7rem;
  bottom: 0.7rem;
  max-width: calc(100% - 1.4rem);
  padding: 0.42em 0.7em;
  font-family: var(--font-meta);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--ink);
  background: var(--bone);
  border: 1.5px solid var(--ink);
  border-radius: 5px;
  box-shadow: 2px 2px 0 var(--ink);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s ease, transform 0.4s var(--ease-enter);
}
.pkm-tape { top: -8px; right: -16px; width: 56px; height: 18px; --tape-rotate: 36deg; pointer-events: none; }
.pkm-tile:nth-child(even) .pkm-tape { right: auto; left: -16px; --tape-rotate: -36deg; }
@media (hover: hover) {
  .pkm-tile:hover .pkm-media, .pkm-tile:focus-visible .pkm-media { transform: translateY(-6px); box-shadow: 0 20px 44px rgba(0, 0, 0, 0.26); }
  .pkm-tile:hover .pkm-tape, .pkm-tile:focus-visible .pkm-tape { transform: rotate(var(--tape-rotate)) translateY(-6px); }
  .pkm-tile:hover .pkm-label, .pkm-tile:focus-visible .pkm-label { opacity: 1; transform: translateY(-6px); }
  .pkm-tile:not(.pkm-tile--main):not(.pkm-tile--flat):hover .pkm-media > img { transform: scale(1.1) translate(calc(var(--px) * -2.5%), calc(var(--py) * -2.5%)); }
  .pkm-tile:hover .pkm-swap, .pkm-tile:focus-visible .pkm-swap { clip-path: inset(0 0 0 0); }
}
.pkm-tape { transition: transform 0.45s var(--ease-enter); }
.pkm-tile:focus-visible .pkm-media { outline: 3px solid var(--signal); outline-offset: 3px; }

/* ═════════ Full-screen viewer ═════════ */
.pkv {
  position: fixed;
  inset: 0;
  /* above the nav, under the film grain and the custom cursor (so its labels still show) */
  z-index: 140;
  display: grid;
  grid-template-columns: 68fr 32fr;
  color: var(--ink);
  background: linear-gradient(90deg, #FBF8F2 0%, #F6EFDF 55%, #F2E8D2 100%);
  overscroll-behavior: contain;
}
.pkv-paper { position: absolute; inset: 0; background-image: ${GRUNGE}; background-size: 256px 256px; mix-blend-mode: multiply; opacity: 0.07; pointer-events: none; }
.pkv-close { position: absolute; top: clamp(0.8rem, 2.2vh, 1.4rem); right: clamp(1rem, 2.4vw, 2rem); z-index: 5; font-size: 0.68rem; padding: 0.55em 0.95em; }
.pkv-left { position: relative; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.pkv-stage { position: relative; flex: 1 1 0; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; touch-action: none; }
.pkv-media {
  position: relative;
  flex: none;
  background-size: cover;
  border-radius: 8px;
  box-shadow: 0 30px 80px rgba(60, 40, 10, 0.3);
  overflow: hidden;
  transition: transform 0.4s var(--ease-enter);
  animation: pkvIn 0.35s ease both;
  user-select: none;
  -webkit-user-select: none;
}
@keyframes pkvIn { from { opacity: 0; scale: 0.96; } }
.pkv-stage.is-drag .pkv-media { transition: none; }
.pkv-media picture, .pkv-media img { display: block; width: 100%; height: 100%; max-width: none; }
.pkv-media img { object-fit: cover; }
.pkv-media--flat { background-color: #fff; border: 1.5px solid rgba(13, 13, 13, 0.15); }
/* the jar is a cut-out: no card behind it, and it is drawn larger than its (mostly empty) frame */
.pkv-media--cutout { overflow: visible; background: none; box-shadow: none; border-radius: 0; }
.pkv-media--cutout picture { transform: scale(1.5); filter: drop-shadow(0 26px 30px rgba(60, 40, 10, 0.28)); }
.pkv-media picture.is-hidden { visibility: hidden; }
.pkv-video { position: absolute; inset: 0; }
/* replay: the camera pushes in while the label wraps, then holds for the second video */
.pkv-video--wrap { animation: pkvPush 1.35s ease-in-out 0.05s both; }
.pkv-video--land { transform: scale(1.5); }
@keyframes pkvPush { from { transform: scale(1); } to { transform: scale(1.5); } }
.pkv-replay { position: absolute; left: 50%; bottom: 1.1rem; translate: -50% 0; font-size: 0.68rem; padding: 0.5em 0.95em; }
.pkv-hint { position: absolute; left: 50%; top: 1.2rem; translate: -50% 0; font-family: var(--font-meta); font-size: 0.6rem; letter-spacing: 0.14em; opacity: 0.55; white-space: nowrap; pointer-events: none; }
.pkv-arrow {
  position: absolute;
  top: 50%;
  width: 44px;
  height: 44px;
  margin-top: -22px;
  border-radius: 50%;
  border: 1.5px solid var(--ink);
  background: var(--bone);
  color: var(--ink);
  font-size: 1.05rem;
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 0.25s var(--ease-bounce), background-color 0.2s ease;
}
.pkv-arrow:hover, .pkv-arrow:focus-visible { background: var(--acid); transform: scale(1.08); outline: none; }
.pkv-arrow--prev { left: clamp(0.6rem, 1.6vw, 1.5rem); }
.pkv-arrow--next { right: clamp(0.6rem, 1.6vw, 1.5rem); }

.pkv-strip { flex: none; display: flex; justify-content: center; gap: 0.7rem; padding: 0.9rem 1rem clamp(0.9rem, 2.4vh, 1.4rem); overflow-x: auto; scrollbar-width: none; }
.pkv-strip::-webkit-scrollbar { display: none; }
.pkv-thumb { position: relative; flex: none; width: clamp(3.4rem, 6vw, 5.2rem); padding: 0; color: var(--ink); outline: none; }
.pkv-thumb img { display: block; width: 100%; aspect-ratio: 1; max-width: none; object-fit: cover; border-radius: 6px; border: 1.5px solid rgba(13, 13, 13, 0.25); background: #fff; transition: transform 0.3s var(--ease-enter); }
.pkv-thumb--cutout img { object-fit: contain; scale: 1; background: #F6EFDF; }
.pkv-thumb span { display: block; margin-top: 0.35rem; font-family: var(--font-meta); font-size: 0.5rem; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.6; }
.pkv-thumb:hover img, .pkv-thumb:focus-visible img { transform: translateY(-3px); }
/* the active thumbnail wears the selection box */
.pkv-thumb.is-on img { outline: 2px solid var(--signal); outline-offset: 3px; }
.pkv-thumb.is-on span { opacity: 1; color: var(--signal); }

.pkv-right { position: relative; min-width: 0; overflow-y: auto; overscroll-behavior: contain; padding: clamp(4rem, 10vh, 6rem) clamp(1.25rem, 3vw, 3rem) 2rem 0.5rem; display: flex; flex-direction: column; justify-content: center; }
.pkv-right .pki-title { font-size: clamp(40px, 4.4vw, 80px); }
.pkv-right .pki { margin: auto 0; }

/* ═════════ Phones ═════════ */
@media (max-width: 768px) {
  .pkf { height: auto; grid-template-columns: minmax(0, 1fr); padding-bottom: 3rem; }
  .pkf-stage { --bw: min(96cqw, calc(60cqh * 1.7778)); height: 60vh; height: 60svh; }
  .pkf-info { max-width: none; padding: 0 1.25rem; }
  .pki-text { font-size: 0.95rem; }

  .pks { padding: 9vh 1.25rem; }
  .pks-head { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .pks-row { grid-template-columns: minmax(0, 1fr); gap: 2.6rem; }
  .pks-frame { max-height: 70svh; }
  .pks-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 1.4rem; }
  .pks-facts > div:nth-child(odd) { padding-left: 0; border-left: 0; }

  .pkm { padding: 7vh 1.25rem 4.5rem; }
  .pkm-head { flex-direction: column; align-items: flex-start; gap: 0.6rem; }
  .pkm-about { text-align: left; }
  /* two per line, each still at its own proportions */
  .pkm-row { flex-wrap: wrap; --h: auto; }
  .pkm-tile { width: calc(50% - var(--gap) / 2); height: auto; aspect-ratio: var(--ar); }
  .pkm-tile--flat, .pkm-tile--main { width: 100%; }
  .pkm-label { opacity: 1; transform: none; }

  .pkv { grid-template-columns: minmax(0, 1fr); grid-template-rows: 55svh minmax(0, 1fr); }
  .pkv-right { padding: 0.5rem 1.25rem 2.5rem; justify-content: flex-start; }
  .pkv-strip { justify-content: flex-start; padding: 0.6rem 1rem; }
  .pkv-arrow { display: none; }
  .pkv-hint { top: 0.6rem; }
}

@media (prefers-reduced-motion: reduce) {
  .pkf.is-rest .pkf-float, .pkf-cue i { animation: none; }
  .pki-kicker, .pki-step, .pki-step::before, .pki-sw, .pki-meta, .pki-text,
  .pks-intro, .pks-cap > *, .pks-facts > div, .pkm-head > *, .pkm-tile { transition-duration: 0.3s !important; transition-delay: 0s !important; transform: none !important; }
  .pks-clip { clip-path: none; transition: none; }
  .pks-par img { transform: none; transition: none; }
}
`;
