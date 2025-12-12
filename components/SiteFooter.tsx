"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryCtaClasses } from "./ProgramsSection";

type FooterLink = { label: string; href: string };
type FooterColumn = {
  title: string;
  links: FooterLink[];
};

type SocialPlatform =
  | "x"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "youtube"
  | "github";

type SocialLink = {
  platform: SocialPlatform;
  href: string;
  label?: string;
  showLabel?: boolean;
};

export interface SiteFooterProps {
  brandName?: string;
  ctaText?: string;
  ctaLabel?: string;
  ctaHref?: string;
  showCtaBand?: boolean;

  newsletterEnabled?: boolean;
  newsletterHeading?: string;
  newsletterSubheading?: string;
  newsletterNote?: string;
  newsletterButtonLabel?: string;

  columns?: FooterColumn[];

  policies?: FooterLink[];
  madeForNote?: string;

  socials?: SocialLink[];

  stickyCtaEnabled?: boolean;
  stickyCtaLabel?: string;
  stickyCtaHref?: string;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Programs",
    links: [
      { label: "Baseline Scan", href: "/programs/foundation" },
      { label: "Momentum Sprint", href: "/programs/momentum" },
      { label: "Growth Loop", href: "/programs/scale" },
      { label: "Pricing", href: "/pricing" },
      { label: "ROI quickcheck", href: "/roi" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Case studies", href: "/case-studies" },
      { label: "Playbooks", href: "/playbooks" },
      { label: "Blog", href: "/blog" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Partners", href: "/partners" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refunds" },
      { label: "Security", href: "/security" },
      { label: "DPA", href: "/dpa" },
    ],
  },
];

const DEFAULT_POLICIES: FooterLink[] = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
];

