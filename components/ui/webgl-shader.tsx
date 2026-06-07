"use client";

import { useEffect, useRef } from "react";

const VERT = `
  attribute vec4 a_pos;
  void main() { gl_Position = a_pos; }
`;

// Domain-warped FBM noise — dark zinc base with indigo/violet/rose accents
const FRAG = `
  precision mediump float;
  uniform float u_t;
  uniform vec2  u_res;

  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),           hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.1 + vec2(3.7, 1.5);
      a *= 0.5;
    }
    return v;
  }
  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float t  = u_t * 0.09;
    vec2 q = vec2(fbm(uv + t),               fbm(uv + vec2(5.2, 1.3) + t * 0.7));
    vec2 r = vec2(fbm(uv + 3.5 * q + vec2(1.7, 9.2) + t * 0.3),
                  fbm(uv + 3.5 * q + vec2(8.3, 2.8) - t * 0.2));
    float f = fbm(uv + 3.5 * r);

    vec3 base   = vec3(0.035, 0.035, 0.043);   // zinc-950
    vec3 indigo = vec3(0.388, 0.400, 0.945);   // #6366F1
    vec3 violet = vec3(0.545, 0.361, 0.965);   // #8B5CF6
    vec3 rose   = vec3(0.996, 0.545, 0.733);   // #FE8BBB

    vec3 col = mix(base,   indigo, clamp(f * f * 2.5,        0.0, 0.55));
    col       = mix(col,   violet, clamp((f - 0.3) * 2.0,    0.0, 0.35));
    col       = mix(col,   rose,   clamp((f - 0.62) * 3.0,   0.0, 0.15));

    vec2 vig = uv * (1.0 - uv.yx);
    col *= pow(max(vig.x * vig.y * 12.0, 0.001), 0.25) * 0.65 + 0.42;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export function WebGLShader({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT)!);
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG)!);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uT   = gl.getUniformLocation(prog, "u_t");
    const uRes = gl.getUniformLocation(prog, "u_res");

    function resize() {
      const { width, height } = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas!.width  = width  * dpr;
      canvas!.height = height * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const start = performance.now();
    let raf: number;
    function draw() {
      gl!.uniform1f(uT,  (performance.now() - start) / 1000);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
