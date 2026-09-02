import Link from "next/link";
import { Icon, IconBox, type IconName } from "@/components/icons";
import { PipelineDiagram } from "@/components/PipelineDiagram";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "The system behind Satoshi Gazette",
      socialTitle: "The system behind Satoshi Gazette · MaydaLabs",
      description:
        "How an AI-operated, human-approved Bitcoin publication actually runs: the pipeline, the sourcing rules, the approval gates, and the numbers — dated and verifiable.",
    },
    kicker: "Proof / The system behind Satoshi Gazette",
    heading: ["This is what we sell.", "Running, in public."],
    lead: "Satoshi Gazette is a Bitcoin-only publication that MaydaLabs owns and operates through the same system we install for clients. This page describes how it actually works. Every number is dated; everything external is inspectable.",
    asOf: "Figures as of 2 September 2026.",
    factsKicker: "The numbers",
    facts: [
      ["34", "pieces published — stories, wires, briefings, data desk"],
      ["100%", "of publications passed a human approval before going out"],
      ["44", "editorial control cases tracked through the pipeline"],
      ["454", "automated tests on the operating system behind it"],
      ["11", "treasury-desk entities, each verified against a regulatory filing or audited report"],
      ["0", "external actions ever taken without an approval — by design"],
    ],
    pipelineKicker: "The pipeline, honestly split",
    pipelineIntro: "Seven stages. The machine does the volume; a human owns every consequence.",
    pipeline: [
      ["Intake", "machine", "Feeds, newsletters, and submitted signals are fetched, normalized, and de-duplicated automatically."],
      ["Triage", "machine + rules", "Deterministic scope and duplicate gates decide what becomes an editorial candidate."],
      ["Drafting", "AI", "Candidates are drafted by AI, grounded in the publication's charter and the collected sources."],
      ["Evidence", "rules + human", "Every claim is linked to a source with a role — primary, supporting, background, counterpoint — or it cannot publish as fact."],
      ["Approval", "human", "Nothing publishes without an explicit, recorded human approval. No approval means no external action."],
      ["Publish", "machine", "Approved pieces are inserted idempotently; the live site is the source of truth."],
      ["Reconcile", "machine", "Distribution is verified against public URLs — a post counts as posted only when the public record proves it."],
    ],
    rulesKicker: "The two rules that make it trustworthy",
    rules: [
      ["Source-linked or unverified", "If a claim has no source URL, it is marked unverified and does not publish as fact. This is enforced by the pipeline, not by good intentions."],
      ["No approval, no external action", "The AI can draft, sort, and prepare. It cannot send, publish, or spend. Ever. The approval surface makes review take minutes — but the click is always human."],
    ],
    meaningKicker: "What this means if you hire us",
    meaningText: "The pilot installs this same architecture on one of your workflows — your sources, your rules, your approver. We are not proposing a system we believe would work. We are offering the one that already runs our own business, with the receipts public.",
    meaningNote: "Satoshi Gazette is a MaydaLabs-owned publication with independent editorial standards; its coverage is never for sale, including to our clients.",
    visitSg: "Read Satoshi Gazette",
    readCase: "Read the full case study",
    ctaHeading: "Want this on one of your workflows?",
    ctaStart: "Start a pilot",
    ctaOffers: "See the offers",
  },
  tr: {
    meta: {
      title: "Satoshi Gazette'in arkasındaki sistem",
      socialTitle: "Satoshi Gazette'in arkasındaki sistem · MaydaLabs",
      description:
        "Yapay zekâ ile işletilen, insan onaylı bir Bitcoin yayını gerçekte nasıl çalışır: hat, kaynak kuralları, onay kapıları ve rakamlar — tarihli ve doğrulanabilir.",
    },
    kicker: "Kanıt / Satoshi Gazette'in arkasındaki sistem",
    heading: ["Sattığımız şey bu.", "Çalışıyor, herkese açık."],
    lead: "Satoshi Gazette, MaydaLabs'in sahibi olduğu ve müşterilere kurduğumuz sistemin aynısıyla işlettiği, sadece Bitcoin'e odaklı bir yayındır. Bu sayfa gerçekte nasıl çalıştığını anlatır. Her rakam tarihlidir; dışa dönük her şey denetlenebilir.",
    asOf: "Rakamlar 2 Eylül 2026 itibarıyladır.",
    factsKicker: "Rakamlar",
    facts: [
      ["34", "yayınlanmış içerik — haber, wire, bülten, veri masası"],
      ["%100", "yayının tamamı çıkmadan önce insan onayından geçti"],
      ["44", "hat boyunca izlenen editoryal kontrol vakası"],
      ["454", "arkadaki işletim sisteminde otomatik test"],
      ["11", "hazine masası kaydı; her biri düzenleyici dosya veya denetlenmiş raporla doğrulanmış"],
      ["0", "onaysız gerçekleşmiş dış eylem — tasarım gereği"],
    ],
    pipelineKicker: "Hat, dürüst bölünmüş haliyle",
    pipelineIntro: "Yedi aşama. Hacmi makine üretir; her sonucun sahibi insandır.",
    pipeline: [
      ["Giriş", "makine", "Beslemeler, bültenler ve iletilen sinyaller otomatik olarak çekilir, normalize edilir, tekilleştirilir."],
      ["Ayıklama", "makine + kural", "Deterministik kapsam ve tekrar kapıları neyin editoryal aday olacağına karar verir."],
      ["Taslak", "yapay zekâ", "Adaylar, yayının tüzüğüne ve toplanan kaynaklara dayanarak yapay zekâ tarafından taslaklanır."],
      ["Kanıt", "kural + insan", "Her iddia bir kaynağa rolüyle bağlanır — birincil, destekleyici, arka plan, karşı görüş — yoksa gerçek olarak yayınlanamaz."],
      ["Onay", "insan", "Açık ve kayıtlı insan onayı olmadan hiçbir şey yayınlanmaz. Onay yoksa dış eylem yok."],
      ["Yayın", "makine", "Onaylı içerikler idempotent biçimde eklenir; canlı site gerçeğin kaynağıdır."],
      ["Mutabakat", "makine", "Dağıtım herkese açık URL'lerle doğrulanır — bir paylaşım ancak kamusal kayıt kanıtlarsa paylaşılmış sayılır."],
    ],
    rulesKicker: "Güveni kuran iki kural",
    rules: [
      ["Kaynağa bağlı ya da doğrulanmamış", "Bir iddianın kaynak URL'i yoksa doğrulanmamış işaretlenir ve gerçek olarak yayınlanmaz. Bunu iyi niyet değil, hat zorlar."],
      ["Onay yoksa dış eylem yok", "Yapay zekâ taslaklar, sıralar, hazırlar. Gönderemez, yayınlayamaz, harcayamaz. Asla. Onay yüzeyi incelemeyi dakikalara indirir — ama tık her zaman insandadır."],
    ],
    meaningKicker: "Bizi tutarsanız bunun anlamı",
    meaningText: "Pilot, aynı mimariyi sizin iş akışlarınızdan birine kurar — sizin kaynaklarınız, sizin kurallarınız, sizin onaylayıcınız. İşe yarayacağına inandığımız bir sistem önermiyoruz. Kendi işimizi zaten yürüten, makbuzları herkese açık olanı sunuyoruz.",
    meaningNote: "Satoshi Gazette, bağımsız editoryal standartlara sahip, MaydaLabs'e ait bir yayındır; yayın içeriği satılık değildir — müşterilerimize bile.",
    visitSg: "Satoshi Gazette'i okuyun",
    readCase: "Tam vaka çalışmasını okuyun",
    ctaHeading: "Bunu kendi iş akışınızda ister misiniz?",
    ctaStart: "Pilot başlat",
    ctaOffers: "Teklifleri görün",
  },
  fr: {
    meta: {
      title: "Le système derrière Satoshi Gazette",
      socialTitle: "Le système derrière Satoshi Gazette · MaydaLabs",
      description:
        "Comment tourne réellement une publication Bitcoin opérée par l'IA et approuvée par des humains : pipeline, règles de sourçage, portes d'approbation et chiffres — datés et vérifiables.",
    },
    kicker: "Preuve / Le système derrière Satoshi Gazette",
    heading: ["Voilà ce que nous vendons.", "En marche, en public."],
    lead: "Satoshi Gazette est une publication 100 % Bitcoin que MaydaLabs détient et opère avec le même système que nous installons chez nos clients. Cette page décrit son fonctionnement réel. Chaque chiffre est daté ; tout ce qui est externe est inspectable.",
    asOf: "Chiffres au 2 septembre 2026.",
    factsKicker: "Les chiffres",
    facts: [
      ["34", "pièces publiées — articles, dépêches, briefings, data desk"],
      ["100 %", "des publications passées par une approbation humaine avant de sortir"],
      ["44", "cas de contrôle éditorial suivis dans le pipeline"],
      ["454", "tests automatisés sur le système d'exploitation derrière"],
      ["11", "entités du desk trésorerie, chacune vérifiée contre un dépôt réglementaire ou un rapport audité"],
      ["0", "action externe jamais prise sans approbation — par conception"],
    ],
    pipelineKicker: "Le pipeline, honnêtement réparti",
    pipelineIntro: "Sept étapes. La machine fait le volume ; un humain possède chaque conséquence.",
    pipeline: [
      ["Entrée", "machine", "Flux, newsletters et signaux soumis sont récupérés, normalisés et dédupliqués automatiquement."],
      ["Tri", "machine + règles", "Des portes déterministes de périmètre et de doublon décident de ce qui devient candidat éditorial."],
      ["Rédaction", "IA", "Les candidats sont rédigés par l'IA, ancrés dans la charte de la publication et les sources collectées."],
      ["Preuves", "règles + humain", "Chaque affirmation est liée à une source avec un rôle — primaire, complémentaire, contexte, contradictoire — sinon elle ne peut pas être publiée comme un fait."],
      ["Approbation", "humain", "Rien ne se publie sans approbation humaine explicite et enregistrée. Pas d'approbation, pas d'action externe."],
      ["Publication", "machine", "Les pièces approuvées sont insérées de façon idempotente ; le site en direct fait foi."],
      ["Réconciliation", "machine", "La distribution est vérifiée contre des URL publiques — un post ne compte comme posté que si le registre public le prouve."],
    ],
    rulesKicker: "Les deux règles qui créent la confiance",
    rules: [
      ["Lié à la source, ou non vérifié", "Une affirmation sans URL source est marquée non vérifiée et ne se publie pas comme un fait. C'est le pipeline qui l'impose, pas les bonnes intentions."],
      ["Pas d'approbation, pas d'action externe", "L'IA peut rédiger, trier, préparer. Elle ne peut ni envoyer, ni publier, ni dépenser. Jamais. La surface d'approbation réduit la revue à quelques minutes — mais le clic reste humain."],
    ],
    meaningKicker: "Ce que cela signifie si vous nous engagez",
    meaningText: "Le pilote installe cette même architecture sur un de vos flux — vos sources, vos règles, votre approbateur. Nous ne proposons pas un système dont nous croyons qu'il marcherait. Nous offrons celui qui fait déjà tourner notre propre activité, reçus publics à l'appui.",
    meaningNote: "Satoshi Gazette est une publication détenue par MaydaLabs avec des standards éditoriaux indépendants ; sa couverture n'est jamais à vendre, y compris à nos clients.",
    visitSg: "Lire Satoshi Gazette",
    readCase: "Lire l'étude de cas complète",
    ctaHeading: "Vous voulez ça sur un de vos flux ?",
    ctaStart: "Lancer un pilote",
    ctaOffers: "Voir les offres",
  },
} as const;

