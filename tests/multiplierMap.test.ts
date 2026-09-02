import { describe, expect, it } from "vitest";
import {
  computeMapResult,
  MAP_CONSTRAINTS,
  MAP_OUTCOMES,
  MAP_RESOURCES,
  MAP_STAGES,
  MAP_TIMELINES,
  parseMapAnswers,
  RUBRIC_VERSION,
  type MapAnswers,
} from "@/lib/multiplierMap";

const BASE: MapAnswers = {
  stage: "growing",
  constraint: "growth_flat",
  outcome: "revenue_growth",
  timeline: "now",
  resources: "team",
};

describe("parseMapAnswers", () => {
  it("accepts a valid answer set", () => {
    expect(parseMapAnswers({ ...BASE })).toEqual(BASE);
  });

  it("rejects unknown values, missing fields, and non-objects", () => {
    expect(parseMapAnswers(null)).toBeNull();
    expect(parseMapAnswers("stage")).toBeNull();
    expect(parseMapAnswers({})).toBeNull();
    expect(parseMapAnswers({ ...BASE, stage: "unicorn" })).toBeNull();
    expect(parseMapAnswers({ ...BASE, constraint: undefined })).toBeNull();
  });
});

describe("computeMapResult rules", () => {
  it("is deterministic for identical answers", () => {
    expect(computeMapResult(BASE)).toEqual(computeMapResult({ ...BASE }));
  });

  it("stamps the rubric version", () => {
    expect(computeMapResult(BASE).version).toBe(RUBRIC_VERSION);
  });

  it("routes idea-stage and unbuilt products to the launch path", () => {
    expect(computeMapResult({ ...BASE, stage: "idea" }).path).toBe("launch");
    expect(computeMapResult({ ...BASE, constraint: "product_not_built" }).path).toBe("launch");
  });

  it("routes operational and reliability constraints to unblock, always via the sprint", () => {
    const drag = computeMapResult({ ...BASE, constraint: "operations_drag" });
    expect(drag.path).toBe("unblock");
    expect(drag.offer).toBe("multiplier_sprint");

    const risk = computeMapResult({ ...BASE, constraint: "reliability_risk" });
    expect(risk.path).toBe("unblock");
    expect(risk.offer).toBe("multiplier_sprint");
  });

  it("offers the build partnership only to committed launch situations", () => {
    expect(
      computeMapResult({ ...BASE, stage: "idea", constraint: "product_not_built" }).offer,
    ).toBe("build_partnership");
    expect(
      computeMapResult({
        ...BASE,
        stage: "idea",
        constraint: "product_not_built",
        timeline: "exploring",
      }).offer,
    ).toBe("multiplier_sprint");
  });

  it("offers acceleration only for committed growth/retention goals", () => {
    expect(computeMapResult(BASE).offer).toBe("acceleration_partnership");
    expect(computeMapResult({ ...BASE, timeline: "exploring" }).offer).toBe("multiplier_sprint");
    expect(computeMapResult({ ...BASE, outcome: "confidence" }).offer).toBe("multiplier_sprint");
  });

  it("derives the capability focus from constraint first, outcome second, never duplicated", () => {
    const result = computeMapResult({ ...BASE, constraint: "operations_drag", outcome: "efficiency" });
    expect(result.focus[0]).toBe("automation_ai");
    expect(result.focus[1]).not.toBe(result.focus[0]);

    const growth = computeMapResult(BASE);
    expect(growth.focus[0]).toBe("lifecycle_growth");
    expect(growth.focus[1]).not.toBe("lifecycle_growth");
  });

  it("adds the exploring caveat and always keeps the human-judgment note last", () => {
    const exploring = computeMapResult({ ...BASE, timeline: "exploring" });
    expect(exploring.notes).toContain("sprint_first");
    expect(exploring.notes.at(-1)).toBe("human_judgment");
    expect(computeMapResult(BASE).notes).toEqual(["human_judgment"]);
  });

  it("produces a complete, well-formed result for every possible answer combination", () => {
    for (const stage of MAP_STAGES) {
      for (const constraint of MAP_CONSTRAINTS) {
        for (const outcome of MAP_OUTCOMES) {
          for (const timeline of MAP_TIMELINES) {
            for (const resources of MAP_RESOURCES) {
              const result = computeMapResult({ stage, constraint, outcome, timeline, resources });
              expect(result.steps.length).toBeGreaterThanOrEqual(3);
              expect(result.focus[0]).not.toBe(result.focus[1]);
              expect(result.notes).toContain("human_judgment");
              expect(["launch", "accelerate", "unblock"]).toContain(result.path);
              expect([
                "multiplier_sprint",
                "build_partnership",
                "acceleration_partnership",
              ]).toContain(result.offer);
            }
          }
        }
      }
    }
  });
});
