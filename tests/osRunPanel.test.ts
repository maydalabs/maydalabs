import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  RUN_SIGNALS_START, RunPanel, fetchRunFeed, fetchRunQuote, isNewerRun, runProgressText, runShownInWindow, runSignals,
  runStatusText, runsNeedPolling, sendRunCommand, sendRunStart, shouldPollRun,
} from "@/components/os/RunPanel";
import { OS_RUN_COPY } from "@/components/osCopy";
import { AGENT_RUN_STATUSES, type AgentRunView } from "@/lib/osAgentRunTypes";
import type { Locale } from "@/lib/i18n";
import { RUN_ACTOR, RUN_COMPANY, RUN_ID, RUN_QUESTION, everyProgress, runRow, runView } from "./helpers/agentRunView";

/* The run panel, rendered without a DOM: what a starter and what any other
 * member reads, in both variants, and the read-only rules that decide when it
 * polls and when it asks the window around it to read again. Interaction
 * (Stop's confirmation, answering) is in tests/osRunPanelInteraction.test.ts. */

vi.mock("@/components/os/OpenApp", () => ({ OpenApp: ({ children }: { children: unknown }) => createElement("button", { "data-open-app": "" }, children as string) }));

const identity = { actorId: RUN_ACTOR, companyId: RUN_COMPANY };
function render(run: AgentRunView, locale: Locale = "en", variant: "full" | "compact" = "full", who: typeof identity | null = identity) {
  return renderToStaticMarkup(createElement(RunPanel, { run, locale, variant, identity: who }));
}
function decoded(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&quot;/g, "\"").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
}
const SECOND_PERSON: Record<Locale, RegExp> = {
  en: /\b(you|your|yours)\b/i,
  fr: /\b(vous|votre|vos)\b/i,
  // Turkish says "you" with a pronoun or a second-person suffix ("yalnız", only, is neither).
  tr: /\b(siz|size|sizi|sizin)\b|(?<!yal)(ınız|iniz|unuz|ünüz|nız|niz|nuz|nüz)/i,
};
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

/** One run in every state a person can see: each status, plus stalled. */
function everyState(mine: boolean): AgentRunView[] {
  const base = { mine, progress: everyProgress() };
  return [
    runView({ ...base, status: "running" }),
    runView({ ...base, status: "running", stalled: true }),
    runView({ ...base, status: "waiting", asked: true, question: RUN_QUESTION, lease_until: null }),
    runView({ ...base, status: "paused", lease_until: null }),
    runView({ ...base, status: "completed", stop_reason: "done", lease_until: null, finished_at: "2026-10-17T10:09:00.000Z" }),
    runView({ ...base, status: "failed", stop_reason: "storage", lease_until: null, finished_at: "2026-10-17T10:09:00.000Z" }),
    runView({ ...base, status: "canceled", stop_reason: "canceled", lease_until: null, finished_at: "2026-10-17T10:09:00.000Z" }),
  ];
}

