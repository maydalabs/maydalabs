import Link from "next/link";
import { OS_ACTIVITY_COPY } from "@/components/osCopy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatUsd } from "@/lib/os";
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

  const { data: rows } = await supabase
    .from("os_activity")
    .select("id, name, cadence, active, paused_reason, due_in_hours, spent_this_month_usd, monthly_budget_usd, last_run_at, last_run_days, last_run_status")
    .order("next_run_at", { ascending: true, nullsFirst: false });

  const activity = rows ?? [];
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  return (
    <section className="mayda-stack-lg" aria-labelledby="cofounder-activity">
      {bare ? null : (
        <header className="mayda-stack" style={{ gap: "0.4rem" }}>
          <p className="mayda-kicker" style={{ margin: 0 }}>{copy.kicker}</p>
          <h2 className="mayda-subheading" id="cofounder-activity" style={{ margin: 0 }}>{copy.heading}</h2>
        </header>
      )}

      {activity.length === 0 ? (
        <p className="mayda-body">{copy.empty}</p>
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
                  <p className="mayda-kicker" style={{ margin: 0 }}>{copy[cadence]}</p>
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
            </article>
          );
        })
      )}

      <Link href={localizePath("/portal/workflows", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
        {copy.manage} →
      </Link>
    </section>
  );
}
