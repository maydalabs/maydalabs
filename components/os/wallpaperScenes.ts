import type * as ThreeNS from "three";
import LAND_DOTS from "@/components/os/landDots.json";
import type { WallpaperId } from "@/components/os/wallpaperRegistry";

// Ten wallpaper scenes for MaydaOS. Each factory builds into its own
// group, returns a handle the engine drives at ~30fps, and reacts to
// the same OS events: clicks (onPulse), shell typing (onExcite), real
// mined blocks (onBlock), and the radio (onRadio).

export type SceneHandle = {
  update(t: number, dt: number): void;
  onPulse?(x: number, y: number): void;
  onExcite?(): void;
  onBlock?(): void;
  onRadio?(on: boolean): void;
  dispose(): void;
};

export type SceneContext = {
  three: typeof ThreeNS;
  world: ThreeNS.Group;
  mempool: () => number | null;
};

const DUST = 0x94908a;
const EMBER = 0xc27a28;
const HOT = 0xf7931a;

function group(ctx: SceneContext) {
  const g = new ctx.three.Group();
  ctx.world.add(g);
  return g;
}

function teardown(ctx: SceneContext, g: ThreeNS.Group, resources: Array<{ dispose(): void }>) {
  ctx.world.remove(g);
  for (const r of resources) r.dispose();
}

