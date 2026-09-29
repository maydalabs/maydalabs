# MaydaOS S1f — explicit intent, frozen baseline, private trial gate

23 September 2026, Europe/Istanbul. Local candidate only. This records the
slice after the signed-in recovery walkthrough; it does not supersede that
walkthrough or authorize a release, production SQL, paid inference or outreach.

## What changed

A founder must now choose **Ask**, **Draft**, **Knowledge** or **Both** before
submitting a co-founder question. Ask can answer but has no proposal tool;
Draft can suggest only Work; Knowledge can suggest only company knowledge;
Both offers both suggestions. These choices are a ceiling, not a command to
invent a proposal. The selection travels with the browser recovery hint, the
question request, the durable turn and the model prompt/tool list. A same-ID
retry with a different mode is refused. Historical turns are labeled `both`
because both tools were available when they were created; this does not claim
the founder chose Both at the time. The additive SQL is
`supabase/migrations/20260923004646_os_review_request_mode.sql`; it grants the
new INSERT column only, not an entire table. It is prepared, not applied to
the shared local or hosted database. The isolated SQL proof passed 86
assertions, including mode collisions, tool ceilings and a nonstandard Work
required-action value passing unchanged through staging and save. That value
does not create an approval or sending path.

Browser recovery now retains the mode of a pending question and exact retry.
An old mode-less hint is read-only until a matching historical receipt is
checked or the person explicitly clears the browser hint. A newly written
hint cannot be cleared by an older in-flight read. Retry is disabled while
another turn is running. Inaccessible session storage blocks new questions
with a distinct explanation in EN/TR/FR, rather than pretending a hint can
be inspected or cleared. Review cards still require a separate human save;
none of these modes approves, sends or executes work.

After the frozen run, one bounded truthfulness repair was added: a proposal
whose citation ID or exact quote does not match this turn's stored founder
message is refused **before** attempting database staging. The model receives
that known refusal and may correct it. A failed/unknown database RPC remains
uncertain and closes staging; it is not mislabeled as a known rejection. This
repair and the final UI recovery fixes were made *after* the baseline and are
not credited with its results. The next runner source-hash list includes the
new citation helper.

## Frozen local-model evidence

`qwen3:14b` ran serially on the existing Mac installation, with no model
change or tuning between cases. Eleven fictional, independent cases were
frozen as `2026-09-23.intent.2`, spanning advice, new draft, company knowledge,
existing Work/action and mixed requests. The runner used in-memory fixtures
that throw on business writes. It completed 11/11 cases with zero runner
errors/timeouts, 22 model calls, 17 attempted tool uses, three staged Work
suggestions, zero staged knowledge suggestions, zero DB writer calls, zero
human confirmations and zero external actions. The six structurally clear
cases and five with structural findings are *not* usefulness scores. All owner
acceptance remains pending; the report's human-review field is unchanged.

Git-ignored raw evidence, to transfer separately at a future authorized
handoff:

`/Users/mehmeteminmayda/Projects/abidin/output/mayda/maydaos-baselines/maydaos-intent-check-8ptEA6/`

It contains `manifest.json`, `report.json`, `events.jsonl` and
`review-sheet.json`. The run was 2026-09-23 01:06:46–01:46:59 UTC.
`report.json` records source hash recheck as true and human review as pending.
The events are normalized provider-seam events, not a literal wire/thinking
transcript. The source hash freeze happens after modules load, so it cannot by
itself prove their pre-hash in-memory identity; no source was deliberately
edited during the run. Original artifacts remain untouched by the later
candidate fixes.

## Independent transcript review — not owner acceptance

The structural screen missed important semantic failures. This is the
assistant's review of complete retained traces, not Mehmet's acceptance and
not an estimate of market readiness.

