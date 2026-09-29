# MaydaOS S1h — concrete review guards, local only

27 September 2026, Europe/Istanbul. Continues S1g's failed judgment gate.
This is a bounded reliability repair, not a new quality baseline, release,
fine-tuning run or founder-readiness claim. All changes remain uncommitted.

## What changed

- New Work suggestions have a finite artifact/action pairing: email and reply
  require `send`, post requires `publish`, note/research/decision require null.
  This describes a possible later action; Save still creates a draft only.
  New tool schemas, staging, revision and save checks enforce the pairing.
  Historical receipt parsing remains permissive so saved older work is readable.
- An exact draft-body copy of open Work in the same company is refused before
  staging. The signed-in query uses company, exact notes and open-status filters;
  unavailable reads fail closed. Changing the title/kind does not evade this check.
- Prepared migration `20260927060833_os_review_work_quality.sql` repeats the
  literal-body check at proposal insertion/revision and reviewed Work insertion.
  Company-row locking serializes reviewed saves. It preserves original saved
  receipts on replay and never silently merges into another suggestion's record.
  The functions are security invoker/service-only; no table-wide or column write
  grants were added. This migration has NOT been applied to shared or production DB.
- Explicit Gregorian dates and adjacent full weekday names are checked in
  English, Turkish and French. Invalid dates or wrong weekdays are refused,
  never silently rewritten. Recognized forms include ISO dates and full named
  months with years. Relative dates, missing years, slash dates, abbreviations
  and timestamps are outside this detector. Passing it does not verify prose.
- The save adapter reads the stored exact reviewed revision, not browser-supplied
  save content. Stale and already-saved attempts retain SQL conflict/replay behavior.
  New revisions are also checked before mutation. SQL continues to validate and
  lock the reviewed revision; application preflight is not a substitute for that.
- Known refusals are now distinct from uncertain transport outcomes. Only exact
  recognized SQL `P0001` messages are classified as confirmed rollback. The API
  returns a finite 422 reason; other failures still require reconciliation.
  EN/TR/FR cards explain refusals and allow deliberate edit/dismiss/retry, with
  no automatic request. Unknown/lost responses keep mutation controls locked.
  The parent mutation lock, stale-read fence, identity fence and separate company
  knowledge checkbox remain effective.

## What this does NOT solve

The model still chooses the artifact label. A customer email mislabeled as a
coherent `note/null` can pass; this is not trusted founder intent. Literal body
matching does not detect paraphrases, spacing changes or all concurrent manual
Work edits/inserts. The SQL guarantee proven here is reviewed-save versus
reviewed-save serialization, not universal deduplication.

An exact quoted source is attribution, not founder endorsement or factual proof.
The current separate knowledge confirmation is still required, but this slice
does not yet encode an explicit founder assertion distinct from third-party
material. It also does not solve invented benefits, weak prose, wrong-language
answers, empty model answers, or contradictory model-written Save/Send claims.

Date checks apply to suggestions/new saves through the app, not every streamed
sentence or arbitrary direct database writer. Historical rows are not rewritten.

## Verification and failures retained

- **1,270 tests passed in 61 files; four opt-in model tests skipped.** Command:
  `npx vitest run --exclude tests/rls.integration.test.ts --reporter=dot`.
  The broad old RLS suite remains excluded because its cleanup is unsafe for
  valued local data. This is not a claim that the entire integration suite ran.
- `npx tsc --noEmit`, `npm run lint`, `npm run build` passed. Next built 90 static
  pages plus dynamic routes. Existing Vite/Node module-format warnings remain.
- **49 real SQL assertions** in `tests/sql/os_review_quality.sql` passed in the
  separate schema-only local database `maydaos_review_quality_wm2qyq`; the fixture
  transaction rolled back. All six type/action pairs, open/closed states,
  company boundaries, revisions, old receipts and ACL properties were tested.
- **17 separate-session assertions** passed: competing reviewed saves from
  different actors/turns yielded one Work row/event; the second got the known
  refusal. Original receipt replay worked; an intentional first-transaction
  rollback allowed the waiting second saver. No outward approvals were created.
  The synthetic database was dropped afterward; shared/hosted data was untouched.
- Browser checks used `tests/browser-review/` with the real ReviewCards component
  and explicitly simulated transport, NOT a signed-in Supabase/model session.
  Duplicate/date refusals, deliberate editing/dismissal and a lost-after-save
  response were exercised. Unknown response locked both cards; reload displayed
  the original synthetic receipt. EN/TR/FR text was spot-checked. 375x812 and
  1280x900 views had no horizontal document overflow; captures showed readable
  text and wrapping controls. Browser error/warning capture was empty.
- The agent-browser CLI was unavailable, so native Codex browser controls were
  used. An exact label locator initially found no match; visible role/name was
  used instead. An initial embedded capture was mis-scaled until the pane
  repainted; later captures and DOM geometry were inspected. Neither issue was
  silently counted as successful product behavior.
- Initial focused test run failed on three old fixtures: duplicate expected to
  stage, missing signed-in query mock, and missing single-proposal read fixture.
  These were updated to the new explicit contract; final checks passed.
- No new local-model generation or held-out evaluation ran in S1h. S1g's 5/18
  semantic clears remain the last model result, not improved by these test counts.

The SQL and React/browser skill guidance informed isolated verification and
mutation/reconciliation checks. No skill was used to authorize external writes.

## Evidence, cleanup and unchanged boundaries

Original logs/proof script and copies of the new SQL are retained in the ignored
directory `/Users/mehmeteminmayda/Projects/abidin/output/mayda/maydaos-s1h-guards-bAU0tM/`.
Its README contains hashes and scope. This directory is outside Git and the
current runtime-bundle allowlist; transfer separately only at an authorized
handoff. Previous frozen baseline evidence remains unchanged.

The owned Vite preview (3198) and test browser tab were closed; viewport override
reset. The pre-existing Ollama service and SG preview were left alone. No
production model key, worker secret, public navigation, commercial record,
price, scheduled action, email, post, account or lead state changed. No commit,
push, deploy, hosted/shared migration, spend or host transfer occurred.

## Next bounded slice / hands-on checkpoint

Carry the founder's intended artifact format separately from model output through
composer, retries, durable turn and SQL checks. Separately bind company knowledge
to an explicit founder assertion and reviewed scope/duration instead of treating
quoted text as endorsement. Add adversarial tests for both boundaries, then
freeze and independently review a fresh fictional-company model evaluation.
After that gate, offer Mehmet a private local hands-on checkpoint before
fine-tuning or broader product expansion. Current MaydaOS is not accepted as a
sellable product; this slice improves controls, not that readiness verdict.
