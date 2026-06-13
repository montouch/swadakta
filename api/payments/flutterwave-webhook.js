const crypto = require("crypto");
const {
  REQUEST_SELECT_FIELDS,
  moneyAmount,
  paymentReconciliationPayload,
} = require("../../lib/payment-reconciliation");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const SUPABASE_SERVER_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SWADAKTA_SUPABASE_SERVICE_ROLE_KEY;
const FLUTTERWAVE_BASE_URL = (process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3").replace(/\/+$/, "");

const HANDLED_EVENTS = new Set(["charge.completed"]);

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  if (req.body && typeof req.body === "string") {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function safeCompareText(first, second) {
  const firstBuffer = Buffer.from(String(first || ""));
  const secondBuffer = Buffer.from(String(second || ""));

  if (firstBuffer.length !== secondBuffer.length || firstBuffer.length === 0) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function hmacFlutterwaveSignature(rawBody, webhookSecret) {
  return crypto.createHmac("sha256", webhookSecret).update(rawBody, "utf8").digest("base64");
}

function verifyFlutterwaveSignature(rawBody, headers = {}) {
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    const error = new Error("FLUTTERWAVE_WEBHOOK_SECRET is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const hmacSignature = headers["flutterwave-signature"];
  if (hmacSignature) {
    const expectedSignature = hmacFlutterwaveSignature(rawBody, webhookSecret);
    if (!safeCompareText(hmacSignature, expectedSignature)) {
      const error = new Error("Flutterwave webhook signature verification failed.");
      error.statusCode = 401;
      throw error;
    }
    return;
  }

  // Legacy Flutterwave dashboards may still send only verif-hash. Prefer the current HMAC-SHA256
  // flutterwave-signature header when present, but keep verif-hash for already-configured accounts.
  if (!safeCompareText(headers["verif-hash"], webhookSecret)) {
    const error = new Error("Flutterwave webhook signature verification failed.");
    error.statusCode = 401;
    throw error;
  }
}

function requestCodeFromText(...values) {
  const haystack = values.filter(Boolean).map(String).join(" ").toUpperCase();
  const match = haystack.match(/\bSW-[A-Z0-9]{4,24}\b/);
  return match ? match[0] : "";
}

function requestCodeFromMeta(meta) {
  if (!meta || typeof meta !== "object") {
    return "";
  }

  return requestCodeFromText(meta.request_code, meta.swadakta_request_code, meta.requestCode);
}

async function verifyFlutterwaveTransaction(transactionId) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    const error = new Error("FLUTTERWAVE_SECRET_KEY is not configured.");
    error.statusCode = 503;
    throw error;
  }

  if (!transactionId) {
    const error = new Error("Flutterwave webhook is missing transaction id.");
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      accept: "application/json",
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || String(payload.status || "").toLowerCase() !== "success") {
    const error = new Error(payload.message || "Flutterwave transaction verification failed.");
    error.statusCode = response.status || 502;
    throw error;
  }

  return payload.data || {};
}

async function findRequestByReference(reference) {
  if (!SUPABASE_SERVER_KEY) {
    const error = new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is not configured in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  if (!reference) return null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/service_requests?payment_reference=${encodeURIComponent(`ilike.*${reference}*`)}&select=${REQUEST_SELECT_FIELDS}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVER_KEY,
        authorization: `Bearer ${SUPABASE_SERVER_KEY}`,
        accept: "application/json",
      },
    },
  );
  const data = await response.json().catch(() => []);

  if (!response.ok) {
    const error = new Error(data?.message || "Could not look up Swadakta request for Flutterwave reference.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function findRequestByCode(requestCode) {
  if (!requestCode) return null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/service_requests?request_code=eq.${encodeURIComponent(requestCode)}&select=${REQUEST_SELECT_FIELDS}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVER_KEY,
        authorization: `Bearer ${SUPABASE_SERVER_KEY}`,
        accept: "application/json",
      },
    },
  );
  const data = await response.json().catch(() => []);

  if (!response.ok) {
    const error = new Error(data?.message || "Could not look up Swadakta request for Flutterwave request code.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function updateRequestFromFlutterwave(eventData, verifiedData) {
  if (!SUPABASE_SERVER_KEY) {
    const error = new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is not configured in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  const transactionId = String(verifiedData.id || eventData.id || "").trim();
  const transactionRef = String(verifiedData.tx_ref || eventData.tx_ref || "").trim();
  const flutterwaveRef = String(verifiedData.flw_ref || eventData.flw_ref || "").trim();
  const status = String(verifiedData.status || eventData.status || "").toLowerCase();
  const requestCode =
    requestCodeFromMeta(verifiedData.meta) ||
    requestCodeFromMeta(eventData.meta) ||
    requestCodeFromText(transactionRef, flutterwaveRef);

  if (status !== "successful") {
    return {
      updated: false,
      request_code: requestCode || "",
      reason: `Ignored Flutterwave status=${status || "unknown"}.`,
      provider_reference: transactionRef || transactionId,
    };
  }

  const request = requestCode
    ? await findRequestByCode(requestCode)
    : await findRequestByReference(transactionRef || flutterwaveRef || transactionId);
  const requestFilter = request?.id ? `id=eq.${encodeURIComponent(request.id)}` : "";

  if (!requestFilter) {
    return {
      updated: false,
      request_code: "",
      reason: "No Swadakta request_code or matching payment reference found for Flutterwave transaction.",
      provider_reference: transactionRef || transactionId,
    };
  }

  const amount = moneyAmount(verifiedData.amount || eventData.amount);
  const currency = String(verifiedData.currency || eventData.currency || "").toUpperCase();
  const referenceParts = [
    "Flutterwave",
    transactionRef ? `tx_ref ${transactionRef}` : "",
    flutterwaveRef ? `flw_ref ${flutterwaveRef}` : "",
    transactionId ? `id ${transactionId}` : "",
  ].filter(Boolean);
  const updatePayload = paymentReconciliationPayload({
    amount,
    currency,
    paymentReference: referenceParts.join(" / "),
    providerName: "Flutterwave",
    request,
    successNotePrefix: `Flutterwave webhook and transaction verification confirmed ${currency || "provider"} payment`,
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/service_requests?${requestFilter}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVER_KEY,
      authorization: `Bearer ${SUPABASE_SERVER_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(updatePayload),
  });
  const data = await response.json().catch(() => []);

  if (!response.ok) {
    const error = new Error(data?.message || "Could not update Swadakta request from Flutterwave webhook.");
    error.statusCode = 502;
    throw error;
  }

  const updated = Array.isArray(data) ? data[0] || null : null;
  return {
    updated: Boolean(updated),
    request_code: updated?.request_code || requestCode || request?.request_code || "",
    provider_reference: updatePayload.payment_reference,
    payment_status: updated?.payment_status || updatePayload.payment_status || request.payment_status,
    funds_status: updated?.funds_status || updatePayload.funds_status || request.funds_status,
    protected_amount: amount,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    verifyFlutterwaveSignature(rawBody, req.headers || {});

    const event = rawBody ? JSON.parse(rawBody) : {};
    if (!HANDLED_EVENTS.has(event.event)) {
      sendJson(res, 200, { received: true, ignored: true, event: event.event || "unknown" });
      return;
    }

    const eventData = event.data || {};
    const verifiedData = await verifyFlutterwaveTransaction(eventData.id);
    const result = await updateRequestFromFlutterwave(eventData, verifiedData);
    sendJson(res, 200, { received: true, event: event.event, result });
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || "Flutterwave webhook failed." });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
