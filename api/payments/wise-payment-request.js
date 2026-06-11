const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SWADAKTA_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_braRDOvu_VbLc6PItbElmg_3hK-Zg51";

const DEFAULT_WISE_CURRENCIES = new Set(["AUD", "USD", "GBP", "EUR"]);

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
    const error = new Error("Quote amount must be greater than zero before preparing a Wise request.");
    error.statusCode = 400;
    throw error;
  }

  return amount.toFixed(2);
}

function configuredWiseCurrencies() {
  const configured = String(process.env.WISE_SETTLEMENT_CURRENCIES || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  if (configured.length) {
    return new Set(configured);
  }

  if (String(process.env.WISE_ALLOW_KES || "").toLowerCase() === "true") {
    return new Set([...DEFAULT_WISE_CURRENCIES, "KES"]);
  }

  return DEFAULT_WISE_CURRENCIES;
}

function normalizeCurrency(value) {
  const currency = String(value || "AUD").trim().toUpperCase();
  const supportedCurrencies = configuredWiseCurrencies();
  if (!supportedCurrencies.has(currency)) {
    const error = new Error(
      `Wise request prep is enabled for ${Array.from(supportedCurrencies).join(", ")} quotes. Use M-Pesa, bank transfer, or configure WISE_SETTLEMENT_CURRENCIES for ${currency}.`,
    );
    error.statusCode = 400;
    throw error;
  }

  return currency;
}

function safePaymentUrl(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function configuredWisePaymentUrl() {
  const url = safePaymentUrl(
    process.env.WISE_PAYMENT_LINK_URL ||
      process.env.WISE_PAYMENT_REQUEST_URL ||
      process.env.WISE_RECEIVE_DETAILS_URL,
  );

  if (!url) {
    const error = new Error(
      "WISE_PAYMENT_LINK_URL or WISE_PAYMENT_REQUEST_URL is not configured in Vercel. Create a Wise Business payment link in Wise, then add it as an environment variable.",
    );
    error.statusCode = 503;
    throw error;
  }

  return url;
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
    const error = new Error("Only Swadakta admins can prepare Wise payment requests.");
    error.statusCode = 403;
    throw error;
  }
}

function buildProviderReference(requestCode) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  return `WISE-${requestCode}-${stamp}`;
}

async function createWisePaymentRequest(payload) {
  const requestCode = requiredText(payload.request_code, "Request code").toUpperCase();
  const clientName = requiredText(payload.client_name, "Client name");
  const amount = normalizeAmount(payload.quote_amount);
  const currency = normalizeCurrency(payload.quote_currency);
  const url = configuredWisePaymentUrl();
  const providerReference = buildProviderReference(requestCode);
  const servicePackage = String(payload.service_package || "quote_first").replaceAll("_", " ");

  return {
    id: providerReference,
    url,
    payment_status: "invoice_sent",
    funds_status: "payment_link_sent",
    provider_reference: providerReference,
    release_notes:
      "Wise request prepared. Do not mark paid or release any milestone until a Wise receipt, statement line, or bank confirmation matches the amount, sender, date, and Swadakta reference.",
    customer_message: [
      `Swadakta Wise payment request for ${requestCode}`,
      `Client: ${clientName}`,
      `Service: ${servicePackage}`,
      `Amount due: ${currency} ${amount}`,
      `Wise link: ${url}`,
      `Payment reference: ${providerReference}`,
      "Please include the payment reference when paying and send the Wise receipt after payment.",
      "Swadakta starts or continues protected work only after the payment is verified.",
    ].join("\n"),
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    await assertAdmin(req.headers.authorization);
    const payload = await readJsonBody(req);
    const request = await createWisePaymentRequest(payload);
    sendJson(res, 200, request);
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Could not prepare Wise payment request.",
    });
  }
};
