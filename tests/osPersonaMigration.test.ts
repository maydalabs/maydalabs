import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COFOUNDER_VOICES, PERSONA_LIMITS } from "@/lib/osPersona";

/* The migration and the module must agree, because the database is the
 * authority on the limits and the module is what the form and the action
 * apply before it. Read as text: what is asserted is the SQL that ships. */

const sql = readFileSync("supabase/migrations/20261001100000_cofounder_persona.sql", "utf8");

describe("the persona migration", () => {
  it("lists exactly the voices the module knows", () => {
    const list = /cofounder_voice in \(([^)]+)\)/.exec(sql)?.[1] ?? "";
    expect(list.split(",").map((v) => v.trim().replace(/'/g, "")).sort()).toEqual([...COFOUNDER_VOICES].sort());
  });

  it("bounds the name, the note and the address as the module does", () => {
    const bounds = [...sql.matchAll(/char_length\((\w+)\) between 1 and (\d+)/g)].map((m) => [m[1], Number(m[2])]);
    expect(bounds).toEqual([["cofounder_name", PERSONA_LIMITS.name], ["cofounder_note", PERSONA_LIMITS.note], ["address_as", PERSONA_LIMITS.addressAs]]);
    expect(sql.match(/!~ '\[\[:cntrl:\]<>\]'/g)).toHaveLength(3);
  });

  it("grants columns, never tables, and nothing to the service role", () => {
    expect(sql).not.toMatch(/service_role/);
    const grants = [...sql.matchAll(/grant update \(([^)]+)\)\s+on table (public\.\w+) to authenticated/g)].map((m) => [m[2], m[1].replace(/\s/g, "")]);
    expect(grants).toEqual([["public.os_companies", "cofounder_name,cofounder_voice,cofounder_note"], ["public.os_company_members", "address_as"]]);
    expect(sql).not.toMatch(/grant (all|update|insert|delete) on table/i);
  });

  it("lets a person write only their own membership row", () => {
    const policy = /create policy "os_company_members_address_own"[\s\S]*?;/.exec(sql)?.[0] ?? "";
    expect(policy).toContain("for update to authenticated");
    expect(policy).toContain("using (user_id = (select auth.uid()))");
    expect(policy).toContain("with check (user_id = (select auth.uid()))");
  });
});
