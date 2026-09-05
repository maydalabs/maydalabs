import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { GateFigure } from "@/components/GateFigure";
import { FounderNote } from "@/components/FounderNote";
import { SignalField } from "@/components/SignalField";
import { BitcoinDesk } from "@/components/BitcoinDesk";
import { StackStrip } from "@/components/StackStrip";
import { Reveal } from "@/components/Reveal";
import { ApprovalQueue } from "@/components/illustrations/ApprovalQueue";
import { PaymentsFlow } from "@/components/illustrations/PaymentsFlow";
import { Icon, IconBox, type IconName } from "@/components/icons";
import { SgLatest } from "@/components/SgLatest";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "MaydaLabs — AI-run operations, you stay in control",
      socialTitle: "Let AI run your operation while you stay in control! · MaydaLabs",
      description:
        "MaydaLabs installs AI-run operations for companies whose content, research, or payment workflows eat the team's week. Source-linked, approval-gated, publicly proven on Satoshi Gazette.",
    },
    availability: "Taking pilot clients",
    kicker: "AI-run operations, human-approved",
    hero: ["Let AI run your operation", "while you stay in control!"],
    lead: "We install AI-run operations for companies whose content, research, or payment workflows eat the team's week. Every claim is source-linked. Nothing goes out without your approval. Satoshi Gazette, our own publication, runs on it.",
    pilotCta: "Start a pilot",
    proofCta: "See the system live",
    offersKicker: "Two offers, both already running in production",
    offersHeading: "Pick the workflow. We install the system.",
    offers: [
      {
        title: "Evidence-gated AI operations",
        text: "One of your workflows — content, research, or internal ops — rebuilt so AI produces the work. Every claim carries its source or is marked unverified. A human approves anything that leaves the building.",
        proof: "Proof: Satoshi Gazette runs on it, publicly.",
        price: "Pilot from $2,500 · 3–4 weeks · then from $1,000/mo",
        href: "/approach",
      },
      {
        title: "Bitcoin payments engineering",
        text: "BTCPay Server done properly: deployment, integration, the full invoice-to-payout lifecycle, signed webhook verification, settlement reconciliation, hardening.",
        proof: "Proof: HodlStay's production payment system, built end to end.",
        price: "Scoped fixed-price engagements",
        href: "/approach",
      },
    ],
    offersLink: "Full offer details",
    flagshipKicker: "Flagship product",
    flagshipHeading: "Satoshi Gazette is the demo.",
    flagshipLead: "A Bitcoin-only publication operated through our system. Not a mockup, not a pitch deck — a running business you can read right now.",
    flagshipFacts: [
      "34 pieces published; every publication human-approved",
      "Every claim source-linked, or it doesn't publish as fact",
      "Every distribution action recorded with a public URL",
      "A treasury data desk where each entry cites a regulatory filing or audited report",
    ],
    flagshipVisit: "Read the publication",
    flagshipSystem: "How the system works",
    stepsKicker: "How a pilot runs",
    steps: [
      ["Scope", "One workflow, named precisely: what comes in, what goes out, who approves."],
      ["Install", "The pipeline, the sourcing rules, and the approval gate — in your accounts, owned by you."],
      ["Operate", "AI produces daily. Your review takes minutes, not hours."],
      ["Measure", "Output, approval latency, source coverage — reported plainly, then extended to the next workflow."],
    ],
    rulesKicker: "House rules",
    rules: [
      "No approval means no external action.",
      "Source-linked, or marked unverified.",
      "Your accounts, your data, your system.",
    ],
    proofKicker: "Live in production",
    proofItems: [
      ["satoshigazette.org", "Owned publication · runs on our system", "https://satoshigazette.org"],
      ["hodlstay.com", "Client build · Bitcoin payments live", "https://hodlstay.com"],
    ],
    workKicker: "Selected work",
    workHeading: "Built by MaydaLabs.",
    work: [
      {
        href: "/case-studies/satoshi-gazette",
        image: "/work/satoshi-gazette-2026-09-home.jpg",
        alt: "Satoshi Gazette publication homepage",
        tags: ["Owned publication", "Live"],
        title: "Satoshi Gazette",
        text: "An independent Bitcoin publication built and operated as a product: editorial surfaces, data systems, and a guarded publishing pipeline.",
      },
      {
        href: "/case-studies/hodlstay",
        image: "/work/hodlstay-2026-09-home.jpg",
        alt: "HodlStay global booking marketplace homepage",
        tags: ["Client build", "Live"],
        title: "HodlStay",
        text: "A global stay marketplace with Bitcoin payments in production: discovery, host operations, availability, BTCPay lifecycle, migration.",
      },
    ],
    allWork: "All work",
    ctaKicker: "Any industry, one workflow at a time",
    ctaHeading: ["One workflow.", "Four weeks. Then decide."],
    ctaLead: "A pilot is deliberately small: one bounded workflow, a fixed price, and your approval on everything external. If the numbers don't convince you, you keep the system anyway.",
    ctaStart: "Start a pilot",
    ctaTalk: "Or write directly",
  },
  tr: {
    meta: {
      title: "MaydaLabs — Yapay zekâ ile çalışan operasyonlar, kontrol sizde",
      socialTitle: "Operasyonunuzu yapay zekâ yürütsün, kontrol sizde kalsın! · MaydaLabs",
      description:
        "MaydaLabs, içerik, araştırma veya ödeme iş akışları ekibin haftasını yiyen şirketler için yapay zekâ ile çalışan operasyonlar kurar. Kaynağa bağlı, onay kapılı; Satoshi Gazette üzerinde herkese açık kanıtlı.",
    },
    availability: "Pilot müşteri alıyoruz",
    kicker: "Yapay zekâ ile çalışan, insan onaylı operasyonlar",
    hero: ["Operasyonunuzu yapay zekâ yürütsün,", "kontrol sizde kalsın!"],
    lead: "İçerik, araştırma veya ödeme iş akışları ekibin haftasını yiyen şirketler için yapay zekâ ile çalışan operasyonlar kuruyoruz. Her iddia kaynağa bağlı. Sizin onayınız olmadan hiçbir şey dışarı çıkmaz. Kendi yayınımız Satoshi Gazette bu sistemle çalışıyor.",
    pilotCta: "Pilot başlat",
    proofCta: "Sistemi canlı görün",
    offersKicker: "İki teklif, ikisi de üretimde çalışıyor",
    offersHeading: "İş akışını seçin. Sistemi biz kuralım.",
    offers: [
      {
        title: "Kanıt kapılı yapay zekâ operasyonları",
        text: "İş akışlarınızdan biri — içerik, araştırma veya iç operasyon — işi yapay zekânın ürettiği biçimde yeniden kurulur. Her iddia kaynağını taşır veya doğrulanmamış olarak işaretlenir. Dışarı çıkan her şeyi bir insan onaylar.",
        proof: "Kanıt: Satoshi Gazette bu sistemle, herkese açık biçimde çalışıyor.",
        price: "Pilot 2.500 $'dan · 3–4 hafta · sonrası aylık 1.000 $'dan",
        href: "/approach",
      },
      {
        title: "Bitcoin ödeme mühendisliği",
        text: "BTCPay Server'ın doğrusu: kurulum, entegrasyon, faturadan ödemeye tam yaşam döngüsü, imzalı webhook doğrulaması, mutabakat, sıkılaştırma.",
        proof: "Kanıt: HodlStay'in üretimdeki ödeme sistemi, uçtan uca.",
        price: "Kapsamı belirli, sabit fiyatlı çalışmalar",
        href: "/approach",
      },
    ],
    offersLink: "Tekliflerin tamamı",
    flagshipKicker: "Amiral ürün",
    flagshipHeading: "Demo, Satoshi Gazette'in kendisi.",
    flagshipLead: "Sistemimizle işletilen, sadece Bitcoin'e odaklı bir yayın. Mockup değil, sunum değil — şu anda okuyabileceğiniz, çalışan bir iş.",
    flagshipFacts: [
      "34 yayınlanmış içerik; her yayın insan onaylı",
      "Her iddia kaynağa bağlı; değilse gerçek olarak yayınlanmaz",
      "Her dağıtım eylemi herkese açık URL ile kayıtlı",
      "Her kaydın düzenleyici dosyaya veya denetlenmiş rapora dayandığı bir hazine veri masası",
    ],
    flagshipVisit: "Yayını okuyun",
    flagshipSystem: "Sistem nasıl çalışıyor",
    stepsKicker: "Pilot nasıl ilerler",
    steps: [
      ["Kapsam", "Tek iş akışı, net tanım: ne girer, ne çıkar, kim onaylar."],
      ["Kurulum", "Hat, kaynak kuralları ve onay kapısı — sizin hesaplarınızda, sahibi sizsiniz."],
      ["İşletim", "Yapay zekâ her gün üretir. İncelemeniz saatler değil, dakikalar sürer."],
      ["Ölçüm", "Üretim, onay süresi, kaynak kapsamı — açıkça raporlanır; sonra sıradaki iş akışına genişletilir."],
    ],
    rulesKicker: "Ev kuralları",
    rules: [
      "Onay yoksa dış eylem yok.",
      "Kaynağa bağlı; değilse doğrulanmamış olarak işaretli.",
      "Sizin hesaplarınız, sizin veriniz, sizin sisteminiz.",
    ],
    proofKicker: "Üretimde canlı",
    proofItems: [
      ["satoshigazette.org", "Sahip olunan yayın · sistemimizle çalışıyor", "https://satoshigazette.org"],
      ["hodlstay.com", "Müşteri ürünü · Bitcoin ödemeleri canlı", "https://hodlstay.com"],
    ],
    workKicker: "Seçili işler",
    workHeading: "MaydaLabs imzalı.",
    work: [
      {
        href: "/case-studies/satoshi-gazette",
        image: "/work/satoshi-gazette-2026-09-home.jpg",
        alt: "Satoshi Gazette yayın ana sayfası",
        tags: ["Sahip olunan yayın", "Canlı"],
        title: "Satoshi Gazette",
        text: "Ürün olarak inşa edilip işletilen bağımsız bir Bitcoin yayını: editoryal yüzeyler, veri sistemleri ve korumalı bir yayınlama hattı.",
      },
      {
        href: "/case-studies/hodlstay",
        image: "/work/hodlstay-2026-09-home.jpg",
        alt: "HodlStay küresel rezervasyon pazarı ana sayfası",
        tags: ["Müşteri ürünü", "Canlı"],
        title: "HodlStay",
        text: "Bitcoin ödemeleri üretimde olan küresel bir konaklama pazarı: keşif, ev sahibi operasyonları, uygunluk, BTCPay yaşam döngüsü, veri göçü.",
      },
    ],
    allWork: "Tüm işler",
    ctaKicker: "Her sektör; her seferinde tek iş akışı",
    ctaHeading: ["Tek iş akışı.", "Dört hafta. Sonra karar verin."],
    ctaLead: "Pilot bilerek küçüktür: sınırları belli tek iş akışı, sabit fiyat ve dışa dönük her şeyde sizin onayınız. Rakamlar ikna etmezse sistem yine sizde kalır.",
    ctaStart: "Pilot başlat",
    ctaTalk: "Veya doğrudan yazın",
  },
  fr: {
    meta: {
      title: "MaydaLabs — Opérations pilotées par l'IA, vous gardez le contrôle",
      socialTitle: "Laissez l'IA faire tourner votre opération, vous gardez le contrôle ! · MaydaLabs",
      description:
        "MaydaLabs installe des opérations pilotées par l'IA pour les entreprises dont les flux de contenu, de recherche ou de paiement dévorent la semaine de l'équipe. Sources liées, approbation obligatoire, preuve publique sur Satoshi Gazette.",
    },
    availability: "Pilotes ouverts",
    kicker: "Opérations pilotées par l'IA, approuvées par un humain",
    hero: ["Laissez l'IA faire tourner votre opération,", "vous gardez le contrôle !"],
    lead: "Nous installons des opérations pilotées par l'IA pour les entreprises dont les flux de contenu, de recherche ou de paiement dévorent la semaine de l'équipe. Chaque affirmation est liée à sa source. Rien ne sort sans votre approbation. Satoshi Gazette, notre publication, tourne dessus.",
    pilotCta: "Lancer un pilote",
    proofCta: "Voir le système en direct",
    offersKicker: "Deux offres, déjà en production",
    offersHeading: "Choisissez le flux. Nous installons le système.",
    offers: [
      {
        title: "Opérations IA à preuves obligatoires",
        text: "Un de vos flux — contenu, recherche ou opérations internes — reconstruit pour que l'IA produise le travail. Chaque affirmation porte sa source ou est marquée non vérifiée. Un humain approuve tout ce qui sort.",
        proof: "Preuve : Satoshi Gazette tourne dessus, publiquement.",
        price: "Pilote dès 2 500 $ · 3–4 semaines · puis dès 1 000 $/mois",
        href: "/approach",
      },
      {
        title: "Ingénierie des paiements Bitcoin",
        text: "BTCPay Server fait correctement : déploiement, intégration, cycle complet facture-versement, vérification des webhooks signés, réconciliation, durcissement.",
        proof: "Preuve : le système de paiement en production de HodlStay, construit de bout en bout.",
        price: "Missions cadrées à prix fixe",
        href: "/approach",
      },
    ],
    offersLink: "Le détail des offres",
    flagshipKicker: "Produit phare",
    flagshipHeading: "Satoshi Gazette est la démo.",
    flagshipLead: "Une publication 100 % Bitcoin opérée par notre système. Pas une maquette, pas un deck — une activité qui tourne, lisible maintenant.",
    flagshipFacts: [
      "34 pièces publiées ; chaque publication approuvée par un humain",
      "Chaque affirmation liée à sa source, sinon elle n'est pas publiée comme un fait",
      "Chaque action de distribution enregistrée avec une URL publique",
      "Un data desk trésorerie où chaque entrée cite un dépôt réglementaire ou un rapport audité",
    ],
    flagshipVisit: "Lire la publication",
    flagshipSystem: "Comment le système fonctionne",
    stepsKicker: "Comment se déroule un pilote",
    steps: [
      ["Cadrer", "Un flux, nommé précisément : ce qui entre, ce qui sort, qui approuve."],
      ["Installer", "Le pipeline, les règles de sourçage et la porte d'approbation — dans vos comptes, à vous."],
      ["Opérer", "L'IA produit chaque jour. Votre revue prend des minutes, pas des heures."],
      ["Mesurer", "Production, délai d'approbation, couverture des sources — rapportés simplement, puis étendus au flux suivant."],
    ],
    rulesKicker: "Règles de la maison",
    rules: [
      "Pas d'approbation, pas d'action externe.",
      "Lié à la source, ou marqué non vérifié.",
      "Vos comptes, vos données, votre système.",
    ],
    proofKicker: "En production",
    proofItems: [
      ["satoshigazette.org", "Publication détenue · tourne sur notre système", "https://satoshigazette.org"],
      ["hodlstay.com", "Produit client · paiements Bitcoin en direct", "https://hodlstay.com"],
    ],
    workKicker: "Réalisations sélectionnées",
    workHeading: "Construit par MaydaLabs.",
    work: [
      {
        href: "/case-studies/satoshi-gazette",
        image: "/work/satoshi-gazette-2026-09-home.jpg",
        alt: "Page d'accueil de la publication Satoshi Gazette",
        tags: ["Publication détenue", "En ligne"],
        title: "Satoshi Gazette",
        text: "Une publication Bitcoin indépendante construite et opérée comme un produit : surfaces éditoriales, systèmes de données et pipeline de publication contrôlé.",
      },
      {
        href: "/case-studies/hodlstay",
        image: "/work/hodlstay-2026-09-home.jpg",
        alt: "Page d'accueil de la marketplace mondiale HodlStay",
        tags: ["Produit client", "En ligne"],
        title: "HodlStay",
        text: "Une marketplace mondiale de séjours avec paiements Bitcoin en production : découverte, opérations hôtes, disponibilité, cycle BTCPay, migration.",
      },
    ],
    allWork: "Toutes les réalisations",
    ctaKicker: "Tout secteur, un flux à la fois",
    ctaHeading: ["Un flux.", "Quatre semaines. Puis décidez."],
    ctaLead: "Un pilote est volontairement petit : un flux borné, un prix fixe, et votre approbation sur tout ce qui est externe. Si les chiffres ne convainquent pas, le système vous reste quand même.",
    ctaStart: "Lancer un pilote",
    ctaTalk: "Ou écrire directement",
  },
} as const;

