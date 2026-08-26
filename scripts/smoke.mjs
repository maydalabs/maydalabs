const baseUrl = (process.env.SMOKE_BASE_URL || "https://maydalabs.com").replace(/\/+$/, "");
const canonicalUrl = (process.env.SMOKE_CANONICAL_URL || "https://maydalabs.com").replace(/\/+$/, "");
const baseHostname = new URL(baseUrl).hostname;
const isLocalBase = baseHostname === "localhost" || baseHostname === "127.0.0.1";
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  return fetch(new URL(path, baseUrl), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    headers: { "user-agent": "MaydaLabs production smoke check" },
    ...options,
  });
}

async function check(name, run) {
  try {
    await run();
    console.log(`✓ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.error(`✗ ${name} — ${message}`);
  }
}

const routes = [
  "/",
  "/tr",
  "/fr",
  "/services",
  "/about",
  "/profile",
  "/contact",
  "/privacy",
  "/terms",
  "/case-studies",
  "/case-studies/hodlstay",
  "/case-studies/satoshi-gazette",
  "/case-studies/mortal-vault",
  "/case-studies/sofra",
  ...(isLocalBase ? ["/en"] : []),
];

for (const path of routes) {
  await check(`${path} returns HTML`, async () => {
    const response = await request(path);
    assert(response.status === 200, `expected 200, received ${response.status}`);
    assert(response.headers.get("content-type")?.includes("text/html"), "missing HTML content type");
  });
}

const redirects = [
  ...(!isLocalBase ? [["/en", 307, "/"]] : []),
  ["/pricing", 308, "/contact"],
  ["/programs", 308, "/services"],
  ["/playbooks", 308, "/case-studies"],
  ["/newsletter", 308, "/"],
  ["/roi-quickcheck", 308, "/services"],
];

for (const [path, status, destination] of redirects) {
  await check(`${path} redirects to ${destination}`, async () => {
    const response = await request(path);
    assert(response.status === status, `expected ${status}, received ${response.status}`);
    const location = response.headers.get("location");
    assert(location, "missing Location header");
    const resolved = new URL(location, baseUrl);
    assert(`${resolved.pathname}${resolved.search}` === destination, `received ${resolved.pathname}${resolved.search}`);
  });
}

await check("English metadata is canonical and localized", async () => {
  const html = await (await request("/")).text();
  assert(html.includes("<title>MaydaLabs — Product &amp; growth studio</title>"), "unexpected English title");
  assert(html.includes(`rel="canonical" href="${canonicalUrl}"`), "missing canonical URL");
  assert(html.includes(`hrefLang="tr" href="${canonicalUrl}/tr"`), "missing Turkish alternate");
  assert(html.includes(`hrefLang="fr" href="${canonicalUrl}/fr"`), "missing French alternate");
});

await check("Turkish and French metadata is localized", async () => {
  const [turkish, french] = await Promise.all([
    request("/tr").then((response) => response.text()),
    request("/fr").then((response) => response.text()),
  ]);
  assert(turkish.includes("<title>MaydaLabs — Ürün ve büyüme stüdyosu</title>"), "unexpected Turkish title");
  assert(french.includes("<title>MaydaLabs — Studio produit et croissance</title>"), "unexpected French title");
});

await check("localized routes do not set a language-preference cookie", async () => {
  const response = await request("/tr");
  const cookie = response.headers.get("set-cookie") || "";
  assert(!cookie.includes("maydalabs_locale"), "legacy language-preference cookie is still present");
});

await check("robots and sitemap expose the public routes", async () => {
  const [robotsResponse, sitemapResponse] = await Promise.all([request("/robots.txt"), request("/sitemap.xml")]);
  assert(robotsResponse.status === 200, `robots returned ${robotsResponse.status}`);
  assert(sitemapResponse.status === 200, `sitemap returned ${sitemapResponse.status}`);
  const [robots, sitemap] = await Promise.all([robotsResponse.text(), sitemapResponse.text()]);
  assert(robots.includes(`${canonicalUrl}/sitemap.xml`), "robots does not reference the sitemap");
  for (const path of ["/tr", "/fr", "/case-studies/hodlstay", "/case-studies/sofra"]) {
    assert(sitemap.includes(`${canonicalUrl}${path}`), `sitemap is missing ${path}`);
  }
});

await check("social image endpoint returns PNG", async () => {
  const response = await request("/og?locale=en&kind=studio");
  assert(response.status === 200, `expected 200, received ${response.status}`);
  assert(response.headers.get("content-type")?.includes("image/png"), "missing PNG content type");
});

await check("telemetry endpoint returns the expected public shape", async () => {
  const response = await request("/api/telemetry");
  assert(response.status === 200, `expected 200, received ${response.status}`);
  const telemetry = await response.json();
  assert(Array.isArray(telemetry.checks), "checks is not an array");
  assert(telemetry.checks.some((check) => check.host === "hodlstay.com"), "HodlStay check is missing");
  assert(telemetry.checks.some((check) => check.host === "satoshigazette.org"), "Satoshi Gazette check is missing");
  assert(telemetry.blockHeight === null || Number.isInteger(telemetry.blockHeight), "invalid block height");
  for (const degraded of telemetry.checks.filter((check) => !check.ok)) {
    console.warn(`! telemetry degraded: ${degraded.host}`);
  }
});

if (failures.length > 0) {
  console.error(`\n${failures.length} smoke check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`\nProduction smoke checks passed for ${baseUrl}`);
}
