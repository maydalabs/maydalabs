const baseUrl = (process.env.SMOKE_BASE_URL || "https://maydalabs.com").replace(/\/+$/, "");
const canonicalUrl = (process.env.SMOKE_CANONICAL_URL || "https://maydalabs.com").replace(/\/+$/, "");
const baseHostname = new URL(baseUrl).hostname;
const isLocalBase = baseHostname === "localhost" || baseHostname === "127.0.0.1";
const failures = [];
const serviceSlugs = ["websites-and-ecommerce", "custom-software", "ai-and-automation", "email-and-customer-journeys", "fixes-and-support"];

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
  "/start",
  "/proof",
  "/services",
  "/tr/services",
  "/fr/services",
  "/approach",
  "/tr/approach",
  "/fr/approach",
  "/about",
  "/profile",
  "/contact",
  "/auth/sign-in",
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
  ["/roi-quickcheck", 308, "/start"],
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
  assert(html.includes("<title>MaydaLabs — Websites, software &amp; automation</title>"), "unexpected English title");
  assert(html.includes(`rel="canonical" href="${canonicalUrl}"`), "missing canonical URL");
  assert(html.includes(`hrefLang="tr" href="${canonicalUrl}/tr"`), "missing Turkish alternate");
  assert(html.includes(`hrefLang="fr" href="${canonicalUrl}/fr"`), "missing French alternate");
});

await check("Turkish and French metadata is localized", async () => {
  const [turkish, french] = await Promise.all([
    request("/tr").then((response) => response.text()),
    request("/fr").then((response) => response.text()),
  ]);
  assert(turkish.includes("<title>MaydaLabs — Web siteleri, yazılım ve otomasyon</title>"), "unexpected Turkish title");
  assert(french.includes("<title>MaydaLabs — Sites web, logiciels &amp; automatisation</title>"), "unexpected French title");
});

await check("localized routes do not set a language-preference cookie", async () => {
  const response = await request("/tr");
  const cookie = response.headers.get("set-cookie") || "";
  assert(!cookie.includes("maydalabs_locale"), "legacy language-preference cookie is still present");
});

for (const prefix of ["", "/en", "/tr", "/fr"]) {
  for (const route of ["", "/desk", "/record", "/record/00000000-0000-4000-8000-000000000000", "/pilot", "/account", "/terminal"]) {
    await check(`${prefix}/os${route} does not expose beta content`, async () => {
      let response = await request(`${prefix}/os${route}`);
      // Production canonicalizes /en URLs before the private page runs.
      // Verify that redirect and then verify the destination's access gate.
      if (!isLocalBase && prefix === "/en") {
        assert(response.status === 307, `expected canonical redirect, received ${response.status}`);
        const destination = new URL(response.headers.get("location") || "", baseUrl);
        assert(destination.pathname === `/os${route}`, "wrong English beta redirect");
        response = await request(`/os${route}`);
      }
      const html = await response.text();
      assert([200, 404].includes(response.status), `unexpected status ${response.status}`);
      assert(html.includes('name="robots" content="noindex'), "missing noindex");
      assert(!html.includes('data-mayda-os="live"'), "workspace exposed");
      assert(!html.includes("Open the desk"), "public beta invitation exposed");
    });
  }
}
await check("public home does not link into MaydaOS", async () => {
  const html = await (await request("/")).text();
  assert(!/href="\/(?:en\/|tr\/|fr\/)?os(?:\/|")/.test(html), "public OS link remains");
});

await check("robots and sitemap expose the public routes", async () => {
  const [robotsResponse, sitemapResponse] = await Promise.all([request("/robots.txt"), request("/sitemap.xml")]);
  assert(robotsResponse.status === 200, `robots returned ${robotsResponse.status}`);
  assert(sitemapResponse.status === 200, `sitemap returned ${sitemapResponse.status}`);
  const [robots, sitemap] = await Promise.all([robotsResponse.text(), sitemapResponse.text()]);
  assert(robots.includes(`${canonicalUrl}/sitemap.xml`), "robots does not reference the sitemap");
  for (const path of ["/tr", "/fr", "/case-studies/hodlstay", "/case-studies/sofra", ...["", "/tr", "/fr"].flatMap(prefix => serviceSlugs.map(slug => `${prefix}/services/${slug}`))]) {
    assert(sitemap.includes(`${canonicalUrl}${path}`), `sitemap is missing ${path}`);
  }
});

