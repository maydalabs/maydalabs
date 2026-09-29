# MaydaOS S1e — signed-in local walkthrough and honest baseline

23 September 2026, Europe/Istanbul. Continuation after the usage interruption.
Local, uncommitted engineering evidence; not a release or founder-readiness claim.

## Outcome

The review-first desk now has an authenticated browser → API → disposable
database walkthrough. Reviewed drafts and company knowledge survive refresh;
lost save responses recover the original record without another copy. An
interrupted question can be explicitly closed without silently regenerating it.
Saving work still means **draft**, not approval, sending, scheduling or completion.

The separate frozen local-model baseline is **not accepted**. All sixteen
attempts completed, but transcript review found substantive defects in fifteen.
The storage/control result and the judgment result must not be conflated.
Fine-tuning remains deferred.

## Integration changes exposed by the walkthrough

- Generated Supabase database types include the prepared review schema. The
  store now uses typed RPCs and validated/narrowed JSON rather than a temporary
  new-schema cast. No production migration or table-wide write grant was added.
- Saved work/knowledge refreshes the server-rendered desk, so the corresponding
  pane updates without a full page reload. This uses router refresh, not a
  broadcast/event protocol.
- Work documents display the captured founder source, excerpt and reviewed
  revision. Attribution and human confirmation do not imply verified truth.
- Monotonic reconciliation tickets reject late reads/errors; mutation locks
  prevent sibling-card saves while an outcome is unknown. Editing/dismissal
  and recovery retain the explicit review boundary.
- Question requests carry expected actor/company identity, including retries.
  The server verifies these preconditions against authenticated context before
  model use or a writer; mismatch returns 409. Client IDs are not authority.
  The mounted desk also fails closed on changed server actor/company context.
- The local-model adapter now preserves stop/length/unknown completion reasons,
  rejects malformed or post-completion data, and releases the stream reader.
- A real expired-session render exposed an existing proxy problem: refreshed
  cookies were sent to the browser but not the current downstream render. The
  proxy now updates request cookies before constructing the locale response,
  preserves all refresh cookie batches/options, and retains SDK cache headers.
  Fourteen focused regressions pass (nine failed against the old proxy).

The exact multi-hour browser-expiry reproduction **was not rerun after the
proxy fix**. Final local smoke passed; request propagation is tested directly.
The signed-in recovery checks above are separate evidence, not an exact
post-fix expiry replay. `currentCompany` still treats a query error like absent
company data; error-specific recovery is a remaining usability limitation.

## Real local environment, explicitly synthetic business records

The isolated Supabase project was `maydaos-e2e-20260922`, separate from the
existing shared local stack. Prepared migrations were applied only there.
Next ran on 3199, the API on 54461, DB on 54462 and Mailpit on 54464. A
loopback-only fault transport on 54471/control 3201 interrupted selected DB
requests/responses while the browser retained the real Next origin.

OTP went only to local Mailpit. The fictional account
`founder@maydaos-test.example.invalid` signed in and created Cedar Demo through
the real UI. No production account, mailbox, model key or company record was used.

An exploratory local-model attempt incorrectly cited a company description as
the current founder's message. Source binding rejected it; the model then
emitted literal tool-call text. No proposal/work/memory was created. This was
before the adapter completion-reason fix, is retained as a failure, and is not
one of the sixteen frozen baseline cases.

For deterministic transport testing, six explicitly labeled synthetic proposals
were staged through real review RPCs. They are **not model-quality evidence**.

| Walkthrough | Observed result |
|---|---|
| Edit a proposed draft | New review revision only; no Work record until Save |
| Save to Work | One drafted record, immediate pane refresh, source preserved |
| Response lost after commit | SQL proved one record; controls froze; readback recovered the original ID |
| Request lost before storage | SQL proved no record; refresh showed unsaved; deliberate retry made one draft |
| Confirm company knowledge | Separate unchecked confirmation; source/scope/duration and model authorship retained |
| Reload | Saved work/knowledge and saved/dismissed receipts retained |
| Question lost before begin | No turn; exact tab-local retry identity survived refresh |
| Begin response lost after commit | One running turn; no model generation started after the lost receipt |
| Close interrupted answer after usage gap | Same turn marked failed with an honest interruption receipt; composer unlocked |
| Post-fix lost save response | Original draft recovered again; sibling save disabled until reconciliation |
| Dismiss another proposal | Dismissal retained; no Work/knowledge created |
| Sign out and request `/os` | Returned to public site; direct private route redirected to sign-in |

During the usage gap the preview/proxy stopped, while the disposable DB and
finished baseline persisted. The old browser tab was gone: its session-storage
hint is not claimed to survive an app/tool restart. Durable records did survive.
The resumed first expired-session render showed the email but “No company yet”;
the next reload showed the existing company and records. That failure drove
the proxy fix above and is not silently counted as a successful first render.

