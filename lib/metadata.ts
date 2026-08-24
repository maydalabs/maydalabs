import type { Metadata } from "next";
import {
  OPEN_GRAPH_LOCALES,
  type Locale,
  getLocalizedUrls,
  localizePath,
} from "@/lib/i18n";

export type SocialCardKind =
  | "studio"
  | "services"
  | "work"
  | "hodlstay"
  | "satoshi-gazette"
  | "mortal-vault"
  | "sofra"
  | "about"
  | "contact"
  | "legal";

type PageMetadata = {
  title: string;
  socialTitle: string;
  description: string;
  path: string;
  locale: Locale;
  socialCard?: SocialCardKind;
};

export function createPageMetadata({
  title,
  socialTitle,
  description,
  path,
  locale,
  socialCard = "studio",
}: PageMetadata): Metadata {
  const canonical = localizePath(path, locale);
  const image = `/og?locale=${locale}&kind=${socialCard}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: getLocalizedUrls(path),
    },
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALES[locale],
      siteName: "MaydaLabs",
      url: canonical,
      title: socialTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}
