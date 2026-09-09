import type { Metadata } from "next";
import Link from "next/link";
import { OS_DESK_COPY } from "@/components/osCopy";
import { formatUsd } from "@/lib/os";
import { requireOsSession } from "@/lib/osSession";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";

export const metadata: Metadata = { title: "Your work", robots: { index: false, follow: false } };

const COPY = {
  en: {
    heading: "Everything that happened here",
    intro: "Every run, what it cost, and what you decided. Nothing is hidden and nothing is summarised away.",
    empty: "Nothing yet.",
    back: "Back to your account",
    totals: "runs · approved · sent back · sources cited",
    spent: "spent in total",
  },
  tr: {
    heading: "Burada olan biten her şey",
    intro: "Her çalıştırma, maliyeti ve verdiğiniz karar. Hiçbir şey gizlenmez, hiçbir şey özetlenip yok edilmez.",
    empty: "Henüz bir şey yok.",
    back: "Hesabınıza dönün",
    totals: "çalıştırma · onaylandı · geri gönderildi · kaynak gösterildi",
    spent: "toplam harcama",
  },
  fr: {
    heading: "Tout ce qui s'est passé ici",
    intro: "Chaque exécution, ce qu'elle a coûté, et ce que vous avez décidé. Rien n'est caché, rien n'est résumé à la hâte.",
    empty: "Rien pour l'instant.",
    back: "Retour à votre compte",
    totals: "exécutions · approuvées · renvoyées · sources citées",
    spent: "dépensé au total",
  },
} as const;

export default async function PortalWorkPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];
  const deskCopy = OS_DESK_COPY[locale];
  const { claims, supabase } = await requireOsSession();

  const { data: runs } = await supabase
    .from("os_runs")
    .select("id, topic, shape, status, decision, decision_note, published_url, sources, cost_usd, decided_at, created_at")
    .eq("user_id", claims.sub)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = runs ?? [];
  const drafted = rows.filter((run) => run.status === "drafted");
  const approved = drafted.filter((run) => run.decision === "approved").length;
  const rejected = drafted.filter((run) => run.decision === "rejected").length;
  const cited = new Set(
    drafted.flatMap((run) => (Array.isArray(run.sources) ? (run.sources as { url?: string }[]) : []).map((s) => s?.url).filter(Boolean)),
  );
  const spent = rows.reduce((total, run) => total + Number(run.cost_usd ?? 0), 0);
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mayda-shell mayda-section mayda-stack-lg" style={{ maxWidth: "64rem" }}>
      <Link href={localizePath("/portal", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
        ← {copy.back}
      </Link>

      <header className="mayda-stack" style={{ gap: "0.5rem" }}>
        <p className="mayda-kicker" style={{ margin: 0 }}>{deskCopy.kicker}</p>
        <h1 className="mayda-heading">{copy.heading}</h1>
        <p className="mayda-body">{copy.intro}</p>
        <p className="mayda-os-credits">
          <strong>{drafted.length}</strong> · <strong>{approved}</strong> · <strong>{rejected}</strong> ·{" "}
          <strong>{cited.size}</strong> <span>{copy.totals}</span>
        </p>
        {rows.length > 0 ? (
          <p className="mayda-os-credits"><strong>{formatUsd(spent)}</strong> <span>{copy.spent}</span></p>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <p className="mayda-body">{copy.empty}</p>
      ) : (
        <div className="mayda-stack" style={{ gap: "0.5rem" }}>
          {rows.map((run) => (
            <Link key={run.id} href={localizePath(`/portal/work/${run.id}`, locale)} className="mayda-row mayda-os-record-row">
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
  );
}
