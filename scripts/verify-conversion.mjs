/** Read-only browser checks. Never submit a form or trigger authentication. */
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";

// Use an existing Playwright installation; do not add a production dependency.
const require = createRequire(process.env.MAYDA_BROWSER_RUNTIME || import.meta.url);
const { chromium } = require("playwright");
const origin = process.argv[2] || "http://localhost:3108";
const output = resolve(process.argv[3] || "/tmp/mayda-conversion-review");
const mode = process.argv[4] || "verify";
assert(["localhost", "127.0.0.1", "maydalabs.com"].includes(new URL(origin).hostname) || mode === "baseline", "Verification is restricted to local previews and the approved MaydaLabs site");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const slugs = ["custom-software", "ai-and-automation", "websites-and-ecommerce", "email-and-customer-journeys", "fixes-and-support"];
const structures = ["product-architecture", "approval-branch", "responsive-journey", "customer-timeline", "diagnosis-repair"];

async function inspect(path, width, { motion = "reduce", js = true, capture = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: motion, javaScriptEnabled: js });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    if (js) await page.addInitScript(() => {
      window.reviewVitals = { cls: 0, lcp: 0 };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.reviewVitals.cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.reviewVitals.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    const response = await page.goto(origin + path, { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(response.status(), 200, `${path} status`);
    assert.equal(await page.locator("h1").count(), 1, `${path} h1`);
    const measurements = await page.evaluate(() => ({
      title: document.title,
      width: innerWidth,
      height: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
      missingImages: [...document.images].filter(img => img.loading !== "lazy" && (!img.complete || img.naturalWidth === 0)).map(img => img.src),
      vitals: window.reviewVitals,
      scripts: performance.getEntriesByType("resource").filter(r => r.initiatorType === "script").map(r => ({ name: new URL(r.name).pathname, bytes: r.decodedBodySize })),
    }));
    assert.equal(measurements.overflow, false, `${path}@${width} overflow`);
    assert.deepEqual(errors, [], `${path} JS errors`);
    assert.deepEqual(measurements.missingImages, [], `${path} images`);

    if (mode !== "baseline") {
      assert.equal(await page.locator('a[href^="/os"],a[href^="/tr/os"],a[href^="/fr/os"]').count(), 0, "public OS link");
      if (slugs.some(slug => path.endsWith(slug))) {
        await page.locator(".sf-detail").waitFor({ state: "visible" });
        const serviceIndex = slugs.findIndex(slug => path.endsWith(slug));
        assert.equal(await page.locator(".sf [data-diagram]").getAttribute("data-diagram"), structures[serviceIndex]);
        assert.equal(await page.locator(".sf-network").count(), 0);
        if (serviceIndex === 0) {
          // Finish decorative motion before checking exact connector endpoints.
          await page.locator(".sf-layers").evaluate(async el => {
            await Promise.all(el.getAnimations({ subtree: true }).map(animation => animation.finished));
          });
          const connectors = await page.locator(".sf-layers").evaluate(el => {
            const nodes = [...el.children];
            return {
              rail: getComputedStyle(el, "::before").content,
              lines: nodes.slice(1).map((node, i) => {
                const current = node.getBoundingClientRect();
                const previous = nodes[i].getBoundingClientRect();
                const line = getComputedStyle(node, "::before");
                const border = parseFloat(getComputedStyle(node).borderTopWidth);
                const x = current.left + border + parseFloat(line.left);
                const top = current.top + border + parseFloat(line.top);
                return { content: line.content, x, top, bottom: top + parseFloat(line.height), previous: { left: previous.left, right: previous.right, bottom: previous.bottom }, current: { left: current.left, right: current.right, top: current.top } };
              }),
            };
          });
          assert.equal(connectors.rail, "none", "no continuous software rail");
          assert.equal(connectors.lines.length, 2);
          for (const line of connectors.lines) {
            assert.equal(line.content, '\"\"');
            assert(Math.abs(line.top - line.previous.bottom) <= 1.1, "connector starts at previous edge");
            assert(Math.abs(line.bottom - line.current.top) <= 1.1, "connector stops at next edge");
            assert(line.x > Math.max(line.current.left, line.previous.left) && line.x < Math.min(line.current.right, line.previous.right), "connector stays within both cards");
          }
        }
        assert.equal(await page.locator(".svc-hero-actions .mayda-button").count(), 1);
        await page.locator(".svc-faq summary").first().focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator(".svc-faq details").first().getAttribute("open"), "");
        if (motion === "reduce") {
          const animations = await page.locator(".sf").evaluate(el => el.getAnimations({ subtree: true }).length);
          assert.equal(animations, 0, "reduced-motion process animation");
        }
      } else if (["/", "/tr", "/fr"].includes(path)) {
        const expected = path === "/" ? "MaydaLabs — Software & automation" : path === "/tr" ? "MaydaLabs — Yazılım ve otomasyon" : "MaydaLabs — Logiciels & automatisation";
        assert.equal(measurements.title, expected);
        const first = await page.locator(".svc-card").first().getAttribute("class");
        assert(first.includes("svc-card-software"));
        assert.equal(await page.locator(".mc-proof-strip a").count(), 2);
        assert.equal(await page.locator('img[src*="portrait"],img[srcset*="portrait"]').count(), 0);
      } else if (path.endsWith("/profile")) {
        const body = await page.locator("main").innerText();
        assert(!/each application|application package|Her başvuruda|başvuru paketi|chaque candidature|CV adapté/i.test(body));
        assert.equal(await page.locator(".mayda-profile-portrait").count(), 1);
        assert.equal(await page.locator('#evidence a[href*="/case-studies/"]').count(), 4);
      } else if (path.endsWith("/about")) {
        assert.equal(await page.locator('main header a[href$="/contact"]').count(), 1);
      }
    }
    if (capture) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: join(output, `${path.replaceAll("/", "-") || "home"}-${width}.png`), fullPage: false });
      if (path === "/" && width === 390) await page.screenshot({ path: join(output, "home-mobile-full.png"), fullPage: true });
    }
    results.push({ path, motion, js, ...measurements });
  } finally { await page.close(); }
}

