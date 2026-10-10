import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { PackProject } from '../../../data/packaging';
import { Chars } from '../smm/archive/marks';

type Props = {
  project: PackProject;
  kicker: string;
  /** How many steps are lit (the rest are dimmed). Default: all of them */
  active?: number;
  /** Plays the entrance (kicker, title, hairlines, steps, swatches) */
  entered: boolean;
  className?: string;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * The editorial info column: kicker, Anton title, numbered steps split by hairlines,
 * swatches (hover or click copies the hex) and a meta line. Shared by the featured scene
 * and the full-screen viewer.
 */
export default function PackInfo({ project, kicker, active, entered, className = '' }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef(0);
  const lit = active ?? project.steps.length;

  const copy = (hex: string) => {
    const done = () => {
      setCopied(hex);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), 1400);
    };
    try {
      navigator.clipboard?.writeText(hex).then(done, () => {});
    } catch {
      /* clipboard not available: nothing to confirm */
    }
  };

  return (
    <div className={`pki${entered ? ' is-in' : ''}${className ? ` ${className}` : ''}`}>
      <p className="pki-kicker">{kicker}</p>
      <h3 className="pki-title" aria-label={project.name}>
        <Chars text={project.name} />
      </h3>

      <ol className="pki-steps">
        {project.steps.map((step, i) => (
          <li key={step.label} className={`pki-step${i < lit ? ' is-on' : ''}`} style={{ '--i': i } as CSSProperties}>
            <span className="pki-num">{pad2(i + 1)}</span>
            <span className="pki-body">
              <span className="pki-label">{step.label}</span>
              <span className="pki-text">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="pki-swatches">
        {project.swatches.map((hex, i) => (
          <button
            key={hex}
            type="button"
            className="pki-sw"
            style={{ '--i': i } as CSSProperties}
            aria-label={`Copy ${hex}`}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') copy(hex);
            }}
            onClick={() => copy(hex)}
          >
            <i style={{ background: hex }} />
            {hex}
            {copied === hex && <b className="pki-copied">COPIED ✦</b>}
          </button>
        ))}
      </div>

      <p className="pki-meta">{project.meta}</p>
    </div>
  );
}
