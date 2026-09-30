import type { OsApp, OsDocument, OsShellCopy } from "@/components/os/types";
import type { CommandBarCopy } from "@/components/os/OsCommandBar";
import { DEFAULT_PREFS } from "@/lib/osDesktop";

/* A small desk for the shell tests: three dock apps and one document, each
 * app's node a plain string so its presence in the tree can be read as a
 * word. No React import here — the tests mock React two different ways. */

const rect = { x: 0.1, y: 0.1, w: 0.5, h: 0.6 };

export const apps: OsApp[] = [
  { id: "cofounder", title: "Co-founder", icon: "cofounder", node: "cofounder-node", defaultRect: rect },
  { id: "work", title: "Work", icon: "work", node: "work-node", defaultRect: rect },
  { id: "record", title: "Record", icon: "record", node: "record-node", defaultRect: rect },
];

export const documents: OsDocument[] = [
  { key: "item:draft", title: "A draft", icon: "work", node: "draft-node" },
];

export const copy: OsShellCopy = {
  desktop: "Desktop", today: "Today", waitingLabel: "1 waiting", waitingShort: "1",
  close: "Close", minimize: "Put away", resize: "Resize",
  leftHalf: "Left", rightHalf: "Right", fill: "Fill",
  noCompany: "No company", leave: "Leave", newSince: "New", markSeen: "Mark seen", seen: "Seen",
};

/* The co-founder put away, Work in front, the Record closed, the document
 * open but put away. Work carries the highest z so its dot means "put away". */
export const layout = [
  { app: "cofounder", open: true, minimized: true, placed: true, x: 40, y: 40, w: 520, h: 420, z: 2 },
  { app: "work", open: true, minimized: false, placed: true, x: 80, y: 80, w: 520, h: 420, z: 5 },
  { app: "record", open: false, minimized: false, placed: false, x: 0.1, y: 0.1, w: 0.5, h: 0.6, z: 1 },
  { app: "item:draft", open: true, minimized: true, placed: true, x: 120, y: 120, w: 520, h: 420, z: 4 },
];

export function shellProps(storedLayout: unknown = layout) {
  return {
    apps, documents, brief: "brief-node", locale: "en", prefs: DEFAULT_PREFS, copy, storedLayout,
    companyName: "Lantern Bakery", waitingCount: 1, email: null, accountHref: "/account",
    commandTargets: [], commandCopy: {} as CommandBarCopy, unreadCount: 0,
  };
}
