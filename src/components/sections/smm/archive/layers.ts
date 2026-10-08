import { createContext } from 'react';

/**
 * Where the archive's own modal layers (lightbox, book reader) are mounted: an element inside
 * the overlay but outside its scroll container, so they sit above the sticky bar and never
 * scroll with the page underneath.
 */
export const LayerRoot = createContext<HTMLElement | null>(null);
