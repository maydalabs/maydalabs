#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(import.meta.url);
const root = resolve(dirname(script), "..");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Version the trusted-intent instrument separately from the frozen case pack. */
export const TRUSTED_INTENT_INSTRUMENT_VERSION = "trusted-intent-s1j-v1";

/** Capture evaluator and product bytes before Vitest imports either one. The
 * lockfile pins declared dependencies, while the Vitest entrypoint and package
 * metadata are hashed; this is not a bytewise audit of all node_modules.
 */
export function trustedIntentSourcePaths(projectRoot) {
  const osFiles = readdirSync(join(projectRoot, "lib"))
    .filter((name) => /^os[^/]*\.ts$/.test(name))
    .map((name) => `lib/${name}`);
  const trustedTests = readdirSync(join(projectRoot, "tests"))
    .filter((name) => /^osTrustedIntent[^/]*\.ts$/.test(name))
    .map((name) => `tests/${name}`);
  const required = [
    "lib/osTrustedIntentCases.ts", "lib/osReviewEnvelope.ts", "lib/osReviewReceipt.ts", "lib/supabase/database.types.ts",
    "app/api/os/cofounder/route.ts", "app/api/os/review/route.ts",
    "components/os/CofounderApp.tsx", "components/os/ReviewIntentFields.tsx", "components/os/ReviewCards.tsx", "components/osCopy.ts",
    "supabase/migrations/20260927065857_os_review_request_intent.sql",
    "tests/helpers/scenarioFixture.ts", "tests/helpers/osIntentHarness.ts",
    "tests/helpers/osLegacyReviewedTurn.ts", "tests/helpers/osLegacyReviewedSystem.ts",
    "tests/helpers/osTrustedIntentHarness.ts",
    "tests/osIntentHeldoutCases.test.ts", "tests/osIntentHeldoutLauncher.test.ts",
    "tests/osIntentHeldout.run.test.ts", "scripts/run-maydaos-intent-heldout.mjs",
    "tests/osTrustedIntentLauncher.test.ts", "tests/osTrustedIntent.run.test.ts",
    "scripts/run-maydaos-trusted-intent.mjs",
    "package.json", "package-lock.json", "tsconfig.json", "vitest.config.ts",
    "node_modules/vitest/package.json", "node_modules/vitest/vitest.mjs",
  ];
  const paths = [...new Set([...osFiles, ...trustedTests, ...required])].sort();
  for (const path of paths) if (!existsSync(join(projectRoot, path))) throw new Error(`Trusted-intent source missing: ${path}`);
  return paths;
}

export function captureTrustedIntentSourceSnapshot(projectRoot) {
  const paths = trustedIntentSourcePaths(projectRoot);
  return {
    capturedAt: new Date().toISOString(),
    paths,
    hashes: Object.fromEntries(paths.map((path) => [path, sha(readFileSync(join(projectRoot, path)))])),
  };
}

export function assertTrustedIntentSourceSnapshot(projectRoot, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.paths) || !snapshot.hashes || typeof snapshot.hashes !== "object") {
    throw new Error("Missing pre-import trusted-intent source snapshot");
  }
  const current = trustedIntentSourcePaths(projectRoot);
  if (JSON.stringify(current) !== JSON.stringify(snapshot.paths)) throw new Error("Trusted-intent source file set changed after the pre-import snapshot");
  for (const path of current) {
    if (sha(readFileSync(join(projectRoot, path))) !== snapshot.hashes[path]) {
      throw new Error(`Trusted-intent source changed after the pre-import snapshot: ${path}`);
    }
  }
}

export function trustedIntentCheckArguments(args) {
  if (args.length !== 1 || args[0] !== "--run") {
    throw new Error("Explicit --run is required. It runs the complete trusted-intent plan; no selection or replacement retries.");
  }
  return { fullRun: true };
}

function localOrigin(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error("Local model URL must be an HTTP loopback origin"); }
  if (url.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Local model URL must be an HTTP loopback IP origin without credentials, path, query or fragment");
  }
  return url.origin;
}

/** Metadata-only inspection; no generation, download or paid fallback. */
export async function inspectTrustedIntentLocalModel(env, fetcher = fetch) {
  if (env.VERCEL) throw new Error("Trusted-intent check cannot run on Vercel");
  if (env.MAYDAOS_LOCAL_MODEL !== "qwen3:14b") throw new Error("Trusted-intent check requires the already-installed qwen3:14b model");
  const origin = localOrigin(env.MAYDAOS_LOCAL_MODEL_URL || "http://127.0.0.1:11434");
  const request = async (path) => {
    const response = await fetcher(`${origin}${path}`, { redirect: "error", credentials: "omit", signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Local model metadata ${path} returned HTTP ${response.status}`);
    return response.json();
  };
  const version = await request("/api/version");
  const tags = await request("/api/tags");
  const installed = Array.isArray(tags.models) ? tags.models.find((entry) => entry.name === env.MAYDAOS_LOCAL_MODEL || entry.model === env.MAYDAOS_LOCAL_MODEL) : null;
  if (!version.version || !installed?.digest || !installed.size || installed.remote_host || installed.remote_model) {
    throw new Error("Selected model is not confirmed as installed local weights");
  }
  const response = await fetcher(`${origin}/api/show`, {
    method: "POST", redirect: "error", credentials: "omit", signal: AbortSignal.timeout(10_000),
    headers: { "content-type": "application/json" }, body: JSON.stringify({ model: env.MAYDAOS_LOCAL_MODEL }),
  });
  if (!response.ok) throw new Error(`Local model inspection returned HTTP ${response.status}`);
  const details = await response.json();
  if (details.remote_host || details.remote_model || !details.model_info || Object.keys(details.model_info).length === 0) {
    throw new Error("Selected model lacks local weight metadata");
  }
  return { runtime: "ollama", version: version.version, model: env.MAYDAOS_LOCAL_MODEL, digest: installed.digest, size: installed.size };
}

if (process.argv[1] && resolve(process.argv[1]) === script) {
  try {
    trustedIntentCheckArguments(process.argv.slice(2));
    const source = captureTrustedIntentSourceSnapshot(root);
    const model = await inspectTrustedIntentLocalModel(process.env);
    assertTrustedIntentSourceSnapshot(root, source);
    const result = spawnSync(process.execPath, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", "tests/osTrustedIntent.run.test.ts", "--reporter=dot"], {
      cwd: root, stdio: "inherit", env: {
        ...process.env,
        MAYDAOS_TRUSTED_INTENT_RUN: "1",
        MAYDAOS_TRUSTED_INTENT_SOURCE: Buffer.from(JSON.stringify(source)).toString("base64"),
        MAYDAOS_TRUSTED_INTENT_MODEL: Buffer.from(JSON.stringify(model)).toString("base64"),
      },
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Trusted-intent check launcher failed");
    process.exitCode = 1;
  }
}
