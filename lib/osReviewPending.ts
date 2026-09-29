import { isReviewRequestMode, parseReviewRequestIntent, type ReviewRequestIntent, type ReviewRequestMode } from "@/lib/osReviewIntent";

// An unresolved generation keeps its exact nonce across reloads. This is only
// a local recovery hint, never authority or proof of a stored turn.
export type PendingQuestion = { requestId: string; message: string; mode: ReviewRequestMode; intent: ReviewRequestIntent };
export type LegacyPendingQuestion = Pick<PendingQuestion, "requestId" | "message"> & { mode?: ReviewRequestMode };
// Keep the v1 key: an older mode-less record must remain visible and block a
// new request rather than being skipped by a new storage namespace.
export function pendingQuestionKey(actorId: string, companyId: string) { return `maydaos-review-request-v1:${actorId}:${companyId}`; }
export function parsePendingQuestion(value: string | null): PendingQuestion | null {
  try {
    const p = JSON.parse(value ?? "null");
    if (p && typeof p.requestId === "string" && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(p.requestId) && typeof p.message === "string" && p.message.trim() && p.message.length <= 8000 && isReviewRequestMode(p.mode)) {
      const intent = parseReviewRequestIntent(p.intent, p.mode);
      if (intent) return { requestId: p.requestId, message: p.message, mode: p.mode, intent };
    }
  } catch { /* Invalid local state is not a server receipt. */ }
  return null;
}
/** Older hints have no captured intent, even when they already have a mode.
 * Keep their nonce for receipt lookup; never invent intent for a retry. */
export function parseLegacyPendingQuestion(value: string | null): LegacyPendingQuestion | null {
  try {
    const p = JSON.parse(value ?? "null");
    if (!p || typeof p !== "object" || Array.isArray(p) || Object.hasOwn(p, "intent") ||
      (Object.hasOwn(p, "mode") && !isReviewRequestMode(p.mode))) return null;
    if (typeof p.requestId !== "string" || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(p.requestId)) return null;
    if (typeof p.message !== "string" || !p.message.trim() || p.message.length > 8000) return null;
    return { requestId: p.requestId, message: p.message, ...(isReviewRequestMode(p.mode) ? { mode: p.mode } : {}) };
  } catch { /* An unreadable hint is not a server receipt. */ }
  return null;
}
export function subscribePending(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener("maydaos:pending-question", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("maydaos:pending-question", callback); };
}
export function writePending(key: string, question: PendingQuestion | null) {
  if (question && !isReviewRequestMode(question.mode)) throw new Error("invalid_request_mode");
  if (question && !parseReviewRequestIntent(question.intent, question.mode)) throw new Error("invalid_request_intent");
  if (question) sessionStorage.setItem(key, JSON.stringify(question)); else sessionStorage.removeItem(key);
  window.dispatchEvent(new Event("maydaos:pending-question"));
}
