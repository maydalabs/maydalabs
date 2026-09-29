# MaydaOS — small product slices, September 22

Local working plan authorized by Mehmet: “plan our slices and get going.”
M0 (honest measurement and company context) is complete locally; see
`maydaos-measurement-2026-09-22.md`. This breaks the existing product-foundation
milestones into smaller gates. It does not authorize a launch or new pricing.

## What we want to earn

A founder can return tomorrow, find useful work rather than another task pile,
and trust that corrections and decisions were not lost. Preserve the accepted
desk and public identity. First-cohort working hypothesis: a solo founder taking
a software-enabled idea toward first customers, not a settled public audience.

| Slice | Plain-language result | Gate before moving on |
|---|---|---|
| 1. Useful work, once | A request produces a complete draft; a successful save does not trigger another copy | Model-free state checks, the unchanged six-scenario benchmark, separate new wording cases, and review of actual artifacts. No claim of general judgment from keyword scores. |
| 2. Nothing quietly lost | Conversation and work survive reload, failed saves and interrupted requests | Fail closed on history/save errors; explicit uncertain outcomes; reproduce retry/duplicate and disappearing-reply behavior. Design cross-request idempotency deliberately. No broad RLS cleanup against valued data. |
| 3. A useful first session | Founder explains their business, corrects a short brief, chooses a focus, receives one usable piece of work | Synthetic first-session walkthrough, reload, keyboard and narrow-screen use. Reuse Company, Memory, Work and Brief; no new public funnel. |
| 4. Better decisions, with reasons | The partner distinguishes evidence from guesses, handles corrections, and adjusts to limited time | Conflicting evidence, unsupported demand, changed constraints, uncertainty and return-session tests; written human rubric. No automatic learning from unreviewed feedback. |
| 5. A week worth returning for | A private tester completes one continuous work cycle and records what helped | Daily evidence of usefulness, edits and failures. Product readiness, privacy, recovery, costs and pilot access remain separate approval gates. |

No date promise: each slice ends with evidence and an explicit remaining-gap
list. More usage budget is not permission for paid inference or external action.

## S1f continuation — intent choice bound; judgment gate remains open

The local desk now asks the founder to choose Ask, Draft, Knowledge or Both
for each question. The choice is durable through retry and limits the model's
proposal tools; it is not permission to save, approve or send. Isolated SQL
proof, component recovery regressions and build checks pass. The frozen 11-case
local-model run completed without runtime errors or any business writes, but
independent transcript review found substantive defects in nine cases and
owner acceptance remains pending. A later deterministic citation refusal and
UI recovery fixes are not included in that baseline. Exact results, evidence
paths, remaining gaps and the private hands-on checkpoint gate:
`maydaos-intent-baseline-2026-09-23.md`.

Next is one bounded quality repair and a fresh held-out run before Mehmet's
private local trial. Do not wait for every long-term product slice, but do not
present the current candidate as a sellable co-founder. Fine-tuning, public
activation and production model spend remain deferred.

## Slice 1 implementation boundary

- Strengthen the generic drafting contract: requested new artifacts only,
  complete body with relevant supplied details, no replacement task for a
  request to approve/send existing work. No test-name or place-name rules.
- Validate the complete batch before writing it. Preserve the original draft
  body exactly; reject empty/overlong content rather than truncating it.
- Save multiple explicitly requested artifacts in one insert. After success,
  remove creation from the remaining tool list and refuse it at runtime.
- Retry validation failures only; any database-attempt failure is uncertain and
  closes creation for the turn. No hidden automatic repeat after a lost receipt.
- Give direct second-person results and a factual fallback when the model
  stops without acknowledging what happened.

These controls prevent the observed post-success second filing and exact
duplicate rows within a batch. They do **not** decide natural-language intent,
prove a draft is complete, deduplicate renamed artifacts inside the first batch,
or prevent duplicate HTTP requests. Semantic behavior still needs evaluation;
cross-request recovery is slice 2. Memory persistence is not made transactional
with work creation by this slice.

