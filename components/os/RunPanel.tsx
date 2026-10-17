"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { OpenApp } from "@/components/os/OpenApp";
import { REVIEW_INTENT_COPY } from "@/components/os/ReviewIntentFields";
import { OS_RUNS_CHANGED_EVENT } from "@/components/os/types";
import { OS_RUN_COPY } from "@/components/osCopy";
import type { Locale } from "@/lib/i18n";
import { formatUsd } from "@/lib/os";
import type { ReviewWorkKind } from "@/lib/osReviewGuard";
import {
  isOpenRun, parseAgentRunRow, parseAgentRunView, RUN_LIMITS, RUN_PAYERS,
  type AgentRunProgress, type AgentRunRow, type AgentRunStatus, type AgentRunView, type RunPayer,
} from "@/lib/osAgentRunTypes";

/* An agent run, as a person watches it.
 *
 * Everything on this panel is a fact the run row holds — its status, its
 * counters, what it spent, the closed list of things it did — rendered
 * through copy keys, never as the model's prose. Model text appears in two
 * places only, each under a label saying the model wrote it: the plan's
 * steps and the question it asked. Labels inside progress lines are record
 * and card titles, set as plain text.
 *
 * Every member of the company may watch a run; only the member who started
 * it may stop it, continue it or answer it, because SQL binds every one of
 * those to the run's actor. The panel therefore draws controls for the
 * starter alone (the server's `mine` flag) and words every sentence that
 * names a person for who is reading it (OS_RUN_COPY.viewer).
 *
 * No control here retries. Continue, answer and skip carry the sequence
 * number the person saw, so a stale tab is refused rather than acting twice;
 * a lost response is said to be unconfirmed and every view reads again.
 * Polling is read-only and runs only while a run is working and the tab is
 * visible: a waiting, paused, stalled or finished run changes only when a
 * person acts, and that person's window announces it.
 */

export const RUN_POLL_MS = { full: 2500, compact: 5000 } as const;
const DAY_MS = 86_400_000;

export type RunIdentity = { actorId: string; companyId: string };
export type RunFeed = { run: AgentRunView; serverNow: number };
export type RunQuote = { payer: RunPayer; priced: boolean; maxUsd: number; leftUsd: number };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function instant(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value > 0; }

/* One pass over the template: a record title that happens to contain
 * "{n}" is shown as written, not filled a second time. */
function fillOnce(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => Object.hasOwn(values, key) ? values[key] : match);
}

/** Only a working run changes by itself. */
export function shouldPollRun(run: Pick<AgentRunView, "status" | "stalled">): boolean {
  return run.status === "running" && !run.stalled;
}
export function runsNeedPolling(runs: readonly Pick<AgentRunView, "status" | "stalled">[]): boolean {
  return runs.some(shouldPollRun);
}

/** The co-founder window shows the viewer's open run, or their latest one for
 * a day after it finished — a day by the server's clock, never the page's. */
export function runShownInWindow(run: Pick<AgentRunView, "status" | "finished_at">, serverNow: number): boolean {
  if (isOpenRun(run.status)) return true;
  return run.finished_at !== null && serverNow - Date.parse(run.finished_at) <= DAY_MS;
}

/** seq only grows (the SQL guard sequences every change but the usage totals,
 * which move cost and updated_at alone), so a response older than what is
 * shown is dropped. */
export function isNewerRun(current: Pick<AgentRunRow, "seq" | "updated_at"> | null, next: Pick<AgentRunRow, "seq" | "updated_at">): boolean {
  if (!current) return true;
  return next.seq > current.seq || (next.seq === current.seq && Date.parse(next.updated_at) >= Date.parse(current.updated_at));
}

export type RunSignalState = { cards: number; finished: boolean; status: AgentRunStatus | null };
export const RUN_SIGNALS_START: RunSignalState = { cards: -1, finished: false, status: null };

/** What a freshly read run asks of the window around it. Read the cards
 * again when the run holds more than the window shows (once per count, so a
 * window that cannot catch up is not asked every poll); read everything
 * again once, when the run ends while the window still thought it open. */
export function runSignals(seen: RunSignalState, next: Pick<AgentRunView, "cards" | "status">, around: { knownCards: number; turnOpen: boolean }) {
  const ended = !isOpenRun(next.status);
  const cardsChanged = next.cards > around.knownCards && next.cards !== seen.cards;
  const finished = ended && !seen.finished && (seen.status !== null || around.turnOpen);
  return {
    cardsChanged, finished,
    seen: { cards: cardsChanged ? next.cards : seen.cards, finished: seen.finished || ended, status: next.status } satisfies RunSignalState,
  };
}

