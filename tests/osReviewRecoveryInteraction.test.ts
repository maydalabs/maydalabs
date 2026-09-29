import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CofounderApp } from "@/components/os/CofounderApp";
import { ReviewIntentFields, ReviewIntentSummary } from "@/components/os/ReviewIntentFields";
import { OS_COFOUNDER_CHAT_COPY } from "@/components/osCopy";
import { pendingQuestionKey } from "@/lib/osReviewPending";
import type { ReviewSnapshot } from "@/lib/osReviewTypes";

// Vitest runs in Node and this repo has no DOM test package. Drive the client
// component's own handlers with stable hook slots and synthetic browser APIs.
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
    useId: () => "mode-help",
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
function find(view: unknown, type: string, match: (node: ViewNode) => boolean): ViewNode {
  const found = walk(view).find((node) => node.type === type && match(node));
  if (!found) throw new Error(`Missing ${type} control`);
  return found;
}
function click(node: ViewNode) { (node.props.onClick as () => void)(); }
function button(view: unknown, label: string) { return find(view, "button", (node) => words(node.props.children) === label); }
function intentFields(view: unknown) {
  const element = walk(view).find((node) => node.type === ReviewIntentFields);
  if (!element) throw new Error("Missing request choices");
  return ReviewIntentFields(element.props as Parameters<typeof ReviewIntentFields>[0]);
}
function change(node: ViewNode, value: string) { (node.props.onChange as (event: unknown) => void)({ target: { value } }); }
function selectMode(mode: "ask" | "draft" | "knowledge" | "both") {
  (find(render(), "input", (node) => node.props.value === mode).props.onChange as () => void)();
}
function submit(view: unknown) { (find(view, "form", () => true).props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn() }); }
function render(locale: "en" | "tr" | "fr" = "en", snapshot: ReviewSnapshot = emptySnapshot()) {
  hooks.cursor = 0;
  return CofounderApp({ initialSnapshot: snapshot, locale, copy: OS_COFOUNDER_CHAT_COPY[locale], canTalk: true, why: null });
}
function emptySnapshot(): ReviewSnapshot {
  return { companyId: "company-one", actorId: "actor-one", messages: [], proposals: [], turns: [] };
}
function turn(id: string, question: string, mode: "ask" | "draft" | "knowledge" | "both", status: "running" | "completed" = "completed"): ReviewSnapshot["turns"][number] {
  return { id, question, mode, intent: null, status, company_id: "company-one", actor_id: "actor-one", thread_id: "thread-one", person_message_id: "message-one", reply: null, created_at: "2026-09-23T00:00:00Z", updated_at: "2026-09-23T00:01:00Z", history: [] };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const key = pendingQuestionKey("actor-one", "company-one");
const legacy = { requestId: "10000000-0000-4000-8000-000000000001", message: "Old exact question" };
const pending = { requestId: "20000000-0000-4000-8000-000000000002", message: "New exact request", mode: "knowledge" as const, intent: { draftFormat: null, knowledgeAssertion: "A statement I stand behind." } };

function browserStorage(initial: string | null, unavailable = false) {
  const values = new Map<string, string>();
  if (initial !== null) values.set(key, initial);
  const getItem = vi.fn((name: string) => {
    if (unavailable) throw new Error("session storage blocked");
    return values.get(name) ?? null;
  });
  const setItem = vi.fn((name: string, value: string) => { values.set(name, value); });
  const removeItem = vi.fn((name: string) => { values.delete(name); });
  vi.stubGlobal("sessionStorage", { getItem, setItem, removeItem });
  vi.stubGlobal("window", Object.assign(new EventTarget(), { confirm: vi.fn(() => true) }));
  return { values, getItem, setItem, removeItem };
}

beforeEach(() => { hooks.slots = []; hooks.cursor = 0; });
afterEach(() => vi.unstubAllGlobals());

describe("review recovery controls without a model or database", () => {
  it("does not clear a newer browser hint when an older legacy receipt arrives", async () => {
    const storage = browserStorage(JSON.stringify(legacy));
    const later = { requestId: "30000000-0000-4000-8000-000000000003", message: "Another request", mode: "draft" as const, intent: { draftFormat: "note", knowledgeAssertion: null } };
    const response = deferred<Response>();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    vi.stubGlobal("fetch", fetcher);

    click(button(render(), "Check stored progress"));
    expect(fetcher).toHaveBeenCalledWith(`/api/os/review?requestId=${legacy.requestId}`, { cache: "no-store" });
    storage.values.set(key, JSON.stringify(later));
    response.resolve(Response.json({ ...emptySnapshot(), turns: [turn(legacy.requestId, legacy.message, "both")] }));
    await tick();

    expect(storage.values.get(key)).toBe(JSON.stringify(later));
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it("clears the exact legacy hint when its matching receipt arrives and the hint is unchanged", async () => {
    const storage = browserStorage(JSON.stringify(legacy));
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ...emptySnapshot(), turns: [turn(legacy.requestId, legacy.message, "both")] })));

    click(button(render(), "Check stored progress"));
    await tick();

    expect(storage.values.has(key)).toBe(false);
    expect(storage.removeItem).toHaveBeenCalledExactlyOnceWith(key);
  });

  it("keeps retry disabled while a different stored turn is still running", async () => {
    browserStorage(JSON.stringify(pending));
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ...emptySnapshot(), turns: [turn("other-turn", "Other question", "ask", "running")] }));
    vi.stubGlobal("fetch", fetcher);

    click(button(render(), "Check stored progress"));
    await tick();
    const retry = button(render(), "Retry this exact request");
    expect(retry.props.disabled).toBe(true);
    click(retry); // The handler must guard as well as the disabled control.
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("shows the retained mode while a deliberate retry is in flight", async () => {
    browserStorage(JSON.stringify(pending));
    const post = deferred<Response>();
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(emptySnapshot()))
      .mockReturnValueOnce(post.promise);
    vi.stubGlobal("fetch", fetcher);

    click(button(render(), "Check stored progress"));
    await tick();
    click(button(render(), "Retry this exact request"));
    const inFlight = render();
    expect(find(inFlight, "input", (node) => node.props.value === "knowledge").props.checked).toBe(true);
    expect(words(inFlight)).toContain(OS_COFOUNDER_CHAT_COPY.en.modes.knowledge.help);
    expect(find(intentFields(inFlight), "textarea", (node) => node.props.name === "review-knowledge-assertion").props.value).toBe(pending.intent.knowledgeAssertion);
    expect(find(inFlight, "textarea", () => true).props.value).toBe(pending.message);
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toMatchObject({
      requestId: pending.requestId, message: pending.message, mode: "knowledge",
      intent: pending.intent,
    });

    post.resolve(Response.json({ error: "unconfirmed" }, { status: 409 }));
    await tick();
  });

  it("treats a modeful old hint as lookup-only and never invents intent to retry", async () => {
    const old = { ...legacy, mode: "draft" };
    const storage = browserStorage(JSON.stringify(old));
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(emptySnapshot()));
    vi.stubGlobal("fetch", fetcher);
    click(button(render(), "Check stored progress"));
    await tick();
    const view = render();
    expect(walk(view).filter((node) => node.type === "button").map((node) => words(node.props.children))).not.toContain("Retry this exact request");
    expect(find(view, "textarea", () => true).props.disabled).toBe(true);
    expect(storage.values.get(key)).toBe(JSON.stringify(old));
    expect(fetcher).toHaveBeenCalledExactlyOnceWith(`/api/os/review?requestId=${old.requestId}`, { cache: "no-store" });
  });

  it("refuses a retained retry if its assertion changed in browser storage after it was displayed", async () => {
    const storage = browserStorage(JSON.stringify(pending));
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(emptySnapshot()));
    vi.stubGlobal("fetch", fetcher);
    click(button(render(), "Check stored progress"));
    await tick();
    const oldView = render();
    storage.values.set(key, JSON.stringify({ ...pending, intent: { ...pending.intent, knowledgeAssertion: "A changed statement." } }));
    click(button(oldView, "Retry this exact request"));
    await tick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([
    ["en", "Browser session storage is unavailable"],
    ["tr", "Tarayıcı oturum depolamasına erişilemiyor"],
    ["fr", "Le stockage de session du navigateur est indisponible"],
  ] as const)("explains unavailable storage separately from a clearable hint in %s", (locale, copy) => {
    browserStorage(null, true);
    const view = render(locale);
    expect(words(find(view, "p", (node) => node.props.role === "alert"))).toContain(copy);
    expect(walk(view).filter((node) => node.type === "button").map((node) => words(node.props.children))).not.toContain("Clear old browser hint");
    expect(find(view, "textarea", () => true).props.disabled).toBe(true);
  });
});

