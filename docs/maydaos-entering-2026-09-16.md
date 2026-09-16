# Entering MaydaOS — 16 September 2026

Local implementation record. Not a deployment receipt and not remote-migration
approval. Production remains `e5521a1`.

Companion to `maydaos-cofounder-2026-09-16.md`, which built the spine. That
migration gave a company work items, approvals and a history but no way for a
person to begin: the company row and its first member had to be inserted by
hand. A product whose first step is "ask us to create your row" has no first
step. This is the step.

## What a founder now does

Two acts, and deliberately only two.

1. **Start a company.** A name and, optionally, what it does. One statement
   creates the company and makes the person its owner.
2. **Settle something.** The queue comes back with what is waiting on a human.
   Items in review carry approve and send-back; the rest carry the reason they
   are stuck and nothing to press.

Everything else is the system's job, which is property three of the four.

## Where the guarantees live

In the database, as before. `app/actions/cofounder.ts` can only ask.

| Guarantee | Where |
| --- | --- |
| a company always has an owner | `internal.os_company_first_member()`, an `after insert` trigger that adds the creator in the same statement — no window exists in which a company has nobody who can see it |
| three companies per person | the same trigger, counted over `os_company_members` where role is `owner` |
| the record cannot be shaped by its caller | nobody holds insert on `os_work_item_events`; `public.os_record_event()` is the only way in, checks membership, stamps the actor itself, and cannot be pointed at another company's item |
| an item cannot be approved without its approval | `internal.os_work_item_gate()`, from the spine, unchanged |
| how long something has waited | `public.os_needs_you.waiting_days` |

That last one started as a lint failure — `Date.now()` during render is impure
under `react-hooks/purity` — and hoisting it to a constant only moved the
impurity. Putting the clock in the view is the better answer anyway: two
people looking at the same stuck decision should agree on how old it is,
regardless of when their browser painted.

## Ordering that matters

Approving is two writes, and the order is not arbitrary:

```
insert os_approvals   →   update os_work_items set status = 'approved'
```

The database refuses the second until the exact `required_action` the item
waits on has been approved. If the update then fails, the approval stands
alone, which is the honest failure: a person did decide, and the record says
so. The reverse order would have produced an approved item with no evidence
behind it, which is the one outcome the whole design exists to prevent.

## The screen

`components/CofounderQueue.tsx` is a server component on `/[lang]/portal`,
above the existing work panel. No membership: the start form, and nothing
else. With membership: `os_needs_you`, oldest first.

`components/CofounderPanels.tsx` submits with plain forms. The decision
buttons are not JavaScript-dependent, because approving something is the act
that most needs to work when something else is broken.

Copy is EN/TR/FR in `components/osCopy.ts`. The relative time stands on its
own — an earlier draft prefixed it, which turned "today" and "yesterday" into
things nobody says in any of the three.

## Proof

A founder signed in through an emailed link, created *Northwind Logistics*,
saw two items with correct routes, approved one with a note. The database
afterwards:

```
status=approved | required_action=publish | approval_action=publish | signed=t
notes="Good, send it." | event=approved | event_note="Good, send it." | has_actor=t
```

And, from a superuser psql connection — the trigger covers update and
delete both, so history cannot be rewritten or quietly removed by anyone,
including us:

```
update public.os_work_item_events set event = 'tampered';
ERROR:  the work record is append-only

delete from public.os_work_item_events;
ERROR:  the work record is append-only
```

That second one surfaced while clearing local test data, which is the right
way to learn it: the only way to empty the table is to drop the database.

Checks: 184 tests, lint clean, tsc clean, build clean, 101 smoke checks
against the production build. The queue renders at 390px with no horizontal
overflow.

## Not done

- Property three — working while you are gone — has no worker yet. The schema
  carries sources and artifacts for it; nothing writes them.
- A company has exactly one member today. `os_company_members` has the role
  column and the policies, but there is no invite.
- These three migrations are not on production. `CofounderQueue` queries
  `os_company_members` and `os_needs_you`, neither of which exists there, so
  the deploy has to follow the migrations, not lead them.
