"use client";

import { useEffect, useId, useState } from "react";
import { fetchRunsFeed, isNewerRun, RUN_POLL_MS, RunPanel, runsNeedPolling, type RunIdentity } from "@/components/os/RunPanel";
import { OS_RUNS_CHANGED_EVENT } from "@/components/os/types";
import { OS_RUN_COPY } from "@/components/osCopy";
import type { Locale } from "@/lib/i18n";
import type { AgentRunRow, AgentRunView } from "@/lib/osAgentRunTypes";

/* Runs, in Running.
 *
 * The company's open runs and its recent ones, as the server read them for
 * this page, kept current while any of them is working. Every member sees
 * every run here; each panel says whose it is, and only the starter's own
 * carries Stop, Continue or the answer form. The cards themselves stay in
 * the starter's co-founder window, which is where they are decided.
 *
 * It reads again every five seconds only while a run is working and the tab
 * is visible, when the tab comes back, and when another window announces a
 * change — never on its own schedule otherwise, because nothing else moves a
 * run but a person. A failed read keeps what is shown: the server render it
 * started from was true when it was read, and the next read may succeed.
 */
export function AgentRunsLive({ locale, initialRuns, serverNow, identity }: {
  locale: Locale; initialRuns: AgentRunView[]; serverNow: number; identity: RunIdentity;
}) {
  const copy = OS_RUN_COPY[locale];
  const headingId = useId();
  const [feed, setFeed] = useState({ runs: initialRuns, serverNow });
  const polling = runsNeedPolling(feed.runs);

  useEffect(() => {
    let live = true;
    const load = async () => {
      let next: Awaited<ReturnType<typeof fetchRunsFeed>>;
      try { next = await fetchRunsFeed(); } catch { return; }
      if (live) setFeed((current) => next.serverNow >= current.serverNow ? next : current);
    };
    // A window put away and brought back mounts its effects again: read then too.
    void load();
    const timer = polling ? window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, RUN_POLL_MS.compact) : undefined;
    const onVisible = () => { if (document.visibilityState === "visible") void load(); };
    const onRuns = () => { void load(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(OS_RUNS_CHANGED_EVENT, onRuns);
    return () => {
      live = false;
      if (timer !== undefined) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(OS_RUNS_CHANGED_EVENT, onRuns);
    };
  }, [polling]);

  const adopt = (row: AgentRunRow) => setFeed((current) => ({
    ...current,
    runs: current.runs.map((run) => run.id === row.id && isNewerRun(run, row) ? { ...run, ...row, stalled: false } : run),
  }));

  return (
    <section aria-labelledby={headingId} className="mayda-stack" style={{ gap: "0.75rem" }}>
      <h2 id={headingId} className="mayda-kicker" style={{ margin: 0 }}>{copy.heading}</h2>
      {feed.runs.length ? feed.runs.map((run) => (
        <RunPanel key={run.id} run={run} locale={locale} variant="compact" identity={identity} onRun={adopt} />
      )) : <p className="mayda-note" style={{ margin: 0 }}>{copy.empty}</p>}
    </section>
  );
}
