# MaydaOS M0 — truthful context and a local measuring instrument

Local engineering deliverable, 22 September 2026. Based on `404ad40`; not a
deployment, model-judgment improvement, customer trial or release claim.

## What changed

`buildCompanyContext` explicitly scopes every read to the selected company.
Approval and event embeds use `os_work_items!inner(...)` with an explicit
company predicate: RLS membership alone includes every company the person
belongs to. This filter does not discard completed or older history.

All seven context reads must succeed. Errors and null results stop generation;
they no longer become "nothing open". The route reads context before creating
an admin client, thread or person message. Legitimately empty arrays still
work. A 500 response follows the existing UI's generic failure path; 503 stays
reserved for the deliberately unconfigured production model.

Context version 2 records returned/exact-total coverage, limits and order.
Missing counts mean unknown completeness. Field truncation is visible, active
workflows are bounded, and work records include creation/update timestamps.
`updated_at` is last change, not a proof of when a request began waiting. These
parallel reads are not an atomic database snapshot.

Memory keeps IDs, source and dates. Person-provided reports and cofounder notes
are not independently verified facts. Stored text is escaped inside its fields
and explicitly described as data, not instructions. This is not a proof of
prompt-injection immunity. The prompt no longer claims an absent research tool.

The original six scenarios remain, with explicit oldest-item timestamps,
required numeric facts, complete draft-body checks, all-artifact/state checks,
empty-answer rejection and mandatory human-review criteria. Automatic checks
are not semantic truth, a safety certification or a human quality verdict.

## Safe measurement path

Run from this repository, keeping the MaydaOS desk chat idle:

```sh
MAYDAOS_SCENARIO_MODEL=local MAYDAOS_SCENARIO_REPEATS=3 npm run scenarios
```

- Only this explicit npm lifecycle can call the model; the normal test
  lifecycle stays model-free even if the scenario opt-in leaks into its env.
- No paid branch or fallback. Only an actual HTTP loopback IP origin is allowed;
  credentials, path/query redirects, remote targets, Vercel and cloud-model
  proxies are rejected. Preflight requires an already installed model with
  local weight metadata and records Ollama version, model name and digest.
- The benchmark exercises production context construction, conversation loop
  and tool writes against disposable in-memory synthetic fixtures. **It does
  not test SQL, RLS, persistence, browser behavior or production.**
- One exclusive runner lock, sequential repetitions, abortable request deadlines
  and stream cleanup. Never force-delete an uncertain owner's lock.
- Setup errors fail explicitly. Reports retain the planned denominator and
  distinguish unfinished, runtime error, timeout, deterministic failure and
  checks passed / human review pending. Disposal is checked per fixture.
- The JSON report contains source hashes, HEAD and dirty paths, scenario hash,
  generation configuration, all contexts/replies/model/tool events and outcomes,
  timing and token accounting. Interrupted requests may have partial accounting.
  Tokens are measured; no API bill is incurred by the local model.

Reports default to a unique temporary directory. Set
`MAYDAOS_SCENARIO_REPORT_DIR` for a durable private directory. The September 22
run uses Abidin `output/mayda/maydaos-baselines/`, which is Git-ignored and
**outside the existing runtime-bundle allowlist**. Transfer it separately at a
future host handoff. Do not import real Abidin/company data as evaluation seeds.

## Database proof without residual fixtures

The pre-existing broad RLS suite and former model harness attempted cascade
deletion despite append-only guards on events, memories and messages. This
deliverable does not disable those guards or reset the developer database.

The new focused proof runs within one local SQL transaction and rolls back:

```sh
docker exec -i supabase_db_maydalabs psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -f /dev/stdin < tests/sql/os-company-context-isolation.sql
```

It covers service-role reads, a person belonging to A+B, an unrelated C member,
foreign action/notes/event exclusion, history crowd-out under the old queries,
and retained completed history. The normal run and a deliberate-error run were
followed by fixture-absence checks, with all immutable guards enabled.

This proves the SQL/RLS equivalent. The SDK custom-transport tests independently
assert actual query construction and rendering. A complete helper-to-real-
PostgREST seeded test still requires a disposable database/stack; do not claim
that the two separate proofs are that integration test.

Safe model-free checks for this slice:

```sh
npm test -- --exclude tests/rls.integration.test.ts --exclude tests/cofounder.scenarios.test.ts
npx tsc --noEmit --incremental false
npm run lint
npm run build
git diff --check
```

Do not run the broad RLS fixture suite against valued local data until its
cleanup/isolation is repaired. No migrations, grants or production settings
changed in this deliverable.

## Baseline and remaining limits

The September 22 run and review receipt are maintained in Abidin
`docs/maydaos-m0-baseline-2026-09-22.md`. Historical 5/6 uses a different
instrument and is not comparable as a trend. Preserve raw runs when correcting
a scorer; never turn an evaluator change into a claim of improved model judgment.

Completed run: 18/18 attempts, no runtime errors/timeouts, all fixtures disposed.
Original judge `.1`: 10/18 automatic check passes. Version `.2` corrected
contextual-unit, title-wording, volume-shorthand and parenthetical-metadata
checks; offline rescoring of every identical output gives **15/18 automatic
checks passed, three failed, all human reviews pending**. Remaining failures:
missing destination, duplicate/incomplete drafts, and creating another item
instead of clearly refusing approval/send. No actual approval/delivery occurred.
Median local case duration: 60.947 seconds. These six examples do not establish
founder usefulness or production latency.

Final verification: 316 model-free tests passed; the model scenario file was
correctly skipped in the normal lifecycle. Lint, TypeScript and build pass
(90 static pages). The transaction-only SQL proof passed and left no fixtures,
including its deliberate-error rollback check. No browser/production run.

Offline corrections use `scripts/rescore-maydaos-baseline.mjs` (Node 25 in this
Mac environment). It imports only the pure scenario/judge and rescore modules,
never a model or database adapter:

```sh
# After the original run completes, BEFORE editing its judge:
node scripts/rescore-maydaos-baseline.mjs --snapshot /absolute/run/report.json /absolute/run/original-manifest.json
# After the versioned judge correction:
node scripts/rescore-maydaos-baseline.mjs --rescore /absolute/run/report.json /absolute/run/original-manifest.json /absolute/run/rescore-v2.json
```

The commands refuse to overwrite an existing artifact. Snapshotting checks all
seven generation-source hashes and the original manifest digest. Rescoring
checks the six unchanged non-judge sources, scenario questions/fixtures and
every planned case. It retains original verdicts and failure states, records
the original report hash and both judge/manifest versions, and leaves human
review pending. No selective dropping or new generation is involved.

Conversation-history read/save failures, interrupted persistence, duplicate
retry behavior, the vanishing-reply observation and browser Enter behavior are
not resolved by this company-record change. UI, public navigation, branding,
production model/worker disablement and private access remain unchanged.

Next work is chosen from the actual baseline failures, followed by the first
founder journey. No public launch, paid model key, autonomous sender, pricing
or fine-tuning is authorized by this measurement pass.
