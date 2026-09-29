import { describe, expect, it } from "vitest";
import { applyFixtureCommand, createFixture, EXAMPLE_ASSERTION, EXAMPLE_QUESTION, type FixtureState } from "./fixture";

const create = () => createFixture(EXAMPLE_QUESTION, "both", { draftFormat: "reply", knowledgeAssertion: EXAMPLE_ASSERTION });
const command = (state: FixtureState, index: number, action: string) => {
  const p = state.proposals[index];
  return { proposalId: p.id, revision: p.revision, fingerprint: p.fingerprint, action };
};
describe("isolated browser review fixture (not real persistence)", () => {
  it("requires a format and never treats pasted chat as a knowledge assertion", () => {
    expect(() => createFixture(EXAMPLE_QUESTION, "both", { draftFormat: null, knowledgeAssertion: null })).toThrow();
    const state = createFixture(EXAMPLE_QUESTION, "both", { draftFormat: "reply", knowledgeAssertion: null });
    expect(state.proposals.map((p) => p.payload.type)).toEqual(["work"]);
    expect(state.proposals[0].payload).toMatchObject({ kind: "reply", outwardAction: "send" });
  });
  it("preserves the exact separately entered assertion with its own captured source", () => {
    const state = create();
    expect(state.turn?.intent?.knowledgeAssertion).toBe(EXAMPLE_ASSERTION);
    expect(state.proposals[1].payload).toMatchObject({ type: "knowledge", statement: EXAMPLE_ASSERTION });
    expect(state.proposals[1].sources[0]).toMatchObject({ id: `${state.turn?.person_message_id}:assertion`, text: EXAMPLE_ASSERTION });
  });
  it("refuses knowledge storage unless the actual final approval is present", () => {
    const state = create();
    const result = applyFixtureCommand(state, command(state, 1, "add_to_company_knowledge"));
    expect(result.status).toBe(422);
    expect(result.body).toEqual({ error: "review_rejected", reason: "knowledge_approval" });
    expect(result.state.proposals[1].status).toBe("proposed");
    const confirmed = applyFixtureCommand(state, { ...command(state, 1, "add_to_company_knowledge"), knowledgeApproved: true });
    expect(confirmed.state.proposals[1].status).toBe("saved");
  });
  it("keeps immutable choices and receipts through the browser-storage JSON boundary", () => {
    const state = create();
    const saved = applyFixtureCommand(state, command(state, 0, "save_to_work"));
    const refreshed: FixtureState = JSON.parse(JSON.stringify(saved.state));
    expect(refreshed.turn?.intent).toEqual(state.turn?.intent);
    expect(refreshed.proposals[0]).toMatchObject({ status: "saved", record_id: "77777777-7777-4777-8777-777777777771" });
    expect(refreshed.proposals[1].status).toBe("proposed");
    expect(state.proposals[0].status).toBe("proposed");
  });
  it("cannot revise the exact company statement or change the captured draft format", () => {
    const state = create();
    const knowledge = state.proposals[1].payload;
    const work = state.proposals[0].payload;
    if (knowledge.type !== "knowledge" || work.type !== "work") throw new Error("fixture shape");
    expect(applyFixtureCommand(state, { ...command(state, 1, "revise"), payload: { ...knowledge, statement: "Different company claim" } }).body).toEqual({ error: "review_rejected", reason: "knowledge_assertion" });
    expect(applyFixtureCommand(state, { ...command(state, 0, "revise"), payload: { ...work, kind: "post" } }).body).toEqual({ error: "review_rejected", reason: "draft_format" });
  });
  it("permits scope revision without approval and requires review again before saving", () => {
    const state = create();
    const payload = state.proposals[1].payload;
    if (payload.type !== "knowledge") throw new Error("fixture shape");
    const revised = applyFixtureCommand(state, { ...command(state, 1, "revise"), payload: { ...payload, scope: { type: "project", label: "Atlas launch" } } });
    expect(revised.state.proposals[1]).toMatchObject({ status: "proposed", revision: 2 });
    expect(applyFixtureCommand(revised.state, command(revised.state, 1, "add_to_company_knowledge")).status).toBe(422);
  });
  it("does not create a second record on a replayed already-saved operation", () => {
    const state = create();
    const request = command(state, 0, "save_to_work");
    const saved = applyFixtureCommand(state, request);
    const replay = applyFixtureCommand(saved.state, request);
    expect(replay.status).toBe(409);
    expect(replay.state.proposals.filter((p) => p.status === "saved")).toHaveLength(1);
  });
  it("has no proposals for ask-only and no work proposal for knowledge-only", () => {
    expect(createFixture(EXAMPLE_QUESTION, "ask", { draftFormat: null, knowledgeAssertion: null }).proposals).toHaveLength(0);
    expect(createFixture(EXAMPLE_QUESTION, "knowledge", { draftFormat: null, knowledgeAssertion: EXAMPLE_ASSERTION }).proposals.map((p) => p.payload.type)).toEqual(["knowledge"]);
  });
});
