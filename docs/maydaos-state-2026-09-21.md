# Where MaydaOS stands — 21 September 2026

An index, written when the lane moved from Claude Code back to the Codex task
**MaydaLabs — Commercial Studio & Growth**. The commercial half of that
handover lives in the Abidin repository at
`docs/maydalabs-lane-handover-2026-09-21.md`; this file is the product half,
for whoever opens this repository next.

## September 29 — reviewed, committed, waiting on the owner's SQL

The eight Codex days (22–29 September) were reviewed in Claude Code and
committed to main as one commit, unpushed. The review and the plan are in
the Abidin repository at `docs/maydaos-codex-week-review-2026-09-29.md`.
Short form: the proposal → review → save boundary and its SQL are sound and
kept; the tree reads columns and tables that exist in no database yet, so the
four review migrations (plus a fifth that restores company membership as the
entitlement and freezes decided proposals) must be run by the owner in
production before anything is pushed; the last judgment run scored 3 pass,
7 needs revision, 2 fail of 12 on the local model at ~100 s a turn.

## September 29 — S1j trusted proposal details; regression finished, 3/7/2

The local model now supplies only draft content or proposed knowledge scope and
validity. Trusted stored choices supply format/action/source and the exact
founder statement; attempted overrides are rejected. Final receipts distinguish
confirmed cards, historical attempts, rejected batches and unknown outcomes.
1,475 model-free tests, typecheck/lint/build/diff pass. No new migration or fresh
SQL/browser proof. The frozen 12-attempt exposed S1i regression completed at
08:29Z (Abidin `output/mayda/maydaos-baselines/maydaos-trusted-intent-PnUc5K/`)
and was adjudicated 3 pass, 7 needs revision, 2 fail. See
`maydaos-s1j-trusted-envelope-2026-09-29.md`; owner acceptance is not claimed.

Next is the isolated authenticated trial on the local stack.
Successful end-to-end saving of a real local-model card is not yet proved;
S1e's successful save/recovery checks used explicitly synthetic proposals.
No production changes, paid calls, fine-tuning, commit/push or handoff.

## September 27 — S1i explicit draft/knowledge choices; judgment not accepted

The local composer now requires a selected draft format and a separate founder
statement before knowledge can be proposed. Exact assertion/source matching,
final knowledge confirmation, immutable retry choices and historical read-only
receipts are enforced through UI/routes/prepared SQL. Saving is still not
sending. Shared and hosted databases remain unchanged; SQL was proved only in
disposable clones. 1,378 model-free tests, 95 SQL +17 concurrency assertions,
types/lint/build and synthetic EN/TR/FR phone/desktop controls passed.

A frozen six-case × two-pass local model test completed all 12 attempts. Seven
structural clears do not mean useful answers: separate transcript review and
parent adjudication cleared 2/12, with seven needing revision and three failing.
No database/business writes, human confirmations or paid providers. Some guards
worked by refusing malformed proposals; some valid cards still contained poor
drafts or confusing receipts. Median attempt was 136 seconds, maximum 534.
See `maydaos-s1i-trusted-intent-2026-09-27.md` for exact evidence and limits.

Next narrow repair: derive known proposal metadata from trusted choices, make
current-state receipts unambiguous, then assess content and verify the isolated
signed-in flow for Mehmet's fictional-company hands-on checkpoint. No production
link for these new controls is ready. Owner acceptance, fine-tuning and sale
remain deferred. No commit/push/deploy, hosted SQL, public activation or
commercial/runtime action. Runner/owned preview ended; shared services remain.

## September 27 — S1h concrete review guards (no new judgment baseline)

Local code now enforces new Work type/action coherence, refuses exact-body
copies of same-company open Work, and checks supported explicit date/weekday
forms. Prepared SQL closes concurrent reviewed-save duplicates; it is not
applied to shared/hosted DB. Known refusals and uncertain saves now have distinct
review behavior. Historical receipts and explicit review-before-save remain.
1,270 model-free tests, 49 SQL + 17 concurrency assertions, types/lint/build and
synthetic phone/desktop browser checks passed. See
`maydaos-s1h-review-guards-2026-09-27.md` for evidence and precise limits.

