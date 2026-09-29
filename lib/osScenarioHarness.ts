/* The explicit, local-only behavioral benchmark. This module has no model,
 * database or file side effects; the opt-in runner owns those boundaries. */
export type ScenarioEnv = Record<string, string | undefined>;
export type ScenarioSettings = { url: string; model: string; repeats: number; timeoutMs: number };

export function scenarioRunRequested(env: ScenarioEnv): boolean {
  return env.MAYDAOS_SCENARIO_RUN === "1" && env.npm_lifecycle_event === "scenarios";
}

export function scenarioSuite(env: ScenarioEnv): "baseline" | "work-variations" | "faithfulness-variations" {
  const suite = env.MAYDAOS_SCENARIO_SUITE ?? "baseline";
  if (suite !== "baseline" && suite !== "work-variations" && suite !== "faithfulness-variations") throw new Error("Unknown scenario suite; use baseline, work-variations or faithfulness-variations.");
  return suite;
}

export function loopbackOrigin(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Scenario model URL must be an HTTP loopback origin."); }
  if (url.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Scenario model URL must be an HTTP loopback IP origin without credentials, path, query or fragment.");
  }
  return url.origin;
}

function integer(value: string | undefined, fallback: number, minimum: number, maximum: number, name: string): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a whole number.`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw new Error(`${name} must be between ${minimum} and ${maximum}.`);
  return number;
}

export function scenarioSettings(env: ScenarioEnv): ScenarioSettings {
  if (env.MAYDAOS_SCENARIO_RUN !== "1") throw new Error("Use the explicit npm run scenarios command.");
  if (env.VERCEL) throw new Error("The scenario benchmark cannot run on Vercel.");
  if ((env.MAYDAOS_SCENARIO_MODEL ?? "local") !== "local") throw new Error("Scenarios support local models only; there is no paid fallback.");
  const model = env.MAYDAOS_LOCAL_MODEL?.trim();
  if (!model || /\s|https?:|\/\/|:cloud(?:$|-)/i.test(model)) throw new Error("Name an installed local model with MAYDAOS_LOCAL_MODEL; cloud models are not allowed.");
  return {
    model,
    url: loopbackOrigin(env.MAYDAOS_LOCAL_MODEL_URL || "http://127.0.0.1:11434"),
    repeats: integer(env.MAYDAOS_SCENARIO_REPEATS, 3, 1, 20, "MAYDAOS_SCENARIO_REPEATS"),
    timeoutMs: integer(env.MAYDAOS_SCENARIO_TIMEOUT_MS, 600_000, 100, 1_800_000, "MAYDAOS_SCENARIO_TIMEOUT_MS"),
  };
}

type InstalledModel = { name?: string; model?: string; digest?: string; size?: number; remote_host?: string; remote_model?: string };

export async function preflightLocalModel(settings: ScenarioSettings, fetcher: typeof fetch = fetch) {
  const origin = loopbackOrigin(settings.url);
  const get = async (path: string) => {
    const response = await fetcher(`${origin}${path}`, { redirect: "error", credentials: "omit", signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Local model preflight ${path} returned HTTP ${response.status}.`);
    return response.json();
  };
  const version = await get("/api/version") as { version?: string };
  const tags = await get("/api/tags") as { models?: InstalledModel[] };
  if (!version.version || !Array.isArray(tags.models)) throw new Error("Local model preflight returned incomplete metadata.");
  const installed = tags.models.find((m) => m.name === settings.model || m.model === settings.model);
  if (!installed?.digest || !installed.size || installed.remote_host || installed.remote_model) {
    throw new Error("The named model is not installed locally with a digest and weights; nothing was downloaded or sent to a paid provider.");
  }
  // A local daemon can front a cloud model. Inspect the model, not just the
  // URL, before any generation request. This endpoint does not load/pull it.
  const response = await fetcher(`${origin}/api/show`, {
    method: "POST", redirect: "error", credentials: "omit", signal: AbortSignal.timeout(10_000),
    headers: { "content-type": "application/json" }, body: JSON.stringify({ model: settings.model }),
  });
  if (!response.ok) throw new Error(`Local model inspection returned HTTP ${response.status}.`);
  const details = await response.json() as { remote_host?: string; remote_model?: string; model_info?: Record<string, unknown> };
  if (details.remote_host || details.remote_model || !details.model_info || Object.keys(details.model_info).length === 0) {
    throw new Error("The selected model does not expose local weight metadata; refusing generation.");
  }
  return { runtime: "ollama", version: version.version, model: settings.model, digest: installed.digest, size: installed.size };
}

/* Await cancellation, never race-and-abandon a model request. The local
 * adapter must honor the signal and close its response stream in finally. */
export async function withScenarioDeadline<T>(timeoutMs: number, work: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("Scenario deadline exceeded", "TimeoutError")), timeoutMs);
  try {
    const result = await work(controller.signal);
    controller.signal.throwIfAborted();
    return result;
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
