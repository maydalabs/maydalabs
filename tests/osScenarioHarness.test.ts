import { describe, expect, it } from "vitest";
import { loopbackOrigin, preflightLocalModel, scenarioRunRequested, scenarioSettings, scenarioSuite, withScenarioDeadline } from "@/lib/osScenarioHarness";
import { scenarioFixture } from "./helpers/scenarioFixture";
import { buildCompanyContext, fileWork, rememberFact } from "@/lib/osCofounder";
import { localTurn } from "@/lib/osCofounderLocal";
import { memoryCandidateFilter } from "@/lib/osReviewedMemory";

const env = { MAYDAOS_SCENARIO_RUN: "1", MAYDAOS_SCENARIO_MODEL: "local", MAYDAOS_LOCAL_MODEL: "qwen3:14b" };

describe("explicit local-only scenario runner", () => {
  it("keeps the original suite default and rejects misspelled selections", () => {
    expect(scenarioSuite({})).toBe("baseline");
    expect(scenarioSuite({ MAYDAOS_SCENARIO_SUITE: "work-variations" })).toBe("work-variations");
    expect(scenarioSuite({ MAYDAOS_SCENARIO_SUITE: "faithfulness-variations" })).toBe("faithfulness-variations");
    expect(() => scenarioSuite({ MAYDAOS_SCENARIO_SUITE: "only-passing-cases" })).toThrow("Unknown scenario suite");
  });
  it("never enables model runs from the ordinary npm test lifecycle, even with leaked opt-in env", () => {
    expect(scenarioRunRequested({ ...env, npm_lifecycle_event: "test" })).toBe(false);
    expect(scenarioRunRequested({ ...env, npm_lifecycle_event: "scenarios" })).toBe(true);
    expect(scenarioRunRequested({ ...env, MAYDAOS_SCENARIO_RUN: "0", npm_lifecycle_event: "scenarios" })).toBe(false);
  });
  it("fails missing opt-in, missing model and paid selection instead of silently skipping", () => {
    expect(() => scenarioSettings({})).toThrow("explicit");
    expect(() => scenarioSettings({ ...env, MAYDAOS_LOCAL_MODEL: "" })).toThrow("installed local");
    expect(() => scenarioSettings({ ...env, MAYDAOS_SCENARIO_MODEL: "claude", MAYDAOS_ANTHROPIC_API_KEY: "not-used" })).toThrow("no paid fallback");
    expect(() => scenarioSettings({ ...env, VERCEL: "1" })).toThrow("Vercel");
    expect(() => scenarioSettings({ ...env, MAYDAOS_LOCAL_MODEL: "gpt:cloud" })).toThrow("cloud");
  });

  it("accepts actual loopback origins, not substring matches, credentials or redirects", () => {
    expect(loopbackOrigin("http://127.0.0.1:11434/")).toBe("http://127.0.0.1:11434");
    expect(loopbackOrigin("http://[::1]:11434")).toBe("http://[::1]:11434");
    for (const url of ["https://127.0.0.1:11434", "http://127.0.0.1.evil.test", "http://evil.test/127.0.0.1", "http://127.0.0.1@evil.test", "http://user:pass@127.0.0.1", "http://127.0.0.1/api", "http://127.0.0.1?remote=1", "http://localhost:11434", "http://10.0.0.1"]) {
      expect(() => loopbackOrigin(url)).toThrow();
    }
  });

  it("bounds repeats and timeout and does not require a database credential", () => {
    expect(scenarioSettings(env)).toMatchObject({ repeats: 3, timeoutMs: 600_000 });
    for (const value of ["0", "21", "1.5", "3oops"]) expect(() => scenarioSettings({ ...env, MAYDAOS_SCENARIO_REPEATS: value })).toThrow();
  });

  it("requires installed local weights, records a digest and forbids redirects on every preflight fetch", async () => {
    const calls: RequestInit[] = [];
    const fetcher = (async (url, init) => {
      calls.push(init!);
      return Response.json(String(url).endsWith("/api/version") ? { version: "test" } : String(url).endsWith("/api/tags") ? { models: [{ name: "qwen3:14b", digest: "digest", size: 123 }] } : { model_info: { "general.architecture": "qwen3" } });
    }) as typeof fetch;
    expect(await preflightLocalModel(scenarioSettings(env), fetcher)).toMatchObject({ digest: "digest", version: "test" });
    expect(calls.every((call) => call.redirect === "error" && call.credentials === "omit" && call.signal)).toBe(true);
    await expect(preflightLocalModel(scenarioSettings(env), (async () => Response.json({ version: "test", models: [] })) as typeof fetch)).rejects.toThrow("not installed");
  });

  it("refuses a cloud proxy even when served by a loopback daemon", async () => {
    const fetcher = (async (url) => Response.json(String(url).endsWith("/api/version") ? { version: "test" } : String(url).endsWith("/api/tags") ? { models: [{ name: "qwen3:14b", digest: "digest", size: 123 }] } : { remote_host: "cloud.example", model_info: {} })) as typeof fetch;
    await expect(preflightLocalModel(scenarioSettings(env), fetcher)).rejects.toThrow("local weight");
  });

  it("aborts and awaits in-flight work before the deadline helper returns", async () => {
    let cancelled = false;
    await expect(withScenarioDeadline(10, (signal) => new Promise<void>((_, reject) => {
      signal.addEventListener("abort", () => { cancelled = true; reject(signal.reason); }, { once: true });
    }))).rejects.toThrow("deadline");
    expect(cancelled).toBe(true);
  });

  it("passes cancellation to the local model and releases its reader on incomplete or abandoned responses", async () => {
    let cancelled = false;
    let signal: AbortSignal | null | undefined;
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('{"message":{"content":"hello"}}\n')); }, cancel() { cancelled = true; } });
    const fetcher = (async (_, init) => { signal = init?.signal; return new Response(body); }) as typeof fetch;
    const controller = new AbortController();
    for await (const event of localTurn({ url: "http://127.0.0.1", model: "test" }, fetcher)({ system: "s", messages: [], signal: controller.signal })) {
      expect(event.type).toBe("text"); break;
    }
    expect(signal).toBe(controller.signal);
    expect(cancelled).toBe(true);
    const incomplete = (async () => new Response('{"message":{"content":"truncated"}}\n')) as typeof fetch;
    await expect((async () => { for await (const event of localTurn({ url: "http://127.0.0.1", model: "test" }, incomplete)({ system: "s", messages: [] })) void event; })()).rejects.toThrow("completion");
  });
});

