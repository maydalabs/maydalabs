import { describe, expect, it } from "vitest";
import {
  TRUSTED_INTENT_INSTRUMENT_VERSION,
  assertTrustedIntentSourceSnapshot, captureTrustedIntentSourceSnapshot,
  inspectTrustedIntentLocalModel, trustedIntentCheckArguments, trustedIntentSourcePaths,
} from "../scripts/run-maydaos-trusted-intent.mjs";

const root = process.cwd();

describe("trusted-intent launcher integrity", () => {
  it("versions the instrument separately from its case pack", () => {
    expect(TRUSTED_INTENT_INSTRUMENT_VERSION).toBe("trusted-intent-s1j-v1");
  });

  it("allows only the complete explicit run", () => {
    expect(trustedIntentCheckArguments(["--run"])).toEqual({ fullRun: true });
    for (const args of [[], ["--case", "trusted-01"], ["--run", "--limit", "1"]]) {
      expect(() => trustedIntentCheckArguments(args)).toThrow(/Explicit --run/);
    }
  });

  it("freezes trusted and shared sources before test-module import and detects drift", () => {
    const paths = trustedIntentSourcePaths(root);
    for (const path of [
      "lib/osTrustedIntentCases.ts", "lib/osReviewedTurn.ts",
      "lib/osReviewEnvelope.ts", "lib/osReviewReceipt.ts",
      "app/api/os/cofounder/route.ts", "app/api/os/review/route.ts",
      "components/os/CofounderApp.tsx", "components/os/ReviewIntentFields.tsx", "components/os/ReviewCards.tsx", "components/osCopy.ts",
      "supabase/migrations/20260927065857_os_review_request_intent.sql",
      "tests/helpers/osIntentHarness.ts", "tests/helpers/osLegacyReviewedTurn.ts", "tests/helpers/osLegacyReviewedSystem.ts",
      "tests/helpers/osTrustedIntentHarness.ts",
      "tests/osTrustedIntent.run.test.ts", "tests/osTrustedIntentLauncher.test.ts",
      "scripts/run-maydaos-trusted-intent.mjs", "package-lock.json", "node_modules/vitest/vitest.mjs",
    ]) expect(paths).toContain(path);
    const snapshot = captureTrustedIntentSourceSnapshot(root);
    expect(() => assertTrustedIntentSourceSnapshot(root, snapshot)).not.toThrow();
    const changed = { ...snapshot, hashes: { ...snapshot.hashes, "lib/osTrustedIntentCases.ts": "wrong" } };
    expect(() => assertTrustedIntentSourceSnapshot(root, changed)).toThrow(/source changed/);
    expect(() => assertTrustedIntentSourceSnapshot(root, { ...snapshot, paths: [] })).toThrow(/file set changed/);
  });

  it("inspects only the pinned installed loopback model without generating", async () => {
    const calls: { path: string; method: string; redirect?: string; credentials?: string }[] = [];
    const fakeFetch = async (input: string | URL | Request, init?: RequestInit) => {
      const path = new URL(String(input)).pathname;
      calls.push({ path, method: init?.method ?? "GET", redirect: init?.redirect, credentials: init?.credentials });
      if (path === "/api/version") return new Response(JSON.stringify({ version: "test-local" }));
      if (path === "/api/tags") return new Response(JSON.stringify({ models: [{ name: "qwen3:14b", digest: "test-digest", size: 99 }] }));
      if (path === "/api/show") return new Response(JSON.stringify({ model_info: { "general.architecture": "qwen3" } }));
      throw new Error(`Unexpected model endpoint: ${path}`);
    };
    const metadata = await inspectTrustedIntentLocalModel({ MAYDAOS_LOCAL_MODEL: "qwen3:14b" }, fakeFetch as typeof fetch);
    expect(metadata).toEqual({ runtime: "ollama", version: "test-local", model: "qwen3:14b", digest: "test-digest", size: 99 });
    expect(calls).toEqual([
      { path: "/api/version", method: "GET", redirect: "error", credentials: "omit" },
      { path: "/api/tags", method: "GET", redirect: "error", credentials: "omit" },
      { path: "/api/show", method: "POST", redirect: "error", credentials: "omit" },
    ]);
    await expect(inspectTrustedIntentLocalModel({ MAYDAOS_LOCAL_MODEL: "qwen3:14b", MAYDAOS_LOCAL_MODEL_URL: "https://example.com" }, fakeFetch as typeof fetch)).rejects.toThrow(/loopback/);
    await expect(inspectTrustedIntentLocalModel({ MAYDAOS_LOCAL_MODEL: "qwen3:14b", MAYDAOS_LOCAL_MODEL_URL: "http://localhost:11434" }, fakeFetch as typeof fetch)).rejects.toThrow(/loopback/);
    await expect(inspectTrustedIntentLocalModel({ MAYDAOS_LOCAL_MODEL: "qwen3:14b", VERCEL: "1" }, fakeFetch as typeof fetch)).rejects.toThrow(/Vercel/);
    await expect(inspectTrustedIntentLocalModel({ MAYDAOS_LOCAL_MODEL: "other" }, fakeFetch as typeof fetch)).rejects.toThrow(/qwen3:14b/);
  });
});
