#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(import.meta.url);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** The launcher has no product-code imports. This snapshot is taken before
 * Vitest imports the evaluator or product modules, then checked in the child.
 * The lockfile pins the declared dependency graph; this does not attest every
 * byte of node_modules. The Vitest entrypoint and package metadata are hashed.
 */
export function heldoutSourcePaths(projectRoot) {
  const osFiles = readdirSync(join(projectRoot, "lib"))
    .filter((name) => /^os[^/]*\.ts$/.test(name))
    .map((name) => `lib/${name}`);
  const required = [
    "lib/supabase/database.types.ts",
    "tests/helpers/scenarioFixture.ts", "tests/helpers/osIntentHarness.ts",
    "tests/osIntentHeldoutCases.test.ts", "tests/osIntentHeldoutLauncher.test.ts",
    "tests/osIntentHeldout.run.test.ts", "scripts/run-maydaos-intent-heldout.mjs",
    "package.json", "package-lock.json", "tsconfig.json", "vitest.config.ts",
    "node_modules/vitest/package.json", "node_modules/vitest/vitest.mjs",
  ];
  const paths = [...new Set([...osFiles, ...required])].sort();
  for (const path of paths) if (!existsSync(join(projectRoot, path))) throw new Error(`Held-out source missing: ${path}`);
  return paths;
}

export function captureHeldoutSourceSnapshot(projectRoot) {
  const paths = heldoutSourcePaths(projectRoot);
  return {
    capturedAt: new Date().toISOString(),
    paths,
    hashes: Object.fromEntries(paths.map((path) => [path, sha(readFileSync(join(projectRoot, path)))])),
  };
}

export function assertHeldoutSourceSnapshot(projectRoot, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.paths) || !snapshot.hashes || typeof snapshot.hashes !== "object") {
    throw new Error("Missing pre-import held-out source snapshot");
  }
  const current = heldoutSourcePaths(projectRoot);
  if (JSON.stringify(current) !== JSON.stringify(snapshot.paths)) throw new Error("Held-out source file set changed after the pre-import snapshot");
  for (const path of current) {
    if (sha(readFileSync(join(projectRoot, path))) !== snapshot.hashes[path]) {
      throw new Error(`Held-out source changed after the pre-import snapshot: ${path}`);
    }
  }
}

export function heldoutCheckArguments(args) {
  if (args.length !== 1 || args[0] !== "--run") {
    throw new Error("Explicit --run is required. It runs both predeclared passes of every held-out case; no selection or replacement retries.");
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
export async function inspectHeldoutLocalModel(env, fetcher = fetch) {
  if (env.VERCEL) throw new Error("Held-out check cannot run on Vercel");
  if (env.MAYDAOS_LOCAL_MODEL !== "qwen3:14b") throw new Error("Held-out check requires the already-installed qwen3:14b model");
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
  console.error("This pre-format measurement pack is archived. Use run-maydaos-trusted-intent.mjs --run for the current founder-intent contract. No model was called.");
  process.exitCode = 1;
}
