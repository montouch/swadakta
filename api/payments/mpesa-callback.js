const {
  REQUEST_SELECT_FIELDS,
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

function verifyCallbackToken(req) {
  const expectedToken = process.env.MPESA_CALLBACK_TOKEN;
  if (!expectedToken) {
    return;
  }

  const url = new URL(req.url || "/api/payments/mpesa-callback", `https://${req.headers.host || "swadakta.com"}`);
  const actualToken = url.searchParams.get("token");
  if (actualToken !== expectedToken) {
    const error = new Error("Invalid M-Pesa callback token.");
    error.statusCode = 401;
    throw error;
  }
}

function metadataItem(items, name) {
  const item = Array.isArray(items) ? items.find((entry) => entry?.Name === name) : null;
  return item?.Value ?? "";
}

function callbackDetails(payload) {
  const callback = payload?.Body?.stkCallback;
  if (!callback) {
    const error = new Error("M-Pesa callback body is missing stkCallback.");
    error.statusCode = 400;
    throw error;
  }

  const items = callback.CallbackMetadata?.Item || [];
  return {
    merchant_request_id: callback.MerchantRequestID || "",
    checkout_request_id: callback.CheckoutRequestID || "",
    result_code: Number(callback.ResultCode),
    result_description: callback.ResultDesc || "",
    amount: Number(metadataItem(items, "Amount") || 0),
    receipt: String(metadataItem(items, "MpesaReceiptNumber") || ""),
    transaction_date: String(metadataItem(items, "TransactionDate") || ""),
    phone_number: String(metadataItem(items, "PhoneNumber") || ""),
  };
}

async function findRequestByCheckout(checkoutRequestId) {
  if (!SUPABASE_SERVER_KEY) {
    const error = new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is not configured in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  if (!checkoutRequestId) {
    const error = new Error("M-Pesa callback is missing CheckoutRequestID.");
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/service_requests?payment_reference=${encodeURIComponent(`ilike.*${checkoutRequestId}*`)}&select=${REQUEST_SELECT_FIELDS}&limit=1`,
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
    const error = new Error(data?.message || "Could not look up Swadakta request for M-Pesa callback.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function updateRequest(request, details) {
  const isPaid = details.result_code === 0;
  const referenceParts = [
    request.payment_reference,
    details.receipt ? `receipt ${details.receipt}` : "",
    details.phone_number ? `phone ${details.phone_number}` : "",
  ].filter(Boolean);

  const updatePayload = isPaid
    ? paymentReconciliationPayload({
        amount: details.amount,
        currency: "KES",
        paymentReference: referenceParts.join(" / "),
        providerName: "M-Pesa",
        request,
        successNotePrefix: "M-Pesa callback confirmed payment",
      })
    : {
        release_notes: `M-Pesa callback did not confirm payment. Result ${details.result_code}: ${details.result_description || "No result description."}`,
      };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/service_requests?id=eq.${encodeURIComponent(request.id)}`, {
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
    const error = new Error(data?.message || "Could not update Swadakta request from M-Pesa callback.");
    error.statusCode = 502;
    throw error;
  }

  return {
    updated: Array.isArray(data) && data.length > 0,
    request_code: request.request_code,
    paid: isPaid && updatePayload.payment_status === "paid",
    payment_status: updatePayload.payment_status || request.payment_status,
    funds_status: updatePayload.funds_status || request.funds_status,
    receipt: details.receipt || null,
    protected_amount: isPaid ? updatePayload.protected_amount : 0,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    verifyCallbackToken(req);
    const payload = await readJsonBody(req);
    const details = callbackDetails(payload);
    const request = await findRequestByCheckout(details.checkout_request_id);

    if (!request) {
      sendJson(res, 202, {
        received: true,
        updated: false,
        reason: "No Swadakta request matched the M-Pesa CheckoutRequestID.",
        checkout_request_id: details.checkout_request_id,
      });
      return;
    }

    const result = await updateRequest(request, details);
    sendJson(res, 200, { received: true, result });
  } catch (error) {
    sendJson(res, error.statusCode || 400, {
      error: error.message || "M-Pesa callback failed.",
    });
  }
};
