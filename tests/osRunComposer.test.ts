import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CofounderApp, chatTurnsOf, ownRunTurnsOf } from "@/components/os/CofounderApp";
import { LiveRunPanel } from "@/components/os/RunPanel";
import { ReviewIntentFields } from "@/components/os/ReviewIntentFields";
import { OS_RUNS_CHANGED_EVENT } from "@/components/os/types";
import { OS_COFOUNDER_CHAT_COPY, OS_RUN_COPY } from "@/components/osCopy";
import type { ReviewSnapshot } from "@/lib/osReviewTypes";
import { RUN_ACTOR, RUN_COMPANY, runRow, runView } from "./helpers/agentRunView";

/* Starting a run from the co-founder window, and what a run's turn does not
 * do there: block the composer, read as an interrupted answer, or offer to
 * be closed as one. Node-only hook slots, as in the recovery suite; no DOM,
 * model, network or database. */
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0 }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState(initial: unknown) {
      const index = hooks.cursor++;
      if (!(index in hooks.slots)) hooks.slots[index] = typeof initial === "function" ? initial() : initial;
      return [hooks.slots[index], (next: unknown) => {
        hooks.slots[index] = typeof next === "function" ? (next as (value: unknown) => unknown)(hooks.slots[index]) : next;
      }];
    },
    useRef(initial: unknown) {
      const index = hooks.cursor++;
      if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
      return hooks.slots[index];
    },
    useId: () => "run-composer",
    useCallback: (callback: unknown) => callback,
    useEffect: () => undefined,
    useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/os/OsCommandBar", () => ({ OS_ASK_EVENT: "synthetic-ask-event" }));
vi.mock("@/components/os/ReviewCards", () => ({ ReviewCards: () => null }));

type ViewNode = { type: unknown; props: Record<string, unknown> };
function walk(node: unknown): ViewNode[] {
  if (Array.isArray(node)) return node.flatMap(walk);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ViewNode;
  return [element, ...walk(element.props.children)];
}
function words(node: unknown): string {
  if (Array.isArray(node)) return node.map(words).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (node && typeof node === "object" && "props" in node) return words((node as ViewNode).props.children);
  return "";
}
function find(view: unknown, type: unknown, match: (node: ViewNode) => boolean = () => true): ViewNode {
  const found = walk(view).find((node) => node.type === type && match(node));
  if (!found) throw new Error(`Missing ${String(type)}`);
  return found;
}
const labels = (view: unknown) => walk(view).filter((node) => node.type === "button").map((node) => words(node.props.children));
const button = (view: unknown, label: string) => find(view, "button", (node) => words(node.props.children) === label);
const click = (node: ViewNode) => (node.props.onClick as () => void)();
const change = (node: ViewNode, value: string) => (node.props.onChange as (event: unknown) => void)({ target: { value } });
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
const chat = OS_COFOUNDER_CHAT_COPY.en;
const runs = OS_RUN_COPY.en;
const RUN_TURN = "00000000-0000-4000-8000-0000000000f1";

