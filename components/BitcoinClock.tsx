/*
 * Bitcoin block clock: the current tip height, fetched on the server and
 * revalidated every two minutes, then kept live by a small client child.
 * Renders nothing if mempool.space is unreachable — a missing clock is
 * better than a wrong one.
 */
import "server-only";
import { BitcoinClockLive, type BitcoinClockLocale, type BitcoinClockVariant } from "./BitcoinClockLive";

const TIP_HEIGHT_URL = "https://mempool.space/api/blocks/tip/height";

export async function BitcoinClock({
  locale = "en",
  variant = "inline",
  className = "",
}: {
  locale?: BitcoinClockLocale;
  variant?: BitcoinClockVariant;
  className?: string;
}) {
  let height: number | null = null;

  try {
    const response = await fetch(TIP_HEIGHT_URL, { next: { revalidate: 120 }, signal: AbortSignal.timeout(4000) });
    if (response.ok) {
      const parsed = Number.parseInt((await response.text()).trim(), 10);
      if (Number.isFinite(parsed) && parsed > 0) height = parsed;
    }
  } catch {
    height = null;
  }

  if (height === null) return null;

  return (
    <BitcoinClockLive
      initialHeight={height}
      locale={locale}
      variant={variant}
      className={className}
    />
  );
}
