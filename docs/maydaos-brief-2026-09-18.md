# The Brief — 18 September 2026

Local implementation record. First slice of the second batch, whose purpose
is a desk worth opening every morning at zero spend, because daily use is the
only way the state accumulates that "trained" means here.

## The desk speaks first

Property two, "it tells you what needs you", was true only of a person who
had already opened the queue. And the first thing a fresh desk showed was the
co-founder window: the biggest window, open by default, on production an
empty chat that could not answer, next to a black void.

Now the desk's own surface carries the brief, under the windows, in the
co-founder's serif: the date, *3 things need you.*, the three that have
waited longest, and then, one sentence a line, what changed since you last
looked, the last thing that happened, what runs next on its own, and what
finished this fortnight.

It is not a window. No title bar, nothing to close, never comes to the front.
Windows open over it, and default windows keep to the right so a fresh desk
shows it whole. On a phone there is no "under", so it is a pane of its own,
first in the dock as *Today*, and the pane the phone opens on.

Every sentence is computed from the record, through the views that already
carry the database's clock — `os_needs_you`, `os_recent_record`,
`os_activity`, `os_finished_lately` — so no migration was needed. No model is
involved, which is the point: the desk speaks whether or not the co-founder
can, and when it can, this is the slot its own sentence goes into.

The composition is a pure function (`lib/osBrief.ts`), so a given morning can
be asserted without a browser. Three forms per count, because "0 things need
you" is a counter and "Nothing needs you" is a sentence. Nothing is said about
changes on a first visit: "nothing has changed since you last looked" would be
a lie told by a default. A paused workflow is named only when nothing runs,
because then it is the news and otherwise it is noise.

## A clock

A desk without one is a web page. It ticks on the minute, aligned to the
minute, and renders nothing on the server: the server does not know what time
it is where the person is sitting, and a wrong time that corrects itself a
moment later is worse than a blank one. The bar reserves its width so nothing
shifts when it fills in.

## The co-founder is dormant, not missing

Without a model behind it the co-founder can say nothing, so it no longer
greets a person with a window that cannot answer. An app can now be
`dormant`: it loads closed whatever the saved layout says, sits dimmed in the
dock, and can still be opened — the window says plainly *The co-founder is
not switched on yet* in place of the invitation to ask it something. The
chat pane learns this from the server rather than by sending a message and
reading a 503. The moment a key exists, the desk opens on the conversation
instead, and the queue steps back into the dock.

## Two things underneath

**One answer to "which company".** Six panes had each asked the database for
the first company it felt like returning; for a person in two companies they
could disagree with each other. `currentCompany()` in `lib/osCompany.ts` is
now the only place that question is asked — the oldest company the person
belongs to, the same everywhere — and when choosing arrives, it arrives there.
Proven against the local database with a fresh person joined to two
companies newest-first, and an outsider who gets nothing.

**An untouched window takes the app's current default.** Hydration moved out
of the shell into `lib/osDesktop.ts`, where it is tested. A window nobody has
moved used to keep the default it was *saved* with; now it takes the app's
current one, because the designer's arrangement can improve and a person who
never expressed a preference should get the improvement. A placed window
still comes back exactly where it was left.

## Also

- Sentences that open something: a title opens its document, "and 4 more in
  Needs you" opens the queue, through a window event like ⌘K, because the
  brief is rendered on the server and the shell is not.
- The record's verbs gain `added`, `dismissed`, `reopened`, `resubmitted` in
  all three languages; the Record app had been showing those as raw keys.
- Checked at 1512×900 and 390×844 in EN, TR and FR: the Turkish sentence
  order is *Son: bir kişi “…” ekledi*, the French *Dernier : une personne a
  ajouté « … »*.

## Proof

Five tests for the composition, seven for hydration, one integration test for
the company lookup. 258 tests, lint clean, tsc clean, build clean. The
"and 1 more" link first landed in the label column and wrapped to three
lines; caught in the browser, fixed, measured level with the titles at 128px.

## Not done

- The brief cannot be dismissed or collapsed; a person who wants an empty
  desk gets a desk that talks. Settings, slice 4.
- "Since you last looked" counts record entries, so an item added and then
  approved counts twice. The queue's count does not.
- The greeting does not know the time of day. Deliberately: the date is a
  fact and "good evening" is a guess.
