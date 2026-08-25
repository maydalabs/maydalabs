import type { Locale } from "@/lib/i18n";

const COPY = {
  en: {
    label: "Founder signal",
    eyebrow: "Founder / hands-on operator",
    name: "Mehmet E. Mayda",
    role: "Full-stack product builder across software, growth, and AI-assisted operations.",
    facts: [["BASE", "Istanbul · remote"], ["MODE", "Founder-led"], ["FOCUS", "Product + growth"]],
  },
  tr: {
    label: "Kurucu sinyali",
    eyebrow: "Kurucu / uygulamalı operatör",
    name: "Mehmet E. Mayda",
    role: "Yazılım, büyüme ve yapay zekâ destekli operasyonlarda full-stack ürün geliştirici.",
    facts: [["KONUM", "İstanbul · uzaktan"], ["MODEL", "Kurucu liderliğinde"], ["ODAK", "Ürün + büyüme"]],
  },
  fr: {
    label: "Signal fondateur",
    eyebrow: "Fondateur / opérateur impliqué",
    name: "Mehmet E. Mayda",
    role: "Builder produit full-stack entre logiciel, croissance et opérations assistées par l’IA.",
    facts: [["BASE", "Istanbul · remote"], ["MODE", "Dirigé par le fondateur"], ["FOCUS", "Produit + croissance"]],
  },
} as const;

export function FounderSignal({ locale }: { locale: Locale }) {
  const copy = COPY[locale];

  return (
    <aside className="founder-signal" aria-label={copy.label}>
      <div className="founder-signal-portrait" aria-hidden="true">
        <span className="founder-signal-grid" />
        <span className="founder-signal-orbit" />
        <span className="founder-signal-head" />
        <span className="founder-signal-shoulders" />
        <i>MM</i>
      </div>
      <div className="founder-signal-copy">
        <p>{copy.eyebrow}</p>
        <h2>{copy.name}</h2>
        <strong>{copy.role}</strong>
      </div>
      <dl>
        {copy.facts.map(([term, detail]) => (
          <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>
        ))}
      </dl>
    </aside>
  );
}
