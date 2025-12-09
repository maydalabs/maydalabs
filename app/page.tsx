import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mayda Labs – Growth partner for digital-first brands",
  description:
    "Mayda Labs works with digital brands, SaaS, and service firms who already have traffic but need clean tracking, focused CRO sprints, and lifecycle systems to turn that traffic into revenue.",
};

export default function HomePage() {
  return (
    <div className="home">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-hero-kicker">
              GROWTH PARTNER · DIGITAL-FIRST BRANDS
            </p>
            <h1 className="home-hero-title">
              Turn underperforming traffic into meetings, clients, and revenue.
            </h1>
            <p className="home-hero-subtitle">
              Mayda Labs works with digital brands, SaaS, and service firms who
              already have visitors—but need clean tracking, focused CRO
              sprints, and AI-assisted lifecycle systems to turn that traffic
              into revenue.
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
              Led by an operator who&apos;s built and scaled revenue systems for
              ecommerce and Bitcoin-native brands—now available as a focused
              growth partner instead of a big agency.
            </p>
          </div>

          <div className="home-hero-console">
            <div className="console-card console-card-main">
              <div className="console-status-row">
                <span className="console-status-label">Revenue console</span>
                <span className="console-status-pill">Live</span>
              </div>

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
                Based on a modest lift in close rate. We&apos;ll validate this in your
                Baseline Scan.
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
        <h2 className="home-section-title">Who this is for</h2>
        <p className="home-section-intro">
          Teams who already have traffic—but know their funnel, follow-up, and
          tracking are leaving money on the table.
        </p>
        <div className="home-icp-grid">
          <div className="icp-card">
            <h3>Commerce &amp; product brands</h3>
            <p>
              DTC stores and product companies with steady traffic but 1–3%
              conversion, patchy tracking, and no real testing cadence.
            </p>
          </div>
          <div className="icp-card">
            <h3>SaaS &amp; platforms</h3>
            <p>
              Apps where the leaks live between sign-up, activation, and
              upgrade—across the website, in-product, and lifecycle.
            </p>
          </div>
          <div className="icp-card">
            <h3>Service firms &amp; practices</h3>
            <p>
              Agencies, studios, and law firms whose website and funnels should
              be feeding more qualified consultations instead of just looking
              “nice”.
            </p>
          </div>
        </div>
      </section>

      {/* PROGRAMS TEASER */}
      <section className="home-programs">
        <div className="home-programs-header">
          <h2 className="home-section-title">Pick your starting point.</h2>
          <p className="home-section-intro">
            Most teams start with a Momentum Sprint. Baseline Scan is a lighter
            on-ramp when you know something&apos;s off but aren&apos;t sure
            where to begin. Growth Loop keeps the wins compounding once the
            basics are fixed.
          </p>
        </div>

        <div className="home-programs-grid">
          {/* Baseline Scan */}
          <article className="program-card">
            <div className="program-tag">Diagnostic</div>
            <h3>Baseline Scan</h3>
            <p className="program-subtitle">
              For teams who want clarity first: what&apos;s working, what&apos;s
              broken, and where the biggest upside is hiding.
            </p>
            <ul className="program-list">
              <li>Deep review of tracking, funnels, and key flows.</li>
              <li>Plain-English report on where you&apos;re leaking revenue.</li>
              <li>Prioritised 6–12 week growth roadmap you can execute.</li>
            </ul>
            <p className="program-meta">
              One-time fixed fee. Credited against a Momentum Sprint if we keep
              working together.
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
              6–8 weeks to clean up tracking, fix the worst leaks, and ship
              changes that actually move revenue.
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
              Duration: 6–8 weeks. Fixed scope &amp; fee, clear success metrics
              agreed up front.
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
              For teams who want a steady testing and lifecycle cadence after
              the first Sprint, not one-off projects.
            </p>
            <ul className="program-list">
              <li>Monthly experiment cycles on key pages and flows.</li>
              <li>AI-assisted lifecycle campaigns and segmentation.</li>
              <li>Monthly report plus quarterly reset on priorities.</li>
            </ul>
            <p className="program-meta">
              Duration: 3+ months. Monthly engagement with a clear workload and
              room to pause after each cycle.
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
            <h2 className="home-section-title">
              Sanity-check your upside before you change anything.
            </h2>
            <p className="home-section-intro">
              Use the Advanced ROI Quickcheck to plug in your AOV, sessions, and
              conversion rate and see what a small lift could mean in real
              revenue.
            </p>
            <ul className="home-roi-list">
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
          <div className="home-roi-cta">
            <Link href="/roi-quickcheck" className="btn btn-secondary">
              Open ROI Quickcheck
            </Link>
          </div>
        </div>
      </section>

      {/* CASE SPOTLIGHT */}
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

          {/* NEW CTA → projects page */}
          <div style={{ marginTop: "1rem" }}>
            <Link href="/projects" className="btn btn-secondary">
              View all projects
            </Link>
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
