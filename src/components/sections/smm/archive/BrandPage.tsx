import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { archive, imagesOf, smallest } from '../../../../data/archive';
import type { ArchiveBrand, ArchiveItem } from '../../../../data/archive';
import { PageHead, ScrollRoot } from './bits';
import { SelMarks } from './marks';
import Masonry from './Masonry';
import type { MasonryItem } from './Masonry';
import Lightbox from './Lightbox';
import type { Slide } from './Lightbox';
import type { ArchiveNav } from './route';

type Cat = 'posts' | 'carousels' | 'stories' | 'reel-covers' | 'banners';
const CATS: Array<[Cat, string]> = [
  ['posts', 'POSTS'],
  ['carousels', 'CAROUSELS'],
  ['stories', 'STORIES'],
  ['reel-covers', 'REEL COVERS'],
  ['banners', 'BANNERS'],
];

/** Each tile belongs to exactly one filter */
function catOf(item: ArchiveItem): Cat {
  const type = imagesOf(item)[0].type;
  if (type === 'story') return 'stories';
  if (type === 'reel-cover') return 'reel-covers';
  if (type === 'banner') return 'banners';
  return item.kind === 'carousel' ? 'carousels' : 'posts';
}

const NAMES: Record<string, string> = { post: 'post', story: 'story', 'reel-cover': 'reel cover', banner: 'banner' };
const columnsFor = (w: number) => (w >= 1180 ? 4 : w >= 820 ? 3 : 2);
/** First batch of tiles; more load as the visitor reaches the end */
const BATCH = 40;

type Props = { brand: ArchiveBrand; nav: ArchiveNav };

/** One brand: big title, a short paragraph, filter chips, and every creative in a masonry grid. */
export default function BrandPage({ brand, nav }: Props) {
  const scrollRoot = useContext(ScrollRoot);
  const [filter, setFilter] = useState<'all' | Cat>('all');
  const [count, setCount] = useState(BATCH);
  const [open, setOpen] = useState<string | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const cats = useMemo(() => CATS.filter(([c]) => brand.items.some((it) => catOf(it) === c)), [brand]);

  const items = useMemo<MasonryItem[]>(
    () =>
      brand.items.slice(0, count).map((item, i) => {
        const images = imagesOf(item);
        return {
          key: `${brand.slug}-${i}`,
          images,
          hidden: filter !== 'all' && catOf(item) !== filter,
          alt: `${brand.name} ${item.kind === 'carousel' ? 'carousel' : NAMES[images[0].type]}`,
        };
      }),
    [brand, count, filter],
  );

  // the lightbox walks every slide of every visible tile, in grid order
  const slides = useMemo(() => {
    const list: Array<Slide & { key: string }> = [];
    items.forEach((item) => {
      if (item.hidden) return;
      item.images.forEach((image, k) => {
        list.push({
          key: item.key,
          image,
          caption: item.images.length > 1 ? `${NAMES[image.type]} carousel` : NAMES[image.type],
          group: item.images.length > 1 ? { index: k, count: item.images.length } : undefined,
        });
      });
    });
    return list;
  }, [items]);

  // load the next batch when the end of the grid comes into view
  useEffect(() => {
    const el = moreRef.current;
    if (!el || count >= brand.items.length) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCount((c) => c + 20);
      },
      { root: scrollRoot, rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scrollRoot, count, brand.items.length]);

  const onOpen = useCallback((key: string) => setOpen(key), []);
  const closeLightbox = useCallback(() => setOpen(null), []);

  const types = cats.map(([, label]) => label).join(' ✦ ');
  const at = archive.brands.findIndex((b) => b.slug === brand.slug);
  const next = archive.brands[(at + 1) % archive.brands.length];
  const nextThumbs = next.items.slice(0, 3).map((it) => imagesOf(it)[0]);
  const start = open ? slides.findIndex((s) => s.key === open) : -1;

  return (
    <article className="ar-brand" style={{ '--c': brand.color } as CSSProperties}>
      <PageHead title={brand.name} meta={`${brand.count} CREATIVES ✦ ${types}`} color={brand.color}>
        <p className="ar-about">{brand.about}</p>
        {cats.length > 1 && (
          <div className="ar-chips" role="group" aria-label="Filter creatives">
            {(['all', ...cats.map(([c]) => c)] as Array<'all' | Cat>).map((c) => (
              <button key={c} type="button" className={`ar-chip${filter === c ? ' is-on' : ''}`} aria-pressed={filter === c} onClick={() => setFilter(c)}>
                {c === 'all' ? 'ALL' : CATS.find(([k]) => k === c)![1]}
                <i>{c === 'all' ? brand.items.length : brand.items.filter((it) => catOf(it) === c).length}</i>
              </button>
            ))}
          </div>
        )}
      </PageHead>

      <div className="ar-grid">
        <Masonry items={items} columnsFor={columnsFor} gap={14} sizes="(max-width: 820px) 46vw, (max-width: 1180px) 31vw, 340px" onOpen={onOpen} />
        <div ref={moreRef} aria-hidden="true" />
      </div>

      <footer className="ar-next-wrap">
        <button type="button" className="ar-next ar-sel ar-sel--hover" data-cursor="NEXT" style={{ '--c': next.color } as CSSProperties} onClick={() => nav.swap({ page: 'brand', slug: next.slug })}>
          <span className="ar-next-plate" aria-hidden="true" />
          <span className="ar-next-kicker">Next brand →</span>
          <span className="ar-next-name">{next.name}</span>
          <span className="ar-next-fan" aria-hidden="true">
            {nextThumbs.map((img, i) => (
              <img key={img.src} className={`ar-next-card ar-next-card--${i}`} src={smallest(img)} alt="" loading="lazy" decoding="async" draggable={false} />
            ))}
          </span>
          <SelMarks />
        </button>
      </footer>

      {open && start >= 0 && <Lightbox slides={slides} start={start} title={brand.name} onClose={closeLightbox} />}
    </article>
  );
}