The initial S1 run kept the original six questions, fixtures and judge unchanged. Additional
variations are a separate suite with a separate denominator. Save all attempts,
including failures, and leave human approval pending. A passing small sample
is permission to test further, not a sellability percentage.

## Boundaries unchanged

Local model only, existing installed weights, serial evaluation. No production
model key or worker secret, no model purchase/pull, no public MaydaOS entry,
no real Abidin/SG/client/job data in fixtures. No schema or grant change is
needed for slice 1. Prepare any future production SQL for Mehmet to run.
No message, email, post, schedule, account, push, deployment or commercial
action.

## S1e continuation — signed-in recovery verified; model judgment not accepted

The isolated real-UI/API/database walkthrough is complete, including lost-save
responses, dropped-before-save retries, knowledge confirmation, refresh and
explicit stale-answer closure. Source display, cross-pane refresh, stale-read
guards, question identity preconditions and current-request auth-cookie refresh
were refined. See `maydaos-local-walkthrough-2026-09-23.md` for evidence/limits.
1,028 automated tests, 70 DB assertions, lint/types/build and local smoke pass.
No production migration, release or public access. Temporary services stopped.

The frozen proposal-only baseline completed 16 attempts; assistant transcript
review found substantive defects in 15 (owner acceptance pending). Seven ran
out of tool rounds without model-written prose, leaving only trusted receipts.
Narrow structural checks are not semantic
acceptance. Read `maydaos-proposal-baseline-results-2026-09-22.md`; retain all
failures, context and hashes. No tuning occurred between attempts.

Next bounded slice stays with judgment, not feature expansion: independent
advice/draft/knowledge/action cases first, then a candidate that respects intent
and accurately distinguishes Save from Send. Knowledge schema/duration repair
is a separate concern. Fresh frozen evaluation follows. Fine-tuning is still
held; reliable storage is not evidence of a useful co-founder on its own.

The following S1d/S1c implementation-status statements are historical.

## S1d continuation — durable integration tested, not activated

The next bounded persistence slice is implemented in local code. The desk
uses proposal-only model tools, exact revision-bound human saves, durable
receipts, frozen conversation history, same-request retries and explicit
interrupted-turn closure. Memory carries scope, duration and attribution;
expired entries do not enter active company context. Full receipt and remaining
limits: `maydaos-durable-review-2026-09-22.md`.

912 model-free tests, lint/types/build, 70 rollback SQL assertions and 21
cross-session assertions pass. Browser controls were checked independently with
synthetic transport, including 375px and EN/TR/FR. The migration is prepared,
not retained locally or applied remotely; the full authenticated browser/API/
DB/model walkthrough remains a gate. Do that in a safely isolated local stack,
then establish a baseline for the new proposal-only interaction. No fresh model
run or fine-tuning occurred; retained judgment failures remain open.

The older S1c and slice2 implementation-status statements below are historical;
they are preserved as the original plan rather than rewritten as new evidence.

## S1c continuation — review contract approved; isolated controls tested

Mehmet chose explicit review before saving **both** new work and company
knowledge. The contract is `maydaos-review-save-contract-2026-09-22.md`:
Save to Work saves only the reviewed draft; Add to company knowledge confirms
the reviewed statement, source, scope and duration. Neither means approve,
send or complete. A quote/enquiry does not silently become standing policy.

The pure prototype in `lib/osReviewBoundary.ts` separates proposal from review
capabilities. It binds exact content/context/sources, retains model authorship,
requires renewed review after edits, rejects stale confirmations, returns
controlled receipts and freezes further saves after an uncertain outcome.
This is **not integrated into the existing route or desk** and has no durable
database adapter. Existing source-fidelity and intent failures remain open.

