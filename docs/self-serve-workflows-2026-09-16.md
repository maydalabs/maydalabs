# Self-serve workflows — 16 September 2026

Local implementation record. Not a deployment receipt and not remote-migration
approval. Production remains `e5521a1` until Mehmet approves a release.

## The decision behind it

Mehmet chose, on 16 September, that MaydaOS becomes a product he sells rather
than only the way MaydaLabs delivers a service, and asked that Sazmining be
kept out of the framing. That reverses the recommendation of 9 and 11
September, which was the other way round. It is his call and it is recorded
here as made, not re-argued. The freeze rule of 9 September ("no client, no
feature") is superseded by it: a product is built before its first buyer or it
is not a product.

## What this adds

A member can now create, edit and delete their own workflows at
`/portal/workflows`. Until today a workflow existed only if an operator typed
it in by hand at `/internal/os`, which is the wall between an internal tool and
something a person can buy. It is also the piece Mehmet needs himself, because
the weekly content cycle he committed to requires a workflow he can set up
without editing a database.

The form asks for the name, the purpose, the brief, the shape, the standing
sources, the reading window, the source limit and the destination. It does not
ask for three things, and would not accept them if it did:

- **the key**, which is derived from the name so nobody has to invent a unique
  slug;
- **the monthly budget**, which is the money lever and stays the operator's;
- **the owner**, which is always the person filling the form in.

## Where the guarantees live

In the database, not the form. `20260916100000_member_workflows.sql` adds
three policies and a `before insert or update` trigger. The trigger forces the
owner to the caller, pins `monthly_budget_usd` to the default on insert and to
its stored value on update, refuses to let the key move, and stops a member at
five workflows. The server action runs entirely through the caller's own
client with no elevated credential, so a bug in the form cannot become a way
to spend the API balance.

Column grants cannot express any of this: operators and members are both the
`authenticated` role, and a grant cannot tell them apart.

**Two callers pass through the trigger untouched**, and the order matters. A
caller with no `auth.uid()` is the service credential, trusted server code
that already bypasses row-level security and never a visitor, because `anon`
holds no write grant on this table. An operator is the second.

## Two mistakes worth recording

**The service credential broke first.** The operator check was computed in the
function's `DECLARE` block, so it ran before the service-role guard could
return, and every service-role insert failed with `permission denied for
schema internal` — only `authenticated` has usage on that schema. Two existing
database tests failed immediately and a direct probe named the cause. The fix
was ordering: return for a null `auth.uid()` before anything reads `internal`.

**The empty state lied.** The work section hid the run form when the model key
was absent *or* there were no workflows, and showed one message for both.
Once a member could create a workflow, that told someone with five workflows
that they had none. There are now three states with three messages: running is
switched off, no workflow yet, or the budget is spent.

**A third, smaller.** `NFKD` does not decompose the Turkish dotless i or soft
g, so "Haftalık piyasa notu" produced the key `haftal_k_piyasa_notu`. Those
letters are now transliterated before normalising, and the test asserts the
readable result rather than only that the key is valid.

## Verification

- `npm run lint`, `npm run build` (87 static pages), `npx tsc --noEmit`: pass.
- `npm test`: **175 tests in 15 files**, including **41 row-level security
  cases** against a real local Supabase stack, five of them new: a member
  creates one owned by them, cannot mint a template, cannot move the budget or
  the key on their own edit, is stopped at five, and an outsider is refused
  entirely. The existing operator-can-set-the-budget test still passes, so the
  negative cases are not passing for the wrong reason.
- `smoke:live` against the optimized build: **101 checks**, including the new
  route closed to a signed-out visitor in all three languages and kept out of
  the sitemap.
- End to end in a browser against the local stack: a real member signed in
  through the emailed link, opened `/portal/workflows`, created a workflow
  named in Turkish, and the row landed with the owner set to them, the budget
  at the 5.00 default they never saw, and the feed parsed. The form carries no
  key or budget field. Turkish locale renders, and at 390 pixels nothing
  overflows.
- The generated database types are unchanged: the trigger lives in `internal`,
  which is not exposed.

## Not built

No schedule, so a workflow still runs when a person presses the button. No
email delivery and no one-click approval, which remain the canonical idea of
11 September and are the next thing to decide. Access is still by explicit
database membership; opening that gate is a commercial decision, not a code
change. A member cannot set their own budget by design, so a paid tier needs a
way for an operator to raise it, which exists at `/internal/os` today and is
manual.
