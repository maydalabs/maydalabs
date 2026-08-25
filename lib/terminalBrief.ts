export const TERMINAL_BRIEF_SESSION_KEY = "ml_terminal_brief_v1";

export type TerminalBriefKind = "problem" | "idea";

export type TerminalBriefDraft = {
  kind: TerminalBriefKind;
  locale: "en" | "tr" | "fr";
  summary: string;
};

export function isTerminalBriefDraft(value: unknown): value is TerminalBriefDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  return (
    (draft.kind === "problem" || draft.kind === "idea") &&
    (draft.locale === "en" || draft.locale === "tr" || draft.locale === "fr") &&
    typeof draft.summary === "string" &&
    draft.summary.length > 0 &&
    draft.summary.length <= 1200
  );
}
