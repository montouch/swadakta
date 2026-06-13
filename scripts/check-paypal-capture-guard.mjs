import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const paypalCapture = require("../api/payments/paypal-capture.js");

const { assertPayPalCaptureMatchesRequestCode, collectPayPalRequestCodes } = paypalCapture.__test;

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

assert.deepEqual(collectPayPalRequestCodes(matchingCapture), ["SW-4402"]);
assert.deepEqual(assertPayPalCaptureMatchesRequestCode(matchingCapture, "sw-4402"), ["SW-4402"]);

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