try {
  if (mode === "baseline") {
    for (const width of [1440, 390]) for (const path of ["/", "/services/custom-software"]) await inspect(path, width);
  } else {
    // Every service at narrow/mobile/laptop/desktop, plus all translated services.
    for (const width of [320, 390, 768, 1024, 1440]) {
      await inspect("/", width, { capture: [390, 1440].includes(width) });
      for (const slug of slugs) await inspect(`/services/${slug}`, width, { capture: [390, 1440].includes(width) });
      for (const path of ["/about", "/profile"]) await inspect(path, width, { capture: [390, 1440].includes(width) });
    }
    for (const prefix of ["/tr", "/fr"]) for (const width of [390, 1440]) {
      await inspect(prefix, width);
      for (const slug of slugs) await inspect(`${prefix}/services/${slug}`, width);
      for (const path of ["/about", "/profile"]) await inspect(prefix + path, width);
    }
    for (const slug of slugs) await inspect(`/services/${slug}`, 390, { js: false });
    for (const slug of slugs) await inspect(`/services/${slug}`, 1440, { motion: "no-preference" });
    // Follow the actual sales links, without sending an enquiry or requesting OTP.
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.locator('.svc-card-software a').click();
    await page.waitForURL("**/services/custom-software");
    await page.locator(".svc-hero-actions .mayda-button").click();
    await page.waitForURL("**/contact");
    assert(await page.locator('a[href="mailto:info@maydalabs.com"]').count() > 0);
    assert(await page.locator("form").count() > 0);
    await page.close();
  }
} finally {
  await writeFile(join(output, `${mode}.json`), JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ mode, checkedLayouts: results.length, output, pageErrors: 0, horizontalOverflow: 0, formsSubmitted: 0 }));
