"use client";

import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/95 text-muted">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-6 md:py-10">
        {/* Top CTA strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Free 15min fit check call.
            </h3>
            <p className="text-xs text-muted">
              We&apos;ll identify 2–3 quick wins in plain English.
            </p>
          </div>
          <Link
            href="https://calendly.com/"
            className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/20 px-4 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-mayda-teal/30"
          >
            Book a 15min fit check
          </Link>
        </div>

        {/* Email capture */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-4 shadow-soft sm:px-5 sm:py-5">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              Subscribe to tactical notes.
            </h4>
            <p className="text-xs text-muted">
              Short, practical emails when there&apos;s something genuinely
              useful.
            </p>
          </div>
          <form
            className="flex flex-1 flex-col gap-2 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="you@email.com"
              className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-mayda-teal/60"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-surface-alt px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-alt/80"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Link grid */}
        <div className="grid gap-4 text-xs sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-2">
            <h5 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground">
              Programs
            </h5>
            <ul className="space-y-1">
              <li>
                <Link href="/programs" className="hover:text-foreground">
                  Baseline Scan
                </Link>
              </li>
              <li>
                <Link href="/programs" className="hover:text-foreground">
                  Momentum Sprint
                </Link>
              </li>
              <li>
                <Link href="/programs" className="hover:text-foreground">
                  Growth Loop
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/roi-quickcheck" className="hover:text-foreground">
                  ROI Quickcheck
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground">
              Resources
            </h5>
            <ul className="space-y-1">
              <li>
                <Link href="/projects" className="hover:text-foreground">
                  Case studies
                </Link>
              </li>
              <li>
                <Link href="/playbooks" className="hover:text-foreground">
                  Playbooks
                </Link>
              </li>
              <li>
                <Link href="/newsletter" className="hover:text-foreground">
                  Newsletter
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground">
              Company
            </h5>
            <ul className="space-y-1">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground">
              Legal
            </h5>
            <ul className="space-y-1">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap justify-between gap-3 border-t border-border/60 pt-4 text-[0.7rem] text-muted">
          <span>
            © {year} Mayda Labs · Growth partner for digital-first brands.
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-muted" />
            Built on Next.js &amp; Vercel.
          </span>
        </div>
      </div>
    </footer>
  );
}