123 independent boundary tests and 18 adapter tests pass; aggregate 619
model-free tests plus lint/types/build pass. Tests first reproduced and then
verified fixes for duplicate-content revisions and contradictory write outcomes.
Offline adapted replay of 21 retained S1b cases yields nine unsaved previews,
five memory attempts needing review details and zero writes. No model was run,
no human confirmation simulated, and old text/failures were not rewritten.

Next bounded slice: design the smallest durable proposal/review/effect record
and connect these actions to the desk, including current membership, atomic
freshness/save, explicit provenance/scope and reload/retry recovery. Reproduce
the slice 2 failure table below with these identities in place. Prepare any
production SQL for Mehmet; no hosted migration or model enablement is authorized.
Then test new model behavior and retained judgment failures. Do not treat a
human click, a citation match or this prototype as a substitute for that work.
Fine-tuning and broader founder features remain deferred.

Exact receipt: `/Users/mehmeteminmayda/Projects/abidin/docs/maydaos-s1c-review-boundary-2026-09-22.md`.

## Earlier S1b continuation — safeguards pass, candidate behavior not accepted

The next bounded pass prevents repeated normalized-text memory writes within
one turn, catches uncertain memory inserts without repeating that fact, and
preserves partial-save/error receipts. Validation and scripted tool regressions
pass. This pulls the observed exact-memory duplication into the pre-training
cleanup; semantic and cross-request repetition remain unresolved.

Judge/context `.3` retains all six questions but uses a neutral synthetic
company name and stronger, explicitly limited checks. New outcomes are not a
comparable score trend against the earlier instrument. The candidate was frozen
before exposing five independent new cases; 12 baseline, 4 known variations
and 5 fresh variations are evaluated separately, without tuning between runs.

The baseline still promotes one-off quote terms to general company memory.
The known warmer-draft case invents fees and a delivery guarantee; an indirect
send request still creates a replacement draft and gives false tool guidance.
Therefore the behavior gate remains **not cleared**, regardless of automatic
scores or the passing 478 model-free tests. No fine-tuning or broader founder
feature work is started. Preserve the candidate as local experimental work,
not an accepted improvement ready for deployment.

Next decision: use the retained failures to design stronger draft/source and
write-intent boundaries, rather than adding another list of prompt warnings.
Any change to user-facing save/approval interactions needs a clear proposed
contract before implementation. Recovery remains the next reliability slice;
its source-backed failure-test map is prepared but not implemented.

Exact frozen hashes, all outcomes, review caveats and transfer paths:
`/Users/mehmeteminmayda/Projects/abidin/docs/maydaos-s1b-faithfulness-2026-09-22.md`.
The older S1 results below are historical and have not been rewritten.

## Earlier S1 gate: controls implemented, behavior not yet accepted

The four separate wording variations finished: three automatic passes and one
failure. The indirect “get it into his inbox” request created an unwanted
decision item and implied the model could send after approval. A warmer draft
invented logistics partners and an efficiency rationale. Another signature
copied its test-only company name. No external action occurred; the existing
send boundary has no executor here, but the model's interpretation/prose is
not yet good enough. Full outcomes and hashes are in the Abidin S1 receipt.

Do not advance to broad founder features or call slice 1 accepted. Next bounded
work is regression coverage and a general correction for preparing new work
versus acting on existing work, plus unsupported draft additions. Retain these
failures, then test new unseen wording. The current four variations are no
longer unseen; avoid teaching the test phrases. Fix the synthetic company-name
and checker blindspots only in a new documented instrument version.

## Slice 2: planned failure cases, not implemented yet

The source review identifies concrete tests before any wider onboarding work:

