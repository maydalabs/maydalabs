import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Advanced ROI Quickcheck – Mayda Labs",
  description:
    "Advanced ROI Quickcheck to estimate extra revenue from small lifts in conversion or close rate, and see which Mayda Labs program usually fits your scenario.",
};

export default function AdvancedRoiPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      {/* Intro */}
      <header>
        <div className="mx-auto max-w-6xl space-y-3 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            ROI QUICKCHECK
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Advanced ROI Quickcheck
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            A simple way to sanity-check the upside from improving your
            conversion or close rate before you change anything. This page will
            become the full calculator with real inputs, scenarios, and
            shareable links.
          </p>
          <p className="max-w-2xl text-xs text-muted sm:text-sm">
            Right now it&apos;s a designed spec: the layout and logic we&apos;ll
            wire up later for AOV, sessions, conversion rate, and expected lift.
          </p>
        </div>
      </header>

      {/* Layout: inputs on the left, results on the right */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-start lg:max-w-7xl">
          {/* Inputs + assumptions */}
          <div className="space-y-5 rounded-2xl border border-border bg-surface/85 p-5 sm:p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Inputs
              </h2>
              <p className="max-w-xl text-xs text-muted sm:text-sm">
                These are the numbers you&apos;ll be able to adjust in the live
                calculator.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 rounded-xl border border-border/60 bg-surface-alt/70 p-3">
                <div className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                  Average order value (AOV)
                </div>
                <div className="text-sm font-medium text-foreground">$120</div>
                <div className="text-[0.8rem] text-muted">
                  Typical checkout or initial purchase value.
                </div>
              </div>

              <div className="space-y-1 rounded-xl border border-border/60 bg-surface-alt/70 p-3">
                <div className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                  Monthly sessions
                </div>
                <div className="text-sm font-medium text-foreground">
                  42,000
                </div>
                <div className="text-[0.8rem] text-muted">
                  Unique monthly sessions on your primary funnel.
                </div>
              </div>

              <div className="space-y-1 rounded-xl border border-border/60 bg-surface-alt/70 p-3">
                <div className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                  Current conversion rate
                </div>
                <div className="text-sm font-medium text-foreground">1.9%</div>
                <div className="text-[0.8rem] text-muted">
                  Purchases / sign-ups divided by sessions.
                </div>
              </div>

              <div className="space-y-1 rounded-xl border border-border/60 bg-surface-alt/70 p-3">
                <div className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                  Target conversion / lift scenario
                </div>
                <div className="text-sm font-medium text-foreground">
                  2.4% (≈ +0.5pp)
                </div>
                <div className="text-[0.8rem] text-muted">
                  Modest improvement, not a fantasy number.
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-border/60 pt-3">
              <h3 className="text-sm font-semibold text-foreground">
                Assumptions
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-sm text-muted">
                <li>Traffic quality remains roughly the same.</li>
                <li>
                  No drastic pricing changes; AOV gains come from UX / offer
                  improvements.
                </li>
                <li>
                  We&apos;re looking at incremental upside, not lifetime value
                  multipliers (that comes later).
                </li>
              </ul>
            </div>
          </div>

          {/* Results + program fit */}
          <div className="space-y-5 rounded-2xl border border-border bg-surface/85 p-5 sm:p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Estimated upside
              </h2>
              <p className="max-w-xl text-xs text-muted sm:text-sm">
                Using the inputs on the left and a conservative lift,
                here&apos;s what the upside could look like.
              </p>
            </div>

            {/* Summary card */}
            <div className="space-y-4 rounded-2xl border border-mayda-teal/70 bg-gradient-to-br from-mayda-teal/15 via-surface to-surface p-4 sm:p-5 shadow-soft">
              <div className="space-y-1">
                <div className="text-[0.75rem] uppercase tracking-[0.14em] text-muted">
                  Extra revenue / month
                </div>
                <div className="text-2xl font-semibold text-foreground">
                  $2,880
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="space-y-1">
                  <div className="text-[0.75rem] uppercase tracking-[0.14em] text-muted">
                    Extra revenue / year
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    $34,560
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[0.75rem] uppercase tracking-[0.14em] text-muted">
                    Break-even on typical Sprint
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    ~2–3 months
                  </div>
                </div>
              </div>
            </div>

            {/* Program fit */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                What usually fits:
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1 rounded-xl border border-border bg-surface-alt/60 p-3 text-sm text-muted">
                  <div className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                    Baseline Scan
                  </div>
                  <p>
                    If your numbers are fuzzy or events are broken, we start
                    here before trusting any ROI model.
                  </p>
                </div>
                <div className="space-y-1 rounded-xl border border-mayda-teal/80 bg-mayda-teal/10 p-3 text-sm text-muted shadow-soft">
                  <div className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                    Momentum Sprint
                  </div>
                  <p>
                    When you already have meaningful traffic and want a focused
                    6–8 week push to realise this upside.
                  </p>
                </div>
                <div className="space-y-1 rounded-xl border border-border bg-surface-alt/60 p-3 text-sm text-muted">
                  <div className="text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                    Growth Loop
                  </div>
                  <p>
                    For teams who want ongoing experiments and lifecycle work
                    after the initial lift.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface-alt px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt/80"
              >
                View programs
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-mayda-teal bg-mayda-teal/20 px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-mayda-teal/30"
              >
                Talk through your numbers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / explainer */}
      <section>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl border border-border bg-surface-alt/70 p-5 sm:flex-row sm:justify-between sm:p-6 lg:max-w-7xl">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              What this page will do later.
            </h2>
            <p className="max-w-xl text-sm text-muted sm:text-[0.95rem]">
              The live calculator will let you plug in your own AOV, traffic,
              conversion, and lift scenarios, then share a link with those
              inputs prefilled.
            </p>
          </div>
          <ul className="ml-4 list-disc space-y-1 text-sm text-muted sm:ml-6 sm:max-w-md">
            <li>Inputs: AOV, sessions, current CR, target CR or lift.</li>
            <li>Outputs: extra revenue / month, year, and simple payback.</li>
            <li>
              A suggestion on where to start: Baseline Scan vs Sprint vs Growth
              Loop.
            </li>
            <li>
              Optional: a way to save / share scenarios with query params or
              short links.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