describe("run panel: what a person reads", () => {
  it.each(["en", "tr", "fr"] as const)("a member who did not start the run reads no second person anywhere, in %s", (locale) => {
    for (const run of everyState(false)) {
      for (const variant of ["full", "compact"] as const) {
        const text = decoded(render(run, locale, variant));
        const where = `${run.status}${run.stalled ? "/stalled" : ""} ${variant}`;
        expect(text, where).not.toMatch(SECOND_PERSON[locale]);
        // And not one sentence written for the starter.
        for (const sentence of Object.values(OS_RUN_COPY[locale].viewer.mine)) expect(text, `${where}: ${sentence}`).not.toContain(sentence);
      }
    }
  });

  it.each(["en", "tr", "fr"] as const)("the starter reads the run as their own, in %s", (locale) => {
    const copy = OS_RUN_COPY[locale];
    const waiting = render(runView({ status: "waiting", asked: true, question: RUN_QUESTION, lease_until: null }), locale);
    expect(waiting).toContain(copy.viewer.mine.waiting);
    expect(waiting).toContain(copy.viewer.mine.questionHeading);
    expect(waiting).toContain(copy.viewer.mine.by);
    const canceled = render(runView({ status: "canceled", stop_reason: "canceled", lease_until: null, finished_at: "2026-10-17T10:09:00.000Z" }), locale);
    expect(canceled).toContain(copy.viewer.mine.canceled);
    expect(canceled).toContain(copy.viewer.mine.stoppedReason);
    expect(canceled).toContain(copy.viewer.mine.boundary);
  });

  it.each(["en", "tr", "fr"] as const)("shows the question form to the starter only; everyone else sees who it waits for, in %s", (locale) => {
    const copy = OS_RUN_COPY[locale];
    const asked = { status: "waiting" as const, asked: true, question: RUN_QUESTION, lease_until: null };
    const mine = render(runView(asked), locale);
    expect(mine).toContain("<form");
    expect(mine).toContain('name="run-answer"');
    expect(mine).toContain('maxLength="1000"');
    expect(mine).toContain(`>${copy.question.answer}</button>`);
    expect(mine).toContain(`>${copy.question.skip}</button>`);
    expect(mine).toContain(`>${copy.cancel}</button>`);
    for (const option of RUN_QUESTION.options) expect(mine).toContain(`>${option}</button>`);
    expect(mine).not.toContain(copy.question.other);

    const other = render(runView({ ...asked, mine: false }), locale);
    expect(other).not.toContain("<form");
    expect(other).not.toContain("<textarea");
    expect(other).not.toContain("<button");
    expect(other).toContain(copy.question.other);
    expect(other).toContain(copy.viewer.other.questionHeading);
    // The question and its reason are the model's words, each under its label.
    expect(other).toContain(copy.question.from);
    expect(other).toContain(RUN_QUESTION.text);
    expect(other).toContain(copy.question.why);
  });

  it("keeps the controls hidden when the tab no longer knows who is signed in", () => {
    const html = render(runView({ status: "paused", lease_until: null }), "en", "full", null);
    expect(html).not.toContain("<button");
  });

  it.each(["paused", "stalled"] as const)("offers Continue and Stop on a %s run to the starter only", (state) => {
    const run = runView(state === "paused" ? { status: "paused", lease_until: null } : { status: "running", stalled: true });
    const copy = OS_RUN_COPY.en;
    const mine = render(run);
    expect(mine).toContain(`>${copy.continue}</button>`);
    expect(mine).toContain(`>${copy.cancel}</button>`);
    expect(mine).toContain(state === "paused" ? copy.viewer.mine.pausedHelp : copy.viewer.mine.stalledHelp);
    expect(mine).toContain(state === "paused" ? copy.status.paused : copy.status.stalled);
    const other = render({ ...run, mine: false });
    expect(other).not.toContain(copy.continue);
    expect(other).not.toContain("<button");
    expect(other).toContain(state === "paused" ? copy.viewer.other.pausedHelp : copy.viewer.other.stalledHelp);
  });

  it("says continuing spends money only when the run is priced", () => {
    const copy = OS_RUN_COPY.en;
    expect(decoded(render(runView({ status: "paused", lease_until: null })))).toContain(copy.continueHelp);
    const local = decoded(render(runView({ status: "paused", lease_until: null, priced: false, payer: "local", ceiling_usd: 0, cost_usd: 0 })));
    expect(local).not.toContain(copy.continueHelp);
    // A local run still continues; it is only never said to spend.
    expect(render(runView({ status: "paused", lease_until: null, priced: false, payer: "local", ceiling_usd: 0, cost_usd: 0 }))).toContain(`>${copy.continue}</button>`);
    expect(local).toContain(copy.spendLocal);
    expect(local).not.toContain("$");
  });

  it("offers Stop while a run works and nothing on a finished one", () => {
    const copy = OS_RUN_COPY.en;
    expect(render(runView())).toContain(`>${copy.cancel}</button>`);
    expect(render(runView())).not.toContain(copy.continue);
    const done = render(runView({ status: "completed", stop_reason: "done", lease_until: null, finished_at: "2026-10-17T10:09:00.000Z" }));
    expect(done).not.toContain("<button");
    expect(done).toContain(copy.stopReasons.done);
  });

  it("shows a failed run as failed, never as finished", () => {
    const copy = OS_RUN_COPY.en;
    const html = render(runView({ status: "failed", stop_reason: "storage", lease_until: null, finished_at: "2026-10-17T10:09:00.000Z",
      progress: [{ k: "failed", at: "2026-10-17T10:09:00.000Z" }] }));
    expect(html).toContain(copy.status.failed);
    expect(html).toContain(copy.stopReasons.storage);
    expect(html).toContain(copy.progress.failed);
    expect(html).not.toContain(`>${copy.progress.finished}<`);
    expect(html).not.toContain(copy.status.completed);
  });

  it("renders counters, spend, cards against the plan, and the plan under its model label", () => {
    const copy = OS_RUN_COPY.en;
    const html = render(runView());
    expect(html).toContain("Step 3 of at most 12 · records read: 2");
    expect(html).toContain("Cards prepared: 1 of 2 planned");
    expect(html).toContain("$0.12 of $1.00 for this run");
    expect(html).toContain(copy.plan);
    expect(html).toContain(copy.planNote);
    expect(html).toContain("<li style=\"margin:0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55\">Find the open items</li>");
    expect(html).toContain("Reply");
    expect(render(runView({ plan: null }))).toContain("Cards prepared: 1</p>");
  });

  it.each(["en", "tr", "fr"] as const)("never says a card still waits or is ready, in %s: the starter may have decided it", (locale) => {
    const copy = OS_RUN_COPY[locale];
    const stale = { en: /\b(ready|wait|waits|waiting for your review|stay for your review)\b/i, tr: /(hazır kart|hazırladığı kartlar hazır|bekliyor|incelemeniz için kalır)/i, fr: /(prêtes|attendent|restent à relire)/i }[locale];
    for (const sentence of [copy.cardsPlanned, copy.cardsUnplanned, copy.stopReasons.step_limit, copy.cancelConfirm, copy.viewer.mine.cardsWhere, copy.viewer.other.cardsWhere]) {
      expect(sentence).not.toMatch(stale);
    }
    // Where the cards are is said only when there are some.
    expect(render(runView({ cards: 0 }), locale, "compact")).not.toContain(copy.viewer.mine.cardsWhere);
  });

  it.each(["en", "tr", "fr"] as const)("says which spending limit stopped a run, in %s", (locale) => {
    const copy = OS_RUN_COPY[locale];
    const reasons = new Set<string>();
    for (const stop of ["budget", "month_budget", "daily_cap"] as const) {
      const html = render(runView({ status: "completed", stop_reason: stop, lease_until: null, finished_at: "2026-10-17T10:09:00.000Z", cost_usd: 0, rounds: 0 }), locale);
      expect(decoded(html)).toContain(copy.stopReasons[stop]);
      reasons.add(copy.stopReasons[stop]);
    }
    expect(reasons.size).toBe(3);
    // Today's cap is never said to be the run's own limit.
    expect(OS_RUN_COPY.en.stopReasons.daily_cap).toContain("today's");
    expect(OS_RUN_COPY.en.stopReasons.month_budget).toContain("this month's");
  });

  it("writes each progress line from its copy key, with titles as plain text", () => {
    const html = render(runView({ progress: [
      { k: "search", n: 7, at: "2026-10-17T10:00:00.000Z" },
      { k: "read", n: 3, label: "<img src=x onerror=alert(1)> {n}", at: "2026-10-17T10:00:00.000Z" },
      { k: "refused", n: 2, at: "2026-10-17T10:00:00.000Z" },
      { k: "card", label: "Follow up on invoice 42", at: "2026-10-17T10:00:00.000Z" },
    ] }));
    expect(html).toContain("Searched open Work — found: 7");
    expect(html).toContain("Read “&lt;img src=x onerror=alert(1)&gt; {n}” · days unchanged when read: 3");
    expect(html).not.toContain("<img");
    expect(html).toContain("Refused attempts: 2. Nothing from them was staged.");
    expect(html).toContain("Prepared a card: “Follow up on invoice 42”");
  });

  it.each([
    ["en", 0, "days unchanged when read: 0"], ["en", 1, "days unchanged when read: 1"], ["en", 9, "days unchanged when read: 9"],
    ["tr", 3, "okunduğunda değişmeden geçen gün: 3"], ["fr", 3, "jours sans changement à la lecture : 3"],
  ] as const)("says how long a record had gone unchanged when it was read, not a date relative to now (%s, %d)", (locale, n, words) => {
    const text = runProgressText({ k: "read", n, label: "Invoice", at: "2026-10-17T10:00:00.000Z" }, locale, true);
    expect(text).toContain(words);
    // "today", "yesterday", "N days ago" would be true only on the day it was read.
    expect(text).not.toMatch(/today|yesterday|ago|bugün|dün|önce|aujourd|hier|il y a/i);
  });

  it.each(["en", "tr", "fr"] as const)("words every progress kind from copy in %s", (locale) => {
    for (const entry of everyProgress()) {
      for (const mine of [true, false]) {
        const text = runProgressText(entry, locale, mine);
        expect(text, entry.k).toBeTruthy();
        expect(text, entry.k).not.toContain("undefined");
        expect(text, entry.k).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it("compact: one line of status and instruction, the last three things it did, and where the cards are", () => {
    const copy = OS_RUN_COPY.en;
    const run = runView({ progress: everyProgress() });
    const mine = render(run, "en", "compact");
    expect(mine).toContain("text-overflow:ellipsis");
    expect(mine).toContain(run.instruction);
    expect(mine).toContain(copy.status.running);
    expect(mine).toContain("Planned steps: 2");
    expect(mine.match(/data-progress="/g)).toHaveLength(3);
    expect(mine).toContain('data-progress="stopped"');
    expect(mine).not.toContain('data-progress="plan"');
    expect(mine).toContain(copy.viewer.mine.cardsWhere);
    expect(mine).toContain(copy.openCofounder);
    expect(mine).not.toContain(copy.plan);

    const other = render({ ...run, mine: false }, "en", "compact");
    expect(other).toContain(copy.viewer.other.cardsWhere);
    // Another member's co-founder window does not hold these cards.
    expect(other).not.toContain(copy.openCofounder);
  });

  it.each(AGENT_RUN_STATUSES)("names the %s status for both viewers from copy", (status) => {
    for (const locale of ["en", "tr", "fr"] as const) {
      for (const mine of [true, false]) expect(runStatusText({ status, stalled: false, mine }, locale)).toBeTruthy();
    }
    expect(runStatusText({ status: "running", stalled: true, mine: true }, "en")).toBe(OS_RUN_COPY.en.status.stalled);
  });
});

describe("run panel: when it reads again", () => {
  it("polls only a working run: never a waiting, paused, stalled or finished one", () => {
    expect(shouldPollRun({ status: "running", stalled: false })).toBe(true);
    expect(shouldPollRun({ status: "running", stalled: true })).toBe(false);
    for (const status of ["waiting", "paused", "completed", "failed", "canceled"] as const) expect(shouldPollRun({ status, stalled: false })).toBe(false);
    expect(runsNeedPolling([])).toBe(false);
    expect(runsNeedPolling([{ status: "waiting", stalled: false }, { status: "running", stalled: true }])).toBe(false);
    expect(runsNeedPolling([{ status: "completed", stalled: false }, { status: "running", stalled: false }])).toBe(true);
  });

  it("shows the viewer's open run, or the latest for a day after it finished, by the server's clock", () => {
    const now = Date.parse("2026-10-18T10:00:00.000Z");
    expect(runShownInWindow({ status: "waiting", finished_at: null }, now)).toBe(true);
    expect(runShownInWindow({ status: "completed", finished_at: "2026-10-17T10:00:01.000Z" }, now)).toBe(true);
    expect(runShownInWindow({ status: "canceled", finished_at: "2026-10-17T09:59:59.000Z" }, now)).toBe(false);
  });

  it("asks the window to read its cards once per new count, and everything once when the run ends", () => {
    const around = { knownCards: 1, turnOpen: true };
    let state = RUN_SIGNALS_START;
    let signals = runSignals(state, { cards: 1, status: "running" }, around);
    expect(signals).toMatchObject({ cardsChanged: false, finished: false });
    state = signals.seen;
    signals = runSignals(state, { cards: 2, status: "running" }, around);
    expect(signals.cardsChanged).toBe(true);
    state = signals.seen;
    // The window could not read yet: the same count does not ask again.
    signals = runSignals(state, { cards: 2, status: "running" }, around);
    expect(signals.cardsChanged).toBe(false);
    state = signals.seen;
    signals = runSignals(state, { cards: 3, status: "completed" }, { knownCards: 2, turnOpen: true });
    expect(signals).toMatchObject({ cardsChanged: true, finished: true });
    state = signals.seen;
    expect(runSignals(state, { cards: 3, status: "completed" }, { knownCards: 3, turnOpen: true }).finished).toBe(false);
  });

  it("does not ask for a read when a run the window already shows as closed is first read finished", () => {
    expect(runSignals(RUN_SIGNALS_START, { cards: 2, status: "completed" }, { knownCards: 2, turnOpen: false }).finished).toBe(false);
    // It ended between the window's read and the panel's: read again once.
    expect(runSignals(RUN_SIGNALS_START, { cards: 2, status: "canceled" }, { knownCards: 2, turnOpen: true }).finished).toBe(true);
  });

  it("drops a response older than what is shown", () => {
    const shown = { seq: 8, updated_at: "2026-10-17T10:01:00.000Z" };
    expect(isNewerRun(null, shown)).toBe(true);
    expect(isNewerRun(shown, { seq: 7, updated_at: "2026-10-17T10:02:00.000Z" })).toBe(false);
    expect(isNewerRun(shown, { seq: 8, updated_at: "2026-10-17T10:00:59.000Z" })).toBe(false);
    // Late usage moves updated_at alone.
    expect(isNewerRun(shown, { seq: 8, updated_at: "2026-10-17T10:01:30.000Z" })).toBe(true);
    expect(isNewerRun(shown, { seq: 9, updated_at: "2026-10-17T10:01:00.000Z" })).toBe(true);
  });
});

describe("run panel: requests, one each, never retried", () => {
  const row = (patch: Record<string, unknown> = {}) => ({ ...runRow(), ...patch });

  it.each([
    [{ action: "continue", runId: RUN_ID, expectedSeq: 7 }, ["action", "runId", "expectedSeq", "expectedActorId", "expectedCompanyId"]],
    [{ action: "skip", runId: RUN_ID, expectedSeq: 7 }, ["action", "runId", "expectedSeq", "expectedActorId", "expectedCompanyId"]],
    [{ action: "answer", runId: RUN_ID, expectedSeq: 7, answer: "Dana" }, ["action", "runId", "expectedSeq", "answer", "expectedActorId", "expectedCompanyId"]],
    [{ action: "cancel", runId: RUN_ID }, ["action", "runId", "expectedActorId", "expectedCompanyId"]],
  ] as const)("sends exactly the keys the route accepts for %j", async (command, keys) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ run: row({ status: "running" }) }, 202));
    await expect(sendRunCommand(command, identity, fetcher)).resolves.toMatchObject({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("/api/os/runs");
    expect(init?.method).toBe("POST");
    expect(Object.keys(JSON.parse(String(init?.body))).sort()).toEqual([...keys].sort());
    expect(JSON.parse(String(init?.body))).toMatchObject({ expectedActorId: RUN_ACTOR, expectedCompanyId: RUN_COMPANY });
  });

  it.each([
    [409, { error: "agent_run_stale" }, "stale"], [409, { error: "model_changed" }, "model_changed"],
    [409, { error: "agent_run_not_resumable" }, "not_resumable"], [409, { error: "agent_run_slice_limit" }, "slice_limit"],
    [409, { error: "identity_changed" }, "identity_changed"], [503, { error: "key_unavailable" }, "unavailable"],
    [503, { error: "runs_unavailable" }, "not_read"], [503, { error: "not_configured" }, "unavailable"],
    [409, { error: "run_unconfirmed" }, "unconfirmed"], [500, null, "unconfirmed"], [403, { error: "run_unavailable" }, "unconfirmed"],
  ] as const)("names a %d %j refusal without retrying", async (status, body, reason) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(body, status));
    await expect(sendRunCommand({ action: "continue", runId: RUN_ID, expectedSeq: 7 }, identity, fetcher)).resolves.toEqual({ ok: false, reason });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a lost response", () => Promise.reject(new TypeError("network"))],
    ["another run's receipt", () => Promise.resolve(response({ run: row({ id: "00000000-0000-4000-8000-0000000000e2" }) }))],
    ["another member's receipt", () => Promise.resolve(response({ run: row({ actor_id: "00000000-0000-4000-8000-0000000000a2" }) }))],
    ["a receipt carrying the checkpoint", () => Promise.resolve(response({ run: row({ checkpoint: {} }) }))],
    ["a receipt carrying the lease", () => Promise.resolve(response({ run: row({ lease_id: RUN_ID }) }))],
    ["no receipt", () => Promise.resolve(response({}))],
  ])("treats %s as unconfirmed", async (_name, reply) => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(reply as () => Promise<Response>);
    await expect(sendRunCommand({ action: "cancel", runId: RUN_ID }, identity, fetcher)).resolves.toEqual({ ok: false, reason: "unconfirmed" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("starts with the exact start keys and reads a started or replayed run as started", async () => {
    for (const status of [202, 200]) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ type: status === 202 ? "started" : "existing", run: row() }, status));
      const outcome = await sendRunStart({ runId: RUN_ID, instruction: "Prepare follow-ups.", draftFormat: "reply" }, identity, fetcher);
      expect(outcome.kind).toBe("started");
      expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
        action: "start", runId: RUN_ID, instruction: "Prepare follow-ups.", draftFormat: "reply", expectedActorId: RUN_ACTOR, expectedCompanyId: RUN_COMPANY,
      });
    }
  });

  it.each([
    [409, "agent_run_active", "refused"], [402, "budget", "refused"], [503, "not_configured", "refused"], [400, "invalid_request", "refused"],
    [403, "review_access_denied", "refused"], [409, "run_refused", "refused"], [409, "identity_changed", "identity_changed"],
    [409, "run_unconfirmed", "unconfirmed"], [502, "gateway", "unconfirmed"],
  ] as const)("sorts a start's %d %s by what it proves", async (status, error, kind) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ error }, status));
    const outcome = await sendRunStart({ runId: RUN_ID, instruction: "Prepare follow-ups.", draftFormat: "reply" }, identity, fetcher);
    expect(outcome.kind).toBe(kind);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("reads one run by id, refuses a reply that does not parse, and treats 404 as no run", async () => {
    const view = runView();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ run: view, serverNow: 1_000 }));
    await expect(fetchRunFeed(RUN_ID, fetcher)).resolves.toMatchObject({ run: { id: RUN_ID }, serverNow: 1_000 });
    expect(fetcher).toHaveBeenCalledWith(`/api/os/runs?id=${RUN_ID}`, { cache: "no-store" });
    await expect(fetchRunFeed(RUN_ID, vi.fn<typeof fetch>().mockResolvedValue(response({ error: "run_unavailable" }, 404)))).resolves.toBeNull();
    await expect(fetchRunFeed(RUN_ID, vi.fn<typeof fetch>().mockResolvedValue(response({ run: { ...view, lease_id: RUN_ID }, serverNow: 1_000 })))).rejects.toThrow();
    await expect(fetchRunFeed(RUN_ID, vi.fn<typeof fetch>().mockResolvedValue(response({ run: view })))).rejects.toThrow();
  });

  it("reads the cost quote, or that there is no model to run on", async () => {
    await expect(fetchRunQuote(vi.fn<typeof fetch>().mockResolvedValue(response({ quote: { payer: "platform", priced: true, maxUsd: 1, leftUsd: 3.5 }, serverNow: 1 }))))
      .resolves.toEqual({ payer: "platform", priced: true, maxUsd: 1, leftUsd: 3.5 });
    await expect(fetchRunQuote(vi.fn<typeof fetch>().mockResolvedValue(response({ quote: null, serverNow: 1 })))).resolves.toBeNull();
    await expect(fetchRunQuote(vi.fn<typeof fetch>().mockResolvedValue(response({ quote: { payer: "nobody", priced: true, maxUsd: 1, leftUsd: 1 } })))).rejects.toThrow();
    await expect(fetchRunQuote(vi.fn<typeof fetch>().mockResolvedValue(response({ error: "runs_unavailable" }, 503)))).rejects.toThrow();
  });
});
