import { useContext, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { archive } from '../../../../data/archive';
import type { ArchiveEmailer } from '../../../../data/archive';
import { archiveContent } from '../../../../content/archive';
import { PageHead, Pic, ScrollRoot, prefersReducedMotion, useReveal } from './bits';
import Lightbox from './Lightbox';

/** Auto-scroll speed down the emailer, px per second (×3 on hover); the way back up is quick */
const SPEED = 46;
const RETURN = 520;

/**
 * One emailer inside an email-client window. Like the website cards elsewhere on the site
 * it reads itself: slowly down to the end, a pause, back to the top. Wheel or drag takes over;
 * the auto-scroll resumes two seconds after the last touch.
 */
function MailFrame({ mail, onOpen }: { mail: ArchiveEmailer; onOpen: () => void }) {
  const viewRef = useRef<HTMLDivElement>(null);
  const scrollRoot = useContext(ScrollRoot);
  const reveal = useReveal(120);
  const drag = useRef<{ y: number; top: number; moved: number } | null>(null);
  const touched = useRef(0);
  const hover = useRef(false);

  useEffect(() => {
    const el = viewRef.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    let visible = false;
    let pos = 0;
    let dir = 1;
    let last = performance.now();
    let hold = last + 1200;
    let wasManual = false;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(64, t - last) / 1000;
      last = t;
      const max = el.scrollHeight - el.clientHeight;
      if (!visible || max < 8) return;
      if (t - touched.current < 2000) {
        wasManual = true;
        return;
      }
      if (wasManual) {
        // pick up from wherever the visitor left it
        wasManual = false;
        pos = el.scrollTop;
        dir = 1;
      }
      if (t < hold) return;
      pos += dir * (dir > 0 ? SPEED * (hover.current ? 3 : 1) : RETURN) * dt;
      if (pos >= max) {
        pos = max;
        dir = -1;
        hold = t + 1500;
      } else if (pos <= 0) {
        pos = 0;
        dir = 1;
        hold = t + 1100;
      }
      el.scrollTop = pos;
    };

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { root: scrollRoot, threshold: 0.15 });
    io.observe(el);
    raf = requestAnimationFrame(tick);
    const touch = () => (touched.current = performance.now());
    el.addEventListener('wheel', touch, { passive: true });
    el.addEventListener('touchstart', touch, { passive: true });
    el.addEventListener('touchmove', touch, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener('wheel', touch);
      el.removeEventListener('touchstart', touch);
      el.removeEventListener('touchmove', touch);
    };
  }, [scrollRoot]);

  // mouse: drag to scroll; a press that does not move opens the full emailer
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { y: e.clientY, top: e.currentTarget.scrollTop, moved: 0 };
    touched.current = performance.now();
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    d.moved = Math.max(d.moved, Math.abs(e.clientY - d.y));
    e.currentTarget.scrollTop = d.top - (e.clientY - d.y);
    touched.current = performance.now();
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && d.moved < 5) onOpen();
  };

  const img = mail.image;
  return (
    <figure ref={reveal} className="ar-mail">
      <div className="ar-mail-chrome" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>INBOX</span>
      </div>
      <figcaption className="ar-mail-head">
        <h3 className="ar-mail-subject">{mail.subject}</h3>
        <div className="ar-mail-from">
          <span className="ar-mail-avatar" aria-hidden="true">
            {mail.from.charAt(0)}
          </span>
          <span className="ar-mail-who">
            <b>{mail.from}</b>
            <em>to: you</em>
          </span>
          <button type="button" className="ar-mail-open" data-cursor="OPEN" onClick={onOpen}>
            OPEN FULL ↗
          </button>
        </div>
      </figcaption>
      <div
        ref={viewRef}
        className="ar-mail-view"
        data-lenis-prevent
        data-cursor="VIEW"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        onPointerEnter={() => (hover.current = true)}
        onPointerLeave={() => (hover.current = false)}
        onClick={(e) => {
          // touch + keyboard: a plain tap opens it (mouse clicks are handled on pointer-up)
          if ((e.nativeEvent as PointerEvent).pointerType !== 'mouse') onOpen();
        }}
      >
        <Pic image={img} sizes="(max-width: 860px) 92vw, 560px" eager alt={`${mail.from} emailer: ${mail.subject}`} />
      </div>
    </figure>
  );
}

