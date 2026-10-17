import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentRunRefusal } from "@/lib/osAgentRunTypes";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  configured: vi.fn(), claims: vi.fn(), server: vi.fn(), admin: vi.fn(), company: vi.fn(), access: vi.fn(),
  resolve: vi.fn(), quote: vi.fn(), start: vi.fn(), cancel: vi.fn(), resume: vi.fn(), list: vi.fn(), drive: vi.fn(), after: vi.fn(),
  member: vi.fn(), recover: vi.fn(),
}));
vi.mock("next/server", async (importOriginal) => ({ ...await importOriginal<typeof import("next/server")>(), after: mocks.after }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: mocks.configured }));
vi.mock("@/lib/supabase/server", () => ({ getVerifiedClaims: mocks.claims, createSupabaseServerClient: mocks.server }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/osCompany", () => ({ currentCompany: mocks.company }));
vi.mock("@/lib/osReviewStore", () => ({ hasReviewAccess: mocks.access }));
vi.mock("@/lib/osAgentRunPayer", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/osAgentRunPayer")>(), resolveRunModel: mocks.resolve, runQuote: mocks.quote }));
vi.mock("@/lib/osAgentRunStore", () => ({ startAgentRun: mocks.start, cancelAgentRun: mocks.cancel, resumeAgentRun: mocks.resume, listAgentRuns: mocks.list, leaseToRecover: mocks.recover }));
vi.mock("@/lib/osAgentRunDriver", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/osAgentRunDriver")>(), driveAgentRun: mocks.drive }));

import { GET, POST, maxDuration } from "@/app/api/os/runs/route";
import { RUN_FUNCTION_SECONDS, runStartMinimumUsd } from "@/lib/osAgentRun";
import { agentRunSystemFor } from "@/lib/osAgentRunPrompt";
import { personaFromCompany } from "@/lib/osPersona";

const runId = "00000000-0000-4000-8000-000000000001";
const actorId = "00000000-0000-4000-8000-000000000002";
const companyId = "00000000-0000-4000-8000-000000000003";
const lease = "00000000-0000-4000-8000-000000000004";
const startBody = { action: "start", runId, instruction: "Prepare follow-ups for everything waiting more than a week.", draftFormat: "reply", expectedActorId: actorId, expectedCompanyId: companyId };
const fence = { expectedActorId: actorId, expectedCompanyId: companyId };
const run = { id: runId, company_id: companyId, actor_id: actorId, status: "running", seq: 4, payer: "local", priced: false, model_label: "local:qwen3:14b" };
const picked = { turn: vi.fn(), priced: false, label: "local:qwen3:14b" };
function request(body: unknown, extra: RequestInit = {}) {
  return new Request("http://localhost/api/os/runs", { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost" }, body: JSON.stringify(body), ...extra });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.configured.mockReturnValue(true);
  mocks.claims.mockResolvedValue({ sub: actorId });
  const memberQuery = { select: () => memberQuery, eq: () => memberQuery, maybeSingle: mocks.member };
  mocks.member.mockResolvedValue({ data: { address_as: "Boss" }, error: null });
  mocks.server.mockResolvedValue({ from: () => memberQuery });
  mocks.admin.mockReturnValue({ admin: true });
  mocks.company.mockResolvedValue({ id: companyId, name: "Synthetic Orchard", what_we_do: "Apples.", monthly_chat_usd: 5, cofounder_name: null, cofounder_voice: "plain", cofounder_note: null });
  mocks.access.mockResolvedValue(true);
  mocks.resolve.mockResolvedValue({ ok: true, picked, payer: "local" });
  mocks.start.mockResolvedValue({ created: true, run, lease });
  mocks.list.mockResolvedValue([{ ...run, mine: true, stalled: false, instruction: "x", draftFormat: "reply", captures: [] }]);
  mocks.resume.mockResolvedValue({ run: { ...run, seq: 5 }, lease });
  mocks.cancel.mockResolvedValue({ ...run, status: "canceled" });
  mocks.recover.mockResolvedValue(null);
});

describe("route configuration", () => {
  it("runs as long as the loop's function budget", () => {
    expect(maxDuration).toBe(RUN_FUNCTION_SECONDS);
  });
});

describe("start", () => {
  it("rejects a cross-origin write before reading identity", async () => {
    expect((await POST(request(startBody, { headers: { "content-type": "application/json", origin: "https://untrusted.invalid" } }))).status).toBe(403);
    expect(mocks.claims).not.toHaveBeenCalled();
  });
  it("rejects a form or text write", async () => {
    expect((await POST(request(startBody, { headers: { "content-type": "text/plain" } }))).status).toBe(415);
    expect(mocks.claims).not.toHaveBeenCalled();
  });
  it("requires a signed-in person and a configured database", async () => {
    mocks.claims.mockResolvedValue(null);
    expect((await POST(request(startBody))).status).toBe(401);
    mocks.configured.mockReturnValue(false);
    expect((await POST(request(startBody))).status).toBe(503);
  });
  it.each([
    {}, { ...startBody, runId: "not-a-uuid" }, { ...startBody, instruction: " " }, { ...startBody, instruction: "x".repeat(2001) },
    { ...startBody, draftFormat: "memo" }, { ...startBody, draftFormat: undefined }, { ...startBody, extra: true }, { ...startBody, actorId: "forged" },
    { ...startBody, expectedActorId: undefined }, { ...startBody, expectedCompanyId: "invalid" }, { ...startBody, action: "approve" },
    { ...startBody, action: "answer" },
  ])("rejects invalid input %j before any read", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.server).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
  });
  it("refuses a stale tab for another person or company", async () => {
    expect(await (await POST(request({ ...startBody, expectedActorId: companyId }))).json()).toEqual({ error: "identity_changed" });
    expect(mocks.server).not.toHaveBeenCalled();
    const other = await POST(request({ ...startBody, expectedCompanyId: lease }));
    expect(other.status).toBe(409);
    expect(await other.json()).toEqual({ error: "identity_changed" });
    expect(mocks.start).not.toHaveBeenCalled();
  });
  it("refuses a non-member before resolving a model", async () => {
    mocks.access.mockResolvedValue(false);
    const response = await POST(request(startBody));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "review_access_denied" });
    expect(mocks.resolve).not.toHaveBeenCalled();
  });
  it("is not configured when no model can answer", async () => {
    mocks.resolve.mockResolvedValue({ ok: false, error: "not_configured", status: 503 });
    expect((await POST(request(startBody))).status).toBe(503);
    expect(mocks.start).not.toHaveBeenCalled();
  });
  it.each([["budget", 402, "budget"], ["active", 409, "agent_run_active"], ["unavailable", 403, "run_unavailable"]] as const)("maps a %s refusal to %i", async (code, status, error) => {
    mocks.start.mockRejectedValue(new AgentRunRefusal(code));
    const response = await POST(request(startBody));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("never says a start did not happen when its response was lost", async () => {
    mocks.start.mockRejectedValue(new Error("agent_run_unconfirmed"));
    const response = await POST(request(startBody));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("run_unconfirmed");
    expect(mocks.recover).toHaveBeenCalledExactlyOnceWith({ admin: true }, { companyId, actorId }, runId, 0, expect.any(Number));
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("drives a start whose response was lost but which committed, on the lease SQL issued", async () => {
    mocks.start.mockRejectedValue(new Error("agent_run_unconfirmed"));
    mocks.recover.mockResolvedValue(lease);
    mocks.list.mockResolvedValue([{ ...run, seq: 0, mine: true, stalled: false, instruction: "x", draftFormat: "reply", captures: [] }]);
    const response = await POST(request(startBody));
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ type: "started", run: { id: runId, seq: 0 } });
    expect(mocks.after).toHaveBeenCalledTimes(1);
    await mocks.after.mock.calls[0][0]();
    expect(mocks.drive).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ runId, lease }));
  });
  it("never recovers a start SQL refused", async () => {
    mocks.start.mockRejectedValue(new AgentRunRefusal("refused"));
    mocks.recover.mockResolvedValue(lease);
    expect((await POST(request(startBody))).status).toBe(409);
    expect(mocks.recover).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("returns a replay as existing and never schedules a second driver", async () => {
    mocks.start.mockResolvedValue({ created: false, run, lease: null });
    const response = await POST(request(startBody));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: "existing", run });
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("starts with the verified identity, schedules exactly one driver, and returns 202", async () => {
    const response = await POST(request(startBody));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ type: "started", run });
    expect(mocks.start).toHaveBeenCalledExactlyOnceWith({ admin: true }, { companyId, actorId }, {
      id: runId, instruction: startBody.instruction, draftFormat: "reply", payer: "local", modelLabel: "local:qwen3:14b", capUsd: 1, dailyCapUsd: 2,
      minUsd: 0, leaseSeconds: 1890,
    });
    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.drive).not.toHaveBeenCalled();
    await mocks.after.mock.calls[0][0]();
    expect(mocks.drive).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      runId, companyId, actorId, lease, picked, startedAt: expect.any(Number), persona: expect.objectContaining({ addressAs: "Boss" }),
      company: expect.objectContaining({ name: "Synthetic Orchard" }),
    }));
  });

  /* SQL refuses a start whose ceiling cannot pay for its first rounds; the
   * route says what they would be held at, from the very prompt and price
   * the driver will use, so the refusal posts nothing. */
  it("tells SQL what a priced run's first rounds would be held at, at the price it will pay", async () => {
    const price = { inputUsdPerMillion: 15, outputUsdPerMillion: 75 };
    mocks.resolve.mockResolvedValue({ ok: true, picked: { turn: vi.fn(), priced: true, label: "anthropic:dear", price }, payer: "company" });
    expect((await POST(request({ ...startBody, instruction: `  ${startBody.instruction} ` }))).status).toBe(202);
    const company = await mocks.company.mock.results[0].value;
    const system = agentRunSystemFor({ company, draftFormat: "reply", persona: personaFromCompany(company, "Boss"), today: new Date().toISOString().slice(0, 10) });
    const minUsd = runStartMinimumUsd({ priced: true, price, system, instruction: startBody.instruction });
    expect(minUsd).toBeGreaterThan(0.5);
    expect(mocks.start).toHaveBeenCalledExactlyOnceWith({ admin: true }, { companyId, actorId }, expect.objectContaining({
      instruction: startBody.instruction, payer: "company", minUsd,
    }));
  });
});

