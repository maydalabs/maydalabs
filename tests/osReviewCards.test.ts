import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ReviewCards, sendReviewCommand } from "@/components/os/ReviewCards";
import type { DurableProposal } from "@/lib/osReviewTypes";
import type { Locale } from "@/lib/i18n";
import { ConfirmedReviewRejection, REVIEW_GUARD_REASONS } from "@/lib/osReviewGuard";

const base: DurableProposal = {
  id: "proposal-one", company_id: "synthetic-company", actor_id: "synthetic-reviewer", turn_id: "synthetic-turn",
  revision: 1, fingerprint: "snapshot-one", status: "proposed", record_id: null,
  payload: { type: "work", title: "Synthetic draft", body: "First line.\nSecond line.", lane: "operations", kind: "draft", outwardAction: "send_email", citations: [{ sourceId: "source-one", quote: "Please prepare a draft." }] },
  sources: [{ id: "source-one", companyId: "synthetic-company", revision: "source-v1", text: "Please prepare a draft. Do not send it.", origin: "founder" }],
};
const knowledge: DurableProposal = { ...base, id: "knowledge-one", payload: { type: "knowledge", statement: "This customer uses a monthly invoice.", kind: "fact", scope: { type: "customer", label: "Synthetic customer" }, duration: { type: "until_date", date: "2026-12-31" }, citations: base.payload.citations } };
const command = { proposalId: base.id, revision: base.revision, fingerprint: base.fingerprint, action: "save_to_work" as const };
const receipt = { ...base, status: "saved" as const, record_id: "synthetic-record" };
function render(proposals: DurableProposal[], locale: Locale = "en") {
  return renderToStaticMarkup(createElement(ReviewCards, { proposals, turns: [{ id: base.turn_id, intent: { draftFormat: "email", knowledgeAssertion: "This customer uses a monthly invoice." } }], locale, onChange: () => undefined }));
}
function response(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } }); }

describe("review cards: readable review before any write", () => {
  it("renders nothing without suggestions", () => expect(render([])).toBe(""));
  it.each([undefined, [], [{ id: base.turn_id, intent: null }]])("leaves an uncaptured historical request read-only while allowing dismissal", (turns) => {
    const html = renderToStaticMarkup(createElement(ReviewCards, { proposals: [base], turns, locale: "en", onChange: () => undefined }));
    expect(html).toMatch(/disabled="">Save to Work<\/button>/);
    expect(html).toMatch(/disabled="">Edit suggestion<\/button>/);
    expect(html).not.toMatch(/disabled="">Dismiss<\/button>/);
    expect(html).toContain("has no captured request choices");
    expect(html).toContain(base.payload.type === "work" ? base.payload.body : "");
  });
  it("a shared uncertain state disables every sibling mutation while keeping previews visible", () => {
    const html = renderToStaticMarkup(createElement(ReviewCards, { proposals: [base, { ...base, id: "proposal-two" }], turns: [{ id: base.turn_id, intent: { draftFormat: "email", knowledgeAssertion: null } }], locale: "en", onChange: () => undefined, disabled: true }));
    expect(html.match(/disabled="">Save to Work<\/button>/g)).toHaveLength(2);
    expect(html.match(/disabled="">Edit suggestion<\/button>/g)).toHaveLength(2);
    expect(html.match(/disabled="">Dismiss<\/button>/g)).toHaveLength(2);
    expect(html).toContain("First line.");
  });

  for (const [locale, heading, save, confirm] of [
    ["en", "Review before saving", "Save to Work", "Add to company knowledge"],
    ["tr", "Kaydetmeden önce inceleyin", "İşlere kaydet", "Şirket bilgisine ekle"],
    ["fr", "Vérifier avant d’enregistrer", "Enregistrer dans le travail", "Ajouter aux connaissances"],
  ] as const) {
    it(`renders the draft and separate save controls in ${locale}`, () => {
      const html = render([base, knowledge], locale);
      expect(html).toContain(heading);
      expect(html).toContain(save);
      expect(html).toContain(confirm);
      expect(html).toContain("First line.\nSecond line.");
      expect(html).toContain("Please prepare a draft.");
      expect(html).toContain("Do not send it.");
      expect(html).toContain("Synthetic customer");
      expect(html).toContain("2026-12-31 (UTC)");
      expect(html).toContain('type="checkbox"');
      expect(html).not.toContain(" checked");
      expect(html).toMatch(new RegExp(`disabled="">${confirm}</button>`));
      expect(html).not.toContain("<form");
    });
  }

  it("does not silently mark source attribution as verification", () => {
    const html = render([base]);
    expect(html).toContain("not independently verified");
    expect(html).toContain("They do not verify that it is true.");
    expect(html).toContain("Saving does not approve, send or publish anything.");
    expect(html).toContain("Possible later action (not done here)");
    expect(html).toContain("send_email");
    expect(html).not.toContain("reviewed by you");
  });

  it("renders untrusted payload and source strings as text, not HTML", () => {
    const attack = "<img src=x onerror=alert(1)>";
    const html = render([{ ...base, payload: { ...base.payload, type: "work", title: attack, body: attack, lane: "ops", kind: "draft", outwardAction: null }, sources: [{ ...base.sources[0], text: `${base.sources[0].text} ${attack}` }] }]);
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script");
  });

  it("keeps long content wrap-capable and actions responsive", () => {
    const html = render([base]);
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).toContain("white-space:pre-wrap");
    expect(html).toContain("flex-wrap:wrap");
    expect(html).toContain("aria-labelledby=");
    expect(html).toContain("<blockquote");
  });

  for (const [description, proposal] of [
    ["missing source", { ...base, sources: [] }],
    ["source in another company", { ...base, sources: [{ ...base.sources[0], companyId: "other-company" }] }],
    ["quote absent from source", { ...base, sources: [{ ...base.sources[0], text: "Different source." }] }],
    ["empty citations", { ...base, payload: { ...base.payload, citations: [] } }],
  ] as const) {
    it(`does not enable Save to Work with ${description}`, () => {
      expect(render([{ ...proposal, payload: { ...proposal.payload, citations: [...proposal.payload.citations] }, sources: [...proposal.sources] }])).toMatch(/disabled="">Save to Work<\/button>/);
    });
  }

  it("saved work has a receipt and no second save button", () => {
    const html = render([receipt]);
    expect(html).toContain("Saved to Work as a draft. It has not been approved, sent or published.");
    expect(html).toContain("synthetic-record");
    expect(html).not.toContain(">Save to Work</button>");
    expect(html).not.toContain(">Dismiss</button>");
  });

  it("saved knowledge retains its scope, duration, sources and separate verification caveat", () => {
    const html = render([{ ...knowledge, status: "saved", record_id: "knowledge-record" }]);
    expect(html).toContain("Added to company knowledge with your confirmation.");
    expect(html).toContain("this is not independent verification.");
    expect(html).toContain("Synthetic customer");
    expect(html).toContain("2026-12-31 (UTC)");
    expect(html).not.toContain('type="checkbox"');
  });

  it("dismissed suggestions do not render a save control", () => {
    const html = render([{ ...base, status: "dismissed" }]);
    expect(html).toContain("No work item or company knowledge was created");
    expect(html).not.toContain("<button");
  });
});

