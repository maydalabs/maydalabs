import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES, SITE_TITLES } from "@/lib/i18n";
import { SERVICE_IDS, SERVICE_DISPLAY_ORDER } from "@/lib/services";
import { SERVICE_FLOWS, SERVICE_FLOW_UI } from "@/lib/serviceFlow";
import { SERVICE_DIAGRAMS } from "@/lib/serviceDiagrams";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ServiceFlow } from "@/components/ServiceFlow";

describe("service-specific process illustrations", () => {
  for (const locale of LOCALES) {
    it(`explains every service in ${locale} without fake results`, () => {
      expect(Object.keys(SERVICE_FLOWS[locale]).sort()).toEqual([...SERVICE_IDS].sort());
      expect(new Set(Object.values(SERVICE_FLOWS[locale]).map(flow => flow.prepare)).size).toBe(5);
      expect(new Set(Object.values(SERVICE_FLOWS[locale]).map(flow => flow.detail)).size).toBe(5);
      for (const id of SERVICE_IDS) {
        const flow = SERVICE_FLOWS[locale][id];
        expect(flow.sources).toHaveLength(3);
        for (const text of [...flow.sources, flow.prepare, flow.review, flow.delivery, flow.detail]) expect(text.length).toBeGreaterThan(3);
        expect(JSON.stringify(flow)).not.toMatch(/\d+%|\$\d|24\/7|guaranteed/i);
      }
      expect(SERVICE_FLOW_UI[locale].heading).toBeTruthy();
      expect(Object.keys(SERVICE_DIAGRAMS[locale]).sort()).toEqual([...SERVICE_IDS].sort());
      expect(SITE_TITLES[locale]).not.toMatch(/website|web siteleri|sites web/i);
    });
  }

  it("keeps all content server-rendered and motion optional, finite and decorative", () => {
    const component = readFileSync("components/ServiceFlow.tsx", "utf8");
    expect(component).not.toMatch(/use client|useEffect|useState|fetch\(|<canvas|<iframe|<button|<form/);
    expect(component).toContain("<figcaption");
    expect(component).toContain("<ul");
    expect(component).toContain('aria-hidden="true"');
    const css = readFileSync("app/service-flow.css", "utf8");
    expect(css).toContain("prefers-reduced-motion:no-preference");
    expect(css).not.toMatch(/infinite|filter:|backdrop-filter|display:none/);
    expect(readFileSync("components/ServiceLanding.tsx", "utf8")).toContain("<ServiceFlow id={id} locale={locale}");
  });

  it("connects only the gaps between inset software layers, never a full-height rail", () => {
    const css = readFileSync("app/service-flow.css", "utf8");
    expect(css).not.toContain(".sf-layers::before");
    expect(css).toContain(".sf-layers li + li::before");
    expect(css).toContain("height:calc(var(--sf-layer-gap) + 2px)");
  });

  it("renders five different structures, not a relabelled common funnel", () => {
    const expected = { software: ["product-architecture", "sf-layers"], automation: ["approval-branch", "sf-exception"], websites: ["responsive-journey", "sf-devices"], email: ["customer-timeline", "sf-timeline"], support: ["diagnosis-repair", "sf-diagnosis"] };
    for (const locale of LOCALES) for (const id of SERVICE_IDS) {
      const html = renderToStaticMarkup(createElement(ServiceFlow, { id, locale }));
      expect(html).toContain(`data-diagram="${expected[id][0]}"`);
      expect(html).toContain(`class="${expected[id][1]}"`);
      expect(html).not.toContain("sf-network");
      expect(html.match(/data-diagram=/g)).toHaveLength(1);
      expect(html).toContain(SERVICE_FLOWS[locale][id].review);
    }
  });

  it("leads with software and automation without changing persisted IDs", () => {
    expect(SERVICE_DISPLAY_ORDER.slice(0, 2)).toEqual(["software", "automation"]);
    expect([...SERVICE_DISPLAY_ORDER].sort()).toEqual([...SERVICE_IDS].sort());
    const home = readFileSync("app/[lang]/page.tsx", "utf8");
    expect(home.indexOf('className="mc-proof-strip"')).toBeLessThan(home.indexOf("<ServiceGallery"));
    expect(home).toContain("<ConnectedFlow copy={connected.flow}");
    expect(home).toContain("mc-founder");
    expect(home).not.toContain("mehmet-e-mayda-portrait");
    expect(home).not.toContain('href="/os');
  });
});