No new model evaluation or fine-tuning. Type/action coherence is not trusted
founder intent; quote attribution is not endorsement. Next: founder-selected
artifact format and explicit knowledge assertion, adversarial tests, then new
frozen evaluation before Mehmet's private hands-on checkpoint. Still not
accepted for sale. No external action, public activation, shared/production
migration, commit, push or deploy.

## September 27 — S1g held-out judgment gate failed

Local repair sharpened proposal feedback, existing-Work/action wording and
raw tool-call text handling. A separately authored, frozen fictional held-out
pack completed 18/18 local-model attempts with no runtime errors or business
writes, but independent semantic reviewers cleared only 5/18. Thirteen had
material judgment failures. Structural clears are not quality passes and the
pack is not comparable to prior baselines. Owner acceptance remains pending;
MaydaOS is not ready for a real-founder trial or sale. One refusal-wording fix
was made after the run and has focused tests, not a fresh model evaluation.
See `maydaos-s1g-quality-repair-2026-09-27.md` and the Abidin receipt/evidence.
Next: typed intent/duplicate-Work, quote-provenance and weekday guards; exact
Save/Send copy; adversarial tests; new frozen holdout. Fine-tuning deferred.
No public/production activation, external action, commit/push/deploy or shared
DB change.

## September 23 — S1e local walkthrough completed; judgment gate still open

The signed-in browser/API/disposable-DB walkthrough now verifies explicit
reviewed saves, refresh, lost responses, deliberate retry, dismissal and stale
interrupted-answer closure. Cross-pane refresh/source display and request-cookie
propagation are fixed locally. 1,028 automated tests, 70 DB assertions,
lint/types/build and local smoke pass. Exact multi-hour expiry after the proxy
fix was not rerun; see `maydaos-local-walkthrough-2026-09-23.md` for all limits.

The new frozen local-model baseline completed all 16 attempts, but transcript
review found substantive defects in 15; owner acceptance is pending. This is
not a readiness percentage or a trend against old 5/6. See
`maydaos-proposal-baseline-results-2026-09-22.md`. Next: independent intent
regressions, then advice/draft/knowledge/action distinctions and truthful
Save-versus-Send language. Fine-tuning remains deferred.

Everything is local/uncommitted. Only the disposable DB received the prepared
migrations, not the shared or production database. Owned temporary services
are stopped; ignored evidence is retained in Abidin for separate future transfer.
Public access, production model/worker settings and commercial state are unchanged.

## September 22 local engineering update (historical)

At that checkpoint, S1d connects the review-first desk to durable proposal/revision/effect
storage in local code. Exact saves are transactional and repeat-safe; lost
responses, refreshes and interrupted answers require explicit reconciliation.
Scoped/dated knowledge retains model provenance and human confirmation, not a
verification badge. See `maydaos-durable-review-2026-09-22.md` for exact scope,
tests and limits. The prepared migration was tested then rolled back locally;
it is not retained in the shared DB and has not been applied remotely. No model
ran, no deployment occurred, and fine-tuning remains deferred. Next is an
authenticated isolated-local walkthrough and a proposal-only behavior baseline.
The S1c integration-status statements below are historical, superseded by S1d.

This page below records the September 21 deployed state, not the current
uncommitted patch. See `maydaos-measurement-2026-09-22.md` for the local M0
company-context fix, safe evaluation commands and baseline receipt. The old
5/6 is historical, not a current readiness score. Do not run the broad RLS
fixture suite against valued local data: its cleanup conflicts with append-only
guards. The new scoped SQL proof rolls back its fixtures without disabling
those guards. No deployment, production model key or worker enablement occurred.

