"use client";

import Link from "next/link";
import * as React from "react";
import { primaryCtaClasses } from "./ProgramsSection";
import { ProgramBadgeIcon, type ProgramVisualId } from "./ProgramIcons";
import { getIntroCallUrl } from "@/lib/marketingLinks";

// Let TypeScript know about dataLayer without using `any`
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

type TierId = ProgramVisualId;

type Tier = {
  id: TierId;
  name: string;
  price: string;
  badge?: string;
  oneLiner: string;
  bestFor: string;
  timeline: string;
  tag: string;
  bullets: string[];
  outcome: string;
  proof?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

const TIERS: Tier[] = [
  {
    id: "baseline-scan",
    name: "Baseline Scan",
    price: "$3,900",
    oneLiner: "Audit your flows, stack, and data before changing anything.",
    bestFor:
      "Teams that want an objective read on what’s slowing conversion down.",
    timeline: "2–3 weeks",
    tag: "Diagnostic + roadmap",
    bullets: [
      "Performance + UX scan across key flows (home, PDP/LP, checkout, booking).",
      "Analytics + tracking verified so events, pixels, and GA4 match reality.",
      "Prioritized roadmap: what to fix first, what to ignore."
    ],
    outcome: "Leave with a clear, ranked plan instead of a vague audit.",
    proof: "Core Web Vitals green across key templates.",
    secondaryLabel: "View Baseline Scan",
    secondaryHref: "/programs#baseline-scan"
  },
  {
    id: "momentum-sprint",
    name: "Momentum Sprint",
    price: "$2,900",
    badge: "Most teams start here",
    oneLiner: "Fix conversion bottlenecks and ship measurable wins fast.",
    bestFor:
      "Brands with traffic but weak conversion (≈1–3%) from UX, speed, or data gaps.",
    timeline: "3–4 weeks",
    tag: "CRO & UX sprint",
    bullets: [
      "Turn Baseline Scan findings into 8–12 specific fixes.",
      "Remove friction in pricing, forms, checkout, and booking steps.",
      "Speed-tune key pages so they load fast and feel lighter.",
      "Run focused A/Bs on the few steps that actually move revenue."
    ],
    outcome: "Leave with a tested CRO playbook and shipped wins in <4 weeks.",
    proof: "+24% add-to-cart in 30 days.",
    secondaryLabel: "View Momentum Sprint",
    secondaryHref: "/programs#momentum-sprint"
  },
  {
    id: "growth-loop",
    name: "Growth Loop",
    price: "$3,900/mo",
    oneLiner: "Compound growth across lifecycle, paid, and CRO.",
    bestFor:
      "Teams doing ~$50k+/mo who want LTV lift and cleaner CAC, not random spikes.",
    timeline: "10–12 weeks min.",
    tag: "Ongoing growth system",
    bullets: [
      "Lifecycle flows that stack retention (abandon, onboard, win-back, VIP).",
      "2–3 structured experiments/month across offers, pages, and funnel steps.",
      "Paid social/search sprints with clean creative ↔ landing sync.",
      "Monthly CRO + analytics cadence so momentum doesn’t stall."
    ],
    outcome:
      "Leave with a 90-day growth operating rhythm, not one-off campaigns.",
    proof: "+9% AOV in 30 days.",
    secondaryLabel: "View Growth Loop",
    secondaryHref: "/programs#growth-loop"
  }
];

type FeatureRow = {
  label: string;
  momentum: boolean;
  baseline: boolean;
  growthLoop: boolean;
};

const FEATURES: FeatureRow[] = [
  {
    label: "Performance pass (Core Web Vitals on key pages)",
    momentum: true,
    baseline: true,
    growthLoop: false
  },
  {
    label: "Checkout / billing / booking configured right",
    momentum: false,
    baseline: true,
    growthLoop: true
  },
  {
    label: "CRO/UX audit → prioritized quick-win backlog",
    momentum: true,
    baseline: true,
    growthLoop: true
  },
  {
    label: "A/B micro-tests on high-impact steps",
    momentum: true,
    baseline: false,
    growthLoop: true
  },
  {
    label: "Lifecycle baseline (abandon, onboard, post-purchase / win-back)",
    momentum: false,
    baseline: false,
    growthLoop: true
  },
  {
    label: "Paid test sprints (creative + landing sync)",
    momentum: false,
    baseline: false,
    growthLoop: true
  },
  {
    label: "Analytics verified end-to-end (GA4, pixels, CRM/ads)",
    momentum: true,
    baseline: true,
    growthLoop: true
  },
  {
    label: "Owner docs + launch checklist",
    momentum: false,
    baseline: true,
    growthLoop: false
  }
];

type Addon = {
  title: string;
  note: string;
  href?: string;
};

const ADDONS: Addon[] = [
  {
    title: "Advanced Klaviyo segmentation",
    note: "$600 setup"
  },
  {
    title: "Custom component / section work",
    note: "$350–$800 each"
  }
];

function trackPricingEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!Array.isArray(window.dataLayer)) return;
  window.dataLayer.push(payload);
}

