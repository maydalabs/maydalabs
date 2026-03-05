import type { Metadata } from "next";
import Link from "next/link";
import { primaryCtaClasses } from "@/components/ProgramsSection";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata: Metadata = {
  title: "Programs - Baseline Scan, Momentum Sprint, Growth Loop",
  description:
    "Choose the right Mayda Labs program to fix conversion leaks, clean up tracking, and ship measurable growth: Baseline Scan, Momentum Sprint, or Growth Loop.",
};

type ProgramId = "baseline-scan" | "momentum-sprint" | "growth-loop";

type ProgramOffer = {
  id: ProgramId;
  name: string;
  bestFor: string;
  outcomes: string[];
  included: string[];
  timeline: string;
  ctaHref: string;
  badge?: string;
};

const INTRO_CALL_HERO_URL = getIntroCallUrl("programs_hero");
const INTRO_CALL_PROOF_URL = getIntroCallUrl("programs_proof");
const INTRO_CALL_BOTTOM_URL = getIntroCallUrl("programs_bottom");

const BEST_FOR = [
  "Teams already getting traffic but under-converting visitors.",
  "Founders and operators who want shipped work, not long strategy decks.",
  "Brands with analytics, UX, and lifecycle gaps that are hurting revenue.",
  "Teams ready to make fast decisions and give access for execution.",
];

const NOT_FOR = [
  "Pre-product projects still looking for basic market validation.",
  "Teams asking only for advisory with no implementation support.",
  "Buyers expecting guaranteed uplift numbers before any baseline work.",
  "Organizations not ready to provide access, assets, or clear owners.",
];

const DELIVERABLES = [
  "Prioritized conversion roadmap ranked by impact and effort.",
  "Tracking sanity pass so GA4, ads, and CRM events match reality.",
  "Experiment backlog with clear hypotheses and success metrics.",
  "Shipped UX, copy, and flow improvements on high-intent pages.",
  "Lifecycle flow plan (or implementation) for key retention moments.",
  "Weekly decision log, KPI snapshots, and implementation notes.",
  "Owner handoff docs so your team can continue without guesswork.",
];

const OFFERS: ProgramOffer[] = [
  {
    id: "baseline-scan",
    name: "Baseline Scan",
    bestFor: "You need clarity before committing to heavier execution.",
    outcomes: [
      "Find the biggest conversion leaks in your current funnel.",
      "Know what to fix first and what to ignore.",
      "Leave with a 6-12 week action plan tied to outcomes.",
    ],
    included: [
      "Tracking and data quality check across key events.",
      "Flow audit on pages that drive sign-up, booking, or checkout.",
      "Lifecycle baseline review for abandon/onboarding/win-back gaps.",
      "Executive summary and walkthrough call with next steps.",
    ],
    timeline: "Typical timeline: 2-3 weeks",
    ctaHref: getIntroCallUrl("programs_baseline-scan", {
      program: "Baseline Scan",
      utm_term: "baseline-scan",
    }),
    badge: "Diagnostic",
  },
  {
    id: "momentum-sprint",
    name: "Momentum Sprint",
    bestFor: "You have traffic and want fast, measurable movement.",
    outcomes: [
      "Ship high-impact funnel fixes in weeks, not quarters.",
      "Lift conversion or close rate on core revenue paths.",
      "Build a repeatable decision loop for ongoing experiments.",
    ],
    included: [
      "Execution on the highest-leverage UX/copy/flow bottlenecks.",
      "Performance and friction fixes on priority pages.",
      "Measurement setup for pre/post change performance comparison.",
      "Weekly shipping cadence with clear owners and decisions.",
    ],
    timeline: "Typical timeline: 6-8 weeks",
    ctaHref: getIntroCallUrl("programs_momentum-sprint", {
      program: "Momentum Sprint",
      utm_term: "momentum-sprint",
    }),
    badge: "Most teams start here",
  },
  {
    id: "growth-loop",
    name: "Growth Loop",
    bestFor: "You want continuous compounding after the first lift.",
    outcomes: [
      "Maintain a steady testing cadence month over month.",
      "Improve retention and LTV through lifecycle iteration.",
      "Keep growth decisions tied to clean reporting and evidence.",
    ],
    included: [
      "Monthly experiment cycles on high-value pages and flows.",
      "Lifecycle optimization across key customer moments.",
      "Quarterly reset of priorities based on performance.",
      "Ongoing KPI reviews and documented decisions.",
    ],
    timeline: "Typical timeline: ongoing monthly cadence",
    ctaHref: getIntroCallUrl("programs_growth-loop", {
      program: "Growth Loop",
      utm_term: "growth-loop",
    }),
    badge: "Ongoing growth",
  },
];

