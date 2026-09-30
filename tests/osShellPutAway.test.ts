import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Activity } from "react";
import { OsShell } from "@/components/os/OsShell";
import { shellProps } from "./osShellFixture";

/* A window put away is a window kept.
 *
 * What a window shows — a reply that arrived, a draft half typed, a card not
 * yet decided — is its own state. Until 30 September the shell rendered only
 * the windows on screen, so putting the co-founder away unmounted it and
 * bringing it back mounted a fresh one seeded from the page-load snapshot:
 * the reply was in the database and gone from the screen. These tests pin
 * the tree the shell now returns: hidden, not gone.
 */

// Vitest runs in Node without a DOM. Drive the client component's own
// handlers with stable hook slots, as tests/osReviewRecoveryInteraction does,
// and walk the element tree it returns.
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
    useMemo: (compute: () => unknown) => compute(),
    useCallback: (callback: unknown) => callback,
    useEffect: () => undefined,
    useLayoutEffect: () => undefined,
  };
});
vi.mock("@/app/actions/desktop", () => ({
  saveDesktopAction: vi.fn(async () => undefined),
  markSeenAction: vi.fn(async () => undefined),
  savePrefsAction: vi.fn(async () => undefined),
}));
vi.mock("@/components/os/OsCommandBar", () => ({ OS_COMMAND_EVENT: "synthetic-command", OS_ASK_EVENT: "synthetic-ask", OsCommandBar: () => null }));
vi.mock("@/components/os/SettingsPanel", () => ({ OS_PREFS_EVENT: "synthetic-prefs", SettingsPanel: () => null }));
vi.mock("@/components/os/OsBackdrop", () => ({ OsBackdrop: () => null }));
vi.mock("@/components/os/OsNotices", () => ({ OsNotices: () => null }));
vi.mock("@/components/os/OsClock", () => ({ OsClock: () => null }));
vi.mock("@/components/os/OsIcon", () => ({ OsIcon: () => null }));
vi.mock("@/components/os/ActionForm", () => ({ ActionForm: () => null }));

type ViewNode = { type: unknown; key: string | null; props: Record<string, unknown> };
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
function render() {
  hooks.cursor = 0;
  return OsShell(shellProps());
}
function mounted(view: unknown, key: string): ViewNode | undefined {
  return walk(view).find((node) => node.type === Activity && node.key === key);
}
function section(view: unknown, label: string): ViewNode {
  const found = walk(view).find((node) => node.type === "section" && node.props["aria-label"] === label);
  if (!found) throw new Error(`No window ${label}`);
  return found;
}
function dot(view: unknown, label: string, kind: "minimize" | "close"): ViewNode {
  const found = walk(section(view, label)).find((node) => node.type === "button" && node.props["data-kind"] === kind);
  if (!found) throw new Error(`No ${kind} dot on ${label}`);
  return found;
}
function dockItem(view: unknown, title: string): ViewNode {
  const found = walk(view).find((node) => node.type === "button" && node.props.className === "os-dock-item" && words(node.props.children) === title);
  if (!found) throw new Error(`No dock item ${title}`);
  return found;
}
function click(node: ViewNode) { (node.props.onClick as () => void)(); }

describe("the desk keeps a window it has put away", () => {
  beforeEach(() => { hooks.slots = []; hooks.cursor = 0; vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("mounts put-away windows and closed dock apps hidden, and the open one visible", () => {
    const view = render();

    const cofounder = mounted(view, "cofounder");
    expect(cofounder?.props.mode).toBe("hidden");
    expect(words(section(cofounder, "Co-founder").props.children)).toContain("cofounder-node");

    expect(mounted(view, "work")?.props.mode).toBe("visible");
    // A closed dock app is kept too: reopening it must not forget either.
    expect(mounted(view, "record")?.props.mode).toBe("hidden");
    // An open document put away stays, like any window.
    expect(mounted(view, "item:draft")?.props.mode).toBe("hidden");
  });

  it("keeps the same key while a window leaves, is away, and comes back", () => {
    let view = render();
    click(dot(view, "Work", "minimize"));

    // Drawn on its way out: still visible while the leaving animation plays.
    view = render();
    expect(section(view, "Work").props["data-leaving"]).toBe("away");
    expect(mounted(view, "work")?.props.mode).toBe("visible");

    vi.advanceTimersByTime(200);
    view = render();
    expect(mounted(view, "work")?.props.mode).toBe("hidden");
    expect(section(view, "Work").props["data-leaving"]).toBeUndefined();
    expect(words(section(view, "Work").props.children)).toContain("work-node");

    click(dockItem(view, "Work"));
    view = render();
    expect(mounted(view, "work")?.props.mode).toBe("visible");
  });

  it("lets a closed document go, and keeps a closed dock app", () => {
    let view = render();
    click(dockItem(view, "A draft"));
    view = render();
    expect(mounted(view, "item:draft")?.props.mode).toBe("visible");

    click(dot(view, "A draft", "close"));
    vi.advanceTimersByTime(200);
    view = render();
    expect(mounted(view, "item:draft")).toBeUndefined();
    expect(words(view)).not.toContain("draft-node");

    click(dot(view, "Work", "close"));
    vi.advanceTimersByTime(200);
    view = render();
    expect(mounted(view, "work")?.props.mode).toBe("hidden");
    expect(words(view)).toContain("work-node");
  });

  it("on a phone keeps every pane mounted and shows one", () => {
    render();
    // The narrow flag is the one boolean slot; the shell learns it from a
    // media query in an effect, which does not run here.
    const narrow = hooks.slots.indexOf(false);
    expect(narrow).toBeGreaterThanOrEqual(0);
    hooks.slots[narrow] = true;

    let view = render();
    expect(mounted(view, "brief")?.props.mode).toBe("visible");
    expect(mounted(view, "cofounder")?.props.mode).toBe("hidden");
    expect(words(mounted(view, "cofounder"))).toContain("Co-founder");
    expect(words(mounted(view, "cofounder"))).toContain("cofounder-node");

    click(dockItem(view, "Co-founder"));
    view = render();
    expect(mounted(view, "cofounder")?.props.mode).toBe("visible");
    expect(mounted(view, "brief")?.props.mode).toBe("hidden");
    expect(words(mounted(view, "brief"))).toContain("brief-node");
  });
});
