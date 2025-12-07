import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-hero-kicker">
              GROWTH PARTNER · BUILT FOR DIGITAL BRANDS
            </p>
            <h1 className="home-hero-title">
              Turn underperforming traffic into meetings, clients, and revenue.
            </h1>
            <p className="home-hero-subtitle">
              Emayda helps digital brands, SaaS, and service firms turn
              &ldquo;okay traffic&rdquo; into compounding revenue with clean
              tracking, focused CRO sprints, and AI-powered lifecycle systems.
            </p>

            <div className="home-hero-ctas">
              <Link href="https://calendly.com/" className="btn btn-primary">
                Book a 15min fit check
              </Link>
              <Link href="/programs" className="btn btn-secondary">
                See how Momentum Sprint works
              </Link>
            </div>

            <p className="home-hero-proof">
              Previously: built and scaled revenue systems for eCommerce and
              Bitcoin-native brands; now available as a focused growth partner.
            </p>
          </div>

          <div className="home-hero-console">
            <div className="console-card console-card-main">
              <div className="console-row">
                <span className="console-label">Traffic</span>
                <span className="console-value">42,000 sessions / mo</span>
              </div>
              <div className="console-row">
                <span className="console-label">Current conversion</span>
                <span className="console-value">1.9%</span>
              </div>
              <div className="console-row">
                <span className="console-label">Target conversion</span>
                <span className="console-value">2.4%</span>
              </div>
              <div className="console-divider" />
              <div className="console-row">
                <span className="console-label">Estimated upside</span>
                <span className="console-number">$2,880 / month</span>
              </div>
              <p className="console-hint">
                Based on a modest lift in close rate. We&apos;ll validate this
                in your Baseline Scan.
              </p>
            </div>

            <div className="console-grid">
              <div className="console-card">
                <p className="console-label">Experiments in flight</p>
                <p className="console-number">3</p>
                <p className="console-meta">62% win rate last 90 days</p>
              </div>
              <div className="console-card">
                <p className="console-label">Key flows</p>
                <p className="console-meta">
                  Checkout · onboarding · lead capture
                </p>
                <p className="console-tag">Status: mixed</p>
              </div>
              <div className="console-card">
                <p className="console-label">Lifecycle</p>
                <p className="console-meta">
                  Abandon flows, post-purchase, win-back.
                </p>
                <p className="console-tag">AI-assisted testing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ICP STRIP */}
      <section className="home-icp">
        <h2 className="home-section-title">Who Emayda is for</h2>
        <p className="home-section-intro">
          Digital brands and teams who already have visitors, but know their
          funnel and follow-up aren&apos;t doing them justice.
        </p>
        <div className="home-icp-grid">
          <div className="icp-card">
            <h3>Commerce &amp; product brands</h3>
            <p>
              Stores and product companies with steady traffic but 1–3%
              conversion and patchy tracking.
            </p>
          </div>
          <div className="icp-card">
            <h3>SaaS &amp; platforms</h3>
            <p>
              Apps where the leaks live between sign-up, activation, and
              upgrade—online and in-product.
            </p>
          </div>
          <div className="icp-card">
            <h3>Service firms &amp; practices</h3>
            <p>
              Agencies, studios, and law firms whose website and funnels should
              be feeding more qualified consultations.
            </p>
          </div>
        </div>
      </section>

      {/* PROGRAMS TEASER */}
      <section className="home-programs">
        <div className="home-programs-header">
          <h2 className="home-section-title">Pick your starting point.</h2>
          <p className="home-section-intro">
            Most teams begin with a Momentum Sprint. Baseline Scan is a lower
            commitment on-ramp; Growth Loop keeps the wins compounding.
          </p>
        </div>

        <div className="home-programs-grid">
          {/* Baseline Scan */}
          <article className="program-card">
            <div className="program-tag">Diagnostic</div>
            <h3>Baseline Scan</h3>
            <p className="program-subtitle">
              For teams who know something&apos;s off but don&apos;t know where
              to start.
            </p>
            <ul className="program-list">
              <li>Deep review of tracking, funnels, and key flows.</li>
              <li>Plain-English report on where you&apos;re leaking revenue.</li>
              <li>Prioritized 6–12 week growth roadmap.</li>
            </ul>
            <p className="program-meta">
              Fixed fee. Rolled into a Momentum Sprint if we work together.
            </p>
            <Link href="/programs" className="program-link">
              Learn more
            </Link>
          </article>

          {/* Momentum Sprint */}
          <article className="program-card program-card--primary">
            <div className="program-tag program-tag--primary">
              Flagship engagement
            </div>
            <h3>Momentum Sprint</h3>
            <p className="program-subtitle">
              6–8 weeks to fix the worst leaks, ship tests, and upgrade flows.
            </p>
            <ul className="program-list">
              <li>Clean tracking and a reliable baseline for your funnel.</li>
              <li>3–5 high-impact UX, copy, or flow changes shipped.</li>
              <li>
                Core lifecycle flows live (abandon, post-purchase, win-back,
                etc.).
              </li>
            </ul>
            <p className="program-meta">
              Duration: 6–8 weeks · Engagement: fixed scope &amp; fee.
            </p>
            <div className="program-actions">
              <Link href="https://calendly.com/" className="btn btn-primary">
                Talk about a Sprint
              </Link>
              <Link href="/programs" className="program-link">
                See full breakdown
              </Link>
            </div>
          </article>

          {/* Growth Loop */}
          <article className="program-card">
            <div className="program-tag">Ongoing growth</div>
            <h3>Growth Loop</h3>
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
              Duration: 3+ months · Rhythm: monthly cycles.
            </p>
            <Link href="/programs" className="program-link">
              Learn more
            </Link>
          </article>
        </div>
      </section>

      {/* ROI QUICKCHECK TEASER */}
      <section className="home-roi">
        <div className="home-roi-inner">
          <div>
            <h2 className="home-section-title">Turn more visitors into clients.</h2>
            <p className="home-section-intro">
              Use the ROI Quickcheck to estimate the upside from a small lift in
              conversion or close rate before you touch anything.
            </p>
            <ul className="home-roi-list">
              <li>AOV, sessions, current CR, and target lift inputs.</li>
              <li>Extra revenue per month and per year.</li>
              <li>Suggestion on which program makes most sense.</li>
            </ul>
          </div>
          <div className="home-roi-cta">
            <Link href="/roi-quickcheck" className="btn btn-secondary">
              Open advanced ROI calculator
            </Link>
          </div>
        </div>
      </section>

      {/* CASE SPOTLIGHT PLACEHOLDER */}
      <section className="home-case">
        <div className="home-case-inner">
          <div>
            <h2 className="home-section-title">What this looks like in practice.</h2>
            <p className="home-section-intro">
              A few recent projects across eCommerce, SaaS, and services. Full
              case studies will live here.
            </p>
          </div>
          <div className="home-case-grid">
            <article className="case-card">
              <p className="case-label">Ecommerce brand</p>
              <h3>From stalled traffic to reliable revenue.</h3>
              <ul className="case-list">
                <li>+28% conversion rate on key funnels.</li>
                <li>+19% average order value.</li>
                <li>$84k extra revenue in 90 days.</li>
              </ul>
            </article>
            <article className="case-card">
              <p className="case-label">SaaS platform</p>
              <h3>Activation and upgrade actually working together.</h3>
              <ul className="case-list">
                <li>+17% trial-to-activated users.</li>
                <li>+11% upgrade rate within 30 days.</li>
                <li>Lifecycle flows built on clean events.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="home-how">
        <h2 className="home-section-title">How we work together.</h2>
        <p className="home-section-intro">
          Clear phases, fast feedback, and no black-box retainers.
        </p>
        <div className="home-how-grid">
          <article className="how-card">
            <span className="how-step">1</span>
            <h3>Baseline → plan</h3>
            <p>
              Align on goals, constraints, and success metrics. Audit funnels,
              flows, and tracking. Define the prioritized plan.
            </p>
          </article>
          <article className="how-card">
            <span className="how-step">2</span>
            <h3>Build fast</h3>
            <p>
              Fix tracking and analytics. Ship UX, copy, and flow changes that
              clear obvious friction—especially on mobile.
            </p>
          </article>
          <article className="how-card">
            <span className="how-step">3</span>
            <h3>Prove it</h3>
            <p>
              Run structured tests on key steps. Keep what wins, kill what
              doesn&apos;t. Weekly updates in plain English.
            </p>
          </article>
          <article className="how-card">
            <span className="how-step">4</span>
            <h3>Compound</h3>
            <p>
              Decide whether to pause, repeat a Sprint, or move into the Growth
              Loop for ongoing experiments and lifecycle work.
            </p>
          </article>
        </div>
      </section>

      {/* FAQ TEASER */}
      <section className="home-faq">
        <div className="home-faq-inner">
          <div>
            <h2 className="home-section-title">Common questions.</h2>
            <p className="home-section-intro">
              Full FAQ coming later. For now, a few quick answers to how this
              works.
            </p>
          </div>
          <ul className="home-faq-list">
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
