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
  assert.ok(!read(file).includes(marker), `${file} must not include: ${marker}`);
}

for (const [file, marker] of [
  ["payments.html", "Swadakta does not hold client money"],
  ["payments.html", "Payment providers process or hold client money"],
  ["payments.html", "Swadakta earns the disclosed service fee"],
  ["brief.html", "Swadakta does not hold client money or act as escrow"],
  ["trust.html", "Swadakta does not hold client money"],
  ["PAYMENTS_SETUP.md", "Swadakta should not hold client money"],
  ["PAYMENTS_SETUP.md", "The payout itself happens through the configured provider"],
  ["LAUNCH_RUNBOOK.md", "the rule that Swadakta does not hold client money"],
  ["SUPABASE_PRODUCTION_STATUS.md", "Supabase security advisors returned zero security warnings"],
]) {
  assertIncludes(file, marker);
}

for (const file of ["payments.html", "brief.html", "trust.html", "PAYMENTS_SETUP.md", "LAUNCH_RUNBOOK.md"]) {
  for (const forbidden of [
    "Swadakta holds client money",
    "Swadakta holds funds",
    "Swadakta-held money",
    "Swadakta-held funds",
  ]) {
    assertNotIncludes(file, forbidden);
  }
}

const paymentCopy = read("payments.html");
assert.match(
  paymentCopy,
  /Stripe, PayPal, M-Pesa, bank, Paystack, Flutterwave, or a regulated escrow\/payment provider/,
  "payments.html must name provider rails as the money handlers",
);
assert.match(
  paymentCopy,
  /milestone actions? require provider evidence plus proof review|provider-payout instructions stay paused/,
  "payments.html must describe milestone approval as provider-evidence plus proof review",
);

console.log("Money custody boundary checks passed.");
