# The OS features — 16 September 2026

Local implementation record. Slice four of the OS arc: a command bar, the
record made legible, and notice of what happened while you were away.

## Three things, one idea

MaydaOS now acts without you — the worker drafts on a schedule, the co-founder
files and learns. Everything in this slice follows from that.

**The record, readable.** `os_work_item_events` has been append-only since the
spine, and nobody could look at it. "We can prove what happened" means nothing
to a person with no way to read it. The *Record* app lists the history with
its work item attached, and every line says **who**: `THE SYSTEM prepared`,
`A PERSON sent back`. That comes from the view rather than being inferred in
the page, because a null actor is not missing data — it is the answer.

**What is new since you last looked.** `os_desktops.seen_at`, a count in the
menu bar, a cobalt rule down the left of anything after it, and one divider
where the new stops rather than a badge on every line: the useful fact is
where to stop reading.

**The command bar.** ⌘K, and after windows this is the most
operating-system-shaped thing there is — the difference between a product you
navigate and one you address. It finds apps, open work, and things the
co-founder knows; and it carries a sentence straight into the conversation
without your having to find the window first.

## A hole this found in my own reasoning

`os_mark_seen()` is a definer function that can only ever set `seen_at` to
`now()`, and I wrote a comment saying a claim about when you last looked is
not worth letting anyone backdate. The test I wrote to prove that **failed**:
`os_desktops` carried a table-level `UPDATE` grant so a person could save
their window layout, which also let them write `seen_at` directly, including
backwards. The definer function was theatre.

Postgres checks column grants before policies, so narrowing the grant is the
whole fix:

```sql
revoke update on table public.os_desktops from authenticated;
grant update (layout, user_id) on table public.os_desktops to authenticated;
```

And beside it, the test that keeps the fix honest: a person can still save
where their windows are. "seen_at cannot be written" and "the desk cannot be
saved at all" look identical from outside, and only one of them was wanted.

## Wiring worth noting

The command bar hands a sentence to the conversation through a window event
rather than through props. The conversation pane is rendered on the server and
the bar is not, so there is no shared state between them to lift — and the
same route gives the phone its way in, since a chord is not an affordance on a
device with no keyboard. The question is put in the composer rather than sent:
⌘K is for getting somewhere quickly, not for committing to what you
half-typed.

## Proof

Driven in a browser against a production build. ⌘K opens over the desk with
six apps and the open work items; typing *what should I do about Bornova*
offers **Ask the co-founder** and **Tell it**; Enter closes the bar, raises and
focuses the conversation, and leaves the sentence in the composer. The Record
app shows `THE SYSTEM prepared · Reply to the Bornova enquiry`,
`A PERSON sent back · Weekly freight brief`, all flagged new, with `3 new` and
*Mark seen* in the bar — which clears the count and the flags while leaving
the history intact. At 390px the bar is 358px wide with zero overflow, the
chord is hidden, and the search affordance takes the space the company name
was using.

Four more integration tests: the record names who and hides another company's
entirely; `seen_at` moves only forward and only by its owner; and the layout
still saves.

222 tests, lint clean, tsc clean, build clean, smoke passing.

## Not done

- **Still never seen it speak.** No model key by choice.
- No files or artifacts. The schema carries columns for them; nothing writes
  or reads them, and there is no app.
- Notice lives in the menu bar only. Nothing reaches you when the tab is
  closed — that needs a service worker, or the desktop app.
- The command bar searches what is open and what is known, not the record or
  the transcript.
- No window snapping, tiling, or keyboard movement between windows.
