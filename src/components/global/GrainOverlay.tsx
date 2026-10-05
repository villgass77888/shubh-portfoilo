import { useEffect, useRef } from 'react';

/**
 * Full-screen canvas noise overlay drawn at 12fps.
 * Sits above all content except the cursor.
 */
export default function GrainOverlay() {
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
