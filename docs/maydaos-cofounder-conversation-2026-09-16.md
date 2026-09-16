# The co-founder you can talk to — 16 September 2026

Local implementation record. Slice two of the OS arc.

## What was missing

Until this, MaydaOS could only be *operated*: press a button, approve a draft,
set up a workflow. There was no way to say "look into this" or "what do you
think". The thing Mehmet described on the first day — a space you interact
with a co-founder in — had every part except the interaction.

## What makes it not a chat window

Two things, and neither of them is the prompt.

**It reads the company's real state before it says anything.** What you sell,
what is open and what each thing waits on, what you approved and when and with
what note, what runs on its own, and the recent history. Assembled from the
database in `buildCompanyContext`, deliberately narrow and recent: a context
that grows without bound eventually costs more than the answer is worth, and a
model handed a hundred stale rows reasons about the wrong five.

**The one thing it can do, it cannot finish.** `file_work` puts something in
the queue. Anything with an outward act waiting on it is filed at `review`;
everything else is a draft. It cannot file something approved, because the
gate added this morning refuses an item *born* approved just as it refuses one
moved there. The system prompt says it may not approve, but that sentence is
not what stops it — a prompt can be argued with, and a trigger cannot.

## The seam

The whole loop is exercised in tests without a key and without spending
anything:

```
ModelTurn = ({ system, messages }) => AsyncIterable<ModelEvent>
```

`lib/osCofounderModel.ts` is the only part that touches the SDK.
`lib/osCofounderRun.ts` is the loop — stream text, collect tool calls, run
them, call again so it can say what it did, and stop. A turn is not one model
call: without the second, a person watching sees an answer that stops
mid-thought and a task that appeared from nowhere.

Rounds are capped at three. A loop that can call a tool can call it forever,
and forever is measured in dollars. The test asserts the cap is reached
exactly, not merely respected — "at most three" is also true of a loop that
never ran.

## Streaming

`/api/os/cofounder` is a route rather than a server action, because an answer
that appears all at once after ten seconds is a worse conversation than the
same words arriving as they are written. Newline-delimited JSON, so filing
work can be its own event rather than text the client has to parse out of a
sentence. In the transcript a filed item reads differently from a spoken one,
because "it did something" is a different kind of fact from "it said
something".

Both halves are written by the server inside the request that called the
model. Nobody holds an insert grant on `os_messages`, and updates and deletes
raise: a record whose subject can compose either side of it is not a record.

The co-founder's message is written after the stream finishes, not during it.
A half-finished answer stored as though it were whole is worse than one that
is visibly missing, because only one of the two is obvious later.

## Money

Conversation is the one part of this product where cost follows enthusiasm
rather than a schedule, so `os_companies.monthly_chat_usd` caps it at $5 a
month by default and the route refuses with 402 past that. Every message row
carries its own tokens and cost; the month's spend is the sum of those rows,
with no second number to keep in step.

## Proof

Driven in a browser against a production build. The desk opens with
*Co-founder* on the left and *Needs you* on the right, four apps in the dock.
Sending with the button and with Enter both work; the person's message is
kept, the empty reply removed, and with no model key configured the honest
refusal appears — "The co-founder is not switched on yet." — rather than a
silent failure. At 390px: no overflow, and the compose box clears the dock
(780 against 794).

The loop itself is proven in six integration tests against the real database:
the context contains the company's actual facts; a filed item lands at
`review` with its required action and `by: cofounder`, and then **cannot be
approved** — `needs an approved "send"`; something with no outward act is
filed as a draft; an invented tool is refused rather than crashing the turn;
the round cap holds; and the transcript is company-scoped, unwritable from a
browser, and append-only.

215 tests, lint clean, tsc clean, build clean, smoke passing.

## Not done, and one thing to watch

- **I have not seen it speak.** There is no model key on this machine, so
  every assertion about the loop is against a scripted fake. The plumbing
  either works the first time a key is set, or it does not, and I cannot tell
  you which from here.
- One thread per company, and the company is whichever row comes back first.
  There is no company switcher, so a person in two companies talks to an
  arbitrary one. Fine at three companies per person, wrong the moment it
  matters.
- It cannot read anything outside the context it is handed — no searching the
  record, no fetching a URL, no reading a file. `file_work` is the only tool.
- Nothing it learns is written down. Telling it something today does not mean
  it knows tomorrow, beyond what happens to be in the transcript. That is
  slice three.
