import type { Locale } from "@/lib/i18n";

type InProgressVisualProps = {
  compact?: boolean;
  locale: Locale;
  variant: "mortal" | "sofra";
};

const COPY = {
  en: {
    privateBuild: "Private working build",
    active: "Active development",
    mortal: {
      name: "Mortal Vault",
      signal: "Owner activity signal",
      steps: ["Owner active", "Inactivity window", "Claim delay", "Beneficiary claim"],
      boundary: "Owner can cancel a pending claim",
      footer: "Self-custody · no administrator · unaudited",
    },
    sofra: {
      name: "Sofra",
      signal: "Managed table lifecycle",
      steps: ["Host approved", "Table scheduled", "Guest books", "Dinner completes"],
      boundary: "Public discovery / private household data",
      footer: "Türkiye-first · bilingual · demo-safe",
    },
  },
  tr: {
    privateBuild: "Özel çalışan ürün",
    active: "Aktif geliştirme",
    mortal: {
      name: "Mortal Vault",
      signal: "Sahip aktivite sinyali",
      steps: ["Sahip aktif", "Hareketsizlik süresi", "Talep gecikmesi", "Lehtar talebi"],
      boundary: "Sahip bekleyen talebi iptal edebilir",
      footer: "Self-custody · yönetici yok · denetlenmedi",
    },
    sofra: {
      name: "Sofra",
      signal: "Yönetilen sofra yaşam döngüsü",
      steps: ["Ev sahibi onaylı", "Sofra planlandı", "Misafir ayırttı", "Akşam tamamlandı"],
      boundary: "Açık keşif / özel hane verisi",
      footer: "Türkiye odaklı · iki dilli · demo güvenli",
    },
  },
  fr: {
    privateBuild: "Produit privé fonctionnel",
    active: "Construction active",
    mortal: {
      name: "Mortal Vault",
      signal: "Signal d’activité du propriétaire",
      steps: ["Propriétaire actif", "Période d’inactivité", "Délai de recours", "Réclamation"],
      boundary: "Le propriétaire peut annuler la demande",
      footer: "Autogarde · sans administrateur · non audité",
    },
    sofra: {
      name: "Sofra",
      signal: "Cycle de vie d’une table gérée",
      steps: ["Hôte approuvé", "Table planifiée", "Réservation", "Dîner terminé"],
      boundary: "Découverte publique / données privées",
      footer: "Priorité Türkiye · bilingue · démo sûre",
    },
  },
} as const;

export function InProgressVisual({ compact = false, locale, variant }: InProgressVisualProps) {
  const shared = COPY[locale];
  const copy = shared[variant];

  return (
    <div className={`development-visual development-visual-${variant} ${compact ? "is-compact" : ""}`}>
      <div className="development-visual-chrome">
        <span><i /> {shared.privateBuild}</span>
        <b>{shared.active}</b>
      </div>
      <div className="development-visual-stage">
        <div className="development-visual-grid" aria-hidden="true" />
        <header>
          <p>{copy.signal}</p>
          <h3>{copy.name}</h3>
        </header>
        <div className="development-flow" aria-label={`${copy.name} ${copy.signal}`}>
          {copy.steps.map((step, index) => (
            <div key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i aria-hidden="true" />
              <strong>{step}</strong>
            </div>
          ))}
        </div>
        <div className="development-boundary"><span>{variant === "mortal" ? "↺" : "◫"}</span>{copy.boundary}</div>
        <footer>{copy.footer}</footer>
      </div>
    </div>
  );
}