const PROCESS_STEPS = [
  {
    step: "1",
    title: "Discovery and baseline",
    detail: "We align goals, constraints, and the first KPI targets.",
  },
  {
    step: "2",
    title: "Prioritize and ship",
    detail: "We execute the highest-leverage changes first.",
  },
  {
    step: "3",
    title: "Measure and iterate",
    detail: "We validate results and adjust based on real data.",
  },
  {
    step: "4",
    title: "Compound",
    detail: "We turn one-off wins into a repeatable growth rhythm.",
  },
];

const PROOF_POINTS = [
  { value: "+28%", label: "Core conversion lift" },
  { value: "+19%", label: "Average order value lift" },
  { value: "700k+", label: "Lifecycle emails shipped" },
  { value: "90d", label: "Typical first measurable window" },
  { value: "Weekly", label: "Shipping and reporting cadence" },
  { value: "3-5", label: "High-impact changes per sprint" },
];

const PROGRAM_FAQ = [
  {
    question: "How long until we see movement?",
    answer:
      "Most teams see early movement inside the first 2-4 weeks once priority fixes ship. Baseline Scan focuses on clarity first; Sprint and Growth Loop focus on execution speed.",
  },
  {
    question: "Do you execute or just advise?",
    answer:
      "Execution is the default. We can collaborate with your in-house team, but we do not run programs as advisory-only decks.",
  },
  {
    question: "What do you need from our side?",
    answer:
      "Access to core tools, a clear point of contact, and quick approval windows. Fast decisions are what keep momentum high.",
  },
  {
    question: "How do we choose between Scan, Sprint, and Growth Loop?",
    answer:
      "If your picture is unclear, start with Baseline Scan. If the leaks are obvious and traffic exists, start with Momentum Sprint. If you need continuous optimization, move to Growth Loop.",
  },
  {
    question: "What if results do not move?",
    answer:
      "We agree a weekly checklist and KPI framing up front. If execution slips on our side, we extend the sprint work period at no cost as outlined in our guarantee framing.",
  },
  {
    question: "Do you support BTC-friendly payments?",
    answer:
      "Yes. Standard bank/card invoicing is available, and BTC-friendly payment options can be arranged where helpful.",
  },
];

