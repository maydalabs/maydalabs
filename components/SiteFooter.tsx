import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { SITE_CHROME_COPY, type Locale, localizePath } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = SITE_CHROME_COPY[locale];

  return (
    <footer className="mayda-footer">
      <div className="mayda-shell-wide">
        <div className="grid gap-10 border-b border-[color:var(--border)] pb-12 pt-14 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:pt-20">
          <div>
            <Link href={localizePath("/", locale)} aria-label={copy.homeLabel}>
              <Wordmark />
            </Link>
            <p className="mt-5 max-w-md text-[clamp(1.4rem,2.6vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
              {copy.footerStatement}
            </p>
          </div>

          <div>
            <p className="mayda-footer-label">{copy.explore}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-[color:var(--mist)]">
              {copy.nav.map(([label, href]) => (
                <Link key={href} href={localizePath(href, locale)}>
                  {label}
                </Link>
              ))}
              <Link href={localizePath("/profile", locale)}>{copy.founderProfile}</Link>
              <Link href={localizePath("/os", locale)}>{copy.maydaOsLab}</Link>
            </div>
          </div>

          <div>
            <p className="mayda-footer-label">{copy.startColumn}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-[color:var(--mist)]">
              <Link href={localizePath("/start", locale)}>{copy.mapCta} →</Link>
              <Link href={localizePath("/contact", locale)}>{copy.conversation}</Link>
              <a href="mailto:info@maydalabs.com">info@maydalabs.com</a>
            </div>
          </div>

          <div>
            <p className="mayda-footer-label">{copy.account}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-[color:var(--mist)]">
              <Link href={localizePath("/auth/sign-in", locale)}>{copy.signIn}</Link>
              <Link href={localizePath("/portal", locale)}>{copy.portal}</Link>
              <a href="https://x.com/maydalabs" target="_blank" rel="noopener noreferrer">
                X · @maydalabs ↗
              </a>
              <a
                href="https://www.linkedin.com/in/mehmet-e-mayda/"
                target="_blank"
                rel="me noopener noreferrer"
              >
                LinkedIn ↗
              </a>
              <a
                href="https://github.com/maydalabs"
                target="_blank"
                rel="me noopener noreferrer"
              >
                GitHub · @maydalabs ↗
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 py-6 text-[0.72rem] uppercase tracking-[0.15em] text-[color:var(--mist)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MaydaLabs · {copy.location}</p>
          <div className="flex gap-5">
            <Link href={localizePath("/privacy", locale)}>{copy.privacy}</Link>
            <Link href={localizePath("/terms", locale)}>{copy.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
