import { useRef } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';
import { avifSet, honey, studioShelf } from '../../../data/packaging';
import { Chars } from '../smm/archive/marks';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  reduced: boolean;
  onOpen: (key: string, origin: { x: number; y: number }) => void;
};

/**
 * "From studio to shelf" — the finished jar in the real world, right after the featured scene:
 * the studio shot and the store-shelf shot in one line at equal height, a caption under each
 * that says only what the photo shows, and a strip of facts read off the label itself.
 */
export default function StudioShelf({ reduced, onOpen }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shots = studioShelf.shots.map((s) => ({ ...s, media: honey.gallery.find((m) => m.key === s.key)! })).filter((s) => s.media);
  // equal height, natural proportions: each column is as wide as its photo's aspect ratio
  const columns = shots.map((s) => `${(s.media.image.w / s.media.image.h).toFixed(3)}fr`).join(' ');

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reveal = (selector: string, start: string) =>
      gsap.utils.toArray<HTMLElement>(selector, root).forEach((el) => {
        ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => el.classList.add('is-in') });
      });
    const ctx = gsap.context(() => {
      reveal('.pks-head, .pks-facts', 'top 84%');
      reveal('.pks-shot', 'top 80%');
      if (reduced) return;
      // the two photos drift in opposite directions inside their frames
      gsap.utils.toArray<HTMLElement>('.pks-par', root).forEach((el, i) => {
        const from = i % 2 ? -5 : 5;
        gsap.fromTo(el, { yPercent: from }, { yPercent: -from, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={rootRef} className="pks">
      <header className="pks-head">
        <div>
          <p className="pk-kicker">{studioShelf.kicker}</p>
          <h3 className="pk-title" aria-label={studioShelf.title}>
            <Chars text={studioShelf.title} />
          </h3>
        </div>
        <p className="pks-intro">{studioShelf.intro}</p>
      </header>

      <div className="pks-row" style={{ '--cols': columns } as CSSProperties}>
        {shots.map((shot, i) => {
          const image = shot.media.image;
          return (
            <figure key={shot.key} className={`pks-shot pks-shot--${i}`} style={{ '--ar': `${image.w} / ${image.h}`, '--i': i } as CSSProperties}>
              <button
                type="button"
                className="pks-frame"
                data-cursor="VIEW"
                aria-label={`Open the ${shot.label.toLowerCase()} photo full screen`}
                onClick={(e) => onOpen(shot.key, { x: e.clientX || window.innerWidth / 2, y: e.clientY || window.innerHeight / 2 })}
              >
                <span className="pks-clip">
                  <span className="pks-par">
                    <picture>
                      {image.srcset && <source type="image/avif" srcSet={avifSet(image.srcset)} sizes="(max-width: 768px) 92vw, 46vw" />}
                      <img
                        src={image.src}
                        srcSet={image.srcset}
                        sizes="(max-width: 768px) 92vw, 46vw"
                        alt={`${honey.name}: ${shot.media.label.toLowerCase()}`}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        style={{ objectPosition: shot.media.objectPosition, backgroundImage: `url(${image.lqip})` }}
                      />
                    </picture>
                  </span>
                </span>
                <span className="pks-tag">{shot.tag}</span>
                <span className="tape pks-tape" aria-hidden="true" />
              </button>
              <figcaption className="pks-cap">
                <span className="pks-cap-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="pks-cap-label">{shot.label}</span>
                <span className="pks-cap-text">{shot.text}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <dl className="pks-facts">
        {studioShelf.facts.map((fact, i) => (
          <div key={fact.label} style={{ '--i': i } as CSSProperties}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
