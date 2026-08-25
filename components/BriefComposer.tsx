"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { trackOsEvent } from "@/lib/osAnalytics";

type Option = { id: string; label: string };

const COPY: Record<Locale, {
  kicker: string;
  heading: [string, string];
  intro: string;
  ideaLabel: string;
  ideaPlaceholder: string;
  stageLabel: string;
  stages: Option[];
  moveLabel: string;
  moves: Option[];
  timelineLabel: string;
  timelines: Option[];
  contextLabel: string;
  contextPlaceholder: string;
  briefTitle: string;
  fields: { building: string; stage: string; move: string; timeline: string; context: string };
  copyAction: string;
  copied: string;
  bookAction: string;
  mailAction: string;
  mailSubject: string;
}> = {
  en: {
    kicker: "Brief composer / Processed in your browser",
    heading: ["Arrive with a brief,", "leave with a plan."],
    intro: "Describe the project in your own words and set three markers. Take the structured brief into the call, or send it by email — nothing is stored or transmitted until you choose.",
    ideaLabel: "The project, in your words",
    ideaPlaceholder: "What are we building, for whom, and what exists today? Rough is fine.",
    stageLabel: "Stage",
    stages: [
      { id: "idea", label: "Idea" },
      { id: "prototype", label: "Prototype" },
      { id: "live", label: "Live product" },
      { id: "rebuild", label: "Rebuild" },
    ],
    moveLabel: "The move",
    moves: [
      { id: "product", label: "New product" },
      { id: "commerce", label: "Commerce" },
      { id: "growth", label: "Growth systems" },
      { id: "unsure", label: "Not sure yet" },
    ],
    timelineLabel: "Timeline",
    timelines: [
      { id: "asap", label: "As soon as possible" },
      { id: "quarter", label: "This quarter" },
      { id: "exploring", label: "Exploring" },
    ],
    contextLabel: "Links or stack (optional)",
    contextPlaceholder: "Current site, repo, deck…",
    briefTitle: "brief — preview",
    fields: { building: "BUILDING", stage: "STAGE", move: "MOVE", timeline: "TIMELINE", context: "CONTEXT" },
    copyAction: "Copy brief",
    copied: "Copied",
    bookAction: "Book the call with this brief",
    mailAction: "Email it instead",
    mailSubject: "Project brief",
  },
  tr: {
    kicker: "Brief oluşturucu / Tarayıcınızda işlenir",
    heading: ["Görüşmeye brief'le gelin,", "planla ayrılın."],
    intro: "Projeyi kendi kelimelerinizle anlatın ve üç işaret seçin. Yapılandırılmış brief'i görüşmeye getirin veya e-postayla gönderin — siz seçene kadar hiçbir şey kaydedilmez veya iletilmez.",
    ideaLabel: "Proje, kendi kelimelerinizle",
    ideaPlaceholder: "Ne geliştiriyoruz, kimin için, bugün ne mevcut? Taslak hali yeterli.",
    stageLabel: "Aşama",
    stages: [
      { id: "idea", label: "Fikir" },
      { id: "prototype", label: "Prototip" },
      { id: "live", label: "Canlı ürün" },
      { id: "rebuild", label: "Yeniden geliştirme" },
    ],
    moveLabel: "Hamle",
    moves: [
      { id: "product", label: "Yeni ürün" },
      { id: "commerce", label: "E-ticaret" },
      { id: "growth", label: "Büyüme sistemleri" },
      { id: "unsure", label: "Henüz belirsiz" },
    ],
    timelineLabel: "Zamanlama",
    timelines: [
      { id: "asap", label: "En kısa sürede" },
      { id: "quarter", label: "Bu çeyrek" },
      { id: "exploring", label: "Araştırıyorum" },
    ],
    contextLabel: "Bağlantılar veya stack (opsiyonel)",
    contextPlaceholder: "Mevcut site, repo, sunum…",
    briefTitle: "brief — önizleme",
    fields: { building: "PROJE", stage: "AŞAMA", move: "HAMLE", timeline: "ZAMAN", context: "BAĞLAM" },
    copyAction: "Brief'i kopyala",
    copied: "Kopyalandı",
    bookAction: "Bu brief ile görüşme ayarla",
    mailAction: "E-postayla gönder",
    mailSubject: "Proje brief'i",
  },
  fr: {
    kicker: "Composeur de brief / Traité dans votre navigateur",
    heading: ["Arrivez avec un brief,", "repartez avec un plan."],
    intro: "Décrivez le projet avec vos mots et posez trois repères. Apportez le brief structuré à l'échange, ou envoyez-le par e-mail — rien n'est stocké ni transmis avant votre choix.",
    ideaLabel: "Le projet, avec vos mots",
    ideaPlaceholder: "Que construisons-nous, pour qui, qu'existe-t-il déjà ? Une ébauche suffit.",
    stageLabel: "Stade",
    stages: [
      { id: "idea", label: "Idée" },
      { id: "prototype", label: "Prototype" },
      { id: "live", label: "Produit en ligne" },
      { id: "rebuild", label: "Refonte" },
    ],
    moveLabel: "Le mouvement",
    moves: [
      { id: "product", label: "Nouveau produit" },
      { id: "commerce", label: "E-commerce" },
      { id: "growth", label: "Systèmes de croissance" },
      { id: "unsure", label: "Pas encore sûr" },
    ],
    timelineLabel: "Délai",
    timelines: [
      { id: "asap", label: "Dès que possible" },
      { id: "quarter", label: "Ce trimestre" },
      { id: "exploring", label: "En exploration" },
    ],
    contextLabel: "Liens ou stack (optionnel)",
    contextPlaceholder: "Site actuel, repo, deck…",
    briefTitle: "brief — aperçu",
    fields: { building: "PROJET", stage: "STADE", move: "MOUVEMENT", timeline: "DÉLAI", context: "CONTEXTE" },
    copyAction: "Copier le brief",
    copied: "Copié",
    bookAction: "Réserver l'appel avec ce brief",
    mailAction: "L'envoyer par e-mail",
    mailSubject: "Brief de projet",
  },
};

