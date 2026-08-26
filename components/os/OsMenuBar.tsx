"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MaydaMark } from "@/components/MaydaMark";
import { LOCALES, LOCALE_LABELS, type Locale, localizePath, stripLocaleFromPath } from "@/lib/i18n";
import { isSoundEnabled, loadSoundPreference, onSoundChange, setSoundEnabled } from "@/lib/soundSignal";
import { OS_COPY } from "@/components/os/osCopy";

export function OsMenuBar({
  locale,
  blockHeight,
  onBrandClick,
  onStartProject,
}: {
  locale: Locale;
  blockHeight: number | null;
  onBrandClick?: () => void;
  onStartProject?: () => void;
}) {
  const copy = OS_COPY[locale];
  const pathname = usePathname();
  const normalized = stripLocaleFromPath(pathname);
  const [clock, setClock] = useState("");
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSound(loadSoundPreference()));
    const unsubscribe = onSoundChange(setSound);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Istanbul" }).format(new Date()),
      );
    };
    const frame = requestAnimationFrame(tick);
    const interval = setInterval(tick, 30_000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, [locale]);

  const localeSwitchHref = (nextLocale: Locale) => {
    if (nextLocale !== "en") return localizePath(normalized, nextLocale);
    return normalized === "/" ? "/en" : `/en${normalized}`;
  };

  return (
    <header className="os-menubar">
      <div className="os-menubar-left">
        {onBrandClick ? (
          <button
            type="button"
            className="os-menubar-brand group os-menu-explain"
            onClick={onBrandClick}
            aria-label="About MaydaOS"
            data-tooltip={copy.menubarHelp.brand}
          >
            <MaydaMark className="h-4 w-4 text-white" />
            <strong>MaydaOS</strong>
          </button>
        ) : (
          <Link
            href={localizePath("/", locale)}
            className="os-menubar-brand group os-menu-explain"
            aria-label="MaydaOS"
            data-tooltip={copy.menubarHelp.brand}
          >
            <MaydaMark className="h-4 w-4 text-white" />
            <strong>MaydaOS</strong>
          </Link>
        )}
        <nav className="os-menubar-nav" aria-label="MaydaOS">
          {copy.menu.map(([label, path, description]) => (
            <Link
              key={path}
              href={localizePath(path, locale)}
              className={`os-menu-explain ${normalized.startsWith(path) ? "is-active" : ""}`}
              aria-label={label}
              data-tooltip={description}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="os-menubar-right">
        <Link
          href={localizePath("/contact", locale)}
          className="os-menubar-cta os-menu-explain"
          data-tooltip={copy.menubarHelp.startProject}
          onClick={onStartProject}
        >
          {copy.menubarHelp.startProjectLabel} <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          className="os-menubar-palette os-menu-explain"
          aria-label="Command palette"
          data-tooltip={copy.menubarHelp.palette}
          onClick={() => window.dispatchEvent(new CustomEvent("os:palette"))}
        >
          ⌘K
        </button>
        <button
          type="button"
          className={`studio-sound-toggle os-menu-explain ${sound ? "is-on" : ""}`}
          aria-pressed={sound}
          aria-label="SND"
          data-tooltip={copy.menubarHelp.sound}
          onClick={() => setSoundEnabled(!isSoundEnabled())}
        >
          SND<span aria-hidden />
        </button>
        <span className="os-menubar-langs">
          {LOCALES.map((nextLocale) => (
            <Link
              key={nextLocale}
              href={localeSwitchHref(nextLocale)}
              hrefLang={nextLocale}
              lang={nextLocale}
              aria-label={LOCALE_LABELS[nextLocale]}
              aria-current={locale === nextLocale ? "true" : undefined}
              className={locale === nextLocale ? "is-active" : ""}
              title={copy.menubarHelp.language}
            >
              {nextLocale.toUpperCase()}
            </Link>
          ))}
        </span>
        <span className="os-menubar-block" title={copy.menubarHelp.block}>₿ {blockHeight ? blockHeight.toLocaleString(locale) : "———"}</span>
        <span className="os-menubar-clock">{clock || "--:--"} IST</span>
      </div>
    </header>
  );
}
