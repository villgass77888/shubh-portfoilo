import type { CSSProperties, Ref, SyntheticEvent } from 'react';
import type { WebsiteEntry } from '../../../data/portfolio';

/** Native ratio of the screen recordings (1900 x 905). */
export const RECORDING_RATIO = '1900 / 905';

interface BrowserFrameProps {
  site: WebsiteEntry;
  /** Which source the frame plays: light card derivative or the full recording. */
  source: 'card' | 'full';
  videoRef?: Ref<HTMLVideoElement>;
  /** CSS length for the chrome bar height. */
  barHeight?: string;
  preload?: 'none' | 'metadata';
  style?: CSSProperties;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (e: SyntheticEvent<HTMLVideoElement>) => void;
}

const DOTS = ['#ff5f56', '#ffbd2e', '#27c93f'];

/**
 * A website recording inside a slim browser-chrome frame.
 * The poster shows until the video is told to play; nothing is ever layered over the video.
 */
export default function BrowserFrame({
  site,
  source,
  videoRef,
  barHeight = '1.6em',
  preload = 'none',
  style,
  onPlay,
  onPause,
  onTimeUpdate,
}: BrowserFrameProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#161616',
        ...style,
      }}
    >
      {/* Browser chrome */}
      <div
        aria-hidden="true"
        style={{
          height: barHeight,
          backgroundColor: '#232323',
          display: 'flex',
          alignItems: 'center',
          padding: `0 calc(${barHeight} * 0.45)`,
          gap: `calc(${barHeight} * 0.22)`,
        }}
      >
        {DOTS.map((c) => (
          <span
            key={c}
            style={{
              width: `calc(${barHeight} * 0.3)`,
              height: `calc(${barHeight} * 0.3)`,
              borderRadius: '50%',
              backgroundColor: c,
              flex: 'none',
            }}
          />
        ))}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            height: `calc(${barHeight} * 0.58)`,
            marginLeft: `calc(${barHeight} * 0.4)`,
            padding: `0 calc(${barHeight} * 0.4)`,
            borderRadius: 999,
            backgroundColor: '#111',
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'var(--font-meta)',
            fontSize: `calc(${barHeight} * 0.34)`,
            letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.55)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {site.name}
        </span>
      </div>

      {/* Recording */}
      <video
        ref={videoRef}
        src={source === 'card' ? site.cardVideo : site.video}
        poster={site.poster}
        muted
        loop
        playsInline
        preload={preload}
        disablePictureInPicture
        aria-label={`Screen recording of the ${site.name} website`}
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTimeUpdate}
        style={{
          display: 'block',
          width: '100%',
          aspectRatio: RECORDING_RATIO,
          objectFit: 'cover',
          objectPosition: 'top center',
          backgroundColor: '#161616',
        }}
      />
    </div>
  );
}