describe("continue, answer and skip", () => {
  const cont = { action: "continue", runId, expectedSeq: 4, ...fence };
  it.each([
    ["stale", "agent_run_stale"], ["not_resumable", "agent_run_not_resumable"], ["slice_limit", "agent_run_slice_limit"],
  ] as const)("maps %s to 409", async (code, error) => {
    mocks.resume.mockRejectedValue(new AgentRunRefusal(code));
    const response = await POST(request(cont));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error });
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("refuses with model_changed, without resuming, when the company's AI choice changed", async () => {
    mocks.resolve.mockResolvedValue({ ok: true, picked: { ...picked, label: "anthropic:claude-opus-5", priced: true }, payer: "company" });
    const response = await POST(request(cont));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "model_changed" });
    expect(mocks.resume).not.toHaveBeenCalled();
  });
  it("refuses another member's run", async () => {
    mocks.list.mockResolvedValue([{ ...run, mine: false }]);
    expect((await POST(request(cont))).status).toBe(403);
    expect(mocks.resume).not.toHaveBeenCalled();
  });
  it.each([
    [cont, "continue", null],
    [{ action: "answer", runId, expectedSeq: 4, answer: "  Selin, please. ", ...fence }, "answer", "Selin, please."],
    [{ action: "skip", runId, expectedSeq: 4, ...fence }, "skip", null],
  ] as const)("resumes %j and schedules one driver", async (body, action, answer) => {
    const response = await POST(request(body));
    expect(response.status).toBe(202);
    expect(mocks.resume).toHaveBeenCalledExactlyOnceWith({ admin: true }, { companyId, actorId }, { id: runId, seq: 4, action, answer, leaseSeconds: 1890 });
    expect(mocks.after).toHaveBeenCalledTimes(1);
  });
  it("drives a resume whose response was lost but which committed, one seq on", async () => {
    mocks.resume.mockRejectedValue(new Error("agent_run_unconfirmed"));
    mocks.recover.mockResolvedValue(lease);
    mocks.list.mockResolvedValueOnce([{ ...run, mine: true, stalled: true, instruction: "x", draftFormat: "reply", captures: [] }])
      .mockResolvedValueOnce([{ ...run, seq: 5, mine: true, stalled: false, instruction: "x", draftFormat: "reply", captures: [] }]);
    const response = await POST(request(cont));
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ type: "resumed", run: { seq: 5 } });
    expect(mocks.recover).toHaveBeenCalledExactlyOnceWith({ admin: true }, { companyId, actorId }, runId, 5, expect.any(Number));
    expect(mocks.after).toHaveBeenCalledTimes(1);
  });
  it("stays unconfirmed when a lost resume cannot be shown to have committed", async () => {
    mocks.resume.mockRejectedValue(new Error("agent_run_unconfirmed"));
    const response = await POST(request(cont));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("run_unconfirmed");
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it.each([
    { action: "answer", runId, expectedSeq: 4, ...fence },
    { action: "skip", runId, expectedSeq: 4, answer: "x", ...fence },
    { action: "continue", runId, expectedSeq: -1, ...fence },
    { action: "continue", runId, expectedSeq: "4", ...fence },
    { action: "answer", runId, expectedSeq: 4, answer: "x".repeat(1001), ...fence },
  ])("rejects %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.resume).not.toHaveBeenCalled();
  });
});

