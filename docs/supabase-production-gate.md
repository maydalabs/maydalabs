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

3. **Push the schema** — applies exactly the four migrations in
   `supabase/migrations/` and verifies the tables, policies, and view:
   ```bash
   npx supabase db push
   ```
   Then a read-only check: `npx supabase migration list`.
3. **Auth settings in the dashboard:** Authentication → URL configuration:
   Site URL `https://maydalabs.com` (no trailing slash — the email template
   builds its fallback link from it), redirect URLs `https://maydalabs.com/**`.
   Authentication → Emails → Templates: paste `supabase/templates/magic_link.html`
   into **both** *Confirm sign up* and *Magic Link*, subject
   `Your MaydaLabs sign-in code`. (Hosted projects have "Confirm email" on, so
   a first-time sign-in uses the *Confirm sign up* template and a returning
   sign-in uses *Magic Link*; `/auth/confirm` accepts the token hash of
   either because it verifies with `type=email`.) Templates stay locked
   until custom SMTP is on — do step 4 first. **Code length:** the hosted
   project sends 8-digit codes by default (Authentication → Sign In /
   Providers → Email → *Email OTP Length*); the local stack uses 6. Since
   3 Sep the app accepts 6–10 digits and no copy says "six-digit", so
   either length works — keep the dashboard template wording
   length-neutral ("Your sign-in code:"). SMTP went live 3 Sep 2026 via
   the Resend wizard (sender auth@maydalabs.com); first real code was
   delivered to info@maydalabs.com at 01:18.
4. **SMTP via Resend — the Supabase integration wizard** (Resend →
   Settings → Integrations → Supabase). Supabase's built-in sender is
   limited to a few emails per hour and is not for production. Facts
   checked 3 Sep 2026: Resend's Free plan allows 3 domains, 3,000
   emails/month, 100/day; creating a second team asked for a paid plan,
   so MaydaLabs auth mail goes through the team on Mehmet's personal
   Resend login, renamed **MaydaLabs** (satoshigazette.org stays on its
   own team — auth mail must never come from the publication's domain).
   The wizard has four steps and was started 2 Sep (project `maydalabs`
   chosen):
   1. **Link domain** — Name `maydalabs.com` (root; same pattern as SG.
      Resend's own deliverability guide prefers a dedicated subdomain such
      as `auth.maydalabs.com`; at pilot volumes the root is fine and gives
      `auth@maydalabs.com` as the sender). Advanced options → Region
      **eu-west-1** (same region as the Supabase project; fixed at
      creation). Add domain.
   2. **DNS** — maydalabs.com's DNS is at Namecheap
      (`dns1/dns2.registrar-servers.com`), not Vercel, so the records are
      added by hand under Advanced DNS → Host Records (never the Mail
      Settings/MX section, which is Google's). Done 3 Sep 2026, domain
      **Verified** in Resend (region eu-west-1). Resend's current setup is
      CNAME-based; Namecheap wants the host *without* the domain:
      - TXT, host `resend._domainkey`, value `p=…` (copied from Resend)
      - CNAME, host `rsend`, value `rsend-euw1.forge.rmta.net`
      - CNAME, host `send`, value `send.forge.rmta.net`
      - TXT, host `_dmarc`, value `v=DMARC1; p=none; rua=mailto:info@maydalabs.com`
      - TXT, host `@`, value `v=spf1 include:_spf.google.com ~all`
      The last two are mail hygiene for the root (it had no SPF and no
      DMARC before 3 Sep, which hurts outreach sent from
      info@maydalabs.com); still open on the Google side: DKIM (Google
      Admin → Apps → Gmail → Authenticate email → add the TXT at
      `google._domainkey`). In Resend, **Enable Receiving stays off** — it
      would demand an MX on the root that conflicts with Google Workspace.
      On the domain page keep **click tracking and open tracking off**
      (tracking rewrites auth links and breaks them).
   3. **Add an API key** — the wizard creates it (sending access). If it
      instead asks you to create one: name `Supabase auth SMTP`, permission
      *Sending access*, domain `maydalabs.com`.
   4. **Configure SMTP** — Sender email `auth@maydalabs.com`, Sender name
      `MaydaLabs`. Resend writes the SMTP settings into the Supabase
      project through the access it was granted (that is what the wizard's
      "Revoke access" undoes). Confirm afterwards in Supabase →
      Authentication → Emails → SMTP Settings: enabled, host
      `smtp.resend.com`, port `465`, username `resend`. If the wizard
      shows the credentials instead of writing them, paste exactly those
      values there. Authentication → Rate Limits: 30 emails/hour is plenty.
   Then step 3 (templates + URL configuration), then the first sign-in and
   the operator insert in step 6. Until SMTP is on, sign-in codes will not
   reliably arrive.
   *Resend's Vercel integration is not needed:* it auto-adds DNS only when
   Vercel hosts the DNS (ours is Namecheap) or provisions a new Resend
   account from the Vercel Marketplace (we have one). The site sends no
   email of its own yet; when notifications ship, a sending-only key goes
   into Vercel as `RESEND_API_KEY` by hand.
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
