import Link from "next/link";
import { primaryCtaClasses } from "./ProgramsSection";
import { getIntroCallUrl } from "@/lib/marketingLinks";

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
      "Baseline conversion / close rate and channel mix.",
      "Stack-ranked checklist for the first 2 weeks.",
      "Approval windows ≤48h to keep velocity."
    ]
  },
  {
    id: 2,
    title: "Build fast",
    timeframe: "Weeks 1–2",
    oneLiner: "Ship visible progress in days, not months.",
    bullets: [
      "Foundation fixes first (speed, tracking, UX).",
      "Quick wins across funnel steps (add-to-cart / sign-up / booking).",
      "Weekly demo with notes + next actions."
    ]
  },
  {
    id: 3,
    title: "Prove it",
    timeframe: "Weeks 2–4",
    oneLiner: "Measure the lift, not the busywork.",
    bullets: [
      "A/B micro-tests on high-leverage steps.",
      "Tracking & attribution verified end-to-end.",
      "Weekly insights report with clear “next bets”."
    ]
  },
  {
    id: 4,
    title: "Compound",
    timeframe: "4 / 8 / 12 weeks",
    oneLiner: "Keep the growth loop running.",
    bullets: [
      "Lifecycle / nurture + paid testing cadence.",
      "Always-on CRO roadmap with monthly experiments.",
      "Quarterly strategy review to reset priorities."
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
  subheading = "Plan clearly. Ship fast. Prove what worked, then compound.",
  primaryCtaLabel = "Book a 15-min Intro Call",
  primaryCtaHref = getIntroCallUrl("programs"),
  secondaryLabel = "View programs",
  secondaryHref = "#programs"
}: HowWeWorkSectionProps) {
  const primaryIsExternal =
    primaryCtaHref.startsWith("http://") ||
    primaryCtaHref.startsWith("https://");

  return (
    <section
      id={id}
      aria-label={heading}
      className="mayda-section relative"
    >
      <div className="mx-auto flex max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mx-auto mb-4 max-w-3xl text-center">
          <p className="mayda-kicker mb-2">Delivery rhythm</p>
          <h2 className="mayda-section-title text-foreground">
            {heading}
          </h2>
          <p className="mayda-section-copy mt-3 text-sm sm:text-base">
            {subheading}
          </p>
        </header>

        {/* Desktop rail line */}
        <div className="pointer-events-none relative hidden h-0 md:block">
          <div className="pointer-events-none absolute left-0 right-0 top-6 mx-auto h-px max-w-5xl bg-border" />
        </div>

        {/* Cards grid / mobile swipe */}
        <div
          className="
            relative mt-4
            flex gap-4 overflow-x-auto pb-4
            text-sm text-foreground
            md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0
          "
          role="list"
        >
          {/* gradient edge hints only on mobile */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent md:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent md:hidden" />

          {STEPS.map((step) => (
            <article
              key={step.id}
              role="listitem"
              aria-labelledby={`${id}-t${step.id}`}
              aria-describedby={`${id}-d${step.id}`}
              className="
                relative flex min-h-[190px] flex-[0_0_82%] flex-col gap-2
                rounded-2xl border border-border bg-surface-card
                p-5 shadow-[0_18px_45px_rgba(2,6,23,0.62)] backdrop-blur
                transition-transform duration-150 ease-out
                hover:-translate-y-1 hover:border-mayda-teal/45 hover:bg-surface-card-alt/94 hover:shadow-[0_24px_64px_rgba(2,6,23,0.76)]
                md:flex-[0_0_auto] md:min-w-0
              "
            >
              {/* Step badge */}
              <span
                aria-hidden="true"
                className="absolute left-4 top-4 grid h-6 w-6 place-items-center rounded-full border border-border bg-surface-card-alt/94 text-[11px] font-semibold text-foreground"
              >
                {step.id}
              </span>

              <h3
                id={`${id}-t${step.id}`}
                className="pl-7 text-base font-semibold tracking-tight text-foreground"
              >
                {step.title}
              </h3>

              <div className="ml-7 inline-flex w-max items-center rounded-full border border-border bg-surface-card-alt/92 px-2.5 py-1 text-[11px] font-medium text-muted">
                {step.timeframe}
              </div>

              <p
                id={`${id}-d${step.id}`}
                className="mt-2 text-[13px] font-medium leading-snug text-foreground/88"
              >
                {step.oneLiner}
              </p>

              {step.bullets.length > 0 && (
                <ul className="mt-3 grid gap-1.5 text-[13px] font-medium text-muted">
                  {step.bullets.map((b) => (
                    <li key={b} className="relative pl-4">
                      <span className="absolute left-0 top-0 text-[11px] text-mayda-teal-soft">
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
              className="text-xs font-medium text-muted underline-offset-4 hover:text-mayda-teal-soft hover:underline"
            >
              {secondaryLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
