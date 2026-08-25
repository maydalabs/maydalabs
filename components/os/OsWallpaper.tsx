"use client";

import { useEffect, useRef, useState } from "react";

// The desktop wallpaper: a dark sea of measurement points rolling like a
// slow oscilloscope, with a signal ripple crossing it every few seconds.
// Pure atmosphere — no content competes with the windows above it.
export function OsWallpaper() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let initialized = false;
    let visible = false;
    let destroyScene: (() => void) | undefined;

    const initialize = async () => {
      if (initialized) return;
      initialized = true;

      try {
        const THREE = await import("three");
        if (cancelled) return;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a09, 0.032);
        const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
        camera.position.set(0, 3.3, 9.5);

        const COLS = 132;
        const ROWS = 58;
        const WIDTH = 50;
        const DEPTH = 30;
        const count = COLS * ROWS;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const near = new THREE.Color(0xf7931a);
        const far = new THREE.Color(0x3d3c36);

        for (let row = 0; row < ROWS; row += 1) {
          for (let col = 0; col < COLS; col += 1) {
            const index = row * COLS + col;
            positions[index * 3] = (col / (COLS - 1) - 0.5) * WIDTH;
            positions[index * 3 + 1] = 0;
            positions[index * 3 + 2] = 3.5 - (row / (ROWS - 1)) * DEPTH;
            const depth = row / (ROWS - 1);
            const color = near.clone().lerp(far, Math.min(1, depth * 1.2));
            colors[index * 3] = color.r;
            colors[index * 3 + 1] = color.g;
            colors[index * 3 + 2] = color.b;
          }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const material = new THREE.PointsMaterial({
          size: 0.06,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        });
        scene.add(new THREE.Points(geometry, material));

        const pointerTarget = new THREE.Vector2();
        const onPointerMove = (event: PointerEvent) => {
          pointerTarget.x = event.clientX / window.innerWidth - 0.5;
          pointerTarget.y = event.clientY / window.innerHeight - 0.5;
        };
        window.addEventListener("pointermove", onPointerMove, { passive: true });

        // The desktop talks to the sea: windows splash where they act,
        // and typing in the shell stirs the whole surface.
        const splashes: Array<{ x: number; z: number; start: number }> = [];
        let excitement = 0;
        const onSeaPulse = (event: Event) => {
          const detail = (event as CustomEvent).detail ?? {};
          const vx = typeof detail.x === "number" ? Math.min(1, Math.max(0, detail.x)) : 0.5;
          const vy = typeof detail.y === "number" ? Math.min(1, Math.max(0, detail.y)) : 0.5;
          splashes.push({ x: (vx - 0.5) * WIDTH * 0.72, z: 3.5 - (1 - vy) * DEPTH * 0.85, start: -1 });
          if (splashes.length > 4) splashes.shift();
        };
        const onSeaExcite = () => {
          excitement = Math.min(1, excitement + 0.4);
        };
        window.addEventListener("os:sea-pulse", onSeaPulse);
        window.addEventListener("os:sea-excite", onSeaExcite);

        const resize = () => {
          const rect = root.getBoundingClientRect();
          const width = Math.max(rect.width, 1);
          const height = Math.max(rect.height, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        resize();

        const positionAttr = geometry.getAttribute("position") as import("three").BufferAttribute;
        let animationFrame = 0;
        let pulseStart = 2.5;

        const render = (timestamp: number) => {
          animationFrame = 0;
          if (cancelled || !visible) return;
          const t = timestamp * 0.001;

          const pulseAge = t - pulseStart;
          const pulsing = pulseAge > 0 && pulseAge < 5;
          const pulseRadius = pulseAge * 6.5;
          const pulseFade = Math.max(0, 1 - pulseAge / 5);

          excitement *= 0.986;
          const amp = 1 + excitement * 0.85;

          for (const splash of splashes) {
            if (splash.start < 0) splash.start = t;
          }
          const liveSplashes = splashes.filter((splash) => t - splash.start < 3.4);

          for (let index = 0; index < count; index += 1) {
            const x = positionAttr.getX(index);
            const z = positionAttr.getZ(index);
            let y =
              (Math.sin(x * 0.32 + t * 0.85) * 0.32 +
                Math.sin(z * 0.5 - t * 0.55) * 0.26 +
                Math.sin((x + z) * 0.17 + t * 0.32) * 0.42) * amp;
            if (pulsing) {
              const distance = Math.hypot(x, z - 3.5);
              const band = Math.abs(distance - pulseRadius);
              if (band < 1.7) {
                y += Math.cos((band / 1.7) * Math.PI * 0.5) * 0.85 * pulseFade;
              }
            }
            for (const splash of liveSplashes) {
              const age = t - splash.start;
              const radius = age * 5.2;
              const band = Math.abs(Math.hypot(x - splash.x, z - splash.z) - radius);
              if (band < 1.3) {
                y += Math.cos((band / 1.3) * Math.PI * 0.5) * 1.05 * Math.max(0, 1 - age / 3.4);
              }
            }
            positionAttr.setY(index, y);
          }
          if (pulseAge > 9.5) pulseStart = t;
          positionAttr.needsUpdate = true;

          camera.position.x += (pointerTarget.x * 1.6 - camera.position.x) * 0.03;
          camera.position.y += (3.3 - pointerTarget.y * 0.9 - camera.position.y) * 0.03;
          camera.lookAt(0, 0.35, -2);

          renderer.render(scene, camera);
          animationFrame = window.requestAnimationFrame(render);
        };

        const startRendering = () => {
          if (!animationFrame && visible) animationFrame = window.requestAnimationFrame(render);
        };

        root.addEventListener("wallpaper:visible", startRendering);
        setReady(true);
        startRendering();

        destroyScene = () => {
          resizeObserver.disconnect();
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("os:sea-pulse", onSeaPulse);
          window.removeEventListener("os:sea-excite", onSeaExcite);
          root.removeEventListener("wallpaper:visible", startRendering);
          if (animationFrame) window.cancelAnimationFrame(animationFrame);
          geometry.dispose();
          material.dispose();
          renderer.dispose();
        };
      } catch {
        // WebGL unavailable: the CSS gradient wallpaper stands alone.
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          void initialize();
          root.dispatchEvent(new Event("wallpaper:visible"));
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(root);

    return () => {
      cancelled = true;
      observer.disconnect();
      destroyScene?.();
    };
  }, []);

  return (
    <div ref={rootRef} className={`os-signal-sea ${ready ? "is-ready" : ""}`}>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
