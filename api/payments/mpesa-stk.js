const { assertPaymentLaunchAllowed, paymentLaunchGateErrorBody } = require("../../lib/payment-launch-gate");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SWADAKTA_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_braRDOvu_VbLc6PItbElmg_3hK-Zg51";
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  process.env.SWADAKTA_PUBLIC_BASE_URL ||
  "https://swadakta.com";
const ACTIVE_MPESA_PAYMENT_STATUS = "invoice_sent";
const ACTIVE_MPESA_FUNDS_STATUS = "payment_link_sent";
const MPESA_REFERENCE_PREFIX = "M-Pesa STK";

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

function normalizeAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error("Quote amount must be greater than zero before sending M-Pesa STK Push.");
    error.statusCode = 400;
    throw error;
  }

  return Math.round(amount);
}

function normalizeCurrency(value) {
  const currency = String(value || "KES").trim().toUpperCase();
  if (currency !== "KES") {
    const error = new Error("M-Pesa STK Push is only enabled for KES quotes.");
    error.statusCode = 400;
    throw error;
  }

  return currency;
}

function normalizeKenyanPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = `254${digits.slice(1)}`;
  }

  if (/^[17]\d{8}$/.test(digits)) {
    digits = `254${digits}`;
  }

  if (!/^254[17]\d{8}$/.test(digits)) {
    const error = new Error("Enter a valid Kenyan M-Pesa phone number, for example +2547XXXXXXXX.");
    error.statusCode = 400;
    throw error;
  }

  return digits;
}

function sameMoneyAmount(left, right) {
  const leftAmount = Number(left);
  const rightAmount = Number(right);
  return Number.isFinite(leftAmount) && Number.isFinite(rightAmount) && Math.round(leftAmount) === Math.round(rightAmount);
}

function forceNewStk(value) {
  return value === true || String(value || "").trim().toLowerCase() === "true";
}

function maskPhone(phoneNumber) {
  return String(phoneNumber || "").replace(/^(\d{3})(\d+)(\d{4})$/, "$1****$3");
}

function mpesaReferenceParts(reference = "") {
  return String(reference || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function activeMpesaPromptFromRequest(request, amount, currency) {
  if (!request) return null;
  if (request.payment_status !== ACTIVE_MPESA_PAYMENT_STATUS || request.funds_status !== ACTIVE_MPESA_FUNDS_STATUS) {
    return null;
  }
  if (String(request.quote_currency || "").toUpperCase() !== currency) return null;
  if (!sameMoneyAmount(request.quote_amount, amount)) return null;

  const parts = mpesaReferenceParts(request.payment_reference);
  if (!parts[0] || !parts[0].startsWith(MPESA_REFERENCE_PREFIX)) return null;

  return {
    provider_reference: request.payment_reference,
    merchant_request_id: parts[1] || "",
    checkout_request_id: parts[2] || "",
  };
}

function mpesaBaseUrl() {
  if (process.env.MPESA_BASE_URL) {
    return process.env.MPESA_BASE_URL.replace(/\/$/, "");
  }

  const environment = String(process.env.MPESA_ENVIRONMENT || process.env.MPESA_MODE || "sandbox").toLowerCase();
  return environment === "live" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
}

function mpesaTimestamp(date = new Date()) {
  const nairobi = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const pad = (value) => String(value).padStart(2, "0");

  return [
    nairobi.getUTCFullYear(),
    pad(nairobi.getUTCMonth() + 1),
    pad(nairobi.getUTCDate()),
    pad(nairobi.getUTCHours()),
    pad(nairobi.getUTCMinutes()),
    pad(nairobi.getUTCSeconds()),
  ].join("");
}

function callbackUrl() {
  if (process.env.MPESA_CALLBACK_URL) {
    return process.env.MPESA_CALLBACK_URL;
  }

  const base = PUBLIC_BASE_URL.replace(/\/$/, "");
  const token = process.env.MPESA_CALLBACK_TOKEN;
  return `${base}/api/payments/mpesa-callback${token ? `?token=${encodeURIComponent(token)}` : ""}`;
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
    const error = new Error("Only Swadakta admins can send M-Pesa STK Push requests.");
    error.statusCode = 403;
    throw error;
  }
}

async function getMpesaAccessToken(baseUrl) {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    const error = new Error("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are not configured in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
    },
  });

  const data = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !data.access_token) {
    const error = new Error(data?.errorMessage || data?.error || "Could not get M-Pesa access token.");
    error.statusCode = tokenResponse.status || 502;
    throw error;
  }

  return data.access_token;
}

