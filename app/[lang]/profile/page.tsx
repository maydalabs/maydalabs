import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";
import { VisualProofReel } from "@/components/VisualProofReel";

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
    actions: {
      work: "Inspect project evidence",
      github: "View GitHub",
      linkedin: "View LinkedIn",
      email: "Discuss a role",
    },
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
      ["Bitcoin + AI operations", "Bitcoin-native product work and approval-gated research, editorial, retrieval, and production workflows."],
    ],
    proofKicker: "Selected evidence / Individual ownership",
    proofHeading: "Four products. Clear boundaries.",
    proofIntro:
      "Each record separates what I personally own from the product’s public status and ownership. In-progress work is not presented as a launch or commercial outcome.",
    projects: [
      {
        number: "01",
        name: "HodlStay",
        status: "Client project · Live",
        ownership:
          "Founder-led product strategy and hands-on full-stack delivery across marketplace architecture, guest and host journeys, booking operations, payments, migration, analytics, lifecycle systems, localization, and launch preparation.",
        evidence: "Inspect HodlStay case",
        path: "/case-studies/hodlstay",
      },
      {
        number: "02",
        name: "Satoshi Gazette",
        status: "MaydaLabs product · Live active build",
        ownership:
          "Product direction and implementation across editorial UX, publishing workflows, evidence-aware data models, newsroom operations, guarded retrieval foundations, and approval-gated distribution.",
        evidence: "Inspect Satoshi Gazette case",
        path: "/case-studies/satoshi-gazette",
      },
      {
        number: "03",
        name: "Mortal Vault",
        status: "MaydaLabs product · Private alpha · Unaudited",
        ownership:
          "Product definition and implementation across the Solidity lifecycle, owner and beneficiary interfaces, event-backed state, threat modeling, tests, and explicit release gates.",
        evidence: "Inspect Mortal Vault case",
        path: "/case-studies/mortal-vault",
      },
      {
        number: "04",
        name: "Sofra",
        status: "MaydaLabs product · Private Phase 1",
        ownership:
          "Product architecture and implementation across bilingual guest, host, and operator journeys, marketplace state, public/private data boundaries, and demo-safe infrastructure.",
        evidence: "Inspect Sofra case",
        path: "/case-studies/sofra",
      },
    ],
    materialsKicker: "Application materials",
    materialsHeading: "Evaluate the work, then discuss the fit.",
    materialsBody:
      "For an active opportunity, I provide a reviewed, role-specific CV and application package instead of presenting one generic document as the right fit for every role.",
    requestCv: "Request the current CV",
    studioPrompt: "Looking for a product studio instead?",
    studioLink: "Explore MaydaLabs services",
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
    actions: {
      work: "Proje kanıtlarını incele",
      github: "GitHub’ı görüntüle",
      linkedin: "LinkedIn’i görüntüle",
      email: "Bir rolü konuşalım",
    },
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
      ["Bitcoin + yapay zekâ operasyonları", "Bitcoin-native ürünler ile onay kapılı araştırma, editoryal, erişim ve üretim akışları."],
    ],
    proofKicker: "Seçili kanıt / Bireysel sahiplik",
    proofHeading: "Dört ürün. Açık sınırlar.",
    proofIntro:
      "Her kayıt kişisel sorumluluğumu ürünün açık durumu ve sahipliğinden ayırır. Devam eden işler lansman veya ticari sonuç gibi sunulmaz.",
    projects: [
      { number: "01", name: "HodlStay", status: "Müşteri projesi · Canlı", ownership: "Pazar yeri mimarisi, misafir ve ev sahibi yolculukları, rezervasyon operasyonları, ödemeler, veri göçü, analitik, yaşam döngüsü sistemleri, yerelleştirme ve lansman hazırlığında kurucu liderliğinde ürün stratejisi ve uygulamalı full-stack geliştirme.", evidence: "HodlStay vakasını incele", path: "/case-studies/hodlstay" },
      { number: "02", name: "Satoshi Gazette", status: "MaydaLabs ürünü · Canlı aktif geliştirme", ownership: "Editoryal UX, yayın akışları, kanıt odaklı veri modelleri, haber merkezi operasyonları, korumalı erişim temelleri ve onay kapılı dağıtımda ürün yönü ve uygulama.", evidence: "Satoshi Gazette vakasını incele", path: "/case-studies/satoshi-gazette" },
      { number: "03", name: "Mortal Vault", status: "MaydaLabs ürünü · Özel alpha · Denetlenmedi", ownership: "Solidity yaşam döngüsü, sahip ve lehtar arayüzleri, event tabanlı durum, tehdit modeli, testler ve açık sürüm kapılarında ürün tanımı ve uygulama.", evidence: "Mortal Vault vakasını incele", path: "/case-studies/mortal-vault" },
      { number: "04", name: "Sofra", status: "MaydaLabs ürünü · Özel Phase 1", ownership: "İki dilli misafir, ev sahibi ve operatör yolculukları, pazar yeri durumu, açık/özel veri sınırları ve demo güvenli altyapıda ürün mimarisi ve uygulama.", evidence: "Sofra vakasını incele", path: "/case-studies/sofra" },
    ],
    materialsKicker: "Başvuru materyalleri",
    materialsHeading: "Önce işi değerlendirin, sonra uyumu konuşalım.",
    materialsBody:
      "Aktif bir fırsat için, tek bir genel belgeyi her role uygun göstermek yerine incelenmiş ve role özel CV ile başvuru paketi sunuyorum.",
    requestCv: "Güncel CV’yi isteyin",
    studioPrompt: "Ürün stüdyosu mu arıyorsunuz?",
    studioLink: "MaydaLabs hizmetlerini inceleyin",
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
      "J’étudie des rôles senior en ingénierie produit, full-stack, growth engineering et ownership technique où le logiciel et les systèmes marketing se renforcent.",
    actions: {
      work: "Voir les preuves projet",
      github: "Voir GitHub",
      linkedin: "Voir LinkedIn",
      email: "Discuter d’un rôle",
    },
    factsLabel: "Résumé du profil",
    facts: [
      ["Base", "Istanbul, Türkiye · Collaboration à distance et mondiale"],
      ["Rôles ciblés", "Full-stack senior · Ingénierie produit · Growth engineering"],
      ["Dossier", "CV adapté et preuves spécifiques fournis pour chaque candidature"],
    ],
    bridgeKicker: "Pourquoi cette combinaison compte",
    bridgeHeading: "Le produit et le système de croissance forment un seul parcours utilisateur.",
    bridgeBody: [
      "Mon parcours combine construction logicielle et opérations marketing concrètes. Je peux travailler de l’interface et du modèle de données jusqu’à l’acquisition, la mesure, le cycle de vie, les systèmes de contenu et la fiabilité en production.",
      "Cette amplitude est particulièrement utile aux équipes qui veulent comprendre le système commercial et opérationnel sans perdre la discipline d’ingénierie ni les limites des preuves.",
    ],
    capabilityKicker: "Champ d’action / Fondé sur les preuves",
    capabilityHeading: "Ce que je peux prendre en charge.",
    capabilities: [
      ["Ingénierie produit", "Applications Next.js et React, modèles de données, intégrations, marketplaces, paiements et workflows opérateurs."],
      ["Growth engineering", "Analytics, conversion, e-mails de cycle de vie, SEO technique, localisation, campagnes et fondations d’expérimentation."],
      ["Ownership produit", "Cadrage, architecture de l’information, versions, décisions transverses, documentation et transmission opérationnelle."],
      ["Bitcoin + opérations IA", "Produits Bitcoin-native et workflows de recherche, édition, recherche et production avec validation humaine."],
    ],
    proofKicker: "Preuves sélectionnées / Ownership individuel",
    proofHeading: "Quatre produits. Des limites claires.",
    proofIntro:
      "Chaque fiche distingue ma responsabilité personnelle du statut public et de la propriété du produit. Un travail en cours n’est pas présenté comme un lancement ou un résultat commercial.",
    projects: [
      { number: "01", name: "HodlStay", status: "Projet client · En ligne", ownership: "Stratégie produit dirigée par le fondateur et livraison full-stack sur architecture marketplace, parcours voyageurs et hôtes, réservations, paiements, migration, analytics, cycle de vie, localisation et préparation du lancement.", evidence: "Voir le cas HodlStay", path: "/case-studies/hodlstay" },
      { number: "02", name: "Satoshi Gazette", status: "Produit MaydaLabs · Construction active en ligne", ownership: "Direction produit et réalisation sur UX éditoriale, publication, modèles de données fondés sur les preuves, opérations de rédaction, fondations de recherche gardées et distribution sous validation.", evidence: "Voir le cas Satoshi Gazette", path: "/case-studies/satoshi-gazette" },
      { number: "03", name: "Mortal Vault", status: "Produit MaydaLabs · Alpha privée · Non audité", ownership: "Définition et réalisation du cycle Solidity, interfaces propriétaire et bénéficiaire, état fondé sur les événements, modèle de menace, tests et conditions de sortie explicites.", evidence: "Voir le cas Mortal Vault", path: "/case-studies/mortal-vault" },
      { number: "04", name: "Sofra", status: "Produit MaydaLabs · Phase 1 privée", ownership: "Architecture et réalisation des parcours bilingues invité, hôte et opérateur, états marketplace, limites public/privé et infrastructure de démo sûre.", evidence: "Voir le cas Sofra", path: "/case-studies/sofra" },
    ],
    materialsKicker: "Dossier de candidature",
    materialsHeading: "Évaluez le travail, puis discutons de l’adéquation.",
    materialsBody:
      "Pour une opportunité active, je fournis un CV vérifié et adapté au rôle plutôt que de présenter un document générique comme pertinent partout.",
    requestCv: "Demander le CV actuel",
    studioPrompt: "Vous cherchez plutôt un studio produit ?",
    studioLink: "Découvrir les services MaydaLabs",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({
    ...COPY[locale].meta,
    path: "/profile",
    locale,
    socialCard: "profile",
  });
}

