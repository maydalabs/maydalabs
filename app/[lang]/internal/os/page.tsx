import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InternalNav } from "@/components/InternalNav";
import { OsWorkflowForm } from "@/components/OsWorkflowForm";
import { formatUsd, monthStart, type OsWorkflow } from "@/lib/os";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "Internal · MaydaOS",
  robots: { index: false, follow: false },
};

/*
 * What is installed, what it is producing, and what it is costing.
 *
 * The unit here is the workflow, not the person. A pilot is a workflow
 * installed by hand, so the operator's questions are "is this one running",
 * "is anything waiting on the client", and "how much of this month's budget
 * has it used".
 */
export default async function InternalOsPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);

  const claims = await getVerifiedClaims();
  if (!claims) redirect(localizePath("/auth/sign-in", locale));

  const supabase = await createSupabaseServerClient();
  const { data: operator } = await supabase.from("operator_status").select("user_id").maybeSingle();
  if (!operator) notFound();

  // An operator's own policy returns every run, so no admin client is needed
  // to read them; auth emails are the only thing RLS cannot reach.
  const [{ data: runs }, { data: workflowRows }] = await Promise.all([
    supabase
      .from("os_runs")
      .select("id, user_id, workflow_id, topic, status, decision, cost_usd, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("os_workflows")
      .select("id, key, name, purpose, brief, shape, destination, max_sources, owner_user_id, active, standing_sources, window_days, monthly_budget_usd")
      .order("owner_user_id", { ascending: false, nullsFirst: false })
      .order("name"),
  ]);

  const admin = createSupabaseAdminClient();
  const emails = new Map<string, string>();
  if (admin) {
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const user of users?.users ?? []) if (user.email) emails.set(user.id, user.email);
  }

  const allRuns = runs ?? [];
  const monthFrom = monthStart().getTime();
  const dayFrom = new Date().setUTCHours(0, 0, 0, 0);
  const sum = (rows: typeof allRuns) => rows.reduce((total, run) => total + Number(run.cost_usd ?? 0), 0);
  const thisMonth = allRuns.filter((run) => Date.parse(run.created_at) >= monthFrom);
  const today = allRuns.filter((run) => Date.parse(run.created_at) >= dayFrom);

  const workflows = (workflowRows ?? []).map((row) => {
    const workflow = row as OsWorkflow & { active: boolean };
    const mine = thisMonth.filter((run) => run.workflow_id === workflow.id);
    const drafted = mine.filter((run) => run.status === "drafted");
    return {
      workflow,
      spent: sum(mine),
      budget: Number(workflow.monthly_budget_usd),
      runs: drafted.length,
      failed: mine.length - drafted.length,
      waiting: drafted.filter((run) => run.decision === "pending").length,
      approved: drafted.filter((run) => run.decision === "approved").length,
      last: mine[0]?.created_at ?? null,
    };
  });

  return (
    <div className="mayda-shell mayda-section">
      <InternalNav locale={locale} current="/internal/os" />

      <div className="mayda-stack-lg" style={{ marginTop: "1.5rem" }}>
        <header className="mayda-stack">
          <p className="mayda-kicker">Internal / Operators only</p>
          <h1 className="mayda-heading">MaydaOS</h1>
          <p className="mayda-body">
            A pilot is a workflow installed by hand. Leave the client email blank and it is a template everyone with
            access can run; fill it in and only they see it. The budget is per workflow, per calendar month.
          </p>
          <dl className="mayda-dl">
            <div>
              <dt>Spend</dt>
              <dd>
                {formatUsd(sum(thisMonth))} this month · {formatUsd(sum(today))} today · {formatUsd(sum(allRuns))} all
                time · {allRuns.length} runs
              </dd>
            </div>
          </dl>
        </header>

        <section className="mayda-stack" style={{ gap: "0.8rem" }}>
          <h2 className="mayda-subheading" style={{ margin: 0 }}>Workflows</h2>

          {workflows.length === 0 ? (
            <p className="mayda-body">Nothing is installed yet.</p>
          ) : (
            workflows.map(({ workflow, spent, budget, runs: count, failed, waiting, approved, last }) => (
              <details key={workflow.id} className="mayda-details">
                <summary>
                  {workflow.name} · {workflow.key}
                  {workflow.owner_user_id ? ` · ${emails.get(workflow.owner_user_id) ?? "a client"}` : " · template"}
                  {workflow.active ? "" : " · inactive"}
                </summary>
                <p className="mayda-invoice-sub" style={{ marginTop: "0.6rem" }}>
                  {formatUsd(spent)} of {formatUsd(budget)} this month
                  {spent >= budget && budget >= 0 ? " · budget spent" : ""} · {count} runs · {approved} approved
                  {waiting ? ` · ${waiting} waiting on the client` : ""}
                  {failed ? ` · ${failed} failed` : ""}
                  {last ? ` · last ${new Date(last).toISOString().slice(0, 10)}` : " · not run this month"}
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <OsWorkflowForm
                    workflow={workflow}
                    ownerEmail={workflow.owner_user_id ? emails.get(workflow.owner_user_id) : undefined}
                  />
                </div>
              </details>
            ))
          )}

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
