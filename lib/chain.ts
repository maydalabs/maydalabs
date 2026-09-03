/* Watching the chain without running a node.
 *
 * mempool.space's public API is already the homepage Bitcoin desk's source:
 * no key, no account, no custody. Here it answers one question per invoice,
 * "how much has this address received", which is all an on-chain checkout
 * needs. Failures return null; a checkout must never claim an invoice is
 * unpaid because an API call timed out.
 */

const BASE = "https://mempool.space/api";
const TIMEOUT_MS = 8000;

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${BASE}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

type AddressStats = {
  chain_stats?: { funded_txo_sum?: number; tx_count?: number };
  mempool_stats?: { funded_txo_sum?: number; tx_count?: number };
};

type AddressTx = { txid?: string; status?: { confirmed?: boolean } };

export type AddressFunding = {
  /* Sats received in confirmed transactions. */
  confirmedSats: number;
  /* Sats received but still unconfirmed. */
  pendingSats: number;
  /* The most recent transaction paying this address, when there is one. */
  txid: string | null;
};

export async function fetchAddressFunding(address: string): Promise<AddressFunding | null> {
  const stats = await getJson<AddressStats>(`/address/${encodeURIComponent(address)}`);
  if (!stats) return null;

  const confirmedSats = Math.max(0, Math.trunc(stats.chain_stats?.funded_txo_sum ?? 0));
  const pendingSats = Math.max(0, Math.trunc(stats.mempool_stats?.funded_txo_sum ?? 0));
  if (confirmedSats === 0 && pendingSats === 0) {
    return { confirmedSats, pendingSats, txid: null };
  }

  const txs = await getJson<AddressTx[]>(`/address/${encodeURIComponent(address)}/txs`);
  const txid = Array.isArray(txs) && typeof txs[0]?.txid === "string" ? txs[0].txid : null;
  return { confirmedSats, pendingSats, txid };
}

/* Spot BTC/USD, used once to lock an invoice's price. */
export async function fetchBtcUsdRate(): Promise<number | null> {
  const prices = await getJson<{ USD?: number }>("/v1/prices");
  const usd = prices?.USD;
  return typeof usd === "number" && Number.isFinite(usd) && usd > 0 ? usd : null;
}

export function mempoolAddressUrl(address: string): string {
  return `https://mempool.space/address/${encodeURIComponent(address)}`;
}

export function mempoolTxUrl(txid: string): string {
  return `https://mempool.space/tx/${encodeURIComponent(txid)}`;
}
