# The morning brief, from the record — 30 September 2026

Slice 2 of the second arc. The desk's first words are now composed from
what the record holds, at render time, with no model and no scheduler.
"Nothing needs you" is still said when it is true — and then the desk goes
on to say what stands, instead of stopping there.

## What changed for a founder

Opening the desk, the brief reads in tiers, each fact once:

1. What is late or stuck: overdue work (most overdue first), due today, due
   tomorrow — now read on their own from `os_work_open`, not derived from
   the thirty most-recently-touched items, which is exactly the window an
   untouched overdue item falls out of.
2. Who is waiting outside: a lead that arrived since you last looked, by name
   and company, with the state of the reply the record filed for it.
3. What waits on a decision: the queue, split by what is asked when the split
   is known ("3 things need you: 2 to decide, 1 to finish"); an approved item
   says "approved, not yet sent" rather than a status word; after a week an
   item is dated ("since 18 September") instead of a counter that climbs at
   the person; cards the co-founder proposed to you that nobody decided.
4. What happened without you: a workflow that ran and left a draft, or
   failed; the change count only when it exceeds what was already named.
5. What stands: what runs next; what finished this fortnight (no zero form —
   absence is not news); on a quiet desk, what is in flight and how much it
   knows; on a truly empty desk, a first-day brief that says what the desk is,
   once.

Every item appears once. A lead whose reply is overdue is one line with two
facts; a draft a workflow left is carried by the run's sentence, not also by
the queue. The brief never says sent, done or handled.

## Three bugs fixed on the way

- The headline count of `os_needs_you`, the change count and the last change
  were not filtered by company; a member of two companies got one company's
  headline over another's list. Every read is filtered now.
- "Finished this fortnight" was the length of a fifteen-row read. It is a
  count now.
- Due and overdue came from the thirty newest open items. They have their
  own bounded read.

## How it is built

- `lib/osBrief.ts` — `composeBrief` takes the reads and returns the model:
  needs (deduplicated against dates, leads and runs), the route split when
  every waiting row was read, due, leads, proposed, runs since seen, changes,
  next, finished, knows, open, first day. Pure; nine tests.
- `app/[lang]/(os)/os/page.tsx` — one company, one filter, on every read; the
  new reads are head counts and limit-3 lists over indexed views and tables:
  `os_work_open` (due), `os_signals` (leads since seen), `os_review_proposals`
  (proposed, this actor), `os_company_memory` (live count), `os_activity`
  (last run). The page never reads its own clock: days come from the views.
- `components/os/Brief.tsx` — renders by tier with a budget of five sentences
  after the lists; EN/TR/FR copy with none/one/many forms.

## Not in this slice

- "It asked you something" and "your question never got its answer": both
  rest on reading the conversation's last message, and the second on a
  cutoff the record does not hold. Written down, not built.
- Knowledge expiring soon, and knowledge another member confirmed: no such
  rows exist yet.
- The change count still counts record entries, not items.
