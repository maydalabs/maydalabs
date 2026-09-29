import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ItemDocument, type ItemRecord } from "@/components/os/ItemDocument";
import { OS_DOCUMENT_COPY, OS_RECORD_COPY } from "@/components/osCopy";
import type { Locale } from "@/lib/i18n";

vi.mock("@/components/os/ItemEditor", () => ({ ItemEditor: () => null }));
vi.mock("@/components/os/ItemLifecycle", () => ({ ItemLifecycle: () => null }));

const source = {
  id: "00000000-0000-4000-8000-000000000001", companyId: "00000000-0000-4000-8000-000000000002",
  revision: "a".repeat(64), origin: "founder", text: "Please draft a note. Keep the quoted price unchanged. Do not send it.",
};
const metadata = { by: "cofounder", review: { authorship: "model", externallyVerified: false,
  citations: [{ sourceId: source.id, quote: "Keep the quoted price unchanged." }] } };
const item: ItemRecord = { id: "synthetic-work", title: "Synthetic draft", lane: "sales", kind: "draft", status: "drafted",
  required_action: "send_email", notes: "Draft text.", sources: [source], metadata, artifacts: [],
  updated_at: "2026-09-22T12:00:00Z", due_on: null, due_in_days: null };
const events = [{ event: "saved_from_review", actor: "synthetic-founder", at: "2026-09-22T12:00:00Z" }];
function render(patch: Partial<ItemRecord> = {}, locale: Locale = "en") {
  return renderToStaticMarkup(createElement(ItemDocument, { item: { ...item, ...patch }, events, locale }));
}

describe("reviewed Work documents retain readable source attribution", () => {
  it("renders the cited excerpt and full captured founder message without inventing a URL", () => {
    const html = render();
    expect(html).toContain("Captured founder message");
    expect(html).toMatch(/<blockquote[^>]*>Keep the quoted price unchanged\.<\/blockquote>/);
    expect(html).toContain(source.text);
    expect(html).toContain(source.revision);
    expect(html).toContain("not independent verification");
    expect(html).not.toContain("href=");
  });
  for (const locale of ["en", "tr", "fr"] as const) {
    it(`uses explicit attribution and the human save label in ${locale}`, () => {
      const html = render({}, locale);
      expect(html).toContain(OS_DOCUMENT_COPY[locale].founderSource);
      expect(html).toContain(OS_DOCUMENT_COPY[locale].sourceAttribution);
      expect(html).toContain(OS_RECORD_COPY[locale].events.saved_from_review);
      expect(html).not.toContain("saved_from_review");
      expect(OS_RECORD_COPY[locale].events.saved_from_review).not.toBe(OS_RECORD_COPY[locale].events.approved);
    });
  }
  it("preserves existing external URL sources alongside captured sources", () => {
    const html = render({ sources: [source, { url: "https://example.com/public-proof", title: "Public proof", chars: 1200 }] });
    expect(html).toContain('href="https://example.com/public-proof"');
    expect(html).toContain("Public proof");
    expect(html).toContain("1,200");
    expect(html).toContain("Captured founder message");
  });
  it("does not lose a valid captured source when old or malformed metadata has no usable citation", () => {
    for (const badMetadata of [null, {}, { review: { citations: [] } }, { ...metadata, review: { ...metadata.review, citations: [{ sourceId: "other", quote: "Invented excerpt" }] } },
      { ...metadata, review: { ...metadata.review, citations: [{ sourceId: source.id, quote: "Invented excerpt" }] } }]) {
      const html = render({ metadata: badMetadata });
      expect(html).toContain(source.text);
      expect(html).not.toContain("Invented excerpt");
    }
  });
  for (const [name, invalid] of [
    ["wrong origin", { ...source, origin: "model" }], ["missing company", { ...source, companyId: null }],
    ["invalid identity", { ...source, id: "https://example.com/forged-source" }], ["invalid revision", { ...source, revision: "not-a-digest" }],
    ["non-string text", { ...source, text: { html: "not text" } }], ["blank text", { ...source, text: " " }],
    ["extra forged URL", { ...source, url: "https://example.com/forged-source" }], ["oversized source", { ...source, text: "x".repeat(40001) }],
  ]) {
    it(`does not present ${name} as a captured founder source or external evidence link`, () => {
      const html = render({ sources: [invalid] });
      expect(html).not.toContain("Captured founder message");
      expect(html).not.toContain("forged-source");
      expect(html).not.toContain('<ul class="os-doc-sources"></ul>');
    });
  }
  it("escapes source and quote markup and keeps long text wrap-capable", () => {
    const attack = '<img src=x onerror="alert(1)">';
    const html = render({ sources: [{ ...source, text: attack }], metadata: { ...metadata, review: { ...metadata.review, citations: [{ sourceId: source.id, quote: attack }] } } });
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
    expect(html).toContain("white-space:pre-wrap");
    expect(html).toContain("overflow-wrap:anywhere");
  });
});
