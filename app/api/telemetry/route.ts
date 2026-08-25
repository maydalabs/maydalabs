import { NextResponse } from "next/server";

const TARGETS = [
  { id: "hodlstay", host: "hodlstay.com", url: "https://hodlstay.com" },
  { id: "satoshi-gazette", host: "satoshigazette.org", url: "https://satoshigazette.org" },
] as const;

async function checkTarget(target: (typeof TARGETS)[number]) {
  const startedAt = Date.now();
  try {
    const response = await fetch(target.url, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(4500),
    });
    return {
      id: target.id,
      host: target.host,
      ok: response.ok,
      status: response.status,
      ms: Date.now() - startedAt,
    };
  } catch {
    return { id: target.id, host: target.host, ok: false, status: 0, ms: null };
  }
}

async function fetchBlockHeight() {
  try {
    const response = await fetch("https://mempool.space/api/blocks/tip/height", {
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return null;
    const height = Number(await response.text());
    return Number.isFinite(height) ? height : null;
  } catch {
    return null;
  }
}

async function fetchMempoolCount() {
  try {
    const response = await fetch("https://mempool.space/api/mempool", {
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { count?: number };
    return typeof payload.count === "number" && Number.isFinite(payload.count) ? payload.count : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const [checks, blockHeight, mempoolCount] = await Promise.all([
    Promise.all(TARGETS.map(checkTarget)),
    fetchBlockHeight(),
    fetchMempoolCount(),
  ]);

  return NextResponse.json(
    { checks, blockHeight, mempoolCount, at: Date.now() },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
