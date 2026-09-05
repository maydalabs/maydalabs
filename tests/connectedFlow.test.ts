import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONNECTED_COPY, FLOW_DURATION, FLOW_PHASES, STORY_SERVICES } from "@/lib/connectedFlow";
import { LOCALES } from "@/lib/i18n";
import { SERVICE_IDS } from "@/lib/services";

describe("Connected flow production contract", () => {
  it("keeps the accepted English headline and all five detailed services", () => {
    expect(CONNECTED_COPY.en.hero).toEqual(["Build what’s next.", "Run it better."]);
    expect([...new Set(Object.values(STORY_SERVICES).flat())].sort()).toEqual([...SERVICE_IDS].sort());
  });

  for (const locale of LOCALES) {
    it(`provides the complete illustrative journey in ${locale}`, () => {
      const copy = CONNECTED_COPY[locale];
      expect(copy.hero).toHaveLength(2);
      expect(copy.services.stories.map(story => story.id)).toEqual(["build", "connect", "improve"]);
      expect(copy.flow.outputs).toHaveLength(3);
      expect(copy.flow.description.length).toBeGreaterThan(100);
      expect(copy.flow.replay.length).toBeGreaterThan(10);
      expect(copy.services.illustrative).toBeTruthy();
      expect(copy.services.workflow).toHaveLength(3);
      for (const story of copy.services.stories) {
        expect(story.text.length).toBeGreaterThan(50);
        expect(story.note).toBeTruthy();
        expect(STORY_SERVICES[story.id]).toHaveLength(2);
      }
      expect(JSON.stringify(copy)).not.toMatch(/Bitcoin|MaydaOS|\$|\d+%|24\/7/);
    });
  }

  it("holds for human review before delivery and ends within five seconds", () => {
    expect(FLOW_PHASES.map(([, phase]) => phase)).toEqual(["prepare", "review", "approve", "deliver", "settled"]);
    const delays = FLOW_PHASES.map(([delay]) => delay);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(delays[2] - delays[1]).toBeGreaterThanOrEqual(1000);
    expect(delays.at(-1)).toBe(FLOW_DURATION);
    expect(FLOW_DURATION).toBeLessThan(5000);
  });

  it("starts as a complete static diagram and disposes motion resources", () => {
    const component = readFileSync("components/ConnectedFlow.tsx", "utf8");
    expect(component).toContain('data-stage="settled" data-running="false"');
    expect(component).toContain('role="img" aria-label={copy.description}');
    expect(component).toContain("prefers-reduced-motion: reduce");
    expect(component).toContain("timers.forEach(clearTimeout)");
    expect(component).toContain("observer.disconnect()");
    expect(component).toContain('removeEventListener("visibilitychange"');
    expect(component).not.toMatch(/setInterval|requestAnimationFrame|fetch\(|useState|Date\.now/);
    const css = readFileSync("app/connected-flow.css", "utf8");
    expect(css).not.toMatch(/infinite/);
    expect(css).toContain("prefers-reduced-motion:reduce");
    expect(css).toContain('.mc-replay { display:none;');
    expect(css).toContain("mc-rails-mobile");
  });

  it("keeps service selection native and server rendered", () => {
    const component = readFileSync("components/ServiceStories.tsx", "utf8");
    expect(component).not.toContain('"use client"');
    expect(component).toContain("<fieldset");
    expect(component).toContain('type="radio"');
    expect(component).toContain("defaultChecked={index === 0}");
    expect(component).toContain("aria-controls=");
    expect(component).toContain('localizePath(`/services#${id}`, locale)');
    expect(readFileSync("app/connected-flow.css", "utf8")).toContain(":focus-visible + .mc-choice");
  });
});
