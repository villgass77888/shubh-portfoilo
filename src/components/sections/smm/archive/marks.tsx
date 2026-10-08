import type { CSSProperties } from 'react';

/**
 * The two small motifs the archive shares with its trigger on the page:
 * the Illustrator selection frame that draws itself (lines, then 8 handles), and
 * the signature title reveal where every character rises out of its own mask.
 * Both are driven by a class (`is-on` / `is-in`) so CSS does the choreography.
 */

const HANDLES = ['tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml'];

/** Put inside any `.ar-sel` element; add `is-on` (or use `.ar-sel--hover`) to draw it. */
export function SelMarks() {
  return (
    <span className="ar-sel-marks" aria-hidden="true">
      <i className="ar-sel-l ar-sel-l--t" />
      <i className="ar-sel-l ar-sel-l--r" />
      <i className="ar-sel-l ar-sel-l--b" />
      <i className="ar-sel-l ar-sel-l--l" />
      {HANDLES.map((h, i) => (
        <b key={h} className={`ar-sel-h ar-sel-h--${h}`} style={{ '--i': i } as CSSProperties} />
      ))}
    </span>
  );
}

/** Text split into masked words and rising characters. Decorative: label the parent. */
export function Chars({ text }: { text: string }) {
  let n = 0;
  const words = text.split(' ');
  return (
    <span className="ar-chars" aria-hidden="true">
      {words.map((word, w) => (
        <span key={w}>
          <span className="ar-w">
            {[...word].map((ch) => {
              const i = n++;
              return (
                <span key={i} className="ar-ch" style={{ '--i': i } as CSSProperties}>
                  {ch}
                </span>
              );
            })}
          </span>
          {w < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}

export const marksCss = `
/* ── selection frame ── */
.ar-sel { position: relative; }
.ar-sel-marks { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.ar-sel-l {
  position: absolute;
  background: var(--sel, var(--signal));
  transition: transform 0.26s cubic-bezier(0.65, 0, 0.35, 1);
}
.ar-sel-l--t { left: 0; right: 0; top: 0; height: 2px; transform: scaleX(0); transform-origin: 0 50%; }
.ar-sel-l--r { top: 0; bottom: 0; right: 0; width: 2px; transform: scaleY(0); transform-origin: 50% 0; }
.ar-sel-l--b { left: 0; right: 0; bottom: 0; height: 2px; transform: scaleX(0); transform-origin: 100% 50%; }
.ar-sel-l--l { top: 0; bottom: 0; left: 0; width: 2px; transform: scaleY(0); transform-origin: 50% 100%; }
.ar-sel-h {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--sel, var(--signal));
  border: 1px solid var(--bone);
  transform: scale(0);
  transition: transform 0.3s var(--ease-bounce);
}
.ar-sel-h--tl { top: -3px; left: -3px; }
.ar-sel-h--tm { top: -3px; left: calc(50% - 4px); }
.ar-sel-h--tr { top: -3px; right: -3px; }
.ar-sel-h--mr { top: calc(50% - 4px); right: -3px; }
.ar-sel-h--br { bottom: -3px; right: -3px; }
.ar-sel-h--bm { bottom: -3px; left: calc(50% - 4px); }
.ar-sel-h--bl { bottom: -3px; left: -3px; }
.ar-sel-h--ml { top: calc(50% - 4px); left: -3px; }

.ar-sel.is-on > .ar-sel-marks .ar-sel-l,
.ar-sel--hover:hover > .ar-sel-marks .ar-sel-l,
.ar-sel--hover:focus-visible > .ar-sel-marks .ar-sel-l { transform: none; }
.ar-sel.is-on > .ar-sel-marks .ar-sel-l--r,
.ar-sel--hover:hover > .ar-sel-marks .ar-sel-l--r,
.ar-sel--hover:focus-visible > .ar-sel-marks .ar-sel-l--r { transition-delay: 0.1s; }
.ar-sel.is-on > .ar-sel-marks .ar-sel-l--b,
.ar-sel--hover:hover > .ar-sel-marks .ar-sel-l--b,
.ar-sel--hover:focus-visible > .ar-sel-marks .ar-sel-l--b { transition-delay: 0.2s; }
.ar-sel.is-on > .ar-sel-marks .ar-sel-l--l,
.ar-sel--hover:hover > .ar-sel-marks .ar-sel-l--l,
.ar-sel--hover:focus-visible > .ar-sel-marks .ar-sel-l--l { transition-delay: 0.3s; }
.ar-sel.is-on > .ar-sel-marks .ar-sel-h,
.ar-sel--hover:hover > .ar-sel-marks .ar-sel-h,
.ar-sel--hover:focus-visible > .ar-sel-marks .ar-sel-h {
  transform: scale(1);
  transition-delay: calc(0.34s + var(--i) * 30ms);
}

/* ── rising characters ── */
.ar-w { display: inline-block; overflow: hidden; vertical-align: top; line-height: 1; padding: 0.07em 0 0.05em; margin: -0.07em 0 -0.05em; }
.ar-ch {
  display: inline-block;
  transform: translateY(118%);
  transition: transform 0.85s var(--ease-enter);
  transition-delay: calc(var(--i) * 24ms + var(--d, 0ms));
}
.is-in .ar-ch, .ar-chars.is-in .ar-ch { transform: none; }

/* ── the trigger at the end of the SMM chapter ── */
.ar-trig {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 13vh 6vw 17vh;
}
/* the last brand's wash carries on from the scene above and fades out, so there is no seam */
.ar-trig::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, color-mix(in srgb, var(--tint, transparent) 13%, transparent), transparent 78%);
  pointer-events: none;
}
.ar-trig > * { position: relative; }
.ar-trig-btn {
  position: relative;
  display: inline-block;
  padding: 0.1em 0.24em 0.12em;
  font-family: var(--font-display);
  font-size: clamp(40px, 7vw, 110px);
  line-height: 1;
  text-transform: uppercase;
  color: var(--signal);
  outline: none;
}
.ar-trig-plate {
  position: absolute;
  inset: 0;
  background: var(--ink);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.5s var(--ease-enter);
}
.ar-trig-btn:hover .ar-trig-plate, .ar-trig-btn:focus-visible .ar-trig-plate { transform: none; }
.ar-trig-text { position: relative; }
.ar-trig-sticker {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 4;
  padding: 0.45em 0.8em;
  font-family: var(--font-meta);
  font-size: clamp(0.62rem, 0.9vw, 0.82rem);
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1;
  white-space: nowrap;
  color: var(--ink);
  background: var(--acid);
  border: 2px solid var(--ink);
  border-radius: var(--radius-sticker);
  box-shadow: var(--shadow-sticker);
  transform: translate(46%, -40%) rotate(-14deg) scale(0);
  transform-origin: 20% 100%;
  transition: transform 0.4s var(--ease-bounce);
  pointer-events: none;
}
.ar-trig-btn:hover .ar-trig-sticker, .ar-trig-btn:focus-visible .ar-trig-sticker {
  transform: translate(46%, -62%) rotate(7deg) scale(1);
  transition-delay: 0.12s;
}
.ar-trig-btn:hover .ar-sel-h, .ar-trig-btn:focus-visible .ar-sel-h { animation: arSelPulse 0.5s ease 0.05s 1; }
.ar-trig-btn.is-wiggle .ar-sel-h { animation: arSelGrab 0.65s ease 1; animation-delay: calc(var(--i) * 20ms); }
@keyframes arSelPulse { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.8); } }
@keyframes arSelGrab {
  0%, 100% { transform: scale(1) translate(0, 0); }
  30% { transform: scale(1.35) translate(1.5px, -1.5px); }
  60% { transform: scale(1.1) translate(-1px, 1px); }
}
.ar-trig-sub {
  margin-top: clamp(1rem, 2.6vh, 1.7rem);
  font-family: var(--font-body);
  font-size: clamp(1rem, 1.55vw, 1.4rem);
  line-height: 1.3;
  color: var(--ink);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.6s ease 0.75s, transform 0.7s var(--ease-enter) 0.75s;
}
.ar-trig.is-in .ar-trig-sub { opacity: 1; transform: none; }

/* shown for the moment the archive's code is still on its way */
.ar-loading {
  position: fixed;
  inset: 0;
  z-index: 140;
  display: grid;
  place-items: center;
  background: rgba(13, 13, 13, 0.45);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  color: var(--bone);
  font-family: var(--font-meta);
  font-size: 0.7rem;
  letter-spacing: 0.14em;
}

@media (prefers-reduced-motion: reduce) {
  .ar-ch { transform: none; }
  .ar-trig-sub { opacity: 1; transform: none; }
  .ar-trig-btn.is-wiggle .ar-sel-h, .ar-trig-btn:hover .ar-sel-h { animation: none; }
}
`;
