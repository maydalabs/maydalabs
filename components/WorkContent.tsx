import Link from "next/link";
import { OsRunCard, type OsRunRecord } from "@/components/OsRunCard";
import { OsRunForm } from "@/components/OsRunForm";
import { OS_DESK_COPY } from "@/components/osCopy";
import { isOsConfigured } from "@/lib/osDraft";
import { formatUsd, monthStart, toOsWorkflows, workflowBudget } from "@/lib/os";
import { getOsSession } from "@/lib/osSession";
import { localizePath, type Locale } from "@/lib/i18n";

/* The work screen: what needs a decision, and how to produce the next piece.
 *
 * This is MaydaOS as it is actually sold — one section of the client's own
 * portal, not a separate destination with its own dock and terminal. A client
 * with no workflow installed never sees it at all, so the portal stays the
 * engagement and account page it has always been for everyone else.
 */
export async function WorkContent({ locale }: { locale: Locale }) {
  const session = await getOsSession();
  if (!session) return null;
  const { claims, supabase } = session;
  const copy = OS_DESK_COPY[locale];

  const { data: workflowRows } = await supabase
    .from("os_workflows")
    .select("id, key, name, purpose, brief, shape, destination, max_sources, owner_user_id, standing_sources, window_days, monthly_budget_usd")
    .eq("active", true)
    .order("owner_user_id", { ascending: false, nullsFirst: false })
    .order("name");
  const workflows = toOsWorkflows(workflowRows ?? []);

  const { data: runs } = await supabase
    .from("os_runs")
    .select("id, workflow_id, shape, topic, sources, status, draft, claims, decision, decision_note, published_url, error, cost_usd, created_at")
    .eq("user_id", claims.sub)
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = (runs ?? []) as (OsRunRecord & { workflow_id: string | null; cost_usd: number | null })[];

  /* A month's spend, for the workflows installed for this person only.
   *
   * A shared template is run by other people too, and row-level security
   * rightly hides their runs, so this client's own total would understate it.
   * Rather than show a number that is quietly wrong, a template shows none. */
  const since = monthStart().toISOString();
  const mine = workflows.filter((workflow) => workflow.owner_user_id === claims.sub);
  const spendByWorkflow = new Map<string, number>();
  if (mine.length > 0) {
    const { data: monthRuns } = await supabase
      .from("os_runs")
      .select("workflow_id, cost_usd")
      .eq("user_id", claims.sub)
      .gte("created_at", since);
    for (const run of monthRuns ?? []) {
      if (!run.workflow_id) continue;
      spendByWorkflow.set(run.workflow_id, (spendByWorkflow.get(run.workflow_id) ?? 0) + Number(run.cost_usd ?? 0));
    }
  }
  const budgets: Record<string, { spent: string; budget: string; exhausted: boolean }> = {};
  for (const workflow of mine) {
    const budget = workflowBudget(spendByWorkflow.get(workflow.id) ?? 0, Number(workflow.monthly_budget_usd));
    budgets[workflow.id] = {
      spent: formatUsd(budget.spentUsd),
      budget: formatUsd(budget.budgetUsd),
      exhausted: budget.exhausted,
    };
  }

  const pending = rows.filter((run) => run.status === "drafted" && run.decision === "pending");
  const recent = rows.filter((run) => !pending.includes(run)).slice(0, 5);
  const everyOwnedBudgetSpent = mine.length > 0 && mine.every((workflow) => budgets[workflow.id]?.exhausted);

  return (
    <section className="mayda-stack-lg" aria-labelledby="portal-work">
      <header className="mayda-stack" style={{ gap: "0.4rem" }}>
        <p className="mayda-kicker" style={{ margin: 0 }}>{copy.kicker}</p>
        <h2 className="mayda-subheading" id="portal-work" style={{ margin: 0 }}>{copy.heading}</h2>
      </header>

      {pending.length > 0 ? (
        <div className="mayda-stack" style={{ gap: "1rem" }}>
          {pending.map((run) => <OsRunCard key={run.id} run={run} copy={copy} />)}
        </div>
      ) : null}

      <div className="mayda-stack" style={{ gap: "0.8rem" }}>
        <h3 className="mayda-kicker" style={{ margin: 0 }}>{copy.produceHeading}</h3>
        {!isOsConfigured() || workflows.length === 0 ? (
          <p className="mayda-body">{copy.noWorkflow}</p>
        ) : everyOwnedBudgetSpent ? (
          <p className="mayda-body">{copy.outOfHeading} {copy.outOfBody}</p>
        ) : (
          <OsRunForm copy={copy} disabled={false} workflows={workflows} budgets={budgets} />
        )}
      </div>

      {recent.length > 0 ? (
        <div className="mayda-stack" style={{ gap: "1rem" }}>
          <h3 className="mayda-kicker" style={{ margin: 0 }}>{copy.runsHeading}</h3>
          {recent.map((run) => <OsRunCard key={run.id} run={run} copy={copy} />)}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <Link href={localizePath("/portal/work", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
          {copy.historyLink} <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </section>
  );
}