describe("review command transport: never automatically retries", () => {
  it.each(REVIEW_GUARD_REASONS)("recognizes the explicit refusal %s without an automatic retry", async (reason) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ error: "review_rejected", reason }, 422));
    await expect(sendReviewCommand(command, fetcher)).rejects.toBeInstanceOf(ConfirmedReviewRejection);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    { error: "review_rejected", reason: "unknown" }, { error: "other", reason: "duplicate_work" },
    { error: "review_rejected" }, null,
  ])("keeps an unknown 422 body uncertain: %j", async (body) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(body, 422));
    await expect(sendReviewCommand(command, fetcher)).rejects.toThrow("review_reconciliation_required");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("sends only proposal identity, exact revision, fingerprint and the deliberate action", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ proposal: receipt }));
    await expect(sendReviewCommand(command, fetcher)).resolves.toEqual(receipt);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("/api/os/review");
    expect(options?.method).toBe("POST");
    expect(JSON.parse(String(options?.body))).toEqual(command);
    expect(String(options?.body)).not.toContain("actor_id");
    expect(String(options?.body)).not.toContain("company_id");
  });
  it("carries explicit knowledge approval only with the AddKnowledge action", async () => {
    const saved = { ...knowledge, status: "saved", record_id: "knowledge-record" };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ proposal: saved }));
    await sendReviewCommand({ ...command, proposalId: knowledge.id, action: "add_to_company_knowledge", knowledgeApproved: true }, fetcher);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ action: "add_to_company_knowledge", knowledgeApproved: true });
    const workFetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ proposal: receipt }));
    await sendReviewCommand({ ...command, knowledgeApproved: true }, workFetcher);
    expect(JSON.parse(String(workFetcher.mock.calls[0][1]?.body))).not.toHaveProperty("knowledgeApproved");
  });
  it("never manufactures knowledge approval from the action alone", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ error: "review_rejected", reason: "knowledge_approval" }, 422));
    await expect(sendReviewCommand({ ...command, action: "add_to_company_knowledge" }, fetcher)).rejects.toBeInstanceOf(ConfirmedReviewRejection);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).not.toHaveProperty("knowledgeApproved");
  });

  for (const status of [400, 401, 403, 409, 429, 500, 503]) {
    it(`requires reconciliation after HTTP ${status} without resubmitting`, async () => {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ error: "Synthetic failure" }, status));
      await expect(sendReviewCommand(command, fetcher)).rejects.toThrow("review_reconciliation_required");
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  }

  it("does not retry when a response is lost after a possible write", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("network interrupted"));
    await expect(sendReviewCommand(command, fetcher)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("does not retry invalid JSON", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("not-json", { status: 200 }));
    await expect(sendReviewCommand(command, fetcher)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  for (const [name, proposal] of [
    ["missing", undefined], ["null", null], ["wrong proposal", { ...receipt, id: "other-proposal" }],
    ["still proposed", { ...receipt, status: "proposed" }], ["no saved record", { ...receipt, record_id: null }],
    ["empty saved record", { ...receipt, record_id: "" }], ["different revision", { ...receipt, revision: 2 }],
    ["non-integer revision", { ...receipt, revision: 1.5 }], ["different fingerprint", { ...receipt, fingerprint: "changed" }],
  ] as const) {
    it(`does not present a confirmed save for ${name} response`, async () => {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ proposal }));
      await expect(sendReviewCommand(command, fetcher)).rejects.toThrow("review_reconciliation_required");
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  }

  it("an edit updates a preview, not the saved state", async () => {
    const revised = { ...base, revision: 2, fingerprint: "snapshot-two" };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ proposal: revised }));
    await expect(sendReviewCommand({ ...command, action: "revise", payload: base.payload }, fetcher)).resolves.toEqual(revised);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body)).action).toBe("revise");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("a dismissed receipt is separate from a saved receipt", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ proposal: { ...base, status: "dismissed" } }));
    await expect(sendReviewCommand({ ...command, action: "dismiss" }, fetcher)).resolves.toMatchObject({ status: "dismissed", record_id: null });
  });
});
