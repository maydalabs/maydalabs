import { OsPaneEmpty } from "@/components/os/OsPaneEmpty";
import { OS_MEMORY_COPY } from "@/components/osCopy";
import { teachMemoryAction, retireMemoryAction } from "@/app/actions/memory";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currentCompany } from "@/lib/osCompany";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n";

/* What it has learned, in full, and the means to correct it.
 *
 * Memory you cannot read is a claim; memory you cannot correct is a liability.
 * Both are why this app exists rather than the list living only inside the
 * model's context — and why retiring something asks for a reason: "it used to
 * think this, and on the 16th I told it otherwise" is the record, and the
 * record is the product.
 */
export async function MemoryApp({ locale }: { locale: Locale }) {
  const copy = OS_MEMORY_COPY[locale];
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const company = await currentCompany(supabase);
  if (!company) return <OsPaneEmpty>{copy.noCompany}</OsPaneEmpty>;

  const { data: live } = await supabase
    .from("os_company_memory")
    .select("id, fact, kind, source, created_at")
    .eq("company_id", company.id)
    .is("retired_at", null)
    .order("created_at", { ascending: false });

  const { data: retired } = await supabase
    .from("os_company_memory")
    .select("id, fact, retired_reason")
    .eq("company_id", company.id)
    .not("retired_at", "is", null)
    .order("retired_at", { ascending: false })
    .limit(10);

  return (
    <div className="mayda-stack" style={{ gap: "1rem" }}>
      <form action={teachMemoryAction} className="os-memory-teach">
        <input name="fact" maxLength={2000} placeholder={copy.teachPlaceholder} aria-label={copy.teachLabel} required />
        <select name="kind" defaultValue="fact" aria-label={copy.kindLabel}>
          <option value="fact">{copy.kinds.fact}</option>
          <option value="preference">{copy.kinds.preference}</option>
          <option value="constraint">{copy.kinds.constraint}</option>
          <option value="person">{copy.kinds.person}</option>
          <option value="decision">{copy.kinds.decision}</option>
        </select>
        <button type="submit" className="mayda-button">{copy.teach}</button>
      </form>

      {(live ?? []).length === 0 ? (
        <OsPaneEmpty>{copy.empty}</OsPaneEmpty>
      ) : (
        <ul className="os-memory-list">
          {(live ?? []).map((row) => (
            <li key={row.id} className="os-memory-item">
              <div>
                <span className="mayda-kicker">{copy.kinds[row.kind as keyof typeof copy.kinds] ?? row.kind}</span>
                <p className="os-memory-fact">{row.fact}</p>
                <span className="os-memory-source">
                  {row.source === "person" ? copy.fromYou : copy.fromIt}
                </span>
              </div>
              <form action={retireMemoryAction} className="os-memory-retire">
                <input type="hidden" name="memoryId" value={row.id} />
                <input name="reason" maxLength={500} placeholder={copy.reasonPlaceholder} aria-label={copy.reasonLabel} />
                <button type="submit" className="mayda-status is-muted">{copy.retire}</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {(retired ?? []).length > 0 ? (
        <details className="mayda-details">
          <summary>{copy.retiredHeading}</summary>
          <ul className="os-memory-list" style={{ marginTop: "0.6rem" }}>
            {(retired ?? []).map((row) => (
              <li key={row.id} className="os-memory-item is-retired">
                <div>
                  <p className="os-memory-fact">{row.fact}</p>
                  {row.retired_reason ? (
                    <span className="os-memory-source">{copy.because} {row.retired_reason}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
