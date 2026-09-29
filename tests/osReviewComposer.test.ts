import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CofounderApp } from "@/components/os/CofounderApp";
import { REVIEW_INTENT_COPY, ReviewIntentFields, ReviewIntentSummary } from "@/components/os/ReviewIntentFields";
import { OS_COFOUNDER_CHAT_COPY } from "@/components/osCopy";
import type { ReviewSnapshot } from "@/lib/osReviewTypes";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/os/OsCommandBar", () => ({ OS_ASK_EVENT: "synthetic-ask-event" }));
vi.mock("@/components/os/ReviewCards", () => ({ ReviewCards: () => null }));

const snapshot: ReviewSnapshot = {
  companyId: "synthetic-company", actorId: "synthetic-actor", messages: [], turns: [], proposals: [],
};

describe("co-founder request composer", () => {
  it.each(["en", "tr", "fr"] as const)("shows four labelled modes and defaults to Ask in %s", (locale) => {
    const copy = OS_COFOUNDER_CHAT_COPY[locale];
    const html = renderToStaticMarkup(createElement(CofounderApp, {
      initialSnapshot: snapshot, locale, copy, canTalk: true, why: null,
    }));

    expect(html).toContain(`<legend class="os-chat-who"`);
    expect(html).toContain(copy.modeLabel);
    expect(html.match(/type="radio" name="review-request-mode"/g)).toHaveLength(4);
    for (const mode of ["ask", "draft", "knowledge", "both"] as const) {
      expect(html).toContain(`value="${mode}"`);
      expect(html).toContain(copy.modes[mode].label);
    }
    expect(html).toMatch(/<input[^>]*checked=""[^>]*value="ask"/);
    expect(html).toContain(`>${copy.modes.ask.help}</p>`);
    expect(html).toContain(`>${copy.modes.ask.submit}</button>`);
    const describedBy = html.match(/<fieldset[^>]*aria-describedby="([^"]+)"/)?.[1];
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`<p id="${describedBy}"`);
    expect(html).toContain("flex-wrap:wrap");
  });
});

describe("request intent fields", () => {
  it.each(["en", "tr", "fr"] as const)("renders explicit accessible choices and the separate assertion in %s", (locale) => {
    const copy = REVIEW_INTENT_COPY[locale];
    const html = renderToStaticMarkup(createElement(ReviewIntentFields, {
      locale, mode: "both", format: "", assertion: "", disabled: false, onFormat: () => undefined, onAssertion: () => undefined,
    }));
    expect(html).toContain(copy.format);
    expect(html).toContain(copy.assertion);
    expect(html).toContain(copy.assertionHelp);
    expect(html).toMatch(/<option value="" disabled="" selected="">/);
    for (const kind of ["email", "reply", "post", "note", "research", "decision"]) expect(html).toContain(`<option value="${kind}">`);
    expect(html).toContain('name="review-knowledge-assertion"');
    expect(html).toContain('maxLength="2000"');
    expect(html).toContain('aria-describedby=');
    expect(html).toContain('min-width:0');
    expect(html).not.toContain('autofocus');
    expect(html).not.toContain('role="dialog"');
  });
  it("shows the exact saved choices as escaped text", () => {
    const assertion = 'Founder statement.\n<img src=x onerror="no">';
    const html = renderToStaticMarkup(createElement(ReviewIntentSummary, { locale: "en", intent: { draftFormat: "reply", knowledgeAssertion: assertion } }));
    expect(html).toContain("Reply");
    expect(html).toContain("Founder statement.\n&lt;img");
    expect(html).not.toContain("<img");
    expect(html).toContain("white-space:pre-wrap");
    expect(html).toContain("overflow-wrap:anywhere");
  });
});
