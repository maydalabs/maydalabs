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
    const serviceStories = home.indexOf("<ServiceStories");
    expect(serviceStories).toBeGreaterThan(0);
    expect(home.indexOf('id="selected-work"')).toBeGreaterThan(serviceStories);
    expect(home).toContain("<BitcoinDesk locale={locale}");
    expect(home).not.toContain("<PaymentsFlow");
    expect(home).not.toContain("<StackStrip");
  });

  it("mounts the approved Connected flow before the real hero copy", () => {
    const home = readFileSync("app/[lang]/page.tsx", "utf8");
    const hero = home.slice(home.indexOf('<section className="mc-hero'), home.indexOf("</section>"));
    expect(hero).toContain("<ConnectedFlow copy={connected.flow}");
    expect(hero).toContain("mc-copy");
    expect(hero.indexOf("<ConnectedFlow")).toBeLessThan(hero.indexOf("mc-copy"));
    expect(hero).toContain('localizePath("/contact", locale)');
    expect(hero).toContain('localizePath("/case-studies", locale)');
    expect(hero).not.toMatch(/GateFigure|SignalField|<iframe/);
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
