import { afterEach, describe, expect, it } from "vitest";
import { creditsLeft, normalizeSourceUrl, parseSourceUrls, runCostUsd, OS_MAX_SOURCES } from "@/lib/os";
import { fetchSource, isFailure } from "@/lib/osSources";
import { draftFromSources, type DraftClient } from "@/lib/osDraft";

describe("source URLs", () => {
  it("accepts ordinary http and https links", () => {
    expect(normalizeSourceUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(normalizeSourceUrl("  http://example.org/b?x=1  ")).toBe("http://example.org/b?x=1");
  });

  it("refuses anything that is not a public web page", () => {
    for (const value of [
      "file:///etc/passwd",
      "ftp://example.com/x",
      "javascript:alert(1)",
      "https://user:pass@example.com/",
      "https://localhost/admin",
      "not a url",
      "",
    ]) {
      expect(normalizeSourceUrl(value)).toBeNull();
    }
  });

  it("drops the fragment, de-duplicates, and caps the list", () => {
    expect(normalizeSourceUrl("https://example.com/a#section")).toBe("https://example.com/a");
    const many = Array.from({ length: 9 }, (_, i) => `https://example.com/${i}`).join("\n");
    expect(parseSourceUrls(many).urls).toHaveLength(OS_MAX_SOURCES);
    const duplicated = parseSourceUrls("https://example.com/a\nhttps://example.com/a");
    expect(duplicated.urls).toEqual(["https://example.com/a"]);
  });

  it("reports what it rejected so the person can fix it", () => {
    const { urls, rejected } = parseSourceUrls("https://example.com/a\nnonsense");
    expect(urls).toEqual(["https://example.com/a"]);
    expect(rejected).toEqual(["nonsense"]);
  });
});

/* Fetching URLs on behalf of a signed-in stranger is a server-side request
 * forgery hole unless private hosts are refused. */
describe("fetchSource refuses to look inside our own network", () => {
  it.each([
    "http://127.0.0.1/",
    "http://localhost/",
    "http://10.0.0.1/",
    "http://192.168.1.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
  ])("refuses %s", async (url) => {
    const result = await fetchSource(url);
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) expect(result.reason).toBe("host is not publicly routable");
  });
});

describe("credits and cost", () => {
  it("never reports a negative balance", () => {
    expect(creditsLeft(10, 3)).toBe(7);
    expect(creditsLeft(10, 12)).toBe(0);
  });

  it("prices a run at the model's published rates", () => {
    // 6 000 in, 1 000 out on Opus 5: $0.03 + $0.025.
    expect(runCostUsd(6_000, 1_000)).toBeCloseTo(0.055, 6);
    expect(runCostUsd(0, 0)).toBe(0);
  });
});

function stubClient(parsed: unknown, stopReason: string | null = "end_turn"): DraftClient {
  return {
    messages: {
      parse: async () => ({
        parsed_output: parsed as never,
        stop_reason: stopReason,
        usage: { input_tokens: 6_000, output_tokens: 1_000 },
      }),
    },
  };
}

const SOURCES = [{ url: "https://example.com/a", title: "A", text: "x".repeat(400), chars: 400 }];

describe("draftFromSources", () => {
  it("keeps a claim whose source was actually supplied", async () => {
    const result = await draftFromSources(
      "Topic",
      "note",
      SOURCES,
      stubClient({ draft: "A draft.", claims: [{ text: "A claim.", source_url: "https://example.com/a" }] }),
    );
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.claims[0].source_url).toBe("https://example.com/a");
      expect(result.inputTokens).toBe(6_000);
    }
  });

  it("strips a citation to a URL the model was never given", async () => {
    // A model naming a source it did not read is not evidence, whatever it says.
    const result = await draftFromSources(
      "Topic",
      "note",
      SOURCES,
      stubClient({ draft: "A draft.", claims: [{ text: "Invented.", source_url: "https://elsewhere.example/z" }] }),
    );
    if (!("error" in result)) expect(result.claims[0].source_url).toBeNull();
  });

  it("reports a refusal and an empty draft as errors rather than pretending", async () => {
    const refused = await draftFromSources("Topic", "note", SOURCES, stubClient(null, "refusal"));
    expect("error" in refused).toBe(true);

    const empty = await draftFromSources("Topic", "note", SOURCES, stubClient({ draft: "   ", claims: [] }));
    expect("error" in empty).toBe(true);
  });
});