export function runStatusText(run: Pick<AgentRunView, "status" | "stalled" | "mine">, locale: Locale): string {
  const copy = OS_RUN_COPY[locale];
  const viewer = run.mine ? copy.viewer.mine : copy.viewer.other;
  if (run.stalled) return copy.status.stalled;
  if (run.status === "waiting") return viewer.waiting;
  if (run.status === "canceled") return viewer.canceled;
  return copy.status[run.status];
}

/** One progress entry, in words. The kinds are SQL's closed vocabulary; the
 * ones that name a person are worded for the reader. */
export function runProgressText(entry: AgentRunProgress, locale: Locale, mine: boolean): string {
  const copy = OS_RUN_COPY[locale];
  const viewer = mine ? copy.viewer.mine : copy.viewer.other;
  const n = String(entry.n ?? 0);
  switch (entry.k) {
    case "plan": case "search": case "memory": return fillOnce(copy.progress[entry.k], { n });
    case "refused": return fillOnce(copy.progress.refused, { n: String(entry.n ?? 1) });
    // n is the item's waiting_days when it was read: whole days unchanged, the
    // Needs-you number. Said as that count, never as a date relative to now
    // ("yesterday"), which would be true only on the day it was read.
    case "read": return fillOnce(copy.progress.read, { label: entry.label ?? "", n });
    case "card": return fillOnce(copy.progress.card, { label: entry.label ?? "" });
    case "asked": case "answered": case "skipped": case "stopped": return viewer[entry.k];
    default: return copy.progress[entry.k];
  }
}

function stopReasonText(run: Pick<AgentRunView, "stop_reason" | "mine">, locale: Locale): string | null {
  const copy = OS_RUN_COPY[locale];
  if (!run.stop_reason) return null;
  if (run.stop_reason === "canceled") return (run.mine ? copy.viewer.mine : copy.viewer.other).stoppedReason;
  return copy.stopReasons[run.stop_reason];
}

/* Reads. Each is narrowed before it is shown: a run that does not parse is
 * an unavailable read, never an empty one. */

