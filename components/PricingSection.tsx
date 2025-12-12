"use client";

import Link from "next/link";
import * as React from "react";
import type { CSSProperties } from "react";
import { primaryCtaClasses } from "./ProgramsSection";

const FIT_CHECK_URL =
  "https://calendly.com/emayda-info/fit-check?utm_source=maydalabs&utm_medium=website&utm_campaign=pricing";

// Let TypeScript know about dataLayer without using `any`
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

type TierId = "momentum" | "foundation" | "scale";

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
    id: "foundation",
    name: "Baseline Scan",
    price: "$3,900",
    oneLiner: "Audit your flows, stack, and data before you touch anything.",
    bestFor:
      "Teams that want a fast, objective read on what’s slowing conversion down.",
    timeline: "2–3 weeks",
    tag: "Diagnostic + roadmap",
    bullets: [
      "Performance and UX scan across key flows (home, PDP/LP, checkout, booking).",
      "Tracking and analytics audit so numbers match reality (events, pixels, GA4).",
      "Prioritized roadmap showing where to start and what to ignore."
    ],
    outcome:
      "A clear, prioritized roadmap so you stop guessing and know where to push first.",
    proof: "Core Web Vitals green across key templates.",
    secondaryLabel: "View Baseline Scan",
    secondaryHref: "/programs#baseline-scan"
  },
  {
    id: "momentum",
    name: "Momentum Sprint",
    price: "$2,900",
    badge: "Most teams start here",
    oneLiner: "Fix conversion bottlenecks and ship measurable wins fast.",
    bestFor:
      "Teams with steady traffic but weak conversion (≈1–3%) from UX, speed, or data issues.",
    timeline: "3–4 weeks",
    tag: "CRO & UX sprint",
    bullets: [
      "Turn Baseline Scan insights into 8–12 concrete fixes across key flows.",
      "Remove friction in pricing, forms, checkout, and booking steps.",
      "Speed-tune key pages: scripts, assets, and layout shifts under control.",
      "Focused A/B tests on the highest-impact steps only."
    ],
    outcome:
      "A tested CRO playbook and a batch of measurable wins in under a month.",
    proof: "+24% add-to-cart in 30 days.",
    secondaryLabel: "View Momentum Sprint",
    secondaryHref: "/programs#momentum-sprint"
  },
  {
    id: "scale",
    name: "Growth Loop",
    price: "$3,900/mo",
    oneLiner: "Compounding growth with lifecycle, paid, and always-on CRO.",
    bestFor:
      "Teams doing ~$50k+/mo who want LTV lift and cleaner CAC, not random spikes.",
    timeline: "10–12 weeks min.",
    tag: "Ongoing growth system",
    bullets: [
      "Lifecycle flows that compound retention and revenue (abandon, onboard, win-back, VIP).",
      "2–3 clean experiments/month across pricing, pages, offers, and funnel steps.",
      "Paid social/search sprints with tight creative ↔ landing sync and attribution.",
      "Monthly CRO cadence so tests and learnings don’t stall after launch."
    ],
    outcome:
      "A 90-day growth operating system with ongoing, measurable tests and lifecycle touchpoints.",
    proof: "+9% AOV in 30 days.",
    secondaryLabel: "View Growth Loop",
    secondaryHref: "/programs#growth-loop"
  }
];

type FeatureRow = {
  label: string;
  momentum: boolean;
  foundation: boolean;
  scale: boolean;
};

const FEATURES: FeatureRow[] = [
  {
    label: "Performance pass (Core Web Vitals on key pages)",
    momentum: true,
    foundation: true,
    scale: false
  },
  {
    label: "Checkout / billing / booking configured right",
    momentum: false,
    foundation: true,
    scale: true
  },
  {
    label: "CRO/UX audit → prioritized quick-win backlog",
    momentum: true,
    foundation: true,
    scale: true
  },
  {
    label: "A/B micro-tests on high-impact steps",
    momentum: true,
    foundation: false,
    scale: true
  },
  {
    label:
      "Lifecycle baseline (abandon, onboard, post-purchase / win-back)",
    momentum: false,
    foundation: false,
    scale: true
  },
  {
    label: "Paid test sprints (creative + landing sync)",
    momentum: false,
    foundation: false,
    scale: true
  },
  {
    label:
      "Analytics verified end-to-end (GA4, pixels, CRM/ads)",
    momentum: true,
    foundation: true,
    scale: true
  },
  {
    label: "Owner docs + launch checklist",
    momentum: false,
    foundation: true,
    scale: false
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

// Same icon set as ProgramsSection (smaller, inline)
const tierIconSrc: Record<TierId, string> = {
  momentum: "/icons/momentum.svg",
  foundation: "/icons/foundation.svg",
  scale: "/icons/scale.svg"
};

function trackPricingEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!Array.isArray(window.dataLayer)) return;
  window.dataLayer.push(payload);
}

