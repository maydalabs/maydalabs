# Original hero animation restored — September 5, 2026

Mehmet requested the original hero animation back after noticing its removal
in the five-service release. This is a restoration, not another redesign.

- Re-mount the existing `GateFigure` inside the existing responsive hero grid.
  The component and its SVG paths, colors, labels, timing and reduced-motion
  styles are unchanged. Keep `SignalField` behind the hero.
- Preserve the current EN/TR/FR headline, copy, five services, direct contact,
  dashboard near the bottom and private MaydaOS boundaries.
- Desktop: animation beside the headline; mobile: below copy and actions.
  No added dependencies, runtime logic, database work or environment changes.
- Regression: a source test preserves the hero mount and reduced-motion CSS;
  smoke verifies the original graphic in EN/TR/FR and linked CSS contains the
  current service/hero/animation rules (catches the previous stale-CSS issue).
- Local verification: lint and optimized build pass; 8 focused services tests
  pass; 71 smoke checks pass against the optimized preview at localhost:3107.
  Browser: 1440x1000 and 375x812 have no horizontal overflow; pulse offset
  advances over time; reduced motion leaves the figure static with pulses
  hidden and no active figure animations. Mobile actions finish near y=537.
  No browser console errors were observed.

Mehmet explicitly answered "Yes, push it live" for this animation-only change.
Use the existing Vercel mayda-labs project and maydalabs.com. Abidin decision
DEC-2026-09-05-09 and docs/maydalabs-hero-restoration-2026-09-05.md hold the
canonical approval and actual deployment receipt. This file records local
verification, not an assertion that a production deployment has completed.
