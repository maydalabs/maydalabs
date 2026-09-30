import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Brief } from "@/components/os/Brief";
import { composeBrief } from "@/lib/osBrief";

/* The brief says the co-founder's name where it speaks of it, and nothing
 * else moves: counts, the record's "a person" and "the system", dueness. */

vi.mock("@/components/os/OsClock", () => ({ OsClock: () => null }));
vi.mock("@/components/os/OpenItem", () => ({ OpenItem: () => null }));
vi.mock("@/components/os/OpenApp", () => ({ OpenApp: () => null }));

const base = { needs: [], needCount: 0, changes: null, lastChange: null, workflows: [], finishedThisFortnight: 0 };
const render = (brief: ReturnType<typeof composeBrief>, cofounderName: string | null) =>
  renderToStaticMarkup(createElement(Brief, { locale: "en", brief, hasCompany: true, companyName: "Lantern Bakery", configured: true, cofounderName }));

describe("the brief, named", () => {
  it("invites the person to tell the named co-founder about the business on the first day, and nudges an unnamed one once", () => {
    const firstDay = composeBrief({ ...base, knows: 1 });
    expect(firstDay.firstDay).toBe(true);
    const named = render(firstDay, "Ada");
    expect(named).toContain("Tell Ada about the business and the nearest goal");
    expect(named).not.toContain("It has no name yet");
    const unnamed = render(firstDay, null);
    expect(unnamed).toContain("Tell it about the business and the nearest goal");
    expect(unnamed).toContain("It has no name yet. Give it one in Company.");
    expect(unnamed).not.toContain("Ada");
  });

  it("counts what the named co-founder knows on a quiet desk, byte-identical otherwise", () => {
    const quiet = composeBrief({ ...base, knows: 3, openCount: 1, changes: 0 });
    expect(quiet.firstDay).toBe(false);
    expect(render(quiet, "Ada")).toContain("Ada knows 3 things about Lantern Bakery.");
    expect(render(quiet, null)).toContain("It knows 3 things about Lantern Bakery.");
    expect(render(quiet, null)).toBe(render(quiet, undefined as unknown as null));
  });

  it("names it in the none, one and dormant lines too", () => {
    const firstDay = composeBrief({ ...base, knows: 1 });
    expect(render(firstDay, "Ada")).toContain("Ada knows one thing so far: what you do.");
    expect(render(composeBrief({ ...base, knows: 0 }), "Ada")).toContain("Ada does not know what you do yet.");
    const dormant = renderToStaticMarkup(createElement(Brief, { locale: "en", brief: firstDay, hasCompany: true, companyName: "Lantern Bakery", configured: false, cofounderName: "Ada" }));
    expect(dormant).toContain("Ada is not switched on");
    expect(dormant).not.toContain("It has no name yet");
  });

  it("never puts an address in the brief", () => {
    const quiet = composeBrief({ ...base, knows: 3, openCount: 1, changes: 0 });
    expect(render(quiet, "Ada")).not.toContain("Selin");
  });
});
