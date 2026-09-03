import { CaseStudy, type CaseStudyCopy } from "@/components/CaseStudy";
import { PROJECT_STACKS } from "@/lib/stack";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const META = {
  en: {
    title: "Satoshi Gazette case study",
    socialTitle: "Satoshi Gazette: a newsroom built as a product · MaydaLabs",
    description:
      "How MaydaLabs built Satoshi Gazette as a Bitcoin newsroom product: public desks, reviewed evidence, editorial workflows, and guarded distribution.",
  },
  tr: {
    title: "Satoshi Gazette vaka çalışması",
    socialTitle: "Satoshi Gazette: ürün olarak kurulmuş bir haber odası · MaydaLabs",
    description:
      "MaydaLabs'in Satoshi Gazette'i Bitcoin haber merkezi ürünü olarak nasıl kurduğu: açık masalar, incelenmiş kanıt, editoryal akışlar ve korumalı dağıtım.",
  },
  fr: {
    title: "Étude de cas Satoshi Gazette",
    socialTitle: "Satoshi Gazette : une rédaction construite comme un produit · MaydaLabs",
    description:
      "Comment MaydaLabs a construit Satoshi Gazette comme produit de rédaction Bitcoin : rubriques publiques, preuves vérifiées, workflows éditoriaux et distribution contrôlée.",
  },
} as const;

