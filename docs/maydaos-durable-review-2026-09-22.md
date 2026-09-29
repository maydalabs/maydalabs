# MaydaOS S1d — durable review and recovery

**September 23 continuation:** S1e now includes generated/typed review storage
and a real signed-in disposable-stack walkthrough. Cross-pane updates use router
refresh; the old temporary-cast and pending-walkthrough statements below record
the S1d checkpoint, not current local code. Read
`maydaos-local-walkthrough-2026-09-23.md` for 1,028 tests, 70 DB assertions,
recovery evidence, auth-refresh fix and remaining limits. Shared/production DBs
remain unchanged. The frozen model baseline is not behaviorally accepted and
fine-tuning remains deferred.

22 September 2026. Local implementation, not deployed or activated in the
shared local database. Continues the owner-approved review-before-saving
contract. Fine-tuning and broader founder features remain deferred.

## What changed

The desk route now uses `runReviewedTurn`, not the historical automatic-write
loop. The model can propose work or knowledge; it cannot save either as a
company record. Each suggestion shows its complete content, captured source,
scope/validity when applicable, and explicit edit, dismiss and save controls.
An edit updates the preview, not Work or company knowledge. Save to Work makes
a draft only. Adding knowledge requires its own unchecked confirmation.
Neither action approves, sends, publishes, schedules or completes anything.

Proposals themselves and conversation history are retained for recovery. They
are not standing company knowledge. Current citations must point to an exact
excerpt of the founder's message for that turn. This proves attribution, not
truth or semantic support. Pasted third-party claims do not become verified.

## Durable boundary

Migration `supabase/migrations/20260922160310_os_review_durable.sql` adds:

- Review turns, proposals and append-only proposal revisions.
- Atomic begin/finish/propose/decide/interrupt RPCs. Server-side verified user,
  current company membership and beta access are required. The model never
  receives the reviewer capability or chooses the actor/company.
- Exact revision/fingerprint checks; edits invalidate old confirmations.
  Work/knowledge writes and their receipts happen in the same transaction.
  Repeating an accepted request returns the original record, not another copy.
- Immutable question and recent-history capture at begin, so another concurrent
  question cannot enter a generation's captured conversation prefix.
- Column-specific writes and service-only SECURITY INVOKER functions; RLS for
  signed-in reads. No authenticated table-wide write grant is added. Existing
  memory INSERT is narrowed to its existing human-entry columns.
- Model authorship, human confirmation, source, scope and duration on reviewed
  memory. Dated knowledge expires after the stated UTC date; expired/invalid
  rows are excluded before the active-context/search limit and count.

Project/customer scope is a named label, not a validated project/customer ID
or an access-control boundary. No corresponding entity registry exists here;
the labels remain explicit context qualifiers, not global company policy.
Old/manual memory with no review metadata is labeled as such, not retroactively
verified. The existing explicit human Teach form remains separate.

The narrow store adapter temporarily casts only the new Supabase schema type.
Regenerate database types from an approved migrated environment before release.
It does not change credentials or bypass RLS for reads.

Supabase/Postgres guidance informed short transactions, consistent lock order,
RLS reads and column-scoped writes. Next/React guidance informed the server-only
writer boundary and recovery state that remains separate from model output.

## Recovery rules

Before sending a question, the browser retains its exact request ID and text in
actor/company-scoped session storage. This is a recovery hint, not authority.
Refresh checks that identity against stored turns; it never regenerates on its
own. If no receipt exists, deliberate retry reuses the same request ID. Storage
unavailability or corrupt recovery data blocks a new request rather than
quietly losing its identity. This hint is tab/session-local, not cross-device.

An unconfirmed save freezes review controls and new chat until stored progress
is checked. A committed save whose response was lost remains saved; a rolled-
back save remains proposed and can be explicitly retried. Partial stream text
does not count as a saved completed reply. Missing terminal events, provider
failures and final-reply persistence failures are surfaced as interruptions.

