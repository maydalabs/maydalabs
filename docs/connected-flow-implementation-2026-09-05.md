# Connected flow — local app implementation, September 5

Mehmet accepted refined A, then explicitly said “Okay then please implement
this now”. The accepted composition is now implemented in the existing app,
not only in the conversation prototype. This is not push/deployment approval.
Canonical authorization: Abidin DEC-2026-09-05-14.

## What changed

- Buyer: the hero says “Build what’s next. Run it better.” with a short,
  concrete description and the existing direct contact / work destinations.
- Visitor: quiet inputs become prepared work, pause for human review, then
  produce product/workflow/customer-journey examples. The approval node stays
  at full opacity. A finite 4.8-second sequence plays once; Replay illustration
  is available below the diagram. It is not a live Abidin/AI demonstration.
- Services: three native selectable situations—build, connect, improve—show
  a portal, enquiry/CRM workflow or booking refinement. Each has an explicit
  illustrative label and links to the relevant detailed services. All five
  services remain available. No new package, price or result guarantee.
- Mehmet: accepted artwork and localized copy now live in tracked app files,
  with regression checks and this handoff. No conversation-directory dependency
  is required to run the app after a future approved sync.

EN/TR/FR, real logo/typefaces, navigation, permissioned work images and ownership
labels are preserved. BTC dashboard stays after work/process. No Bitcoin payment
offer, public MaydaOS entry, auth/data change, invented client evidence or metric.

## Implementation boundaries

- `app/[lang]/page.tsx`: mounts the new hero and service stories; lower sections
  unchanged. Obsolete duplicate hero copy removed.
- `app/connected-flow.css`: scoped composition, gradients, finite motion,
  mobile diagram and native checked/focus states. No new dependency.
- `components/ConnectedFlow.tsx`: small client enhancement of complete server
  HTML. No per-frame React updates, interval, API call or canvas. Timers are
  cleared on replay, reduced motion, invisibility and unmount; autoplay occurs
  only on first view. Focus stays on the replay control.
- `components/ServiceStories.tsx`: server component. Native radio selection and
  CSS work without JavaScript. Arrow keys select; related links navigate.
- `lib/connectedFlow.ts`: EN/TR/FR copy, service mappings and phase timings.
- `tests/connectedFlow.test.ts`, `tests/services.test.ts`, `scripts/smoke.mjs`:
  selected design and unchanged service/private-beta boundaries.

Original GateFigure/SignalField components remain in the repository; they are
not mounted in the homepage. The approved prototype remains historical reference.

## Verification

- `npm run lint`: clean.
- `npm run build`: passed; TypeScript passed, 86 static pages generated.
- `npm test -- --exclude tests/rls.integration.test.ts`: 90/90 across 9 files.
  The database-writing integration suite was deliberately not run for this
  frontend-only change; no database/RLS re-verification is claimed.
- `SMOKE_BASE_URL=http://localhost:3109 npm run smoke:live`: 71/71, including
  28 signed-out MaydaOS route checks, all five service anchors, EN/TR/FR,
  metadata/sitemap/robots, social image and read-only telemetry.
- Browser: 1440/1024/736/375/320 CSS pixels in all three languages; no horizontal
  overflow or hero-copy/approval overlap; paragraph/action gap 33px wide, 29px
  phone. These widths also cover narrower-window/zoom reflow.
- Pointer selection and native ArrowDown navigation verified. Replay by Enter
  holds for review, settles and retains focus; zero running animations after
  settling. Changing reduced-motion preference settles and hides replay.
- JavaScript-disabled EN/TR/FR: complete static hero; all three examples switch
  using native pointer events; replay hidden; no horizontal overflow. Browser
  automation's stability wait did not work in these contexts, so scrolling and
  coordinates were read from the DOM before real mouse clicks (no JS-dispatched
  selection or application script execution).
- Real contact navigation, related `/services#support` link and French mobile
  menu to `/fr/services` work. No contact/auth form submitted.
- Development console had no errors. Production preview exposed a non-blocking
  `/contact?_rsc=...` prefetch 404 and a legacy `/favicon.ico` 404; actual contact
  page/navigation and declared icon work. These are noted, not misreported as
  a clean production console or attributed to this change without evidence.
- `git diff --check`: clean.

## Local versus live and concurrent work

Opening MaydaLabs head: 8d65e04, main, clean, ahead 4/behind 0. Last verified
production source and origin/main remain 93011e1. No live release occurred here.
Review this optimized build at **http://localhost:3109/**. Development server
is on 3108; the older 3107 process is not the review target for this change.

Another task created `supabase/migrations/20260905114950_company_prospects_registry.sql`
during this work. It was neither authored nor applied here and is excluded from
this commit. Do not treat its presence as website-design authorization.

No push, deployment, migration, remote data write, message, email, lead contact,
model API call, account, ad, investment application, spend or Monster sync by this
task. Local browser/build checks and read-only public/telemetry requests occurred.
Mac remains the sole canonical runtime writer. Next founder decision is visual
acceptance of this integrated page and separate exact release approval.