const COPY: Record<"en" | "tr" | "fr", CaseStudyCopy> = {
  en: {
    back: "Work",
    kicker: "Case 02 / Media · Data · Guarded operations",
    ownershipTag: "Owned publication",
    statusTag: "Live",
    title: ["A newsroom built", "as a product."],
    lead: "Satoshi Gazette connects a public Bitcoin publication to the evidence, editorial state, and distribution systems required to operate it with discipline.",
    visit: { label: "Visit the live publication", url: "https://satoshigazette.org" },
    railLabel: "Product summary",
    rail: [
      ["Product", "Bitcoin-only newsroom"],
      ["Status", "Live at satoshigazette.org"],
      ["Scope", "Product · Editorial UX · Data · Operations"],
      ["Ownership", "MaydaLabs-owned, editorially independent"],
    ],
    sections: [
      {
        heading: "Context",
        paragraphs: [
          "Satoshi Gazette is an independent Bitcoin publication that MaydaLabs built and owns as a product. Editorial authority does not come from typography alone: the product has to preserve evidence, make state visible to operators, separate public reading from internal control, and keep human judgment in the consequential parts of the workflow.",
        ],
      },
      {
        heading: "Constraint",
        paragraphs: [
          "Build a publication that feels authoritative and editorial while the operating system behind it stays fast, structured, and ready for responsible AI assistance — without flattening editorial work into content automation.",
        ],
      },
      {
        heading: "MaydaLabs' exact scope",
        items: [
          "Editorial information architecture and the visual system",
          "The public product: front page, desks, Wire, briefings, and the Data Desk",
          "Publishing workflows and internal newsroom tooling",
          "Data models, APIs, and live Bitcoin market and network context",
          "Reviewed-source evidence model and retrieval foundations",
          "Distribution drafting and review queues behind the public surface",
        ],
      },
      {
        heading: "What was built",
        items: [
          "A public signal layer: news desks, the Wire, briefings, and market context offering fast scans or deep routes through one editorial world",
          "An editorial spine: submissions, candidates, evidence review, editing, and publication moving through an explicit lifecycle under operator control",
          "Evidence with roles: reviewed sources connected as primary, supporting, background, or counterpoint instead of an undifferentiated link pile",
          "Wire entries where source identity and source time are part of the content model, preserving provenance on a fast surface",
          "A primary-evidence Data Desk (Corporate Bitcoin Treasuries) presenting selected observations with dates, source documents, scope limits, and methodology",
          "Guarded retrieval foundations (Ask Satoshi): Bitcoin-only, citation-led, designed to fall back when evidence is weak rather than improvise certainty",
        ],
      },
      {
        heading: "Verifiable evidence",
        paragraphs: [
          "The publication is live and public at satoshigazette.org — front page, desks, Wire, briefings, and the Data Desk can all be read right now. The screenshots below are captures of the live product.",
          "No reader-traffic, growth, or revenue figures are claimed. The guarded internal systems are described here as capabilities; their internals stay private.",
        ],
      },
      {
        heading: "Current status",
        paragraphs: [
          "Live and publishing, with the operating system behind it continuing to evolve.",
        ],
      },
      {
        heading: "Ownership",
        paragraphs: [
          "Satoshi Gazette is a MaydaLabs-owned operating publication — not a client, and not studio advertising. Its editorial standards, corrections, and publication decisions remain independent of MaydaLabs' commercial work. Mehmet owns the product direction and implementation; AI accelerates research and production where useful, and editorial responsibility stays human.",
        ],
      },
    ],
    gallery: [
      {
        src: "/work/satoshi-gazette-2026-09-home.jpg",
        alt: "Current Satoshi Gazette homepage with populated stories and Wire",
        caption: "Front page — market context, desks, leading stories, and the Wire in one masthead.",
      },
      {
        src: "/work/satoshi-gazette-2026-09-wire.jpg",
        alt: "Current populated Satoshi Gazette Wire",
        caption: "The Wire — fast reporting with structured source identity and source time.",
      },
      {
        src: "/work/satoshi-gazette-2026-09-data.jpg",
        alt: "Satoshi Gazette Corporate Bitcoin Treasuries Data Desk",
        caption: "Data Desk — primary evidence with dates, sources, scope limits, and methodology.",
      },
    ],
    galleryHost: "satoshigazette.org",
    ctaKicker: "Building an information-heavy product?",
    ctaHeading: "Bring the complexity. We'll design the system.",
    ctaStart: "Map my next move",
    ctaWork: "All work",
  },
  tr: {
    back: "Projeler",
    kicker: "Vaka 02 / Medya · Veri · Korumalı operasyon",
    ownershipTag: "Sahip olunan yayın",
    statusTag: "Canlı",
    title: ["Ürün olarak kurulmuş", "bir haber odası."],
    lead: "Satoshi Gazette, açık bir Bitcoin yayınını; onu disiplinle işletmek için gereken kanıt, editoryal durum ve dağıtım sistemlerine bağlar.",
    visit: { label: "Canlı yayını aç", url: "https://satoshigazette.org" },
    railLabel: "Ürün özeti",
    rail: [
      ["Ürün", "Sadece Bitcoin haber merkezi"],
      ["Durum", "satoshigazette.org'da canlı"],
      ["Kapsam", "Ürün · Editoryal UX · Veri · Operasyon"],
      ["Sahiplik", "MaydaLabs'e ait, editoryal olarak bağımsız"],
    ],
    sections: [
      {
        heading: "Bağlam",
        paragraphs: [
          "Satoshi Gazette, MaydaLabs'in ürün olarak kurduğu ve sahibi olduğu bağımsız bir Bitcoin yayınıdır. Editoryal otorite yalnızca tipografiden gelmez: ürün kanıtı korumalı, operatörlere durumu görünür kılmalı, açık okuma deneyimini dahili kontrolden ayırmalı ve sonuç doğuran adımlarda insan muhakemesini korumalıdır.",
        ],
      },
      {
        heading: "Kısıt",
        paragraphs: [
          "Arkasındaki işletim sistemi hızlı, yapılandırılmış ve sorumlu yapay zekâ desteğine hazır kalırken otoriter ve editoryal hissettiren bir yayın kurmak — editoryal çalışmayı içerik otomasyonuna indirgemeden.",
        ],
      },
      {
        heading: "MaydaLabs'in tam kapsamı",
        items: [
          "Editoryal bilgi mimarisi ve görsel sistem",
          "Açık ürün: ana sayfa, masalar, Wire, bültenler ve Veri Masası",
          "Yayın akışları ve dahili haber merkezi araçları",
          "Veri modelleri, API'ler ve canlı Bitcoin piyasa/ağ bağlamı",
          "İncelenmiş kaynak kanıt modeli ve erişim temelleri",
          "Açık yüzeyin arkasında dağıtım taslakları ve inceleme kuyrukları",
        ],
      },
      {
        heading: "Ne inşa edildi",
        items: [
          "Açık sinyal katmanı: haber masaları, Wire, bültenler ve piyasa bağlamı; aynı editoryal dünyada hızlı tarama veya derin rota",
          "Editoryal omurga: başvurular, adaylar, kanıt incelemesi, düzenleme ve yayın; operatör kontrolünde açık bir yaşam döngüsünde",
          "Rolleri olan kanıt: incelenmiş kaynaklar ayrışmamış bağlantı yığını yerine birincil, destekleyici, arka plan veya karşı görüş olarak bağlanır",
          "Kaynak kimliği ve kaynak zamanının içerik modelinin parçası olduğu, hızlı yüzeyde provenansı koruyan Wire kayıtları",
          "Birincil kanıt Veri Masası (Corporate Bitcoin Treasuries): seçili gözlemler tarih, kaynak belge, kapsam sınırı ve metodolojiyle sunulur",
          "Korumalı erişim temelleri (Ask Satoshi): sadece Bitcoin, alıntı öncelikli, kanıt zayıfken kesinlik uydurmak yerine geri çekilir",
        ],
      },
      {
        heading: "Doğrulanabilir kanıt",
        paragraphs: [
          "Yayın satoshigazette.org'da canlı ve herkese açık — ana sayfa, masalar, Wire, bültenler ve Veri Masası şu anda okunabilir. Aşağıdaki ekran görüntüleri canlı ürünün kayıtlarıdır.",
          "Okur trafiği, büyüme veya gelir rakamı iddia edilmiyor. Korumalı dahili sistemler burada yetkinlik olarak anlatılır; iç işleyişleri özel kalır.",
        ],
      },
      {
        heading: "Mevcut durum",
        paragraphs: ["Canlı ve yayın yapıyor; arkasındaki işletim sistemi gelişmeye devam ediyor."],
      },
      {
        heading: "Sahiplik",
        paragraphs: [
          "Satoshi Gazette, MaydaLabs'e ait bir işletim yayınıdır — müşteri değildir, stüdyo reklamı da değildir. Editoryal standartları, düzeltmeleri ve yayın kararları MaydaLabs'in ticari işinden bağımsız kalır. Ürün yönü ve uygulama Mehmet'e aittir; yapay zekâ faydalı olduğu yerde araştırma ve üretimi hızlandırır, editoryal sorumluluk insanda kalır.",
        ],
      },
    ],
    gallery: [
      {
        src: "/work/satoshi-gazette-2026-09-home.jpg",
        alt: "Haberler ve Wire ile dolu güncel Satoshi Gazette ana sayfası",
        caption: "Ana sayfa — piyasa bağlamı, masalar, ana haberler ve Wire tek masthead'de.",
      },
      {
        src: "/work/satoshi-gazette-2026-09-wire.jpg",
        alt: "Güncel dolu Satoshi Gazette Wire",
        caption: "Wire — yapılandırılmış kaynak kimliği ve zamanıyla hızlı habercilik.",
      },
      {
        src: "/work/satoshi-gazette-2026-09-data.jpg",
        alt: "Satoshi Gazette Corporate Bitcoin Treasuries Veri Masası",
        caption: "Veri Masası — tarih, kaynak, kapsam sınırı ve metodolojiyle birincil kanıt.",
      },
    ],
    galleryHost: "satoshigazette.org",
    ctaKicker: "Bilgi yoğun bir ürün mü geliştiriyorsunuz?",
    ctaHeading: "Karmaşıklığı getirin. Sistemi tasarlayalım.",
    ctaStart: "Sonraki hamlemi haritala",
    ctaWork: "Tüm projeler",
  },
  fr: {
    back: "Réalisations",
    kicker: "Cas 02 / Média · Données · Opérations contrôlées",
    ownershipTag: "Publication détenue",
    statusTag: "En ligne",
    title: ["Une rédaction construite", "comme un produit."],
    lead: "Satoshi Gazette relie une publication Bitcoin publique aux systèmes de preuves, d'état éditorial et de distribution nécessaires pour l'exploiter avec rigueur.",
    visit: { label: "Voir la publication en ligne", url: "https://satoshigazette.org" },
    railLabel: "Résumé du produit",
    rail: [
      ["Produit", "Rédaction 100 % Bitcoin"],
      ["Statut", "En ligne sur satoshigazette.org"],
      ["Périmètre", "Produit · UX éditoriale · Données · Opérations"],
      ["Propriété", "Détenue par MaydaLabs, éditorialement indépendante"],
    ],
    sections: [
      {
        heading: "Contexte",
        paragraphs: [
          "Satoshi Gazette est une publication Bitcoin indépendante que MaydaLabs a construite et détient comme produit. L'autorité éditoriale ne vient pas de la typographie seule : le produit doit préserver les preuves, rendre l'état visible aux opérateurs, séparer lecture publique et contrôle interne, et garder le jugement humain dans les étapes décisives.",
        ],
      },
      {
        heading: "Contrainte",
        paragraphs: [
          "Construire une publication crédible et éditoriale pendant que le système d'exploitation derrière elle reste rapide, structuré et prêt pour une assistance IA responsable — sans réduire le travail éditorial à de l'automatisation de contenu.",
        ],
      },
      {
        heading: "Le périmètre exact de MaydaLabs",
        items: [
          "Architecture de l'information éditoriale et système visuel",
          "Le produit public : page d'accueil, rubriques, Wire, briefings et Data Desk",
          "Workflows de publication et outils internes de rédaction",
          "Modèles de données, API et contexte marché/réseau Bitcoin en direct",
          "Modèle de preuves à sources vérifiées et fondations de recherche",
          "Brouillons de distribution et files de revue derrière la surface publique",
        ],
      },
      {
        heading: "Ce qui a été construit",
        items: [
          "Une couche de signal public : rubriques, Wire, briefings et contexte marché offrant un scan rapide ou un parcours profond dans un même univers éditorial",
          "Une colonne éditoriale : soumissions, candidats, revue des preuves, édition et publication dans un cycle explicite sous contrôle opérateur",
          "Des preuves avec des rôles : sources vérifiées reliées comme primaires, complémentaires, contextuelles ou contradictoires plutôt qu'un amas de liens",
          "Des entrées Wire où identité et heure de la source font partie du modèle de contenu, préservant la provenance sur une surface rapide",
          "Un Data Desk à preuves primaires (Corporate Bitcoin Treasuries) : observations sélectionnées avec dates, sources, limites de périmètre et méthodologie",
          "Des fondations de recherche contrôlées (Ask Satoshi) : limité à Bitcoin, fondé sur les citations, conçu pour se retirer quand les preuves sont faibles",
        ],
      },
      {
        heading: "Preuves vérifiables",
        paragraphs: [
          "La publication est en ligne et publique sur satoshigazette.org — page d'accueil, rubriques, Wire, briefings et Data Desk sont lisibles maintenant. Les captures ci-dessous viennent du produit en ligne.",
          "Aucun chiffre de lectorat, de croissance ou de revenu n'est revendiqué. Les systèmes internes contrôlés sont décrits comme des capacités ; leur fonctionnement interne reste privé.",
        ],
      },
      {
        heading: "Statut actuel",
        paragraphs: ["En ligne et en publication, le système d'exploitation continuant d'évoluer derrière."],
      },
      {
        heading: "Propriété",
        paragraphs: [
          "Satoshi Gazette est une publication détenue par MaydaLabs — ni un client, ni une vitrine publicitaire du studio. Ses standards éditoriaux, corrections et décisions de publication restent indépendants du travail commercial de MaydaLabs. Mehmet possède la direction produit et la réalisation ; l'IA accélère recherche et production quand c'est utile, la responsabilité éditoriale reste humaine.",
        ],
      },
    ],
    gallery: [
      {
        src: "/work/satoshi-gazette-2026-09-home.jpg",
        alt: "Accueil Satoshi Gazette actuel avec articles et Wire",
        caption: "Page d'accueil — marché, rubriques, articles majeurs et Wire dans un même masthead.",
      },
      {
        src: "/work/satoshi-gazette-2026-09-wire.jpg",
        alt: "Wire Satoshi Gazette actuel et peuplé",
        caption: "The Wire — information rapide avec source et heure structurées.",
      },
      {
        src: "/work/satoshi-gazette-2026-09-data.jpg",
        alt: "Data Desk Corporate Bitcoin Treasuries de Satoshi Gazette",
        caption: "Data Desk — preuves primaires avec dates, sources, limites et méthode.",
      },
    ],
    galleryHost: "satoshigazette.org",
    ctaKicker: "Vous construisez un produit riche en information ?",
    ctaHeading: "Apportez la complexité. Nous concevrons le système.",
    ctaStart: "Cartographier ma prochaine étape",
    ctaWork: "Toutes les réalisations",
  },
};

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({
    ...META[locale],
    path: "/case-studies/satoshi-gazette",
    locale,
    socialCard: "satoshi-gazette",
  });
}

export default async function SatoshiGazetteCaseStudyPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return <CaseStudy locale={locale} copy={COPY[locale]} stack={PROJECT_STACKS["satoshi-gazette"]} />;
}