// ── 1 · NODE GLOBE ─────────────────────────────────────────────────────
function makeGlobe(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  g.position.set(7, -11.5, -2);
  g.rotation.z = -0.12;
  const R = 15;
  const res: Array<{ dispose(): void }> = [];

  // Distant stars behind everything.
  const STAR_COUNT = 170;
  const starPositions = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i += 1) {
    starPositions[i * 3] = (Math.random() - 0.5) * 110;
    starPositions[i * 3 + 1] = (Math.random() - 0.3) * 70;
    starPositions[i * 3 + 2] = -34 - Math.random() * 30;
  }
  const starGeo = new T.BufferGeometry();
  starGeo.setAttribute("position", new T.BufferAttribute(starPositions, 3));
  const starMat = new T.PointsMaterial({ color: 0xf2f0ea, size: 0.09, transparent: true, opacity: 0.5, depthWrite: false });
  res.push(starGeo, starMat);
  ctx.world.add(new T.Points(starGeo, starMat));
  const stars = ctx.world.children[ctx.world.children.length - 1];

  const planet = new T.Group();
  g.add(planet);

  // Solid body: occludes the far hemisphere, darker than the sky.
  const bodyGeo = new T.SphereGeometry(R * 0.985, 48, 32);
  const bodyMat = new T.MeshBasicMaterial({ color: 0x080807 });
  res.push(bodyGeo, bodyMat);
  planet.add(new T.Mesh(bodyGeo, bodyMat));

  // Atmosphere: fresnel rim glow on the limb.
  const rimGeo = new T.SphereGeometry(R * 1.03, 48, 32);
  const rimMat = new T.ShaderMaterial({
    uniforms: { uColor: { value: new T.Color(HOT) } },
    vertexShader:
      "varying float vRim; void main(){ vec3 n = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vRim = pow(1.0 - abs(dot(n, normalize(-mv.xyz))), 3.0); gl_Position = projectionMatrix * mv; }",
    fragmentShader:
      "uniform vec3 uColor; varying float vRim; void main(){ gl_FragColor = vec4(uColor, vRim * 0.42); }",
    transparent: true,
    blending: T.AdditiveBlending,
    depthWrite: false,
  });
  res.push(rimGeo, rimMat);
  planet.add(new T.Mesh(rimGeo, rimMat));

  // Graticule: mission-control latitude and longitude guides.
  const gratVerts: number[] = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const r = R * Math.cos((lat * Math.PI) / 180) * 1.001;
    const y = R * Math.sin((lat * Math.PI) / 180);
    for (let i = 0; i < 96; i += 1) {
      const a1 = (i / 96) * Math.PI * 2;
      const a2 = ((i + 1) / 96) * Math.PI * 2;
      gratVerts.push(Math.cos(a1) * r, y, Math.sin(a1) * r, Math.cos(a2) * r, y, Math.sin(a2) * r);
    }
  }
  for (let lon = 0; lon < 360; lon += 30) {
    const a = (lon * Math.PI) / 180;
    for (let i = 0; i < 64; i += 1) {
      const p1 = (i / 64) * Math.PI - Math.PI / 2;
      const p2 = ((i + 1) / 64) * Math.PI - Math.PI / 2;
      gratVerts.push(
        Math.cos(p1) * Math.cos(a) * R * 1.001, Math.sin(p1) * R * 1.001, Math.cos(p1) * Math.sin(a) * R * 1.001,
        Math.cos(p2) * Math.cos(a) * R * 1.001, Math.sin(p2) * R * 1.001, Math.cos(p2) * Math.sin(a) * R * 1.001,
      );
    }
  }
  const gratGeo = new T.BufferGeometry();
  gratGeo.setAttribute("position", new T.BufferAttribute(new Float32Array(gratVerts), 3));
  const gratMat = new T.LineBasicMaterial({ color: 0xf2f0ea, transparent: true, opacity: 0.05 });
  res.push(gratGeo, gratMat);
  planet.add(new T.LineSegments(gratGeo, gratMat));

  // Land dots, with a set of ember city lights that twinkle.
  const count = LAND_DOTS.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const baseColors = new Float32Array(count * 3);
  const twinklePhase = new Float32Array(count);
  const isCity = new Uint8Array(count);
  const dust = new T.Color(DUST);
  const ember = new T.Color(0xd9862e);
  const vecs: ThreeNS.Vector3[] = [];
  for (let i = 0; i < count; i += 1) {
    const [lat, lon] = LAND_DOTS[i] as [number, number];
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lon + 180) * Math.PI) / 180;
    const v = new T.Vector3(
      -R * Math.sin(phi) * Math.cos(theta),
      R * Math.cos(phi),
      R * Math.sin(phi) * Math.sin(theta),
    );
    vecs.push(v);
    positions.set([v.x, v.y, v.z], i * 3);
    const city = Math.random() < 0.11;
    isCity[i] = city ? 1 : 0;
    twinklePhase[i] = Math.random() * Math.PI * 2;
    const c = (city ? ember : dust).clone().multiplyScalar(city ? 0.95 : 0.62 + Math.random() * 0.35);
    baseColors.set([c.r, c.g, c.b], i * 3);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(positions, 3));
  geo.setAttribute("color", new T.BufferAttribute(colors, 3));
  res.push(geo);
  const mat = new T.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
  res.push(mat);
  planet.add(new T.Points(geo, mat));
  const colorAttr = geo.getAttribute("color") as ThreeNS.BufferAttribute;

  // Transaction arcs with bright heads and landing pings.
  type Arc = {
    line: ThreeNS.Line;
    lineGeo: ThreeNS.BufferGeometry;
    lineMat: ThreeNS.LineBasicMaterial;
    head: ThreeNS.Points;
    headGeo: ThreeNS.BufferGeometry;
    headMat: ThreeNS.PointsMaterial;
    points: ThreeNS.Vector3[];
    dest: ThreeNS.Vector3;
    start: number;
  };
  const arcs: Arc[] = [];
  type Ping = { loop: ThreeNS.LineLoop; geo: ThreeNS.BufferGeometry; mat: ThreeNS.LineBasicMaterial; start: number };
  const pings: Ping[] = [];
  let spawnAt = 1.5;

  const spawnArc = (now: number) => {
    if (arcs.length >= 4) return;
    const a = vecs[Math.floor(Math.random() * vecs.length)];
    let b = vecs[Math.floor(Math.random() * vecs.length)];
    for (let tries = 0; tries < 14 && a.angleTo(b) < 0.6; tries += 1) b = vecs[Math.floor(Math.random() * vecs.length)];
    const points: ThreeNS.Vector3[] = [];
    const STEPS = 48;
    for (let sIdx = 0; sIdx <= STEPS; sIdx += 1) {
      const f = sIdx / STEPS;
      points.push(a.clone().lerp(b, f).normalize().multiplyScalar(R * (1 + Math.sin(f * Math.PI) * 0.24)));
    }
    const lineGeo = new T.BufferGeometry().setFromPoints(points);
    const lineMat = new T.LineBasicMaterial({ color: HOT, transparent: true, opacity: 0.85 });
    const line = new T.Line(lineGeo, lineMat);
    lineGeo.setDrawRange(0, 0);
    const headGeo = new T.BufferGeometry();
    headGeo.setAttribute("position", new T.BufferAttribute(new Float32Array([a.x, a.y, a.z]), 3));
    const headMat = new T.PointsMaterial({ color: 0xffc36d, size: 0.34, transparent: true, opacity: 1, depthWrite: false });
    const head = new T.Points(headGeo, headMat);
    planet.add(line);
    planet.add(head);
    arcs.push({ line, lineGeo, lineMat, head, headGeo, headMat, points, dest: b, start: now });
  };

  const spawnPing = (at: ThreeNS.Vector3) => {
    const pts: ThreeNS.Vector3[] = [];
    for (let i = 0; i < 24; i += 1) {
      const a = (i / 24) * Math.PI * 2;
      pts.push(new T.Vector3(Math.cos(a), Math.sin(a), 0));
    }
    const pgeo = new T.BufferGeometry().setFromPoints(pts);
    const pmat = new T.LineBasicMaterial({ color: HOT, transparent: true, opacity: 0.8 });
    const loop = new T.LineLoop(pgeo, pmat);
    loop.position.copy(at.clone().multiplyScalar(1.004));
    loop.lookAt(at.clone().multiplyScalar(2));
    loop.scale.setScalar(0.15);
    planet.add(loop);
    pings.push({ loop, geo: pgeo, mat: pmat, start: performance.now() / 1000 });
  };

  let blockRing: { mesh: ThreeNS.LineLoop; mat: ThreeNS.LineBasicMaterial; geo: ThreeNS.BufferGeometry; start: number } | null = null;
  let excite = 0;
  let surge = 0;
  let lastT = 0;

  return {
    update(t, dt) {
      lastT = t;
      planet.rotation.y += dt * 0.018;
      excite = Math.max(0, excite - dt * 0.5);
      surge = Math.max(0, surge - dt * 0.55);
      mat.opacity = 0.95;
      starMat.opacity = 0.45 + excite * 0.2;
      stars.rotation.z += dt * 0.0012;

      // City lights twinkle; a surge lifts every settlement at once.
      for (let i = 0; i < count; i += 1) {
        const boost = isCity[i]
          ? 0.82 + 0.24 * Math.sin(t * 0.9 + twinklePhase[i]) + surge * 0.9
          : 1 + surge * 0.45 + excite * 0.15;
        colorAttr.setXYZ(i, baseColors[i * 3] * boost, baseColors[i * 3 + 1] * boost, baseColors[i * 3 + 2] * boost);
      }
      colorAttr.needsUpdate = true;

      if (t > spawnAt) {
        spawnArc(t);
        const pool = ctx.mempool();
        const interval = pool === null ? 4.5 : Math.max(2.2, 6.5 - Math.min(pool, 40000) / 9000);
        spawnAt = t + interval + Math.random() * 1.6;
      }
      for (let i = arcs.length - 1; i >= 0; i -= 1) {
        const arc = arcs[i];
        const age = t - arc.start;
        if (age < 1.9) {
          const f = Math.min(1, age / 1.9);
          const idx = Math.floor(f * 48);
          arc.lineGeo.setDrawRange(Math.max(0, idx - 16), Math.min(49, idx + 1) - Math.max(0, idx - 16));
          const headPoint = arc.points[Math.min(48, idx)];
          (arc.headGeo.getAttribute("position") as ThreeNS.BufferAttribute).setXYZ(0, headPoint.x, headPoint.y, headPoint.z);
          (arc.headGeo.getAttribute("position") as ThreeNS.BufferAttribute).needsUpdate = true;
          if (idx >= 48) spawnPing(arc.dest);
        } else {
          arc.lineMat.opacity = Math.max(0, 0.85 - (age - 1.9) * 1.1);
          arc.headMat.opacity = arc.lineMat.opacity;
        }
        if (age > 2.9) {
          planet.remove(arc.line);
          planet.remove(arc.head);
          arc.lineGeo.dispose();
          arc.lineMat.dispose();
          arc.headGeo.dispose();
          arc.headMat.dispose();
          arcs.splice(i, 1);
        }
      }
      const nowSec = performance.now() / 1000;
      for (let i = pings.length - 1; i >= 0; i -= 1) {
        const ping = pings[i];
        const age = nowSec - ping.start;
        ping.loop.scale.setScalar(0.15 + age * 1.6);
        ping.mat.opacity = Math.max(0, 0.8 - age * 1.1);
        if (age > 0.8) {
          planet.remove(ping.loop);
          ping.geo.dispose();
          ping.mat.dispose();
          pings.splice(i, 1);
        }
      }
      if (blockRing) {
        const age = nowSec - blockRing.start;
        blockRing.mesh.scale.setScalar(0.3 + age * 0.6);
        blockRing.mat.opacity = Math.max(0, 0.55 - age * 0.3);
        if (age > 1.9) {
          g.remove(blockRing.mesh);
          blockRing.geo.dispose();
          blockRing.mat.dispose();
          blockRing = null;
        }
      }
    },
    onPulse() {
      spawnArc(lastT);
    },
    onExcite() {
      excite = Math.min(0.9, excite + 0.28);
    },
    onBlock() {
      surge = 1;
      if (blockRing) return;
      const pts: ThreeNS.Vector3[] = [];
      for (let i = 0; i <= 72; i += 1) {
        const a = (i / 72) * Math.PI * 2;
        pts.push(new T.Vector3(Math.cos(a) * R * 1.08, 0, Math.sin(a) * R * 1.08));
      }
      const rgeo = new T.BufferGeometry().setFromPoints(pts);
      const rmat = new T.LineBasicMaterial({ color: HOT, transparent: true, opacity: 0.55 });
      const mesh = new T.LineLoop(rgeo, rmat);
      mesh.rotation.x = Math.PI * 0.14;
      g.add(mesh);
      blockRing = { mesh, mat: rmat, geo: rgeo, start: performance.now() / 1000 };
    },
    dispose() {
      for (const arc of arcs) {
        arc.lineGeo.dispose();
        arc.lineMat.dispose();
        arc.headGeo.dispose();
        arc.headMat.dispose();
      }
      for (const ping of pings) {
        ping.geo.dispose();
        ping.mat.dispose();
      }
      if (blockRing) {
        blockRing.geo.dispose();
        blockRing.mat.dispose();
      }
      ctx.world.remove(stars);
      teardown(ctx, g, res);
    },
  };
}

