import Link from "next/link";
import { getIntroCallUrl } from "@/lib/marketingLinks";
import { MaydaMark } from "@/components/MaydaMark";

export function SiteFooter() {
  return (
    <footer className="studio-footer">
      <div className="studio-shell">
        <div className="grid gap-10 border-b border-white/10 pb-12 pt-14 md:grid-cols-[1.5fr_1fr_1fr] md:pt-20">
          <div>
            <Link href="/" className="group inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-white">
              <MaydaMark className="h-8 w-8" />
              <span>MaydaLabs</span>
            </Link>
            <p className="mt-5 max-w-md text-[clamp(1.45rem,2.8vw,2.8rem)] font-medium leading-[1.06] tracking-[-0.045em] text-white">
              Software with a pulse. Growth with a point.
            </p>
          </div>

          <div>
            <p className="studio-footer-label">Explore</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/60">
              <Link href="/case-studies">Selected work</Link>
              <Link href="/#services">Services</Link>
              <Link href="/#approach">Approach</Link>
              <Link href="/about">About</Link>
            </div>
          </div>

          <div>
            <p className="studio-footer-label">Start something</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/60">
              <Link href={getIntroCallUrl("footer")} target="_blank" rel="noopener noreferrer">
                Book a project call ↗
              </Link>
              <a href="mailto:info@maydalabs.com">info@maydalabs.com</a>
              <a
                href="https://www.linkedin.com/in/mehmet-e-mayda/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mehmet E Mayda on LinkedIn"
              >
                LinkedIn · Mehmet E Mayda ↗
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 py-6 text-[0.72rem] uppercase tracking-[0.15em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MaydaLabs · Istanbul / Everywhere</p>
          <div className="flex gap-5">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
