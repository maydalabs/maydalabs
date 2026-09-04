import type { Metadata } from "next";
import Link from "next/link";
import { OsShell } from "@/components/os/OsShell";
import { localizePath } from "@/lib/i18n";
import { OS_DESK_COPY } from "@/components/osCopy";
import { requireOsSession } from "@/lib/osSession";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = {
  title: "MaydaOS · Record",
  robots: { index: false, follow: false },
};

const COPY = {
  en: {
    heading: "Everything that happened here",
    intro: "Every run, what it cost, and what you decided. Nothing is hidden and nothing is summarised away.",
    empty: "Nothing yet.",
    columns: { when: "When", topic: "Topic", decision: "Decision", sources: "Sources" },
    totals: "runs · approved · sent back · sources cited",
  },
  tr: {
    heading: "Burada olan biten her şey",
    intro: "Her çalıştırma, maliyeti ve verdiğiniz karar. Hiçbir şey gizlenmez, hiçbir şey özetlenip yok edilmez.",
    empty: "Henüz bir şey yok.",
    columns: { when: "Ne zaman", topic: "Konu", decision: "Karar", sources: "Kaynaklar" },
    totals: "çalıştırma · onaylandı · geri gönderildi · kaynak gösterildi",
  },
  fr: {
    heading: "Tout ce qui s'est passe ici",
    intro: "Chaque execution, ce qu'elle a coute, et ce que vous avez decide. Rien n'est cache, rien n'est resume a la hate.",
    empty: "Rien pour l'instant.",
    columns: { when: "Quand", topic: "Sujet", decision: "Decision", sources: "Sources" },
    totals: "executions · approuvees · renvoyees · sources citees",
  },
} as const;

export default async function OsRecordPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];
  const deskCopy = OS_DESK_COPY[locale];
  const { supabase, credits } = await requireOsSession(locale, "record");

  const { data: runs } = await supabase
    .from("os_runs")
    .select("id, topic, shape, status, decision, decision_note, published_url, sources, decided_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = runs ?? [];
  const drafted = rows.filter((run) => run.status === "drafted");
  const approved = drafted.filter((run) => run.decision === "approved").length;
  const rejected = drafted.filter((run) => run.decision === "rejected").length;
  const cited = new Set(
    drafted.flatMap((run) => (Array.isArray(run.sources) ? (run.sources as { url?: string }[]) : []).map((s) => s?.url).filter(Boolean)),
  );
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <OsShell locale={locale} app="record" credits={credits}>
      <div className="mayda-stack-lg">
        <header className="mayda-stack" style={{ gap: "0.5rem" }}>
          <h2 className="mayda-subheading" style={{ margin: 0 }}>{copy.heading}</h2>
          <p className="mayda-body">{copy.intro}</p>
          <p className="mayda-os-credits">
            <strong>{drafted.length}</strong> · <strong>{approved}</strong> · <strong>{rejected}</strong> ·{" "}
            <strong>{cited.size}</strong> <span>{copy.totals}</span>
          </p>
        </header>

        {rows.length === 0 ? (
          <p className="mayda-body">{copy.empty}</p>
        ) : (
          <div className="mayda-stack" style={{ gap: "0.5rem" }}>
            {rows.map((run) => (
              <Link key={run.id} href={localizePath(`/os/record/${run.id}`, locale)} className="mayda-row mayda-os-record-row">
                <div>
                  <strong>{run.topic}</strong>
                  <br />
                  <span className="mayda-invoice-sub">
                    {format.format(new Date(run.created_at))} · {deskCopy.shapes[run.shape as "note" | "post" | "summary"]}
                    {run.status === "failed" ? " · failed" : ""}
                    {run.decision_note ? ` · "${run.decision_note}"` : ""}
                    {run.published_url ? " · published" : ""}
                  </span>
                </div>
                <span className={`mayda-status${run.decision === "approved" ? " is-active" : ""}`}>
                  {run.status === "failed" ? "—" : deskCopy.decisions[run.decision as "pending" | "approved" | "rejected"]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </OsShell>
  );
}
