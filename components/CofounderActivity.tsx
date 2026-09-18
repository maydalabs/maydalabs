import { OsPaneEmpty } from "@/components/os/OsPaneEmpty";
import Link from "next/link";
import { DeleteWorkflowButton, MemberWorkflowForm } from "@/components/MemberWorkflowForm";
import { OS_ACTIVITY_COPY, OS_DESK_COPY, OS_WORKFLOW_COPY } from "@/components/osCopy";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { OS_MAX_WORKFLOWS_PER_MEMBER, formatUsd, toOsWorkflows } from "@/lib/os";
import { localizePath, type Locale } from "@/lib/i18n";

/* The process surface.
 *
 * An operating system shows you what is running whether or not you asked.
 * Until this screen existed MaydaOS only ever responded to a click, which is
 * why it read as a set of pages: work could be scheduled, but nothing said
 * so. Everything here is a fact the database already holds — the schedule,
 * the last run, the month's spend — rather than a summary assembled in the
 * page, so two people looking at it see the same numbers.
 */
export async function CofounderActivity({ locale, bare = false }: { locale: Locale; bare?: boolean }) {
  if (!isSupabaseConfigured()) return null;
  const copy = OS_ACTIVITY_COPY[locale];
  const supabase = await createSupabaseServerClient();
  const claims = await getVerifiedClaims();

  const { data: rows } = await supabase
    .from("os_activity")
    .select("id, name, cadence, active, paused_reason, due_in_hours, spent_this_month_usd, monthly_budget_usd, last_run_at, last_run_days, last_run_status")
    .order("next_run_at", { ascending: true, nullsFirst: false });

  const activity = rows ?? [];
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  /* On the desk, a workflow is set up and changed where it is shown. The
   * Running window used to send a person out to a portal page with the
   * site's header on it, which is the moment an operating system turns back
   * into a website. The person's own workflows come with their full row,
   * for the form; everyone else's stay as activity. */
  const own = new Map<string, Parameters<typeof MemberWorkflowForm>[0]["workflow"]>();
  let companies: { id: string; name: string }[] = [];
  if (bare && claims?.sub) {
    const [{ data: mine }, { data: memberships }] = await Promise.all([
      supabase
        .from("os_workflows")
        .select("id, key, name, purpose, brief, shape, destination, max_sources, owner_user_id, standing_sources, window_days, monthly_budget_usd, active, company_id, cadence, required_action")
        .eq("owner_user_id", claims.sub),
      supabase.from("os_company_members").select("company_id, os_companies (id, name)").eq("user_id", claims.sub),
    ]);
    for (const row of toOsWorkflows(mine ?? [])) own.set(row.id, row as (typeof own extends Map<string, infer V> ? V : never));
    companies = (memberships ?? [])
      .map((row) => row.os_companies)
      .filter((company): company is { id: string; name: string } => Boolean(company?.id));
  }
  const workflowCopy = OS_WORKFLOW_COPY[locale];
  const shapes = OS_DESK_COPY[locale].shapes;

  return (
    <section className="mayda-stack-lg" aria-labelledby="cofounder-activity">
      {bare ? null : (
        <header className="mayda-stack" style={{ gap: "0.4rem" }}>
          <p className="mayda-kicker">{copy.kicker}</p>
          <h2 className="mayda-subheading" id="cofounder-activity" style={{ margin: 0 }}>{copy.heading}</h2>
        </header>
      )}

      {activity.length === 0 ? (
        <OsPaneEmpty>{copy.empty}</OsPaneEmpty>
      ) : (
        activity.map((row) => {
          const cadence = (row.cadence ?? "manual") as "manual" | "daily" | "weekly";
          const hours = row.due_in_hours;

          /* Why it is not going to run comes before when it would have. A
           * row that says "due in 3h" while switched off is a lie told by
           * ordering the facts badly. */
          const state = !row.active
            ? copy.off
            : row.paused_reason
              ? copy.paused
              : cadence === "manual"
                ? copy.manual
                : hours === null
                  ? copy[cadence]
                  : hours <= 0
                    ? copy.dueNow
                    : copy.dueIn(hours);

          return (
            <article key={row.id} className="mayda-card mayda-os-run">
              <div className="mayda-os-run-head">
                <div>
                  <p className="mayda-kicker">{copy[cadence]}</p>
                  <strong>{row.name}</strong>
                </div>
                <span className="mayda-status">{state}</span>
              </div>

              <p className="mayda-note" style={{ margin: 0 }}>
                {row.last_run_at
                  ? `${copy.lastRun}: ${relative.format(-(row.last_run_days ?? 0), "day")} — ${
                      row.last_run_status === "drafted" ? copy.ranOk : copy.ranFailed
                    }`
                  : copy.lastNever}
              </p>

              <p className="mayda-note" style={{ margin: 0 }}>
                {copy.spend(
                  formatUsd(Number(row.spent_this_month_usd ?? 0)),
                  formatUsd(Number(row.monthly_budget_usd ?? 0)),
                )}
              </p>

              {/* The reason is the useful part of a pause. Hiding it behind
                  the word "paused" is how something goes quiet for a week
                  before anyone finds out why. */}
              {row.paused_reason ? (
                <p className="mayda-field-error" style={{ margin: 0 }}>{row.paused_reason}</p>
              ) : null}

              {row.id && own.has(row.id) ? (
                <details className="mayda-details os-activity-edit">
                  <summary>{workflowCopy.change}</summary>
                  <div className="mayda-stack" style={{ gap: "1rem", marginTop: "1rem" }}>
                    <MemberWorkflowForm copy={workflowCopy} shapes={shapes} workflow={own.get(row.id)} companies={companies} />
                    <DeleteWorkflowButton id={row.id} label={workflowCopy.remove} confirmText={workflowCopy.removeConfirm} />
                  </div>
                </details>
              ) : null}
            </article>
          );
        })
      )}

      {bare ? (
        own.size >= OS_MAX_WORKFLOWS_PER_MEMBER ? (
          <p className="mayda-note">{workflowCopy.limitReached}</p>
        ) : (
          <details className="mayda-details os-activity-add">
            <summary>{workflowCopy.add}</summary>
            <div style={{ marginTop: "1rem" }}>
              <MemberWorkflowForm copy={workflowCopy} shapes={shapes} companies={companies} />
            </div>
          </details>
        )
      ) : (
        <Link href={localizePath("/portal/workflows", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
          {copy.manage} →
        </Link>
      )}
    </section>
  );
}
