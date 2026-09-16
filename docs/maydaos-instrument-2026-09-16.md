# Instrument, properly — 16 September 2026

Local implementation record. Mehmet chose the instrument direction and asked
for it to look much better, mentioned three.js, and asked for it to be as
responsive as possible. The losing direction is deleted; it lives in git.

## Why not three.js

three.js is for scenes: geometry, cameras, lights, a scene graph. The desk has
none of those. It would have been ~150KB of dependency to draw one rectangle.

The backdrop is a single fullscreen fragment shader, about 3KB, no library —
one oversized triangle rather than two, so there is no seam down the middle.

**The real reason it is a shader at all is banding.** Dark gradients step
visibly on 8-bit displays, and that stepping is a great deal of why a dark
interface reads as cheap. The shader dithers below the quantisation threshold,
which a CSS gradient cannot do. The light sits off the top-left corner,
matching where every window's shadow already says it is.

It renders at 0.75 CSS pixels — it is an out-of-focus surface behind
everything, and paying for retina would cost four times the fill rate to
resolve detail that is not in the image. It stops when the tab is hidden, and
never starts at all under `prefers-reduced-motion`, where the token background
underneath is what a person sees. Movement is deliberately slow: something
that moves enough to notice while you are reading is a thing you turn off by
the end of the week.

If actual 3D objects are ever wanted in the space, three.js earns its weight
then.

## Responsiveness: defaults as shares, not pixels

The real change. A window nobody has moved is positioned as a **share of the
surface**; the moment someone drags it, it becomes pixels — because at that
point they mean *there*, not "44% of the way across". `OsWindowState.placed`
carries the distinction.

This is why it now fits a 2560px monitor and a 360px phone from the same
defaults, without measuring the viewport in an effect (which the React
compiler rightly refuses) or hardcoding a size.

Snapping came with it: a window dragged against an edge takes that half,
against the top takes the whole surface. It is the one window gesture people
already know from every desktop they have used.

## Two things found by looking

**Every saved desk broke.** Layouts stored before `placed` existed hold pixels
and say nothing about it, so they were read as shares and every window
rendered at twice the width of the screen — which is exactly what it looked
like. A share is never more than 2 and a window is never 3px wide, so the
values identify themselves; that beats a one-off migration which would have to
run against every stored desk and then be kept forever. Two tests pin both
readings, and one existing test had to be disambiguated because an unflagged
`9e9` is now read as pixels — both readings are bounded, and the test now says
which one it is checking.

**Prose ran to 1119px on a wide screen.** A window may be as wide as the
screen allows; the reading inside it stops at a measure. Set in `ch` so it
follows the type rather than a pixel guess — 64ch for what the co-founder
wrote, 110ch for the record, which is scanned rather than read.

And one smaller: at 360px the search control truncated to "Sear". Truncation
is not a short form. The bar now carries a long and a short version of both
the search label and the waiting count, and swaps below 520px.

## Also

The backdrop reports shader failures to the console in development only.
Failing silently is right for a person — the CSS background is already behind
it — and wrong for whoever is editing the shader, who otherwise cannot tell a
GLSL error from a machine without WebGL. Verified by sampling the drawing
buffer inside a frame: rgb(15,15,21) near the lamp, rgb(13,13,17) in the
vignette, drifting over 2.5s.

## Proof

Swept at 2560×1400, 1440×860, 834×1112 and 360×740: no horizontal overflow at
any size, windows laid out for the screen in front of them, the bar legible at
every width. 225 tests, lint clean, tsc clean, build clean, smoke passing.

## Not done

- No keyboard window management — no way to move between or arrange windows
  without a pointer.
- Empty states are better but still not written as invitations.
- The backdrop does not yet respond to anything except the waiting count, and
  that response is subtle enough to be theoretical.
