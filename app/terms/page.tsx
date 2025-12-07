import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms – Emayda",
  description:
    "Basic terms for using the Emayda site and engaging with Emayda as a growth partner.",
};

export default function TermsPage() {

  return (
    <div className="page">
      <h1 className="page-title">Terms</h1>
      <p className="page-intro">
        Basic terms for using the site and engaging with Emayda as a growth
        partner.
      </p>
      <p className="page-note">
        This placeholder will be replaced with a proper terms document. The aim
        is to keep things simple, fair, and readable – not a 20-page wall of
        legal boilerplate.
      </p>
      <ul className="page-list">
        <li>How information on the site can and can&apos;t be used.</li>
        <li>Scope of responsibility around advice and content.</li>
        <li>High-level engagement expectations for client work.</li>
      </ul>
    </div>
  );
}
