/** iPhone, iPod or iPad (iPadOS reports itself as a Mac with touch). Every iOS browser is WebKit. */
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Safari on any device (desktop Safari included) */
export function isSafari() {
  if (typeof navigator === 'undefined') return false;
  return isIOS() || /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
}

/** A phone turned sideways: wide but very short */
export const LANDSCAPE_PHONE = '(orientation: landscape) and (max-height: 500px)';
