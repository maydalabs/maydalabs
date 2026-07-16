"use client";

import { useEffect, useRef, type ReactNode } from "react";

type HomeExperienceProps = {
  children: ReactNode;
};

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export function HomeExperience({ children }: HomeExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const documentRoot = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealTargets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    let animationFrame = 0;

    documentRoot.classList.add("home-experience-active");
    root.classList.add("is-motion-ready");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12%", threshold: 0.12 },
    );

    for (const target of revealTargets) revealObserver.observe(target);

    const updateMotion = () => {
      animationFrame = 0;

      const rootRect = root.getBoundingClientRect();
      const rootTravel = Math.max(root.offsetHeight - window.innerHeight, 1);
      const pageProgress = clamp(-rootRect.top / rootTravel);
      documentRoot.style.setProperty("--home-progress", pageProgress.toFixed(4));

      const hero = root.querySelector<HTMLElement>(".studio-hero");
      if (hero) {
        const heroRect = hero.getBoundingClientRect();
        const heroProgress = clamp(-heroRect.top / Math.max(heroRect.height, 1));
        hero.style.setProperty("--hero-scroll", heroProgress.toFixed(4));
      }

      for (const project of root.querySelectorAll<HTMLElement>(".project-case")) {
        const rect = project.getBoundingClientRect();
        const progress = clamp((window.innerHeight * 0.92 - rect.top) / (window.innerHeight * 0.68));
        const direction = project.classList.contains("project-case-gazette") ? 1 : -1;

        project.style.setProperty("--case-progress", progress.toFixed(4));
        project.style.setProperty("--case-tilt", (direction * (1 - progress) * 7).toFixed(3));
        project.style.setProperty("--case-lift", ((1 - progress) * 34).toFixed(3));
        project.style.setProperty("--case-scale", (0.94 + progress * 0.06).toFixed(4));
        project.style.setProperty("--screen-drift", (-10 + progress * 10).toFixed(3));
      }
    };

    const requestMotionUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateMotion);
    };

    if (!reducedMotion.matches) {
      updateMotion();
      window.addEventListener("scroll", requestMotionUpdate, { passive: true });
      window.addEventListener("resize", requestMotionUpdate);
    } else {
      documentRoot.style.setProperty("--home-progress", "1");
    }

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("scroll", requestMotionUpdate);
      window.removeEventListener("resize", requestMotionUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      documentRoot.classList.remove("home-experience-active");
      documentRoot.style.removeProperty("--home-progress");
    };
  }, []);

  return (
    <div ref={rootRef} className="studio-home">
      <div className="studio-signal-spine" aria-hidden="true">
        <span className="studio-signal-spine-track" />
        <span className="studio-signal-spine-progress" />
        <i className="studio-signal-spine-core" />
        <b>signal / scroll</b>
      </div>
      {children}
    </div>
  );
}
