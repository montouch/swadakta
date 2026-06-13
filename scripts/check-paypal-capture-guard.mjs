import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const paypalCapture = require("../api/payments/paypal-capture.js");

const {
  assertPayPalCaptureMatchesRequestCode,
  assertPayPalOrderAmountMatchesStoredQuote,
  assertPayPalOrderMatchesRequestCode,
  collectPayPalRequestCodes,
  firstPurchaseUnitAmount,
  moneyMinorUnits,
} = paypalCapture.__test;

const storedRequest = {
  request_code: "SW-4402",
  quote_amount: "180.00",
  quote_currency: "AUD",
};

const matchingCapture = {
  status: "COMPLETED",
  purchase_units: [
    {
      reference_id: "SW-4402",
      custom_id: "SW-4402",
      invoice_id: "SW-4402",
      payments: {
        captures: [
          {
            id: "PAYPAL-CAPTURE-1",
            status: "COMPLETED",
            custom_id: "SW-4402",
            amount: { value: "180.00", currency_code: "AUD" },
          },
        ],
      },
    },
  ],
};

const matchingOrder = {
  id: "PAYPAL-ORDER-1",
  status: "APPROVED",
  intent: "CAPTURE",
  purchase_units: [
    {
      reference_id: "SW-4402",
      custom_id: "SW-4402",
      invoice_id: "SW-4402",
      amount: { value: "180.00", currency_code: "AUD" },
    },
  ],
};

assert.equal(moneyMinorUnits("180.00"), 18000);
assert.deepEqual(firstPurchaseUnitAmount(matchingOrder), { value: "180.00", currency_code: "AUD" });
assert.deepEqual(assertPayPalOrderMatchesRequestCode(matchingOrder, "SW-4402"), ["SW-4402"]);
assert.deepEqual(assertPayPalOrderAmountMatchesStoredQuote(matchingOrder, storedRequest), {
  value: "180.00",
  currency_code: "AUD",
});

assert.deepEqual(collectPayPalRequestCodes(matchingCapture), ["SW-4402"]);
assert.deepEqual(assertPayPalCaptureMatchesRequestCode(matchingCapture, "sw-4402"), ["SW-4402"]);

assert.throws(
  () =>
    assertPayPalOrderMatchesRequestCode(
      {
        ...matchingOrder,
        purchase_units: [{ ...matchingOrder.purchase_units[0], reference_id: "SW-9999", custom_id: "SW-9999" }],
      },
      "SW-4402",
    ),
  /PayPal order request code mismatch/,
);

assert.throws(
  () =>
    assertPayPalOrderAmountMatchesStoredQuote(
      {
        ...matchingOrder,
        purchase_units: [{ ...matchingOrder.purchase_units[0], amount: { value: "120.00", currency_code: "AUD" } }],
      },
      storedRequest,
    ),
  /does not match the saved quote/,
);

assert.throws(
  () =>
    assertPayPalOrderAmountMatchesStoredQuote(
      {
        ...matchingOrder,
        purchase_units: [{ ...matchingOrder.purchase_units[0], amount: { value: "180.00", currency_code: "USD" } }],
      },
      storedRequest,
    ),
  /does not match the saved quote/,
);

assert.throws(
  () =>
    assertPayPalOrderAmountMatchesStoredQuote(
      {
        ...matchingOrder,
        purchase_units: [{ reference_id: "SW-4402" }],
      },
      storedRequest,
    ),
  /did not include amount\/currency evidence/,
);

assert.throws(
  () =>
    assertPayPalCaptureMatchesRequestCode(
      {
        status: "COMPLETED",
        purchase_units: [{ reference_id: "SW-9999", payments: { captures: [{ id: "CAPTURE-2" }] } }],
      },
      "SW-4402",
    ),
  /PayPal capture request code mismatch/,
);

assert.throws(
  () =>
    assertPayPalCaptureMatchesRequestCode(
      {
        status: "COMPLETED",
        purchase_units: [{ payments: { captures: [{ id: "CAPTURE-3" }] } }],
      },
      "SW-4402",
    ),
  /did not include a Swadakta request code/,
);

console.log("PayPal capture guard checks passed.");
