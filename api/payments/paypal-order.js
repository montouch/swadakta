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

const PAYPAL_CURRENCIES = new Set(["AUD", "USD", "GBP", "EUR"]);

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
    const error = new Error("Quote amount must be greater than zero before creating a PayPal order.");
    error.statusCode = 400;
    throw error;
  }

  return amount.toFixed(2);
}

function normalizeCurrency(value) {
  const currency = String(value || "AUD").trim().toUpperCase();
  if (!PAYPAL_CURRENCIES.has(currency)) {
    const error = new Error("PayPal order creation is currently enabled for AUD, USD, GBP, and EUR quotes.");
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
    const error = new Error("Only Swadakta admins can create PayPal orders.");
    error.statusCode = 403;
    throw error;
  }
}

function paypalBaseUrl() {
  if (process.env.PAYPAL_BASE_URL) {
    return process.env.PAYPAL_BASE_URL.replace(/\/$/, "");
  }

  const mode = String(process.env.PAYPAL_ENVIRONMENT || process.env.PAYPAL_MODE || "live").toLowerCase();
  return mode === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
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

function approvalUrl(order) {
  const links = Array.isArray(order.links) ? order.links : [];
  const link = links.find((item) => item.rel === "payer-action") || links.find((item) => item.rel === "approve");
  return link?.href || "";
}

function paypalRequestId({ requestCode, amount, currency }) {
  return `swadakta-order-${requestCode}-${currency}-${String(amount).replace(".", "-")}`.slice(0, 10000);
}

async function createPayPalOrder(payload) {
  const launchGate = assertPaymentLaunchAllowed("paypal", payload);
  const requestCode = requiredText(payload.request_code, "Request code").toUpperCase();
  const clientName = requiredText(payload.client_name, "Client name");
  const amount = normalizeAmount(payload.quote_amount);
  const currency = normalizeCurrency(payload.quote_currency);
  const baseUrl = paypalBaseUrl();
  const accessToken = await getPayPalAccessToken(baseUrl);
  const publicBaseUrl = PUBLIC_BASE_URL.replace(/\/$/, "");
  const servicePackage = String(payload.service_package || "quote_first").replaceAll("_", " ").slice(0, 120);

  const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": paypalRequestId({ requestCode, amount, currency }),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: requestCode,
          custom_id: requestCode,
          invoice_id: requestCode,
          description: `Swadakta ${servicePackage} for ${clientName}`.slice(0, 127),
          amount: {
            currency_code: currency,
            value: amount,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Swadakta",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: `${publicBaseUrl}/portal?payment=paypal-success&request_code=${encodeURIComponent(requestCode)}`,
            cancel_url: `${publicBaseUrl}/portal?payment=paypal-cancelled&request_code=${encodeURIComponent(requestCode)}`,
          },
        },
      },
    }),
  });

  const data = await orderResponse.json();
  if (!orderResponse.ok) {
    const error = new Error(data?.message || data?.details?.[0]?.description || "PayPal order creation failed.");
    error.statusCode = orderResponse.status;
    throw error;
  }

  const url = approvalUrl(data);
  if (!url) {
    const error = new Error("PayPal did not return an approval URL.");
    error.statusCode = 502;
    throw error;
  }

  return {
    id: data.id,
    url,
    launch_gate: launchGate,
    payment_status: "invoice_sent",
    funds_status: "payment_link_sent",
    provider_reference: data.id,
    idempotency_key: paypalRequestId({ requestCode, amount, currency }),
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
    const order = await createPayPalOrder(payload);
    sendJson(res, 200, order);
  } catch (error) {
    sendJson(res, error.statusCode || 500, paymentLaunchGateErrorBody(error, "Could not create PayPal order."));
  }
};
