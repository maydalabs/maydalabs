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
      {/* HERO – full-height on desktop, no section bg */}
      <section className="pt-2 md:pt-4">
        <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl flex-col gap-10 lg:max-w-7xl lg:flex-row lg:items-center">
          {/* Copy */}
          <div className="flex-1 space-y-6">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
              GROWTH PARTNER · DIGITAL-FIRST BRANDS
            </p>
            <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Turn underperforming traffic into meetings, clients, and revenue.
            </h1>
            <p className="max-w-xl text-sm text-muted sm:text-base">
              Mayda Labs works with digital brands, SaaS, and service firms who
              already have visitors—but need clean tracking, focused CRO
              sprints, and AI-assisted lifecycle systems to turn that traffic
              into revenue.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="https://calendly.com/"
                className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/20 px-5 py-2.5 text-sm font-medium text-foreground shadow-soft hover:bg-mayda-teal/30"
              >
                Book a 15min fit check
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface/70 px-5 py-2.5 text-sm text-foreground/90 hover:bg-surface-alt"
              >
                See how Momentum Sprint works
              </Link>
            </div>

            {/* Metric pills */}
            <div className="flex flex-wrap gap-2 pt-2 text-[0.78rem]">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1">
                <span className="font-mono text-[0.78rem] font-semibold text-emerald-300">
                  +28%
                </span>
                <span className="text-muted">checkout conversion</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1">
                <span className="font-mono text-[0.78rem] font-semibold text-emerald-300">
                  +19%
                </span>
                <span className="text-muted">average order value</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1">
                <span className="font-mono text-[0.78rem] font-semibold text-mayda-teal">
                  700k+
                </span>
                <span className="text-muted">lifecycle emails shipped</span>
              </div>
            </div>

            <p className="max-w-xl text-xs text-muted sm:text-sm">
              Led by an operator who&apos;s built and scaled revenue systems for
              ecommerce and Bitcoin-native brands—now available as a focused
              growth partner instead of a big agency.
            </p>
          </div>

          {/* Console phone – local card styling only */}
          <div className="flex-1">
            <div className="relative mx-auto max-w-xs sm:max-w-sm">
              {/* Phone frame */}
              <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-950/80 p-3 shadow-[0_28px_90px_rgba(0,0,0,0.8)]">
                <div className="rounded-[1.9rem] border border-slate-700/60 bg-slate-950 px-3 pb-4 pt-3">
                  {/* Status + app bar */}
                  <div className="mb-2 flex items-center justify-between text-[0.62rem] text-slate-300">
                    <span className="font-semibold">9:41</span>
                    <div className="flex items-center gap-1">
                      <span className="h-[10px] w-[14px] rounded-[5px] border border-slate-400/70" />
                      <span className="h-[8px] w-[18px] rounded-[3px] border border-slate-400/80">
                        <span className="block h-full w-[70%] rounded-[2px] bg-slate-200" />
                      </span>
                    </div>
                  </div>
                  <div className="mb-3 flex items-center justify-between text-[0.7rem]">
                    <span className="font-semibold text-slate-100">
                      Analytics
                    </span>
                    <div className="inline-flex gap-1 rounded-full bg-slate-900/80 p-1">
                      <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[0.62rem] font-semibold text-slate-900">
                        7d
                      </span>
                      <span className="rounded-full px-2 py-[2px] text-[0.62rem] text-slate-400">
                        30d
                      </span>
                      <span className="rounded-full px-2 py-[2px] text-[0.62rem] text-slate-400">
                        90d
                      </span>
                    </div>
                  </div>

                  {/* Screen grid */}
                  <div className="space-y-2.5">
                    {/* Net sales */}
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                      <div className="mb-1 flex items-center justify-between text-[0.6rem] text-slate-400">
                        <span className="font-semibold uppercase tracking-[0.12em]">
                          Net sales
                        </span>
                        <span className="rounded-full bg-emerald-500/10 px-1.5 py-[1px] text-[0.6rem] font-semibold text-emerald-300">
                          +5%
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-lg font-semibold text-slate-50">
                          1,259,157
                        </span>
                        <span className="h-9 w-24 rounded-xl bg-[linear-gradient(to_top,_rgba(56,189,248,0.15),_transparent_60%),linear-gradient(to_right,_rgba(148,163,184,0.15)_1px,_transparent_1px)] bg-[length:100%_100%,8px_100%]" />
                      </div>
                    </div>

                    {/* Middle row: donut + CR */}
                    <div className="grid grid-cols-[1.1fr_0.9fr] gap-2.5">
                      {/* Donut */}
                      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                        <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Sessions by device
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-16 w-16">
                            <div className="h-full w-full rounded-full bg-[conic-gradient(#60a4ba_0deg_150deg,#6366f1_150deg_250deg,#22c55e_250deg_300deg,#0f172a_300deg_360deg)]" />
                            <div className="absolute inset-[22%] rounded-full bg-slate-950" />
                            <div className="absolute inset-[28%] flex flex-col items-center justify-center text-[0.6rem]">
                              <span className="font-semibold text-slate-50">
                                40k
                              </span>
                              <span className="text-[0.58rem] text-emerald-300">
                                +8%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1 text-[0.6rem] text-slate-300">
                            <div className="flex items-center justify-between gap-2">
                              <span>Mobile</span>
                              <span className="font-mono text-[0.58rem] text-slate-400">
                                40%
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span>Desktop</span>
                              <span className="font-mono text-[0.58rem] text-slate-400">
                                34%
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span>Tablet + other</span>
                              <span className="font-mono text-[0.58rem] text-slate-400">
                                26%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conversion rate */}
                      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                        <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Conversion rate
                        </div>
                        <div className="mb-2 flex items-end justify-between gap-2">
                          <span className="text-xl font-semibold text-slate-50">
                            5.13%
                          </span>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[0.6rem] font-semibold text-emerald-300">
                            +0.9%
                          </span>
                        </div>
                        <div className="h-[34px] w-full rounded-lg bg-[linear-gradient(to_top,_rgba(94,234,212,0.2),_transparent_65%),linear-gradient(to_right,_rgba(148,163,184,0.15)_1px,_transparent_1px)] bg-[length:100%_100%,10px_100%]" />
                      </div>
                    </div>

                    {/* Bottom row: channels + funnel */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                        <div className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Top channels
                        </div>
                        <div className="space-y-1.5 text-[0.6rem] text-slate-300">
                          <div className="flex items-center justify-between gap-2">
                            <span>Organic</span>
                            <span className="font-mono text-[0.58rem] text-slate-400">
                              38%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Paid social</span>
                            <span className="font-mono text-[0.58rem] text-slate-400">
                              24%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Email</span>
                            <span className="font-mono text-[0.58rem] text-slate-400">
                              18%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-3">
                        <div className="mb-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Funnel
                        </div>
                        <div className="space-y-1.5 text-[0.6rem] text-slate-300">
                          <div className="flex items-center justify-between gap-2">
                            <span>Viewed</span>
                            <span className="font-mono text-[0.58rem] text-slate-400">
                              100%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Added to cart</span>
                            <span className="font-mono text-[0.58rem] text-slate-400">
                              36%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Checkout</span>
                            <span className="font-mono text-[0.58rem] text-slate-400">
                              22%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Purchased</span>
                            <span className="font-mono text-[0.58rem] text-slate-400">
                              8%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle floor glow (local to phone) */}
              <div className="pointer-events-none absolute inset-x-4 bottom-[-18px] -z-10 h-10 rounded-full bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.9),_transparent_70%)] blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Who this is for
            </h2>
            <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
              Teams who already have traffic—but know their funnel, follow-up,
              and tracking are leaving money on the table.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="space-y-2 rounded-xl border border-border bg-surface/80 p-4 text-sm sm:p-5">
              <h3 className="text-[0.98rem] font-semibold text-foreground">
                Commerce &amp; product brands
              </h3>
              <p className="text-muted">
                DTC stores and product companies with steady traffic but 1–3%
                conversion, patchy tracking, and no real testing cadence.
              </p>
            </article>
            <article className="space-y-2 rounded-xl border border-border bg-surface/80 p-4 text-sm sm:p-5">
              <h3 className="text-[0.98rem] font-semibold text-foreground">
                SaaS &amp; platforms
              </h3>
              <p className="text-muted">
                Apps where the leaks live between sign-up, activation, and
                upgrade—across the website, in-product, and lifecycle.
              </p>
            </article>
            <article className="space-y-2 rounded-xl border border-border bg-surface/80 p-4 text-sm sm:p-5">
              <h3 className="text-[0.98rem] font-semibold text-foreground">
                Service firms &amp; practices
              </h3>
              <p className="text-muted">
                Agencies, studios, and law firms whose website and funnels
                should be feeding more qualified consultations instead of just
                looking “nice”.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* PROGRAMS TEASER */}
      <section>
        <div className="mx-auto max-w-6xl space-y-6 lg:max-w-7xl">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Pick your starting point.
            </h2>
            <p className="text-sm text-muted sm:text-[0.95rem]">
              Most teams start with a Momentum Sprint. Baseline Scan is a
              lighter on-ramp when you know something&apos;s off but aren&apos;t
              sure where to begin. Growth Loop keeps the wins compounding once
              the basics are fixed.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Baseline Scan */}
            <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface/80 p-5 text-sm">
              <div className="inline-flex items-center rounded-full border border-border px-2 py-[3px] text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                Diagnostic
              </div>
              <h3 className="text-[1.05rem] font-semibold text-foreground">
                Baseline Scan
              </h3>
              <p className="text-muted">
                For teams who want clarity first: what&apos;s working,
                what&apos;s broken, and where the biggest upside is hiding.
              </p>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>Deep review of tracking, funnels, and key flows.</li>
                <li>
                  Plain-English report on where you&apos;re leaking revenue.
                </li>
                <li>
                  Prioritised 6–12 week growth roadmap you can execute.
                </li>
              </ul>
              <p className="text-[0.8rem] text-muted">
                One-time fixed fee. Credited against a Momentum Sprint if we
                keep working together.
              </p>
              <Link
                href="/programs"
                className="text-[0.86rem] text-mayda-teal hover:underline"
              >
                Learn more
              </Link>
            </article>

            {/* Momentum Sprint */}
            <article className="flex flex-col gap-3 rounded-xl border border-mayda-teal bg-surface-alt/80 p-5 text-sm shadow-soft">
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
                Duration: 6–8 weeks. Fixed scope &amp; fee, clear success
                metrics agreed up front.
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
            <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface/80 p-5 text-sm">
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
                Duration: 3+ months. Monthly engagement with a clear workload
                and room to pause after each cycle.
              </p>
              <Link
                href="/programs"
                className="text-[0.86rem] text-mayda-teal hover:underline"
              >
                Learn more
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ROI QUICKCHECK TEASER */}
      <section>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:max-w-7xl lg:flex-row lg:items-center lg:justify-between">
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
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground/90 hover:bg-surface-alt"
            >
              Open ROI Quickcheck
            </Link>
          </div>
        </div>
      </section>

      {/* CASE SPOTLIGHT */}
      <section>
        <div className="mx-auto max-w-6xl space-y-5 lg:max-w-7xl">
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
            <article className="space-y-2 rounded-xl border border-border bg-surface/80 p-5 text-sm">
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
            <article className="space-y-2 rounded-xl border border-border bg-surface/80 p-5 text-sm">
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
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground/90 hover:bg-surface-alt"
            >
              View all projects
            </Link>
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              How we work together.
            </h2>
            <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
              Clear phases, fast feedback, and no black-box retainers.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <article className="space-y-2 rounded-xl border border-border bg-surface/80 p-5 text-sm">
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
            <article className="space-y-2 rounded-xl border border-border bg-surface/80 p-5 text-sm">
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
            <article className="space-y-2 rounded-xl border border-border bg-surface/80 p-5 text-sm">
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
            <article className="space-y-2 rounded-xl border border-border bg-surface/80 p-5 text-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mayda-teal/10 text-[0.8rem] font-medium text-mayda-teal">
                4
              </span>
              <h3 className="text-[1rem] font-semibold text-foreground">
                Compound
              </h3>
              <p className="text-muted">
                Decide whether to pause, repeat a Sprint, or move into the
                Growth Loop for ongoing experiments and lifecycle work.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ TEASER */}
      <section>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:max-w-7xl lg:flex-row lg:items-start lg:justify-between">
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
