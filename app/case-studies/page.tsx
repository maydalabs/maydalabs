import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects – Selected growth work",
  description:
    "Selected Mayda Labs projects and case microsites across ecommerce, SaaS, and services – the evolution of the original /projects gallery.",
};

export default function ProjectsPage() {
  return (
    <div className="space-y-16 md:space-y-20">
      {/* Header */}
      <header>
        <div className="mx-auto max-w-6xl space-y-3 lg:max-w-7xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-muted">
            PROJECTS
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
            Selected projects
          </h1>
          <p className="max-w-2xl text-sm text-muted sm:text-[0.95rem]">
            A few recent projects across ecommerce, SaaS, and services. Full
            microsites and deeper write-ups will live here as Mayda Labs
            publishes more work.
          </p>
          <p className="max-w-3xl text-xs text-muted sm:text-sm">
            These are representative examples – numbers are directional, but the
            shape of the work is exactly what we do in a Baseline Scan, Momentum
            Sprint, or Growth Loop.
          </p>
        </div>
      </header>

      {/* Cases grid */}
      <section>
        <div className="mx-auto max-w-6xl lg:max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Ecommerce case */}
            <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface/85 p-5 text-sm">
              <p className="text-[0.75rem] uppercase tracking-[0.14em] text-muted">
                Ecommerce brand · Momentum Sprint
              </p>
              <h2 className="text-[1.1rem] font-semibold text-foreground">
                From stalled traffic to reliable revenue.
              </h2>
              <p className="text-muted">
                Mid-sized DTC brand with decent traffic but flat revenue, messy
                tracking, and no real lifecycle flows.
              </p>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>+28% conversion rate on core product funnels.</li>
                <li>+19% average order value via offer and UX changes.</li>
                <li>$84k extra revenue in 90 days vs prior period.</li>
              </ul>
              <p className="text-[0.8rem] text-muted">
                <span className="font-semibold text-foreground">Scope:</span>{" "}
                Baseline Scan + 8-week Momentum Sprint. Work: tracking cleanup,
                product page + cart experiments, new post-purchase and win-back
                flows.
              </p>
            </article>

            {/* SaaS case */}
            <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface/85 p-5 text-sm">
              <p className="text-[0.75rem] uppercase tracking-[0.14em] text-muted">
                SaaS platform · Momentum Sprint
              </p>
              <h2 className="text-[1.1rem] font-semibold text-foreground">
                Activation and upgrade working together.
              </h2>
              <p className="text-muted">
                B2B SaaS with strong sign-up volume but weak activation and no
                structured experiments around upgrade triggers.
              </p>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>+17% trial-to-activated users within 14 days.</li>
                <li>+11% upgrade rate in the first 30 days.</li>
                <li>Lifecycle flows driven by clean product events.</li>
              </ul>
              <p className="text-[0.8rem] text-muted">
                <span className="font-semibold text-foreground">Scope:</span>{" "}
                6-week Momentum Sprint. Work: event mapping, onboarding flow
                redesign, in-app nudges, lifecycle emails tied to real
                behaviour.
              </p>
            </article>

            {/* Services / practice case */}
            <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface/85 p-5 text-sm">
              <p className="text-[0.75rem] uppercase tracking-[0.14em] text-muted">
                Service firm &amp; practice · Growth Loop
              </p>
              <h2 className="text-[1.1rem] font-semibold text-foreground">
                Turning visits into qualified consultations.
              </h2>
              <p className="text-muted">
                Boutique service firm relying on referrals and a dated site;
                wanted the website and content to drive predictable leads.
              </p>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>2.3× more qualified consultation requests per month.</li>
                <li>Clearer positioning and offer structure on key pages.</li>
                <li>
                  New lead capture and nurture flows supporting outbound and
                  content.
                </li>
              </ul>
              <p className="text-[0.8rem] text-muted">
                <span className="font-semibold text-foreground">Scope:</span>{" "}
                Baseline Scan + ongoing Growth Loop. Work: site restructuring,
                offer clarity, form and funnel experiments, lifecycle and
                content cadence.
              </p>
            </article>

            {/* Bitcoin-native case */}
            <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface/85 p-5 text-sm">
              <p className="text-[0.75rem] uppercase tracking-[0.14em] text-muted">
                Bitcoin-native brand · Mixed scope
              </p>
              <h2 className="text-[1.1rem] font-semibold text-foreground">
                Modern funnels for a Bitcoin-first audience.
              </h2>
              <p className="text-muted">
                Bitcoin-native project needing modern UX, clearer funnels, and
                lifecycle systems that respect how their audience buys and
                interacts.
              </p>
              <ul className="ml-4 list-disc space-y-1 text-[0.9rem] text-muted">
                <li>New site structure focused on actions, not noise.</li>
                <li>Cohesive measurement across web, email, and product.</li>
                <li>
                  Lifecycle flows tuned for a global, high-signal audience.
                </li>
              </ul>
              <p className="text-[0.8rem] text-muted">
                <span className="font-semibold text-foreground">Scope:</span>{" "}
                custom mix of Scan, Sprint, and advisory. This is the shape of
                work for more complex, multi-surface products.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
