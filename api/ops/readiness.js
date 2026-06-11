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

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function hasEnv(name) {
  return Boolean(String(process.env[name] || "").trim());
}

function anyEnv(names) {
  return names.some(hasEnv);
}

function missingEnv(names) {
  return names.filter((name) => !hasEnv(name));
}

function missingStatus(names) {
  return missingEnv(names).length ? "missing" : "ready";
}

function publicUrl() {
  try {
    return new URL(PUBLIC_BASE_URL).origin;
  } catch {
    return "";
  }
}

function publicHost() {
  try {
    return new URL(PUBLIC_BASE_URL).host;
  } catch {
    return "invalid";
  }
}

function supabaseHost() {
  try {
    return new URL(SUPABASE_URL).host;
  } catch {
    return "invalid";
  }
}

function paypalMode() {
  return String(process.env.PAYPAL_ENVIRONMENT || process.env.PAYPAL_MODE || "live").toLowerCase() === "sandbox"
    ? "sandbox"
    : "live";
}

function mpesaMode() {
  return String(process.env.MPESA_ENVIRONMENT || process.env.MPESA_MODE || "sandbox").toLowerCase() === "live"
    ? "live"
    : "sandbox";
}

function mpesaCallbackUrl() {
  if (hasEnv("MPESA_CALLBACK_URL")) {
    return "Custom callback URL configured";
  }

  const base = publicUrl() || "https://swadakta.com";
  return `${base}/api/payments/mpesa-callback`;
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
    const error = new Error("Only Swadakta admins can view operations readiness.");
    error.statusCode = 403;
    throw error;
  }

  return { id: userId, email: user.email || "" };
}

const DOCS = {
  vercelEnv: "https://vercel.com/docs/environment-variables",
  stripeCheckout: "https://docs.stripe.com/api/checkout/sessions",
  stripeWebhooks: "https://docs.stripe.com/webhooks",
  paypalOrders: "https://developer.paypal.com/docs/api/orders/v2/",
  daraja: "https://developer.safaricom.co.ke/",
  smileIdWeb: "https://docs.usesmileid.com/integration-options/web-mobile-web/web-integration",
  smileIdDocument: "https://docs.usesmileid.com/products/for-individuals-kyc/document-verification/document-verification",
  wiseBusiness: "https://wise.com/help/articles/2ns36RddtM1kAb5vbWxGMx/getting-paid-to-your-wise-business-by-card-apple-pay-or-google-pay",
};

function item(id, label, status, detail, next, missing = [], options = {}) {
  return {
    id,
    label,
    status,
    detail,
    next,
    missing,
    docs_url: options.docs_url || "",
    copy_value: options.copy_value || "",
    priority: Number.isFinite(options.priority) ? options.priority : 50,
    owner: options.owner || "Founder/admin",
  };
}

function buildNextActions(categories) {
  return categories
    .flatMap((category) =>
      (category.items || []).map((entry) => ({
        category: category.label,
        id: entry.id,
        label: entry.label,
        status: entry.status,
        next: entry.next,
        missing: entry.missing || [],
        docs_url: entry.docs_url || "",
        copy_value: entry.copy_value || "",
        owner: entry.owner || "Founder/admin",
        priority: entry.priority || 50,
      })),
    )
    .filter((entry) => entry.status !== "ready")
    .sort((a, b) => a.priority - b.priority || String(a.label).localeCompare(String(b.label)))
    .slice(0, 8);
}