function Chips({ label, options, value, onPick }: { label: string; options: Option[]; value: string | null; onPick: (id: string) => void }) {
  return (
    <div className="brief-field">
      <span className="brief-label">{label}</span>
      <div className="brief-chips" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            className={value === option.id ? "is-on" : ""}
            onClick={() => onPick(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// The intake instrument: a freeform description plus three markers
// become a structured brief, composed entirely client-side. The brief
// travels only when the visitor sends it — into the Calendly booking,
// the clipboard, or an email draft.
export function BriefComposer({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState<string | null>(null);
  const [move, setMove] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [copied, setCopied] = useState(false);

  const labelOf = (options: Option[], id: string | null) => options.find((option) => option.id === id)?.label ?? "—";

  const brief = useMemo(() => {
    const lines = [
      "MAYDALABS BRIEF",
      "───────────────",
      `${copy.fields.building.padEnd(9)} ${idea.trim() || "—"}`,
      `${copy.fields.stage.padEnd(9)} ${labelOf(copy.stages, stage)}`,
      `${copy.fields.move.padEnd(9)} ${labelOf(copy.moves, move)}`,
      `${copy.fields.timeline.padEnd(9)} ${labelOf(copy.timelines, timeline)}`,
    ];
    if (context.trim()) lines.push(`${copy.fields.context.padEnd(9)} ${context.trim()}`);
    return lines.join("\n");
  }, [copy, idea, stage, move, timeline, context]);

  const markers = { stage: stage ?? "unset", move: move ?? "unset", timeline: timeline ?? "unset" };

  const copyBrief = async () => {
    trackOsEvent("brief_composed", { action: "copy", ...markers });
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission refused — the preview stays selectable.
    }
  };

  const bookUrl = getIntroCallUrl("contact_brief", { a1: brief.slice(0, 900) });
  const mailUrl = `mailto:info@maydalabs.com?subject=${encodeURIComponent(copy.mailSubject)}&body=${encodeURIComponent(brief)}`;

  return (
    <section className="brief-composer">
      <div className="brief-heading">
        <p className="studio-kicker">{copy.kicker}</p>
        <h2>{copy.heading[0]}<br /><em>{copy.heading[1]}</em></h2>
        <p>{copy.intro}</p>
      </div>
      <div className="brief-grid">
        <div className="brief-form">
          <label className="brief-field">
            <span className="brief-label">{copy.ideaLabel}</span>
            <textarea
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder={copy.ideaPlaceholder}
              rows={4}
              maxLength={600}
            />
          </label>
          <Chips label={copy.stageLabel} options={copy.stages} value={stage} onPick={setStage} />
          <Chips label={copy.moveLabel} options={copy.moves} value={move} onPick={setMove} />
          <Chips label={copy.timelineLabel} options={copy.timelines} value={timeline} onPick={setTimeline} />
          <label className="brief-field">
            <span className="brief-label">{copy.contextLabel}</span>
            <input
              type="text"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder={copy.contextPlaceholder}
              maxLength={200}
            />
          </label>
        </div>
        <div className="brief-preview">
          <div className="brief-preview-bar"><div><i /><i /><i /></div><span>{copy.briefTitle}</span></div>
          <pre>{brief}</pre>
          <div className="brief-actions">
            <a
              href={bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="studio-button studio-button-small"
              onClick={() => trackOsEvent("brief_composed", { action: "book", ...markers })}
            >
              {copy.bookAction} <span aria-hidden>↗</span>
            </a>
            <button type="button" className="studio-button studio-button-small studio-button-ghost" onClick={copyBrief}>
              {copied ? copy.copied : copy.copyAction}
            </button>
            <a
              href={mailUrl}
              className="studio-button studio-button-small studio-button-ghost"
              onClick={() => trackOsEvent("brief_composed", { action: "email", ...markers })}
            >
              {copy.mailAction}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
