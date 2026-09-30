import { describe, expect, it } from "vitest";
import { OS_ACTIVITY_COPY, OS_BRIEF_COPY, OS_COFOUNDER_CHAT_COPY, OS_SETTINGS_COPY, OS_SHELL_COPY } from "@/components/osCopy";
import { COFOUNDER_VOICES } from "@/lib/osPersona";

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

const books = { OS_SHELL_COPY, OS_SETTINGS_COPY, OS_COFOUNDER_CHAT_COPY, OS_BRIEF_COPY, OS_ACTIVITY_COPY } as const;

describe("copy parity", () => {
  it.each(Object.keys(books))("%s has the same keys in every language", (name) => {
    const book = books[name as keyof typeof books] as Record<string, unknown>;
    expect(shape(book.tr)).toEqual(shape(book.en));
    expect(shape(book.fr)).toEqual(shape(book.en));
  });

  it.each(["en", "tr", "fr"] as const)("every named template carries {name} in %s", (locale) => {
    const shell = OS_SHELL_COPY[locale], settings = OS_SETTINGS_COPY[locale], chat = OS_COFOUNDER_CHAT_COPY[locale], brief = OS_BRIEF_COPY[locale];
    for (const template of [shell.commandAskNamed, shell.commandTellNamed, settings.addressNamed, chat.placeholderNamed, chat.emptyNamed, brief.knows.manyNamed, brief.firstDay.hintNamed]) {
      expect(template).toContain("{name}");
    }
  });

  it.each(["en", "tr", "fr"] as const)("names exactly the voices the module knows and every reason an action can give, in %s", (locale) => {
    const shell = OS_SHELL_COPY[locale], settings = OS_SETTINGS_COPY[locale];
    expect(Object.keys(shell.companyCofounderVoices).sort()).toEqual([...COFOUNDER_VOICES].sort());
    for (const voice of COFOUNDER_VOICES) {
      expect(shell.companyCofounderVoices[voice].label).toBeTruthy();
      expect(shell.companyCofounderVoices[voice].help).toBeTruthy();
    }
    for (const code of ["not_signed_in", "bad_company", "not_yours", "name", "voice", "note", "note_permission", "storage"]) {
      expect(shell.companyCofounderReasons[code]).toBeTruthy();
    }
    for (const code of ["not_signed_in", "no_company", "address", "not_member", "storage"]) {
      expect(settings.addressReasons[code]).toBeTruthy();
    }
  });
});