const LANE_LABELS = {
  en: { machine: "MACHINE", human: "HUMAN" },
  tr: { machine: "MAKİNE", human: "İNSAN" },
  fr: { machine: "MACHINE", human: "HUMAIN" },
} as const;
const STAGE_ICONS: IconName[] = ["feed", "filter", "draft", "source", "gate", "publish", "reconcile"];
const RULE_ICONS: IconName[] = ["source", "gate"];

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/proof", locale, socialCard: "proof" });
}

export default async function ProofPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div className="mayda-shell">
      <section className="mayda-section">
        <header className="mayda-stack" style={{ maxWidth: "44rem" }}>
          <p className="mayda-kicker">{copy.kicker}</p>
          <h1 className="mayda-display" style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)" }}>
            {copy.heading[0]}
            <br />
            <span className="mayda-multiply">{copy.heading[1]}</span>
          </h1>
          <p className="mayda-lead">{copy.lead}</p>
          <p className="mayda-mono" style={{ color: "var(--mist)" }}>{copy.asOf}</p>
          <div className="mayda-hero-actions">
            <a href="https://satoshigazette.org" target="_blank" rel="noopener noreferrer" className="mayda-button mayda-button-outline">
              {copy.visitSg} <span aria-hidden>↗</span>
            </a>
            <Link href={localizePath("/case-studies/satoshi-gazette", locale)} className="mayda-text-link">
              {copy.readCase} <span aria-hidden>→</span>
            </Link>
          </div>
        </header>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <p className="mayda-kicker">{copy.factsKicker}</p>
        <div className="mayda-grid-3" style={{ marginTop: "1.4rem" }}>
          {copy.facts.map(([number, text]) => (
            <article key={text.slice(0, 24)} className="mayda-card">
              <p className="mayda-display" style={{ fontSize: "clamp(1.8rem,3.4vw,2.6rem)", color: "var(--mint)" }}>
                {number}
              </p>
              <p className="mayda-body mt-2" style={{ fontSize: "0.92rem" }}>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <header className="mayda-stack" style={{ maxWidth: "44rem" }}>
          <p className="mayda-kicker">{copy.pipelineKicker}</p>
          <p className="mayda-body">{copy.pipelineIntro}</p>
        </header>
        <div className="mayda-card" style={{ marginTop: "1.4rem", padding: "1rem" }}>
          <PipelineDiagram laneLabels={LANE_LABELS[locale]} />
        </div>
        <ol className="mayda-map-steps" style={{ marginTop: "1.4rem", maxWidth: "48rem" }}>
          {copy.pipeline.map(([stage, actor, text], index) => (
            <li key={stage}>
              <Icon name={STAGE_ICONS[index]} className="mayda-icon" />
              <span>
                <strong style={{ color: "var(--frost)" }}>{stage}</strong>{" "}
                <span className="mayda-tag" style={{ marginLeft: "0.5rem" }}>{actor}</span>
                <br />
                {text}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <p className="mayda-kicker">{copy.rulesKicker}</p>
        <div className="mayda-grid-2" style={{ marginTop: "1.4rem" }}>
          {copy.rules.map(([title, text], index) => (
            <article key={title} className="mayda-card" style={{ borderColor: "var(--mint-line)" }}>
              <IconBox name={RULE_ICONS[index]} tone="mint" />
              <h2 className="mayda-subheading">{title}</h2>
              <p className="mayda-body mt-3">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <div className="mayda-card" style={{ borderColor: "var(--cobalt-line)" }}>
          <p className="mayda-kicker">{copy.meaningKicker}</p>
          <p className="mayda-body" style={{ maxWidth: "48rem" }}>{copy.meaningText}</p>
          <p className="mayda-body mt-4" style={{ fontSize: "0.85rem" }}>{copy.meaningNote}</p>
        </div>
      </section>

      <section className="mayda-final-cta">
        <h2 className="mayda-heading">{copy.ctaHeading}</h2>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/contact", locale)} className="mayda-button">
            {copy.ctaStart} <span aria-hidden>→</span>
          </Link>
          <Link href={localizePath("/approach", locale)} className="mayda-button mayda-button-outline">
            {copy.ctaOffers}
          </Link>
        </div>
      </section>
    </div>
  );
}
