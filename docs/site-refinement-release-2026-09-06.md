# September 6 approved site refinement

Mehmet accepted the reviewed homepage, distinct service illustrations, company
About and professional Profile, requested correction of the dangling connector
in the software diagram, and explicitly approved pushing the reviewed site live.

## Payload

The 23 application/test/script files match local review branch
`codex/homepage-service-flow-sep6` at `5daaebc` exactly. They are integrated as a
site-only change on main, based on `a1654b7`. The branch remains intact: its
separate `brand/email/` previews and email test are deliberately NOT included in
this release. No email, signature, auth provider or mailbox operation occurs.

- Software & automation metadata and service ordering; accepted Connected flow
  hero, Solid Gate, five service routes and secondary Bitcoin desk retained.
- Five distinct, server-rendered diagrams: software layers, approval/exception
  branches, responsive journey, customer lifecycle and diagnosis/repair.
- Software connector fix: two short, card-relative gap connectors replace the
  continuous rail. Each stops at the adjacent edge, including inset mobile cards.
- Homepage portrait removed; portrait retained on professional Profile. About
  addresses buyers; Profile presents actual skills, work and a CV-request link,
  without application-process commentary. EN/TR/FR remain supported.
- Direct contact, truthful client/owned/private/unaudited labels, private MaydaOS
  and independent client portal access remain. No new offers, prices, metrics,
  outcomes, invitation, dependencies, schema or infrastructure changes.

## Pre-release verification

Lint, TypeScript/optimized build (102 generated pages) and 111 non-DB tests in
13 suites pass. The five excluded email-preview tests belong to the preserved
review branch, not a test failure. RLS integration is not run: database/auth are
unchanged. 89 optimized local smoke checks pass. Desktop/mobile before/after
captures confirm the connector correction; the browser script now checks its
actual endpoints rather than merely asserting a CSS selector exists.

`scripts/verify-conversion.mjs` covers 82 layouts, all five services plus home,
About and Profile; EN/TR/FR; 320/390/768/1024/1440 widths; normal/reduced motion;
JS-disabled diagrams; keyboard FAQs and real home → service → contact navigation.
No form is submitted. Final browser results, production source/deployment and
live verification are recorded in Abidin's companion release receipt.

## Boundaries

Approval is for this MaydaLabs Git push and its existing Vercel production build.
No SG/Abidin push, Monster sync, migration, environment or account change,
email/signature installation, message, social post/schedule, ad, investment
application or new spending commitment. Local-only email previews stay on the
review branch for the other task. This release does not declare the wider site
or commercial work complete, and does not claim a measured conversion increase.
