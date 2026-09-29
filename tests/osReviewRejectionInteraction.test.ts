import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CofounderApp } from "@/components/os/CofounderApp";
import { ReviewCards } from "@/components/os/ReviewCards";
import { OS_COFOUNDER_CHAT_COPY } from "@/components/osCopy";
import type { DurableProposal, ReviewSnapshot } from "@/lib/osReviewTypes";

// Follow the recovery suite's Node-only hook harness. These tests invoke the
// actual client handlers and inspect their rendered controls; no DOM, model,
// network, or database is involved.
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, refresh: vi.fn() }));
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
    useId: () => "review-test-id",
    useCallback: (callback: unknown) => callback,
    useEffect: () => undefined,
    useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: hooks.refresh }) }));
vi.mock("@/components/os/OsCommandBar", () => ({ OS_ASK_EVENT: "synthetic-ask-event" }));

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
  if (!found) throw new Error(`Missing ${String(type)} control`);
  return found;
}
function button(view: unknown, label: string) { return find(view, "button", (node) => words(node.props.children) === label); }
function click(node: ViewNode) { (node.props.onClick as () => void)(); }
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}
function proposal(): DurableProposal {
  return {
    id: "proposal-one", company_id: "company-one", actor_id: "actor-one", turn_id: "turn-one",
    revision: 1, fingerprint: "a".repeat(64), status: "proposed", record_id: null,
    payload: { type: "work", title: "An internal draft", body: "A bounded fictional note.", lane: "ops", kind: "note", outwardAction: null,
      citations: [{ sourceId: "source-one", quote: "Prepare a note." }] },
    sources: [{ id: "source-one", companyId: "company-one", revision: "r1", text: "Prepare a note.", origin: "founder" }],
  };
}
function snapshot(): ReviewSnapshot {
  return { companyId: "company-one", actorId: "actor-one", messages: [], proposals: [proposal()], turns: [] };
}
function cardHarness(initial = proposal(), capturedIntent = true) {
  const callbacks = { onChange: vi.fn(), onUncertain: vi.fn(), onRejected: vi.fn(), onMutationStart: vi.fn(() => true) };
  const render = () => {
    hooks.cursor = 0;
    const cards = ReviewCards({ proposals: [initial], turns: [{ id: initial.turn_id, intent: capturedIntent ? { draftFormat: "note", knowledgeAssertion: initial.payload.type === "knowledge" ? initial.payload.statement : null } : null }], locale: "en", ...callbacks });
    const card = walk(cards).find((node) => typeof node.type === "function" && node.type.name === "ReviewCard");
    if (!card) throw new Error("Missing actual ReviewCard component");
    return (card.type as (props: Record<string, unknown>) => unknown)(card.props);
  };
  return { render, ...callbacks };
}
function parent(initial = snapshot()) {
  hooks.cursor = 0;
  return CofounderApp({ initialSnapshot: initial, locale: "en", copy: OS_COFOUNDER_CHAT_COPY.en, canTalk: true, why: null });
}
function browser() {
  vi.stubGlobal("sessionStorage", { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() });
  vi.stubGlobal("window", Object.assign(new EventTarget(), { confirm: vi.fn(() => true) }));
}
const rejected = (reason = "duplicate_work") => Response.json({ error: "review_rejected", reason }, { status: 422 });

beforeEach(() => { hooks.slots = []; hooks.cursor = 0; hooks.refresh.mockReset(); browser(); });
afterEach(() => vi.unstubAllGlobals());

