import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InternalNav } from "@/components/InternalNav";
import { LeadReviewForm } from "@/components/LeadReviewForm";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "Internal · Lead review",
  robots: { index: false, follow: false },
};

/*
 * Operator-only intake review. English-only by design: this is an internal
 * MaydaLabs surface, not a buyer page.
 *
 * It reviews, tags, and records manual Abidin transfers. It never contacts
 * anyone, never sends email, and never marks anything a commercial
 * opportunity — Abidin remains the canonical record.
 */
export default async function InternalLeadsPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);

  const claims = await getVerifiedClaims();
  if (!claims) redirect(localizePath("/auth/sign-in", locale));

  // Operator gate: the security_invoker view returns the caller's own row
  // iff they are in internal.operators. Non-operators get a plain 404.
  const supabase = await createSupabaseServerClient();
  const { data: operator } = await supabase
    .from("operator_status")
    .select("user_id")
    .maybeSingle();
  if (!operator) notFound();

  // RLS: operators see all intakes; this query runs as the operator.
  const { data: intakes } = await supabase
    .from("lead_intakes")
    .select(
      "id, name, email, company, company_stage, primary_constraint, desired_outcome, budget_range, timeline, message, source, locale, utm, consent_updates, review_status, internal_tags, internal_note, abidin_record_id, transferred_to_abidin_at, multiplier_map_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const dateFormat = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mayda-shell mayda-section" style={{ maxWidth: "56rem" }}>
      <InternalNav locale={locale} current="/internal/leads" />
      <header className="mayda-stack">
        <p className="mayda-kicker">Internal / Operators only</p>
        <h1 className="mayda-heading">Lead intake review</h1>
        <p className="mayda-body">
          Intakes are a buffer, not a CRM. Review here; the canonical commercial record stays
          in Abidin. Marking an intake “transferred” documents a manual transfer that already
          happened — nothing is contacted or written automatically.
        </p>
      </header>

      <div className="mayda-stack-lg" style={{ marginTop: "2.5rem" }}>
        {intakes?.length ? (
          intakes.map((intake) => (
            <article key={intake.id} className="mayda-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="mayda-subheading">
                    {intake.name} · {intake.company ?? "—"}
                  </h2>
                  <p className="mayda-mono" style={{ color: "var(--mist)", marginTop: "0.3rem" }}>
                    {intake.email} · {intake.source} · {intake.locale.toUpperCase()} ·{" "}
                    {dateFormat.format(new Date(intake.created_at))}
                  </p>
                </div>
                <span
                  className={`mayda-status ${
                    intake.review_status === "new"
                      ? "is-new"
                      : intake.review_status === "closed"
                        ? "is-muted"
                        : "is-active"
                  }`}
                >
                  {intake.review_status}
                </span>
              </div>

              <dl className="mayda-dl" style={{ marginTop: "1.2rem" }}>
                <div>
                  <dt>Signals</dt>
                  <dd>
                    {[
                      intake.company_stage && `stage: ${intake.company_stage}`,
                      intake.primary_constraint && `constraint: ${intake.primary_constraint}`,
                      intake.desired_outcome && `outcome: ${intake.desired_outcome}`,
                      intake.timeline && `timeline: ${intake.timeline}`,
                      intake.budget_range && `budget: ${intake.budget_range}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                </div>
                {intake.message ? (
                  <div>
                    <dt>Message</dt>
                    <dd style={{ whiteSpace: "pre-wrap" }}>{intake.message}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Consents</dt>
                  <dd>
                    contact: yes{intake.consent_updates ? " · updates: yes" : ""}
                    {intake.multiplier_map_id ? ` · map: ${intake.multiplier_map_id}` : ""}
                  </dd>
                </div>
                {intake.transferred_to_abidin_at ? (
                  <div>
                    <dt>Transferred</dt>
                    <dd>
                      {dateFormat.format(new Date(intake.transferred_to_abidin_at))} →{" "}
                      {intake.abidin_record_id}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div style={{ marginTop: "1.2rem", borderTop: "1px solid var(--border)", paddingTop: "1.2rem" }}>
                <LeadReviewForm
                  intakeId={intake.id}
                  initial={{
                    reviewStatus: intake.review_status,
                    tags: intake.internal_tags,
                    note: intake.internal_note ?? "",
                    abidinRecordId: intake.abidin_record_id ?? "",
                  }}
                />
              </div>
            </article>
          ))
        ) : (
          <div className="mayda-portal-empty">No intakes yet.</div>
        )}
      </div>
    </div>
  );
}
