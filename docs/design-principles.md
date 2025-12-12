# Mayda Labs – Web Design Principles (v1)

_Last updated: 12 Dec 2025_

## 1. Layout & Grid

- **Max width:** Use `w-[min(1520px,97vw)]` for main content wrappers (hero, body sections).
- **Full-bleed rails (logo belt, guarantee, etc.):**
  - Use `w-screen` + `margin-left/right: calc(50% - 50vw)` to break out of the centered grid.
  - Apply `[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]` or soft gradient fades on edges – no hard cutoffs.
- **Cards:** Rounded-2xl, subtle shadows, never fully flat. Use consistent padding tokens across cards (e.g. `px-4 py-4` for medium blocks).
- **Vertical rhythm:** Hero → value prop sections → social proof → ROI → FAQ → footer. Keep clear section breaks (top border or subtle background shift).

## 2. Color & Tone

- **Base background (dark sections):**
  - `bg-slate-950` / `bg-slate-900` for “tool” and console-style blocks (ROI, FAQ, some rails).
- **Light sections:** Use very light greys / whites for breathing room between heavy blocks.
- **Accent color:** Single primary accent around `#60a4ba` / teal family.
  - Borders: `border-[#60a4ba]` or teal variants.
  - Glows / rings: low-opacity teal shadows.
- Avoid rainbow gradients everywhere; gradients are **reserved** for:
  - Program glyphs (Foundation / Momentum / Growth Loop).
  - Very specific hero or highlight elements.

## 3. Typography

- **Voice:** “We”, not “I”. Calm, competent, no hype-words (“skyrocket”, “crush”, etc.).
- **Weights:**
  - Microcopy / labels: all-caps, tracking-wide, `font-semibold` or `font-extrabold`.
  - Body: `font-medium` or `font-normal`.
- **Sizes:**
  - Hero / section titles: 3xl–4xl.
  - Subheads: ~text-sm to base.
  - Micro labels (rails, chips, caps): `[0.7rem]`–`[0.8rem]`.
- Keep **micro labels consistent**: same letter-spacing and casing across logo belt, guarantees, pills, meta chips.

## 4. Components (Patterns to Reuse)

- **Primary CTA button:**
  - Use `primaryCtaClasses` everywhere for “Book a 15-min fit check” (hero, ROI, footer, etc.).
- **Rails:**
  - Logo belt and guarantee rail share:
    - Soft edges (mask or gradient).
    - Continuous pill marquee with hover pause.
- **FAQ:**
  - Dark, 2–3 column cards.
  - Search bar pill, highlight matches with `<mark>` and teal background.
  - “Expand all / Collapse all” controls present on desktop.
- **ROI widget:**
  - Two modes (eCom / Services) with:
    - Steppers on all numeric inputs.
    - Split layout (inputs left / results right).
    - Recommendation row with icon + program name + price + timeline.
- **Footer:**
  - CTA band on top.
  - Newsletter pill.
  - Four navigation cards.
  - Copyright + legal + social.
  - Sticky mobile CTA.

## 5. Interaction & Behaviour

- Hover states are **subtle**:
  - Slight translate (`translate-y-[1px]`) and shadow increase, not crazy scaling.
- Marquees:
  - Pause on hover.
  - Prefer CSS-only loops with duplicated content.
- FAQ:
  - Queryable via URL hash (`#faq-q-1`).
  - Search should never feel broken: if no results, show a helpful “try X, Y, Z” message.
- ROI:
  - Persist user inputs in `localStorage`.
  - Guardrail text when numbers are too low / already very high.

## 6. Analytics Conventions (front of mind)

- Use `dataLayer` events with consistent naming:
  - `faq_view`, `faq_search`, `faq_expand`, `faq_collapse`, `faq_expand_all`, `faq_collapse_all`.
  - Future: `roi_calc_view`, `roi_mode_switch`, etc. (when we wire them).
- Event payloads should be small and human-readable (no giant blobs).

## 7. Content Rules of Thumb

- Say **what** they get and **how** it ships (sprints, checklists, demos).
- Anchor everything in time or money:
  - “2–3 weeks”, “1–2 week cycles”, “extra $X/mo”.
- No shouting. High confidence, low drama.

---

Use this as your v1. We can extend it later when we touch case studies, blog layouts, animations, etc.

If you want, next time we can add a smaller `docs/component-usage.md` where we literally list each component (`HeroSection`, `GuaranteeRail`, `LogoBeltSection`, etc.) and note: where it’s allowed, what props matter, and what to **never** change without thinking (e.g. primary CTA labels, grid widths).
