/** Local-only two-session SQL proof. Requires an EMPTY schema-only clone named
 * maydaos_review_proof_<suffix> in the existing local Docker DB container.
 * This script persists ONLY synthetic rows and the migration in that disposable
 * database. It never changes postgres, reads .env, or connects to the network.
 * Remove only the named disposable database after this proof completes.
 * REVIEW_PROOF_DATABASE=maydaos_review_proof_... node tests/sql/os-review-concurrency.mjs
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const database = process.env.REVIEW_PROOF_DATABASE;
if (!database || !/^maydaos_review_proof_[a-z0-9_]+$/.test(database)) {
  throw new Error("Refusing SQL proof without an explicitly named disposable database");
}
const container = "supabase_db_maydalabs";
function session(sql, { ready, allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["exec", "-i", container, "psql", "-X", "-q", "-At", "-U", "supabase_admin", "-d", database, "-v", "ON_ERROR_STOP=1"], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", signaled = false;
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (!signaled && stdout.includes("PROOF_LOCK_HELD")) { signaled = true; ready?.(); }
    });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && !allowFailure) reject(new Error(`SQL proof exited ${code}: ${stderr}`));
      else resolve({ code, stdout, stderr });
    });
    child.stdin.end(`set statement_timeout='15s'; set lock_timeout='10s';\n${sql}`);
  });
}
const value = async (sql) => (await session(sql)).stdout.trim();
const json = async (sql) => JSON.parse(await value(sql));
const quote = (text) => `'${text.replaceAll("'", "''")}'`;
const company = "f81961af-922d-4d02-a001-000000000001";
const actor = "f81961af-922d-4d02-a002-000000000001";
const turn = (n) => `f81961af-922d-4d02-a003-${String(n).padStart(12, "0")}`;
const proposal = (n) => `f81961af-922d-4d02-a004-${String(n).padStart(12, "0")}`;
let assertions = 0;
function check(actual, expected, label) { assert.deepEqual(actual, expected, label); assertions++; }

check(await value("select current_database();"), database, "exact disposable database");
check(await value("select (select count(*) from auth.users)+(select count(*) from public.os_companies);"), "0", "clone contains no user/company rows");
check(await value("select to_regclass('public.os_review_turns') is null;"), "t", "migration not already applied in clone");
const migration = readFileSync(new URL("../../supabase/migrations/20260922160310_os_review_durable.sql", import.meta.url), "utf8");
const modeMigration = readFileSync(new URL("../../supabase/migrations/20260923004646_os_review_request_mode.sql", import.meta.url), "utf8");
await session(`begin; ${migration}\n${modeMigration}
insert into auth.users(id,email) values('${actor}','concurrency-proof@example.invalid');
insert into public.os_companies(id,name) values('${company}','Synthetic concurrency company');
insert into public.os_company_members(company_id,user_id) values('${company}','${actor}');
insert into internal.os_beta_members(user_id) values('${actor}'); commit;`);

const beginCall = (n) => `public.os_review_begin('${turn(n)}','${company}','${actor}','Draft a reply: the quote is 500 units.','draft')`;
const decideCall = (p) => `public.os_review_decide('${p.id}','${company}','${actor}',${p.revision},'${p.fingerprint}','save_to_work')`;
async function makeProposal(n) {
  const started = await json(`set role service_role; select ${beginCall(n)};`);
  const payload = { type: "work", title: `Concurrent draft ${n}`, body: "The quote is 500 units.", lane: "sales", kind: "reply", outwardAction: "send", citations: [{ sourceId: started.turn.person_message_id, quote: "the quote is 500 units" }] };
  return json(`set role service_role; select public.os_review_propose('${proposal(n)}','${turn(n)}','${company}','${actor}',${quote(JSON.stringify(payload))}::jsonb);`);
}
async function race(firstSql, secondSql, { rollback = false } = {}) {
  let release;
  const locked = new Promise((resolve) => { release = resolve; });
  const first = session(`begin; set local role service_role; ${firstSql}; select 'PROOF_LOCK_HELD'; select pg_sleep(1); ${rollback ? "select 1/0;" : "commit;"}`, { ready: release, allowFailure: rollback });
  // If the first session fails before its lock marker, do not hang forever.
  await Promise.race([locked, first.then(() => { throw new Error("First session ended before lock marker"); })]);
  const second = session(`begin; set local role service_role; ${secondSql}; commit;`);
  const [a, b] = await Promise.all([first, second]);
  if (rollback) check(a.code !== 0, true, "first connection interrupted before commit");
  else check(a.code, 0, "first connection committed");
  check(b.code, 0, "waiting connection completed");
  return { a, b };
}

// Two browser retries claiming the same request while the first is uncommitted.
const starts = await race(`select ${beginCall(1)}`, `select ${beginCall(1)}`);
const startA = JSON.parse(starts.a.stdout.split("\n")[0]);
const startB = JSON.parse(starts.b.stdout.trim());
check(startA.created, true, "first begin owns model generation");
check(startB.created, false, "second begin does not regenerate");
check(startA.turn.id, startB.turn.id, "both starts return same turn");
check(startA.turn.request_mode, "draft", "concurrent starts retain selected mode");
const changedMode = await session(`set role service_role; select public.os_review_begin('${turn(1)}','${company}','${actor}','Draft a reply: the quote is 500 units.','ask');`, { allowFailure: true });
check(changedMode.code !== 0, true, "same request ID cannot switch selected mode after start");
check(await value(`select count(*) from public.os_messages where thread_id='${startA.turn.thread_id}';`), "1", "concurrent begin writes one source message");

const p = await makeProposal(2);
await race(`select ${decideCall(p)}`, `select ${decideCall(p)}`);
let saved = await json(`select to_jsonb(p) from public.os_review_proposals p where id='${p.id}';`);
check(saved.status, "saved", "concurrent save persisted receipt");
check(await value(`select count(*) from public.os_work_items where company_id='${company}';`), "1", "two overlapping saves produce one work item");
check(await value(`select count(*) from public.os_work_item_events where item_id='${saved.record_id}';`), "1", "two overlapping saves produce one event");
check(await json(`set role service_role; select ${decideCall(p)};`), saved, "fresh process recovers same saved receipt after response loss");

const retry = await makeProposal(3);
await race(`select ${decideCall(retry)}`, `select ${decideCall(retry)}`, { rollback: true });
saved = await json(`select to_jsonb(p) from public.os_review_proposals p where id='${retry.id}';`);
check(saved.status, "saved", "waiting retry succeeds after other connection aborts");
check(await value(`select count(*) from public.os_work_items where company_id='${company}';`), "2", "aborted plus retried save adds exactly one item");
check(await value(`select count(*) from public.os_work_item_events where item_id='${saved.record_id}';`), "1", "abort leaves no duplicate event");
check(await value(`select count(*) from public.os_approvals a join public.os_work_items i on i.id=a.item_id where i.company_id='${company}';`), "0", "neither race grants outward approval");

console.log(JSON.stringify({ status: "passed", assertions, database, source: "schema-only local clone; synthetic data only", tests: ["concurrent request start", "concurrent save", "new-process lost-response recovery", "interrupted connection rollback and waiting retry"], modelCalls: 0, networkCalls: 0, cleanupRequired: "Drop only this named disposable database after collecting proof" }, null, 2));
