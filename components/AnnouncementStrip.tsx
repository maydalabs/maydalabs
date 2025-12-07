import Link from "next/link";

export function AnnouncementStrip() {
  return (
    <div className="announcement">
      <div className="announcement-inner">
        <div className="announcement-item">
          <span className="announcement-label">Fit check</span>
          <span className="announcement-text">
            Free 15min call. We’ll identify 2–3 quick wins.
          </span>
        </div>

        <div className="announcement-item">
          <span className="announcement-label">ROI quickcheck</span>
          <span className="announcement-text">
            Estimate your upside in minutes before you change anything.
          </span>
        </div>

        <div className="announcement-item">
          <span className="announcement-label">Bitcoin-friendly</span>
          <span className="announcement-text">
            Pay via Bitcoin or card. Built for modern stacks.
          </span>
        </div>

        <div className="announcement-cta">
          <Link href="https://calendly.com/" className="announcement-link">
            Book a 15min fit check
          </Link>
        </div>
      </div>
    </div>
  );
}
