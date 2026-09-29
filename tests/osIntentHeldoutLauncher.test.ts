import { describe, expect, it } from "vitest";
import {
  assertHeldoutSourceSnapshot, captureHeldoutSourceSnapshot, heldoutCheckArguments,
  heldoutSourcePaths, inspectHeldoutLocalModel,
} from "../scripts/run-maydaos-intent-heldout.mjs";

const root = process.cwd();

describe("held-out launcher integrity", () => {
  it("allows only the full explicit run", () => {
    expect(heldoutCheckArguments(["--run"])).toEqual({ fullRun: true });
    for (const args of [[], ["--case", "heldout-01"], ["--run", "--limit", "1"]]) {
      expect(() => heldoutCheckArguments(args)).toThrow(/Explicit --run/);
    }
  });

  it("captures source and dependency hashes before test-module import and detects drift", () => {
    const paths = heldoutSourcePaths(root);
    expect(paths).toContain("lib/osIntentHeldoutCases.ts");
    expect(paths).toContain("lib/osReviewedTurn.ts");
    expect(paths).toContain("package-lock.json");
    expect(paths).toContain("node_modules/vitest/vitest.mjs");
    const snapshot = captureHeldoutSourceSnapshot(root);
    expect(() => assertHeldoutSourceSnapshot(root, snapshot)).not.toThrow();
    const changed = { ...snapshot, hashes: { ...snapshot.hashes, "lib/osIntentHeldoutCases.ts": "wrong" } };
    expect(() => assertHeldoutSourceSnapshot(root, changed)).toThrow(/source changed/);
    expect(() => assertHeldoutSourceSnapshot(root, { ...snapshot, paths: [] })).toThrow(/file set changed/);
  });

  it("inspects only a loopback, installed local model without generating", async () => {
    const paths: string[] = [];
    const fakeFetch = async (input: string | URL | Request) => {
      const url = String(input);
      paths.push(new URL(url).pathname);
      if (url.endsWith("/api/version")) return new Response(JSON.stringify({ version: "test-local" }));
      if (url.endsWith("/api/tags")) return new Response(JSON.stringify({ models: [{ name: "qwen3:14b", digest: "test-digest", size: 99 }] }));
      return new Response(JSON.stringify({ model_info: { "general.architecture": "qwen3" } }));
    };
    const metadata = await inspectHeldoutLocalModel({ MAYDAOS_LOCAL_MODEL: "qwen3:14b" }, fakeFetch as typeof fetch);
    expect(metadata).toEqual({ runtime: "ollama", version: "test-local", model: "qwen3:14b", digest: "test-digest", size: 99 });
    expect(paths).toEqual(["/api/version", "/api/tags", "/api/show"]);
    await expect(inspectHeldoutLocalModel({ MAYDAOS_LOCAL_MODEL: "qwen3:14b", MAYDAOS_LOCAL_MODEL_URL: "https://example.com" }, fakeFetch as typeof fetch)).rejects.toThrow(/loopback/);
    await expect(inspectHeldoutLocalModel({ MAYDAOS_LOCAL_MODEL: "qwen3:14b", VERCEL: "1" }, fakeFetch as typeof fetch)).rejects.toThrow(/Vercel/);
  });
});
