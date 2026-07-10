import type { Metadata } from "next";
import Link from "next/link";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata: Metadata = {
  title: "Start a project",
  description: "Talk to MaydaLabs about your app, marketplace, commerce, or growth project.",
};

export default function ContactPage() {
  return (
    <div className="studio-inner-page">
      <section className="studio-inner-hero contact-hero">
        <p className="studio-kicker">Start a project / No hard sell</p>
        <h1>Tell us what you’re<br /><em>trying to make real.</em></h1>
        <p>
          Bring the idea, the half-built product, or the problem nobody has untangled yet. We’ll use the first conversation to find the signal and decide whether we should build together.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={getIntroCallUrl("contact_hero")} target="_blank" rel="noopener noreferrer" className="studio-button">
            Book a project call <span aria-hidden>↗</span>
          </Link>
          <a href="mailto:info@maydalabs.com" className="studio-button studio-button-ghost">
            Email the brief
          </a>
        </div>
      </section>

      <section className="contact-grid">
        <article>
          <span>01</span>
          <h2>What to bring</h2>
          <p>The problem, who it is for, what exists today, and what a useful first outcome would look like.</p>
        </article>
        <article>
          <span>02</span>
          <h2>What we’ll cover</h2>
          <p>Fit, product direction, likely scope, major risks, and the strongest first phase.</p>
        </article>
        <article>
          <span>03</span>
          <h2>What happens next</h2>
          <p>If there is a fit, we send a tailored scope, timing, and commercial proposal. Pricing is discussed after the project is understood.</p>
        </article>
      </section>

      <section className="contact-direct">
        <p className="studio-kicker">Prefer async?</p>
        <a href="mailto:info@maydalabs.com">info@maydalabs.com <span aria-hidden>↗</span></a>
        <p>We work from Istanbul with founders anywhere.</p>
      </section>
    </div>
  );
}
