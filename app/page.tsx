import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mayda Labs – Growth partner for digital-first brands",
  description:
    "Mayda Labs works with digital brands, SaaS, and service firms who already have traffic but need clean tracking, focused CRO sprints, and lifecycle systems to turn that traffic into revenue.",
};

export default function HomePage() {
  return (
    <div className="space-y-16 md:space-y-20">
      {/* HERO */}
      <section className="pt-2">
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Copy */}
          <div className="space-y-4">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
              GROWTH PARTNER · DIGITAL-FIRST BRANDS
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Turn underperforming traffic into meetings, clients, and revenue.
            </h1>
            <p className="text-sm text-muted sm:text-base">
              Mayda Labs works with digital brands, SaaS, and service firms who
              already have visitors—but need clean tracking, focused CRO
              sprints, and AI-assisted lifecycle systems to turn that traffic
              into revenue.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="https://calendly.com/"
                className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/20 px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-mayda-teal/30"
              >
                Book a 15min fit check
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-foreground/90 hover:bg-surface-alt"
              >
                See how Momentum Sprint works
              </Link>
            </div>

            <p className="text-xs text-muted sm:text-sm">
              Led by an operator who&apos;s built and scaled revenue systems for
              ecommerce and Bitcoin-native brands—now available as a focused
              growth partner instead of a big agency.
            </p>
          </div>

          {/* Console */}
          <div className="space-y-4">
            {/* Main console card */}
            <div className="rounded-2xl border border-border bg-surface-alt/70 p-4 shadow-soft sm:p-5">
              <div className="mb-3 flex items-center justify-between text-[0.8rem]">
                <span className="uppercase tracking-[0.16em] text-muted">
                  Revenue console
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-[2px] text-[0.7rem] font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>

              <div className="space-y-1.5 text-[0.86rem]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted">Traffic</span>
                  <span className="font-medium text-foreground">
                    42,000 sessions / mo
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted">Current conversion</span>
                  <span className="font-medium text-foreground">1.9%</span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted">Target conversion</span>
                  <span className="font-medium text-foreground">2.4%</span>
                </div>
              </div>

              <div className="my-3 border-t border-dashed border-border/60" />

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-muted">Estimated upside</span>
                <span className="text-lg font-semibold text-foreground">
                  $2,880 / month
                </span>
              </div>

              <p className="mt-3 text-[0.8rem] text-muted">
                Based on a modest lift in close rate. We&apos;ll validate this in
                your Baseline Scan.
              </p>
            </div>

            {/* Secondary console cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
                <p className="text-[0.78rem] text-muted">
                  Experiments in flight
                </p>
                <p className="mt-1 text-xl font-semibold">3</p>
                <p className="mt-1 text-[0.78rem] text-muted">
                  62% win rate last 90 days
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
                <p className="text-[0.78rem] text-muted">Key flows</p>
                <p className="mt-1 text-[0.86rem] text-foreground">
                  Checkout · onboarding · lead capture
                </p>
                <p className="mt-2 inline-flex rounded-full bg-surface-alt px-2 py-1 text-[0.7rem] text-muted">
                  Status: mixed
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
                <p className="text-[0.78rem] text-muted">Lifecycle</p>
                <p className="mt-1 text-[0.86rem] text-foreground">
                  Abandon flows, post-purchase, win-back.
                </p>
                <p className="mt-2 inline-flex rounded-full bg-mayda-teal/10 px-2 py-1 text-[0.7rem] text-mayda-teal">
                  AI-assisted testing
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ICP STRIP */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Who this is for
          </h2>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            Teams who already have traffic—but know their funnel, follow-up, and
            tracking are leaving money on the table.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm sm:p-5">
            <h3 className="text-[0.98rem] font-semibold text-foreground">
              Commerce &amp; product brands
            </h3>
            <p className="text-muted">
              DTC stores and product companies with steady traffic but 1–3%
              conversion, patchy tracking, and no real testing cadence.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm sm:p-5">
            <h3 className="text-[0.98rem] font-semibold text-foreground">
              SaaS &amp; platforms
            </h3>
            <p className="text-muted">
              Apps where the leaks live between sign-up, activation, and
              upgrade—across the website, in-product, and lifecycle.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm sm:p-5">
            <h3 className="text-[0.98rem] font-semibold text-foreground">
              Service firms &amp; practices
            </h3>
            <p className="text-muted">
              Agencies, studios, and law firms whose website and funnels should
              be feeding more qualified consultations instead of just looking
              “nice”.
            </p>
          </div>
        </div>
      </section>

      {/* PROGRAMS TEASER */}
      <section className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Pick your starting point.
          </h2>
          <p className="text-sm text-muted sm:text-[0.95rem]">
            Most teams start with a Momentum Sprint. Baseline Scan is a lighter
            on-ramp when you know something&apos;s off but aren&apos;t sure
            where to begin. Growth Loop keeps the wins compounding once the
            basics are fixed.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Baseline Scan */}
          <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 text-sm">
            <div className="inline-flex items-center rounded-full border border-border px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-muted">
              Diagnostic
            </div>
            <h3 className="text-[1.05rem] font-semibold text-foreground">
              Baseline Scan
            </h3>
            <p className="text-muted">
              For teams who want clarity first: what&apos;s working, what&apos;s
              broken, and where the biggest upside is hiding.
            </p>
            <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
              <li>Deep review of tracking, funnels, and key flows.</li>
              <li>Plain-English report on where you&apos;re leaking revenue.</li>
              <li>Prioritised 6–12 week growth roadmap you can execute.</li>
            </ul>
            <p className="text-[0.8rem] text-muted">
              One-time fixed fee. Credited against a Momentum Sprint if we keep
              working together.
            </p>
            <Link
              href="/programs"
              className="text-[0.86rem] text-mayda-teal hover:underline"
            >
              Learn more
            </Link>
          </article>

          {/* Momentum Sprint */}
          <article className="flex flex-col gap-3 rounded-xl border border-mayda-teal bg-surface-alt/70 p-5 text-sm shadow-soft">
            <div className="inline-flex items-center rounded-full border border-mayda-teal px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-mayda-teal">
              Flagship engagement
            </div>
            <h3 className="text-[1.05rem] font-semibold text-foreground">
              Momentum Sprint
            </h3>
            <p className="text-muted">
              6–8 weeks to clean up tracking, fix the worst leaks, and ship
              changes that actually move revenue.
            </p>
            <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
              <li>Clean tracking and a reliable baseline for your funnel.</li>
              <li>3–5 high-impact UX, copy, or flow changes shipped.</li>
              <li>
                Core lifecycle flows live (abandon, post-purchase, win-back,
                etc.).
              </li>
            </ul>
            <p className="text-[0.8rem] text-muted">
              Duration: 6–8 weeks. Fixed scope &amp; fee, clear success metrics
              agreed up front.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="https://calendly.com/"
                className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/20 px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-mayda-teal/30"
              >
                Talk about a Sprint
              </Link>
              <Link
                href="/programs"
                className="text-[0.86rem] text-mayda-teal hover:underline"
              >
                See full breakdown
              </Link>
            </div>
          </article>

          {/* Growth Loop */}
          <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 text-sm">
            <div className="inline-flex items-center rounded-full border border-border px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-muted">
              Ongoing growth
            </div>
            <h3 className="text-[1.05rem] font-semibold text-foreground">
              Growth Loop
            </h3>
            <p className="text-muted">
              For teams who want a steady testing and lifecycle cadence after
              the first Sprint, not one-off projects.
            </p>
            <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
              <li>Monthly experiment cycles on key pages and flows.</li>
              <li>AI-assisted lifecycle campaigns and segmentation.</li>
              <li>Monthly report plus quarterly reset on priorities.</li>
            </ul>
            <p className="text-[0.8rem] text-muted">
              Duration: 3+ months. Monthly engagement with a clear workload and
              room to pause after each cycle.
            </p>
            <Link
              href="/programs"
              className="text-[0.86rem] text-mayda-teal hover:underline"
            >
              Learn more
            </Link>
          </article>
        </div>
      </section>

      {/* ROI QUICKCHECK TEASER */}
      <section>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-alt/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Sanity-check your upside before you change anything.
            </h2>
            <p className="text-sm text-muted sm:text-[0.95rem]">
              Use the Advanced ROI Quickcheck to plug in your AOV, sessions, and
              conversion rate and see what a small lift could mean in real
              revenue.
            </p>
            <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
              <li>
                Inputs: AOV, monthly sessions, current conversion rate, and a
                target lift or scenario.
              </li>
              <li>
                Outputs: extra revenue per month and per year, plus a simple
                payback window.
              </li>
              <li>
                Suggestion on where to start: Baseline Scan, Momentum Sprint, or
                Growth Loop.
              </li>
            </ul>
          </div>
          <div className="shrink-0">
            <Link
              href="/roi-quickcheck"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-foreground/90 hover:bg-surface"
            >
              Open ROI Quickcheck
            </Link>
          </div>
        </div>
      </section>

      {/* CASE SPOTLIGHT */}
      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            What this looks like in practice.
          </h2>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            A few recent projects across eCommerce, SaaS, and services. Full
            case studies will live here.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="space-y-2 rounded-xl border border-border bg-surface p-5 text-sm">
            <p className="text-[0.78rem] uppercase tracking-[0.14em] text-muted">
              Ecommerce brand
            </p>
            <h3 className="text-[1.05rem] font-semibold text-foreground">
              From stalled traffic to reliable revenue.
            </h3>
            <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
              <li>+28% conversion rate on key funnels.</li>
              <li>+19% average order value.</li>
              <li>$84k extra revenue in 90 days.</li>
            </ul>
          </article>
          <article className="space-y-2 rounded-xl border border-border bg-surface p-5 text-sm">
            <p className="text-[0.78rem] uppercase tracking-[0.14em] text-muted">
              SaaS platform
            </p>
            <h3 className="text-[1.05rem] font-semibold text-foreground">
              Activation and upgrade actually working together.
            </h3>
            <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
              <li>+17% trial-to-activated users.</li>
              <li>+11% upgrade rate within 30 days.</li>
              <li>Lifecycle flows built on clean events.</li>
            </ul>
          </article>
        </div>

        <div className="pt-1">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-foreground/90 hover:bg-surface"
          >
            View all projects
          </Link>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            How we work together.
          </h2>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            Clear phases, fast feedback, and no black-box retainers.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <article className="space-y-2 rounded-xl border border-border bg-surface p-5 text-sm">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mayda-teal/10 text-[0.8rem] font-medium text-mayda-teal">
              1
            </span>
            <h3 className="text-[1rem] font-semibold text-foreground">
              Baseline → plan
            </h3>
            <p className="text-muted">
              Align on goals, constraints, and success metrics. Audit funnels,
              flows, and tracking. Define the prioritized plan.
            </p>
          </article>
          <article className="space-y-2 rounded-xl border border-border bg-surface p-5 text-sm">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mayda-teal/10 text-[0.8rem] font-medium text-mayda-teal">
              2
            </span>
            <h3 className="text-[1rem] font-semibold text-foreground">
              Build fast
            </h3>
            <p className="text-muted">
              Fix tracking and analytics. Ship UX, copy, and flow changes that
              clear obvious friction—especially on mobile.
            </p>
          </article>
          <article className="space-y-2 rounded-xl border border-border bg-surface p-5 text-sm">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mayda-teal/10 text-[0.8rem] font-medium text-mayda-teal">
              3
            </span>
            <h3 className="text-[1rem] font-semibold text-foreground">
              Prove it
            </h3>
            <p className="text-muted">
              Run structured tests on key steps. Keep what wins, kill what
              doesn&apos;t. Weekly updates in plain English.
            </p>
          </article>
          <article className="space-y-2 rounded-xl border border-border bg-surface p-5 text-sm">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mayda-teal/10 text-[0.8rem] font-medium text-mayda-teal">
              4
            </span>
            <h3 className="text-[1rem] font-semibold text-foreground">
              Compound
            </h3>
            <p className="text-muted">
              Decide whether to pause, repeat a Sprint, or move into the Growth
              Loop for ongoing experiments and lifecycle work.
            </p>
          </article>
        </div>
      </section>

      {/* FAQ TEASER */}
      <section>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-alt/70 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Common questions.
            </h2>
            <p className="max-w-xl text-sm text-muted sm:text-[0.95rem]">
              Full FAQ coming later. For now, a few quick answers to how this
              works.
            </p>
          </div>
          <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted sm:ml-8">
            <li>What if we don&apos;t see results?</li>
            <li>Do you work with Shopify, SaaS, and service firms?</li>
            <li>What access do you need?</li>
            <li>Can we pay in Bitcoin?</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
