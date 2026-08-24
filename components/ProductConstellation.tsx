"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Locale, localizePath } from "@/lib/i18n";

const CONSTELLATION_COPY = {
  en: {
    eyebrow: "Interactive product map",
    title: "Four products. One connected range.",
    navigation: "Explore MaydaLabs projects",
    projects: [
      { name: "HodlStay", status: "Client project · Live", path: "/case-studies/hodlstay", image: "/work/hodlstay-2026-08-home.png", alt: "HodlStay marketplace homepage", accent: "#f7931a" },
      { name: "Satoshi Gazette", status: "MaydaLabs product · Live", path: "/case-studies/satoshi-gazette", image: "/work/satoshi-gazette-2026-08-home.png", alt: "Satoshi Gazette Bitcoin newsroom homepage", accent: "#f2f0ea" },
      { name: "Mortal Vault", status: "Private alpha · Unaudited", path: "/case-studies/mortal-vault", image: null, alt: "", accent: "#f39a36" },
      { name: "Sofra", status: "Private Phase 1", path: "/case-studies/sofra", image: null, alt: "", accent: "#d97555" },
    ],
  },
  tr: {
    eyebrow: "Etkileşimli ürün haritası",
    title: "Dört ürün. Birbirine bağlı tek kapsam.",
    navigation: "MaydaLabs projelerini keşfedin",
    projects: [
      { name: "HodlStay", status: "Müşteri projesi · Canlı", path: "/case-studies/hodlstay", image: "/work/hodlstay-2026-08-home.png", alt: "HodlStay pazar yeri ana sayfası", accent: "#f7931a" },
      { name: "Satoshi Gazette", status: "MaydaLabs ürünü · Canlı", path: "/case-studies/satoshi-gazette", image: "/work/satoshi-gazette-2026-08-home.png", alt: "Satoshi Gazette Bitcoin haber merkezi ana sayfası", accent: "#f2f0ea" },
      { name: "Mortal Vault", status: "Özel alpha · Denetlenmedi", path: "/case-studies/mortal-vault", image: null, alt: "", accent: "#f39a36" },
      { name: "Sofra", status: "Özel Phase 1", path: "/case-studies/sofra", image: null, alt: "", accent: "#d97555" },
    ],
  },
  fr: {
    eyebrow: "Carte produit interactive",
    title: "Quatre produits. Un champ connecté.",
    navigation: "Explorer les projets MaydaLabs",
    projects: [
      { name: "HodlStay", status: "Projet client · En ligne", path: "/case-studies/hodlstay", image: "/work/hodlstay-2026-08-home.png", alt: "Accueil de la marketplace HodlStay", accent: "#f7931a" },
      { name: "Satoshi Gazette", status: "Produit MaydaLabs · En ligne", path: "/case-studies/satoshi-gazette", image: "/work/satoshi-gazette-2026-08-home.png", alt: "Accueil de la rédaction Bitcoin Satoshi Gazette", accent: "#f2f0ea" },
      { name: "Mortal Vault", status: "Alpha privée · Non auditée", path: "/case-studies/mortal-vault", image: null, alt: "", accent: "#f39a36" },
      { name: "Sofra", status: "Phase 1 privée", path: "/case-studies/sofra", image: null, alt: "", accent: "#d97555" },
    ],
  },
} as const;

type ThreeModule = typeof import("three");

