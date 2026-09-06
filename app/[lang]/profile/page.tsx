import Image from "next/image";
import portrait from "@/public/profile/mehmet-e-mayda-portrait.jpg";
import Link from "next/link";
import { BrandGlyph } from "@/components/BrandGlyph";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";
import "@/app/profile.css";

const COPY = {
  en: {
    meta: { title: "Mehmet E. Mayda — Product engineer", socialTitle: "Mehmet E. Mayda · Software, systems & growth", description: "Mehmet E. Mayda is a full-stack product builder connecting software engineering, automation and growth systems. Explore selected projects, technical skills and contact details." },
    kicker: "Mehmet E. Mayda",
    heading: ["Full-stack product engineering.", "From the interface to the operation."],
    intro: "I build software and the systems around it. My work connects product design, frontend, backend and integrations with the customer journeys and operations that make a product useful.",
    availability: "I’m interested in product engineering, full-stack and growth engineering roles where I can take responsibility for a meaningful part of the product.",
    actions: { work: "View my work", github: "GitHub", linkedin: "LinkedIn", email: "Get in touch" },
    factsLabel: "At a glance",
    facts: [["Based in", "Istanbul, Türkiye · Remote collaboration"], ["Focus", "Product engineering · Full-stack · Growth systems"], ["Core stack", "TypeScript · React · Next.js · PostgreSQL"]],
    bridgeKicker: "Background",
    bridgeHeading: "Engineering with a view of the whole product.",
    bridgeBody: [
      "My background brings together hands-on software development and marketing operations. I work across interfaces, data models and integrations, as well as analytics, lifecycle communication, technical SEO and localization.",
      "Through MaydaLabs, I build client products and develop projects of my own. That work involves deciding what to build, implementing it, testing the important journeys and maintaining the systems behind it.",
    ],
    capabilityKicker: "Skills",
    capabilityHeading: "Where I contribute.",
    capabilities: [
      ["Full-stack development", "React and Next.js interfaces, data models, access controls, API integrations and operational tools."],
      ["Growth systems", "Analytics, lifecycle email, technical SEO, localization and customer journeys that connect product and marketing."],
      ["Product delivery", "Problem definition, information architecture, implementation, testing, release planning and documentation."],
      ["Automation & integrations", "Connected workflows for research, publishing and operations, with human review and error handling where needed."],
    ],
    proofKicker: "Selected projects",
    proofHeading: "Products I’ve worked on.",
    proofIntro: "Client delivery, an owned publication and independent product development.",
    projects: [
      { number: "01", name: "HodlStay", status: "Client build · Live", ownership: "Full-stack delivery for a booking platform: marketplace architecture, guest and host journeys, booking operations, payment integrations, migration, analytics and localization.", evidence: "View HodlStay", path: "/case-studies/hodlstay" },
      { number: "02", name: "Satoshi Gazette", status: "Owned publication · Live · Editorially independent", ownership: "Product direction and engineering for a publication: editorial interfaces, publishing workflows, source-linked data, research tools and human-reviewed distribution.", evidence: "View Satoshi Gazette", path: "/case-studies/satoshi-gazette" },
      { number: "03", name: "Mortal Vault", status: "Lab product · Private alpha · Unaudited", ownership: "Independent product development across Solidity contracts, owner and beneficiary interfaces, event-driven state, threat modeling and tests.", evidence: "View Mortal Vault", path: "/case-studies/mortal-vault" },
      { number: "04", name: "Sofra", status: "Lab product · Private Phase 1", ownership: "Product architecture and development for a bilingual marketplace, including guest, host and operator journeys, marketplace state and public/private data boundaries.", evidence: "View Sofra", path: "/case-studies/sofra" },
    ],
    materialsKicker: "Contact",
    materialsHeading: "Let’s talk about your team and product.",
    materialsBody: "If you’re looking for someone who can connect software delivery with product and growth thinking, I’d be glad to hear what you’re building.",
    requestCv: "Request my CV",
    studioPrompt: "Looking for a project partner?",
    studioLink: "About MaydaLabs",
  },
  tr: {
    meta: { title: "Mehmet E. Mayda — Ürün mühendisi", socialTitle: "Mehmet E. Mayda · Yazılım, sistemler ve büyüme", description: "Mehmet E. Mayda; yazılım mühendisliği, otomasyon ve büyüme sistemlerini birleştiren full-stack ürün geliştirici. Seçili projeler, teknik beceriler ve iletişim." },
    kicker: "Mehmet E. Mayda",
    heading: ["Full-stack ürün mühendisliği.", "Arayüzden operasyona."],
    intro: "Yazılımı ve çevresindeki sistemleri geliştiriyorum. Ürün tasarımı, frontend, backend ve entegrasyonları; ürünü faydalı kılan müşteri yolculukları ve operasyonlarla birleştiriyorum.",
    availability: "Ürünün anlamlı bir bölümünde sorumluluk alabileceğim ürün mühendisliği, full-stack ve growth engineering rolleriyle ilgileniyorum.",
    actions: { work: "Projelerimi görün", github: "GitHub", linkedin: "LinkedIn", email: "İletişime geçin" },
    factsLabel: "Bir bakışta",
    facts: [["Konum", "İstanbul, Türkiye · Uzaktan çalışma"], ["Odak", "Ürün mühendisliği · Full-stack · Büyüme sistemleri"], ["Temel teknolojiler", "TypeScript · React · Next.js · PostgreSQL"]],
    bridgeKicker: "Geçmişim",
    bridgeHeading: "Ürünün tamamını gören mühendislik.",
    bridgeBody: [
      "Geçmişim, uygulamalı yazılım geliştirmeyi pazarlama operasyonlarıyla birleştiriyor. Arayüz, veri modeli ve entegrasyonların yanında analitik, müşteri iletişimi, teknik SEO ve yerelleştirme üzerine çalışıyorum.",
      "MaydaLabs aracılığıyla müşteri ürünleri geliştiriyor ve kendi projelerimi hayata geçiriyorum. Neyi geliştireceğimize karar vermek, uygulamak, önemli akışları test etmek ve sistemlerin bakımını yapmak bu çalışmanın parçaları.",
    ],
    capabilityKicker: "Beceriler",
    capabilityHeading: "Katkı sunduğum alanlar.",
    capabilities: [
      ["Full-stack geliştirme", "React ve Next.js arayüzleri, veri modelleri, erişim kontrolleri, API entegrasyonları ve operasyon araçları."],
      ["Büyüme sistemleri", "Ürün ile pazarlamayı bağlayan analitik, yaşam döngüsü e-postaları, teknik SEO, yerelleştirme ve müşteri yolculukları."],
      ["Ürün geliştirme", "Problem tanımı, bilgi mimarisi, uygulama, test, sürüm planlama ve dokümantasyon."],
      ["Otomasyon ve entegrasyonlar", "Araştırma, yayın ve operasyon için bağlantılı iş akışları; gerekli yerlerde insan kontrolü ve hata yönetimi."],
    ],
    proofKicker: "Seçili projeler",
    proofHeading: "Üzerinde çalıştığım ürünler.",
    proofIntro: "Müşteri işi, kendi yayınım ve bağımsız ürün geliştirme projeleri.",
    projects: [
      { number: "01", name: "HodlStay", status: "Müşteri ürünü · Canlı", ownership: "Rezervasyon platformu için full-stack geliştirme: pazar yeri mimarisi, misafir ve ev sahibi yolculukları, rezervasyon operasyonları, ödeme entegrasyonları, veri göçü, analitik ve yerelleştirme.", evidence: "HodlStay’i görün", path: "/case-studies/hodlstay" },
      { number: "02", name: "Satoshi Gazette", status: "Kendi yayınım · Canlı · Editoryal olarak bağımsız", ownership: "Bir yayın için ürün yönetimi ve mühendislik: editoryal arayüzler, yayın akışları, kaynaklara bağlı veriler, araştırma araçları ve insan kontrolünde dağıtım.", evidence: "Satoshi Gazette’i görün", path: "/case-studies/satoshi-gazette" },
      { number: "03", name: "Mortal Vault", status: "Lab ürünü · Özel alfa · Denetlenmedi", ownership: "Solidity sözleşmeleri, sahip ve lehtar arayüzleri, olaya dayalı durum yönetimi, tehdit modelleme ve testler üzerine bağımsız ürün geliştirme.", evidence: "Mortal Vault’u görün", path: "/case-studies/mortal-vault" },
      { number: "04", name: "Sofra", status: "Lab ürünü · Özel Faz 1", ownership: "İki dilli pazar yeri için ürün mimarisi ve geliştirme: misafir, ev sahibi ve operatör yolculukları, pazar yeri durumu ve açık/özel veri sınırları.", evidence: "Sofra’yı görün", path: "/case-studies/sofra" },
    ],
    materialsKicker: "İletişim",
    materialsHeading: "Ekibinizi ve ürününüzü konuşalım.",
    materialsBody: "Yazılım geliştirmeyi ürün ve büyüme bakışıyla birleştirebilen birini arıyorsanız, ne geliştirdiğinizi duymaktan memnuniyet duyarım.",
    requestCv: "CV’mi isteyin",
    studioPrompt: "Projeniz için bir iş ortağı mı arıyorsunuz?",
    studioLink: "MaydaLabs hakkında",
  },
  fr: {
    meta: { title: "Mehmet E. Mayda — Ingénieur produit", socialTitle: "Mehmet E. Mayda · Logiciels, systèmes et croissance", description: "Mehmet E. Mayda associe développement full-stack, automatisation et systèmes de croissance. Découvrez ses projets, ses compétences techniques et ses coordonnées." },
    kicker: "Mehmet E. Mayda",
    heading: ["Ingénierie produit full-stack.", "De l’interface aux opérations."],
    intro: "Je développe des logiciels et les systèmes qui les entourent. Mon travail relie design produit, frontend, backend et intégrations aux parcours clients et aux opérations qui rendent un produit utile.",
    availability: "Je m’intéresse aux rôles en ingénierie produit, full-stack et growth engineering qui permettent de prendre en charge une partie significative du produit.",
    actions: { work: "Voir mes projets", github: "GitHub", linkedin: "LinkedIn", email: "Me contacter" },
    factsLabel: "En bref",
    facts: [["Localisation", "Istanbul, Türkiye · Collaboration à distance"], ["Spécialités", "Ingénierie produit · Full-stack · Systèmes de croissance"], ["Technologies principales", "TypeScript · React · Next.js · PostgreSQL"]],
    bridgeKicker: "Parcours",
    bridgeHeading: "Une ingénierie qui comprend le produit dans son ensemble.",
    bridgeBody: [
      "Mon parcours associe développement logiciel et opérations marketing. Je travaille sur les interfaces, les modèles de données et les intégrations, mais aussi sur l’analytics, les communications clients, le SEO technique et la localisation.",
      "Avec MaydaLabs, je développe des produits clients et mes propres projets. Ce travail couvre les choix produit, la réalisation, les tests des parcours essentiels et la maintenance des systèmes.",
    ],
    capabilityKicker: "Compétences",
    capabilityHeading: "Ce que j’apporte.",
    capabilities: [
      ["Développement full-stack", "Interfaces React et Next.js, modèles de données, contrôles d’accès, intégrations API et outils opérationnels."],
      ["Systèmes de croissance", "Analytics, e-mails de cycle de vie, SEO technique, localisation et parcours reliant produit et marketing."],
      ["Réalisation produit", "Définition du problème, architecture de l’information, développement, tests, préparation des versions et documentation."],
      ["Automatisation et intégrations", "Processus connectés pour la recherche, la publication et les opérations, avec contrôle humain et gestion des erreurs selon les besoins."],
    ],
    proofKicker: "Projets sélectionnés",
    proofHeading: "Des produits auxquels j’ai contribué.",
    proofIntro: "Travail client, publication indépendante et développement de produits personnels.",
    projects: [
      { number: "01", name: "HodlStay", status: "Produit client · En ligne", ownership: "Développement full-stack d’une plateforme de réservation : architecture marketplace, parcours voyageurs et hôtes, opérations, intégrations de paiement, migration, analytics et localisation.", evidence: "Voir HodlStay", path: "/case-studies/hodlstay" },
      { number: "02", name: "Satoshi Gazette", status: "Ma publication · En ligne · Indépendance éditoriale", ownership: "Direction produit et ingénierie d’une publication : interfaces éditoriales, processus de publication, données reliées aux sources, outils de recherche et distribution validée par une personne.", evidence: "Voir Satoshi Gazette", path: "/case-studies/satoshi-gazette" },
      { number: "03", name: "Mortal Vault", status: "Produit lab · Alpha privée · Non audité", ownership: "Développement indépendant : contrats Solidity, interfaces propriétaire et bénéficiaire, état fondé sur les événements, modélisation des menaces et tests.", evidence: "Voir Mortal Vault", path: "/case-studies/mortal-vault" },
      { number: "04", name: "Sofra", status: "Produit lab · Phase 1 privée", ownership: "Architecture et développement d’une marketplace bilingue : parcours invité, hôte et opérateur, états de la plateforme et séparation des données publiques et privées.", evidence: "Voir Sofra", path: "/case-studies/sofra" },
    ],
    materialsKicker: "Contact",
    materialsHeading: "Parlons de votre équipe et de votre produit.",
    materialsBody: "Si vous cherchez quelqu’un qui relie réalisation logicielle, produit et croissance, je serais ravi de découvrir ce que vous construisez.",
    requestCv: "Demander mon CV",
    studioPrompt: "Vous cherchez un partenaire pour un projet ?",
    studioLink: "À propos de MaydaLabs",
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
    <div className="mayda-shell mayda-profile" id="mehmet-e-mayda">
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
                <BrandGlyph name="github" /> {copy.actions.github}
              </a>
            </div>
          </header>

          <aside className="mayda-card" style={{ alignSelf: "start" }} aria-label={copy.factsLabel}>
            <Image src={portrait} alt="Mehmet Emin Mayda" placeholder="blur" sizes="(min-width: 1024px) 28rem, 90vw" className="mayda-profile-portrait" priority />
            <a href="https://www.linkedin.com/in/mehmet-e-mayda/" target="_blank" rel="me noopener noreferrer" className="mayda-profile-linkedin">
              <BrandGlyph name="linkedin" /> {copy.actions.linkedin} · Mehmet E. Mayda
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
            <Link href={localizePath("/about", locale)} className="mayda-text-link">
              {copy.studioLink} →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
