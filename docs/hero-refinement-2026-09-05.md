# Hero refinement — local review, September 5

Mehmet rejected the standalone diagram restored in production source 93011e1.
His screenshots showed a cramped paragraph/CTA gap and an oversized diagram
below the text in a narrow pane. He wants subtle motion spread through the
hero, blended into background shading and fades, plus clearer copy and spacing.
This is a local refinement request, not a new release approval.

## Changes

- Retain the existing SignalField and GateFigure SVG/CSS animation components.
  Compose both inside one absolute, decorative, pointer-transparent background.
  Soft radial shading, opacity and edge masks blend them into the dark surface.
  Hide diagram labels only inside the homepage hero.
- Remove the two-column hero layout and the old 959px rule that hid SignalField.
  The art never becomes a separate row at tablet/mobile sizes. Narrow layouts
  use a quieter crop; buttons stack only on small phones.
- Shorter EN/TR/FR hero copy. English: “Build what’s next. Make work simpler.”
  Replace the duplicated note with one concrete service paragraph. Metadata
  and the five-service family are unchanged.
- Explicit 24–32px heading/paragraph spacing and 32px paragraph/button spacing,
  content-driven height, fluid type and no fixed-height text container.
  New action spacing/stacking is scoped to this hero; shared action rows in
  services, cases and private tools retain their existing styling.
- Update the source regression and smoke checks to require the ambient wrapper
  and retained motion rather than preserving the rejected two-column layout.

## Verification

- Lint, TypeScript/optimized build, 8 service regression tests: pass.
- All 71 smoke checks pass against the local optimized build on port 3107.
- Browser layout assertions on the optimized build: EN widths 1710, 1440,
  1366, 1280, 1024, 960, 959, 768, 650, 480, 375, 320 CSS pixels; TR and FR
  at 1280, 650, 375, 320. All 20 combinations: no horizontal page overflow,
  no button overlap/clipping, art absolute, heading/paragraph gap at least
  24px, paragraph/CTA gap 32px. These are measured layouts, not a claim of
  exhaustive device/browser coverage or conversion improvement.
- Screenshots visually inspected at laptop, split-pane and phone sizes.
  At 1366×768 the CTA group ends around y588, inside the first viewport.
- Animated pulse offset advances over time. Reduced-motion mode has no
  animations in the decorative background; static lines remain visible.
- A 200% root-font-size check at 650px has no page or hero-copy overflow;
  CTA gap scales to 64px. This is text-size emulation, not browser zoom.
- Actual pointer clicks reach /contact and /case-studies. No forms submitted.
  A separate JavaScript-disabled browser renders the headline and contact link.
  Fresh optimized-page console is clean. Returning to an old dev-page history
  entry briefly produced obsolete HMR socket errors after the dev server was
  replaced; fresh navigation confirmed these are not production-page errors.

The browser skill's CLI was unavailable; installed Playwright tools provided
the screenshots, pointer checks and measurements instead. No package added.

## Boundaries and next step

Local only. Production remains 93011e1 until Mehmet reviews this preview and
explicitly approves this payload for release. No push or deployment in this
pass; no environment, dependency, database, intake, authentication or beta
access changes. Services, BTC dashboard near the bottom, case ownership,
private MaydaOS and existing social-preview artwork are retained. No outreach,
messages, accounts, spend or Monster sync. Abidin holds canonical continuity.
