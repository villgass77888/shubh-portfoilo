import type { CSSProperties } from 'react';
import type { SmmEntry } from '../../../data/portfolio';
import { smmHeroRatio } from '../../../data/smmHero';

/** n × the scene's --u unit */
const u = (n: number) => `calc(${n} * var(--u))`;

const SCREEN_BG = '#17181a';
const UI_TEXT = '#f5f5f5';
const UI_DIM = 'rgba(245,245,245,0.55)';

const STOP_WORDS = new Set(['for', 'of', 'the', 'and', '&']);

/**
 * How a layer's images are fetched: 'lazy' (static list), 'eager' (the active brand and
 * its neighbours in the pinned scene) or 'hold' (not requested yet: no src at all).
 */
export type ImgLoad = 'lazy' | 'eager' | 'hold';

export function imgLoad(src: string, load: ImgLoad): { src: string | undefined; loading: 'lazy' | 'eager' } {
  return { src: load === 'hold' ? undefined : src, loading: load === 'eager' ? 'eager' : 'lazy' };
}

/** Card ratio (width / height) of a brand's hero posts */
export const smmRatio = (brand: SmmEntry): number => smmHeroRatio[brand.slug] ?? 0.8;

function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w && !STOP_WORDS.has(w.toLowerCase()));
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Dark or light text for a monogram sitting on the given hex colour */
function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#fff';
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#0D0D0D' : '#fff';
}

/** Both delivered avatars are white artwork, so they need a dark / brand circle behind them */
const AVATAR_BG: Record<string, string | undefined> = {
  senquira: '#15110d',
};

/**
 * The delivered avatars are wide lock-ups (about 4:1) which are unreadable inside a
 * ~27px circle. Like a real profile picture, only the mark is shown: the square emblem
 * for Udman Square and the initial letterform for Senquira.
 * `file` = natural size of the avatar file, `box` = the mark's bounds in it (px),
 * `fill` = share of the circle's height the mark takes.
 */
const AVATAR_MARK: Record<string, { file: [number, number]; box: [number, number, number, number]; fill: number } | undefined> = {
  'udman-square': { file: [487, 193], box: [33, 46, 94, 94], fill: 0.56 },
  senquira: { file: [1747, 382], box: [0, 0, 202, 333], fill: 0.62 },
};

export function SmmAvatar({ brand, size, className, load = 'lazy' }: { brand: SmmEntry; size: string; className?: string; load?: ImgLoad }) {
  const base: CSSProperties = {
    width: size,
    height: size,
    flex: 'none',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.18)',
  };

  if (brand.avatar) {
    const mark = AVATAR_MARK[brand.slug];
    if (mark) {
      const { file, box, fill } = mark;
      const [fw, fh] = file;
      const [x, y, w, h] = box;
      return (
        <span className={className} style={{ ...base, backgroundColor: AVATAR_BG[brand.slug] ?? brand.primary }}>
          <span style={{ position: 'relative', flex: 'none', height: `${fill * 100}%`, aspectRatio: `${w} / ${h}`, overflow: 'hidden' }}>
            <img
              {...imgLoad(brand.avatar, load)}
              alt=""
              decoding="async"
              style={{
                position: 'absolute',
                left: `${(-x / w) * 100}%`,
                top: `${(-y / h) * 100}%`,
                width: `${(fw / w) * 100}%`,
                height: `${(fh / h) * 100}%`,
                maxWidth: 'none',
              }}
            />
          </span>
        </span>
      );
    }
    return (
      <span className={className} style={{ ...base, backgroundColor: AVATAR_BG[brand.slug] ?? brand.primary }}>
        <img
          {...imgLoad(brand.avatar, load)}
          alt=""
          decoding="async"
          style={{ width: '76%', height: '76%', objectFit: 'contain' }}
        />
      </span>
    );
  }

  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        ...base,
        backgroundColor: brand.primary,
        color: readableOn(brand.primary),
        fontFamily: 'var(--font-heading)',
        fontWeight: 800,
        fontSize: `calc(${size} * 0.4)`,
        letterSpacing: '0.02em',
        lineHeight: 1,
      }}
    >
      {initials(brand.brand)}
    </span>
  );
}

const icon: CSSProperties = { width: u(1.7), height: u(1.7), flex: 'none' };

