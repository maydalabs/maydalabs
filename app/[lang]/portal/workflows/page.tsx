import type { Metadata } from "next";
import Link from "next/link";
import { MemberWorkflowForm, DeleteWorkflowButton } from "@/components/MemberWorkflowForm";
import { OS_DESK_COPY, OS_WORKFLOW_COPY } from "@/components/osCopy";
import { OS_MAX_WORKFLOWS_PER_MEMBER, toOsWorkflows } from "@/lib/os";
import { requireOsSession } from "@/lib/osSession";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = { title: "Your workflows", robots: { index: false, follow: false } };

/* Where a person sets up their own work. Templates are not listed: they are
 * ours, they cannot be edited from here, and showing them beside a person's
 * own workflows would invite the question of why one of them is read-only. */
export default async function PortalWorkflowsPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = OS_WORKFLOW_COPY[locale];
  const deskCopy = OS_DESK_COPY[locale];
  const { claims, supabase } = await requireOsSession();

  const { data: rows } = await supabase
    .from("os_workflows")
    .select("id, key, name, purpose, brief, shape, destination, max_sources, owner_user_id, standing_sources, window_days, monthly_budget_usd, active")
    .eq("owner_user_id", claims.sub)
    .order("name");
  const mine = toOsWorkflows(rows ?? []) as (ReturnType<typeof toOsWorkflows>[number] & { active: boolean })[];
  const atLimit = mine.length >= OS_MAX_WORKFLOWS_PER_MEMBER;

  return (
    <div className="mayda-shell mayda-section mayda-stack-lg" style={{ maxWidth: "64rem" }}>
      <Link href={localizePath("/portal", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
        ← {copy.back}
      </Link>

      <header className="mayda-stack" style={{ gap: "0.5rem" }}>
        <p className="mayda-kicker" style={{ margin: 0 }}>{deskCopy.kicker}</p>
        <h1 className="mayda-heading">{copy.heading}</h1>
        <p className="mayda-body">{copy.intro}</p>
      </header>

      {mine.length === 0 ? <p className="mayda-body">{copy.empty}</p> : null}

      {mine.map((workflow) => (
        <details key={workflow.id} className="mayda-details">
          <summary>
            {workflow.name} · {deskCopy.shapes[workflow.shape]}
            {workflow.active ? "" : " · off"}
          </summary>
          <div className="mayda-stack" style={{ gap: "1rem", marginTop: "1rem" }}>
            <MemberWorkflowForm copy={copy} shapes={deskCopy.shapes} workflow={workflow} />
            <DeleteWorkflowButton id={workflow.id} label={copy.remove} confirmText={copy.removeConfirm} />
          </div>
        </details>
      ))}

      {atLimit ? (
        <p className="mayda-note">{copy.limitReached}</p>
      ) : (
        <details className="mayda-details">
          <summary>{copy.add}</summary>
          <div style={{ marginTop: "1rem" }}>
            <MemberWorkflowForm copy={copy} shapes={deskCopy.shapes} />
          </div>
        </details>
      )}
    </div>
  );
}
