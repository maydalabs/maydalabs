import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <h1 className="page-title">Page not found</h1>
      <p className="page-intro">
        Either this page never existed, or it&apos;s something we haven&apos;t
        shipped yet.
      </p>
      <p className="page-note">
        If you were expecting a specific case study or playbook, feel free to{" "}
        <Link href="/contact" className="footer-link">
          reach out directly
        </Link>
        .
      </p>
      <div style={{ marginTop: "1rem" }}>
        <Link href="/" className="btn btn-secondary">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
