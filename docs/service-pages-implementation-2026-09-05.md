# Service discovery and dedicated pages — local implementation

September 5, 2026. Authority: Mehmet likes the current hero, asks to remove the
visible illustrative-workflow/replay strip, improve homepage services and add
one conversion-focused page per service while retaining the overview.
Canonical decision: DEC-2026-09-05-16. This is not publication approval.

## Delivered

- Accepted Connected flow hero: unchanged composition, copy, geometry and
  4.8-second finite review/approval sequence. Visible caption/replay footer and
  replay handler removed. Motion no longer depends on finding that button.
- Five direct visual cards replace the three selectable homepage examples.
  Website/software cards lead, with automation, email and support alongside
  distinct schematic interfaces. All five services are visible without selection
  or hydration; every card is one real keyboard-accessible link.
- /services remains the overview, with original service anchors, all five cards
  and a contact path. /approach still renders it with /services canonical.
- Dedicated pages, each with distinct copy, scope and questions:
  - /services/websites-and-ecommerce
  - /services/custom-software
  - /services/ai-and-automation
  - /services/email-and-customer-journeys
  - /services/fixes-and-support
- All five in EN/TR/FR, 15 localized static routes; unique metadata, canonical
  and alternate URLs, sitemap entries, unknown-slug 404s.
- Each page: buyer problem, fit, three deliverables, relevant proof or proposed
  approach, four native FAQs, first-step prompt, contact and two related links.
  Contact destination is the existing localized /contact page. No new form,
  service-specific intake persistence or backend changes are claimed.

## Proof and scope

HodlStay is Client build · Live, supporting delivery across public pages,
full-stack product and legacy migration. SG is owned and editorially independent,
supporting controlled workflow implementation, never presented as a client.
Email services have no permissioned result case: the page explicitly shows a
proposed journey. Schematics are labelled Example interface, not real client
screens. Actual proof uses existing case imagery and links. No fake metrics,
testimonials, prices, deadlines, availability or security-audit claims.

Existing logo/typefaces, navigation, home proof/process, lower BTC dashboard,
private MaydaOS and intake consent/access model are unchanged. No new dependencies,
image generation, live demo, AI calls or accounts. Server components handle
the gallery and service pages; native details handle FAQs without JavaScript.

## Verification

- npm run lint: pass.
- npm test -- --exclude tests/rls.integration.test.ts: 96/96, 10 files.
  Database-writing tests deliberately excluded for this frontend scope.
- npm run build: pass; 101 static pages generated, including all 15 service paths.
- SMOKE_BASE_URL=http://localhost:3109 npm run smoke:live: 89/89 pass, including
  dedicated metadata/sitemap/404/FAQ/contact checks and existing private OS gates.
- 45 initial browser layout combinations: home, overview, all English details
  and selected TR/FR details at 1440/1024/768/390/320 CSS pixels. Fixed a discovered
  no-wrap ownership tag and a narrow CTA by allowing wrapping and shrinking grid
  children. All 15 details then passed at 390/320 (30 combinations).
- Real keyboard and pointer flow for each service: home → detail → overview →
  detail → contact form. Related-service and FAQ controls work. No submission.
- JavaScript-disabled French mobile: static hero, service link, FAQ toggle and
  contact destination work with real pointer input. Form sending is not claimed.
- Reduced motion: settled hero, no running animation. Normal motion sampled
  gather → prepare → review → approve → deliver → settled; no replay/footer DOM.
- French automation at 200% text size: no horizontal page overflow.
- Browser screenshots visually inspected for desktop gallery/full software page
  and mobile automation hero/proof. Production-preview page reported zero errors
  and warnings at the final check. Dev full-page/cross-viewport capture produced
  Next's below-fold proof-image LCP advisory; no eager-loading workaround added.
- git diff --check: pass. Existing Vite future CommonJS-loader advisory remains.

## State and release boundary

Opening main: a2c0777, clean, ahead 6 / behind 0. Its company-registry migration
and receipt belong to another task and were not changed. Production's last
verified source remains 93011e1; fresh public GETs to home/approach/proof and
HodlStay/SG cases returned 200 and the old live design. New routes are local-only.
Optimized preview http://localhost:3109/; dev 3108. Older 3107 is not this build.

Abidin queue/dashboard at audit: 225 research leads, zero qualified opportunities,
conversations, proposals and wins; ten content reviews. Another task's approved
500-row private company registry is separate research, not revenue or consent.
Mac remains sole canonical writer. Concurrent SG changes were preserved.

No push, deploy, remote migration/data writes, form submission, emails/messages,
lead contact, accounts, ads, spend, application, publishing or Monster sync.
Next gate: Mehmet reviews these local pages and approves an exact release.
