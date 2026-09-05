# Private company prospect registry

Mehmet explicitly approved private company-registry storage on 2026-09-05,
including business descriptions and company types. Direct Supabase execution
succeeded; no SQL Editor migration needs to be run by the owner.

- Project: `ltmypxcyzcxmzedgmakh` (MaydaLabs, eu-west-1).
- Table: `public.company_prospects`, table OID 18037.
- Applied migration: `20260905115420_company_prospects_registry.sql`.
- 500 rows imported, 500 complete typed payloads verified against the canonical
  snapshot. 381 descriptions (66 primary-backed / 315 directory summaries to
  verify), 119 unknown; 222 unqualified research leads / 278 catalogue holds.
- All remain unqualified, buyer need unknown, outreach unauthorized. This is
  neither an exhaustive census nor 500 verified active companies.
- RLS enabled/forced: existing operator read 500; nonoperator read 0. Only
  authenticated SELECT is granted, constrained by `internal.operators`.
  No anon/service-role access or API writes; no auth/membership changes.
- Existing enquiry/client/MaydaOS table counts unchanged. No automatic sync,
  client-facing page, outreach, application action, push or deployment.

Mac Abidin is canonical. Full evidence, source links, read-only inspection SQL,
import receipt and exact profile payload are under the sibling Abidin repository:
`output/mayda/bitcoin-company-supabase-receipt-2026-09-05.md`, matching receipt JSON,
and `bitcoin-company-profiles-2026-09-05.json`. DEC-2026-09-05-15 records authority.
The original catalogue and 222 supported-action lead intake records are preserved.
Do not turn this table into inbound `lead_intakes`, clients or consent, overwrite
manual decisions, or reapply the already-hosted migration.

Supabase security advisors report no new registry warning. Three pre-existing
warnings remain: anon and authenticated execution of `public.rls_auto_enable()`
and disabled leaked-password protection. They were recorded, not remediated:
[anon execution guidance](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[authenticated execution guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[password-protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

This database task changed no app code. Concurrent Connected flow implementation
and its production-release approval boundary remain owned by their original task.
