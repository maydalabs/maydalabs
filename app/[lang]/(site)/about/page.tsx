import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: { title: "About", socialTitle: "Software & automation · MaydaLabs", description: "MaydaLabs builds custom software and connects the systems behind your business. Founder-led by Mehmet E. Mayda, based in Istanbul and working worldwide." },
    kicker: "About MaydaLabs",
    heading: ["Software for what’s next.", "A better way to run what’s here."],
    lead: "MaydaLabs is a software and automation company for founders and businesses. We turn ideas into working products and help existing teams connect their tools, improve customer journeys and reduce repetitive work.",
    story: [
      "Some projects start with a new product. Others start with a slow process, a disconnected tool or software that needs attention. We work with you to understand the problem and choose a useful first step.",
      "Design, frontend, backend and integrations are considered together. That means the experience your customers see and the systems your team relies on are built to work as one.",
      "MaydaLabs is founded and led by Mehmet E. Mayda. You work directly with the person responsible for the build, from defining the scope to reviewing the work and planning the handover.",
    ],
    factsLabel: "At a glance",
    facts: [["Focus", "Custom software & automation"], ["Founder", "Mehmet E. Mayda"], ["Based in", "Istanbul · Working worldwide"], ["Engagements", "Scoped projects and ongoing support"]],
    principlesKicker: "What you can expect",
    principles: [
      ["A clear first step", "We agree on the problem, deliverables, price and responsibilities before work begins."],
      ["Work you can review", "See the product take shape, try the important journeys and give feedback along the way."],
      ["Tools that work together", "Connect the systems you already use. Add custom software or AI where it serves a defined need."],
      ["A considered handover", "Access, documentation, release and support responsibilities are agreed as part of the project."],
    ],
    profileNote: "Get to know the founder.",
    profileCta: "Mehmet’s background and projects",
    ctaHeading: "What would make your business work better?",
    approachCta: "Explore services",
    mapCta: "Tell us what you need",
  },
  tr: {
    meta: { title: "Hakkında", socialTitle: "Yazılım ve otomasyon · MaydaLabs", description: "MaydaLabs, işinize özel yazılım geliştirir ve sistemlerinizi birbirine bağlar. Mehmet E. Mayda liderliğinde, İstanbul’dan dünya çapında çalışır." },
    kicker: "MaydaLabs hakkında",
    heading: ["Yeni fikirler için yazılım.", "Mevcut işler için daha iyi süreçler."],
    lead: "MaydaLabs, girişimciler ve işletmeler için bir yazılım ve otomasyon şirketidir. Fikirleri çalışan ürünlere dönüştürür; ekiplerin araçlarını bağlamasına, müşteri yolculuklarını iyileştirmesine ve tekrarlayan işleri azaltmasına yardımcı olur.",
    story: [
      "Bazı projeler yeni bir ürünle başlar. Bazıları ise yavaş bir süreç, bağlantısız bir araç veya iyileştirme bekleyen bir yazılımla. İhtiyacı birlikte anlayıp faydalı bir ilk adım belirleriz.",
      "Tasarım, frontend, backend ve entegrasyonları birlikte ele alırız. Müşterinizin gördüğü deneyim ile ekibinizin kullandığı sistemleri birbiriyle uyumlu geliştiririz.",
      "MaydaLabs’ın kurucusu Mehmet E. Mayda’dır. Kapsamın belirlenmesinden çalışmanın incelenmesine ve teslim planına kadar geliştirmeden sorumlu kişiyle doğrudan çalışırsınız.",
    ],
    factsLabel: "Bir bakışta",
    facts: [["Odak", "Özel yazılım ve otomasyon"], ["Kurucu", "Mehmet E. Mayda"], ["Merkez", "İstanbul · Dünya çapında çalışma"], ["Çalışma modeli", "Kapsamı belirli projeler ve devam eden destek"]],
    principlesKicker: "Neler bekleyebilirsiniz?",
    principles: [
      ["Net bir ilk adım", "Başlamadan önce sorunu, teslim edilecekleri, ücreti ve sorumlulukları belirleriz."],
      ["İnceleyebileceğiniz çalışma", "Ürün şekillenirken görün, önemli akışları deneyin ve süreç boyunca görüşlerinizi paylaşın."],
      ["Birlikte çalışan araçlar", "Kullandığınız sistemleri bağlarız. Özel yazılımı veya yapay zekâyı tanımlı bir ihtiyaca hizmet ettiği yerde ekleriz."],
      ["Planlı bir teslim", "Erişim, dokümantasyon, yayın ve destek sorumluluklarını projenin parçası olarak belirleriz."],
    ],
    profileNote: "Kurucuyu tanıyın.",
    profileCta: "Mehmet’in geçmişi ve projeleri",
    ctaHeading: "İşinizin daha iyi çalışmasını ne sağlar?",
    approachCta: "Hizmetleri inceleyin",
    mapCta: "İhtiyacınızı anlatın",
  },
  fr: {
    meta: { title: "À propos", socialTitle: "Logiciels & automatisation · MaydaLabs", description: "MaydaLabs crée des logiciels sur mesure et relie les systèmes de votre entreprise. Dirigé par Mehmet E. Mayda depuis Istanbul, pour des clients partout dans le monde." },
    kicker: "À propos de MaydaLabs",
    heading: ["Des logiciels pour la suite.", "De meilleurs processus au quotidien."],
    lead: "MaydaLabs est une entreprise de logiciels et d’automatisation pour les fondateurs et les entreprises. Nous transformons les idées en produits et aidons les équipes à relier leurs outils, améliorer les parcours clients et réduire les tâches répétitives.",
    story: [
      "Un projet peut commencer par un nouveau produit, un processus trop lent, un outil isolé ou un logiciel à améliorer. Nous examinons le problème avec vous pour définir une première étape utile.",
      "Design, frontend, backend et intégrations sont pensés ensemble. L’expérience de vos clients et les systèmes de votre équipe sont conçus pour fonctionner de concert.",
      "MaydaLabs est fondée et dirigée par Mehmet E. Mayda. Vous travaillez directement avec la personne responsable du développement, du cadrage du projet à la revue du travail et à sa transmission.",
    ],
    factsLabel: "En bref",
    facts: [["Spécialité", "Logiciels sur mesure & automatisation"], ["Fondateur", "Mehmet E. Mayda"], ["Basée à", "Istanbul · Clients internationaux"], ["Missions", "Projets au périmètre défini et suivi continu"]],
    principlesKicker: "Ce que vous pouvez attendre",
    principles: [
      ["Une première étape claire", "Problème, livrables, prix et responsabilités sont définis avant le début du travail."],
      ["Un travail à examiner", "Voyez le produit évoluer, essayez les parcours essentiels et partagez vos retours."],
      ["Des outils reliés", "Connecter vos systèmes existants. Ajouter du logiciel sur mesure ou de l’IA pour un besoin défini."],
      ["Une transmission préparée", "Accès, documentation, mise en ligne et suivi sont convenus dans le cadre du projet."],
    ],
    profileNote: "Rencontrez le fondateur.",
    profileCta: "Le parcours et les projets de Mehmet",
    ctaHeading: "Qu’est-ce qui aiderait votre entreprise à mieux fonctionner ?",
    approachCta: "Explorer les services",
    mapCta: "Parlez-nous de votre besoin",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/about", locale, socialCard: "about" });
}

