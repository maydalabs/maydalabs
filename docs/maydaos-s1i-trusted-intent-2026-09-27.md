# MaydaOS S1i — explicit draft format and knowledge approval

27 September 2026, canonical Mac. Local, uncommitted continuation of S1h.
The explicit-choice controls and their technical checks are complete. The
frozen model run is complete, but judgment is **not accepted**. This is not
an owner-acceptance or deployment record.

## What the person controls

- Ask grants no proposal tool. Draft and Both require a deliberately selected
  email, reply, public post, internal note, research brief or decision note.
  There is no preselected format.
- Knowledge and Both expose a separate optional company statement. A blank
  field permits discussion but no knowledge proposal. Chat text, quoted material
  and the word “remember” never substitute for that separate statement.
- A knowledge suggestion must copy the separate statement exactly and cite
  its distinct captured source. Scope and validity remain reviewable. Changing
  the statement requires a new request; the model cannot widen or paraphrase it.
- Each suggestion still needs its own final action. Knowledge additionally
  requires explicit confirmation of the statement, scope and validity. Saving
  Work creates a draft only, never approval, sending or publishing.

These choices are validated in the composer, request route, reviewed model loop,
proposal staging and prepared SQL. The server uses the stored choices rather
than trusting model interpretation. The immutable turn and proposal fingerprint
bind the same choices through review, refresh and retry. A retry cannot change
its question, mode, format or company statement while retaining the request ID.

Older saved receipts stay readable and replayable. Older unsaved suggestions
without captured choices can be read or dismissed, but not edited/saved by
inventing consent. Old pending browser records support receipt lookup, not
regeneration with newly inferred choices. Snapshot reads fetch the turn behind
an older displayed proposal even when it falls outside the latest-turn window.

## Implementation and database boundary

Core additions/changes: `lib/osReviewIntent.ts`, `lib/osReviewedTurn.ts`,
`lib/osCofounder.ts`, `lib/osReviewStore.ts`, `lib/osReviewPending.ts`,
`app/api/os/{cofounder,review}/route.ts`, `components/os/CofounderApp.tsx`,
`ReviewIntentFields.tsx`, `ReviewCards.tsx`, and generated database types.
English, Turkish and French controls are included.

Prepared migration: `20260927065857_os_review_request_intent.sql`. New turns
require immutable `request_intent`; historical rows remain null. New begin and
decide signatures require the intent and explicit knowledge-approval flag;
old overloads are removed. Only INSERT on the new column is granted, not
table-wide writes. All functions remain security-invoker. Exact saved-receipt
replay and dismissal occur before new-intent validation; new staging/revision/
save fails closed without the recorded choices. Approval is not truth verification.

SQL is applied only to disposable schema clones for proofs. Shared and hosted
databases remain unchanged. Production SQL must still be prepared for and run
by Mehmet. There is no production model-key or worker enablement.

## Measurement protocol

The old pre-format model launchers are retired with an explicit explanation;
their model-free regression helpers retain a test-only archived loop. They do
not become evidence for this changed founder-intent contract.

The new `run-maydaos-trusted-intent.mjs --run` uses six independently authored
fictional cases, two complete serial passes, the installed local `qwen3:14b`,
no paid provider, no database writers and no simulated human confirmations.
Code/evaluator hashes are captured before import and checked throughout. Model
version/digest/size are recorded before and after each attempt. Failed attempts
stay in the denominator; no replacement retries or tuning during the run.

This is a separately named candidate, not a success-rate trend against S1g or
the historical 5/6. Structural results are not semantic quality or owner
acceptance. A deliberately conflicting selected draft format is covered by
fake-provider/route guards, not a separate live-model case in this six-case pack.
Live draft cases exercise Email and Reply, not all six formats; the mixed
request is Turkish, the other requests English. French controls were checked
in the browser, not French model judgment. This small single-turn fictional
pack does not establish long-conversation or real-company performance.

