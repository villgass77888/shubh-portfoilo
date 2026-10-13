import { useEffect, useRef, useState } from 'react';
import { streetwear, streetwearIntro } from '../../../data/streetwear';

/** VP9 WebM with alpha plays transparently in Chromium and Firefox, not in Safari / iOS. */
function canPlayAlphaWebm() {
  const ua = navigator.userAgent;
  const safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua) || /iPad|iPhone|iPod/.test(ua);
  if (safari) return false;
  return document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '';
}

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
  const [useVideo, setUseVideo] = useState(false);

  useEffect(() => {
    setUseVideo(streetwearIntro.available && canPlayAlphaWebm());
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
      const video = videoRef.current;
      root.classList.toggle('is-playing', entry.isIntersecting);
      if (!video) return;
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    io.observe(root);
    return () => io.disconnect();
  }, [useVideo, reduced]);

  const names = streetwear.map((d) => d.name.toUpperCase());

  return (
    <div ref={rootRef} className={`sw-intro${reduced ? '' : ' sw-intro--tuck'}`}>
      <div className="sw-intro-media">
        {useVideo ? (
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