/* The beta spends a MaydaLabs balance, so being signed in is not the same as
 * being allowed to spend it. */
describe("invite-only gate", () => {
  const original = process.env.MAYDAOS_ALLOWLIST;
  afterEach(() => {
    if (original === undefined) delete process.env.MAYDAOS_ALLOWLIST;
    else process.env.MAYDAOS_ALLOWLIST = original;
  });

  it("is open to anyone signed in when no list is set", async () => {
    delete process.env.MAYDAOS_ALLOWLIST;
    const { isOsAllowed, isOsInviteOnly } = await import("@/lib/osAccess");
    expect(isOsInviteOnly()).toBe(false);
    expect(isOsAllowed("anyone@example.com")).toBe(true);
  });

  it("admits only the listed emails, ignoring case and spacing", async () => {
    process.env.MAYDAOS_ALLOWLIST = " Info@maydalabs.com , friend@example.com ";
    const { isOsAllowed, isOsInviteOnly } = await import("@/lib/osAccess");
    expect(isOsInviteOnly()).toBe(true);
    expect(isOsAllowed("info@maydalabs.com")).toBe(true);
    expect(isOsAllowed("INFO@MAYDALABS.COM")).toBe(true);
    expect(isOsAllowed("friend@example.com")).toBe(true);
    expect(isOsAllowed("stranger@example.com")).toBe(false);
    expect(isOsAllowed(undefined)).toBe(false);
    expect(isOsAllowed(123)).toBe(false);
  });
});

