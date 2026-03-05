import type { Metadata } from "next";
import Link from "next/link";
import { primaryCtaClasses } from "@/components/ProgramsSection";
import { getIntroCallUrl } from "@/lib/marketingLinks";

type Tier = {
  slug: "baseline-scan" | "momentum-sprint" | "growth-loop";
  name: "Baseline Scan" | "Momentum Sprint" | "Growth Loop";
  bestFor: string;
  outcomes: string[];
  includes: string[];
  timeline: string;
  programHref: string;
};

const TIERS: Tier[] = [
  {
    slug: "baseline-scan",
    name: "Baseline Scan",
    bestFor: "You need clarity before investing in bigger execution.",
    outcomes: [
      "Pinpoint the top conversion leaks in your current funnel.",
      "Get analytics and tracking aligned to reality.",
      "Leave with a ranked 6–12 week action plan."
    ],
    includes: [
      "Funnel + journey audit (web, checkout, forms, booking)",
      "Tracking pass (GA4, pixels, CRM events)",
      "Priority matrix: fix now / later / ignore",
      "Owner walkthrough call + handoff notes"
    ],
    timeline: "Typical timeline: 2–3 weeks",
    programHref: "/programs#baseline-scan"
  },
  {
    slug: "momentum-sprint",
    name: "Momentum Sprint",
    bestFor: "You already have traffic and need measurable lift fast.",
    outcomes: [
      "Ship high-impact fixes on drop-off steps.",
      "Improve conversion rate with focused experiments.",
      "Create a repeatable sprint rhythm for weekly wins."
    ],
    includes: [
      "Prioritized implementation backlog",
      "Conversion UX and speed fixes",
      "2–3 high-leverage tests on critical funnel points",
      "Weekly demo + decision log",
      "Clean attribution checks before measuring lift"
    ],
    timeline: "Typical timeline: 3–4 weeks",
    programHref: "/programs#momentum-sprint"
  },
  {
    slug: "growth-loop",
    name: "Growth Loop",
    bestFor: "You want compounding growth, not one-off projects.",
    outcomes: [
      "Improve retention and LTV through lifecycle systems.",
      "Run a stable monthly experimentation cadence.",
      "Keep paid, CRO, and measurement in one operating rhythm."
    ],
    includes: [
      "Lifecycle flow design + implementation",
      "Monthly experiment planning and execution",
      "Landing/offer iteration tied to channel performance",
      "Tracking QA and reporting cadence",
      "Quarterly priority reset with your team"
    ],
    timeline: "Typical timeline: 10–12 week minimum runway",
    programHref: "/programs#growth-loop"
  }
];

const PRICING_HERO_URL = getIntroCallUrl("pricing_hero");
const PRICING_GUARANTEE_URL = getIntroCallUrl("pricing_guarantee");
const PRICING_BOTTOM_URL = getIntroCallUrl("pricing_bottom");

export const metadata: Metadata = {
  title: "Pricing – Choose the right growth program",
  description:
    "Choose between Baseline Scan, Momentum Sprint, and Growth Loop with clear fit, scope, timelines, and next steps.",
};