function createPrivateTexture(
  THREE: ThreeModule,
  name: string,
  status: string,
  accent: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 600;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#080909");
  gradient.addColorStop(1, name === "Sofra" ? "#1b120e" : "#11100d");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(255,255,255,.08)";
  context.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 64) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  context.strokeStyle = accent;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(480, 280, 126, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 0.45;
  context.beginPath();
  context.arc(480, 280, 194, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;

  for (let index = 0; index < 4; index += 1) {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    const x = 480 + Math.cos(angle) * 160;
    const y = 280 + Math.sin(angle) * 160;
    context.fillStyle = accent;
    context.beginPath();
    context.arc(x, y, 10, 0, Math.PI * 2);
    context.fill();
  }

  if (typeof context.roundRect === "function") {
    context.strokeStyle = "rgba(242,240,234,.24)";
    context.lineWidth = 2;
    context.setLineDash([8, 8]);
    context.beginPath();
    context.roundRect(54, 58, 210, 128, 12);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = accent;
    context.globalAlpha = 0.55;
    context.beginPath();
    context.roundRect(80, 84, 104, 14, 7);
    context.fill();
    context.globalAlpha = 0.14;
    context.fillStyle = "#f2f0ea";
    context.beginPath();
    context.roundRect(80, 112, 148, 12, 6);
    context.fill();
    context.beginPath();
    context.roundRect(80, 136, 116, 12, 6);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = "rgba(242,240,234,.4)";
    context.font = "500 17px monospace";
    context.fillText("WIP", 80, 172);
  }

  context.fillStyle = "#f2f0ea";
  context.font = "600 54px Arial";
  context.fillText(name, 54, 500);
  context.fillStyle = "rgba(242,240,234,.52)";
  context.font = "500 19px monospace";
  context.fillText(status.toUpperCase(), 56, 542);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function ProductConstellation({ locale }: { locale: Locale }) {
  const copy = CONSTELLATION_COPY[locale];
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(0);
  const [activeProject, setActiveProjectState] = useState(0);
  const [mode, setMode] = useState<"loading" | "ready" | "fallback">("loading");
  const projects = useMemo(
    () => copy.projects.map((project) => ({ ...project, href: localizePath(project.path, locale) })),
    [copy.projects, locale],
  );

  const setActiveProject = (index: number) => {
    activeRef.current = index;
    setActiveProjectState(index);
  };

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopCanvas = window.matchMedia("(min-width: 760px)");
    if (reducedMotion.matches || !desktopCanvas.matches) {
      setMode("fallback");
      return;
    }

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

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x090909, 0.055);
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
        camera.position.set(0, 0, 8.6);

        const world = new THREE.Group();
        scene.add(world);

        scene.add(new THREE.AmbientLight(0xffffff, 1.25));
        const signalLight = new THREE.PointLight(0xf7931a, 24, 12, 2);
        signalLight.position.set(0.8, 1.4, 3.2);
        scene.add(signalLight);
        const coolLight = new THREE.PointLight(0xd7ff68, 7, 10, 2);
        coolLight.position.set(-3, -1.5, 2);
        scene.add(coolLight);

        const resources: Array<{ dispose: () => void }> = [];
        const track = <T extends { dispose: () => void }>(resource: T) => {
          resources.push(resource);
          return resource;
        };

        const starPositions = new Float32Array(180 * 3);
        for (let index = 0; index < starPositions.length; index += 3) {
          starPositions[index] = (Math.random() - 0.5) * 12;
          starPositions[index + 1] = (Math.random() - 0.5) * 8;
          starPositions[index + 2] = -2 - Math.random() * 8;
        }
        const starsGeometry = track(new THREE.BufferGeometry());
        starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        const starsMaterial = track(new THREE.PointsMaterial({ color: 0xf2f0ea, size: 0.018, transparent: true, opacity: 0.52 }));
        world.add(new THREE.Points(starsGeometry, starsMaterial));

        const coreGeometry = track(new THREE.IcosahedronGeometry(0.5, 2));
        const coreMaterial = track(new THREE.MeshPhysicalMaterial({
          color: 0xf7931a,
          emissive: 0x5c2500,
          emissiveIntensity: 0.72,
          metalness: 0.48,
          roughness: 0.18,
          clearcoat: 1,
        }));
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.z = 0.65;
        world.add(core);

        const ringMaterial = track(new THREE.MeshBasicMaterial({ color: 0xf7931a, transparent: true, opacity: 0.3 }));
        const rings = [1.03, 1.36, 1.72].map((radius, index) => {
          const geometry = track(new THREE.TorusGeometry(radius, 0.008, 8, 96));
          const ring = new THREE.Mesh(geometry, ringMaterial);
          ring.rotation.x = Math.PI * (0.22 + index * 0.14);
          ring.rotation.y = index * 0.72;
          world.add(ring);
          return ring;
        });

        const cardPositions = [
          new THREE.Vector3(-2.25, 1.42, -0.12),
          new THREE.Vector3(2.28, 1.25, -0.5),
          new THREE.Vector3(-2.12, -1.48, -0.72),
          new THREE.Vector3(2.2, -1.4, -0.08),
        ];
        const cardRotations = [
          new THREE.Euler(-0.05, 0.26, -0.045),
          new THREE.Euler(0.04, -0.28, 0.04),
          new THREE.Euler(0.08, 0.22, 0.035),
          new THREE.Euler(-0.06, -0.24, -0.03),
        ];
        const interactiveCards: import("three").Mesh[] = [];
        const cardGroups: import("three").Group[] = [];
        const textureLoader = new THREE.TextureLoader();

        projects.forEach((project, index) => {
          const group = new THREE.Group();
          group.position.copy(cardPositions[index]);
          group.rotation.copy(cardRotations[index]);
          world.add(group);
          cardGroups.push(group);

          const frameGeometry = track(new THREE.PlaneGeometry(2.26, 1.46));
          const frameMaterial = track(new THREE.MeshBasicMaterial({ color: project.accent, transparent: true, opacity: 0.58 }));
          const frame = new THREE.Mesh(frameGeometry, frameMaterial);
          frame.position.z = -0.025;
          group.add(frame);

          const cardGeometry = track(new THREE.PlaneGeometry(2.2, 1.4));
          const privateTexture = project.image
            ? null
            : createPrivateTexture(THREE, project.name, project.status, project.accent);
          if (privateTexture) resources.push(privateTexture);
          const cardMaterial = track(new THREE.MeshBasicMaterial({
            color: project.image ? 0x1a1a18 : 0xffffff,
            map: privateTexture,
            toneMapped: false,
          }));
          const card = new THREE.Mesh(cardGeometry, cardMaterial);
          card.userData.projectIndex = index;
          group.add(card);
          interactiveCards.push(card);

          if (project.image) {
            textureLoader.load(
              project.image,
              (texture) => {
                if (cancelled) {
                  texture.dispose();
                  return;
                }
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
                resources.push(texture);
                cardMaterial.map = texture;
                cardMaterial.color.set(0xffffff);
                cardMaterial.needsUpdate = true;
              },
              undefined,
              () => undefined,
            );
          }
        });

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const pointerTarget = new THREE.Vector2();
        const scaleTarget = new THREE.Vector3();
        let animationFrame = 0;

        const resize = () => {
          const rect = root.getBoundingClientRect();
          const width = Math.max(rect.width, 1);
          const height = Math.max(rect.height, 1);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };

        const projectAtPointer = (event: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          const intersection = raycaster.intersectObjects(interactiveCards, false)[0];
          return intersection ? Number(intersection.object.userData.projectIndex) : -1;
        };

        const onPointerMove = (event: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.34;
          pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.22;
          const index = projectAtPointer(event);
          canvas.style.cursor = index >= 0 ? "pointer" : "grab";
          if (index >= 0 && index !== activeRef.current) setActiveProject(index);
        };

        const onPointerLeave = () => {
          pointerTarget.set(0, 0);
          canvas.style.cursor = "grab";
        };

        const onPointerUp = (event: PointerEvent) => {
          const index = projectAtPointer(event);
          if (index >= 0) window.location.assign(projects[index].href);
        };

        const render = (timestamp: number) => {
          animationFrame = 0;
          if (!visible || cancelled) return;
          const time = timestamp * 0.001;

          world.rotation.y += (pointerTarget.x - world.rotation.y) * 0.035;
          world.rotation.x += (-pointerTarget.y - world.rotation.x) * 0.035;
          core.rotation.x = time * 0.32;
          core.rotation.y = time * 0.46;
          rings.forEach((ring, index) => {
            ring.rotation.z = time * (0.08 + index * 0.035) * (index % 2 ? -1 : 1);
          });
          cardGroups.forEach((group, index) => {
            group.position.y = cardPositions[index].y + Math.sin(time * 0.65 + index * 1.4) * 0.08;
            const targetScale = activeRef.current === index ? 1.075 : 1;
            group.scale.lerp(scaleTarget.setScalar(targetScale), 0.08);
          });

          renderer.render(scene, camera);
          animationFrame = window.requestAnimationFrame(render);
        };

        const startRendering = () => {
          if (!animationFrame && visible) animationFrame = window.requestAnimationFrame(render);
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        resize();
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerleave", onPointerLeave);
        canvas.addEventListener("pointerup", onPointerUp);
        setMode("ready");
        startRendering();

        destroyScene = () => {
          resizeObserver.disconnect();
          canvas.removeEventListener("pointermove", onPointerMove);
          canvas.removeEventListener("pointerleave", onPointerLeave);
          canvas.removeEventListener("pointerup", onPointerUp);
          root.removeEventListener("constellation:visible", startRendering);
          if (animationFrame) window.cancelAnimationFrame(animationFrame);
          resources.forEach((resource) => resource.dispose());
          renderer.dispose();
        };

        root.addEventListener("constellation:visible", startRendering);
      } catch {
        if (!cancelled) setMode("fallback");
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          void initialize();
          root.dispatchEvent(new Event("constellation:visible"));
        }
      },
      { rootMargin: "220px", threshold: 0.02 },
    );
    observer.observe(root);

    return () => {
      cancelled = true;
      observer.disconnect();
      destroyScene?.();
    };
  }, [projects]);

  const active = projects[activeProject];

  return (
    <div ref={rootRef} className={`product-constellation is-${mode}`}>
      <canvas ref={canvasRef} className="product-constellation-canvas" aria-hidden="true" />

      <div className="constellation-fallback" aria-hidden="true">
        {projects.map((project, index) => (
          <div key={project.name} className={`constellation-fallback-card constellation-fallback-card-${index + 1}`}>
            {project.image ? (
              <Image src={project.image} alt="" fill priority sizes="(max-width: 760px) 44vw, 28vw" />
            ) : (
              <div className={`constellation-private-mark constellation-private-mark-${index}`}><span /><i /><b /></div>
            )}
          </div>
        ))}
        <div className="constellation-fallback-core"><span /></div>
      </div>

      <div className="constellation-heading">
        <span>{copy.eyebrow}</span>
        <strong>{copy.title}</strong>
      </div>

      <div className="constellation-active" aria-hidden="true">
        <span>0{activeProject + 1}</span>
        <strong>{active.name}</strong>
        <small>{active.status}</small>
      </div>

      <nav className="constellation-index" aria-label={copy.navigation}>
        {projects.map((project, index) => (
          <Link
            key={project.name}
            href={project.href}
            className={activeProject === index ? "is-active" : ""}
            onMouseEnter={() => setActiveProject(index)}
            onFocus={() => setActiveProject(index)}
          >
            <span>0{index + 1}</span>
            <strong>{project.name}</strong>
          </Link>
        ))}
      </nav>
    </div>
  );
}