describe("confirmed review refusal interaction", () => {
  it("releases a known refused save for deliberate edit or dismiss without retrying it", async () => {
    const initial = proposal();
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(rejected())
      .mockResolvedValueOnce(Response.json({ proposal: { ...initial, status: "dismissed" } }));
    vi.stubGlobal("fetch", fetcher);
    const card = cardHarness(initial);

    click(button(card.render(), "Save to Work"));
    await tick();
    await tick();
    const refused = card.render();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(card.onRejected).toHaveBeenCalledTimes(1);
    expect(card.onUncertain).not.toHaveBeenCalled();
    expect(card.onChange).not.toHaveBeenCalled();
    expect(find(refused, "article").props["data-review-status"]).toBe("proposed");
    expect(words(find(refused, "p", (node) => node.props.role === "alert"))).toContain("attempt was refused");
    expect(button(refused, "Edit suggestion").props.disabled).toBe(false);
    expect(button(refused, "Dismiss").props.disabled).toBe(false);
    click(button(refused, "Edit suggestion"));
    const editor = walk(card.render()).find((node) => typeof node.type === "function" && node.type.name === "ReviewEditor");
    expect(editor).toBeDefined();
    (editor!.props.onCancel as () => void)();
    expect(fetcher).toHaveBeenCalledTimes(1);

    click(button(card.render(), "Dismiss"));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toMatchObject({ action: "dismiss", proposalId: initial.id });
    expect(card.onChange).toHaveBeenCalledTimes(1);
    expect(find(card.render(), "article").props["data-review-status"]).toBe("dismissed");
  });

  it("closes double clicks while pending, then permits an explicit retry after a confirmed refusal", async () => {
    const response = deferred<Response>();
    const fetcher = vi.fn<typeof fetch>().mockReturnValueOnce(response.promise).mockResolvedValueOnce(rejected());
    vi.stubGlobal("fetch", fetcher);
    const card = cardHarness();
    const first = card.render();
    click(button(first, "Save to Work"));
    click(button(first, "Save to Work"));
    click(button(first, "Dismiss"));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(button(card.render(), "Dismiss").props.disabled).toBe(true);
    response.resolve(rejected());
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    click(button(card.render(), "Save to Work"));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(card.onRejected).toHaveBeenCalledTimes(2);
  });

  it("requires fresh knowledge confirmation after a known refusal", async () => {
    const initial = proposal();
    initial.payload = { type: "knowledge", statement: "A fictional rule", kind: "constraint", scope: { type: "company", label: "Fictional Co" },
      duration: { type: "until_changed" }, citations: initial.payload.citations };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(rejected("calendar_date"));
    vi.stubGlobal("fetch", fetcher);
    const card = cardHarness(initial);
    const checkbox = find(card.render(), "input", (node) => node.props.type === "checkbox");
    (checkbox.props.onChange as (event: unknown) => void)({ target: { checked: true } });
    click(button(card.render(), "Add to company knowledge"));
    await tick();
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ action: "add_to_company_knowledge", knowledgeApproved: true });
    const refused = card.render();
    expect(find(refused, "input", (node) => node.props.type === "checkbox").props.checked).toBe(false);
    expect(button(refused, "Add to company knowledge").props.disabled).toBe(true);
    expect(button(refused, "Edit suggestion").props.disabled).toBe(false);
    click(button(refused, "Add to company knowledge"));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps legacy suggestions readable and dismissible while handlers refuse new edits or saves", async () => {
    const initial = proposal();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ proposal: { ...initial, status: "dismissed" } }));
    vi.stubGlobal("fetch", fetcher);
    const card = cardHarness(initial, false);
    const view = card.render();
    expect(button(view, "Save to Work").props.disabled).toBe(true);
    expect(button(view, "Edit suggestion").props.disabled).toBe(true);
    expect(button(view, "Dismiss").props.disabled).toBe(false);
    click(button(view, "Save to Work"));
    click(button(view, "Edit suggestion"));
    expect(fetcher).not.toHaveBeenCalled();
    expect(walk(card.render()).some((node) => typeof node.type === "function" && node.type.name === "ReviewEditor")).toBe(false);
    click(button(card.render(), "Dismiss"));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ action: "dismiss" });
  });

  it("keeps the asserted knowledge statement immutable while allowing scope and duration edits", () => {
    const initial = proposal();
    initial.payload = { type: "knowledge", statement: "This exact founder assertion must remain unchanged.", kind: "constraint", scope: { type: "company", label: "Fictional Co" },
      duration: { type: "until_date", date: "2027-01-01" }, citations: initial.payload.citations };
    const card = cardHarness(initial);
    click(button(card.render(), "Edit suggestion"));
    const editor = walk(card.render()).find((node) => typeof node.type === "function" && node.type.name === "ReviewEditor")!;
    const onSubmit = vi.fn();
    hooks.slots = []; hooks.cursor = 0;
    const view = (editor.type as (props: Record<string, unknown>) => unknown)({ ...editor.props, onSubmit });
    expect(walk(view).some((node) => node.props.name === "statement")).toBe(false);
    expect(words(view)).toContain("start a new request");
    const values = new Map([["statement", "An injected replacement"], ["scopeType", "customer"], ["scopeLabel", "Fictional customer"], ["date", "2027-02-02"]]);
    vi.stubGlobal("FormData", class { get(name: string) { return values.get(name) ?? null; } });
    (find(view, "form").props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn(), currentTarget: {} });
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ ...initial.payload, scope: { type: "customer", label: "Fictional customer" }, duration: { type: "until_date", date: "2027-02-02" } });
  });

  it.each([
    ["unknown refusal reason", () => rejected("unknown_reason")],
    ["wrong refusal marker", () => Response.json({ error: "other", reason: "duplicate_work" }, { status: 422 })],
    ["wrong HTTP status", () => Response.json({ error: "review_rejected", reason: "duplicate_work" }, { status: 409 })],
    ["malformed refusal body", () => new Response("not JSON", { status: 422 })],
    ["malformed success receipt", () => Response.json({ proposal: {} })],
  ] as const)("keeps an %s locked pending reconciliation", async (_name, reply) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(reply());
    vi.stubGlobal("fetch", fetcher);
    const card = cardHarness();
    const original = card.render();
    click(button(original, "Save to Work"));
    await tick();
    const uncertain = card.render();
    expect(card.onRejected).not.toHaveBeenCalled();
    expect(card.onUncertain).toHaveBeenCalledTimes(1);
    expect(card.onChange).not.toHaveBeenCalled();
    for (const label of ["Save to Work", "Edit suggestion", "Dismiss"]) expect(button(uncertain, label).props.disabled).toBe(true);
    expect(words(uncertain)).toContain("cannot confirm");
    click(button(original, "Save to Work"));
    click(button(original, "Dismiss"));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps a lost response locked and never retries automatically", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("connection lost"));
    vi.stubGlobal("fetch", fetcher);
    const card = cardHarness();
    const original = card.render();
    click(button(original, "Save to Work"));
    await tick();
    expect(button(card.render(), "Edit suggestion").props.disabled).toBe(true);
    click(button(original, "Dismiss"));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(card.onUncertain).toHaveBeenCalledTimes(1);
    expect(card.onRejected).not.toHaveBeenCalled();
  });
});

