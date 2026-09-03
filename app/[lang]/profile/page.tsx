import Image from "next/image";
import portrait from "@/public/profile/mehmet-e-mayda-portrait.jpg";
import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "Mehmet E. Mayda — Founder profile",
      socialTitle: "Mehmet E. Mayda · Full-stack product builder",
      description:
        "A hiring-focused profile of Mehmet E. Mayda, connecting full-stack product engineering, growth systems, Bitcoin products, and public project evidence.",
    },
    kicker: "Founder profile / For hiring teams",
    heading: ["Full-stack product builder", "across software and growth."],
    intro:
      "I build production web products and the systems around them: product flows, payments, lifecycle communication, analytics, technical SEO, localization, editorial operations, and AI-assisted workflows with deliberate human control.",
    availability:
      "Considering senior product engineering, full-stack, growth engineering, and technical product ownership roles where software-building and marketing systems strengthen each other.",
    actions: { work: "Inspect project evidence", github: "GitHub", linkedin: "LinkedIn", email: "Discuss a role" },
    factsLabel: "Profile summary",
    facts: [
      ["Base", "Istanbul, Türkiye · Remote and global collaboration"],
      ["Role focus", "Senior full-stack · Product engineering · Growth engineering"],
      ["Application materials", "A tailored CV and role-specific evidence are supplied with each application"],
    ],
    bridgeKicker: "Why this combination matters",
    bridgeHeading: "The product surface and the growth system are one user journey.",
    bridgeBody: [
      "My background combines hands-on software building with marketing operations. I can work from interface and data model through acquisition, measurement, lifecycle communication, content systems, and production reliability.",
      "That range is most useful in product teams that need an engineer to understand the commercial and operational system without losing engineering discipline or evidence boundaries.",
    ],
    capabilityKicker: "Working range / Evidence-led",
    capabilityHeading: "What I can own.",
    capabilities: [
      ["Product engineering", "Next.js and React applications, data models, integrations, marketplaces, payments, and operator workflows."],
      ["Growth engineering", "Analytics, conversion surfaces, lifecycle email, technical SEO, localization, campaigns, and experimentation foundations."],
      ["Product ownership", "Problem framing, information architecture, release shaping, cross-functional decisions, documentation, and operational handover."],
      ["AI operations + Bitcoin payments", "Approval-gated research, editorial, retrieval, and production workflows; Bitcoin-native product and payment work."],
    ],
    proofKicker: "Selected evidence / Individual ownership",
    proofHeading: "Four products. Clear boundaries.",
    proofIntro:
      "Each record separates what I personally own from the product's public status and ownership. In-progress work is not presented as a launch or commercial outcome.",
    projects: [
      { number: "01", name: "HodlStay", status: "Client build · Live", ownership: "Founder-led product strategy and hands-on full-stack delivery across marketplace architecture, guest and host journeys, booking operations, payments, migration, analytics, lifecycle systems, localization, and launch preparation.", evidence: "Inspect HodlStay case", path: "/case-studies/hodlstay" },
      { number: "02", name: "Satoshi Gazette", status: "Owned publication · Live", ownership: "Product direction and implementation across editorial UX, publishing workflows, evidence-aware data models, newsroom operations, guarded retrieval foundations, and approval-gated distribution.", evidence: "Inspect Satoshi Gazette case", path: "/case-studies/satoshi-gazette" },
      { number: "03", name: "Mortal Vault", status: "Lab product · Private alpha · Unaudited", ownership: "Product definition and implementation across the Solidity lifecycle, owner and beneficiary interfaces, event-backed state, threat modeling, tests, and explicit release gates.", evidence: "Inspect Mortal Vault case", path: "/case-studies/mortal-vault" },
      { number: "04", name: "Sofra", status: "Lab product · Private Phase 1", ownership: "Product architecture and implementation across bilingual guest, host, and operator journeys, marketplace state, public/private data boundaries, and demo-safe infrastructure.", evidence: "Inspect Sofra case", path: "/case-studies/sofra" },
    ],
    materialsKicker: "Application materials",
    materialsHeading: "Evaluate the work, then discuss the fit.",
    materialsBody:
      "For an active opportunity, I provide a reviewed, role-specific CV and application package instead of presenting one generic document as the right fit for every role.",
    requestCv: "Request the current CV",
    studioPrompt: "Looking for the company instead?",
    studioLink: "Explore how MaydaLabs works",
  },
  tr: {
    meta: {
      title: "Mehmet E. Mayda — Kurucu profili",
      socialTitle: "Mehmet E. Mayda · Full-stack ürün geliştirici",
      description:
        "Mehmet E. Mayda'nın full-stack ürün mühendisliği, büyüme sistemleri, Bitcoin ürünleri ve açık proje kanıtlarını birleştiren işe alım odaklı profili.",
    },
    kicker: "Kurucu profili / İşe alım ekipleri için",
    heading: ["Yazılım ve büyümeyi birleştiren", "full-stack ürün geliştirici."],
    intro:
      "Üretimde çalışan web ürünlerini ve çevrelerindeki sistemleri geliştiriyorum: ürün akışları, ödemeler, yaşam döngüsü iletişimi, analitik, teknik SEO, yerelleştirme, editoryal operasyonlar ve kontrollü yapay zekâ destekli iş akışları.",
    availability:
      "Yazılım geliştirme ile pazarlama sistemlerinin birbirini güçlendirdiği kıdemli ürün mühendisliği, full-stack, growth engineering ve teknik ürün sahipliği rollerini değerlendiriyorum.",
    actions: { work: "Proje kanıtlarını incele", github: "GitHub", linkedin: "LinkedIn", email: "Bir rolü konuşalım" },
    factsLabel: "Profil özeti",
    facts: [
      ["Konum", "İstanbul, Türkiye · Uzaktan ve küresel iş birliği"],
      ["Rol odağı", "Kıdemli full-stack · Ürün mühendisliği · Growth engineering"],
      ["Başvuru materyalleri", "Her başvuruda role özel CV ve kanıt paketi sunulur"],
    ],
    bridgeKicker: "Bu birleşim neden önemli",
    bridgeHeading: "Ürün yüzeyi ile büyüme sistemi tek bir kullanıcı yolculuğudur.",
    bridgeBody: [
      "Geçmişim uygulamalı yazılım geliştirme ile pazarlama operasyonlarını birleştiriyor. Arayüz ve veri modelinden edinim, ölçüm, yaşam döngüsü iletişimi, içerik sistemleri ve üretim güvenilirliğine kadar çalışabiliyorum.",
      "Bu kapsam; ticari ve operasyonel sistemi anlayan, ancak mühendislik disiplini ile kanıt sınırlarını koruyan bir geliştiriciye ihtiyaç duyan ürün ekiplerinde en değerlidir.",
    ],
    capabilityKicker: "Çalışma alanı / Kanıt odaklı",
    capabilityHeading: "Neleri sahiplenebilirim.",
    capabilities: [
      ["Ürün mühendisliği", "Next.js ve React uygulamaları, veri modelleri, entegrasyonlar, pazar yerleri, ödemeler ve operatör akışları."],
      ["Growth engineering", "Analitik, dönüşüm yüzeyleri, yaşam döngüsü e-postaları, teknik SEO, yerelleştirme, kampanyalar ve deney altyapısı."],
      ["Ürün sahipliği", "Problem çerçeveleme, bilgi mimarisi, sürüm şekillendirme, ekipler arası kararlar, dokümantasyon ve operasyonel devir."],
      ["Yapay zekâ operasyonları + Bitcoin ödemeleri", "Onay kapılı araştırma, editoryal, erişim ve üretim akışları; Bitcoin-native ürün ve ödeme işleri."],
    ],
    proofKicker: "Seçili kanıt / Bireysel sahiplik",
    proofHeading: "Dört ürün. Açık sınırlar.",
    proofIntro:
      "Her kayıt kişisel sorumluluğumu ürünün açık durumu ve sahipliğinden ayırır. Devam eden işler lansman veya ticari sonuç gibi sunulmaz.",
    projects: [
      { number: "01", name: "HodlStay", status: "Müşteri ürünü · Canlı", ownership: "Pazar yeri mimarisi, misafir ve ev sahibi yolculukları, rezervasyon operasyonları, ödemeler, veri göçü, analitik, yaşam döngüsü sistemleri, yerelleştirme ve lansman hazırlığında kurucu liderliğinde ürün stratejisi ve uygulamalı full-stack geliştirme.", evidence: "HodlStay vakasını incele", path: "/case-studies/hodlstay" },
      { number: "02", name: "Satoshi Gazette", status: "Sahip olunan yayın · Canlı", ownership: "Editoryal UX, yayın akışları, kanıt odaklı veri modelleri, haber merkezi operasyonları, korumalı erişim temelleri ve onay kapılı dağıtımda ürün yönü ve uygulama.", evidence: "Satoshi Gazette vakasını incele", path: "/case-studies/satoshi-gazette" },
      { number: "03", name: "Mortal Vault", status: "Lab ürünü · Özel alfa · Denetlenmedi", ownership: "Solidity yaşam döngüsü, sahip ve lehtar arayüzleri, event tabanlı durum, tehdit modeli, testler ve açık sürüm kapılarında ürün tanımı ve uygulama.", evidence: "Mortal Vault vakasını incele", path: "/case-studies/mortal-vault" },
      { number: "04", name: "Sofra", status: "Lab ürünü · Özel Faz 1", ownership: "İki dilli misafir, ev sahibi ve operatör yolculukları, pazar yeri durumu, açık/özel veri sınırları ve demo güvenli altyapıda ürün mimarisi ve uygulama.", evidence: "Sofra vakasını incele", path: "/case-studies/sofra" },
    ],
    materialsKicker: "Başvuru materyalleri",
    materialsHeading: "Önce işi değerlendirin, sonra uyumu konuşalım.",
    materialsBody:
      "Aktif bir fırsat için, tek bir genel belgeyi her role uygun göstermek yerine incelenmiş ve role özel CV ile başvuru paketi sunuyorum.",
    requestCv: "Güncel CV'yi isteyin",
    studioPrompt: "Şirketi mi arıyorsunuz?",
    studioLink: "MaydaLabs'in nasıl çalıştığını keşfedin",
  },
  fr: {
    meta: {
      title: "Mehmet E. Mayda — Profil fondateur",
      socialTitle: "Mehmet E. Mayda · Builder produit full-stack",
      description:
        "Le profil recrutement de Mehmet E. Mayda, reliant ingénierie produit full-stack, systèmes de croissance, produits Bitcoin et preuves publiques.",
    },
    kicker: "Profil fondateur / Pour les équipes de recrutement",
    heading: ["Builder produit full-stack", "entre logiciel et croissance."],
    intro:
      "Je construis des produits web en production et les systèmes qui les entourent : parcours produit, paiements, communication de cycle de vie, analytics, SEO technique, localisation, opérations éditoriales et workflows IA sous contrôle humain.",
    availability:
      "J'étudie des rôles senior en ingénierie produit, full-stack, growth engineering et ownership technique où le logiciel et les systèmes marketing se renforcent.",
    actions: { work: "Voir les preuves projet", github: "GitHub", linkedin: "LinkedIn", email: "Discuter d'un rôle" },
    factsLabel: "Résumé du profil",
    facts: [
      ["Base", "Istanbul, Türkiye · Collaboration à distance et mondiale"],
      ["Rôles ciblés", "Full-stack senior · Ingénierie produit · Growth engineering"],
      ["Dossier", "CV adapté et preuves spécifiques fournis pour chaque candidature"],
    ],
    bridgeKicker: "Pourquoi cette combinaison compte",
    bridgeHeading: "Le produit et le système de croissance forment un seul parcours utilisateur.",
    bridgeBody: [
      "Mon parcours combine construction logicielle et opérations marketing concrètes. Je peux travailler de l'interface et du modèle de données jusqu'à l'acquisition, la mesure, le cycle de vie, les systèmes de contenu et la fiabilité en production.",
      "Cette amplitude est particulièrement utile aux équipes qui veulent comprendre le système commercial et opérationnel sans perdre la discipline d'ingénierie ni les limites des preuves.",
    ],
    capabilityKicker: "Champ d'action / Fondé sur les preuves",
    capabilityHeading: "Ce que je peux prendre en charge.",
    capabilities: [
      ["Ingénierie produit", "Applications Next.js et React, modèles de données, intégrations, marketplaces, paiements et workflows opérateurs."],
      ["Growth engineering", "Analytics, conversion, e-mails de cycle de vie, SEO technique, localisation, campagnes et fondations d'expérimentation."],
      ["Ownership produit", "Cadrage, architecture de l'information, versions, décisions transverses, documentation et transmission opérationnelle."],
      ["Opérations IA + paiements Bitcoin", "Workflows de recherche, d'édition, de retrieval et de production avec validation humaine ; produits et paiements Bitcoin-native."],
    ],
    proofKicker: "Preuves sélectionnées / Ownership individuel",
    proofHeading: "Quatre produits. Des limites claires.",
    proofIntro:
      "Chaque fiche distingue ma responsabilité personnelle du statut public et de la propriété du produit. Un travail en cours n'est pas présenté comme un lancement ou un résultat commercial.",
    projects: [
      { number: "01", name: "HodlStay", status: "Produit client · En ligne", ownership: "Stratégie produit dirigée par le fondateur et livraison full-stack sur architecture marketplace, parcours voyageurs et hôtes, réservations, paiements, migration, analytics, cycle de vie, localisation et préparation du lancement.", evidence: "Voir le cas HodlStay", path: "/case-studies/hodlstay" },
      { number: "02", name: "Satoshi Gazette", status: "Publication détenue · En ligne", ownership: "Direction produit et réalisation sur UX éditoriale, publication, modèles de données fondés sur les preuves, opérations de rédaction, fondations de recherche gardées et distribution sous validation.", evidence: "Voir le cas Satoshi Gazette", path: "/case-studies/satoshi-gazette" },
      { number: "03", name: "Mortal Vault", status: "Produit lab · Alpha privée · Non audité", ownership: "Définition et réalisation du cycle Solidity, interfaces propriétaire et bénéficiaire, état fondé sur les événements, modèle de menace, tests et conditions de sortie explicites.", evidence: "Voir le cas Mortal Vault", path: "/case-studies/mortal-vault" },
      { number: "04", name: "Sofra", status: "Produit lab · Phase 1 privée", ownership: "Architecture et réalisation des parcours bilingues invité, hôte et opérateur, états marketplace, limites public/privé et infrastructure de démo sûre.", evidence: "Voir le cas Sofra", path: "/case-studies/sofra" },
    ],
    materialsKicker: "Dossier de candidature",
    materialsHeading: "Évaluez le travail, puis discutons de l'adéquation.",
    materialsBody:
      "Pour une opportunité active, je fournis un CV vérifié et adapté au rôle plutôt que de présenter un document générique comme pertinent partout.",
    requestCv: "Demander le CV actuel",
    studioPrompt: "Vous cherchez plutôt l'entreprise ?",
    studioLink: "Découvrir comment MaydaLabs travaille",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/profile", locale, socialCard: "profile" });
}

