import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Advanced ROI Quickcheck – Emayda",
  description:
    "Advanced ROI Quickcheck to estimate extra revenue from small lifts in conversion or close rate, and see which Emayda program usually fits your scenario.",
};

export default function AdvancedRoiPage() {

  return (
    <div className="page">
      <h1 className="page-title">Advanced ROI Quickcheck</h1>
      <p className="page-intro">
        A simple way to sanity-check the upside from improving your conversion
        or close rate before you change anything. This page will become the full
        calculator with real inputs, scenarios, and shareable links.
      </p>
      <p className="page-note">
        Right now it&apos;s a designed spec: the layout and logic we&apos;ll
        wire up later for AOV, sessions, conversion rate, and expected lift.
      </p>

      {/* Layout: inputs on the left, results on the right */}
      <section className="roi-advanced-layout">
        {/* Inputs + assumptions */}
        <div className="roi-panel">
          <h2 className="home-section-title">Inputs</h2>
          <p className="page-note">
            These are the numbers you&apos;ll be able to adjust in the live
            calculator.
          </p>

          <div className="roi-grid">
            <div className="roi-field">
              <div className="roi-field-label">Average order value (AOV)</div>
              <div className="roi-field-value">$120</div>
              <div className="roi-field-hint">
                Typical checkout or initial purchase value.
              </div>
            </div>

            <div className="roi-field">
              <div className="roi-field-label">Monthly sessions</div>
              <div className="roi-field-value">42,000</div>
              <div className="roi-field-hint">
                Unique monthly sessions on your primary funnel.
              </div>
            </div>

            <div className="roi-field">
              <div className="roi-field-label">Current conversion rate</div>
              <div className="roi-field-value">1.9%</div>
              <div className="roi-field-hint">
                Purchases / sign-ups divided by sessions.
              </div>
            </div>

            <div className="roi-field">
              <div className="roi-field-label">
                Target conversion / lift scenario
              </div>
              <div className="roi-field-value">2.4% (≈ +0.5pp)</div>
              <div className="roi-field-hint">
                Modest improvement, not a fantasy number.
              </div>
            </div>
          </div>

          <div className="roi-assumptions">
            <h3 className="roi-assumptions-title">Assumptions</h3>
            <ul className="page-list">
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
        <div className="roi-panel">
          <h2 className="home-section-title">Estimated upside</h2>
          <p className="page-note">
            Using the inputs on the left and a conservative lift, here&apos;s
            what the upside could look like.
          </p>

          <div className="roi-summary">
            <div className="roi-summary-main">
              <div className="roi-summary-label">Extra revenue / month</div>
              <div className="roi-summary-number">$2,880</div>
            </div>
            <div className="roi-summary-secondary">
              <div>
                <div className="roi-summary-label">Extra revenue / year</div>
                <div className="roi-summary-number">$34,560</div>
              </div>
              <div>
                <div className="roi-summary-label">
                  Break-even on typical Sprint
                </div>
                <div className="roi-summary-meta">~2–3 months</div>
              </div>
            </div>
          </div>

          <div className="roi-program-fit">
            <h3 className="roi-assumptions-title">What usually fits:</h3>
            <div className="roi-program-grid">
              <div className="roi-program-chip">
                <div className="roi-program-label">Baseline Scan</div>
                <p className="roi-program-text">
                  If your numbers are fuzzy or events are broken, we start here
                  before trusting any ROI model.
                </p>
              </div>
              <div className="roi-program-chip roi-program-chip--primary">
                <div className="roi-program-label">Momentum Sprint</div>
                <p className="roi-program-text">
                  When you already have meaningful traffic and want a focused
                  6–8 week push to realise this upside.
                </p>
              </div>
              <div className="roi-program-chip">
                <div className="roi-program-label">Growth Loop</div>
                <p className="roi-program-text">
                  For teams who want ongoing experiments and lifecycle work
                  after the initial lift.
                </p>
              </div>
            </div>
          </div>

          <div className="roi-actions">
            <Link href="/programs" className="btn btn-secondary">
              Compare programs
            </Link>
            <Link href="/contact" className="btn btn-primary">
              Talk through your numbers
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ / explainer */}
      <section className="home-faq">
        <div className="home-faq-inner">
          <div>
            <h2 className="home-section-title">What this page will do later.</h2>
            <p className="home-section-intro">
              The live calculator will let you plug in your own AOV, traffic,
              conversion, and lift scenarios, then share a link with those
              inputs prefilled.
            </p>
          </div>
          <ul className="home-faq-list">
            <li>Inputs: AOV, sessions, current CR, target CR or lift.</li>
            <li>Outputs: extra revenue / mo, / yr, and simple payback.</li>
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
