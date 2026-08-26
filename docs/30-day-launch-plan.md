# MaydaLabs 30-Day Launch Plan

_Status updated: 26 August 2026_

## Decisions Locked

- Brand and domain: MaydaLabs at https://maydalabs.com.
- Positioning: product and growth studio for founders.
- Proof strategy: lead with Bitcoin-native work and target founders across industries.
- Commercial model: no public price list; scope and pricing follow a project call.
- Flagships: HodlStay and Satoshi Gazette.
- Intake: local brief composer, Calendly, and `info@maydalabs.com`; no database or email provider required for launch.
- Availability language: `Open for new client work` without an artificial cap.

## Product Status

- [x] New MaydaLabs identity and dark-first visual system.
- [x] MaydaOS homepage with persistent desktop windows, mobile launcher, guided shell, product reels, telemetry, tour, and ten-scene wallpaper engine.
- [x] Services, About, Contact, legal, metadata, sitemap, and social image foundation.
- [x] Dedicated HodlStay flagship case study.
- [x] Dedicated Satoshi Gazette flagship case study grounded in current product capabilities.
- [x] Current flagship screenshots and outbound product links.
- [x] Legacy Programs, Pricing, ROI, Playbooks, and Newsletter routes removed from the application.
- [x] Permanent redirects retained for old URLs.
- [x] Vercel Analytics and conversion-intent event layer.
- [x] Vercel Speed Insights and campaign attribution through to Calendly.
- [x] English, Turkish, and French routes with canonical unprefixed English and explicit localized language links.
- [x] Localized metadata, canonical URLs, `hreflang`, sitemap entries, and dedicated social cards.
- [x] Primary X profile connected at `@maydalabs`.
- [x] GTM-ready integration and setup documentation.
- [x] Guided local intake from MaydaOS to the contact brief composer without transmitting typed answers.
- [x] Production route, redirect, metadata, telemetry, and intake-handoff QA after the 26 August deployment.
- [ ] Add the real GTM container ID when an account/container exists.
- [ ] Run a fresh Lighthouse, accessibility, and cross-browser matrix after the optimization pass.

## Current Optimization Queue

1. Keep public documentation and privacy language aligned with the deployed behavior.
2. Add repeatable smoke checks for routes, redirects, localized metadata, sitemap, social images, and telemetry.
3. Remove unreachable legacy homepage source and consolidate its remaining CSS safely.
4. Decompose the largest MaydaOS, terminal, wallpaper, and stylesheet modules without changing behavior.
5. Run fresh accessibility, performance, bundle, and browser checks; treat production field data as the long-term source of truth.
6. Review Satoshi Gazette case-study language as the newsroom publishes more work; add outcomes only when they are verifiable.

## Marketing Sprint: Start After Site QA

1. Create the MaydaLabs social profiles and use the final brand assets consistently.
2. Prepare six launch assets: founder introduction, studio launch, HodlStay case post, Satoshi Gazette case post, MaydaOS walkthrough, and product-system note.
3. Create one share graphic and one short product walkthrough for each flagship.
4. Build a focused founder prospect list and match each outreach message to the most relevant case study.
5. Start with organic posts and direct outreach before paid ads.
6. After conversion tracking is verified, test one narrow paid campaign with one audience, one case-study landing page, and one primary conversion: `project_call_click`.
7. Review traffic, qualified calls, replies, and objections after seven days; change the message from evidence rather than impressions.

## Inputs Still Needed

- A GTM container ID if Google Ads tracking is required.
- Any public HodlStay or Satoshi Gazette outcomes, milestones, or testimonials that can be verified.
- Final social account URLs after the MaydaLabs profiles are created.
- Target geography and initial customer profile before paid campaign setup.
