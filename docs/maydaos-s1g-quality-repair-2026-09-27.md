# MaydaOS S1g — quality repair and independent held-out check

27 September 2026, Europe/Istanbul. Local, uncommitted engineering only. This
receipt follows the S1f intent baseline; it does not supersede its original
evidence or turn its structural clears into quality passes.

## What changed

- The reviewed-turn prompt and tool descriptions now distinguish advice,
  draft Work, company knowledge and actions. An email or reply proposal is
  instructed to declare a send action; an internal note is not. Context shows
  an existing Work item's `status` separately from its `required_action`, so a
  draft awaiting send is not represented as sent or approved.
- Invalid Knowledge and Work attempts now receive bounded, field-specific
  feedback before a retry. The strict review parser and review-before-save
  contract remain in charge; a model cannot turn its own answer into saved
  Work, company knowledge or an external action.
- The response stream now holds and suppresses leading pseudo-tool JSON/XML
  rather than showing it as the co-founder's answer. Split chunks and normal
  prose have focused tests.
- After the frozen held-out run, attempt-specific refusal wording was clarified
  so a failed early attempt does not falsely say a later valid proposal was
  never staged. This *post-run* wording fix has model-free tests, but it was
  not part of the frozen model candidate and has not had a new model run.

No schema, migration, live route, provider setting or public-access change was
made in this slice. The signed-in MaydaOS desk was not walked in a new browser
session after these edits.

## Frozen evaluation and honest result

An independent author prepared nine fictional held-out cases, each scheduled
for two serial passes. Their exact case text was not inspected by the repair
implementer until the candidate was frozen. The runner checked source, runner,
test and local-model identity before and throughout the run; it used the Mac's
existing `qwen3:14b` and staged proposals in memory only. It made no business
database calls or external actions. Evidence is in the ignored directory:

`/Users/mehmeteminmayda/Projects/abidin/output/mayda/maydaos-baselines/maydaos-intent-heldout-hNURbF/`

Preserve its `manifest.json`, `report.json`, `events.jsonl` and
`review-sheet.json` without editing them. Git and the current Abidin runtime
bundle do not carry this directory; transfer it separately only during an
authorized host handoff.

The runner completed **18/18** attempts with zero runtime errors, timeouts or
unfinished cases. It recorded 32 local-model calls, 21 attempted tools, 15
in-memory staged proposals, zero human confirmations and zero business writes.
Median attempt time was 2m 42s and the slowest was 6m 54s on this local model;
latency is another product-quality gap, not evidence of production performance.
Twelve attempts were structurally clear; six had structural findings. That is
not a quality or readiness score. Two independent transcript reviews found
only **5 of 18** clear against their semantic criteria; the other 13 showed
substantive problems. Owner acceptance remains pending. These are new cases,
not a comparable trend against S1f, the old 5/6, or any previous baseline.

Observed failures include invented product benefits and unsupported commercial
claims; a customer reply mislabeled as an internal note; wrong weekday wording;
a quote promoted to lasting company-wide knowledge; duplicate Work proposals
when an existing draft should have been recognized; stale refusal text after a
valid retry; and statements suggesting that review/Save could send an item.
One answer switched into Chinese despite an English request; one produced
cards but no useful model-written answer. A few attempts were correct, and raw
tool JSON did not appear in the reviewed held-out answers. The current product
judgment is still **not accepted as useful or sellable**. Do not invite a real
company trial, enable production inference, fine-tune or advertise it on this
evidence.

## Checks and boundaries

Before the held-out run, TypeScript, lint, model-free tests, Next build and
`git diff --check` passed. The broad RLS integration suite was deliberately
excluded because its old cleanup is unsafe for valued local data. After the
post-run refusal-wording change, focused tests passed 76/76. Final local checks
also passed: TypeScript, lint, 1,105 model-free tests in 57 files (four skipped),
Next 16 production build (90 static pages), and diff checks in both repositories.
The held-out run did not exercise auth, durable DB saves, browser rendering or
production behavior.

Production MaydaOS remains unlinked from public navigation. The production
model key and worker secret remain intentionally unset. There was no commit,
push, deploy, hosted/shared migration, paid model call, lead action, message,
email, post, schedule, runtime/commercial mutation or host handoff.

## Next bounded slice

Treat these as enforcement and evidence problems, not as a request for more
prompt adjectives: carry trusted founder intent into typed proposal checks;
block duplicate open Work at the pre-storage and transactional save boundary;
validate weekday/date agreement; stop external quotes from becoming durable
company facts without explicit founder assertion; and make Save-versus-Send
copy exact in the desk. Add adversarial regression tests, then freeze a new
independent held-out run. Only when semantic results support it should Mehmet
try a private, local, fictional-company hands-on checkpoint. Fine-tuning is
still deferred.