Current local continuation: Mehmet selected review before **both** saving a
draft and adding company knowledge. S1c defines and tests an isolated
proposal/reviewer boundary in `lib/osReviewBoundary.ts`, documented in
`maydaos-review-save-contract-2026-09-22.md`. It is **not connected to the desk
or routes**; existing tool writes have not been replaced yet. 123 boundary
tests and 18 adapter tests pass; aggregate 619 model-free tests, lint, types
and build pass. Offline replay of all 21 earlier S1b conversations leaves nine
draft attempts as unsaved previews and holds five memory attempts for missing
review details, with zero writes or new model calls. This is not evidence that
the model's judgment improved. Next: durable review/save integration and the
prepared reload/interruption/retry checks, then retained model-quality failures.
No SQL, schema, UI, public access, provider, production or commercial change.
Receipt: `/Users/mehmeteminmayda/Projects/abidin/docs/maydaos-s1c-review-boundary-2026-09-22.md`.

Earlier local continuation: S1b adds per-turn memory-write deduplication and
honest uncertainty/partial-save receipts. 478 model-free tests, lint, types and
build pass. A frozen local-model candidate still invents business promises,
misreads an indirect send request and can turn quote terms into general memory;
the behavior gate is **not accepted**. Do not deploy or fine-tune this candidate.
The revised `.3` instrument uses neutral fictional company names and separate
new cases, so scores are not a trend against old 5/6, M0 or S1. Detailed receipt:
`/Users/mehmeteminmayda/Projects/abidin/docs/maydaos-s1b-faithfulness-2026-09-22.md`.
No schema, public access or production settings changed. Recovery work remains
planned, not implemented, and the old disappearing-reply observation is open.

Earlier S1 slice: `maydaos-slices-2026-09-22.md` plans five small gates and
implements complete draft-body preservation, post-success work-creation closure
and honest uncertain-save receipts. 401 model-free tests, lint, types and build
pass. The model checks still expose duplicate memory, unsupported prose and
new work mistakenly filed for an indirect send request; slice 1's behavioral
gate is not cleared. Automatic passes are not readiness. Full receipt lives in Abidin at
`docs/maydaos-s1-work-2026-09-22.md`. Finish request interpretation/draft fidelity
before advancing to persistence/retry. The prior disappearing reply remains
unresolved. This patch is uncommitted and not deployed.

## The claim

MaydaOS is Abidin made sellable: an AI co-founder inside a macOS-like web
operating system at `/os`. Four properties, in order — it knows your company,
it tells you what needs you, it works while you are gone, and **it never acts
alone**. The fourth is the product; the approval gate, the freeze trigger and
the column grants all exist to make it literally true.

"Trained" here means accumulated state plus a measurable prompt/context/tools
loop. It has never meant fine-tuning and must not be sold as fine-tuning.

## What is built, and where each is written up

| slice | commit | document |
|---|---|---|
| the desktop shell | `d30401c` | `maydaos-desktop-2026-09-16.md` |
| the co-founder's spine, then conversation | `b537fc2`, `236f730` | `maydaos-cofounder-2026-09-16.md`, `maydaos-cofounder-conversation-2026-09-16.md` |
| memory that accumulates | `2cba3af` | `maydaos-memory-2026-09-16.md` |
| command bar, the record, notices | `8ee011a` | `maydaos-os-features-2026-09-16.md` |
| work items as documents | `4deee09` | `maydaos-documents-2026-09-16.md` |
| the executor — finish and dismiss | `66934a7` | `maydaos-executor-2026-09-17.md` |
| the Work app | `fec9765` | `maydaos-work-app-2026-09-17.md` |
| the Brief | `1905755` | `maydaos-brief-2026-09-18.md` |
| edit and capture | `2c4c95e` | `maydaos-edit-and-capture-2026-09-18.md` |
| feels like an OS | `c4dc79e` | `maydaos-feels-like-an-os-2026-09-18.md` |
| Settings and PWA install | `690f365` | `maydaos-settings-and-install-2026-09-18.md` |
| the first input — a site lead becomes work | `c811013` | `maydaos-first-input-2026-09-19.md` |
| a brain at zero cost | `cec252f` | `maydaos-brain-at-zero-2026-09-19.md`, `maydaos-local-model.md` |
| the company is editable, the budget is not | `16bcb68` | — |
| it spoke, and the scoreboard learned to listen | `5beab5e` | `maydaos-it-spoke-2026-09-19.md` |

