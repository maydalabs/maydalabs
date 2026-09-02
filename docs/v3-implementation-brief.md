# MaydaLabs v3 — Implementation Brief

_Status: local implementation record, 2 September 2026. Nothing in this
document is published, deployed, or externally communicated._

This brief records the approved strategic decisions for the v3 rebuild, the
implementation defaults chosen inside those decisions, and every conflict or
open question that still needs Mehmet. It is the working contract for the code
in this repository; the canonical commercial queue remains private in Abidin.

## Positioning

MaydaLabs is **a build and acceleration company for founder-led businesses**.

It is not a marketplace, a generic development agency, a product studio brand,
a growth studio, an accelerator cohort, or a Web3 company.

The primary buyer is a founder, owner, or operator with decision-making
authority in one of three situations:

1. **Launch** — an idea that needs to become a working product.
2. **Accelerate** — an existing company or product that needs to grow or
   improve.
3. **Remove operational drag** — workflows, systems, or operations that
   contain expensive inefficiencies.

Central promise: **“Build the next version of your business.”**

Homepage support copy: “Launch an idea, accelerate what already works, or
remove the systems slowing you down. MaydaLabs combines product engineering,
automation, lifecycle growth, and security to create leverage.”

Primary CTA: **“Map my next move”** → the Multiplier Map at `/start`.
Secondary CTA: **“See the work”** → `/case-studies`.

## Offer family

1. **Multiplier Map** — free interactive diagnostic at `/start`. Lead
   generation and qualification. Deterministic, rule-based, versioned rubric
   (`lib/multiplierMap.ts`, `rubric_version` stored with every saved result).
   It never pretends to replace human judgment and says so in the result.
2. **Multiplier Sprint** — the primary paid entry offer: a focused engagement
   to identify and address one high-leverage constraint. No published price,
   duration, or guaranteed result (none is approved).
3. **Build Partnership** — end-to-end product and system delivery.
4. **Acceleration Partnership** — continuing improvement for an existing
   company: product iteration, automation, conversion, lifecycle, reliability,
   security.

## Capability model

Four capabilities, presented as one system:

- **Product Engineering** — frontend, backend, APIs, data systems, complete
  digital products. Onchain products are an optional capability here, framed
  by practical use cases only, and only where the business case requires it.
- **Automation and AI** — workflow automation, internal tools, operational
  systems, integrations, carefully scoped AI.
- **Lifecycle and Growth** — activation, conversion, retention, analytics,
  customer journeys, lifecycle systems.
- **Security and Reliability** — security foundations, performance,
  resilience, access control, operational confidence.

Web3 decisions applied: no site-wide Traditional/Web3 switch, no wallet
requirement, no tokens/NFTs/DAO/speculative language, email-based
authentication first, architecture left compatible with optional
Ethereum/Solana identity later, no Web3 delivery-proof claims (the audited
repository holds none beyond Bitcoin-payment work already labelled in cases).

## Brand: the Multiplier Field

The Signal Gate mark and the previous palette (`#090909` / `#F2F0EA` /
`#F7931A` signal orange / `#D7FF68` acid) are retired from all active
surfaces: navigation, favicon, metadata, and generated social images.

v3 identity is a typographic **MaydaLabs** wordmark. The favicon is a simple
typographic M — explicitly not presented as a finalized standalone logo.

Visual concept: **the Multiplier Field** — one input becoming several
connected outputs (leverage, acceleration, compounding value), drawn as a
branching-path motif in SVG/CSS. Motion explains multiplication and
connection, respects `prefers-reduced-motion`, and every surface works
without animation.

Palette (tokens in `app/field.css`):

- Void `#0A0B0F` (background)
- Frost `#F4F7FA` (foreground)
- Cobalt `#4B6BFF` (primary accent)
- Electric Mint `#42F5B6` (multiplication/outputs accent, used sparingly)
- Mist `#AAB2C0` (muted)
- Error `#FF6B6B` (functional only)

Cobalt→mint transitions are used sparingly; contrast stays high. Excluded:
crypto/chain icons, neon Web3 clichés, spaceships, fake terminals, dashboard
heroes, heavy glassmorphism, decorative particle fields, empty agency
language.

## Site architecture

EN/TR/FR localization, the `[lang]` routing, `localizePath`, and the
type-safe per-page `COPY` pattern are preserved.

