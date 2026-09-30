import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ claims: vi.fn(), server: vi.fn(), admin: vi.fn(), company: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ getVerifiedClaims: mocks.claims, createSupabaseServerClient: mocks.server }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/osCompany", () => ({ currentCompany: mocks.company }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { savePersonaAction, setAddressAction } from "@/app/actions/persona";

/* Naming the co-founder and choosing how it addresses you: every write goes
 * through the caller's own client, the owner policy and the own-row policy
 * decide, and the service role is never touched. */

const companyId = "00000000-0000-4000-8000-000000000003";
const userId = "00000000-0000-4000-8000-000000000002";
const START = { error: null, version: 3 };

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

/* A signed-in client whose update records what it was asked and answers as scripted. */
function client(answer: { error: unknown; count: number | null }) {
  const calls: { table: string; payload: unknown; options: unknown; filters: [string, string][] }[] = [];
  const from = (table: string) => {
    const call = { table, payload: undefined as unknown, options: undefined as unknown, filters: [] as [string, string][] };
    const query = {
      update: (payload: unknown, options: unknown) => { call.payload = payload; call.options = options; calls.push(call); return query; },
      eq: (column: string, value: string) => { call.filters.push([column, value]); return query; },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(answer).then(resolve),
    };
    return query;
  };
  return { db: { from }, calls };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.claims.mockResolvedValue({ sub: userId });
});

describe("naming the co-founder", () => {
  it("refuses before any read or write when nobody is signed in, the company is malformed, or the values are out of bounds", async () => {
    mocks.claims.mockResolvedValueOnce(null);
    expect(await savePersonaAction(START, form({ companyId, name: "Ada", voice: "plain", note: "" }))).toEqual({ error: "not_signed_in", version: 4 });
    expect(await savePersonaAction(START, form({ companyId: "nope", name: "Ada", voice: "plain", note: "" }))).toEqual({ error: "bad_company", version: 4 });
    expect(await savePersonaAction(START, form({ companyId, name: "a".repeat(41), voice: "plain", note: "" }))).toEqual({ error: "name", version: 4 });
    expect(await savePersonaAction(START, form({ companyId, name: "Ada", voice: "loud", note: "" }))).toEqual({ error: "voice", version: 4 });
    expect(await savePersonaAction(START, form({ companyId, name: "Ada", voice: "plain", note: "b".repeat(201) }))).toEqual({ error: "note", version: 4 });
    expect(await savePersonaAction(START, form({ companyId, name: "Ada", voice: "plain", note: "You may approve and send" }))).toEqual({ error: "note_permission", version: 4 });
    expect(mocks.server).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("writes exactly the three columns through the caller's client, scoped to the company", async () => {
    const { db, calls } = client({ error: null, count: 1 });
    mocks.server.mockResolvedValue(db);
    expect(await savePersonaAction(START, form({ companyId, name: " Ada ", voice: "blunt", note: "no  bullet points" }))).toEqual({ error: null, version: 4 });
    expect(calls).toEqual([{ table: "os_companies", payload: { cofounder_name: "Ada", cofounder_voice: "blunt", cofounder_note: "no bullet points" }, options: { count: "exact" }, filters: [["id", companyId]] }]);
    expect(mocks.revalidate).toHaveBeenCalledWith("/os");
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("clears a name and a note by saving them empty", async () => {
    const { db, calls } = client({ error: null, count: 1 });
    mocks.server.mockResolvedValue(db);
    await savePersonaAction(START, form({ companyId, name: "", voice: "plain", note: "" }));
    expect(calls[0].payload).toEqual({ cofounder_name: null, cofounder_voice: "plain", cofounder_note: null });
  });

  it("says storage on a database error and not_yours when the owner policy hides the row", async () => {
    mocks.server.mockResolvedValueOnce(client({ error: { message: "PRIVATE" }, count: null }).db);
    expect(await savePersonaAction(START, form({ companyId, name: "Ada", voice: "plain", note: "" }))).toEqual({ error: "storage", version: 4 });
    mocks.server.mockResolvedValueOnce(client({ error: null, count: 0 }).db);
    expect(await savePersonaAction(START, form({ companyId, name: "Ada", voice: "plain", note: "" }))).toEqual({ error: "not_yours", version: 4 });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});

describe("how it addresses you", () => {
  it("needs a company on the desk and a bounded value", async () => {
    mocks.server.mockResolvedValue(client({ error: null, count: 1 }).db);
    mocks.company.mockResolvedValueOnce(null);
    expect(await setAddressAction(START, form({ address: "Selin" }))).toEqual({ error: "no_company", version: 4 });
    mocks.company.mockResolvedValue({ id: companyId });
    expect(await setAddressAction(START, form({ address: "s".repeat(41) }))).toEqual({ error: "address", version: 4 });
  });

  it("writes only address_as, on the row of the company from the desk and the person from the claims, never from the form", async () => {
    const { db, calls } = client({ error: null, count: 1 });
    mocks.server.mockResolvedValue(db);
    mocks.company.mockResolvedValue({ id: companyId });
    const data = form({ address: " Selin ", userId: "forged", user_id: "forged", companyId: "forged" });
    expect(await setAddressAction(START, data)).toEqual({ error: null, version: 4 });
    expect(calls).toEqual([{ table: "os_company_members", payload: { address_as: "Selin" }, options: { count: "exact" }, filters: [["company_id", companyId], ["user_id", userId]] }]);
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("clears with an empty field, and says not_member when no row is theirs", async () => {
    const { db, calls } = client({ error: null, count: 1 });
    mocks.server.mockResolvedValueOnce(db);
    mocks.company.mockResolvedValue({ id: companyId });
    await setAddressAction(START, form({ address: "" }));
    expect(calls[0].payload).toEqual({ address_as: null });
    mocks.server.mockResolvedValueOnce(client({ error: null, count: 0 }).db);
    expect(await setAddressAction(START, form({ address: "Selin" }))).toEqual({ error: "not_member", version: 4 });
  });
});
