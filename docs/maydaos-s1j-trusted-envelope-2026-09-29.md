# MaydaOS S1j — trusted proposal details and current-state receipts

29 September 2026, canonical Mac. Continuation of S1i. Implementation and
model-free checks are complete. The frozen regression run finished at
08:29:34Z and was adjudicated the same morning: **3 pass, 7 needs revision,
2 fail** of 12 (`review-adjudication.md` and `review-independent.md` in the
run folder). That is not an improvement figure against the earlier 2/12 and
no owner acceptance is claimed.

## What changed

The model now supplies only a Work title, complete draft body and lane, or a
knowledge classification, scope and duration. The app constructs the remaining
proposal details from the immutable stored turn: the founder-selected format,
its later human-action label, the original request attribution, and the exact
separately entered company statement. Models never choose these source IDs or
rewrite that statement. Unsupported tool fields are refused even when they
happen to match. Selecting a control alone still creates nothing: an allowed
tool call is required, then the existing full proposal guards and storage
validation run. Saving remains a separate deliberate human action.

The source and selected choices are copied before the first model await. The
route uses the persisted question for both current conversation text and source
attribution. Actor/company binding, exact assertion matching, duplicate Work
checks, date checks, revision-bound confirmation and SQL revalidation remain.
No SQL migration or database type change is needed for this slice. The existing
four prepared review migrations remain unapplied to shared/hosted databases.

Knowledge scope and validity are still suggestions, not truth. Missing scope
or duration does not default to permanent/company-wide. Attribution proves
where a request came from, not that generated claims are correct. A selected
format label also cannot prove that a draft body fulfills that format.

The final trusted receipt now reports distinct confirmed Work and knowledge
card counts, separate historical rejected-attempt counts, and separate rejected
tool-call batches. A corrected attempt no longer carries an old validation
error as the card's final status. Unknown storage outcomes stay unconfirmed,
close staging, and require readback; they never become “nothing was prepared.”
Forbidden actions remain visible even after a separate uncertain response.
Fatal/incomplete generation and hidden tool-shaped prose remain visible.
Model-authored prose is not silently rewritten; it can still contradict the
receipt, and transcript review must count that as a quality defect.

The model instructions distinguish draft creation from sending, keep internal
review instructions out of customer copy, require supplied facts to survive,
and forbid invented benefits, weekdays, category limitations or Send controls.
These are instructions, not demonstrated judgment guarantees.

Core files: `lib/osReviewEnvelope.ts`, `lib/osReviewReceipt.ts`,
`lib/osReviewedTurn.ts`, `lib/osCofounder.ts`,
`lib/osReviewProposalFeedback.ts`, `app/api/os/cofounder/route.ts`.
Retired model-free fixtures use a test-only archived prompt in
`tests/helpers/osLegacyReviewedSystem.ts`; production does not import it.

## Technical verification before freeze

- 1,475 model-free tests pass across 68 files; five opt-in model suites skipped.
  The broad `rls.integration.test.ts` was excluded to protect valued shared data.
- ESLint, full non-incremental TypeScript, production build and diff whitespace
  checks pass; build generates 90 static pages.
- New/adapted checks cover narrow schemas, metadata override rejection,
  object/JSON-string adapter inputs, exact Unicode assertions, source/intent
  mutation during generation, stored-question attribution, no implicit staging,
  recovered refusals, uncertain storage, invalid batches and forbidden actions.
- Independent read-only reviews exposed two receipt edge cases (forbidden
  actions after uncertainty and whole-batch counts); both were fixed and tested
  before freeze. Intermediate test expectation/type-narrowing failures were
  repaired before the final complete run. Existing Vite/Node module warnings
  remain non-blocking; no dependency upgrade was attempted.
- No new SQL or browser test occurred in this slice. Prior S1i isolated SQL and
  synthetic controls are historical evidence, not a fresh signed-in walkthrough.

## Frozen regression protocol and evidence

Run directory in Abidin:
`output/mayda/maydaos-baselines/maydaos-trusted-intent-PnUc5K/`.
Started `2026-09-29T08:04:48.228Z`. Instrument `trusted-intent-s1j-v1`,
case metadata version `2026-09-29.trusted-intent.2`. Twelve fixed attempts:
six exposed S1i cases run twice serially with installed local `qwen3:14b`.
No replacement retries or source changes during the run. All proposals remain
in memory; no database/business writes or simulated human confirmations.

All six case objects were separately checked as exactly equal to the previous
`maydaos-trusted-intent-uEVB6Q/manifest.json` fullCases. SHA-256 over the JSON
case array: `38ceea97e4f46e6a2879dfa8693f8035754531deafbb6b3ebbdc9609f09db4ad`.
This equality check is audit evidence, not an automatic cross-manifest gate.
Source hashes are captured before import and checked throughout; local runtime,
model digest and weight size are checked before/after each attempt. Hash scope
does not attest every installed dependency byte.

The model sees fictional company context, the current request and selected
controls, not case IDs, expected counts, the human rubric or opaque source IDs.
The loop receives the stored source independently. Repeated-tool diagnostics
now normalize object-key order recursively while retaining array order; the old
frozen report is not rescored or overwritten.

This is an exposed regression, not an untouched holdout, a comparable success
rate, a full auth/storage test or a sellability estimate. Structural success is
not semantic usefulness. The six single-turn cases cover Email, Reply, scoped
knowledge and Ask, with one Turkish mixed request; they do not establish all
formats, French judgment, multi-turn behavior or real-company performance.

## Result and next checkpoint

Completed 12/12 with no timeout or runtime error; 19 local-model calls, 7 tool
attempts, 6 in-memory cards, 0 database or business writes. Two separate
transcript passes agreed on **3 pass, 7 needs revision, 2 fail**. The repair
achieved its mechanical aim — no model metadata override was accepted and
every staged card carries the trusted type, action and attribution — while
the unresolved defects are judgment and content: unsupported softer benefits,
invented status or readiness, internal review instructions leaking into
customer replies, and both combined requests omitting the knowledge
suggestion. Original manifest, report, events and the unfilled owner-review
sheet are unchanged; the reviewers were the authoring agent's own subagents,
so this is engineering review, not independent or owner acceptance.

The next end-user checkpoint must use an isolated signed-in fictional-company
stack and give Mehmet exact local sign-in steps. It is a diagnostic usability
trial, not permission to deploy, sell or fine-tune. The existing private-checkpoint
plan remains in `docs/maydaos-private-checkpoint-plan-2026-09-27.md`.

## Boundaries and handoff

No commit, push, deployment, production SQL, public access change, paid model,
outreach, commercial/runtime record mutation or host transfer. Production
model/worker credentials remain intentionally unset; no key is proposed.
Signatures remain another task. Private evidence is Git-ignored and requires a separate
authorized future transfer; do not assume the runtime bundle includes it.
