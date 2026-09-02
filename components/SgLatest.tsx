import type { Locale } from "@/lib/i18n";

/*
 * Live proof: the latest Satoshi Gazette pieces, read from SG's public
 * pieces API at request time (cached ten minutes). If the API is
 * unavailable the card simply omits the list — no fake data, no error.
 */

type SgPiece = {
  slug: string;
  type: string;
  category?: string;
  title: string;
  publishedAt?: string;
  status?: string;
};

const LABELS: Record<Locale, { kicker: string; live: string }> = {
  en: { kicker: "Latest from the live publication", live: "read on satoshigazette.org" },
  tr: { kicker: "Canlı yayından son içerikler", live: "satoshigazette.org'da okuyun" },
  fr: { kicker: "Dernières pièces de la publication", live: "lire sur satoshigazette.org" },
};

function pieceUrl(piece: SgPiece): string {
  const base = "https://satoshigazette.org";
  switch (piece.type) {
    case "story":
      return `${base}/stories/${piece.slug}`;
    case "wire":
    case "wire_hit":
      // Wire hits are listed on the Wire index; they have no page of their own.
      return `${base}/wire`;
    case "briefing":
      return `${base}/briefings/${piece.slug}`;
    default:
      return base;
  }
}

export async function SgLatest({ locale, limit = 3 }: { locale: Locale; limit?: number }) {
  let pieces: SgPiece[] = [];
  try {
    const response = await fetch("https://satoshigazette.org/api/pieces", {
      next: { revalidate: 600 },
      headers: { accept: "application/json" },
    });
    if (response.ok) {
      const data: unknown = await response.json();
      if (Array.isArray(data)) {
        pieces = (data as SgPiece[])
          .filter((piece) => piece && typeof piece.title === "string" && typeof piece.slug === "string")
          .filter((piece) => !piece.status || piece.status === "published")
          .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
          .slice(0, limit);
      }
    }
  } catch {
    pieces = [];
  }

  if (!pieces.length) return null;

  const labels = LABELS[locale];
  const dateFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  return (
    <div className="sg-latest" aria-label={labels.kicker}>
      <p className="mayda-kicker" style={{ margin: "0 0 0.2rem" }}>
        {labels.kicker}
      </p>
      {pieces.map((piece) => (
        <a key={piece.slug} href={pieceUrl(piece)} target="_blank" rel="noopener noreferrer">
          <strong>{piece.title}</strong>
          <small>
            {piece.type === "wire_hit" ? "wire" : piece.type}
            {piece.category ? ` · ${piece.category}` : ""}
            {piece.publishedAt ? ` · ${dateFormat.format(new Date(piece.publishedAt))}` : ""}
            {" · "}
            {labels.live} ↗
          </small>
        </a>
      ))}
    </div>
  );
}
