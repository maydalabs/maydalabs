# Monster local reconciliation — 9 September 2026

Completed bounded code review requested by Abidin Control Room. This is not a
deployment, migration, provider-configuration or commercial-action receipt.

## Exact Git state

- Canonical checkout: `/home/mehmet/Projects/maydalabs` on Monster WSL.
- Before: clean `main`, `f70c9baa7ac5e7334447b4f22e07f2208c60befb`.
- Fresh fetch confirmed `origin/main` at
  `fa3c3f93224d3f065f71b94a7ec46949e71f1be6`, the expected four commits:
  `ee62c05` portal/workflow budget, `7acc462` README, `7752ad6` enquiry mail,
  `fa3c3f9` auth-email kit. Incoming scope: 60 files, +2079/-1989 lines.
- A material defect selected the delegated review-branch path, not a clean
  fast-forward. Local `main` remains at the before head. The current checkout
  is `codex/review-monster-sep9`, based on the complete remote head.
- Local fix commit: `08e3e8a0d4e05fd7759f2a7601b962097e2ee4e5`.
  This receipt is committed after that fix. Neither commit is pushed.
- Historical `codex/homepage-service-flow-sep6` remains
  `5daaebc80332f8a2c431e2e5fef4d2be5869aadc`. Its merge-base-relative diff has
  37 paths, not 361 new files. `brand/email/`, `components/ServiceFlow.tsx`,
  `lib/serviceFlow.ts`, and `tests/serviceFlow.test.ts` are byte-identical to
  remote main. Its separate `tests/emailBrand.test.ts` is not on main. No blind
  merge, deletion, reset, or cherry-pick of that historical branch occurred.

## Review and owned fix

Incoming code removes the seven OS routes and desktop shell; gated work moves
to `/portal`, `/portal/work`, and `/portal/work/[id]`. Live membership checks
remain in `getOsBetaAccess`; run/history reads use the caller's scoped client,
and individual run reads additionally filter `user_id`. Operator workflow
editing checks operator status. No beta members were added.

The new monthly-spend query ignored its error and interpreted missing data as
zero. A database failure could therefore pass the budget gate before a paid
model call. The daily check had the same older failure mode. The fix rejects
either errored or missing result before source gathering or model invocation.
Four mocked regression cases failed on remote code and pass after the fix;
a positive empty-result test ensures legitimate zero usage still proceeds.
Owned code changes are only `app/actions/os.ts` and `tests/osActions.test.ts`.

Enquiry mail is server-only, stores the intake before attempting mail, escapes
user-controlled HTML, awaits two best-effort sends, and does nothing without a
Resend key. Tests use mocked fetch, not real email. Updates consent remains
separate. Auth template files are source assets, not installed provider state.

Public additions retain five services and no fixed prices; continuing operation
appears on automation and email services only. SG stays owned and editorially
independent; HodlStay remains client proof. No commercial records were advanced.

## Checks actually run on Monster

- `npm test -- --exclude tests/rls.integration.test.ts`: 142 passed, 15 files.
- `npm run lint`: passed.
- `npm run build`: passed, 87 static pages; built-in TypeScript passed.
- `npx --no-install tsc --noEmit`: passed.
- `SMOKE_BASE_URL=http://127.0.0.1:3194 npm run smoke:live`: passed, including
  28 retired OS paths and nine signed-out portal checks across locale prefixes.
  Telemetry warned that HodlStay and SG upstream checks were degraded; this
  is not independently established downtime and not a reason to alter SG here.
- Local browser: automation service content and optional operation section
  rendered, no captured warning/error logs, home-link navigation worked.
  `agent-browser` CLI was unavailable; the existing in-app browser was used.
- `git diff --check`: passed.
- Temporary loopback server was stopped after verification.

Only `.env.example` exists in this checkout; no local Supabase/email credentials
were installed. The review server explicitly disabled Supabase, Resend and
Anthropic configuration. Authenticated database-backed execution and real mail
delivery were not exercised. RLS tests were explicitly excluded: they create
users and execute SQL. Upstream claims of 36 passing database cases remain
upstream evidence, not a new Monster verification. No migrations or dry-runs ran.

## Remaining release/operation gates

1. `20260909090000_os_workflow_budget.sql` is the single incoming migration.
   It adds a constrained budget column and run index, without removing old
   credits or granting clients budget writes. Hosted application status was
   not queried or changed. Verify/apply it only with exact approval before a
   release that needs that column. A code-only build succeeds without a live
   database; the upstream note that a missing hosted column fails the build
   conflates type checking with runtime database schema readiness.
2. The budget remains a pre-check, not an atomic reservation. Concurrent calls
   can overspend; the upstream claim that the worst case is one extra run is
   not an enforced bound. Usage row fetching also lacks an explicit aggregate
   or pagination strategy. Do not call this a hard spending ceiling or expand
   paid execution until those limits are addressed and database-tested.
3. Existing no-JavaScript/pre-hydration intake timing can silently drop a real
   enquiry; the upstream characterization test makes it visible but does not
   fix it. Left outside this narrow integration patch.
4. `/portal/work` says every run but selects at most 200; “spent in total” is
   the returned subset. Work UI also suppresses the form when all owned
   workflows are exhausted even if a shared template may remain usable.
   These are follow-up UX/accounting limitations, not access grants.
5. Resend key, sender/notification settings, SMTP/template installation, DNS
   and actual delivery remain unverified remotely and approval-gated. The two
   upstream email docs disagree on project slug/environment setup; do not
   follow them as current provider evidence. No key or account was created.

Control Room must decide the local main promotion after this defect-path
receipt. No push, deployment, migration, model run, email, account change,
access grant, spend or commercial outreach occurred. Public read-only requests
and local tests were the only runtime checks. Abidin shared files, SG and the
Sazmining research/presentation were not edited by this review.
