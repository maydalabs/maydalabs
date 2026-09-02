import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n";

const ITEMS = [
  ["Leads", "/internal/leads"],
  ["Pilots", "/internal/pilots"],
] as const;

export function InternalNav({ locale, current }: { locale: Locale; current: string }) {
  return (
    <nav className="mayda-internal-nav" aria-label="Internal">
      {ITEMS.map(([label, href]) => (
        <Link
          key={href}
          href={localizePath(href, locale)}
          className={`mayda-nav-link ${current === href ? "is-active" : ""}`}
          aria-current={current === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
