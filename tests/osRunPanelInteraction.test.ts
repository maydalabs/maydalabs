import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RunPanel } from "@/components/os/RunPanel";
import { OS_RUNS_CHANGED_EVENT } from "@/components/os/types";
import { OS_RUN_COPY } from "@/components/osCopy";
import type { AgentRunRow, AgentRunView } from "@/lib/osAgentRunTypes";
import { RUN_ACTOR, RUN_COMPANY, RUN_ID, RUN_QUESTION, runRow, runView } from "./helpers/agentRunView";

// Vitest runs in Node without a DOM. Drive the panel's own handlers with
// stable hook slots, as tests/osReviewRecoveryInteraction.test.ts does.
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
    useId: () => "run-test-id",
  };
});
vi.mock("@/components/os/OpenApp", () => ({ OpenApp: () => null }));

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
function find(view: unknown, type: string, match: (node: ViewNode) => boolean = () => true): ViewNode {
  const found = walk(view).find((node) => node.type === type && match(node));
  if (!found) throw new Error(`Missing ${type}`);
  return found;
}
const button = (view: unknown, label: string) => find(view, "button", (node) => words(node.props.children) === label);
const click = (node: ViewNode) => (node.props.onClick as () => void)();
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const copy = OS_RUN_COPY.en;
const identity = { actorId: RUN_ACTOR, companyId: RUN_COMPANY };
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
const receipt = (patch: Partial<AgentRunView> = {}) => runRow(patch);

let onRun: ReturnType<typeof vi.fn<(next: AgentRunRow) => void>>;
let announced: number;
function render(run: AgentRunView) {
  hooks.cursor = 0;
  return RunPanel({ run, locale: "en", variant: "full", identity, onRun });
}
function browser(confirmed: boolean) {
  const target = new EventTarget();
  announced = 0;
  target.addEventListener(OS_RUNS_CHANGED_EVENT, () => { announced += 1; });
  const confirm = vi.fn(() => confirmed);
  vi.stubGlobal("window", Object.assign(target, { confirm }));
  return { confirm };
}

beforeEach(() => { hooks.slots = []; hooks.cursor = 0; onRun = vi.fn<(next: AgentRunRow) => void>(); });
afterEach(() => vi.unstubAllGlobals());

