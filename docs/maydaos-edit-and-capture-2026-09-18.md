# Edit and capture — 18 September 2026

Local implementation record. Second slice of the second batch. One
migration, `20260918120000_edit_and_capture.sql`, which production needs
before this code can deploy: the page reads a view that does not exist there
yet.

## The hole this closes

A work item could not be edited from the desk at all — and could be edited
without limit through the API. A company member holds UPDATE on the table,
and nothing looked at which columns changed. So a draft could be approved for
"send" and then rewritten, or have its action changed to "publish", and the
approval would stand for the new text. The approval was bound to an action;
it was never bound to the words.

Two triggers, both indifferent to who is asking — the server is refused the
same way a browser is:

- **Freeze.** Content — title, note, lane, kind, the action it waits on, its
  sources, its due date — is editable until the item is approved, finished,
  or carries an approval for its action. That last clause matters:
  approved → review is a legal move, and without it a person could withdraw
  an approved item, edit it, and re-approve on the old signature. Status and
  artifacts are not content; the executor appends outcomes after approval
  and must. The refusal comes back in the database's words: *approved work is
  frozen: what was approved is what stays.*
- **Record.** Every content change becomes an `edited` event carrying the
  fields that changed and what they said before, written by the database
  under the person's own id. Nothing in the application has to remember to
  keep the record.

Tested both ways against the local stack: a member edits their open work and
the record says so; the same member and the server are both refused on an
approved item; the action cannot be swapped after approval; finishing still
works; an item sent back from approved stays frozen while a never-approved
item in review does not.

## Editing, on the desk

An *Edit* word under the document's header, offered while the item is
editable. Title, part of the business, due date, note. The editor never
decides the line itself: it sends the change and shows what the database
said. It closes by arithmetic — it was opened for submission *n*, a
successful save makes the result *n+1* — so no effect sets state, and a
refusal keeps it open with the reason.

## Capture from ⌘K

*Add to work: Send the September invoice to Bornova* → one question, *Which
part of the business?* → the five lanes → the Work window opens on the new
item. Two steps rather than a silent default lane, because a silent default
files everything under Ops and then Ops means nothing.

## Due dates

Optional, on add and on edit. Open work now comes to the page through
`os_work_open`, which carries `due_in_days` by the database's clock, for the
same reason `waiting_days` exists. The Work app's date column shows the due
date where there is one and the last change otherwise; overdue and due today
get the colour that means "this needs a person". The brief lists dated work
whose day has come — overdue, today, tomorrow — under the queue, whatever its
status: a task nobody has to approve still needs a person when its day
arrives.

## Also

- Lanes have names in every language — Satış, Opérations — instead of their
  raw English keys, in the Work app, the queue, the document and ⌘K.
- The record's verbs gain *edited*.
- A record test inserted two events in one statement, which stamps both with
  the same `now()` and leaves their order to chance; it failed for the first
  time today and now inserts them one at a time.

## Proof

Five integration tests for the triggers and the view, one unit test for due
work in the brief. 264 tests, lint, tsc and build clean. Checked in the
browser at 1512×900 and 390×844: capture from ⌘K, edit with a due date and a
note, the record reading *added, edited*, the brief reading *due today*, and
no Edit on an approved item.

## Not done

- No editing of the co-founder's draft after it is approved, by design; and
  no way yet to send an approved item back to draft to redo it, only to
  review. Dismiss and re-add is the path today.
- The `edited` event stores the whole previous note. Edits are rare and made
  by people; if a note is edited fifty times the record grows fifty notes.
- Due dates are not reminders. The brief says the day has come only when the
  desk is open.
