import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Website terms",
  socialTitle: "Website terms · MaydaLabs",
  description: "Plain-language terms for using the MaydaLabs website and contacting the studio about project work.",
  path: "/terms",
});

const SECTIONS = [
  {
    number: "01",
    title: "Using this website",
    paragraphs: [
      "You may browse and share links to this website for lawful purposes. Do not attempt to disrupt the site, gain unauthorized access, scrape it in a way that harms availability, or misrepresent MaydaLabs and its work.",
    ],
  },
  {
    number: "02",
    title: "Information, not a promise",
    paragraphs: [
      "The website describes MaydaLabs capabilities, selected work, and general points of view. It is not legal, financial, tax, or other regulated professional advice.",
      "Project examples show particular products and constraints. They do not guarantee that another project will produce the same result, timeline, or commercial outcome.",
    ],
  },
  {
    number: "03",
    title: "Project engagements",
    paragraphs: [
      "A project call, email, proposal, or estimate does not by itself create a client relationship. Scope, fees, ownership, confidentiality, responsibilities, and delivery terms are agreed separately in writing for each engagement.",
    ],
  },
  {
    number: "04",
    title: "Work and intellectual property",
    paragraphs: [
      "The MaydaLabs name, site design, writing, graphics, and original website materials may not be republished or presented as someone else’s work without permission.",
      "Client and flagship product names, screenshots, and trademarks belong to their respective owners. Ownership of project deliverables is governed by the applicable project agreement.",
    ],
  },
  {
    number: "05",
    title: "Availability and external services",
    paragraphs: [
      "We aim to keep the site accurate and available, but it may change, contain errors, or be interrupted. External links and services are provided for convenience; MaydaLabs does not control their availability, content, or terms.",
    ],
  },
  {
    number: "06",
    title: "Updates",
    paragraphs: [
      "These website terms may change as the site and studio evolve. The current version will be published here with its revision date.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-hero legal-hero-terms">
        <div className="legal-shell">
          <p className="studio-kicker">Legal / Website terms</p>
          <div className="legal-hero-grid">
            <h1>Clear terms.<br /><em>Real agreements.</em></h1>
            <div>
              <p>These terms govern the public website. Actual client work is governed by a separate written project agreement.</p>
              <span>Last updated · 18 July 2026</span>
            </div>
          </div>
        </div>
      </header>

      <main className="legal-body">
        <div className="legal-shell legal-body-layout">
          <aside>
            <p>Document / ML-T01</p>
            <strong>Website terms</strong>
          </aside>
          <div className="legal-sections">
            {SECTIONS.map((section) => (
              <section key={section.number}>
                <span>{section.number}</span>
                <div>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}
            <section className="legal-contact">
              <span>07</span>
              <div>
                <h2>Contact</h2>
                <p>Questions about these terms can be sent to <a href="mailto:info@maydalabs.com">info@maydalabs.com</a>.</p>
                <Link href="/contact" className="studio-text-link">Discuss a project <span aria-hidden>↗</span></Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
