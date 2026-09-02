/*
 * The Multiplier Map rubric.
 *
 * Deterministic and rule-based on purpose: the same answers always produce
 * the same map, the rules are readable below, and no AI or scoring model is
 * involved. The map is a structured starting point — it never replaces
 * human judgment, and the UI says so.
 *
 * Results are stored as language-independent keys plus RUBRIC_VERSION so a
 * saved map can always be re-rendered (or re-audited) later.
 */

export const RUBRIC_VERSION = "2026-09-02.1";

export const MAP_STAGES = ["idea", "launched", "growing", "established"] as const;
export const MAP_CONSTRAINTS = [
  "product_not_built",
  "product_stuck",
  "growth_flat",
  "operations_drag",
  "reliability_risk",
  "unclear",
] as const;
export const MAP_OUTCOMES = [
  "launch",
  "revenue_growth",
  "retention",
  "efficiency",
  "confidence",
] as const;
export const MAP_TIMELINES = ["now", "quarter", "exploring"] as const;
export const MAP_RESOURCES = ["solo", "some_help", "team"] as const;

export type MapStage = (typeof MAP_STAGES)[number];
export type MapConstraint = (typeof MAP_CONSTRAINTS)[number];
export type MapOutcome = (typeof MAP_OUTCOMES)[number];
export type MapTimeline = (typeof MAP_TIMELINES)[number];
export type MapResources = (typeof MAP_RESOURCES)[number];

export type MapAnswers = {
  stage: MapStage;
  constraint: MapConstraint;
  outcome: MapOutcome;
  timeline: MapTimeline;
  resources: MapResources;
};

export type MapPath = "launch" | "accelerate" | "unblock";
export type MapOffer =
  | "multiplier_sprint"
  | "build_partnership"
  | "acceleration_partnership";
export type MapCapability =
  | "product_engineering"
  | "automation_ai"
  | "lifecycle_growth"
  | "security_reliability";
export type MapStepKey =
  | "define_wedge"
  | "scope_first_release"
  | "build_measure"
  | "prepare_operate"
  | "clarify_buyer"
  | "prototype_riskiest"
  | "decide_build"
  | "instrument_funnel"
  | "find_leverage"
  | "ship_loops"
  | "compound"
  | "map_constraint"
  | "one_leverage_move"
  | "measure_result"
  | "inventory_drag"
  | "pick_one_system"
  | "automate_verify";
export type MapNoteKey = "sprint_first" | "resource_light" | "human_judgment";

export type MapResult = {
  version: string;
  path: MapPath;
  offer: MapOffer;
  focus: [MapCapability, MapCapability];
  steps: MapStepKey[];
  notes: MapNoteKey[];
};

function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

/** Validates untrusted input (form posts, stored JSON) into MapAnswers. */
export function parseMapAnswers(input: unknown): MapAnswers | null {
  if (typeof input !== "object" || input === null) return null;
  const candidate = input as Record<string, unknown>;
  if (
    includes(MAP_STAGES, candidate.stage) &&
    includes(MAP_CONSTRAINTS, candidate.constraint) &&
    includes(MAP_OUTCOMES, candidate.outcome) &&
    includes(MAP_TIMELINES, candidate.timeline) &&
    includes(MAP_RESOURCES, candidate.resources)
  ) {
    return {
      stage: candidate.stage,
      constraint: candidate.constraint,
      outcome: candidate.outcome,
      timeline: candidate.timeline,
      resources: candidate.resources,
    };
  }
  return null;
}

const CONSTRAINT_CAPABILITY: Record<MapConstraint, MapCapability> = {
  product_not_built: "product_engineering",
  product_stuck: "product_engineering",
  growth_flat: "lifecycle_growth",
  operations_drag: "automation_ai",
  reliability_risk: "security_reliability",
  unclear: "product_engineering",
};

const OUTCOME_CAPABILITY: Record<MapOutcome, MapCapability> = {
  launch: "product_engineering",
  revenue_growth: "lifecycle_growth",
  retention: "lifecycle_growth",
  efficiency: "automation_ai",
  confidence: "security_reliability",
};

const CAPABILITY_FALLBACK_ORDER: MapCapability[] = [
  "product_engineering",
  "automation_ai",
  "lifecycle_growth",
  "security_reliability",
];

export function computeMapResult(answers: MapAnswers): MapResult {
  // Rule 1 — which of the three situations is this?
  const path: MapPath =
    answers.stage === "idea" || answers.constraint === "product_not_built"
      ? "launch"
      : answers.constraint === "operations_drag" ||
          answers.constraint === "reliability_risk"
        ? "unblock"
        : "accelerate";

  // Rule 2 — the honest entry offer for that situation.
  let offer: MapOffer;
  if (path === "launch") {
    offer =
      answers.timeline === "exploring" || answers.constraint === "unclear"
        ? "multiplier_sprint"
        : "build_partnership";
  } else if (path === "unblock") {
    offer = "multiplier_sprint";
  } else {
    offer =
      answers.timeline !== "exploring" &&
      (answers.outcome === "revenue_growth" || answers.outcome === "retention")
        ? "acceleration_partnership"
        : "multiplier_sprint";
  }

  // Rule 3 — capability focus: constraint decides, outcome seconds.
  const primary = CONSTRAINT_CAPABILITY[answers.constraint];
  let secondary = OUTCOME_CAPABILITY[answers.outcome];
  if (secondary === primary) {
    secondary = CAPABILITY_FALLBACK_ORDER.find((c) => c !== primary)!;
  }

  // Rule 4 — the next-step map for the path/offer combination.
  let steps: MapStepKey[];
  if (path === "launch") {
    steps =
      offer === "build_partnership"
        ? ["define_wedge", "scope_first_release", "build_measure", "prepare_operate"]
        : ["clarify_buyer", "prototype_riskiest", "decide_build"];
  } else if (path === "unblock") {
    steps = ["inventory_drag", "pick_one_system", "automate_verify"];
  } else {
    steps =
      offer === "acceleration_partnership"
        ? ["instrument_funnel", "find_leverage", "ship_loops", "compound"]
        : ["map_constraint", "one_leverage_move", "measure_result"];
  }

  // Rule 5 — honest caveats.
  const notes: MapNoteKey[] = [];
  if (answers.timeline === "exploring") notes.push("sprint_first");
  if (answers.resources === "solo" && path !== "launch") notes.push("resource_light");
  notes.push("human_judgment");

  return { version: RUBRIC_VERSION, path, offer, focus: [primary, secondary], steps, notes };
}
