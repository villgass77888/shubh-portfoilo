import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import gsap from 'gsap';
import type { StreetwearDesign } from '../../../data/streetwear';
import { streetwearEffect } from '../../../data/streetwear';

export type ModelBox = { x: number; y: number; w: number; h: number };

/** Bottom-aligned "contain" box for a model inside the stage, in px. */
export function modelBox(stageW: number, stageH: number, aspect: number, compact: boolean): ModelBox {
  let h = compact ? stageH * 0.94 : Math.min(stageH * 0.84, window.innerWidth * 0.6);
  let w = h * aspect;
  const maxW = stageW * 0.88;
  if (w > maxW) {
    w = maxW;
    h = w / aspect;
  }
  const bottom = compact ? stageH * 0.02 : stageH * 0.05;
  // desktop: the model stands to the right of the stage so the info block has the left side to itself
  const x = compact ? (stageW - w) / 2 : Math.max((stageW - w) / 2, stageW * 0.94 - w);
  return { x, y: stageH - bottom - h, w, h };
}

export type ModelCanvasHandle = {
  /** True when the client point is over an opaque pixel of the current model. */
  hitTest: (clientX: number, clientY: number) => boolean;
};

type Props = {
  designs: StreetwearDesign[];
  index: number;
  compact: boolean;
  reduced: boolean;
};

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Horizontal motion-blur with ghost echoes: the figure smears sideways into blurred
// copies, the old model cross-dissolves into the new one inside the smear, then it resolves.
const FRAG = (taps: number) => `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFrom, uTo;
uniform vec4 uBoxFrom, uBoxTo;
uniform float uP, uSpread, uGhosts, uGrain, uSeed, uFromFlip;

vec4 model(sampler2D t, vec4 b, vec2 uv, float flip) {
  vec2 q = (uv - b.xy) / b.zw;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) return vec4(0.0);
  if (flip > 0.5) q.y = 1.0 - q.y;
  return texture2D(t, q);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  float bell = sin(3.14159265 * uP);
  float k = smoothstep(0.3, 0.7, uP);
  float spread = uSpread * bell;

  vec4 sharp = mix(model(uFrom, uBoxFrom, vUv, uFromFlip), model(uTo, uBoxTo, vUv, 0.0), k);

  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  for (int i = 0; i < ${taps}; i++) {
    float f = (float(i) + 0.5) / ${taps}.0 * 2.0 - 1.0;
    float comb = pow(abs(cos(f * 3.14159265 * uGhosts)), 8.0);
    float w = exp(-f * f * 2.2) * (0.22 + 0.78 * comb);
    vec2 uv = vUv + vec2(f * spread, 0.0);
    acc += mix(model(uFrom, uBoxFrom, uv, uFromFlip), model(uTo, uBoxTo, uv, 0.0), k) * w;
    wsum += w;
  }
  vec4 blurred = acc / wsum;

  // the centre figure stays readable on top of its own smear, like the reference frame
  float keep = 1.0 - bell * 0.5;
  vec4 over = sharp * keep + blurred * (1.0 - keep * sharp.a);
  vec4 col = mix(sharp, over, smoothstep(0.0, 0.12, bell));

  float n = hash(gl_FragCoord.xy + uSeed) - 0.5;
  col.rgb += n * uGrain * bell * col.a;
  // the smear dies away before the canvas edge instead of being cut by it
  float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
  col *= mix(1.0, edge, smoothstep(0.0, 0.2, bell));
  gl_FragColor = col;
}`;

/**
 * The model, drawn in WebGL so a design change can play the blurred ghost transition.
 * Renders only while a transition runs. Falls back to stacked images without WebGL
 * or with reduced motion.
 */
