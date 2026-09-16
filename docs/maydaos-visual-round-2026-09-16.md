# The visual round — 16 September 2026

Local implementation record. Mehmet chose the instrument direction and then
said, twice, that it still did not look good. Rather than trust my own taste a
third time, seven independent critics read the actual CSS and components
through seven lenses — typography, colour/depth, spacing, motion, craft, pane
interiors, and what is simply absent — then a skeptic killed 36 of their
findings as generic advice, and a planner ordered what survived.

## The two things that mattered more than everything else

**The shader was erasing the palette.** An hour earlier I took `--os-bg` to
`#050507` to fix figure/ground. The canvas is opaque, covers the whole root,
and its `base` was `vec3(0.043, 0.043, 0.051)` — `#0b0b0d`, six points
*lighter* than the token it hides. So the darkening did nothing at all, and
the light variation on top of it peaked at +9,+10,+19 of 255 across an entire
screen, which is a gradient nobody can see. Verified by arithmetic before
touching it, and by sampling the drawing buffer after: the far corner now sits
at `#060609` and the lamp corner at `#121423`.

**Every glyph was Space Grotesk.** A display grotesque with wide sidebearings
and no text-optical cut, carrying every 11–15px string on the desk — the menu
bar, window titles, dock, rows, labels. That is most of why it read as a
landing page in a window. `--os-font-ui` is now a system text stack. The
wordmark keeps Bricolage; the co-founder keeps its serif. A token string, not
a dependency.

Neither was findable by looking at a screenshot, which is the argument for
having the code read rather than the picture.

## What else landed

- **Type scale.** Ran 11/12.5/14/16/20 — steps of 1.14, 1.12, 1.14. Two sizes
  under about 1.2 apart do not read as different sizes. Now 11/12.5/15/19/25.
- **The serif promise was not true.** The co-founder's writing was 16.3px
  against a 15px sans: 1.09, which optically is nothing, so the one committed
  idea in the product read as a font that had failed to load. It is 19px now
  and the human turn steps back to 12.5px — a 1.5 jump between question and
  answer.
- **The mono promise was not true either.** A comment claimed anything factual
  is set in mono; the rule below it declared only `tabular-nums` and no family.
- **Focus was invisible.** It was carried entirely by border alpha 0.09→0.17
  over a near-black ground — under one 8-bit step. It is carried on the title
  bar's surface now, and unfocused bodies step back to 0.62.
- **Icons were sub-pixel.** `strokeWidth="1.5"` on a 24 viewBox renders 0.94px
  in the dock and 0.56px on the unread dot. Solved for a constant 1.35 CSS px
  at every size. Three icons also contained zero-length subpaths (`M17 14h0`)
  that drew literally nothing — the record icon read as a hamburger menu.
- **The record was not a table.** Every row was its own grid with an `auto`
  first column, so the event text began at a different x on every line. Fixed
  gutters, a real monospace time column, and the unread mark moved onto a
  reserved border so read and unread share a left edge.
- **The dock never showed the one state it exists for** — hover and open were
  the same fill. Open is a running dot now.
- **Rows had two rhythms at once**, inheriting a 2rem gap from the marketing
  site while carrying their own 16px padding, and their dividers stopped 13.6px
  short of both window edges.
- **Every kicker carried a cobalt dash** from field.css — a second blue inches
  from the accent, on a surface meant to use colour only where it means
  something. Eight inline style patches existed only to fight it and are gone.
- **Fields looked level with their container.** They are wells now: dark at the
  top lip, light at the bottom. My first attempt used a black border on a
  near-black pane, which is not an edge — the composer lost its outline
  entirely and I caught it in the browser.
- **The command palette's selected row measured 1.21:1** against its own
  background, on the most-looked-at pixels in the product.
- **Empty panes were one grey sentence in the top-left corner** of a 600px
  window, which reads as a failed load — while the conversation's own empty
  state centred properly, so one window looked composed and the rest looked
  broken in the same picture.
- Custom scrollbars, one keyboard focus ring everywhere, a selection colour,
  and status pills demoted from bordered uppercase shouting to a quiet mono
  dot-label so the title of the work can lead.

## Not done, from the same plan

Steps 8, 10b, 11 and 12 remain: halving the needs-you row and giving state a
colour ramp; the memory rows' two-column treatment; dragging on the compositor
instead of through a React render; and submit feedback plus real window
entrance/exit animation with a reduced-motion path that is not a kill switch.

225 tests, lint clean, tsc clean, build clean, smoke passing. Checked at
1512×900 and 390×844.
