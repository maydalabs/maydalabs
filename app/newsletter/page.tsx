import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsletter – Notes on growth and lifecycle",
  description:
    "Emayda’s occasional newsletter with tactical notes on funnels, tracking, CRO, and lifecycle for digital brands, SaaS, and service firms.",
};

export default function NewsletterPage() {

  return (
    <div className="page">
      <h1 className="page-title">Newsletter</h1>
      <p className="page-intro">
        Occasional, tactical notes on fixing funnels, tracking, and lifecycle
        without drowning in frameworks.
      </p>
      <p className="page-note">
        This page will plug into whatever email tool you decide to use. For
        now, treat it as the home for the footer subscribe form and a future
        archive.
      </p>
      <ul className="page-list">
        <li>No weekly “content calendar” pressure – only when there&apos;s
          something useful.</li>
        <li>Examples pulled from real projects (anonymised).</li>
        <li>Focus on digital brands, SaaS, and service firms.</li>
      </ul>
    </div>
  );
}
