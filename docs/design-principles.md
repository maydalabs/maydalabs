# MaydaLabs Design Principles

> **Superseded (2 September 2026):** this document describes the retired v2
> "Signal Gate" system (#090909 / #f2f0ea / #f7931a, MaydaOS surfaces). The
> active v3 system — the Multiplier Field (Void/Frost/Cobalt/Mint/Mist),
> typographic wordmark, `app/field.css` — is recorded in
> `docs/v3-implementation-brief.md`. Kept for history.

_Superseded system: July 2026_

## Direction

MaydaLabs should feel like a small, technically serious studio with unusually strong output. The interface combines an editorial point of view with visible product mechanics. It should not resemble a generic SaaS template or an agency card grid.

## Visual Language

- Base: near-black `#090909` and warm cream `#f2f0ea`.
- Primary signal: Bitcoin orange `#f7931a`.
- Secondary signals are used by a specific story, not as decoration. Satoshi Gazette uses editorial red; availability uses acid green.
- Use lines, grids, coordinates, diagrams, dossiers, live product frames, and system labels to imply working software.
- Avoid generic gradients, floating glass cards, excessive border radii, and decorative technology imagery.
- A section should have a reason to look different. Alternating colors alone is not a concept.

## Typography

- Space Grotesk carries interface, navigation, and direct product language.
- Newsreader carries editorial emphasis, contrast, and human judgment.
- Monospace is reserved for system state, indices, coordinates, and metadata.
- Large headlines may be extreme, but body copy stays calm and legible.
- Use sentence case for headlines. Uppercase belongs to compact labels, not paragraphs.

## Layout

- Prefer full-width compositions and strong asymmetry over collections of equal cards.
- Use one deliberate focal object per section: signal field, product screen, build dossier, system map, or editorial workflow.
- Maintain generous whitespace around large type and dense system diagrams.
- Product screenshots are evidence. Present them at useful scale with precise captions.
- Mobile layouts preserve the narrative order even when spatial diagrams collapse.

## Motion

- Motion must explain transformation, hierarchy, state, or progress.
- The homepage signal field visualizes ambiguity becoming a product.
- Project previews reveal layers of the build rather than adding decorative hover effects.
- The build dossier turns pages as scroll progresses but never traps or hijacks scrolling.
- Respect `prefers-reduced-motion` and keep the experience understandable without animation.
- Avoid continuous motion when nothing is being communicated.

## Components

- Primary CTA: orange pill on dark surfaces; near-black pill on cream surfaces.
- Text links: concise action plus directional arrow.
- Browser frames: consistent chrome, domain, and honest product status.
- Status rails: short factual fields, not vanity metrics.
- Case studies: each flagship gets a visual language derived from its product. Do not clone one case template and swap screenshots.
- Final CTA: ambitious line, two actions at most, no fixed package pricing.

## Content

- Lead with shipped software and defensible system depth.
- Describe what was built, how parts connect, and what remains in progress.
- Never invent metrics, testimonials, team size, or outcomes.
- Use Bitcoin-native work as proof while speaking to founders across industries.
- AI is an accelerator inside an accountable human process, not the product claim by itself.
- Say `Open for new client work`; do not use artificial capacity limits.

## Analytics

- Event names use `snake_case` and express a real user action.
- Payloads remain short, readable, and non-personal.
- Scheduling links carry a distinct `utm_content` surface.
- Vercel Analytics is the immediate source of truth. GTM is an optional routing layer for ad platforms.
- Advertising tags must be added through GTM and tested before publication.