describe("parent handling of confirmed review refusals", () => {
  it("releases the mutation lock while keeping older read results fenced out", async () => {
    const oldRead = deferred<Response>();
    const initial = snapshot();
    const next = { ...snapshot(), messages: [{ id: "fresh", role: "person" as const, body: "Fresh accepted read" }] };
    const fetcher = vi.fn<typeof fetch>().mockReturnValueOnce(oldRead.promise).mockResolvedValueOnce(Response.json(next));
    vi.stubGlobal("fetch", fetcher);

    const before = parent(initial);
    click(button(before, "Check stored progress"));
    const callbacks = find(before, ReviewCards).props;
    expect((callbacks.onMutationStart as () => boolean)()).toBe(true);
    expect(find(parent(initial), ReviewCards).props.disabled).toBe(true);
    (callbacks.onRejected as () => void)();
    expect(find(parent(initial), ReviewCards).props.disabled).toBe(false);
    expect(find(parent(initial), "textarea").props.disabled).toBe(false);

    oldRead.resolve(Response.json({ ...snapshot(), messages: [{ id: "old", role: "person", body: "Stale read must not appear" }],
      proposals: [{ ...proposal(), status: "saved", record_id: "old-record" }] }));
    await tick();
    expect(words(parent(initial))).not.toContain("Stale read must not appear");
    expect(hooks.refresh).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);

    const currentCallbacks = find(parent(initial), ReviewCards).props;
    expect((currentCallbacks.onMutationStart as () => boolean)()).toBe(true);
    (currentCallbacks.onRejected as () => void)();
    click(button(parent(initial), "Check stored progress"));
    await tick();
    expect(words(parent(initial))).toContain("Fresh accepted read");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("keeps the desk blocked after an uncertain mutation until a deliberate read reconciles it", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(snapshot()));
    vi.stubGlobal("fetch", fetcher);
    const initial = snapshot();
    const callbacks = find(parent(initial), ReviewCards).props;
    expect((callbacks.onMutationStart as () => boolean)()).toBe(true);
    (callbacks.onUncertain as () => void)();
    expect(find(parent(initial), ReviewCards).props.disabled).toBe(true);
    expect(find(parent(initial), "textarea").props.disabled).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
    click(button(parent(initial), "Check stored progress"));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(find(parent(initial), ReviewCards).props.disabled).toBe(false);
  });

  it("does not let a confirmed refusal clear a changed-identity fence", () => {
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    const initial = snapshot();
    const callbacks = find(parent(initial), ReviewCards).props;
    expect((callbacks.onMutationStart as () => boolean)()).toBe(true);
    const changed = { ...initial, actorId: "actor-two", companyId: "company-two" };
    expect(find(parent(changed), ReviewCards).props.disabled).toBe(true);
    (callbacks.onRejected as () => void)();
    const fenced = parent(changed);
    expect(find(fenced, ReviewCards).props.disabled).toBe(true);
    expect(find(fenced, "textarea").props.disabled).toBe(true);
    expect((find(fenced, ReviewCards).props.onMutationStart as () => boolean)()).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
