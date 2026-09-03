"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

/*
 * Client half of the Bitcoin desk: keeps price, height, fee, and block age
 * fresh (one small poll a minute, straight from mempool.space), and flashes
 * a tile in mint when its number changes. Everything else stays as the
 * server rendered it. Labels are localized; content is numbers.
 */

export type DeskLocale = "en" | "tr" | "fr";

export type DeskData = {
  fetchedAt: number;
  priceUsd: number | null;
  priceUsd24hAgo: number | null;
  sparkline: number[];
  height: number | null;
  lastBlockAt: number | null;
  txCount: number | null;
  fastestFee: number | null;
  difficulty: { remainingBlocks: number; change: number; progress: number } | null;
  hashrateEh: number | null;
};

const TAG: Record<DeskLocale, string> = { en: "en-US", tr: "tr-TR", fr: "fr-FR" };

const COPY: Record<
  DeskLocale,
  {
    kicker: string;
    tagline: string;
    source: string;
    sparkLabel: string;
    price: string;
    perDollar: string;
    change: string;
    block: string;
    ago: (minutes: number) => string;
    tx: string;
    fee: string;
    feeUnit: string;
    nextBlock: string;
    hashrate: string;
    hashrateSub: string;
    difficulty: string;
    inBlocks: (blocks: number) => string;
    halving: string;
    blocksLeft: string;
    approx: (years: number, months: number, days: number) => string;
  }
> = {
  en: {
    kicker: "Bitcoin desk",
    tagline: "Time here is measured in blocks.",
    source: "Live from mempool.space",
    sparkLabel: "All-time",
    price: "Price",
    perDollar: "sats per dollar",
    change: "24h",
    block: "Block",
    ago: (m) => (m < 1 ? "just now" : `${m} min ago`),
    tx: "tx",
    fee: "Next-block fee",
    feeUnit: "sat/vB",
    nextBlock: "to be in the next block",
    hashrate: "Hashrate",
    hashrateSub: "3-day average",
    difficulty: "Difficulty adjustment",
    inBlocks: (b) => `in ${b} blocks`,
    halving: "Halving",
    blocksLeft: "blocks left",
    approx: (y, mo, d) => (y > 0 ? `~${y}y ${mo}m` : mo > 0 ? `~${mo}m ${d}d` : `~${d}d`),
  },
  tr: {
    kicker: "Bitcoin masası",
    tagline: "Burada zaman blokla ölçülür.",
    source: "Canlı, mempool.space",
    sparkLabel: "Tüm zamanlar",
    price: "Fiyat",
    perDollar: "dolar başına satoshi",
    change: "24s",
    block: "Blok",
    ago: (m) => (m < 1 ? "az önce" : `${m} dk önce`),
    tx: "işlem",
    fee: "Sonraki blok ücreti",
    feeUnit: "sat/vB",
    nextBlock: "sonraki bloğa girmek için",
    hashrate: "Hash gücü",
    hashrateSub: "3 günlük ortalama",
    difficulty: "Zorluk ayarı",
    inBlocks: (b) => `${b} blok sonra`,
    halving: "Yarılanma",
    blocksLeft: "blok kaldı",
    approx: (y, mo, d) => (y > 0 ? `~${y}y ${mo}a` : mo > 0 ? `~${mo}a ${d}g` : `~${d}g`),
  },
  fr: {
    kicker: "Desk Bitcoin",
    tagline: "Ici, le temps se mesure en blocs.",
    source: "En direct de mempool.space",
    sparkLabel: "Depuis le début",
    price: "Prix",
    perDollar: "sats par dollar",
    change: "24 h",
    block: "Bloc",
    ago: (m) => (m < 1 ? "à l'instant" : `il y a ${m} min`),
    tx: "tx",
    fee: "Frais prochain bloc",
    feeUnit: "sat/vB",
    nextBlock: "pour entrer dans le prochain bloc",
    hashrate: "Hashrate",
    hashrateSub: "moyenne 3 jours",
    difficulty: "Ajustement de difficulté",
    inBlocks: (b) => `dans ${b} blocs`,
    halving: "Halving",
    blocksLeft: "blocs restants",
    approx: (y, mo, d) => (y > 0 ? `~${y} a ${mo} m` : mo > 0 ? `~${mo} m ${d} j` : `~${d} j`),
  },
};

const HALVING_INTERVAL = 210_000;
const POLL_MS = 60_000;

