# MaydaOS: what it is now — 9 September 2026

Local implementation record. Not a deployment receipt and not remote-migration
approval. Production remains source `f70c9ba` until Mehmet approves a release.

## The decision

Mehmet kept MaydaOS and cut the noise around it. MaydaOS is **how MaydaLabs
delivers and runs work for a client**, not a separate product with its own
address, and not a public beta. Abidin stays the private control plane.

Four decisions, all his, taken on 9 September:

1. **Keep the name, internally.** MaydaOS names the work screen inside a
   client's own portal and the operator surface at `/internal/os`. It is not a
   public destination, a product for sale, or a second brand.
2. **Collapse the shell.** The dock, system bar, window chrome, status bar and
   Terminal app are gone. The five apps became sections of `/portal`.
3. **Credits become a per-workflow monthly budget**, set by the operator,
   because running a workflow for a paying client needs that anyway.
4. **Freeze rule: no client, no feature.** MaydaOS gets no further capability
   until a paying client's workflow needs it.

The reason for all four: the underlying idea survived every repositioning this
month, and it is what makes MaydaLabs more than a studio. The *packaging*
around it — a desktop metaphor, a credit meter, a beta funnel — was built for a
public product that has no users and is not being sold. A studio sells hours; a
lab builds things and runs them. Continuing operation is the recurring revenue a
studio does not have, and Satoshi Gazette is the public proof of the method.

## What changed in the code

**Deleted.** All seven `/os` routes, `OsShell.tsx`, its 998-line stylesheet,
`OsTerminal.tsx`, `osExample.ts`, `GrantCreditsForm.tsx`, `SiteChrome.tsx`, the
`.mayda-os-live` / `.mayda-os-meter` / `.mayda-os-preview` CSS, and
`public/os/desk-preview.jpg`. Every `/os` path now returns 404 for everyone,
signed in or not, because the routes no longer exist. That is stronger than the
5 September membership gate, and it replaces it rather than relaxing it.

**Moved.** Desk and Record became `components/WorkContent.tsx` (work waiting for
a decision, the run form, recent work) rendered at the top of `/portal`, plus
`/portal/work` for the full history and `/portal/work/[id]` for one run. Pilot
and Account were already portal content. The site header and footer are back on
every page: the portal is a client page, not an operating system, so it no
longer hides the chrome.

The work section renders **nothing at all** for a signed-in person without
MaydaOS access, so the portal is unchanged for every ordinary client. Access is
still `getOsBetaAccess()` against live database membership, and still fails
closed.

**Budget.** Migration `20260909090000_os_workflow_budget.sql` adds
`os_workflows.monthly_budget_usd` (default $5, range 0–10000) and an index on
`os_runs (workflow_id, created_at)`. A run is refused when the workflow's runs
this calendar month already cost its budget. The global daily ceiling
(`MAYDAOS_DAILY_USD_CAP`, default $2) still stands behind it. Zero pauses a
workflow without deactivating it.

The month's spend is the sum of `os_runs.cost_usd`, so there is no second
number to keep in step with the first — the atomic `os_spend_credit()` counter
is no longer needed and no longer called.

`public.os_credits` and `os_spend_credit()` are retired **in code only**. They
are deliberately not dropped: dropping is a one-way door and those rows are the
only record of the beta's spend. Their row-level security tests still run,
because the table still exists and must still not be self-serve. A later
migration can drop them once Mehmet says the history is not wanted.

**Client-facing budget display is deliberately partial.** A budget line is shown
only for a workflow installed for that person. A shared template is run by other
people too and row-level security rightly hides their runs, so the viewer's own
total would understate it. Enforcement uses the admin client and is always
correct; the display would not be, so it is omitted rather than shown wrong.

## What changed on the public site

`/services/ai-and-automation` and `/services/email-and-customer-journeys` each
gained one section: *Or we can keep running it with you.* Optional, month to
month, scope and price agreed before it starts, and the work stays the client's
either way. EN/TR/FR.

No price, no duration, no availability, no metric, and no new service. It is
absent from the other three services, because MaydaLabs cannot truthfully offer
to keep operating a website, a one-off build or a repair in the same way. The
smoke suite asserts both facts: the section is present on exactly those two
pages and contains no currency figure.

## Verification

- `npm run lint`, `npm run build` (87 static pages), `npx tsc --noEmit`: pass.
- `npm test`: **153 tests in 14 files**, including **36 row-level security
  integration cases** against a real local Supabase stack. Not skipped.
- New database test proves an operator **can** set a workflow's monthly budget
  and the client it is installed for **cannot** raise it. The positive half is
  deliberate: on 4 September an RLS test passed for the wrong reason because it
  only proved a client could not write, while in fact nobody could.
- `SMOKE_BASE_URL=http://localhost:3110 npm run smoke:live`: **98 checks pass**,
  including 28 `/os` paths returning 404 across four locale prefixes, `/portal`,
  `/portal/work` and a run URL closed to a signed-out visitor, and the sitemap
  excluding every signed-in route.
- Browser at 390 and 1440 CSS pixels: the new service section is two columns on
  desktop and one on mobile, no horizontal overflow, and its note is the dimmer
  secondary colour. A first attempt set the note colour with a selector that
  `.svc-run p` outranked; caught in the browser, fixed, re-checked.
- The generated database types were regenerated from the local stack. The diff
  is purely additive: the new column, plus the `company_prospects` table whose
  own 5 September migration never had its types regenerated.

## Deliberately not done

No new capability, per the freeze rule. The inputs-from-real-systems step
(inbox, drive, support queue, repo) needs OAuth and credentials and stays
unbuilt until a paying client pulls it. No builder, no teams or roles, no
revision-of-a-draft flow, no one-click top-ups. Concurrent budget reservation
is still not atomic: the spend is checked before a run and recorded after, so
two runs starting at the same instant can both pass a nearly-spent budget. The
worst case is one extra run, roughly nine cents, and it must be fixed before
more than one client shares a workflow.

## Still Mehmet's to do

1. Apply `20260909090000_os_workflow_budget.sql` to the production project
   (`ltmypxcyzcxmzedgmakh`). SQL on the remote is his.
2. Push and deploy, **after** the migration: the code selects the new column,
   and a query missing it fails the build by design.
3. Set the budget on any workflow he wants running, at `/internal/os`. Existing
   rows take the $5 default.
