import type { Metadata } from "next";
import Link from "next/link";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata: Metadata = {
  title: "Pricing – Fixed-scope growth programs",
  description:
    "Simple, outcome-focused pricing: one-time Baseline Scan, fixed-fee Momentum Sprints, and a clear monthly Growth Loop retainer with no black-box retainers.",
};

const PRICING_INTRO_CALL_URL = getIntroCallUrl("pricing");

export default function PricingPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      {/* Header */}
      <section>
        <div className="mx-auto max-w-6xl space-y-3 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            PRICING · FIXED-SCOPE PROGRAMS
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Simple, outcome-focused pricing.
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            No black-box retainers, no surprise scope creep. Each engagement has
            a clear scope, timeline, and fee agreed before work starts.
          </p>
          <p className="max-w-3xl text-xs text-muted sm:text-sm">
            Exact numbers depend on your funnel complexity and surfaces (web,
            product, lifecycle), but the structure below is how every engagement
            is priced.
          </p>
        </div>
      </section>

      {/* Program pricing view */}
      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Baseline Scan */}
            <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/85 p-5 text-sm sm:p-6">
              <span className="inline-flex items-center rounded-full border border-border px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                Diagnostic
              </span>
              <h2 className="text-[1.15rem] font-semibold text-foreground">
                Baseline Scan
              </h2>
              <p className="text-muted">
                Fixed-fee diagnostic for teams who want clarity before committing
                to a Sprint or ongoing work.
              </p>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>One-time fee covering audit, analysis, and roadmap.</li>
                <li>
                  Includes a walkthrough call and a documented 6–12 week plan.
                </li>
                <li>
                  If you move into a Momentum Sprint, the Scan fee is credited
                  against it.
                </li>
              </ul>
              <p className="mt-3 text-[0.8rem] text-muted">
                <strong className="font-semibold text-foreground">
                  Ideal when:
                </strong>{" "}
                you know something&apos;s off but don&apos;t yet know whether a
                full Sprint makes sense.
              </p>
            </article>

            {/* Momentum Sprint */}
            <article className="flex flex-col gap-3 rounded-2xl border border-mayda-teal bg-surface-alt/80 p-5 text-sm shadow-soft sm:p-6">
              <span className="inline-flex items-center rounded-full border border-mayda-teal px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-mayda-teal">
                Flagship engagement
              </span>
              <h2 className="text-[1.15rem] font-semibold text-foreground">
                Momentum Sprint
              </h2>
              <p className="text-muted">
                6–8 week fixed-scope engagement to clean up tracking, fix the
                worst leaks, and ship high-impact changes.
              </p>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  Flat project fee based on funnel complexity and surfaces
                  touched.
                </li>
                <li>
                  Scope, deliverables, and success metrics are agreed before we
                  start.
                </li>
                <li>
                  Payment typically split: deposit at kickoff, remainder at
                  mid-point or completion.
                </li>
              </ul>
              <p className="mt-3 text-[0.8rem] text-muted">
                <strong className="font-semibold text-foreground">
                  Ideal when:
                </strong>{" "}
                you have meaningful traffic and want a focused push, not a vague
                “retainer”.
              </p>
            </article>

            {/* Growth Loop */}
            <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/85 p-5 text-sm sm:p-6">
              <span className="inline-flex items-center rounded-full border border-border px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                Ongoing growth
              </span>
              <h2 className="text-[1.15rem] font-semibold text-foreground">
                Growth Loop
              </h2>
              <p className="text-muted">
                Monthly engagement for teams who want a consistent testing and
                lifecycle cadence after a Sprint.
              </p>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  Monthly retainer tied to a clear experiment and lifecycle
                  workload.
                </li>
                <li>
                  Quarterly scope review to adjust focus as the business and data
                  change.
                </li>
                <li>
                  Easy to pause after any cycle; no long-term lock-in contracts.
                </li>
              </ul>
              <p className="mt-3 text-[0.8rem] text-muted">
                <strong className="font-semibold text-foreground">
                  Ideal when:
                </strong>{" "}
                you&apos;ve seen the impact of a Sprint and want compounding gains
                rather than one-off projects.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* How billing works */}
      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-alt/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                How billing works.
              </h2>
              <ul className="ml-4 list-disc space-y-1 text-sm text-muted">
                <li>
                  <strong className="font-semibold text-foreground">
                    No surprise retainers.
                  </strong>{" "}
                  We agree the scope, timeline, and fee before work starts.
                </li>
                <li>
                  <strong className="font-semibold text-foreground">
                    Simple structure.
                  </strong>{" "}
                  Baseline Scan is one-time; Sprints are fixed-fee; Growth Loop
                  is monthly.
                </li>
                <li>
                  <strong className="font-semibold text-foreground">
                    Payment options.
                  </strong>{" "}
                  Standard bank/card payments, with the option to pay via Bitcoin
                  for teams who prefer it.
                </li>
              </ul>
            </div>
            <div className="pt-2 sm:pt-0">
              <Link
                href="/roi-quickcheck"
                className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background/80"
              >
                Estimate your upside first
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fit check CTA */}
      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface/85 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Want actual numbers for your case?
              </h2>
              <p className="max-w-xl text-sm text-muted sm:text-[0.95rem]">
                A quick 15-minute intro call is usually enough to give you a
                realistic fee range for a Scan, Sprint, or Growth Loop.
              </p>
            </div>
            <div>
              <Link
                href={PRICING_INTRO_CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/20 px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-mayda-teal/30"
              >
                Book a 15-min Intro Call
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
