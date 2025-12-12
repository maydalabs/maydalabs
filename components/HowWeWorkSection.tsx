import Link from "next/link";
import { primaryCtaClasses } from "./ProgramsSection";

type Step = {
  id: number;
  title: string;
  timeframe: string;
  oneLiner: string;
  bullets: string[];
};

const STEPS: Step[] = [
  {
    id: 1,
    title: "Discovery → plan",
    timeframe: "Days 0–2",
    oneLiner: "Align goals, constraints, and success metrics.",
    bullets: [
      "Baseline conversion/close rate and channel mix",
      "Stack-ranked checklist for the first 2 weeks",
      "Approval windows ≤48h to keep velocity"
    ]
  },
  {
    id: 2,
    title: "Build fast",
    timeframe: "Weeks 1–2",
    oneLiner: "Ship visible progress in days, not months.",
    bullets: [
      "Foundation fixes first (speed, tracking, UX)",
      "Quick wins across funnel steps (add-to-cart / sign-up / booking)",
      "Weekly demo with notes + next actions"
    ]
  },
  {
    id: 3,
    title: "Prove it",
    timeframe: "Weeks 2–4",
    oneLiner: "Measure the lift, not the busywork.",
    bullets: [
      "A/B micro-tests on high-leverage steps",
      "Tracking & attribution verified end-to-end",
      "Weekly insights report with “next bets”"
    ]
  },
  {
    id: 4,
    title: "Compound",
    timeframe: "4/8/12 Weeks",
    oneLiner: "Keep the growth loop running.",
    bullets: [
      "Lifecycle / nurture + paid testing cadence",
      "Always-on CRO roadmap with monthly experiments",
      "Quarterly strategy review to reset priorities"
    ]
  }
];

interface HowWeWorkSectionProps {
  id?: string;
  heading?: string;
  subheading?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string; // usually "#programs"
}

export function HowWeWorkSection({
  id = "how-we-work",
  heading = "How we work",
  subheading = "Plan clearly. Ship fast. Prove and compound.",
  primaryCtaLabel = "Book a 15-min fit check",
  primaryCtaHref = "https://calendly.com/emayda-info/fit-check?utm_source=maydalabs&utm_medium=website&utm_campaign=how-we-work",
  secondaryLabel = "See which program fits",
  secondaryHref = "#programs"
}: HowWeWorkSectionProps) {
  const primaryIsExternal =
    primaryCtaHref.startsWith("http://") ||
    primaryCtaHref.startsWith("https://");

  return (
    <section
      id={id}
      aria-label={heading}
      className="relative border-t border-slate-800 py-16 sm:py-24"
    >
      <div className="mx-auto flex max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto mb-6 max-w-3xl text-center">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Delivery rhythm
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            {subheading}
          </p>
        </header>

        {/* Desktop rail line */}
        <div className="pointer-events-none relative hidden h-0 md:block">
          <div className="pointer-events-none absolute left-0 right-0 top-8 mx-auto h-px max-w-6xl bg-slate-800/70" />
        </div>

        {/* Cards grid / mobile swipe */}
        <div
          className="
            relative mt-6
            flex gap-4 overflow-x-auto pb-4
            text-sm text-slate-50
            md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0
          "
          role="list"
        >
          {/* gradient edge hints only on mobile */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent md:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent md:hidden" />

          {STEPS.map((step) => (
            <article
              key={step.id}
              role="listitem"
              aria-labelledby={`${id}-t${step.id}`}
              aria-describedby={`${id}-d${step.id}`}
              className="
                relative flex min-h-[190px] flex-[0_0_82%] flex-col gap-2
                rounded-2xl border border-slate-800 bg-slate-950/70
                p-5 shadow-[0_18px_45px_rgba(2,6,23,0.8)] backdrop-blur
                transition-transform duration-150 ease-out
                hover:-translate-y-1 hover:border-teal-300/70 hover:shadow-[0_26px_80px_rgba(15,23,42,0.95)]
                md:flex-[0_0_auto] md:min-w-0
              "
            >
              {/* Step badge */}
              <span
                aria-hidden="true"
                className="absolute left-4 top-4 grid h-6 w-6 place-items-center rounded-full border border-slate-700 bg-slate-900/90 text-[11px] font-semibold text-slate-100"
              >
                {step.id}
              </span>

              <h3
                id={`${id}-t${step.id}`}
                className="pl-7 text-base font-semibold tracking-tight text-slate-50"
              >
                {step.title}
              </h3>

              <div className="ml-7 inline-flex w-max items-center rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                {step.timeframe}
              </div>

              <p
                id={`${id}-d${step.id}`}
                className="mt-2 text-[13px] font-medium leading-snug text-slate-200"
              >
                {step.oneLiner}
              </p>

              {step.bullets.length > 0 && (
                <ul className="mt-3 grid gap-1.5 text-[13px] font-medium text-slate-300">
                  {step.bullets.map((b) => (
                    <li key={b} className="relative pl-4">
                      <span className="absolute left-0 top-0 text-[11px] text-emerald-400">
                        ✓
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        {/* CTA row */}
        <div className="mt-10 grid place-items-center gap-3">
          {primaryIsExternal ? (
            <a
              href={primaryCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryCtaClasses + " w-full sm:w-auto"}
            >
              {primaryCtaLabel}
            </a>
          ) : (
            <Link
              href={primaryCtaHref}
              className={primaryCtaClasses + " w-full sm:w-auto"}
            >
              {primaryCtaLabel}
            </Link>
          )}

          {secondaryHref && (
            <a
              href={secondaryHref}
              className="text-xs font-medium text-slate-300 underline underline-offset-4 decoration-teal-400/80 hover:text-teal-300"
            >
              {secondaryLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
