import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AGENT_RUN_REFUSALS, COMPLETED_STOP_REASONS, DRIVER_PROGRESS_KINDS, FAILED_STOP_REASONS, RUN_LIMITS, RUN_PAYERS } from "@/lib/osAgentRunTypes";
import { RUN_FUNCTION_SECONDS } from "@/lib/osAgentRun";

/* The migration and the modules must agree, because the database is the
 * authority and the loop only applies the same rules earlier. Read as text:
 * what is asserted is the SQL that ships. The real rollback proof is
 * tests/sql/os_agent_runs.sql against a disposable local database. */

const sql = readFileSync("supabase/migrations/20261017200000_agent_runs.sql", "utf8");
const intentSql = readFileSync("supabase/migrations/20260927065857_os_review_request_intent.sql", "utf8");
const route = readFileSync("app/api/os/runs/route.ts", "utf8");
const functions = [...sql.matchAll(/create (?:or replace )?function ([\w.]+)\(([^)]*)\)\s*returns [\s\S]*?\$\$;/g)];
const header = (body: string) => body.slice(0, body.indexOf("$$"));
const squash = (text: string) => text.replace(/\s+/g, " ").trim();
const validateIn = (text: string) => /create or replace function internal\.os_review_validate[\s\S]*?\nend; \$\$;/.exec(text)?.[0] ?? "";

