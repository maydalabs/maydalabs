import type { ReactNode } from "react";

/* What an app is.
 *
 * Defined before the first interesting app exists, on purpose. The
 * co-founder conversation, the record, files — each arrives as one of these
 * rather than as a special case, and the shell never learns their names.
 */
export type OsAppId = "cofounder" | "needs-you" | "running" | "company";

export type OsApp = {
  id: OsAppId;
  title: string;
  /* A glyph, not an icon set. Real icons are a later problem and a wrong
   * icon set is harder to remove than none. */
  glyph: string;
  /* Rendered on the server and handed across as a node, so an app can be a
   * server component with its own data access. The shell only arranges. */
  node: ReactNode;
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
  close: string;
  minimize: string;
  resize: string;
  noCompany: string;
  leave: string;
};
