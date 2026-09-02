"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import {
  LOCALES,
  LOCALE_LABELS,
  SITE_CHROME_COPY,
  type Locale,
  localizePath,
  stripLocaleFromPath,
} from "@/lib/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const normalizedPathname = stripLocaleFromPath(pathname);
  const copy = SITE_CHROME_COPY[locale];
  const navItems = copy.nav.map(([label, href]) => ({ label, href }));
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/case-studies"
      ? normalizedPathname.startsWith("/case-studies")
      : normalizedPathname === href;

  const localeSwitchHref = (nextLocale: Locale) => {
    if (nextLocale !== "en") return localizePath(normalizedPathname, nextLocale);
    return normalizedPathname === "/" ? "/en" : `/en${normalizedPathname}`;
  };

  const languageLinks = (className: string) => (
    <div className={className} aria-label={copy.languageLabel}>
      {LOCALES.map((nextLocale) => (
        <Link
          key={nextLocale}
          href={localeSwitchHref(nextLocale)}
          hrefLang={nextLocale}
          lang={nextLocale}
          aria-current={locale === nextLocale ? "true" : undefined}
          aria-label={LOCALE_LABELS[nextLocale]}
          onClick={() => setOpen(false)}
        >
          {nextLocale.toUpperCase()}
        </Link>
      ))}
    </div>
  );

  return (
    <header className={`mayda-header ${scrolled || open ? "is-scrolled" : ""}`}>
      <div className="mayda-shell-wide flex h-[68px] items-center justify-between gap-5">
        <Link href={localizePath("/", locale)} aria-label={copy.homeLabel}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={copy.navigationLabel}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={localizePath(item.href, locale)}
              className={`mayda-nav-link ${isActive(item.href) ? "is-active" : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {languageLinks("mayda-language-switcher")}
          <Link href={localizePath("/start", locale)} className="mayda-button mayda-button-small">
            {copy.mapCta} <span aria-hidden>→</span>
          </Link>
        </div>

        <button
          type="button"
          className="mayda-menu-button md:hidden"
          aria-label={open ? copy.closeMenu : copy.openMenu}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={open ? "translate-y-[3px] rotate-45" : ""} />
          <span className={open ? "-translate-y-[3px] -rotate-45" : ""} />
        </button>
      </div>

      {open ? (
        <nav className="mayda-mobile-nav md:hidden" aria-label={copy.mobileNavigationLabel}>
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={localizePath(item.href, locale)}
              onClick={() => setOpen(false)}
              className={isActive(item.href) ? "is-active" : ""}
            >
              <span>0{index + 1}</span>
              {item.label}
            </Link>
          ))}
          <Link
            href={localizePath("/start", locale)}
            onClick={() => setOpen(false)}
            className="mayda-button mt-4"
          >
            {copy.mapCta} <span aria-hidden>→</span>
          </Link>
          {languageLinks("mayda-language-switcher mt-4 self-start")}
        </nav>
      ) : null}
    </header>
  );
}
