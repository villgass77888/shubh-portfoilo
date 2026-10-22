/** Stop a video and free its decoder (the poster shows again). `restoreVideo` undoes it. */
export function releaseVideo(v: HTMLVideoElement) {
  v.pause();
  const src = v.getAttribute('src');
  if (!src) return;
  v.dataset.src = src;
  v.removeAttribute('src');
  v.load();
}

export function restoreVideo(v: HTMLVideoElement) {
  const src = v.dataset.src;
  if (!src || v.getAttribute('src')) return;
  v.setAttribute('src', src);
  v.load();
}
