/* Collecting what a run will read.
 *
 * A workflow's own sources come first, because they are the reason it can
 * run without anyone pasting anything; a feed among them is expanded into
 * the items published inside its window, newest first. Whatever the person
 * added is read after that, and the whole thing stops at the workflow's
 * source limit so one run cannot balloon.
 */

import { parseFeed, recentItems } from "@/lib/osFeeds";
import { fetchSource, isFailure, type FetchedSource, type SourceFailure } from "@/lib/osSources";
import { normalizeSourceUrl, type StandingSource } from "@/lib/os";


/* Feed items inside the window, addressed by page rather than by anchor.
 *
 * A publication whose feed points at fragments of one page — Satoshi
 * Gazette's wire does exactly this — would otherwise be read as several
 * sources that are all the same page, and the model would be handed the
 * same text three times. The fragment never reaches the server anyway.
 */
function expand(
  feedBody: string,
  options: { windowDays: number; now?: number },
): { url: string; title: string }[] {
  const out: { url: string; title: string }[] = [];
  const seenPages = new Set<string>();
  for (const item of recentItems(parseFeed(feedBody), options.windowDays, options.now)) {
    const url = normalizeSourceUrl(item.url);
    if (!url || seenPages.has(url)) continue;
    seenPages.add(url);
    out.push({ url, title: item.title });
  }
  return out;
}

export type Gathered = { sources: FetchedSource[]; failures: SourceFailure[] };

type Fetcher = (url: string) => Promise<FetchedSource | SourceFailure>;

export async function gatherSources(
  standing: StandingSource[],
  pasted: string[],
  options: { maxSources: number; windowDays: number; now?: number; fetcher?: Fetcher },
): Promise<Gathered> {
  const fetcher = options.fetcher ?? fetchSource;
  const sources: FetchedSource[] = [];
  const failures: SourceFailure[] = [];
  const seen = new Set<string>();

  const take = (source: FetchedSource): boolean => {
    if (sources.length >= options.maxSources) return false;
    if (seen.has(source.url)) return true;
    seen.add(source.url);
    sources.push(source);
    return true;
  };

  for (const entry of standing) {
    if (sources.length >= options.maxSources) break;
    if (seen.has(entry.url)) continue;

    const fetched = await fetcher(entry.url);
    if (isFailure(fetched)) {
      failures.push(fetched);
      continue;
    }

    if (fetched.feedBody) {
      seen.add(entry.url); // the feed itself is never a source
      for (const item of expand(fetched.feedBody, options)) {
        if (sources.length >= options.maxSources) break;
        if (seen.has(item.url)) continue;
        const article = await fetcher(item.url);
        if (isFailure(article)) {
          failures.push(article);
          continue;
        }
        take({ ...article, title: article.title || item.title });
      }
      continue;
    }

    take(fetched);
  }

  for (const url of pasted) {
    if (sources.length >= options.maxSources) break;
    if (seen.has(url)) continue;
    const fetched = await fetcher(url);
    if (isFailure(fetched)) {
      failures.push(fetched);
      continue;
    }
    // A feed pasted by hand behaves like one in the workflow.
    if (fetched.feedBody) {
      seen.add(url);
      for (const item of expand(fetched.feedBody, options)) {
        if (sources.length >= options.maxSources) break;
        if (seen.has(item.url)) continue;
        const article = await fetcher(item.url);
        if (isFailure(article)) failures.push(article);
        else take({ ...article, title: article.title || item.title });
      }
      continue;
    }
    take(fetched);
  }

  return { sources, failures };
}
