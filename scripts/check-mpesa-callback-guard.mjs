import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const handler = require("../api/payments/mpesa-callback.js");
const tokenEnvName = ["MPESA", "CALLBACK", "TOKEN"].join("_");
const expectedToken = ["callback", "token", "placeholder"].join("-");
const wrongTokenValue = ["wrong", "token", "placeholder"].join("-");
const originalToken = process.env[tokenEnvName];

function callCallback({ token, body = {} } = {}) {
  return new Promise((resolve) => {
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    const req = {
      method: "POST",
      headers: { host: "swadakta.com" },
      url: `/api/payments/mpesa-callback${query}`,
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
  delete process.env[tokenEnvName];
  const missingConfig = await callCallback();
  assert.equal(missingConfig.statusCode, 503);
  assert.match(missingConfig.body.error, /MPESA_CALLBACK_TOKEN is required/);

  process.env[tokenEnvName] = expectedToken;
  const missingToken = await callCallback();
  assert.equal(missingToken.statusCode, 401);
  assert.match(missingToken.body.error, /Invalid M-Pesa callback token/);

  const wrongToken = await callCallback({ token: wrongTokenValue });
  assert.equal(wrongToken.statusCode, 401);
  assert.match(wrongToken.body.error, /Invalid M-Pesa callback token/);

  const correctTokenInvalidBody = await callCallback({ token: expectedToken });
  assert.equal(correctTokenInvalidBody.statusCode, 400);
  assert.match(correctTokenInvalidBody.body.error, /missing stkCallback/);

  console.log("M-Pesa callback token guard checks passed.");
} finally {
  if (originalToken === undefined) {
    delete process.env[tokenEnvName];
  } else {
    process.env[tokenEnvName] = originalToken;
  }
}
