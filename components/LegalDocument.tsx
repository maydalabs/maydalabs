import Link from "next/link";
import { type Locale, localizePath } from "@/lib/i18n";

type LegalDocumentProps = {
  locale: Locale;
  variant?: "terms";
  kicker: string;
  heading: readonly [string, string];
  introduction: string;
  updated: string;
  documentId: string;
  documentTitle: string;
  sections: ReadonlyArray<{ number: string; title: string; paragraphs: readonly string[] }>;
  contactNumber: string;
  contactTitle: string;
  contactCopy: string;
  contactLink: string;
};

export function LegalDocument({ locale, variant, kicker, heading, introduction, updated, documentId, documentTitle, sections, contactNumber, contactTitle, contactCopy, contactLink }: LegalDocumentProps) {
  return (
    <div className="legal-page">
      <header className={`legal-hero ${variant === "terms" ? "legal-hero-terms" : ""}`}>
        <div className="legal-shell"><p className="studio-kicker">{kicker}</p><div className="legal-hero-grid"><h1>{heading[0]}<br /><em>{heading[1]}</em></h1><div><p>{introduction}</p><span>{updated}</span></div></div></div>
      </header>
      <main className="legal-body"><div className="legal-shell legal-body-layout"><aside><p>{documentId}</p><strong>{documentTitle}</strong></aside><div className="legal-sections">
        {sections.map((section) => <section key={section.number}><span>{section.number}</span><div><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}
        <section className="legal-contact"><span>{contactNumber}</span><div><h2>{contactTitle}</h2><p>{contactCopy} <a href="mailto:info@maydalabs.com">info@maydalabs.com</a>.</p><Link href={localizePath("/contact", locale)} className="studio-text-link">{contactLink} <span aria-hidden>↗</span></Link></div></section>
      </div></div></main>
    </div>
  );
}
