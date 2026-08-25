"use client";

import { usePathname } from "next/navigation";
import { stripLocaleFromPath } from "@/lib/i18n";

// The home route boots MaydaOS, which brings its own chrome; classic
// header and footer only wrap the inner document pages.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (stripLocaleFromPath(pathname) === "/") return null;
  return <>{children}</>;
}
