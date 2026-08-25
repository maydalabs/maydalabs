"use client";

import { useEffect, useRef, useState } from "react";

// The desktop wallpaper: a still constellation of peer nodes joined by
// hairline edges. Most of the time nothing moves. Every few seconds a
// single transaction packet walks the graph; when a real Bitcoin block
// is mined, one confirmation wave sweeps every node. The render loop
// sleeps whenever the scene is at rest.
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
        scene.fog = new THREE.Fog(0x0a0a09, 16, 44);
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
        camera.position.set(0, 0, 26);

        const world = new THREE.Group();
        scene.add(world);

        // ── the peer graph ────────────────────────────────────────────
        const NODE_COUNT = 56;
        const positions: Array<[number, number, number]> = [];
        let guard = 0;
        while (positions.length < NODE_COUNT && guard < 4000) {
          guard += 1;
          const candidate: [number, number, number] = [
            (Math.random() - 0.5) * 46,
            (Math.random() - 0.5) * 22,
            (Math.random() - 0.5) * 7,
          ];
          if (positions.every((p) => Math.hypot(p[0] - candidate[0], p[1] - candidate[1]) > 3.1)) {
            positions.push(candidate);
          }
        }
        const count = positions.length;

        const nodePositions = new Float32Array(count * 3);
        positions.forEach((p, i) => {
          nodePositions[i * 3] = p[0];
          nodePositions[i * 3 + 1] = p[1];
          nodePositions[i * 3 + 2] = p[2];
        });

        // Base colors: warm dust, a fifth of them faintly orange.
        const warm = new THREE.Color(0x8a877e);
        const ember = new THREE.Color(0xb06a1e);
        const packetColor = new THREE.Color(0xf7931a);
        const baseColors = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          const base = (Math.random() < 0.2 ? ember : warm).clone().multiplyScalar(0.55 + Math.random() * 0.3);
          baseColors[i * 3] = base.r;
          baseColors[i * 3 + 1] = base.g;
          baseColors[i * 3 + 2] = base.b;
        }

        const nodeGeometry = new THREE.BufferGeometry();
        nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
        nodeGeometry.setAttribute("color", new THREE.BufferAttribute(baseColors.slice(), 3));
        const nodeMaterial = new THREE.PointsMaterial({ size: 0.2, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
        world.add(new THREE.Points(nodeGeometry, nodeMaterial));

        // Nearest-neighbour edges, deduplicated.
        const neighbours: number[][] = Array.from({ length: count }, () => []);
        const edgeKeys = new Set<string>();
        const edgeVertices: number[] = [];
        for (let i = 0; i < count; i += 1) {
          const distances = positions
            .map((p, j) => ({ j, d: Math.hypot(p[0] - positions[i][0], p[1] - positions[i][1], p[2] - positions[i][2]) }))
            .filter((entry) => entry.j !== i)
            .sort((a, b) => a.d - b.d);
          const links = Math.random() < 0.35 ? 3 : 2;
          for (const { j } of distances.slice(0, links)) {
            const key = i < j ? `${i}-${j}` : `${j}-${i}`;
            if (edgeKeys.has(key)) continue;
            edgeKeys.add(key);
            neighbours[i].push(j);
            neighbours[j].push(i);
            edgeVertices.push(...positions[i], ...positions[j]);
          }
        }
        const edgeGeometry = new THREE.BufferGeometry();
        edgeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edgeVertices), 3));
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xf2f0ea, transparent: true, opacity: 0.095 });
        world.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));

        // Travelling packets: a tiny pool of bright points.
        const MAX_PACKETS = 3;
        const packetPositions = new Float32Array(MAX_PACKETS * 3).fill(999);
        const packetGeometry = new THREE.BufferGeometry();
        packetGeometry.setAttribute("position", new THREE.BufferAttribute(packetPositions, 3));
        const packetMaterial = new THREE.PointsMaterial({ color: packetColor, size: 0.34, transparent: true, opacity: 0.95, depthWrite: false });
        world.add(new THREE.Points(packetGeometry, packetMaterial));

        type Packet = { path: number[]; hop: number; hopStart: number };
        const packets: Packet[] = [];
        const heat = new Float32Array(count);
        let heatDirty = true;
        const waves: Array<{ x: number; y: number; start: number }> = [];
        let excitement = 0;
        let radioOn = false;

        // ── sleep-capable render loop ─────────────────────────────────
        let animationFrame = 0;
        let lastTime = performance.now();
        const pointerTarget = new THREE.Vector2();
        const colorAttr = nodeGeometry.getAttribute("color") as import("three").BufferAttribute;
        const packetAttr = packetGeometry.getAttribute("position") as import("three").BufferAttribute;

        const sceneActive = () =>
          packets.length > 0 ||
          waves.length > 0 ||
          excitement > 0.004 ||
          radioOn ||
          heatDirty ||
          Math.abs(world.rotation.y - pointerTarget.x * 0.06) > 0.0006 ||
          Math.abs(world.rotation.x + pointerTarget.y * 0.04) > 0.0006;

        const render = (now: number) => {
          animationFrame = 0;
          if (cancelled || !visible) return;
          const dt = Math.min(0.1, (now - lastTime) / 1000);
          lastTime = now;
          const t = now / 1000;

          // Packets walk their paths, heating every node they touch.
          for (let p = packets.length - 1; p >= 0; p -= 1) {
            const packet = packets[p];
            const hopDuration = 1.15;
            const progress = (now - packet.hopStart) / (hopDuration * 1000);
            const from = positions[packet.path[packet.hop]];
            const to = positions[packet.path[packet.hop + 1]];
            if (progress >= 1) {
              heat[packet.path[packet.hop + 1]] = 1;
              heatDirty = true;
              packet.hop += 1;
              packet.hopStart = now;
              if (packet.hop >= packet.path.length - 1) {
                packets.splice(p, 1);
                packetAttr.setXYZ(p, 999, 999, 999);
              }
              continue;
            }
            const eased = progress * progress * (3 - 2 * progress);
            packetAttr.setXYZ(
              p,
              from[0] + (to[0] - from[0]) * eased,
              from[1] + (to[1] - from[1]) * eased,
              from[2] + (to[2] - from[2]) * eased,
            );
          }
          for (let p = packets.length; p < MAX_PACKETS; p += 1) packetAttr.setXYZ(p, 999, 999, 999);
          packetAttr.needsUpdate = true;

          // Confirmation waves sweep outward and heat nodes as they pass.
          for (let w = waves.length - 1; w >= 0; w -= 1) {
            const wave = waves[w];
            const age = (now - wave.start) / 1000;
            const radius = age * 14;
            if (age > 4.2) {
              waves.splice(w, 1);
              continue;
            }
            for (let i = 0; i < count; i += 1) {
              const distance = Math.hypot(positions[i][0] - wave.x, positions[i][1] - wave.y);
              if (Math.abs(distance - radius) < 1.4 && heat[i] < 0.85) {
                heat[i] = 0.85;
                heatDirty = true;
              }
            }
          }

          // Heat decays; colors update only while something glows.
          excitement = Math.max(0, excitement - dt * 0.5);
          if (heatDirty || excitement > 0.004) {
            let stillHot = false;
            for (let i = 0; i < count; i += 1) {
              const value = Math.min(1, heat[i] + excitement * 0.35);
              if (heat[i] > 0.004) {
                heat[i] = Math.max(0, heat[i] - dt * 0.55);
                stillHot = true;
              }
              colorAttr.setXYZ(
                i,
                baseColors[i * 3] + (packetColor.r - baseColors[i * 3]) * value,
                baseColors[i * 3 + 1] + (packetColor.g - baseColors[i * 3 + 1]) * value,
                baseColors[i * 3 + 2] + (packetColor.b - baseColors[i * 3 + 2]) * value,
              );
            }
            colorAttr.needsUpdate = true;
            heatDirty = stillHot || excitement > 0.004;
          }

          // While the radio plays, edges breathe very slightly.
          edgeMaterial.opacity = radioOn ? 0.095 + Math.sin(t * 0.9) * 0.025 : 0.095;

          world.rotation.y += (pointerTarget.x * 0.06 - world.rotation.y) * 0.05;
          world.rotation.x += (-pointerTarget.y * 0.04 - world.rotation.x) * 0.05;

          renderer.render(scene, camera);
          if (sceneActive()) {
            animationFrame = window.requestAnimationFrame(render);
          }
        };

        const wake = () => {
          if (!animationFrame && visible && !cancelled) {
            lastTime = performance.now();
            animationFrame = window.requestAnimationFrame(render);
          }
        };

        // ── ambient packets, paced by the real mempool when known ─────
        let spawnTimer = 0;
        const spawnPacket = () => {
          if (!cancelled && visible && packets.length < MAX_PACKETS && !reducedMotion) {
            const start = Math.floor(Math.random() * count);
            const path = [start];
            let current = start;
            const hops = 2 + Math.floor(Math.random() * 3);
            for (let h = 0; h < hops; h += 1) {
              const options = neighbours[current].filter((n) => !path.includes(n));
              if (options.length === 0) break;
              current = options[Math.floor(Math.random() * options.length)];
              path.push(current);
            }
            if (path.length > 1) {
              heat[path[0]] = 1;
              heatDirty = true;
              packets.push({ path, hop: 0, hopStart: performance.now() });
              wake();
            }
          }
          // ~5k pending tx → lively-ish; empty mempool → sleepy. Bounded.
          const pool = mempoolRef.current;
          const interval = pool === null ? 4600 : Math.max(2400, Math.min(7500, 7500 - Math.min(pool, 40000) / 8));
          spawnTimer = window.setTimeout(spawnPacket, interval + Math.random() * 1800);
        };
        if (!reducedMotion) spawnTimer = window.setTimeout(spawnPacket, 1600);

        // ── the OS talks to the graph ─────────────────────────────────
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const planePoint = new THREE.Vector3();

        const nearestNode = (vx: number, vy: number) => {
          raycaster.setFromCamera(new THREE.Vector2(vx * 2 - 1, -(vy * 2 - 1)), camera);
          if (!raycaster.ray.intersectPlane(plane, planePoint)) return -1;
          let best = -1;
          let bestDistance = Infinity;
          for (let i = 0; i < count; i += 1) {
            const d = Math.hypot(positions[i][0] - planePoint.x, positions[i][1] - planePoint.y);
            if (d < bestDistance) {
              bestDistance = d;
              best = i;
            }
          }
          return best;
        };

        const onSeaPulse = (event: Event) => {
          const detail = (event as CustomEvent).detail ?? {};
          const vx = typeof detail.x === "number" ? Math.min(1, Math.max(0, detail.x)) : 0.5;
          const vy = typeof detail.y === "number" ? Math.min(1, Math.max(0, detail.y)) : 0.5;
          const node = nearestNode(vx, vy);
          if (node < 0) return;
          heat[node] = 1;
          for (const n of neighbours[node]) heat[n] = Math.max(heat[n], 0.55);
          heatDirty = true;
          wake();
        };
        const onSeaExcite = () => {
          excitement = Math.min(0.5, excitement + 0.16);
          wake();
        };
        const onRadioState = (event: Event) => {
          radioOn = Boolean((event as CustomEvent).detail?.on);
          wake();
        };
        const onBlock = () => {
          const origin = positions[Math.floor(Math.random() * count)];
          waves.push({ x: origin[0], y: origin[1], start: performance.now() });
          wake();
        };
        window.addEventListener("os:sea-pulse", onSeaPulse);
        window.addEventListener("os:sea-excite", onSeaExcite);
        window.addEventListener("os:radio-state", onRadioState);
        window.addEventListener("os:block", onBlock);

        let pointerLast = 0;
        const onPointerMove = (event: PointerEvent) => {
          pointerTarget.x = event.clientX / window.innerWidth - 0.5;
          pointerTarget.y = event.clientY / window.innerHeight - 0.5;
          const now = performance.now();
          if (now - pointerLast > 90) {
            pointerLast = now;
            wake();
          }
        };
        if (!reducedMotion) window.addEventListener("pointermove", onPointerMove, { passive: true });

        const resize = () => {
          const rect = root.getBoundingClientRect();
          const width = Math.max(rect.width, 1);
          const height = Math.max(rect.height, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          wake();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        resize();

        root.addEventListener("wallpaper:visible", wake);
        setReady(true);
        wake();

        destroyScene = () => {
          resizeObserver.disconnect();
          window.clearTimeout(spawnTimer);
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("os:sea-pulse", onSeaPulse);
          window.removeEventListener("os:sea-excite", onSeaExcite);
          window.removeEventListener("os:radio-state", onRadioState);
          window.removeEventListener("os:block", onBlock);
          root.removeEventListener("wallpaper:visible", wake);
          if (animationFrame) window.cancelAnimationFrame(animationFrame);
          nodeGeometry.dispose();
          edgeGeometry.dispose();
          packetGeometry.dispose();
          nodeMaterial.dispose();
          edgeMaterial.dispose();
          packetMaterial.dispose();
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
