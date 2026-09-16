# Two visual directions — 16 September 2026

Local implementation record. Mehmet looked at the desk and said it was
primitive. He was right; it was built for behaviour and left plain. This is a
real foundation plus two directions to choose between by looking rather than
by reading a description of each.

## What was actually wrong

1. Almost everything was 14px at one weight, so nothing led the eye.
2. The icons were geometric glyphs — `◆ ▶ ≡ ◈ ▣ ✦` — chosen so I would not
   have to choose an icon set. They looked like what they were.
3. Zero motion. Windows appeared and vanished; nothing acknowledged a click.
4. One surface and one border everywhere. A focused window differed from a
   background one by a border tint.
5. Cards inside cards: the panes reuse marketing components, so a bordered box
   sat inside a bordered window.
6. Empty states were centred grey sentences — the most-seen screens got the
   least attention.

## The foundation, shared by both

A type scale, a spacing scale, elevation with one light source, motion with a
`prefers-reduced-motion` escape, and a drawn icon set. Nothing below the two
theme blocks names a colour: every rule reads a token, so a direction is about
forty values rather than a rewrite.

Window controls are now invisible until the window is hovered or focused. A
title bar wearing three coloured lights at all times is louder than anything
it contains.

## The one idea both directions carry

**What the co-founder wrote is set in a serif. Everything the interface says
is sans.**

Its side of the conversation, a memory it recorded — serif. Labels, controls,
the dock, the record — sans. You can see which is which before reading a word,
with no badge announcing it. The product's argument is provenance, and this
puts it in the typography rather than in a UI element.

Source Serif 4, loaded only on the `(os)` route. The marketing site has no use
for it and does not pay for it.

## The two

**instrument** — dark, dense, typographic. Warm near-black rather than blue
grey, hairlines instead of boxes, monospace for anything factual so costs and
counts can be scanned down a column, a 7px radius, colour only where it means
something.

**desk** — light, warm paper, editorial. Windows as sheets, ink rather than
white-on-black, deep navy instead of cobalt, an 11px radius and more air.
Recognisably not another dark AI product.

The toggle sits in the menu bar and keeps its answer in the browser, not the
database: this is a decision aid, and once a direction is chosen the loser is
deleted rather than remembered. The theme is written to `<html>` by a script in
the route layout **before first paint**, so choosing the light one does not
flash dark on every reload — which also makes it external state, subscribed to
with `useSyncExternalStore` rather than mirrored into React.

## Three things found by looking

**The co-founder's icon was a sparkle.** The most worn icon in the category,
on the product whose whole argument is that it is not another chat window. An
icon that says "AI inside" before anything else has conceded the point. It is
now two overlapping rings: a partnership.

**The light direction rendered a black slab where a text field should be**, and
its outline button vanished into the paper. The panes borrow the marketing
site's form controls, which were written for one dark page; inside the desk
they now take the desk's colours.

**Memory rows wrapped inconsistently** — the retire controls landed beside the
kicker on one entry and under the sentence on the next, purely according to how
long the sentence happened to be. Where a control sits should not depend on
what it is next to; the row is a grid now.

One thing that looked like a bug and was not: after toggling, screenshots
showed the desk rendered into a corner. Measuring found `.os-root` at a full
1280×820 — a capture artefact in the browser pane at devicePixelRatio 2, fixed
by pinning an explicit viewport. Worth recording because the obvious next move
would have been to "fix" working CSS.

## Not done

- Empty states are improved but not rewritten as invitations.
- No window snapping, tiling or keyboard movement between windows.
- The record and the queue could both take more of the typographic treatment;
  the conversation got most of the attention because it is what a person looks
  at first.

222 tests, lint clean, tsc clean, build clean, smoke passing.
