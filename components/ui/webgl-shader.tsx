"use client";

import { useEffect, useRef } from "react";

// ── Shaders ───────────────────────────────────────────────────────────────────
const VERT = `
  attribute vec2 pos;
  void main() { gl_Position = vec4(pos, 0.0, 1.0); }
`;

// Plasma-wave shader — simple sin math, compiles on every WebGL implementation.
// Colors: near-black zinc base with flowing indigo → violet highlights.
const FRAG = `
  precision mediump float;
  uniform float time;
  uniform vec2  res;

  void main() {
    vec2 uv = gl_FragCoord.xy / res;
    float t = time * 0.22;

    float v1 = sin(uv.x * 7.0  + t);
    float v2 = sin(uv.y * 5.5  - t * 0.85);
    float v3 = sin((uv.x + uv.y) * 4.5 + t * 0.65);
    float v4 = sin(sqrt(
      (uv.x - 0.5) * (uv.x - 0.5) +
      (uv.y - 0.5) * (uv.y - 0.5)
    ) * 9.0 - t * 1.2);

    float f = (v1 + v2 + v3 + v4) * 0.25 * 0.5 + 0.5;

    vec3 dark   = vec3(0.035, 0.030, 0.043);   // zinc-950
    vec3 indigo = vec3(0.20,  0.16,  0.54);    // deep indigo
    vec3 violet = vec3(0.34,  0.20,  0.62);    // violet

    float w1 = smoothstep(0.22, 0.60, f);
    float w2 = smoothstep(0.52, 0.88, f);
    vec3 col = mix(mix(dark, indigo, w1), violet, w2);

    // vignette
    vec2  q   = uv - 0.5;
    float vig = 1.0 - dot(q, q) * 1.3;
    col *= max(vig, 0.25);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ── WebGL bootstrap ───────────────────────────────────────────────────────────
function makeShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function WebGLShader({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl =
      (canvas.getContext("webgl") ??
       canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    // Compile & link
    const prog = gl.createProgram()!;
    gl.attachShader(prog, makeShader(gl, gl.VERTEX_SHADER,   VERT)!);
    gl.attachShader(prog, makeShader(gl, gl.FRAGMENT_SHADER, FRAG)!);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[WebGLShader] link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "time");
    const uRes  = gl.getUniformLocation(prog, "res");

    // ── Resize — use offsetWidth so dims are correct even before paint ────────
    function resize() {
      const w = canvas!.offsetWidth  || 1;
      const h = canvas!.offsetHeight || 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width  = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    // Defer first resize to next frame so the element is laid out
    let raf: number;
    const start = performance.now();

    function draw() {
      gl!.uniform1f(uTime, (performance.now() - start) / 1000);
      gl!.uniform2f(uRes,  canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    }

    // ResizeObserver fires immediately with initial size
    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvas);

    // Start loop one frame after mount so canvas is painted
    raf = requestAnimationFrame(() => { resize(); draw(); });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`block h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
