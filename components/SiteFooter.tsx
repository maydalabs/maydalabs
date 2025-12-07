import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {/* Top CTA strip */}
        <div className="footer-top">
          <div className="footer-top-text">
            <h3>Free 15min fit check call.</h3>
            <p>We&apos;ll identify 2–3 quick wins in plain English.</p>
          </div>
          <Link href="https://calendly.com/" className="footer-top-cta">
            Book a 15min fit check
          </Link>
        </div>

        {/* Email capture */}
        <div className="footer-email">
          <div className="footer-email-label">
            <h4>Subscribe to tactical notes.</h4>
            <p>Short, practical emails when there&apos;s something useful.</p>
          </div>
          <form className="footer-email-form">
            <input
              type="email"
              placeholder="you@email.com"
              className="footer-email-input"
            />
            <button type="submit" className="footer-email-button">
              Subscribe
            </button>
          </form>
        </div>

        {/* Link grid */}
        <div className="footer-grid">
          <div className="footer-column">
            <h5>Programs</h5>
            <ul>
              <li>
                <Link href="/programs" className="footer-link">
                  Baseline Scan
                </Link>
              </li>
              <li>
                <Link href="/programs" className="footer-link">
                  Momentum Sprint
                </Link>
              </li>
              <li>
                <Link href="/programs" className="footer-link">
                  Growth Loop
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="footer-link">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/roi-quickcheck" className="footer-link">
                  ROI Quickcheck
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h5>Resources</h5>
            <ul>
              <li>
                <Link href="/projects" className="footer-link">
                  Case studies
                </Link>
              </li>
              <li>
                <Link href="/playbooks" className="footer-link">
                  Playbooks
                </Link>
              </li>
              <li>
                <Link href="/newsletter" className="footer-link">
                  Newsletter
                </Link>
              </li>
              <li>
                <Link href="/contact" className="footer-link">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h5>Company</h5>
            <ul>
              <li>
                <Link href="/about" className="footer-link">
                  About
                </Link>
              </li>
              {/* Keep the rest commented until they exist */}
              {/* <li><Link href="/careers" className="footer-link">Careers</Link></li> */}
              {/* <li><Link href="/partners" className="footer-link">Partners</Link></li> */}
            </ul>
          </div>

          <div className="footer-column">
            <h5>Legal</h5>
            <ul>
              <li>
                <Link href="/privacy" className="footer-link">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="footer-link">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <span>
            © {year} Emayda · Sustainable growth partner for digital brands.
          </span>
          <span>Built on Next.js &amp; Vercel.</span>
        </div>
      </div>
    </footer>
  );
}
