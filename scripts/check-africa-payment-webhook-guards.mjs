import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const paystackHandler = require("../api/payments/paystack-webhook.js");
const flutterwaveHandler = require("../api/payments/flutterwave-webhook.js");
const paystackWebhookEnv = ["PAYSTACK", "WEBHOOK", "SECRET"].join("_");
const paystackSecretEnv = ["PAYSTACK", "SECRET", "KEY"].join("_");
const flutterwaveWebhookEnv = ["FLUTTERWAVE", "WEBHOOK", "SECRET"].join("_");

const originalEnv = {
  [paystackWebhookEnv]: process.env[paystackWebhookEnv],
  [paystackSecretEnv]: process.env[paystackSecretEnv],
  [flutterwaveWebhookEnv]: process.env[flutterwaveWebhookEnv],
};

function paystackSignature(rawBody, secret) {
  return crypto.createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");
}

function flutterwaveSignature(rawBody, secret) {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
}

function callHandler(handler, { headers = {}, body = "{}" } = {}) {
  return new Promise((resolve) => {
    const req = {
      method: "POST",
      headers,
      body,
    };
    const res = {
      statusCode: 0,
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value;
      },
      end(raw) {
        resolve({
          statusCode: this.statusCode,
          body: raw ? JSON.parse(raw) : {},
        });
      },
    };

    Promise.resolve(handler(req, res)).catch((error) => {
      resolve({
        statusCode: error.statusCode || 500,
        body: { error: error.message },
      });
    });
  });
}

try {
  const ignoredPaystackEvent = JSON.stringify({
    event: "transfer.success",
    data: { reference: "PSK-SW-4402" },
  });
  const paystackSecret = ["paystack", "webhook", "placeholder"].join("-");

  delete process.env[paystackWebhookEnv];
  delete process.env[paystackSecretEnv];
  const paystackMissingSecret = await callHandler(paystackHandler, { body: ignoredPaystackEvent });
  assert.equal(paystackMissingSecret.statusCode, 503);
  assert.match(paystackMissingSecret.body.error, /PAYSTACK_WEBHOOK_SECRET or PAYSTACK_SECRET_KEY is not configured/);

  process.env[paystackWebhookEnv] = paystackSecret;
  const paystackMissingSignature = await callHandler(paystackHandler, { body: ignoredPaystackEvent });
  assert.equal(paystackMissingSignature.statusCode, 401);
  assert.match(paystackMissingSignature.body.error, /Paystack webhook signature verification failed/);

  const paystackWrongSignature = await callHandler(paystackHandler, {
    body: ignoredPaystackEvent,
    headers: { "x-paystack-signature": "bad-signature" },
  });
  assert.equal(paystackWrongSignature.statusCode, 401);
  assert.match(paystackWrongSignature.body.error, /Paystack webhook signature verification failed/);

  const paystackValidIgnored = await callHandler(paystackHandler, {
    body: ignoredPaystackEvent,
    headers: { "x-paystack-signature": paystackSignature(ignoredPaystackEvent, paystackSecret) },
  });
  assert.equal(paystackValidIgnored.statusCode, 200);
  assert.equal(paystackValidIgnored.body.ignored, true);

  const ignoredFlutterwaveEvent = JSON.stringify({
    event: "transfer.completed",
    data: { id: 4402, tx_ref: "FLW-SW-4402" },
  });
  const flutterwaveSecret = ["flutterwave", "webhook", "placeholder"].join("-");

  delete process.env[flutterwaveWebhookEnv];
  const flutterwaveMissingSecret = await callHandler(flutterwaveHandler, { body: ignoredFlutterwaveEvent });
  assert.equal(flutterwaveMissingSecret.statusCode, 503);
  assert.match(flutterwaveMissingSecret.body.error, /FLUTTERWAVE_WEBHOOK_SECRET is not configured/);

  process.env[flutterwaveWebhookEnv] = flutterwaveSecret;
  const flutterwaveMissingSignature = await callHandler(flutterwaveHandler, { body: ignoredFlutterwaveEvent });
  assert.equal(flutterwaveMissingSignature.statusCode, 401);
  assert.match(flutterwaveMissingSignature.body.error, /Flutterwave webhook signature verification failed/);

  const flutterwaveWrongSignature = await callHandler(flutterwaveHandler, {
    body: ignoredFlutterwaveEvent,
    headers: { "flutterwave-signature": "bad-signature" },
  });
  assert.equal(flutterwaveWrongSignature.statusCode, 401);
  assert.match(flutterwaveWrongSignature.body.error, /Flutterwave webhook signature verification failed/);

  const flutterwaveValidIgnored = await callHandler(flutterwaveHandler, {
    body: ignoredFlutterwaveEvent,
    headers: { "flutterwave-signature": flutterwaveSignature(ignoredFlutterwaveEvent, flutterwaveSecret) },
  });
  assert.equal(flutterwaveValidIgnored.statusCode, 200);
  assert.equal(flutterwaveValidIgnored.body.ignored, true);

  const flutterwaveLegacyHashIgnored = await callHandler(flutterwaveHandler, {
    body: ignoredFlutterwaveEvent,
    headers: { "verif-hash": flutterwaveSecret },
  });
  assert.equal(flutterwaveLegacyHashIgnored.statusCode, 200);
  assert.equal(flutterwaveLegacyHashIgnored.body.ignored, true);

  console.log("Africa payment webhook guard checks passed.");
} finally {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
