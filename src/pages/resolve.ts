import type { ComponentType } from 'react';
import { notFound, pageFor } from '../content/seo';
import type { PageMeta } from '../content/seo';

const ARCHIVE: PageMeta['kind'][] = ['archive', 'archive-brand', 'flyers', 'emailers', 'brochures', 'brochure'];

/** The page behind a path (the 404 page when there is none) and the chunk that renders it */
export function resolve(path: string): { meta: PageMeta; load: () => Promise<{ default: ComponentType<{ meta: PageMeta }> }> } {
  const meta = pageFor(path) ?? notFound;
  if (meta.kind === 'contact') return { meta, load: () => import('./ContactPage') };
  return { meta, load: ARCHIVE.includes(meta.kind) ? () => import('./ArchivePages') : () => import('./Pages') };
}
