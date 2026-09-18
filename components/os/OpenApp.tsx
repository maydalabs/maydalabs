"use client";

import { OS_OPEN_APP_EVENT, type OsAppId } from "@/components/os/types";

/* A sentence that opens an app.
 *
 * The same route OpenItem takes for documents: a window event, because the
 * text around it is rendered on the server and the shell is not. Used where a
 * server-rendered surface wants to hand the person on — "and four more in
 * Needs you" — without turning into a navigation.
 */
export function OpenApp({ app, children }: { app: OsAppId; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="os-open-app"
      onClick={() => window.dispatchEvent(new CustomEvent(OS_OPEN_APP_EVENT, { detail: app }))}
    >
      {children}
    </button>
  );
}
