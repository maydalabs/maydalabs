"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

const DOSSIER_COPY = {
  en: {
    progress: "MaydaLabs / build dossier", sequence: "Sequence", file: "CONFIDENTIAL / WORKING FILE", kicker: "A modern build system", heading: ["Small team.", "Unfair output."], choose: "Choose a build dossier stage", show: "Show stage", replay: "Replay dossier", stats: ["connected team from strategy to launch", "handoffs into a junior delivery maze"], showing: "Showing dossier stage",
    stages: [
      { number: "01", eyebrow: "Input / Founder context", title: "Find the signal.", copy: "The half-formed brief, customer reality, commercial target, and constraints become a decision frame.", note: "Ambiguity is useful input. It is not a build plan.", rows: ["Problem / audience", "Commercial target", "Risks / unknowns"] },
      { number: "02", eyebrow: "System / Product decisions", title: "Shape the system.", copy: "Flows, architecture, visual language, operations, and priorities are designed as one connected product.", note: "Design intent and technical reality move together.", rows: ["Experience map", "System architecture", "Build sequence"] },
      { number: "03", eyebrow: "Release / Working software", title: "Ship the real thing.", copy: "Working interfaces arrive in tight cycles. QA, documentation, and production decisions stay inside the loop.", note: "The product, not the presentation, is the source of truth.", rows: ["Interface / code", "QA / release", "Production handoff"] },
      { number: "04", eyebrow: "Signal / Next iteration", title: "Create momentum.", copy: "Launch data and market response reveal the next highest-leverage move, and the system keeps learning.", note: "Shipping is where the useful evidence begins.", rows: ["Measure response", "Find constraint", "Compound learning"] },
    ],
  },
  tr: {
    progress: "MaydaLabs / geliştirme dosyası", sequence: "Aşama", file: "GİZLİ / ÇALIŞMA DOSYASI", kicker: "Modern bir geliştirme sistemi", heading: ["Küçük ekip.", "Haksız üstünlük."], choose: "Geliştirme dosyası aşamasını seçin", show: "Aşamayı göster", replay: "Dosyayı yeniden oynat", stats: ["stratejiden lansmana bağlı ekip", "junior teslimat labirentine devredilen iş"], showing: "Gösterilen dosya aşaması",
    stages: [
      { number: "01", eyebrow: "Girdi / Kurucu bağlamı", title: "Sinyali bul.", copy: "Yarım şekillenmiş brief, müşteri gerçekliği, ticari hedef ve kısıtlar bir karar çerçevesine dönüşür.", note: "Belirsizlik faydalı bir girdidir. Geliştirme planı değildir.", rows: ["Problem / kitle", "Ticari hedef", "Riskler / bilinmeyenler"] },
      { number: "02", eyebrow: "Sistem / Ürün kararları", title: "Sistemi şekillendir.", copy: "Akışlar, mimari, görsel dil, operasyonlar ve öncelikler tek bir bağlantılı ürün olarak tasarlanır.", note: "Tasarım niyeti ve teknik gerçeklik birlikte ilerler.", rows: ["Deneyim haritası", "Sistem mimarisi", "Geliştirme sırası"] },
      { number: "03", eyebrow: "Yayın / Çalışan yazılım", title: "Gerçek ürünü yayınla.", copy: "Çalışan arayüzler kısa döngülerde gelir. QA, dokümantasyon ve üretim kararları döngünün içinde kalır.", note: "Doğrunun kaynağı sunum değil, üründür.", rows: ["Arayüz / kod", "QA / yayın", "Üretim devri"] },
      { number: "04", eyebrow: "Sinyal / Sonraki iterasyon", title: "İvme yarat.", copy: "Lansman verisi ve pazar tepkisi, en yüksek etkili sonraki hamleyi gösterir; sistem öğrenmeye devam eder.", note: "Faydalı kanıt, ürün yayınlandığında başlar.", rows: ["Tepkiyi ölç", "Kısıtı bul", "Öğrenmeyi büyüt"] },
    ],
  },
  fr: {
    progress: "MaydaLabs / dossier de construction", sequence: "Séquence", file: "CONFIDENTIEL / DOSSIER DE TRAVAIL", kicker: "Un système de construction moderne", heading: ["Petite équipe.", "Impact démesuré."], choose: "Choisir une étape du dossier", show: "Afficher l’étape", replay: "Rejouer le dossier", stats: ["équipe connectée de la stratégie au lancement", "transferts dans un labyrinthe de livraison junior"], showing: "Étape du dossier affichée",
    stages: [
      { number: "01", eyebrow: "Entrée / Contexte fondateur", title: "Trouver le signal.", copy: "Le brief inachevé, la réalité client, la cible commerciale et les contraintes deviennent un cadre de décision.", note: "L’ambiguïté est une donnée utile. Ce n’est pas un plan de construction.", rows: ["Problème / public", "Cible commerciale", "Risques / inconnues"] },
      { number: "02", eyebrow: "Système / Décisions produit", title: "Structurer le système.", copy: "Parcours, architecture, langage visuel, opérations et priorités sont conçus comme un produit connecté.", note: "L’intention de design et la réalité technique avancent ensemble.", rows: ["Carte d’expérience", "Architecture système", "Séquence de construction"] },
      { number: "03", eyebrow: "Livraison / Logiciel fonctionnel", title: "Livrer le produit réel.", copy: "Les interfaces fonctionnelles arrivent par cycles courts. QA, documentation et décisions de production restent dans la boucle.", note: "Le produit, pas la présentation, est la source de vérité.", rows: ["Interface / code", "QA / livraison", "Transmission production"] },
      { number: "04", eyebrow: "Signal / Itération suivante", title: "Créer l’élan.", copy: "Les données du lancement et la réponse du marché révèlent l’étape suivante à plus fort impact.", note: "La livraison est le point de départ des preuves utiles.", rows: ["Mesurer la réponse", "Trouver la contrainte", "Amplifier l’apprentissage"] },
    ],
  },
} as const;

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export function BuildDossier({ locale }: { locale: Locale }) {
  const copy = DOSSIER_COPY[locale];
  const stages = copy.stages;
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

        if (stage < stages.length - 1) {
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

  const progress = ((activeStage + 1) / stages.length) * 100;

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
            <span>{copy.progress}</span>
            <i><b style={{ width: `${progress}%` }} /></i>
            <span>{copy.sequence} / {String(activeStage + 1).padStart(2, "0")} / 04</span>
          </div>
          <div className="build-dossier-book">
            <div className="build-dossier-spine" />
            <div className="build-dossier-back" />
            {stages.map((stage, index) => (
              <article
                key={stage.number}
                ref={(page) => { pageRefs.current[index] = page; }}
                className="build-dossier-page"
                style={{ zIndex: stages.length - index }}
              >
                <div className="build-dossier-page-head">
                  <span>ML / {stage.number}</span>
                  <span>{copy.file}</span>
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
          <p className="studio-kicker">{copy.kicker}</p>
          <h2>{copy.heading[0]}<br /><em>{copy.heading[1]}</em></h2>
          <div className="build-dossier-stage-copy">
            {stages.map((stage, index) => (
              <article key={stage.number} data-stage={index}>
                <span>{stage.number} / {stage.eyebrow}</span>
                <h3>{stage.title}</h3>
                <p>{stage.copy}</p>
                <small>{stage.note}</small>
              </article>
            ))}
          </div>
          <div className="build-dossier-controls">
            <div role="group" aria-label={copy.choose}>
              {stages.map((stage, index) => (
                <button
                  key={stage.number}
                  type="button"
                  aria-label={`${copy.show} ${stage.number}: ${stage.title}`}
                  aria-pressed={activeStage === index}
                  onClick={() => selectStage(index)}
                >
                  {stage.number}
                </button>
              ))}
            </div>
            <button type="button" className="build-dossier-replay" onClick={replayDossier}>
              {copy.replay} <span aria-hidden>↻</span>
            </button>
          </div>
          <div className="studio-ai-stats">
            <div><strong>1</strong><span>{copy.stats[0]}</span></div>
            <div><strong>0</strong><span>{copy.stats[1]}</span></div>
          </div>
          <p className="sr-only" aria-live="polite">
            {copy.showing} {activeStage + 1}: {stages[activeStage].title}
          </p>
        </div>
      </div>
    </section>
  );
}
