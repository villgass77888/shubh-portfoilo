/* page-flip (StPageFlip) ships no type definitions; this covers the part the book reader uses. */
declare module 'page-flip/dist/js/page-flip.module.js' {
  export type FlipCorner = 'top' | 'bottom';

  export interface PageFlipSettings {
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    startPage?: number;
    showCover?: boolean;
    usePortrait?: boolean;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    flippingTime?: number;
    autoSize?: boolean;
    startZIndex?: number;
    useMouseEvents?: boolean;
    mobileScrollSupport?: boolean;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: PageFlipSettings);
    loadFromHTML(items: HTMLElement[] | NodeListOf<HTMLElement>): void;
    on(event: 'flip' | 'changeOrientation' | 'changeState' | 'init' | 'update', callback: (e: { data: number | string }) => void): PageFlip;
    flipNext(corner?: FlipCorner): void;
    flipPrev(corner?: FlipCorner): void;
    flip(page: number, corner?: FlipCorner): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): 'portrait' | 'landscape';
    getState(): string;
    update(): void;
    destroy(): void;
  }
}