describe("explicit draft format and company assertion", () => {
  it("requires a deliberate format before Draft can submit, including through the handler", async () => {
    const storage = browserStorage(null);
    const response = deferred<Response>();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    vi.stubGlobal("fetch", fetcher);
    selectMode("draft");
    change(find(render(), "textarea", () => true), "Prepare a message to Jori.");
    const unselected = render();
    expect(find(intentFields(unselected), "select", () => true).props.value).toBe("");
    expect(find(unselected, "button", (node) => node.props.type === "submit").props.disabled).toBe(true);
    submit(unselected);
    expect(fetcher).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();

    change(find(intentFields(render()), "select", () => true), "email");
    const ready = render();
    expect(find(ready, "button", (node) => node.props.type === "submit").props.disabled).toBe(false);
    submit(ready);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    expect(sent.intent).toEqual({ draftFormat: "email", knowledgeAssertion: null });
    expect(JSON.parse(storage.values.get(key)!)).toMatchObject({ requestId: sent.requestId, message: sent.message, mode: "draft", intent: sent.intent });
    expect(find(intentFields(render()), "select", () => true).props.value).toBe("email");
    expect(find(render(), "textarea", () => true).props.value).toBe("Prepare a message to Jori.");
    response.resolve(Response.json({ error: "unconfirmed" }, { status: 409 }));
    await tick();
  });

  it("clears previous format and assertion when changing mode and sends no hidden assertion", async () => {
    browserStorage(null);
    const response = deferred<Response>();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    vi.stubGlobal("fetch", fetcher);
    selectMode("both");
    change(find(intentFields(render()), "select", () => true), "reply");
    change(find(intentFields(render()), "textarea", () => true), "The old statement should not follow.");
    selectMode("draft");
    expect(find(intentFields(render()), "select", () => true).props.value).toBe("");
    selectMode("both");
    expect(find(intentFields(render()), "textarea", () => true).props.value).toBe("");
    selectMode("ask");
    change(find(render(), "textarea", () => true), "What should I consider?");
    submit(render());
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({ mode: "ask", intent: { draftFormat: null, knowledgeAssertion: null } });
    response.resolve(Response.json({ error: "unconfirmed" }, { status: 409 }));
    await tick();
  });

  it("keeps asserted text distinct from a quoted chat message and retains its exact trimmed snapshot", async () => {
    const storage = browserStorage(null);
    const response = deferred<Response>();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    vi.stubGlobal("fetch", fetcher);
    selectMode("knowledge");
    change(find(render(), "textarea", () => true), 'Vendor says "We have exclusivity." What should we check?');
    change(find(intentFields(render()), "textarea", () => true), "  We have not accepted exclusivity.\nThe terms are under review.  ");
    submit(render());
    const request = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    expect(request.intent).toEqual({ draftFormat: null, knowledgeAssertion: "We have not accepted exclusivity.\nThe terms are under review." });
    expect(request.message).toContain('Vendor says "We have exclusivity."');
    expect(JSON.parse(storage.values.get(key)!).intent).toEqual(request.intent);
    response.resolve(Response.json({ error: "unconfirmed" }, { status: 409 }));
    await tick();
    const pendingView = render();
    const summary = walk(pendingView).find((node) => node.type === ReviewIntentSummary);
    expect(summary?.props.intent).toEqual(request.intent);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("permits blank knowledge assertion for discussion but rejects a partial assertion", () => {
    browserStorage(null);
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    selectMode("knowledge");
    change(find(render(), "textarea", () => true), "Help me understand this quoted claim.");
    expect(find(render(), "button", (node) => node.props.type === "submit").props.disabled).toBe(false);
    change(find(intentFields(render()), "textarea", () => true), "No");
    const invalid = render();
    expect(find(invalid, "button", (node) => node.props.type === "submit").props.disabled).toBe(true);
    submit(invalid);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("puts a request refused before it began back in the person's hands instead of locking the desk", async () => {
    const storage = browserStorage(null);
    const response = deferred<Response>();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    vi.stubGlobal("fetch", fetcher);
    change(find(render(), "textarea", () => true), "What should I test first?");
    submit(render());
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(storage.values.has(key)).toBe(true);
    response.resolve(Response.json({ error: "review_access_denied" }, { status: 403 }));
    await tick();
    const view = render();
    expect(storage.values.has(key)).toBe(false);
    expect(find(view, "textarea", () => true).props.value).toBe("What should I test first?");
    expect(find(view, "textarea", () => true).props.disabled).toBe(false);
    expect(words(view)).toContain("refused before anything started");
    expect(words(view)).toContain("review_access_denied");
    expect(words(view)).not.toContain("The result is unconfirmed");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps a 409 the route could not confirm uncertain, because a turn may already exist", async () => {
    const storage = browserStorage(null);
    const response = deferred<Response>();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    vi.stubGlobal("fetch", fetcher);
    change(find(render(), "textarea", () => true), "Draft me nothing yet.");
    submit(render());
    response.resolve(Response.json({ error: "turn_unconfirmed" }, { status: 409 }));
    await tick();
    const view = render();
    expect(storage.values.has(key)).toBe(true);
    expect(find(view, "textarea", () => true).props.disabled).toBe(true);
    expect(words(view)).toContain("The result is unconfirmed");
  });
});
