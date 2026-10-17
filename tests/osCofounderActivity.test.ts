import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OS_ACTIVITY_COPY } from "@/components/osCopy";
import type { AgentRunView } from "@/lib/osAgentRunTypes";
import { RUN_ACTOR, RUN_COMPANY, runView } from "./helpers/agentRunView";

/* The Running window as the server renders it: the Runs section above the
 * workflows, and the empty line under them. A person-started run may be
 * working there, so the empty line must not say that nothing runs. Nothing
 * here reaches a database: the signed-in client answers every read empty. */

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ runs: vi.fn(), company: vi.fn() }));
type Query = { select: () => Query; order: () => Query; eq: () => Query; then: (resolve: (value: { data: unknown[]; error: null }) => unknown) => Promise<unknown> };
const query: Query = {
  select: () => query, order: () => query, eq: () => query,
  then: (resolve) => Promise.resolve({ data: [], error: null }).then(resolve),
};
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ from: () => query }), getVerifiedClaims: async () => ({ sub: RUN_ACTOR }) }));
vi.mock("@/lib/osCompany", () => ({ currentCompany: mocks.company }));
vi.mock("@/lib/osAgentRunStore", () => ({ loadAgentRunsNow: mocks.runs }));
vi.mock("@/components/MemberWorkflowForm", () => ({ MemberWorkflowForm: () => null, DeleteWorkflowButton: () => null }));
vi.mock("@/components/os/AgentRunsLive", () => ({
  AgentRunsLive: ({ initialRuns }: { initialRuns: AgentRunView[] }) => createElement("section", { "data-runs": initialRuns.map((run) => run.status).join(",") }),
}));
import { CofounderActivity } from "@/components/CofounderActivity";

const render = async (locale: "en" | "tr" | "fr" = "en") => renderToStaticMarkup(await CofounderActivity({ locale, bare: true }) as React.ReactElement);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.company.mockResolvedValue({ id: RUN_COMPANY });
  mocks.runs.mockResolvedValue({ runs: [runView({ status: "running" })], serverNow: Date.parse("2026-10-17T10:01:00Z") });
});

describe("the Running window's empty line", () => {
  it.each(["en", "tr", "fr"] as const)("speaks of workflows only beneath a working run, in %s", async (locale) => {
    const html = await render(locale);
    expect(html).toContain('data-runs="running"');
    expect(html).toContain(OS_ACTIVITY_COPY[locale].emptyWorkflows);
    expect(html).not.toContain(OS_ACTIVITY_COPY[locale].empty);
  });

  it("keeps the whole-window line when the Runs section could not be read and is hidden", async () => {
    mocks.runs.mockRejectedValue(new Error("agent_runs_unavailable"));
    const html = await render();
    expect(html).not.toContain("data-runs");
    expect(html).toContain(OS_ACTIVITY_COPY.en.empty);
  });

  it("never says nothing runs when it shows the Runs section", () => {
    expect(OS_ACTIVITY_COPY.en.emptyWorkflows).not.toMatch(/nothing runs/i);
    expect(OS_ACTIVITY_COPY.tr.emptyWorkflows).not.toMatch(/çalışan bir şey yok/i);
  });
});