// Desktop order: Baseline – Momentum – Growth (Momentum in the middle)
const desktopTierOrder: TierId[] = ["foundation", "momentum", "scale"];

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
    <section
      id="pricing"
      aria-label="Pricing"
      className="border-t border-slate-800/70 py-16 sm:py-24"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Transparent, fixed scopes
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Simple, outcome-focused pricing.
          </h2>
          <p className="mt-3 text-balance text-sm text-slate-300 sm:text-base">
            Choose a diagnostic, a sprint, or an ongoing growth loop. Clear
            scopes, no surprise retainers.
          </p>
        </header>

        {/* Desktop / tablet grid */}
        <div className="mt-10 hidden gap-6 md:grid md:grid-cols-3">
          {desktopTierOrder.map((id) => (
            <PricingCard
              key={id}
              tier={tiersById[id]}
              isFeatured={id === "momentum"}
            />
          ))}
        </div>

        {/* Mobile swipe deck (Momentum still available, but natural order) */}
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:hidden">
          {TIERS.map((tier) => (
            <div key={tier.id} className="min-w-[85%] snap-center">
              <PricingCard tier={tier} isFeatured={tier.id === "momentum"} />
            </div>
          ))}
        </div>

        {/* Toggles */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => togglePanel("inclusions")}
            className={`inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-[12px] font-semibold text-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              openPanel === "inclusions" ? "border-teal-400/70 shadow-md" : ""
            }`}
            aria-expanded={openPanel === "inclusions"}
          >
            {openPanel === "inclusions" ? "Hide inclusions" : "See inclusions"}
          </button>
          <button
            type="button"
            onClick={() => togglePanel("addons")}
            className={`inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-[12px] font-semibold text-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              openPanel === "addons" ? "border-teal-400/70 shadow-md" : ""
            }`}
            aria-expanded={openPanel === "addons"}
          >
            {openPanel === "addons" ? "Hide add-ons" : "See add-ons"}
          </button>
        </div>

        {/* Inclusions table */}
        {openPanel === "inclusions" && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-[0_18px_45px_rgba(2,6,23,0.7)]">
            <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/80 text-[12px] font-semibold text-slate-100">
              <div className="px-3 py-2 text-left">Inclusions</div>
              <div className="px-3 py-2 text-center">Baseline Scan</div>
              <div className="px-3 py-2 text-center">Momentum Sprint</div>
              <div className="px-3 py-2 text-center">Growth Loop</div>
            </div>
            <div className="grid grid-cols-4 text-[12px] text-slate-300">
              {FEATURES.map((row) => (
                <React.Fragment key={row.label}>
                  <div className="border-t border-slate-800 bg-slate-950/80 px-3 py-2 font-medium text-slate-100">
                    {row.label}
                  </div>
                  <div className="border-t border-slate-800 px-3 py-2 text-center">
                    {row.foundation ? "✓" : "—"}
                  </div>
                  <div className="border-t border-slate-800 px-3 py-2 text-center">
                    {row.momentum ? "✓" : "—"}
                  </div>
                  <div className="border-t border-slate-800 px-3 py-2 text-center">
                    {row.scale ? "✓" : "—"}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {openPanel === "addons" && (
          <div className="mt-4">
            <h3 className="mb-3 text-center text-sm font-semibold text-slate-50">
              Add-ons
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {ADDONS.map((addon) => (
                <li
                  key={addon.title}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-[0_18px_45px_rgba(2,6,23,0.7)]"
                >
                  {addon.href ? (
                    <Link
                      href={addon.href}
                      className="flex h-full flex-col items-center justify-center gap-1 px-6 py-4 text-center text-sm font-semibold text-slate-50"
                      onClick={() =>
                        trackPricingEvent({
                          event: "addon_click",
                          addon: addon.title,
                          position: "pricing_section"
                        })
                      }
                    >
                      <span>{addon.title}</span>
                      <span className="mt-1 rounded-full bg-slate-950/80 px-3 py-1 text-[11px] font-medium text-slate-400">
                        {addon.note}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 px-6 py-4 text-center text-sm font-semibold text-slate-50">
                      <span>{addon.title}</span>
                      <span className="mt-1 rounded-full bg-slate-950/80 px-3 py-1 text-[11px] font-medium text-slate-400">
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
          <p className="text-[11px] font-medium text-slate-400">
            Prices exclude VAT. Flexible invoicing for UK/EU/US.
          </p>
          <Link
            href={FIT_CHECK_URL}
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
            Not sure where to start? Book a 15-min fit check—Free
          </Link>
        </div>
      </div>
    </section>
  );
}

function TierIcon({
  id,
  isFeatured
}: {
  id: TierId;
  isFeatured?: boolean;
}) {
  const gradient =
    id === "momentum"
      ? "from-emerald-400 via-emerald-300 to-teal-200"
      : id === "foundation"
      ? "from-sky-400 via-cyan-300 to-teal-200"
      : "from-indigo-400 via-violet-400 to-fuchsia-300";

  const src = tierIconSrc[id];

  const alt =
    id === "momentum"
      ? "Momentum program icon"
      : id === "foundation"
      ? "Foundation program icon"
      : "Scale program icon";

  const maskStyle: CSSProperties = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center"
  };

  const sizeClasses = "h-6 w-6";

  const featuredGlow =
    isFeatured && id === "momentum"
      ? "md:drop-shadow-[0_0_14px_rgba(34,211,238,0.55)]"
      : "";

  return (
    <div
      role="img"
      aria-label={alt}
      style={maskStyle}
      className={`bg-gradient-to-tr ${gradient} ${sizeClasses} ${featuredGlow}`}
    />
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
    "group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_18px_45px_rgba(2,6,23,0.7)] backdrop-blur-md transition-transform duration-150 hover:-translate-y-1 hover:border-teal-300/60 hover:shadow-[0_26px_70px_rgba(15,23,42,0.9)]";

  const featuredClasses =
    "md:scale-[1.03] md:border-teal-400/80 md:bg-slate-900/95 md:shadow-[0_26px_80px_rgba(15,23,42,0.95)]";

  return (
    <article
      aria-label={`${tier.name} pricing tier`}
      className={`${baseCardClasses} ${isFeatured ? featuredClasses : ""}`}
    >
      {/* Badge + price */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-1 items-center gap-2">
          {tier.badge && (
            <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-200">
              {tier.badge}
            </span>
          )}
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-950/90 px-3 py-1 text-[0.7rem] font-semibold text-slate-50 shadow-[0_10px_28px_rgba(15,23,42,0.8)]">
          {tier.price}
        </span>
      </div>

      {/* Icon + title inline */}
      <div className="mt-4 flex items-center justify-center gap-2 text-center">
        <TierIcon id={tier.id} isFeatured={isFeatured} />
        <h3 className="text-lg font-semibold tracking-tight text-slate-50">
          {tier.name}
        </h3>
      </div>

      {/* Copy */}
      <p className="mt-2 text-center text-sm font-medium text-slate-300">
        {tier.oneLiner}
      </p>

      <p className="mt-2 text-center text-[13px] font-medium text-slate-400">
        <span className="font-semibold">Best for:</span> {tier.bestFor}
      </p>

      {/* Chips */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
          {tier.timeline}
        </span>
        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
          {tier.tag}
        </span>
      </div>

      {/* Bullets */}
      <ul className="mt-4 space-y-2 text-sm text-slate-300">
        {tier.bullets.map((item, i) => (
          <li key={i} className="flex gap-2 text-left">
            <span className="mt-[3px] inline-block text-[11px] font-bold text-emerald-300">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* Outcome / proof */}
      <div className="mt-4 space-y-2 text-xs text-slate-400">
        <p>
          <span className="font-semibold text-slate-300">
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
          href={FIT_CHECK_URL}
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
          Book a 15-min fit check
        </Link>

        {tier.secondaryHref && tier.secondaryLabel && (
          <Link
            href={tier.secondaryHref}
            className="text-[12px] font-semibold text-slate-300 underline-offset-4 hover:text-teal-300 hover:underline"
          >
            {tier.secondaryLabel}
          </Link>
        )}
      </div>

      {/* Risk note */}
      <p className="mt-3 text-center text-[11px] font-semibold text-slate-500">
        Kickoff in 7 days or we comp your first week.
      </p>
    </article>
  );
}
