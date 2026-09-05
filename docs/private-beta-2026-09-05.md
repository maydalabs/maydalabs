# Private MaydaOS beta — September 5, 2026

## Decision and release state

Mehmet asked to continue building privately: visitors must not engage with or
enter MaydaOS. This supersedes both the public September 4 product page and
the older footer-only public Lab. MaydaLabs remains the company and public
commercial website. Mehmet subsequently approved the exact migration and
`4c2b2ea` release on September 5. Both are now applied and verified in
production; no testers were added. See the
[production receipt](private-beta-release-2026-09-05.md) for evidence and limits.

## Access contract

- Every `/os` page, including localized roots, requires `getOsBetaAccess()`.
  Denied visitors receive the site's not-found page, not a tour or signup funnel.
- Public footer links and sitemap entries are removed. All OS pages are noindex.
  These discovery controls supplement access enforcement; they do not replace it.
- `internal.os_beta_members` holds explicit user-ID grants. Existing
  `internal.operators` members also qualify. No existing account, historical
  credit, email allowlist or user-editable metadata automatically grants access.
- `public.os_beta_status` is a security-invoker, read-only membership view.
  The route/action check and restrictive RLS policies on `os_workflows`,
  `os_runs`, and `os_credits` consult the same live membership. Missing schema or
  failed lookup denies access. Owners retain only their existing column grants.
- Run, decision and outcome actions verify membership before doing any work.
  Revocation takes effect on subsequent requests without refreshing the JWT;
  it cannot recall information already viewed or cancel an in-flight model call.
- `/portal` and `/portal/pilots/[id]` are independent client surfaces. Ordinary
  sign-in and fallback confirmation land in `/portal`. Saved maps, briefs,
  preferences, published pilot reports/proposals and invoices remain available
  under their existing identity/ownership rules, without requiring beta access.
- MaydaOS remains implemented. This does not replace its working apps with mock
  screens, erase runs/workflows, or enable any new external action.

## Deployment procedure — approved and completed for this release

The September 5 approval applies only to this migration/application revision.
Future releases and tester grants still require their own scoped authority.

1. Verify the exact production Supabase project, backup posture, current heads,
   and the intended operator's existing membership. No production grant was
   inferred or created locally.
2. Apply only `20260905024848_private_os_beta.sql` to that approved project.
   It seeds no members and deletes no existing beta data. Database access for
   ordinary users is restricted immediately; the old public page still exists
   until the application release follows.
3. Release this verified application revision. Missing migration is fail-closed,
   but migration first preserves authorized operator access during release.
4. Verify production anonymous and ordinary-account denial, operator success,
   customer portal continuity, no public links/sitemap entries, and noindex.
5. Do not automatically import the retired `MAYDAOS_ALLOWLIST`. If Mehmet later
   names a tester, resolve the exact existing auth user ID and make a deliberate
   membership grant. No public enrollment or invitation emails are built here.

Do not restore public access as a rollback shortcut. Keep the restrictive
policies and fix forward, or use a reviewed private maintenance page.

## Verification

- `npm test`: 110 tests across 8 files passed, including 35 RLS integration
  cases against the running local Supabase stack, not skipped.
- New tests cover signed-out/nonmember denial, membership lookup failure,
  member/operator admission, self-asserted role denial, no paid call on denied
  actions, ownership, live revocation, and direct API access to historical data.
- `npm run lint`, `npm run build`, `git diff --check`: pass.
- Local optimized build smoke pass: all public routes, redirects, metadata,
  sitemap and 28 localized OS paths checked without beta content leakage.
- Browser: confirmation → ordinary portal; explicit local test grant → Desk;
  grant revoked → not-found with the same session; portal profile save still
  works and the stored row was checked. Local test identity/data removed after
  sign-out. No remote email or model call was made.

## Known follow-on work

The current run pipeline checks credits and daily spend before generation and
spends the credit afterward. That is not a strict concurrent reservation of the
model budget. Do not describe the daily ceiling as a hard worst-case cap or
broaden testing before atomic reservations/idempotency and failure accounting
are addressed. This pass restricts access; it is not an exhaustive security
audit or a production-readiness certification.
