const crypto = require("crypto");

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

const STRIPE_CURRENCIES = new Set(["aud", "usd", "gbp", "eur"]);

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
    const error = new Error("Quote amount must be greater than zero before checkout.");
    error.statusCode = 400;
    throw error;
  }

  return Math.round(amount * 100);
}

function normalizeCurrency(value) {
  const currency = String(value || "AUD").trim().toLowerCase();
  if (!STRIPE_CURRENCIES.has(currency)) {
    const error = new Error("Stripe checkout is currently enabled for AUD, USD, GBP, and EUR quotes.");
    error.statusCode = 400;
    throw error;
  }

  return currency;
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
    const error = new Error("Only Swadakta admins can create checkout sessions.");
    error.statusCode = 403;
    throw error;
  }
}

function metadataValue(value) {
  return String(value || "").slice(0, 500);
}

function stripeIdempotencyKey({ requestCode, currency, unitAmount, paymentKind, servicePackage }) {
  const digest = crypto
    .createHash("sha256")
    .update([requestCode, currency, unitAmount, paymentKind, servicePackage].join("|"))
    .digest("hex")
    .slice(0, 24);

  return `swadakta-checkout-${requestCode}-${digest}`.slice(0, 255);
}

async function createStripeSession(payload) {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    const error = new Error("STRIPE_SECRET_KEY is not configured in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  const requestCode = requiredText(payload.request_code, "Request code").toUpperCase();
  const clientName = requiredText(payload.client_name, "Client name");
  const unitAmount = normalizeAmount(payload.quote_amount);
  const currency = normalizeCurrency(payload.quote_currency);
  const email = String(payload.email || "").trim();
  const servicePackage = metadataValue(payload.service_package || "quote_first");
  const fundsPlan = metadataValue(payload.funds_protection_preference || "quote_first");
  const valueBand = metadataValue(payload.job_value_band || "unsure");
  const paymentKind = metadataValue(payload.payment_kind || "client_quote");
  const idempotencyKey = stripeIdempotencyKey({
    requestCode,
    currency,
    unitAmount,
    paymentKind,
    servicePackage,
  });
  const baseUrl = PUBLIC_BASE_URL.replace(/\/$/, "");

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", requestCode);
  params.set("success_url", `${baseUrl}/portal?payment=success&request_code=${encodeURIComponent(requestCode)}&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${baseUrl}/portal?payment=cancelled&request_code=${encodeURIComponent(requestCode)}`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", currency);
  params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
  params.set("line_items[0][price_data][product_data][name]", `Swadakta service ${requestCode}`);
  params.set(
    "line_items[0][price_data][product_data][description]",
    `${clientName} - ${servicePackage.replaceAll("_", " ")}`,
  );
  params.set("metadata[request_code]", requestCode);
  params.set("metadata[payment_kind]", paymentKind);
  params.set("metadata[service_package]", servicePackage);
  params.set("metadata[funds_protection_preference]", fundsPlan);
  params.set("metadata[job_value_band]", valueBand);
  params.set("payment_intent_data[metadata][request_code]", requestCode);
  params.set("payment_intent_data[metadata][payment_kind]", paymentKind);

  if (email.includes("@")) {
    params.set("customer_email", email);
  }

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/x-www-form-urlencoded",
      "idempotency-key": idempotencyKey,
    },
    body: params,
  });

  const data = await stripeResponse.json();
  if (!stripeResponse.ok) {
    const error = new Error(data?.error?.message || "Stripe checkout session failed.");
    error.statusCode = stripeResponse.status;
    throw error;
  }

  return {
    id: data.id,
    url: data.url,
    payment_status: "invoice_sent",
    funds_status: "payment_link_sent",
    provider_reference: data.id,
    idempotency_key: idempotencyKey,
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
    const session = await createStripeSession(payload);
    sendJson(res, 200, session);
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Could not create checkout session.",
    });
  }
};
