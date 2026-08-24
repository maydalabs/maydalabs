import type { MetadataRoute } from "next";
import { LOCALES, getLocalizedUrls, localizePath } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

const ROUTES = [
  "",
  "/about",
  "/profile",
  "/services",
  "/contact",
  "/case-studies",
  "/case-studies/hodlstay",
  "/case-studies/satoshi-gazette",
  "/case-studies/mortal-vault",
  "/case-studies/sofra",
  "/privacy",
  "/terms",
];

function absoluteUrl(path: string) {
  return new URL(path || "/", SITE_URL).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.flatMap((path) => {
    const localized = getLocalizedUrls(path || "/");
    const languages = Object.fromEntries(
      Object.entries(localized).map(([locale, href]) => [locale, absoluteUrl(href)]),
    );

    return LOCALES.map((locale) => ({
      url: absoluteUrl(localizePath(path || "/", locale)),
      lastModified,
      alternates: { languages },
    }));
  });
}
