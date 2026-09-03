/* Invoice vocabulary and pure money helpers.
 *
 * No node imports here: client components render from this module too.
 * Address checksum validation lives in lib/bitcoinAddress.ts, which the
 * server action uses before anything is written.
 */

export const INVOICE_STATUSES = ["open", "paid", "expired", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const SATS_PER_BTC = 100_000_000;

/* How long a quote holds. Long enough to pay comfortably, short enough
 * that the locked rate stays honest. */
export const INVOICE_TTL_HOURS = 24;

/* Sats for a USD amount at a given rate, rounded up so the invoice is
 * never short of the price it quotes. */
export function satsFromUsd(amountUsd: number, rateUsd: number): number {
  if (!Number.isFinite(amountUsd) || !Number.isFinite(rateUsd)) return 0;
  if (amountUsd <= 0 || rateUsd <= 0) return 0;
  return Math.ceil((amountUsd / rateUsd) * SATS_PER_BTC);
}

export function btcFromSats(sats: number): number {
  return sats / SATS_PER_BTC;
}

/* 12 345 678 sats as "0.12345678", the form wallets expect in BIP21. */
export function formatBtc(sats: number): string {
  return (sats / SATS_PER_BTC).toFixed(8);
}

/* Grouped sats, e.g. "2 500 000". Grouped by hand rather than through
 * toLocaleString: the separator for money must not change with whatever
 * locale data the runtime happens to carry, and it must stay a plain
 * ASCII space so copy-paste into a wallet behaves. */
export function formatSats(sats: number): string {
  const digits = Math.max(0, Math.trunc(sats)).toString();
  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }
  return groups.join("\u0020");
}

/* BIP21 payment URI. The amount is in BTC by specification. */
export function bip21Uri(address: string, sats: number, label?: string): string {
  const params = new URLSearchParams({ amount: formatBtc(sats) });
  if (label) params.set("message", label);
  return `bitcoin:${address}?${params.toString()}`;
}

export function isInvoiceExpired(expiresAt: string, now: Date = new Date()): boolean {
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry <= now.getTime();
}

/* What the client is told, derived from the record plus the clock. Kept
 * pure so both the panel and the tests agree on the wording. */
export function invoiceState(input: {
  status: InvoiceStatus;
  amountSats: number;
  observedSats: number;
  expiresAt: string;
  now?: Date;
}): "paid" | "underpaid" | "open" | "expired" | "void" {
  if (input.status === "paid") return "paid";
  if (input.status === "void") return "void";
  if (input.observedSats > 0 && input.observedSats < input.amountSats) return "underpaid";
  if (input.status === "expired" || isInvoiceExpired(input.expiresAt, input.now)) return "expired";
  return "open";
}