function turn(id: string, status: "running" | "completed" | "failed", actor = RUN_ACTOR, created = "2026-10-17T10:00:00Z"): ReviewSnapshot["turns"][number] {
  return { id, question: "Prepare follow-ups for everything waiting more than a week.", mode: "draft", intent: { draftFormat: "reply", knowledgeAssertion: null },
    status, company_id: RUN_COMPANY, actor_id: actor, thread_id: "thread-one", person_message_id: "message-one", reply: null,
    created_at: created, updated_at: created, history: [] };
}
function snapshot(patch: Partial<ReviewSnapshot> = {}): ReviewSnapshot {
  return { companyId: RUN_COMPANY, actorId: RUN_ACTOR, messages: [], proposals: [], turns: [], runIds: [], ...patch };
}
function render(initial: ReviewSnapshot = snapshot()) {
  hooks.cursor = 0;
  return CofounderApp({ initialSnapshot: initial, locale: "en", copy: chat, canTalk: true, why: null });
}
function intentFields(view: unknown) {
  const element = find(view, ReviewIntentFields);
  return ReviewIntentFields(element.props as Parameters<typeof ReviewIntentFields>[0]);
}
function draftMode(initial?: ReviewSnapshot) {
  (find(render(initial), "input", (node) => node.props.value === "draft").props.onChange as () => void)();
}
function ready(initial?: ReviewSnapshot, text = "Prepare follow-ups for everything waiting more than a week.") {
  draftMode(initial);
  change(find(render(initial), "textarea"), text);
  change(find(intentFields(render(initial)), "select"), "reply");
}
function browser() {
  const target = new EventTarget();
  const announced: Event[] = [];
  target.addEventListener(OS_RUNS_CHANGED_EVENT, (event) => announced.push(event));
  vi.stubGlobal("sessionStorage", { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() });
  vi.stubGlobal("window", Object.assign(target, { confirm: vi.fn(() => true) }));
  return { announced };
}
const receipt = () => runRow({ id: RUN_TURN });

beforeEach(() => { hooks.slots = []; hooks.cursor = 0; });
afterEach(() => vi.unstubAllGlobals());

describe("a run's turn in the co-founder window", () => {
  it("separates run turns from chat turns, and finds the viewer's own runs newest first", () => {
    const older = turn("00000000-0000-4000-8000-0000000000f2", "completed", RUN_ACTOR, "2026-10-16T10:00:00Z");
    const other = turn("00000000-0000-4000-8000-0000000000f3", "running", "00000000-0000-4000-8000-0000000000a2");
    const ask = { ...turn("chat-turn", "running"), mode: "ask" as const, intent: { draftFormat: null, knowledgeAssertion: null } };
    const value = snapshot({ turns: [ask, older, turn(RUN_TURN, "running"), other], runIds: [older.id, RUN_TURN, other.id] });
    expect(chatTurnsOf(value).map((item) => item.id)).toEqual(["chat-turn"]);
    expect(ownRunTurnsOf(value).map((item) => item.id)).toEqual([RUN_TURN, older.id]);
    expect(chatTurnsOf(null)).toEqual([]);
  });

  it("does not block the composer, read as interrupted, or offer to be closed", () => {
    browser();
    const view = render(snapshot({ turns: [turn(RUN_TURN, "running")], runIds: [RUN_TURN] }));
    expect(find(view, "textarea").props.disabled).toBe(false);
    expect(labels(view)).not.toContain("Close interrupted answer");
    expect(words(view)).not.toContain("An answer has not finished saving");
    expect(words(view)).not.toContain("Another company member owns a running answer");
    // The window follows the run instead.
    expect(find(view, LiveRunPanel).props).toMatchObject({ runId: RUN_TURN, turnOpen: true, knownCards: 0 });
  });

  it("still blocks for a chat answer that is running, as before", () => {
    browser();
    const view = render(snapshot({ turns: [turn(RUN_TURN, "running")], runIds: [] }));
    expect(find(view, "textarea").props.disabled).toBe(true);
    expect(labels(view)).toContain("Close interrupted answer");
  });

  it("does not block for another member's run either, and does not say an earlier answer was interrupted", () => {
    browser();
    const other = turn(RUN_TURN, "running", "00000000-0000-4000-8000-0000000000a2");
    const stopped = turn("00000000-0000-4000-8000-0000000000f4", "failed");
    const view = render(snapshot({ turns: [stopped, other], runIds: [other.id, stopped.id] }));
    expect(find(view, "textarea").props.disabled).toBe(false);
    expect(words(view)).not.toContain("Another company member owns a running answer");
    expect(words(view)).not.toContain("An earlier answer was interrupted");
    // Another member's run is not this window's panel; the viewer's own finished one is.
    expect(find(view, LiveRunPanel).props.runId).toBe(stopped.id);
  });

  it("says another member's open run will answer when it ends, instead of leaving its instruction unanswered", () => {
    browser();
    const other = turn(RUN_TURN, "running", "00000000-0000-4000-8000-0000000000a2");
    const view = render(snapshot({ turns: [other], runIds: [other.id],
      messages: [{ id: "message-one", role: "person", body: other.question }] }));
    expect(find(view, "p", (node) => words(node.props.children) === runs.otherRunOpen).props.role).toBe("status");
    // Neither the viewer's own open run nor another member's finished one says it.
    hooks.slots = [];
    expect(words(render(snapshot({ turns: [turn(RUN_TURN, "running")], runIds: [RUN_TURN] })))).not.toContain(runs.otherRunOpen);
    hooks.slots = [];
    expect(words(render(snapshot({ turns: [{ ...other, status: "completed" as const }], runIds: [other.id] })))).not.toContain(runs.otherRunOpen);
    for (const locale of ["en", "fr"] as const) expect(OS_RUN_COPY[locale].otherRunOpen).not.toMatch(locale === "en" ? /\b(you|your)\b/i : /\b(vous|votre)\b/i);
  });
});

