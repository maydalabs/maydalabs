# Email setup

Two separate systems send mail for MaydaLabs. They use the same provider and
almost nothing else, and confusing them is the reason "we already have Resend
wired" is both true and not enough.

| | Sends | Credential lives in | Status |
| --- | --- | --- | --- |
| Supabase Auth, over SMTP | Sign-in codes and links | Supabase dashboard | Delivering |
| The app, over the Resend API | Enquiry acknowledgement and operator notification | Vercel env | Needs a key |

---

## 1. Enquiry email — one variable

The code shipped on 9 September and is inert until `RESEND_API_KEY` exists.
`maydalabs.com` is already a verified domain in Resend, so any mailbox on it can
send and no DNS work is needed.

1. Resend, **API keys**, Create API key. Name it something like `maydalabs-app`.
   Sending permission is all it needs. Copy the value once; Resend never shows
   it again.
2. Vercel, project **`mayda-labs`** (not `maydalabs` — the project slug has the
   hyphen), Settings, Environment Variables. Add `RESEND_API_KEY` for
   Production. Optionally `MAYDALABS_NOTIFY_EMAIL` if the notification should go
   somewhere other than `info@maydalabs.com`, and `MAYDALABS_FROM_EMAIL` to send
   as something other than `MaydaLabs <info@maydalabs.com>`.
3. Redeploy.
4. Send one enquiry through `/contact` from an address you control. Confirm both
   messages arrive, and that the acknowledgement lands in the inbox rather than
   spam. Then delete that row at `/internal/leads`.

Free tier is 3,000 messages a month and 100 a day. Two per enquiry.

## 2. Auth email branding — check the SMTP first

The branded templates are in `brand/email/templates/`: `sign-in.html` for the
magic-link and OTP mail, `confirmation.html` for a first account. Both preserve
`{{ .Token }}`, `{{ .TokenHash }}` and `{{ .SiteURL }}`, and both link to
`/auth/confirm?token_hash=...&type=email`, which is the only shape
`app/[lang]/auth/confirm/route.ts` accepts. Preview them by opening the files in
`brand/email/preview/`. `node brand/email/build.mjs` regenerates all eight
assets and is deterministic.

**Check this before pasting anything.** A Supabase project on the default email
service cannot customise templates at all, and is rate limited to a handful of
messages an hour. Customisation needs custom SMTP. In the Supabase dashboard,
open Project Settings, Authentication, and look at SMTP Settings:

- **Custom SMTP enabled, host `smtp.resend.com`.** Good. Paste the templates
  under Authentication, Emails, Templates.
- **Custom SMTP off, or the section says the default service is in use.** Then
  the templates were never going to stick, whatever was pasted before. Enable
  custom SMTP first, with host `smtp.resend.com`, port `465`, username `resend`,
  and a Resend API key as the password. That is a second key, separate from the
  app's, so revoking one does not break the other.

There is a reason to suspect the second case. The Resend account currently shows
**no API keys at all**. A Resend SMTP password *is* an API key, so if custom
SMTP were pointed at this Resend team there would be one listed. Either the key
lives in a different Resend account, or auth mail is going out on Supabase's
default service. Worth resolving either way, because the default service will
not carry real sign-in volume.

### After pasting

Test all four paths, because they do not share a template or a code path:

1. A returning account, entering the code.
2. A returning account, clicking the link instead.
3. A brand-new email address, both code and link. Supabase sends the
   confirmation template here, and the confirm route accepts only `type=email`;
   if the link fails while the code works, that is the cause.
4. An expired or already-used link, which should land on the sign-in page with
   an error rather than a blank screen.

Check a received message on desktop and phone, in light and dark, with images
blocked, and look at the actual SPF, DKIM and DMARC results in the headers. A
browser preview proves none of that.

## DNS, as it stands

The root domain has SPF and DMARC at `p=none`. Google DKIM is still not enabled.
Neither blocks sending, both affect whether mail lands in the inbox, and the
only way to know is to look at a received header.

## What is deliberately not wired

No marketing send, no newsletter, no broadcast. The updates opt-in on the
contact form stays `pending` in the database and no code reads it. Consenting to
occasional updates is a different permission from being replied to, and the
acknowledgement says so in its own body.
