# The first input — 19 September 2026

Local implementation record. Fifth slice of the second batch. One migration,
`20260918200000_first_input.sql`, which production needs before this code
deploys.

## What arrives becomes work

Until now every item on a desk was made by a person, by the co-founder, or by
the worker — and the last two do not run without a model. "It tells you what
needs you" was only ever true of what you had typed yourself.

Two tables. `os_signals` is one thing that arrived: where from, what kind, an
id from the place it came from so it can never be filed twice, and the work
item it became. Nobody holds an insert grant on it, so a signal cannot be
forged from a browser. `os_connections` says which company receives which
source; writing it is an operator's act, because the site's leads belong to
exactly one company and a member must not be able to route them to theirs.
Members see their own company's connections and signals.

The first source is the site's own lead form. A trigger on `lead_intakes`
turns a new lead into a piece of sales work — *Reply to Ayşe Demir — Ege
Freight* — born pending, due tomorrow, for every company connected to the
site, once per lead per company. The body is what the visitor wrote and
chose, in the form's own words rather than its stored codes: *Constraint: Too
much manual work*, *Budget: $10k–30k*. The record says the system received
it, in the same words a person's acts are recorded in. No model is involved; a
rule is. A mailbox, Stripe, a repo are further rows in `os_connections` and
further triggers writing the same two tables.

Due tomorrow is the choice that makes the brief say so: a lead is work whose
value halves with every day it waits, and the brief lists dated work whose
day has come.

## On the desk

The Company window shows whether the site's leads land here. An operator
sees a button to route them or stop; everyone else sees that only an
operator can. The document of an arrived item says *Arrived from
maydalabs.com*, sets what arrived in the plain face rather than the
co-founder's serif, and can be edited like any open work.

## Also

- The note column takes 8000 characters and three places sliced to 20000:
  the co-founder's `file_work`, the worker, and the editor. A long draft
  would have been refused by the database and lost. All three now stop at
  the column's own limit.
- The document's history now uses the record's verbs, so the same act is not
  "arrived" in one window and "received" in the next.

## Proof

Four integration tests: only an operator can connect; a lead becomes sales
work due tomorrow for the connected company and not the other, with the
signal, the event under a null actor, and the words rather than the codes;
no browser can write a signal; a switched-off connection files nothing. 272
tests, lint, tsc and build clean.

In the browser, through the real contact form on the local site: the desk
read *Due — Reply to Ayşe Demir — Ege Freight — due tomorrow* and *Last: the
system received "Reply to Ayşe Demir — Ege Freight"*, and the document
showed what arrived. The form's bot gate silently dropped my first two
attempts — the first text box on the page is a hidden honeypot — which is the
gate working, and why the test drives the table rather than the form.

## Not done

- Unpaid invoices are not a signal yet. They need a clock, which means the
  cron, which is dormant until a key exists.
- A lead becomes work for every connected company; today that is one, and
  there is no way to route a lead to a company by its content.
- Nothing yet drafts the reply. When the co-founder can speak, a pending
  reply from a signal is the first thing it should draft.
