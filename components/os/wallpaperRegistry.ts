export const WALLPAPER_LABELS = {
  globe: "node globe — a planet of peers",
  hive: "hive lattice — cellular shield",
  gyro: "gyroscope — independent orbits",
  mycelium: "mycelium — living network",
  silk: "silk field — many routes",
  choir: "consensus choir — arcs that align",
  backbone: "backbone — the grid below",
  city: "server city — the racks at night",
  chart: "star chart — navigation without a lighthouse",
  snow: "settlement snow — the mempool as weather",
} as const;

export type WallpaperId = keyof typeof WALLPAPER_LABELS;

export const WALLPAPER_IDS = Object.keys(WALLPAPER_LABELS) as WallpaperId[];
export const DEFAULT_WALLPAPER: WallpaperId = "globe";

export function resolveWallpaperId(candidate: string | null | undefined): WallpaperId | null {
  if (!candidate) return null;
  const id = candidate.toLowerCase().trim();
  if (id in WALLPAPER_LABELS) return id as WallpaperId;
  const index = Number(id);
  if (Number.isInteger(index) && index >= 1 && index <= WALLPAPER_IDS.length) return WALLPAPER_IDS[index - 1];
  return null;
}
