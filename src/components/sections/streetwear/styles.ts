/* same grunge texture the fixed BackgroundStage lays under every other chapter */
const GRUNGE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`;
const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.5 -0.62'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export const streetwearCss = `
  @property --sw-accent { syntax: '<color>'; inherits: true; initial-value: #FF2B1C; }

  .sw { --sw-paper: #F3F0E8; }

  /* ── Halftone dot wipe ── */
  .sw-wipe {
    position: relative;
    /* a short band: the dots start about an inch above the paper and its strips */
    height: 130px;
    margin-top: -130px;
    overflow: hidden;
    pointer-events: none;
  }
  .sw-wipe canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

  /* ── Paper ── */
  .sw-body {
    position: relative;
    isolation: isolate;
    background: var(--sw-paper);
    color: var(--ink);
    transition: --sw-accent 0.6s ease;
  }
  .sw-noise {
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: ${GRUNGE};
    background-size: 256px 256px;
    mix-blend-mode: multiply;
    opacity: 0.12;
    animation: driftTexture 20s linear infinite;
    pointer-events: none;
  }

  /* ── Intro ── */
  .sw-intro {
    position: relative;
    height: 100vh;
    height: 100svh;
    overflow: hidden;
  }
  .sw-intro-media { position: absolute; inset: 0; }
  .sw-intro-media video { width: 100%; height: 100%; object-fit: contain; display: block; }
  .sw-intro-type {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.6vh;
  }
  .sw-intro-line {
    display: flex;
    width: max-content;
    white-space: nowrap;
    font-family: var(--font-display);
    font-size: 16.5vh;
    line-height: 1;
    text-transform: uppercase;
    color: transparent;
    -webkit-text-stroke: 1.5px var(--ink);
    animation: swLine 26s linear infinite paused;
  }
  .sw-intro-line:nth-child(3) { color: var(--signal); -webkit-text-stroke: 0; }
  .sw-intro-line.is-rev { animation-direction: reverse; }
  .sw-intro.is-playing .sw-intro-line { animation-play-state: running; }
  @keyframes swLine { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  /* the title card is empty by the time it un-pins, so the video rides up into it */
  .sw-intro--tuck { margin-top: -30vh; }

  /* ── Showroom ── */
  .sw-showroom {
    position: relative;
    display: grid;
    grid-template-columns: var(--stage) var(--rail);
    min-height: 100vh;
    min-height: 100svh;
  }
  .sw-stage {
    position: relative;
    min-width: 0;
    min-height: 100vh;
    min-height: 100svh;
    overflow: hidden;
  }
  .sw-bloom {
    position: absolute;
    left: 50%;
    top: 52%;
    width: 96%;
    aspect-ratio: 1;
    translate: -50% -50%;
    background: radial-gradient(circle, var(--sw-accent) 0%, transparent 62%);
    opacity: 0.14;
    animation: swBloom 14s ease-in-out infinite alternate;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }
  @keyframes swBloom { from { transform: translate(-4%, -3%) scale(1); } to { transform: translate(4%, 3%) scale(1.08); } }
  .sw-ghost {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-size: 18vw;
    line-height: 0.85;
    text-transform: uppercase;
    white-space: nowrap;
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--ink) 11%, transparent);
    pointer-events: none;
    transition: opacity 0.4s ease;
  }
  .sw-ghost span { animation: swGhost 0.9s var(--ease-enter) both; }
  @keyframes swGhost { from { opacity: 0; transform: translateX(6%) skewX(-6deg); } to { opacity: 1; transform: none; } }
  .sw-floor {
    position: absolute;
    height: 5vh;
    border-radius: 50%;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 68%);
    filter: blur(5px);
    pointer-events: none;
    transition: transform 0.4s ease, opacity 0.4s ease;
  }
  .sw-stage.is-over .sw-floor { transform: scaleX(0.92); }

  .sw-model-wrap { position: absolute; inset: 0; transform-origin: 50% 92%; }
  .sw-model-canvas {
    position: absolute;
    inset: 0;
    transform-origin: 50% 92%;
    transition: transform 0.45s var(--ease-enter), opacity 0.45s ease;
  }
  .sw-stage.is-over .sw-model-canvas { transform: scale(1.02); }
  .sw-stage.is-art .sw-model-canvas { transform: scale(0.92); opacity: 0; }
  .sw-stage.is-art .sw-ghost, .sw-stage.is-art .sw-bloom, .sw-stage.is-art .sw-floor { opacity: 0; }
  .sw-scan {
    position: absolute;
    left: 8%;
    right: 8%;
    bottom: 4%;
    height: 2px;
    background: var(--signal);
    box-shadow: 0 0 14px 2px color-mix(in srgb, var(--signal) 55%, transparent);
    opacity: 0;
    pointer-events: none;
  }
  .sw-model-btn {
    position: absolute;
    padding: 0;
    border: 0;
    background: none;
    opacity: 0;
    pointer-events: none;
  }
  .sw-model-btn:focus-visible { opacity: 1; outline: 2px solid var(--signal); outline-offset: -6px; }

  .sw-info {
    position: absolute;
    left: 2.6vw;
    bottom: 2.2rem;
    z-index: 3;
    max-width: 24%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    pointer-events: none;
  }
  .sw-count { font-family: var(--font-meta); font-size: 0.72rem; letter-spacing: 0.12em; }
  .sw-name {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(1.9rem, 3.5vw, 3.8rem);
    line-height: 0.9;
    text-transform: uppercase;
    color: var(--signal);
    margin: 0.35rem 0 0.6rem;
    animation: swName 0.6s var(--ease-enter) both;
  }
  @keyframes swName { from { opacity: 0; transform: translateY(0.35em) rotate(-2deg); } to { opacity: 1; transform: none; } }
  .sw-meta { font-family: var(--font-meta); font-size: 0.66rem; letter-spacing: 0.1em; }
  .sw-kicker { font-family: var(--font-handwritten); font-size: 1.15rem; line-height: 1.1; margin-top: 0.6rem; opacity: 0.72; }

  .sw-hint { position: absolute; z-index: 3; pointer-events: none; translate: -50% 0; }
  .sw-hint .sticker { font-size: 0.62rem; white-space: nowrap; animation: swBob 2.4s ease-in-out infinite; }
  @keyframes swBob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -6px; } }

  /* ── Rail + wheel ── */
  .sw-rail {
    position: relative;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4.5rem 0 2rem;
  }
  .sw-wheel {
    position: relative;
    width: 100%;
    height: min(84vh, 46vw);
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
  }
  .sw-wheel-spin { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }
  .sw-card {
    position: absolute;
    left: 0;
    padding: 0;
    border: 2px solid var(--ink);
    border-radius: 14px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    will-change: transform;
    outline: none;
  }
  .sw-card img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .sw-card.is-open { box-shadow: 0 22px 50px rgba(0, 0, 0, 0.34); }
  .sw-card:focus-visible { outline: 2px solid var(--signal); outline-offset: 2px; }
  .sw-card-num {
    position: absolute;
    top: 0.45rem;
    left: 0.45rem;
    padding: 0.1em 0.45em;
    font-family: var(--font-meta);
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    color: var(--bone, #F4F1EA);
    background: var(--ink);
    transition: background-color 0.3s ease;
  }
  .sw-card.is-selected .sw-card-num { background: var(--signal); }
  .sw-card-name {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 0.4em 0.6em;
    font-family: var(--font-meta);
    font-size: 0.5rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: left;
    color: #F4F1EA;
    background: var(--ink);
    transform: translateY(101%);
    transition: transform 0.3s var(--ease-enter);
  }
  .sw-card.is-open .sw-card-name { transform: none; }
  .sw-card-select {
    position: absolute;
    inset: 0;
    border: 2px solid var(--signal);
    border-radius: 11px;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .sw-card.is-selected .sw-card-select { opacity: 1; }
  .sw-card-select i { position: absolute; width: 7px; height: 7px; background: var(--signal); }
  .sw-card-select i:nth-child(1) { top: 4px; left: 4px; }
  .sw-card-select i:nth-child(2) { top: 4px; left: calc(50% - 3.5px); }
  .sw-card-select i:nth-child(3) { top: 4px; right: 4px; }
  .sw-card-select i:nth-child(4) { top: calc(50% - 3.5px); right: 4px; }
  .sw-card-select i:nth-child(5) { bottom: 4px; right: 4px; }
  .sw-card-select i:nth-child(6) { bottom: 4px; left: calc(50% - 3.5px); }
  .sw-card-select i:nth-child(7) { bottom: 4px; left: 4px; }
  .sw-card-select i:nth-child(8) { top: calc(50% - 3.5px); left: 4px; }

  .sw-hub {
    position: absolute;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    z-index: 80;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--acid);
    border: 2px solid var(--ink);
    box-shadow: var(--shadow-sticker);
    font-family: var(--font-meta);
    font-size: clamp(0.5rem, 0.72vw, 0.7rem);
    letter-spacing: 0.04em;
    line-height: 1.2;
    color: var(--ink);
    pointer-events: none;
  }
  .sw-hub b { font-weight: 400; font-size: 1.2em; }
  .sw-caption {
    margin: 1.4rem 0 0;
    font-family: var(--font-meta);
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-align: center;
    opacity: 0.7;
  }

  /* ── Artwork view ── */
  .sw-art {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    padding: 5rem 2.2vw 1.6rem;
    overflow: hidden;
    transition: background-color 0.4s ease, color 0.4s ease;
  }
  .sw-art::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: ${NOISE};
    background-size: 240px 240px;
    opacity: 0.12;
    pointer-events: none;
  }
  .sw-art--white { background-color: #FBFAF6; color: var(--ink); }
  .sw-art--white::before { mix-blend-mode: multiply; }
  .sw-art--black { background-color: #0B0B0B; color: #F4F1EA; }
  .sw-art--black::before { filter: invert(1); mix-blend-mode: screen; }
  .sw-art-bar {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .sw-art-title { font-family: var(--font-display); font-size: clamp(1.2rem, 2vw, 1.9rem); text-transform: uppercase; line-height: 1; }
  .sw-art-controls { display: flex; gap: 0.8rem; }
  .sw-art-controls .sticker { font-size: 0.65rem; padding: 0.5em 0.9em; }
  .sw-art-sheets {
    position: relative;
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3vw;
    padding: 1.5rem 1rem 0.5rem;
  }
  .sw-sheet {
    flex: 0 1 46%;
    max-height: 100%;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    animation: swSheetTop 0.8s var(--ease-enter) both;
  }
  .sw-art-sheets--1 .sw-sheet { flex-basis: 62%; }
  .sw-sheet--left { --rot: -3deg; animation-name: swSheetLeft; }
  .sw-sheet--right { --rot: 3deg; animation-name: swSheetRight; }
  .sw-sheet--top { --rot: -1.5deg; }
  @keyframes swSheetLeft { from { opacity: 0; transform: translateX(-60%) rotate(-12deg); } to { opacity: 1; transform: none; } }
  @keyframes swSheetRight { from { opacity: 0; transform: translateX(60%) rotate(12deg); } to { opacity: 1; transform: none; } }
  @keyframes swSheetTop { from { opacity: 0; transform: translateY(-50%) rotate(8deg); } to { opacity: 1; transform: none; } }
  .sw-sheet-btn {
    display: block;
    padding: 0;
    border: 0;
    background: none;
    rotate: var(--rot);
    transition: rotate 0.4s var(--ease-enter), translate 0.4s var(--ease-enter);
  }
  .sw-sheet-btn:hover, .sw-sheet-btn:focus-visible { rotate: 0deg; translate: 0 -8px; }
  .sw-sheet-btn img {
    display: block;
    max-width: 100%;
    max-height: 58vh;
    object-fit: contain;
    filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.22));
  }
  .sw-sheet figcaption { font-family: var(--font-meta); font-size: 0.6rem; letter-spacing: 0.14em; opacity: 0.75; }

  /* front + back: one above the other, the wide front print on top */
  .sw-art-sheets--2 { flex-direction: column; gap: 1.4rem; }
  .sw-art-sheets--2 .sw-sheet { flex: 0 1 auto; gap: 0.6rem; }
  .sw-art-sheets--2 .sw-sheet--front img { max-height: 15vh; }
  .sw-art-sheets--2 .sw-sheet--back img { max-height: 42vh; }

  /* Larger look: a centred panel at 75% of the screen, never full screen */
  .sw-zoom {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-lightbox) + 1);
    display: grid;
    place-items: center;
    background: rgba(8, 8, 8, 0.62);
    animation: swZoomIn 0.25s ease both;
  }
  .sw-zoom-panel {
    position: relative;
    width: 75vw;
    height: 75vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2.2vh;
    padding: 3.5vh 3vw 5.5vh;
    border: 2px solid var(--ink);
    border-radius: 14px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
    overflow: hidden;
    animation: swZoomPop 0.4s var(--ease-enter) both;
  }
  .sw-zoom-item {
    position: relative;
    margin: 0;
    min-height: 0;
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7vh;
  }
  .sw-zoom-panel--2 .sw-zoom-item--front { flex: 0.42 1 0; }
  .sw-zoom-item img { display: block; flex: 1 1 0; min-height: 0; max-width: 100%; object-fit: contain; }
  .sw-zoom-item figcaption { flex: none; font-family: var(--font-meta); font-size: 0.58rem; letter-spacing: 0.14em; opacity: 0.7; }
  .sw-zoom-label {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 1.6vh;
    text-align: center;
    font-family: var(--font-meta);
    font-size: 0.55rem;
    letter-spacing: 0.14em;
    opacity: 0.55;
  }
  @keyframes swZoomIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes swZoomPop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } }

  /* ── Exit: fade to black into the Outro ── */
  .sw-exit { height: 70vh; background: linear-gradient(to bottom, transparent 0%, #000 100%); pointer-events: none; }

  /* ── Phones / tablets ── */
  @media (max-width: 900px) {
    .sw-showroom { grid-template-columns: minmax(0, 1fr); min-height: 0; }
    .sw-stage { min-height: 0; height: 54vh; height: 54svh; }
    .sw-ghost { font-size: 30vw; }
    .sw-info { left: 1rem; bottom: 0.8rem; max-width: 62%; }
    .sw-name { font-size: clamp(1.6rem, 8vw, 2.6rem); }
    .sw-kicker { display: none; }
    .sw-hint { left: auto !important; right: 0.8rem; top: 0.8rem !important; translate: none; }
    .sw-hint .sticker { font-size: 0.5rem; }
    .sw-rail { padding: 1.5rem 0 1rem; }
    .sw-wheel { height: min(88vw, 44vh); height: min(88vw, 44svh); }
    .sw-art--sheet {
      position: fixed;
      z-index: var(--z-lightbox);
      padding: 1.2rem 1rem 2rem;
      overflow-y: auto;
    }
    .sw-art--sheet .sw-art-sheets { flex: none; flex-direction: column; gap: 2.5rem; padding: 2rem 0.5rem; }
    .sw-art-sheets--2 .sw-sheet--front img, .sw-art-sheets--2 .sw-sheet--back img { max-height: none; }
    .sw-zoom-panel { padding: 2.5vh 4vw 5vh; }
    .sw-art--sheet .sw-sheet { flex: none; width: 100%; max-height: none; }
    .sw-sheet-btn img { max-height: none; width: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sw-bloom, .sw-hint .sticker, .sw-ghost span, .sw-name, .sw-sheet, .sw-intro-line { animation: none; }
  }
`;