// ── 2 · HIVE LATTICE ──────────────────────────────────────────────────
function makeHive(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  const res: Array<{ dispose(): void }> = [];
  const S = 1.35;
  const COLS = 26;
  const ROWS = 13;
  const centers: Array<[number, number]> = [];
  for (let col = -COLS / 2; col <= COLS / 2; col += 1) {
    for (let row = -ROWS / 2; row <= ROWS / 2; row += 1) {
      centers.push([col * 1.5 * S, row * Math.sqrt(3) * S + (((col % 2) + 2) % 2) * (Math.sqrt(3) / 2) * S]);
    }
  }
  const cellCount = centers.length;
  const verts = new Float32Array(cellCount * 12 * 3);
  const cols = new Float32Array(cellCount * 12 * 3);
  for (let i = 0; i < cellCount; i += 1) {
    const [cx, cy] = centers[i];
    for (let e = 0; e < 6; e += 1) {
      const a1 = (Math.PI / 3) * e;
      const a2 = (Math.PI / 3) * (e + 1);
      const o = (i * 6 + e) * 6;
      verts[o] = cx + Math.cos(a1) * S;
      verts[o + 1] = cy + Math.sin(a1) * S;
      verts[o + 3] = cx + Math.cos(a2) * S;
      verts[o + 4] = cy + Math.sin(a2) * S;
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(verts, 3));
  geo.setAttribute("color", new T.BufferAttribute(cols, 3));
  res.push(geo);
  const mat = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1, depthWrite: false });
  res.push(mat);
  g.add(new T.LineSegments(geo, mat));

  const heat = new Float32Array(cellCount);
  let cascadeAt = 4;
  let excite = 0;
  let radio = false;
  const colorAttr = geo.getAttribute("color") as ThreeNS.BufferAttribute;

  const cascade = (originIndex: number) => {
    const [ox, oy] = centers[originIndex];
    for (let i = 0; i < cellCount; i += 1) {
      const d = Math.hypot(centers[i][0] - ox, centers[i][1] - oy);
      if (d < 7 * S) heat[i] = Math.max(heat[i], 1 - (d / (7 * S)) * 0.75);
    }
  };

  return {
    update(t, dt) {
      excite = Math.max(0, excite - dt * 0.5);
      if (t > cascadeAt) {
        cascade(Math.floor(Math.random() * cellCount));
        cascadeAt = t + 5 + Math.random() * 5;
      }
      const breathe = radio ? 0.35 : 0.2;
      for (let i = 0; i < cellCount; i += 1) {
        if (heat[i] > 0.004) heat[i] = Math.max(0, heat[i] - dt * 0.5);
        const [cx, cy] = centers[i];
        const ambient = 0.05 + 0.035 * (1 + Math.sin(t * 0.12 + cx * 0.18 + cy * 0.14)) * (1 + breathe * Math.sin(t * 0.3 + cx * 0.05));
        const glow = ambient + heat[i] * 0.24 + excite * 0.04;
        const r = glow * (1 + heat[i] * 0.9);
        const gc = glow * 0.92;
        const b = glow * 0.78;
        for (let v = 0; v < 12; v += 1) {
          const o = (i * 12 + v) * 3;
          cols[o] = r;
          cols[o + 1] = gc;
          cols[o + 2] = b;
        }
      }
      colorAttr.needsUpdate = true;
    },
    onPulse(x, y) {
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < cellCount; i += 1) {
        const d = Math.hypot(centers[i][0] - x, centers[i][1] - y);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      cascade(best);
    },
    onExcite() {
      excite = Math.min(0.7, excite + 0.2);
    },
    onBlock() {
      for (let i = 0; i < cellCount; i += 1) heat[i] = Math.max(heat[i], 0.75);
    },
    onRadio(on) {
      radio = on;
    },
    dispose() {
      teardown(ctx, g, res);
    },
  };
}

