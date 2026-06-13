import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assertIncludes(file, marker) {
  assert.ok(read(file).includes(marker), `${file} must include: ${marker}`);
}

function assertNotIncludes(file, marker) {
  assert.ok(!read(file).includes(marker), `${file} must not include stale or unsafe marker: ${marker}`);
}

const statusFile = "SUPABASE_PRODUCTION_STATUS.md";

for (const marker of [
  "Project: `swadakta` (`srwkoulknropnwwyqslj`)",
  "Provider connector refresh on June 14, 2026 confirmed:",
  "project status `ACTIVE_HEALTHY`",
  "Production table listing shows the 10 launch-critical public tables with RLS enabled",
  "`storage.buckets` has one production bucket row",
  "`swadakta-assistant` is `ACTIVE`, version 6, and `verify_jwt=true`",
  "`noop` remains `ACTIVE` as a harmless deploy probe",
  "Supabase security advisors returned zero security warnings",
  "Performance advisors returned INFO-only findings",
  "unused-index notes are expected while the pilot tables still have little traffic",
  "Auth DB connection-allocation INFO note is a scale watch item, not a paid-pilot blocker",
  "Do not remove pilot workflow indexes until production traffic proves they are unnecessary",
]) {
  assertIncludes(statusFile, marker);
}

for (const file of [statusFile, "ACTUALIZATION.md", "LAUNCH_RUNBOOK.md", "README.md"]) {
  for (const marker of [
    "Supabase security advisors show one remaining launch hardening item",
    "leaked-password protection is disabled",
  ]) {
    assertNotIncludes(file, marker);
  }
}

assertIncludes(
  "supabase/live_contract_check.sql",
  "Expected result for launch-critical sections: ok = total and missing_or_bad is null.",
);
assertIncludes("README.md", "For live production database confirmation, run `supabase/live_contract_check.sql`");
assertIncludes("LAUNCH_RUNBOOK.md", "For live table/RLS/RPC/storage confirmation, run `supabase/live_contract_check.sql`");

console.log("Supabase production evidence checks passed.");