const STACK_KICKER = {
  en: "Stack, rails, and who we build for",
  tr: "Yığın, raylar ve kimler için kurduğumuz",
  fr: "La pile, les rails, et pour qui nous construisons",
} as const;

const OFFER_ICONS: IconName[] = ["gate", "bitcoin"];
const STEP_ICONS: IconName[] = ["scope", "install", "machine", "report"];
const RULE_ICONS: IconName[] = ["gate", "source", "key"];

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/", locale, socialCard: "studio" });
}

export default async function HomePage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div>
      <section className="mayda-hero relative overflow-hidden">
        <SignalField />
        <div className="mayda-shell mayda-hero-grid relative z-10">
          <div className="mayda-stack-lg">
            <div className="mayda-stack" style={{ gap: "1.2rem" }}>
              <div className="mayda-availability">
                <span /> {copy.availability}
              </div>
              <p className="mayda-kicker" style={{ margin: 0 }}>{copy.kicker}</p>
              <h1 className="mayda-display">
                {copy.hero[0]}
                <br />
                <span className="mayda-multiply">{copy.hero[1]}</span>
              </h1>
              <p className="mayda-lead">{copy.lead}</p>
            </div>
            <div className="mayda-hero-actions">
              <Link href={localizePath("/contact", locale)} className="mayda-button">
                {copy.pilotCta} <span aria-hidden>→</span>
              </Link>
              <Link href={localizePath("/proof", locale)} className="mayda-button mayda-button-outline">
                {copy.proofCta}
              </Link>
            </div>
          </div>
          <GateFigure className="hidden md:block" />
        </div>
      </section>



      <section className="mayda-section">
        <div className="mayda-shell mayda-stack-lg">
          <header>
            <p className="mayda-kicker">{copy.offersKicker}</p>
            <h2 className="mayda-heading">{copy.offersHeading}</h2>
          </header>
          <div className="mayda-grid-2">
            {copy.offers.map((offer, index) => (
              <Reveal key={offer.title} delay={index * 120}>
                <Link href={localizePath(offer.href, locale)} className="mayda-card mayda-card-lift mayda-offer-card">
                  <div className="mayda-offer-figure" aria-hidden="true">
                    {index === 0 ? <ApprovalQueue /> : <PaymentsFlow />}
                  </div>
                  <IconBox name={OFFER_ICONS[index]} tone={index === 0 ? "mint" : "btc"} />
                  <h3 className="mayda-subheading">{offer.title}</h3>
                <p className="mayda-body mt-3">{offer.text}</p>
                <p className="mayda-body mt-3" style={{ color: "var(--frost)" }}>
                  {offer.proof}
                </p>
                  <p className="mayda-mono mt-4" style={{ color: "var(--mint)" }}>
                    {offer.price}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
          <Link href={localizePath("/approach", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
            {copy.offersLink} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section className="mayda-section-tight">
        <div className="mayda-shell">
          <div className="mayda-card" style={{ borderColor: "var(--cobalt-line)" }}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
              <div className="mayda-stack">
                <p className="mayda-kicker" style={{ margin: 0 }}>{copy.flagshipKicker}</p>
                <h2 className="mayda-heading">{copy.flagshipHeading}</h2>
                <p className="mayda-body">{copy.flagshipLead}</p>
                <ul className="mayda-case-section-body" style={{ paddingLeft: "1.1rem", margin: 0 }}>
                  {copy.flagshipFacts.map((fact) => (
                    <li key={fact.slice(0, 24)} style={{ marginBottom: "0.4rem" }}>{fact}</li>
                  ))}
                </ul>
                <div className="mayda-hero-actions" style={{ marginTop: "0.5rem" }}>
                  <a href="https://satoshigazette.org" target="_blank" rel="noopener noreferrer" className="mayda-button mayda-button-outline">
                    {copy.flagshipVisit} <span aria-hidden>↗</span>
                  </a>
                  <Link href={localizePath("/proof", locale)} className="mayda-text-link">
                    {copy.flagshipSystem} <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
              <div>
                <figure style={{ margin: 0, border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  <Image
                    src="/work/satoshi-gazette-2026-09-home.jpg"
                    alt={copy.work[0].alt}
                    width={1280}
                    height={720}
                    sizes="(max-width: 1024px) 100vw, 54vw"
                  />
                </figure>
                <Suspense fallback={null}><SgLatest locale={locale} /></Suspense>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mayda-section">
        <div className="mayda-shell mayda-stack-lg">
          <header>
            <p className="mayda-kicker">{copy.stepsKicker}</p>
          </header>
          <div className="mayda-grid-2">
            {copy.steps.map(([title, text], index) => (
              <article key={title} className="mayda-card">
                <div className="flex items-center justify-between">
                  <IconBox name={STEP_ICONS[index]} />
                  <p className="mayda-card-number">0{index + 1}</p>
                </div>
                <h3 className="mayda-subheading">{title}</h3>
                <p className="mayda-body mt-3">{text}</p>
              </article>
            ))}
          </div>
          <div>
            <p className="mayda-kicker">{copy.rulesKicker}</p>
            <div className="mayda-grid-3">
              {copy.rules.map((rule, index) => (
                <div key={rule.slice(0, 16)} className="mayda-rule-card">
                  <Icon name={RULE_ICONS[index]} />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FounderNote locale={locale} showPortrait={false} />


      <section className="mayda-section-tight">
        <div className="mayda-shell mayda-stack">
          <p className="mayda-kicker">{copy.proofKicker}</p>
          <div className="mayda-proof-strip" role="list">
            {copy.proofItems.map(([host, label, url]) => (
              <a key={host} role="listitem" href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                <strong>{host} ↗</strong>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mayda-section">
        <div className="mayda-shell mayda-stack-lg">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mayda-kicker">{copy.workKicker}</p>
              <h2 className="mayda-heading">{copy.workHeading}</h2>
            </div>
            <Link href={localizePath("/case-studies", locale)} className="mayda-text-link">
              {copy.allWork} <span aria-hidden>→</span>
            </Link>
          </header>
          <div className="mayda-grid-2">
            {copy.work.map((item) => (
              <Link key={item.href} href={localizePath(item.href, locale)} className="mayda-work-card">
                <figure>
                  <Image src={item.image} alt={item.alt} width={1430} height={894} sizes="(max-width: 720px) 100vw, 46vw" />
                </figure>
                <div className="mayda-work-card-body">
                  <div className="mayda-work-card-tags">
                    {item.tags.map((tag, index) => (
                      <span key={tag} className={`mayda-tag ${index === 0 ? "is-cobalt" : "is-mint"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={null}><BitcoinDesk locale={locale} /></Suspense>

      <StackStrip locale={locale} kicker={STACK_KICKER[locale]} />


      <section className="mayda-final-cta mayda-shell">
        <div className="mayda-availability">
          <span /> {copy.availability}
        </div>
        <p className="mayda-kicker" style={{ margin: 0 }}>{copy.ctaKicker}</p>
        <h2 className="mayda-display" style={{ fontSize: "clamp(2rem,5vw,3.6rem)" }}>
          {copy.ctaHeading[0]}
          <br />
          <span className="mayda-multiply">{copy.ctaHeading[1]}</span>
        </h2>
        <p className="mayda-body" style={{ maxWidth: "36rem" }}>{copy.ctaLead}</p>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/contact", locale)} className="mayda-button">
            {copy.ctaStart} <span aria-hidden>→</span>
          </Link>
          <a href="mailto:info@maydalabs.com" className="mayda-button mayda-button-outline">
            {copy.ctaTalk}
          </a>
        </div>
      </section>
    </div>
  );
}
