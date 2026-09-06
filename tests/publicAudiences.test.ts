import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public page audiences", () => {
  it("removes the portrait only from the homepage", () => {
    expect(readFileSync("app/[lang]/page.tsx", "utf8")).not.toMatch(/portrait|<Profile/);
    expect(readFileSync("app/[lang]/profile/page.tsx", "utf8")).toContain("mehmet-e-mayda-portrait.jpg");
  });

  it("keeps Profile focused on professional work and contact, not application mechanics", () => {
    const profile = readFileSync("app/[lang]/profile/page.tsx", "utf8");
    expect(profile).not.toMatch(/each application|every application|application package|role-specific CV|tailored CV|Her başvuruda|başvuru paketi|chaque candidature|CV adapté|Dossier de candidature/i);
    for (const path of ["hodlstay", "satoshi-gazette", "mortal-vault", "sofra"]) expect(profile).toContain(`/case-studies/${path}`);
    for (const term of ["Client build · Live", "Editorially independent", "Unaudited", "Private Phase 1"]) expect(profile).toContain(term);
    expect(profile).toContain("mailto:info@maydalabs.com");
    expect(profile).toContain("Request my CV");
  });

  it("makes About a company page with direct project contact and no hiring process", () => {
    const about = readFileSync("app/[lang]/about/page.tsx", "utf8");
    expect(about).toContain('localizePath("/contact", locale)');
    expect(about).toContain('localizePath("/profile", locale)');
    expect(about).toContain("software and automation company");
    expect(about).not.toMatch(/hiring context|pretend agency|Labels over vibes|Application materials|işe alım bağlamı|contexte de recrutement/);
  });
});
