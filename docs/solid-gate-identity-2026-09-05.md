# Solid Gate identity / 5 September 2026

Mehmet selected direction C (Solid Gate) as final and then explicitly requested
main integration and a production push. Exact approved 32-unit geometry is in
brand/mark-geometry.json; colour and Bricolage Grotesque / raised multiplier
identity are retained. The shared Logo component now uses unique mask IDs and
transparent interior cutouts. Header/footer, EN/TR/FR, favicon SVG, four-frame
ICO, static Apple icon and Organization structured-data image are updated.

Hero, services, copy, private MaydaOS, secondary Bitcoin dashboard, auth/intake
and client/owned-publication boundaries are unchanged. Existing OG/social-preview
artwork is retained, per the separate preview-image approval boundary. No social
profile upload is included. Historical drafts/assets are not refreshed for reuse.

## Professional kit

Public download: /brand/maydalabs-solid-gate-v1.0.0.zip

81 files, 2,600,145 bytes. SHA-256:
be48074b39c31ea967d93bcfee8e151bab2966d0264acdc84a2e5971bf80aabe

Includes transparent/opaque and monochrome SVG/PNG marks, outlined horizontal,
stacked and wordmark lockups, 16-512px icons, circle-safe avatars, three-page
usage guide, visual overview, master geometry/outlined type, source scripts,
palette tokens, original Bricolage font, OFL license and a checksum manifest.
Digital sRGB kit; no trademark clearance or certified print colour claim.
Desktop folder: /Users/mehmeteminmayda/Desktop/maydalabs-logo-kit

## Rebuilding

- npm run brand:build exports application icons and stages kit assets.
- Optional font outline regeneration: Python + fontTools,
  scripts/build-brand-wordmark.py. Routine exports use committed outlines.
- Python + reportlab, scripts/build-brand-guide.py, adds the guide and creates
  the deterministic ZIP. PDF rendering must be visually checked before release.
- .brand-build is ignored; only approved public assets and ZIP ship.

## Verification before release

Lint clean; 101 non-DB tests across 11 files pass; production build succeeds
with 102 generated pages. All 89 local smoke checks pass. Five logo regression
tests cover exact geometry, matching master exports, real alpha cutouts, ICO/
PNG dimensions and outlined-font provenance. ZIP CRC and all 80 manifest hashes
verified. All three PDF pages rendered and visually inspected.

Local optimized browser checks at localhost:3111: header/footer display Solid
Gate with distinct mask IDs; 1440/390/320px show no horizontal overflow; EN/TR/FR
carry the new logo; contact click resolves and renders correctly; all five
brand asset URLs return 200 with correct media types. A local RSC prefetch 404
was observed, but actual navigation works; production recheck is required.
No form submissions, database mutations or RLS integration tests were run.

The first Apple ImageResponse attempt failed during prerender. It was replaced
by the static PNG generated from the approved master; the clean rebuild passes.
Existing Vite config-loader advisory remains unrelated. No environment changes,
paid model calls, external account creation, email, outreach, ads or Monster
transfer. Release SHA and production receipt are recorded in Abidin after push.
