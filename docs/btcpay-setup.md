# Taking bitcoin payments on maydalabs.com

Two paths: a zero-cost on-chain checkout built into the site, or a BTCPay
Server instance. Step 1 compares them; steps 2-6 apply only if you choose
BTCPay.

Written 3 Sep 2026 for Mehmet, who has integrated against someone else's
BTCPay (HodlStay) but has never run an instance. Steps 1-6 are his; step 7 is
Claude's. Nothing here asks him to send a secret to anyone, including Claude.

## What BTCPay actually is

It is a server you run, not an account you sign up for. There is no
"BTCPay Inc." holding your money. The server watches the Bitcoin blockchain
for payments to addresses derived from a wallet you control, and tells your
site when an invoice is paid. Two consequences:

- Somebody has to host it. You, or a company that hosts instances for people.
- The bitcoin arrives in **your** wallet, never in BTCPay's. You connect the
  wallet watch-only, using an extended public key (xpub/zpub). BTCPay can then
  generate receive addresses and see payments, but cannot spend. **Never type a
  seed phrase into BTCPay.** If it offers to create a hot wallet, decline for
  business funds.


## Status: the zero-cost path is built and live (4 Sep 2026)

Shipped in commit `acbead2`, migration applied to production:

- Operators create an invoice at `/internal/pilots`: a label, a USD amount,
  and a **fresh receiving address pasted from any wallet you control**. No
  xpub, no processor account, no server. The rate is read from mempool.space
  and locked; the quote holds 24 hours.
- The client sees it in their portal: a scannable QR, the address, the amount
  in BTC and sats, the locked rate, and the expiry.
- "Check for payment" asks mempool.space what the address has received and
  records it. At or above the invoiced amount the invoice turns paid and the
  transaction id is stored.
- Addresses are validated by real checksum before anything is saved: bech32,
  bech32m and Base58Check, mainnet only. A single mistyped character is
  rejected.
- Payment state is not client-writable. The row-level security suite proves a
  signed-in client cannot mark their own invoice paid.

Verified end to end on 4 Sep 2026 against the real chain: an invoice created
through the operator form at the live rate, rendered in the client portal, and
flipped to paid by a chain lookup.

### Which wallets work

Any wallet that shows you a **mainnet on-chain address** works, including an
exchange deposit address (Binance and the like) or a custodial wallet's
on-chain receive address. The site only watches the chain; it does not care
what software holds the key. Lightning-only addresses and Lightning invoices
do not work, and neither does a testnet address.

Reused addresses are handled correctly (fixed 4 Sep 2026 after the first
version got it wrong). Exchanges give you one deposit address for life, so
every invoice records what the address had already received when it was
written, and payment is measured as the increase since. An address can also
carry only one invoice awaiting payment at a time, so one arriving payment
can never settle two invoices.

Two cautions about exchange addresses that are not the site's problem to fix:

- Exchanges enforce a **minimum deposit**. A small test payment under that
  minimum can be lost, not returned.
- Business income landing straight on an exchange is worse for custody and
  for the accounting story you sell. A wallet you control is the better home.

**What you still need before invoicing anyone:** a wallet to receive into. Any
wallet that shows a receive address works, including one you already have. If
you want a clean separation for the business, Sparrow on the Mac or BlueWallet
on the phone takes five minutes and costs nothing. Use a **fresh address per
invoice** so two clients are never told to pay the same one. A hardware wallet
is worth buying before the amounts get real, but it is not needed to start.

BTCPay below stays the upgrade path, for the month a client needs Lightning,
refunds, or a merchant back office.

## Step 1 — Decide what you are actually paying for

Checked on 3 Sep 2026. BTCPay's stated minimum is **2 GB RAM and 80 GB of
storage with pruning enabled**, plus Docker, and the node has to stay online
permanently or it falls behind the chain.

| Path | Real monthly cost | What you get | What you own |
| --- | --- | --- | --- |
| **No server (see below)** | **$0** | On-chain checkout on maydalabs.com | Nothing to patch |
| LunaNode `s.2`, 1-click | **$14** (2 GB RAM, 35 GB SSD; needs aggressive pruning) | Your own BTCPay, no command line | Updates, sync |
| LunaNode `c.1`, 1-click | **$20** (5 GB RAM, 100 GB SSD) | Same, comfortably within spec | Updates, sync |
| Own VPS (Hetzner, Contabo) + official Docker script | roughly €5-8, not verified today | Cheapest real BTCPay | Everything |
| Elestio managed | **from $16** plus $0.15/GB/month storage | Auto updates, auto SSL, backups | Nothing |

BTCPay's own docs quote "~$10/month" for LunaNode. LunaNode's price list does not
have a plan at that price with enough disk; the honest figure is $14, and $20 if
you want the documented 80 GB.

## The zero-cost path, and why it is not a compromise

You do not need BTCPay to take an on-chain payment. A pilot invoice needs four
things: a fresh address, a QR code, a price locked at a rate, and something that
notices when the money arrives.

All four can live in the site itself:

- Derive a fresh receive address per invoice from a **watch-only extended public
  key** of a wallet you control, held in `BTCPAY_`-style Vercel variables.
- Show the BIP21 QR and the amount, priced in USD at the rate on the day.
- Watch for payment with the **public mempool.space API**, the same source
  already feeding the homepage Bitcoin desk. No key, no account, no node.
- Mark the pilot paid at one confirmation, and record the transaction id.

Cost: nothing, forever. Custody: yours, exactly as with BTCPay, because the
private key never leaves your wallet. The address derivation gets verified
against your own wallet before it goes live: if the first five addresses the
site derives match the first five your wallet shows, the derivation is right.