function nextHalvingHeight(height: number): number {
  return (Math.floor(height / HALVING_INTERVAL) + 1) * HALVING_INTERVAL;
}

function splitDuration(minutes: number): { years: number; months: number; days: number } {
  const days = Math.max(0, Math.round(minutes / 1440));
  const years = Math.floor(days / 365);
  const months = Math.floor((days - years * 365) / 30);
  const remaining = days - years * 365 - months * 30;
  return { years, months, days: remaining };
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 100;
  const heightPx = 32;
  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = heightPx - ((value - min) / range) * heightPx;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="mayda-desk-spark" viewBox={`0 0 ${width} ${heightPx}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="desk-spark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4B6BFF" />
          <stop offset="1" stopColor="#F7931A" />
        </linearGradient>
        <linearGradient id="desk-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7931A" stopOpacity="0.28" />
          <stop offset="1" stopColor="#F7931A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${width} ${heightPx} L0 ${heightPx} Z`} fill="url(#desk-spark-fill)" stroke="none" />
      <path d={path} fill="none" stroke="url(#desk-spark)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function BitcoinDeskLive({ initial, locale, className = "" }: { initial: DeskData; locale: DeskLocale; className?: string }) {
  const copy = COPY[locale];
  const [data, setData] = useState<DeskData>(initial);
  const [now, setNow] = useState<number>(() => initial.fetchedAt);
  const [flash, setFlash] = useState<Record<string, number>>({});
  const previous = useRef<DeskData>(initial);

  useEffect(() => {
    let cancelled = false;
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);

    async function poll() {
      try {
        const [pricesRes, heightRes, feesRes, blocksRes] = await Promise.all([
          fetch("https://mempool.space/api/v1/prices", { cache: "no-store" }),
          fetch("https://mempool.space/api/blocks/tip/height", { cache: "no-store" }),
          fetch("https://mempool.space/api/v1/fees/recommended", { cache: "no-store" }),
          fetch("https://mempool.space/api/v1/blocks", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        const prices = pricesRes.ok ? ((await pricesRes.json()) as { USD?: number }) : null;
        const height = heightRes.ok ? Number.parseInt((await heightRes.text()).trim(), 10) : NaN;
        const fees = feesRes.ok ? ((await feesRes.json()) as { fastestFee?: number }) : null;
        const blocks = blocksRes.ok ? ((await blocksRes.json()) as { height: number; timestamp: number; tx_count: number }[]) : null;
        const latest = Array.isArray(blocks) ? blocks[0] : null;
        setData((current) => {
          const next: DeskData = {
            ...current,
            fetchedAt: Date.now(),
            priceUsd: Number.isFinite(prices?.USD) ? (prices!.USD as number) : current.priceUsd,
            height: Number.isFinite(height) ? height : current.height,
            fastestFee: Number.isFinite(fees?.fastestFee) ? (fees!.fastestFee as number) : current.fastestFee,
            lastBlockAt: latest?.timestamp ?? current.lastBlockAt,
            txCount: latest?.tx_count ?? current.txCount,
          };
          const changed: Record<string, number> = {};
          if (next.priceUsd !== previous.current.priceUsd) changed.price = Date.now();
          if (next.height !== previous.current.height) changed.block = Date.now();
          if (next.fastestFee !== previous.current.fastestFee) changed.fee = Date.now();
          previous.current = next;
          if (Object.keys(changed).length) setFlash((state) => ({ ...state, ...changed }));
          return next;
        });
        setNow(Date.now());
      } catch {
        // Keep the last good numbers; the desk never shows an error.
      }
    }

    const id = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearInterval(tick);
    };
  }, []);

  const numbers = new Intl.NumberFormat(TAG[locale]);
  const currency = new Intl.NumberFormat(TAG[locale], { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(TAG[locale], { style: "percent", maximumFractionDigits: 2, signDisplay: "exceptZero" });
  const oneDecimal = new Intl.NumberFormat(TAG[locale], { maximumFractionDigits: 1 });

  const change =
    data.priceUsd !== null && data.priceUsd24hAgo !== null && data.priceUsd24hAgo > 0
      ? (data.priceUsd - data.priceUsd24hAgo) / data.priceUsd24hAgo
      : null;
  const satsPerDollar = data.priceUsd ? Math.round(1e8 / data.priceUsd) : null;
  const minutesAgo = data.lastBlockAt !== null ? Math.max(0, Math.floor((now / 1000 - data.lastBlockAt) / 60)) : null;
  const halvingHeight = data.height !== null ? nextHalvingHeight(data.height) : null;
  const halvingBlocks = data.height !== null && halvingHeight !== null ? halvingHeight - data.height : null;
  const halvingEta = halvingBlocks !== null ? splitDuration(halvingBlocks * 10) : null;
  const difficultyEta = data.difficulty ? splitDuration(data.difficulty.remainingBlocks * 10) : null;
  const isFlashing = (key: string) => flash[key] !== undefined && now - flash[key] < 90_000;

  return (
    <section className={`mayda-desk ${className}`.trim()} aria-label={copy.kicker}>
      <div className="mayda-shell">
        <header className="mayda-desk-head">
          <p className="mayda-kicker" style={{ margin: 0 }}>
            <span className="mayda-desk-dot" aria-hidden="true" /> <Icon name="bitcoin" className="mayda-desk-btc" /> {copy.kicker}
            <span className="mayda-desk-tagline">{copy.tagline}</span>
          </p>
          <span className="mayda-mono mayda-desk-source">{copy.source}</span>
        </header>

        <div className="mayda-desk-grid">
          {data.priceUsd !== null ? (
            <div className={`mayda-desk-tile is-price ${isFlashing("price") ? "is-updated" : ""}`}>
              <Sparkline points={data.sparkline} />
              {data.sparkline.length > 1 ? <span className="mayda-desk-spark-label">{copy.sparkLabel}</span> : null}
              <span className="mayda-desk-label">{copy.price}</span>
              <strong>{currency.format(data.priceUsd)}</strong>
              <small>
                {change !== null ? <span className={change < 0 ? "is-down" : "is-up"}>{percent.format(change)} {copy.change}</span> : null}
                {satsPerDollar !== null ? (
                  <span>
                    {numbers.format(satsPerDollar)} {copy.perDollar}
                  </span>
                ) : null}
              </small>
            </div>
          ) : null}

          {data.height !== null ? (
            <div className={`mayda-desk-tile ${isFlashing("block") ? "is-updated" : ""}`}>
              <span className="mayda-desk-label">{copy.block}</span>
              <strong>{numbers.format(data.height)}</strong>
              <small>
                {minutesAgo !== null ? <span>{copy.ago(minutesAgo)}</span> : null}
                {data.txCount !== null ? (
                  <span>
                    {numbers.format(data.txCount)} {copy.tx}
                  </span>
                ) : null}
              </small>
            </div>
          ) : null}

          {data.fastestFee !== null ? (
            <div className={`mayda-desk-tile ${isFlashing("fee") ? "is-updated" : ""}`}>
              <span className="mayda-desk-label">{copy.fee}</span>
              <strong>
                {numbers.format(data.fastestFee)} <em>{copy.feeUnit}</em>
              </strong>
              <small>
                <span>{copy.nextBlock}</span>
              </small>
            </div>
          ) : null}

          {data.hashrateEh !== null ? (
            <div className="mayda-desk-tile">
              <span className="mayda-desk-label">{copy.hashrate}</span>
              <strong>
                {oneDecimal.format(data.hashrateEh)} <em>EH/s</em>
              </strong>
              <small>
                <span>{copy.hashrateSub}</span>
              </small>
            </div>
          ) : null}

          {data.difficulty ? (
            <div className="mayda-desk-tile">
              <span className="mayda-desk-label">{copy.difficulty}</span>
              <strong className={data.difficulty.change < 0 ? "is-down" : "is-up"}>{percent.format(data.difficulty.change / 100)}</strong>
              <small>
                <span>{copy.inBlocks(data.difficulty.remainingBlocks)}</span>
                {difficultyEta ? <span>{copy.approx(difficultyEta.years, difficultyEta.months, difficultyEta.days)}</span> : null}
              </small>
            </div>
          ) : null}

          {halvingBlocks !== null && halvingEta ? (
            <div className="mayda-desk-tile">
              <span className="mayda-desk-label">{copy.halving}</span>
              <strong>{numbers.format(halvingBlocks)}</strong>
              <small>
                <span>{copy.blocksLeft}</span>
                <span>{copy.approx(halvingEta.years, halvingEta.months, halvingEta.days)}</span>
              </small>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
