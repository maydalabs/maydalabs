import { beforeEach, describe, expect, it, vi } from "vitest";
import { MIN_FILL_TIME_MS, looksAutomated } from "@/lib/intakeValidation";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  insert: vi.fn(), upsert: vi.fn(), claims: vi.fn(), headers: vi.fn(), cookies: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: mocks.headers, cookies: mocks.cookies }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getVerifiedClaims: mocks.claims }));
vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseSecretKey: () => "secret",
  getSupabaseUrl: () => "http://127.0.0.1:54321",
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => ({
      insert: (row: unknown) => mocks.insert(table, row),
      upsert: (row: unknown) => mocks.upsert(table, row),
    }),
  }),
}));

import { submitLeadIntakeAction } from "@/app/actions/leadIntake";

function validForm(extra: Record<string, string> = {}): FormData {
  const form = new FormData();
  const fields: Record<string, string> = {
    name: "Dana Ellis",
    email: "dana@example.com",
    company: "Northwind",
    message: "We copy orders between two systems by hand every single morning.",
    consentContact: "on",
    locale: "en",
    source: "contact",
    website: "",
    elapsedMs: String(MIN_FILL_TIME_MS + 4_000),
    ...extra,
  };
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.RESEND_API_KEY;
  mocks.claims.mockResolvedValue(null);
  mocks.cookies.mockResolvedValue({ get: () => undefined, set: () => {}, delete: () => {} });
  // A fresh client key each time, so the action's own rate limit does not
  // count one test's submissions against the next one's.
  mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250) + 1}` }));
  mocks.insert.mockResolvedValue({ error: null });
  mocks.upsert.mockResolvedValue({ error: null });
});

describe("an enquiry is stored first, and mail is best-effort after", () => {
  it("stores the row and sends nothing when no key is configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await submitLeadIntakeAction({ status: "idle" }, validForm())).toEqual({ status: "submitted" });
    expect(mocks.insert).toHaveBeenCalledWith("lead_intakes", expect.objectContaining({ email: "dana@example.com" }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("sends exactly two messages: one to them, one to the operator", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.MAYDALABS_NOTIFY_EMAIL = "ops@maydalabs.com";
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ id: "sent" }), { status: 200 }));

    expect(await submitLeadIntakeAction({ status: "idle" }, validForm())).toEqual({ status: "submitted" });

    const sent = fetchSpy.mock.calls.map((call) => JSON.parse(String(call[1]!.body)));
    expect(sent).toHaveLength(2);
    const [ack, internal] = sent;
    expect(ack.to).toEqual(["dana@example.com"]);
    expect(ack.reply_to).toBeUndefined();
    expect(internal.to).toEqual(["ops@maydalabs.com"]);
    // Replying to the notification must reach the enquirer, not ourselves.
    expect(internal.reply_to).toBe("dana@example.com");
    expect(internal.subject).toContain("Dana Ellis");
    delete process.env.MAYDALABS_NOTIFY_EMAIL;
    fetchSpy.mockRestore();
  });

  /* The row is already written by the time mail is attempted. A provider
   * outage must cost a notification, never the enquiry itself. */
  it("still reports success to the visitor when the mail provider is down", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("provider down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await submitLeadIntakeAction({ status: "idle" }, validForm())).toEqual({ status: "submitted" });
    expect(mocks.insert).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("never mails when the enquiry was not stored", async () => {
    process.env.RESEND_API_KEY = "test-key";
    mocks.insert.mockResolvedValue({ error: { message: "insert failed" } });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await submitLeadIntakeAction({ status: "idle" }, validForm())).toEqual({
      status: "error", code: "save_failed",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("does not mail a submission that was dropped as automated", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await submitLeadIntakeAction({ status: "idle" }, validForm({ website: "i am a bot" }));
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

/* Characterisation, not approval. The hidden timing field is filled by an
 * onSubmit handler, so a visitor without JavaScript submits an empty one and
 * `Number("")` is 0, which reads as "filled in under three seconds". The
 * enquiry is silently dropped and the visitor is told it was submitted.
 * Recorded here so the behaviour is visible and deliberate rather than
 * discovered again later. */
describe("a submission with no timing value is treated as automated", () => {
  it("drops an empty elapsedMs, which is what a no-JavaScript visitor sends", () => {
    expect(looksAutomated("", "")).toBe(true);
  });

  it("accepts the same submission once a real timing value is present", () => {
    expect(looksAutomated("", String(MIN_FILL_TIME_MS + 1))).toBe(false);
  });
});
