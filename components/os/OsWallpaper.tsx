"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_WALLPAPER, WALLPAPERS, type SceneHandle } from "@/components/os/wallpaperScenes";

const STORAGE_KEY = "ml_wallpaper";

export function resolveWallpaperId(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const id = candidate.toLowerCase().trim();
  if (id in WALLPAPERS) return id;
  const index = Number(id);
  const keys = Object.keys(WALLPAPERS);
  if (Number.isInteger(index) && index >= 1 && index <= keys.length) return keys[index - 1];
  return null;
}

// The wallpaper engine: hosts one of the ten registered scenes, drives
// it at ~30fps, forwards the OS event bus, and hot-swaps scenes when
// `wallpaper <id>` is run in the shell. Choice persists per browser;
// ?wp=<id> deep-links a wallpaper.
export function OsWallpaper({ mempoolCount = null }: { mempoolCount?: number | null }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mempoolRef = useRef<number | null>(mempoolCount);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    mempoolRef.current = mempoolCount;
  }, [mempoolCount]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0a09, 20, 60);
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
        camera.position.set(0, 0, 26);

        const world = new THREE.Group();
        scene.add(world);

        const context = { three: THREE, world, mempool: () => mempoolRef.current };
        let handle: SceneHandle | null = null;
        let started = performance.now();

        const mount = (id: string) => {
          handle?.dispose();
          handle = WALLPAPERS[id in WALLPAPERS ? id : DEFAULT_WALLPAPER].make(context);
          started = performance.now();
          if (reducedMotion) {
            handle.update(0.001, 0.001);
            renderer.render(scene, camera);
          }
        };

        let query: string | null = null;
        try {
          query = new URLSearchParams(window.location.search).get("wp");
        } catch {
          query = null;
        }
        let stored: string | null = null;
        try {
          stored = window.localStorage.getItem(STORAGE_KEY);
        } catch {
          stored = null;
        }
        mount(resolveWallpaperId(query) ?? resolveWallpaperId(stored) ?? DEFAULT_WALLPAPER);

        // ── loop, capped at 30fps ─────────────────────────────────────
        let animationFrame = 0;
        let lastRender = 0;
        let lastTick = performance.now();
        const pointerTarget = new THREE.Vector2();

        const render = (now: number) => {
          animationFrame = window.requestAnimationFrame(render);
          if (cancelled || !visible || !handle) return;
          if (now - lastRender < 31) return;
          const dt = Math.min(0.12, (now - lastTick) / 1000);
          lastRender = now;
          lastTick = now;

          handle.update((now - started) / 1000, dt);
          world.rotation.y += (pointerTarget.x * 0.045 - world.rotation.y) * 0.04;
          world.rotation.x += (-pointerTarget.y * 0.03 - world.rotation.x) * 0.04;
          renderer.render(scene, camera);
        };
        if (!reducedMotion) animationFrame = window.requestAnimationFrame(render);

        // ── OS event bus ──────────────────────────────────────────────
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const planePoint = new THREE.Vector3();

        const onSeaPulse = (event: Event) => {
          if (!handle?.onPulse) return;
          const detail = (event as CustomEvent).detail ?? {};
          const vx = typeof detail.x === "number" ? Math.min(1, Math.max(0, detail.x)) : 0.5;
          const vy = typeof detail.y === "number" ? Math.min(1, Math.max(0, detail.y)) : 0.5;
          raycaster.setFromCamera(new THREE.Vector2(vx * 2 - 1, -(vy * 2 - 1)), camera);
          if (raycaster.ray.intersectPlane(plane, planePoint)) handle.onPulse(planePoint.x, planePoint.y);
        };
        const onSeaExcite = () => handle?.onExcite?.();
        const onRadioState = (event: Event) => handle?.onRadio?.(Boolean((event as CustomEvent).detail?.on));
        const onBlock = () => handle?.onBlock?.();
        const onSwitch = (event: Event) => {
          const id = resolveWallpaperId((event as CustomEvent).detail?.id);
          if (!id) return;
          try {
            window.localStorage.setItem(STORAGE_KEY, id);
          } catch {
            // Choice simply won't persist.
          }
          mount(id);
        };
        window.addEventListener("os:sea-pulse", onSeaPulse);
        window.addEventListener("os:sea-excite", onSeaExcite);
        window.addEventListener("os:radio-state", onRadioState);
        window.addEventListener("os:block", onBlock);
        window.addEventListener("os:wallpaper", onSwitch);

        const onPointerMove = (event: PointerEvent) => {
          pointerTarget.x = event.clientX / window.innerWidth - 0.5;
          pointerTarget.y = event.clientY / window.innerHeight - 0.5;
        };
        if (!reducedMotion) window.addEventListener("pointermove", onPointerMove, { passive: true });

        const resize = () => {
          const rect = root.getBoundingClientRect();
          const width = Math.max(rect.width, 1);
          const height = Math.max(rect.height, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          if (reducedMotion && handle) {
            handle.update(0.002, 0.001);
            renderer.render(scene, camera);
          }
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        resize();

        setReady(true);

        destroyScene = () => {
          resizeObserver.disconnect();
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("os:sea-pulse", onSeaPulse);
          window.removeEventListener("os:sea-excite", onSeaExcite);
          window.removeEventListener("os:radio-state", onRadioState);
          window.removeEventListener("os:block", onBlock);
          window.removeEventListener("os:wallpaper", onSwitch);
          if (animationFrame) window.cancelAnimationFrame(animationFrame);
          handle?.dispose();
          renderer.dispose();
        };
      } catch {
        // WebGL unavailable: the CSS gradient wallpaper stands alone.
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) void initialize();
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
