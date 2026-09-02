import { CaseStudy, type CaseStudyCopy } from "@/components/CaseStudy";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const META = {
  en: {
    title: "HodlStay case study",
    socialTitle: "HodlStay: a global stay marketplace · MaydaLabs",
    description:
      "How MaydaLabs rebuilt AirBTC into HodlStay: marketplace discovery, host operations, availability safety, Bitcoin payments, and operational migration as one system.",
  },
  tr: {
    title: "HodlStay vaka çalışması",
    socialTitle: "HodlStay: küresel konaklama pazarı · MaydaLabs",
    description:
      "MaydaLabs'in AirBTC'yi HodlStay'e nasıl dönüştürdüğü: pazar yeri keşfi, ev sahibi operasyonları, uygunluk güvenliği, Bitcoin ödemeleri ve operasyonel veri göçü tek sistem olarak.",
  },
  fr: {
    title: "Étude de cas HodlStay",
    socialTitle: "HodlStay : une marketplace mondiale de séjours · MaydaLabs",
    description:
      "Comment MaydaLabs a reconstruit AirBTC en HodlStay : découverte, opérations hôtes, sécurité de disponibilité, paiements Bitcoin et migration opérationnelle en un seul système.",
  },
} as const;

const COPY: Record<"en" | "tr" | "fr", CaseStudyCopy> = {
  en: {
    back: "Work",
    kicker: "Case 01 / Marketplace · Travel · Bitcoin",
    ownershipTag: "Client build",
    statusTag: "Live",
    title: ["From AirBTC to a stay", "worth holding onto."],
    lead: "A Bitcoin-native travel idea rebuilt into a broader global stay marketplace — the guest experience connected to the operational system required to run it.",
    visit: { label: "Visit the live product", url: "https://hodlstay.com" },
    railLabel: "Engagement summary",
    rail: [
      ["Engagement", "End-to-end client build"],
      ["Status", "Live at hodlstay.com"],
      ["Scope", "Product · Brand · Build · Launch"],
      ["Ownership", "Client product"],
    ],
    sections: [
      {
        heading: "Context",
        paragraphs: [
          "AirBTC was a niche travel platform with a distinct community and a clear Bitcoin origin. The product direction evolved into HodlStay: a broader premium travel proposition where Bitcoin-friendly booking is built into the experience rather than being the whole experience.",
          "A marketplace is the customer experience and the machinery behind it. The visible product only works when inventory, trust, availability, payment state, partner supply, and operator decisions agree — HodlStay was shaped around that whole system.",
        ],
      },
      {
        heading: "Constraint",
        paragraphs: [
          "Turn a promising niche platform into a credible, scalable marketplace without losing the community and Bitcoin roots that made it distinct — while reconciling legacy records, partner inventory, and real host operations into one launchable system.",
        ],
      },
      {
        heading: "MaydaLabs' exact scope",
        items: [
          "Product strategy, information architecture, and release shaping",
          "Brand evolution from AirBTC to HodlStay, UX, and the interface system",
          "The full marketplace application: frontend, backend, and data",
          "Host onboarding, listings, calendars, booking responses, reviews, and payouts",
          "Booking, availability, and payment lifecycles including BTCPay checkout",
          "Partner inventory and iCal integrations, plus legacy data migration",
          "Launch preparation, operational documentation, and handover structure",
        ],
      },
      {
        heading: "What was built",
        items: [
          "Unified discovery: one search layer across native supply and eligible HotelPlanner and Dtravel partner inventory",
          "Stay dossiers connecting story, media, host trust, fiat and sats pricing, availability, and booking entry",
          "Availability safety: imported iCal blocks, manual host blocks, and internal bookings checked together to reduce double-booking risk",
          "Bitcoin payment lifecycle: host acceptance into BTCPay checkout, signed webhook verification, settlement, and a traceable payout record",
          "Operational migration: legacy WordPress and founder spreadsheet records reconciled into a structured launch pipeline with explicit exception handling",
          "A dedicated conference accommodation journey inside the wider platform",
        ],
      },
      {
        heading: "Verifiable evidence",
        paragraphs: [
          "The product is live and public at hodlstay.com — discovery, stay dossiers, and the conference product can be inspected directly. The screenshots below are captures of the live product, not concept mockups.",
          "No traffic, conversion, or revenue figures are claimed here: those belong to the client, and this site does not publish numbers whose source you cannot inspect.",
        ],
      },
      {
        heading: "Current status",
        paragraphs: [
          "HodlStay is live and serving guests and hosts at hodlstay.com.",
        ],
      },
      {
        heading: "Ownership",
        paragraphs: [
          "This is client work, not a MaydaLabs-owned venture. Mehmet led the product strategy and hands-on delivery end to end, and the build is structured for client ownership: product decisions, operating logic, and documentation are organized so the client owns what comes next.",
        ],
      },
    ],
    gallery: [
      {
        src: "/work/hodlstay-2026-08-stays.jpg",
        alt: "HodlStay stay discovery and search interface",
        caption: "Discovery — categories, dates, guests, filters, and live inventory.",
      },
      {
        src: "/work/hodlstay-2026-08-listing.jpg",
        alt: "HodlStay property dossier and booking interface",
        caption: "Stay dossier — story, media, host context, pricing, and booking entry.",
      },
      {
        src: "/work/hodlstay-2026-08-conferences.jpg",
        alt: "HodlStay conference accommodation interface",
        caption: "Conference product — a focused journey inside the wider platform.",
      },
    ],
    galleryHost: "hodlstay.com",
    ctaKicker: "Have a product with this much complexity?",
    ctaHeading: "Bring the messy system. We'll find the multiplier.",
    ctaStart: "Map my next move",
    ctaWork: "All work",
  },
  tr: {
    back: "Projeler",
    kicker: "Vaka 01 / Pazar yeri · Seyahat · Bitcoin",
    ownershipTag: "Müşteri ürünü",
    statusTag: "Canlı",
    title: ["AirBTC'den elde tutmaya değer", "bir konaklamaya."],
    lead: "Bitcoin-native bir seyahat fikri, daha geniş bir küresel konaklama pazarına dönüştürüldü — misafir deneyimi, onu işletmek için gereken operasyon sistemine bağlandı.",
    visit: { label: "Canlı ürünü aç", url: "https://hodlstay.com" },
    railLabel: "Çalışma özeti",
    rail: [
      ["Çalışma", "Uçtan uca müşteri ürünü"],
      ["Durum", "hodlstay.com'da canlı"],
      ["Kapsam", "Ürün · Marka · Geliştirme · Lansman"],
      ["Sahiplik", "Müşteri ürünü"],
    ],
    sections: [
      {
        heading: "Bağlam",
        paragraphs: [
          "AirBTC, belirgin bir topluluğa ve net bir Bitcoin kökenine sahip niş bir seyahat platformuydu. Ürün yönü HodlStay'e evrildi: Bitcoin dostu rezervasyonun tüm deneyim olmak yerine deneyimin doğal parçası olduğu daha geniş, premium bir seyahat önerisi.",
          "Bir pazar yeri, müşteri deneyimi ve arkasındaki mekanizmadır. Görünen ürün ancak envanter, güven, uygunluk, ödeme durumu, iş ortağı arzı ve operatör kararları aynı gerçeği söylediğinde çalışır — HodlStay bu bütün sistem etrafında şekillendirildi.",
        ],
      },
      {
        heading: "Kısıt",
        paragraphs: [
          "Umut vadeden niş platformu, onu farklı kılan topluluğu ve Bitcoin köklerini kaybetmeden güvenilir, ölçeklenebilir bir pazar yerine dönüştürmek — eski kayıtları, iş ortağı envanterini ve gerçek ev sahibi operasyonlarını tek lansmanlanabilir sistemde birleştirirken.",
        ],
      },
      {
        heading: "MaydaLabs'in tam kapsamı",
        items: [
          "Ürün stratejisi, bilgi mimarisi ve sürüm şekillendirme",
          "AirBTC'den HodlStay'e marka dönüşümü, UX ve arayüz sistemi",
          "Eksiksiz pazar yeri uygulaması: frontend, backend ve veri",
          "Ev sahibi katılımı, ilanlar, takvimler, rezervasyon yanıtları, yorumlar ve ödemeler",
          "BTCPay ödemesi dahil rezervasyon, uygunluk ve ödeme yaşam döngüleri",
          "İş ortağı envanteri ve iCal entegrasyonları ile eski veri göçü",
          "Lansman hazırlığı, operasyon dokümantasyonu ve devir yapısı",
        ],
      },
      {
        heading: "Ne inşa edildi",
        items: [
          "Birleşik keşif: yerel arz ile uygun HotelPlanner ve Dtravel iş ortağı envanterini sunan tek arama katmanı",
          "Hikâye, medya, ev sahibi güveni, fiat ve sats fiyatlandırması, uygunluk ve rezervasyon girişini birleştiren konaklama dosyaları",
          "Uygunluk güvenliği: içe aktarılan iCal blokları, manuel ev sahibi blokları ve dahili rezervasyonlar çifte rezervasyon riskini azaltmak için birlikte kontrol edilir",
          "Bitcoin ödeme yaşam döngüsü: ev sahibi kabulünden BTCPay ödemesine, imzalı webhook doğrulaması, mutabakat ve izlenebilir ödeme kaydına",
          "Operasyonel veri göçü: eski WordPress ve kurucu tablo kayıtları, açık istisna yönetimiyle yapılandırılmış lansman hattında uzlaştırıldı",
          "Geniş platform içinde özel bir konferans konaklama yolculuğu",
        ],
      },
      {
        heading: "Doğrulanabilir kanıt",
        paragraphs: [
          "Ürün hodlstay.com'da canlı ve herkese açık — keşif, konaklama dosyaları ve konferans ürünü doğrudan incelenebilir. Aşağıdaki ekran görüntüleri konsept maket değil, canlı ürünün kayıtlarıdır.",
          "Burada trafik, dönüşüm veya gelir rakamı iddia edilmiyor: bunlar müşteriye aittir ve bu site kaynağını denetleyemeyeceğiniz sayılar yayınlamaz.",
        ],
      },
      {
        heading: "Mevcut durum",
        paragraphs: ["HodlStay canlı; hodlstay.com'da misafirlere ve ev sahiplerine hizmet veriyor."],
      },
      {
        heading: "Sahiplik",
        paragraphs: [
          "Bu bir müşteri çalışmasıdır; MaydaLabs'e ait bir girişim değildir. Mehmet ürün stratejisini ve uygulamalı geliştirmeyi uçtan uca yürüttü; geliştirme müşteri sahipliği için yapılandırıldı: ürün kararları, işletim mantığı ve dokümantasyon, bundan sonrasına müşterinin sahip olabilmesi için düzenlendi.",
        ],
      },
    ],
    gallery: [
      {
        src: "/work/hodlstay-2026-08-stays.jpg",
        alt: "HodlStay konaklama keşfi ve arama arayüzü",
        caption: "Keşif — kategoriler, tarihler, misafirler, filtreler ve canlı envanter.",
      },
      {
        src: "/work/hodlstay-2026-08-listing.jpg",
        alt: "HodlStay konaklama dosyası ve rezervasyon arayüzü",
        caption: "Konaklama dosyası — hikâye, medya, ev sahibi bağlamı, fiyat ve rezervasyon girişi.",
      },
      {
        src: "/work/hodlstay-2026-08-conferences.jpg",
        alt: "HodlStay konferans konaklama arayüzü",
        caption: "Konferans ürünü — geniş platform içinde odaklanmış bir yolculuk.",
      },
    ],
    galleryHost: "hodlstay.com",
    ctaKicker: "Bu kadar karmaşık bir ürününüz mü var?",
    ctaHeading: "Dağınık sistemi getirin. Çarpanı birlikte bulalım.",
    ctaStart: "Sonraki hamlemi haritala",
    ctaWork: "Tüm projeler",
  },
  fr: {
    back: "Réalisations",
    kicker: "Cas 01 / Marketplace · Voyage · Bitcoin",
    ownershipTag: "Produit client",
    statusTag: "En ligne",
    title: ["D'AirBTC à un séjour qui mérite", "d'être conservé."],
    lead: "Une idée de voyage Bitcoin-native reconstruite en marketplace mondiale de séjours — l'expérience voyageur reliée au système opérationnel nécessaire pour la faire vivre.",
    visit: { label: "Voir le produit en ligne", url: "https://hodlstay.com" },
    railLabel: "Résumé de la mission",
    rail: [
      ["Mission", "Construction client de bout en bout"],
      ["Statut", "En ligne sur hodlstay.com"],
      ["Périmètre", "Produit · Marque · Code · Lancement"],
      ["Propriété", "Produit client"],
    ],
    sections: [
      {
        heading: "Contexte",
        paragraphs: [
          "AirBTC était une plateforme de voyage de niche avec une communauté distincte et une origine Bitcoin claire. Le produit a évolué vers HodlStay : une proposition de voyage premium plus large où la réservation compatible Bitcoin fait partie de l'expérience sans être toute l'expérience.",
          "Une marketplace est l'expérience client et la mécanique qui la soutient. Le produit visible ne fonctionne que lorsque inventaire, confiance, disponibilité, paiements, offre partenaire et décisions opérateur concordent — HodlStay a été construit autour de ce système complet.",
        ],
      },
      {
        heading: "Contrainte",
        paragraphs: [
          "Transformer une plateforme de niche prometteuse en marketplace crédible et évolutive sans perdre la communauté et les racines Bitcoin qui la distinguent — tout en réconciliant données historiques, inventaire partenaire et opérations hôtes réelles dans un seul système lançable.",
        ],
      },
      {
        heading: "Le périmètre exact de MaydaLabs",
        items: [
          "Stratégie produit, architecture de l'information et définition des versions",
          "Évolution de marque d'AirBTC à HodlStay, UX et système d'interface",
          "L'application marketplace complète : frontend, backend et données",
          "Intégration hôtes, annonces, calendriers, réponses de réservation, avis et versements",
          "Cycles de réservation, disponibilité et paiement, checkout BTCPay compris",
          "Inventaire partenaire, intégrations iCal et migration des données historiques",
          "Préparation du lancement, documentation opérationnelle et structure de transmission",
        ],
      },
      {
        heading: "Ce qui a été construit",
        items: [
          "Découverte unifiée : une seule couche de recherche sur l'offre native et l'inventaire partenaire HotelPlanner et Dtravel éligible",
          "Dossiers de séjour reliant histoire, médias, confiance hôte, prix fiat et sats, disponibilité et réservation",
          "Sécurité de disponibilité : blocs iCal importés, blocages manuels et réservations internes vérifiés ensemble pour réduire les doubles réservations",
          "Cycle de paiement Bitcoin : acceptation hôte vers checkout BTCPay, vérification de webhooks signés, règlement et versement traçable",
          "Migration opérationnelle : données WordPress et feuilles fondateur réconciliées dans un pipeline structuré avec gestion explicite des exceptions",
          "Un parcours d'hébergement de conférences dédié au sein de la plateforme",
        ],
      },
      {
        heading: "Preuves vérifiables",
        paragraphs: [
          "Le produit est en ligne et public sur hodlstay.com — découverte, dossiers de séjour et produit conférence sont inspectables directement. Les captures ci-dessous viennent du produit en ligne, pas de maquettes conceptuelles.",
          "Aucun chiffre de trafic, conversion ou revenu n'est revendiqué ici : ils appartiennent au client, et ce site ne publie pas de nombres dont la source ne peut pas être inspectée.",
        ],
      },
      {
        heading: "Statut actuel",
        paragraphs: ["HodlStay est en ligne et sert voyageurs et hôtes sur hodlstay.com."],
      },
      {
        heading: "Propriété",
        paragraphs: [
          "C'est un travail client, pas une entreprise détenue par MaydaLabs. Mehmet a dirigé la stratégie produit et la réalisation de bout en bout, et la construction est structurée pour la propriété du client : décisions produit, logique opérationnelle et documentation sont organisées pour que le client possède la suite.",
        ],
      },
    ],
    gallery: [
      {
        src: "/work/hodlstay-2026-08-stays.jpg",
        alt: "Interface de découverte et recherche HodlStay",
        caption: "Découverte — catégories, dates, voyageurs, filtres et inventaire en direct.",
      },
      {
        src: "/work/hodlstay-2026-08-listing.jpg",
        alt: "Dossier de propriété et réservation HodlStay",
        caption: "Dossier de séjour — histoire, médias, contexte hôte, prix et réservation.",
      },
      {
        src: "/work/hodlstay-2026-08-conferences.jpg",
        alt: "Interface d'hébergement conférence HodlStay",
        caption: "Produit conférence — un parcours ciblé dans la plateforme.",
      },
    ],
    galleryHost: "hodlstay.com",
    ctaKicker: "Votre produit est aussi complexe ?",
    ctaHeading: "Apportez le système encore flou. Nous trouverons le multiplicateur.",
    ctaStart: "Cartographier ma prochaine étape",
    ctaWork: "Toutes les réalisations",
  },
};

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({
    ...META[locale],
    path: "/case-studies/hodlstay",
    locale,
    socialCard: "hodlstay",
  });
}

export default async function HodlStayCaseStudyPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return <CaseStudy locale={locale} copy={COPY[locale]} />;
}