export default async function ProfilePage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];
  const roleEmail = "mailto:info@maydalabs.com?subject=Role%20conversation%20with%20Mehmet%20E.%20Mayda";
  const cvEmail = "mailto:info@maydalabs.com?subject=Current%20CV%20request%20for%20Mehmet%20E.%20Mayda";

  return (
    <div className="mayda-shell" id="mehmet-e-mayda">
      <section className="mayda-section">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
          <header className="mayda-stack">
            <p className="mayda-kicker">{copy.kicker}</p>
            <h1 className="mayda-display" style={{ fontSize: "clamp(2rem,4.6vw,3.4rem)" }}>
              {copy.heading[0]}
              <br />
              <span className="mayda-multiply">{copy.heading[1]}</span>
            </h1>
            <p className="mayda-lead">{copy.intro}</p>
            <p className="mayda-body">{copy.availability}</p>
            <div className="mayda-hero-actions">
              <a href="#evidence" className="mayda-button">
                {copy.actions.work} <span aria-hidden>↓</span>
              </a>
              <a href="https://github.com/maydalabs" target="_blank" rel="me noopener noreferrer" className="mayda-button mayda-button-outline">
                {copy.actions.github} <span aria-hidden>↗</span>
              </a>
            </div>
          </header>

          <aside className="mayda-card" style={{ alignSelf: "start" }} aria-label={copy.factsLabel}>
            <Image src={portrait} alt="Mehmet Emin Mayda" placeholder="blur" sizes="(min-width: 1024px) 28rem, 90vw" className="mayda-profile-portrait" priority />
            <a href="https://www.linkedin.com/in/mehmet-e-mayda/" target="_blank" rel="me noopener noreferrer" className="mayda-profile-linkedin">
              {copy.actions.linkedin} · Mehmet E. Mayda <span aria-hidden>↗</span>
            </a>
            <p className="mayda-kicker">{copy.factsLabel}</p>
            <dl className="mayda-dl">
              {copy.facts.map(([term, detail]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <div className="mayda-stack" style={{ maxWidth: "44rem" }}>
          <p className="mayda-kicker">{copy.bridgeKicker}</p>
          <h2 className="mayda-heading">{copy.bridgeHeading}</h2>
          {copy.bridgeBody.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mayda-body">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <p className="mayda-kicker">{copy.capabilityKicker}</p>
        <h2 className="mayda-heading">{copy.capabilityHeading}</h2>
        <div className="mayda-grid-2" style={{ marginTop: "1.5rem" }}>
          {copy.capabilities.map(([title, description], index) => (
            <article key={title} className="mayda-card">
              <p className="mayda-card-number">0{index + 1}</p>
              <h3 className="mayda-subheading mt-2">{title}</h3>
              <p className="mayda-body mt-3">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }} id="evidence">
        <p className="mayda-kicker">{copy.proofKicker}</p>
        <h2 className="mayda-heading">{copy.proofHeading}</h2>
        <p className="mayda-body mt-4">{copy.proofIntro}</p>
        <div className="mayda-stack" style={{ marginTop: "1.6rem" }}>
          {copy.projects.map((project) => (
            <article key={project.name} className="mayda-card">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="mayda-card-number">{project.number}</span>
                <h3 className="mayda-subheading">{project.name}</h3>
                <span className="mayda-tag">{project.status}</span>
              </div>
              <p className="mayda-body mt-3" style={{ maxWidth: "48rem" }}>
                {project.ownership}
              </p>
              <Link href={localizePath(project.path, locale)} className="mayda-text-link mt-4" style={{ alignSelf: "flex-start", display: "inline-flex" }}>
                {project.evidence} <span aria-hidden>→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <div className="mayda-card" style={{ borderColor: "var(--cobalt-line)" }}>
          <p className="mayda-kicker">{copy.materialsKicker}</p>
          <h2 className="mayda-heading">{copy.materialsHeading}</h2>
          <p className="mayda-body mt-3">{copy.materialsBody}</p>
          <div className="mayda-hero-actions mt-6">
            <a href={roleEmail} className="mayda-button">
              {copy.actions.email} <span aria-hidden>→</span>
            </a>
            <a href={cvEmail} className="mayda-button mayda-button-outline">
              {copy.requestCv}
            </a>
          </div>
          <p className="mayda-body mt-6" style={{ fontSize: "0.9rem" }}>
            {copy.studioPrompt}{" "}
            <Link href={localizePath("/approach", locale)} className="mayda-text-link">
              {copy.studioLink} →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
