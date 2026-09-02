import Link from "next/link";
import { type Locale, localizePath } from "@/lib/i18n";

type LegalDocumentProps = {
  locale: Locale;
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

export function LegalDocument({
  locale,
  kicker,
  heading,
  introduction,
  updated,
  documentId,
  documentTitle,
  sections,
  contactNumber,
  contactTitle,
  contactCopy,
  contactLink,
}: LegalDocumentProps) {
  return (
    <div className="mayda-shell mayda-section" style={{ maxWidth: "52rem" }}>
      <header className="mayda-stack" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
        <p className="mayda-kicker">{kicker}</p>
        <h1 className="mayda-heading">
          {heading[0]} <span className="mayda-multiply">{heading[1]}</span>
        </h1>
        <p className="mayda-body">{introduction}</p>
        <p className="mayda-mono" style={{ color: "var(--mist)" }}>
          {documentId} · {documentTitle} · {updated}
        </p>
      </header>

      <div className="mayda-stack-lg" style={{ marginTop: "2.5rem" }}>
        {sections.map((section) => (
          <section key={section.number} className="flex gap-5">
            <span className="mayda-card-number" style={{ paddingTop: "0.35rem" }}>
              {section.number}
            </span>
            <div className="mayda-stack" style={{ gap: "0.7rem" }}>
              <h2 className="mayda-subheading">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="mayda-body" style={{ maxWidth: "44rem" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}

        <section className="flex gap-5">
          <span className="mayda-card-number" style={{ paddingTop: "0.35rem" }}>
            {contactNumber}
          </span>
          <div className="mayda-stack" style={{ gap: "0.7rem" }}>
            <h2 className="mayda-subheading">{contactTitle}</h2>
            <p className="mayda-body">
              {contactCopy} <a href="mailto:info@maydalabs.com" className="mayda-text-link">info@maydalabs.com</a>.
            </p>
            <Link href={localizePath("/contact", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
              {contactLink} <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
