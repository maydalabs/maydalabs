export const LOCALES = ["en", "tr", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "maydalabs_locale";

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
  en: "MaydaLabs builds apps, marketplaces, commerce experiences, and growth systems for ambitious founders.",
  tr: "MaydaLabs, iddialı kurucular için uygulamalar, pazar yerleri, e-ticaret deneyimleri ve büyüme sistemleri geliştirir.",
  fr: "MaydaLabs conçoit des applications, des marketplaces, des expériences e-commerce et des systèmes de croissance pour des fondateurs ambitieux.",
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
      ["Work", "/case-studies", "work"],
      ["Services", "/services", "services"],
      ["Approach", "/#approach", "approach"],
      ["About", "/about", ""],
    ],
    startProject: "Start a project",
    soundOn: "Interface sound on",
    soundOff: "Interface sound off",
    footerStatement: "Software with a pulse. Growth with a point.",
    explore: "Explore",
    selectedWork: "Selected work",
    startSomething: "Start something",
    bookCall: "Book a project call",
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
      ["Projeler", "/case-studies", "work"],
      ["Hizmetler", "/services", "services"],
      ["Yaklaşım", "/#approach", "approach"],
      ["Hakkımızda", "/about", ""],
    ],
    startProject: "Proje başlat",
    soundOn: "Arayüz sesi açık",
    soundOff: "Arayüz sesi kapalı",
    footerStatement: "Nabzı olan yazılım. Amacı olan büyüme.",
    explore: "Keşfet",
    selectedWork: "Seçili projeler",
    startSomething: "Bir şey başlat",
    bookCall: "Proje görüşmesi ayarla",
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
      ["Projets", "/case-studies", "work"],
      ["Services", "/services", "services"],
      ["Approche", "/#approach", "approach"],
      ["À propos", "/about", ""],
    ],
    startProject: "Lancer un projet",
    soundOn: "Son de l’interface activé",
    soundOff: "Son de l’interface désactivé",
    footerStatement: "Du logiciel qui vit. Une croissance qui a du sens.",
    explore: "Explorer",
    selectedWork: "Projets sélectionnés",
    startSomething: "Démarrer quelque chose",
    bookCall: "Réserver un appel projet",
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
