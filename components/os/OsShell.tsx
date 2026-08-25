"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Locale, localizePath, stripLocaleFromPath } from "@/lib/i18n";
import { OsMenuBar } from "@/components/os/OsMenuBar";
import { OsPalette } from "@/components/os/OsPalette";
import { useTelemetry } from "@/components/os/useTelemetry";

// Inner document pages render inside MaydaOS window chrome on desktop;
// on phones they behave as full-screen apps under the classic header.
export function OsShell({
  locale,
  header,
  footer,
  children,
}: {
  locale: Locale;
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const normalized = stripLocaleFromPath(pathname);
  const isDesktopHome = normalized === "/";

  if (isDesktopHome) {
    return (
      <>
        {children}
        <OsPalette locale={locale} />
      </>
    );
  }

  return (
    <div className="os-page">
      <div className="os-desktop-only">
        <OsMenuBarWithTelemetry locale={locale} />
      </div>
      <div className="os-mobile-only">{header}</div>

      <div className="os-page-window">
        <div className="os-page-bar os-desktop-only">
          <span className="os-window-lights">
            <Link href={localizePath("/", locale)} className="os-light os-light-close" aria-label="close — back to desktop" />
            <Link href={localizePath("/", locale)} className="os-light os-light-min" aria-label="minimize — back to desktop" />
            <span className="os-light os-light-max" aria-hidden="true" />
          </span>
          <span className="os-window-title">~{normalized}</span>
          <span className="os-page-bar-meta">MAYDAOS 26.08</span>
        </div>
        <div className="os-page-body">
          {children}
          {footer}
        </div>
      </div>

      <OsPalette locale={locale} />
    </div>
  );
}

function OsMenuBarWithTelemetry({ locale }: { locale: Locale }) {
  const { telemetry } = useTelemetry();
  return <OsMenuBar locale={locale} blockHeight={telemetry?.blockHeight ?? null} />;
}