export function SiteFooter({
  brandName = "Mayda Labs",
  ctaText = "Free 15-min fit check. We’ll identify 2–3 quick wins and a clear path.",
  ctaLabel = "Book a 15-min fit check",
  ctaHref = "https://calendly.com/emayda-info/fit-check?utm_source=maydalabs&utm_medium=website&utm_campaign=footer-main",

  showCtaBand = true,

  newsletterEnabled = true,
  newsletterHeading = "Stay in the loop",
  newsletterSubheading = "Short, tactical notes on CRO, lifecycle, and growth systems.",
  newsletterNote = "No fluff, no spam. We’ll only email when there’s something useful.",
  newsletterButtonLabel = "Subscribe",

  columns = DEFAULT_COLUMNS,

  policies = DEFAULT_POLICIES,
  madeForNote = "Outcome-focused growth partner for digital brands",

  socials = [],

  stickyCtaEnabled = true,
  stickyCtaLabel = "Book a 15-min fit check",
  stickyCtaHref,
}: SiteFooterProps) {
  const pathname = usePathname();
  const [email, setEmail] = React.useState("");
  const [nlStatus, setNlStatus] =
    React.useState<"idle" | "loading" | "ok" | "err">("idle");

  const [showSticky, setShowSticky] = React.useState(false);

  React.useEffect(() => {
    if (!stickyCtaEnabled) return;
    const handler = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      setShowSticky(y > 480);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [stickyCtaEnabled]);

  const onNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setNlStatus("loading");

    // Wire this up to your real newsletter endpoint later.
    setTimeout(() => {
      setNlStatus("ok");
    }, 600);
  };

  const isInternal = (href: string) =>
    href.startsWith("/") && !href.startsWith("//");

  const isActive = (href: string) =>
    isInternal(href) &&
    pathname &&
    pathname !== "/" &&
    pathname.startsWith(href);

  const year = new Date().getFullYear();
  const stickyHref = stickyCtaHref ?? ctaHref;

  return (
    <footer className="relative border-t border-border/70 bg-surface text-muted">
      {/* Soft fade into footer */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-surface/90 via-surface/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pb-10">
        {/* CTA band */}
        {showCtaBand && (
          <div className="mb-8 flex flex-col items-start gap-4 rounded-2xl border border-border/70 bg-surface-alt/80 px-4 py-4 shadow-[0_18px_55px_rgba(2,6,23,0.95)] sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-balance text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
              {ctaText}
            </p>
            <a
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="primary"
              className={primaryCtaClasses}
            >
              {ctaLabel}
            </a>
          </div>
        )}

        <div className="border-t border-border/60 pt-6 md:pt-8">
          {/* Newsletter pill */}
          {newsletterEnabled && (
            <section
              aria-label="Email newsletter signup"
              className="mb-8 grid gap-4 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] md:items-center"
            >
              <div>
                <h3 className="text-sm font-semibold leading-snug text-foreground">
                  {newsletterHeading}
                </h3>
                <p className="mt-1 text-[0.8rem] font-medium text-muted">
                  {newsletterSubheading}
                </p>
              </div>

              <form
                onSubmit={onNewsletterSubmit}
                className="space-y-2"
                noValidate
              >
                <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface px-2 py-1 shadow-[0_14px_40px_rgba(2,6,23,0.9)] focus-within:ring-2 focus-within:ring-mayda-teal/40">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                    className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-foreground outline-none placeholder:text-muted"
                    aria-label="Email address"
                  />
                  <button
                    type="submit"
                    disabled={nlStatus === "loading"}
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wide text-surface shadow-[0_10px_28px_rgba(15,23,42,0.8)] transition hover:translate-y-[1px] hover:shadow-[0_14px_34px_rgba(15,23,42,0.9)] disabled:opacity-70"
                  >
                    {nlStatus === "loading" ? "Sending…" : newsletterButtonLabel}
                  </button>
                </div>

                <p className="text-[0.7rem] font-medium text-muted">
                  {newsletterNote}
                </p>

                <div
                  aria-live="polite"
                  className="min-h-[1rem] text-[0.7rem] font-semibold"
                >
                  {nlStatus === "ok" && (
                    <span className="text-emerald-400">
                      Thanks — check your inbox.
                    </span>
                  )}
                  {nlStatus === "err" && (
                    <span className="text-rose-400">
                      Something went wrong. Please try again.
                    </span>
                  )}
                </div>
              </form>
            </section>
          )}

          {/* Columns */}
          <section
            aria-label="Footer navigation"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {columns.map((col) => (
              <div
                key={col.title}
                className="rounded-2xl border border-border/60 bg-surface-alt/70 px-4 py-4 shadow-[0_14px_40px_rgba(2,6,23,0.9)]"
              >
                <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                  {col.title}
                </h4>
                <ul className="mt-3 space-y-1.5 text-sm font-medium">
                  {col.links.map((link) => {
                    const active = isActive(link.href);
                    const content = (
                      <>
                        <span>{link.label}</span>
                        {active && (
                          <span className="ml-1 rounded-full bg-surface/60 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-muted">
                            Current
                          </span>
                        )}
                      </>
                    );

                    return (
                      <li key={link.href}>
                        {isInternal(link.href) ? (
                          <Link
                            href={link.href}
                            className="inline-flex items-center text-muted hover:text-foreground hover:underline"
                          >
                            {content}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-muted hover:text-foreground hover:underline"
                          >
                            {content}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>

          {/* Bottom rows */}
          <div className="mt-6 border-t border-border/60 pt-4 text-[0.75rem] font-medium text-muted">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
              <span>
                © {year} {brandName}
              </span>
              <span className="opacity-60">•</span>
              <span>{madeForNote}</span>

              {policies.length > 0 && (
                <ul className="flex flex-wrap gap-3 pl-2">
                  {policies.map((p) => (
                    <li key={p.href}>
                      {isInternal(p.href) ? (
                        <Link
                          href={p.href}
                          className="border-b border-border/60 text-muted hover:text-foreground hover:border-foreground"
                        >
                          {p.label}
                        </Link>
                      ) : (
                        <a
                          href={p.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-b border-border/60 text-muted hover:text-foreground hover:border-foreground"
                        >
                          {p.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {socials.length > 0 && (
              <div className="mt-3 flex justify-center">
                <ul className="flex flex-wrap items-center gap-2">
                  {socials.map((s) => (
                    <li key={s.href}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-muted hover:bg-surface-alt/60 hover:text-foreground"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-full border border-mayda-teal/80">
                          <SocialIcon platform={s.platform} />
                        </span>
                        {s.showLabel && (
                          <span className="text-xs font-semibold">
                            {s.label ?? s.platform}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      {stickyCtaEnabled && (
        <a
          href={stickyHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(15,23,42,0.45)] transition md:hidden ${
            showSticky ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {stickyCtaLabel}
        </a>
      )}
    </footer>
  );
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case "x":
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="text-foreground"
        >
          <path
            fill="currentColor"
            d="M17.53 3H20L13.9 10.2 21 21h-6.05l-3.91-5.77L6.5 21H4l6.55-7.7L4 3h6.1l3.54 5.3L17.53 3Zm-2.12 16h1.17L8.67 5h-1.2l8 14Z"
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5Zm.02 5.5H2V21h3V9ZM21 21h-3v-6.5c0-1.9-.68-3-2.36-3-1.28 0-2.04.86-2.38 1.7-.12.3-.16.72-.16 1.15V21h-3s.04-10 0-12h3v1.7c.4-.62 1.12-1.5 2.72-1.5 1.98 0 3.48 1.3 3.48 4.08V21Z"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2.2A2.8 2.8 0 1 0 12 16.8 2.8 2.8 0 0 0 12 9.2ZM18 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M13 22V12h3l.5-3H13V7.5c0-.9.3-1.5 1.7-1.5H17V3.2c-.9-.1-2-.2-3.1-.2C11.4 3 10 4.2 10 6.8V9H7v3h3v10h3Z"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M23 12s0-3.4-.4-4.9a3 3 0 0 0-2.1-2.1C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.5.5a3 3 0 0 0-2.1 2.1C.9 8.6.9 12 .9 12s0 3.4.4 4.9a3 3 0 0 0 2.1 2.1c1.6.5 8.5.5 8.5.5s6.9 0 8.5-.5a3 3 0 0 0 2.1-2.1c.4-1.5.4-4.9.4-4.9ZM9.8 15.5v-7l6 3.5-6 3.5Z"
          />
        </svg>
      );
    case "github":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.2-1.2-1.6-1.2-1.6-1-.6.1-.6.1-.6 1.1.1 1.7 1.1 1.7 1.1 1 .1.7-.9 2.4-1.4-2.7-.3-5.6-1.3-5.6-6a4.7 4.7 0 0 1 1.3-3.3 4.4 4.4 0 0 1 .1-3.3s1-.3 3.4 1.3a11.7 11.7 0 0 1 6.2 0c2.4-1.6 3.4-1.3 3.4-1.3.5 1 .2 2.2.1 3.3a4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.9 5.7-5.6 6 .8.7 1.5 1.9 1.5 3.8v2.9c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z"
          />
        </svg>
      );
    default:
      return null;
  }
}