A crashed generation can remain running. Its original author may explicitly
close it after three minutes. Closing never regenerates or deletes proposals;
late proposals are rejected and a late completion cannot reopen a failed turn.
If completion wins the race, the existing completed receipt is accepted instead.
Another member cannot close that person's turn. No background recovery job,
automatic retry, provider enablement or silent replacement question is added.

## Verification

- Full model-free suite: **912 passed, 1 intentional live-model skip**, broad
  `tests/rls.integration.test.ts` excluded. The latter remains unsafe for valued
  fixtures because of append-only cleanup; no broad suite or database reset.
- Full lint, TypeScript and production build pass; 90 static pages plus dynamic
  routes. A prior build caught a test tuple-spread typing error, corrected and
  rechecked. Existing Vite/Node module-format warnings remain non-blocking.
- **70 SQL/RLS assertions**, transaction-wrapped against local Postgres and
  rolled back. Includes membership/beta gates, column grants, source binding,
  revision freshness, exact-once effects, history capture, expiry metadata,
  interrupted turn closure and late-result fencing.
- **21 real cross-session assertions** against a schema-only disposable local
  clone, rerun on the final migration: concurrent begin, concurrent saves,
  lost-response receipt in a new process, rollback plus waiting retry, and zero
  approvals. Clone and scoped temporary SQL files were removed. Postflight
  confirmed no retained review schema or synthetic fixture in shared Postgres.
- Browser: real ReviewCards component with a clearly labeled synthetic
  transport, not the authenticated product or real database. Tested edit then
  separate save, double-click suppression, response lost after commit, failure
  before commit, reload/retry, separately confirmed knowledge and retained
  receipt. EN/TR/FR and 375px layout checked; scroll width 375px at width 375,
  no console warnings/errors in the final browser check. Test preview stopped
  and temporary browser viewport reset/tab closed.

Code paths: `lib/osReview{Types,Store,Pending,Stream}.ts`,
`lib/osReviewed{Turn,Memory}.ts`, `app/api/os/{cofounder,review}/`,
`components/os/{CofounderApp,CofounderPane,ReviewCards,MemoryApp}.tsx`,
`app/[lang]/(os)/os/page.tsx`, and the review-specific tests/SQL/browser harness.
The previous `osReviewBoundary` prototype and old automatic loop remain for
historical tests/replay; they are not the current desk route's writer.

## Honest remaining gates

This is tested local integration code, not a live product activation. The
migration has **not** been retained in the shared local stack or applied
remotely. Until deliberately activated, missing schema fails closed. There has
not yet been one authenticated browser → route → real DB → local-model journey
on this migration. Layered tests are not a substitute for that walkthrough.

Next: use a safely isolated fully migrated local environment for that exact
walkthrough, refresh/interrupt/retry it, and regenerate types. Then evaluate the
new proposal-only model behavior against retained failure cases and independent
wording. Do not reuse the historical automatic-write benchmark score as the
new interaction's baseline. No model ran in S1d, so earlier invented promises,
source-fidelity and write-intent failures remain open, not fixed by a human click.

Other limits: the desk reads the latest 100 own proposals, 60 messages and 20
company turns, with an exact pending-request lookup beyond that window. Older
records are not deleted, but full archive/pagination is not implemented. Scoped
knowledge correction/retirement and semantic contradiction merging remain open.
The original disappearing-reply/Enter observations are not declared reproduced
or solved by these layer tests. Paid-provider crash accounting is not certified;
production remains intentionally model-disabled and zero-spend.

## Actions and repository state

No stage/commit/push, deployment, remote SQL, production environment change,
new model weights, paid inference, message, schedule, account, lead action or
host handoff. MaydaLabs remains main `404ad40`, Abidin main `af6dd74`, both
0/0 against existing local upstream refs (no fetch). Earlier dirty work remains.
SG's other-lane homepage work and its preview are untouched. Existing Ollama
and Docker services are left running; the S1d synthetic preview was stopped.
No new private evidence bundle was created; earlier ignored baseline artifacts
still need separate transfer. Browser-only synthetic local storage is disposable.

No founder decision is required to interpret this report;
release, production SQL and public access remain separate decisions.

Abidin receipt: `docs/maydaos-s1d-durable-review-2026-09-22.md`.
