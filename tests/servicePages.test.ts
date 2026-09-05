import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n";
import { SERVICE_IDS, SERVICES } from "@/lib/services";
import { SERVICE_PAGES, SERVICE_RELATED, SERVICE_SLUGS, SERVICE_UI, serviceFromSlug, servicePath } from "@/lib/servicePages";

describe("service discovery and dedicated conversion pages", () => {
  it("gives every service a stable, unique route and rejects unknown slugs", () => {
    expect(new Set(Object.values(SERVICE_SLUGS)).size).toBe(5);
    for (const id of SERVICE_IDS) {
      expect(serviceFromSlug(SERVICE_SLUGS[id])).toBe(id);
      expect(servicePath(id)).toBe(`/services/${SERVICE_SLUGS[id]}`);
      expect(servicePath(id)).not.toMatch(/[?#]/);
    }
    for (const slug of ["unknown-service", "toString", "__proto__", "", "CUSTOM-SOFTWARE"]) expect(serviceFromSlug(slug)).toBeUndefined();
  });

  for (const locale of LOCALES) {
    it(`has distinctive, complete buyer content for all five ${locale} pages`, () => {
      const pages = SERVICE_PAGES[locale];
      expect(Object.keys(pages).sort()).toEqual([...SERVICE_IDS].sort());
      expect(new Set(Object.values(pages).map(page => page.headline)).size).toBe(5);
      expect(new Set(Object.values(pages).map(page => page.start)).size).toBe(5);
      for (const service of SERVICES[locale]) {
        const page = pages[service.id];
        expect(page.fit).toHaveLength(3);
        expect(page.scope).toHaveLength(service.deliverables.length);
        expect(page.faq).toHaveLength(3);
        for (const text of [page.headline, page.card, page.start, page.cta, page.proof, ...page.fit, ...page.scope, ...page.faq.flat()]) expect(text.length).toBeGreaterThan(10);
      }
      expect(SERVICE_UI[locale].costQ).toBeTruthy();
      expect(SERVICE_UI[locale].costA).toBeTruthy();
      expect(SERVICE_UI[locale].sample).toBeTruthy();
      expect(pages.email.proof).not.toMatch(/HodlStay|Satoshi Gazette/);
      expect(pages.automation.proof).toContain("Satoshi Gazette");
      expect(pages.software.proof).toContain("HodlStay");
    });
  }

  it("offers relevant onward routes without circular self-links", () => {
    for (const id of SERVICE_IDS) {
      expect(SERVICE_RELATED[id]).toHaveLength(2);
      expect(new Set(SERVICE_RELATED[id]).size).toBe(2);
      for (const related of SERVICE_RELATED[id]) {
        expect(SERVICE_IDS).toContain(related);
        expect(related).not.toBe(id);
      }
    }
  });

  it("keeps the complete sales journey server-rendered with native FAQ and real contact links", () => {
    for (const name of ["ServiceGallery", "ServiceLanding", "ServiceVisual"]) {
      const component = readFileSync(`components/${name}.tsx`, "utf8");
      expect(component).not.toMatch(/use client|useEffect|useState|fetch\(|supabase|server action/);
    }
    const detail = readFileSync("components/ServiceLanding.tsx", "utf8");
    expect(detail).toContain("<details");
    expect(detail).toContain('localizePath("/contact", locale)');
    expect(detail).not.toMatch(/<form|<button|\/os/);
    const route = readFileSync("app/[lang]/services/[slug]/page.tsx", "utf8");
    expect(route).toContain("generateStaticParams");
    expect(route).toContain("notFound()");
    expect(readFileSync("app/sitemap.ts", "utf8")).toContain("SERVICE_IDS.map(servicePath)");
  });
});
