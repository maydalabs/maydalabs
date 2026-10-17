import { describe, expect, it } from "vitest";
import { OS_ACTIVITY_COPY, OS_BRIEF_COPY, OS_COFOUNDER_CHAT_COPY, OS_DOCUMENT_COPY, OS_RUN_COPY, OS_SETTINGS_COPY, OS_SHELL_COPY } from "@/components/osCopy";
import { COFOUNDER_VOICES } from "@/lib/osPersona";
import { AGENT_RUN_STATUSES, PROGRESS_KINDS, STOP_REASONS } from "@/lib/osAgentRunTypes";

/* Three languages, one shape. A key present in English and missing in
 * Turkish is a sentence that renders as "undefined" for a Turkish desk. */

function shape(value: unknown): unknown {
  if (typeof value === "function") return "fn";
  if (Array.isArray(value)) return "list";
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, shape(v)]));
  }
  return typeof value;
}

const books = { OS_SHELL_COPY, OS_SETTINGS_COPY, OS_COFOUNDER_CHAT_COPY, OS_BRIEF_COPY, OS_ACTIVITY_COPY, OS_RUN_COPY, OS_DOCUMENT_COPY } as const;

describe("copy parity", () => {
  it.each(Object.keys(books))("%s has the same keys in every language", (name) => {
    const book = books[name as keyof typeof books] as Record<string, unknown>;
    expect(shape(book.tr)).toEqual(shape(book.en));
    expect(shape(book.fr)).toEqual(shape(book.en));
  });

  it.each(["en", "tr", "fr"] as const)("every named template carries {name} in %s", (locale) => {
    const shell = OS_SHELL_COPY[locale], settings = OS_SETTINGS_COPY[locale], chat = OS_COFOUNDER_CHAT_COPY[locale], brief = OS_BRIEF_COPY[locale];
    for (const template of [
      shell.commandAskNamed, shell.commandTellNamed, settings.addressNamed, chat.placeholderNamed, chat.emptyNamed,
      brief.knows.noneNamed, brief.knows.oneNamed, brief.knows.manyNamed, brief.firstDay.hintNamed, brief.firstDay.hintDormantNamed,
    ]) {
      expect(template).toContain("{name}");
    }
    expect(shell.companyCofounderNoteQuoted).toContain("{note}");
    expect(shell.companyCofounderNamePlaceholder).toBeTruthy();
  });

  it.each(["en", "tr", "fr"] as const)("names exactly the voices the module knows and every reason an action can give, in %s", (locale) => {
    const shell = OS_SHELL_COPY[locale], settings = OS_SETTINGS_COPY[locale];
    expect(Object.keys(shell.companyCofounderVoices).sort()).toEqual([...COFOUNDER_VOICES].sort());
    for (const voice of COFOUNDER_VOICES) {
      expect(shell.companyCofounderVoices[voice].label).toBeTruthy();
      expect(shell.companyCofounderVoices[voice].help).toBeTruthy();
    }
    for (const code of ["not_configured", "not_signed_in", "bad_company", "not_yours", "name", "voice", "note", "note_permission", "storage"]) {
      expect(shell.companyCofounderReasons[code]).toBeTruthy();
    }
    for (const code of ["not_configured", "not_signed_in", "no_company", "address", "not_member", "storage"]) {
      expect(settings.addressReasons[code]).toBeTruthy();
    }
  });

  /* Runs: every sentence that names a person exists for the starter and for
   * everyone else, with the same keys, and what anyone else reads never
   * addresses them. Each status, stop reason and progress kind SQL can write
   * has words; the viewer-dependent ones live under viewer, never twice. */
  it.each(["en", "tr", "fr"] as const)("words every run state for both viewers in %s", (locale) => {
    const copy = OS_RUN_COPY[locale];
    expect(Object.keys(copy.viewer.other).sort()).toEqual(Object.keys(copy.viewer.mine).sort());
    for (const [key, sentence] of Object.entries(copy.viewer.other)) {
      expect(sentence, key).toBeTruthy();
      expect(sentence, key).not.toBe(copy.viewer.mine[key as keyof typeof copy.viewer.mine]);
    }
    const viewerKinds = ["asked", "answered", "skipped", "stopped"];
    expect([...Object.keys(copy.progress), ...viewerKinds].sort()).toEqual([...PROGRESS_KINDS].sort());
    // stalled is the server's word for a running run whose lease expired.
    expect([...Object.keys(copy.status), "waiting", "canceled"].sort()).toEqual([...AGENT_RUN_STATUSES, "stalled"].sort());
    expect([...Object.keys(copy.stopReasons), "canceled"].sort()).toEqual([...STOP_REASONS].sort());
  });

  it.each(["en", "fr"] as const)("never says you to a member who did not start the run, in %s", (locale) => {
    const pronoun = locale === "en" ? /\b(you|your|yours)\b/i : /\b(vous|votre|vos)\b/i;
    for (const sentence of [...Object.values(OS_RUN_COPY[locale].viewer.other), OS_RUN_COPY[locale].question.other]) expect(sentence).not.toMatch(pronoun);
  });

  it.each(["en", "tr", "fr"] as const)("every run template carries its placeholders in %s", (locale) => {
    const copy = OS_RUN_COPY[locale];
    const holes = (template: string) => [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    expect(holes(copy.startCostPriced)).toEqual(["left", "max"]);
    expect(holes(copy.counters)).toEqual(["maxSteps", "reads", "step"]);
    expect(holes(copy.cardsPlanned)).toEqual(["cards", "planned"]);
    expect(holes(copy.cardsUnplanned)).toEqual(["cards"]);
    expect(holes(copy.planCount)).toEqual(["n"]);
    expect(holes(copy.spend)).toEqual(["ceiling", "spent"]);
    expect(holes(copy.fromRun)).toEqual(["instruction"]);
    // A record's age is the day count it had when read, never a date relative to now.
    expect(holes(copy.progress.read)).toEqual(["label", "n"]);
    expect(holes(copy.progress.card)).toEqual(["label"]);
    for (const key of ["plan", "search", "memory", "refused"] as const) expect(holes(copy.progress[key])).toEqual(["n"]);
    for (const key of ["resumed", "paused", "cut_off", "fault", "finished", "failed"] as const) expect(holes(copy.progress[key])).toEqual([]);
  });
});
