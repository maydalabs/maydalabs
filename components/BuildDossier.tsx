"use client";

import { useEffect, useRef, useState } from "react";

const DOSSIER_STAGES = [
  {
    number: "01",
    eyebrow: "Input / Founder context",
    title: "Find the signal.",
    copy: "The half-formed brief, customer reality, commercial target, and constraints become a decision frame.",
    note: "Ambiguity is useful input. It is not a build plan.",
    rows: ["Problem / audience", "Commercial target", "Risks / unknowns"],
  },
  {
    number: "02",
    eyebrow: "System / Product decisions",
    title: "Shape the system.",
    copy: "Flows, architecture, visual language, operations, and priorities are designed as one connected product.",
    note: "Design intent and technical reality move together.",
    rows: ["Experience map", "System architecture", "Build sequence"],
  },
  {
    number: "03",
    eyebrow: "Release / Working software",
    title: "Ship the real thing.",
    copy: "Working interfaces arrive in tight cycles. QA, documentation, and production decisions stay inside the loop.",
    note: "The product, not the presentation, is the source of truth.",
    rows: ["Interface / code", "QA / release", "Production handoff"],
  },
  {
    number: "04",
    eyebrow: "Signal / Next iteration",
    title: "Create momentum.",
    copy: "Launch data and market response reveal the next highest-leverage move, and the system keeps learning.",
    note: "Shipping is where the useful evidence begins.",
    rows: ["Measure response", "Find constraint", "Compound learning"],
  },
] as const;

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export function BuildDossier() {
  const sectionRef = useRef<HTMLElement>(null);
  const pageRefs = useRef<Array<HTMLElement | null>>([]);
  const replayTimerRef = useRef<number | null>(null);
  const replayingRef = useRef(false);
  const [activeStage, setActiveStage] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);

  const applyStage = (stage: number) => {
    pageRefs.current.forEach((page, index) => {
      page?.style.setProperty("--page-turn", index < stage ? "1" : "0");
    });
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 980px)");
    let animationFrame = 0;

    const updateFromScroll = () => {
      animationFrame = 0;
      if (replayingRef.current || !desktop.matches || reducedMotion.matches) return;

      const rect = section.getBoundingClientRect();
      const travel = rect.height + window.innerHeight * 0.64;
      const progress = clamp((window.innerHeight * 0.82 - rect.top) / travel);
      const turnStarts = [0.08, 0.32, 0.56];
      const turns = turnStarts.map((start) => clamp((progress - start) / 0.18));

      section.style.setProperty("--dossier-scroll", progress.toFixed(4));
      pageRefs.current.forEach((page, index) => {
        page?.style.setProperty("--page-turn", String(index < turns.length ? turns[index] : 0));
      });

      const nextStage = turns.reduce(
        (stage, turn, index) => (turn >= 0.55 ? index + 1 : stage),
        0,
      );
      setActiveStage((current) => current === nextStage ? current : nextStage);
    };

    const requestScrollUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateFromScroll);
    };

    requestScrollUpdate();
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);

    return () => {
      window.removeEventListener("scroll", requestScrollUpdate);
      window.removeEventListener("resize", requestScrollUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (replayTimerRef.current) window.clearTimeout(replayTimerRef.current);
    };
  }, []);

  const selectStage = (index: number) => {
    if (replayTimerRef.current) window.clearTimeout(replayTimerRef.current);
    replayTimerRef.current = null;
    replayingRef.current = false;
    setIsReplaying(false);
    setActiveStage(index);
    applyStage(index);
  };

  const replayDossier = () => {
    if (replayTimerRef.current) window.clearTimeout(replayTimerRef.current);
    replayingRef.current = true;
    setIsReplaying(true);
    setActiveStage(0);
    applyStage(0);

    const advance = (stage: number) => {
      replayTimerRef.current = window.setTimeout(() => {
        setActiveStage(stage);
        applyStage(stage);

        if (stage < DOSSIER_STAGES.length - 1) {
          advance(stage + 1);
        } else {
          replayTimerRef.current = null;
          replayingRef.current = false;
          setIsReplaying(false);
        }
      }, stage === 1 ? 650 : 850);
    };

    advance(1);
  };

  const progress = ((activeStage + 1) / DOSSIER_STAGES.length) * 100;

  return (
    <section
      ref={sectionRef}
      className="build-dossier"
      data-active-stage={activeStage}
      data-playing={isReplaying ? "true" : "false"}
    >
      <div className="build-dossier-sticky">
        <div className="build-dossier-visual" aria-hidden="true">
          <div className="build-dossier-progress">
            <span>MaydaLabs / build dossier</span>
            <i><b style={{ width: `${progress}%` }} /></i>
            <span>Sequence / {String(activeStage + 1).padStart(2, "0")} of 04</span>
          </div>
          <div className="build-dossier-book">
            <div className="build-dossier-spine" />
            <div className="build-dossier-back" />
            {DOSSIER_STAGES.map((stage, index) => (
              <article
                key={stage.number}
                ref={(page) => { pageRefs.current[index] = page; }}
                className="build-dossier-page"
                style={{ zIndex: DOSSIER_STAGES.length - index }}
              >
                <div className="build-dossier-page-head">
                  <span>ML / {stage.number}</span>
                  <span>CONFIDENTIAL / WORKING FILE</span>
                </div>
                <p>{stage.eyebrow}</p>
                <h3>{stage.title}</h3>
                <div className="build-dossier-diagram">
                  <i /><i /><i /><i />
                  <b />
                </div>
                <ol>
                  {stage.rows.map((row, rowIndex) => (
                    <li key={row}><span>0{rowIndex + 1}</span>{row}</li>
                  ))}
                </ol>
                <small>{stage.note}</small>
              </article>
            ))}
          </div>
        </div>

        <div className="build-dossier-copy">
          <p className="studio-kicker">A modern build system</p>
          <h2>Small team.<br /><em>Unfair output.</em></h2>
          <div className="build-dossier-stage-copy">
            {DOSSIER_STAGES.map((stage, index) => (
              <article key={stage.number} data-stage={index}>
                <span>{stage.number} / {stage.eyebrow}</span>
                <h3>{stage.title}</h3>
                <p>{stage.copy}</p>
                <small>{stage.note}</small>
              </article>
            ))}
          </div>
          <div className="build-dossier-controls">
            <div role="group" aria-label="Choose a build dossier stage">
              {DOSSIER_STAGES.map((stage, index) => (
                <button
                  key={stage.number}
                  type="button"
                  aria-label={`Show stage ${stage.number}: ${stage.title}`}
                  aria-pressed={activeStage === index}
                  onClick={() => selectStage(index)}
                >
                  {stage.number}
                </button>
              ))}
            </div>
            <button type="button" className="build-dossier-replay" onClick={replayDossier}>
              Replay dossier <span aria-hidden>↻</span>
            </button>
          </div>
          <div className="studio-ai-stats">
            <div><strong>1</strong><span>connected team from strategy to launch</span></div>
            <div><strong>0</strong><span>handoffs into a junior delivery maze</span></div>
          </div>
          <p className="sr-only" aria-live="polite">
            Showing dossier stage {activeStage + 1}: {DOSSIER_STAGES[activeStage].title}
          </p>
        </div>
      </div>
    </section>
  );
}
