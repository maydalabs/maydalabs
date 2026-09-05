# Private beta — production release receipt

Mehmet explicitly approved applying the beta migration and deploying commit
`4c2b2ea8d68e6aeeb3e0efdfb55fbb6daea72d2a` to <https://maydalabs.com>.

- Migration `20260905024848_private_os_beta.sql` applied to the existing
  MaydaLabs production project after an exact one-migration dry run and a local
  schema snapshot. No seed, vault update, tester grant or data deletion.
- Approved source pushed to `main`. Final Vercel deployment
  `dpl_ALVAkeG4MnFm6kTNgJotkAMf6XBL` is READY at 2026-09-05 03:24:56 UTC,
  assigned to `maydalabs.com` and `www.maydalabs.com` with no alias error.
- The initial build correctly closed OS access but reused stale CSS. Browser
  inspection caught it; a no-cache rebuild of the SAME commit fixed it without
  another app change. Final build command: 49 seconds; Next.js 16.3.2/Node 24.x.
- All 60 production smoke checks pass, including 28 OS route variants,
  noindex, no OS navigation links and sitemap exclusion. The smoke harness now
  checks production's English canonical redirect before checking beta denial.
- Production read-only database-role assertions confirmed nonmember denial
  and existing-operator eligibility. No production OTP email/test account or
  paid generation was created. These checks are not a signed-in production
  browser walkthrough; local grant/revocation/portal E2E evidence is separate.
- `/os` and `/os/desk`: signed-out 404, private/no-store. `/portal` and
  `/internal/leads`: signed-out 307 to sign-in. Normal accounts do not qualify
  for MaydaOS just by signing up.
- Live desktop and 390×844 mobile styling match the approved source; no
  horizontal overflow and both mobile hero CTAs visible in the first screen.
  Browser errors: none observed. A bounded final-deployment error/fatal log
  query at 03:26 UTC returned no matching logs, not a continuous monitoring claim.
- Prior source verification: lint/build and 110 tests, including 35 LOCAL RLS
  integration tests. No quantified speed gain or exhaustive security claim.

Release docs and the smoke-harness correction are local follow-up artifacts,
not part of the deployed commit. No invitations, messages, posts, ads, paid
model calls, account creation, paid-plan changes or Monster transfer occurred.
The detailed canonical receipt and backup/advisor caveats live in Abidin's
`docs/maydalabs-private-beta-release-2026-09-05.md`; Mac remains the writer.

Do not revert to the public beta when fixing a release issue. Keep the
membership gate and restrictive policies. Wider beta access and atomic budget
reservation/idempotency are separate next steps, not enabled by this release.
