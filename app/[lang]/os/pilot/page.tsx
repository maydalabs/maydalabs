import type { Metadata } from "next";
import { OsShell } from "@/components/os/OsShell";
import { InvoicePanel, type InvoiceRecord } from "@/components/InvoicePanel";
import { PILOT_COPY } from "@/components/pilotCopy";
import { PilotSummary, type PilotUpdateRecord } from "@/components/PilotView";
import { PROPOSAL_COPY } from "@/components/proposalCopy";
import { ProposalView, type ProposalRecord } from "@/components/ProposalView";
import { requireOsSession } from "@/lib/osSession";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "MaydaOS · Pilot",
  robots: { index: false, follow: false },
};

/* The engagement, as the client sees it: what was prepared for them, where
 * the pilot stands, the published reports, and anything owed. */
export default async function OsPilotPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const { claims, supabase, credits } = await requireOsSession(locale, "pilot");
  const pilotCopy = PILOT_COPY[locale];
  const proposalCopy = PROPOSAL_COPY[locale];

  const [{ data: pilots }, { data: updates }, { data: proposals }, { data: invoices }] = await Promise.all([
    supabase
      .from("pilots")
      .select("id, company, workflow, offer, status, starts_on, ends_on, summary, next_step")
      .eq("client_user_id", claims.sub)
      .order("created_at", { ascending: false }),
    supabase
      .from("pilot_updates")
      .select("id, pilot_id, kind, title, body, period_label, output_count, approval_latency_minutes, source_coverage_pct, cost_usd, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("pilot_proposals")
      .select("id, pilot_id, origin, headline, angle, observations, sample_title, sample_body, sample_note, scope, role_title, role_note, terms, cta_label, cta_url, published")
      .eq("published", true),
    supabase
      .from("pilot_invoices")
      .select("id, pilot_id, label, amount_usd, amount_sats, rate_usd, address, status, observed_sats, txid, paid_at, expires_at")
      .order("created_at", { ascending: false }),
  ]);

  const updatesByPilot = new Map<string, PilotUpdateRecord[]>();
  for (const update of updates ?? []) {
    const list = updatesByPilot.get(update.pilot_id) ?? [];
    list.push(update);
    updatesByPilot.set(update.pilot_id, list);
  }
  const proposalByPilot = new Map<string, ProposalRecord>();
  for (const proposal of (proposals ?? []) as ProposalRecord[]) proposalByPilot.set(proposal.pilot_id, proposal);

  const rows = pilots ?? [];

  return (
    <OsShell locale={locale} app="pilot" credits={credits}>
      <div className="mayda-stack-lg">
        <h2 className="mayda-subheading" style={{ margin: 0 }}>{pilotCopy.sectionHeading}</h2>

        {rows.length === 0 ? (
          <p className="mayda-body">{pilotCopy.empty}</p>
        ) : (
          rows.map((pilot) => {
            const proposal = proposalByPilot.get(pilot.id);
            const theirInvoices = ((invoices ?? []) as (InvoiceRecord & { pilot_id: string })[]).filter(
              (invoice) => invoice.pilot_id === pilot.id,
            );
            return (
              <section key={pilot.id} className="mayda-stack-lg">
                {proposal ? (
                  <>
                    <h3 className="mayda-subheading" style={{ margin: 0 }}>{proposalCopy.portalHeading(pilot.company)}</h3>
                    <ProposalView proposal={proposal} company={pilot.company} locale={locale} />
                  </>
                ) : null}
                <PilotSummary pilot={pilot} updates={updatesByPilot.get(pilot.id) ?? []} locale={locale} />
                <InvoicePanel invoices={theirInvoices} locale={locale} />
              </section>
            );
          })
        )}
      </div>
    </OsShell>
  );
}