function readinessReport(user) {
  const serviceRoleConfigured = anyEnv([
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "SWADAKTA_SUPABASE_SERVICE_ROLE_KEY",
  ]);
  const stripeWebhookMissing = missingEnv(["STRIPE_WEBHOOK_SECRET"]);
  const paypalMissing = missingEnv(["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]);
  const mpesaMissing = missingEnv([
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_SHORTCODE",
    "MPESA_PASSKEY",
  ]);
  const wiseConfigured = anyEnv([
    "WISE_PAYMENT_LINK_URL",
    "WISE_PAYMENT_REQUEST_URL",
    "WISE_RECEIVE_DETAILS_URL",
  ]);
  const smileIdConfigured = hasEnv("SMILE_ID_API_KEY") && hasEnv("SMILE_ID_PARTNER_ID");
  const stripeWebhookUrl = `${publicUrl() || "https://swadakta.com"}/api/payments/stripe-webhook`;
  const mpesaWebhookUrl = mpesaCallbackUrl();

  const categories = [
    {
      id: "domain_auth",
      label: "Domain, auth, and backend",
      items: [
        item(
          "public_base_url",
          "Public base URL",
          publicUrl() === "https://swadakta.com" ? "ready" : "warning",
          `Callbacks and payment returns use ${publicHost()}.`,
          "Keep PUBLIC_BASE_URL or SWADAKTA_PUBLIC_BASE_URL pointed at https://swadakta.com.",
          [],
          { docs_url: DOCS.vercelEnv, priority: 8, owner: "Founder/Vercel admin" },
        ),
        item(
          "supabase_project",
          "Supabase project",
          SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY ? "ready" : "missing",
          `Auth and admin checks use ${supabaseHost()}.`,
          "Keep only the publishable key in browser config; service-role keys stay server-side.",
          [],
          { priority: 10, owner: "Founder/Supabase admin" },
        ),
        item(
          "admin_guard",
          "Admin guard",
          "ready",
          `Readiness checked for ${user.email || user.id}.`,
          "API diagnostics require a Supabase session plus an admin_users row.",
          [],
          { priority: 12, owner: "Founder/Supabase admin" },
        ),
      ],
    },
    {
      id: "payments",
      label: "Payment rails",
      items: [
        item(
          "stripe_checkout",
          "Stripe Checkout",
          missingStatus(["STRIPE_SECRET_KEY"]),
          "Admin can generate card checkout links for AUD, USD, GBP, and EUR when configured.",
          "Add STRIPE_SECRET_KEY in Vercel production env before using Stripe checkout.",
          missingEnv(["STRIPE_SECRET_KEY"]),
          {
            docs_url: DOCS.stripeCheckout,
            priority: 20,
            owner: "Founder/Stripe admin",
          },
        ),
        item(
          "stripe_webhook",
          "Stripe webhook confirmation",
          stripeWebhookMissing.length || !serviceRoleConfigured ? "missing" : "ready",
          "Webhook can mark provider-confirmed Stripe payments without releasing receiver funds.",
          `Set STRIPE_WEBHOOK_SECRET plus a server-only Supabase key for payment confirmation. Endpoint: ${stripeWebhookUrl}`,
          [...stripeWebhookMissing, ...(serviceRoleConfigured ? [] : ["SUPABASE_SERVICE_ROLE_KEY"])],
          {
            docs_url: DOCS.stripeWebhooks,
            copy_value: stripeWebhookUrl,
            priority: 22,
            owner: "Founder/Stripe admin",
          },
        ),
        item(
          "paypal_orders",
          "PayPal order and capture",
          paypalMissing.length ? "missing" : "ready",
          `PayPal API mode is ${paypalMode()}.`,
          "Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET, then test order creation and capture.",
          paypalMissing,
          {
            docs_url: DOCS.paypalOrders,
            priority: 26,
            owner: "Founder/PayPal admin",
          },
        ),
        item(
          "mpesa_stk",
          "M-Pesa STK Push",
          mpesaMissing.length ? "missing" : mpesaMode() === "sandbox" ? "manual" : "ready",
          `Daraja mode is ${mpesaMode()}; callback is ${mpesaCallbackUrl()}.`,
          "Use sandbox until Safaricom business credentials, PayBill/Till, and callback approval are ready.",
          mpesaMissing,
          {
            docs_url: DOCS.daraja,
            copy_value: mpesaWebhookUrl,
            priority: 30,
            owner: "Founder/Safaricom admin",
          },
        ),
        item(
          "mpesa_callback",
          "M-Pesa callback protection",
          !serviceRoleConfigured ? "missing" : hasEnv("MPESA_CALLBACK_TOKEN") ? "ready" : "warning",
          hasEnv("MPESA_CALLBACK_TOKEN")
            ? "Callback token is configured."
            : "Callback works, but a token is recommended so random callbacks cannot hit the endpoint.",
          "Set MPESA_CALLBACK_TOKEN and register the full callback URL with Safaricom.",
          serviceRoleConfigured ? [] : ["SUPABASE_SERVICE_ROLE_KEY"],
          {
            docs_url: DOCS.daraja,
            copy_value: mpesaWebhookUrl,
            priority: 31,
            owner: "Founder/Safaricom admin",
          },
        ),
        item(
          "wise_fallback",
          "Wise fallback transfer",
          wiseConfigured ? "ready" : "missing",
          "Wise stays hidden as an admin fallback after easier card, PayPal, M-Pesa, or bank routes fail.",
          "Add WISE_PAYMENT_LINK_URL, WISE_PAYMENT_REQUEST_URL, or WISE_RECEIVE_DETAILS_URL only for fallback work.",
          wiseConfigured ? [] : ["WISE_PAYMENT_LINK_URL"],
          {
            docs_url: DOCS.wiseBusiness,
            priority: 60,
            owner: "Founder/Wise admin",
          },
        ),
      ],
    },
    {
      id: "ai_identity",
      label: "AI and identity verification",
      items: [
        item(
          "openai_vercel",
          "Vercel AI fallback",
          hasEnv("OPENAI_API_KEY") ? "ready" : "missing",
          `Fallback model is ${process.env.OPENAI_MODEL || "gpt-5.5"}.`,
          "Set OPENAI_API_KEY in Vercel for founder/admin AI drafts when the Supabase Edge Function is unavailable.",
          hasEnv("OPENAI_API_KEY") ? [] : ["OPENAI_API_KEY"],
          {
            docs_url: DOCS.vercelEnv,
            priority: 18,
            owner: "Founder/Vercel admin",
          },
        ),
        item(
          "supabase_edge_ai",
          "Supabase Edge AI",
          "manual",
          "Edge Function deployment and secrets are managed in Supabase, outside this Vercel environment.",
          "Keep the swadakta-assistant Edge Function deployed and set OPENAI_API_KEY as a Supabase secret.",
          [],
          { priority: 19, owner: "Founder/Supabase admin" },
        ),
        item(
          "manual_id_links",
          "Manual provider ID links",
          "ready",
          "Admin can store provider, status, verification link, reference, verified time, and notes for every account and receiver.",
          "Use this while provider API sessions are not automated.",
          [],
          { docs_url: DOCS.smileIdWeb, priority: 36, owner: "Founder/admin" },
        ),
        item(
          "smile_id_api",
          "Smile ID API sessions",
          smileIdConfigured ? "manual" : "missing",
          "Provider API session creation is planned; current workflow supports storing provider links manually.",
          "After Smile ID credentials are approved, add server-side session creation and webhook handling.",
          smileIdConfigured ? [] : ["SMILE_ID_API_KEY", "SMILE_ID_PARTNER_ID"],
          {
            docs_url: DOCS.smileIdDocument,
            priority: 34,
            owner: "Founder/Smile ID admin",
          },
        ),
      ],
    },
  ];

  const flatItems = categories.flatMap((category) => category.items);
  const counts = flatItems.reduce(
    (acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    },
    { ready: 0, missing: 0, warning: 0, manual: 0 },
  );

  return {
    generated_at: new Date().toISOString(),
    environment: {
      vercel_env: process.env.VERCEL_ENV || "local-or-unknown",
      public_base_url: publicHost(),
      supabase_host: supabaseHost(),
    },
    counts,
    categories,
    next_actions: buildNextActions(categories),
    safe_copy_values: {
      stripe_webhook_url: stripeWebhookUrl,
      mpesa_callback_url: mpesaWebhookUrl,
    },
    protected_actions: [
      "Money release, refund, paid status, and milestone release stay founder/admin decisions.",
      "ID verification and receiver vetting stay founder/admin decisions until provider webhooks are fully integrated.",
      "AI can draft and triage, but it must not contact clients, assign receivers, or claim legal/customs certainty.",
    ],
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const user = await assertAdmin(req.headers.authorization);
    sendJson(res, 200, readinessReport(user));
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Could not load operations readiness.",
    });
  }
};
