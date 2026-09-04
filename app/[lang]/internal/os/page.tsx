import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InternalNav } from "@/components/InternalNav";
import { GrantCreditsForm } from "@/components/GrantCreditsForm";
import { OsWorkflowForm } from "@/components/OsWorkflowForm";
import type { OsWorkflow } from "@/lib/os";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "Internal · MaydaOS",
  robots: { index: false, follow: false },
};

/*
 * Who is using the beta, how hard, and what it is costing.
 *
 * Credit burn is the warmest lead signal available: somebody who spent ten
 * credits in two days and approved eight of them is worth a note more than
 * anyone who filled in a contact form. So the list is sorted by it.
 */
export default async function InternalOsPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);

  const claims = await getVerifiedClaims();
  if (!claims) redirect(localizePath("/auth/sign-in", locale));

  const supabase = await createSupabaseServerClient();
  const { data: operator } = await supabase.from("operator_status").select("user_id").maybeSingle();
  if (!operator) notFound();

  const [{ data: credits }, { data: runs }, { data: workflowRows }] = await Promise.all([
    supabase.from("os_credits").select("user_id, granted, used, updated_at"),
    supabase.from("os_runs").select("id, user_id, topic, status, decision, cost_usd, created_at").order("created_at", { ascending: false }),
    supabase
      .from("os_workflows")
      .select("id, key, name, purpose, brief, shape, destination, max_sources, owner_user_id, active, standing_sources, window_days")
      .order("owner_user_id", { ascending: false, nullsFirst: false })
      .order("name"),
  ]);

  // Emails live in auth, which RLS does not reach.
  const admin = createSupabaseAdminClient();
  const emails = new Map<string, string>();
  if (admin) {
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const user of users?.users ?? []) if (user.email) emails.set(user.id, user.email);
  }

  const rows = (credits ?? [])
    .map((credit) => {
      const theirs = (runs ?? []).filter((run) => run.user_id === credit.user_id);
      const drafted = theirs.filter((run) => run.status === "drafted");
      return {
        userId: credit.user_id,
        email: emails.get(credit.user_id) ?? credit.user_id.slice(0, 8),
        granted: credit.granted,
        used: credit.used,
        runs: drafted.length,
        failed: theirs.length - drafted.length,
        approved: drafted.filter((run) => run.decision === "approved").length,
        rejected: drafted.filter((run) => run.decision === "rejected").length,
        cost: theirs.reduce((total, run) => total + Number(run.cost_usd ?? 0), 0),
        last: theirs[0]?.created_at ?? credit.updated_at,
      };
    })
    .sort((a, b) => b.used - a.used || b.approved - a.approved);

  const totalCost = (runs ?? []).reduce((total, run) => total + Number(run.cost_usd ?? 0), 0);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const todayCost = (runs ?? [])
    .filter((run) => Date.parse(run.created_at) >= since.getTime())
    .reduce((total, run) => total + Number(run.cost_usd ?? 0), 0);

  return (
    <div className="mayda-shell mayda-section">
      <InternalNav locale={locale} current="/internal/os" />

      <div className="mayda-stack-lg" style={{ marginTop: "1.5rem" }}>
        <header className="mayda-stack">
          <p className="mayda-kicker">Internal / Operators only</p>
          <h1 className="mayda-heading">MaydaOS beta</h1>
          <p className="mayda-body">
            Sorted by credits spent, which is the warmest lead signal here. Someone who burned ten and approved most of
            them is worth writing to.
          </p>
          <dl className="mayda-dl">
            <div>
              <dt>Spend</dt>
              <dd>
                ${totalCost.toFixed(4)} all time · ${todayCost.toFixed(4)} today · {(runs ?? []).length} runs ·{" "}
                {rows.length} people
              </dd>
            </div>
          </dl>
        </header>

        {rows.length === 0 ? (
          <p className="mayda-body">Nobody has run anything yet.</p>
        ) : (
          <div className="mayda-stack" style={{ gap: "0.6rem" }}>
            {rows.map((row) => (
              <div key={row.userId} className="mayda-row">
                <div>
                  <strong>{row.email}</strong>
                  <br />
                  <span className="mayda-invoice-sub">
                    {row.used}/{row.granted} credits · {row.runs} runs · {row.approved} approved · {row.rejected} sent
                    back{row.failed ? ` · ${row.failed} failed` : ""} · ${row.cost.toFixed(4)}
                  </span>
                </div>
                <GrantCreditsForm userId={row.userId} granted={row.granted} />
              </div>
            ))}
          </div>
        )}

        <section className="mayda-stack" style={{ gap: "0.8rem", borderTop: "1px solid var(--border)", paddingTop: "1.4rem" }}>
          <div>
            <h2 className="mayda-subheading" style={{ margin: 0 }}>Workflows</h2>
            <p className="mayda-body">
              A pilot is a workflow installed by hand. Leave the client email blank and it is a template everyone can
              run; fill it in and only they see it.
            </p>
          </div>

          {(workflowRows ?? []).map((row) => {
            const workflow = row as OsWorkflow & { active: boolean };
            return (
              <details key={workflow.id} className="mayda-details">
                <summary>
                  {workflow.name} · {workflow.key}
                  {workflow.owner_user_id ? ` · ${emails.get(workflow.owner_user_id) ?? "a client"}` : " · template"}
                  {workflow.active ? "" : " · inactive"}
                </summary>
                <div style={{ marginTop: "1rem" }}>
                  <OsWorkflowForm
                    workflow={workflow}
                    ownerEmail={workflow.owner_user_id ? emails.get(workflow.owner_user_id) : undefined}
                  />
                </div>
              </details>
            );
          })}

          <details className="mayda-details">
            <summary>Install a new workflow</summary>
            <div style={{ marginTop: "1rem" }}>
              <OsWorkflowForm />
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
