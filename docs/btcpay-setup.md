# BTCPay Server: from nothing to a working checkout

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

## Step 1 — Choose where it runs (15 minutes, then waiting)

**Option A, hosted by someone else. Recommended to start.**
Go to https://btcpayserver.org, open **Deployment → Third-party hosts**, and
pick one (Voltage is the best known). You get a working instance in minutes and
never touch a server. Roughly $10-30/month depending on the host; check the
current price on their page. Still non-custodial: you connect your own wallet.

**Option B, your own instance via the LunaNode launcher.**
Same page, **Deployment → LunaNode**. Create a LunaNode account, add a little
credit, and use the one-click launcher: it builds a VPS running BTCPay plus a
pruned Bitcoin node. Around $8-15/month. No command line needed. The node then
has to sync the blockchain, which takes **several hours to a day**. Do steps 2-5
after the sync finishes, or start them and expect the wallet page to be slow
until sync completes.

You have the Docker skills for a bare VPS, but you would be signing up for node
upkeep on top of everything else this month. Take A now; move to B later if you
want to own the box. Either way, write down the instance URL, for example
`https://mayda.btcpay.example`. That value is `BTCPAY_HOST`.

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