/* Feeds are how a workflow starts reading on its own. */
describe("feed parsing", () => {
  const RSS = `<?xml version="1.0"?><rss version="2.0"><channel>
    <title>Example</title>
    <item><title>Newest</title><link>https://example.com/new</link><pubDate>Wed, 03 Sep 2026 10:00:00 GMT</pubDate></item>
    <item><title><![CDATA[Older & wiser]]></title><link>https://example.com/old</link><pubDate>Wed, 01 Jan 2020 10:00:00 GMT</pubDate></item>
  </channel></rss>`;

  const ATOM = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
    <entry><title>Atom one</title><link rel="alternate" href="https://example.org/a"/><updated>2026-09-02T10:00:00Z</updated></entry>
    <entry><title>No date</title><link href="https://example.org/b"/></entry>
  </feed>`;

  it("recognises a feed and ignores a web page", async () => {
    const { looksLikeFeed } = await import("@/lib/osFeeds");
    expect(looksLikeFeed(RSS)).toBe(true);
    expect(looksLikeFeed(ATOM)).toBe(true);
    expect(looksLikeFeed("<!doctype html><html><body>hello</body></html>")).toBe(false);
  });

  it("reads RSS items, decoding entities and CDATA", async () => {
    const { parseFeed } = await import("@/lib/osFeeds");
    const items = parseFeed(RSS);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ url: "https://example.com/new", title: "Newest" });
    expect(items[1].title).toBe("Older & wiser");
  });

  it("reads Atom entries, preferring the alternate link", async () => {
    const { parseFeed } = await import("@/lib/osFeeds");
    const items = parseFeed(ATOM);
    expect(items.map((item) => item.url)).toEqual(["https://example.org/a", "https://example.org/b"]);
    expect(items[1].published).toBeNull();
  });

  it("keeps only what is inside the window, newest first", async () => {
    const { parseFeed, recentItems } = await import("@/lib/osFeeds");
    const now = Date.parse("2026-09-04T00:00:00Z");
    const recent = recentItems(parseFeed(RSS), 7, now);
    expect(recent.map((item) => item.url)).toEqual(["https://example.com/new"]);
  });

  it("keeps undated items rather than silently producing nothing", async () => {
    const { parseFeed, recentItems } = await import("@/lib/osFeeds");
    const now = Date.parse("2026-09-04T00:00:00Z");
    const recent = recentItems(parseFeed(ATOM), 1, now);
    expect(recent.map((item) => item.url)).toContain("https://example.org/b");
  });
});

/* Gathering is what lets a workflow run without anyone pasting anything. */
describe("gatherSources", () => {
  const page = (url: string, title = "T") => ({ url, title, text: "x".repeat(400), chars: 400 });
  const FEED = `<rss><channel>
    <item><title>One</title><link>https://site.example/1</link><pubDate>Wed, 03 Sep 2026 10:00:00 GMT</pubDate></item>
    <item><title>Two</title><link>https://site.example/2</link><pubDate>Tue, 02 Sep 2026 10:00:00 GMT</pubDate></item>
    <item><title>Ancient</title><link>https://site.example/old</link><pubDate>Wed, 01 Jan 2020 10:00:00 GMT</pubDate></item>
  </channel></rss>`;
  const now = Date.parse("2026-09-04T00:00:00Z");

  function fetcherFor(map: Record<string, unknown>) {
    return async (url: string) => {
      const value = map[url];
      if (!value) return { url, reason: "could not be read" };
      return value as never;
    };
  }

  it("expands a standing feed into its recent items and skips the feed itself", async () => {
    const { gatherSources } = await import("@/lib/osGather");
    const { sources } = await gatherSources(
      [{ url: "https://site.example/feed.xml", kind: "feed" }],
      [],
      {
        maxSources: 5,
        windowDays: 7,
        now,
        fetcher: fetcherFor({
          "https://site.example/feed.xml": { url: "https://site.example/feed.xml", title: "site", text: "", chars: 0, feedBody: FEED },
          "https://site.example/1": page("https://site.example/1", "One"),
          "https://site.example/2": page("https://site.example/2", "Two"),
        }),
      },
    );
    expect(sources.map((s) => s.url)).toEqual(["https://site.example/1", "https://site.example/2"]);
  });

  it("reads standing sources before pasted ones and stops at the limit", async () => {
    const { gatherSources } = await import("@/lib/osGather");
    const { sources } = await gatherSources(
      [{ url: "https://a.example/x", kind: "page" }],
      ["https://b.example/y", "https://c.example/z"],
      {
        maxSources: 2,
        windowDays: 7,
        now,
        fetcher: fetcherFor({
          "https://a.example/x": page("https://a.example/x"),
          "https://b.example/y": page("https://b.example/y"),
          "https://c.example/z": page("https://c.example/z"),
        }),
      },
    );
    expect(sources.map((s) => s.url)).toEqual(["https://a.example/x", "https://b.example/y"]);
  });

  it("reports what it could not read instead of failing the whole run", async () => {
    const { gatherSources } = await import("@/lib/osGather");
    const { sources, failures } = await gatherSources([], ["https://good.example/a", "https://gone.example/b"], {
      maxSources: 5,
      windowDays: 7,
      now,
      fetcher: fetcherFor({ "https://good.example/a": page("https://good.example/a") }),
    });
    expect(sources).toHaveLength(1);
    expect(failures.map((f) => f.url)).toEqual(["https://gone.example/b"]);
  });

  it("never reads the same page twice", async () => {
    const { gatherSources } = await import("@/lib/osGather");
    const { sources } = await gatherSources([{ url: "https://a.example/x", kind: "page" }], ["https://a.example/x"], {
      maxSources: 5,
      windowDays: 7,
      now,
      fetcher: fetcherFor({ "https://a.example/x": page("https://a.example/x") }),
    });
    expect(sources).toHaveLength(1);
  });
});

/* A publication whose feed points at anchors on one page must not be read
 * as several identical sources. Satoshi Gazette's wire does exactly this. */
describe("feeds that point at anchors on one page", () => {
  it("reads that page once", async () => {
    const { gatherSources } = await import("@/lib/osGather");
    const anchors = `<rss><channel>
      <item><title>One</title><link>https://sg.example/wire#a</link><pubDate>Wed, 03 Sep 2026 10:00:00 GMT</pubDate></item>
      <item><title>Two</title><link>https://sg.example/wire#b</link><pubDate>Wed, 03 Sep 2026 09:00:00 GMT</pubDate></item>
      <item><title>Three</title><link>https://sg.example/stories/x</link><pubDate>Wed, 03 Sep 2026 08:00:00 GMT</pubDate></item>
    </channel></rss>`;
    const { sources } = await gatherSources([{ url: "https://sg.example/feed.xml", kind: "feed" }], [], {
      maxSources: 5,
      windowDays: 7,
      now: Date.parse("2026-09-04T00:00:00Z"),
      fetcher: async (url: string) => {
        if (url === "https://sg.example/feed.xml") {
          return { url, title: "sg", text: "", chars: 0, feedBody: anchors } as never;
        }
        return { url, title: url, text: "x".repeat(400), chars: 400 } as never;
      },
    });
    expect(sources.map((s) => s.url)).toEqual(["https://sg.example/wire", "https://sg.example/stories/x"]);
  });
});
