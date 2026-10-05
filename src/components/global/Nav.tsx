import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters, siteInfo } from '../../data/portfolio';
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

  // Track current chapter
  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      chapters.forEach((_ch, i) => {
        const sectionId = ['hero', 'logos', 'branding', 'web', 'smm', 'packaging', 'outro'][i];
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
    const sectionIds = ['hero', 'logos', 'branding', 'web', 'smm', 'packaging', 'outro'];
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
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          mixBlendMode: 'difference',
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
            onClick={(e) => { e.preventDefault(); scrollToSection(6); }}
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
            padding: '4rem',
            animation: 'wipeDown 0.5s ease forwards',
          }}
        >
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              fontFamily: 'var(--font-heading)',
              fontSize: '1rem',
              color: 'var(--bone)',
              cursor: 'pointer',
            }}
          >
            CLOSE ✕
          </button>

          {chapters.map((ch, i) => (
            <button
              key={i}
              onClick={() => scrollToSection(i)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 8vw, 6rem)',
                color: 'var(--bone)',
                textTransform: 'uppercase',
                lineHeight: 1,
                marginBottom: '0.5rem',
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
