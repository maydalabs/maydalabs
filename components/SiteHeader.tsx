"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { MaydaMark } from "@/components/MaydaMark";
import { isSoundEnabled, loadSoundPreference, onSoundChange, setSoundEnabled } from "@/lib/soundSignal";
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
  const navItems = copy.nav.map(([label, href, section]) => ({ label, href, section }));
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSound(loadSoundPreference());
    return onSoundChange(setSound);
  }, []);

  useEffect(() => {
    if (normalizedPathname !== "/") {
      return;
    }

    let frame = 0;
    const updateActiveSection = () => {
      frame = 0;
      const marker = window.scrollY + window.innerHeight * 0.34;
      let current: string | null = null;

      for (const id of ["work", "services", "approach"]) {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= marker) current = id;
      }

      setActiveSection(current);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };

    frame = window.requestAnimationFrame(updateActiveSection);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [normalizedPathname]);

  const isActive = (item: (typeof navItems)[number]) => {
    if (item.href === "/case-studies" && normalizedPathname.startsWith("/case-studies")) return true;
    if (item.href === "/services" && normalizedPathname === "/services") return true;
    if (item.href === "/about" && normalizedPathname === "/about") return true;
    return normalizedPathname === "/" && item.section === activeSection;
  };

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
    <header className={`studio-header ${scrolled || open ? "is-scrolled" : ""}`}>
      <div className="studio-shell flex h-[72px] items-center justify-between gap-5">
        <Link href={localizePath("/", locale)} className="group flex items-center gap-3" aria-label={copy.homeLabel}>
          <MaydaMark className="h-8 w-8 text-white" />
          <span className="text-[0.82rem] font-bold uppercase tracking-[0.18em] text-white">
            MaydaLabs
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={copy.navigationLabel}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={localizePath(item.href, locale)}
              className={`studio-nav-link ${isActive(item) ? "is-active" : ""}`}
              aria-current={
                (item.href === "/case-studies" && normalizedPathname.startsWith("/case-studies")) ||
                (item.href === "/services" && normalizedPathname === "/services") ||
                (item.href === "/about" && normalizedPathname === "/about")
                  ? "page"
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            className={`studio-sound-toggle ${sound ? "is-on" : ""}`}
            aria-pressed={sound}
            aria-label={sound ? copy.soundOn : copy.soundOff}
            onClick={() => setSoundEnabled(!isSoundEnabled())}
          >
            SND<span aria-hidden />
          </button>
          {languageLinks("studio-language-switcher")}
          <Link
            href={getIntroCallUrl("header")}
            target="_blank"
            rel="noopener noreferrer"
            className="studio-button studio-button-small"
          >
            {copy.startProject} <span aria-hidden>↗</span>
          </Link>
        </div>

        <button
          type="button"
          className="studio-menu-button md:hidden"
          aria-label={open ? copy.closeMenu : copy.openMenu}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={open ? "translate-y-[4px] rotate-45" : ""} />
          <span className={open ? "-translate-y-[3px] -rotate-45" : ""} />
        </button>
      </div>

      {open ? (
        <nav className="studio-mobile-nav md:hidden" aria-label={copy.mobileNavigationLabel}>
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              href={localizePath(item.href, locale)}
              onClick={() => setOpen(false)}
              className={isActive(item) ? "is-active" : ""}
            >
              <span>0{index + 1}</span>
              {item.label}
            </Link>
          ))}
          <Link
            href={getIntroCallUrl("mobile_header")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="studio-button mt-3"
          >
            {copy.startProject} <span aria-hidden>↗</span>
          </Link>
          {languageLinks("studio-language-switcher studio-language-switcher-mobile")}
        </nav>
      ) : null}
    </header>
  );
}
