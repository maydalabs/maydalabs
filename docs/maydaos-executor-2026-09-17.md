# The executor — 17 September 2026

Local implementation record. The second half of the fresh-eyes review: the
gate was airtight and led nowhere.

## The hole

Nothing reached `approved` without a person signing the exact action — and
nothing ever left `approved` either. No code anywhere moved an item to
`completed`. A founder could approve "send" and the item would sit there for
good. Stuck work offered nothing to press; a note the co-founder filed could
be neither finished nor thrown away. "Works while you are gone" meant "drafts
while you are gone."

## The first honest executor is the person

MaydaOS prepared it, they approved it, they did it in the world, and they
record that it is done and where it went. The desk says so plainly on
approved work: *MaydaOS cannot do this one for you yet.* An executor that
pretended otherwise — a "publish" button wired to nothing — would be the one
lie this product cannot afford.

The automatic executor arrives later as a **second caller of the same
function**. That seam exists now and is tested now, before anything uses it,
because it is the promise everything rests on: the server may finish what a
person approved, and nothing else.

## `os_complete_item` adds no rule of its own

One transaction: walk the item legally to `approved`, move it to `completed`,
append the outcome to `artifacts` (a column that had existed since the spine
and never been written), and record who did it. Every hop is an ordinary
UPDATE, so the existing gate judges each one. The function does not check for
an approval anywhere — it simply cannot get past the trigger that does.

Two consequences, both tested:

- **A refusal rolls the whole walk back.** An item at `drafted` that needs
  "send" walks to `review`, is refused at `approved`, and is still at
  `drafted` afterwards. An item left at `review` because finishing it failed
  would be a state nobody chose.
- **The server is held to the same gate.** Called with the service credential,
  an unapproved item raises `needs an approved "publish"`; an approved one
  completes, and the record shows a null actor — which already reads as *the
  system did this*.

`os_dismiss_item` is the other way out: legal from anywhere but the end, and it
keeps the reason. I caught one thing while writing its test — the gate only
judges a status that *changes*, so canceled-to-canceled slipped through and
would have appended a second "dismissed" to a record whose whole value is that
each line happened once. Both functions refuse the end states explicitly now.

## On the desk

The document's lifecycle block offers what is possible from where the item
stands, and never decides legality itself: Approve / Send back in review;
*Mark done* with an optional link and note once approved; *Done* for a draft
nobody must approve; *Ready for review again* for a sent-back draft that still
needs a decision (finishing it there would always be refused, and a button
that is always refused is a trap); *Back to draft* for stuck work; and
*Dismiss*, always, beneath a dashed rule, asking why.

Finished work stays openable for a fortnight — `os_finished_lately`, on the
database's clock for the same reason `waiting_days` is — and leads with *Where
it went*. Record lines open their item when the desk has it loaded. ⌘K now
finds every document, including drafts, which need nobody and so appeared in
no queue and were previously unreachable from anywhere on the desk. And the
co-founder's context gains what was finished this fortnight, so it stops
proposing work that is already done.

## Found along the way, not fixed

**A company with history can never be deleted.** The append-only trigger fires
on cascaded deletes too, so removing a company that has any events is refused
— by design for the record, but it is also account deletion, which a sold
product has to offer. That needs a deliberate answer (anonymise rather than
delete, most likely) before availability, not a workaround now.

## Proof

Seven integration tests against the real database: finishes approved work
with its outcome, actor and event, leaves the queue, joins finished-lately,
and appears in the co-founder's context; refuses the unapproved and leaves it
exactly where it stood; finishes a no-approval draft; holds the server to the
gate and records its work as the system's; dismisses once and keeps the
reason; refuses a `javascript:` link; and is unreachable from outside the
company.

235 tests, lint clean, tsc clean, build clean.

## Not done

- No automatic executor. Sending or publishing needs credentials and a
  recipient model, and both are Mehmet's to decide.
- Drafts are findable by ⌘K but still have no list of their own. A *Work* app
  — everything open, by lane — is the natural seventh app.
- Multi-company is still first-row-wins.
