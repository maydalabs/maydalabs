/* Reading a feed well enough to know what is new.
 *
 * RSS and Atom, parsed for the three things a workflow needs: where an item
 * lives, what it is called, and when it appeared. Deliberately small and
 * dependency-free; anything a feed does that this cannot read is treated as
 * a page instead, which is the safe failure.
 */

export type FeedItem = { url: string; title: string; published: number | null };

function decode(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function firstMatch(block: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return null;
}

export function looksLikeFeed(body: string): boolean {
  return /<rss[\s>]|<feed[\s>]|<rdf:RDF[\s>]/i.test(body.slice(0, 2000));
}

export function parseFeed(body: string): FeedItem[] {
  const blocks = body.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  const items: FeedItem[] = [];

  for (const block of blocks) {
    // Atom puts the address in an attribute; RSS puts it in the element.
    const url =
      firstMatch(block, [
        /<link[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)["']/i,
        /<link[^>]*\bhref=["']([^"']+)["'][^>]*>/i,
        /<link[^>]*>([\s\S]*?)<\/link>/i,
        /<guid[^>]*isPermaLink=["']true["'][^>]*>([\s\S]*?)<\/guid>/i,
      ]) ?? null;
    if (!url || !/^https?:\/\//i.test(url)) continue;

    const title = firstMatch(block, [/<title[^>]*>([\s\S]*?)<\/title>/i]) ?? url;
    const dateText = firstMatch(block, [
      /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i,
      /<updated[^>]*>([\s\S]*?)<\/updated>/i,
      /<published[^>]*>([\s\S]*?)<\/published>/i,
      /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i,
    ]);
    const parsed = dateText ? Date.parse(dateText) : Number.NaN;

    items.push({ url, title: title.slice(0, 200), published: Number.isFinite(parsed) ? parsed : null });
  }

  return items;
}

/* Newest first, inside the window. Items with no date are kept: a feed that
 * omits dates should not silently produce nothing. */
export function recentItems(items: FeedItem[], windowDays: number, now: number = Date.now()): FeedItem[] {
  const floor = now - windowDays * 86_400_000;
  return items
    .filter((item) => item.published === null || item.published >= floor)
    .sort((a, b) => (b.published ?? 0) - (a.published ?? 0));
}
