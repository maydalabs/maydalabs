import type { Locale } from "@/lib/i18n";

/* Client-facing pilot vocabulary for the portal (EN/TR/FR). */

export type PilotStatus =
  | "proposed"
  | "scoping"
  | "installing"
  | "operating"
  | "measuring"
  | "completed"
  | "paused";

export const PILOT_STEPS: PilotStatus[] = [
  "proposed",
  "scoping",
  "installing",
  "operating",
  "measuring",
  "completed",
];

export type PilotCopy = {
  sectionHeading: string;
  empty: string;
  statuses: Record<PilotStatus, string>;
  offers: Record<"ai_operations" | "payments", string>;
  workflowLabel: string;
  timelineLabel: string;
  summaryLabel: string;
  nextStepLabel: string;
  updatesLabel: string;
  noUpdates: string;
  kinds: Record<"report" | "milestone" | "note", string>;
  metrics: {
    output: string;
    latency: string;
    coverage: string;
    cost: string;
    minutes: string;
  };
  viewAll: string;
  back: string;
  pausedNote: string;
};

export const PILOT_COPY: Record<Locale, PilotCopy> = {
  en: {
    sectionHeading: "Your pilot",
    empty: "No pilot yet. When an engagement starts, its status, timeline, and weekly reports appear here.",
    statuses: {
      proposed: "Proposed",
      scoping: "Scoping",
      installing: "Installing",
      operating: "Operating",
      measuring: "Measuring",
      completed: "Completed",
      paused: "Paused",
    },
    offers: { ai_operations: "Evidence-gated AI operations", payments: "Bitcoin payments engineering" },
    workflowLabel: "Workflow",
    timelineLabel: "Timeline",
    summaryLabel: "Where things stand",
    nextStepLabel: "Next step",
    updatesLabel: "Reports and updates",
    noUpdates: "No reports published yet.",
    kinds: { report: "Report", milestone: "Milestone", note: "Note" },
    metrics: {
      output: "Pieces produced",
      latency: "Median approval time",
      coverage: "Source coverage",
      cost: "Cost",
      minutes: "min",
    },
    viewAll: "Open the full pilot",
    back: "Back to portal",
    pausedNote: "This pilot is paused. Nothing runs and nothing is billed until it resumes.",
  },
  tr: {
    sectionHeading: "Pilotunuz",
    empty: "Henüz pilot yok. Bir çalışma başladığında durumu, zaman çizelgesi ve haftalık raporları burada görünür.",
    statuses: {
      proposed: "Önerildi",
      scoping: "Kapsamlanıyor",
      installing: "Kuruluyor",
      operating: "İşletimde",
      measuring: "Ölçülüyor",
      completed: "Tamamlandı",
      paused: "Duraklatıldı",
    },
    offers: { ai_operations: "Kanıt kapılı yapay zekâ operasyonları", payments: "Bitcoin ödeme mühendisliği" },
    workflowLabel: "İş akışı",
    timelineLabel: "Zaman çizelgesi",
    summaryLabel: "Şu anki durum",
    nextStepLabel: "Sonraki adım",
    updatesLabel: "Raporlar ve güncellemeler",
    noUpdates: "Henüz yayınlanmış rapor yok.",
    kinds: { report: "Rapor", milestone: "Kilometre taşı", note: "Not" },
    metrics: {
      output: "Üretilen içerik",
      latency: "Medyan onay süresi",
      coverage: "Kaynak kapsamı",
      cost: "Maliyet",
      minutes: "dk",
    },
    viewAll: "Pilotun tamamını aç",
    back: "Portala dön",
    pausedNote: "Bu pilot duraklatıldı. Devam edene kadar hiçbir şey çalışmaz ve faturalanmaz.",
  },
  fr: {
    sectionHeading: "Votre pilote",
    empty: "Pas encore de pilote. Quand une mission démarre, son statut, son calendrier et ses rapports hebdomadaires apparaissent ici.",
    statuses: {
      proposed: "Proposé",
      scoping: "Cadrage",
      installing: "Installation",
      operating: "En opération",
      measuring: "Mesure",
      completed: "Terminé",
      paused: "En pause",
    },
    offers: { ai_operations: "Opérations IA à preuves obligatoires", payments: "Ingénierie des paiements Bitcoin" },
    workflowLabel: "Flux",
    timelineLabel: "Calendrier",
    summaryLabel: "Où en sont les choses",
    nextStepLabel: "Prochaine étape",
    updatesLabel: "Rapports et mises à jour",
    noUpdates: "Aucun rapport publié pour l'instant.",
    kinds: { report: "Rapport", milestone: "Jalon", note: "Note" },
    metrics: {
      output: "Pièces produites",
      latency: "Délai d'approbation médian",
      coverage: "Couverture des sources",
      cost: "Coût",
      minutes: "min",
    },
    viewAll: "Ouvrir le pilote complet",
    back: "Retour au portail",
    pausedNote: "Ce pilote est en pause. Rien ne tourne et rien n'est facturé jusqu'à sa reprise.",
  },
};
