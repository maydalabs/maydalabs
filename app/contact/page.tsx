import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="page">
      <h1 className="page-title">Contact</h1>
      <p className="page-intro">
        Easiest way to start is a short fit check call. If you prefer email,
        send a quick snapshot of your traffic, stack, and goals and we&apos;ll
        take it from there.
      </p>

      {/* Fit check strip */}
      <section className="home-roi" style={{ paddingTop: 0 }}>
        <div className="home-roi-inner">
          <div>
            <h2 className="home-section-title">Book a 15&nbsp;min fit check.</h2>
            <p className="home-section-intro">
              We&apos;ll look at your current funnel, ask a few focused
              questions, and tell you in plain English whether a Scan, Sprint,
              or Growth Loop makes sense – or if you&apos;re better off doing
              something else first.
            </p>
            <ul className="home-roi-list">
              <li>No sales script, no pressure.</li>
              <li>We can screen-share if it&apos;s useful.</li>
              <li>You leave with 2–3 concrete ideas, either way.</li>
            </ul>
          </div>
          <div className="home-roi-cta">
            <Link href="https://calendly.com/" className="btn btn-primary">
              Book a 15&nbsp;min fit check
            </Link>
          </div>
        </div>
      </section>

      {/* Email + what to include */}
      <section className="home-faq">
        <div className="home-faq-inner">
          <div>
            <h2 className="home-section-title">Prefer email?</h2>
            <p className="home-section-intro">
              Send a short note with a few basics and we&apos;ll reply with
              thoughts and next steps.
            </p>
            <p className="page-note">
              Email:{" "}
              <a href="mailto:hello@emayda.com" className="footer-link">
                hello@emayda.com
              </a>{" "}
              (you can change this address later to match MaydaLabs).
            </p>
          </div>
          <div>
            <p className="page-note">Useful things to include:</p>
            <ul className="page-list">
              <li>Your website / product URL and rough monthly sessions.</li>
              <li>
                What you&apos;re trying to grow (revenue, MRR, qualified leads,
                something else).
              </li>
              <li>
                Anything you already know is broken (tracking, mobile UX,
                lifecycle, etc.).
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