function ProfileRow({ brand, handle, height, pop, load }: { brand: SmmEntry; handle: string; height: number; pop?: boolean; load: ImgLoad }) {
  return (
    <div style={{ height: u(height), flex: 'none', display: 'flex', alignItems: 'flex-start', gap: u(0.7), padding: `${u(0.25)} ${u(1)} 0` }}>
      <SmmAvatar brand={brand} size={u(2.3)} className={pop ? 'smm-pop' : undefined} load={load} />
      <span
        className={pop ? 'smm-pop' : undefined}
        style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: u(0.92), lineHeight: u(2.3), color: UI_TEXT, transformOrigin: '0 50%' }}
      >
        {handle}
      </span>
      <span style={{ marginLeft: 'auto', color: UI_TEXT, fontSize: u(1.1), letterSpacing: '0.1em', lineHeight: u(2.3) }}>•••</span>
    </div>
  );
}

/**
 * Everything on the screen that belongs to one brand: "Posts" header, profile row, the post,
 * actions, caption + date and the next post peeking in. In the pinned scene every brand is
 * stacked here as a layer (.smm-screen) and GSAP swaps them.
 */
function SmmScreen({ brand, index, load }: { brand: SmmEntry; index: number; load: ImgLoad }) {
  const handle = brand.handle.replace(/^@/, '');
  const [line1, line2] = brand.caption.split('\n');
  const onScreen = brand.posts[1] ?? brand.posts[0];
  const next = brand.posts[2];

  return (
    <div className="smm-screen" data-i={index} style={{ '--ar': smmRatio(brand) } as CSSProperties}>
      {/* "Posts" header */}
      <div style={{ height: u(3.2), flex: 'none', display: 'grid', gridTemplateColumns: `${u(3)} 1fr ${u(3)}`, alignItems: 'center', padding: `0 ${u(0.6)}` }}>
        <svg viewBox="0 0 24 24" style={{ width: u(1.6), height: u(1.6), justifySelf: 'center' }} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 4l-8 8 8 8" />
        </svg>
        <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: u(0.98) }}>Posts</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: u(0.72), color: UI_DIM }}>{handle}</div>
        </div>
        <span />
      </div>

      {/* profile row */}
      <ProfileRow brand={brand} handle={handle} height={4.6} pop load={load} />

      {/* the post — the fan's post 2 sits exactly over this box */}
      {/* minHeight 0 + overflow hidden: a taller image (Senquira's 3:4) must not stretch the box */}
      <div style={{ width: '100%', aspectRatio: 'var(--ar)', flex: 'none', minHeight: 0, overflow: 'hidden', backgroundColor: '#222' }}>
        <img
          {...imgLoad(onScreen, load)}
          alt=""
          decoding="async"
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* actions */}
      <div style={{ height: u(4.6), flex: 'none', display: 'flex', alignItems: 'flex-end', gap: u(1), padding: `0 ${u(1)} ${u(0.45)}`, position: 'relative' }}>
        <svg viewBox="0 0 24 24" style={icon} fill="#ff3040">
          <path d="M12 21s-8-5.2-8-11.2A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8 3.2C20 15.8 12 21 12 21z" />
        </svg>
        <svg viewBox="0 0 24 24" style={icon} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
          <path d="M20.5 12a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.1-4.4A8.5 8.5 0 1 1 20.5 12z" />
        </svg>
        <svg viewBox="0 0 24 24" style={icon} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round">
          <path d="M21 3L10.5 13.5M21 3l-6.6 18-3.9-7.5L3 9.6z" />
        </svg>
        <span style={{ position: 'absolute', left: '50%', bottom: u(1.1), transform: 'translateX(-50%)', display: 'flex', gap: u(0.3) }}>
          {[0, 1, 2, 3].map((d) => (
            <span key={d} style={{ width: u(0.42), height: u(0.42), borderRadius: '50%', backgroundColor: d === 0 ? '#0095f6' : 'rgba(245,245,245,0.35)' }} />
          ))}
        </span>
        <svg viewBox="0 0 24 24" style={{ ...icon, marginLeft: 'auto' }} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
          <path d="M6 3.5h12v17l-6-4.6-6 4.6z" />
        </svg>
      </div>

      {/* caption + date */}
      <div style={{ flex: 'none', padding: `0 ${u(1)}` }}>
        <p className="smm-cap" style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: u(0.86), lineHeight: 1.36, color: UI_TEXT }}>
          <strong style={{ fontWeight: 700 }}>{handle}</strong> {line1}
          {line2 && (
            <>
              <br />
              <span style={{ color: '#a8c7fa' }}>{line2}</span>
            </>
          )}
        </p>
        <p className="smm-cap" style={{ margin: `${u(0.55)} 0 0`, fontFamily: 'var(--font-body)', fontSize: u(0.68), color: UI_DIM }}>
          {brand.date}
        </p>
      </div>

      {/* the next post peeking in (fills whatever height is left) */}
      {next && (
        <div style={{ flex: '1 1 0', minHeight: 0, marginTop: u(1), display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <ProfileRow brand={brand} handle={handle} height={3.4} load={load} />
          <img
            {...imgLoad(next, load)}
            alt=""
            decoding="async"
            style={{ display: 'block', width: '100%', flex: '1 1 0', minHeight: 0, objectFit: 'cover', objectPosition: '50% 0' }}
          />
        </div>
      )}
    </div>
  );
}

