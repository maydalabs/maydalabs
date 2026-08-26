import Link from "next/link";
import { type Locale, localizePath } from "@/lib/i18n";

export type JourneyStage = "proof" | "fit" | "brief";

const COPY = {
  en: {
    label: "Recommended route",
    hint: "Three stops. Jump in wherever you have enough signal.",
    steps: [
      { id: "proof", number: "01", title: "Inspect proof", detail: "See what shipped", path: "/case-studies#hodlstay" },
      { id: "fit", number: "02", title: "Find your fit", detail: "Match the problem", path: "/services#service-paths" },
      { id: "brief", number: "03", title: "Shape the brief", detail: "60–90 seconds", path: "/contact#brief" },
    ],
  },
  tr: {
    label: "Önerilen rota",
    hint: "Üç durak. Yeterli sinyaliniz olan yerden başlayın.",
    steps: [
      { id: "proof", number: "01", title: "Kanıtı inceleyin", detail: "Yayınlanan işi görün", path: "/case-studies#hodlstay" },
      { id: "fit", number: "02", title: "Uyumu bulun", detail: "Problemi eşleştirin", path: "/services#service-paths" },
      { id: "brief", number: "03", title: "Brief'i şekillendirin", detail: "60–90 saniye", path: "/contact#brief" },
    ],
  },
  fr: {
    label: "Parcours recommandé",
    hint: "Trois étapes. Entrez là où votre signal est suffisant.",
    steps: [
      { id: "proof", number: "01", title: "Voir les preuves", detail: "Inspecter le livré", path: "/case-studies#hodlstay" },
      { id: "fit", number: "02", title: "Trouver l’adéquation", detail: "Relier le problème", path: "/services#service-paths" },
      { id: "brief", number: "03", title: "Structurer le brief", detail: "60–90 secondes", path: "/contact#brief" },
    ],
  },
} as const;

export function JourneyGuide({ locale, current }: { locale: Locale; current: JourneyStage }) {
  const copy = COPY[locale];

  return (
    <nav className="journey-guide" aria-label={copy.label} data-current-stage={current}>
      <div className="journey-guide-intro">
        <span>{copy.label}</span>
        <small>{copy.hint}</small>
      </div>
      <ol>
        {copy.steps.map((step) => {
          const isCurrent = step.id === current;
          const content = <><span>{step.number}</span><span><strong>{step.title}</strong><small>{step.detail}</small></span><em aria-hidden="true">{isCurrent ? "●" : "→"}</em></>;

          return (
            <li key={step.id} className={isCurrent ? "is-current" : ""}>
              {isCurrent ? (
                <span aria-current="step">{content}</span>
              ) : (
                <Link
                  href={localizePath(step.path, locale)}
                  data-journey-intent={`stage_${step.id}`}
                  data-journey-source={current}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