export default async function ProfilePage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];
  const roleEmail = "mailto:info@maydalabs.com?subject=Role%20conversation%20with%20Mehmet%20E.%20Mayda";
  const cvEmail = "mailto:info@maydalabs.com?subject=Current%20CV%20request%20for%20Mehmet%20E.%20Mayda";

  return (
    <div className="studio-inner-page profile-page" id="mehmet-e-mayda">
      <section className="studio-inner-hero profile-hero">
        <p className="studio-kicker">{copy.kicker}</p>
        <h1>{copy.heading[0]}<br /><em>{copy.heading[1]}</em></h1>
        <p className="profile-intro">{copy.intro}</p>
        <p className="profile-availability">{copy.availability}</p>
        <div className="profile-actions">
          <a href="#evidence" className="studio-button">{copy.actions.work} <span aria-hidden>↓</span></a>
          <a href="https://github.com/maydalabs" target="_blank" rel="me noopener noreferrer" className="studio-button studio-button-ghost">{copy.actions.github} <span aria-hidden>↗</span></a>
          <a href="https://www.linkedin.com/in/mehmet-e-mayda/" target="_blank" rel="me noopener noreferrer" className="studio-button studio-button-ghost">{copy.actions.linkedin} <span aria-hidden>↗</span></a>
        </div>
      </section>

      <VisualProofReel locale={locale} placement="profile" />

      <section className="profile-facts" aria-label={copy.factsLabel}>
        {copy.facts.map(([term, detail]) => (
          <article key={term}><span>{term}</span><strong>{detail}</strong></article>
        ))}
      </section>

      <section className="profile-bridge">
        <div><p className="studio-kicker">{copy.bridgeKicker}</p><h2>{copy.bridgeHeading}</h2></div>
        <div>{copy.bridgeBody.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>

      <section className="profile-capabilities">
        <div className="studio-section-heading">
          <div><p className="studio-kicker">{copy.capabilityKicker}</p><h2>{copy.capabilityHeading}</h2></div>
        </div>
        <div className="profile-capability-grid">
          {copy.capabilities.map(([title, description], index) => (
            <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>

      <section className="profile-proof" id="evidence">
        <div className="studio-section-heading">
          <div><p className="studio-kicker">{copy.proofKicker}</p><h2>{copy.proofHeading}</h2></div>
          <p>{copy.proofIntro}</p>
        </div>
        <div className="profile-project-list">
          {copy.projects.map((project) => (
            <article key={project.name}>
              <header><span>{project.number}</span><strong>{project.name}</strong><small>{project.status}</small></header>
              <p>{project.ownership}</p>
              <Link href={localizePath(project.path, locale)} className="studio-text-link">{project.evidence} <span aria-hidden>↗</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-materials">
        <div>
          <p className="studio-kicker">{copy.materialsKicker}</p>
          <h2>{copy.materialsHeading}</h2>
          <p>{copy.materialsBody}</p>
        </div>
        <div className="profile-material-actions">
          <a href={roleEmail} className="studio-button">{copy.actions.email} <span aria-hidden>↗</span></a>
          <a href={cvEmail} className="studio-button studio-button-ghost">{copy.requestCv} <span aria-hidden>↗</span></a>
        </div>
        <p>{copy.studioPrompt} <Link href={localizePath("/services", locale)}>{copy.studioLink} →</Link></p>
      </section>
    </div>
  );
}
