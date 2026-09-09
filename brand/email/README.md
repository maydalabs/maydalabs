# MaydaLabs email identity — review kit

Prepared September 6, 2026. Local previews only. No signature installed, hosted
template updated, provider/DNS setting changed or email sent.

Run `node brand/email/build.mjs` to regenerate the eight HTML/text assets.
Open `preview/sign-in.html`, `preview/confirmation.html` and
`preview/signatures.html` locally. Preview codes and buttons do not authenticate.
`templates/` contains the proposed Supabase payloads, not active configuration.
The existing local `supabase/templates/magic_link.html` is intentionally untouched.

## Design and compatibility

Solid Gate uses the existing public 21 KB PNG, at 48 × 48 CSS pixels. No new asset
deployment is required. Tables and inline styles provide the baseline; system
fonts, a plain-text signature and visible code/contact details work without images.
Auth emails have a restrained dark header and readable light/dark content. No
tracking pixel, remote font, marketing, guaranteed expiry, public MaydaOS invitation
or claim of automatic operational access is included. Ten-digit codes are supported
by the app; check this longer value at narrow widths as well as six-digit previews.

Browser previews are not proof of received Gmail/Outlook rendering or deliverability.
Before rollout, check actual received desktop/mobile light/dark messages, blocked
images, long codes, links and authentication headers with an approved recipient.

## Gmail — after approving the signature

In Settings → See all settings → General → Signature, create `MaydaLabs — New`
and `MaydaLabs — Reply`. Copy the **rendered** content of `signature-new.html`
and `signature-reply.html`, not the source code. Select **info@maydalabs.com**
in the signature defaults/send-as selector. Assign New for new messages and Reply
for replies/forwards, then save. Confirm the From address in an unsent draft.
If info@ is missing, stop and identify whether it is a mailbox or send-as alias;
do not create a new mailbox or change forwarding as a workaround. Google supports
different signatures for different send-as addresses.
[Gmail instructions](https://support.google.com/mail/answer/8395?hl=en)

## Outlook — after approving the signature

On Mac, open Outlook → Settings → Signatures, create the same two named signatures
from rendered content and select the **info@maydalabs.com** account. Set New messages
and Replies/forwards separately. If using Outlook on the web/new Outlook instead,
use its signature settings and select the exact sending account. Check an unsent
draft in each client; do not assume a signature copied in Gmail installs in Outlook.
Use `signature.txt` if rich formatting is unavailable. Mobile signatures must be
checked separately before relying on desktop defaults.
[Outlook Mac instructions](https://support.microsoft.com/en-gb/office/create-and-insert-a-signature-in-outlook-for-mac-f4d21492-0956-4429-95ad-2769745b539c)

## Auth rollout gates — do not apply these files yet

1. Read back the exact MaydaLabs project's current hosted magic-link/confirmation
   HTML and sender/SMTP configuration without exposing credentials. Record the
   previous templates for rollback. Claude previously reported Resend SMTP;
   that is historical evidence, not a fresh delivery/configuration verification.
2. Both proposed templates preserve `{{ .Token }}`, `{{ .TokenHash }}` and
   `{{ .SiteURL }}/auth/confirm?...&type=email`. The existing handler accepts
   **email only**, not a new `signup` query value. No authentication logic changes
   belong in this visual rollout. Current local confirmations are disabled, so
   the new-user template is not demonstrated by the local stack alone.
3. Agree the exact sender name/address and reply-to from the existing verified
   configuration; the info@ signature is not an SMTP identity configuration.
4. Get approval for exact hosted payloads and test recipient, then separately test
   returning-user OTP/link, first-account OTP/link and invalid/expired links.
   Ordinary sign-in must not grant private MaydaOS access. Check image reachability
   and received SPF/DKIM/DMARC results; do not infer them from a visual preview.

Supabase separates local template configuration from hosted template updates.
[Template documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
Free projects created from June 3, 2026 cannot customize templates on the default
SMTP service; custom SMTP can support customization. Inspect this project's actual
configuration rather than switching providers or assuming its tier/date.
[Supabase change notice](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier)
