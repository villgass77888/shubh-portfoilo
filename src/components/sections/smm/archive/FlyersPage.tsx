import { useCallback, useMemo, useState } from 'react';
import { archive } from '../../../../data/archive';
import { archiveContent } from '../../../../content/archive';
import { PageHead } from './bits';
import Masonry from './Masonry';
import type { MasonryItem } from './Masonry';
import Lightbox from './Lightbox';
import type { Slide } from './Lightbox';

const columnsFor = (w: number) => (w >= 700 ? 2 : 1);
const kindOf = (type: string) => (type === 'banner' ? 'BILLBOARD' : 'FLYER');

/**
 * Flyers and billboards: the brand-page grid at large-format size. Two columns,
 * wide pieces span both, and the lightbox zooms because flyers carry fine detail.
 */
export default function FlyersPage() {
  const flyers = archive.flyers;
  const [open, setOpen] = useState<string | null>(null);

  const items = useMemo<MasonryItem[]>(
    () =>
      flyers.map((f) => ({
        key: f.src,
        images: [f],
        // billboards and anything else clearly landscape take the full width
        span: f.w / f.h >= 1.4,
        label: `${kindOf(f.type)} ✦ ${f.title}`,
        alt: `${f.title} ${kindOf(f.type).toLowerCase()}`,
      })),
    [flyers],
  );
  const slides = useMemo<Slide[]>(() => flyers.map((f) => ({ image: f, caption: `${kindOf(f.type).toLowerCase()} ✦ ${f.title}` })), [flyers]);

  const onOpen = useCallback((key: string) => setOpen(key), []);
  const close = useCallback(() => setOpen(null), []);
  const start = open ? flyers.findIndex((f) => f.src === open) : -1;
  const billboards = flyers.filter((f) => f.type === 'banner').length;

  return (
    <article className="ar-format">
      <PageHead title="Flyers" meta={`${flyers.length} PIECES ✦ FLYERS${billboards ? ' ✦ BILLBOARDS' : ''}`}>
        <p className="ar-about">{archiveContent.flyers.intro}</p>
      </PageHead>
      <div className="ar-grid">
        <Masonry items={items} columnsFor={columnsFor} gap={24} sizes="(max-width: 700px) 94vw, (max-width: 1400px) 46vw, 690px" onOpen={onOpen} />
      </div>
      {open && start >= 0 && <Lightbox slides={slides} start={start} title="Flyers" onClose={close} zoom />}
    </article>
  );
}
