# Portal, phase 1 — 11 September 2026

Local implementation record. Mehmet said "yes to all" to the four decisions
below and "go on phase 1". This is the deletion-and-copy phase only. It adds
no capability, so the freeze rule of 9 September ("no client, no feature")
is untouched.

## The canonical idea, decided

MaydaOS is not a place. It is a delivery.

A workflow runs on a schedule. The client gets an email: the draft, every
claim beside its source, and two one-click links, Approve and Send back.
Clicking records the decision. Nothing moves without them, and they never
log in unless they want the history. The operator's console is
`/internal/os`. The client's inbox is where MaydaOS lives.

Why: nobody signs in to a vendor's portal to approve a LinkedIn post. The
evidence was at home — ten drafts sat a week in a dashboard, while the person
who had to decide on them lives in Outlook. Email now works, so the rail
exists. This is also the hero line ("prepared work → human review → human
approval") made literal.

That inbox flow is **phase 2** and is new capability. Under the freeze rule
it waits for a client, with one honest exception: if Mehmet runs his own
content workflow weekly, he is the first client, and the flow gets built
against that use. If he will not run it weekly, it is not built.

Still not recommended, for the reasons given on 9 September: a separate
product at its own domain.

## What the portal is now

Your account, and nothing more: work waiting for a decision if any, a link to
the record, the engagement (proposals, invoices), sign out.

## What was cut, and the evidence for each

| Cut | Evidence |
| --- | --- |
| The Multiplier Map (`/start`, saved maps, the map claim flow) | 1,674 lines from a positioning that lasted one day (2 September) and was orphaned by the five-services reset on 5 September; still linked from the footer, the case studies page, the sitemap and the portal |
| Profile fields (name, company, role) | Nothing read them except the form that saved them |
| The email-updates preference screen | Nothing sends to that list. The opt-in on the contact form stays as the seed of one |
| The submitted-enquiries status list | Only ever updated by hand at `/internal/leads`; the acknowledgement email now does the job |
| The retired page's social-card variant | Image for a page that no longer exists |
| Sign-in and portal copy | Still promised maps, briefs and preferences |

`/start` and the older `/roi-quickcheck` now redirect permanently to
`/contact`, in all three languages. The case studies page's final call to
action is contact alone.

**Kept on purpose:** the sign-in step that attaches earlier records to a new
account by verified email — enquiries, the updates preference, and any
engagement created for that address. Only the anonymous-map part of it was
removed; the file is now `lib/claimRecords.ts`.

**Database untouched.** `multiplier_maps`, `profiles` and `subscriptions`
still exist. Dropping tables is a one-way door, their row-level security
tests still run, and nothing in the app writes to the first two any more. A
later migration can remove them once that history is not wanted.

## The privacy notice

Rewritten in EN/TR/FR to say what is true now: enquiries instead of briefs
and maps, an account that shows work and an engagement rather than saved
maps and preferences, the updates opt-in living on the contact form, and
Resend named as the sender of sign-in codes and enquiry acknowledgements
alongside Google Workspace. The Multiplier Map section is gone and the rest
renumbered. Dated 11 September 2026.

## Verification

- `npm run lint`, `npm run build`, `npx tsc --noEmit`: pass.
- `npm test`: 161 tests in 15 files, including the 36 row-level security
  cases against a real local stack. The count is down from 173 because the
  Multiplier Map's own tests went with it.
- Every file written was scanned for invisible or lookalike characters.
- One mistake during the work, recorded because it is the kind that hides: the
  privacy rewrite script reused the variable holding the file path for a
  paragraph of text, so its first run reported success and wrote the result to
  a stray file named after a French sentence. The file's unchanged
  modification time exposed it. The stray file was deleted and the script
  rerun with the variable renamed.

## Not done here

No phase 2. No migration. No change to what the operator sees at
`/internal/os` or `/internal/leads` beyond dropping the map column from the
leads list. The About page still uses a key named `mapCta` whose value has
pointed at contact since 5 September; it is a stale name, not a stale link.