describe("the agent runs migration", () => {
  it("creates every function as security invoker with an empty search_path, except chat spend", () => {
    expect(functions.length).toBeGreaterThanOrEqual(21);
    for (const [body, name] of functions) {
      if (name === "public.os_chat_spent_this_month") {
        expect(header(body)).toMatch(/security definer set search_path = ''/);
        expect(body).toContain("public.os_is_member(p_company_id)");
      } else {
        expect(header(body), name).toMatch(/security invoker set search_path ?= ?''/);
        expect(header(body), name).not.toMatch(/security definer/);
      }
    }
  });

  it("revokes every run RPC from public, anon and authenticated and grants it only to the service role", () => {
    const rpcs = functions.map(([, name]) => name).filter((name) => name.startsWith("public.os_agent_run_") || name === "public.os_spent_today");
    expect(rpcs.sort()).toEqual([...["cancel", "finish", "propose", "read", "release", "resume", "round", "start", "step", "usage"].map((n) => `public.os_agent_run_${n}`), "public.os_spent_today"]);
    const revoke = /revoke all on function\s+(public\.os_agent_run_start[\s\S]*?)\s+from public, anon, authenticated;/.exec(sql)?.[1] ?? "";
    const grant = /grant execute on function\s+(public\.os_agent_run_start[\s\S]*?)\s+to service_role;/.exec(sql)?.[1] ?? "";
    for (const name of rpcs) {
      expect(revoke).toContain(`${name}(`);
      expect(grant).toContain(`${name}(`);
    }
    expect(sql).not.toMatch(/grant execute on function[^;]*os_agent_run_[^;]*to [^;]*authenticated/);
    expect(sql).not.toMatch(/grant execute on function[^;]*os_spent_today[^;]*to [^;]*authenticated/);
  });

  it("grants columns, never tables, and never the checkpoint or the lease token to a signed-in role", () => {
    expect(sql).not.toMatch(/grant (all|select|insert|update|delete)(, ?\w+)* on (table )?public\.os_agent/i);
    const authenticated = [...sql.matchAll(/grant select \(([^)]+)\)\s+on public\.(os_agent_\w+) to authenticated/g)];
    expect(authenticated.map((m) => m[2]).sort()).toEqual(["os_agent_run_reads", "os_agent_run_rounds", "os_agent_run_usage", "os_agent_runs"]);
    for (const [, columns] of authenticated) {
      expect(columns).not.toMatch(/\bcheckpoint\b/);
      expect(columns).not.toMatch(/\blease_id\b/);
    }
    expect(sql).not.toMatch(/grant (insert|update)[^;]*to authenticated/);
  });

  it("enables RLS with member read policies on all four tables", () => {
    for (const table of ["os_agent_runs", "os_agent_run_reads", "os_agent_run_rounds", "os_agent_run_usage"]) {
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
      expect(sql).toMatch(new RegExp(`create policy \\w+ on public\\.${table}\\s+for select to authenticated using \\(public\\.os_is_member\\(company_id\\)\\);`));
    }
  });

  it("enforces the module's limits", () => {
    expect(sql).toContain(`rounds smallint not null default 0 check (rounds between 0 and ${RUN_LIMITS.rounds})`);
    expect(sql).toContain(`item_reads smallint not null default 0 check (item_reads between 0 and ${RUN_LIMITS.itemReads})`);
    expect(sql).toContain(`cards smallint not null default 0 check (cards between 0 and ${RUN_LIMITS.cards})`);
    expect(sql).toContain(`slices smallint not null default 1 check (slices between 1 and ${RUN_LIMITS.slices})`);
    expect(sql).toContain(`jsonb_array_length(progress) <= ${RUN_LIMITS.progress}`);
    expect(sql).toContain(`if r.rounds >= ${RUN_LIMITS.rounds} then`);
    expect(sql).toContain(`if r.item_reads >= ${RUN_LIMITS.itemReads} then`);
    expect(sql).toContain(`if r.cards >= ${RUN_LIMITS.cards} then`);
    expect(sql).toContain(`if r.slices >= ${RUN_LIMITS.slices} then`);
    expect(sql).toContain(`char_length(btrim(p_instruction)) not between 1 and ${RUN_LIMITS.instruction}`);
    expect(sql).toContain(`char_length(btrim(p_answer)) not between 1 and ${RUN_LIMITS.answer}`);
    expect(sql).toContain(`char_length(p_text) > ${RUN_LIMITS.summaryChars}`);
    expect(sql).toContain(`payer in (${RUN_PAYERS.map((p) => `'${p}'`).join(",")})`);
  });

  it("knows exactly the stop reasons, refusals and driver progress the modules know", () => {
    expect(sql).toContain(`status = 'completed' and stop_reason in (${COMPLETED_STOP_REASONS.map((r) => `'${r}'`).join(",")})`);
    expect(sql).toContain(`status = 'failed' and stop_reason in (${FAILED_STOP_REASONS.map((r) => `'${r}'`).join(",")})`);
    const raised = new Set([...sql.matchAll(/'agent_run_(\w+)'/g)].map((m) => m[1]));
    for (const code of raised) expect(AGENT_RUN_REFUSALS, code).toContain(code);
    const vocabulary = /not in \(('plan'[^)]*)\)/.exec(sql)?.[1] ?? "";
    expect(vocabulary.split(",").map((k) => k.trim().replace(/'/g, ""))).toEqual([...DRIVER_PROGRESS_KINDS]);
  });

  it("never writes Work or company knowledge, and never approves", () => {
    expect(sql).not.toMatch(/insert into public\.os_work_items/i);
    expect(sql).not.toMatch(/insert into public\.os_company_memory/i);
    expect(sql).not.toMatch(/(insert into|update) public\.os_approvals/i);
    expect(sql).not.toMatch(/update public\.os_work_items/i);
  });

  it("replaces os_review_validate with the 20260927065857 body plus one marked block", () => {
    const replaced = validateIn(sql);
    const block = /\n {2}-- BEGIN agent runs[\s\S]*?-- END agent runs\n/.exec(replaced)?.[0] ?? "";
    expect(block).toContain("return internal.os_agent_run_validate(p_payload, p_turn, m);");
    expect(squash(replaced.replace(block, "\n"))).toBe(squash(validateIn(intentSql)));
  });

  it("refuses to interrupt a run's turn and counts run spend in chat spend by when each round was reserved", () => {
    const interrupt = /create or replace function public\.os_review_interrupt[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(interrupt).toContain("raise exception 'agent_run_cancel_instead' using errcode = 'P0001';");
    const month = /create function internal\.os_agent_month_spend[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(month).toContain("m.created_at >= date_trunc('month', now())");
    expect(month).toContain("internal.os_agent_run_spend(p_company, date_trunc('month', now()))");
    expect(month).not.toMatch(/os_agent_runs/);
    // A round's money stays in the window that reserved it: no sum reads when its ledger row was written.
    const spend = /create function internal\.os_agent_run_spend[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(spend).toContain("h.reserved_at >= p_since");
    expect(spend).toContain("sum(coalesce(u.cost_usd, h.hold_usd))");
    expect(spend).toContain("left join public.os_agent_run_usage u on u.run_id = h.run_id and u.round = h.round");
    const sums = sql.slice(sql.indexOf("create function internal.os_agent_run_spend"), sql.indexOf("create function internal.os_agent_run_settle"));
    expect(sums).not.toMatch(/recorded_at\s*>=/);
  });

  it("counts a run on a company's own key in that company's day and never in the platform's", () => {
    const spend = /create function internal\.os_agent_run_spend[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(squash(spend)).toContain("case when p_company is null then exists (select 1 from public.os_agent_runs r where r.id = h.run_id and r.payer = 'platform') else h.company_id = p_company end");
    const day = /create function internal\.os_agent_day_spend[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    // Workflow runs keep their rule: every os_runs row today on the platform's day.
    expect(squash(day)).toContain("(p_company is null or r.company_id = p_company)");
    expect(day).toContain("internal.os_agent_run_spend(p_company, date_trunc('day', now(), 'UTC'))");
  });

  it("holds every reserved round until its usage replaces the hold, and charges a round that never reported", () => {
    const round = /create function public\.os_agent_run_round[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(round).toContain("insert into public.os_agent_run_rounds (run_id, round, company_id, hold_usd)");
    expect(round.indexOf("internal.os_agent_run_settle(r)")).toBeLessThan(round.indexOf("if r.rounds >= 12"));
    for (const stop of ["'budget'", "'month_budget'", "'daily_cap'"]) expect(round).toContain(`then ${stop}`);
    for (const name of ["finish", "cancel"]) {
      const body = new RegExp(`create function public\\.os_agent_run_${name}[\\s\\S]*?\\$\\$;`).exec(sql)?.[0] ?? "";
      expect(body, name).toContain("r := internal.os_agent_run_settle(r);");
    }
    // Month and day both count the rounds in flight at their holds, and the ledgered ones at their cost.
    for (const fn of ["os_agent_month_spend", "os_agent_day_spend"]) {
      const body = new RegExp(`create function internal\\.${fn}[\\s\\S]*?\\$\\$;`).exec(sql)?.[0] ?? "";
      expect(body, fn).toContain("internal.os_agent_run_spend(p_company,");
      expect(body, fn).not.toContain("os_agent_run_usage");
    }
    // A usage report needs a reserved round, and the ledger cannot name an unreserved one.
    expect(sql).toContain("foreign key (run_id, round) references public.os_agent_run_rounds(run_id, round)");
    const usage = /create function public\.os_agent_run_usage[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(usage).toContain("not exists (select 1 from public.os_agent_run_rounds h where h.run_id = p_id and h.round = p_round)");
    // The worker, the manual run and the round read one definition of today.
    expect(/create function public\.os_spent_today[\s\S]*?\$\$;/.exec(sql)?.[0]).toContain("internal.os_agent_day_spend(p_company)");
  });

  it("counts Stop's refusals and faults from the checkpoint, and returns SQL's own read and card counts", () => {
    const cancel = /create function public\.os_agent_run_cancel[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(cancel).not.toContain("os_agent_run_receipt(r, 0, 0)");
    for (const counter of ["refused", "faults", "cutOffs"]) expect(cancel).toContain(`internal.os_agent_run_counter(r.checkpoint, '${counter}')`);
    const read = /create function public\.os_agent_run_read[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(read.match(/'item_reads', r\.item_reads/g)).toHaveLength(2);
    const propose = /create function public\.os_agent_run_propose[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(propose.match(/'cards', r\.cards/g)).toHaveLength(2);
  });

  it("refuses a start today's cap or its first rounds' price cannot cover, and never calls a run that made no model step silent", () => {
    const start = /create function public\.os_agent_run_start[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(start).toContain("p_daily_cap - internal.os_agent_day_spend(case when p_payer = 'company' then p_company end)");
    expect(start).toContain("if v_ceiling < greatest(0.10, p_min_usd) then raise exception 'agent_run_budget'");
    expect(start).toContain("or p_min_usd is null or p_min_usd < 0");
    // Refused before anything is written: the floor is checked before the turn begins.
    expect(start.indexOf("greatest(0.10, p_min_usd)")).toBeLessThan(start.indexOf("public.os_review_begin("));
    const finish = /create function public\.os_agent_run_finish[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    expect(finish).toContain("case when btrim(p_text) = '' and r.rounds = 0 then 'The run stopped before its first model step.'");
  });

  it("records usage once per round and replays a planned card by reading it", () => {
    expect(sql).toContain("on conflict (run_id, round) do nothing;");
    const propose = /create function public\.os_agent_run_propose[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
    const replay = propose.slice(0, propose.indexOf("agent_run_read_required"));
    expect(replay).toContain("select * into existing from public.os_review_proposals where id = p_proposal;");
    expect(replay).not.toContain("os_review_propose(");
  });

  it("pins the runs route's maxDuration to the loop's function seconds", () => {
    expect(/export const maxDuration = (\d+);/.exec(route)?.[1]).toBe(String(RUN_FUNCTION_SECONDS));
    expect(route).toContain('export const dynamic = "force-dynamic";');
  });
});
