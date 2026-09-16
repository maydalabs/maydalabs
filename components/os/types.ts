import type { ReactNode } from "react";
import type { OsIconName } from "@/components/os/OsIcon";

/* What an app is.
 *
 * Defined before the first interesting app exists, on purpose. The
 * co-founder conversation, the record, files — each arrives as one of these
 * rather than as a special case, and the shell never learns their names.
 */
export type OsAppId = "cofounder" | "needs-you" | "running" | "record" | "memory" | "company";

export type OsApp = {
  id: OsAppId;
  title: string;
  /* A drawn icon rather than a borrowed set: see components/os/OsIcon.tsx. */
  icon: OsIconName;
  /* Rendered on the server and handed across as a node, so an app can be a
   * server component with its own data access. The shell only arranges. */
  node: ReactNode;
  /* Shares of the surface, 0..1 — not pixels. See OsWindowState.placed. */
  defaultRect: OsRect;
  /* Opened the first time a person ever arrives. Everything else waits in
   * the dock. */
  openByDefault?: boolean;
};

export type OsRect = { x: number; y: number; w: number; h: number };

export type OsWindowState = OsRect & {
  app: OsAppId;
  z: number;
  open: boolean;
  minimized: boolean;
  /* False while x/y/w/h are shares of the surface (0..1), true once a person
   * has dragged or resized the window and they became pixels. A default
   * expressed as a fraction fits whatever screen it lands on; a default
   * expressed in pixels fits the one it was written on. */
  placed: boolean;
};

/* Everything the shell shows, as plain strings.
 *
 * Nothing here may be a function. This type is the server/client boundary:
 * copy that needs a number in it — "3 waiting on you" — is resolved on the
 * server and arrives already written, which is also why the shell never has
 * to know what locale it is in. */
export type OsShellCopy = {
  desktop: string;
  empty: string;
  emptyHint: string;
  waitingLabel: string;
  /* The same fact in the space a phone has. Truncation is not a short
   * form — "Sear" is not a word. */
  waitingShort: string;
  close: string;
  minimize: string;
  resize: string;
  noCompany: string;
  leave: string;
  newSince: string;
  markSeen: string;
};
