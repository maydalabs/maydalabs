import type { Metadata } from "next";
import Link from "next/link";
import { getIntroCallUrl } from "@/lib/marketingLinks";

export const metadata: Metadata = {
  title: "About",
  description:
    "MaydaLabs is a founder-led product and growth studio building software, commerce, and growth systems.",
};

export default function AboutPage() {
  return (
    <div className="studio-inner-page">
      <section className="studio-inner-hero">
        <p className="studio-kicker">About / MaydaLabs</p>
        <h1>A small studio for<br /><em>serious ideas.</em></h1>
        <p>
          MaydaLabs exists to close the distance between an ambitious idea and a product people can actually use, trust, and buy from.
        </p>
      </section>

      <section className="about-statement">
        <p>
          We are product people who understand growth, and growth people who can ship the product.
        </p>
        <div>
          <p>
            The studio is founder-led and deliberately compact. Strategy, design, engineering, and launch thinking stay connected instead of crossing a chain of account managers and handoffs.
          </p>
          <p>
            Our flagship work begins in Bitcoin because it demands real answers to difficult questions: trust, payments, global users, regulation, community, and product clarity. That edge travels well. We work with founders across industries.
          </p>
        </div>
      </section>

      <section className="about-principles">
        <div className="studio-section-heading">
          <div>
            <p className="studio-kicker">Operating principles</p>
            <h2>How we think.</h2>
          </div>
        </div>
        <div className="studio-process-grid">
          <article><span>01</span><div><h3>Make the idea legible</h3><p>Clarity is part of the product. If people cannot understand it, they cannot choose it.</p></div></article>
          <article><span>02</span><div><h3>Build against reality</h3><p>Working software teaches us more than a month of abstract debate.</p></div></article>
          <article><span>03</span><div><h3>Own the whole journey</h3><p>The product, marketing, measurement, and operations are one customer experience.</p></div></article>
          <article><span>04</span><div><h3>Use AI with judgment</h3><p>AI expands our output. Human taste and accountability decide what deserves to ship.</p></div></article>
        </div>
      </section>

      <section className="studio-inner-cta">
        <p className="studio-kicker">Work with the studio</p>
        <h2>Have a serious idea?</h2>
        <Link href={getIntroCallUrl("about_bottom")} target="_blank" rel="noopener noreferrer" className="studio-button">
          Start a conversation <span aria-hidden>↗</span>
        </Link>
      </section>
    </div>
  );
}