| Route | Purpose |
| --- | --- |
| `/` | Promise, three buyer situations, verifiable proof, how leverage is created, four capabilities, Multiplier Map CTA, selected work, closing CTA. |
| `/start` | Multiplier Map: short multi-step diagnostic (stage, constraint, outcome, timeline, resources) → deterministic next-step map. Result is visible before any account. Saving or discussing it asks for auth or consent. |
| `/case-studies` (+ four case pages) | “Work.” Conversion-grade cases, each with context, constraint, exact scope, what was built, verifiable evidence, current status, ownership relationship. URLs kept for continuity; navigation label is “Work.” |
| `/approach` | How MaydaLabs moves from diagnosis to building and improvement. |
| `/about` | Founder-led positioning and operating principles. No team-size inflation. |
| `/contact` | Direct channel (brief → email/call). Server-side intake with consent. |
| `/auth/sign-in` | Email OTP (six-digit code) with clear confirmation and error states. `/auth/confirm` route handler also accepts `token_hash` links. |
| `/portal` | Saved Multiplier Maps, submitted briefs/inquiries with status, subscription preferences, profile and privacy settings. Deliberately small. |
| `/internal/leads` | Operator-only intake review: review, tag, mark as manually transferred to Abidin. No automated contact, no auto-qualification. |
| `/os` | Localized MaydaOS Lab: an interactive v3 proof surface for the three buyer paths, connected capabilities, case boundaries, and command navigation. Footer-only, `noindex`, excluded from the sitemap until separately approved. |
| `/privacy`, `/terms` | Updated for the new data model. |
| `/profile` | Hiring/founder profile, kept out of primary navigation (footer link). |

MaydaOS is no longer the homepage narrative or the definition of the company.
Following Mehmet's 2 September decision, it returns as a clearly labelled,
localized `/os` Lab artifact inside the v3 interface. It uses the Multiplier
Field wordmark, palette, buyer language, cases, and routes rather than
restoring the retired Signal Gate shell or its 9,000-line global stylesheet.
The Lab keeps the useful OS idea—modules, connected systems, and a real
navigation terminal—while the commercial homepage remains immediately clear.
It is linked discreetly from the footer, excluded from the sitemap, and
`noindex` until Mehmet separately approves public indexing.

`/services` redirects to `/approach` (capabilities now live on the homepage
and approach page). Existing legacy redirects are preserved.

## Data and authentication

- Supabase via `@supabase/supabase-js` + `@supabase/ssr`, cookie-based SSR
  sessions, `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  service credential server-only (`lib/supabase/admin.ts`, `server-only`).
- `proxy.ts` refreshes sessions; it is not the authorization boundary. Pages
  and every server action/route handler verify identity via `getClaims()` and
  authorize + validate server-side.
- Tables: `profiles`, `multiplier_maps`, `lead_intakes`, `subscriptions`, and
  a private `internal.operators` authorization table. Versioned migrations in
  `supabase/migrations/`. RLS on all exposed tables; grants configured
  separately; anonymous submissions go only through validated server actions
  using the service credential (no anon table privileges at all).
- Abidin remains the canonical commercial record. `lead_intakes` is an intake
  buffer with `review_status`, `abidin_record_id`, and
  `transferred_to_abidin_at` for a deliberate, manual transfer workflow.
  Nothing writes into Abidin automatically.
- “Subscription” means free email/news preferences only. No Stripe, no
  checkout, no paid membership. With no approved email provider configured,
  subscriptions stay `pending` and no external email is sent.
- Abuse controls: honeypot field, minimum-fill-time check, per-IP in-memory
  rate limit, strict server-side validation. CAPTCHA and production rate
  limiting are documented production gates (they require external accounts).

## Proof and claim boundaries

- MaydaLabs is the company brand. Satoshi Gazette is an owned operating
  publication, never a client. Client work is labelled client work. HodlStay
  outcomes are not transferred into generic MaydaLabs claims.
- No reader-traffic, conversion, revenue, or performance claims that the
  repository cannot support. No invented or canned quotes. No testimonials
  exist yet; none are fabricated.
- **HodlStay status conflict (unresolved, needs Mehmet):** the previous site
  said “Live · Active delivery” and “Prepared for client handover” while the
  operating runbook calls HodlStay “finished client work.” v3 does not
  silently resolve this. Case pages use neutral, provable wording — “Client
  build · Live at hodlstay.com” — and avoid both “active delivery” and
  “finished/handed over” until Mehmet picks the exact status language.

## Implementation defaults chosen (review welcome)

1. Case-study URLs stay at `/case-studies/*`; navigation says “Work.”
2. `/services` → `/approach` permanent redirect; smoke checks updated.
3. Profile moves out of the primary nav into the footer (decision-queue item
   “Separate the client journey from the hiring profile” — default applied,
   still reversible).
4. MaydaOS is restored as a scoped `/os` Lab built into v3; it remains outside
   the primary navigation and buyer path.
5. The retired sound layer, global OS shell, wallpapers, screensaver, and
   Signal Gate identity remain removed. The v3 Lab is intentionally lighter.
6. Space Grotesk stays as the working typeface of the wordmark and site; the
   serif display font is dropped. A finalized brand typeface remains open.
7. Analytics: GTM + Vercel Analytics preserved; `project_call_click` remains
   the primary conversion; new events `multiplier_map_*` and `lead_intake_*`
   added.
8. Telemetry route kept (live uptime checks for HodlStay/SG used as small
   verifiable-proof signals on work surfaces).

## Unresolved items for Mehmet

- Exact HodlStay status wording (above).
- Final brand typeface and any future standalone logo.
- Production gates before launch: mail delivery (OTP + subscription
  confirmations), CAPTCHA/rate limiting, Supabase project provisioning and
  remote migration, domain/deployment. None of these were performed.
