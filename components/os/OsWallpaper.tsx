"use client";

import { useEffect, useRef, useState } from "react";

// The desktop wallpaper: a living peer mesh. A few hundred nodes fill
// the whole field, each drifting in its own slow orbit; connections
// form and dissolve as peers move near and apart. Everything moves,
// nothing shouts — capped at 30fps and paused off-screen.
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
        scene.fog = new THREE.Fog(0x0a0a09, 18, 46);
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
        camera.position.set(0, 0, 26);

        const world = new THREE.Group();
        scene.add(world);

        // ── the mesh ──────────────────────────────────────────────────
        const COUNT = 230;
        const FIELD_W = 52;
        const FIELD_H = 26;
        const homes: Array<[number, number, number]> = [];
        let guard = 0;
        while (homes.length < COUNT && guard < 12000) {
          guard += 1;
          const candidate: [number, number, number] = [
            (Math.random() - 0.5) * FIELD_W,
            (Math.random() - 0.5) * FIELD_H,
            (Math.random() - 0.5) * 8,
          ];
          if (homes.every((p) => Math.hypot(p[0] - candidate[0], p[1] - candidate[1]) > 1.35)) {
            homes.push(candidate);
          }
        }
        const count = homes.length;

        // Per-node drift orbits and breathing, all slightly different.
        const drift = new Float32Array(count * 6); // ampX ampY spX spY phX phY
        const breath = new Float32Array(count * 2); // speed phase
        for (let i = 0; i < count; i += 1) {
          drift[i * 6] = 0.35 + Math.random() * 0.45;
          drift[i * 6 + 1] = 0.35 + Math.random() * 0.45;
          drift[i * 6 + 2] = 0.03 + Math.random() * 0.05;
          drift[i * 6 + 3] = 0.03 + Math.random() * 0.05;
          drift[i * 6 + 4] = Math.random() * Math.PI * 2;
          drift[i * 6 + 5] = Math.random() * Math.PI * 2;
          breath[i * 2] = 0.1 + Math.random() * 0.22;
          breath[i * 2 + 1] = Math.random() * Math.PI * 2;
        }

        const warm = new THREE.Color(0x94908a);
        const ember = new THREE.Color(0xc27a28);
        const hot = new THREE.Color(0xf7931a);
        const baseColors = new Float32Array(count * 3);
        for (let i = 0; i < count; i += 1) {
          const base = (Math.random() < 0.16 ? ember : warm).clone().multiplyScalar(0.5 + Math.random() * 0.35);
          baseColors[i * 3] = base.r;
          baseColors[i * 3 + 1] = base.g;
          baseColors[i * 3 + 2] = base.b;
        }

        const nodePositions = new Float32Array(count * 3);
        const nodeGeometry = new THREE.BufferGeometry();
        nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
        nodeGeometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
        const nodeMaterial = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
        world.add(new THREE.Points(nodeGeometry, nodeMaterial));

        // Dynamic edges: connections exist while peers drift close.
        const LINK_DISTANCE = 4.4;
        const MAX_EDGES = 950;
        const edgePositions = new Float32Array(MAX_EDGES * 6);
        const edgeColors = new Float32Array(MAX_EDGES * 6);
        const edgeGeometry = new THREE.BufferGeometry();
        edgeGeometry.setAttribute("position", new THREE.BufferAttribute(edgePositions, 3));
        edgeGeometry.setAttribute("color", new THREE.BufferAttribute(edgeColors, 3));
        const edgeMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1, depthWrite: false });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        world.add(edges);

        // One occasional packet drifting peer to peer.
        const packetGeometry = new THREE.BufferGeometry();
        packetGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([999, 999, 999]), 3));
        const packetMaterial = new THREE.PointsMaterial({ color: hot, size: 0.3, transparent: true, opacity: 0.9, depthWrite: false });
        world.add(new THREE.Points(packetGeometry, packetMaterial));
        const packetAttr = packetGeometry.getAttribute("position") as import("three").BufferAttribute;

        const heat = new Float32Array(count);
        const waves: Array<{ x: number; y: number; start: number }> = [];
        let packet: { from: number; to: number; start: number } | null = null;
        let excitement = 0;
        let radioOn = false;

        const current = new Float32Array(count * 3);
        const positionAttr = nodeGeometry.getAttribute("position") as import("three").BufferAttribute;
        const colorAttr = nodeGeometry.getAttribute("color") as import("three").BufferAttribute;

        // ── render loop, capped at 30fps ──────────────────────────────
        let animationFrame = 0;
        let lastRender = 0;
        let lastTick = performance.now();
        const pointerTarget = new THREE.Vector2();

        const render = (now: number) => {
          animationFrame = window.requestAnimationFrame(render);
          if (cancelled || !visible) return;
          if (now - lastRender < 31) return;
          const dt = Math.min(0.12, (now - lastTick) / 1000);
          lastRender = now;
          lastTick = now;
          const t = now / 1000;

          excitement = Math.max(0, excitement - dt * 0.45);
          const breathAmp = radioOn ? 0.3 : 0.16;

          // Nodes drift and breathe.
          for (let i = 0; i < count; i += 1) {
            const x = homes[i][0] + Math.sin(t * drift[i * 6 + 2] + drift[i * 6 + 4]) * drift[i * 6];
            const y = homes[i][1] + Math.cos(t * drift[i * 6 + 3] + drift[i * 6 + 5]) * drift[i * 6 + 1];
            const z = homes[i][2];
            current[i * 3] = x;
            current[i * 3 + 1] = y;
            current[i * 3 + 2] = z;
            positionAttr.setXYZ(i, x, y, z);

            if (heat[i] > 0.004) heat[i] = Math.max(0, heat[i] - dt * 0.6);
            const glow = Math.min(1, heat[i] + excitement * 0.3);
            const breathe = 1 + Math.sin(t * breath[i * 2] + breath[i * 2 + 1]) * breathAmp;
            colorAttr.setXYZ(
              i,
              (baseColors[i * 3] + (hot.r - baseColors[i * 3]) * glow) * breathe,
              (baseColors[i * 3 + 1] + (hot.g - baseColors[i * 3 + 1]) * glow) * breathe,
              (baseColors[i * 3 + 2] + (hot.b - baseColors[i * 3 + 2]) * glow) * breathe,
            );
          }
          positionAttr.needsUpdate = true;
          colorAttr.needsUpdate = true;

          // Confirmation waves heat nodes as they pass.
          for (let w = waves.length - 1; w >= 0; w -= 1) {
            const age = (now - waves[w].start) / 1000;
            if (age > 4.5) {
              waves.splice(w, 1);
              continue;
            }
            const radius = age * 14;
            for (let i = 0; i < count; i += 1) {
              const d = Math.hypot(current[i * 3] - waves[w].x, current[i * 3 + 1] - waves[w].y);
              if (Math.abs(d - radius) < 1.5 && heat[i] < 0.8) heat[i] = 0.8;
            }
          }

          // Connections form and dissolve with proximity.
          let used = 0;
          for (let i = 0; i < count && used < MAX_EDGES; i += 1) {
            for (let j = i + 1; j < count && used < MAX_EDGES; j += 1) {
              const dx = current[i * 3] - current[j * 3];
              if (dx > LINK_DISTANCE || dx < -LINK_DISTANCE) continue;
              const dy = current[i * 3 + 1] - current[j * 3 + 1];
              if (dy > LINK_DISTANCE || dy < -LINK_DISTANCE) continue;
              const d = Math.hypot(dx, dy, current[i * 3 + 2] - current[j * 3 + 2]);
              if (d > LINK_DISTANCE) continue;
              const strength = Math.pow(1 - d / LINK_DISTANCE, 1.7) * 0.17 * (1 + (heat[i] + heat[j]) * 1.6);
              const o = used * 6;
              edgePositions[o] = current[i * 3];
              edgePositions[o + 1] = current[i * 3 + 1];
              edgePositions[o + 2] = current[i * 3 + 2];
              edgePositions[o + 3] = current[j * 3];
              edgePositions[o + 4] = current[j * 3 + 1];
              edgePositions[o + 5] = current[j * 3 + 2];
              const warmth = 0.93 + (heat[i] + heat[j]) * 0.3;
              edgeColors[o] = strength * warmth;
              edgeColors[o + 1] = strength * 0.92;
              edgeColors[o + 2] = strength * 0.82;
              edgeColors[o + 3] = strength * warmth;
              edgeColors[o + 4] = strength * 0.92;
              edgeColors[o + 5] = strength * 0.82;
              used += 1;
            }
          }
          edgeGeometry.setDrawRange(0, used * 2);
          (edgeGeometry.getAttribute("position") as import("three").BufferAttribute).needsUpdate = true;
          (edgeGeometry.getAttribute("color") as import("three").BufferAttribute).needsUpdate = true;

          // The single wandering packet.
          if (packet) {
            const progress = (now - packet.start) / 1400;
            if (progress >= 1) {
              heat[packet.to] = 1;
              packet = null;
              packetAttr.setXYZ(0, 999, 999, 999);
            } else {
              const eased = progress * progress * (3 - 2 * progress);
              packetAttr.setXYZ(
                0,
                current[packet.from * 3] + (current[packet.to * 3] - current[packet.from * 3]) * eased,
                current[packet.from * 3 + 1] + (current[packet.to * 3 + 1] - current[packet.from * 3 + 1]) * eased,
                current[packet.from * 3 + 2] + (current[packet.to * 3 + 2] - current[packet.from * 3 + 2]) * eased,
              );
            }
            packetAttr.needsUpdate = true;
          }

          world.rotation.y += (pointerTarget.x * 0.05 - world.rotation.y) * 0.04;
          world.rotation.x += (-pointerTarget.y * 0.035 - world.rotation.x) * 0.04;

          renderer.render(scene, camera);
        };

        // ── occasional packets, paced by the real mempool ─────────────
        let spawnTimer = 0;
        const spawnPacket = () => {
          if (!cancelled && visible && !packet) {
            const from = Math.floor(Math.random() * count);
            let best = -1;
            let bestDistance = Infinity;
            for (let j = 0; j < count; j += 1) {
              if (j === from) continue;
              const d = Math.hypot(current[from * 3] - current[j * 3], current[from * 3 + 1] - current[j * 3 + 1]);
              if (d < bestDistance) {
                bestDistance = d;
                best = j;
              }
            }
            if (best >= 0 && bestDistance < LINK_DISTANCE * 1.4) {
              heat[from] = 1;
              packet = { from, to: best, start: performance.now() };
            }
          }
          const pool = mempoolRef.current;
          const interval = pool === null ? 5200 : Math.max(2600, Math.min(8000, 8000 - Math.min(pool, 40000) / 8));
          spawnTimer = window.setTimeout(spawnPacket, interval + Math.random() * 2000);
        };
        if (!reducedMotion) spawnTimer = window.setTimeout(spawnPacket, 2200);

        // ── the OS talks to the mesh ──────────────────────────────────
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const planePoint = new THREE.Vector3();

        const nearestNode = (vx: number, vy: number) => {
          raycaster.setFromCamera(new THREE.Vector2(vx * 2 - 1, -(vy * 2 - 1)), camera);
          if (!raycaster.ray.intersectPlane(plane, planePoint)) return -1;
          let best = -1;
          let bestDistance = Infinity;
          for (let i = 0; i < count; i += 1) {
            const d = Math.hypot(current[i * 3] - planePoint.x, current[i * 3 + 1] - planePoint.y);
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
          for (let j = 0; j < count; j += 1) {
            const d = Math.hypot(current[node * 3] - current[j * 3], current[node * 3 + 1] - current[j * 3 + 1]);
            if (j !== node && d < LINK_DISTANCE) heat[j] = Math.max(heat[j], 0.5);
          }
        };
        const onSeaExcite = () => {
          excitement = Math.min(0.6, excitement + 0.18);
        };
        const onRadioState = (event: Event) => {
          radioOn = Boolean((event as CustomEvent).detail?.on);
        };
        const onBlock = () => {
          waves.push({ x: (Math.random() - 0.5) * FIELD_W * 0.7, y: (Math.random() - 0.5) * FIELD_H * 0.7, start: performance.now() });
        };
        window.addEventListener("os:sea-pulse", onSeaPulse);
        window.addEventListener("os:sea-excite", onSeaExcite);
        window.addEventListener("os:radio-state", onRadioState);
        window.addEventListener("os:block", onBlock);

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
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        resize();

        setReady(true);
        if (reducedMotion) {
          // One still frame of the mesh.
          render(performance.now());
          if (animationFrame) window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        } else {
          animationFrame = window.requestAnimationFrame(render);
        }

        destroyScene = () => {
          resizeObserver.disconnect();
          window.clearTimeout(spawnTimer);
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("os:sea-pulse", onSeaPulse);
          window.removeEventListener("os:sea-excite", onSeaExcite);
          window.removeEventListener("os:radio-state", onRadioState);
          window.removeEventListener("os:block", onBlock);
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