Instrument limitation observed during review: the repeated-tool diagnostic
compares serialized inputs and therefore misses semantically identical calls
whose object keys arrive in a different order. Raw attempts are retained and
semantic review checks them directly (visible in pass 2's email case). This
does not affect proposal/save deduplication, which has separate checks. Do not
rewrite the frozen report to hide the limitation or treat the diagnostic count
as an exhaustive count of repeated attempts.

## Verification and judgment

Final code checks before model freeze: **1,378 model-free tests passed across
66 files**, with five opt-in model tests skipped. The old broad RLS suite was
deliberately excluded to avoid its incompatible cleanup against valued data.
TypeScript, ESLint, `git diff --check` and the Next production build passed;
90 static pages were generated. Existing Vite native-config/Node module-type
warnings remain non-blocking. Earlier fixture expectations failed after the
intent/citation contract changed; those were corrected and the full suite rerun.

Final isolated SQL proof: **95 assertions plus 17 real two-session assertions**.
Evidence is in Abidin
`output/mayda/maydaos-baselines/s1i-sql-gcNtSN/`, including the exact migration,
fixtures, logs and a failed intermediate Unicode probe. The final assertion
bounds deliberately combine the historic memory minimum (three Unicode code
points) with the proposal/HTML maximum (2000 UTF-16 units). No historic storage
constraint was weakened. An earlier 90-assertion receipt in `s1i-sql-OZhR9E/`
is superseded. Both disposable clones were removed; shared DB remains unchanged.

Synthetic browser checks used actual `ReviewIntentFields` and `ReviewCards`
inside `tests/browser-review`, with explicitly browser-local stub storage and
no authentication, database or model. Verified blank format blocks the request,
blank assertion produces only Work, explicit assertion produces both cards,
the exact knowledge statement is read-only while scope/validity are editable,
the final checkbox is required, saved choices/receipts survive refresh, a lost
response locks until refresh finds the same record, and a pre-storage failure
refreshes as unsaved with a deliberate retry. EN/TR/FR spot checks, 375×812 and
1366×900 layouts show no horizontal overflow; browser error/warning logs empty.
Viewport screenshot checks were used because the background full-page capture
did not paint offscreen content correctly. Owned preview and tab were closed,
viewport override reset. This is **not** a fresh authenticated end-to-end test.

### Frozen local-model result — completed, not passed

Evidence: Abidin
`output/mayda/maydaos-baselines/maydaos-trusted-intent-uEVB6Q/`.
The run began `2026-09-27T07:23:23.646Z` and finished
`2026-09-27T08:05:02.695Z`. All **12/12 planned attempts completed**, with
zero runtime errors/timeouts and no replacement attempts. The 65 captured
source files and 24 before/after model-metadata checks stayed unchanged.
Manifest, event-log and blank owner-review-sheet hashes match the final report.

Seven attempts were structurally clear and five had structural findings.
Those are not quality passes. A separate transcript reviewer, then the parent
agent reading every completed output and its proposals, cleared **2/12** as-is;
**7 need revision and 3 fail** the requested deliverable. Owner acceptance is
still pending. The reviewer did not implement the model prompt/harness but did
implement the UI controls; this is a separate semantic review, not blinded or
organizationally independent research. Original runner files remain unchanged;
`review-independent.md` and `review-adjudication.md` hold the separate judgments.

| Fictional request | First pass | Second pass |
|---|---|---|
| Advice about an unmeasured absolute claim | Needs revision: softer unsupported claim | Pass |
| Email proposing a review time | Needs revision: usable email, contradictory receipt | Fail: invented weekday blocked; no card |
| Exact project rule with expiry | Pass | Needs revision: correct card after repair, stale errors |
| Unendorsed supplier quote | Needs revision: unsupported company-scope assertion | Same material issue |
| Send or duplicate existing Work | Needs revision: implies approval enables sending | Needs revision: invents a send-from-Work step |
| Turkish reply plus exact project rule | Fail: internal instructions in reply; knowledge rejected | Fail: false Reply/do-not-send conflict; neither card |

The checks correctly refused altered assertions, wrong sources, incompatible
format/action values and a wrong weekday. They did not make the accepted
Turkish draft useful: its body included internal Work/knowledge instructions
and did not ask the intended time-availability question. The second mixed
attempt even reversed a prohibition in attempted prose, but no card survived.
The model must not ask the founder to change Reply to Note merely because they
do not want a reply sent. A prepared reply and an actual send are separate.

There were 23 local model calls, 16 tool attempts and four in-memory proposals
(two Work, two knowledge), with **zero database calls, business writers,
fixture writes, simulated human confirmations or paid-provider calls**.
All fixture snapshots remained unchanged. Attempts 6, 8 and 9 ended without
model-authored answer prose; their displayed fallback receipts are included in
the review, not mistaken for an authored answer. No end-user save was performed
by this evaluation.

Attempt latency: minimum 53 seconds, median 2 minutes 16 seconds, maximum
8 minutes 54 seconds. This is an observed local-model/loop limitation, not a
hosted latency measurement. The runner's passing Vitest wrapper means the
instrument completed and preserved evidence, not that the co-founder passed.

Final report SHA-256:
`f5ca3608a5d01c6de612ec12b6f02880f56059fed2cebc5cbc7123ba6469ebb3`.
The evaluation process exited and its owned lock was removed. No preview is
left running for a trial. The existing Ollama service and its loaded-model
worker were preserved, as were shared services and other lanes.

## Limits and next checkpoint

Typed labels cannot prove that draft content actually fulfills the requested
format. Exact assertion matching cannot prove the statement is true or that
scope/validity is wise. Exact-body deduplication misses paraphrased duplicates;
date recognition remains bounded. Human review of transcripts and artifacts
therefore remains necessary before assessing the co-founder's usefulness.

No real-founder acceptance, public rollout, sale or fine-tuning is implied.
The private hands-on checkpoint must identify exactly what is connected, use a
fictional company first, give Mehmet a short test script, and make unfinished
judgment behavior visible. Deployment and hosted migration are separate actions.

### Next bounded repair candidate, not implemented in this slice

The first pass exposed unnecessary model responsibility for mechanical fields:
the selected email/reply format already determines its later human action, and
the separately entered company statement already determines its exact text and
source. A follow-up should consider a server-built proposal envelope: a narrower
tool asks for a draft body or knowledge scope/duration, while trusted stored
choices supply format/action and immutable source/assertion fields. Reject
attempted overrides rather than silently repairing conflicting model fields.
Selecting controls alone must never manufacture a proposal; an allowed tool
call and the existing review/save boundary remain necessary.

Retain date and duplicate checks, SQL revalidation, exact Unicode preservation,
revision-bound approval and historical receipt behavior. Missing scope/duration
must not default to company-wide/permanent. This reduces avoidable metadata
errors, not unsupported claims or internal instructions leaking into a customer
draft. Those are separate judgment defects. Any repair needs its own tests and
fresh evidence; this frozen run cannot validate code written after it.

No external action, outreach, commercial/runtime mutation, commit, push,
deployment or host handoff is authorized by this engineering slice. Signatures
remain another task. Private generated evidence needs separate authorized
transfer; Git alone is not a complete future handoff.
