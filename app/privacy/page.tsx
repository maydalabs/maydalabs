import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Privacy notice",
  socialTitle: "Privacy notice · MaydaLabs",
  description: "How MaydaLabs handles information from this website, analytics, email, and project-call scheduling.",
  path: "/privacy",
});

const SECTIONS = [
  {
    number: "01",
    title: "Information we receive",
    paragraphs: [
      "When you email MaydaLabs or schedule a project call, we receive the information you choose to provide, such as your name, email address, company, and project context.",
      "The website uses Vercel Analytics to understand page visits and high-level interactions. If Google Tag Manager or advertising tags are activated later, this notice will be updated to reflect the additional technology in use.",
    ],
  },
  {
    number: "02",
    title: "How it is used",
    paragraphs: [
      "We use this information to respond to enquiries, evaluate potential projects, operate and improve the website, understand which work is useful to visitors, and maintain the security of our systems.",
      "We do not sell personal information. We do not use project enquiries to send unrelated bulk marketing without permission.",
    ],
  },
  {
    number: "03",
    title: "Service providers and external links",
    paragraphs: [
      "The site is hosted on Vercel and links to Calendly for scheduling. Email is handled through Google Workspace. Those providers process information under their own terms and privacy notices.",
      "Links to HodlStay, Satoshi Gazette, LinkedIn, and other external sites take you outside MaydaLabs. Their privacy practices are controlled by their respective operators.",
    ],
  },
  {
    number: "04",
    title: "Retention and your choices",
    paragraphs: [
      "Enquiry records are kept only as long as reasonably needed for the conversation, a potential or active engagement, legal obligations, and basic business records.",
      "You may ask what contact information we hold about you, request a correction, or ask us to delete it where applicable by emailing info@maydalabs.com.",
    ],
  },
  {
    number: "05",
    title: "Updates",
    paragraphs: [
      "This notice may change when the site, analytics setup, or services change. The latest version will remain available on this page with its revision date.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="legal-hero">
        <div className="legal-shell">
          <p className="studio-kicker">Legal / Privacy</p>
          <div className="legal-hero-grid">
            <h1>Privacy,<br /><em>without fog.</em></h1>
            <div>
              <p>A plain-language account of the information involved when you visit MaydaLabs, email us, or schedule a project conversation.</p>
              <span>Last updated · 18 July 2026</span>
            </div>
          </div>
        </div>
      </header>

      <main className="legal-body">
        <div className="legal-shell legal-body-layout">
          <aside>
            <p>Document / ML-P01</p>
            <strong>Website privacy notice</strong>
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
              <span>06</span>
              <div>
                <h2>Contact</h2>
                <p>Questions about this notice or the information connected to your enquiry can be sent to <a href="mailto:info@maydalabs.com">info@maydalabs.com</a>.</p>
                <Link href="/contact" className="studio-text-link">Go to contact <span aria-hidden>↗</span></Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
