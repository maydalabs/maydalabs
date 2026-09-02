/* Pilot vocabulary shared by server actions and client forms. Kept out of
 * the "use server" module: everything exported from there becomes a server
 * reference, so plain constants must live here. */

export const PILOT_STATUSES = [
  "proposed",
  "scoping",
  "installing",
  "operating",
  "measuring",
  "completed",
  "paused",
] as const;

export const PILOT_OFFERS = ["ai_operations", "payments"] as const;

export const PILOT_UPDATE_KINDS = ["report", "milestone", "note"] as const;

/* Where a prepared proposal came from: a cold/warm outreach note, a job
 * application that becomes a pilot conversation, or a referral. */
export const PROPOSAL_ORIGINS = ["outreach", "job_application", "referral"] as const;
