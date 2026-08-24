import { ImageResponse } from "next/og";
import { renderSocialCard } from "@/components/SocialCard";
import { isLocale } from "@/lib/i18n";
import type { SocialCardKind } from "@/lib/metadata";

const KINDS = new Set<SocialCardKind>([
  "studio",
  "services",
  "work",
  "hodlstay",
  "satoshi-gazette",
  "mortal-vault",
  "sofra",
  "profile",
  "about",
  "contact",
  "legal",
]);

export function GET(request: Request) {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale") ?? "en";
  const kindParam = (url.searchParams.get("kind") ?? "studio") as SocialCardKind;
  const locale = isLocale(localeParam) ? localeParam : "en";
  const kind = KINDS.has(kindParam) ? kindParam : "studio";

  return new ImageResponse(renderSocialCard(locale, kind), {
    width: 1200,
    height: 630,
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
