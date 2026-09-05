import { ProjectStack } from "@/components/StackStrip";
import type { StackItem } from "@/lib/stack";
import Image from "next/image";
import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n";
import { SERVICES_COPY } from "@/lib/services";

/*
 * The v3 case standard: every case answers the same questions in the same
 * order — context, constraint, exact scope, what was built, verifiable
 * evidence, current status, ownership — with explicit boundaries where a
 * product is private, alpha, or demo-stage. No metrics appear unless the
 * underlying source can be inspected.
 */

export type CaseSection = {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
};

export type CaseStudyCopy = {
  back: string;
  kicker: string;
  ownershipTag: string;
  statusTag: string;
  title: readonly [string, string];
  lead: string;
  visit?: { label: string; url: string };
  railLabel: string;
  rail: readonly (readonly [string, string])[];
  sections: readonly CaseSection[];
  boundaries?: { heading: string; items: readonly string[] };
  gallery?: readonly { src: string; alt: string; caption: string }[];
  galleryHost?: string;
  ctaKicker: string;
  ctaHeading: string;
  ctaStart: string;
  ctaWork: string;
};

const STACK_LABEL: Record<Locale, string> = { en: "Stack", tr: "Yığın", fr: "Pile technique" };

export function CaseStudy({ locale, copy, stack }: { locale: Locale; copy: CaseStudyCopy; stack?: StackItem[] }) {
  return (
    <div className="mayda-shell">
      <section className="mayda-case-hero mayda-stack">
        <Link
          href={localizePath("/case-studies", locale)}
          className="mayda-text-link"
          style={{ alignSelf: "flex-start" }}
        >
          ← {copy.back}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mayda-tag is-cobalt">{copy.ownershipTag}</span>
          <span className="mayda-tag is-mint">{copy.statusTag}</span>
        </div>
        <p className="mayda-kicker" style={{ margin: 0 }}>
          {copy.kicker}
        </p>
        <h1 className="mayda-display" style={{ fontSize: "clamp(2.2rem,5.4vw,4rem)" }}>
          {copy.title[0]}
          <br />
          <span className="mayda-multiply">{copy.title[1]}</span>
        </h1>
        <p className="mayda-lead">{copy.lead}</p>
        {copy.visit ? (
          <div>
            <a
              href={copy.visit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mayda-button"
            >
              {copy.visit.label} <span aria-hidden>↗</span>
            </a>
          </div>
        ) : null}
        <div className="mayda-case-rail" aria-label={copy.railLabel}>
          {copy.rail.map(([term, detail]) => (
            <div key={term}>
              <span>{term}</span>
              <strong>{detail}</strong>
            </div>
          ))}
        </div>
      </section>

      {stack?.length ? <ProjectStack items={stack} label={STACK_LABEL[locale]} /> : null}


      {copy.sections.map((section) => (
        <section key={section.heading} className="mayda-case-section">
          <header>
            <h2>{section.heading}</h2>
          </header>
          <div className="mayda-case-section-body">
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
            {section.items ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item.slice(0, 32)}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}

      {copy.boundaries ? (
        <section className="mayda-case-section">
          <header>
            <h2>{copy.boundaries.heading}</h2>
          </header>
          <div className="mayda-case-section-body">
            <ul>
              {copy.boundaries.items.map((item) => (
                <li key={item.slice(0, 32)}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {copy.gallery?.length ? (
        <section className="mayda-case-gallery">
          {copy.gallery.map((figure) => (
            <figure key={figure.src}>
              {copy.galleryHost ? (
                <div className="mayda-browser-chrome">
                  <div aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span>{copy.galleryHost}</span>
                </div>
              ) : null}
              <Image src={figure.src} alt={figure.alt} width={1430} height={894} sizes="(max-width: 860px) 100vw, 46vw" />
              <figcaption>{figure.caption}</figcaption>
            </figure>
          ))}
        </section>
      ) : null}

      <section className="mayda-final-cta">
        <p className="mayda-kicker" style={{ margin: 0 }}>
          {copy.ctaKicker}
        </p>
        <h2 className="mayda-heading">{copy.ctaHeading}</h2>
        <div className="mayda-hero-actions" style={{ justifyContent: "center" }}>
          <Link href={localizePath("/contact", locale)} className="mayda-button">
            {SERVICES_COPY[locale].cta} <span aria-hidden>→</span>
          </Link>
          <Link href={localizePath("/case-studies", locale)} className="mayda-button mayda-button-outline">
            {copy.ctaWork}
          </Link>
        </div>
      </section>
    </div>
  );
}
