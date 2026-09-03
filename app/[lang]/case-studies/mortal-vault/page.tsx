import { CaseStudy, type CaseStudyCopy } from "@/components/CaseStudy";
import { PROJECT_STACKS } from "@/lib/stack";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";

const META = {
  en: {
    title: "Mortal Vault case study",
    socialTitle: "Mortal Vault: self-custodial continuity · MaydaLabs",
    description:
      "A private, unaudited MaydaLabs lab product exploring owner check-ins, delayed beneficiary claims, and explicit self-custody safety boundaries.",
  },
  tr: {
    title: "Mortal Vault vaka çalışması",
    socialTitle: "Mortal Vault: self-custody süreklilik · MaydaLabs",
    description:
      "Sahip check-in'lerini, gecikmeli lehtar taleplerini ve açık self-custody güvenlik sınırlarını araştıran özel, denetlenmemiş bir MaydaLabs lab ürünü.",
  },
  fr: {
    title: "Étude de cas Mortal Vault",
    socialTitle: "Mortal Vault : continuité en autogarde · MaydaLabs",
    description:
      "Un produit de lab MaydaLabs privé et non audité qui explore les check-ins du propriétaire, les réclamations différées et des limites de sécurité explicites.",
  },
} as const;

const COPY: Record<"en" | "tr" | "fr", CaseStudyCopy> = {
  en: {
    back: "Work",
    kicker: "Lab 03 / Crypto · Self-custody · Continuity",
    ownershipTag: "Lab product",
    statusTag: "Private alpha · Unaudited",
    title: ["Continuity rules", "without a custodian."],
    lead: "Mortal Vault is a self-custodial continuity vault: an owner checks in, inactivity opens a delayed beneficiary claim, and owner activity can still cancel it before execution.",
    railLabel: "Product summary",
    rail: [
      ["Engagement", "MaydaLabs lab product"],
      ["Status", "Private alpha · Contracts unaudited"],
      ["Scope", "Solidity · Hardhat · Next.js · EVM testnets"],
      ["Ownership", "MaydaLabs-owned, no public release"],
    ],
    sections: [
      {
        heading: "Context",
        paragraphs: [
          "Bitcoin and crypto self-custody has a hard human problem: what happens to funds when the owner can no longer act? Mortal Vault explores a continuity lifecycle with no administrator, no custody service, and no emergency override — the rules live in the contract, and the risks stay visible.",
        ],
      },
      {
        heading: "Constraint",
        paragraphs: [
          "Make a high-consequence self-custody lifecycle understandable without hiding the irreversible risks or implying legal and security guarantees the product cannot make.",
        ],
      },
      {
        heading: "MaydaLabs' exact scope",
        items: [
          "The continuity model: owner check-ins, inactivity windows, delayed claims",
          "Solidity contract lifecycle and its bounded state machine",
          "Owner and beneficiary interfaces in Next.js, with network, contract, and transaction state exposed",
          "Event-backed activity history and deterministic reminder planning",
          "Security work treated as a release gate: threat model, adversarial tests, fuzzing, invariants, static analysis, balance caps",
        ],
      },
      {
        heading: "What was built",
        items: [
          "A bounded contract lifecycle: create, fund, update, check in, withdraw, close, request a claim, cancel it through owner activity, and execute only after both time gates",
          "Separated owner control and a shareable beneficiary claim path",
          "Contract events parsed into bounded activity views that survive refreshes",
          "Adversarial, fuzz, invariant, and static-analysis gates inside the repository",
          "Testnet-first network and release configuration with explicit release blockers",
        ],
      },
      {
        heading: "Verifiable evidence",
        paragraphs: [
          "The repository is private; the demo capture below shows the working owner-facing surface from the local application. Wallet connection and chain actions stay outside this public frame. Deeper evidence — the contract lifecycle, tests, and threat model — can be walked through in a conversation.",
        ],
      },
      {
        heading: "Current status",
        paragraphs: [
          "Private alpha in active development. Mainnet remains blocked by independent review, external wallet exercises, monitoring, and demonstrated demand.",
        ],
      },
      {
        heading: "Ownership",
        paragraphs: [
          "A MaydaLabs-owned lab product. Mehmet owns the product definition and implementation, with every security and release claim kept behind explicit evidence gates.",
        ],
      },
    ],
    boundaries: {
      heading: "What this is not",
      items: [
        "Contracts are unaudited and must not hold meaningful funds.",
        "No administrator, custody service, legal determination, or emergency override exists.",
        "This is not legal inheritance, probate, identity verification, or key recovery.",
        "No mainnet claim is made before independent review and the other release gates pass.",
      ],
    },
    gallery: [
      {
        src: "/work/mortal-vault-demo-home.jpg",
        alt: "Mortal Vault owner entry screen from the local demo",
        caption: "Owner entry screen — unaudited alpha, test networks only.",
      },
    ],
    ctaKicker: "Building a trust-critical product?",
    ctaHeading: "Make the state explicit. Make the risk legible.",
    ctaStart: "Map my next move",
    ctaWork: "All work",
  },
  tr: {
    back: "Projeler",
    kicker: "Lab 03 / Kripto · Self-custody · Süreklilik",
    ownershipTag: "Lab ürünü",
    statusTag: "Özel alfa · Denetlenmedi",
    title: ["Saklama hizmeti olmadan", "süreklilik kuralları."],
    lead: "Mortal Vault bir self-custody süreklilik kasasıdır: sahip düzenli check-in yapar, hareketsizlik gecikmeli lehtar talebini açar ve sahip aktivitesi yürütmeden önce talebi hâlâ iptal edebilir.",
    railLabel: "Ürün özeti",
    rail: [
      ["Çalışma", "MaydaLabs lab ürünü"],
      ["Durum", "Özel alfa · Sözleşmeler denetlenmedi"],
      ["Kapsam", "Solidity · Hardhat · Next.js · EVM testnetleri"],
      ["Sahiplik", "MaydaLabs'e ait, açık sürüm yok"],
    ],
    sections: [
      {
        heading: "Bağlam",
        paragraphs: [
          "Bitcoin ve kripto self-custody'nin zor bir insani problemi var: sahip artık hareket edemediğinde fonlara ne olur? Mortal Vault; yönetici, saklama hizmeti ve acil durum override'ı olmayan bir süreklilik yaşam döngüsünü araştırıyor — kurallar sözleşmede yaşıyor, riskler görünür kalıyor.",
        ],
      },
      {
        heading: "Kısıt",
        paragraphs: [
          "Yüksek sonuçlu bir self-custody yaşam döngüsünü; geri döndürülemez riskleri gizlemeden ve ürünün veremeyeceği hukuki ya da güvenlik garantilerini ima etmeden anlaşılır kılmak.",
        ],
      },
      {
        heading: "MaydaLabs'in tam kapsamı",
        items: [
          "Süreklilik modeli: sahip check-in'leri, hareketsizlik pencereleri, gecikmeli talepler",
          "Solidity sözleşme yaşam döngüsü ve sınırlı durum makinesi",
          "Next.js'te sahip ve lehtar arayüzleri; ağ, sözleşme ve işlem durumu görünür",
          "Event tabanlı aktivite geçmişi ve deterministik hatırlatma planı",
          "Sürüm kapısı olarak güvenlik çalışması: tehdit modeli, adversarial testler, fuzzing, invariantlar, statik analiz, bakiye limitleri",
        ],
      },
      {
        heading: "Ne inşa edildi",
        items: [
          "Sınırlı sözleşme yaşam döngüsü: oluşturma, fonlama, güncelleme, check-in, çekme, kapatma, talep başlatma, sahip aktivitesiyle iptal ve yalnızca iki zaman kapısından sonra yürütme",
          "Ayrılmış sahip kontrolü ve paylaşılabilir lehtar talep yolu",
          "Yenilemelerden sonra kalan sınırlı aktivite görünümlerine dönüşen sözleşme eventleri",
          "Repository içinde adversarial, fuzz, invariant ve statik analiz kapıları",
          "Açık sürüm engelleriyle testnet öncelikli ağ ve sürüm yapılandırması",
        ],
      },
      {
        heading: "Doğrulanabilir kanıt",
        paragraphs: [
          "Repository özel; aşağıdaki demo kaydı yerel uygulamadaki çalışan sahip arayüzünü gösteriyor. Cüzdan bağlantısı ve zincir işlemleri bu açık karenin dışında kalır. Daha derin kanıt — sözleşme yaşam döngüsü, testler ve tehdit modeli — bir görüşmede birlikte incelenebilir.",
        ],
      },
      {
        heading: "Mevcut durum",
        paragraphs: [
          "Aktif geliştirmede özel alfa. Mainnet; bağımsız inceleme, dış cüzdan egzersizleri, izleme ve kanıtlanmış talep olmadan kapalı.",
        ],
      },
      {
        heading: "Sahiplik",
        paragraphs: [
          "MaydaLabs'e ait bir lab ürünü. Ürün tanımı ve uygulama Mehmet'e ait; her güvenlik ve sürüm iddiası açık kanıt kapılarının arkasında tutulur.",
        ],
      },
    ],
    boundaries: {
      heading: "Ne değildir",
      items: [
        "Sözleşmeler denetlenmemiştir ve anlamlı tutarlar tutmamalıdır.",
        "Yönetici, saklama hizmeti, hukuki karar veya acil durum override'ı yoktur.",
        "Hukuki miras, veraset, kimlik doğrulama veya anahtar kurtarma değildir.",
        "Bağımsız inceleme ve diğer sürüm kapıları geçilmeden mainnet iddiası yapılmaz.",
      ],
    },
    gallery: [
      {
        src: "/work/mortal-vault-demo-home.jpg",
        alt: "Yerel demodan Mortal Vault sahip giriş ekranı",
        caption: "Sahip giriş ekranı — denetlenmemiş alfa, yalnızca test ağları.",
      },
    ],
    ctaKicker: "Güven kritik bir ürün mü geliştiriyorsunuz?",
    ctaHeading: "Durumu açık kılın. Riski anlaşılır yapın.",
    ctaStart: "Sonraki hamlemi haritala",
    ctaWork: "Tüm projeler",
  },
  fr: {
    back: "Réalisations",
    kicker: "Lab 03 / Crypto · Autogarde · Continuité",
    ownershipTag: "Produit lab",
    statusTag: "Alpha privée · Non auditée",
    title: ["Des règles de continuité", "sans dépositaire."],
    lead: "Mortal Vault est un coffre de continuité en autogarde : le propriétaire confirme son activité, l'inactivité ouvre une réclamation différée du bénéficiaire, et une action du propriétaire peut encore l'annuler avant exécution.",
    railLabel: "Résumé du produit",
    rail: [
      ["Mission", "Produit lab MaydaLabs"],
      ["Statut", "Alpha privée · Contrats non audités"],
      ["Périmètre", "Solidity · Hardhat · Next.js · Testnets EVM"],
      ["Propriété", "Détenu par MaydaLabs, pas de sortie publique"],
    ],
    sections: [
      {
        heading: "Contexte",
        paragraphs: [
          "L'autogarde en Bitcoin et crypto a un problème humain difficile : qu'arrive-t-il aux fonds quand le propriétaire ne peut plus agir ? Mortal Vault explore un cycle de continuité sans administrateur, sans dépositaire et sans dérogation d'urgence — les règles vivent dans le contrat et les risques restent visibles.",
        ],
      },
      {
        heading: "Contrainte",
        paragraphs: [
          "Rendre compréhensible un cycle d'autogarde à fortes conséquences sans cacher les risques irréversibles ni suggérer des garanties légales ou de sécurité que le produit ne peut pas donner.",
        ],
      },
      {
        heading: "Le périmètre exact de MaydaLabs",
        items: [
          "Le modèle de continuité : check-ins, fenêtres d'inactivité, réclamations différées",
          "Cycle de contrat Solidity et sa machine à états bornée",
          "Interfaces propriétaire et bénéficiaire en Next.js, avec réseau, contrat et transactions exposés",
          "Historique d'activité fondé sur les événements et rappels déterministes",
          "La sécurité comme condition de sortie : modèle de menace, tests adversariaux, fuzzing, invariants, analyse statique, plafonds",
        ],
      },
      {
        heading: "Ce qui a été construit",
        items: [
          "Un cycle contractuel borné : créer, financer, modifier, confirmer, retirer, fermer, demander une réclamation, l'annuler par activité du propriétaire et exécuter seulement après les deux délais",
          "Un contrôle propriétaire séparé d'un parcours de réclamation partageable",
          "Des événements de contrat transformés en vues d'activité bornées qui survivent au rafraîchissement",
          "Des tests adversariaux, fuzz, invariants et analyse statique dans le dépôt",
          "Une configuration testnet d'abord, avec des blocages de sortie explicites",
        ],
      },
      {
        heading: "Preuves vérifiables",
        paragraphs: [
          "Le dépôt est privé ; la capture ci-dessous montre l'interface propriétaire fonctionnelle de l'application locale. La connexion wallet et les actions on-chain restent hors de ce cadre public. Les preuves plus profondes — cycle de contrat, tests, modèle de menace — se parcourent en conversation.",
        ],
      },
      {
        heading: "Statut actuel",
        paragraphs: [
          "Alpha privée en construction active. Le mainnet reste bloqué par la revue indépendante, les essais externes, le suivi et la preuve de demande.",
        ],
      },
      {
        heading: "Propriété",
        paragraphs: [
          "Un produit lab détenu par MaydaLabs. Mehmet possède la définition et la réalisation, chaque promesse de sécurité et de sortie restant derrière des preuves explicites.",
        ],
      },
    ],
    boundaries: {
      heading: "Ce que ce n'est pas",
      items: [
        "Les contrats ne sont pas audités et ne doivent pas détenir de fonds significatifs.",
        "Aucun administrateur, dépositaire, jugement légal ou dérogation d'urgence n'existe.",
        "Ce n'est ni un service successoral, ni une vérification d'identité, ni une récupération de clé.",
        "Aucune promesse mainnet avant la revue indépendante et les autres conditions de sortie.",
      ],
    },
    gallery: [
      {
        src: "/work/mortal-vault-demo-home.jpg",
        alt: "Écran d'entrée propriétaire Mortal Vault depuis la démo locale",
        caption: "Écran propriétaire — alpha non auditée, testnets uniquement.",
      },
    ],
    ctaKicker: "Vous construisez un produit critique pour la confiance ?",
    ctaHeading: "Rendez l'état explicite. Rendez le risque lisible.",
    ctaStart: "Cartographier ma prochaine étape",
    ctaWork: "Toutes les réalisations",
  },
};

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({
    ...META[locale],
    path: "/case-studies/mortal-vault",
    locale,
    socialCard: "mortal-vault",
  });
}

export default async function MortalVaultCaseStudyPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return <CaseStudy locale={locale} copy={COPY[locale]} stack={PROJECT_STACKS["mortal-vault"]} />;
}
