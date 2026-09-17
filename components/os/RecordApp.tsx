import { OsPaneEmpty } from "@/components/os/OsPaneEmpty";
import { OS_DOCUMENT_COPY, OS_RECORD_COPY } from "@/components/osCopy";
import { OpenItem } from "@/components/os/OpenItem";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n";

/* The record.
 *
 * Property four made legible. MaydaOS has been keeping an append-only history
 * since the spine, and nobody could read it — which is half a guarantee: "we
 * can prove what happened" means nothing to a person with no way to look.
 *
 * Every line says who. That is the column the whole product rests on, so it
 * comes from the view rather than being inferred here: a null actor is not
 * missing data, it is the answer.
 */
export async function RecordApp({
  locale,
  seenAt,
  openable = [],
}: {
  locale: Locale;
  seenAt: string | null;
  /* The items that have a document on this desk. A line about one of them
   * opens it; a line about work too old to be loaded stays a line. */
  openable?: string[];
}) {
  const copy = OS_RECORD_COPY[locale];
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("os_recent_record")
    .select("id, item_id, title, lane, kind, event, actor, by_a_person, at")
    .order("at", { ascending: false })
    .limit(60);

  if (!rows?.length) return <OsPaneEmpty>{copy.empty}</OsPaneEmpty>;

  const seen = seenAt ? new Date(seenAt).getTime() : 0;

  return (
    <ol className="os-record">
      {rows.map((row, index) => {
        const at = row.at ? new Date(row.at).getTime() : 0;
        const isNew = at > seen;
        const firstOld = isNew && index + 1 < rows.length
          ? new Date(rows[index + 1]!.at ?? 0).getTime() <= seen
          : false;

        return (
          <li key={row.id} className="os-record-line" data-new={isNew}>
            <span className="os-record-who" data-person={row.by_a_person}>
              {row.by_a_person ? copy.byYou : copy.bySystem}
            </span>
            <span className="os-record-what">
              {copy.events[row.event ?? ""] ?? row.event}
              {" · "}
              {row.item_id && openable.includes(row.item_id) ? (
                <OpenItem id={row.item_id} title={row.title ?? ""} label={OS_DOCUMENT_COPY[locale].open} />
              ) : (
                <strong>{row.title}</strong>
              )}
              <span className="os-record-lane"> {row.lane}/{row.kind}</span>
            </span>
            {/* The grid reserves a column for this and nothing was filling it.
                24-hour, tabular, so the times form a column you read down. */}
            {row.at ? (
              <span className="os-record-when">
                {new Intl.DateTimeFormat(locale, {
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }).format(new Date(row.at))}
              </span>
            ) : null}
            {/* A single divider where the new stops, rather than a badge on
                every line: the useful fact is where to stop reading. */}
            {firstOld ? <span className="os-record-divider">{copy.newSince}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
