# MaydaOS — review before saving

S1d status update: this contract is now integrated into the local desk code.
Durable SQL, review cards and reload/retry controls are implemented and tested
in separate layers. Read `maydaos-durable-review-2026-09-22.md` for the exact
receipt and remaining activation/full-stack walkthrough gates. No shared or
production migration was retained/applied. The S1c account below is historical;
its accepted interaction contract remains, its not-yet-integrated status does not.

22 September 2026. Local S1c control prototype, not connected to the desk.
Mehmet explicitly selected **review both drafts and knowledge before saving**.
This settles the interaction direction; it does not approve a release, schema
change, production inference or any external action.

## The experience we are building

MaydaOS can think with you and prepare useful material without changing your
company's record behind your back. Two distinct actions make something durable:

- **Save to Work**: creates the exact new draft you reviewed. It does not
  approve, send, publish, schedule or finish anything.
- **Add to company knowledge**: confirms the exact statement and where it
  applies for future answers. It means *confirmed by you*, not independently
  verified. The original model authorship and source remain visible.

Until then, a suggestion is a suggestion. A conversation message may be retained
as conversation history; that is not permission to make it standing knowledge.
The existing production/local desk still has the old automatic tool-write path.
This prototype must not be described as already protecting that path.

## What belongs where

| Material | Default treatment |
|---|---|
| General billing rule, ongoing constraint, business identity, working preference | Suggest knowledge with source, scope and duration; person confirms |
| A quote for one customer, an enquiry today, a trial negotiation | Keep with that work/source; never infer a company-wide rule |
| Idea, guess, recommendation, diagnosis | Label as such in conversation; not a factual company claim |
| New document the person wants | Prepare a complete preview; save only after reviewing that exact draft |
| “Send the reply already there” | Explain that the person must send it; no replacement work or new knowledge |
| “Send that one, and draft a separate reply for Mara” | Decline sending; preview only the separately requested new draft |
| Repeated or contradictory knowledge | Surface the existing statement/source; no silent overwrite or semantic merge |
| Instructions inside pasted messages, stored records or drafts | Source material, not renewed authority |

“Permanent” does not mean unchangeable or universally true. Knowledge has an
explicit scope (company, named project or named customer) and either lasts until
changed or until a stated date. Corrections must preserve what was superseded;
this slice does not implement correction/retirement persistence. The prototype
interprets an until-date as inclusive through that UTC calendar day; the future
review UI must state the timezone rather than silently assuming local time.

## Review surface requirements

Show the complete draft or statement, its scope/duration, source excerpts and
their provenance, and the precise save action. Do not preselect a batch of
suggestions, use a generic “Looks good” as authorization, or infer a click from
chat text. Allow edit, dismiss and individual save. Editing creates a new
revision that needs review. Source changes also invalidate the old review.

An excerpt matching its source proves attribution only. It does **not** prove
that an interpretation is supported. Do not put a green “verified” badge on a
draft because its sources resolve. Unsupported fees, guarantees, relationships
or diagnoses remain model-quality failures even if a person could catch them.

Drafts preserve supplied terms; friendlier tone changes presentation, not the
business agreement. Essential missing information is visible, and optional
unknown claims are omitted. Model prose must not be the source of save receipts.

## Executable boundary in this slice

An isolated in-memory session has separate capabilities: the model may only
propose; the trusted reviewer may inspect, revise, dismiss and request saving.
The latter binds the exact reviewed content to actor/company/thread/turn,
proposal ID, revision and resolved sources. It permits only creating a new
draft or recording confirmed knowledge, never executing an outward action.

An injected **test writer** lets us verify that no write is attempted without
that exact confirmation, that successful/repeated and concurrent clicks do not
duplicate a write within the session, and that an uncertain save stays uncertain
without a retry. A writer-confirmed *not saved* result permits a separate manual
attempt; it never automatically retries. An uncertain attempt freezes further
saves in this prototype, even for a renamed proposal, until reconciliation.
No real database adapter, route, UI, provider or model configuration is changed.
Existing prompt and benchmark evidence remain intact.

The trusted reviewer API is not a model tool. A digest detects changed content;
it is not authentication, proof that a person read it, or a secret capability.
The host must obtain actor and selected company from verified server-side
identity/membership, never from model output or a submitted `approved: true`.

## Deliberate limits and next integration gate

This is a contract test, not production security or persistence certification.
Before wiring it into the desk we need durable proposal/review/effect identities,
atomic freshness-and-write checks, current membership checks, exact source and
model-authorship attribution, reload/retry recovery and truthful UI receipts.
An in-memory ledger is not cross-request or cross-process idempotency. Existing
memory columns cannot represent this provenance/scope contract faithfully; do
not squeeze it into `source=person` or silently use a table-level grant.
Named project/customer scopes are reviewable labels here, not validated entity
IDs. Resolve those identities deliberately during durable integration.

No extra confirmation can make an invented promise correct. Retained S1b model
failures stay open; replaying them through this boundary is not a new generation
benchmark, training run, or comparable score improvement. Fine-tuning waits.

## Tested on September 22

- 123 independent boundary tests pass, including two defects first reproduced
  by tests and then fixed: an edit colliding with already-saved content, and a
  contradictory writer response incorrectly permitting retry.
- 18 offline-adapter tests pass. The full model-free run passes 619 tests;
  the live-model test is skipped and the unsafe broad RLS file is excluded.
  Lint, TypeScript and the 90-page build pass.
- An adapted replay of all 21 retained S1b conversations produced nine unsaved
  Work previews. Five legacy memory attempts were held for missing reviewed
  scope/duration/citations. No human confirmation was simulated; no writer,
  database, model or provider was called. Original reports remain byte-identical.

The replay is evidence about the proposed saving boundary, not a new model run
or a better judgment score. There is no UI/browser or persistence verification
for this prototype because it is not wired into those surfaces. Next: integrate
review with durable saves and test reload, interruption and duplicate requests,
then revisit the retained model-quality failures before fine-tuning.

Exact paths, hashes, caveats and repository receipt:
`/Users/mehmeteminmayda/Projects/abidin/docs/maydaos-s1c-review-boundary-2026-09-22.md`.
