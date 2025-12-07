import Link from "next/link";

export default function ProgramsPage() {
  return (
    <div className="page">
      <header className="home-programs-header">
        <h1 className="page-title">Pick your starting point.</h1>
        <p className="page-intro">
          Most teams begin with a Momentum Sprint. Baseline Scan is a lighter
          on-ramp when you know something&apos;s off but aren&apos;t sure where
          to start. Growth Loop keeps the wins compounding once the basics are
          fixed.
        </p>
        <p className="page-note">
          All work is fixed-scope, outcome-focused, and designed for digital
          brands that get real business from their website and funnels.
        </p>
      </header>

      {/* Main program grid */}
      <section className="home-programs">
        <div className="home-programs-grid">
          {/* Baseline Scan */}
          <article className="program-card">
            <span className="program-tag">Diagnostic</span>
            <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
              Baseline Scan
            </h2>
            <p className="program-subtitle">
              For teams who know something&apos;s wrong but don&apos;t know
              where to start.
            </p>
            <ul className="program-list">
              <li>Deep review of tracking, funnels, and key flows.</li>
              <li>Plain-English report on where you&apos;re leaking revenue.</li>
              <li>Prioritised 6–12 week growth roadmap you can execute with or
                  without us.</li>
            </ul>
            <p className="program-meta">
              <strong>Best for:</strong> teams with “okay traffic” but stuck
              conversion and patchy tracking.
            </p>
            <p className="program-meta">
              <strong>Typical timeline:</strong> 2–3 weeks. Fixed fee. Can roll
              into a Momentum Sprint.
            </p>
            <div className="program-actions">
              <Link href="/contact" className="btn btn-secondary">
                Talk about a Scan
              </Link>
            </div>
          </article>

          {/* Momentum Sprint – flagship */}
          <article className="program-card program-card--primary">
            <span className="program-tag program-tag--primary">
              Flagship engagement
            </span>
            <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
              Momentum Sprint
            </h2>
            <p className="program-subtitle">
              6–8 weeks to fix the worst leaks, ship high-impact tests, and
              upgrade your lifecycle base.
            </p>
            <ul className="program-list">
              <li>Clean tracking and a reliable baseline for your funnel.</li>
              <li>3–5 high-impact UX, copy, or flow changes shipped.</li>
              <li>
                Core lifecycle flows live (abandon flows, post-purchase,
                win-back, etc.).
              </li>
            </ul>
            <p className="program-meta">
              <strong>Best for:</strong> digital brands ready to move from
              “random tweaks” to focused experiments.
            </p>
            <p className="program-meta">
              <strong>Typical timeline:</strong> 6–8 weeks. Fixed scope &amp;
              fee, clear success metrics agreed up front.
            </p>
            <div className="program-actions">
              <Link href="/contact" className="btn btn-primary">
                Talk about a Sprint
              </Link>
              <Link href="/roi-quickcheck" className="program-link">
                Estimate the upside first →
              </Link>
            </div>
          </article>

          {/* Growth Loop */}
          <article className="program-card">
            <span className="program-tag">Ongoing growth</span>
            <h2 className="page-title" style={{ fontSize: "1.25rem" }}>
              Growth Loop
            </h2>
            <p className="program-subtitle">
              For teams who want a steady testing &amp; lifecycle cadence, not
              one-off fixes.
            </p>
            <ul className="program-list">
              <li>Monthly experiment cycles on key pages and flows.</li>
              <li>AI-assisted lifecycle campaigns and segmentation.</li>
              <li>Monthly report plus quarterly reset on priorities.</li>
            </ul>
            <p className="program-meta">
              <strong>Best for:</strong> brands that have product–market fit and
              need compounding CRO + lifecycle work.
            </p>
            <p className="program-meta">
              <strong>Typical timeline:</strong> 3+ months. Rhythm: monthly
              cycles with clear test backlogs.
            </p>
            <div className="program-actions">
              <Link href="/contact" className="btn btn-secondary">
                Talk about Growth Loop
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Fit check strip */}
      <section className="home-roi">
        <div className="home-roi-inner">
          <div>
            <h2 className="home-section-title">
              Not sure which program fits?
            </h2>
            <p className="home-section-intro">
              Book a quick 15-minute fit check. We&apos;ll look at your current
              funnel, ask a few questions about traffic and revenue, and suggest
              where to start—Baseline Scan, a Sprint, or something else.
            </p>
          </div>
          <div className="home-roi-cta">
            <Link href="/contact" className="btn btn-primary">
              Book a 15&nbsp;min fit check
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
