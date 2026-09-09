# Enquiry email — 9 September 2026

Local implementation record. Not a deployment receipt. **No email has been sent
to anyone**: production has no key, so the code is inert until Mehmet sets one.

## The hole this closes

Someone filled in the contact form and received nothing. No acknowledgement, no
sign a person had seen it. Mehmet received nothing either, so an enquiry was
only discovered by remembering to open `/internal/leads`.

That is the last inch of the funnel, and it was open. Everything upstream — the
site, the five service pages, the intake validation, the rate limiting, the
consent record — existed to produce an enquiry that then sat in a table in
silence.

## What now happens

One enquiry produces exactly two messages, both transactional:

1. **To the person.** Their own message quoted back, in the language they used,
   with the plain fact that Mehmet reads these himself and usually replies
   within two working days. It states in the body that this is a one-off reply
   and does not sign them up to anything.
2. **To the operator.** Every answer they gave, their message, and a button to
   the record. `Reply-To` is set to the enquirer, so replying in a mail client
   goes to them rather than to `info@`.

Nothing else. The updates opt-in is untouched and stays `pending`: consenting to
occasional updates is a different permission from being replied to, and no code
here reads that consent. The operator notification says so explicitly, so a
"wants updates: yes" is never mistaken for a list that is being mailed.

## Design decisions

- **Fails closed and stays quiet.** With no `RESEND_API_KEY` nothing is sent and
  no request is made. That is production's current state.
- **A failed send never loses an enquiry.** The row is written first. Both sends
  are `Promise.allSettled`, every failure is logged and swallowed, and the
  visitor sees the same success either way. A mail outage costs a notification,
  not a lead.
- **Awaited, not fire-and-forget.** A serverless invocation can end the moment
  the action returns, so a detached promise would sometimes simply not run.
  There is an 8-second timeout so a slow provider cannot hold the form open.
- **Everything a stranger typed is escaped.** A name is a field on a public
  form: untrusted input on its way into an HTML document. Tests feed hostile
  values through both emails and assert nothing survives as markup.
- **No new dependency.** One `POST` to Resend over `fetch`.
- **The visual language is the existing brand email kit** in `brand/email/` on
  `codex/homepage-service-flow-sep6`: table layout, inline styles, an Outlook
  width shim and a `prefers-color-scheme` block. That shell was already checked
  across eight email layouts at 320 and 600 pixels, light and dark, with images
  allowed and blocked.

## Verification

- `npm run lint`, `npm run build`, `npx tsc --noEmit`: pass.
- 13 new tests in `tests/email.test.ts`, 166 in the suite overall including the
  36 row-level security cases against a real local stack.
- Both emails rendered to HTML and parsed: no unclosed tags, no stray closers,
  every document well under Gmail's 102 KB clipping threshold.
- Plain-text alternatives generated and read for all three languages.
- Two test assertions were wrong before they were right, and both are recorded
  here because the corrections are the interesting part. Asserting the absence
  of `onerror=` failed: the escaped text legitimately contains those letters,
  inert, and the real property is that the hostile string does not survive
  verbatim. Asserting the absence of `<img` failed on the brand logo in the
  header, which is the template's own markup.
- End to end in a browser against the local database: a real submission on
  `/contact` stored its row, and with no key configured no send was attempted.
  The test row was identified by id and deleted afterwards.

## A separate finding, not fixed here

The hidden anti-bot timing field is filled by an `onSubmit` handler, so a
submission that arrives without it carries an empty string. `Number("")` is `0`,
which reads as "filled in under three seconds", so the enquiry is **silently
dropped while the visitor is told it was submitted**.

That happens to a visitor with JavaScript disabled, and to anyone who submits
before React has hydrated — a real race on a slow connection. It predates this
work and is untouched by it. `tests/leadIntakeEmail.test.ts` records the
behaviour as a characterisation test so it is visible rather than rediscovered.
The September 5 service-page review had already noted that form sending was not
verified without JavaScript.

Fixing it means changing what counts as automated, which is a security-relevant
decision and Mehmet's to make. The narrow option is to render the timestamp
server-side into the form instead of writing it on submit, so a no-JavaScript
submission still carries one.

- **Not verified: deliverability.** No message has been sent, so nothing here is
  evidence about spam placement, rendering in a real client, or DNS alignment.
  The root domain has SPF and DMARC at `p=none`; Google DKIM is still not
  enabled.

## To switch it on

1. Resend, the MaydaLabs team, create an API key. `maydalabs.com` is already a
   verified domain there from the Supabase auth wizard, so any mailbox on it can
   send.
2. Vercel, project `maydalabs`, all environments: `RESEND_API_KEY`. Optionally
   `MAYDALABS_NOTIFY_EMAIL` if notifications should go somewhere other than
   `info@maydalabs.com`, and `MAYDALABS_FROM_EMAIL` to send as something other
   than `MaydaLabs <info@maydalabs.com>`.
3. Redeploy, then submit one real enquiry from an address you control and check
   both messages arrive and land in the inbox rather than spam.
4. Delete that test row from `/internal/leads`.

Free tier is 3,000 messages a month and 100 a day. Two per enquiry.

## Not built

No marketing send, no newsletter, no proposal-published email, no reminder when
an enquiry goes unanswered, and no queue or retry. If a send fails it is logged
and that is all; the record is in the database and the internal page is still
the reliable way to see it.