// Desktop order: Baseline Scan – Momentum Sprint – Growth Loop
const desktopTierOrder: TierId[] = [
  "baseline-scan",
  "momentum-sprint",
  "growth-loop"
];

const tiersById: Record<TierId, Tier> = TIERS.reduce((acc, tier) => {
  acc[tier.id] = tier;
  return acc;
}, {} as Record<TierId, Tier>);

export function PricingSection() {
  const [openPanel, setOpenPanel] = React.useState<
    "inclusions" | "addons" | null
  >(null);

  const togglePanel = (panel: "inclusions" | "addons") => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <section id="pricing" aria-label="Pricing" className="mayda-section">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto max-w-2xl text-center">
          <p className="mayda-kicker">Transparent, fixed scopes</p>
          <h2 className="mayda-section-title mt-3 text-foreground">
            Simple, outcome-focused pricing.
          </h2>
          <p className="mayda-section-copy mt-3 text-sm sm:text-base">
            Pick a diagnostic, a sprint, or a growth loop. Clear scopes, no
            surprise retainers.
          </p>
        </header>

        {/* Desktop / tablet grid */}
        <div className="mt-10 hidden gap-6 md:grid md:grid-cols-3">
          {desktopTierOrder.map((id) => (
            <PricingCard
              key={id}
              tier={tiersById[id]}
              isFeatured={id === "momentum-sprint"}
            />
          ))}
        </div>

        {/* Mobile swipe deck (Momentum still available, but natural order) */}
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:hidden">
          {TIERS.map((tier) => (
            <div key={tier.id} className="min-w-[85%] snap-center">
              <PricingCard
                tier={tier}
                isFeatured={tier.id === "momentum-sprint"}
              />
            </div>
          ))}
        </div>

        {/* Toggles */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => togglePanel("inclusions")}
            className={`inline-flex items-center gap-2 rounded-full border border-border bg-surface-card px-3.5 py-2 text-[12px] font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-mayda-teal/45 hover:shadow-md ${
              openPanel === "inclusions" ? "border-mayda-teal/55 shadow-md" : ""
            }`}
            aria-expanded={openPanel === "inclusions"}
          >
            {openPanel === "inclusions" ? "Hide inclusions" : "See inclusions"}
          </button>
          <button
            type="button"
            onClick={() => togglePanel("addons")}
            className={`inline-flex items-center gap-2 rounded-full border border-border bg-surface-card px-3.5 py-2 text-[12px] font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-mayda-teal/45 hover:shadow-md ${
              openPanel === "addons" ? "border-mayda-teal/55 shadow-md" : ""
            }`}
            aria-expanded={openPanel === "addons"}
          >
            {openPanel === "addons" ? "Hide add-ons" : "See add-ons"}
          </button>
        </div>

        {/* Inclusions table (collapsed by default) */}
        {openPanel === "inclusions" && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface-card shadow-[0_18px_45px_rgba(2,6,23,0.58)]">
            <div className="grid grid-cols-4 border-b border-border bg-surface-card-alt/95 text-[12px] font-semibold text-foreground">
              <div className="px-3 py-1.5 text-left">Inclusions</div>
              <div className="px-3 py-1.5 text-center">Baseline Scan</div>
              <div className="px-3 py-1.5 text-center">Momentum Sprint</div>
              <div className="px-3 py-1.5 text-center">Growth Loop</div>
            </div>
            <div className="grid grid-cols-4 text-[12px] text-muted">
              {FEATURES.map((row) => (
                <React.Fragment key={row.label}>
                  <div className="border-t border-border bg-surface-card-alt/95 px-3 py-1.5 font-medium text-foreground">
                    {row.label}
                  </div>
                  <div className="border-t border-border px-3 py-1.5 text-center">
                    {row.baseline ? "✓" : "—"}
                  </div>
                  <div className="border-t border-border px-3 py-1.5 text-center">
                    {row.momentum ? "✓" : "—"}
                  </div>
                  <div className="border-t border-border px-3 py-1.5 text-center">
                    {row.growthLoop ? "✓" : "—"}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {openPanel === "addons" && (
          <div className="mt-4">
            <h3 className="mb-3 text-center text-sm font-semibold text-foreground">
              Add-ons
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {ADDONS.map((addon) => (
                <li
                  key={addon.title}
                  className="rounded-xl border border-border bg-surface-card shadow-[0_18px_45px_rgba(2,6,23,0.52)]"
                >
                  {addon.href ? (
                    <Link
                      href={addon.href}
                      className="flex h-full flex-col items-center justify-center gap-1 px-5 py-3 text-center text-sm font-semibold text-foreground"
                      onClick={() =>
                        trackPricingEvent({
                          event: "addon_click",
                          addon: addon.title,
                          position: "pricing_section"
                        })
                      }
                    >
                      <span>{addon.title}</span>
                      <span className="mt-1 rounded-full border border-border bg-surface-card-alt/94 px-3 py-1 text-[11px] font-medium text-muted">
                        {addon.note}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 px-5 py-3 text-center text-sm font-semibold text-foreground">
                      <span>{addon.title}</span>
                      <span className="mt-1 rounded-full border border-border bg-surface-card-alt/94 px-3 py-1 text-[11px] font-medium text-muted">
                        {addon.note}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bottom note + CTA */}
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-[11px] font-medium text-muted">
            Prices exclude VAT. Flexible invoicing for UK/EU/US.
          </p>
          <Link
            href={getIntroCallUrl("pricing")}
            target="_blank"
            rel="noopener noreferrer"
            className={primaryCtaClasses}
            onClick={() =>
              trackPricingEvent({
                event: "pricing_fitcheck_click",
                position: "pricing_section"
              })
            }
          >
            Book a 15-min Intro Call
          </Link>
          <p className="mt-1 text-[11px] font-semibold text-muted/70">
            Kickoff in 7 days or we comp your first week.
          </p>
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  tier,
  isFeatured
}: {
  tier: Tier;
  isFeatured?: boolean;
}) {
  const baseCardClasses =
    "group flex h-full flex-col rounded-2xl border border-border bg-surface-card p-6 shadow-[0_18px_45px_rgba(2,6,23,0.58)] backdrop-blur-md transition-transform duration-150 hover:-translate-y-1 hover:border-mayda-teal/45 hover:bg-surface-card-alt/94 hover:shadow-[0_24px_64px_rgba(2,6,23,0.72)]";

  const featuredClasses =
    "md:scale-[1.02] md:border-mayda-teal/60 md:bg-surface-card-alt/96 md:shadow-[0_26px_74px_rgba(2,6,23,0.78)]";

  return (
    <article
      aria-label={`${tier.name} pricing tier`}
      className={`${baseCardClasses} ${isFeatured ? featuredClasses : ""}`}
    >
      {/* Badge + price */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2">
          {tier.badge && (
            <span className="inline-flex items-center rounded-full border border-border bg-surface-card-alt/94 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">
              {tier.badge}
            </span>
          )}
        </div>
        <span className="inline-flex items-center rounded-full border border-border bg-surface-card-alt/96 px-3 py-1 text-[0.7rem] font-semibold text-foreground shadow-[0_10px_28px_rgba(2,6,23,0.4)]">
          {tier.price}
        </span>
      </div>

      {/* Icon + title inline */}
      <div className="mt-4 flex items-center justify-center gap-2 text-center">
        <ProgramBadgeIcon id={tier.id} isFeatured={isFeatured} />
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {tier.name}
        </h3>
      </div>

      {/* Copy */}
      <p className="mt-2 text-center text-sm font-medium text-muted">
        {tier.oneLiner}
      </p>

      <p className="mt-2 text-center text-[13px] font-medium text-muted">
        <span className="font-semibold text-foreground/88">Best for:</span>{" "}
        {tier.bestFor}
      </p>

      {/* Chips */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center rounded-full border border-border bg-surface-card-alt/94 px-2.5 py-1 text-[11px] font-semibold text-foreground/90">
          {tier.timeline}
        </span>
        <span className="inline-flex items-center rounded-full border border-border bg-surface-card-alt/94 px-2.5 py-1 text-[11px] font-semibold text-foreground/90">
          {tier.tag}
        </span>
      </div>

      {/* Bullets */}
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {tier.bullets.map((item, i) => (
          <li key={i} className="flex gap-2 text-left">
            <span className="mt-[3px] inline-block text-[11px] font-bold text-mayda-teal-soft">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* Outcome / proof */}
      <div className="mt-4 space-y-2 text-xs text-muted">
        <p>
          <span className="font-semibold text-foreground/88">
            What you leave with:
          </span>{" "}
          {tier.outcome}
        </p>
        {tier.proof && (
          <p className="text-[11px] italic opacity-80">“{tier.proof}”</p>
        )}
      </div>

      {/* CTAs */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          href={getIntroCallUrl("pricing", { utm_term: tier.id })}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryCtaClasses + " w-full sm:w-auto"}
          onClick={() =>
            trackPricingEvent({
              event: "pricing_cta",
              tier: tier.name,
              cta: "primary",
              position: "pricing_section"
            })
          }
        >
          Book a 15-min Intro Call
        </Link>

        {tier.secondaryHref && tier.secondaryLabel && (
          <Link
            href={tier.secondaryHref}
            className="text-[12px] font-semibold text-muted underline-offset-4 hover:text-mayda-teal-soft hover:underline"
          >
            {tier.secondaryLabel}
          </Link>
        )}
      </div>
    </article>
  );
}
