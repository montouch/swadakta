import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  paymentLaunchGatePayload,
  quoteEconomicsGatePayload,
} = require("../lib/payment-launch-gate.js");
const {
  PAYMENT_REQUEST_SELECT_FIELDS,
  mergeStoredPaymentPayload,
} = require("../lib/payment-request-context.js");

[
  "SWADAKTA_OWNER_BUSINESS_REGISTERED",
  "SWADAKTA_OWNER_TAX_REVIEWED",
  "SWADAKTA_OWNER_INSURANCE_ACTIVE",
  "SWADAKTA_OWNER_LEGAL_REVIEWED",
  "SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED",
  "SWADAKTA_OWNER_PRIVACY_REVIEWED",
  "SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED",
  "SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED",
].forEach((name) => {
  process.env[name] = "true";
});

process.env.SUMSUB_VERIFICATION_URL = "https://example.com/sumsub";
process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service_role_placeholder";

const basePayload = {
  request_code: "SW-4402",
  quote_amount: 180,
  quote_currency: "AUD",
  operator_payout: 80,
  field_costs: 20,
  payment_processing_fee: 5,
  compliance_status: "not_applicable",
  compliance_risk_level: "standard",
  route_status: "active",
  goods_category: "none",
  logistics_mode: "not_needed",
  compliance_flags: ["rules_acceptance_quote_eligible"],
};

const clearEconomics = quoteEconomicsGatePayload(basePayload);
assert.equal(clearEconomics.status, "economics_clear");
assert.deepEqual(clearEconomics.blockers, []);
assert.equal(clearEconomics.recommended_quote, 150);
assert.equal(clearEconomics.gross_margin, 75);

const clearGate = paymentLaunchGatePayload("stripe", basePayload);
assert.equal(clearGate.status, "founder_reviewed_pilot");
assert.deepEqual(clearGate.quote_economics_blockers, []);
assert.equal(clearGate.quote_economics_gate.status, "economics_clear");

const missingPlan = quoteEconomicsGatePayload({
  ...basePayload,
  quote_amount: 200,
  operator_payout: 0,
  field_costs: 0,
  payment_processing_fee: 0,
});
assert.equal(missingPlan.status, "cost_plan_missing");
assert.deepEqual(missingPlan.blockers, ["QUOTE_ECONOMICS_COST_PLAN_MISSING"]);

const loss = quoteEconomicsGatePayload({
  ...basePayload,
  quote_amount: 80,
  operator_payout: 90,
  field_costs: 20,
  payment_processing_fee: 5,
});
assert.equal(loss.status, "margin_loss");
assert.deepEqual(loss.blockers, ["QUOTE_ECONOMICS_MARGIN_LOSS"]);

const belowFloor = paymentLaunchGatePayload("stripe", {
  ...basePayload,
  quote_amount: 120,
  operator_payout: 80,
  field_costs: 20,
  payment_processing_fee: 5,
});
assert.equal(belowFloor.quote_economics_gate.status, "below_floor");
assert.ok(belowFloor.missing.includes("QUOTE_ECONOMICS_BELOW_FLOOR"));
assert.ok(belowFloor.quote_economics_blockers.includes("QUOTE_ECONOMICS_BELOW_FLOOR"));

const notPriced = quoteEconomicsGatePayload({
  ...basePayload,
  quote_amount: 0,
});
assert.equal(notPriced.status, "not_priced");
assert.deepEqual(notPriced.blockers, ["QUOTE_ECONOMICS_NOT_PRICED"]);

assert.ok(
  PAYMENT_REQUEST_SELECT_FIELDS.split(",").includes("job_acceptance_status"),
  "payment request lookup must fetch job_acceptance_status from the saved request",
);

const storedFounderReviewPayload = mergeStoredPaymentPayload(
  {
    request_code: "SW-4402",
    quote_amount: 180,
    quote_currency: "AUD",
    job_acceptance_status: "quote_eligible",
  },
  {
    id: "stored-request-id",
    request_code: "SW-4402",
    client_name: "Test Client",
    quote_amount: 180,
    quote_currency: "AUD",
    operator_payout: 80,
    field_costs: 20,
    payment_processing_fee: 5,
    compliance_status: "not_applicable",
    compliance_risk_level: "standard",
    route_status: "active",
    goods_category: "none",
    logistics_mode: "not_needed",
    compliance_flags: ["rules_acceptance_quote_eligible"],
    job_acceptance_status: "founder_review",
  },
);
assert.equal(storedFounderReviewPayload.job_acceptance_status, "founder_review");

const storedFounderReviewGate = paymentLaunchGatePayload("stripe", storedFounderReviewPayload);
assert.equal(storedFounderReviewGate.job_gate.acceptance_status, "founder_review");
assert.ok(storedFounderReviewGate.missing.includes("JOB_ACCEPTANCE_FOUNDER_REVIEW_REQUIRED"));

console.log("Payment launch gate checks passed.");
