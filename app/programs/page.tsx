import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Programs – Baseline Scan, Momentum Sprint, Growth Loop",
  description:
    "Three ways to work with Mayda Labs: a Baseline Scan diagnostic, a 6–8 week Momentum Sprint, and an ongoing Growth Loop for steady experiments and lifecycle work.",
};

export default function ProgramsPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      {/* Header */}
      <header>
        <div className="mx-auto max-w-6xl space-y-3 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            PROGRAMS
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Programs
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            Three ways to work together, depending on how clear your situation
            is and how fast you want to move: Baseline Scan, Momentum Sprint,
            and Growth Loop.
          </p>
          <p className="max-w-3xl text-xs text-muted sm:text-sm">
            Most teams start with a Momentum Sprint. Baseline Scan is a lighter
            diagnostic when you know something&apos;s off but aren&apos;t sure
            where to begin. Growth Loop is for teams who want a steady cadence
            of experiments and lifecycle work after the first lift.
          </p>
        </div>
      </header>

      {/* Program grid */}
      <section>
        <div className="mx-auto max-w-6xl space-y-6 lg:max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Baseline Scan */}
            <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface/85 p-5 text-sm">
              <div className="inline-flex items-center rounded-full border border-border px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                Diagnostic
              </div>
              <h2 className="text-[1.15rem] font-semibold text-foreground">
                Baseline Scan
              </h2>
              <p className="text-muted">
                One-time diagnostic for teams who want clarity first:
                what&apos;s working, what&apos;s broken, and where the biggest
                upside is hiding.
              </p>

              <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Best for
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  You have “okay” traffic but flat revenue or weak conversion.
                </li>
                <li>
                  Tracking is half-broken and you don&apos;t fully trust your
                  numbers.
                </li>
                <li>
                  You want a clear 6–12 week plan before committing to a full
                  Sprint.
                </li>
              </ul>

              <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">
                What we do
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>Audit tracking (GA4, pixels, key events) and fix basics.</li>
                <li>
                  Review key funnels and flows: homepage, product/offer pages,
                  forms, checkout or sign-up.
                </li>
                <li>
                  Map out the current lifecycle: abandon, post-purchase,
                  onboarding, win-back.
                </li>
              </ul>

              <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">
                What you leave with
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  Plain-English summary of what&apos;s holding back conversion
                  and revenue.
                </li>
                <li>
                  Prioritised 6–12 week roadmap with specific changes and tests.
                </li>
                <li>
                  A call to walk through the findings and answer questions.
                </li>
              </ul>

              <p className="mt-3 text-[0.8rem] text-muted">
                <strong className="font-semibold text-foreground">
                  Format:
                </strong>{" "}
                one-time fixed fee. If we move into a Momentum Sprint, the Scan
                fee is credited against it.
              </p>

              <Link
                href="/pricing"
                className="mt-2 text-[0.86rem] text-mayda-teal hover:underline"
              >
                See how pricing works
              </Link>
            </article>

            {/* Momentum Sprint */}
            <article className="flex flex-col gap-3 rounded-xl border border-mayda-teal bg-surface-alt/80 p-5 text-sm shadow-soft">
              <div className="inline-flex items-center rounded-full border border-mayda-teal px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-mayda-teal">
                Flagship engagement
              </div>
              <h2 className="text-[1.15rem] font-semibold text-foreground">
                Momentum Sprint
              </h2>
              <p className="text-muted">
                6–8 weeks to clean up tracking, fix the worst leaks, and ship
                changes that actually move revenue.
              </p>

              <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Best for
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  You already have meaningful traffic and a working product or
                  offer.
                </li>
                <li>
                  You&apos;re sick of small tweaks and want a focused push on
                  the highest-impact parts of the funnel.
                </li>
                <li>
                  You&apos;re ready to give access and make fast decisions for
                  6–8 weeks.
                </li>
              </ul>

              <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">
                What we do
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  Finalise tracking and baseline metrics so we&apos;re not
                  flying blind.
                </li>
                <li>
                  Ship 3–5 high-impact UX, copy, or flow changes on key pages
                  (homepage, PDP/offer, forms, checkout/sign-up).
                </li>
                <li>
                  Stand up core lifecycle flows: abandon, post-purchase,
                  win-back, or onboarding depending on your model.
                </li>
              </ul>

              <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">
                What you leave with
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  Cleaner, more reliable analytics and funnel reporting you can
                  keep using.
                </li>
                <li>
                  Shipped changes with measured impact on conversion or revenue.
                </li>
                <li>
                  A simple framework for ongoing experiments and lifecycle work.
                </li>
              </ul>

              <p className="mt-3 text-[0.8rem] text-muted">
                <strong className="font-semibold text-foreground">
                  Format:
                </strong>{" "}
                6–8 week project with a fixed scope &amp; fee, agreed up front.
                Clear success metrics; weekly updates in plain English.
              </p>

              <div className="mt-2 flex flex-wrap gap-3">
                <Link
                  href="https://calendly.com/"
                  className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/20 px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-mayda-teal/30"
                >
                  Talk about a Sprint
                </Link>
                <Link
                  href="/pricing"
                  className="text-[0.86rem] text-mayda-teal hover:underline"
                >
                  View pricing structure
                </Link>
              </div>
            </article>

            {/* Growth Loop */}
            <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface/85 p-5 text-sm">
              <div className="inline-flex items-center rounded-full border border-border px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                Ongoing growth
              </div>
              <h2 className="text-[1.15rem] font-semibold text-foreground">
                Growth Loop
              </h2>
              <p className="text-muted">
                Ongoing engagement for teams who want a steady testing and
                lifecycle cadence after the first Sprint, not one-off projects.
              </p>

              <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Best for
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  You&apos;ve seen the impact of the first changes and want to
                  keep compounding.
                </li>
                <li>
                  You don&apos;t have the bandwidth for an in-house
                  experimentation and lifecycle team.
                </li>
                <li>
                  You care more about consistent progress than massive quarterly
                  overhauls.
                </li>
              </ul>

              <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">
                What we do every month
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  Plan and run experiment cycles on priority pages and flows.
                </li>
                <li>
                  Iterate lifecycle campaigns and segmentation with AI
                  assistance where useful.
                </li>
                <li>
                  Review performance, adjust focus, and reset priorities each
                  quarter.
                </li>
              </ul>

              <h3 className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">
                What you get
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>
                  A consistent testing rhythm instead of random one-off changes.
                </li>
                <li>
                  Lifecycle that keeps up with how people actually use your
                  product or service.
                </li>
                <li>
                  Clear reporting on what&apos;s moving the needle and what&apos;s
                  noise.
                </li>
              </ul>

              <p className="mt-3 text-[0.8rem] text-muted">
                <strong className="font-semibold text-foreground">
                  Format:
                </strong>{" "}
                month-to-month engagement with a clearly defined workload. Easy
                to pause after any cycle.
              </p>

              <Link
                href="/contact"
                className="mt-2 text-[0.86rem] text-mayda-teal hover:underline"
              >
                Ask about Growth Loop
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Help choose */}
      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-alt/80 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Not sure which program fits?
              </h2>
              <p className="max-w-xl text-sm text-muted sm:text-[0.95rem]">
                A quick 15 minute fit check is usually enough to decide whether
                we start with a Scan, go straight into a Sprint, or design
                something custom.
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted">
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  We&apos;ll look at your current funnel and main channels of
                  traffic.
                </li>
                <li>
                  You&apos;ll get an honest view if we&apos;re a good match—and
                  if not, what to do instead.
                </li>
              </ul>
              <Link
                href="https://calendly.com/"
                className="mt-2 inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/20 px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-mayda-teal/30"
              >
                Book a 15&nbsp;min fit check
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
