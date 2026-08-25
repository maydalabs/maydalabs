import Link from "next/link";
import { InProgressVisual } from "@/components/InProgressVisual";
import { type Locale, localizePath } from "@/lib/i18n";

export type InProgressCaseCopy = {
  back: string;
  boundary: string;
  boundaryItems: readonly string[];
  boundaryKicker: string;
  boundaryTitle: string;
  built: readonly (readonly [string, string, string])[];
  builtKicker: string;
  builtTitle: string;
  cta: readonly [string, string];
  ctaKicker: string;
  hero: readonly [string, string];
  kicker: string;
  lead: string;
  next: string;
  nextItems: readonly string[];
  nextKicker: string;
  ownership: readonly (readonly [string, string])[];
  ownershipIntro: string;
  ownershipKicker: string;
  ownershipTitle: string;
  scope: string;
  scopeItems: readonly string[];
  start: string;
  status: string;
  statusNote: string;
  visitWork: string;
};

type InProgressCaseStudyProps = {
  copy: InProgressCaseCopy;
  locale: Locale;
  name: string;
  variant: "mortal" | "sofra";
};

function Arrow() {
  return <span aria-hidden>↗</span>;
}

export function InProgressCaseStudy({ copy, locale, name, variant }: InProgressCaseStudyProps) {
  return (
    <div className={`development-case development-case-${variant}`}>
      <section className="development-hero">
        <div className="development-shell development-hero-grid">
          <div className="development-hero-copy">
            <Link href={localizePath("/case-studies", locale)} className="development-back-link"><span aria-hidden>←</span> {copy.back}</Link>
            <p className="studio-kicker">{copy.kicker}</p>
            <div className="development-status"><span /> {copy.status}</div>
            <h1>{copy.hero[0]} <em>{copy.hero[1]}</em></h1>
            <p>{copy.lead}</p>
            <a href="#current-build" className="studio-text-link">{copy.visitWork} <span aria-hidden>↓</span></a>
          </div>
          <InProgressVisual locale={locale} variant={variant} />
          <div className="development-fact-rail" aria-label={`${name} status`}>
            <div><span>{copy.status}</span><strong>{copy.statusNote}</strong></div>
            <div><span>{copy.scope}</span><strong>{copy.scopeItems.join(" · ")}</strong></div>
          </div>
        </div>
      </section>

      <section id="current-build" className="development-current">
        <div className="development-shell">
          <div className="development-section-heading">
            <div><p className="studio-kicker">{copy.builtKicker}</p><h2>{copy.builtTitle}</h2></div>
            <p>{copy.boundary}</p>
          </div>
          <div className="development-build-grid">
            {copy.built.map(([number, title, description]) => (
              <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="development-ownership">
        <div className="development-shell development-ownership-layout">
          <div>
            <p className="studio-kicker">{copy.ownershipKicker}</p>
            <h2>{copy.ownershipTitle}</h2>
            <p>{copy.ownershipIntro}</p>
          </div>
          <dl>
            {copy.ownership.map(([term, detail]) => (
              <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className="development-boundaries">
        <div className="development-shell development-boundary-grid">
          <div>
            <p className="studio-kicker">{copy.boundaryKicker}</p>
            <h2>{copy.boundaryTitle}</h2>
            <ul>{copy.boundaryItems.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <p className="studio-kicker">{copy.nextKicker}</p>
            <h2>{copy.next}</h2>
            <ul>{copy.nextItems.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="studio-final-cta development-final-cta">
        <p className="studio-kicker">{copy.ctaKicker}</p>
        <h2>{copy.cta[0]}<br /><em>{copy.cta[1]}</em></h2>
        <Link href={localizePath("/contact", locale)} className="studio-button studio-button-light">{copy.start} <Arrow /></Link>
      </section>
    </div>
  );
}
