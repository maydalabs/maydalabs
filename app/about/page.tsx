import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About – Emayda growth partner",
  description:
    "Emayda is a focused growth partner for digital brands, combining CRO, analytics, and lifecycle systems with a bias for shipping and clear communication.",
};

export default function AboutPage() {

  return (
    <div className="page">
      <h1 className="page-title">About Emayda</h1>
      <p className="page-intro">
        Emayda is a focused growth partner for digital brands. The work sits
        where analytics, UX, and lifecycle meet – with a simple goal: turn
        underperforming traffic into meetings, clients, and revenue.
      </p>

      <p className="page-note">
        Soon this will be renamed to MaydaLabs, but the core stays the same:
        less “agency noise”, more clean systems and measurable lifts.
      </p>

      <h2 className="home-section-title" style={{ marginTop: "1.5rem" }}>
        Where Emayda fits
      </h2>
      <p className="page-note">
        Emayda is for teams who already have some traction but know their
        numbers and flows aren&apos;t where they should be:
      </p>
      <ul className="page-list">
        <li>Traffic is “okay”, but revenue per visitor is underwhelming.</li>
        <li>
          Tracking is half-broken – GA4, pixels, and events don&apos;t fully
          agree.
        </li>
        <li>
          Funnels and lifecycle were built incrementally and now feel bolted
          together.
        </li>
      </ul>

      <h2 className="home-section-title" style={{ marginTop: "1.5rem" }}>
        How we work
      </h2>
      <ul className="page-list">
        <li>
          <strong>Baseline first.</strong> Clean up data and understand the real
          funnel before throwing tests at it.
        </li>
        <li>
          <strong>Ship fast.</strong> Short sprints, visible changes,
          documented decisions. No 6-month “strategy deliverables”.
        </li>
        <li>
          <strong>Compound.</strong> Keep what works, kill what doesn&apos;t,
          and build a simple rhythm around experiments and lifecycle.
        </li>
      </ul>

      <h2 className="home-section-title" style={{ marginTop: "1.5rem" }}>
        Who&apos;s behind it
      </h2>
      <p className="page-note">
        Emayda is run by a practitioner, not a committee. The person you talk to
        is the person who touches your funnels, analytics, and flows. No layers
        of account managers, no mystery team.
      </p>
      <p className="page-note">
        Background spans ecommerce, SaaS, and Bitcoin-native projects – with a
        bias toward self-serve products and businesses that live or die by
        their website performance.
      </p>
    </div>
  );
}
