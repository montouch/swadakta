const {
  REQUEST_SELECT_FIELDS,
  paymentReconciliationPayload,
} = require("../../lib/payment-reconciliation");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SWADAKTA_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_braRDOvu_VbLc6PItbElmg_3hK-Zg51";

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (req.body && typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function requiredText(value, label) {
  const text = String(value || "").trim();
  if (!text) {
    const error = new Error(`${label} is required.`);
    error.statusCode = 400;
    throw error;
  }

  return text;
}

function paypalBaseUrl() {
  if (process.env.PAYPAL_BASE_URL) {
    return process.env.PAYPAL_BASE_URL.replace(/\/$/, "");
  }

  const mode = String(process.env.PAYPAL_ENVIRONMENT || process.env.PAYPAL_MODE || "live").toLowerCase();
  return mode === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

function normalizePayPalOrderId(value) {
  const text = requiredText(String(value || "").split("/")[0], "PayPal order ID").trim();

  if (!/^[A-Z0-9-]{8,64}$/i.test(text)) {
    const error = new Error("PayPal order ID looks invalid.");
    error.statusCode = 400;
    throw error;
  }

  return text;
}

async function assertAdmin(authHeader) {
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    const error = new Error("Admin sign-in is required.");
    error.statusCode = 401;
    throw error;
  }

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      authorization: authHeader,
    },
  });

  if (!userResponse.ok) {
    const error = new Error("Could not verify Supabase session.");
    error.statusCode = 401;
    throw error;
  }

  const user = await userResponse.json();
  const userId = String(user.id || "");
  if (!userId) {
    const error = new Error("Supabase session did not include a user id.");
    error.statusCode = 401;
    throw error;
  }

  const adminResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(userId)}&select=user_id`,
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: authHeader,
        accept: "application/json",
      },
    },
  );

  if (!adminResponse.ok) {
    const error = new Error("Could not verify admin access.");
    error.statusCode = 403;
    throw error;
  }

  const admins = await adminResponse.json();
  if (!Array.isArray(admins) || admins.length === 0) {
    const error = new Error("Only Swadakta admins can capture PayPal orders.");
    error.statusCode = 403;
    throw error;
  }
}

async function getPayPalAccessToken(baseUrl) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const error = new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are not configured in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await tokenResponse.json();
  if (!tokenResponse.ok || !data.access_token) {
    const error = new Error(data?.error_description || data?.error || "Could not get PayPal access token.");
    error.statusCode = tokenResponse.status || 502;
    throw error;
  }

  return data.access_token;
}

async function getPayPalOrderDetails(baseUrl, accessToken, orderId) {
  const response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.message || data?.details?.[0]?.description || "Could not inspect PayPal order before capture.");
    error.statusCode = response.status || 502;
    throw error;
  }

  return data;
}

function firstCapture(captureResponse) {
  const units = Array.isArray(captureResponse.purchase_units) ? captureResponse.purchase_units : [];
  for (const unit of units) {
    const captures = unit?.payments?.captures;
    if (Array.isArray(captures) && captures.length) {
      return captures[0];
    }
  }

  return null;
}

function requestCodeFromText(...values) {
  const haystack = values.filter(Boolean).map(String).join(" ").toUpperCase();
  const match = haystack.match(/\bSW-[A-Z0-9]{4,24}\b/);
  return match ? match[0] : "";
}

function collectPayPalRequestCodes(captureResponse = {}) {
  const codes = new Set();
  const add = (...values) => {
    const code = requestCodeFromText(...values);
    if (code) codes.add(code);
  };

  for (const unit of Array.isArray(captureResponse.purchase_units) ? captureResponse.purchase_units : []) {
    add(unit?.reference_id, unit?.custom_id, unit?.invoice_id);
    for (const capture of Array.isArray(unit?.payments?.captures) ? unit.payments.captures : []) {
      add(capture?.custom_id, capture?.invoice_id);
    }
  }

  return [...codes];
}

function assertPayPalEvidenceMatchesRequestCode(providerEvidence, requestCode, evidenceLabel) {
  const expectedCode = requiredText(requestCode, "Request code").toUpperCase();
  const codes = collectPayPalRequestCodes(providerEvidence);
  const label = evidenceLabel || "PayPal provider evidence";
  if (!codes.length) {
    const error = new Error(
      `${label} did not include a Swadakta request code. Pause the PayPal flow for founder review and reconcile manually before marking a request paid.`,
    );
    error.statusCode = 409;
    throw error;
  }

  if (!codes.includes(expectedCode)) {
    const error = new Error(
      `${label} request code mismatch. Expected ${expectedCode}, but provider evidence returned ${codes.join(", ")}.`,
    );
    error.statusCode = 409;
    throw error;
  }

  return codes;
}

function assertPayPalOrderMatchesRequestCode(orderDetails, requestCode) {
  return assertPayPalEvidenceMatchesRequestCode(orderDetails, requestCode, "PayPal order");
}

function assertPayPalCaptureMatchesRequestCode(captureResponse, requestCode) {
  return assertPayPalEvidenceMatchesRequestCode(captureResponse, requestCode, "PayPal capture");
}

function moneyAmount(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
}

function moneyMinorUnits(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}

function firstPurchaseUnitAmount(providerEvidence = {}) {
  const units = Array.isArray(providerEvidence.purchase_units) ? providerEvidence.purchase_units : [];
  const amount = units.find((unit) => unit?.amount?.value && unit?.amount?.currency_code)?.amount;
  return amount
    ? {
        value: amount.value,
        currency_code: String(amount.currency_code || "").trim().toUpperCase(),
      }
    : null;
}

function assertPayPalOrderAmountMatchesStoredQuote(orderDetails, request = {}) {
  const orderAmount = firstPurchaseUnitAmount(orderDetails);
  if (!orderAmount) {
    const error = new Error("PayPal order details did not include amount/currency evidence. Capture is paused for founder review.");
    error.statusCode = 409;
    throw error;
  }

  const orderMinorUnits = moneyMinorUnits(orderAmount.value);
  const quoteMinorUnits = moneyMinorUnits(request.quote_amount);
  const orderCurrency = orderAmount.currency_code;
  const quoteCurrency = String(request.quote_currency || "").trim().toUpperCase();

  if (!quoteMinorUnits || !quoteCurrency) {
    const error = new Error("Saved Swadakta quote amount/currency is missing. Capture is paused until the request quote is reconciled.");
    error.statusCode = 409;
    throw error;
  }

  if (orderCurrency !== quoteCurrency || orderMinorUnits !== quoteMinorUnits) {
    const error = new Error(
      `PayPal order amount/currency does not match the saved quote. Order returned ${orderCurrency || "unknown"} ${orderAmount.value}; quote expects ${quoteCurrency} ${request.quote_amount}. Capture is paused for founder review.`,
    );
    error.statusCode = 409;
    throw error;
  }

  return orderAmount;
}

async function findRequestByCode(authHeader, requestCode) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/service_requests?request_code=eq.${encodeURIComponent(requestCode)}&select=${REQUEST_SELECT_FIELDS}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: authHeader,
        accept: "application/json",
      },
    },
  );

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    const error = new Error(data?.message || "PayPal captured, but Swadakta request lookup failed.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function updateRequestAfterCapture(authHeader, requestCode, updatePayload) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/service_requests?request_code=eq.${encodeURIComponent(requestCode)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: authHeader,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updatePayload),
    },
  );

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    const error = new Error(data?.message || "PayPal captured, but Swadakta request update failed.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function capturePayPalOrder(authHeader, payload) {
  const requestCode = requiredText(payload.request_code, "Request code").toUpperCase();
  const orderId = normalizePayPalOrderId(payload.paypal_order_id || payload.payment_reference);
  const baseUrl = paypalBaseUrl();
  const request = await findRequestByCode(authHeader, requestCode);
  if (!request) {
    const error = new Error("No Swadakta request matched the request code, so PayPal capture was not attempted.");
    error.statusCode = 404;
    throw error;
  }

  const accessToken = await getPayPalAccessToken(baseUrl);
  const orderDetails = await getPayPalOrderDetails(baseUrl, accessToken, orderId);
  const paypalOrderRequestCodes = assertPayPalOrderMatchesRequestCode(orderDetails, requestCode);
  const paypalOrderAmount = assertPayPalOrderAmountMatchesStoredQuote(orderDetails, request);

  const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `swadakta-capture-${orderId}`,
      Prefer: "return=representation",
    },
    body: "{}",
  });

  const data = await captureResponse.json();
  if (!captureResponse.ok) {
    const error = new Error(data?.message || data?.details?.[0]?.description || "PayPal order capture failed.");
    error.statusCode = captureResponse.status || 502;
    throw error;
  }

  const capture = firstCapture(data);
  if (data.status !== "COMPLETED" || !capture || capture.status !== "COMPLETED") {
    const error = new Error(`PayPal capture is not complete yet. Order status: ${data.status || "unknown"}.`);
    error.statusCode = 409;
    throw error;
  }

  const paypalCaptureRequestCodes = assertPayPalCaptureMatchesRequestCode(data, requestCode);
  const paypalRequestCodes = [...new Set([...paypalOrderRequestCodes, ...paypalCaptureRequestCodes])];
  const amount = moneyAmount(capture.amount?.value || data.purchase_units?.[0]?.amount?.value || paypalOrderAmount.value);
  const currency =
    capture.amount?.currency_code ||
    data.purchase_units?.[0]?.amount?.currency_code ||
    paypalOrderAmount.currency_code ||
    "";
  const reference = [orderId, capture.id].filter(Boolean).join(" / ");

  const updatePayload = paymentReconciliationPayload({
    amount,
    currency,
    paymentReference: reference,
    providerName: "PayPal",
    request,
    successNotePrefix: "PayPal capture confirmed",
  });
  const updatedRequest = await updateRequestAfterCapture(authHeader, requestCode, updatePayload);

  return {
    request_code: requestCode,
    paypal_order_id: orderId,
    capture_id: capture.id,
    payment_status: updatedRequest?.payment_status || updatePayload.payment_status || request.payment_status,
    funds_status: updatedRequest?.funds_status || updatePayload.funds_status || request.funds_status,
    protected_amount: updatePayload.protected_amount,
    provider_reference: updatePayload.payment_reference,
    paypal_request_codes: paypalRequestCodes,
    paypal_order_request_codes: paypalOrderRequestCodes,
    paypal_capture_request_codes: paypalCaptureRequestCodes,
    updated_request_id: updatedRequest?.id || null,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    await assertAdmin(req.headers.authorization);
    const payload = await readJsonBody(req);
    const result = await capturePayPalOrder(req.headers.authorization, payload);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Could not capture PayPal order.",
    });
  }
};

module.exports.__test = {
  assertPayPalOrderAmountMatchesStoredQuote,
  assertPayPalOrderMatchesRequestCode,
  assertPayPalCaptureMatchesRequestCode,
  collectPayPalRequestCodes,
  firstPurchaseUnitAmount,
  moneyMinorUnits,
  requestCodeFromText,
};