/** Emailers, each reading itself inside an email-client window. */
export default function EmailersPage() {
  const mails = archive.emailers;
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? null : mails[open];

  return (
    <article className="ar-format">
      <PageHead title="Emailers" meta={`${mails.length} EMAILERS`}>
        <p className="ar-about">{archiveContent.emailers.intro}</p>
      </PageHead>
      <div className="ar-mails">
        {mails.map((m, i) => (
          <MailFrame key={m.slug} mail={m} onOpen={() => setOpen(i)} />
        ))}
      </div>
      {current && <Lightbox slides={[{ image: current.image, caption: current.subject }]} start={0} title={current.from} onClose={() => setOpen(null)} tall />}
    </article>
  );
}

export const emailersCss = `
.ar-mails {
  width: min(1200px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: start;
}
.ar-mail {
  margin: 0;
  min-width: 0;
  background: #FBFAF6;
  border: 2px solid var(--ink);
  border-radius: 14px;
  box-shadow: 8px 8px 0 var(--ink);
  overflow: hidden;
  opacity: 0;
  transform: translateY(50px) rotate(-1.5deg);
  transition: opacity 0.6s ease var(--rd, 0ms), transform 0.9s var(--ease-enter) var(--rd, 0ms);
}
.ar-mail:nth-child(even) { transform: translateY(50px) rotate(1.5deg); margin-top: clamp(0rem, 6vh, 4rem); }
.ar-mail.is-in { opacity: 1; transform: none; }
.ar-mail-chrome {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 0.9rem;
  background: var(--ink);
  color: var(--bone);
  font-family: var(--font-meta);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
}
.ar-mail-chrome i { width: 9px; height: 9px; border-radius: 50%; background: var(--signal); }
.ar-mail-chrome i:nth-child(2) { background: var(--sun); }
.ar-mail-chrome i:nth-child(3) { background: var(--acid); }
.ar-mail-chrome span { margin-left: auto; opacity: 0.6; }
.ar-mail-head { padding: 1rem 1.1rem 0.9rem; border-bottom: 1.5px solid rgba(13, 13, 13, 0.14); }
.ar-mail-subject {
  margin: 0;
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: clamp(1rem, 1.5vw, 1.35rem);
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.ar-mail-from { display: flex; align-items: center; gap: 0.7rem; margin-top: 0.8rem; }
.ar-mail-avatar {
  flex: none;
  width: 2.2rem;
  height: 2.2rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--signal);
  color: #fff;
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 0.95rem;
}
.ar-mail-who { min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
.ar-mail-who b { font-family: var(--font-body); font-weight: 700; font-size: 0.86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ar-mail-who em { font-style: normal; font-family: var(--font-meta); font-size: 0.62rem; opacity: 0.6; }
.ar-mail-open {
  margin-left: auto;
  flex: none;
  padding: 0.5em 0.8em;
  font-family: var(--font-meta);
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  line-height: 1;
  color: var(--ink);
  background: var(--acid);
  border: 2px solid var(--ink);
  border-radius: var(--radius-sticker);
  box-shadow: 3px 3px 0 var(--ink);
  transform: rotate(-2deg);
  transition: transform 0.25s var(--ease-bounce);
}
.ar-mail-open:hover, .ar-mail-open:focus-visible { transform: rotate(0deg) scale(1.06); outline: none; }
.ar-mail-view {
  max-height: min(80vh, 780px);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}
.ar-mail-view::-webkit-scrollbar { display: none; }
.ar-mail-view .ar-pic { width: 100%; }
@media (max-width: 860px) {
  .ar-mails { grid-template-columns: minmax(0, 1fr); }
  .ar-mail:nth-child(even) { margin-top: 0; }
  .ar-mail { box-shadow: 5px 5px 0 var(--ink); }
}
@media (prefers-reduced-motion: reduce) {
  .ar-mail { opacity: 1; transform: none !important; transition: none; }
}
`;