All of it is deployed. Migrations are applied to production through
`supabase/migrations/20260919090000_company_is_editable.sql`.

## Rules that are not negotiable

- **No platform model key in production.** `MAYDAOS_ANTHROPIC_API_KEY` is
  unset, so a company with no key of its own gets `not_configured` — honestly,
  and at no cost to us; `CRON_SECRET` is unset, so the worker answers 401. A
  company that wants the co-founder brings its own key through Company →
  Choose your AI, sealed under `MAYDAOS_KEY_SECRET` (30 September). The
  platform variable had in fact sat in Vercel since 4 September, left by the
  beta procedure and unnoticed until 30 September, when it was removed; this
  line was not true until then. Build, train, price, then open.
- **Nothing public leads into MaydaOS.** No link on the site reaches sign-in,
  the portal or `/os`; `npm run smoke:live` keeps all seven public pages
  honest. `robots.txt` deliberately does not disallow them: that file is
  public, so a disallow list is an index of what is hidden.
- **Grant columns, never tables.** Two holes of that class have been closed —
  `seen_at`, then `monthly_chat_usd`, each a table-level UPDATE grant exposing
  a column that is ours.
- **Production SQL is prepared here and run by Mehmet.** Transaction-wrapped,
  replay-verified against a local `db reset` first.
- **Every model-touching component stays behind its seam** — `ModelTurn` in
  `lib/osCofounder.ts`, `DraftClient` in `lib/osDraft.ts` — so the product
  stays testable against scripted fakes at zero cost.

## Running it

```bash
npm run test          # 287 tests
npm run lint
npm run build
npm run smoke:live    # the seven public pages, including what must not link
MAYDAOS_SCENARIO_MODEL=local npm run scenarios   # the six, against Ollama
```

The scenario run needs Ollama with `qwen3:14b` and `MAYDAOS_LOCAL_MODEL` in
`.env.local` — local only; `isLocalModelAllowed` refuses on Vercel. **Ollama
serves one request at a time: never run the scenarios and use the desk at
once.** A turn is about 70 seconds alone and minutes under contention.

Current score is 5 of 6, and the harness now judges what a reply *claims* as
well as what it does — the model once kept the promise in the database and
broke it in prose. With one sample per scenario it cannot tell a regression
from variance; repeats are the next improvement.

## Open, unexplained, not fixed

- Enter did not submit the composer under a browser tool, though the handler
  checks `event.key === "Enter"` correctly. The 29 September dry-run showed
  Enter submitting; the 19 September observation was the tool's, not the
  product's. Kept here until a person confirms it by hand.

Explained and fixed, 30 September: the reply that vanished after arriving.
Putting the Co-founder window away unmounted it; bringing it back mounted a
fresh one seeded from the page-load snapshot, which only a save refreshed —
hence "reproduced only when nothing was saved". Windows now stay mounted while
put away, and dock apps while closed (`components/os/OsShell.tsx`, React's
`Activity`; `tests/osShellPutAway.test.ts`), so what a window shows is kept:
a reply, a half-typed draft, a card not yet decided.

## Waiting for Mehmet in the live desk

1. Press **"Route the site's leads here"** in the Company window. Until then
   nothing on production is routed; the trigger exists and is idle.
2. Correct the company he created while testing — "corner show" should read
   "corner shop". The editor added on 19 September is how.

## Still open after the second batch

Company and account deletion (the append-only trigger fires on cascaded
deletes, so anonymising is the likely answer), an email connector, automatic
sending, teams, a desktop package — and pricing, which gates availability and
which Mehmet has deliberately pushed far out.
