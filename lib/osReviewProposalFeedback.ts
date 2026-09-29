import { parseReviewProposal } from "@/lib/osReviewBoundary";

/** S1j model-facing diagnostics only describe the narrow tool input. Historical
 * model-free harnesses below retain the former full-payload diagnostics. */
export function invalidDraftToolFeedback(input: unknown): string {
  const prefix = "One Work proposal attempt was not staged.";
  if (!input || typeof input !== "object" || Array.isArray(input)) return `${prefix} Supply only title, body and lane.`;
  const fields = input as Record<string, unknown>;
  const invalid = (["title", "body", "lane"] as const).filter((name) =>
    parseReviewProposal({ ...validWorkProbe, [name]: fields[name] }) === null);
  return `${prefix} ${invalid.length ? `Correct these fields: ${invalid.join(", ")}. ` : ""}Supply only title, complete draft body and lane. Remove unsupported extra fields; the app supplies format, later action and attribution.`;
}

export function invalidKnowledgeToolFeedback(input: unknown): string {
  const prefix = "One knowledge proposal attempt was not staged.";
  if (!input || typeof input !== "object" || Array.isArray(input)) return `${prefix} Supply only kind, scope and duration.`;
  const fields = input as Record<string, unknown>;
  const guidance = [
    ...(parseReviewProposal({ ...validProbe, kind: fields.kind }) ? [] : [KIND]),
    ...(parseReviewProposal({ ...validProbe, scope: fields.scope }) ? [] : [SCOPE]),
    ...(parseReviewProposal({ ...validProbe, duration: fields.duration }) ? [] : [DURATION]),
  ];
  return `${prefix} ${guidance.join(" ")} Supply only kind, scope and duration. Remove unsupported extra fields; the app supplies the exact founder statement and attribution.`;
}

/** Fixed, model-facing diagnostics for a refused Knowledge tool call. This
 * never repairs a proposal, repeats its contents, or changes the validator.
 */
const validProbe = {
  type: "knowledge",
  statement: "A reviewable company statement.",
  kind: "fact",
  scope: { type: "company", label: "Company" },
  duration: { type: "until_changed" },
  citations: [{ sourceId: "source", quote: "source" }],
};

const PREFIX = "One knowledge proposal attempt was not staged.";
const KIND = "Set kind to fact, preference, constraint, person, or decision.";
const SCOPE = 'Set scope to exactly {type: "company" | "project" | "customer", label: "nonempty name"}.';
const DURATION = 'Set duration to exactly {type: "until_changed"} or {type: "until_date", date: "YYYY-MM-DD"} with a real date.';
const OTHER = "Check statement, citations, and unsupported extra fields against the review proposal schema.";
const validWorkProbe = {
  type: "work",
  title: "Reviewable draft",
  body: "A complete draft body.",
  lane: "sales",
  kind: "reply",
  outwardAction: "send",
  citations: [{ sourceId: "source", quote: "source" }],
};

export function invalidKnowledgeProposalFeedback(input: unknown): string {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return `${PREFIX} Supply an object with statement, kind, scope, duration, and citations.`;
  }

  const fields = input as Record<string, unknown>;
  const invalid = (name: "kind" | "scope" | "duration") =>
    parseReviewProposal({ ...validProbe, [name]: fields[name] }) === null;
  const guidance = [
    ...(invalid("kind") ? [KIND] : []),
    ...(invalid("scope") ? [SCOPE] : []),
    ...(invalid("duration") ? [DURATION] : []),
  ];
  return `${PREFIX} ${guidance.length ? guidance.join(" ") : OTHER}`;
}

export function invalidWorkProposalFeedback(input: unknown): string {
  const prefix = "One proposal attempt had invalid or missing review details and was not staged.";
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return `${prefix} Supply a complete work proposal object.`;
  }
  const fields = input as Record<string, unknown>;
  const required = ["title", "body", "lane", "kind", "outwardAction", "citations"] as const;
  const invalid = required.filter((name) => parseReviewProposal({ ...validWorkProbe, [name]: fields[name] }) === null);
  if (invalid.length) {
    return `${prefix} Correct these fields: ${invalid.join(", ")}. Include a complete draft body, a source citation copied exactly from the current founder message, and the later human outward action (send/publish, or null for internal work).`;
  }
  return `${prefix} Check unsupported extra fields and the exact review proposal schema.`;
}