async function updateRequestAfterStk(authHeader, requestCode, updatePayload) {
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
    const error = new Error(data?.message || "M-Pesa STK sent, but Swadakta request update failed.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function findRequestByCode(authHeader, requestCode) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/service_requests?request_code=eq.${encodeURIComponent(requestCode)}&select=id,request_code,quote_amount,quote_currency,payment_status,funds_status,payment_reference,release_notes&limit=1`,
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
    const error = new Error(data?.message || "Could not inspect existing M-Pesa payment state.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function createMpesaStk(authHeader, payload) {
  const launchGate = assertPaymentLaunchAllowed("mpesa", payload);
  const requestCode = requiredText(payload.request_code, "Request code").toUpperCase();
  const amount = normalizeAmount(payload.quote_amount);
  const currency = normalizeCurrency(payload.quote_currency);
  const phoneNumber = normalizeKenyanPhone(payload.mpesa_phone || payload.phone_number || payload.whatsapp);
  const existingRequest = await findRequestByCode(authHeader, requestCode);
  const existingPrompt = forceNewStk(payload.force_new_stk)
    ? null
    : activeMpesaPromptFromRequest(existingRequest, amount, currency);

  if (existingPrompt) {
    return {
      id: existingPrompt.checkout_request_id || null,
      checkout_request_id: existingPrompt.checkout_request_id || null,
      merchant_request_id: existingPrompt.merchant_request_id || null,
      reused: true,
      launch_gate: launchGate,
      customer_message:
        "An active M-Pesa STK prompt is already recorded for this quote. Wait for the callback or send a new prompt only after confirming the previous one expired or failed.",
      payment_status: existingRequest.payment_status,
      funds_status: existingRequest.funds_status,
      provider_reference: existingPrompt.provider_reference,
      release_notes: existingRequest.release_notes,
      updated_request_id: existingRequest.id || null,
    };
  }

  const baseUrl = mpesaBaseUrl();
  const accessToken = await getMpesaAccessToken(baseUrl);
  const shortcode = requiredText(process.env.MPESA_SHORTCODE, "MPESA_SHORTCODE");
  const passkey = requiredText(process.env.MPESA_PASSKEY, "MPESA_PASSKEY");
  const timestamp = mpesaTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const transactionType = process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline";

  const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl(),
      AccountReference: requestCode.slice(0, 12),
      TransactionDesc: `Swadakta ${requestCode}`.slice(0, 40),
    }),
  });

  const data = await stkResponse.json().catch(() => ({}));
  if (!stkResponse.ok || (data.ResponseCode && String(data.ResponseCode) !== "0")) {
    const error = new Error(data?.errorMessage || data?.ResponseDescription || "M-Pesa STK Push failed.");
    error.statusCode = stkResponse.status || 502;
    throw error;
  }

  const providerReference = [
    "M-Pesa STK",
    data.MerchantRequestID,
    data.CheckoutRequestID,
  ]
    .filter(Boolean)
    .join(" / ");
  const releaseNotes =
    `M-Pesa STK Push sent for ${currency} ${amount} to ${maskPhone(phoneNumber)}. Callback must confirm payment before funds are marked paid. Duplicate STK prompts are suppressed for the same active quote unless force_new_stk is explicitly set after expiry/failure. Founder/admin must still review milestone proof before any receiver release.`;
  const updatePayload = {
    payment_status: "invoice_sent",
    funds_status: "payment_link_sent",
    quote_amount: amount,
    quote_currency: currency,
    payment_reference: providerReference,
    release_notes: releaseNotes,
  };
  const updatedRequest = await updateRequestAfterStk(authHeader, requestCode, updatePayload);

  return {
    id: data.CheckoutRequestID,
    checkout_request_id: data.CheckoutRequestID,
    merchant_request_id: data.MerchantRequestID,
    launch_gate: launchGate,
    reused: false,
    customer_message: data.CustomerMessage || data.ResponseDescription || "M-Pesa prompt sent.",
    payment_status: updatePayload.payment_status,
    funds_status: updatePayload.funds_status,
    provider_reference: providerReference,
    release_notes: updatePayload.release_notes,
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
    const result = await createMpesaStk(req.headers.authorization, payload);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, paymentLaunchGateErrorBody(error, "Could not send M-Pesa STK Push."));
  }
};
