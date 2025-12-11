import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About – Mayda Labs growth partner",
  description:
    "Mayda Labs is a focused growth partner for digital brands, combining CRO, analytics, and lifecycle systems with a bias for shipping and clear communication.",
};

export default function AboutPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      {/* Intro */}
      <section>
        <div className="mx-auto max-w-6xl space-y-6 lg:max-w-7xl">
          <div className="space-y-3">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
              ABOUT · MAYDA LABS
            </p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
              A focused growth partner for digital-first teams.
            </h1>
            <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
              Mayda Labs is a focused growth partner for digital brands. The work
              sits where analytics, UX, and lifecycle meet – with a simple goal:
              turn underperforming traffic into meetings, clients, and revenue.
            </p>
            <p className="max-w-2xl text-xs text-muted sm:text-sm">
              The DNA comes from Emayda – less “agency noise”, more clean systems
              and measurable lifts. The name changes, the philosophy doesn&apos;t.
            </p>
          </div>

          <div className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                What Mayda Labs actually does
              </h2>
              <p className="max-w-2xl text-xs text-muted sm:text-sm">
                Most teams don&apos;t need another giant “brand refresh”. They
                need someone to get inside the funnel, fix broken tracking,
                simplify flows, and ship changes that move the numbers they care
                about – without turning everything into a 6-month project.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/80 p-4 text-xs text-muted shadow-soft sm:text-sm">
              <h3 className="mb-2 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-foreground">
                Quick facts
              </h3>
              <dl className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">Focus</dt>
                  <dd className="text-right text-foreground/90">
                    Turning existing traffic into revenue
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">Typical stage</dt>
                  <dd className="text-right text-foreground/90">
                    Post-launch, some traction, leaks in the funnel
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">Work style</dt>
                  <dd className="text-right text-foreground/90">
                    Short sprints, clear metrics, visible shipping
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Where it fits */}
      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Where Mayda Labs fits
            </h2>
            <p className="max-w-2xl text-xs text-muted sm:text-sm">
              Mayda Labs is for teams who already have some traction but know
              their numbers and flows aren&apos;t where they should be:
            </p>
          </div>

          <ul className="space-y-3 text-sm text-muted">
            <li className="flex gap-3">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-mayda-teal" />
              <span>
                Traffic is “okay”, but revenue per visitor is underwhelming.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-mayda-teal" />
              <span>
                Tracking is half-broken – GA4, pixels, and events don&apos;t
                fully agree.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-mayda-teal" />
              <span>
                Funnels and lifecycle were built incrementally and now feel
                bolted together.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* How we work */}
      <section>
        <div className="mx-auto max-w-6xl space-y-4 lg:max-w-7xl">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              How we work
            </h2>
            <p className="max-w-2xl text-xs text-muted sm:text-sm">
              Clear phases, fast feedback, and no black-box retainers.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="space-y-2 rounded-2xl border border-border bg-surface/80 p-5 text-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mayda-teal/10 text-[0.8rem] font-medium text-mayda-teal">
                1
              </span>
              <h3 className="text-[0.98rem] font-semibold text-foreground">
                Baseline first
              </h3>
              <p className="text-muted">
                Clean up data and understand the real funnel before throwing
                tests at it. No guesswork if the numbers can&apos;t be trusted.
              </p>
            </article>

            <article className="space-y-2 rounded-2xl border border-border bg-surface/80 p-5 text-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mayda-teal/10 text-[0.8rem] font-medium text-mayda-teal">
                2
              </span>
              <h3 className="text-[0.98rem] font-semibold text-foreground">
                Ship fast
              </h3>
              <p className="text-muted">
                Short sprints, visible changes, documented decisions. No 6-month
                “strategy decks” – just real changes in your funnel, UX, and
                lifecycle.
              </p>
            </article>

            <article className="space-y-2 rounded-2xl border border-border bg-surface/80 p-5 text-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-mayda-teal/10 text-[0.8rem] font-medium text-mayda-teal">
                3
              </span>
              <h3 className="text-[0.98rem] font-semibold text-foreground">
                Compound
              </h3>
              <p className="text-muted">
                Keep what works, kill what doesn&apos;t, and build a simple
                rhythm around experiments and lifecycle so improvements don&apos;t
                stop after one project.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Who's behind it */}
      <section>
        <div className="mx-auto max-w-6xl space-y-6 lg:max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Who&apos;s behind it
              </h2>
              <p className="max-w-3xl text-sm text-muted">
                Mayda Labs is run by a practitioner, not a committee. The person
                you talk to is the person who touches your funnels, analytics,
                and flows. No layers of account managers, no mystery team.
              </p>
              <p className="max-w-3xl text-sm text-muted">
                Background spans ecommerce, SaaS, and Bitcoin-native projects –
                with a bias toward self-serve products and businesses that live
                or die by their website performance.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-surface/80 p-5 text-xs text-muted shadow-soft sm:text-sm">
              <h3 className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-foreground">
                Focus areas
              </h3>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-mayda-teal" />
                  <span>Conversion &amp; UX across key flows.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-mayda-teal" />
                  <span>Tracking, events, and clean analytics.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-mayda-teal" />
                  <span>Lifecycle and retention systems that don&apos;t spam.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
