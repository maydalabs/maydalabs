import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OsShell } from "@/components/os/OsShell";
import { shellProps } from "./osShellFixture";

/* The server's half of "hidden, not gone": a window saved put away renders
 * no markup on the server — React mounts it hidden on the client without
 * expecting any — while an open window renders in full. The dock lists both. */

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

describe("the desk on the server", () => {
  it("renders an open window and nothing for a put-away or closed one", () => {
    const html = renderToStaticMarkup(createElement(OsShell, shellProps()));

    expect(html).toContain('aria-label="Work"');
    expect(html).toContain("work-node");

    expect(html).not.toContain('aria-label="Co-founder"');
    expect(html).not.toContain("cofounder-node");
    expect(html).not.toContain("record-node");
    expect(html).not.toContain("draft-node");

    // The dock still names them, put away or closed.
    expect(html).toContain(">Co-founder</button>");
    expect(html).toContain(">Record</button>");
  });
});
