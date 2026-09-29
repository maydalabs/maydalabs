import { ActionForm } from "@/components/os/ActionForm";
import { OsPaneEmpty } from "@/components/os/OsPaneEmpty";
import { OS_MEMORY_COPY } from "@/components/osCopy";
import { teachMemoryAction, retireMemoryAction } from "@/app/actions/memory";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currentCompany } from "@/lib/osCompany";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n";
import { MEMORY_REVIEW_COLUMNS, inspectMemoryReview, memoryRows, type MemoryRecord } from "@/lib/osReviewedMemory";

const REVIEW_COPY = {
  en: { model: "Model-authored · human confirmation recorded", unverified: "Not independently verified. Source attribution is not proof.", company: "Company", project: "Project", customer: "Customer", untilChanged: "Until changed or retired", until: "Valid through", expired: "Expired — excluded from current company knowledge", invalid: "Incomplete review details — excluded from current company knowledge", legacy: "Scope and validity were not recorded for this entry.", sources: "Review sources", source: "Captured source", confirmed: "Confirmed", unavailable: "Company knowledge could not be loaded. Reload before assuming it is empty." },
  tr: { model: "Modelin yazdığı bilgi · insan onayı kayıtlı", unverified: "Bağımsız olarak doğrulanmadı. Kaynak alıntısı, doğruluk kanıtı değildir.", company: "Şirket", project: "Proje", customer: "Müşteri", untilChanged: "Değiştirilene veya kaldırılana kadar", until: "Son geçerli tarih", expired: "Süresi doldu — güncel şirket bilgisine dahil edilmez", invalid: "İnceleme ayrıntıları eksik — güncel şirket bilgisine dahil edilmez", legacy: "Bu kayıt için kapsam ve geçerlilik süresi belirtilmemiş.", sources: "İnceleme kaynakları", source: "Kaydedilen kaynak", confirmed: "Onay tarihi", unavailable: "Şirket bilgisi yüklenemedi. Boş olduğunu varsaymadan önce sayfayı yenileyin." },
  fr: { model: "Rédigée par le modèle · confirmation humaine enregistrée", unverified: "Non vérifiée indépendamment. Une source citée n’est pas une preuve.", company: "Entreprise", project: "Projet", customer: "Client", untilChanged: "Jusqu’à modification ou retrait", until: "Valable jusqu’au", expired: "Expirée — exclue des connaissances actuelles", invalid: "Vérification incomplète — exclue des connaissances actuelles", legacy: "Aucun périmètre ni durée de validité n’a été enregistré pour cette entrée.", sources: "Sources de la vérification", source: "Source conservée", confirmed: "Confirmation", unavailable: "Impossible de charger les connaissances. Rechargez avant de supposer qu’elles sont vides." },
};