What you give up compared to BTCPay: Lightning, refunds and payouts from a UI,
accounting exports, a hosted checkout page with its own timer, and
underpayment/overpayment handling beyond what we write ourselves.

**Recommendation.** Build the zero-cost on-chain checkout now, since there is no
client to invoice yet and it costs nothing to run. Add BTCPay on LunaNode `s.2`
at $14 the month a client needs Lightning, refunds, or a full merchant back
office, or the month you want to say "we run our own BTCPay" as proof for the
payments offer. HodlStay's production BTCPay lifecycle already proves that offer
today.

## About Lightning

Lightning is the wrong rail for a $2,500 pilot invoice, and it is worth being
precise about why:

- Large single payments route unreliably. Every hop needs enough outbound
  liquidity on that channel; payments in the thousands of dollars fail or split
  badly, and many nodes cap what they will forward.
- You would need that much **inbound** liquidity before the first invoice, which
  is bought, not free: a channel purchase or an LSP fee.
- A Lightning node is more operational work than a Bitcoin node, not less:
  channel management, always-on uptime, and static channel backups whose loss
  costs money.

Lightning is right for small, frequent payments: a paid newsletter, hourly
consulting, tips on Satoshi Gazette. If that day comes, the cheap route is
`phoenixd` on the same box, which handles liquidity automatically and charges
per payment, connected to BTCPay as an external node. Not now.

Whichever path you take, an instance URL, if you have one, is `BTCPAY_HOST`.

## Step 2 — Create the admin account (5 minutes)

Open the instance URL. The **first account registered becomes the admin**, so
register immediately, before anyone else finds the URL.

- Email: `info@maydalabs.com`
- Password: generated and stored in your password manager
- Then **Account → Manage account → Two-factor authentication** and turn it on

## Step 3 — Create the store (3 minutes)

**Create store** → Name `MaydaLabs` → Default currency `USD`. Prices are quoted
in dollars; the customer pays the equivalent in bitcoin at the rate at invoice
time.

Open **Settings → General**. The **Store ID** is a long string, also visible in
the browser URL as `/stores/<STORE ID>/`. Copy it. That value is
`BTCPAY_STORE_ID`. It is not a secret, but keep it tidy.

## Step 4 — Connect your wallet, watch-only (15 minutes)

In the store: **Wallets → Bitcoin → Connect an existing wallet**.

- If you have a hardware wallet, use **Connect hardware wallet** (it walks you
  through the BTCPay Vault helper app), or export the account's extended public
  key from the device and choose **Enter extended public key**.
- If you use a phone wallet you control, export its xpub/zpub and paste that.
- Match the address type to the key: a `zpub` is native segwit, an `xpub` is
  usually legacy or wrapped segwit. BTCPay shows the choice; if the addresses it
  generates do not match your wallet, the type is wrong.

**Verify before you trust it.** BTCPay shows a receive address. Confirm the same
address appears in your wallet app, send yourself a small amount, and check that
BTCPay marks it received. If the address does not match, stop and fix the
derivation; a wrong xpub means payments land somewhere you cannot spend from.

## Step 5 — API key and webhook (10 minutes)

**API key.** Account → Manage account → **API Keys → Generate key**.

- Permissions: tick only **Create invoices** (`btcpay.store.cancreateinvoice`)
  and **View invoices** (`btcpay.store.canviewinvoices`).
- Restrict it to the MaydaLabs store, not "all stores".
- The full value is shown **once**. Copy it straight into your password manager.
  That value is `BTCPAY_API_KEY`. It cannot create withdrawals, only invoices.

**Webhook.** Store → **Settings → Webhooks → Create webhook**.

- Payload URL: `https://maydalabs.com/api/btcpay/webhook`
- Events: choose specific events, tick **Invoice Settled** and
  **Invoice Expired** (add **Invoice Invalid** if offered)
- Leave automatic redelivery on
- Copy the **secret** it shows. That value is `BTCPAY_WEBHOOK_SECRET`.

The endpoint does not exist yet, so BTCPay's test delivery will return 404 until
step 7 ships. That is expected, not a mistake.

## Step 6 — Put four values into Vercel (5 minutes)

Vercel → project `maydalabs` → **Settings → Environment Variables**. Add each
for Production, Preview and Development:

| Name | Value |
| --- | --- |
| `BTCPAY_HOST` | instance URL, no trailing slash |
| `BTCPAY_STORE_ID` | from step 3 |
| `BTCPAY_API_KEY` | from step 5 |
| `BTCPAY_WEBHOOK_SECRET` | from step 5 |

Vercel only picks up new variables on a new deployment, so redeploy afterwards
(or say so and Claude pushes an empty commit).

Then tell Claude "btcpay vars are in". Do not paste the values into the chat;
they are not needed there.

## Step 7 — What Claude builds once the variables exist

- `POST /api/btcpay/invoice`: creates a BTCPay invoice for a pilot through the
  Greenfield API, priced in USD, tagged with the pilot id, and redirects the
  client to the BTCPay checkout page.
- `POST /api/btcpay/webhook`: verifies the `BTCPay-Sig` HMAC-SHA256 signature
  against `BTCPAY_WEBHOOK_SECRET`, ignores anything unsigned or replayed, and
  marks the pilot paid on `InvoiceSettled`.
- A "Pay in bitcoin" button on the proposal and pilot pages, replacing the
  current "being wired in" note in EN, TR and FR.
- An operator view of invoice state at `/internal/pilots`.
- A real end-to-end test with a small payment from Mehmet before any client
  sees it.

## Rules that do not change

- Claude never sees or types the API key, the webhook secret, the wallet seed,
  or the xpub. They live in your password manager, BTCPay, and Vercel.
- The site never holds bitcoin. BTCPay watches; your wallet holds.
- No invoice is created for a client until the pricing decision is settled.
