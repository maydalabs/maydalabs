# It works while you are gone — 16 September 2026

Local implementation record. Third of the four properties. Companions:
`maydaos-cofounder-2026-09-16.md` (the spine) and
`maydaos-entering-2026-09-16.md` (the front door).

## What was actually missing

Almost nothing had to be invented. Two working systems had simply never been
introduced to each other:

- `os_workflows` could already gather standing sources and draft from them,
  with a private-address guard, a budget and a claims-to-sources pairing. It
  only ever ran when a person pressed a button — the opposite of a co-founder.
- The spine could hold a company's work and refuse to approve it without a
  person. It had no way to receive anything.

So a finished draft landed in `os_runs`, a list no queue read, and waited to
be noticed. This connects the two and adds a clock. The worker uses the
existing pipeline unchanged and deposits into the spine, where the status
machine and the approval gate already govern what happens next.

## The clock

`os_workflows` gains `company_id`, `cadence` (`manual` | `daily` | `weekly`),
`next_run_at`, `required_action` and `paused_reason`. `manual` is the default,
so nothing that exists today starts running on its own.

`/api/os/tick` is called hourly by Vercel Cron, authenticated with
`CRON_SECRET` compared in constant time. With no secret configured the
endpoint refuses everything — an open URL that spends money on model calls is
a bill waiting to be run up by whoever finds it.

**Claiming is atomic.** `public.os_claim_due_workflows()` moves `next_run_at`
forward in the same statement that hands the workflow out, under
`for update skip locked`. Two overlapping ticks cannot draft the same thing
twice, and a worker that dies mid-run costs one cycle rather than every cycle
after it.

It lives in `public` because that is the only schema PostgREST exposes and the
only one `service_role` can reach. Execute is granted to `service_role` alone.

## What it may and may not do

Every item the worker creates is born in `review`, carrying the action it
waits for. It may prepare anything; it may decide nothing. That is not a
convention in `lib/osWorker.ts` — the database refuses to let an item be born
approved, from this morning's migration `20260916180000`.

Runs the worker performed record `user_id` as null. Filling it with the
workflow's owner would put a person's name on work they were not present for,
in the table whose only value is being true. Members read those rows through a
company policy; nobody can write one from a browser.

## Two bugs the tests found

**Service_role could not move a work item at all.** The gate trigger is
`security invoker` and calls `internal.os_status_can_move()`. `authenticated`
has usage on `internal`; `service_role` never did, so every server update
failed with `permission denied for schema internal`.

This was invisible because it looked like success. The approval gate is
*supposed* to refuse things, so a refusal read as the rule working. It was the
schema being unreachable. The test that caught it asserts the exact message
rather than merely that an error occurred, and there is now a positive test
beside it proving the server *can* make a legal move. A refusal-only test
passes just as well when nothing works at all — the 4 September lesson,
earned again.

**A test compared two clocks.** `next_run_at` is set by the database and was
asserted against the test machine's `Date.now()`; the container ran ~92ms
ahead. The assertion is now a tolerance, and whether something is genuinely
due is settled by asking the database to claim it.

## Proof

The whole property end to end, with the model and the network stubbed through
the seam `lib/osDraft.ts` already provided — everything else is the real
database. A schedule comes due, work is prepared, and it arrives in the
founder's queue as `route = 'decide'`, `required_action = 'publish'`, with a
run pointing at what it produced, an event recording that a machine did it,
and a final assertion that what it prepared still cannot be approved by
anything but a person.

193 tests, lint clean, tsc clean, build clean.

## Not done

- No UI yet for setting a cadence: a workflow is scheduled by writing the
  column. That is the next piece, alongside the run history a person can read.
- `CRON_SECRET` is not set in production, so the schedule does not yet tick
  there. Deliberate: nothing should start spending on a schedule before the
  person who pays for it has seen it work.
- The worker only drafts from standing sources. Watching for *changes* — the
  thing that makes it feel like it is paying attention — is a later step.
