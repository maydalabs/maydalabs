import Link from "next/link";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { MaydaMark } from "@/components/MaydaMark";
import { SITE_CHROME_COPY, type Locale, localizePath } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = SITE_CHROME_COPY[locale];

  return (
    <footer className="studio-footer">
      <div className="studio-shell">
        <div className="grid gap-10 border-b border-white/10 pb-12 pt-14 md:grid-cols-[1.5fr_1fr_1fr] md:pt-20">
          <div>
            <Link href={localizePath("/", locale)} className="group inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-white">
              <MaydaMark className="h-8 w-8" />
              <span>MaydaLabs</span>
            </Link>
            <p className="mt-5 max-w-md text-[clamp(1.45rem,2.8vw,2.8rem)] font-medium leading-[1.06] tracking-[-0.045em] text-white">
              {copy.footerStatement}
            </p>
          </div>

          <div>
            <p className="studio-footer-label">{copy.explore}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/60">
              <Link href={localizePath("/case-studies", locale)}>{copy.selectedWork}</Link>
              <Link href={localizePath("/services", locale)}>{copy.nav[1][0]}</Link>
              <Link href={localizePath("/#approach", locale)}>{copy.nav[2][0]}</Link>
              <Link href={localizePath("/about", locale)}>{copy.nav[3][0]}</Link>
            </div>
          </div>

          <div>
            <p className="studio-footer-label">{copy.startSomething}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/60">
              <Link href={getIntroCallUrl("footer")} target="_blank" rel="noopener noreferrer">
                {copy.bookCall} ↗
              </Link>
              <a href="mailto:info@maydalabs.com">info@maydalabs.com</a>
              <a
                href="https://x.com/maydalabs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MaydaLabs on X"
              >
                X · @maydalabs ↗
              </a>
              <a
                href="https://www.linkedin.com/in/mehmet-e-mayda/"
                target="_blank"
                rel="me noopener noreferrer"
                aria-label="Mehmet E Mayda on LinkedIn"
              >
                LinkedIn · Mehmet E Mayda ↗
              </a>
              <a
                href="https://github.com/maydalabs"
                target="_blank"
                rel="me noopener noreferrer"
                aria-label="MaydaLabs on GitHub"
              >
                GitHub · @maydalabs ↗
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 py-6 text-[0.72rem] uppercase tracking-[0.15em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
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
