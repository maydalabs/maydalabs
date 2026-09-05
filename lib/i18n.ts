export const LOCALES = ["en", "tr", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  fr: "Français",
};

export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en",
  tr: "tr",
  fr: "fr",
};

export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: "en_US",
  tr: "tr_TR",
  fr: "fr_FR",
};

export const SITE_DESCRIPTIONS: Record<Locale, string> = {
  en: "We build websites and software, automate repetitive work, and connect the systems businesses use to win and serve customers.",
  tr: "Web siteleri ve yazılım geliştiriyor, tekrar eden işleri otomatikleştiriyor, şirketlerin müşteri kazanmak ve müşterilerine hizmet vermek için kullandığı sistemleri birbirine bağlıyoruz.",
  fr: "Nous créons des sites et des logiciels, automatisons les tâches répétitives et connectons les systèmes qui aident les entreprises à acquérir et servir leurs clients.",
};

export const SITE_CHROME_COPY = {
  en: {
    homeLabel: "MaydaLabs home",
    navigationLabel: "Primary navigation",
    mobileNavigationLabel: "Mobile navigation",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    languageLabel: "Change language",
    nav: [
      ["Work", "/case-studies"],
      ["Services", "/services"],
      ["About", "/about"],
    ],
    mapCta: "Map my next move",
    pilotCta: "Tell us what you need",
    seeWork: "See the work",
    footerStatement: "Build what’s next. Make business work better.",
    explore: "Explore",
    founderProfile: "Founder profile",
    maydaOsLab: "MaydaOS Lab",
    startColumn: "Start",
    conversation: "Start a conversation",
    account: "Account",
    signIn: "Sign in",
    portal: "Your portal",
    privacy: "Privacy",
    terms: "Terms",
    location: "Istanbul / Everywhere",
  },
  tr: {
    homeLabel: "MaydaLabs ana sayfa",
    navigationLabel: "Ana navigasyon",
    mobileNavigationLabel: "Mobil navigasyon",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    languageLabel: "Dili değiştir",
    nav: [
      ["Projeler", "/case-studies"],
      ["Hizmetler", "/services"],
      ["Hakkında", "/about"],
    ],
    mapCta: "Sonraki hamlemi haritala",
    pilotCta: "İhtiyacınızı anlatın",
    seeWork: "Projeleri gör",
    footerStatement: "Sıradaki fikri hayata geçirin. İşinizi daha iyi çalıştırın.",
    explore: "Keşfet",
    founderProfile: "Kurucu profili",
    maydaOsLab: "MaydaOS Lab",
    startColumn: "Başlangıç",
    conversation: "Bir görüşme başlat",
    account: "Hesap",
    signIn: "Giriş yap",
    portal: "Portalınız",
    privacy: "Gizlilik",
    terms: "Koşullar",
    location: "İstanbul / Her yer",
  },
  fr: {
    homeLabel: "Accueil MaydaLabs",
    navigationLabel: "Navigation principale",
    mobileNavigationLabel: "Navigation mobile",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    languageLabel: "Changer de langue",
    nav: [
      ["Réalisations", "/case-studies"],
      ["Services", "/services"],
      ["À propos", "/about"],
    ],
    mapCta: "Cartographier ma prochaine étape",
    pilotCta: "Parlons de votre besoin",
    seeWork: "Voir les réalisations",
    footerStatement: "Construisez la suite. Faites mieux fonctionner votre entreprise.",
    explore: "Explorer",
    founderProfile: "Profil du fondateur",
    maydaOsLab: "MaydaOS Lab",
    startColumn: "Commencer",
    conversation: "Démarrer un échange",
    account: "Compte",
    signIn: "Se connecter",
    portal: "Votre portail",
    privacy: "Confidentialité",
    terms: "Conditions",
    location: "Istanbul / Partout",
  },
} as const;

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function stripLocaleFromPath(path: string): string {
  const match = path.match(/^\/(en|tr|fr)(?=\/|$)/);
  if (!match) return path || "/";

  const stripped = path.slice(match[0].length);
  return stripped.startsWith("/") ? stripped : stripped ? `/${stripped}` : "/";
}

export function localizePath(path: string, locale: Locale): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("mailto:") || path.startsWith("tel:")) {
    return path;
  }

  const hashIndex = path.indexOf("#");
  const queryIndex = path.indexOf("?");
  const suffixIndex = [hashIndex, queryIndex].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? path.length;
  const pathname = stripLocaleFromPath(path.slice(0, suffixIndex) || "/");
  const suffix = path.slice(suffixIndex);

  if (locale === DEFAULT_LOCALE) return `${pathname}${suffix}`;
  return `${pathname === "/" ? `/${locale}` : `/${locale}${pathname}`}${suffix}`;
}

export function getLocalizedUrls(path: string) {
  return {
    en: localizePath(path, "en"),
    tr: localizePath(path, "tr"),
    fr: localizePath(path, "fr"),
    "x-default": localizePath(path, "en"),
  };
}
