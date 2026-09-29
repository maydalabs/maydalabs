import { describe, expect, it, vi } from "vitest";
import { buildCompanyContext, PROPOSE_WORK_TOOL, reviewedSystemFor, type ModelTurn } from "@/lib/osCofounder";
import { runReviewedTurn, type ReviewedTurnEvent } from "@/lib/osReviewedTurn";
import { scenarioFixture } from "./helpers/scenarioFixture";

describe("reviewed co-founder quality contracts", () => {
  it("leaves format, later action and attribution to the app, while saving is not sending", () => {
    const guidance = [
      reviewedSystemFor("<company>Fictional company</company>", "draft", { draftFormat: "reply", knowledgeAssertion: null }),
      PROPOSE_WORK_TOOL.description,
      JSON.stringify(PROPOSE_WORK_TOOL.input_schema),
    ].join("\n");

    expect(PROPOSE_WORK_TOOL.input_schema.required).toEqual(["title", "body", "lane"]);
    expect(Object.keys(PROPOSE_WORK_TOOL.input_schema.properties).sort()).toEqual(["body", "lane", "title"]);
    expect(guidance).toMatch(/(?:app|server)[\s\S]{0,180}(?:format|kind)/i);
    expect(guidance).toMatch(/(?:app|server)[\s\S]{0,200}(?:action|send)/i);
    expect(guidance).toMatch(/(?:app|server)[\s\S]{0,240}(?:citation|attribution|source)/i);
    expect(guidance).toMatch(/sav(?:e|ing)[\s\S]{0,100}(?:does not|never|cannot)[\s\S]{0,50}send/i);
  });

  it("presents an existing Work status separately from its required outward action", async () => {
    const fixture = scenarioFixture({
      key: "reviewed_quality_context", title: "", says: [],
      company: { name: "Fictional company", whatWeDo: "Repairs bicycles." },
      openWork: [{ title: "Reply to a customer", lane: "sales", kind: "reply", status: "review", required_action: "send", notes: "Draft reply." }],
      expect: {}, humanReviewCriteria: [],
    });
    try {
      const context = await buildCompanyContext(fixture.db, fixture.companyId);
      expect(context).toMatch(/(?:status:\s*review|"status":"review")/);
      expect(context).toMatch(/(?:required_action:\s*send|"required_action":"send")/);
      expect(context).not.toContain("waiting-on: send");
    } finally {
      fixture.dispose();
    }
  });

  it("does not show a model's serialized tool-call echo as conversation text", async () => {
    const echo = JSON.stringify({ name: "propose_work", arguments: { title: "Unstaged duplicate" } });
    let round = 0;
    const turn: ModelTurn = async function* () {
      if (round++ === 0) {
        yield { type: "tool", id: "incomplete", name: "propose_work", input: { title: "Incomplete" } };
        yield { type: "done", stopReason: "tool_use", inputTokens: 1, outputTokens: 1 };
      } else {
        yield { type: "text", text: echo.slice(0, 14) };
        yield { type: "text", text: echo.slice(14) + "\nI could not prepare that suggestion." };
        yield { type: "done", stopReason: "end_turn", inputTokens: 1, outputTokens: 1 };
      }
    };
    const propose = vi.fn(async () => ({ id: "unreachable" }));
    const events: ReviewedTurnEvent[] = [];
    for await (const event of runReviewedTurn({
      mode: "draft", intent: { draftFormat: "reply", knowledgeAssertion: null }, source: { id: "current-message", text: "Prepare a reply for review." }, system: "Fictional review test", history: [{ role: "person", body: "Prepare a reply for review." }],
      turn, priced: false, propose,
    })) events.push(event);

    const visibleText = events.filter((event): event is Extract<ReviewedTurnEvent, { type: "text" }> => event.type === "text")
      .map((event) => event.text).join("");
    const done = events.find((event): event is Extract<ReviewedTurnEvent, { type: "done" }> => event.type === "done");
    expect(round).toBe(2);
    expect(propose).not.toHaveBeenCalled();
    expect(visibleText).not.toContain(echo);
    expect(done?.text).not.toContain(echo);
    expect(done?.text).toContain("I could not prepare that suggestion.");
    expect(done?.text).toContain("No review suggestion was prepared.");
  });
});
