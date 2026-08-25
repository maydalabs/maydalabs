import Link from "next/link";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const COPY = {
  en: {
    meta: {
      title: "About",
      socialTitle: "A small studio for serious ideas · MaydaLabs",
      description:
        "Meet Mehmet E. Mayda, the founder and full-stack product builder behind MaydaLabs.",
    },
    kicker: "About / MaydaLabs",
    heading: ["A small studio for", "serious ideas."],
    intro:
      "MaydaLabs exists to close the distance between an ambitious idea and a product people can actually use, trust, and buy from.",
    statement:
      "We are product people who understand growth, and growth people who can ship the product.",
    body: [
      "The studio is founder-led and deliberately compact. Strategy, design, engineering, and launch thinking stay connected instead of crossing a chain of account managers and handoffs.",
      "Our flagship work begins in Bitcoin because it demands real answers to difficult questions: trust, payments, global users, regulation, community, and product clarity. That edge travels well. We work with founders across industries.",
    ],
    founderKicker: "Founder / Builder",
    founderName: "Mehmet E. Mayda",
    founderRole: "Full-stack product builder · Marketing systems & growth",
    founderIntro:
      "I build production web products and the systems around them — payments, lifecycle email, analytics, technical SEO, localization, editorial operations, and AI-assisted workflows.",
    founderBody:
      "My background crosses software building and hands-on marketing operations. That lets me own the product surface together with the acquisition, measurement, content, and reliability systems that make it useful.",
    founderSignals: [
      [
        "Product engineering",
        "Next.js and React applications, marketplaces, data models, integrations, and operational workflows.",
      ],
      [
        "Growth systems",
        "Analytics, lifecycle email, technical SEO, localization, campaigns, and conversion surfaces.",
      ],
      [
        "Bitcoin + AI operations",
        "HodlStay, Satoshi Gazette, and approval-gated AI-assisted research and production systems.",
      ],
    ],
    founderLinks: {
      github: "View GitHub",
      linkedin: "View LinkedIn",
      email: "Email Mehmet",
      profile: "Full working profile",
    },
    principlesKicker: "Operating principles",
    principlesHeading: "How we think.",
    principles: [
      [
        "01",
        "Make the idea legible",
        "Clarity is part of the product. If people cannot understand it, they cannot choose it.",
      ],
      [
        "02",
        "Build against reality",
        "Working software teaches us more than a month of abstract debate.",
      ],
      [
        "03",
        "Own the whole journey",
        "The product, marketing, measurement, and operations are one customer experience.",
      ],
      [
        "04",
        "Use AI with judgment",
        "AI expands our output. Human taste and accountability decide what deserves to ship.",
      ],
    ],
    ctaKicker: "Work with the studio",
    ctaHeading: "Have a serious idea?",
    cta: "Start a conversation",
  },
  tr: {
    meta: {
      title: "Hakkımızda",
      socialTitle: "Ciddi fikirler için küçük bir stüdyo · MaydaLabs",
      description:
        "MaydaLabs’in kurucusu ve full-stack ürün geliştiricisi Mehmet E. Mayda ile tanışın.",
    },
    kicker: "Hakkımızda / MaydaLabs",
    heading: ["Ciddi fikirler için", "küçük bir stüdyo."],
    intro:
      "MaydaLabs, iddialı bir fikir ile insanların gerçekten kullanabileceği, güvenebileceği ve satın alabileceği bir ürün arasındaki mesafeyi kapatmak için var.",
    statement:
      "Büyümeyi anlayan ürün insanlarıyız; ürünü yayınlayabilen büyüme insanlarıyız.",
    body: [
      "Stüdyo kurucu liderliğinde ve bilinçli olarak kompakt. Strateji, tasarım, mühendislik ve lansman düşüncesi; hesap yöneticileri ve devir zincirlerinde kaybolmadan bağlantılı kalır.",
      "Amiral projelerimiz Bitcoin ile başlıyor; çünkü güven, ödemeler, küresel kullanıcılar, regülasyon, topluluk ve ürün netliği gibi zor sorulara gerçek cevaplar gerektiriyor. Bu keskinlik her yere taşınabilir. Farklı sektörlerden kurucularla çalışıyoruz.",
    ],
    founderKicker: "Kurucu / Geliştirici",
    founderName: "Mehmet E. Mayda",
    founderRole: "Full-stack ürün geliştirici · Pazarlama sistemleri ve büyüme",
    founderIntro:
      "Üretimde çalışan web ürünlerini ve onları çevreleyen sistemleri geliştiriyorum: ödemeler, yaşam döngüsü e-postaları, analitik, teknik SEO, yerelleştirme, editoryal operasyonlar ve yapay zekâ destekli iş akışları.",
    founderBody:
      "Geçmişim yazılım geliştirme ile uygulamalı pazarlama operasyonlarını bir araya getiriyor. Böylece ürün yüzeyini; edinim, ölçüm, içerik ve güvenilirlik sistemleriyle birlikte sahiplenebiliyorum.",
    founderSignals: [
      [
        "Ürün mühendisliği",
        "Next.js ve React uygulamaları, pazaryerleri, veri modelleri, entegrasyonlar ve operasyonel iş akışları.",
      ],
      [
        "Büyüme sistemleri",
        "Analitik, yaşam döngüsü e-postaları, teknik SEO, yerelleştirme, kampanyalar ve dönüşüm yüzeyleri.",
      ],
      [
        "Bitcoin + yapay zekâ operasyonları",
        "HodlStay, Satoshi Gazette ve onay kapılı yapay zekâ destekli araştırma ve üretim sistemleri.",
      ],
    ],
    founderLinks: {
      github: "GitHub’ı incele",
      linkedin: "LinkedIn’i görüntüle",
      email: "Mehmet’e e-posta gönder",
      profile: "Detaylı çalışma profili",
    },
    principlesKicker: "Çalışma ilkeleri",
    principlesHeading: "Nasıl düşünüyoruz.",
    principles: [
      [
        "01",
        "Fikri anlaşılır kıl",
        "Netlik ürünün bir parçasıdır. İnsanlar anlayamazsa seçemez.",
      ],
      [
        "02",
        "Gerçekliğe karşı geliştir",
        "Çalışan yazılım bize bir aylık soyut tartışmadan daha fazlasını öğretir.",
      ],
      [
        "03",
        "Tüm yolculuğu sahiplen",
        "Ürün, pazarlama, ölçüm ve operasyon tek bir müşteri deneyimidir.",
      ],
      [
        "04",
        "Yapay zekâyı muhakemeyle kullan",
        "Yapay zekâ çıktımızı büyütür. Nelerin yayına değer olduğuna insan zevki ve sorumluluğu karar verir.",
      ],
    ],
    ctaKicker: "Stüdyo ile çalışın",
    ctaHeading: "Ciddi bir fikriniz mi var?",
    cta: "Görüşme başlat",
  },
  fr: {
    meta: {
      title: "À propos",
      socialTitle: "Un petit studio pour des idées sérieuses · MaydaLabs",
      description:
        "Découvrez Mehmet E. Mayda, fondateur et builder produit full-stack de MaydaLabs.",
    },
    kicker: "À propos / MaydaLabs",
    heading: ["Un petit studio pour", "des idées sérieuses."],
    intro:
      "MaydaLabs réduit la distance entre une idée ambitieuse et un produit que les gens peuvent réellement utiliser, croire et acheter.",
    statement:
      "Nous sommes des spécialistes produit qui comprennent la croissance, et des spécialistes croissance capables de livrer le produit.",
    body: [
      "Le studio est dirigé par son fondateur et volontairement compact. Stratégie, design, ingénierie et lancement restent connectés au lieu de traverser une chaîne de gestionnaires et de transmissions.",
      "Nos projets phares commencent dans Bitcoin, un domaine qui exige des réponses réelles sur la confiance, les paiements, les utilisateurs mondiaux, la réglementation, la communauté et la clarté produit. Cette exigence voyage bien. Nous travaillons avec des fondateurs de tous secteurs.",
    ],
    founderKicker: "Fondateur / Builder",
    founderName: "Mehmet E. Mayda",
    founderRole: "Builder produit full-stack · Systèmes marketing et croissance",
    founderIntro:
      "Je construis des produits web en production et les systèmes qui les entourent : paiements, e-mails de cycle de vie, analytics, SEO technique, localisation, opérations éditoriales et workflows assistés par l’IA.",
    founderBody:
      "Mon parcours relie la construction logicielle aux opérations marketing concrètes. Je peux ainsi prendre en charge le produit avec les systèmes d’acquisition, de mesure, de contenu et de fiabilité qui le rendent utile.",
    founderSignals: [
      [
        "Ingénierie produit",
        "Applications Next.js et React, marketplaces, modèles de données, intégrations et workflows opérationnels.",
      ],
      [
        "Systèmes de croissance",
        "Analytics, e-mails de cycle de vie, SEO technique, localisation, campagnes et surfaces de conversion.",
      ],
      [
        "Bitcoin + opérations IA",
        "HodlStay, Satoshi Gazette et systèmes de recherche et de production assistés par l’IA avec validation humaine.",
      ],
    ],
    founderLinks: {
      github: "Voir GitHub",
      linkedin: "Voir LinkedIn",
      email: "Écrire à Mehmet",
      profile: "Profil de travail complet",
    },
    principlesKicker: "Principes de fonctionnement",
    principlesHeading: "Notre façon de penser.",
    principles: [
      [
        "01",
        "Rendre l’idée lisible",
        "La clarté fait partie du produit. Si les gens ne le comprennent pas, ils ne peuvent pas le choisir.",
      ],
      [
        "02",
        "Construire face au réel",
        "Un logiciel fonctionnel nous apprend plus qu’un mois de débat abstrait.",
      ],
      [
        "03",
        "Prendre en charge tout le parcours",
        "Produit, marketing, mesure et opérations forment une seule expérience client.",
      ],
      [
        "04",
        "Utiliser l’IA avec discernement",
        "L’IA augmente notre capacité. Le goût et la responsabilité humaine décident ce qui mérite d’être livré.",
      ],
    ],
    ctaKicker: "Travailler avec le studio",
    ctaHeading: "Vous avez une idée sérieuse ?",
    cta: "Démarrer une conversation",
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({
    ...COPY[locale].meta,
    path: "/about",
    locale,
    socialCard: "about",
  });
}

export default async function AboutPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];

  return (
    <div className="studio-inner-page">
      <section className="studio-inner-hero">
        <p className="studio-kicker">{copy.kicker}</p>
        <h1>
          {copy.heading[0]}
          <br />
          <em>{copy.heading[1]}</em>
        </h1>
        <p>{copy.intro}</p>
      </section>

      <section className="about-statement">
        <p>{copy.statement}</p>
        <div>
          {copy.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="about-founder" id="mehmet-e-mayda">
        <div className="about-founder-heading">
          <p className="studio-kicker">{copy.founderKicker}</p>
          <h2>{copy.founderName}</h2>
          <p className="about-founder-role">{copy.founderRole}</p>
        </div>
        <div className="about-founder-story">
          <p className="about-founder-intro">{copy.founderIntro}</p>
          <p>{copy.founderBody}</p>
          <div className="about-founder-links" aria-label={`${copy.founderName} profiles`}>
            <a
              href="https://github.com/maydalabs"
              target="_blank"
              rel="me noopener noreferrer"
            >
              {copy.founderLinks.github} ↗
            </a>
            <a
              href="https://www.linkedin.com/in/mehmet-e-mayda/"
              target="_blank"
              rel="me noopener noreferrer"
            >
              {copy.founderLinks.linkedin} ↗
            </a>
            <a href="mailto:info@maydalabs.com">{copy.founderLinks.email} ↗</a>
            <Link href={localizePath("/profile", locale)}>{copy.founderLinks.profile} →</Link>
          </div>
        </div>
        <div className="about-founder-signals">
          {copy.founderSignals.map(([title, description]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-principles">
        <div className="studio-section-heading">
          <div>
            <p className="studio-kicker">{copy.principlesKicker}</p>
            <h2>{copy.principlesHeading}</h2>
          </div>
        </div>
        <div className="studio-process-grid">
          {copy.principles.map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="studio-inner-cta">
        <p className="studio-kicker">{copy.ctaKicker}</p>
        <h2>{copy.ctaHeading}</h2>
        <Link
          href={localizePath("/contact", locale)}
          className="studio-button"
        >
          {copy.cta} <span aria-hidden>↗</span>
        </Link>
      </section>
    </div>
  );
}
