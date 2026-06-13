import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const handler = require("../api/identity/start-verification.js");
const secretEnvName = ["SUMSUB", "WEBHOOK", "SECRET"].join("_");
const webhookSecret = ["sumsub", "webhook", "placeholder"].join("-");
const originalSecret = process.env[secretEnvName];

function digest(rawBody, secret) {
  return crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

function callWebhook({ headers = {}, body = "{}" } = {}) {
  return new Promise((resolve) => {
    const req = {
      method: "POST",
      headers: { host: "swadakta.com", ...headers },
      url: "/api/identity/sumsub-webhook",
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

    handler(req, res);
  });
}

try {
  delete process.env[secretEnvName];
  const missingSecret = await callWebhook();
  assert.equal(missingSecret.statusCode, 503);
  assert.match(missingSecret.body.error, /SUMSUB_WEBHOOK_SECRET is not configured/);

  process.env[secretEnvName] = webhookSecret;
  const missingDigest = await callWebhook();
  assert.equal(missingDigest.statusCode, 401);
  assert.match(missingDigest.body.error, /Missing Sumsub x-payload-digest header/);

  const invalidDigest = await callWebhook({
    headers: { "x-payload-digest": "bad-digest", "x-payload-digest-alg": "HMAC_SHA256_HEX" },
  });
  assert.equal(invalidDigest.statusCode, 401);
  assert.match(invalidDigest.body.error, /Sumsub webhook signature verification failed/);

  const rawBody = JSON.stringify({ type: "applicantReviewed", reviewResult: { reviewAnswer: "GREEN" } });
  const validDigest = await callWebhook({
    body: rawBody,
    headers: { "x-payload-digest": digest(rawBody, webhookSecret), "x-payload-digest-alg": "HMAC_SHA256_HEX" },
  });
  assert.equal(validDigest.statusCode, 200);
  assert.equal(validDigest.body.received, true);
  assert.equal(validDigest.body.updated, false);

  console.log("Sumsub webhook signature guard checks passed.");
} finally {
  if (originalSecret === undefined) {
    delete process.env[secretEnvName];
  } else {
    process.env[secretEnvName] = originalSecret;
  }
}
