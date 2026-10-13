import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import Lenis from 'lenis';
import GrainOverlay from '../components/global/GrainOverlay';
import CustomCursor from '../components/global/CustomCursor';
import type { PageMeta } from '../content/seo';
import { serviceNav } from '../content/seo';
import { site } from '../content/site';
import type { Img } from './media';
import { pagesCss } from './css';

/** An image with its real size, lazy unless it is the first thing on the page */
export function Pic({ img, sizes, eager, className }: { img: Img; sizes?: string; eager?: boolean; className?: string }) {
  if (!img.src) return null;
  return (
    <img
      className={className}
      src={img.src}
      srcSet={img.srcset}
      sizes={img.srcset ? sizes ?? '(max-width: 700px) 92vw, 46vw' : undefined}
      width={img.w}
      height={img.h}
      alt={img.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}

/** "LET'S TALK" block that closes every page */
export function ContactCta({ line = 'Have a project in mind?' }: { line?: string }) {
  return (
    <section className="pg-cta" aria-labelledby="pg-cta-h" data-rv>
      <h2 id="pg-cta-h" className="pg-cta-h">
        {line}
      </h2>
      <p className="pg-cta-p">
        Tell {site.name} about it: <a href={`mailto:${site.email}`}>{site.email}</a> or <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>.
      </p>
      <a className="sticker sticker--signal pg-cta-btn" href="/contact" data-cursor="TALK">
        GET IN TOUCH →
      </a>
    </section>
  );
}

const year = new Date().getFullYear();

/**
 * The frame every inner page shares: header, breadcrumb, main, footer. It uses the same paper,
 * grain, cursor and smooth scroll as the home page, so the pages feel like part of the same film.
 */
export default function Shell({ meta, children }: { meta: PageMeta; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  // same smooth scroll as the home page
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  // blocks below the fold rise in as they arrive; whatever is already on screen stays put
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const waiting = Array.from(root.querySelectorAll<HTMLElement>('[data-rv]')).filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.92);
    waiting.forEach((el) => el.classList.add('pg-wait'));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.remove('pg-wait');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    waiting.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      waiting.forEach((el) => el.classList.remove('pg-wait'));
    };
  }, [meta.path]);

  const crumbs = meta.crumbs;
  const socials = Object.entries(site.socials).filter(([, url]) => url);

  return (
    <div ref={rootRef} className="pg">
      <style>{pagesCss}</style>
      <GrainOverlay />
      <CustomCursor />

      <header className="pg-header">
        <a className="pg-logo" href="/" data-cursor="HOME">
          {site.name.toUpperCase()} ✦
        </a>
        <nav className="pg-nav" aria-label="Main">
          <a href="/work">WORK</a>
          <a href="/services">SERVICES</a>
          <a href="/about">ABOUT</a>
          <a className="sticker sticker--acid pg-nav-cta" href="/contact" data-cursor="TALK">
            LET'S TALK
          </a>
        </nav>
      </header>

      <main id="main" className="pg-main">
        {crumbs.length > 1 && (
          <nav className="pg-crumbs" aria-label="Breadcrumb">
            <ol>
              {crumbs.map((c, i) => (
                <li key={c.path}>
                  {i === crumbs.length - 1 ? <span aria-current="page">{c.name}</span> : <a href={c.path}>{c.name}</a>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {children}
      </main>

      <footer className="pg-footer">
        <div className="pg-footer-grid">
          <div>
            <p className="pg-footer-name">{site.name.toUpperCase()} ✦</p>
            <p className="pg-footer-role">{site.jobTitle}</p>
          </div>
          <nav aria-label="Services">
            <p className="pg-footer-h">SERVICES</p>
            <ul>
              {serviceNav.map((s) => (
                <li key={s.path}>
                  <a href={s.path}>{s.label}</a>
                </li>
              ))}
              <li>
                <a href="/contact">Contact</a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Site">
            <p className="pg-footer-h">EXPLORE</p>
            <ul>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/work">Work</a>
              </li>
              <li>
                <a href="/work/archive">Creatives archive</a>
              </li>
              <li>
                <a href="/about">About</a>
              </li>
            </ul>
          </nav>
          <div>
            <p className="pg-footer-h">CONTACT</p>
            <ul>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li>
                <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>
              </li>
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} rel="me noopener" target="_blank">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="pg-footer-fine">
          © {year} {site.name} ✦ {site.jobTitle}
        </p>
      </footer>
    </div>
  );
}