const ModelCanvas = forwardRef<ModelCanvasHandle, Props>(function ModelCanvas({ designs, index, compact, reduced }, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(reduced);
  const [fallbackBox, setFallbackBox] = useState<ModelBox | null>(null);

  const indexRef = useRef(index);
  const masks = useRef<(ImageData | null)[]>([]);
  const api = useRef<{ select: (i: number) => void } | null>(null);

  useImperativeHandle(ref, () => ({
    hitTest(clientX, clientY) {
      const wrap = wrapRef.current;
      const design = designs[indexRef.current];
      const mask = masks.current[indexRef.current];
      if (!wrap || !design) return false;
      const r = wrap.getBoundingClientRect();
      const b = modelBox(r.width, r.height, design.modelAspect, compact);
      const u = (clientX - r.left - b.x) / b.w;
      const v = (clientY - r.top - b.y) / b.h;
      if (u < 0 || u > 1 || v < 0 || v > 1) return false;
      if (!mask) return true;
      const px = Math.min(mask.width - 1, Math.floor(u * mask.width));
      const py = Math.min(mask.height - 1, Math.floor(v * mask.height));
      return mask.data[(py * mask.width + px) * 4 + 3] > 20;
    },
  }));

  // Alpha masks for silhouette hit-testing (also used by the fallback path)
  useEffect(() => {
    let cancelled = false;
    designs.forEach((d, i) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        const c = document.createElement('canvas');
        c.width = 160;
        c.height = Math.round(160 / d.modelAspect);
        const cx = c.getContext('2d', { willReadFrequently: true });
        if (!cx) return;
        cx.drawImage(img, 0, 0, c.width, c.height);
        try {
          masks.current[i] = cx.getImageData(0, 0, c.width, c.height);
        } catch {
          masks.current[i] = null;
        }
      };
      img.src = d.model;
    });
    return () => {
      cancelled = true;
    };
  }, [designs]);

  // WebGL layer
  useEffect(() => {
    if (fallback) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) {
      setFallback(true);
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG(compact ? 24 : 36)));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFallback(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uni = {
      from: U('uFrom'), to: U('uTo'), boxFrom: U('uBoxFrom'), boxTo: U('uBoxTo'),
      p: U('uP'), spread: U('uSpread'), ghosts: U('uGhosts'), grain: U('uGrain'), seed: U('uSeed'), flip: U('uFromFlip'),
    };

    const makeTex = () => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };

    const textures: (WebGLTexture | null)[] = designs.map(() => null);
    const waiting = new Map<number, (() => void)[]>();
    const load = (i: number) => {
      if (textures[i] || waiting.has(i)) return;
      waiting.set(i, []);
      const img = new Image();
      img.onload = () => {
        const t = makeTex();
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        textures[i] = t;
        const cbs = waiting.get(i) ?? [];
        waiting.delete(i);
        cbs.forEach((cb) => cb());
      };
      img.src = designs[i].model;
    };
    const whenLoaded = (i: number, cb: () => void) => {
      if (textures[i]) cb();
      else {
        load(i);
        waiting.get(i)?.push(cb);
      }
    };

    // Two framebuffers: an interrupted transition is frozen into one and becomes the new "from"
    const fbos = [0, 1].map(() => ({ fb: gl.createFramebuffer()!, tex: makeTex() }));
    let fboIdx = 0;
    const empty = makeTex();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));

    const state = {
      p: 1,
      seed: 0,
      from: -1 as number, // design index, or -1 = frozen frame / nothing
      to: index,
      frozen: null as WebGLTexture | null,
      w: 1,
      h: 1,
    };
    let tween: gsap.core.Tween | null = null;

    const box = (i: number): [number, number, number, number] => {
      const b = modelBox(wrap.clientWidth, wrap.clientHeight, designs[i].modelAspect, compact);
      return [b.x / wrap.clientWidth, b.y / wrap.clientHeight, b.w / wrap.clientWidth, b.h / wrap.clientHeight];
    };

    const draw = (target: WebGLFramebuffer | null) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.viewport(0, 0, state.w, state.h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const fromTex = state.frozen ?? (state.from >= 0 ? textures[state.from] : null) ?? empty;
      const toTex = textures[state.to] ?? empty;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fromTex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, toTex);
      gl.uniform1i(uni.from, 0);
      gl.uniform1i(uni.to, 1);
      gl.uniform4fv(uni.boxFrom, state.frozen ? [0, 0, 1, 1] : state.from >= 0 ? box(state.from) : [0, 0, 1, 1]);
      gl.uniform4fv(uni.boxTo, box(state.to));
      gl.uniform1f(uni.flip, state.frozen ? 1 : 0);
      gl.uniform1f(uni.p, state.p);
      gl.uniform1f(uni.spread, streetwearEffect.spread);
      gl.uniform1f(uni.ghosts, streetwearEffect.ghosts);
      gl.uniform1f(uni.grain, streetwearEffect.grain);
      gl.uniform1f(uni.seed, state.seed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const render = () => draw(null);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
      const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
      const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
      if (w === state.w && h === state.h) return;
      state.w = canvas.width = w;
      state.h = canvas.height = h;
      fbos.forEach((f) => {
        gl.bindTexture(gl.TEXTURE_2D, f.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, f.fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, f.tex, 0);
      });
      // a frozen frame no longer matches the new size: finish on the target
      if (state.frozen) {
        tween?.kill();
        state.frozen = null;
        state.from = -1;
        state.p = 1;
      }
      render();
    };

    const select = (i: number) => {
      if (i === state.to && state.p === 1) return;
      whenLoaded(i, () => {
        if (indexRef.current !== i) return; // a later click won
        if (state.p < 1) {
          // freeze the frame on screen and continue from it — no jump
          fboIdx = 1 - fboIdx;
          draw(fbos[fboIdx].fb);
          state.frozen = fbos[fboIdx].tex;
          state.from = -1;
        } else {
          state.frozen = null;
          state.from = state.to;
        }
        state.to = i;
        state.p = 0;
        state.seed = (state.seed + 17.31) % 1000;
        tween?.kill();
        tween = gsap.to(state, {
          p: 1,
          duration: streetwearEffect.duration,
          ease: 'power2.inOut',
          onUpdate: render,
          onComplete: () => {
            state.frozen = null;
            state.from = -1;
            render();
          },
        });
      });
    };
    api.current = { select };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // first paint, then warm the rest while idle
    whenLoaded(state.to, render);
    const idle = window.setTimeout(() => designs.forEach((_, i) => load(i)), 1200);

    const onLost = (e: Event) => {
      e.preventDefault();
      setFallback(true);
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      window.clearTimeout(idle);
      canvas.removeEventListener('webglcontextlost', onLost);
      ro.disconnect();
      tween?.kill();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallback, compact, designs]);

  useEffect(() => {
    indexRef.current = index;
    api.current?.select(index);
  }, [index]);

  // Fallback: stacked images with a plain crossfade
  useEffect(() => {
    if (!fallback) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const update = () => setFallbackBox(modelBox(wrap.clientWidth, wrap.clientHeight, designs[index].modelAspect, compact));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [fallback, index, compact, designs]);

  return (
    <div ref={wrapRef} className="sw-model-canvas" aria-hidden="true">
      {fallback ? (
        fallbackBox &&
        designs.map((d, i) => (
          <img
            key={d.id}
            src={d.model}
            alt=""
            loading={i === index ? 'eager' : 'lazy'}
            draggable={false}
            style={{
              position: 'absolute',
              left: fallbackBox.x,
              top: fallbackBox.y,
              width: fallbackBox.w,
              height: fallbackBox.h,
              objectFit: 'contain',
              objectPosition: 'bottom',
              opacity: i === index ? 1 : 0,
              transition: 'opacity 0.25s ease',
            }}
          />
        ))
      ) : (
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      )}
    </div>
  );
});

export default ModelCanvas;
