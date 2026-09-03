# Logo prompt pack — for image generation (ChatGPT / any image model)

_3 September 2026. Mehmet judged the first drawn mark "very off". This pack
is what to paste into an image model, in stages. Send the result sheets
back; Claude reviews against the criteria at the bottom and redraws the
chosen direction as clean SVG for the site (favicon, header, OG card)._

## Stage 0 — paste this context first (once per chat)

> You are designing a logo mark for **MaydaLabs**, a Bitcoin-first
> operations company. What it does: AI produces the work (content, research,
> payment operations); every claim is linked to its source; **nothing goes
> out without a human approval**. The brand idea is the **approval gate**:
> many signals come in, pass through one human checkpoint, and leave as
> clean, approved output. Bitcoin matters here as **the block** and **the
> chain** (the company says "time here is measured in blocks"), not as the
> orange ₿ coin. Tone: precise, quiet, engineered, a little alive. Palette:
> near-black ground #0A0B0F, off-white #F4F7FA, accent cobalt #4B6BFF and
> mint #42F5B6. The wordmark is typographic and already exists; you are
> designing only the **mark** (symbol).
>
> Hard rules for every image: flat vector style; geometric; one consistent
> stroke weight (about one tenth of the mark's width) or solid shapes; the
> mark in a single off-white color on the near-black ground; **no text, no
> letters other than the ones I ask for, no ₿ coin, no gradients, no 3D, no
> glow, no shadows, no mockups, no background pattern**; centered, with
> generous margin; it must stay legible at 16 pixels. Output a 2×2 sheet of
> four distinct variations, 2048×2048.

## Stage 1 — three directions (run each as its own image)

**Direction A · The gate M**
> An abstract monogram M built from two vertical bars (the gate posts) and
> a single inner stroke that dips into a check mark at the center — the
> work passing through a human checkpoint. Explore: (1) sharp geometric, (2)
> rounded terminals, (3) the inner stroke as a thin signal line against
> heavier posts, (4) a solid-shape version with the check cut out as
> negative space.

**Direction B · Signal through the gate (no letter)**
> A horizontal signal line enters from the left as several converging
> strands, passes through a single vertical gate bar with a small notch,
> and continues to the right as one clean line. Explore: (1) three strands
> to one, (2) the gate as a rounded square "block" the line passes through,
> (3) the exit line ending in a small filled dot, (4) the whole thing
> inscribed in a circle.

**Direction C · The block**
> A rounded square block (one unit of the chain) with a diagonal slit
> through which a signal line passes — approval as the slit. Explore: (1)
> one block, (2) three blocks linked in a short chain forming an M
> silhouette, (3) the block with a check-shaped cut, (4) a block stack
> seen at a slight isometric angle but still flat.

## Stage 2 — refine (pick one variation, then paste)

> Take variation [N] from the last sheet. Keep the concept exactly. Make
> these changes: [heavier/lighter stroke], [more/less rounding], [tighter
> proportions — the mark should sit in a square], [remove X]. Show a 2×2
> sheet: the refined mark large; the same mark at 16 px, 32 px, and 64 px
> scale side by side; the mark inverted (near-black on off-white); the mark
> inside a rounded-square app-icon tile on the near-black ground.

## Stage 3 — color pass (only after the shape is right)

> Same mark. Render a 2×2 sheet: (1) off-white on near-black; (2) the
> stroke as a left-to-right gradient from #4B6BFF to #42F5B6 on near-black;
> (3) near-black on off-white; (4) mint #42F5B6 only, on near-black. No
> other changes.

## Stage 4 — vector handoff

> Write the chosen mark as clean SVG code: viewBox 0 0 32 32, stroke-based
> where possible, at most 6 paths, no text, no filters, stroke
> "currentColor", round caps and joins. Print only the SVG.

The image model's SVG is a starting point, not the final; Claude redraws
it by hand for pixel-alignment at 16/32 px and derives the favicon, the
Apple icon, the header lockup, and the OG card from it.

## What to send back

The Stage 1 sheets (all three directions), the variation numbers you like,
and any Stage 2/3 sheets. One line on why. Claude answers with a ranked
opinion against the criteria below, then redraws.

## Review criteria (what Claude will check)

1. Reads as one idea in under a second: gate, signal, or block.
2. Survives 16 px: no thin detail that disappears, no busy interior.
3. Not a ₿, not a generic tech swoosh, not a shield, not a chain-link
   cliché, not an M anyone else has (check: Mailchimp, Monzo, Motorola, MoMA).
4. Square footprint; balanced optical weight; works inverted.
5. One stroke weight, or one solid family — never both.
6. Has a place for motion later (a stroke that can draw itself, a dot that
   can travel).