describe("starting a run", () => {
  it("is offered in Draft mode only, and waits for a format", () => {
    browser();
    expect(labels(render())).not.toContain(runs.startRun);
    draftMode();
    change(find(render(), "textarea"), "Prepare follow-ups.");
    const unformatted = render();
    expect(button(unformatted, runs.startRun).props.disabled).toBe(true);
    expect(words(unformatted)).toContain(runs.needsFormat);
    expect(words(unformatted)).toContain(runs.startHelp);
    change(find(intentFields(render()), "select"), "email");
    const formatted = render();
    expect(button(formatted, runs.startRun).props.disabled).toBe(false);
    expect(words(formatted)).not.toContain(runs.needsFormat);
  });

  it("fills the follow-ups template and selects Reply; the person still presses Start", () => {
    browser();
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    draftMode();
    click(button(render(), runs.templateFollowUps));
    const view = render();
    expect(find(view, "textarea").props.value).toBe(runs.templateFollowUpsText);
    expect(find(intentFields(view), "select").props.value).toBe("reply");
    expect(button(view, runs.startRun).props.disabled).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("is refused in the window while the viewer has a run open", () => {
    browser();
    const open = snapshot({ turns: [turn(RUN_TURN, "running")], runIds: [RUN_TURN] });
    ready(open);
    const view = render(open);
    expect(button(view, runs.startRun).props.disabled).toBe(true);
    expect(words(view)).toContain(runs.active);
    // The window does not know whether that run is working, waiting or paused, so the notice
    // asks for nothing it cannot ask of every one of them: no "answer" or "continue it first".
    expect(OS_RUN_COPY.en.active).not.toMatch(/answer|continue/i);
    expect(OS_RUN_COPY.tr.active).not.toMatch(/yanıtlayın|devam ettirin/i);
    expect(OS_RUN_COPY.fr.active).not.toMatch(/répondez|reprenez/i);
  });

  it("is refused for an instruction longer than a run takes", () => {
    browser();
    ready(undefined, "x".repeat(2001));
    const view = render();
    expect(button(view, runs.startRun).props.disabled).toBe(true);
    expect(words(view)).toContain(runs.tooLong);
  });

  it("starts with one request bound to this tab's identity, then reads the conversation and tells Running", async () => {
    const { announced } = browser();
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ type: "started", run: receipt() }, 202))
      .mockResolvedValueOnce(response(snapshot({ turns: [turn(RUN_TURN, "running")], runIds: [RUN_TURN] })));
    vi.stubGlobal("fetch", fetcher);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(RUN_TURN);
    ready();
    click(button(render(), runs.startRun));
    expect(button(render(), runs.starting).props.disabled).toBe(true);
    await tick(); await tick();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][0]).toBe("/api/os/runs");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      action: "start", runId: RUN_TURN, instruction: "Prepare follow-ups for everything waiting more than a week.", draftFormat: "reply",
      expectedActorId: RUN_ACTOR, expectedCompanyId: RUN_COMPANY,
    });
    expect(fetcher.mock.calls[1][0]).toBe("/api/os/review");
    const after = render();
    expect(find(after, "textarea").props.value).toBe("");
    expect(find(after, LiveRunPanel).props.runId).toBe(RUN_TURN);
    expect(announced).toHaveLength(1);
    vi.restoreAllMocks();
  });

  it.each([
    [409, "agent_run_active", runs.active], [402, "budget", runs.budget], [503, "not_configured", chat.notConfigured],
  ] as const)("keeps the text after a %d %s and says why", async (status, error, notice) => {
    browser();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ error }, status));
    vi.stubGlobal("fetch", fetcher);
    ready();
    click(button(render(), runs.startRun));
    await tick();
    const view = render();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(find(view, "textarea").props.value).toBe("Prepare follow-ups for everything waiting more than a week.");
    expect(words(view)).toContain(notice);
  });

  it("asks for the run by its id after an unconfirmed start, and a deliberate second press replays the same id", async () => {
    browser();
    const uuid = vi.spyOn(crypto, "randomUUID").mockReturnValue(RUN_TURN);
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response({ error: "run_unconfirmed" }, 409))
      .mockResolvedValueOnce(response({ error: "run_unavailable" }, 404))
      .mockResolvedValueOnce(response({ type: "existing", run: receipt() }, 200))
      .mockResolvedValueOnce(response(snapshot({ turns: [turn(RUN_TURN, "running")], runIds: [RUN_TURN] })));
    vi.stubGlobal("fetch", fetcher);
    ready();
    click(button(render(), runs.startRun));
    await tick(); await tick();
    expect(fetcher.mock.calls[1][0]).toMatch(/^\/api\/os\/runs\?id=[\da-f-]{36}$/);
    let view = render();
    expect(words(view)).toContain(runs.unconfirmed);
    expect(find(view, "textarea").props.value).toBe("Prepare follow-ups for everything waiting more than a week.");
    const firstId = JSON.parse(String(fetcher.mock.calls[0][1]?.body)).runId;
    expect(fetcher.mock.calls[1][0]).toBe(`/api/os/runs?id=${firstId}`);

    click(button(view, runs.startRun));
    await tick(); await tick();
    expect(JSON.parse(String(fetcher.mock.calls[2][1]?.body)).runId).toBe(firstId);
    // One id for the one instruction: a new one is never drawn for the retry.
    expect(uuid).toHaveBeenCalledTimes(1);
    view = render();
    expect(find(view, "textarea").props.value).toBe("");
    vi.restoreAllMocks();
  });

  it("reads a run found by its id after a lost response as started", async () => {
    browser();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(RUN_TURN);
    const found = runView({ id: RUN_TURN });
    const fetcher = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(response({ run: found, serverNow: 1_000 }))
      .mockResolvedValueOnce(response(snapshot({ turns: [turn(RUN_TURN, "running")], runIds: [RUN_TURN] })));
    vi.stubGlobal("fetch", fetcher);
    ready();
    click(button(render(), runs.startRun));
    await tick(); await tick(); await tick();
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(find(render(), "textarea").props.value).toBe("");
    expect(words(render())).not.toContain(runs.unconfirmed);
    vi.restoreAllMocks();
  });

  it("takes a fresh id after a confirmed refusal, because nothing began", async () => {
    browser();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => response({ error: "run_refused" }, 409));
    vi.stubGlobal("fetch", fetcher);
    ready();
    click(button(render(), runs.startRun));
    await tick();
    expect(words(render())).toContain("refused before anything started");
    click(button(render(), runs.startRun));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(2);
    const [first, second] = fetcher.mock.calls.map((call) => JSON.parse(String(call[1]?.body)).runId);
    expect(first).not.toBe(second);
  });
});
