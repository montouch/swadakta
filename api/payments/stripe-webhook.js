const crypto = require("crypto");
const {
  REQUEST_SELECT_FIELDS,
  normalizeCurrency,
  paymentReconciliationPayload,
} = require("./payment-reconciliation");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const SUPABASE_SERVER_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SWADAKTA_SUPABASE_SERVICE_ROLE_KEY;

const SIGNATURE_TOLERANCE_SECONDS = 300;
const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

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

function parseStripeSignature(header) {
  return String(header || "")
    .split(",")
    .reduce(
      (parts, part) => {
        const [key, value] = part.split("=");
        if (key === "t") {
          parts.timestamp = value;
        }
        if (key === "v1") {
          parts.signatures.push(value);
        }
        return parts;
      },
      { timestamp: "", signatures: [] },
    );
}

function safeCompare(first, second) {
  const firstBuffer = Buffer.from(first || "", "hex");
  const secondBuffer = Buffer.from(second || "", "hex");

  if (firstBuffer.length !== secondBuffer.length || firstBuffer.length === 0) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function verifyStripeSignature(rawBody, signatureHeader, webhookSecret) {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  const timestampNumber = Number(timestamp);

  if (!timestamp || !signatures.length || !Number.isFinite(timestampNumber)) {
    throw new Error("Missing or invalid Stripe signature header.");
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - timestampNumber);
  if (ageSeconds > SIGNATURE_TOLERANCE_SECONDS) {
    throw new Error("Stripe webhook signature timestamp is outside tolerance.");
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  if (!signatures.some((signature) => safeCompare(signature, expectedSignature))) {
    throw new Error("Stripe webhook signature verification failed.");
  }
}

function moneyFromSmallestUnit(amount) {
  const number = Number(amount || 0);
  if (!Number.isFinite(number) || number <= 0) {
    return 0;
  }

  return Math.round(number / 100);
}

function requestCodeFromSession(session) {
  return String(
    session?.metadata?.request_code ||
      session?.client_reference_id ||
      session?.payment_intent?.metadata?.request_code ||
      "",
  )
    .trim()
    .toUpperCase();
}

function paymentReference(session) {
  return [session?.id, session?.payment_intent]
    .filter(Boolean)
    .map(String)
    .join(" / ");
}

async function fetchRequestByCode(requestCode) {
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
    const error = new Error(data?.message || "Could not look up Swadakta request for Stripe webhook.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function updateRequestFromCheckout(session) {
  if (!SUPABASE_SERVER_KEY) {
    const error = new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is not configured in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  const requestCode = requestCodeFromSession(session);
  if (!requestCode) {
    const error = new Error("Stripe session is missing Swadakta request_code metadata.");
    error.statusCode = 400;
    throw error;
  }

  if (session.payment_status !== "paid") {
    return {
      updated: false,
      request_code: requestCode,
      reason: `Ignored payment_status=${session.payment_status || "unknown"}.`,
    };
  }

  const amount = moneyFromSmallestUnit(session.amount_total || session.amount_subtotal);
  const reference = paymentReference(session);
  const request = await fetchRequestByCode(requestCode);
  if (!request) {
    return {
      updated: false,
      request_code: requestCode,
      reason: "No Swadakta request matched the Stripe request_code.",
      payment_reference: reference,
    };
  }

  const updatePayload = paymentReconciliationPayload({
    amount,
    currency: normalizeCurrency(session.currency),
    paymentReference: reference,
    providerName: "Stripe",
    request,
    successNotePrefix: "Stripe webhook confirmed payment",
  });

  const requestFilter = `id=eq.${encodeURIComponent(request.id)}`;
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
    const error = new Error(data?.message || "Could not update Swadakta request from Stripe webhook.");
    error.statusCode = 502;
    throw error;
  }

  const updated = Array.isArray(data) ? data[0] || null : null;
  return {
    updated: Boolean(updated),
    request_code: updated?.request_code || requestCode,
    payment_reference: reference,
    payment_status: updated?.payment_status || updatePayload.payment_status || request.payment_status,
    funds_status: updated?.funds_status || updatePayload.funds_status || request.funds_status,
    protected_amount: amount,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    sendJson(res, 503, { error: "STRIPE_WEBHOOK_SECRET is not configured." });
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    verifyStripeSignature(rawBody, req.headers["stripe-signature"], webhookSecret);

    const event = JSON.parse(rawBody);
    if (!HANDLED_EVENTS.has(event.type)) {
      sendJson(res, 200, { received: true, ignored: true, type: event.type });
      return;
    }

    const result = await updateRequestFromCheckout(event.data?.object || {});
    sendJson(res, 200, { received: true, type: event.type, result });
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || "Stripe webhook failed." });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
