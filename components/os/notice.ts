/* A notice: the desk telling you something happened.
 *
 * Every action on the desk used to end in silence — the page re-rendered and
 * the thing you pressed was simply different afterwards, if you noticed. A
 * desk says so. Notices travel over a window event, the same route ⌘K and
 * the open-item buttons use, because the forms that raise them are rendered
 * on the server and the shell is not.
 */

export const OS_NOTICE_EVENT = "maydaos:notice";

export type OsNotice = { text: string; tone?: "quiet" | "problem" };

export function notify(text: string, tone: OsNotice["tone"] = "quiet") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OsNotice>(OS_NOTICE_EVENT, { detail: { text, tone } }));
}