export default async function AboutPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div className="mayda-shell">
      <section className="mayda-section">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
          <header className="mayda-stack">
            <p className="mayda-kicker">{copy.kicker}</p>
            <h1 className="mayda-display" style={{ fontSize: "clamp(2.2rem,5vw,3.8rem)" }}>
              {copy.heading[0]}
              <br />
              <span className="mayda-multiply">{copy.heading[1]}</span>
            </h1>
            <p className="mayda-lead">{copy.lead}</p>
            <div className="mayda-hero-actions">
              <Link href={localizePath("/contact", locale)} className="mayda-button">{copy.mapCta} <span aria-hidden="true">→</span></Link>
            </div>
            <div className="mayda-stack" style={{ marginTop: "0.6rem" }}>
              {copy.story.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="mayda-body" style={{ maxWidth: "42rem" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </header>

          <aside className="mayda-card" style={{ alignSelf: "start" }} aria-label={copy.factsLabel}>
            <p className="mayda-kicker">{copy.factsLabel}</p>
            <dl className="mayda-dl">
              {copy.facts.map(([term, detail]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
            <p className="mayda-body mt-5" style={{ fontSize: "0.9rem" }}>
              {copy.profileNote}{" "}
              <Link href={localizePath("/profile", locale)} className="mayda-text-link">
                {copy.profileCta} <span aria-hidden>→</span>
              </Link>
            </p>
          </aside>
        </div>
      </section>

      <section className="mayda-section" style={{ paddingTop: 0 }}>
        <p className="mayda-kicker">{copy.principlesKicker}</p>
        <div className="mayda-grid-2" style={{ marginTop: "1.4rem" }}>
          {copy.principles.map(([title, text]) => (
            <article key={title} className="mayda-card">
              <h2 className="mayda-subheading">{title}</h2>
              <p className="mayda-body mt-3">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mayda-final-cta">
        <h2 className="mayda-heading">{copy.ctaHeading}</h2>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/services", locale)} className="mayda-button mayda-button-outline">
            {copy.approachCta}
          </Link>
          <Link href={localizePath("/contact", locale)} className="mayda-button">
            {copy.mapCta} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
