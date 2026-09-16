"use client";

import { useEffect, useRef } from "react";

/* The ground the desk sits on.
 *
 * A single fullscreen fragment shader, no library. three.js exists for scenes
 * with geometry, cameras and lights; this has none of those, so it would be
 * 150KB to draw a rectangle.
 *
 * The real reason it is a shader rather than a CSS gradient is banding. Dark
 * gradients step visibly on 8-bit displays, and that stepping is much of why
 * a dark interface reads as cheap. A shader can dither below the quantisation
 * threshold, which a gradient cannot.
 *
 * It is also slow on purpose. Something that moves enough to notice while you
 * are reading is a thing you will want turned off by the end of the week.
 */

const VERT = `#version 300 es
void main() {
  // One oversized triangle rather than two triangles: no seam down the middle
  // and one fewer vertex to think about.
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2 uSize;
uniform float uTime;
uniform float uActivity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float field(vec2 p) {
  float v = 0.0;
  v += noise(p) * 0.55;
  v += noise(p * 2.03 + 11.0) * 0.28;
  v += noise(p * 4.11 + 23.0) * 0.17;
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uSize;
  float aspect = uSize.x / max(uSize.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);

  // Two slow drifts at different rates, so the surface never repeats visibly.
  float t = uTime * 0.012;
  float a = field(p * 1.4 + vec2(t, t * 0.6));
  float b = field(p * 0.9 - vec2(t * 0.7, t * 0.35));
  float mixed = mix(a, b, 0.45);

  vec3 base = vec3(0.043, 0.043, 0.051);
  vec3 cool = vec3(0.114, 0.125, 0.235);
  vec3 warm = vec3(0.160, 0.110, 0.090);

  // The light sits off the top-left corner, matching where every window's
  // shadow says it is.
  float lamp = smoothstep(1.35, 0.0, distance(p, vec2(0.16 * aspect, 1.02)));

  vec3 color = base;
  color += cool * (mixed * 0.16 + lamp * 0.10) * (0.75 + uActivity * 0.5);
  color += warm * pow(max(mixed - 0.62, 0.0), 2.0) * 0.30;

  // A vignette that reads as depth rather than as a filter.
  color *= 1.0 - 0.30 * pow(distance(uv, vec2(0.5)), 2.1);

  // Dither below the 8-bit step. Without this the whole thing bands into
  // visible rings and looks worse than a flat fill.
  float grain = (hash(gl_FragCoord.xy + fract(uTime) * 57.0) - 0.5) / 255.0;
  fragColor = vec4(color + grain, 1.0);
}`;

/* Failing silently is right for a person — the CSS background is already
 * behind this — and wrong for whoever is editing the shader, who otherwise
 * cannot tell a GLSL error from a machine without WebGL. */
function complain(what: string, detail: string | null) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[os-backdrop] ${what}`, detail ?? "");
  }
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    complain("shader did not compile", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function OsBackdrop({ activity = 0 }: { activity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activityRef = useRef(activity);
  activityRef.current = activity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* Anyone who has asked for less motion gets the flat token background
     * underneath instead. The canvas simply never paints. */
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (calm.matches) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    // No WebGL2 is not a failure worth handling twice: the CSS background is
    // already behind this and is what a person sees.
    if (!gl) {
      complain("no webgl2 context; the css background stands in", null);
      return;
    }

    const program = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!program || !vs || !fs) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      complain("program did not link", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const uSize = gl.getUniformLocation(program, "uSize");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uActivity = gl.getUniformLocation(program, "uActivity");

    /* Rendered at three quarters of a CSS pixel. It is an out-of-focus
     * surface behind everything; paying for retina here would cost four times
     * the fill rate to resolve detail that is not in the image. */
    const SCALE = 0.75;
    let width = 0;
    let height = 0;

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * SCALE));
      const h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
      if (w === width && h === height) return;
      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uSize, w, h);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let frame = 0;
    let running = true;
    const started = performance.now();

    const draw = (now: number) => {
      if (!running) return;
      gl.uniform1f(uTime, (now - started) / 1000);
      gl.uniform1f(uActivity, activityRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    /* A hidden tab painting a background is a laptop fan for nobody. */
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onLost = (event: Event) => {
      event.preventDefault();
      running = false;
      cancelAnimationFrame(frame);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={canvasRef} className="os-backdrop" aria-hidden="true" />;
}
