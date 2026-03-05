export type AssetSource =
  | { kind: "image"; src: string }
  | { kind: "placeholder" };

const KNOWN_MISSING_ASSETS = new Set<string>([
  "/images/cases/airbtc-desktop.jpg",
  "/images/cases/airbtc-mobile.jpg",
  "/images/cases/satoshi-gazette-desktop.jpg",
  "/images/cases/satoshi-gazette-mobile.jpg",
  "/images/cases/coin-mining-central-desktop.jpg",
  "/images/cases/coin-mining-central-mobile.jpg",
  "/images/cases/independent-check-desktop.jpg",
  "/images/cases/independent-check-mobile.jpg"
]);

export function getCaseImageSource(src?: string): AssetSource {
  if (!src || KNOWN_MISSING_ASSETS.has(src)) {
    return { kind: "placeholder" };
  }

  return { kind: "image", src };
}