export function MemoryReviewDetails({ row, today, locale }: { row: MemoryRecord; today: string; locale: Locale }) {
  const review = inspectMemoryReview(row, today);
  const copy = REVIEW_COPY[locale];
  const oldCopy = OS_MEMORY_COPY[locale];
  const style = { margin: 0, whiteSpace: "pre-wrap" as const, overflowWrap: "anywhere" as const };
  if (review.state === "legacy") return <div className="os-memory-source"><p style={style}>{row.source === "person" ? oldCopy.fromYou : oldCopy.fromIt}</p><p style={style}>{copy.legacy}</p></div>;
  if (review.state === "invalid") return <p className="os-memory-source" style={style}>{copy.invalid}</p>;
  return <div className="os-memory-source" style={{ display: "grid", gap: ".35rem", minWidth: 0 }}>
    <p style={style}>{copy.model}</p>
    <p style={style}>{copy[review.scope.type]}: {review.scope.label}</p>
    <p style={style}>{review.duration.type === "until_date" ? `${copy.until}: ${review.duration.date} (UTC)` : copy.untilChanged}</p>
    {review.expired ? <p style={{ ...style, color: "var(--os-danger)" }}>{copy.expired}</p> : null}
    <p style={style}>{copy.confirmed}: {review.confirmedAt}</p>
    <p style={style}>{copy.unverified}</p>
    <details><summary style={{ cursor: "pointer" }}>{copy.sources}</summary>
      {review.citations.map((citation, index) => <blockquote key={`${citation.sourceId}:${index}`} style={{ ...style, borderLeft: "2px solid var(--os-line)", paddingLeft: ".6rem", marginTop: ".5rem" }}>{citation.quote}</blockquote>)}
      {review.sources.map((source) => <details key={source.id} style={{ marginTop: ".5rem" }}><summary>{copy.source}: {source.id}</summary><p style={style}>{source.text}</p></details>)}
    </details>
  </div>;
}

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

  const { data: live, error: liveError } = await supabase
    .from("os_company_memory")
    .select(MEMORY_REVIEW_COLUMNS)
    .eq("company_id", company.id)
    .is("retired_at", null)
    .order("created_at", { ascending: false });

  const { data: retired, error: retiredError } = await supabase
    .from("os_company_memory")
    .select(`${MEMORY_REVIEW_COLUMNS}, retired_reason`)
    .eq("company_id", company.id)
    .not("retired_at", "is", null)
    .order("retired_at", { ascending: false })
    .limit(10);
  const today = new Date().toISOString().slice(0, 10);
  const liveRows = memoryRows(live);
  const retiredRows = memoryRows(retired);

  return (
    <div className="mayda-stack" style={{ gap: "1rem" }}>
      <ActionForm action={teachMemoryAction} done={copy.noted} className="os-memory-teach">
        <input name="fact" maxLength={2000} placeholder={copy.teachPlaceholder} aria-label={copy.teachLabel} required />
        <select name="kind" defaultValue="fact" aria-label={copy.kindLabel}>
          <option value="fact">{copy.kinds.fact}</option>
          <option value="preference">{copy.kinds.preference}</option>
          <option value="constraint">{copy.kinds.constraint}</option>
          <option value="person">{copy.kinds.person}</option>
          <option value="decision">{copy.kinds.decision}</option>
        </select>
        <button type="submit" className="mayda-button">{copy.teach}</button>
      </ActionForm>

      {liveError ? <p role="alert" className="mayda-field-error">{REVIEW_COPY[locale].unavailable}</p> : liveRows.length === 0 ? (
        <OsPaneEmpty>{copy.empty}</OsPaneEmpty>
      ) : (
        <ul className="os-memory-list">
          {liveRows.map((row) => (
            <li key={row.id} className="os-memory-item">
              <div>
                <span className="mayda-kicker">{copy.kinds[row.kind as keyof typeof copy.kinds] ?? row.kind}</span>
                <p className="os-memory-fact">{row.fact}</p>
                <MemoryReviewDetails row={row} today={today} locale={locale} />
              </div>
              <ActionForm action={retireMemoryAction} done={copy.retired} className="os-memory-retire">
                <input type="hidden" name="memoryId" value={row.id} />
                <input name="reason" maxLength={500} placeholder={copy.reasonPlaceholder} aria-label={copy.reasonLabel} />
                <button type="submit" className="mayda-status is-muted">{copy.retire}</button>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}

      {retiredError ? <p role="alert" className="mayda-field-error">{REVIEW_COPY[locale].unavailable}</p> : null}
      {retiredRows.length > 0 ? (
        <details className="mayda-details">
          <summary>{copy.retiredHeading}</summary>
          <ul className="os-memory-list" style={{ marginTop: "0.6rem" }}>
            {retiredRows.map((row) => (
              <li key={row.id} className="os-memory-item is-retired">
                <div>
                  <p className="os-memory-fact">{row.fact}</p>
                  <MemoryReviewDetails row={row} today={today} locale={locale} />
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
