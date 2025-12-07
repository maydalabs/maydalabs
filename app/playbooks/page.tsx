import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playbooks – Funnels, tracking, and lifecycle",
  description:
    "Short, practical playbooks from Emayda for fixing common growth problems – tracking sanity checks, funnel tuning, and lifecycle flows.",
};

export default function PlaybooksPage() {

  return (
    <div className="page">
      <h1 className="page-title">Playbooks</h1>
      <p className="page-intro">
        Short, practical playbooks for fixing common growth problems – from
        broken tracking to underperforming funnels and lifecycle flows.
      </p>
      <p className="page-note">
        This section will eventually hold a library of focused playbooks you can
        read, implement, or use as a starting point for a Sprint.
      </p>
      <ul className="page-list">
        <li>Tracking sanity check for GA4 and pixels.</li>
        <li>Homepage and offer clarity tuning.</li>
        <li>Cart, checkout, and form friction audits.</li>
        <li>Lifecycle basics: abandon, post-purchase, win-back.</li>
      </ul>
    </div>
  );
}
