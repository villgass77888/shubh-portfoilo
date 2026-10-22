import { useEffect, useRef, useState } from 'react';
import { streetwear, streetwearIntro } from '../../../data/streetwear';
import AlphaVideo, { alphaWebmSupported } from '../../global/AlphaVideo';
import type { AlphaVideoHandle } from '../../global/AlphaVideo';

/** webm: the VP9 alpha video (Chromium, Firefox) · canvas: the stacked MP4 drawn transparent (Safari / iOS) · type: no video at all */
type Mode = 'webm' | 'canvas' | 'type';

type Props = {
  reduced: boolean;
};

/**
 * Scene B — a full-screen beat between the title and the showroom: the transparent intro
 * video over the paper, looping for as long as it is on screen, or (when the video cannot be
 * used) the ten design names crossing the screen as outlined type. It scrolls with the page.
 */
export default function StreetwearIntro({ reduced }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const alphaRef = useRef<AlphaVideoHandle>(null);
  const [mode, setMode] = useState<Mode>('type');

  useEffect(() => {
    // the kinetic type is only for "no video": never for a browser without WebM alpha
    setMode(!streetwearIntro.available ? 'type' : alphaWebmSupported() ? 'webm' : 'canvas');
  }, []);

  // the chapter sits at the end of the page: its video is only fetched once the visitor is getting close
  const [near, setNear] = useState(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return setNear(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: '3000px 0px' },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // play while any of it is on screen, rest otherwise
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const io = new IntersectionObserver(([entry]) => {
      const video = mode === 'canvas' ? alphaRef.current : videoRef.current;
      root.classList.toggle('is-playing', entry.isIntersecting);
      if (!video) return;
      // a refused play() (Low Power Mode) keeps the transparent poster; the first touch retries
      if (entry.isIntersecting) video.play().catch(() => window.addEventListener('touchstart', () => video.play().catch(() => {}), { once: true, passive: true }));
      else video.pause();
    });
    io.observe(root);
    return () => io.disconnect();
  }, [mode, reduced]);

  const names = streetwear.map((d) => d.name.toUpperCase());

  return (
    <div ref={rootRef} className={`sw-intro${reduced ? '' : ' sw-intro--tuck'}`}>
      <div className="sw-intro-media">
        {mode === 'webm' ? (
          <video
            ref={videoRef}
            src={streetwearIntro.src}
            poster={streetwearIntro.poster}
            muted
            loop
            playsInline
            preload={near ? 'auto' : 'none'}
            aria-hidden="true"
          />
        ) : mode === 'canvas' ? (
          <AlphaVideo
            ref={alphaRef}
            src={streetwearIntro.src.replace(/\.webm$/, '')}
            poster={streetwearIntro.poster}
            loop
            preload={near ? 'auto' : 'none'}
            onError={() => setMode('type')}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="sw-intro-type" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className={`sw-intro-line${row % 2 ? ' is-rev' : ''}`}>
                <span>{[...names.slice(row * 2), ...names.slice(0, row * 2)].join(' ✦ ')} ✦ </span>
                <span>{[...names.slice(row * 2), ...names.slice(0, row * 2)].join(' ✦ ')} ✦ </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
