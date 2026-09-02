import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InternalNav } from "@/components/InternalNav";
import {
  AddPilotUpdateForm,
  CreatePilotForm,
  DeleteUpdateButton,
  UpdatePilotForm,
} from "@/components/PilotForms";
import { DeleteProposalButton, ProposalForm } from "@/components/ProposalForm";
import { ProposalView, type ProposalRecord } from "@/components/ProposalView";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "Internal · Pilots",
  robots: { index: false, follow: false },
};

/*
 * Operator-only pilot management: create the engagement record, move its
 * status, and publish the weekly reports clients see in their portal.
 * English-only internal surface.
 */
export default async function InternalPilotsPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);

  const claims = await getVerifiedClaims();
  if (!claims) redirect(localizePath("/auth/sign-in", locale));

  const supabase = await createSupabaseServerClient();
  const { data: operator } = await supabase.from("operator_status").select("user_id").maybeSingle();
  if (!operator) notFound();

  const [{ data: pilots }, { data: updates }, { data: proposals }] = await Promise.all([
    supabase
      .from("pilots")
      .select("id, client_user_id, client_email, company, workflow, offer, status, starts_on, ends_on, summary, next_step, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("pilot_updates")
      .select("id, pilot_id, kind, title, period_label, published, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("pilot_proposals")
      .select("id, pilot_id, origin, headline, angle, observations, sample_title, sample_body, sample_note, scope, role_title, role_note, terms, cta_label, cta_url, published"),
  ]);
  const proposalByPilot = new Map<string, ProposalRecord>();
  for (const proposal of (proposals ?? []) as ProposalRecord[]) proposalByPilot.set(proposal.pilot_id, proposal);

  const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

  return (
    <div className="mayda-shell mayda-section" style={{ maxWidth: "60rem" }}>
      <InternalNav locale={locale} current="/internal/pilots" />
      <header className="mayda-stack">
        <p className="mayda-kicker">Internal / Operators only</p>
        <h1 className="mayda-heading">Pilots</h1>
        <p className="mayda-body">
          One record per engagement. Status, summary, and next step are visible to the client
          in their portal; updates marked “published” appear there as reports. A pilot created
          for an email without an account attaches itself when that person signs in. The
          “prepared for you” proposal is what a prospect finds first: author it before the
          outreach note goes out, keep it a draft until the note is sent, then publish.
        </p>
      </header>

      <div className="mayda-stack-lg" style={{ marginTop: "2rem" }}>
        <CreatePilotForm />

        {pilots?.length ? (
          pilots.map((pilot) => {
            const pilotUpdates = (updates ?? []).filter((update) => update.pilot_id === pilot.id);
            return (
              <article key={pilot.id} className="mayda-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="mayda-subheading">
                      {pilot.company} · {pilot.workflow}
                    </h2>
                    <p className="mayda-mono" style={{ color: "var(--mist)", marginTop: "0.3rem" }}>
                      {pilot.client_email} · {pilot.offer} · created {dateFormat.format(new Date(pilot.created_at))} ·{" "}
                      {pilot.client_user_id ? "account attached" : "awaiting client sign-in"}
                    </p>
                  </div>
                  <span className={`mayda-status ${pilot.status === "completed" ? "is-muted" : "is-active"}`}>
                    {pilot.status}
                  </span>
                </div>

                <div style={{ marginTop: "1.2rem", borderTop: "1px solid var(--border)", paddingTop: "1.2rem" }}>
                  <UpdatePilotForm pilot={pilot} />
                </div>

                <div style={{ marginTop: "1.2rem", borderTop: "1px solid var(--border)", paddingTop: "1.2rem" }}>
                  {(() => {
                    const proposal = proposalByPilot.get(pilot.id) ?? null;
                    return (
                      <div className="mayda-stack" style={{ gap: "0.8rem" }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="mayda-kicker" style={{ margin: 0 }}>
                            Prepared for you ·{" "}
                            {proposal ? (proposal.published ? "published" : "draft, hidden from client") : "not written yet"}
                          </p>
                          {proposal ? <DeleteProposalButton proposalId={proposal.id} /> : null}
                        </div>
                        {proposal ? (
                          <details className="mayda-details">
                            <summary>Preview exactly as the client sees it</summary>
                            <div style={{ marginTop: "1rem" }}>
                              <ProposalView proposal={proposal} company={pilot.company} locale="en" />
                            </div>
                          </details>
                        ) : null}
                        <ProposalForm pilotId={pilot.id} proposal={proposal} />
                      </div>
                    );
                  })()}
                </div>

                <div style={{ marginTop: "1.2rem", borderTop: "1px solid var(--border)", paddingTop: "1.2rem" }}>
                  <p className="mayda-kicker">Updates ({pilotUpdates.length})</p>
                  {pilotUpdates.length ? (
                    <div className="mayda-stack" style={{ gap: "0.5rem", marginBottom: "1rem" }}>
                      {pilotUpdates.map((update) => (
                        <div key={update.id} className="mayda-row">
                          <div>
                            <strong>
                              {update.period_label ? `${update.period_label} · ` : ""}
                              {update.title}
                            </strong>
                            <small>
                              {update.kind} · {dateFormat.format(new Date(update.created_at))} ·{" "}
                              {update.published ? "published" : "draft (hidden from client)"}
                            </small>
                          </div>
                          <DeleteUpdateButton updateId={update.id} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <AddPilotUpdateForm pilotId={pilot.id} />
                </div>
              </article>
            );
          })
        ) : (
          <div className="mayda-portal-empty">No pilots yet. Create the first one above.</div>
        )}
      </div>
    </div>
  );
}
