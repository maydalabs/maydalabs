import { describe, expect, it, vi } from "vitest";
import { reviewSnapshotNeedsDeskRefresh } from "@/components/os/CofounderApp";
import type { DurableProposal, ReviewSnapshot } from "@/lib/osReviewTypes";

vi.mock("@/components/os/OsCommandBar", () => ({ OS_ASK_EVENT: "synthetic-ask-event" }));

const proposal: DurableProposal = {
  id: "proposal-one", company_id: "company-one", actor_id: "actor-one", turn_id: "turn-one",
  revision: 1, fingerprint: "fingerprint-one", status: "proposed", record_id: null,
  payload: { type: "work", title: "Synthetic draft", body: "Review this draft.", lane: "operations", kind: "draft", outwardAction: null,
    citations: [{ sourceId: "message-one", quote: "Prepare a draft." }] },
  sources: [{ id: "message-one", companyId: "company-one", revision: "source-one", origin: "founder", text: "Prepare a draft." }],
};
const initial: ReviewSnapshot = { companyId: "company-one", actorId: "actor-one", proposals: [proposal], turns: [], messages: [] };
const saved: DurableProposal = { ...proposal, status: "saved", record_id: "record-one" };
const snapshot = (proposals: DurableProposal[]): ReviewSnapshot => ({ ...initial, proposals });

describe("confirmed reviewed saves refresh the rest of the desk", () => {
  it("refreshes after a Work save is confirmed by the reconciliation read", () => {
    expect(reviewSnapshotNeedsDeskRefresh(initial, snapshot([saved]))).toBe(true);
  });
  it("also refreshes after a lost POST response is reconciled as saved", () => {
    // A transport failure retains the old proposed snapshot. The later read,
    // not that failure, supplies the durable save that changes the desk.
    expect(reviewSnapshotNeedsDeskRefresh(initial, snapshot([saved]))).toBe(true);
  });
  it("refreshes after a knowledge save, with its independent receipt", () => {
    const knowledge: DurableProposal = { ...proposal, payload: { type: "knowledge", statement: "Use monthly invoices.", kind: "preference",
      scope: { type: "company", label: "Synthetic company" }, duration: { type: "until_changed" }, citations: proposal.payload.citations } };
    expect(reviewSnapshotNeedsDeskRefresh(snapshot([knowledge]), snapshot([{ ...knowledge, status: "saved", record_id: "memory-one" }]))).toBe(true);
  });
  it("does not refresh merely for a proposed, revised or dismissed suggestion", () => {
    for (const row of [proposal, { ...proposal, revision: 2, fingerprint: "fingerprint-two" }, { ...proposal, status: "dismissed" as const }]) {
      expect(reviewSnapshotNeedsDeskRefresh(initial, snapshot([row]))).toBe(false);
    }
  });
  it("does not manufacture a refresh after a failed request or confirmed rollback", () => {
    expect(reviewSnapshotNeedsDeskRefresh(initial, initial)).toBe(false);
    expect(reviewSnapshotNeedsDeskRefresh(initial, snapshot([]))).toBe(false);
  });
  it("does not loop for repeated reads or a full-page load already containing the save", () => {
    const loaded = snapshot([saved]);
    expect(reviewSnapshotNeedsDeskRefresh(loaded, structuredClone(loaded))).toBe(false);
  });
  it("refreshes for a second independently saved suggestion", () => {
    const second = { ...proposal, id: "proposal-two" };
    expect(reviewSnapshotNeedsDeskRefresh(snapshot([saved, second]), snapshot([saved, { ...second, status: "saved", record_id: "record-two" }]))).toBe(true);
  });
  it("can refresh after recovering an initially unavailable snapshot", () => {
    expect(reviewSnapshotNeedsDeskRefresh(null, snapshot([saved]))).toBe(true);
    expect(reviewSnapshotNeedsDeskRefresh(null, initial)).toBe(false);
  });
  it("does not adopt another actor or company's receipt", () => {
    expect(reviewSnapshotNeedsDeskRefresh(initial, { ...snapshot([saved]), actorId: "actor-two" })).toBe(false);
    expect(reviewSnapshotNeedsDeskRefresh(initial, { ...snapshot([saved]), companyId: "company-two" })).toBe(false);
    expect(reviewSnapshotNeedsDeskRefresh(initial, snapshot([{ ...saved, actor_id: "actor-two" }]))).toBe(false);
    expect(reviewSnapshotNeedsDeskRefresh(initial, snapshot([{ ...saved, company_id: "company-two" }]))).toBe(false);
  });
  it("requires a saved record, not just the saved label", () => {
    expect(reviewSnapshotNeedsDeskRefresh(initial, snapshot([{ ...saved, record_id: null }]))).toBe(false);
    expect(reviewSnapshotNeedsDeskRefresh(initial, snapshot([{ ...saved, record_id: "" }]))).toBe(false);
  });
});
