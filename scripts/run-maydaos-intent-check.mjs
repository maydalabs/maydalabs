#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(import.meta.url);

/** The first intent candidate is one frozen eleven-case run, with no case
 * selection or replacement retries. Fake-provider unit tests run separately.
 */
export function intentCheckArguments(args) {
  if (args.length !== 1 || args[0] !== "--run") {
    throw new Error("Explicit --run is required. It runs all eleven frozen fictional cases once; no case selection, paid provider or automatic retry.");
  }
  return { fullRun: true };
}

if (process.argv[1] && resolve(process.argv[1]) === script) {
  console.error("This pre-format measurement pack is archived. Use run-maydaos-trusted-intent.mjs --run for the current founder-intent contract. No model was called.");
  process.exitCode = 1;
}
