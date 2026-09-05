import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES, SITE_CHROME_COPY, localizePath } from "@/lib/i18n";
import { SERVICES, SERVICES_COPY, SERVICE_IDS } from "@/lib/services";
import { MAP_COPY } from "@/components/multiplierMapCopy";

describe("approved public services", () => {
  for (const locale of LOCALES) {
    it(`keeps five complete, matching services in ${locale}`, () => {
      expect(SERVICES[locale].map(service => service.id)).toEqual([...SERVICE_IDS]);
      for (const service of SERVICES[locale]) {
        expect(service.title.length).toBeGreaterThan(5);
        expect(service.deliverables).toHaveLength(3);
        expect(service.example.length).toBeGreaterThan(20);
        expect(localizePath(`/services#${service.id}`, locale)).toContain(`services#${service.id}`);
      }
      expect(JSON.stringify(SERVICES[locale])).not.toMatch(/bitcoin|btcpay|\$2,500|24\/7/i);
      expect(SITE_CHROME_COPY[locale].nav.some(([, href]) => href === "/services")).toBe(true);
      expect(SERVICES_COPY[locale].cta).toBeTruthy();
    });
  }

  it("puts the Bitcoin dashboard after services, work and process", () => {
    const home = readFileSync("app/[lang]/page.tsx", "utf8");
    const dashboard = home.indexOf('id="bitcoin-dashboard"');
    expect(dashboard).toBeGreaterThan(home.indexOf('id="how-we-work"'));
    expect(home.indexOf('id="how-we-work"')).toBeGreaterThan(home.indexOf('id="selected-work"'));
    expect(home.indexOf('id="selected-work"')).toBeGreaterThan(home.indexOf('id="services"'));
    expect(home).toContain("<BitcoinDesk locale={locale}");
    expect(home).not.toContain("<PaymentsFlow");
    expect(home).not.toContain("<StackStrip");
  });

  it("weaves the animation into the hero background instead of a second content row", () => {
    const home = readFileSync("app/[lang]/page.tsx", "utf8");
    const hero = home.slice(home.indexOf('<section className="mayda-hero'), home.indexOf("</section>"));
    expect(hero).toContain('className="mayda-hero-art" aria-hidden="true"');
    expect(hero).toContain("mayda-hero-copy");
    expect(hero).not.toContain("mayda-hero-grid");
    expect(hero).toContain("<SignalField />");
    expect(hero).toContain("<GateFigure />");
    expect(hero.indexOf("<GateFigure />")).toBeLessThan(hero.indexOf("mayda-hero-content"));
    const figure = readFileSync("components/GateFigure.tsx", "utf8");
    expect(figure).toContain('aria-hidden="true"');
    expect(figure).toContain('className="field-pulse"');
    const css = readFileSync("app/field.css", "utf8");
    expect(css).toContain("animation: field-pulse-flow 5.2s linear infinite");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.field-figure \.field-pulse\s*\{\s*display: none/);
    expect(css).toMatch(/\.mayda-hero-art\s*\{\s*position: absolute/);
    expect(css).toMatch(/\.mayda-hero \.mayda-hero-actions\s*\{\s*margin-top: 2rem/);
    expect(css).toContain("mask-image: linear-gradient");
    expect(readFileSync("app/brand.css", "utf8")).not.toMatch(/\.signal-field\s*\{\s*display: none/);
  });

  it("keeps old map keys readable without selling retired packages", () => {
    for (const locale of LOCALES) {
      expect(Object.keys(MAP_COPY[locale].offers)).toEqual(["multiplier_sprint", "build_partnership", "acceleration_partnership"]);
      expect(JSON.stringify(MAP_COPY[locale].offers)).not.toMatch(/Multiplier Sprint|Build Partnership|Acceleration Partnership/);
    }
  });

  it("gives case readers a direct, account-free contact path", () => {
    const caseStudy = readFileSync("components/CaseStudy.tsx", "utf8");
    expect(caseStudy).toContain('localizePath("/contact", locale)');
    expect(caseStudy).not.toContain('localizePath("/start", locale)');
  });

  it("does not reverse the old cached services redirect into a loop", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).not.toContain('source: "/services"');
    expect(config).not.toContain('source: "/approach"');
    expect(readFileSync("app/[lang]/approach/page.tsx", "utf8")).toContain('export { default, generateMetadata } from "../services/page"');
  });
});
