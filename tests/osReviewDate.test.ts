import { describe, expect, it, vi } from "vitest";
import { findReviewDateIssues } from "@/lib/osReviewDate";

describe("reviewed draft calendar guard", () => {
  it("reports the observed wrong weekday without rewriting the draft", () => {
    const body = "Hi Jori, let's meet on Monday, 12 January 2027 at 14:00.";
    const issues = findReviewDateIssues(body);
    expect(issues).toEqual([{
      code: "weekday_mismatch", start: 23, end: 46,
      text: "Monday, 12 January 2027", date: "2027-01-12",
      statedWeekday: "Monday", expectedWeekday: "Tuesday",
    }]);
    expect(body).toBe("Hi Jori, let's meet on Monday, 12 January 2027 at 14:00.");
  });

  it.each([
    "Tuesday, 12 January 2027", "Tuesday, January 12th, 2027",
    "12 January 2027 Tuesday", "12 January 2027 (Tuesday)",
    "Tuesday, 2027-01-12", "2027-01-12 Tuesday",
    "12 Ocak 2027 Salı", "SALI, 12 OCAK 2027", "12 Ocak 2027 Sali",
    "mardi le 12 janvier 2027", "mardi, 12 janvier 2027", "12 janvier 2027, mardi",
    "Friday, 1st January 2027", "vendredi le 1er janvier 2027",
    "Monday, 1 January 0001", "Friday, 31 December 9999",
  ])("accepts a consistent explicit date: %s", (body) => {
    expect(findReviewDateIssues(body)).toEqual([]);
  });

  it.each([
    ["12 Ocak 2027 Pazartesi", "Salı"],
    ["PAZARTESİ, 12 OCAK 2027", "Salı"],
    ["lundi le 12 janvier 2027", "mardi"],
    ["Monday, January 12, 2027", "Tuesday"],
    ["2027-01-12 Monday", "Tuesday"],
    ["Monday, 1 February 2026", "Sunday"],
    ["Monday, 1 February 2027", "Monday"],
  ])("uses calendar truth and a localized weekday for %s", (body, expected) => {
    const issues = findReviewDateIssues(body);
    if (body === "Monday, 1 February 2027") expect(issues).toEqual([]);
    else expect(issues).toHaveLength(1);
    if (issues.length) expect(issues[0].expectedWeekday).toBe(expected);
  });

  it.each([
    "Monday, 31 February 2027", "31 April 2027", "Monday, 29 February 1900",
    "29 February 2027", "31 Haziran 2027 Pazartesi", "lundi le 31 septembre 2027",
    "2027-13-01", "2027-00-12", "2027-01-00", "2027-02-29", "0000-01-01",
  ])("rejects an impossible explicit date without rolling it forward: %s", (body) => {
    expect(findReviewDateIssues(body)).toEqual([expect.objectContaining({ code: "invalid_date", expectedWeekday: null })]);
  });

  it.each(["Tuesday, 29 February 2000", "Thursday, 29 February 2024", "Friday, 29 February 2408"])("handles Gregorian leap years: %s", (body) => {
    expect(findReviewDateIssues(body)).toEqual([]);
  });

  it.each([
    "Monday, 12/01/2027", "Monday, 01/12/2027", "Monday, 12 January", "next Monday",
    "Monday the 12th", "Mon, 12 Jan 2027", "Monday, 2027-1-12", "Monday, 12 January 27",
    "Monday. We are planning for 12 January 2027.", "Monday\n12 January 2027",
    "abc12 January 2027", "Monday, 12 January 20270", "Monday, 12 January 2027abc",
    "Monday, 12 Foober 2027", "Monday, 2027/01/12", "2027-01-12T14:00:00Z",
    "5Monday, 12 January 2027", "12 January 2027 Monday2", `xMonday${" ".repeat(34)}12 January 2027`,
  ])("leaves unsupported or ambiguous expressions untouched: %s", (body) => {
    expect(findReviewDateIssues(body)).toEqual([]);
  });

  it("checks both adjacent weekday assertions without conflating separate dates", () => {
    const body = "Monday, 12 January 2027 Tuesday; Friday, 13 January 2027.";
    expect(findReviewDateIssues(body).map(({ statedWeekday, expectedWeekday }) => ({ statedWeekday, expectedWeekday }))).toEqual([
      { statedWeekday: "Monday", expectedWeekday: "Tuesday" },
      { statedWeekday: "Friday", expectedWeekday: "Wednesday" },
    ]);
  });

  it("preserves exact string offsets when accents and emoji precede the match", () => {
    const body = "👋 À bientôt — lundi, 12 janvier 2027.";
    const [issue] = findReviewDateIssues(body);
    expect(issue.text).toBe("lundi, 12 janvier 2027");
    expect(body.slice(issue.start, issue.end)).toBe(issue.text);
    expect(issue.expectedWeekday).toBe("mardi");
  });

  it("does not use the host's current time, local timezone or Date.parse", () => {
    const now = vi.spyOn(Date, "now").mockImplementation(() => { throw new Error("No clock"); });
    const parse = vi.spyOn(Date, "parse").mockImplementation(() => { throw new Error("No locale parser"); });
    const localDay = vi.spyOn(Date.prototype, "getDay").mockImplementation(() => { throw new Error("No local timezone"); });
    try {
      expect(findReviewDateIssues("Monday, 12 January 2027")[0]?.expectedWeekday).toBe("Tuesday");
      expect(findReviewDateIssues("Monday, 12 January 2027")[0]?.expectedWeekday).toBe("Tuesday");
    } finally {
      now.mockRestore();
      parse.mockRestore();
      localDay.mockRestore();
    }
  });
});
