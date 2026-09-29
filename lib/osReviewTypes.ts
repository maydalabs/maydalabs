import type { ProposalPayload, ReviewSource } from "@/lib/osReviewBoundary";
import type { ReviewRequestMode, ReviewRequestIntent } from "@/lib/osReviewIntent";

// Browser-safe types only. Never import the server writer into a client component.
export type DurableProposal = {
  id: string; company_id: string; actor_id: string; turn_id: string;
  revision: number; fingerprint: string; payload: ProposalPayload;
  sources: ReviewSource[]; status: "proposed" | "saved" | "dismissed";
  record_id: string | null;
};
export type DurableTurn = {
  id: string; company_id: string; actor_id: string; thread_id: string;
  person_message_id: string; status: "running" | "completed" | "failed";
  question: string; mode: ReviewRequestMode; intent: ReviewRequestIntent | null; reply: string | null; created_at: string; updated_at: string;
  history: { id: string; role: "person" | "cofounder"; body: string }[];
};
export type ReviewSnapshot = {
  companyId: string;
  actorId: string;
  messages: { id: string; role: "person" | "cofounder"; body: string }[];
  proposals: DurableProposal[];
  turns: DurableTurn[];
};
