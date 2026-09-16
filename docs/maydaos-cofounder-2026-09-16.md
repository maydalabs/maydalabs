# MaydaOS as a co-founder — 16 September 2026

Local implementation record. Not a deployment receipt and not remote-migration
approval. Production remains `e5521a1`.

## What MaydaOS is, decided

**MaydaOS is Abidin made sellable.**

Mehmet rejected the weekly-content-email product proposed earlier today and
described what he actually wants: an AI co-founder a founder enters, on the
web first and downloadable later, that knows the business and is always there.
The translation we agreed: that is not a new invention, because Abidin has
been that system privately for months, and what makes it feel like a
co-founder is not that it talks.

Four properties, confirmed by him as the core:

1. **It knows your company.** What you sell, who you are talking to, what you
   decided and why.
2. **It tells you what needs you.** A short queue, most consequential first,
   with the reason each thing is stuck.
3. **It works while you are gone.** Watches sources, prepares drafts,
   researches what you pointed it at.
4. **It never acts alone.** Everything outward-facing waits for a person, and
   the record shows what actually happened.

The distinction that keeps this from being one more chat window: the edge is
not that it writes. It is that it remembers, it refuses to act alone, and it
can prove what it did. That was Abidin's rule from 4 September, kept.

## What this migration builds

The spine, in Abidin's own vocabulary rather than an invented one.

| Abidin | MaydaOS |
| --- | --- |
| one operator | `os_companies` plus `os_company_members`, because a product has many, and a founder and a co-founder are both people |
| work item | `os_work_items`: lane, kind, title, status, required action, notes, tags, sources, artifacts, metadata |
| the status machine | `internal.os_status_can_move`, transitions copied exactly |
| approval bound to item and action | `os_approvals`, plus `public.os_action_approved` |
| the history | `os_work_item_events`, append-only |
| the decision queue | `public.os_needs_you`, with a route and how long it has waited |

## What the database refuses, and why there

Every one of these is a database rule. A product's promise that lives only in
application code is a promise until the next bug.

- **A status is a move, not a field.** An item cannot jump from `pending` to
  `approved`, skipping every gate. Completed and canceled are terminal:
  finished work stays finished.
- **An item cannot reach `approved` while the action it waits on is
  unapproved.** This is the whole product in one rule: the system may prepare
  anything and may decide nothing.
- **An approval unlocks one action only.** An approval to email does not
  release a publish. The check is on the exact string.
- **A half-signed approval is refused**, in both directions. A record that
  claims approval with no approver is the one that gets believed later.
- **A recorded approval cannot be rewritten**, and never changes which item or
  action it belongs to.
- **The record is append-only.** An event that can be edited is not a record.
- **Everything is scoped to company membership.** No template, no shared row,
  no public read.

## Verification

- `npm run lint`, `npm run build`, `npx tsc --noEmit`: pass.
- `npm test`: **184 tests in 15 files**, including **50 row-level security
  cases** against a real local stack, nine of them new and covering each
  refusal above plus the positive: once a person approves that exact action,
  the item does go through. A gate tested only for refusal passes when nothing
  works at all, which is how this codebase lost a day on 4 September.
- Database types regenerated; the six new relations appear.

## Not built yet

No interface. No writing path from the existing workflow engine into a work
item, which is how point three joins the spine. No onboarding, so a company
and its first member are created by hand for now. No second human on a company
even though the table allows one. No schedule.

The existing `os_workflows` and `os_runs` are untouched and still work. They
become one lane of the co-founder rather than the product itself, and that
join is the next piece.
