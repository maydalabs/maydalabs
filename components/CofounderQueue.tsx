import { StartCompanyForm, WorkItemDecision } from "@/components/CofounderPanels";
import { OS_COFOUNDER_COPY } from "@/components/osCopy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n";

/* The thing you enter.
 *
 * A co-founder's most useful act is to come back with the few things only a
 * person can settle and say why each is stuck. Everything the system can move
 * on its own is absent here by construction: the view behind this returns
 * only work that is waiting on a human.
 */
export async function CofounderQueue({ locale, userId }: { locale: Locale; userId: string }) {
  if (!isSupabaseConfigured()) return null;
  const copy = OS_COFOUNDER_COPY[locale];
  const supabase = await createSupabaseServerClient();

  const { data: memberships } = await supabase
    .from("os_company_members")
    .select("company_id")
    .eq("user_id", userId);

  // No company yet: the only thing to show is how to begin.
  if (!memberships?.length) {
    return (
      <section className="mayda-stack-lg" aria-labelledby="cofounder-start">
        <header className="mayda-stack" style={{ gap: "0.4rem" }}>
          <p className="mayda-kicker" style={{ margin: 0 }}>{copy.kicker}</p>
          <h2 className="mayda-subheading" id="cofounder-start" style={{ margin: 0 }}>{copy.startHeading}</h2>
          <p className="mayda-body">{copy.startIntro}</p>
        </header>
        <StartCompanyForm copy={copy} />
      </section>
    );
  }

  const { data: waiting } = await supabase
    .from("os_needs_you")
    .select("id, lane, kind, title, status, required_action, route, waiting_days")
    .order("waiting_days", { ascending: false });

  // How long each has waited comes from the database, which is the honest
  // clock: reading it here would be impure, and two people looking at the
  // same decision should agree on its age.
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const rows = (waiting ?? []).map((row) => ({
    ...row,
    waited: relative.format(-(row.waiting_days ?? 0), "day"),
  }));

  return (
    <section className="mayda-stack-lg" aria-labelledby="cofounder-queue">
      <header className="mayda-stack" style={{ gap: "0.4rem" }}>
        <p className="mayda-kicker" style={{ margin: 0 }}>{copy.kicker}</p>
        <h2 className="mayda-subheading" id="cofounder-queue" style={{ margin: 0 }}>{copy.heading}</h2>
      </header>

      {rows.length === 0 ? (
        <p className="mayda-body">{copy.clear}</p>
      ) : (
        rows.map((row) => (
          <article key={row.id} className="mayda-card mayda-os-run">
            <div className="mayda-os-run-head">
              <div>
                <p className="mayda-kicker" style={{ margin: 0 }}>{row.lane} / {row.kind}</p>
                <strong>{row.title}</strong>
              </div>
              <span className="mayda-status">
                {copy.routes[(row.route ?? "other") as keyof typeof copy.routes]}
              </span>
            </div>
            {/* The relative time stands on its own. A prefix turns
                "today" and "yesterday" into things nobody says. */}
            <p className="mayda-note" style={{ margin: 0 }}>{row.waited}</p>
            {row.status === "review" ? <WorkItemDecision itemId={row.id!} copy={copy} /> : null}
          </article>
        ))
      )}
    </section>
  );
}