interface SmmPhoneProps {
  /** One brand (static list) or every brand stacked as swappable screen layers (pinned scene) */
  brands: SmmEntry[];
  /** Brand the accessible description is about */
  current: SmmEntry;
  /** Index of the first brand in the full list (keeps data-i unique per layer) */
  first?: number;
  load: (index: number) => ImgLoad;
}

/**
 * The phone: black bezel, dynamic island, 9:41 status bar and home indicator stay put;
 * the Instagram screen of each brand is a layer inside it.
 * Every size is in --u so it scales with the fan as one composition.
 */
export default function SmmPhone({ brands, current, first = 0, load }: SmmPhoneProps) {
  const [line1] = current.caption.split('\n');

  return (
    <div
      className="smm-phone"
      role="img"
      aria-label={`Phone showing an Instagram post by ${current.brand} (${current.handle}): ${line1}`}
    >
      {/* side buttons */}
      <span aria-hidden="true" style={{ position: 'absolute', left: u(-0.22), top: u(9), width: u(0.3), height: u(2.2), borderRadius: u(0.2), backgroundColor: '#1c1c1e' }} />
      <span aria-hidden="true" style={{ position: 'absolute', left: u(-0.22), top: u(13), width: u(0.3), height: u(4), borderRadius: u(0.2), backgroundColor: '#1c1c1e' }} />
      <span aria-hidden="true" style={{ position: 'absolute', right: u(-0.22), top: u(12), width: u(0.3), height: u(5.5), borderRadius: u(0.2), backgroundColor: '#1c1c1e' }} />

      {/* body */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          padding: u(0.7),
          borderRadius: u(3.6),
          backgroundColor: '#070708',
          boxShadow: `inset 0 0 0 ${u(0.14)} #3a3a3d, 0 ${u(1.4)} ${u(2.6)} rgba(0,0,0,0.28), 0 ${u(3.2)} ${u(6)} rgba(0,0,0,0.3)`,
        }}
      >
        {/* screen */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: u(2.9),
            overflow: 'hidden',
            backgroundColor: SCREEN_BG,
            color: UI_TEXT,
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
          }}
        >
          {/* dynamic island */}
          <span style={{ position: 'absolute', top: u(0.7), left: '50%', width: u(6.2), height: u(1.7), marginLeft: u(-3.1), borderRadius: u(1), backgroundColor: '#000', zIndex: 2 }} />

          {/* status bar */}
          <div style={{ height: u(3), flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${u(1.7)}` }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: u(0.95) }}>9:41</span>
            <svg viewBox="0 0 46 12" style={{ height: u(0.9), width: 'auto' }} fill="currentColor">
              <rect x="0" y="7" width="2.6" height="5" rx="0.8" />
              <rect x="4" y="5" width="2.6" height="7" rx="0.8" />
              <rect x="8" y="2.5" width="2.6" height="9.5" rx="0.8" />
              <rect x="12" y="0" width="2.6" height="12" rx="0.8" />
              <path d="M18 4.6a8 8 0 0 1 11 0l-1.4 1.5a6 6 0 0 0-8.2 0zM20.3 7a4.8 4.8 0 0 1 6.4 0l-1.4 1.5a2.8 2.8 0 0 0-3.6 0zM23.5 9.2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
              <rect x="32.5" y="0.5" width="11" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.5" />
              <rect x="34" y="2" width="8" height="8" rx="1.8" />
              <rect x="44.3" y="4" width="1.5" height="4" rx="0.7" opacity="0.5" />
            </svg>
          </div>

          {/* one layer per brand; only these change when the brand changes */}
          <div className="smm-screens">
            {brands.map((brand, i) => (
              <SmmScreen key={brand.slug} brand={brand} index={first + i} load={load(first + i)} />
            ))}
          </div>

          {/* home indicator */}
          <span style={{ position: 'absolute', left: '50%', bottom: u(0.5), width: u(7), height: u(0.28), marginLeft: u(-3.5), borderRadius: u(0.2), backgroundColor: 'rgba(255,255,255,0.75)', zIndex: 2 }} />
        </div>
      </div>
    </div>
  );
}