// ── 3 · GYROSCOPE ─────────────────────────────────────────────────────
function makeGyro(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  const res: Array<{ dispose(): void }> = [];
  g.position.set(0, -1, 0);

  const rings: Array<{ pivot: ThreeNS.Group; speed: number; mat: ThreeNS.LineBasicMaterial; sats: ThreeNS.Points; satAngle: number; satR: number }> = [];
  const radii = [10, 13.5, 17];
  radii.forEach((radius, index) => {
    const pts: ThreeNS.Vector3[] = [];
    for (let i = 0; i <= 160; i += 1) {
      const a = (i / 160) * Math.PI * 2;
      pts.push(new T.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    const geo = new T.BufferGeometry().setFromPoints(pts);
    const mat = new T.LineBasicMaterial({ color: index === 1 ? EMBER : 0xf2f0ea, transparent: true, opacity: index === 1 ? 0.4 : 0.2 });
    const pivot = new T.Group();
    pivot.rotation.set(Math.PI * (0.32 + index * 0.16), index * 0.9, index * 0.4);
    pivot.add(new T.LineLoop(geo, mat));
    const satGeo = new T.BufferGeometry();
    satGeo.setAttribute("position", new T.BufferAttribute(new Float32Array([radius, 0, 0]), 3));
    const satMat = new T.PointsMaterial({ color: HOT, size: 0.24, transparent: true, opacity: 0.9, depthWrite: false });
    const sats = new T.Points(satGeo, satMat);
    pivot.add(sats);
    g.add(pivot);
    res.push(geo, mat, satGeo, satMat);
    rings.push({ pivot, speed: (0.05 + index * 0.022) * (index % 2 ? -1 : 1), mat, sats, satAngle: Math.random() * 6, satR: radius });
  });

  let flash = 0;

  return {
    update(t, dt) {
      flash = Math.max(0, flash - dt * 0.6);
      for (const [index, ring] of rings.entries()) {
        ring.pivot.rotation.z += dt * ring.speed * (1 + flash * 2.5);
        ring.satAngle += dt * (0.14 + index * 0.05);
        const attr = ring.sats.geometry.getAttribute("position") as ThreeNS.BufferAttribute;
        attr.setXYZ(0, Math.cos(ring.satAngle) * ring.satR, Math.sin(ring.satAngle) * ring.satR, 0);
        attr.needsUpdate = true;
        ring.mat.opacity = (rings.indexOf(ring) === 1 ? 0.4 : 0.2) + flash * 0.3;
      }
    },
    onBlock() {
      flash = 1;
    },
    onExcite() {
      flash = Math.min(1, flash + 0.2);
    },
    dispose() {
      teardown(ctx, g, res);
    },
  };
}

// ── 4 · MYCELIUM ──────────────────────────────────────────────────────
function makeMycelium(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  const res: Array<{ dispose(): void }> = [];
  const MAX_SEGS = 5200;
  const positions = new Float32Array(MAX_SEGS * 6);
  const colors = new Float32Array(MAX_SEGS * 6);
  const born = new Float32Array(MAX_SEGS);
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(positions, 3));
  geo.setAttribute("color", new T.BufferAttribute(colors, 3));
  geo.setDrawRange(0, 0);
  res.push(geo);
  const mat = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1, depthWrite: false });
  res.push(mat);
  g.add(new T.LineSegments(geo, mat));

  type Walker = { x: number; y: number; angle: number };
  const walkers: Walker[] = [];
  const MAX_WALKERS = 14;
  const W = 17;
  const H = 10.5;
  const spawnWalker = (x?: number, y?: number) => {
    if (walkers.length >= MAX_WALKERS) return;
    if (x === undefined || y === undefined) {
      x = (Math.random() - 0.5) * 2 * (W - 2);
      y = (Math.random() - 0.5) * 2 * (H - 2);
    }
    walkers.push({ x, y, angle: Math.random() * Math.PI * 2 });
  };
  for (let i = 0; i < 9; i += 1) spawnWalker();

  const tipGeo = new T.BufferGeometry();
  tipGeo.setAttribute("position", new T.BufferAttribute(new Float32Array(MAX_WALKERS * 3).fill(999), 3));
  const tipMat = new T.PointsMaterial({ color: HOT, size: 0.26, transparent: true, opacity: 0.9, depthWrite: false });
  res.push(tipGeo, tipMat);
  g.add(new T.Points(tipGeo, tipMat));

  let head = 0;
  let total = 0;
  let stepAt = 0;
  let flash = 0;
  const posAttr = geo.getAttribute("position") as ThreeNS.BufferAttribute;
  const colAttr = geo.getAttribute("color") as ThreeNS.BufferAttribute;
  const tipAttr = tipGeo.getAttribute("position") as ThreeNS.BufferAttribute;

  const stepWalkers = (st: number) => {
    for (let w = walkers.length - 1; w >= 0; w -= 1) {
      const walker = walkers[w];
      const step = 0.3;
      const nx = walker.x + Math.cos(walker.angle) * step;
      const ny = walker.y + Math.sin(walker.angle) * step;
      const o = head * 6;
      positions[o] = walker.x;
      positions[o + 1] = walker.y;
      positions[o + 3] = nx;
      positions[o + 4] = ny;
      born[head] = st;
      head = (head + 1) % MAX_SEGS;
      total = Math.min(total + 1, MAX_SEGS);
      walker.x = nx;
      walker.y = ny;
      walker.angle += (Math.random() - 0.5) * 0.6;
      if (Math.random() < 0.045) spawnWalker(walker.x, walker.y);
      if (Math.abs(walker.x) > W || Math.abs(walker.y) > H || Math.random() < 0.006) {
        walkers.splice(w, 1);
      }
    }
    while (walkers.length < 7) spawnWalker();
  };

  // Pre-grow an established network so the field is never empty.
  for (let st = -70; st < 0; st += 0.09) stepWalkers(st);

  return {
    update(t, dt) {
      flash = Math.max(0, flash - dt * 0.7);
      if (t > stepAt) {
        stepAt = t + 0.09;
        stepWalkers(t);
        posAttr.needsUpdate = true;
        geo.setDrawRange(0, total * 2);
      }
      for (let i = 0; i < total; i += 1) {
        const age = t - born[i];
        const a = Math.max(0.05, 0.42 * Math.exp(-age / 38)) * (1 + flash * 1.6);
        const o = i * 6;
        colors[o] = a * 1.05;
        colors[o + 1] = a * 0.88;
        colors[o + 2] = a * 0.7;
        colors[o + 3] = a * 1.05;
        colors[o + 4] = a * 0.88;
        colors[o + 5] = a * 0.7;
      }
      colAttr.needsUpdate = true;
      for (let w = 0; w < MAX_WALKERS; w += 1) {
        if (w < walkers.length) tipAttr.setXYZ(w, walkers[w].x, walkers[w].y, 0.1);
        else tipAttr.setXYZ(w, 999, 999, 999);
      }
      tipAttr.needsUpdate = true;
    },
    onPulse(x, y) {
      spawnWalker(x, y);
      spawnWalker(x, y);
    },
    onBlock() {
      flash = 1;
    },
    onExcite() {
      flash = Math.min(1, flash + 0.15);
    },
    dispose() {
      teardown(ctx, g, res);
    },
  };
}

