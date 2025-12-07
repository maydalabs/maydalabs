import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects – Selected growth work",
  description:
    "Selected Emayda projects and case microsites across ecommerce, SaaS, and services – the evolution of the original /projects gallery.",
};

export default function ProjectsPage() {

  return (
    <div className="page">
      <header>
        <h1 className="page-title">Selected projects</h1>
        <p className="page-intro">
          A few recent projects across ecommerce, SaaS, and services. Full
          microsites and deeper write-ups will live here as Emayda (soon MaydaLabs)
          publishes more work.
        </p>
        <p className="page-note">
          These are representative examples – numbers are directional, but the
          shape of the work is exactly what we do in a Baseline Scan, Momentum
          Sprint, or Growth Loop.
        </p>
      </header>

      <section className="home-case" style={{ paddingTop: 0 }}>
        <div className="home-case-inner">
          <div className="home-case-grid">
            {/* Ecommerce case */}
            <article className="case-card">
              <p className="case-label">Ecommerce brand · Momentum Sprint</p>
              <h2>From stalled traffic to reliable revenue.</h2>
              <p>
                Mid-sized DTC brand with decent traffic but flat revenue, messy
                tracking, and no real lifecycle flows.
              </p>
              <ul className="case-list">
                <li>+28% conversion rate on core product funnels.</li>
                <li>+19% average order value via offer and UX changes.</li>
                <li>$84k extra revenue in 90 days vs prior period.</li>
              </ul>
              <p className="page-note">
                Scope: Baseline Scan + 8-week Momentum Sprint. Work: tracking
                cleanup, product page+cart experiments, new post-purchase +
                win-back flows.
              </p>
            </article>

            {/* SaaS case */}
            <article className="case-card">
              <p className="case-label">SaaS platform · Momentum Sprint</p>
              <h2>Activation and upgrade working together.</h2>
              <p>
                B2B SaaS with strong sign-up volume but weak activation and no
                structured experiments around upgrade triggers.
              </p>
              <ul className="case-list">
                <li>+17% trial-to-activated users within 14 days.</li>
                <li>+11% upgrade rate in the first 30 days.</li>
                <li>Lifecycle flows driven by clean product events.</li>
              </ul>
              <p className="page-note">
                Scope: 6-week Momentum Sprint. Work: event mapping, onboarding
                flow redesign, in-app nudges, lifecycle emails tied to real
                behaviour.
              </p>
            </article>

            {/* Services / practice case */}
            <article className="case-card">
              <p className="case-label">
                Service firm &amp; practice · Growth Loop
              </p>
              <h2>Turning visits into qualified consultations.</h2>
              <p>
                Boutique service firm relying on referrals and a dated site;
                wanted the website and content to drive predictable leads.
              </p>
              <ul className="case-list">
                <li>2.3× more qualified consultation requests per month.</li>
                <li>Clearer positioning and offer structure on key pages.</li>
                <li>
                  New lead capture + nurture flows supporting outbound and
                  content.
                </li>
              </ul>
              <p className="page-note">
                Scope: Baseline Scan + ongoing Growth Loop. Work: site
                restructuring, offer clarity, form + funnel experiments,
                lifecycle and content cadence.
              </p>
            </article>

            {/* Bitcoin / crypto-flavoured case placeholder */}
            <article className="case-card">
              <p className="case-label">Bitcoin-native brand · Mixed scope</p>
              <h2>Modern funnels for a Bitcoin-first audience.</h2>
              <p>
                Bitcoin-native project needing modern UX, clearer funnels, and
                lifecycle systems that respect how their audience buys and
                interacts.
              </p>
              <ul className="case-list">
                <li>New site structure focused on actions, not noise.</li>
                <li>Cohesive measurement across web, email, and product.</li>
                <li>
                  Lifecycle flows tuned for a global, high-signal audience.
                </li>
              </ul>
              <p className="page-note">
                Scope: custom mix of Scan, Sprint, and advisory. This is the
                shape of work for more complex, multi-surface products.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
