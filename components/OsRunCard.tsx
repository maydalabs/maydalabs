import { decideOsRunAction, recordOsOutcomeAction } from "@/app/actions/os";
import { OsCopyButton } from "@/components/OsCopyButton";
import type { OsDeskCopy } from "@/components/osCopy";
import type { OsDecision, OsShape } from "@/lib/os";

export type OsRunRecord = {
  id: string;
  shape: OsShape;
  topic: string;
  sources: unknown;
  status: "drafted" | "failed";
  draft: string | null;
  claims: unknown;
  decision: OsDecision;
  decision_note: string | null;
  published_url?: string | null;
  error: string | null;
  created_at: string;
};

type Claim = { text: string; source_url: string | null };
type Source = { url: string; title: string };

function asClaims(value: unknown): Claim[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const claim = item as Record<string, unknown>;
    if (typeof claim.text !== "string") return [];
    return [{ text: claim.text, source_url: typeof claim.source_url === "string" ? claim.source_url : null }];
  });
}

function asSources(value: unknown): Source[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    if (typeof source.url !== "string") return [];
    return [{ url: source.url, title: typeof source.title === "string" ? source.title : source.url }];
  });
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function OsRunCard({
  run,
  copy,
  exampleLabel,
}: {
  run: OsRunRecord;
  copy: OsDeskCopy;
  /* Set for the built-in example: it is read-only and says so. */
  exampleLabel?: string;
}) {
  const claims = asClaims(run.claims);
  const sources = asSources(run.sources);

  return (
    <article className="mayda-card mayda-os-run">
      <div className="mayda-os-run-head">
        <div>
          <p className="mayda-kicker" style={{ margin: 0 }}>{copy.shapes[run.shape]}</p>
          <strong>{run.topic}</strong>
        </div>
        <span className={`mayda-status${run.decision === "approved" ? " is-active" : ""}`}>
          {exampleLabel ?? copy.decisions[run.decision]}
        </span>
      </div>

      {run.status === "failed" ? (
        <p className="mayda-body">{copy.failed}{run.error ? ` (${run.error})` : ""}</p>
      ) : (
        <>
          <div>
            <p className="mayda-kicker">{copy.draftLabel}</p>
            <div className="mayda-os-draft">
              {(run.draft ?? "").split(/\n{2,}/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {claims.length > 0 ? (
            <div>
              <p className="mayda-kicker">{copy.claimsLabel}</p>
              <ul className="mayda-os-claims">
                {claims.map((claim, index) => (
                  <li key={index} className={claim.source_url ? undefined : "is-unsourced"}>
                    <span>{claim.text}</span>
                    {claim.source_url ? (
                      <a href={claim.source_url} target="_blank" rel="noopener noreferrer" className="mayda-inline-link">
                        {hostOf(claim.source_url)} <span aria-hidden>↗</span>
                      </a>
                    ) : (
                      <em>{copy.unsourced}</em>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {exampleLabel ? (
            <div className="mayda-os-decide">
              <OsCopyButton text={run.draft ?? ""} label={copy.copy} done={copy.copied} />
            </div>
          ) : run.decision === "pending" ? (
            <form action={decideOsRunAction} className="mayda-os-decide">
              <input type="hidden" name="runId" value={run.id} />
              <label className="mayda-field" style={{ flex: "1 1 16rem" }}>
                <span>{copy.noteLabel}</span>
                <input name="note" maxLength={1000} />
              </label>
              <div className="mayda-hero-actions" style={{ gap: "0.6rem" }}>
                <button type="submit" name="decision" value="approved" className="mayda-button">{copy.approve}</button>
                <button type="submit" name="decision" value="rejected" className="mayda-button mayda-button-outline">{copy.reject}</button>
              </div>
            </form>
          ) : (
            <div className="mayda-stack" style={{ gap: "0.7rem" }}>
              <div className="mayda-os-decide">
                <OsCopyButton text={run.draft ?? ""} label={copy.copy} done={copy.copied} />
                {run.decision_note ? <p className="mayda-note" style={{ margin: 0 }}>{run.decision_note}</p> : null}
              </div>

              {run.decision === "approved" ? (
                run.published_url ? (
                  <p className="mayda-note" style={{ margin: 0 }}>
                    {copy.outcomeLabel}{" "}
                    <a href={run.published_url} target="_blank" rel="noopener noreferrer" className="mayda-inline-link">
                      {hostOf(run.published_url)} <span aria-hidden>↗</span>
                    </a>
                  </p>
                ) : (
                  <form action={recordOsOutcomeAction} className="mayda-os-decide">
                    <input type="hidden" name="runId" value={run.id} />
                    <label className="mayda-field" style={{ flex: "1 1 18rem" }}>
                      <span>{copy.outcomeLabel}</span>
                      <input name="publishedUrl" type="url" placeholder="https://" maxLength={500} />
                    </label>
                    <button type="submit" className="mayda-button mayda-button-outline">{copy.outcomeSave}</button>
                  </form>
                )
              ) : null}
              {run.decision === "approved" && !run.published_url ? (
                <p className="mayda-note" style={{ margin: 0 }}>{copy.outcomeNote}</p>
              ) : null}
            </div>
          )}
        </>
      )}

      {sources.length > 0 ? (
        <p className="mayda-os-sources">
          {sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{hostOf(source.url)}</a>
          ))}
        </p>
      ) : null}
    </article>
  );
}
