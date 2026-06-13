import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  nonFinalPaymentCallbackPayload,
  paymentReconciliationPayload,
} = require("../lib/payment-reconciliation.js");

const baseRequest = {
  id: "req_1",
  request_code: "SW-4402",
  quote_amount: 1000,
  quote_currency: "AUD",
  payment_status: "invoice_sent",
  funds_status: "payment_link_sent",
  payment_reference: "Stripe cs_existing",
  protected_amount: 0,
};

const matched = paymentReconciliationPayload({
  amount: 1000,
  currency: "aud",
  paymentReference: "Stripe cs_paid / pi_paid",
  providerName: "Stripe",
  request: baseRequest,
  successNotePrefix: "Stripe webhook confirmed payment",
});
assert.equal(matched.payment_status, "paid");
assert.equal(matched.funds_status, "deposit_confirmed");
assert.equal(matched.protected_amount, 1000);
assert.match(matched.payment_reference, /cs_existing/);
assert.match(matched.payment_reference, /cs_paid/);
assert.match(matched.release_notes, /provider evidence matched quote amount\/currency/);
assert.match(matched.release_notes, /Payment reconciliation is monotonic/);

const partial = paymentReconciliationPayload({
  amount: 400,
  currency: "AUD",
  paymentReference: "PayPal partial",
  providerName: "PayPal",
  request: baseRequest,
  successNotePrefix: "PayPal capture confirmed",
});
assert.equal(partial.payment_status, "deposit_paid");
assert.equal(partial.funds_status, "deposit_confirmed");
assert.match(partial.release_notes, /Treat as deposit only/);

const mismatch = paymentReconciliationPayload({
  amount: 1000,
  currency: "USD",
  paymentReference: "Paystack wrong-currency",
  providerName: "Paystack",
  request: baseRequest,
  successNotePrefix: "Paystack webhook and transaction verification confirmed USD payment",
});
assert.equal(mismatch.funds_status, "disputed");
assert.equal(mismatch.payment_status, undefined);
assert.match(mismatch.release_notes, /does not match quote currency AUD/);

const alreadyPaid = paymentReconciliationPayload({
  amount: 250,
  currency: "AUD",
  paymentReference: "Duplicate late partial",
  providerName: "Stripe",
  request: {
    ...baseRequest,
    payment_status: "paid",
    funds_status: "deposit_confirmed",
    protected_amount: 1000,
  },
  successNotePrefix: "Stripe webhook confirmed payment",
});
assert.equal(alreadyPaid.payment_status, "paid");
assert.equal(alreadyPaid.funds_status, "deposit_confirmed");
assert.equal(alreadyPaid.protected_amount, 1000);
assert.match(alreadyPaid.release_notes, /cannot downgrade paid\/refunded evidence/);

const disputeLocked = paymentReconciliationPayload({
  amount: 1000,
  currency: "AUD",
  paymentReference: "Later matching callback",
  providerName: "Flutterwave",
  request: {
    ...baseRequest,
    payment_status: "paid",
    funds_status: "disputed",
    protected_amount: 1000,
  },
  successNotePrefix: "Flutterwave webhook and transaction verification confirmed AUD payment",
});
assert.equal(disputeLocked.payment_status, "paid");
assert.equal(disputeLocked.funds_status, "disputed");
assert.match(disputeLocked.release_notes, /cannot clear a dispute\/refund hold/);

const releasedLocked = paymentReconciliationPayload({
  amount: 1000,
  currency: "USD",
  paymentReference: "Late contradiction",
  providerName: "Stripe",
  request: {
    ...baseRequest,
    payment_status: "paid",
    funds_status: "released",
    protected_amount: 1000,
  },
  successNotePrefix: "Stripe webhook confirmed payment",
});
assert.equal(releasedLocked.payment_status, "paid");
assert.equal(releasedLocked.funds_status, "released");
assert.match(releasedLocked.release_notes, /terminal funds status released preserved/);

const nonFinal = nonFinalPaymentCallbackPayload({
  providerName: "M-Pesa",
  request: {
    ...baseRequest,
    payment_status: "paid",
    funds_status: "deposit_confirmed",
    payment_reference: "CheckoutRequestID abc",
  },
  paymentReference: "receipt failed-later",
  reason: "Result 1032: Request cancelled by user",
});
assert.equal(nonFinal.payment_status, undefined);
assert.equal(nonFinal.funds_status, undefined);
assert.match(nonFinal.payment_reference, /CheckoutRequestID abc/);
assert.match(nonFinal.payment_reference, /failed-later/);
assert.match(nonFinal.release_notes, /non-final callback cannot downgrade provider evidence/);

console.log("Payment reconciliation checks passed.");
