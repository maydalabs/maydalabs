import Link from "next/link";

export default function ProgramsPage() {
  return (
    <div className="page">
      <header>
        <h1 className="page-title">Programs</h1>
        <p className="page-intro">
          Three ways to work together, depending on how clear your situation is
          and how fast you want to move: Baseline Scan, Momentum Sprint, and
          Growth Loop.
        </p>
        <p className="page-note">
          Most teams start with a Momentum Sprint. Baseline Scan is a lighter
          diagnostic when you know something&apos;s off but aren&apos;t sure
          where to begin. Growth Loop is for teams who want a steady cadence of
          experiments and lifecycle work after the first lift.
        </p>
      </header>

      {/* Program grid – same visual style as homepage, more detail */}
      <section className="home-programs">
        <div className="home-programs-grid">
          {/* Baseline Scan */}
          <article className="program-card">
            <div className="program-tag">Diagnostic</div>
            <h2 className="home-section-title" style={{ fontSize: "1.25rem" }}>
              Baseline Scan
            </h2>
            <p className="program-subtitle">
              One-time diagnostic for teams who want clarity first: what&apos;s
              working, what&apos;s broken, and where the biggest upside is
              hiding.
            </p>

            <h3 className="page-note" style={{ marginTop: "0.75rem" }}>
              Best for
            </h3>
            <ul className="program-list">
              <li>
                You have &quot;okay&quot; traffic but flat revenue or weak
                conversion.
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

            <h3 className="page-note" style={{ marginTop: "0.75rem" }}>
              What we do
            </h3>
            <ul className="program-list">
              <li>Audit tracking (GA4, pixels, key events) and fix basics.</li>
              <li>
                Review key funnels and flows: homepage, product/offer pages,
                forms, checkout or sign-up.
              </li>
              <li>
                Map out the current lifecycle: abandon, post-purchase, onboarding,
                win-back.
              </li>
            </ul>

            <h3 className="page-note" style={{ marginTop: "0.75rem" }}>
              What you leave with
            </h3>
            <ul className="program-list">
              <li>
                Plain-English summary of what&apos;s holding back conversion and
                revenue.
              </li>
              <li>
                Prioritised 6–12 week roadmap with specific changes and tests.
              </li>
              <li>
                A call to walk through the findings and answer questions.
              </li>
            </ul>

            <p className="program-meta">
              <strong>Format:</strong> one-time fixed fee. If we move into a
              Momentum Sprint, the Scan fee is credited against it.
            </p>

            <Link href="/pricing" className="program-link">
              See how pricing works
            </Link>
          </article>

          {/* Momentum Sprint */}
          <article className="program-card program-card--primary">
            <div className="program-tag program-tag--primary">
              Flagship engagement
            </div>
            <h2 className="home-section-title" style={{ fontSize: "1.25rem" }}>
              Momentum Sprint
            </h2>
            <p className="program-subtitle">
              6–8 weeks to clean up tracking, fix the worst leaks, and ship
              changes that actually move revenue.
            </p>

            <h3 className="page-note" style={{ marginTop: "0.75rem" }}>
              Best for
            </h3>
            <ul className="program-list">
              <li>
                You already have meaningful traffic and a working product or
                offer.
              </li>
              <li>
                You&apos;re sick of small tweaks and want a focused push on the
                highest-impact parts of the funnel.
              </li>
              <li>
                You&apos;re ready to give access and make fast decisions for 6–8
                weeks.
              </li>
            </ul>

            <h3 className="page-note" style={{ marginTop: "0.75rem" }}>
              What we do
            </h3>
            <ul className="program-list">
              <li>
                Finalise tracking and baseline metrics so we&apos;re not flying
                blind.
              </li>
              <li>
                Ship 3–5 high-impact UX, copy, or flow changes on key pages
                (homepage, PDP/offer, forms, checkout/sign-up).
              </li>
              <li>
                Stand up core lifecycle flows: abandon, post-purchase, win-back,
                or onboarding depending on your model.
              </li>
            </ul>

            <h3 className="page-note" style={{ marginTop: "0.75rem" }}>
              What you leave with
            </h3>
            <ul className="program-list">
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

            <p className="program-meta">
              <strong>Format:</strong> 6–8 week project with a fixed scope &amp;
              fee, agreed up front. Clear success metrics; weekly updates in
              plain English.
            </p>

            <div className="program-actions">
              <Link href="https://calendly.com/" className="btn btn-primary">
                Talk about a Sprint
              </Link>
              <Link href="/pricing" className="program-link">
                View pricing structure
              </Link>
            </div>
          </article>

          {/* Growth Loop */}
          <article className="program-card">
            <div className="program-tag">Ongoing growth</div>
            <h2 className="home-section-title" style={{ fontSize: "1.25rem" }}>
              Growth Loop
            </h2>
            <p className="program-subtitle">
              Ongoing engagement for teams who want a steady testing and
              lifecycle cadence after the first Sprint, not one-off projects.
            </p>

            <h3 className="page-note" style={{ marginTop: "0.75rem" }}>
              Best for
            </h3>
            <ul className="program-list">
              <li>
                You&apos;ve seen the impact of the first changes and want to
                keep compounding.
              </li>
              <li>
                You don&apos;t have the bandwidth for an in-house experimentation
                and lifecycle team.
              </li>
              <li>
                You care more about consistent progress than massive quarterly
                overhauls.
              </li>
            </ul>

            <h3 className="page-note" style={{ marginTop: "0.75rem" }}>
              What we do every month
            </h3>
            <ul className="program-list">
              <li>
                Plan and run experiment cycles on priority pages and flows.
              </li>
              <li>
                Iterate lifecycle campaigns and segmentation with AI assistance
                where useful.
              </li>
              <li>
                Review performance, adjust focus, and reset priorities each
                quarter.
              </li>
            </ul>

            <h3 className="page-note" style={{ marginTop: "0.75rem" }}>
              What you get
            </h3>
            <ul className="program-list">
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

            <p className="program-meta">
              <strong>Format:</strong> month-to-month engagement with a clearly
              defined workload. Easy to pause after any cycle.
            </p>

            <Link href="/contact" className="program-link">
              Ask about Growth Loop
            </Link>
          </article>
        </div>
      </section>

      {/* Help choose */}
      <section className="home-faq">
        <div className="home-faq-inner">
          <div>
            <h2 className="home-section-title">
              Not sure which program fits?
            </h2>
            <p className="home-section-intro">
              A quick 15 minute fit check is usually enough to decide whether we
              start with a Scan, go straight into a Sprint, or design something
              custom.
            </p>
          </div>
          <div>
            <ul className="home-faq-list">
              <li>
                We&apos;ll look at your current funnel and main channels of
                traffic.
              </li>
              <li>
                You&apos;ll get an honest view if we&apos;re a good match—and if
                not, what to do instead.
              </li>
            </ul>
            <Link href="/contact" className="btn btn-primary">
              Book a 15&nbsp;min fit check
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
