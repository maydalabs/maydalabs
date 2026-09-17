# The Work app — 17 September 2026

Local implementation record. The seventh app, and the first slice since the
spine that needed no migration.

## Two gaps, one of which I had not seen

**Drafts were nearly lost.** The queue answers "what needs me". A note the
co-founder files needs nobody, so it appeared in no queue and could be found
only by typing its name into ⌘K — which is close to not being findable at all.

**The live desk could hold no work.** Every item so far was made by the
co-founder or the worker, and neither runs without a model key. So on
production there was no way to have a single work item, and everything built
on top of one — documents, the lifecycle, the executor — was unreachable in
practice. I only saw this while planning the list: a list of everything open
that is empty forever is not a feature.

So the Work app is two things: everything open, and a one-line form for a
person to add their own.

## Everything open

Grouped by lane — sales, content, product, ops, finance, then any lane nobody
planned for, alphabetically, rather than dropped. Within a lane, what wants a
person leads (decide, to do, stuck), then what is merely in progress, newest
first among equals. Finished work from the last fortnight sits at the bottom,
dimmed. Dismissed work is simply gone.

Rows are a table read downward — status, title, kind, date — in fixed columns,
because a list whose rows each measure their own gutter is a list of
sentences; the record made the same mistake before it became a log. The title
opens the item as a document. Status words are the founder's, not the state
machine's: `review` is Abidin's vocabulary, *Decide* is what it asks of a
person. Colour means "this needs a person", here as everywhere.

The arrangement is a pure function (`lib/osWork.ts`), tested without a
database. The rows come from the page, which already loads them for the
documents: one query feeding two views of the same work, not two queries that
could disagree about what is open. Dates are formatted from the stored
timestamp, which is pure — no clock, so no migration for an age column.

## A person's own work

Born `pending`, through the caller's own client, so the insert policy decides
whether this is their company and the gate decides whether that birth state is
allowed. `metadata.by = "person"` is a rendering hint and nothing more; who
actually added it is the `added` event, which the database stamps with the
actor itself. A form that says who wrote something is a form that can lie.

That hint matters to the typography. The serif means *the co-founder wrote
this*. A person's own note set in the co-founder's serif would make the type
say something false, so the document now sets it in sans and labels it *Your
note*. The worker, meanwhile, had never said it was the worker — its items
carried claims and a workflow key but no `by`, so "Prepared while you were
away" never appeared. It does now.

## The gate refused my own seed

The first seed tried to insert an item born `approved` with a required action
nobody had approved. The database refused — to the service role. That is
yesterday's insert gate doing exactly what it was written for, against me,
which is better evidence than any test I wrote for it. The seed now approves
the way approval actually happens: born in review, a signed approval for the
exact action, then the move.

An earlier seed had also lost two of three items silently: a bulk insert with
uneven keys nulls a NOT NULL column and PostgREST fails the whole statement.
The seed checks every insert now and inserts one row at a time.

## Proof

Seven unit tests for the arrangement; one for the sanitiser knowing the app;
one integration test for the path the form takes — a person adds work and
finishes it the longest legal way there is, pending to completed, which
nothing else exercised — with the record reading `added, completed` under
their own id.

244 tests, lint clean, tsc clean, build clean.

## Not done

- A person's item is a title and a lane. There is no editing anything after
  it exists — not the title, not a note.
- Lanes are shown as their raw English keys in every locale.
- No cap on how many items a company may hold. They cost nothing the way
  workflows and companies do, but nothing stops a thousand of them.
- Multi-company is still first-row-wins, and now in six places.