| Case | What the retained response showed | Judgment |
|---|---|---|
| 01 Ask: limited-time priority | Mostly useful priority answer; source/date presentation imprecise. | Potentially owner-review-ready, not accepted. |
| 02 Ask: prospect no-shows | Invented automated reminders, confirmation and tracking commitments. | Fails evidence discipline. |
| 03 Draft: Nessa follow-up | Eventually staged a draft, but first attempted an incomplete proposal; prose used `[As previously drafted]`, and later email action was `null`. | Incomplete handoff. |
| 04 Knowledge: Oak Lantern duration | Repeated malformed duration fields (`from`/`until`), no card or useful explanation. | Fails knowledge creation. |
| 05 Knowledge: unagreed exclusivity | Tried to make an unagreed visitor statement permanent; proposals were malformed, with no useful correction advice. | Fails judgment and schema. |
| 06 Ask: send existing Cora Work | Did not send or stage new work, but described `waiting-on: send` as if that were the stored status; actual status was review with required action send. | Misleading action state. |
| 07 Draft: existing Keon send plus internal note | Staged a note and did not send, but language implied approval might enable execution; weak separation of actions. | Fails truthful handoff. |
| 08 Knowledge: spare-parts pilot | Malformed duration in repeated attempts, no card or prose; tried to make advice into standing rules. | Fails knowledge and intent. |
| 09 Draft: Nola setup-time reply | Staged one draft without a guarantee, but supplied an unsupported causal explanation and left outward action `null`. | Fails groundedness. |
| 10 Draft: send existing Farah Work only | Refused to approve/send and did not create a replacement. Minor ambiguous wording about other tools. | Potentially owner-review-ready, not accepted. |
| 11 Both: Friday rule and Sela email | Malformed duration; a Work citation quote did not match the stored question. The old candidate called the result uncertain, leaked tool JSON into prose and named an incorrect weekday/date; zero cards. | Fails multiple gates. |

On this qualitative pass, only 01 and 10 lack a substantive defect; neither
has owner acceptance. The other nine remain failures. This is not a comparable
percentage against older six-case instruments. In particular, a safe storage
boundary does not make the co-founder useful to sell.

## Verification after bounded post-baseline fixes

- 1,086 model-free tests passed across 52 files; three local-model tests were
  intentionally skipped and the broad RLS integration suite was excluded
  because its cleanup is unsafe for valued local data. Focused UI recovery
  tests exercise the actual component handlers with synthetic hooks/storage.
- Lint, `tsc --noEmit`, the Next.js build (90 static pages) and
  `git diff --check` passed. The current migration's isolated SQL proof passed
  86 assertions; this is not a hosted migration.
- A local preview rendered the public homepage. A signed-out visit to
  `/en/os` returned a 307 to `/auth/sign-in`, then 200. The owned preview and
  temporary browser tab were stopped/closed. The browser CLI prescribed by
  the verification skill was absent, so a signed-in visual pass of the new
  composer was **not** completed this turn; the component logic and earlier
  signed-in S1e walkthrough are separate evidence.
- No fresh model run after the citation/UI patches. The fixed candidate must
  face new frozen cases rather than borrowing the old baseline's label.

## Next bounded work and Mehmet's checkpoint

Do not fine-tune yet. Next repair slice: make a simple dated company rule
produce a valid reviewable Knowledge card, with clear provenance, scope and
duration; make a requested draft complete and label any later send action
truthfully. Repair the model-facing feedback and response presentation without
case-name rules, schema loosening, raw tool JSON or automatic saving. Keep
unsupported capabilities/causal claims and existing-Work action confusion as
explicit negative tests. Then freeze a fresh held-out run and review the actual
drafts, not just schema counts. Latency is also a product gate: this 11-case
run took about 40 minutes and is not a usable session-speed demonstration.

Offer Mehmet a **private hands-on checkpoint after that repair/evaluation
slice**, before any fine-tuning or production activation. Use an isolated local
stack and fictional company first, then a consented private company if he
wants. Walk Ask, Draft and Knowledge; inspect a proposed card, refresh, edit,
save deliberately, retry an interrupted request and verify that nothing was
approved/sent. Record usefulness, errors, timings and his exact corrections.
Do not call this a sellable beta unless the quality, recovery, privacy,
production-security and performance gates pass separately.

Production MaydaOS remains closed to public navigation and deliberately has
no model key/worker secret. No commit, push, remote SQL, deployment, public
access, lead contact, post, ad, spend or commercial record change was made in
this slice.
