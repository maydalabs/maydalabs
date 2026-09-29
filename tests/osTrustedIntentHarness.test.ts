import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModelTurn } from "../lib/osCofounder";
import { OS_TRUSTED_INTENT_CASES } from "../lib/osTrustedIntentCases";
import { opaqueIntentId } from "./helpers/osIntentHarness";
import { canonicalToolAttemptKey, runTrustedIntentAttempt } from "./helpers/osTrustedIntentHarness";

const find = (id: string) => OS_TRUSTED_INTENT_CASES.find((item) => item.id === id)!;
const done = { type: "done" as const, stopReason: "end_turn", inputTokens: 23, outputTokens: 11 };
const toolDone = { ...done, stopReason: "tool_use" };
afterEach(() => vi.unstubAllGlobals());

describe("trusted-intent in-memory harness", () => {
  it("fingerprints repeated tool arguments with recursively sorted object keys but ordered arrays", () => {
    const first = { kind: "constraint", scope: { type: "project", label: "North Loft" },
      duration: { type: "until_date", date: "2027-02-15" }, nested: [{ b: 2, a: 1 }, { c: 3 }] };
    const reordered = { nested: [{ a: 1, b: 2 }, { c: 3 }], duration: { date: "2027-02-15", type: "until_date" },
      scope: { label: "North Loft", type: "project" }, kind: "constraint" };
    expect(canonicalToolAttemptKey("propose_knowledge", first)).toBe(canonicalToolAttemptKey("propose_knowledge", reordered));
    expect(canonicalToolAttemptKey("propose_work", first)).not.toBe(canonicalToolAttemptKey("propose_knowledge", first));
    expect(canonicalToolAttemptKey("propose_knowledge", { nested: first.nested.slice().reverse() }))
      .not.toBe(canonicalToolAttemptKey("propose_knowledge", { nested: first.nested }));
  });

  it("gives Ask no tools and never writes records", async () => {
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in unit test"); }));
    const turn: ModelTurn = async function* (args) {
      expect(args.tools).toEqual([]);
      yield { type: "text", text: "Do not repeat the venue's unmeasured guarantee. Check actual outcomes first." };
      yield done;
    };
    const result = await runTrustedIntentAttempt({ item: find("trusted-01"), attempt: 1, turn, timeoutMs: 2000 });
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.proposals).toEqual([]);
    expect(result.rawModelCalls).toHaveLength(1);
    expect(result.input.system).not.toContain("trusted-01");
    expect(result.input.system).not.toContain(result.reviewCriteria[0]);
    expect(result.input.system).not.toContain(result.identity.sourceId);
    expect(result.before).toEqual(result.after);
    expect(result.writerCalls).toBe(0);
    expect(result.blockedFixtureWrites).toBe(0);
    expect(result.cleanup).toBe("disposed_verified");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("offers no knowledge tool for a quoted claim without a separate assertion", async () => {
    const turn: ModelTurn = async function* (args) {
      expect(args.tools).toEqual([]);
      yield { type: "text", text: "That leaflet's claim is unverified; I would not adopt it as company knowledge." };
      yield done;
    };
    const result = await runTrustedIntentAttempt({ item: find("trusted-04"), attempt: 4, turn, timeoutMs: 2000 });
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.proposals).toEqual([]);
    expect(result.identity.assertionSourceId).toBe(`${result.identity.sourceId}:assertion`);
  });

  it("stages only the selected new email as an unsaved review suggestion", async () => {
    const item = find("trusted-02");
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual(["propose_work"]);
        yield { type: "tool", id: "email", name: "propose_work", input: {
          title: "Email Lio about inventory checklists",
          body: "Hi Lio,\n\nWould you be available on 9 December 2026 at 14:00 UTC to look at our inventory checklists? Please let me know if that time works.\n\nBest,\nMorrow Ledger",
          lane: "customer",
        } };
        yield toolDone;
      } else {
        yield { type: "text", text: "The email is ready for review. It is neither saved nor sent." };
        yield done;
      }
    };
    const result = await runTrustedIntentAttempt({ item, attempt: 2, turn, timeoutMs: 2000 });
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].payload).toMatchObject({ type: "work", kind: "email", outwardAction: "send" });
    expect(result.proposals[0].payload.citations).toEqual([{ sourceId: result.identity.sourceId, quote: item.fixture.founderMessage }]);
    expect(result.attemptedTools[0].input).not.toHaveProperty("kind");
    expect(result.attemptedTools[0].input).not.toHaveProperty("citations");
    expect(result.writerCalls).toBe(0);
    expect(result.before).toEqual(result.after);
  });

  it("stages exact founder assertion from its distinct source only", async () => {
    const item = find("trusted-03");
    const assertion = item.typedIntent.knowledgeAssertion!;
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual(["propose_knowledge"]);
        expect(args.system).toContain(assertion);
        yield { type: "tool", id: "knowledge", name: "propose_knowledge", input: {
          kind: "constraint", scope: { type: "project", label: "Lantern Run" },
          duration: { type: "until_date", date: "2027-01-31" },
        } };
        yield toolDone;
      } else {
        yield { type: "text", text: "The exact project rule is ready for review, not saved." };
        yield done;
      }
    };
    const result = await runTrustedIntentAttempt({ item, attempt: 3, turn, timeoutMs: 2000 });
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].payload.type).toBe("knowledge");
    expect(result.proposals[0].payload).toMatchObject({ statement: assertion,
      citations: [{ sourceId: result.identity.assertionSourceId, quote: assertion }] });
    expect(result.attemptedTools[0].input).not.toHaveProperty("statement");
    expect(result.attemptedTools[0].input).not.toHaveProperty("citations");
    expect(result.proposals[0].sources.map((source) => source.id)).toContain(result.identity.assertionSourceId);
    expect(result.writerCalls).toBe(0);
    expect(result.before).toEqual(result.after);
  });

  it("flags repeated model calls even when nested argument keys arrive in a different order", async () => {
    const item = find("trusted-03");
    let rounds = 0;
    const turn: ModelTurn = async function* () {
      if (++rounds === 1) {
        yield { type: "tool", id: "first", name: "propose_knowledge", input: {
          kind: "constraint", scope: { type: "project", label: "Lantern Run" },
          duration: { type: "until_date", date: "2027-01-31" },
        } };
        yield { type: "tool", id: "second", name: "propose_knowledge", input: {
          duration: { date: "2027-01-31", type: "until_date" },
          scope: { label: "Lantern Run", type: "project" }, kind: "constraint",
        } };
        yield toolDone;
      } else {
        yield { type: "text", text: "A single project rule is ready for review." };
        yield done;
      }
    };
    const result = await runTrustedIntentAttempt({ item, attempt: 13, turn, timeoutMs: 2000 });
    expect(result.status).toBe("completed");
    expect(result.attemptedTools).toHaveLength(2);
    expect(result.structuralFindings).toContain("Repeated tool attempt: propose_knowledge");
    expect(result.writerCalls).toBe(0);
    expect(result.before).toEqual(result.after);
  });

  it("rejects model attempts to smuggle knowledge provenance or change the selected draft format", async () => {
    const knowledge = find("trusted-03");
    let rounds = 0;
    const wrongSource: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual(["propose_knowledge"]);
        yield { type: "tool", id: "wrong-source", name: "propose_knowledge", input: {
          kind: "constraint", scope: { type: "project", label: "Lantern Run" },
          duration: { type: "until_date", date: "2027-01-31" },
          citations: [{ sourceId: opaqueIntentId(7, "source"), quote: knowledge.fixture.founderMessage.slice(0, 40) }],
        } };
        yield toolDone;
      } else {
        yield { type: "text", text: "I could not prepare a knowledge suggestion." };
        yield done;
      }
    };
    const rejectedKnowledge = await runTrustedIntentAttempt({ item: knowledge, attempt: 7, turn: wrongSource, timeoutMs: 2000 });
    expect(rejectedKnowledge.status).toBe("completed");
    expect(rejectedKnowledge.proposals).toEqual([]);
    expect(rejectedKnowledge.loopEvents.some((event) => event.type === "refused")).toBe(true);

    const draft = find("trusted-02");
    rounds = 0;
    const wrongFormat: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual(["propose_work"]);
        yield { type: "tool", id: "wrong-format", name: "propose_work", input: {
          title: "Reply to Lio", body: "Hello Lio, would 9 December 2026 at 14:00 UTC work?",
          lane: "sales", kind: "reply",
        } };
        yield toolDone;
      } else {
        yield { type: "text", text: "I need to use the selected email format." };
        yield done;
      }
    };
    const rejectedDraft = await runTrustedIntentAttempt({ item: draft, attempt: 8, turn: wrongFormat, timeoutMs: 2000 });
    expect(rejectedDraft.status).toBe("completed");
    expect(rejectedDraft.proposals).toEqual([]);
    expect(rejectedDraft.loopEvents.some((event) => event.type === "refused")).toBe(true);
  });

  it("refuses an exact copy of existing open Work; no send or write occurs", async () => {
    const item = find("trusted-05");
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual(["propose_work"]);
        yield { type: "tool", id: "duplicate", name: "propose_work", input: {
          title: "Reply to Imani", body: item.fixture.openWork![0].notes,
          lane: "customer",
        } };
        yield toolDone;
      } else {
        yield { type: "text", text: "I cannot send the existing reply or create a duplicate. It remains open." };
        yield done;
      }
    };
    const result = await runTrustedIntentAttempt({ item, attempt: 5, turn, timeoutMs: 2000 });
    expect(result.status).toBe("completed");
    expect(result.proposals).toEqual([]);
    expect(result.loopEvents.some((event) => event.type === "refused")).toBe(true);
    expect(result.writerCalls).toBe(0);
    expect(result.before).toEqual(result.after);
  });

  it("keeps new Turkish reply and separately asserted project knowledge distinct", async () => {
    const item = find("trusted-06");
    const assertion = item.typedIntent.knowledgeAssertion!;
    let rounds = 0;
    const turn: ModelTurn = async function* (args) {
      if (++rounds === 1) {
        expect(args.tools).toEqual(["propose_work", "propose_knowledge"]);
        yield { type: "tool", id: "reply", name: "propose_work", input: {
          title: "Ipek'e yanıt taslağı",
          body: "Merhaba Ipek,\n\nÖrnek prop listesine 12 Ocak 2027 saat 10:30 UTC'de birlikte bakabilir miyiz? Bu saat sizin için uygun mu?\n\nSevgiler,\nMorrow Ledger",
          lane: "customer",
        } };
        yield { type: "tool", id: "rule", name: "propose_knowledge", input: {
          kind: "constraint", scope: { type: "project", label: "North Loft" },
          duration: { type: "until_date", date: "2027-02-15" },
        } };
        yield toolDone;
      } else {
        yield { type: "text", text: "Yanıt ve proje kuralı incelemeye hazır; kaydedilmedi, gönderilmedi, takvim oluşturulmadı." };
        yield done;
      }
    };
    const result = await runTrustedIntentAttempt({ item, attempt: 6, turn, timeoutMs: 2000 });
    expect(result.status).toBe("completed");
    expect(result.structuralFindings).toEqual([]);
    expect(result.proposals.map((proposal) => proposal.payload.type)).toEqual(["work", "knowledge"]);
    expect(result.proposals[1].payload).toMatchObject({ statement: assertion,
      citations: [{ sourceId: result.identity.assertionSourceId, quote: assertion }] });
    expect(result.proposals[1].sources.map((source) => source.id)).toContain(result.identity.assertionSourceId);
    expect(result.writerCalls).toBe(0);
    expect(result.before).toEqual(result.after);
  });
});
