import { createHash } from "node:crypto";

/* S1c executable contract prototype. NOT imported by the desk or its routes.
 * Separate model proposal capability from a trusted reviewer capability.
 * No Supabase/model/network dependency; writers in this slice are test fakes.
 * A digest is content identity, NOT authentication or durable idempotency.
 */
export const REVIEW_CONTRACT_VERSION = "2026-09-22.1";

export type ReviewIdentity = { actorId: string; companyId: string; threadId: string; turnId: string };
export type ReviewSource = {
  id: string;
  companyId: string;
  revision: string;
  text: string;
  origin: "founder" | "record" | "quoted" | "model";
};
export type Citation = { sourceId: string; quote: string };
export type KnowledgeScope = { type: "company" | "project" | "customer"; label: string };
export type KnowledgeDuration = { type: "until_changed" } | { type: "until_date"; date: string };
export type ProposalPayload =
  | { type: "work"; title: string; body: string; lane: string; kind: string; outwardAction: string | null; citations: Citation[] }
  | { type: "knowledge"; statement: string; kind: "fact" | "preference" | "constraint" | "person" | "decision"; scope: KnowledgeScope; duration: KnowledgeDuration; citations: Citation[] };
export type ReviewAction = "save_to_work" | "add_to_company_knowledge";
export type ReviewStatus = "proposed" | "saving" | "saved" | "dismissed" | "stale" | "uncertain";
export type ReviewSnapshot = {
  id: string;
  revision: number;
  fingerprint: string;
  identity: ReviewIdentity;
  payload: ProposalPayload;
  sources: ReviewSource[];
  status: ReviewStatus;
  action: ReviewAction;
  authorship: "model";
  lastEditedBy: string | null;
  evidenceMeaning: "Attribution only; sources do not verify the proposed claims.";
};
export type SaveRequest = { identity: ReviewIdentity; proposalId: string; fingerprint: string; action: ReviewAction };
export type ReviewedEffect = {
  operationId: string;
  identity: ReviewIdentity;
  proposalId: string;
  revision: number;
  fingerprint: string;
  action: ReviewAction;
  payload: ProposalPayload;
  sources: ReviewSource[];
  authorship: "model";
  lastEditedBy: string | null;
  confirmedBy: string;
  externallyVerified: false;
};
export type WriteOutcome = { status: "saved"; recordId: string } | { status: "not_saved" } | { status: "uncertain" };
export type ReviewResult = { ok: true; status: "saved"; recordId: string; receipt: string } | { ok: false; status: string; receipt: string };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function keys(value: Record<string, unknown>, expected: string[]) {
  return Object.keys(value).length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
function date(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function identityValid(value: unknown): value is ReviewIdentity {
  return record(value) && keys(value, ["actorId", "companyId", "threadId", "turnId"]) && Object.values(value).every((v) => text(v, 200));
}
function sameIdentity(a: ReviewIdentity, b: ReviewIdentity) {
  return a.actorId === b.actorId && a.companyId === b.companyId && a.threadId === b.threadId && a.turnId === b.turnId;
}
function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function clone<T>(value: T): T { return structuredClone(value); }

// Strict DTO: model-owned "approved", status, actor, source or extra fields are
// rejected, never spread into an effect. Exact body/statement text is retained.
export function parseReviewProposal(input: unknown): ProposalPayload | null {
  if (!record(input) || !Array.isArray(input.citations) || input.citations.length < 1 || input.citations.length > 8) return null;
  const citations: Citation[] = [];
  for (const citation of input.citations) {
    if (!record(citation) || !keys(citation, ["sourceId", "quote"]) || !text(citation.sourceId, 200) || !text(citation.quote, 8000)) return null;
    citations.push({ sourceId: citation.sourceId, quote: citation.quote });
  }
  if (new Set(citations.map((c) => JSON.stringify(c))).size !== citations.length) return null;
  if (input.type === "work") {
    if (!keys(input, ["type", "title", "body", "lane", "kind", "outwardAction", "citations"]) ||
      !text(input.title, 200) || !text(input.body, 8000) || !text(input.lane, 40) || !text(input.kind, 40) ||
      !(input.outwardAction === null || text(input.outwardAction, 60))) return null;
    return { type: "work", title: input.title, body: input.body, lane: input.lane, kind: input.kind, outwardAction: input.outwardAction, citations };
  }
  if (input.type !== "knowledge" || !keys(input, ["type", "statement", "kind", "scope", "duration", "citations"]) ||
    !text(input.statement, 2000) || typeof input.kind !== "string" || !["fact", "preference", "constraint", "person", "decision"].includes(input.kind)) return null;
  const scope = input.scope;
  const duration = input.duration;
  if (!record(scope) || !keys(scope, ["type", "label"]) || typeof scope.type !== "string" || !["company", "project", "customer"].includes(scope.type) || !text(scope.label, 200)) return null;
  if (!record(duration) || !(
    (duration.type === "until_changed" && keys(duration, ["type"])) ||
    (duration.type === "until_date" && keys(duration, ["type", "date"]) && date(duration.date))
  )) return null;
  return {
    type: "knowledge", statement: input.statement, kind: input.kind as Extract<ProposalPayload, { type: "knowledge" }>["kind"],
    scope: { type: scope.type as KnowledgeScope["type"], label: scope.label },
    duration: duration.type === "until_changed" ? { type: "until_changed" } : { type: "until_date", date: duration.date as string }, citations,
  };
}

function resolveSources(payload: ProposalPayload, sources: readonly ReviewSource[], companyId: string): ReviewSource[] | null {
  if (new Set(sources.map((s) => s.id)).size !== sources.length) return null;
  const resolved = new Map<string, ReviewSource>();
  for (const citation of payload.citations) {
    const source = sources.find((s) => s.id === citation.sourceId);
    if (!source || source.companyId !== companyId || !text(source.revision, 200) || typeof source.text !== "string" ||
      !["founder", "record", "quoted", "model"].includes(source.origin) || !source.text.includes(citation.quote)) return null;
    // Reconstruct rather than preserving accidental trusted-caller extra data.
    resolved.set(source.id, { id: source.id, companyId, revision: source.revision, text: source.text, origin: source.origin });
  }
  return [...resolved.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** All identity/source inputs and the writer must come from the trusted host.
 * Do not expose reviewer methods to the model or pass HTTP JSON as identity.
 * This in-memory object deliberately has no durable/restart guarantee.
 */
export function createReviewBoundary(options: {
  identity: ReviewIdentity;
  sources: readonly ReviewSource[];
  write: (effect: ReviewedEffect) => Promise<WriteOutcome>;
  now?: () => Date;
}) {
  if (!identityValid(options.identity)) throw new Error("Invalid trusted review identity");
  const identity = clone(options.identity);
  const initialSources = clone(options.sources);
  const write = options.write;
  const now = options.now ?? (() => new Date());
  const proposals = new Map<string, ReviewSnapshot>();
  const receipts = new Map<string, Extract<ReviewResult, { ok: true }>>();
  let nextId = 0;
  let busy = false;
  let outcomeUnknown = false;
  const fail = (status: string, receipt: string): ReviewResult => ({ ok: false, status, receipt });
  const actionFor = (payload: ProposalPayload): ReviewAction => payload.type === "work" ? "save_to_work" : "add_to_company_knowledge";
  const fingerprintFor = (id: string, revision: number, payload: ProposalPayload, sources: ReviewSource[]) =>
    digest({ version: REVIEW_CONTRACT_VERSION, identity, id, revision, payload, sources });
  const expired = (payload: ProposalPayload) => payload.type === "knowledge" && payload.duration.type === "until_date" && payload.duration.date < now().toISOString().slice(0, 10);

  function propose(input: unknown) {
    const payload = parseReviewProposal(input);
    if (!payload) return { ok: false as const, reason: "invalid_proposal" };
    const sources = resolveSources(payload, initialSources, identity.companyId);
    if (!sources) return { ok: false as const, reason: "source_unavailable" };
    if (expired(payload)) return { ok: false as const, reason: "expired_knowledge" };
    if (outcomeUnknown) return { ok: false as const, reason: "reconciliation_required" };
    const contentKey = digest({ payload, sources });
    for (const p of proposals.values()) {
      if (digest({ payload: p.payload, sources: p.sources }) === contentKey) return { ok: true as const, proposal: clone(p) };
    }
    if (proposals.size >= 32) return { ok: false as const, reason: "proposal_limit" };
    const id = `proposal-${++nextId}`;
    const proposal: ReviewSnapshot = {
      id, revision: 1, fingerprint: fingerprintFor(id, 1, payload, sources), identity: clone(identity), payload, sources,
      status: "proposed", action: actionFor(payload), authorship: "model", lastEditedBy: null,
      evidenceMeaning: "Attribution only; sources do not verify the proposed claims.",
    };
    proposals.set(id, proposal);
    return { ok: true as const, proposal: clone(proposal) };
  }

  function validRequest(request: unknown): request is SaveRequest {
    return record(request) && keys(request, ["identity", "proposalId", "fingerprint", "action"]) &&
      identityValid(request.identity) && sameIdentity(identity, request.identity) && text(request.proposalId, 200) &&
      text(request.fingerprint, 64) && (request.action === "save_to_work" || request.action === "add_to_company_knowledge");
  }

  async function save(request: unknown, currentTrustedSources: readonly ReviewSource[]): Promise<ReviewResult> {
    if (!validRequest(request)) return fail("invalid_confirmation", "No save attempted: this review does not match the selected person, company or conversation.");
    const proposal = proposals.get(request.proposalId);
    if (!proposal || proposal.fingerprint !== request.fingerprint || proposal.action !== request.action) {
      return fail("stale_review", "No save attempted: review the current content and its exact save action.");
    }
    // A confirmed old result is a receipt, never a second write.
    const saved = receipts.get(proposal.id);
    if (saved) return clone(saved);
    if (outcomeUnknown) return fail("uncertain", "A previous save is unconfirmed. Reconcile it before saving more; nothing was retried.");
    if (busy || proposal.status === "saving") return fail("saving", "A save is already in progress. No additional write was started.");
    if (proposal.status !== "proposed") return fail(proposal.status, "This suggestion cannot be saved. Review a current proposal instead.");
    const sources = resolveSources(proposal.payload, currentTrustedSources, identity.companyId);
    if (!sources || digest(sources) !== digest(proposal.sources) || expired(proposal.payload)) {
      proposal.status = "stale";
      return fail("stale_source", "No save attempted: the source or validity period changed. Review an updated suggestion.");
    }
    // Lock before the async writer. Production needs the equivalent durable,
    // atomic compare-and-write; this only serializes this object instance.
    busy = true;
    proposal.status = "saving";
    let outcome: WriteOutcome;
    try {
      outcome = await write(clone({
        operationId: `${proposal.id}:${proposal.revision}:${proposal.fingerprint}`, identity, proposalId: proposal.id,
        revision: proposal.revision, fingerprint: proposal.fingerprint, action: proposal.action,
        payload: proposal.payload, sources: proposal.sources, authorship: "model", lastEditedBy: proposal.lastEditedBy,
        confirmedBy: identity.actorId, externallyVerified: false,
      }));
    } catch {
      outcome = { status: "uncertain" };
    } finally { busy = false; }
    if (record(outcome) && keys(outcome, ["status", "recordId"]) && outcome.status === "saved" && text(outcome.recordId, 200)) {
      proposal.status = "saved";
      const result = { ok: true as const, status: "saved" as const, recordId: outcome.recordId, receipt: proposal.payload.type === "work"
        ? "Saved to Work as a draft. Nothing was approved, sent, published or completed."
        : "Added to company knowledge with your confirmation and the reviewed scope. This is not independent verification." };
      receipts.set(proposal.id, result);
      return clone(result);
    }
    if (record(outcome) && keys(outcome, ["status"]) && outcome.status === "not_saved") {
      proposal.status = "proposed";
      return fail("not_saved", "The writer confirmed nothing was saved. You may review and try again; no automatic retry occurred.");
    }
    proposal.status = "uncertain";
    outcomeUnknown = true;
    return fail("uncertain", "I could not confirm whether it was saved. Check the record before retrying; no further saves will run in this session.");
  }

  return {
    // This is the entire capability given to a model-tool dispatcher.
    model: { propose },
    reviewer: {
      preview: (id: string) => { const p = proposals.get(id); return p ? clone(p) : null; },
      revise: (request: unknown, input: unknown, currentTrustedSources: readonly ReviewSource[]) => {
        if (!validRequest(request) || busy || outcomeUnknown) return { ok: false as const, reason: "review_unavailable" };
        const p = proposals.get(request.proposalId);
        if (!p || p.fingerprint !== request.fingerprint || p.action !== request.action || !["proposed", "stale"].includes(p.status)) return { ok: false as const, reason: "stale_review" };
        const payload = parseReviewProposal(input);
        if (!payload || payload.type !== p.payload.type || expired(payload)) return { ok: false as const, reason: "invalid_proposal" };
        const sources = resolveSources(payload, currentTrustedSources, identity.companyId);
        if (!sources) return { ok: false as const, reason: "source_unavailable" };
        const contentKey = digest({ payload, sources });
        for (const other of proposals.values()) {
          if (other.id !== p.id && digest({ payload: other.payload, sources: other.sources }) === contentKey) {
            return { ok: false as const, reason: "duplicate_proposal", existingProposalId: other.id };
          }
        }
        p.revision += 1;
        p.payload = payload;
        p.sources = sources;
        p.lastEditedBy = identity.actorId;
        p.status = "proposed";
        p.fingerprint = fingerprintFor(p.id, p.revision, payload, sources);
        return { ok: true as const, proposal: clone(p) };
      },
      dismiss: (request: unknown) => {
        if (!validRequest(request) || busy || outcomeUnknown) return false;
        const p = proposals.get(request.proposalId);
        if (!p || p.fingerprint !== request.fingerprint || p.action !== request.action || !["proposed", "stale"].includes(p.status)) return false;
        p.status = "dismissed";
        return true;
      },
      save,
    },
  };
}