// ── 5 · SILK FIELD ────────────────────────────────────────────────────
function makeSilk(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  const res: Array<{ dispose(): void }> = [];
  const COUNT = 2300;
  const homes = new Float32Array(COUNT * 2);
  const phases = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i += 1) {
    homes[i * 2] = (Math.random() - 0.5) * 56;
    homes[i * 2 + 1] = (Math.random() - 0.5) * 28;
    phases[i] = Math.random() * Math.PI * 2;
  }
  const positions = new Float32Array(COUNT * 6);
  const colors = new Float32Array(COUNT * 6);
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(positions, 3));
  geo.setAttribute("color", new T.BufferAttribute(colors, 3));
  res.push(geo);
  const mat = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1, depthWrite: false });
  res.push(mat);
  g.add(new T.LineSegments(geo, mat));

  let excite = 0;
  const posAttr = geo.getAttribute("position") as ThreeNS.BufferAttribute;
  const colAttr = geo.getAttribute("color") as ThreeNS.BufferAttribute;
  const field = (x: number, y: number, t: number) =>
    Math.sin(x * 0.11 + t * 0.05) + Math.cos(y * 0.14 - t * 0.045) + Math.sin((x + y) * 0.055 + t * 0.03);

  return {
    update(t, dt) {
      excite = Math.max(0, excite - dt * 0.5);
      for (let i = 0; i < COUNT; i += 1) {
        const x = homes[i * 2];
        const y = homes[i * 2 + 1];
        const angle = field(x, y, t) * 1.35;
        const half = 0.5;
        const dx = Math.cos(angle) * half;
        const dy = Math.sin(angle) * half;
        const o = i * 6;
        positions[o] = x - dx;
        positions[o + 1] = y - dy;
        positions[o + 3] = x + dx;
        positions[o + 4] = y + dy;
        const shimmer = 0.075 + 0.035 * Math.sin(t * 0.32 + phases[i]) + excite * 0.05;
        colors[o] = shimmer * 1.05;
        colors[o + 1] = shimmer * 0.9;
        colors[o + 2] = shimmer * 0.75;
        colors[o + 3] = shimmer * 0.6;
        colors[o + 4] = shimmer * 0.52;
        colors[o + 5] = shimmer * 0.42;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    },
    onExcite() {
      excite = Math.min(0.8, excite + 0.2);
    },
    onBlock() {
      excite = Math.min(1, excite + 0.6);
    },
    dispose() {
      teardown(ctx, g, res);
    },
  };
}

