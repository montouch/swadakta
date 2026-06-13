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
  ["REAL_WORLD_LAUNCH_BOARD.md", "Swadakta will not hold client funds"],
  ["REAL_WORLD_LAUNCH_BOARD.md", "all client money must stay with Stripe, PayPal, M-Pesa, a bank, a direct supplier/recipient, or a regulated escrow/payment provider"],
  ["REAL_WORLD_LAUNCH_BOARD.md", "Do not use Swadakta operating or personal accounts as escrow"],
  ["FOUNDER_ACTION_PACK.md", "Swadakta does not hold client funds"],
  ["FOUNDER_ACTION_PACK.md", "Do not hold or move client money directly"],
  ["SUPABASE_PRODUCTION_STATUS.md", "Supabase security advisors returned zero security warnings"],
]) {
  assertIncludes(file, marker);
}

for (const file of [
  "payments.html",
  "brief.html",
  "trust.html",
  "PAYMENTS_SETUP.md",
  "LAUNCH_RUNBOOK.md",
  "REAL_WORLD_LAUNCH_BOARD.md",
  "FOUNDER_ACTION_PACK.md",
]) {
  for (const forbidden of [
    "Swadakta holds client money",
    "Swadakta holds funds",
    "Swadakta-held money",
    "Swadakta-held funds",
    "Whether Swadakta can hold client funds",
    "Swadakta can hold client funds",
    "Swadakta can hold client money",
    "Swadakta can hold or move money directly",
    "Quote first. Provider-held money. Release by proof.",
    "Money is quoted first, tracked by milestone, and released only after proof",
    "Milestone release still needs proof review",
    "release receiver payout only after proof review",
  ]) {
    assertNotIncludes(file, forbidden);
  }
}

for (const [file, marker] of [
  ["payments.html", "Proof before payout"],
  ["payments.html", "records provider-action milestones after proof review"],
  ["payments.html", "Provider-payout milestones still need proof review"],
  ["payments.html", "request receiver payout through the provider only after proof review"],
  ["trust.html", "routed through provider action only after proof"],
  ["trust.html", "before provider-payout action"],
  ["trust.html", "Provider-action milestones"],
  ["portal.html", "Know what unlocks paid action"],
  ["portal.html", "provider-payout milestones"],
  ["portal.html", "provider-payout readiness"],
]) {
  assertIncludes(file, marker);
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