export default function ProgramsPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      <section>
        <div className="mx-auto max-w-6xl space-y-5 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            PROGRAMS
          </p>
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl">
            Turn existing traffic into measurable revenue, faster.
          </h1>
          <p className="max-w-3xl text-sm text-muted sm:text-base">
            Mayda Labs helps digital teams fix tracking, remove conversion
            friction, and ship growth systems that keep compounding.
          </p>

          <ul className="grid gap-2 text-sm text-muted sm:grid-cols-3">
            <li className="rounded-xl border border-border bg-surface/70 px-3 py-2">
              Clear scope and outcomes before work starts.
            </li>
            <li className="rounded-xl border border-border bg-surface/70 px-3 py-2">
              Weekly shipped changes and KPI visibility.
            </li>
            <li className="rounded-xl border border-border bg-surface/70 px-3 py-2">
              Start with a Scan, Sprint, or ongoing Growth Loop.
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={INTRO_CALL_HERO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryCtaClasses}
            >
              Book a 15-min Intro Call
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt/80"
            >
              See pricing
            </Link>
            <Link
              href="/roi-quickcheck"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-mayda-teal hover:underline"
            >
              Estimate ROI
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-surface/85 p-5">
              <h2 className="text-lg font-semibold text-foreground">Best for</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {BEST_FOR.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-mayda-teal" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-border bg-surface-alt/75 p-5">
              <h2 className="text-lg font-semibold text-foreground">Not for</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {NOT_FOR.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface/85 p-5 lg:max-w-7xl sm:p-6">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            What you leave with
          </h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
            {DELIVERABLES.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-mayda-teal" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-5 lg:max-w-7xl">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Choose your starting point
            </h2>
            <p className="max-w-2xl text-sm text-muted">
              Same operating style, different entry points based on your current
              clarity and speed requirements.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {OFFERS.map((offer) => {
              const featured = offer.id === "momentum-sprint";
              return (
                <article
                  id={offer.id}
                  key={offer.id}
                  className={`flex flex-col gap-3 rounded-2xl border p-5 text-sm ${
                    featured
                      ? "border-mayda-teal bg-surface-alt/85 shadow-soft"
                      : "border-border bg-surface/85"
                  }`}
                >
                  {offer.badge && (
                    <span
                      className={`inline-flex w-max items-center rounded-full px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] ${
                        featured
                          ? "border border-mayda-teal text-mayda-teal"
                          : "border border-border text-muted"
                      }`}
                    >
                      {offer.badge}
                    </span>
                  )}
                  <h3 className="text-[1.1rem] font-semibold text-foreground">
                    {offer.name}
                  </h3>
                  <p className="text-muted">{offer.bestFor}</p>

                  <div className="space-y-2">
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-muted">
                      Outcomes
                    </p>
                    <ul className="space-y-1.5 text-muted">
                      {offer.outcomes.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-mayda-teal" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-1">
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-muted">
                      What&apos;s included
                    </p>
                    <ul className="space-y-1.5 text-muted">
                      {offer.included.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-slate-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    {offer.timeline}
                  </p>

                  <div className="mt-1 flex flex-wrap gap-3">
                    <Link
                      href={offer.ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={primaryCtaClasses}
                    >
                      Book a 15-min Intro Call
                    </Link>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center text-[0.82rem] font-medium text-mayda-teal hover:underline"
                    >
                      See pricing
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface-alt/75 p-5 lg:max-w-7xl sm:p-6">
          <header className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              How we work
            </h2>
            <p className="max-w-2xl text-sm text-muted">
              The same 4-step rhythm used across all programs.
            </p>
          </header>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step) => (
              <article
                key={step.step}
                className="rounded-xl border border-border/70 bg-surface/80 p-4"
              >
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Step {step.step}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs text-muted">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <header className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Proof, not promises
            </h2>
            <p className="max-w-2xl text-sm text-muted">
              Typical outcomes from work across ecommerce, SaaS, and service
              teams.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROOF_POINTS.map((point) => (
              <article
                key={point.label}
                className="rounded-xl border border-border bg-surface/80 p-4"
              >
                <p className="text-xl font-semibold text-foreground">
                  {point.value}
                </p>
                <p className="text-xs uppercase tracking-[0.12em] text-muted">
                  {point.label}
                </p>
              </article>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href={INTRO_CALL_PROOF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryCtaClasses}
            >
              Book a 15-min Intro Call
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-surface/85 p-5 lg:max-w-7xl sm:p-6">
          <header className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Program FAQ
            </h2>
            <p className="max-w-2xl text-sm text-muted">
              Fast answers before you decide where to start.
            </p>
          </header>

          <div className="mt-4 space-y-2">
            {PROGRAM_FAQ.map((item) => (
              <details
                key={item.question}
                className="rounded-xl border border-border/70 bg-surface-alt/60 px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  {item.question}
                </summary>
                <p className="pt-2 text-sm text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="rounded-2xl border border-border bg-surface-alt/80 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                  Ready to pick the right program and start shipping?
                </h2>
                <p className="max-w-xl text-sm text-muted">
                  We&apos;ll review your current funnel, pressure-test fit, and
                  recommend the best starting point.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={INTRO_CALL_BOTTOM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={primaryCtaClasses}
                >
                  Book a 15-min Intro Call
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface/80"
                >
                  See pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