describe("isolated behavioral fixture (not a SQL/RLS integration test)", () => {
  it("exercises real context/tool writes and disposes without connecting to a database", async () => {
    const fixture = scenarioFixture({ key: "test", title: "test", says: [], expect: {}, humanReviewCriteria: [], memory: [{ fact: "Floor is forty.", kind: "constraint" }] });
    expect(await buildCompanyContext(fixture.db, fixture.companyId)).toContain("Floor is forty.");
    expect(await fileWork(fixture.db, fixture.companyId, { title: "Draft", notes: "actual body", needs_approval_for: "send" })).toMatchObject({ ok: true });
    expect(await rememberFact(fixture.db, fixture.companyId, { fact: "Net 30." })).toMatchObject({ ok: true });
    expect(fixture.snapshot().os_work_items[0]).toMatchObject({ notes: "actual body", status: "review", required_action: "send" });
    expect(await buildCompanyContext(fixture.db, fixture.companyId)).toContain("actual body");
    fixture.dispose(); expect(fixture.isDisposed()).toBe(true);
  });

  it("executes filters, order, count before limit and rejects unsupported tables", async () => {
    const fixture = scenarioFixture({ key: "ordered", title: "ordered", says: [], expect: {}, humanReviewCriteria: [], openWork: [
      { title: "older", lane: "ops", kind: "note", status: "pending", created_at: "2026-09-01", updated_at: "2026-09-01" },
      { title: "newer", lane: "ops", kind: "note", status: "review", created_at: "2026-09-10", updated_at: "2026-09-10" },
    ] });
    const result = await fixture.db.from("os_work_items").select("title", { count: "exact" }).eq("company_id", fixture.companyId).order("updated_at", { ascending: false }).limit(1);
    expect(result.count).toBe(2); expect(result.data?.[0].title).toBe("newer");
    expect((await fixture.db.from("os_work_items").select("title").eq("company_id", "other")).data).toEqual([]);
    expect(() => fixture.db.from("lead_intakes")).toThrow("Unsupported");
  });
  it("executes the memory expiry OR predicate before count and limit, not as a no-op", async () => {
    const memory = [
      { fact: "expired", kind: "fact", review_duration: { type: "until_date", date: "2026-09-21" } },
      { fact: "today", kind: "fact", review_duration: { type: "until_date", date: "2026-09-22" } },
      { fact: "future", kind: "fact", review_duration: { type: "until_date", date: "2026-10-01" } },
      { fact: "lasting", kind: "fact", review_duration: { type: "until_changed" } },
      { fact: "legacy", kind: "fact" },
      { fact: "invalid", kind: "fact", review_duration: { type: "unknown" } },
      { fact: "missing date", kind: "fact", review_duration: { type: "until_date" } },
    ];
    const fixture = scenarioFixture({ key: "expiry", title: "expiry", says: [], expect: {}, humanReviewCriteria: [], memory });
    const read = await fixture.db.from("os_company_memory").select("fact", { count: "exact" }).or(memoryCandidateFilter("2026-09-22")).limit(1);
    expect(read.count).toBe(4);
    expect(read.data?.map((row) => row.fact)).toEqual(["today"]);
    const all = await fixture.db.from("os_company_memory").select("fact").or(memoryCandidateFilter("2026-09-22"));
    expect(all.data?.map((row) => row.fact)).toEqual(["today", "future", "lasting", "legacy"]);
  });
  it("rejects unsupported OR filters so query changes cannot silently weaken the fixture", () => {
    const fixture = scenarioFixture({ key: "strict-or", title: "strict OR", says: [], expect: {}, humanReviewCriteria: [] });
    expect(() => fixture.db.from("os_company_memory").select("fact").or("fact.eq.anything")).toThrow("Unsupported");
    expect(() => fixture.db.from("os_work_items").select("id").or(memoryCandidateFilter("2026-09-22"))).toThrow("Unsupported");
    expect(() => fixture.db.from("os_company_memory").select("fact").or(memoryCandidateFilter("2026-09-22").replace("2026-09-22", "2026-02-30"))).toThrow("Unsupported");
  });
});
