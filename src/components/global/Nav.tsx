import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters, sectionIds, siteInfo } from '../../data/portfolio';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';

gsap.registerPlugin(ScrollTrigger);

/**
 * Fixed navigation bar with chapter indicator, menu button and CTA.
 */
export default function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Show/hide on scroll direction
  useEffect(() => {
    let lastScroll = 0;
    const onScroll = () => {
      const curr = window.scrollY;
      setHidden(curr > lastScroll && curr > 100);
      lastScroll = curr;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // While the menu is open: the page behind stays put, ESC closes
  useEffect(() => {
    if (!menuOpen) return;
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      lenis?.start();
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Track current chapter
  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      chapters.forEach((_ch, i) => {
        const sectionId = sectionIds[i];
        const el = document.getElementById(`section-${sectionId}`);
        if (!el) return;

        ScrollTrigger.create({
          trigger: el,
          refreshPriority: -1,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setCurrentChapter(i),
          onEnterBack: () => setCurrentChapter(i),
        });
      });
    });
    return () => ctx.revert();
  }, []);

  const scrollToSection = (index: number) => {
    const el = document.getElementById(`section-${sectionIds[index]}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  const ch = chapters[currentChapter] || chapters[0];

  return (
    <>
      <nav
        ref={navRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 'var(--z-nav)' as any,
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transform: hidden && !menuOpen ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          // over the red menu the difference blend turned the bar cyan
          mixBlendMode: menuOpen ? 'normal' : 'difference',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            color: 'var(--bone)',
            cursor: 'pointer',
          }}
          onClick={() => scrollToSection(0)}
          data-cursor="TOP"
        >
          {siteInfo.name} ✦
        </div>

        {/* Chapter indicator */}
        <div
          style={{
            fontFamily: 'var(--font-meta)',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            color: 'var(--bone)',
            textTransform: 'uppercase',
            overflow: 'hidden',
            height: '1.2em',
          }}
        >
          <div
            key={currentChapter}
            style={{
              animation: 'slideUp 0.4s ease forwards',
            }}
          >
            {String(ch.num).padStart(2, '0')} / {String(ch.total).padStart(2, '0')} — {ch.label}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              color: 'var(--bone)',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            data-cursor="MENU"
          >
            {menuOpen ? 'CLOSE' : 'MENU'}
          </button>

          <a
            href="#section-outro"
            className="sticker sticker--acid"
            style={{ '--sticker-rotate': '-2deg', fontSize: '0.65rem', mixBlendMode: 'normal' } as any}
            onClick={(e) => { e.preventDefault(); scrollToSection(sectionIds.length - 1); }}
            data-cursor="TALK"
          >
            LET'S TALK
          </a>
        </div>
      </nav>

      {/* Menu Overlay */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            backgroundColor: 'var(--signal)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            // room for the bar on top; the list is sized to fit the height that is left
            padding: '5.5rem clamp(1.25rem, 4vw, 4rem) 2rem',
            overflow: 'hidden',
            animation: 'wipeDown 0.5s ease forwards',
          }}
        >
          {chapters.map((ch, i) => (
            <button
              key={i}
              onClick={() => scrollToSection(i)}
              style={{
                fontFamily: 'var(--font-display)',
                // every chapter has to fit on one screen, whatever its height or width
                fontSize: `clamp(1.25rem, min(6.4vw, calc((100svh - 10.5rem) / ${chapters.length})), 6rem)`,
                color: 'var(--bone)',
                textTransform: 'uppercase',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                marginBottom: '0.35rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s, transform 0.2s',
                opacity: currentChapter === i ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
                (e.currentTarget as HTMLElement).style.transform = 'translateX(20px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = currentChapter === i ? '1' : '0.5';
                (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
              }}
              data-cursor="GO"
            >
              <span style={{ fontFamily: 'var(--font-meta)', fontSize: '0.7rem', marginRight: '1rem', verticalAlign: 'super' }}>
                {String(ch.num).padStart(2, '0')}
              </span>
              {ch.title}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes wipeDown {
          from { clip-path: inset(0 0 100% 0); }
          to   { clip-path: inset(0 0 0 0); }
        }
      `}</style>
    </>
  );
}
