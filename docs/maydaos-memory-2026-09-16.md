# Memory that accumulates — 16 September 2026

Local implementation record. Slice three of the OS arc, and the one that gives
"trained" a meaning.

## What trained means here

Not fine-tuning. A co-founder feels trained because it **accumulates**: it
learns how you price, who the difficult client is, that you will not work
weekends, and it still knows those things next month.

Before this, MaydaOS forgot everything the moment a conversation ended. The
transcript survived, but nothing was ever *learned* from it — and forty
messages of history is not memory, it is a model reasoning about the wrong
five.

## The shape

`os_company_memory`: one fact per row, in plain language, readable on its own.
Not key-value — what makes a line useful to the model is the same thing that
makes it useful to a person reading the list, and a person reads this list.

`source` says whether someone typed it or it worked it out, because that
changes how much to believe it. The trigger stamps it: a form that says who
wrote something is a form that can lie about it, so a browser insert is forced
to `person` with the caller's id regardless of what it sent.

The co-founder gets a second tool, `remember`, alongside `file_work`. Active
memory goes into the context first and in full — eighty short lines cost less
than one stale work item.

## The hard part is being wrong

**Correction is retirement, never deletion.** A memory that turned out to be
false is itself worth keeping: *"it used to think this, and on the 16th I told
it otherwise"* is the difference between a system you can trust and one that
quietly rewrites its own past.

So the table has no update or delete grant at all. Editing raises `memory is
corrected by retiring it, not by rewriting it`; deleting raises `memory is
retired, never deleted` — both from triggers, so they hold against the service
credential too. The only way through is `os_retire_memory(id, reason)`, which
checks membership, stamps who and when, and keeps the reason.

Nothing can be born retired, either. A retirement is an act with a date and a
person attached, not a property a row arrives with.

## Why there is an app for it

Memory you cannot read is a claim. Memory you cannot correct is a liability.
*What it knows* shows the whole live list with its sources, a field to teach it
something directly, and a **Wrong** button with an optional reason beside every
line. Retired things stay visible under *Things it used to think*, struck
through, with why.

## Proof

Four integration tests, including the one that actually matters: the context
says "nothing yet", the co-founder is driven through a `remember` call with the
scripted fake, and the next context contains
`[constraint] They never quote below 40 euros a pallet.` — it learned, and it
still knows. Plus: a browser insert claiming to be the co-founder is stamped
`person` with the caller's id; editing and deleting both raise; retirement
records who and why and the fact stops appearing in what it knows; and one
company's memory is invisible and unreachable from another, including through
the retire function.

Driven in a browser against a production build: two learned facts listed with
their kinds, *Hamburg is their strongest lane* retired with the reason
"Rotterdam overtook it in August", and the database confirming `retired=true`,
the retiring user, and the reason. At 390px: no overflow, the controls stack.

219 tests, lint clean, tsc clean, build clean.

## Not done

- **Still never seen it speak.** No model key on this machine by choice — the
  build is ahead of the spend. Every assertion about learning is against the
  fake.
- Nothing decides when a memory has gone stale. Eighty lines is a cap, not a
  policy, and a company that runs for a year will hit it.
- No contradiction detection: it can learn two opposite things and hold both.
- Memory is per company, not per person. What the co-founder knows about *you*
  specifically has nowhere to live.
