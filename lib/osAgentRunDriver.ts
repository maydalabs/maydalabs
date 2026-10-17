import "server-only";
import type { Db } from "@/lib/osCofounder";
import type { PickedTurn } from "@/lib/osCofounderModel";
import type { CofounderPersona } from "@/lib/osPersona";
import { rejectExistingOpenWork } from "@/lib/osReviewDuplicate";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RUN_TIMING, runAgentSlice, type RunHost, type RunTiming, type SliceOutcome } from "@/lib/osAgentRun";
import { agentRunSystemFor } from "@/lib/osAgentRunPrompt";
import { listMemory, openCardItems, readEvents, searchRecord } from "@/lib/osAgentRunReads";
import {
  finishAgentRun, loadAgentRunPrivate, proposeForAgentRun, readAgentRunLease, readForAgentRun, recordAgentRunUsage, releaseAgentRun, roundAgentRun,
  stepAgentRun,
} from "@/lib/osAgentRunStore";
import { dailyCapUsd } from "@/lib/osAgentRunPayer";

/* One slice of a run, inside after() — the work outlives the request that
 * scheduled it, so a closed tab changes nothing.
 *
 * The driver owns only wiring: it loads the private run state, rebuilds the
 * system prompt from the company row and persona the route read (nothing of
 * it is stored), binds the host to Postgres, measures the deadline from the
 * route's own start, and watches for Stop. Every rule is the loop's
 * (lib/osAgentRun.ts) or the SQL's. A lost storage response ends the slice
 * without a finish, and the driver gives its lease up at once
 * (os_agent_run_release): the person sees a stalled run they can continue or
 * stop now, not when the lease would have run out — up to half an hour on a
 * local model, with the panel saying "Working" all the while. Only outcome
 * codes are logged — never provider text, record text or keys.
 */

type Env = Record<string, string | undefined>;
export type DriveContext = {
  runId: string; companyId: string; actorId: string; lease: string;
  /** Date.now() at the route's entry: the slice deadline counts from here. */
  startedAt: number;
  picked: PickedTurn;
  company: { name: string; what_we_do: string | null };
  persona: CofounderPersona;
  env?: Env;
  timing?: RunTiming;
  admin?: Db;
  now?: () => number;
};

export function runTimingFor(env: Env = process.env): RunTiming {
  return env.VERCEL ? RUN_TIMING.hosted : RUN_TIMING.local;
}

function log(runId: string, outcome: SliceOutcome | { outcome: string; at?: string }, released?: boolean) {
  console.info(JSON.stringify({ event: "agent_run_slice", run: runId, outcome: outcome.outcome,
    ...("at" in outcome && outcome.at ? { at: outcome.at } : {}), ...("stopReason" in outcome ? { stop: outcome.stopReason } : {}),
    ...(released !== undefined ? { released } : {}) }));
}

/* Best effort: a release that fails leaves the lease to run out, as before.
 * It is fenced on this slice's own lease, so it can never stall a run that a
 * Stop, a finish or another slice has already moved on. */
async function release(admin: Db | null, who: { companyId: string; actorId: string }, id: string, lease: string): Promise<boolean> {
  if (!admin) return false;
  try { return (await releaseAgentRun(admin, who, { id, lease })).released; } catch { return false; }
}

export async function driveAgentRun(ctx: DriveContext): Promise<SliceOutcome> {
  const env = ctx.env ?? process.env;
  const timing = ctx.timing ?? runTimingFor(env);
  const now = ctx.now ?? Date.now;
  const who = { companyId: ctx.companyId, actorId: ctx.actorId };
  let admin: Db | null = null;
  let state;
  try {
    admin = ctx.admin ?? createSupabaseAdminClient();
    state = await loadAgentRunPrivate(admin, who, ctx.runId, timing.queryTimeoutMs);
  } catch {
    const outcome = { outcome: "unconfirmed" as const, at: "load" };
    log(ctx.runId, outcome, await release(admin, who, ctx.runId, ctx.lease));
    return outcome;
  }
  const db: Db = admin;
  // Another slice, a Stop or a resume moved the lease: this one does nothing.
  if (state.run.status !== "running" || state.run.lease_id !== ctx.lease || state.turn.status !== "running") {
    log(ctx.runId, { outcome: "fenced" });
    return { outcome: "fenced" };
  }

  /* Stop is immediate in SQL. The watcher makes it immediate here too: it
   * aborts the model call in flight within one interval, and the next fenced
   * RPC would refuse anyway. That call never reports its usage; Stop has
   * already charged its round at the hold it was reserved with. */
  const stop = new AbortController();
  const watcher = setInterval(() => {
    readAgentRunLease(db, ctx.runId, timing.queryTimeoutMs)
      .then((row) => { if (!row || row.status !== "running" || row.lease_id !== ctx.lease) stop.abort("canceled"); })
      .catch(() => { /* a failed poll is not a Stop; the fence still holds */ });
  }, timing.watchMs);

  const id = ctx.runId;
  const lease = ctx.lease;
  const daily = dailyCapUsd(env);
  const host: RunHost = {
    now,
    round: ({ seq, projectedUsd }) => roundAgentRun(db, who, { id, lease, seq, projectedUsd, dailyCapUsd: daily }),
    usage: async (input) => { await recordAgentRunUsage(db, { id, ...input }); },
    step: ({ seq, patch }) => stepAgentRun(db, who, { id, lease, seq, patch }),
    read: ({ itemId, ref }) => readForAgentRun(db, who, { id, lease, itemId, ref }),
    propose: (input) => proposeForAgentRun(db, who, { id, lease, ...input }),
    finish: async (input) => { await finishAgentRun(db, who, { id, lease, ...input }); },
    searchRecord: () => searchRecord(db, ctx.companyId, timing.queryTimeoutMs),
    readEvents: (itemId) => readEvents(db, itemId, timing.queryTimeoutMs),
    listMemory: () => listMemory(db, ctx.companyId, new Date(now()).toISOString().slice(0, 10), timing.queryTimeoutMs),
    openCardItems: () => openCardItems(db, ctx.companyId, timing.queryTimeoutMs),
    duplicateWork: async (payload) => (await rejectExistingOpenWork(db, ctx.companyId, payload)) !== null,
  };
  try {
    const run = state.run;
    const outcome = await runAgentSlice({
      run: { seq: run.seq, priced: run.priced, rounds: run.rounds, itemReads: run.item_reads, cards: run.cards, asked: run.asked,
        plan: run.plan, answer: run.answer, answeredAt: run.answered_at },
      checkpoint: run.checkpoint,
      source: { id: state.turn.person_message_id, text: state.turn.question },
      draftFormat: state.turn.draftFormat,
      system: agentRunSystemFor({ company: ctx.company, draftFormat: state.turn.draftFormat, persona: ctx.persona, today: new Date(now()).toISOString().slice(0, 10) }),
      turn: ctx.picked.turn,
      host,
      price: ctx.picked.price,
      deadline: ctx.startedAt + timing.sliceMs,
      timing,
      signal: stop.signal,
    });
    log(ctx.runId, outcome, outcome.outcome === "unconfirmed" ? await release(db, who, ctx.runId, lease) : undefined);
    return outcome;
  } catch {
    const outcome = { outcome: "unconfirmed" as const, at: "driver" };
    log(ctx.runId, outcome, await release(db, who, ctx.runId, lease));
    return outcome;
  } finally {
    clearInterval(watcher);
  }
}