describe("run panel controls", () => {
  it("asks before stopping, and stops nothing when the person declines", async () => {
    const { confirm } = browser(false);
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    click(button(render(runView()), copy.cancel));
    await tick();
    expect(confirm).toHaveBeenCalledExactlyOnceWith(copy.cancelConfirm);
    expect(fetcher).not.toHaveBeenCalled();
    expect(onRun).not.toHaveBeenCalled();
  });

  it("stops after the confirmation with one request, shows the receipt at once and tells every view", async () => {
    browser(true);
    const stopped = receipt({ status: "canceled", stop_reason: "canceled", seq: 8, lease_until: null, finished_at: "2026-10-17T10:09:00.000Z" });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ run: stopped }));
    vi.stubGlobal("fetch", fetcher);
    click(button(render(runView()), copy.cancel));
    expect(words(render(runView()))).toContain(copy.stopping);
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({ action: "cancel", runId: RUN_ID, expectedActorId: RUN_ACTOR, expectedCompanyId: RUN_COMPANY });
    expect(onRun).toHaveBeenCalledExactlyOnceWith(stopped);
    expect(announced).toBe(1);
  });

  it("guards a second press while the first is in flight", async () => {
    browser(true);
    let resolve!: (value: Response) => void;
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(new Promise<Response>((yes) => { resolve = yes; }));
    vi.stubGlobal("fetch", fetcher);
    const paused = runView({ status: "paused", lease_until: null });
    const view = render(paused);
    click(button(view, copy.continue));
    click(button(view, copy.continue));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    resolve(response({ run: receipt({ status: "running", seq: 8 }) }, 202));
    await tick();
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("continues with the sequence the person saw", async () => {
    browser(true);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ type: "resumed", run: receipt({ status: "running", seq: 8 }) }, 202));
    vi.stubGlobal("fetch", fetcher);
    click(button(render(runView({ status: "running", stalled: true, seq: 11 })), copy.continue));
    await tick();
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({ action: "continue", runId: RUN_ID, expectedSeq: 11, expectedActorId: RUN_ACTOR, expectedCompanyId: RUN_COMPANY });
  });

  it("fills the answer from an option and sends it trimmed, once", async () => {
    browser(true);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ type: "resumed", run: receipt({ status: "running", seq: 9 }) }, 202));
    vi.stubGlobal("fetch", fetcher);
    const waiting = runView({ status: "waiting", asked: true, question: RUN_QUESTION, lease_until: null, seq: 8 });
    click(button(render(waiting), "Jordan"));
    expect(find(render(waiting), "textarea").props.value).toBe("Jordan");
    (find(render(waiting), "textarea").props.onChange as (event: unknown) => void)({ target: { value: "  Dana, the finance contact.  " } });
    (find(render(waiting), "form").props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn() });
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      action: "answer", runId: RUN_ID, expectedSeq: 8, answer: "Dana, the finance contact.", expectedActorId: RUN_ACTOR, expectedCompanyId: RUN_COMPANY,
    });
    expect(find(render(waiting), "textarea").props.value).toBe("");
  });

  it("does not send an empty answer", async () => {
    browser(true);
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    const waiting = runView({ status: "waiting", asked: true, question: RUN_QUESTION, lease_until: null });
    (find(render(waiting), "textarea").props.onChange as (event: unknown) => void)({ target: { value: "   " } });
    expect(button(render(waiting), copy.question.answer).props.disabled).toBe(true);
    (find(render(waiting), "form").props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn() });
    await tick();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("skips with the sequence the person saw", async () => {
    browser(true);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ run: receipt({ status: "running", seq: 9 }) }, 202));
    vi.stubGlobal("fetch", fetcher);
    click(button(render(runView({ status: "waiting", asked: true, question: RUN_QUESTION, lease_until: null, seq: 8 })), copy.question.skip));
    await tick();
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ action: "skip", expectedSeq: 8 });
  });

  it.each([
    [409, "agent_run_stale", copy.stale], [409, "model_changed", copy.modelChanged], [409, "agent_run_slice_limit", copy.sliceLimit],
    [503, "key_unavailable", copy.unavailable], [409, "run_unconfirmed", copy.unconfirmed],
    // Refused before the route touched anything: the identity notice, not "could not be confirmed".
    [409, "identity_changed", copy.identityChanged],
    // The run could not be read: nothing changed, and the AI is not blamed.
    [503, "runs_unavailable", copy.notRead],
  ] as const)("says what a %d %s means, does not retry, and has every view read again", async (status, error, notice) => {
    browser(true);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ error }, status));
    vi.stubGlobal("fetch", fetcher);
    const paused = runView({ status: "paused", lease_until: null });
    click(button(render(paused), copy.continue));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onRun).not.toHaveBeenCalled();
    expect(words(find(render(paused), "p", (node) => node.props.role === "alert"))).toBe(notice);
    expect(announced).toBe(1);
    // The control is usable again: a deliberate press, not an automatic one.
    expect(button(render(paused), copy.continue).props.disabled).toBe(false);
  });

  it("words the stale notice as a read in progress, not one already done", () => {
    for (const locale of ["en", "tr", "fr"] as const) expect(OS_RUN_COPY[locale].stale).not.toMatch(/has been refreshed|Yenilendi;|a été actualisée/);
    expect(copy.notRead).not.toMatch(/\bAI\b/);
  });

  it("draws no control for a member who did not start the run, even if a handler were reached", () => {
    browser(true);
    for (const run of [runView({ mine: false }), runView({ mine: false, status: "paused", lease_until: null }),
      runView({ mine: false, status: "waiting", asked: true, question: RUN_QUESTION, lease_until: null })]) {
      expect(walk(render(run)).filter((node) => node.type === "button" || node.type === "form" || node.type === "textarea")).toEqual([]);
    }
  });
});
