import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "@/lib/cronAuth";

describe("who may start the worker", () => {
  /* The positive case first, deliberately. Every other assertion here is a
   * refusal, and a refusal-only suite passes when the endpoint refuses
   * everyone — including Vercel Cron, which would mean the schedule never
   * runs and nothing tells you. */
  it("lets the caller it exists for through", () => {
    expect(isCronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("refuses when no secret is configured, whatever is offered", () => {
    expect(isCronAuthorized("Bearer anything", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
    expect(isCronAuthorized(null, undefined)).toBe(false);
  });

  it("refuses a wrong, missing, malformed or partial token", () => {
    expect(isCronAuthorized("Bearer wrong", "s3cret")).toBe(false);
    expect(isCronAuthorized(null, "s3cret")).toBe(false);
    expect(isCronAuthorized("s3cret", "s3cret")).toBe(false);
    expect(isCronAuthorized("Bearer s3cre", "s3cret")).toBe(false);
    expect(isCronAuthorized("Bearer s3cret ", "s3cret")).toBe(false);
    expect(isCronAuthorized("bearer s3cret", "s3cret")).toBe(false);
  });
});
