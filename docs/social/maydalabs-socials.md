# MaydaLabs socials — setup kit

_3 September 2026. Everything here is prepared for Mehmet to create or
update the accounts himself (account creation is his action). Copy is a
draft for his voice pass. Nothing is posted by anyone else, ever._

## Accounts

| Network | Handle / URL | State (3 Sep) | Action |
|---|---|---|---|
| X | `@maydalabs` · x.com/maydalabs | Page responds (200). Confirm it is ours; if not, pick `@maydalabs_` or `@mayda_labs` and update the footer link in `components/SiteFooter.tsx`. | Set avatar, banner, bio, website, location. |
| LinkedIn company page | linkedin.com/company/maydalabs | Does not exist (404). | Create page "MaydaLabs" from Mehmet's personal account; claim the `maydalabs` slug; set logo, cover, tagline, about, website, industry, size, HQ. Then add the URL to the footer. |
| GitHub | github.com/maydalabs | Exists. | Set the org avatar to the mark; profile README later. |
| Nostr / Telegram | — | Not now. | Revisit when the content lane has a month of posts. |

## Assets (in `docs/social/assets/`)

- `maydalabs-avatar-400.png` — X profile (400×400), GitHub org avatar.
- `maydalabs-avatar-300.png` — LinkedIn company logo (300×300).
- `maydalabs-banner-x-1500x500.png` — X header.
- `maydalabs-cover-linkedin-1128x191.png` — LinkedIn company cover.

All rendered from the Block gate mark on the void, brand type, one orange
dot (Bitcoin desk rule). Re-render from the HTML templates in the session
scratchpad if the mark or statement changes; the source is the same SVG
as `app/icon.svg`.

## Profile copy (drafts)

**X bio (≤160 chars):**
> Bitcoin-first operations company. AI runs the work; a human approves every action. We run Satoshi Gazette on it. Pilots open.

**X fields:** Website `maydalabs.com` · Location `Istanbul / everywhere`.

**LinkedIn tagline (≤120 chars):**
> AI runs the operation. You approve every action. Bitcoin-first operations company.

**LinkedIn about:**
> MaydaLabs installs AI-run operations for Bitcoin companies: content desks, research pipelines, payment workflows. AI produces the work; every claim is linked to its source; nothing goes out without a human approval.
>
> We run our own publication, Satoshi Gazette, on the same system, in public. Pilots are small on purpose: one workflow, a fixed price, three to four weeks, in your accounts. Bitcoin-first, not Bitcoin-only.
>
> maydalabs.com · Istanbul, everywhere.

**Industry:** IT Services and IT Consulting · **Size:** 1 · **Type:** Self-employed / Privately held · **Founded:** 2026 (or the entity date).

## Voice and rules for every post

- One observation, one number, or one thing we shipped. No slogans.
- Every number is dated and links to where it can be checked.
- Nothing about a client without their written OK. Satoshi Gazette is ours and can be named freely; its coverage is never for sale.
- No post goes out without Mehmet's approval in Abidin; he posts, then pastes the public URL back so the record is reconciled. Silence is not a signal.
- Bitcoin orange rule applies to images: only where the thing is Bitcoin.

## Cadence (first month)

- X: 1 post per working day, 1 thread per week.
- LinkedIn company page: 3 posts per week.
- Founder's personal LinkedIn: 2 posts per week, re-using company posts in his own words.
- Newsletter (LinkedIn): starts after 4 weeks of posts, weekly, "The approval desk".

## First ten posts (drafts, EN — Mehmet rewrites in his voice)

1. **Who we are.** MaydaLabs is a Bitcoin-first operations company. AI runs the work, a human approves every action. We built it for ourselves first: Satoshi Gazette runs on it, in public. Pilots are open. maydalabs.com
2. **The rule.** No approval means no external action. The AI drafts, sorts, and prepares. It cannot send, publish, or spend. The click is always human. That one rule is the whole product.
3. **Source-linked or unverified.** If a claim has no source URL, it does not publish as fact. Enforced by the pipeline, not by good intentions. maydalabs.com/proof
4. **Time is measured in blocks.** Our homepage carries a live Bitcoin desk: price, block, fee, hashrate, next difficulty change, halving countdown. Straight from mempool.space, no key, refreshed every minute.
5. **What a pilot is.** One workflow. Three to four weeks. Fixed price. In your accounts, with your approver. At the end: output volume, approval latency, source coverage, cost per piece. You keep the system either way.
6. **Satoshi Gazette by the numbers.** [N] pieces published, every one human-approved; every distribution action recorded against a public URL. Figures as of [date]. satoshigazette.org
7. **What we noticed this week** (sourced): one observation from the Bitcoin desk or the Gazette wire, with its link.
8. **Prepared for you.** When we write to a company, we build their page first: what we noticed, a sample already produced, the pilot week by week. They sign in and it's waiting. Show, then ask.
9. **Bitcoin payments, done properly.** BTCPay Server deployment, invoice-to-payout lifecycle, signed webhooks, reconciliation your accountant can read. Proof: HodlStay's production payment system.
10. **The stack, openly.** Next.js, Supabase, Postgres, Vercel, Resend, Python, Claude, BTCPay Server, mempool.space. Everything on maydalabs.com is built with what we sell.

Posts 6 and 7 must be filled from live numbers on the day; never from memory.
