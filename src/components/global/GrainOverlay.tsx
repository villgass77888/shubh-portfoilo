import { useEffect, useRef, useState } from 'react';
import { isIOS } from '../../lib/device';

/** iOS: one small noise tile, repeated, jumping about on the compositor (no per-frame redraw) */
function StaticGrain() {
  const [tile, setTile] = useState('');
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    setTile(c.toDataURL('image/png'));
  }, []);
  if (!tile) return null;
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 'var(--z-grain)' as any, opacity: 0.07, mixBlendMode: 'overlay' }}>
      <style>{'@keyframes grainJump{0%{transform:translate(0,0)}25%{transform:translate(-53px,-97px)}50%{transform:translate(-121px,-31px)}75%{transform:translate(-17px,-139px)}}'}</style>
      <div style={{ position: 'absolute', inset: '-160px', backgroundImage: `url(${tile})`, animation: 'grainJump 0.33s steps(1) infinite' }} />
    </div>
  );
}

/**
 * Full-screen canvas noise overlay drawn at 12fps.
 * Sits above all content except the cursor.
 */
export default function GrainOverlay() {
  const [ios] = useState(isIOS);
  return ios ? <StaticGrain /> : <CanvasGrain />;
}

function CanvasGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = 0;
    const FPS = 12;
    const interval = 1000 / FPS;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawNoise = (time: number) => {
      animId = requestAnimationFrame(drawNoise);

      if (time - lastTime < interval) return;
      lastTime = time;

      const w = canvas.width;
      const h = canvas.height;
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    animId = requestAnimationFrame(drawNoise);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 'var(--z-grain)' as any,
        opacity: 0.07,
        mixBlendMode: 'overlay',
      }}
    />
  );
}
