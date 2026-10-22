import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { isSafari } from '../../lib/device';

export type AlphaVideoHandle = {
  play: () => Promise<void>;
  pause: () => void;
  seek: (seconds: number) => void;
  /** Runs `cb` once the next frame of the video has actually been painted */
  whenPainted: (cb: () => void) => void;
  readonly currentTime: number;
  readonly duration: number;
};

type Props = {
  /** Base path without extension: `<src>.webm` (VP9 + alpha) and `<src>-stacked.mp4` (colour left, alpha matte right) */
  src: string;
  poster?: string;
  fit?: 'contain' | 'cover';
  muted?: boolean;
  playsInline?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  playbackRate?: number;
  preload?: 'none' | 'metadata' | 'auto';
  onEnded?: () => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * VP9 WebM with alpha plays transparently in Chromium and Firefox. Safari (and so every iOS
 * browser) says it can play the WebM but drops the alpha, so it never gets it.
 */
export function alphaWebmSupported() {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return true;
  if (isSafari()) return false;
  return document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '';
}

type FrameVideo = HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };

const VERT = 'attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; v.y = 1.0 - v.y; gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG =
  'precision mediump float; varying vec2 v; uniform sampler2D t; void main(){ vec3 c = texture2D(t, vec2(v.x * 0.5, v.y)).rgb; float a = texture2D(t, vec2(0.5 + v.x * 0.5, v.y)).r; gl_FragColor = vec4(c * a, a); }';

/**
 * A video with a transparent background, the same way everywhere:
 * the VP9 alpha WebM natively where it works, and on Safari / iOS the stacked-alpha MP4
 * drawn to a canvas by a tiny shader (left half = colour, right half = alpha).
 */
const AlphaVideo = forwardRef<AlphaVideoHandle, Props>(function AlphaVideo(
  { src, poster, fit = 'contain', muted = true, playsInline = true, autoplay = false, loop = false, playbackRate = 1, preload = 'metadata', onEnded, className, style },
  ref,
) {
  const videoRef = useRef<FrameVideo>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const painted = useRef<Array<() => void>>([]);
  const [native] = useState(alphaWebmSupported);
  // canvas path: the (transparent) poster shows until the first frame is drawn
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultPlaybackRate = playbackRate;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  // Safari / iOS: draw the stacked video to the canvas, frame by frame
  useEffect(() => {
    if (native) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { premultipliedAlpha: true, alpha: true });
    if (!video || !canvas || !gl) return;

    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let raf = 0;
    let alive = true;
    const draw = () => {
      if (!alive || video.readyState < 2 || !video.videoWidth) return;
      const w = video.videoWidth / 2;
      if (canvas.width !== w || canvas.height !== video.videoHeight) {
        canvas.width = w;
        canvas.height = video.videoHeight;
        gl.viewport(0, 0, w, video.videoHeight);
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      setDrawn(true);
      painted.current.splice(0).forEach((cb) => cb());
    };
    const loop = () => {
      draw();
      if (!alive || video.paused || video.ended) return;
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(loop);
      else raf = requestAnimationFrame(loop);
    };
    video.addEventListener('play', loop);
    video.addEventListener('seeked', draw);
    video.addEventListener('loadeddata', draw);
    video.addEventListener('ended', draw);
    // autoplay blocked (Low Power Mode): keep the poster and start on the first touch
    const kick = () => video.autoplay && video.paused && video.play().catch(() => {});
    window.addEventListener('touchstart', kick, { once: true, passive: true });
    // a looping autoplay video only decodes while it is within a screen of the viewport
    const io =
      video.autoplay && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause()), { rootMargin: '100% 0px' })
        : null;
    io?.observe(canvas);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('touchstart', kick);
      io?.disconnect();
      // free the GPU memory now rather than when the garbage collector gets to it
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      video.removeEventListener('play', loop);
      video.removeEventListener('seeked', draw);
      video.removeEventListener('loadeddata', draw);
      video.removeEventListener('ended', draw);
    };
  }, [native]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        const video = videoRef.current;
        if (!video) return Promise.resolve();
        video.playbackRate = video.defaultPlaybackRate;
        return video.play();
      },
      pause: () => videoRef.current?.pause(),
      seek: (seconds) => {
        if (videoRef.current) videoRef.current.currentTime = seconds;
      },
      whenPainted: (cb) => {
        const video = videoRef.current;
        if (!video) return cb();
        if (!native) painted.current.push(cb);
        else if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(cb);
        else video.addEventListener('playing', () => requestAnimationFrame(cb), { once: true });
      },
      get currentTime() {
        return videoRef.current?.currentTime ?? 0;
      },
      get duration() {
        return videoRef.current?.duration ?? 0;
      },
    }),
    [native],
  );

  const fill: CSSProperties = { display: 'block', width: '100%', height: '100%', objectFit: fit };
  return (
    <span className={className} style={{ display: 'block', ...(poster && !native ? { position: 'relative' as const } : {}), ...style }} aria-hidden="true">
      <video
        ref={videoRef}
        src={native ? `${src}.webm` : `${src}-stacked.mp4`}
        poster={native ? poster : undefined}
        muted={muted}
        playsInline={playsInline}
        autoPlay={autoplay}
        loop={loop}
        preload={preload}
        onEnded={onEnded}
        style={native ? fill : { position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      {!native && poster && !drawn && <img src={poster} alt="" style={{ ...fill, position: 'absolute', inset: 0 }} />}
      {!native && <canvas ref={canvasRef} style={fill} />}
    </span>
  );
});

export default AlphaVideo;
