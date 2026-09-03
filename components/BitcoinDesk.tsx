/*
 * Bitcoin desk: the chain as MaydaLabs sees it, live. Price with a 30-day
 * sparkline, block height and age, next-block fee, hashrate, the coming
 * difficulty adjustment, and the halving countdown. Everything comes from
 * mempool.space's public API (no key), fetched on the server with short
 * revalidation and kept fresh by a small client child. Any endpoint that
 * fails simply leaves its tile out — a missing number beats a wrong one.
 */
import { BitcoinDeskLive, type DeskData, type DeskLocale } from "./BitcoinDeskLive";

const BASE = "https://mempool.space/api";

async function getJson<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const response = await fetch(`${BASE}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function getNumber(path: string, revalidate: number): Promise<number | null> {
  try {
    const response = await fetch(`${BASE}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    const parsed = Number.parseFloat((await response.text()).trim());
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type Prices = { time: number; USD: number };
type Block = { height: number; timestamp: number; tx_count: number };
type Fees = { fastestFee: number };
type Difficulty = { remainingBlocks: number; difficultyChange: number; nextRetargetHeight: number; progressPercent: number };
type Hashrate = { currentHashrate: number };
type History = { prices: { time: number; USD: number }[] };

async function loadDesk(): Promise<DeskData | null> {
  const dayAgo = Math.floor(Date.now() / 1000) - 86_400;
  const [prices, height, blocks, fees, difficulty, hashrate, dayAgoPrice, history] = await Promise.all([
    getJson<Prices>("/v1/prices", 60),
    getNumber("/blocks/tip/height", 60),
    getJson<Block[]>("/v1/blocks", 60),
    getJson<Fees>("/v1/fees/recommended", 60),
    getJson<Difficulty>("/v1/difficulty-adjustment", 300),
    getJson<Hashrate>("/v1/mining/hashrate/3d", 900),
    getJson<History>(`/v1/historical-price?currency=USD&timestamp=${dayAgo}`, 900),
    getJson<History>("/v1/historical-price?currency=USD", 3600),
  ]);

  const sparkline = Array.isArray(history?.prices)
    ? [...history!.prices]
        .filter((point) => Number.isFinite(point?.USD) && Number.isFinite(point?.time))
        .sort((a, b) => a.time - b.time)
        .slice(-30)
        .map((point) => point.USD)
    : [];

  const latest = Array.isArray(blocks) ? blocks[0] : null;

  const data: DeskData = {
    fetchedAt: Date.now(),
    priceUsd: prices?.USD ?? null,
    priceUsd24hAgo: dayAgoPrice?.prices?.[0]?.USD ?? null,
    sparkline,
    height: height ?? latest?.height ?? null,
    lastBlockAt: latest?.timestamp ?? null,
    txCount: latest?.tx_count ?? null,
    fastestFee: fees?.fastestFee ?? null,
    difficulty: difficulty
      ? {
          remainingBlocks: difficulty.remainingBlocks,
          change: difficulty.difficultyChange,
          progress: difficulty.progressPercent,
        }
      : null,
    hashrateEh: hashrate?.currentHashrate ? hashrate.currentHashrate / 1e18 : null,
  };

  if (data.priceUsd === null && data.height === null) return null;
  return data;
}

export async function BitcoinDesk({ locale = "en", className = "" }: { locale?: DeskLocale; className?: string }) {
  const data = await loadDesk();
  if (!data) return null;
  return <BitcoinDeskLive initial={data} locale={locale} className={className} />;
}
