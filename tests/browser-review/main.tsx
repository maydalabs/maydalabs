// Browser-only illustrative harness; never imported by the app. Browser storage
// here is a transport stub, NOT evidence of real database persistence.
import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ReviewCards } from "@/components/os/ReviewCards";
import { ReviewIntentFields, ReviewIntentSummary } from "@/components/os/ReviewIntentFields";
import { parseReviewRequestIntent, type ReviewRequestMode } from "@/lib/osReviewIntent";
import type { ReviewWorkKind } from "@/lib/osReviewGuard";
import type { Locale } from "@/lib/i18n";
import { applyFixtureCommand, createFixture, emptyFixture, EXAMPLE_ASSERTION, EXAMPLE_QUESTION, FIXTURE_KEY, type FixtureCommand, type FixtureState } from "./fixture";
import "@/app/field.css";
import "@/app/os.css";

function load(): FixtureState {
  const raw = localStorage.getItem(FIXTURE_KEY);
  return raw ? JSON.parse(raw) as FixtureState : emptyFixture();
}
function store(state: FixtureState) { localStorage.setItem(FIXTURE_KEY, JSON.stringify(state)); }
let responseMode = "normal";

// No original fetch fallback: every request is confined to this stub.
window.fetch = async (input, init) => {
  if (input !== "/api/os/review" || init?.method !== "POST") throw new Error("network_disabled_in_synthetic_fixture");
  const command = JSON.parse(String(init.body)) as FixtureCommand;
  await new Promise((resolve) => setTimeout(resolve, 350));
  const before = load();
  if (responseMode === "rollback") {
    store({ ...before, requests: before.requests + 1 });
    throw new Error("synthetic_interrupted_before_commit");
  }
  if (["duplicate_work", "calendar_date", "knowledge_assertion", "knowledge_approval"].includes(responseMode) && command.action !== "dismiss" && command.action !== "revise") {
    store({ ...before, requests: before.requests + 1 });
    return Response.json({ error: "review_rejected", reason: responseMode }, { status: 422 });
  }
  const result = applyFixtureCommand(before, command);
  store(result.state);
  if (responseMode === "lost" && result.status === 200) throw new Error("synthetic_response_lost_after_commit");
  return Response.json(result.body, { status: result.status });
};

const field = { width: "100%", minWidth: 0, maxWidth: "100%", boxSizing: "border-box" as const };
function App() {
  const [state, setState] = useState(load);
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<ReviewRequestMode>("both");
  const [format, setFormat] = useState<ReviewWorkKind | "">("");
  const [assertion, setAssertion] = useState("");
  const [question, setQuestion] = useState(EXAMPLE_QUESTION);
  const [uncertain, setUncertain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [generation, setGeneration] = useState(0);
  const mutation = useRef(false);
  const intent = parseReviewRequestIntent({
    draftFormat: mode === "draft" || mode === "both" ? format || null : null,
    knowledgeAssertion: mode === "knowledge" || mode === "both" ? assertion.trim() || null : null,
  }, mode);
  const release = () => { mutation.current = false; setBusy(false); setState(load()); };
  const reset = () => {
    localStorage.removeItem(FIXTURE_KEY);
    setState(emptyFixture()); setUncertain(false); setBusy(false); mutation.current = false;
    setMode("both"); setFormat(""); setAssertion(""); setQuestion(EXAMPLE_QUESTION); setGeneration((value) => value + 1);
  };
  return <main className="os-root" style={{ padding: "clamp(12px,3vw,32px)", margin: "0 auto", maxWidth: 760, background: "#0d1118", color: "#d5e0ec", minHeight: "100vh", fontFamily: "system-ui", display: "grid", gap: "1.5rem", alignContent: "start", overflowWrap: "anywhere" }}>
    <header style={{ display: "grid", gap: ".6rem" }}>
      <h1 style={{ fontSize: 22 }}>S1i — isolated review-controls fixture</h1>
      <p>Illustrative test only. No company account, authentication, real database or model is connected. No message can be sent. Receipts below describe browser-local stub records, not production saves.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem" }}>
        <label>Language <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} disabled={busy || uncertain}><option>en</option><option>tr</option><option>fr</option></select></label>
        <label>Test response <select onChange={(event) => { responseMode = event.target.value; }} defaultValue="normal" disabled={busy}>
          <option value="normal">Normal</option><option value="lost">Lost after commit</option><option value="rollback">Interrupted before commit</option>
          <option value="duplicate_work">Confirmed duplicate refusal</option><option value="calendar_date">Confirmed date refusal</option>
          <option value="knowledge_assertion">Confirmed statement refusal</option><option value="knowledge_approval">Confirmed approval refusal</option>
        </select></label>
      </div>
      <button type="button" onClick={reset} disabled={busy}>Reset isolated fixture</button>
      <p id="request-count">Review requests in this fixture: {state.requests}</p>
    </header>
    {!state.turn ? <form style={{ display: "grid", gap: "1rem", minWidth: 0 }} onSubmit={(event) => {
      event.preventDefault();
      if (!intent || !question.trim()) return;
      const next = createFixture(question, mode, intent); store(next); setState(next);
    }}>
      <h2 style={{ fontSize: 18 }}>1. Make explicit choices</h2>
      <p>Choose Reply for the example below. Leave the separate company-statement field blank first to check that quoted chat does not create knowledge. Reset and add your own statement to exercise the final approval control.</p>
      <label className="mayda-field">Request mode
        <select value={mode} onChange={(event) => { setMode(event.target.value as ReviewRequestMode); setFormat(""); setAssertion(""); }} style={field}>
          <option value="ask">Ask only</option><option value="draft">Draft</option><option value="knowledge">Company knowledge</option><option value="both">Draft and company knowledge</option>
        </select>
      </label>
      <ReviewIntentFields locale={locale} mode={mode} format={format} assertion={assertion} disabled={false} onFormat={setFormat} onAssertion={setAssertion} />
      <details><summary>Example company statement to type or paste separately</summary><p>{EXAMPLE_ASSERTION}</p></details>
      <label className="mayda-field">Question / pasted conversation<textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} style={{ ...field, resize: "vertical" }} /></label>
      <button type="submit" disabled={!intent || !question.trim()}>Create illustrative preview (no model)</button>
    </form> : <section style={{ display: "grid", gap: "1rem", minWidth: 0 }}>
      <h2 style={{ fontSize: 18 }}>Captured request — browser-local only</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{state.turn.question}</p>
      {state.turn.intent ? <ReviewIntentSummary locale={locale} intent={state.turn.intent} /> : null}
      <p>{state.turn.reply}</p>
    </section>}
    {uncertain ? <p role="status">The stub response was uncertain. Controls remain locked. Refresh the page to read browser-local state; nothing retries automatically.</p> : null}
    <ReviewCards key={`${locale}:${generation}`} proposals={state.proposals} turns={state.turn ? [state.turn] : []} locale={locale}
      disabled={busy || uncertain}
      onMutationStart={() => { if (mutation.current || uncertain) return false; mutation.current = true; setBusy(true); return true; }}
      onUncertain={() => { setUncertain(true); setBusy(false); setState((current) => ({ ...current, requests: load().requests })); }}
      onRejected={release} onChange={release} />
    <button type="button" onClick={() => window.location.reload()}>Refresh and read isolated stored state</button>
  </main>;
}
createRoot(document.getElementById("root")!).render(<App />);