Earlier 375×812 checks showed no horizontal document overflow and readable
controls/source text. TR/FR receipts were spot-checked, not model-evaluated.
Minor existing top-bar Leave-edge clipping remains outside this slice. The
final desk error/warning capture was empty. Screenshots were inspected in-session,
not exported as a standalone visual evidence bundle.

Harness failures retained: an early proxy-origin layout correctly received a
Next 403 and was replaced with a DB-transport proxy; a Docker email-template
mount pointed at a directory before correction; a pre-hydration fill did not
update React state and was redone with keyboard input. No production origin or
security check was weakened to make these tests pass.

## Final verification

- `npm test -- --exclude tests/rls.integration.test.ts`: **1,028 passed**, two
  intentionally skipped local-model tests. The broad RLS suite remains excluded
  because its cleanup is unsafe for valued local data.
- Real isolated PostgreSQL/RLS suite `tests/sql/os-review-durable.sql`: **70
  assertions passed**, transactional fixtures rolled back. The earlier S1d
  21 cross-session assertions remain earlier evidence, not a fresh rerun here.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`: pass; 90 static pages
  plus dynamic routes. Nonblocking test-runner module-format warnings remain.
- `SMOKE_BASE_URL=http://localhost:3199 npm run smoke:live`: all checks pass,
  including public-entry closure, routes, locales, metadata and sitemap.
  The script's “Production smoke” label does **not** make this a hosted check.
- Nine relevant runtime files in the isolated copy matched the working tree
  before the final smoke pass, including the session proxy fix.
- `git diff --check`: clean at the engineering verification pass; repeated
  after the final documentation update.

No production deployment, SQL, hosted auth/worker check or real-customer test
was performed. Recovery evidence is finite, not a claim that every interruption
or browser/session combination has been tested.

## Frozen local-model baseline: completed, not passed

See `maydaos-proposal-baseline-results-2026-09-22.md` for every attempt and
review limit. Existing Ollama 0.34.2 / qwen3:14b ran serially, without new
weights or paid inference. Six historical questions ran twice plus four separate
wording cases: 16 attempts, zero runner errors/timeouts, 13/13 source hashes
rechecked. Completion: 2026-09-22T18:45:49.676Z. No in-run tuning occurred.

Five attempts passed the narrow structural screen. Transcript review found
substantive defects in fifteen of sixteen; owner acceptance is still pending.
Seven exhausted tool rounds without model-written answer prose (only the
trusted receipt followed). The model still confuses an
advice/request-to-send conversation with permission to create work/knowledge,
adds unsupported terms, and does not reliably explain Save versus Send. Median
attempt time was about four minutes. These are diagnostic observations, not
a general performance percentage or a trend against the old 5/6 score.

Nine Work proposals existed in memory; no knowledge proposal survived. No DB
writer, human confirmation, external action or production provider ran. A review
correction is retained: Hamburg was supplied context, not an invented location.

Next bounded slice: distinguish advice, requested drafts, durable knowledge and
requests to act; make Save-versus-Send language truthful. Write independent
positive/negative intent regressions before changing the candidate. Address
knowledge-schema/duration handling separately, preserve all failed attempts,
then run a fresh frozen evaluation. Do not tune to benchmark place names or
start fine-tuning, new founder features or public access yet.

## Durable evidence and cleanup

Abidin's Git-ignored folders, requiring a separate future authorized transfer:

1. `output/mayda/maydaos-e2e-2026-09-22/`: verification narrative, scoped
   synthetic snapshots, SQL fixtures, harness scripts/config and selected-file
   SHA-256 manifest. Final snapshot:
   `synthetic-company-snapshot-20260923T002204134Z.json` — four turns, eight
   messages, six proposals, seven revisions, four drafted Work records, four
   events, one knowledge record, zero approvals. No auth rows/credentials.
2. `output/mayda/maydaos-baselines/maydaos-proposal-baseline-BtoPyJ/`: original
   manifest, report, events and review sheet; originals unchanged. These are
   outside the current runtime-bundle allowlist as well as Git.

Owned resumed preview/fault-proxy processes and their isolated Supabase project
were stopped. Disposable volumes were retained, not promoted to canonical data;
temporary auth credentials are not handoff material. Existing shared Supabase,
Ollama and Abidin observer processes were not stopped. The owned browser tab
was closed after sign-out.

No staging, commit, push, fetch, pull, merge, deployment, fine-tuning, message,
email, schedule, paid inference, public-beta enablement or commercial/runtime
record change. Mac remains the writer. Prior dirty work and other-lane changes
are preserved. Closing local-ref heads: Abidin main `a68a323`, MaydaLabs main
`404ad40`, SG main `9c1e5d5`; no network refresh was used.

Canonical continuation receipt:
`/Users/mehmeteminmayda/Projects/abidin/docs/maydaos-s1e-local-walkthrough-2026-09-23.md`.
