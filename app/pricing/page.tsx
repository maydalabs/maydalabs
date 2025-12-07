import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {

  title: "Pricing – Fixed-scope growth programs",
  description:
    "Simple, outcome-focused pricing: one-time Baseline Scan, fixed-fee Momentum Sprints, and a clear monthly Growth Loop retainer with no black-box retainers.",
};

export default function PricingPage() {
  return (
    <div className="page">
      <header>
        <h1 className="page-title">Pricing</h1>
        <p className="page-intro">
          Simple, outcome-focused pricing. No black-box retainers, no surprise
          scope creep. Each engagement has a clear scope, timeline, and fee we
          agree on before work starts.
        </p>
        <p className="page-note">
          Exact numbers depend on your funnel complexity and surfaces (web,
          product, lifecycle), but the structure below is how every engagement
          is priced.
        </p>
      </header>

      {/* Program pricing view */}
      <section className="home-programs">
        <div className="home-programs-grid">
          {/* Baseline Scan */}
          <article className="program-card">
            <span className="program-tag">Diagnostic</span>
            <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
              Baseline Scan
            </h2>
            <p className="program-subtitle">
              Fixed-fee diagnostic for teams who want clarity before committing
              to a Sprint or ongoing work.
            </p>
            <ul className="program-list">
              <li>One-time fee covering audit, analysis, and roadmap.</li>
              <li>
                Includes a walkthrough call and a documented 6–12 week plan.
              </li>
              <li>
                If you move into a Momentum Sprint, the Scan fee is credited
                against it.
              </li>
            </ul>
            <p className="program-meta">
              <strong>Ideal when:</strong> you know something&apos;s off but
              don&apos;t yet know whether a full Sprint makes sense.
            </p>
          </article>

          {/* Momentum Sprint */}
          <article className="program-card program-card--primary">
            <span className="program-tag program-tag--primary">
              Flagship engagement
            </span>
            <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
              Momentum Sprint
            </h2>
            <p className="program-subtitle">
              6–8 week fixed-scope engagement to clean up tracking, fix the
              worst leaks, and ship high-impact changes.
            </p>
            <ul className="program-list">
              <li>
                Flat project fee based on funnel complexity and surfaces
                touched.
              </li>
              <li>
                Scope, deliverables, and success metrics are agreed before we
                start.
              </li>
              <li>
                Payment typically split: deposit at kickoff, remainder at
                mid-point or completion.
              </li>
            </ul>
            <p className="program-meta">
              <strong>Ideal when:</strong> you have meaningful traffic and want
              a focused push, not a vague “retainer”.
            </p>
          </article>

          {/* Growth Loop */}
          <article className="program-card">
            <span className="program-tag">Ongoing growth</span>
            <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
              Growth Loop
            </h2>
            <p className="program-subtitle">
              Monthly engagement for teams who want a consistent testing and
              lifecycle cadence after a Sprint.
            </p>
            <ul className="program-list">
              <li>
                Monthly retainer tied to a clear experiment and lifecycle
                workload.
              </li>
              <li>
                Quarterly scope review to adjust focus as the business and data
                change.
              </li>
              <li>
                Easy to pause after any cycle; no long-term lock-in contracts.
              </li>
            </ul>
            <p className="program-meta">
              <strong>Ideal when:</strong> you&apos;ve seen the impact of a
              Sprint and want compounding gains rather than one-off projects.
            </p>
          </article>
        </div>
      </section>

      {/* How billing works */}
      <section className="home-roi">
        <div className="home-roi-inner">
          <div>
            <h2 className="home-section-title">How billing works.</h2>
            <ul className="home-roi-list">
              <li>
                <strong>No surprise retainers.</strong> We agree the scope,
                timeline, and fee before work starts.
              </li>
              <li>
                <strong>Simple structure.</strong> Baseline Scan is one-time;
                Sprints are fixed-fee; Growth Loop is monthly.
              </li>
              <li>
                <strong>Payment options.</strong> Standard bank/card payments,
                with the option to pay via Bitcoin for teams who prefer it.
              </li>
            </ul>
          </div>
          <div className="home-roi-cta">
            <Link href="/roi-quickcheck" className="btn btn-secondary">
              Estimate your upside first
            </Link>
          </div>
        </div>
      </section>

      {/* Fit check CTA */}
      <section className="home-faq">
        <div className="home-faq-inner">
          <div>
            <h2 className="home-section-title">
              Want actual numbers for your case?
            </h2>
            <p className="home-section-intro">
              A quick 15-minute fit check is usually enough to give you a
              realistic fee range for a Scan, Sprint, or Growth Loop.
            </p>
          </div>
          <div>
            <Link href="/contact" className="btn btn-primary">
              Book a 15&nbsp;min fit check
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
