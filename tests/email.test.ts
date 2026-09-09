import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { acknowledgementEmail, escapeHtml, notificationEmail } from "@/lib/emailTemplates";
import type { IntakeInput } from "@/lib/intakeValidation";

const INTAKE: IntakeInput = {
  name: "Dana Ellis",
  email: "dana@example.com",
  company: "Northwind",
  companyStage: "growing",
  primaryConstraint: "manual_ops",
  desiredOutcome: "fewer_manual_steps",
  budgetRange: "10k_30k",
  timeline: "quarter",
  message: "We copy orders between two systems by hand every morning.",
  consentContact: true,
  consentUpdates: false,
  locale: "en",
  source: "contact",
};

describe("escaping what a stranger typed", () => {
  it("neutralises markup", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(escapeHtml("Tom & Jerry's")).toBe("Tom &amp; Jerry&#39;s");
  });

  /* A name is a field on a public form. It reaches an HTML document, so it is
   * untrusted input like any other, in both emails. */
  it("escapes every field a stranger controls, in both emails", () => {
    const hostile: IntakeInput = {
      ...INTAKE,
      name: '<img src=x onerror="alert(1)">',
      company: "</td></tr></table><b>escaped?</b>",
      message: "<script>steal()</script>",
    };
    for (const mail of [acknowledgementEmail(hostile), notificationEmail(hostile)]) {
      // What matters is that none of it survives as markup. The letters
      // "onerror=" do still appear, inside escaped text, and are inert there.
      expect(mail.html).not.toContain(hostile.name);
      expect(mail.html).not.toContain(hostile.company!);
      expect(mail.html).not.toContain("<script>");
      expect(mail.html).not.toContain('onerror="');
      // The one <img> in the document is the brand logo the shell puts there.
      expect(mail.html.match(/<img/g) ?? []).toHaveLength(1);
      expect(mail.html).not.toContain("<b>escaped?</b>");
      // The message is quoted in both, and comes through inert.
      expect(mail.html).toContain("&lt;script&gt;steal()&lt;/script&gt;");
    }
    // The name and company appear only in the internal one, also escaped.
    expect(notificationEmail(hostile).html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(notificationEmail(hostile).html).toContain("&lt;/td&gt;&lt;/tr&gt;");
    // The subject is a header, not markup, so it carries the raw text.
    expect(notificationEmail(hostile).subject).toContain("<img src=x");
  });
});

describe("the acknowledgement", () => {
  it("answers in the language the person used", () => {
    expect(acknowledgementEmail(INTAKE).subject).toBe("We have your message — MaydaLabs");
    expect(acknowledgementEmail({ ...INTAKE, locale: "tr" }).subject).toContain("Mesajınız");
    expect(acknowledgementEmail({ ...INTAKE, locale: "fr" }).subject).toContain("bien reçu");
    expect(acknowledgementEmail({ ...INTAKE, locale: "fr" }).html).toContain('lang="fr"');
  });

  it("quotes their own message back and survives having none", () => {
    expect(acknowledgementEmail(INTAKE).html).toContain("copy orders between two systems");
    const silent = acknowledgementEmail({ ...INTAKE, message: null });
    expect(silent.html).toContain("Thanks");
    expect(silent.text).not.toContain("What you sent us");
  });

  /* Replying to a message is not the same permission as being subscribed.
   * The email has to say so, and must never carry marketing. */
  it("says it is a one-off reply, not a subscription", () => {
    const mail = acknowledgementEmail({ ...INTAKE, consentUpdates: true });
    expect(mail.text).toContain("does not sign you up");
    expect(mail.html).not.toContain("unsubscribe");
  });

  it("never reveals the internal notification address", () => {
    expect(acknowledgementEmail(INTAKE).html).not.toContain("/internal/leads");
  });

  it("ships a plain-text alternative for every locale", () => {
    for (const locale of ["en", "tr", "fr"] as const) {
      const mail = acknowledgementEmail({ ...INTAKE, locale });
      expect(mail.text.length).toBeGreaterThan(40);
      expect(mail.text).not.toContain("<");
    }
  });
});

describe("the operator notification", () => {
  it("names who wrote in and carries every answer", () => {
    const mail = notificationEmail(INTAKE);
    expect(mail.subject).toBe("New enquiry: Dana Ellis · Northwind");
    for (const value of ["dana@example.com", "growing", "manual_ops", "10k_30k", "quarter"]) {
      expect(mail.text).toContain(value);
    }
    expect(mail.html).toContain("/internal/leads");
  });

  it("is honest that the updates opt-in has not been acted on", () => {
    expect(notificationEmail({ ...INTAKE, consentUpdates: true }).text).toContain("still pending, nothing sent");
    expect(notificationEmail(INTAKE).text).toContain("Wants updates: no");
  });

  it("copes with a person who filled in almost nothing", () => {
    const bare: IntakeInput = {
      ...INTAKE, company: null, companyStage: null, primaryConstraint: null,
      desiredOutcome: null, budgetRange: null, timeline: null, message: null,
    };
    const mail = notificationEmail(bare);
    expect(mail.subject).toBe("New enquiry: Dana Ellis");
    expect(mail.html).toContain("No message written.");
  });
});

describe("sending fails closed", () => {
  beforeEach(() => { vi.resetModules(); delete process.env.RESEND_API_KEY; });

  it("reports itself unconfigured and makes no request without a key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { isEmailConfigured, sendEmail } = await import("@/lib/email");
    expect(isEmailConfigured()).toBe(false);
    expect(await sendEmail({ to: "a@example.com", subject: "s", html: "<p>h</p>", text: "t" }))
      .toEqual({ ok: false, reason: "not_configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  /* An enquiry is already stored by the time this runs. A provider outage
   * must be a logged failure, never an exception that reaches the visitor. */
  it("turns a rejection or an outage into a result instead of throwing", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const { sendEmail } = await import("@/lib/email");
    const message = { to: "a@example.com", subject: "s", html: "<p>h</p>", text: "t" };

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(new Response("nope", { status: 422 }));
    expect(await sendEmail(message)).toEqual({ ok: false, reason: "rejected" });

    fetchSpy.mockRejectedValueOnce(new Error("network down"));
    expect(await sendEmail(message)).toEqual({ ok: false, reason: "unreachable" });
    fetchSpy.mockRestore();
  });

  it("sends one message to one recipient, with reply-to only when asked", async () => {
    process.env.RESEND_API_KEY = "test-key";
    const { sendEmail } = await import("@/lib/email");
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ id: "abc" }), { status: 200 }));

    expect(await sendEmail({ to: "a@example.com", subject: "s", html: "<p>h</p>", text: "t" }))
      .toEqual({ ok: true, id: "abc" });
    const plain = JSON.parse(String(fetchSpy.mock.calls[0]![1]!.body));
    expect(plain.to).toEqual(["a@example.com"]);
    expect(plain.reply_to).toBeUndefined();

    await sendEmail({ to: "b@example.com", subject: "s", html: "<p>h</p>", text: "t", replyTo: "them@example.com" });
    expect(JSON.parse(String(fetchSpy.mock.calls[1]![1]!.body)).reply_to).toBe("them@example.com");
    fetchSpy.mockRestore();
  });
});