// ── 6 · CONSENSUS CHOIR ───────────────────────────────────────────────
function makeChoir(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  g.position.set(0, -1.5, 0);
  const res: Array<{ dispose(): void }> = [];
  const ARCS = 42;
  const arcs: Array<{ pivot: ThreeNS.Group; speed: number; base: number }> = [];
  for (let i = 0; i < ARCS; i += 1) {
    const radius = 3.5 + (i / ARCS) * 12.5;
    const span = (Math.PI / 180) * (18 + Math.random() * 48);
    const pts: ThreeNS.Vector3[] = [];
    for (let s = 0; s <= 26; s += 1) {
      const a = -span / 2 + (s / 26) * span;
      pts.push(new T.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    const geo = new T.BufferGeometry().setFromPoints(pts);
    const ember = Math.random() < 0.18;
    const mat = new T.LineBasicMaterial({ color: ember ? EMBER : 0xf2f0ea, transparent: true, opacity: ember ? 0.45 : 0.22 });
    const pivot = new T.Group();
    pivot.rotation.z = Math.random() * Math.PI * 2;
    pivot.add(new T.Line(geo, mat));
    g.add(pivot);
    res.push(geo, mat);
    arcs.push({ pivot, speed: (0.05 + Math.random() * 0.08) * (i % 2 ? -1 : 1), base: pivot.rotation.z });
  }
  let alignStart = -10;

  return {
    update(t, dt) {
      const aligning = t - alignStart < 2.6;
      for (const arc of arcs) {
        if (aligning) {
          const f = Math.min(1, (t - alignStart) / 1.1);
          const target = Math.PI / 2;
          const twoPi = Math.PI * 2;
          const delta = (target - (arc.pivot.rotation.z % twoPi) + Math.PI * 3) % twoPi - Math.PI;
          arc.pivot.rotation.z += delta * f * dt * 4;
        } else {
          arc.pivot.rotation.z += dt * arc.speed;
        }
      }
    },
    onBlock() {
      alignStart = performance.now() / 1000;
    },
    onExcite() {
      for (const arc of arcs) arc.pivot.rotation.z += arc.speed * 0.25;
    },
    dispose() {
      teardown(ctx, g, res);
    },
  };
}

// ── 7 · BACKBONE ──────────────────────────────────────────────────────
function makeBackbone(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  g.rotation.x = -0.45;
  g.position.set(0, -7, 0);
  const res: Array<{ dispose(): void }> = [];
  const verts: number[] = [];
  for (let x = -48; x <= 48; x += 3) verts.push(x, 0, 6, x, 0, -140);
  for (let z = 6; z >= -140; z -= 6) verts.push(-48, 0, z, 48, 0, z);
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(new Float32Array(verts), 3));
  res.push(geo);
  const mat = new T.LineBasicMaterial({ color: 0xf2f0ea, transparent: true, opacity: 0.095 });
  res.push(mat);
  g.add(new T.LineSegments(geo, mat));

  type Train = { alongX: boolean; fixed: number; pos: number; speed: number; line: ThreeNS.Line; geo: ThreeNS.BufferGeometry; mat: ThreeNS.LineBasicMaterial };
  const trains: Train[] = [];
  const spawnTrain = () => {
    const alongX = Math.random() < 0.35;
    const tgeo = new T.BufferGeometry();
    tgeo.setAttribute("position", new T.BufferAttribute(new Float32Array(6), 3));
    const tmat = new T.LineBasicMaterial({ color: HOT, transparent: true, opacity: 0.65 });
    const line = new T.Line(tgeo, tmat);
    g.add(line);
    res.push(tgeo, tmat);
    trains.push({
      alongX,
      fixed: alongX ? -(6 + Math.random() * 120) : Math.round(((Math.random() - 0.5) * 96) / 3) * 3,
      pos: alongX ? -48 : 6,
      speed: 14 + Math.random() * 10,
      line,
      geo: tgeo,
      mat: tmat,
    });
  };
  for (let i = 0; i < 3; i += 1) spawnTrain();
  let flash = 0;

  return {
    update(t, dt) {
      flash = Math.max(0, flash - dt * 0.5);
      mat.opacity = 0.095 + flash * 0.08;
      for (const train of trains) {
        train.pos += dt * train.speed * (train.alongX ? 1 : -1);
        const len = 3.2;
        const attr = train.geo.getAttribute("position") as ThreeNS.BufferAttribute;
        if (train.alongX) {
          attr.setXYZ(0, train.pos, 0.02, train.fixed);
          attr.setXYZ(1, train.pos + len, 0.02, train.fixed);
          if (train.pos > 50) {
            train.pos = -48;
            train.fixed = -(6 + Math.random() * 120);
          }
        } else {
          attr.setXYZ(0, train.fixed, 0.02, train.pos);
          attr.setXYZ(1, train.fixed, 0.02, train.pos - len);
          if (train.pos < -140) {
            train.pos = 6;
            train.fixed = Math.round(((Math.random() - 0.5) * 96) / 3) * 3;
          }
        }
        attr.needsUpdate = true;
      }
    },
    onBlock() {
      flash = 1;
    },
    onExcite() {
      flash = Math.min(1, flash + 0.2);
    },
    dispose() {
      teardown(ctx, g, res);
    },
  };
}

// ── 8 · SERVER CITY ───────────────────────────────────────────────────
function makeCity(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  g.rotation.x = -0.62;
  g.rotation.z = 0.5;
  g.position.set(0, -6, -4);
  const res: Array<{ dispose(): void }> = [];
  const COLS = 34;
  const ROWS = 20;
  const total = COLS * ROWS;
  const box = new T.BoxGeometry(0.72, 1, 0.72);
  res.push(box);
  const boxMat = new T.MeshBasicMaterial({ color: 0x1d1b18 });
  res.push(boxMat);
  const mesh = new T.InstancedMesh(box, boxMat, total);
  const dummy = new T.Object3D();
  const ledPositions = new Float32Array(total * 3);
  const ledColors = new Float32Array(total * 3);
  const ledPhase = new Float32Array(total);
  let index = 0;
  for (let c = 0; c < COLS; c += 1) {
    for (let r = 0; r < ROWS; r += 1) {
      const h = 0.35 + Math.random() * 1.9;
      const x = (c - COLS / 2) * 1.15;
      const y = (r - ROWS / 2) * 1.15;
      dummy.position.set(x, y, h / 2);
      dummy.rotation.x = Math.PI / 2;
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      ledPositions.set([x + 0.22, y + 0.22, h + 0.06], index * 3);
      ledPhase[index] = Math.random() * Math.PI * 2;
      index += 1;
    }
  }
  g.add(mesh);
  res.push(mesh);
  const ledGeo = new T.BufferGeometry();
  ledGeo.setAttribute("position", new T.BufferAttribute(ledPositions, 3));
  ledGeo.setAttribute("color", new T.BufferAttribute(ledColors, 3));
  res.push(ledGeo);
  const ledMat = new T.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
  res.push(ledMat);
  g.add(new T.Points(ledGeo, ledMat));

  const heat = new Float32Array(total);
  let aisleAt = 5;
  let flash = 0;
  const colAttr = ledGeo.getAttribute("color") as ThreeNS.BufferAttribute;

  return {
    update(t, dt) {
      flash = Math.max(0, flash - dt * 0.7);
      if (t > aisleAt) {
        const col = Math.floor(Math.random() * COLS);
        for (let r = 0; r < ROWS; r += 1) heat[col * ROWS + r] = 1 - r / ROWS;
        aisleAt = t + 6 + Math.random() * 6;
      }
      for (let i = 0; i < total; i += 1) {
        if (heat[i] > 0.004) heat[i] = Math.max(0, heat[i] - dt * 0.45);
        const shimmer = 0.17 + 0.12 * (0.5 + 0.5 * Math.sin(t * 0.7 + ledPhase[i] * 3));
        const glow = Math.min(1, shimmer + heat[i] * 0.9 + flash * 0.5);
        const emberish = ledPhase[i] % (Math.PI * 2) < 1.1;
        colAttr.setXYZ(i, glow * (emberish ? 1.1 : 0.75), glow * (emberish ? 0.68 : 0.78), glow * (emberish ? 0.22 : 0.68));
      }
      colAttr.needsUpdate = true;
    },
    onBlock() {
      flash = 1;
    },
    onExcite() {
      flash = Math.min(1, flash + 0.15);
    },
    dispose() {
      teardown(ctx, g, res);
    },
  };
}

// ── 9 · STAR CHART ────────────────────────────────────────────────────
function makeChart(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  g.position.set(0, -1, 0);
  const res: Array<{ dispose(): void }> = [];

  const circle = (radius: number, opacity: number) => {
    const pts: ThreeNS.Vector3[] = [];
    for (let i = 0; i <= 180; i += 1) {
      const a = (i / 180) * Math.PI * 2;
      pts.push(new T.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    const geo = new T.BufferGeometry().setFromPoints(pts);
    const mat = new T.LineBasicMaterial({ color: 0xf2f0ea, transparent: true, opacity });
    res.push(geo, mat);
    g.add(new T.LineLoop(geo, mat));
    return mat;
  };
  circle(4.2, 0.13);
  circle(7, 0.1);
  const midMat = circle(9.8, 0.16);
  circle(13, 0.09);
  const outerMat = circle(16.2, 0.12);

  const tickVerts: number[] = [];
  for (let d = 0; d < 360; d += 4) {
    const a = (d * Math.PI) / 180;
    const inner = d % 20 === 0 ? 15.4 : 15.85;
    tickVerts.push(Math.cos(a) * inner, Math.sin(a) * inner, 0, Math.cos(a) * 16.2, Math.sin(a) * 16.2, 0);
  }
  const tickGeo = new T.BufferGeometry();
  tickGeo.setAttribute("position", new T.BufferAttribute(new Float32Array(tickVerts), 3));
  const tickMat = new T.LineBasicMaterial({ color: 0xf2f0ea, transparent: true, opacity: 0.18 });
  res.push(tickGeo, tickMat);
  g.add(new T.LineSegments(tickGeo, tickMat));

  const BODIES = 7;
  const bodyGeo = new T.BufferGeometry();
  const bodyPos = new Float32Array(BODIES * 3);
  const bodyAngles: Array<{ r: number; a: number; s: number }> = [];
  for (let i = 0; i < BODIES; i += 1) {
    const r = 4.2 + Math.random() * 12;
    const a = Math.random() * Math.PI * 2;
    bodyAngles.push({ r, a, s: 0.008 + Math.random() * 0.02 });
    bodyPos.set([Math.cos(a) * r, Math.sin(a) * r, 0], i * 3);
  }
  bodyGeo.setAttribute("position", new T.BufferAttribute(bodyPos, 3));
  const bodyMat = new T.PointsMaterial({ color: HOT, size: 0.26, transparent: true, opacity: 0.85, depthWrite: false });
  res.push(bodyGeo, bodyMat);
  g.add(new T.Points(bodyGeo, bodyMat));

  let starAt = 6;
  let star: { line: ThreeNS.Line; geo: ThreeNS.BufferGeometry; mat: ThreeNS.LineBasicMaterial; start: number; from: ThreeNS.Vector3; to: ThreeNS.Vector3 } | null = null;
  let flash = 0;
  const bodyAttr = bodyGeo.getAttribute("position") as ThreeNS.BufferAttribute;

  return {
    update(t, dt) {
      g.rotation.z += dt * 0.006;
      flash = Math.max(0, flash - dt * 0.6);
      outerMat.opacity = 0.12 + flash * 0.24;
      midMat.opacity = 0.16 + flash * 0.12;
      for (let i = 0; i < BODIES; i += 1) {
        bodyAngles[i].a += dt * bodyAngles[i].s;
        bodyAttr.setXYZ(i, Math.cos(bodyAngles[i].a) * bodyAngles[i].r, Math.sin(bodyAngles[i].a) * bodyAngles[i].r, 0);
      }
      bodyAttr.needsUpdate = true;
      if (t > starAt && !star) {
        const a1 = Math.random() * Math.PI * 2;
        const from = new T.Vector3(Math.cos(a1) * 22, Math.sin(a1) * 22, 0);
        const to = from.clone().multiplyScalar(-1).add(new T.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, 0));
        const sgeo = new T.BufferGeometry();
        sgeo.setAttribute("position", new T.BufferAttribute(new Float32Array(6), 3));
        const smat = new T.LineBasicMaterial({ color: HOT, transparent: true, opacity: 0.7 });
        const line = new T.Line(sgeo, smat);
        g.add(line);
        star = { line, geo: sgeo, mat: smat, start: t, from, to };
        starAt = t + 7 + Math.random() * 6;
      }
      if (star) {
        const age = (t - star.start) / 1.5;
        if (age >= 1) {
          g.remove(star.line);
          star.geo.dispose();
          star.mat.dispose();
          star = null;
        } else {
          const head = star.from.clone().lerp(star.to, age);
          const tail = star.from.clone().lerp(star.to, Math.max(0, age - 0.07));
          const attr = star.geo.getAttribute("position") as ThreeNS.BufferAttribute;
          attr.setXYZ(0, tail.x, tail.y, 0);
          attr.setXYZ(1, head.x, head.y, 0);
          attr.needsUpdate = true;
          star.mat.opacity = 0.7 * (1 - age);
        }
      }
    },
    onBlock() {
      flash = 1;
    },
    onExcite() {
      flash = Math.min(1, flash + 0.2);
    },
    dispose() {
      if (star) {
        star.geo.dispose();
        star.mat.dispose();
      }
      teardown(ctx, g, res);
    },
  };
}

// ── 10 · SETTLEMENT SNOW ──────────────────────────────────────────────
function makeSnow(ctx: SceneContext): SceneHandle {
  const { three: T } = ctx;
  const g = group(ctx);
  const res: Array<{ dispose(): void }> = [];
  const COUNT = 240;
  const FLOOR = -12.5;
  const positions = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);
  const sway = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 54;
    positions[i * 3 + 1] = FLOOR + Math.random() * 27;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    speeds[i] = 0.25 + Math.random() * 0.45;
    sway[i] = Math.random() * Math.PI * 2;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(positions, 3));
  res.push(geo);
  const mat = new T.PointsMaterial({ color: 0xcdc9c0, size: 0.17, transparent: true, opacity: 0.52, depthWrite: false });
  res.push(mat);
  g.add(new T.Points(geo, mat));

  const ledgerGeo = new T.BufferGeometry();
  ledgerGeo.setAttribute("position", new T.BufferAttribute(new Float32Array([-27, FLOOR, 0, 27, FLOOR, 0]), 3));
  const ledgerMat = new T.LineBasicMaterial({ color: HOT, transparent: true, opacity: 0.24 });
  res.push(ledgerGeo, ledgerMat);
  g.add(new T.LineSegments(ledgerGeo, ledgerMat));

  type Settle = { x: number; start: number };
  const settles: Settle[] = [];
  const flashGeo = new T.BufferGeometry();
  flashGeo.setAttribute("position", new T.BufferAttribute(new Float32Array(8 * 6), 3));
  flashGeo.setDrawRange(0, 0);
  const flashMat = new T.LineBasicMaterial({ color: HOT, transparent: true, opacity: 0.65 });
  res.push(flashGeo, flashMat);
  g.add(new T.LineSegments(flashGeo, flashMat));

  let sweep: { start: number } | null = null;
  let excite = 0;
  const posAttr = geo.getAttribute("position") as ThreeNS.BufferAttribute;
  const flashAttr = flashGeo.getAttribute("position") as ThreeNS.BufferAttribute;

  return {
    update(t, dt) {
      excite = Math.max(0, excite - dt * 0.5);
      for (let i = 0; i < COUNT; i += 1) {
        let y = positions[i * 3 + 1] - dt * speeds[i] * (1 + excite * 1.6);
        const x = positions[i * 3] + Math.sin(t * 0.4 + sway[i]) * dt * 0.35;
        if (y < FLOOR) {
          if (settles.length < 8) settles.push({ x, start: t });
          y = FLOOR + 26 + Math.random() * 2;
        }
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
      }
      posAttr.needsUpdate = true;

      let used = 0;
      for (let s = settles.length - 1; s >= 0; s -= 1) {
        const age = t - settles[s].start;
        if (age > 1.2) {
          settles.splice(s, 1);
          continue;
        }
        const half = 0.7 + age * 1.6;
        flashAttr.setXYZ(used * 2, settles[s].x - half, FLOOR, 0.01);
        flashAttr.setXYZ(used * 2 + 1, settles[s].x + half, FLOOR, 0.01);
        used += 1;
      }
      flashMat.opacity = 0.5;
      if (sweep) {
        const age = (t - sweep.start) / 1.6;
        if (age >= 1) sweep = null;
        else if (used < 8) {
          const x = -27 + age * 54;
          flashAttr.setXYZ(used * 2, x - 2.4, FLOOR, 0.01);
          flashAttr.setXYZ(used * 2 + 1, x + 2.4, FLOOR, 0.01);
          used += 1;
        }
      }
      flashGeo.setDrawRange(0, used * 2);
      flashAttr.needsUpdate = true;
      ledgerMat.opacity = 0.24 + excite * 0.12;
    },
    onBlock() {
      sweep = { start: performance.now() / 1000 };
    },
    onExcite() {
      excite = Math.min(0.8, excite + 0.25);
    },
    dispose() {
      teardown(ctx, g, res);
    },
  };
}

export const WALLPAPERS: Record<WallpaperId, { make: (ctx: SceneContext) => SceneHandle }> = {
  globe: { make: makeGlobe },
  hive: { make: makeHive },
  gyro: { make: makeGyro },
  mycelium: { make: makeMycelium },
  silk: { make: makeSilk },
  choir: { make: makeChoir },
  backbone: { make: makeBackbone },
  city: { make: makeCity },
  chart: { make: makeChart },
  snow: { make: makeSnow },
};
