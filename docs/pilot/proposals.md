# "Prepared for you" — the proposal a prospect finds at sign-in

_Added 3 September 2026. Product surface: `pilot_proposals` (one per
pilot), authored at `/internal/pilots`, read by the client at `/portal`
and `/portal/pilots/<id>` once published and once the pilot is theirs._

## Why it exists

The outreach note says, in effect: "I already did some of the work —
sign in with this address and see it." When the person signs in, the
portal leads with **Prepared for {Company}** instead of an empty account.
That is the experience; the note is just the doorway.

## Workflow (per target)

1. **Create the pilot** at `/internal/pilots` with the prospect's email,
   company, the workflow you intend to run, status `proposed`. It
   attaches itself to their account when they sign in with that email.
2. **Write the proposal** in the pilot's "Prepared for you" block. Keep
   it a **draft** (unchecked) while you write. Preview it with the
   "exactly as the client sees it" toggle.
3. **Send the outreach note** yourself (never automated). The note must
   name the email address to sign in with — it is the key.
4. **Publish** the proposal (check "Published", save). Do this right
   before or right after sending, never days earlier: the timestamp is
   part of the honesty.
5. When they sign in: the portal heading becomes "Prepared for {Company}",
   the proposal card leads, the pilot record sits under it.

## Fields and the rules behind them

- **Headline** — one line, theirs not ours. Name the workflow and the
  outcome ("Your weekly email, drafted by AI, sent only when you say so").
- **Why I reached out** — first person, Mehmet's own sentences, two short
  paragraphs at most. This is rendered as a letter with his signature.
- **Origin** — `outreach`, `job_application`, or `referral`. For
  `job_application`, fill **Role title**; the client sees a line saying
  the contact started as an application and the pilot is the same work
  as a system instead of a seat. Fill **The role, and the alternative**
  with what you would do in the first 30 days in the role, mapped to the
  pilot. Dual-track rule still applies: one motion per company per
  message (DEC-2026-09-01-07).
- **What we noticed** — one observation per line:
  `observation | https://source | Source label`. Observations without a
  public URL render with a "no public source" tag. Never invent a fact;
  if you cannot link it, either write it as an observation from
  Mehmet's own experience or leave it out.
- **Sample** — real work, produced for them from public sources, with a
  **How the sample was made** line (date, sources, "not reviewed by
  {Company}"). Rich text: `## heading`, `- bullets`, `**bold**`,
  blank-line paragraphs.
- **Scope** — one line per step: `Week 1 | Title | Detail`.
- **Terms** — plain text. Pricing is a draft until Mehmet approves it
  (`docs/bitcoin-ops-pivot-brief.md`).
- **CTA** — a `https://` or `mailto:` link. Default is a mailto to
  info@maydalabs.com with a subject; a booking link works too.

## Security model

Clients read only a published proposal on a pilot whose
`client_user_id` is theirs; drafts are invisible to them; only operators
(`internal.operators`) write. RLS-tested in
`tests/rls.integration.test.ts` ("pilots (client vs operator)").
