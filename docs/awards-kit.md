# MaydaOS — awards submission kit

Everything needed to submit **maydalabs.com** to site award galleries.
Submitting is a founder action (accounts + fees); this kit makes each
submission a copy-paste job. Screenshots live in `docs/awards/`.

Last verified against production: 2026-08-25.

## The one-liner

> A studio portfolio built as a working operating system — draggable
> windows, a real shell, live product telemetry, and a Bitcoin-network
> wallpaper engine paced by the actual mempool.

## Ready-to-paste copy

**Title** (≤40 chars): `MaydaOS — the studio as an operating system`
(if too long: `MaydaOS`)

**Short description** (≤300 chars):

> MaydaLabs rebuilt its studio site as MaydaOS: a desktop with
> draggable windows, a 23-command shell, a ⌘K palette, and a ghost
> tour. The monitor pings the studio's live products; new Bitcoin
> blocks surge through ten three.js wallpapers paced by the real
> mempool. Everything on screen is functional.

**Long description** (for CSSDA "about" fields / jury notes):

> MaydaOS is the public face of MaydaLabs, an independent product and
> growth studio in Istanbul. Instead of describing our work, the site
> demonstrates it: the homepage is a small operating system where every
> surface is real. Windows drag, snap, minimize, and persist between
> visits. The shell accepts 23 commands — `proof` pings our shipped
> products and prints their live response times, `wallpaper` switches
> between ten three.js scenes, `tour` hands control to a ghost cursor
> that drives the actual UI. The system monitor and the menubar block
> ticker read from mempool.space; when a Bitcoin block is mined, a
> toast fires and the wallpaper surges. Product windows play reels
> captured from the live products themselves. The whole OS ships in
> three languages (EN/TR/FR), respects reduced motion, and still
> scores 92+ mobile / 97 desktop on Lighthouse with 0 CLS.

## Facts for the form fields

| Field | Value |
| --- | --- |
| URL | https://maydalabs.com |
| Categories / tags | Portfolio · Web Interactive · Experimental · 3D / WebGL |
| Colors | `#0d0c0a` (ground) · `#f2f0ea` (ink) · `#f7931a` (Bitcoin orange) |
| Fonts | Space Grotesk · Newsreader (italic accents) · monospace (shell) |
| Technologies | Next.js 16 · React 19 · TypeScript · three.js · Tailwind 4 · WebAudio · Vercel |
| Country | Türkiye |
| Team | MaydaLabs (independent studio) |

## What to point the jury at

1. Type `help`, then `proof` in the shell — live status of shipped
   products, not claims.
2. `wallpaper 1` … `wallpaper 10` (or `?wp=` deep links) — ten scenes,
   one engine; arcs on the globe pace themselves from live mempool
   pressure.
3. Watch the block ticker in the menubar; on a new block, the whole OS
   reacts.
4. Click the tour offer — the ghost cursor drives the real desktop and
   cancels the instant a human touches anything.
5. Drag a window to an edge (snap), reload (layout persists), press ⌘K.
6. The product windows and case heroes play reels captured from the
   live products.

## Fresh performance receipts (2026-08-25, production)

- Lighthouse mobile: **92 / 100 / 100 / 100** (perf / a11y / BP / SEO)
  — LCP 3.2 s, TBT 0 ms, CLS 0
- Lighthouse desktop: **97** perf — LCP 1.0 s, TBT 0 ms, CLS 0
- Fully responsive OS: desktop windows → mobile OS home + full-screen
  shell; reduced-motion users get a static, complete experience

## Screenshots (`docs/awards/`)

- `01-desktop-globe.png` — the desktop: readme, TX-01/TX-02 reels,
  live monitor, shell, dock, planet wallpaper
- `02-case-window.png` — inner pages run inside OS window chrome
- `03-mobile-home.png` — the mobile OS home with live monitor
- `awwwards-thumb-404x316.png` — pre-sized Awwwards thumbnail

## Submission checklists

**Awwwards** (awwwards.com/submit — paid per submission)
1. Create/log in to the studio account.
2. Submit URL, title, description, thumbnail, tags from above.
3. Pick category "Portfolio"; check "Site of the Day" consideration.

**CSS Design Awards** (cssdesignawards.com/submit-your-site — paid)
1. Same copy; CSSDA also asks for a "special features" blurb — use
   "What to point the jury at" items 1–3.

**Free galleries worth the ten minutes**: Godly (godly.website),
Dark Mode Design (darkmodedesign.com), siteInspire (siteinspire.com) —
all take a URL + screenshot submission at no cost.
