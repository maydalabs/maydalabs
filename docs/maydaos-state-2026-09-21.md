# Where MaydaOS stands — 21 September 2026

An index, written when the lane moved from Claude Code back to the Codex task
**MaydaLabs — Commercial Studio & Growth**. The commercial half of that
handover lives in the Abidin repository at
`docs/maydalabs-lane-handover-2026-09-21.md`; this file is the product half,
for whoever opens this repository next.

## The claim

MaydaOS is Abidin made sellable: an AI co-founder inside a macOS-like web
operating system at `/os`. Four properties, in order — it knows your company,
it tells you what needs you, it works while you are gone, and **it never acts
alone**. The fourth is the product; the approval gate, the freeze trigger and
the column grants all exist to make it literally true.

"Trained" here means accumulated state plus a measurable prompt/context/tools
loop. It has never meant fine-tuning and must not be sold as fine-tuning.

## What is built, and where each is written up

| slice | commit | document |
|---|---|---|
| the desktop shell | `d30401c` | `maydaos-desktop-2026-09-16.md` |
| the co-founder's spine, then conversation | `b537fc2`, `236f730` | `maydaos-cofounder-2026-09-16.md`, `maydaos-cofounder-conversation-2026-09-16.md` |
| memory that accumulates | `2cba3af` | `maydaos-memory-2026-09-16.md` |
| command bar, the record, notices | `8ee011a` | `maydaos-os-features-2026-09-16.md` |
| work items as documents | `4deee09` | `maydaos-documents-2026-09-16.md` |
| the executor — finish and dismiss | `66934a7` | `maydaos-executor-2026-09-17.md` |
| the Work app | `fec9765` | `maydaos-work-app-2026-09-17.md` |
| the Brief | `1905755` | `maydaos-brief-2026-09-18.md` |
| edit and capture | `2c4c95e` | `maydaos-edit-and-capture-2026-09-18.md` |
| feels like an OS | `c4dc79e` | `maydaos-feels-like-an-os-2026-09-18.md` |
| Settings and PWA install | `690f365` | `maydaos-settings-and-install-2026-09-18.md` |
| the first input — a site lead becomes work | `c811013` | `maydaos-first-input-2026-09-19.md` |
| a brain at zero cost | `cec252f` | `maydaos-brain-at-zero-2026-09-19.md`, `maydaos-local-model.md` |
| the company is editable, the budget is not | `16bcb68` | — |
| it spoke, and the scoreboard learned to listen | `5beab5e` | `maydaos-it-spoke-2026-09-19.md` |

All of it is deployed. Migrations are applied to production through
`supabase/migrations/20260919090000_company_is_editable.sql`.

## Rules that are not negotiable

- **No model key in production.** `MAYDAOS_ANTHROPIC_API_KEY` and
  `CRON_SECRET` are unset on purpose, so the co-founder answers 503 and the
  worker 401 — honestly, and at no cost. Build, train, price, then open.
- **Nothing public leads into MaydaOS.** No link on the site reaches sign-in,
  the portal or `/os`; `npm run smoke:live` keeps all seven public pages
  honest. `robots.txt` deliberately does not disallow them: that file is
  public, so a disallow list is an index of what is hidden.
- **Grant columns, never tables.** Two holes of that class have been closed —
  `seen_at`, then `monthly_chat_usd`, each a table-level UPDATE grant exposing
  a column that is ours.
- **Production SQL is prepared here and run by Mehmet.** Transaction-wrapped,
  replay-verified against a local `db reset` first.
- **Every model-touching component stays behind its seam** — `ModelTurn` in
  `lib/osCofounder.ts`, `DraftClient` in `lib/osDraft.ts` — so the product
  stays testable against scripted fakes at zero cost.

## Running it

```bash
npm run test          # 287 tests
npm run lint
npm run build
npm run smoke:live    # the seven public pages, including what must not link
MAYDAOS_SCENARIO_MODEL=local npm run scenarios   # the six, against Ollama
```

The scenario run needs Ollama with `qwen3:14b` and `MAYDAOS_LOCAL_MODEL` in
`.env.local` — local only; `isLocalModelAllowed` refuses on Vercel. **Ollama
serves one request at a time: never run the scenarios and use the desk at
once.** A turn is about 70 seconds alone and minutes under contention.

Current score is 5 of 6, and the harness now judges what a reply *claims* as
well as what it does — the model once kept the promise in the database and
broke it in prose. With one sample per scenario it cannot tell a regression
from variance; repeats are the next improvement.

## Open, unexplained, not fixed

- A chat reply vanished from the window after arriving and returned on reload;
  it was in the database throughout. Seen once, never reproduced.
- Enter did not submit the composer under a browser tool, though the handler
  checks `event.key === "Enter"` correctly.

Both are in `maydaos-it-spoke-2026-09-19.md`. Do not report either as resolved
without evidence.

## Waiting for Mehmet in the live desk

1. Press **"Route the site's leads here"** in the Company window. Until then
   nothing on production is routed; the trigger exists and is idle.
2. Correct the company he created while testing — "corner show" should read
   "corner shop". The editor added on 19 September is how.

## Still open after the second batch

Company and account deletion (the append-only trigger fires on cascaded
deletes, so anonymising is the likely answer), an email connector, automatic
sending, teams, a desktop package — and pricing, which gates availability and
which Mehmet has deliberately pushed far out.
