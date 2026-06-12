const crypto = require("crypto");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const SUPABASE_SERVER_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SWADAKTA_SUPABASE_SERVICE_ROLE_KEY;
const PAYSTACK_BASE_URL = (process.env.PAYSTACK_BASE_URL || "https://api.paystack.co").replace(/\/+$/, "");

const HANDLED_EVENTS = new Set(["charge.success"]);

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  if (typeof req.body === "string") {
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

function safeCompareHex(first, second) {
  const firstBuffer = Buffer.from(first || "", "hex");
  const secondBuffer = Buffer.from(second || "", "hex");

  if (firstBuffer.length !== secondBuffer.length || firstBuffer.length === 0) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function verifyPaystackSignature(rawBody, signatureHeader) {
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (!webhookSecret) {
    const error = new Error("PAYSTACK_WEBHOOK_SECRET or PAYSTACK_SECRET_KEY is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const expectedSignature = crypto.createHmac("sha512", webhookSecret).update(rawBody, "utf8").digest("hex");
  if (!safeCompareHex(signatureHeader, expectedSignature)) {
    const error = new Error("Paystack webhook signature verification failed.");
    error.statusCode = 401;
    throw error;
  }
}

function requestCodeFromText(...values) {
  const haystack = values.filter(Boolean).map(String).join(" ").toUpperCase();
  const match = haystack.match(/\bSW-[A-Z0-9]{4,24}\b/);
  return match ? match[0] : "";
}

function requestCodeFromMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const direct = requestCodeFromText(metadata.request_code, metadata.swadakta_request_code, metadata.requestCode);
  if (direct) return direct;

  if (Array.isArray(metadata.custom_fields)) {
    return requestCodeFromText(
      ...metadata.custom_fields.flatMap((field) => [field?.variable_name, field?.display_name, field?.value]),
    );
  }

  return "";
}

function moneyFromPaystackAmount(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.round(amount / 100);
}

async function verifyPaystackTransaction(reference) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    const error = new Error("PAYSTACK_SECRET_KEY is not configured.");
    error.statusCode = 503;
    throw error;
  }

  if (!reference) {
    const error = new Error("Paystack webhook is missing transaction reference.");
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      accept: "application/json",
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status !== true) {
    const error = new Error(payload.message || "Paystack transaction verification failed.");
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
    `${SUPABASE_URL}/rest/v1/service_requests?payment_reference=${encodeURIComponent(`ilike.*${reference}*`)}&select=id,request_code,payment_reference&limit=1`,
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
    const error = new Error(data?.message || "Could not look up Swadakta request for Paystack reference.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function updateRequestFromPaystack(eventData, verifiedData) {
  if (!SUPABASE_SERVER_KEY) {
    const error = new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is not configured in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  const reference = String(verifiedData.reference || eventData.reference || "").trim();
  const status = String(verifiedData.status || eventData.status || "").toLowerCase();
  const requestCode =
    requestCodeFromMetadata(verifiedData.metadata) ||
    requestCodeFromMetadata(eventData.metadata) ||
    requestCodeFromText(verifiedData.reference, eventData.reference);

  if (status !== "success") {
    return {
      updated: false,
      request_code: requestCode || "",
      reason: `Ignored Paystack status=${status || "unknown"}.`,
      provider_reference: reference,
    };
  }

  const request = requestCode ? null : await findRequestByReference(reference);
  const requestFilter = requestCode
    ? `request_code=eq.${encodeURIComponent(requestCode)}`
    : request?.id
      ? `id=eq.${encodeURIComponent(request.id)}`
      : "";

  if (!requestFilter) {
    return {
      updated: false,
      request_code: "",
      reason: "No Swadakta request_code or matching payment reference found for Paystack transaction.",
      provider_reference: reference,
    };
  }

  const amount = moneyFromPaystackAmount(verifiedData.amount || eventData.amount);
  const currency = String(verifiedData.currency || eventData.currency || "").toUpperCase();
  const referenceParts = ["Paystack", reference, verifiedData.id ? `id ${verifiedData.id}` : ""].filter(Boolean);
  const updatePayload = {
    payment_status: "paid",
    funds_status: "deposit_confirmed",
    protected_amount: amount,
    payment_reference: referenceParts.join(" / "),
    release_notes: `Paystack webhook and transaction verification confirmed ${currency || "provider"} payment. Founder/admin must still review milestone proof before any receiver release.`,
  };

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
    const error = new Error(data?.message || "Could not update Swadakta request from Paystack webhook.");
    error.statusCode = 502;
    throw error;
  }

  const updated = Array.isArray(data) ? data[0] || null : null;
  return {
    updated: Boolean(updated),
    request_code: updated?.request_code || requestCode || request?.request_code || "",
    provider_reference: updatePayload.payment_reference,
    protected_amount: amount,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    verifyPaystackSignature(rawBody, req.headers["x-paystack-signature"]);

    const event = JSON.parse(rawBody);
    if (!HANDLED_EVENTS.has(event.event)) {
      sendJson(res, 200, { received: true, ignored: true, event: event.event || "unknown" });
      return;
    }

    const eventData = event.data || {};
    const verifiedData = await verifyPaystackTransaction(eventData.reference);
    const result = await updateRequestFromPaystack(eventData, verifiedData);
    sendJson(res, 200, { received: true, event: event.event, result });
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || "Paystack webhook failed." });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