export async function fetchRunFeed(id: string, request: typeof fetch = fetch): Promise<RunFeed | null> {
  const response = await request(`/api/os/runs?id=${encodeURIComponent(id)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("runs_unavailable");
  const value: unknown = await response.json();
  const run = record(value) ? parseAgentRunView(value.run) : null;
  if (!run || run.id !== id || !record(value) || !instant(value.serverNow)) throw new Error("runs_unavailable");
  return { run, serverNow: value.serverNow };
}

export async function fetchRunsFeed(request: typeof fetch = fetch): Promise<{ runs: AgentRunView[]; serverNow: number }> {
  const response = await request("/api/os/runs", { cache: "no-store" });
  if (!response.ok) throw new Error("runs_unavailable");
  const value: unknown = await response.json();
  if (!record(value) || !Array.isArray(value.runs) || !instant(value.serverNow)) throw new Error("runs_unavailable");
  const runs = value.runs.map(parseAgentRunView);
  if (runs.some((run) => run === null)) throw new Error("runs_unavailable");
  return { runs: runs as AgentRunView[], serverNow: value.serverNow };
}

/** What a run would cost at most, before it starts. null: no model to run on. */
export async function fetchRunQuote(request: typeof fetch = fetch): Promise<RunQuote | null> {
  const response = await request("/api/os/runs?quote=1", { cache: "no-store" });
  if (!response.ok) throw new Error("quote_unavailable");
  const value: unknown = await response.json();
  if (!record(value) || !Object.hasOwn(value, "quote")) throw new Error("quote_unavailable");
  const quote = value.quote;
  if (quote === null) return null;
  if (!record(quote) || !RUN_PAYERS.some((payer) => payer === quote.payer) || typeof quote.priced !== "boolean" ||
    typeof quote.maxUsd !== "number" || !Number.isFinite(quote.maxUsd) || quote.maxUsd < 0 ||
    typeof quote.leftUsd !== "number" || !Number.isFinite(quote.leftUsd) || quote.leftUsd < 0) throw new Error("quote_unavailable");
  return { payer: quote.payer as RunPayer, priced: quote.priced, maxUsd: quote.maxUsd, leftUsd: quote.leftUsd };
}

/* Writes. One request each, never retried. A 200 or 202 is a result only
 * when it carries a parsed receipt for this run, this person, this company. */

function runReceipt(value: unknown, runId: string, identity: RunIdentity): AgentRunRow | null {
  const run = record(value) ? parseAgentRunRow(value.run) : null;
  return run && run.id === runId && run.actor_id === identity.actorId && run.company_id === identity.companyId ? run : null;
}

/* What the route refuses before, or instead of, starting: each proves that
 * nothing began. Anything else — a 409 run_unconfirmed, a lost response, an
 * unreadable body — may follow a begun run and is unconfirmed. */
const START_REFUSED = new Set([
  "not_configured", "origin", "content_type", "not_signed_in", "invalid_request", "no_company", "review_access_denied",
  "key_unavailable", "model_settings_unavailable", "model_settings_invalid", "agent_run_active", "budget", "run_unavailable", "run_refused",
]);
export type RunStartOutcome =
  | { kind: "started"; run: AgentRunRow }
  | { kind: "refused"; error: string }
  | { kind: "identity_changed" }
  | { kind: "unconfirmed" };

export async function sendRunStart(start: { runId: string; instruction: string; draftFormat: ReviewWorkKind }, identity: RunIdentity, request: typeof fetch = fetch): Promise<RunStartOutcome> {
  let response: Response;
  try {
    response = await request("/api/os/runs", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "start", runId: start.runId, instruction: start.instruction, draftFormat: start.draftFormat,
        expectedActorId: identity.actorId, expectedCompanyId: identity.companyId }),
    });
  } catch { return { kind: "unconfirmed" }; }
  const value: unknown = await response.json().catch(() => null);
  if (response.status === 200 || response.status === 202) {
    const run = runReceipt(value, start.runId, identity);
    return run ? { kind: "started", run } : { kind: "unconfirmed" };
  }
  const error = record(value) && typeof value.error === "string" ? value.error : null;
  if (error === "identity_changed") return { kind: "identity_changed" };
  return error && START_REFUSED.has(error) ? { kind: "refused", error } : { kind: "unconfirmed" };
}

export type RunCommand =
  | { action: "continue" | "skip"; runId: string; expectedSeq: number }
  | { action: "answer"; runId: string; expectedSeq: number; answer: string }
  | { action: "cancel"; runId: string };
export type RunCommandRefusal = "stale" | "model_changed" | "not_resumable" | "slice_limit" | "identity_changed" | "not_read" | "unavailable" | "unconfirmed";
export type RunCommandResult = { ok: true; run: AgentRunRow } | { ok: false; reason: RunCommandRefusal };

const COMMAND_REFUSALS: Record<string, RunCommandRefusal> = {
  agent_run_stale: "stale", model_changed: "model_changed", agent_run_not_resumable: "not_resumable",
  agent_run_slice_limit: "slice_limit", identity_changed: "identity_changed",
};

export async function sendRunCommand(command: RunCommand, identity: RunIdentity, request: typeof fetch = fetch): Promise<RunCommandResult> {
  let response: Response;
  try {
    response = await request("/api/os/runs", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...command, expectedActorId: identity.actorId, expectedCompanyId: identity.companyId }),
    });
  } catch { return { ok: false, reason: "unconfirmed" }; }
  const value: unknown = await response.json().catch(() => null);
  if (response.ok) {
    const run = runReceipt(value, command.runId, identity);
    return run ? { ok: true, run } : { ok: false, reason: "unconfirmed" };
  }
  const error = record(value) && typeof value.error === "string" ? value.error : "";
  if (response.status === 409 && Object.hasOwn(COMMAND_REFUSALS, error)) return { ok: false, reason: COMMAND_REFUSALS[error] };
  // The route answers 503 before it touches the run: either the run itself
  // could not be read, or the model could not be reached. Each is said as it
  // is — a failed read is not the AI being unavailable.
  if (response.status === 503) return { ok: false, reason: error === "runs_unavailable" ? "not_read" : "unavailable" };
  return { ok: false, reason: "unconfirmed" };
}

const stack: CSSProperties = { display: "grid", gap: ".75rem", minWidth: 0 };
const textStyle: CSSProperties = { margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.55 };
const subdued: CSSProperties = { ...textStyle, fontSize: ".85rem", color: "var(--os-ink-2, #aab6c8)" };
const labelStyle: CSSProperties = { ...textStyle, fontSize: ".9rem", fontWeight: 600 };
const quoteStyle: CSSProperties = { margin: 0, paddingLeft: ".75rem", borderLeft: "2px solid var(--os-line-2, #2b3442)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" };
const listStyle: CSSProperties = { margin: 0, paddingInlineStart: "1.2rem", display: "grid", gap: ".3rem", overflowWrap: "anywhere" };
const actionsStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: ".6rem", alignItems: "center" };
const buttonStyle: CSSProperties = { maxWidth: "100%", whiteSpace: "normal", overflowWrap: "anywhere", minHeight: "2.75rem" };
const fieldStyle: CSSProperties = { width: "100%", minWidth: 0, maxWidth: "100%", boxSizing: "border-box", resize: "vertical" };
const fullPanel: CSSProperties = { ...stack, padding: "clamp(.85rem, 3vw, 1.25rem)", border: "1px solid var(--os-line, #2b3442)", borderRadius: ".8rem", background: "var(--os-surface, #111823)", overflowWrap: "anywhere" };

/* identity_changed is refused before the route touches anything, so it is
 * said as the identity notice — never as an unconfirmed state. */
const NOTICE: Record<RunCommandRefusal, "stale" | "modelChanged" | "notResumable" | "sliceLimit" | "identityChanged" | "notRead" | "unavailable" | "unconfirmed"> = {
  stale: "stale", model_changed: "modelChanged", not_resumable: "notResumable", slice_limit: "sliceLimit",
  identity_changed: "identityChanged", not_read: "notRead", unavailable: "unavailable", unconfirmed: "unconfirmed",
};

export function RunPanel({ run, locale, variant, identity, onRun }: {
  run: AgentRunView; locale: Locale; variant: "full" | "compact"; identity: RunIdentity | null;
  /** A control's confirmed receipt, so the badge changes at once. */
  onRun?: (next: AgentRunRow) => void;
}) {
  const copy = OS_RUN_COPY[locale];
  const viewer = run.mine ? copy.viewer.mine : copy.viewer.other;
  const headingId = useId();
  const [answer, setAnswer] = useState("");
  const [acting, setActing] = useState<RunCommand["action"] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const locked = useRef(false);
  const controls = run.mine && identity !== null;
  const terminal = !isOpenRun(run.status);
  const waiting = run.status === "waiting" && run.question !== null;
  const resumable = run.status === "paused" || run.stalled;
  const busy = acting !== null;
  // Colour means this needs a person — the starter, when it waits on them.
  const attention = run.mine && (run.status === "waiting" || resumable);
  const format = run.draftFormat ? REVIEW_INTENT_COPY[locale].formats[run.draftFormat] : null;
  const cards = run.plan
    ? fillOnce(copy.cardsPlanned, { cards: String(run.cards), planned: String(run.plan.refs.length) })
    : fillOnce(copy.cardsUnplanned, { cards: String(run.cards) });
  const spend = run.priced ? fillOnce(copy.spend, { spent: formatUsd(run.cost_usd), ceiling: formatUsd(run.ceiling_usd) }) : copy.spendLocal;
  const counters = fillOnce(copy.counters, { step: String(run.rounds), maxSteps: String(RUN_LIMITS.rounds), reads: String(run.item_reads) });
  const progress = variant === "compact" ? run.progress.slice(-3) : run.progress;
  const stopReason = terminal ? stopReasonText(run, locale) : null;

  async function act(command: RunCommand) {
    if (locked.current || !identity || !run.mine) return;
    if (command.action === "cancel" && !window.confirm(copy.cancelConfirm)) return;
    locked.current = true;
    setActing(command.action);
    setNotice(null);
    try {
      const result = await sendRunCommand(command, identity);
      if (result.ok) {
        if (command.action === "answer") setAnswer("");
        onRun?.(result.run);
      } else {
        setNotice(copy[NOTICE[result.reason]]);
      }
      // Every view of runs reads again, this one included: after a receipt,
      // a refusal or a lost response alike, the server says what is true.
      window.dispatchEvent(new CustomEvent(OS_RUNS_CHANGED_EVENT));
    } finally {
      locked.current = false;
      setActing(null);
    }
  }
  const stop = <button type="button" className="mayda-button mayda-button-outline" style={buttonStyle} disabled={busy}
    onClick={() => { void act({ action: "cancel", runId: run.id }); }}>{acting === "cancel" ? copy.stopping : copy.cancel}</button>;

  const progressList = progress.length ? <div style={{ ...stack, gap: ".35rem" }}>
    {variant === "full" ? <p style={labelStyle}>{copy.progressHeading}</p> : null}
    <ol style={listStyle}>{progress.map((entry, index) => <li key={`${entry.at}:${index}`} data-progress={entry.k} style={subdued}>{runProgressText(entry, locale, run.mine)}</li>)}</ol>
  </div> : null;

  const questionCard = waiting && run.question ? <div role="group" aria-label={viewer.questionHeading} style={{ ...stack, gap: ".55rem", borderLeft: "2px solid var(--os-accent, #42f5b6)", paddingLeft: ".8rem" }}>
    <p style={labelStyle}>{viewer.questionHeading}</p>
    <p style={subdued}>{copy.question.from}</p>
    <blockquote style={quoteStyle}>{run.question.text}</blockquote>
    {run.question.why ? <><p style={subdued}>{copy.question.why}</p><p style={textStyle}>{run.question.why}</p></> : null}
    {controls ? <form style={{ ...stack, gap: ".55rem" }} onSubmit={(event) => {
      event.preventDefault();
      if (answer.trim()) void act({ action: "answer", runId: run.id, expectedSeq: run.seq, answer: answer.trim() });
    }}>
      {run.question.options.length ? <div style={actionsStyle}>
        {run.question.options.map((option, index) => <button key={index} type="button" className="mayda-button mayda-button-outline" style={buttonStyle} disabled={busy} onClick={() => setAnswer(option)}>{option}</button>)}
      </div> : null}
      <textarea name="run-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={3} maxLength={RUN_LIMITS.answer}
        placeholder={copy.question.placeholder} aria-label={copy.question.placeholder} disabled={busy} style={fieldStyle} />
      <p style={subdued}>{copy.question.note}</p>
      <div style={actionsStyle}>
        <button type="submit" className="mayda-button" style={buttonStyle} disabled={busy || !answer.trim()}>{acting === "answer" ? copy.question.answering : copy.question.answer}</button>
        <button type="button" className="mayda-button mayda-button-outline" style={buttonStyle} disabled={busy}
          onClick={() => { void act({ action: "skip", runId: run.id, expectedSeq: run.seq }); }}>{acting === "skip" ? copy.question.answering : copy.question.skip}</button>
        {stop}
      </div>
    </form> : <p style={subdued}>{copy.question.other}</p>}
  </div> : null;

  const resumeBlock = resumable ? <div style={{ ...stack, gap: ".55rem" }}>
    <p style={textStyle}>{run.stalled ? viewer.stalledHelp : viewer.pausedHelp}</p>
    {/* Continuing a local run costs nothing, so it is never said to spend. */}
    {controls && run.priced ? <p style={subdued}>{copy.continueHelp}</p> : null}
    {controls ? <div style={actionsStyle}>
      <button type="button" className="mayda-button" style={buttonStyle} disabled={busy}
        onClick={() => { void act({ action: "continue", runId: run.id, expectedSeq: run.seq }); }}>{acting === "continue" ? copy.continuing : copy.continue}</button>
      {stop}
    </div> : null}
  </div> : null;

  const workingStop = controls && run.status === "running" && !run.stalled ? <div style={actionsStyle}>{stop}</div> : null;
  const ending = stopReason ? <div role="status" style={{ ...stack, gap: ".35rem" }}>
    <p style={textStyle}>{stopReason}</p>
    <p style={subdued}>{viewer.boundary}</p>
  </div> : null;
  const alert = notice ? <p role="alert" style={textStyle}>{notice}</p> : null;
  const badge = <span className={`mayda-status${attention ? " is-active" : ""}`}>{runStatusText(run, locale)}</span>;

  if (variant === "compact") {
    return <article className="mayda-card mayda-os-run" aria-labelledby={headingId} data-run-status={run.stalled ? "stalled" : run.status}>
      <div className="mayda-os-run-head">
        <div style={{ minWidth: 0, flex: "1 1 12rem" }}>
          <p className="mayda-kicker">{viewer.by}</p>
          <strong id={headingId} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{run.instruction}</strong>
        </div>
        {badge}
      </div>
      {run.plan ? <p className="mayda-note" style={{ margin: 0 }}>{fillOnce(copy.planCount, { n: String(run.plan.steps.length) })}</p> : null}
      <p className="mayda-note" style={{ margin: 0 }}>{cards}</p>
      <p className="mayda-note" style={{ margin: 0 }}>{spend}</p>
      {progressList}
      {questionCard}
      {resumeBlock}
      {workingStop}
      {ending}
      {alert}
      {/* Where the cards are, only when there are some to find. */}
      {run.cards > 0 ? <p className="mayda-note" style={{ margin: 0 }}>{viewer.cardsWhere}</p> : null}
      {/* Only the starter's window holds the cards; anyone else's would open onto their own. */}
      {run.mine ? <OpenApp app="cofounder">{copy.openCofounder}</OpenApp> : null}
    </article>;
  }

  return <section aria-labelledby={headingId} data-run-status={run.stalled ? "stalled" : run.status} style={fullPanel}>
    <header style={{ ...actionsStyle, justifyContent: "space-between" }}>
      <h2 id={headingId} style={{ fontSize: "1rem", margin: 0 }}>{copy.panelHeading}</h2>
      {badge}
    </header>
    <p style={subdued}>{format ? `${viewer.by} · ${format}` : viewer.by}</p>
    <div style={{ ...stack, gap: ".3rem" }}>
      <p style={subdued}>{copy.instructionLabel}</p>
      <blockquote style={quoteStyle}>{run.instruction}</blockquote>
    </div>
    {run.plan ? <div style={{ ...stack, gap: ".3rem" }}>
      <p style={labelStyle}>{copy.plan}</p>
      <p style={subdued}>{copy.planNote}</p>
      <ol style={listStyle}>{run.plan.steps.map((step, index) => <li key={index} style={textStyle}>{step}</li>)}</ol>
    </div> : null}
    <div style={{ ...stack, gap: ".2rem" }}>
      <p style={textStyle}>{cards}</p>
      <p style={subdued}>{counters}</p>
      <p style={subdued}>{spend}</p>
    </div>
    {progressList}
    {questionCard}
    {resumeBlock}
    {workingStop}
    {ending}
    {alert}
  </section>;
}

/** The co-founder window's panel: the viewer's own run, read by id, followed
 * while it works. When it lands more cards than the window shows, the window
 * reads its cards again; when it ends, everything reads again. */
export function LiveRunPanel({ runId, locale, identity, knownCards, turnOpen, onCardsChanged, onFinished }: {
  runId: string; locale: Locale; identity: RunIdentity | null;
  /** This run's cards the window already shows, and whether its turn still reads as open there. */
  knownCards: number; turnOpen: boolean;
  onCardsChanged: () => void; onFinished: () => void;
}) {
  const [feed, setFeed] = useState<RunFeed | null>(null);
  const [failed, setFailed] = useState(false);
  const shown = useRef<AgentRunRow | null>(null);
  const seen = useRef<RunSignalState>(RUN_SIGNALS_START);
  const around = useRef({ knownCards, turnOpen, onCardsChanged, onFinished });
  useEffect(() => { around.current = { knownCards, turnOpen, onCardsChanged, onFinished }; });
  const polling = feed !== null && shouldPollRun(feed.run);

  const adopt = useCallback((next: RunFeed) => {
    if (!isNewerRun(shown.current, next.run)) return;
    shown.current = next.run;
    setFeed(next);
    const signals = runSignals(seen.current, next.run, around.current);
    seen.current = signals.seen;
    if (signals.cardsChanged) around.current.onCardsChanged();
    if (signals.finished) around.current.onFinished();
  }, []);

  useEffect(() => {
    let live = true;
    const load = async () => {
      let next: RunFeed | null;
      try { next = await fetchRunFeed(runId); } catch { if (live) setFailed(true); return; }
      if (!live) return;
      setFailed(false);
      if (next) adopt(next);
    };
    void load();
    const timer = polling ? window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, RUN_POLL_MS.full) : undefined;
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
  }, [runId, polling, adopt]);

  const readFailed = failed ? <p className="os-chat-notice" role="status">{OS_RUN_COPY[locale].readFailed}</p> : null;
  if (!feed) return readFailed;
  if (!runShownInWindow(feed.run, feed.serverNow)) return null;
  return <>
    <RunPanel run={feed.run} locale={locale} variant="full" identity={identity}
      onRun={(row) => adopt({ run: { ...feed.run, ...row, stalled: false }, serverNow: feed.serverNow })} />
    {readFailed}
  </>;
}
