#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(import.meta.url);
export function proposalBaselineArguments(args) {
  const selection = { cases: [], limit: undefined, timeoutMs: 600_000 };
  if (args[0] !== "--run") throw new Error("Explicit --run is required. Optional: --case CASE_ID (repeatable), --limit 1..16, --timeout-ms 100..1800000. No paid provider or automatic retries.");
  for (let i = 1; i < args.length; i += 2) {
    const [flag, value] = args.slice(i, i + 2);
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
    if (flag === "--case") selection.cases.push(value);
    else if (flag === "--limit" && /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 16 && selection.limit === undefined) selection.limit = Number(value);
    else if (flag === "--timeout-ms" && /^\d+$/.test(value) && Number(value) >= 100 && Number(value) <= 1_800_000) selection.timeoutMs = Number(value);
    else throw new Error(`Unknown or invalid option: ${flag}`);
  }
  if (new Set(selection.cases).size !== selection.cases.length) throw new Error("Duplicate case ID");
  return selection;
}

if (process.argv[1] && resolve(process.argv[1]) === script) {
  console.error("This pre-format measurement pack is archived. Use run-maydaos-trusted-intent.mjs --run for the current founder-intent contract. No model was called.");
  process.exitCode = 1;
}