export default function PricingPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            Pricing · Choose your starting point
          </p>
          <h1 className="max-w-3xl text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Pick the right program to turn traffic into measurable revenue.
          </h1>
          <p className="max-w-3xl text-sm text-muted sm:text-[0.95rem]">
            Clear scope, clear ownership, clear next steps. No vague retainer
            promises.
          </p>
          <ul className="ml-5 list-disc space-y-1 text-sm text-muted">
            <li>Implementation-first, not advisory-only decks.</li>
            <li>Tracking and attribution are validated before wins are claimed.</li>
            <li>Weekly cadence with documented decisions and priorities.</li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={PRICING_HERO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryCtaClasses}
            >
              Book a 15-min Intro Call
            </Link>
            <Link
              href="/roi-quickcheck"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt/80"
            >
              Estimate ROI first
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            How to choose quickly
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-surface/85 p-5 text-sm">
              <p className="font-semibold text-foreground">
                If you&apos;re unsure what&apos;s broken:
              </p>
              <p className="mt-1 text-muted">
                Start with <strong className="text-foreground">Baseline Scan</strong>.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-surface/85 p-5 text-sm">
              <p className="font-semibold text-foreground">
                If you have traffic but low conversion:
              </p>
              <p className="mt-1 text-muted">
                Start with <strong className="text-foreground">Momentum Sprint</strong>.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-surface/85 p-5 text-sm">
              <p className="font-semibold text-foreground">
                If you need ongoing growth execution:
              </p>
              <p className="mt-1 text-muted">
                Start with <strong className="text-foreground">Growth Loop</strong>.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Packages
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((tier) => {
              const ctaHref = getIntroCallUrl(`pricing_${tier.slug}`, {
                utm_term: tier.slug
              });

              return (
                <article
                  key={tier.slug}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/85 p-5 text-sm"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {tier.name}
                  </h3>
                  <p className="text-muted">
                    <span className="font-semibold text-foreground">
                      Best for:
                    </span>{" "}
                    {tier.bestFor}
                  </p>

                  <div>
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-muted">
                      Outcomes
                    </p>
                    <ul className="ml-4 mt-1 list-disc space-y-1 text-muted">
                      {tier.outcomes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-muted">
                      What&apos;s included
                    </p>
                    <ul className="ml-4 mt-1 list-disc space-y-1 text-muted">
                      {tier.includes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    {tier.timeline}
                  </p>

                  <div className="mt-2 flex flex-col items-start gap-2">
                    <Link
                      href={ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={primaryCtaClasses}
                    >
                      Book a 15-min Intro Call
                    </Link>
                    <Link
                      href={tier.programHref}
                      className="text-xs font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline"
                    >
                      View full program details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface/85 p-5 text-sm">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Included
              </h2>
              <ul className="ml-4 mt-3 list-disc space-y-1 text-muted">
                <li>Hands-on implementation, not just recommendations.</li>
                <li>Tracking and attribution QA before reporting wins.</li>
                <li>Structured experimentation cadence with clear owners.</li>
                <li>Weekly updates and next-step prioritization.</li>
                <li>Handoff notes so your team can maintain momentum.</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-border bg-surface/85 p-5 text-sm">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Not included
              </h2>
              <ul className="ml-4 mt-3 list-disc space-y-1 text-muted">
                <li>Running your entire ads account indefinitely.</li>
                <li>Random feature development outside agreed scope.</li>
                <li>Unlimited revisions without prioritization.</li>
                <li>“Growth theater” metrics without implementation proof.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface/85 p-5 sm:p-6 lg:max-w-7xl">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Guarantee and risk reversal
            </h2>
            <p className="max-w-3xl text-sm text-muted">
              If we miss agreed delivery items for reasons on our side, we work
              an extra week at no cost. Scope and decisions stay visible in a
              shared weekly checklist.
            </p>
            <div className="pt-1">
              <Link
                href={PRICING_GUARANTEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCtaClasses}
              >
                Book a 15-min Intro Call
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface-alt/80 p-5 text-sm text-muted lg:max-w-7xl">
          BTC-friendly payments available.
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Pricing FAQ
          </h2>
          <div className="space-y-3">
            <details className="rounded-xl border border-border bg-surface/80 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                How fast can we expect impact?
              </summary>
              <p className="mt-2 text-sm text-muted">
                Most teams see first measurable movement during Momentum Sprint
                once tracking and high-friction steps are fixed.
              </p>
            </details>
            <details className="rounded-xl border border-border bg-surface/80 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                What do you need from our side?
              </summary>
              <p className="mt-2 text-sm text-muted">
                Access to analytics/tools, one decision-maker, and reasonable
                review windows so work does not stall.
              </p>
            </details>
            <details className="rounded-xl border border-border bg-surface/80 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                What happens after we book?
              </summary>
              <p className="mt-2 text-sm text-muted">
                We run a short fit call, confirm scope and timeline, then send a
                clear plan with deliverables before kickoff.
              </p>
            </details>
            <details className="rounded-xl border border-border bg-surface/80 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                What if we&apos;re not a fit?
              </summary>
              <p className="mt-2 text-sm text-muted">
                We’ll tell you directly and share the best next step, even if
                that means not hiring us yet.
              </p>
            </details>
            <details className="rounded-xl border border-border bg-surface/80 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                Contract and cancellation?
              </summary>
              <p className="mt-2 text-sm text-muted">
                Scope is fixed per engagement. Growth Loop is reviewed cycle by
                cycle and can be paused between cycles.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface/85 p-5 sm:p-6 lg:max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Ready to choose the right starting point?
              </h2>
              <p className="text-sm text-muted">
                We&apos;ll pressure-test fit, numbers, and scope in 15 minutes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={PRICING_BOTTOM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCtaClasses}
              >
                Book a 15-min Intro Call
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt/80"
              >
                View programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
