"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import type { Locale } from "@/lib/i18n";

/* MaydaOS runs full-bleed. A marketing header above an operating system
 * breaks the thing it is trying to sell, so inside an app the site chrome
 * steps out of the way; the tour at /os keeps it. */
function isInsideOs(pathname: string): boolean {
  return /^\/(?:en|tr|fr)?\/?os\/.+/.test(pathname);
}

export function SiteChromeHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? "";
  if (isInsideOs(pathname)) return null;
  return <SiteHeader locale={locale} />;
}

export function SiteChromeFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (isInsideOs(pathname)) return null;
  return children;
}
