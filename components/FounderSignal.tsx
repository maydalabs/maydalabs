import Image from "next/image";
import type { Locale } from "@/lib/i18n";

const COPY = {
  en: {
    label: "Founder signal",
    portraitAlt: "Portrait of Mehmet E. Mayda",
    eyebrow: "Founder / hands-on operator",
    name: "Mehmet E. Mayda",
    role: "Full-stack product builder across software, growth, and AI-assisted operations.",
    facts: [["BASE", "Istanbul · remote"], ["MODE", "Founder-led"], ["FOCUS", "Product + growth"]],
  },
  tr: {
    label: "Kurucu sinyali",
    portraitAlt: "Mehmet E. Mayda portresi",
    eyebrow: "Kurucu / uygulamalı operatör",
    name: "Mehmet E. Mayda",
    role: "Yazılım, büyüme ve yapay zekâ destekli operasyonlarda full-stack ürün geliştirici.",
    facts: [["KONUM", "İstanbul · uzaktan"], ["MODEL", "Kurucu liderliğinde"], ["ODAK", "Ürün + büyüme"]],
  },
  fr: {
    label: "Signal fondateur",
    portraitAlt: "Portrait de Mehmet E. Mayda",
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
      <div className="founder-signal-portrait">
        <Image
          src="/profile/mehmet-e-mayda-portrait.jpg"
          alt={copy.portraitAlt}
          fill
          loading="eager"
          sizes="(max-width: 959px) calc(100vw - 2rem), 30rem"
          className="founder-signal-photo"
        />
        <span className="founder-signal-grid" />
        <span className="founder-signal-photo-shade" />
        <i>MM / 2026</i>
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