| Failure to reproduce | Required behavior |
|---|---|
| Reading the current thread or recent messages fails | Show unavailable history; do not invent an empty conversation or create a replacement thread |
| Saving the founder's message fails | Do not start generation as though the question was recorded |
| Work saves, then generation or the connection fails | Show the saved work and the incomplete reply separately; never silently repeat the write |
| Saving the final reply fails | Do not issue a normal completion acknowledgment |
| Stream ends without a completion event or with a split final record | Preserve visible partial text and show an interrupted state, not silent success |
| The same request arrives twice, including after a lost response | Reconcile against an explicit request identity; do not rely on similar wording or a model's memory |
| The model remembers the same fact twice in one turn | Normalized-text repeats are covered by S1b; semantic and cross-request reconciliation still need a deliberate contract |
| The founder reloads or reopens the window during/after a reply | Reconcile local and durable messages by identity without dropping a valid reply |
| Enter/keyboard and narrow-screen use | Reproduce the previous observation before naming a cause or claiming a fix |

Evidence paths: `app/api/os/cofounder/route.ts`, `recentMessages` in
`lib/osCofounder.ts`, `components/os/CofounderPane.tsx` and
`components/os/CofounderApp.tsx`. Current source ignores several database error
results and the client does not use the stream's completion event to confirm
success. These are source findings, not a reproduced diagnosis of the earlier
vanishing-reply observation. Request identity/durable recovery may need a small
schema design; no migration is implicitly approved by this plan.

Slice 1's fallback covers normal blank/exhausted responses only. S1b now catches
memory database errors, but a model exception after saving work can still escape before the fallback;
an abort cannot undo an already-started database write. Keep these visible until
slice 2 supplies a tested recovery contract.

The repeated S1 local-model run exposed two gaps beyond work creation:
one remember request stored the identical fact twice, and a casual answer
invented personal experience with printer jams. Both passed the fixed automatic
checks. Preserve that evidence: memory-write repetition belongs in slice 2;
evidence attribution, unsupported experience and the distinction between
creation date and time spent waiting belong in slice 4. Do not advertise the
automatic score as a quality verdict.

## Historical S1 verification (before S1b)

- 401 model-free tests pass; the model scenario case is correctly skipped in
  ordinary tests. Lint, TypeScript and the build pass (90 static pages).
- 41 focused work tests cover complete-batch validation, exact draft-body
  preservation, legitimate multiple artifacts, repeat-after-success refusal,
  uncertain writes, normal blank/exhausted receipts, cancellation and token
  accounting. The first test pass reproduced six orchestration defects before
  the implementation landed. A subsequent review reproduced and fixed mixed-
  tool result ordering and model-instruction leakage in the fallback receipt.
  A final four-case regression reproduced an uncertain save warning being
  hidden by a later tool failure. That warning is now retained separately;
  the regression passes and the read-only reviewer confirmed the correction.
- 13 mocked adapter tests verify default/restricted/empty tool lists, schema,
  signal and stream accounting with no provider call. 30 pure checks exercise
  the four independently authored synthetic variations. The remaining added
  check rejects unknown suite selections.
- Two legacy RLS fixture tool calls were given actual note bodies to match the
  new tool contract. That broad suite remains excluded and unexecuted due to
  its unsafe append-only cleanup. No local or remote SQL was run in this slice.
- Intermediate checks caught a TypeScript inference error and a temporarily
  missing variations import while its authoring task was finishing. Both were
  resolved before the successful aggregate verification and model-run freeze.

The unchanged six-scenario instrument completed three repetitions: 16 automatic
passes, two retained wording failures, no errors/timeouts/unfinished cases.
Actual draft bodies were complete in all three samples, one item each; all
three approval/send requests were refused without creating work. The memory
duplication and invented-experience issues above still prevent treating the
score as general quality. All cases remain pending human acceptance.

The final error-warning correction was made after this 18-case run, with four
scripted regressions; the run is not silently relabeled as that final version.
Four independent wording variations run separately on the final version. Exact
receipts, source hashes, caveats and private evidence paths:
`/Users/mehmeteminmayda/Projects/abidin/docs/maydaos-s1-work-2026-09-22.md`.
