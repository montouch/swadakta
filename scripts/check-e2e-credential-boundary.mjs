import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const e2ePasswordNames = ["SWADAKTA_E2E_PASSWORD", "SWADAKTA_E2E_ADMIN_PASSWORD"];
const e2eEmailNames = ["SWADAKTA_E2E_EMAIL", "SWADAKTA_E2E_ADMIN_EMAIL"];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function assertIncludes(file, marker) {
  assert.ok(read(file).includes(marker), `${file} must include: ${marker}`);
}

function assertNotIncludes(file, marker) {
  assert.ok(!read(file).includes(marker), `${file} must not include: ${marker}`);
}

function assertNotMatch(file, pattern, message) {
  assert.ok(!pattern.test(read(file)), `${file} ${message}`);
}

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "buffer" })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function gitCheckIgnore(file) {
  const result = execFileSync("git", ["check-ignore", file], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  assert.equal(result, file, `${file} must be ignored by git`);
}

for (const file of [".env", ".env.local", ".env.production.local", ".env.e2e.local"]) {
  gitCheckIgnore(file);
}

for (const name of [...e2ePasswordNames, ...e2eEmailNames]) {
  assertNotMatch(".env.example", new RegExp(`^${name}\\s*=`, "m"), `${name} must stay out of .env.example`);
}

for (const file of trackedFiles()) {
  if (!fs.existsSync(path.join(root, file))) continue;
  const text = read(file);
  if (text.includes("\0")) continue;

  for (const name of e2ePasswordNames) {
    assert.ok(
      !new RegExp(`^\\s*${name}\\s*=\\s*\\S+`, "m").test(text),
      `${file} must not commit a value for ${name}`,
    );
  }
}

for (const file of [
  "scripts/check-production-auth-flow.mjs",
  "scripts/check-production-admin-flow.mjs",
  "scripts/live-readiness-summary.mjs",
  "scripts/check-launch-ready.mjs",
]) {
  assertNotMatch(file, /console\.(?:log|error|warn)\s*\(\s*password\b/i, "must not log the E2E password value");
  assertNotMatch(file, /JSON\.stringify\s*\(\s*\{[\s\S]{0,260}\bpassword\s*:/i, "must not serialize password fields");
}

assertIncludes("scripts/check-production-auth-flow.mjs", "await page.fill(\"#login-password\", password);");
assertIncludes("scripts/check-production-auth-flow.mjs", "function redactEmail");
assertIncludes("scripts/check-production-auth-flow.mjs", "signedInAccount: redactEmail(homeResult.sessionEmail)");
assertNotIncludes("scripts/check-production-auth-flow.mjs", "sessionEmail: homeResult.sessionEmail");
assertIncludes("scripts/check-production-admin-flow.mjs", "await page.fill(\"#admin-password\", password);");
assertIncludes("scripts/check-production-admin-flow.mjs", "function redactEmail");
assertIncludes("scripts/check-production-admin-flow.mjs", "adminAccount: redactEmail(result.sessionEmail)");
assertNotIncludes("scripts/check-production-admin-flow.mjs", "adminEmail: result.sessionEmail");
assertIncludes("scripts/live-readiness-summary.mjs", "body: JSON.stringify({ email, password })");
assertIncludes("scripts/live-readiness-summary.mjs", "function redactEmail");
assertIncludes("scripts/live-readiness-summary.mjs", "Admin sign-in failed for ${redactEmail(email)}");
assertNotIncludes("scripts/live-readiness-summary.mjs", "Admin sign-in failed for ${email}");
assertIncludes("README.md", "Do not commit those values");
assertIncludes("README.md", "Real values belong in Vercel Project Settings or an ignored local env file");
assertIncludes("FOUNDER_MORNING_HANDOFF.md", "Do not commit those values");
assertIncludes("LAUNCH_RUNBOOK.md", "Run the launch verifier with `--strict-auth` and shell-only E2E credentials");

console.log("E2E credential boundary checks passed.");
