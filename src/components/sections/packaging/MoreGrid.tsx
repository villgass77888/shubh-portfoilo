import { useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsomorphicLayoutEffect } from '../../../hooks/useIsomorphicLayoutEffect';
import { moreHeader, moreProjects } from '../../../data/packaging';
import type { PackMedia, PackProject } from '../../../data/packaging';
import { Chars } from '../smm/archive/marks';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  reduced: boolean;
  onOpen: (project: PackProject, key: string, origin: { x: number; y: number }) => void;
};

/** Which edge of the tile the pointer is nearest to: the hover image wipes in from that side */
function sideOf(e: ReactPointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  const d = [y, 1 - x, 1 - y, x];
  return ['top', 'right', 'bottom', 'left'][d.indexOf(Math.min(...d))];
}

type TileProps = {
  media: PackMedia;
  /** Flat artwork (or alternate shot) the main tile dissolves to on hover */
  swap?: PackMedia;
  project: PackProject;
  index: number;
  onOpen: Props['onOpen'];
};

function Tile({ media, swap, project, index, onOpen }: TileProps) {
  const image = media.image;
  const track = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    // supporting tiles: the photo leans a little against the pointer
    el.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  return (
    <button
      type="button"
      className={`pkm-tile${media.flat ? ' pkm-tile--flat' : ''}${swap ? ' pkm-tile--main' : ''}`}
      style={{ '--ar': (image.w / image.h).toFixed(4), '--i': index } as CSSProperties}
      data-cursor="VIEW"
      data-from="left"
      aria-label={`${project.name}: ${media.label}. Open full screen`}
      onClick={(e) => onOpen(project, media.key, { x: e.clientX || window.innerWidth / 2, y: e.clientY || window.innerHeight / 2 })}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') e.currentTarget.dataset.from = sideOf(e);
      }}
      onPointerMove={track}
      onPointerLeave={(e) => {
        e.currentTarget.dataset.from = sideOf(e);
        e.currentTarget.style.setProperty('--px', '0');
        e.currentTarget.style.setProperty('--py', '0');
      }}
    >
      <span className="pkm-media" style={media.flat ? undefined : { backgroundImage: `url(${image.lqip})` }}>
        <img src={image.src} alt={`${project.name} packaging: ${media.label.toLowerCase()}`} loading="lazy" decoding="async" draggable={false} />
        {swap && (
          <span className={`pkm-swap${swap.flat ? ' pkm-swap--flat' : ''}`} aria-hidden="true">
            <img src={swap.image.src} alt="" loading="lazy" decoding="async" draggable={false} />
          </span>
        )}
      </span>
      <span className="pkm-label">
        {swap ? `${media.label} ↔ ${swap.label}` : media.label}
      </span>
      <span className="tape pkm-tape" aria-hidden="true" />
    </button>
  );
}

/**
 * More packaging: one small cluster per project under a header row (name, meta, one line),
 * every tile at its photo's own proportions and all at one height. Gentle entrances only;
 * the main tile dissolves to its flat artwork on hover; any tile opens the full-screen viewer.
 */
export default function MoreGrid({ reduced, onOpen }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.pkm-top, .pkm-head, .pkm-row', root).forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => el.classList.add('is-in') });
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={rootRef} className="pkm">
      <header className="pkm-top">
        <p className="pk-kicker">{moreHeader.kicker}</p>
        <h3 className="pk-title" aria-label={moreHeader.title}>
          <Chars text={moreHeader.title} />
        </h3>
      </header>

      {moreProjects.map((project) => {
        const main = project.gallery[0];
        const swap = project.gallery.find((m) => m.key === project.hover);
        const sum = project.gallery.reduce((n, m) => n + m.image.w / m.image.h, 0);
        return (
          <section key={project.slug} className="pkm-cluster" aria-label={project.name}>
            <header className="pkm-head">
              <h4 className="pkm-name">{project.name}</h4>
              <div className="pkm-about">
                <p className="pkm-meta">{project.meta}</p>
                <p className="pkm-line">{project.line}</p>
              </div>
            </header>
            <div className="pkm-row" style={{ '--sum': sum.toFixed(4), '--n': project.gallery.length } as CSSProperties}>
              {project.gallery.map((media, i) => (
                <Tile key={media.key} media={media} swap={media === main ? swap : undefined} project={project} index={i} onOpen={onOpen} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
