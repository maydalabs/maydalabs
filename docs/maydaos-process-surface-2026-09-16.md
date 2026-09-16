# The process surface — 16 September 2026

Local implementation record. Fourth in the day's sequence, after the spine,
the front door and the worker.

## What this is

An operating system shows you what is running whether or not you asked. Until
this, MaydaOS only ever responded to a click — work could be scheduled, but
nothing said so, which is why it read as a set of pages rather than a system.

Two things landed:

1. **Scheduling from the product.** A workflow can be given a company and a
   cadence from the form. Before this it could only be done by writing the
   column in psql.
2. **`What is working while you are gone`** on the account page: per workflow,
   its cadence, when it is next due, how its last run ended, and what it has
   spent this month against its budget.

## The bug this session existed to find

The loop was closed everywhere except where a customer touches it.

`internal.os_workflow_member_guard()` stamped the owner and left `company_id`
null, and the worker only ever picks up a workflow that has one. So a founder
could set up work and it would sit there forever. That much was expected.

What was not expected sat one layer down. Widening `lib/osBetaAccess.ts` so a
company member could reach the workflows page **changed nothing about what the
database would accept**: `os_workflows_private_beta` is a RESTRICTIVE policy,
so it applies on top of every permissive one, and it asked only whether the
person was on the per-user private beta allowlist. The page opened, the form
submitted, and the save failed with the form's generic "That did not save."

Found by driving the browser, not by reading code. Fixed in the database,
where the decision actually lives: the restrictive policies on `os_workflows`
and `os_runs` now accept `public.os_has_company()` as well as the allowlist.
That helper is `security definer` because it is asked from inside a policy and
must not re-enter `os_company_members`' own row-level security.

## The trap, for the third time today

Every other test in that block runs as `userA`, who line 516 puts on the beta
allowlist. So they would all have passed whether or not company membership
granted anything — which is exactly how this shipped broken.

The new test signs in as someone on no allowlist, holding nothing but a
company. It was checked the only way worth trusting: the old policy was put
back and the test failed with `42501 insufficient_privilege`, then the policy
was restored and it passed.

Same lesson as the gate that only watched UPDATE, and as the endpoint that
refused everyone including Vercel Cron. A test that only ever asserts a
refusal passes just as well when nothing works at all.

## What it means commercially

Belonging to a company is the entitlement now. The allowlist still works, so
original private-beta members and operators are unaffected.

**This widens who could spend money**, and that is worth stating plainly. What
stands between a stranger signing up and a bill is not this gate: five
workflows per person, five dollars a month each, a daily ceiling across all of
them, and the fact that nothing runs on a schedule without `CRON_SECRET` and a
model key — neither of which is set in production. When MaydaOS is actually
sold, payment becomes the entitlement and this changes again.

## Proof

Driven end to end in a browser against a production build: a founder signed
in, opened the workflows page (404 before the fix), set up *Weekly freight
brief* filed into *Northwind Logistics* on a weekly cadence needing `publish`,
and saw it appear as `EVERY WEEK · DUE NOW · Has not run yet · $0.00 of $5.00
this month`. One worker tick later, with the model and network stubbed:

```
What needs you.      CONTENT / NOTE  Weekly freight brief
                     WAITING ON YOUR DECISION   today   [Approve] [Send back]

Running.             EVERY WEEK  Weekly freight brief  DUE IN 7D
                     Last run: today — prepared something
                     $0.01 of $5.00 this month
```

And in the database: one item at `review` awaiting `publish`, one run costing
$0.0135 whose `user_id` is null, one event.

201 tests, lint clean, tsc clean, build clean, 101 smoke checks, no horizontal
overflow at 390px.

## Not done

- The account page still carries the older per-user MaydaOS panel beneath the
  new ones, which says "Running is switched off" while the new surface shows
  the same workflow running. Two truths about one thing; the old panel should
  go.
- No run history, only the last run per workflow.
- Still one member per company. `os_company_members` has the role column and
  the policies; there is no invite.
