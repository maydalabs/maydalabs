import type { Locale } from "@/lib/i18n";

const COPY = {
  en: {
    kicker: "AI operations / Human-controlled by design",
    heading: "Automation earns trust one gate at a time.",
    intro: "The operating pattern behind our research, editorial, and production work keeps evidence, state, approval, action, and verification separate. AI can accelerate the middle; it cannot silently own the consequential step.",
    console: "MAYDALABS / CONTROLLED AUTOMATION",
    status: "OPERATOR PRESENT",
    flowLabel: "Human-gated automation workflow",
    steps: [
      ["01", "Capture", "Source + provenance"],
      ["02", "Qualify", "Rules + hard gates"],
      ["03", "Assist", "Research + draft"],
      ["04", "Approve", "Exact payload + target"],
      ["05", "Act", "Bounded external write"],
      ["06", "Verify", "Destination + record"],
    ],
    gate: "CONSEQUENTIAL ACTION",
    gateValue: "Human approval required",
    guardrails: ["Evidence travels with the record", "External writes are off by default", "The factual result is recorded after action"],
  },
  tr: {
    kicker: "Yapay zekâ operasyonları / Tasarım gereği insan kontrollü",
    heading: "Otomasyon güveni her kapıda yeniden kazanır.",
    intro: "Araştırma, editoryal ve üretim işlerimizin arkasındaki çalışma modeli kanıtı, durumu, onayı, eylemi ve doğrulamayı ayrı tutar. Yapay zekâ orta adımları hızlandırabilir; sonuç doğuran adımı sessizce sahiplenemez.",
    console: "MAYDALABS / KONTROLLÜ OTOMASYON",
    status: "OPERATÖR MEVCUT",
    flowLabel: "İnsan onay kapılı otomasyon akışı",
    steps: [
      ["01", "Topla", "Kaynak + köken"],
      ["02", "Ele", "Kurallar + zorunlu kapılar"],
      ["03", "Destekle", "Araştırma + taslak"],
      ["04", "Onayla", "Kesin içerik + hedef"],
      ["05", "Uygula", "Sınırlı dış yazma"],
      ["06", "Doğrula", "Hedef + kayıt"],
    ],
    gate: "SONUÇ DOĞURAN EYLEM",
    gateValue: "İnsan onayı gerekir",
    guardrails: ["Kanıt kayıtla birlikte ilerler", "Dış yazmalar varsayılan olarak kapalıdır", "Eylem sonrası gerçek sonuç kaydedilir"],
  },
  fr: {
    kicker: "Opérations IA / Contrôle humain par conception",
    heading: "L’automatisation gagne la confiance à chaque seuil.",
    intro: "Le modèle opératoire derrière nos travaux de recherche, d’édition et de production sépare preuves, état, validation, action et vérification. L’IA accélère le milieu du parcours sans prendre silencieusement la décision conséquente.",
    console: "MAYDALABS / AUTOMATISATION CONTRÔLÉE",
    status: "OPÉRATEUR PRÉSENT",
    flowLabel: "Workflow d’automatisation sous validation humaine",
    steps: [
      ["01", "Capturer", "Source + provenance"],
      ["02", "Qualifier", "Règles + seuils"],
      ["03", "Assister", "Recherche + brouillon"],
      ["04", "Valider", "Contenu + cible exacts"],
      ["05", "Agir", "Écriture externe bornée"],
      ["06", "Vérifier", "Destination + trace"],
    ],
    gate: "ACTION CONSÉQUENTE",
    gateValue: "Validation humaine requise",
    guardrails: ["La preuve accompagne le dossier", "Les écritures externes sont coupées par défaut", "Le résultat factuel est enregistré après l’action"],
  },
} as const;

export function AutomationProof({ locale }: { locale: Locale }) {
  const copy = COPY[locale];

  return (
    <section className="automation-proof" id="automation">
      <div className="automation-proof-heading">
        <div><p className="studio-kicker">{copy.kicker}</p><h2>{copy.heading}</h2></div>
        <p>{copy.intro}</p>
      </div>
      <div className="automation-console">
        <header><span>{copy.console}</span><b><i /> {copy.status}</b></header>
        <ol aria-label={copy.flowLabel}>
          {copy.steps.map(([number, title, detail], index) => (
            <li key={number} className={index === 3 ? "is-gate" : ""}>
              <span>{number}</span><i aria-hidden="true" /><strong>{title}</strong><small>{detail}</small>
            </li>
          ))}
        </ol>
        <div className="automation-gate"><span>{copy.gate}</span><strong>{copy.gateValue}</strong></div>
        <ul>{copy.guardrails.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </section>
  );
}