describe("stop", () => {
  it("stops the actor's run, repeatably, and schedules nothing", async () => {
    const body = { action: "cancel", runId, ...fence };
    const first = await POST(request(body));
    const second = await POST(request(body));
    expect([first.status, second.status]).toEqual([200, 200]);
    expect(await first.json()).toEqual({ run: { ...run, status: "canceled" } });
    expect(mocks.cancel).toHaveBeenCalledTimes(2);
    expect(mocks.resolve).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("refuses another member's stop", async () => {
    mocks.cancel.mockRejectedValue(new AgentRunRefusal("unavailable"));
    expect((await POST(request({ action: "cancel", runId, ...fence }))).status).toBe(403);
  });
});

describe("GET", () => {
  const get = (query = "") => GET(new Request(`http://localhost/api/os/runs${query}`));
  it("requires a signed-in member", async () => {
    mocks.claims.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    mocks.claims.mockResolvedValue({ sub: actorId });
    mocks.access.mockResolvedValue(false);
    expect((await get()).status).toBe(403);
  });
  it("returns one run with the server's clock, and never schedules anything", async () => {
    const response = await get(`?id=${runId}`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.run).toMatchObject({ id: runId, stalled: false, mine: true });
    expect(typeof body.serverNow).toBe("number");
    expect(JSON.stringify(body)).not.toMatch(/checkpoint|lease_id/);
    expect(mocks.list).toHaveBeenCalledWith(expect.anything(), companyId, actorId, body.serverNow, { id: runId });
    expect(mocks.after).not.toHaveBeenCalled();
    mocks.list.mockResolvedValue([]);
    expect((await get(`?id=${runId}`)).status).toBe(404);
    expect((await get("?id=nope")).status).toBe(400);
  });
  it("lists runs and quotes a start", async () => {
    expect(await (await get()).json()).toMatchObject({ runs: [{ id: runId }], serverNow: expect.any(Number) });
    mocks.quote.mockResolvedValue({ payer: "platform", priced: true, maxUsd: 1, leftUsd: 4.2 });
    expect(await (await get("?quote=1")).json()).toMatchObject({ quote: { maxUsd: 1, leftUsd: 4.2 } });
    // Quoted for the prompt this person's run would be sent: the company's persona and their own form of address.
    expect(mocks.quote).toHaveBeenCalledExactlyOnceWith(expect.anything(), expect.objectContaining({ id: companyId, name: "Synthetic Orchard" }),
      process.env, expect.objectContaining({ addressAs: "Boss" }));
  });
  it("fails closed when runs cannot be read", async () => {
    mocks.list.mockRejectedValue(new Error("PRIVATE"));
    const response = await get();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "runs_unavailable" });
  });
});
