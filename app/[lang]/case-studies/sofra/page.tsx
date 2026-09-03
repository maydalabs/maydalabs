import { CaseStudy, type CaseStudyCopy } from "@/components/CaseStudy";
import { PROJECT_STACKS } from "@/lib/stack";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const META = {
  en: {
    title: "Sofra case study",
    socialTitle: "Sofra: a managed household dinner marketplace · MaydaLabs",
    description:
      "A private Phase 1 MaydaLabs lab product connecting household-hosted dinners, trust, privacy, and bilingual marketplace operations. Demo data only.",
  },
  tr: {
    title: "Sofra vaka çalışması",
    socialTitle: "Sofra: yönetilen ev yemeği pazarı · MaydaLabs",
    description:
      "Evlerde düzenlenen yemekleri, güveni, gizliliği ve iki dilli pazar yeri operasyonlarını bağlayan özel Faz 1 MaydaLabs lab ürünü. Yalnızca demo verisi.",
  },
  fr: {
    title: "Étude de cas Sofra",
    socialTitle: "Sofra : marketplace gérée de dîners chez l'habitant · MaydaLabs",
    description:
      "Un produit de lab MaydaLabs privé en Phase 1 reliant dîners chez l'habitant, confiance, confidentialité et opérations bilingues. Données de démo uniquement.",
  },
} as const;

