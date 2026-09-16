# The work item as a document — 16 September 2026

Local implementation record. After a fresh-eyes review on Fable, this was the
first thing to build, ahead of the remaining visual steps.

## The hole it closes

The queue selected title, lane, status and age — not the draft. When the
co-founder filed "Reply to the Bornova enquiry," the founder saw a title and an
Approve button, and the reply itself was nowhere on screen. Approving blind is
the one act this product exists to make impossible, and its own queue was
asking for it.

There was also nothing to open. Six apps, all lists. A work item carries a
draft, sources, claims and a history, and the `sources`/`artifacts` columns
had never been read by anything.

## What a document is

Press the title of anything in the queue, or pick it in ⌘K, and it opens in
its own window:

- **The draft**, in the co-founder's serif, because it wrote it.
- **What it says, and where from** — each claim beside the source it came
  from, or flagged in red as *not supported by any source*. This is the
  provenance argument made visible; the worker has been storing claims tied
  to URLs since slice three and nothing had ever shown them.
- **What it read** — the sources, with how much of each.
- **What happened** — the history, each line saying whether a person or the
  system did it.
- **The decision** — Approve and Send back, at the bottom, after all of the
  above, because that is the order a person should meet it in.

Documents join the dock while open, behind a rule, so a put-away document
stays reachable and a closed one leaves no trace. A saved desk remembers
which documents were open and where — and drops any whose item is no longer
open work, because a window onto finished work is a window onto nothing.

## How it fits the shell

A window is now keyed by an app id or `item:<uuid>`. The shell keeps one
lookup for both and never learns which is which beyond how they arrive in the
dock. Every open item is rendered as a document on the server up front and
handed to the shell, which shows whichever are opened: thirty small documents
cost less than one round trip made the moment someone clicks, and it keeps an
app a server component with its own data access — the contract everything
else rests on.

The queue reaches the shell the way ⌘K reaches the conversation: a window
event, because the queue is server-rendered and the shell is not, so there is
no prop to pass. Deciding on the desk now revalidates the desk; before, only
the account page refreshed.

## Three things found by doing it

- **The title jumped up beside its kicker.** field.css lays the `<strong>` out
  as a block; the `<button>` that replaced it is inline. Fixed in the button.
- **The open button announced itself as "Open".** A `title` attribute wins the
  accessible name, so every row read the same to a screen reader. It is an
  `aria-label` of "Open: <item>" now.
- **My first click landed on the Record window**, which the saved desk had
  left covering the queue. Not a bug — but it is the argument for keyboard
  window management sooner rather than later.

## Proof

Driven in a browser against a production build: the title opens the document
cascaded over the desk; it survives a reload where it was left; the enriched
item shows two supported claims with their hostnames and one unsupported in
red; the decision sits under the draft. A member reads the whole document and
an outsider none of it — notes, sources, metadata and history all tested. The
sanitiser remembers a document window and refuses a key that is not a real
item.

228 tests, lint clean, tsc clean, build clean, smoke passing.

## Not done

- **Nothing acts after approval.** Approve "send" and the item sits at
  `approved`. That is the executor, and it is next.
- Documents are rendered for one company — the first row, like every other
  pane. Multi-company remains first-row-wins in five places.
- No keyboard way to reach a window, so a covered pane means reaching for the
  mouse.
