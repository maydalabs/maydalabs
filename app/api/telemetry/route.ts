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

export async function GET() {
  const [checks, blockHeight] = await Promise.all([
    Promise.all(TARGETS.map(checkTarget)),
    fetchBlockHeight(),
  ]);

  return NextResponse.json(
    { checks, blockHeight, at: Date.now() },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