const COPY: Record<"en" | "tr" | "fr", CaseStudyCopy> = {
  en: {
    back: "Work",
    kicker: "Lab 04 / Marketplace · Hospitality · Trust",
    ownershipTag: "Lab product",
    statusTag: "Private Phase 1 · Demo-safe",
    title: ["A dinner marketplace built", "around trust at home."],
    lead: "Sofra is a Türkiye-first managed marketplace for scheduled dinners in verified households. Each table is inventory; the full evening — from welcome to tea — is the experience.",
    railLabel: "Product summary",
    rail: [
      ["Engagement", "MaydaLabs lab product"],
      ["Status", "Private Phase 1 · Demo data only"],
      ["Scope", "Next.js · TypeScript · Supabase · EN/TR"],
      ["Ownership", "MaydaLabs-owned, no public launch"],
    ],
    sections: [
      {
        heading: "Context",
        paragraphs: [
          "The household is the venue, which makes trust the system. A marketplace for dinners in real homes has to design a warm consumer experience on top of a rigorous approval, privacy, booking, incident, and operating model — without exposing the household behind the table.",
        ],
      },
      {
        heading: "Constraint",
        paragraphs: [
          "Connect public discovery to host, guest, and operator workflows while deliberately separating public presentation from exact household and safety data.",
        ],
      },
      {
        heading: "MaydaLabs' exact scope",
        items: [
          "The managed marketplace model: application, approval, scheduling, booking, oversight",
          "Public table discovery and guest journeys",
          "Host application and managed approval lifecycle",
          "Operator, booking, pricing, and incident surfaces",
          "Explicit public/private data projections",
          "A bilingual (English and Turkish) product architecture in one application",
        ],
      },
      {
        heading: "What was built",
        items: [
          "A managed marketplace lifecycle: hosts apply, the platform approves, tables are scheduled, guests book, operators oversee — completion and reviews are explicit states",
          "A household privacy boundary: public projections show approximate area and product context while exact addresses, coordinates, dietary details, assessments, and safety data remain private",
          "One bilingual product system: EN and TR journeys share the same application, navigation, messages, host tools, guest account, and operator surfaces",
          "Demo-safe infrastructure: repository adapters and seeded journeys make the product testable without pretending production services, real payments, or real customers exist",
        ],
      },
      {
        heading: "Verifiable evidence",
        paragraphs: [
          "The captures below come from the fictional local demo: read-only journeys over seeded records, contacting no remote production service. They are product evidence, not evidence of real people or transactions. A deeper walkthrough is available in conversation.",
        ],
      },
      {
        heading: "Current status",
        paragraphs: [
          "Private Phase 1 in active development. No public launch, real booking volume, host network, or commercial outcome is claimed, and payments are not connected to real production processing.",
        ],
      },
      {
        heading: "Ownership",
        paragraphs: [
          "A MaydaLabs-owned lab product. Mehmet owns the product architecture and implementation, keeping demo evidence strictly separate from launch, payment, and customer claims.",
        ],
      },
    ],
    boundaries: {
      heading: "What this is not",
      items: [
        "No public launch, real booking volume, host network, or commercial outcome is claimed.",
        "Payments are not connected to real production processing.",
        "Demo records are product evidence, not evidence of real people or transactions.",
        "Brand, photography, policies, and operating choices remain open to iteration.",
      ],
    },
    gallery: [
      {
        src: "/work/sofra-demo-home.jpg",
        alt: "Sofra public discovery demo screen with fictional data",
        caption: "Public discovery — fictional demo data.",
      },
      {
        src: "/work/sofra-demo-journey.jpg",
        alt: "Sofra cross-role journey demo screen",
        caption: "Cross-role journey — read-only and demo-safe.",
      },
    ],
    ctaKicker: "Building a marketplace where trust matters?",
    ctaHeading: "Design the public promise. Protect the private truth.",
    ctaStart: "Map my next move",
    ctaWork: "All work",
  },
  tr: {
    back: "Projeler",
    kicker: "Lab 04 / Pazar yeri · Ağırlama · Güven",
    ownershipTag: "Lab ürünü",
    statusTag: "Özel Faz 1 · Demo güvenli",
    title: ["Evde güven etrafında kurulan", "bir akşam yemeği pazarı."],
    lead: "Sofra, doğrulanmış hanelerde planlı akşam yemekleri için Türkiye odaklı yönetilen bir pazar yeridir. Her sofra envanterdir; karşılamadan çaya kadar tüm akşam ise deneyim.",
    railLabel: "Ürün özeti",
    rail: [
      ["Çalışma", "MaydaLabs lab ürünü"],
      ["Durum", "Özel Faz 1 · Yalnızca demo verisi"],
      ["Kapsam", "Next.js · TypeScript · Supabase · EN/TR"],
      ["Sahiplik", "MaydaLabs'e ait, açık lansman yok"],
    ],
    sections: [
      {
        heading: "Bağlam",
        paragraphs: [
          "Mekân evdir; bu da güveni sistem yapar. Gerçek evlerdeki akşam yemekleri için bir pazar yeri, sofranın arkasındaki haneyi açığa çıkarmadan; sıcak bir tüketici deneyimini disiplinli bir onay, gizlilik, rezervasyon, olay ve işletim modelinin üzerine kurmak zorundadır.",
        ],
      },
      {
        heading: "Kısıt",
        paragraphs: [
          "Açık keşfi ev sahibi, misafir ve operatör akışlarına bağlarken; açık sunumu tam hane ve güvenlik verilerinden bilinçli olarak ayırmak.",
        ],
      },
      {
        heading: "MaydaLabs'in tam kapsamı",
        items: [
          "Yönetilen pazar yeri modeli: başvuru, onay, planlama, rezervasyon, denetim",
          "Açık sofra keşfi ve misafir yolculukları",
          "Ev sahibi başvurusu ve yönetilen onay yaşam döngüsü",
          "Operatör, rezervasyon, fiyat ve olay yüzeyleri",
          "Açık/özel veri projeksiyonları",
          "Tek uygulamada iki dilli (İngilizce ve Türkçe) ürün mimarisi",
        ],
      },
      {
        heading: "Ne inşa edildi",
        items: [
          "Yönetilen pazar yaşam döngüsü: ev sahipleri başvurur, platform onaylar, sofralar planlanır, misafirler ayırtır, operatörler denetler — tamamlama ve yorumlar açık durumlardır",
          "Hane gizlilik sınırı: açık projeksiyonlar yaklaşık bölge ve ürün bağlamını gösterir; tam adres, koordinat, beslenme, değerlendirme ve güvenlik verileri özel kalır",
          "Tek iki dilli ürün sistemi: EN ve TR yolculukları aynı uygulamayı, navigasyonu, mesajları, ev sahibi araçlarını, misafir hesabını ve operatör yüzeylerini paylaşır",
          "Demo güvenli altyapı: repository adapter'ları ve seed yolculukları; üretim servisleri, gerçek ödemeler veya gerçek müşteriler varmış gibi davranmadan ürünü test edilebilir kılar",
        ],
      },
      {
        heading: "Doğrulanabilir kanıt",
        paragraphs: [
          "Aşağıdaki kayıtlar kurgusal yerel demodan: seed kayıtları üzerinde salt okunur yolculuklar, uzak üretim servisine bağlanmaz. Bunlar ürün kanıtıdır; gerçek kişi veya işlem kanıtı değildir. Daha derin inceleme görüşmede mümkündür.",
        ],
      },
      {
        heading: "Mevcut durum",
        paragraphs: [
          "Aktif geliştirmede özel Faz 1. Herkese açık lansman, gerçek rezervasyon hacmi, ev sahibi ağı veya ticari sonuç iddia edilmez; ödemeler gerçek üretim işlemlerine bağlı değildir.",
        ],
      },
      {
        heading: "Sahiplik",
        paragraphs: [
          "MaydaLabs'e ait bir lab ürünü. Ürün mimarisi ve uygulama Mehmet'e aittir; demo kanıtı lansman, ödeme ve müşteri iddialarından kesin biçimde ayrı tutulur.",
        ],
      },
    ],
    boundaries: {
      heading: "Ne değildir",
      items: [
        "Herkese açık lansman, gerçek rezervasyon hacmi, ev sahibi ağı veya ticari sonuç iddia edilmez.",
        "Ödemeler gerçek üretim işlemlerine bağlı değildir.",
        "Demo kayıtları ürün kanıtıdır; gerçek kişi veya işlem kanıtı değildir.",
        "Marka, fotoğraf, politikalar ve işletim kararları iterasyona açıktır.",
      ],
    },
    gallery: [
      {
        src: "/work/sofra-demo-home.jpg",
        alt: "Kurgusal verilerle Sofra açık keşif demo ekranı",
        caption: "Açık keşif — kurgusal demo verisi.",
      },
      {
        src: "/work/sofra-demo-journey.jpg",
        alt: "Sofra roller arası yolculuk demo ekranı",
        caption: "Roller arası yolculuk — salt okunur ve demo güvenli.",
      },
    ],
    ctaKicker: "Güvenin önemli olduğu bir pazar yeri mi kuruyorsunuz?",
    ctaHeading: "Açık vaadi tasarlayın. Özel gerçeği koruyun.",
    ctaStart: "Sonraki hamlemi haritala",
    ctaWork: "Tüm projeler",
  },
  fr: {
    back: "Réalisations",
    kicker: "Lab 04 / Marketplace · Hospitalité · Confiance",
    ownershipTag: "Produit lab",
    statusTag: "Phase 1 privée · Démo sûre",
    title: ["Une marketplace de dîners fondée", "sur la confiance à domicile."],
    lead: "Sofra est une marketplace gérée, pensée d'abord pour la Türkiye, pour des dîners planifiés dans des foyers vérifiés. Chaque table est l'inventaire ; toute la soirée — de l'accueil au thé — est l'expérience.",
    railLabel: "Résumé du produit",
    rail: [
      ["Mission", "Produit lab MaydaLabs"],
      ["Statut", "Phase 1 privée · Données de démo uniquement"],
      ["Périmètre", "Next.js · TypeScript · Supabase · EN/TR"],
      ["Propriété", "Détenu par MaydaLabs, pas de lancement public"],
    ],
    sections: [
      {
        heading: "Contexte",
        paragraphs: [
          "Le foyer est le lieu, ce qui fait de la confiance le système. Une marketplace de dîners dans de vraies maisons doit concevoir une expérience chaleureuse sur un modèle rigoureux d'approbation, de confidentialité, de réservation, d'incidents et d'opérations — sans exposer le foyer derrière la table.",
        ],
      },
      {
        heading: "Contrainte",
        paragraphs: [
          "Relier la découverte publique aux workflows hôtes, invités et opérateurs tout en séparant délibérément la présentation publique des données exactes du foyer et de sécurité.",
        ],
      },
      {
        heading: "Le périmètre exact de MaydaLabs",
        items: [
          "Le modèle de marketplace gérée : candidature, approbation, planification, réservation, supervision",
          "Découverte publique des tables et parcours invités",
          "Candidature hôte et cycle d'approbation géré",
          "Surfaces opérateur, réservation, prix et incidents",
          "Projections de données public/privé explicites",
          "Une architecture produit bilingue (anglais et turc) dans une seule application",
        ],
      },
      {
        heading: "Ce qui a été construit",
        items: [
          "Un cycle de marketplace géré : les hôtes candidatent, la plateforme approuve, les tables sont planifiées, les invités réservent, les opérateurs supervisent — clôture et avis sont des états explicites",
          "Une limite de confidentialité du foyer : les projections publiques montrent la zone approximative et le contexte produit ; adresses exactes, coordonnées, régimes, évaluations et données de sécurité restent privés",
          "Un système produit bilingue : les parcours EN et TR partagent la même application, navigation, messages, outils hôtes, compte invité et surfaces opérateur",
          "Une infrastructure de démo sûre : adaptateurs et parcours seed rendent le produit testable sans prétendre à des services de production, paiements ou clients réels",
        ],
      },
      {
        heading: "Preuves vérifiables",
        paragraphs: [
          "Les captures ci-dessous viennent de la démo locale fictive : parcours en lecture seule sur des données seed, sans contact avec un service de production distant. Ce sont des preuves produit, pas des preuves de personnes ou de transactions réelles. Une visite plus approfondie se fait en conversation.",
        ],
      },
      {
        heading: "Statut actuel",
        paragraphs: [
          "Phase 1 privée en construction active. Aucun lancement public, volume de réservations, réseau d'hôtes ou résultat commercial n'est revendiqué, et les paiements ne sont pas reliés à un traitement de production réel.",
        ],
      },
      {
        heading: "Propriété",
        paragraphs: [
          "Un produit lab détenu par MaydaLabs. Mehmet possède l'architecture et la réalisation, en gardant les preuves de démo strictement séparées des promesses de lancement, de paiement et de clients.",
        ],
      },
    ],
    boundaries: {
      heading: "Ce que ce n'est pas",
      items: [
        "Aucun lancement public, volume réel, réseau d'hôtes ou résultat commercial n'est revendiqué.",
        "Les paiements ne sont pas reliés à un traitement de production réel.",
        "Les données de démo prouvent le produit, pas des personnes ou transactions réelles.",
        "Marque, photos, politiques et choix opérationnels restent ouverts à l'itération.",
      ],
    },
    gallery: [
      {
        src: "/work/sofra-demo-home.jpg",
        alt: "Écran de démo de découverte publique Sofra avec données fictives",
        caption: "Découverte publique — données de démo fictives.",
      },
      {
        src: "/work/sofra-demo-journey.jpg",
        alt: "Écran de démo du parcours multi-rôles Sofra",
        caption: "Parcours multi-rôles — lecture seule et démo sûre.",
      },
    ],
    ctaKicker: "Vous construisez une marketplace où la confiance compte ?",
    ctaHeading: "Concevez la promesse publique. Protégez la vérité privée.",
    ctaStart: "Cartographier ma prochaine étape",
    ctaWork: "Toutes les réalisations",
  },
};

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({
    ...META[locale],
    path: "/case-studies/sofra",
    locale,
    socialCard: "sofra",
  });
}

export default async function SofraCaseStudyPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return <CaseStudy locale={locale} copy={COPY[locale]} stack={PROJECT_STACKS["sofra"]} />;
}