await check("sitemap excludes the entire MaydaOS beta", async () => {
  const sitemap = await (await request("/sitemap.xml")).text();
  for (const prefix of ["", "/en", "/tr", "/fr"]) {
    assert(!sitemap.includes(`${canonicalUrl}${prefix}/os<`), "MaydaOS leaked into the sitemap");
  }
  for (const app of ["desk", "record", "pilot", "account", "terminal"]) {
    assert(!sitemap.includes(`${canonicalUrl}/os/${app}`), `private OS app ${app} leaked into the sitemap`);
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


for (const [prefix, label] of [["", "Websites &amp; online stores"], ["/tr", "Web siteleri ve e-ticaret"], ["/fr", "Sites web &amp; boutiques en ligne"]]) {
  await check(`${prefix || "/"} services journey and secondary Bitcoin dashboard`, async () => {
    const html = await (await request(prefix || "/")).text();
    assert(html.includes(label), "missing localized services");
    assert(html.includes('id="services"') && html.includes('id="bitcoin-dashboard"'), "missing services or Bitcoin dashboard mount");
    assert(html.indexOf('id="bitcoin-dashboard"') > html.indexOf('id="how-we-work"'), "Bitcoin dashboard precedes the main buyer journey");
    assert(!/Bitcoin payments engineering|Bitcoin ödeme mühendisliği|Ingénierie des paiements Bitcoin|\$2,500/.test(html), "retired sales offer remains");
    const response = await request(`${prefix}/services`);
    assert(response.status === 200, "services route is not canonical");
    const detail = await response.text();
    for (const id of ["websites", "software", "automation", "email", "support"]) {
      assert(detail.includes(`id="${id}"`), `missing service anchor ${id}`);
    }
    assert(detail.includes(`href="${prefix}/contact"`), "no direct contact path");
    assert(!detail.includes('href="/os'), "public beta entry found");
    const legacy = await (await request(`${prefix}/approach`)).text();
    assert(legacy.includes('id="websites"'), "legacy approach does not render new services");
    assert(legacy.includes(`rel="canonical" href="${canonicalUrl}${prefix}/services"`), "legacy approach is not canonicalized to services");
  });
}

for (const path of ["/", "/tr", "/fr"]) {
  await check(`${path} preserves the hero without replay chrome and exposes all services`, async () => {
    const html = await (await request(path)).text();
    const hero = html.slice(html.indexOf('<section class="mc-hero'), html.indexOf("</section>"));
    assert(hero.includes("mc-flow") && hero.includes("mc-copy"), "Connected flow layout is missing");
    assert(hero.includes('data-stage="settled"'), "complete static diagram is not server-rendered");
    for (const part of ["mc-prepared", "mc-approval", "mc-output-base"]) {
      assert(hero.includes(part), `missing hero part: ${part}`);
    }
    assert(!hero.includes("mc-replay") && !hero.includes("mc-motion-footer"), "unwanted replay/caption chrome remains");
    for (const slug of serviceSlugs) {
      assert(html.includes(`href="${path === "/" ? "" : path}/services/${slug}"`), `missing direct service link ${slug}`);
    }
    assert((html.match(/class="svc-card svc-card-/g) || []).length === 5, "all five service cards must be server-rendered");
  });
}

for (const prefix of ["", "/tr", "/fr"]) {
  const titles = new Set();
  for (const slug of serviceSlugs) {
    const path = `${prefix}/services/${slug}`;
    await check(`${path} has unique metadata, scope, proof and enquiry path`, async () => {
      const response = await request(path);
      assert(response.status === 200, `expected 200, received ${response.status}`);
      const html = await response.text();
      const title = html.match(/<title>(.*?)<\/title>/)?.[1];
      assert(title && !titles.has(title), "missing or duplicate service title");
      titles.add(title);
      assert((html.match(/<h1[ >]/g) || []).length === 1, "expected one service headline");
      assert(html.includes(`rel="canonical" href="${canonicalUrl}${path}"`), "wrong canonical service URL");
      for (const locale of ["tr", "fr"]) assert(html.includes(`hrefLang="${locale}" href="${canonicalUrl}/${locale}/services/${slug}"`), "missing translated service alternate");
      assert((html.match(/class="svc-scope-item"/g) || []).length === 3, "missing scoped deliverables");
      assert((html.match(/<details>/g) || []).length === 4, "missing native FAQ answers");
      assert(html.includes(`href="${prefix}/contact"`), "missing direct enquiry path");
      assert(html.includes(`href="${prefix}/services"`), "missing overview return path");
      assert(html.includes('class="svc-related-links"'), "missing related service discovery");
      assert(!/href="\/(?:tr\/|fr\/)?os(?:\/|")/.test(html), "public beta invitation exposed");
      if (slug === "email-and-customer-journeys") {
        const proof = html.slice(html.indexOf('class="svc-proof"'), html.indexOf('class="svc-faq"'));
        assert(!proof.includes("HodlStay") && !proof.includes("Satoshi Gazette"), "email service borrowed unrelated client proof");
      }
    });
  }
  await check(`${prefix}/services/unknown-service returns 404`, async () => {
    assert((await request(`${prefix}/services/unknown-service`)).status === 404, "unknown service is not a 404");
  });
}

await check("homepage stylesheet contains current services and animation rules", async () => {
  const html = await (await request("/")).text();
  const hrefs = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)]
    .map(([tag]) => tag.match(/href="([^"]+)"/)?.[1]).filter(Boolean);
  assert(hrefs.length > 0, "no stylesheet linked");
  const styles = (await Promise.all(hrefs.map(async href => {
    const response = await request(href.replaceAll("&amp;", "&"));
    assert(response.status === 200, `stylesheet returned ${response.status}`);
    return response.text();
  }))).join("\n");
  for (const rule of [".svc-card", ".svc-card-link:focus-visible", ".mc-approval", ".mc-lead", "mc-incoming", "prefers-reduced-motion"]) {
    assert(styles.includes(rule), `missing current CSS rule: ${rule}`);
  }
});

if (failures.length > 0) {
  console.error(`\n${failures.length} smoke check${failures.length === 1 ? "" : "s"} failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`\nProduction smoke checks passed for ${baseUrl}`);
}
