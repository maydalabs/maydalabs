import Link from "next/link";
import { PROPOSAL_COPY } from "@/components/proposalCopy";
import { RichText } from "@/components/RichText";
import { Icon } from "@/components/icons";
import { localizePath, type Locale } from "@/lib/i18n";

/*
 * Client-facing rendering of a prepared proposal: what a prospect finds
 * when they sign in after receiving an outreach note. Full mode is the
 * detail page; teaser mode is the portal card.
 */

export type ProposalRecord = {
  id: string;
  pilot_id: string;
  origin: string;
  headline: string;
  angle: string;
  observations: unknown;
  sample_title: string | null;
  sample_body: string | null;
  sample_note: string | null;
  scope: unknown;
  role_title: string | null;
  role_note: string | null;
  terms: string | null;
  cta_label: string | null;
  cta_url: string | null;
  published: boolean;
};

export type Observation = { text: string; source_url?: string | null; source_label?: string | null };
export type ScopeStep = { label: string; title: string; detail?: string | null };

export function asObservations(value: unknown): Observation[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      text: typeof item.text === "string" ? item.text : "",
      source_url: typeof item.source_url === "string" ? item.source_url : null,
      source_label: typeof item.source_label === "string" ? item.source_label : null,
    }))
    .filter((item) => item.text);
}

export function asScope(value: unknown): ScopeStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      label: typeof item.label === "string" ? item.label : "",
      title: typeof item.title === "string" ? item.title : "",
      detail: typeof item.detail === "string" ? item.detail : null,
    }))
    .filter((item) => item.title);
}

function isSafeHref(url: string | null): url is string {
  return Boolean(url && /^(https?:\/\/|mailto:)/i.test(url));
}

export function ProposalView({
  proposal,
  company,
  locale,
  mode = "full",
}: {
  proposal: ProposalRecord;
  company: string;
  locale: Locale;
  mode?: "full" | "teaser";
}) {
  const copy = PROPOSAL_COPY[locale];
  const observations = asObservations(proposal.observations);
  const scope = asScope(proposal.scope);
  const ctaHref = isSafeHref(proposal.cta_url) ? proposal.cta_url : "mailto:info@maydalabs.com";

  if (mode === "teaser") {
    return (
      <article className="mayda-proposal is-teaser">
        <p className="mayda-kicker" style={{ margin: 0 }}>
          {copy.preparedFor(company)}
          {!proposal.published ? <span className="mayda-status is-muted" style={{ marginLeft: "0.6rem" }}>{copy.draftBadge}</span> : null}
        </p>
        <h3 className="mayda-subheading" style={{ marginTop: "0.5rem" }}>{proposal.headline}</h3>
        <p className="mayda-body" style={{ marginTop: "0.6rem" }}>{proposal.angle.split(/\n{2,}/)[0]}</p>
        <Link href={localizePath("/os/pilot", locale)} className="mayda-button mayda-button-small" style={{ alignSelf: "flex-start", marginTop: "0.9rem" }}>
          {copy.openFull} <span aria-hidden>→</span>
        </Link>
      </article>
    );
  }

  return (
    <article className="mayda-proposal">
      <header className="mayda-proposal-head">
        <p className="mayda-kicker" style={{ margin: 0 }}>
          {copy.preparedFor(company)}
          {!proposal.published ? <span className="mayda-status is-muted" style={{ marginLeft: "0.6rem" }}>{copy.draftBadge}</span> : null}
        </p>
        <h2 className="mayda-heading" style={{ marginTop: "0.5rem" }}>{proposal.headline}</h2>
      </header>

      <section className="mayda-proposal-section">
        <p className="mayda-kicker">{copy.fromLabel}</p>
        {proposal.origin === "job_application" && proposal.role_title ? (
          <p className="mayda-proposal-origin">
            <Icon name="human" /> {copy.originJob(proposal.role_title)}
          </p>
        ) : proposal.origin === "referral" ? (
          <p className="mayda-proposal-origin">
            <Icon name="human" /> {copy.originReferral}
          </p>
        ) : null}
        <RichText text={proposal.angle} className="is-letter" />
        <p className="mayda-proposal-signature">— {copy.signature}</p>
      </section>

      {observations.length ? (
        <section className="mayda-proposal-section">
          <p className="mayda-kicker">{copy.noticedSection}</p>
          <ul className="mayda-observations">
            {observations.map((item, index) => (
              <li key={index}>
                <Icon name="source" />
                <div>
                  <span>{item.text}</span>
                  {isSafeHref(item.source_url ?? null) ? (
                    <a href={item.source_url!} target="_blank" rel="noopener noreferrer" className="mayda-source-chip">
                      {item.source_label || copy.sourceLabel} ↗
                    </a>
                  ) : (
                    <span className="mayda-source-chip is-unsourced">{copy.unsourced}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {proposal.sample_body ? (
        <section className="mayda-proposal-section">
          <p className="mayda-kicker">{copy.sampleSection}</p>
          <div className="mayda-sample">
            <div className="mayda-sample-bar" aria-hidden="true">
              <span /><span /><span />
              <em>{proposal.sample_title || copy.sampleDefaultTitle}</em>
            </div>
            <div className="mayda-sample-body">
              <RichText text={proposal.sample_body} />
            </div>
          </div>
          {proposal.sample_note ? (
            <p className="mayda-mono mayda-sample-note">
              {copy.sampleNoteLabel}: {proposal.sample_note}
            </p>
          ) : null}
        </section>
      ) : null}

      {proposal.origin === "job_application" && proposal.role_note ? (
        <section className="mayda-proposal-section">
          <p className="mayda-kicker">{copy.roleSection}</p>
          <RichText text={proposal.role_note} />
        </section>
      ) : null}

      {scope.length ? (
        <section className="mayda-proposal-section">
          <p className="mayda-kicker">{copy.scopeSection}</p>
          <ol className="mayda-scope">
            {scope.map((step, index) => (
              <li key={index}>
                <span className="mayda-mono">{step.label || `${index + 1}`}</span>
                <div>
                  <strong>{step.title}</strong>
                  {step.detail ? <p>{step.detail}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {proposal.terms ? (
        <section className="mayda-proposal-section">
          <p className="mayda-kicker">{copy.termsSection}</p>
          <RichText text={proposal.terms} />
        </section>
      ) : null}

      <footer className="mayda-proposal-cta">
        <a href={ctaHref} className="mayda-button" target={ctaHref.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
          {proposal.cta_label || copy.ctaDefault} <span aria-hidden>→</span>
        </a>
        <span className="mayda-body" style={{ fontSize: "0.9rem" }}>{copy.ctaSecondary}</span>
      </footer>
    </article>
  );
}
