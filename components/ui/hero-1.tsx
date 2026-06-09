'use client'

import React, { useRef, useEffect } from 'react'

// ── FBM cloud shader (Matthias Hurrle @atzedent) ──────────────────────────────
const VERT_SRC = `#version 300 es
precision highp float;
in vec4 position;
void main() { gl_Position = position; }`

const FRAG_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2  resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T  time
#define R  resolution
#define MN min(R.x, R.y)

float rnd(vec2 p) {
  p = fract(p * vec2(12.9898, 78.233));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(rnd(i), rnd(i + vec2(1,0)), u.x),
             mix(rnd(i + vec2(0,1)), rnd(i + 1.), u.x), u.y);
}
float fbm(vec2 p) {
  float t = 0., a = 1.;
  mat2 m = mat2(1., -.5, .2, 1.2);
  for (int i = 0; i < 5; i++) { t += a * noise(p); p *= 2. * m; a *= .5; }
  return t;
}
float clouds(vec2 p) {
  float d = 1., t = 0.;
  for (float i = 0.; i < 3.; i++) {
    float a = d * fbm(i * 10. + p.x * .2 + .2 * (1. + i) * p.y + d + i * i + p);
    t = mix(t, d, a); d = a; p *= 2. / (i + 1.);
  }
  return t;
}
void main() {
  vec2 uv = (FC - .5 * R) / MN, st = uv * vec2(2., 1.);
  vec3 col = vec3(0.);
  float bg = clouds(vec2(st.x + T * .5, -st.y));
  uv *= 1. - .3 * (sin(T * .2) * .5 + .5);
  for (float i = 1.; i < 12.; i++) {
    uv += .1 * cos(i * vec2(.1 + .01 * i, .8) + i * i + T * .5 + .1 * uv.x);
    vec2 p = uv;
    float d = length(p);
    col += .00125 / d * (cos(sin(i) * vec3(1., 2., 3.)) + 1.);
    float b = noise(i + p + bg * 1.731);
    col += .002 * b / length(max(p, vec2(b * p.x * .02, p.y)));
    col = mix(col, vec3(bg * .25, bg * .137, bg * .05), d);
  }
  O = vec4(col, 1.);
}`

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type)
  if (!s) return null
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[Shader compile]', gl.getShaderInfoLog(s))
    return null
  }
  return s
}

interface HeroLandingProps {
  title: React.ReactNode
  description: string
  children?: React.ReactNode
  className?: string
}

export function HeroLanding({ title, description, children, className }: HeroLandingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2')
    if (!gl) {
      console.warn('[HeroLanding] WebGL2 not available — shader disabled')
      return
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER,   VERT_SRC)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
    if (!vs || !fs) return

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[Shader link]', gl.getProgramInfoLog(prog))
      return
    }

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes  = gl.getUniformLocation(prog, 'resolution')
    const uTime = gl.getUniformLocation(prog, 'time')

    let raf = 0
    const start = performance.now()

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width  = window.innerWidth  * dpr
      canvas!.height = window.innerHeight * dpr
      gl!.viewport(0, 0, canvas!.width, canvas!.height)
    }

    function draw(now: number) {
      gl!.useProgram(prog)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buf)
      gl!.uniform2f(uRes!, canvas!.width, canvas!.height)
      gl!.uniform1f(uTime!, (now - start) * 1e-3)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      if (buf) gl.deleteBuffer(buf)
    }
  }, [])

  return (
    <div
      className={`relative w-full overflow-hidden ${className ?? ''}`}
      style={{ minHeight: '100vh', background: '#09090b' }}
    >
      {/* Animated shader canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ filter: 'hue-rotate(210deg) saturate(1.1) brightness(0.45)' }}
        aria-hidden="true"
      />

      {/* Extra dark overlay for readability */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/50" aria-hidden="true" />

      {/* Bottom fade to zinc-950 */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]"
        style={{ height: '45%', background: 'linear-gradient(to bottom, transparent, #09090b)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-3xl">
          {title}
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg">
            {description}
          </p>
          {children && <div className="mt-10">{children}</div>}
        </div>
      </div>
    </div>
  )
}
