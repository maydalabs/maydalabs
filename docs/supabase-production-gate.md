# Supabase — from local stack to production

_Status: runbook, 2 September 2026. Every step below that touches an
external account, money, or a remote project is Mehmet's action._

## Where the database is today

- **Remote project exists: `maydalabs`** (ref `ltmypxcyzcxmzedgmakh`,
  West EU / eu-west-1, Free plan under the Vercel-Marketplace-managed
  MaydaLabs org). Created by Mehmet on 2 Sep 2026; the three migrations
  were pushed the same day with `npx supabase db push` and verified with
  `npx supabase migration list` (local == remote).
- **Local stack still works** for development and tests: `npx supabase
  start` runs the full stack in Docker with keys in `.env.local`.
- **Schema is code.** `supabase/migrations/` holds the three versioned
  migrations: core tables, RLS + grants, and the operator-status view.
  `lib/supabase/database.types.ts` is generated from them.
- **Note on the CLI:** current versions link without asking for the
  database password — `db push` authenticates through the CLI login
  role, so the password is only needed for direct `psql` connections.
- **The deployed site degrades on purpose.** Without the env vars, every
  marketing page works, `/start` still computes the map, and the account /
  intake surfaces fail closed with a visible error instead of a 500.
  The contact form will report "sending failed" until the project exists —
  so until then, the mailto and Calendly paths are the real intake.

## What the tables do

| Table | Purpose |
| --- | --- |
| `profiles` | Optional display name, company, role, locale per account |
| `multiplier_maps` | Saved diagnostic results (answers + result JSON + rubric version); anonymous rows hold only a hashed claim token |
| `lead_intakes` | Intake buffer for briefs — consent timestamps, map link, review status, manual Abidin transfer fields. **Not a CRM; Abidin stays canonical.** |
| `subscriptions` | Free email-updates preference; stays `pending` until a mail provider exists |
| `internal.operators` | Who may open `/internal/leads` (not API-exposed; surfaced via the `operator_status` view) |

## Going live — in order

The MaydaLabs Supabase org is billed through the **Vercel Marketplace**
(Free plan, one existing project `satoshi-gazette` in `eu-west-1`). The
Free plan allows two active projects, so MaydaLabs gets its own — do not
share SG's database.

**Mehmet (credentials involved — Claude never enters these):**

1. **Create the project**: Supabase dashboard → New project → name
   `maydalabs`, region `eu-west-1` (same as SG), *Generate password* and
   store it in your password manager. Wait for it to finish provisioning.
2. **Authenticate the CLI once, in your own terminal**:
   ```bash
   npx supabase login
   ```
   ```bash
   npx supabase link --project-ref <project-ref>
   ```
   (`link` asks for the database password from step 1 and stores it in the
   OS keychain, so later pushes don't prompt.)

**Claude, after that (no credentials handled):**

3. **Push the schema** — applies exactly the three migrations in
   `supabase/migrations/` and verifies the tables, policies, and view:
   ```bash
   npx supabase db push
   ```
   Then a read-only check: `npx supabase migration list`.
3. **Auth settings in the dashboard:** Authentication → URL configuration:
   Site URL `https://maydalabs.com`, redirect URLs
   `https://maydalabs.com/**`. Authentication → Email templates → *Magic
   Link*: paste `supabase/templates/magic_link.html` (six-digit code first,
   confirm link as fallback).
4. **SMTP via Resend** (Authentication → Emails → SMTP Settings). Supabase's
   built-in sender is limited to a few emails per hour and is not for
   production; the dashboard also refuses to edit email templates until
   custom SMTP is enabled. Mehmet already runs Resend for Satoshi Gazette
   (team `satoshigazette`, verified domain `satoshigazette.org`, a
   sending-only key named "Supabase auth SMTP" used by SG's project). For
   MaydaLabs, keep the brands separate — auth email must come from
   maydalabs.com, never from the publication's domain:
   1. Resend → team switcher → **Create team** `maydalabs` (each team has
      its own free tier: 3,000 emails/month, one verified domain).
   2. Domains → Add domain `maydalabs.com` (or the subdomain
      `mail.maydalabs.com` to keep the root domain's mail untouched) → add
      the DNS records Resend shows (DKIM TXT, SPF/MX for the sending
      subdomain, optional DMARC) where maydalabs.com's DNS lives → wait for
      **Verified**.
   3. API keys → Create API key `Supabase auth SMTP`, permission
      **Sending access** only, domain restricted to maydalabs.com. Copy it
      once.
   4. Supabase → Authentication → Emails → SMTP Settings → Enable custom
      SMTP: Sender email `auth@maydalabs.com` (or `no-reply@…`), Sender
      name `MaydaLabs`, Host `smtp.resend.com`, Port `465`, Username
      `resend`, Password = the API key. Save. (Supabase's rate-limit
      settings for email can then be raised under Authentication → Rate
      Limits; 30/hour is plenty for pilots.)
   5. Now the **Templates** tab becomes editable: paste
      `supabase/templates/magic_link.html` into *Magic link or OTP*, subject
      `Your MaydaLabs sign-in code`. Do the same for *Confirm sign up*.
   Until this is done, sign-in codes will not reliably arrive.
5. **Env vars on Vercel** — two options:
   - *Marketplace integration (fewest clicks):* Vercel → Integrations →
     Supabase → connect the `maydalabs` Supabase project to the
     `mayda-labs` Vercel project. It injects `SUPABASE_URL`,
     `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SECRET_KEY`, and the
     `POSTGRES_*` connection strings. **The app accepts every one of these
     names as fallbacks** (all Supabase access is server-side), so nothing
     else is needed. In the connect dialog: leave the variable prefix
     empty, leave both "Supabase Preview Branch" boxes unchecked, turn
     "Sensitive" on.
   - *Manual:* Project → Settings → Environment Variables:
     `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     (`sb_publishable_…`), `SUPABASE_SECRET_KEY` (`sb_secret_…`, server
     only — never `NEXT_PUBLIC_`).
   Redeploy after saving.
6. **Make yourself an operator** (SQL editor, once, with your auth user id
   after your first sign-in):
   ```sql
   insert into internal.operators (user_id, label)
   values ('<your-auth-user-id>', 'Mehmet');
   ```
7. **Abuse protection** (Authentication → Attack protection): enable
   CAPTCHA (hCaptcha or Turnstile) once you have an account there; the app
   currently relies on honeypot + fill-time + per-instance rate limits,
   which is documented as a pilot-grade control, not a production one.
8. **Verify with the smoke script against production:**
   ```bash
   npm run smoke:live
   ```

## Local reset / re-run tests any time

```bash
npx supabase start
npx supabase db reset      # replays the migrations from scratch
npm test                   # 39 tests incl. the 12 RLS positive/negative cases
```