export const brandCss = `
.ar-brand, .ar-format { --c: var(--signal); }
.ar-grid { width: min(1400px, 100%); margin: 0 auto; }

.ar-chips { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: clamp(1.25rem, 3vh, 2rem); }
.ar-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  padding: 0.55em 0.9em;
  font-family: var(--font-meta);
  font-size: clamp(0.62rem, 0.78vw, 0.74rem);
  letter-spacing: 0.08em;
  line-height: 1;
  color: var(--ink);
  background: var(--bone);
  border: 2px solid var(--ink);
  border-radius: var(--radius-sticker);
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 0.25s var(--ease-bounce), box-shadow 0.25s ease, background-color 0.25s ease, color 0.25s ease;
}
.ar-chip i { font-style: normal; opacity: 0.55; }
.ar-chip:nth-child(odd) { transform: rotate(-1.5deg); }
.ar-chip:nth-child(even) { transform: rotate(1.2deg); }
.ar-chip:hover, .ar-chip:focus-visible { transform: rotate(0deg) translate(-1px, -1px); box-shadow: 5px 5px 0 var(--ink); outline: none; }
.ar-chip.is-on { color: #fff; background: var(--c); transform: rotate(0deg); }
.ar-chip.is-on i { opacity: 0.8; }

/* "Next brand →" */
/* the padding leaves room for the three cards that peek over the block */
.ar-next-wrap { width: min(1400px, 100%); margin: clamp(1.5rem, 5vh, 3rem) auto 0; padding-top: calc(clamp(5.5rem, 12vw, 11rem) * 1.25 + 1.5rem); }
.ar-next {
  position: relative;
  display: block;
  width: 100%;
  padding: clamp(1rem, 3vh, 2rem) clamp(1rem, 2.5vw, 2.5rem) clamp(1.2rem, 3.5vh, 2.4rem);
  text-align: left;
  color: var(--ink);
  outline: none;
}
.ar-next-plate {
  position: absolute;
  inset: 0;
  background: var(--c);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.55s var(--ease-enter);
}
.ar-next:hover .ar-next-plate, .ar-next:focus-visible .ar-next-plate { transform: none; }
.ar-next-kicker, .ar-next-name { position: relative; display: block; transition: color 0.3s ease; }
.ar-next-kicker { font-family: var(--font-meta); font-size: clamp(0.66rem, 0.85vw, 0.8rem); letter-spacing: 0.12em; text-transform: uppercase; }
.ar-next-name {
  margin-top: 0.12em;
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 9vw, 9rem);
  line-height: 0.95;
  text-transform: uppercase;
  color: var(--signal);
}
.ar-next:hover .ar-next-kicker, .ar-next:hover .ar-next-name,
.ar-next:focus-visible .ar-next-kicker, .ar-next:focus-visible .ar-next-name { color: #fff; }
/* three of the next brand's creatives peek over the top edge and rise on hover */
.ar-next-fan {
  position: absolute;
  right: clamp(1.5rem, 9vw, 9rem);
  bottom: 100%;
  width: clamp(5.5rem, 12vw, 11rem);
  aspect-ratio: 4 / 5;
  clip-path: inset(-100% -100% 0 -100%);
  pointer-events: none;
}
.ar-next-card {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  border: 2px solid var(--ink);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.22);
  transform-origin: 50% 120%;
  transition: transform 0.6s var(--ease-enter);
}
.ar-next-card--0 { transform: translateY(42%) rotate(-10deg) translateX(-58%); }
.ar-next-card--1 { transform: translateY(34%) rotate(8deg) translateX(52%); }
.ar-next-card--2 { transform: translateY(30%); }
.ar-next:hover .ar-next-card--0, .ar-next:focus-visible .ar-next-card--0 { transform: translateY(12%) rotate(-14deg) translateX(-74%); }
.ar-next:hover .ar-next-card--1, .ar-next:focus-visible .ar-next-card--1 { transform: translateY(8%) rotate(12deg) translateX(70%); transition-delay: 0.05s; }
.ar-next:hover .ar-next-card--2, .ar-next:focus-visible .ar-next-card--2 { transform: translateY(0%); transition-delay: 0.1s; }
@media (max-width: 768px) {
  .ar-next-fan { right: 1.25rem; width: 4.6rem; }
}
`;
