import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const strictAuth = args.includes("--strict-auth") || args.includes("--strict");
const skipVisual = args.includes("--skip-visual");
const explicitBase = args.find((arg) => /^https?:\/\//i.test(arg)) || args.find((arg) => arg.startsWith("--base="))?.slice("--base=".length);
const baseUrl = (explicitBase || process.env.SWADAKTA_BASE_URL || "https://swadakta.com").replace(/\/+$/, "");

const node = process.execPath;
const results = [];

function hasEnv(...names) {
  return names.every((name) => String(process.env[name] || "").trim());
}

function runNodeStep(name, script, scriptArgs = [], { requireOutputIncludes } = {}) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(node, [script, ...scriptArgs], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  if (output) console.log(output);

  const ok = result.status === 0 && (!requireOutputIncludes || output.includes(requireOutputIncludes));
  results.push({ name, ok, skipped: false });
  if (!ok) {
    const reason = result.status !== 0 ? `exit ${result.status}` : `missing marker ${requireOutputIncludes}`;
    console.error(`Launch-ready step failed: ${name} (${reason})`);
  }
  return ok;
}

function skipStep(name, reason, { strict = false } = {}) {
  console.log(`\n=== ${name} ===`);
  console.log(`Skipped: ${reason}`);
  const ok = !strict;
  results.push({ name, ok, skipped: true });
  if (!ok) console.error(`Launch-ready step required by strict mode: ${name}`);
  return ok;
}

runNodeStep("Deployment state", path.join("scripts", "deployment-state.mjs"), [], {
  requireOutputIncludes: "production_current",
});
runNodeStep("Supabase production contract", path.join("scripts", "check-supabase-contract.mjs"));
runNodeStep("Production health", path.join("scripts", "check-production.mjs"));

if (skipVisual) {
  skipStep("Visual fit", "--skip-visual was provided");
} else {
  runNodeStep("Visual fit", path.join("scripts", "check-visual-fit.mjs"), [baseUrl]);
}

if (hasEnv("SWADAKTA_E2E_EMAIL", "SWADAKTA_E2E_PASSWORD")) {
  runNodeStep("User auth E2E", path.join("scripts", "check-production-auth-flow.mjs"));
} else {
  skipStep("User auth E2E", "set SWADAKTA_E2E_EMAIL and SWADAKTA_E2E_PASSWORD to verify live account sign-in", {
    strict: strictAuth,
  });
}

if (
  hasEnv("SWADAKTA_E2E_ADMIN_EMAIL", "SWADAKTA_E2E_ADMIN_PASSWORD") ||
  hasEnv("SWADAKTA_E2E_EMAIL", "SWADAKTA_E2E_PASSWORD")
) {
  runNodeStep("Admin auth E2E", path.join("scripts", "check-production-admin-flow.mjs"));
  runNodeStep("Live readiness summary", path.join("scripts", "live-readiness-summary.mjs"));
} else {
  skipStep(
    "Admin auth E2E and live readiness summary",
    "set SWADAKTA_E2E_ADMIN_EMAIL and SWADAKTA_E2E_ADMIN_PASSWORD, or the fallback SWADAKTA_E2E_EMAIL/SWADAKTA_E2E_PASSWORD pair",
    { strict: strictAuth },
  );
}

const failed = results.filter((result) => !result.ok);
const skipped = results.filter((result) => result.skipped);
console.log("\n=== Launch-ready summary ===");
for (const result of results) {
  const marker = result.ok ? (result.skipped ? "SKIP" : "OK") : "FAIL";
  console.log(`${marker} ${result.name}`);
}

if (failed.length) {
  console.error(
    `\nLaunch-ready check failed for ${baseUrl}. ${failed.length} required step${failed.length === 1 ? "" : "s"} failed.`,
  );
  process.exitCode = 1;
} else {
  const skippedText = skipped.length
    ? ` ${skipped.length} credential-gated step${skipped.length === 1 ? " was" : "s were"} skipped; run with --strict-auth and E2E env vars before a paid pilot.`
    : "";
  console.log(`\nLaunch-ready checks passed for ${baseUrl}.${skippedText}`);
}
