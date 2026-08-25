import type { Locale } from "@/lib/i18n";

export const OS_COPY = {
  en: {
    menu: [
      ["Work", "/case-studies"],
      ["Services", "/services"],
      ["About", "/about"],
    ],
    boot: [
      "MAYDAOS 26.08 — signal kernel",
      "mounting /work .......... 4 transmissions",
      "telemetry link .......... up",
      "locales ................. en · tr · fr",
      "sound ................... off (SND to enable)",
      "boot complete — welcome",
    ],
    welcome: {
      title: "welcome — read me",
      kicker: "MaydaLabs — product & growth studio",
      hero: ["We build software", "people can", "feel."],
      body: "Apps, marketplaces, commerce, and the growth systems around them. Built for founders with ambitious ideas and no patience for agency theatre. You are standing in our operating system — drag things around.",
      start: "Start a project",
      explore: "Open the work",
    },
    workWindow: {
      title: "work — transmissions",
      open: "Open case",
      rows: [
        { tx: "TX-01", name: "HodlStay", status: "Client build · Broadcasting", path: "/case-studies/hodlstay" },
        { tx: "TX-02", name: "Satoshi Gazette", status: "Studio product · Broadcasting", path: "/case-studies/satoshi-gazette" },
        { tx: "TX-03", name: "Mortal Vault", status: "Private alpha · Encrypted", path: "/case-studies/mortal-vault" },
        { tx: "TX-04", name: "Sofra", status: "Phase 1 · Encrypted", path: "/case-studies/sofra" },
      ],
    },
    hodlstayWindow: { title: "hodlstay.com — TX-01", caption: "Bitcoin-native stay marketplace · client build", cta: "Inspect the case" },
    monitorWindow: { title: "system monitor", scanning: "scanning…", noCarrier: "no carrier", block: "btc block height" },
    terminalWindow: { title: "maydalabs — shell", hint: "type `help` to see what this thing can do" },
    dock: { welcome: "Read me", work: "Work", terminal: "Shell", monitor: "Monitor", services: "Services", about: "About", call: "Book a call" },
    mobile: {
      greeting: "MaydaOS",
      sub: "Software people can feel.",
      apps: [
        { label: "Work", path: "/case-studies", glyph: "grid" },
        { label: "Services", path: "/services", glyph: "layers" },
        { label: "About", path: "/about", glyph: "mark" },
        { label: "Contact", path: "/contact", glyph: "send" },
      ],
      call: "Book a project call",
    },
  },
  tr: {
    menu: [
      ["Projeler", "/case-studies"],
      ["Hizmetler", "/services"],
      ["Hakkımızda", "/about"],
    ],
    boot: [
      "MAYDAOS 26.08 — sinyal çekirdeği",
      "/work bağlanıyor ........ 4 yayın",
      "telemetri bağlantısı .... açık",
      "diller .................. en · tr · fr",
      "ses ..................... kapalı (SND ile açın)",
      "açılış tamam — hoş geldiniz",
    ],
    welcome: {
      title: "hoş geldiniz — beni oku",
      kicker: "MaydaLabs — ürün ve büyüme stüdyosu",
      hero: ["İnsanların hissedebileceği", "yazılımlar", "geliştiriyoruz."],
      body: "Uygulamalar, pazar yerleri, e-ticaret ve çevrelerindeki büyüme sistemleri. İddialı kurucular için, ajans tiyatrosu olmadan. Şu anda işletim sistemimizin içindesiniz — pencereleri sürükleyin.",
      start: "Proje başlat",
      explore: "Projeleri aç",
    },
    workWindow: {
      title: "projeler — yayınlar",
      open: "Vakayı aç",
      rows: [
        { tx: "TX-01", name: "HodlStay", status: "Müşteri projesi · Yayında", path: "/case-studies/hodlstay" },
        { tx: "TX-02", name: "Satoshi Gazette", status: "Stüdyo ürünü · Yayında", path: "/case-studies/satoshi-gazette" },
        { tx: "TX-03", name: "Mortal Vault", status: "Özel alpha · Şifreli", path: "/case-studies/mortal-vault" },
        { tx: "TX-04", name: "Sofra", status: "Faz 1 · Şifreli", path: "/case-studies/sofra" },
      ],
    },
    hodlstayWindow: { title: "hodlstay.com — TX-01", caption: "Bitcoin-native konaklama pazar yeri · müşteri projesi", cta: "Vakayı incele" },
    monitorWindow: { title: "sistem monitörü", scanning: "taranıyor…", noCarrier: "sinyal yok", block: "btc blok yüksekliği" },
    terminalWindow: { title: "maydalabs — kabuk", hint: "`help` yazarak neler yapabildiğini görün" },
    dock: { welcome: "Beni oku", work: "Projeler", terminal: "Kabuk", monitor: "Monitör", services: "Hizmetler", about: "Hakkımızda", call: "Görüşme ayarla" },
    mobile: {
      greeting: "MaydaOS",
      sub: "Hissedebileceğiniz yazılımlar.",
      apps: [
        { label: "Projeler", path: "/case-studies", glyph: "grid" },
        { label: "Hizmetler", path: "/services", glyph: "layers" },
        { label: "Hakkımızda", path: "/about", glyph: "mark" },
        { label: "İletişim", path: "/contact", glyph: "send" },
      ],
      call: "Proje görüşmesi ayarla",
    },
  },
  fr: {
    menu: [
      ["Projets", "/case-studies"],
      ["Services", "/services"],
      ["À propos", "/about"],
    ],
    boot: [
      "MAYDAOS 26.08 — noyau signal",
      "montage de /work ........ 4 transmissions",
      "lien télémétrie ......... actif",
      "langues ................. en · tr · fr",
      "son ..................... coupé (SND pour activer)",
      "démarrage terminé — bienvenue",
    ],
    welcome: {
      title: "bienvenue — lisez-moi",
      kicker: "MaydaLabs — studio produit et croissance",
      hero: ["Nous créons des logiciels", "que l’on peut", "ressentir."],
      body: "Applications, marketplaces, e-commerce et systèmes de croissance. Pour les fondateurs ambitieux, sans théâtre d’agence. Vous êtes dans notre système d’exploitation — déplacez les fenêtres.",
      start: "Lancer un projet",
      explore: "Ouvrir les projets",
    },
    workWindow: {
      title: "projets — transmissions",
      open: "Ouvrir le cas",
      rows: [
        { tx: "TX-01", name: "HodlStay", status: "Projet client · En émission", path: "/case-studies/hodlstay" },
        { tx: "TX-02", name: "Satoshi Gazette", status: "Produit studio · En émission", path: "/case-studies/satoshi-gazette" },
        { tx: "TX-03", name: "Mortal Vault", status: "Alpha privée · Chiffré", path: "/case-studies/mortal-vault" },
        { tx: "TX-04", name: "Sofra", status: "Phase 1 · Chiffré", path: "/case-studies/sofra" },
      ],
    },
    hodlstayWindow: { title: "hodlstay.com — TX-01", caption: "Marketplace de séjours Bitcoin-native · projet client", cta: "Voir le cas" },
    monitorWindow: { title: "moniteur système", scanning: "balayage…", noCarrier: "pas de signal", block: "hauteur de bloc btc" },
    terminalWindow: { title: "maydalabs — shell", hint: "tapez `help` pour voir ce que ça sait faire" },
    dock: { welcome: "Lisez-moi", work: "Projets", terminal: "Shell", monitor: "Moniteur", services: "Services", about: "À propos", call: "Réserver un appel" },
    mobile: {
      greeting: "MaydaOS",
      sub: "Du logiciel que l’on ressent.",
      apps: [
        { label: "Projets", path: "/case-studies", glyph: "grid" },
        { label: "Services", path: "/services", glyph: "layers" },
        { label: "À propos", path: "/about", glyph: "mark" },
        { label: "Contact", path: "/contact", glyph: "send" },
      ],
      call: "Réserver un appel projet",
    },
  },
} as const;

export type OsCopy = (typeof OS_COPY)[Locale];
