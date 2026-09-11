import type { Locale } from "@/lib/i18n";

/* The signed-in surface: work waiting for a decision, the engagement, and
 * the way out. Nothing here promises a feature that does not exist. */
export const PORTAL_COPY = {
  en: {
    meta: {
      title: "Your account",
      socialTitle: "Your account · MaydaLabs",
      description: "Work waiting for your decision, and your engagement with MaydaLabs.",
    },
    heading: "Your account.",
    signedInAs: "Signed in as",
    signOut: "Sign out",
  },
  tr: {
    meta: {
      title: "Hesabınız",
      socialTitle: "Hesabınız · MaydaLabs",
      description: "Kararınızı bekleyen işler ve MaydaLabs ile çalışmanız.",
    },
    heading: "Hesabınız.",
    signedInAs: "Giriş yapan:",
    signOut: "Çıkış yap",
  },
  fr: {
    meta: {
      title: "Votre compte",
      socialTitle: "Votre compte · MaydaLabs",
      description: "Le travail qui attend votre décision, et votre mission avec MaydaLabs.",
    },
    heading: "Votre compte.",
    signedInAs: "Connecté en tant que",
    signOut: "Se déconnecter",
  },
} as const satisfies Record<Locale, unknown>;

export type PortalCopy = (typeof PORTAL_COPY)[Locale];
