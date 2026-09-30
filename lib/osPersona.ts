/* The co-founder's name, voice and manners, as data.
 *
 * Decided 29 September: the owner names it, chooses one of a few voices, and
 * may add one line about how it should sound; each person says how they want
 * to be addressed. Everything here is a preference about wording. Nothing
 * here can change what the co-founder may do, and the prompt that reads
 * these values says so twice (lib/osCofounder.ts, personaSection). This
 * module is pure so the limits are the same in the form, the action, the
 * tests and the migration.
 */

export const COFOUNDER_VOICES = ["plain", "warm", "blunt"] as const;
export type CofounderVoice = (typeof COFOUNDER_VOICES)[number];

export const PERSONA_LIMITS = { name: 40, note: 200, addressAs: 40 } as const;

export type CofounderPersona = {
  /* Null means the plain word for it in the person's language. */
  name: string | null;
  voice: CofounderVoice;
  /* One line from the owner about wording. Untrusted, fenced, bounded. */
  note: string | null;
  /* How the person speaking now wants to be addressed. Theirs alone. */
  addressAs: string | null;
};

export const DEFAULT_PERSONA: CofounderPersona = { name: null, voice: "plain", note: null, addressAs: null };

export function isCofounderVoice(value: unknown): value is CofounderVoice {
  return typeof value === "string" && (COFOUNDER_VOICES as readonly string[]).includes(value);
}

export function isDefaultPersona(persona: CofounderPersona): boolean {
  return persona.name === null && persona.voice === "plain" && persona.note === null && persona.addressAs === null;
}

/* From the company row and the member's own row, tolerating rows without
 * the columns (an old mock, a fixture, a read before the migration) and
 * values the checks would never have let in. */
export function personaFromCompany(
  row: { cofounder_name?: unknown; cofounder_voice?: unknown; cofounder_note?: unknown } | null | undefined,
  addressAs: unknown,
): CofounderPersona {
  const text = (value: unknown, limit: number) => (typeof value === "string" && value.trim() ? value.trim().slice(0, limit) : null);
  return {
    name: text(row?.cofounder_name, PERSONA_LIMITS.name),
    voice: isCofounderVoice(row?.cofounder_voice) ? row.cofounder_voice : "plain",
    note: text(row?.cofounder_note, PERSONA_LIMITS.note),
    addressAs: text(addressAs, PERSONA_LIMITS.addressAs),
  };
}

/* One line: trimmed, inner whitespace and line breaks collapsed to a space. */
function oneLine(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
}

/* No control characters, and neither of the two characters that could forge
 * a tag inside the fence the prompt wraps these values in. The table check
 * says the same; this is the form's and the action's copy of it. */
const FORBIDDEN = /[\p{Cc}<>]/u;

function bounded(raw: unknown, limit: number): { ok: true; value: string | null } | { ok: false } {
  const value = oneLine(raw);
  if (!value) return { ok: true, value: null };
  if (value.length > limit || FORBIDDEN.test(value)) return { ok: false };
  return { ok: true, value };
}

/* A note that tries to be an instruction rather than a preference. A nudge
 * at save time, not the boundary: the prompt's fence and the standing rules
 * are what hold, and the scenarios measure them. The form should still not
 * accept a setting the product will not honour. */
const PERMISSION = /\byou\s+(?:may|can|are\s+(?:allowed|permitted|authori[sz]ed)\s+to|have\s+permission\s+to)\s+(?:now\s+|also\s+|always\s+)?(?:approve|send|publish|finish|complete|execute|deliver)\b/i;
const OVERRIDE = /\b(?:ignore|disregard|override|forget)\b[^.]{0,30}?\b(?:rules?|instructions?|system|above|previous)\b/i;

export function personaNoteGuard(note: string | null): "note_permission" | null {
  if (!note) return null;
  return PERMISSION.test(note) || OVERRIDE.test(note) ? "note_permission" : null;
}

export type ParsedPersona =
  | { ok: true; name: string | null; voice: CofounderVoice; note: string | null }
  | { ok: false; error: "name" | "voice" | "note" | "note_permission" };

export function parsePersona(input: { name: unknown; voice: unknown; note: unknown }): ParsedPersona {
  const name = bounded(input.name, PERSONA_LIMITS.name);
  if (!name.ok) return { ok: false, error: "name" };
  if (!isCofounderVoice(input.voice)) return { ok: false, error: "voice" };
  const note = bounded(input.note, PERSONA_LIMITS.note);
  if (!note.ok) return { ok: false, error: "note" };
  const guard = personaNoteGuard(note.value);
  if (guard) return { ok: false, error: guard };
  return { ok: true, name: name.value, voice: input.voice, note: note.value };
}

export function parseAddress(raw: unknown): { ok: true; address: string | null } | { ok: false; error: "address" } {
  const address = bounded(raw, PERSONA_LIMITS.addressAs);
  return address.ok ? { ok: true, address: address.value } : { ok: false, error: "address" };
}
