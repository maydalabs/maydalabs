# Connected flow — selected direction and local motion prototype

Later implementation: Mehmet explicitly requested app integration. See
`connected-flow-implementation-2026-09-05.md` for the current local app and
verification. The prototype-only state below is historical, not the latest
implementation state. No new release approval.

Mehmet chose A with "go with A" after comparing A — Connected flow and
B — Project chapters. This advances gate 2 of the design-direction brief:
refine one direction in an isolated review surface, without changing the app.

Later September 5 acceptance: after asking where to replay the illustration,
Mehmet said "seems all good to me I like this direction". The refined A
prototype is now the accepted visual reference for the next local integration.
Do not ask him to choose A/B again or keep presenting this direction as rejected.
This does not certify exact EN/TR/FR wording, production behavior or release.

## What is now implemented in the prototype

- One measured-coordinate hero illustration: subtle inputs extend behind the
  copy, converge into a layered prepared-work document, cross a visible bridge
  to undimmed human approval, and branch to product/workflow/customer-journey
  examples. Gradients are in user space so horizontal segments render correctly.
- A 4.8-second illustrative sequence: gather, prepare, hold for human review,
  one approval accent, outgoing traces, then completely still. Optional replay;
  no endless animation, no headline motion and no real approvals or operations.
- The approval node has opacity 1 throughout. Its review/approved label and
  symbol change, while outputs and their paths remain subdued until approval.
- Reduced motion is a complete static final view. Offscreen/hidden handling
  settles motion rather than running forever. No network calls or dependencies.
- Three selectable service situations show genuinely different illustrations:
  a customer portal, an enquiry/CRM/follow-up flow, and a clearer booking journey.
  Native buttons work with keyboard and pointer, with aria-pressed and a polite
  selected-example announcement. No metrics, fake customers or testimonials.
- Mobile uses a 206px recomposed diagram band; the service selector comes before
  its example. Text and actions are not scaled down with the desktop SVG.

The draft headline remains "Build what’s next. Run it better." Exact wording,
EN/TR/FR adaptation, final brand assets and permissioned proof visuals remain
the content/art review gate. This is not a complete functioning site: navigation
and CTAs are visual context only; service selection and replay are interactive.

## Local source and continuity

The editable conversation fragment is:
/Users/mehmeteminmayda/.codex/visualizations/2026/09/01/01a05d6d-3562-7760-95fa-b37986b41c4a/mayda-connected-flow-prototype.html

The earlier A/B comparison remains in mayda-design-directions.html in that
directory. These are local conversation sources, not tracked app assets.
Package the accepted source deliberately before a future Monster transfer.
The inline prototype itself provides motion replay; a separate video was not
exported. Laptop/mobile static browser frames were inspected locally.

## Verification — prototype only

- Rendered at 1440, 1024, 736, 375 and 320 CSS pixels; no horizontal overflow.
- Paragraph-to-actions gap: 33px on wider layouts, 29px on phones. Portal
  caption clearance after refinement: 23–46px across tested widths.
- Observed stage transitions around 1.016s, 2.015s, 3.216s, 3.816s and 4.815s;
  approval opacity 1 in every phase, zero active animations after settling.
- Changing reduced-motion preference while playing settles the sequence,
  hides replay and leaves zero running animations and full-strength approval.
- All three service choices switch the illustrated view with pointer and
  keyboard Enter. Portal, workflow and booking examples visually inspected.
- Browser console: zero errors/warnings. Installed Playwright used because
  agent-browser CLI is unavailable. Temporary review server stopped after QA.
- No Next.js app build/test is claimed: app code remains exactly as before.
  A no-JavaScript production fallback and the complete route/i18n/mobile
  acceptance matrix still belong to the later app implementation, not this study.

## Unchanged boundaries

Production source remains 93011e1. Local app remains rejected 7513f3e, with
subsequent planning-only commits; localhost:3107 is not this prototype.
MaydaOS stays private, Bitcoin dashboard stays secondary, five services stay
the detailed family. HodlStay is Client build · Live; SG is owned/editorially
independent. No Abidin/private data is exposed. No commercial record, pricing,
database, auth, environment, SG, deployment, push, account, message, spend or
Monster-sync action is part of this work.

Next: carry the accepted visual reference into the existing app, completing
the exact-copy/EN/TR/FR pass, real navigation and responsive/accessibility
checks. No app code changed in the acceptance-recording turn. Release approval
is still separate; no push or deployment is authorized by liking the direction.
