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
const EXPECTED_APP_DATA_REF = "app-data.js?v=44";
const EXPECTED_PORTAL_SCRIPT_REF = "stitch-portal.js?v=26";
const PROOF_BUCKET_ID = "swadakta-proof";

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
  securityTxt: "https://www.rfc-editor.org/info/rfc9116/",
  vercelHeaders: "https://vercel.com/docs/headers",
  supabaseApiSecurity: "https://supabase.com/docs/guides/api/securing-your-api",
  supabaseRls: "https://supabase.com/docs/guides/database/postgres/row-level-security",
  supabaseStorage: "https://supabase.com/docs/guides/storage",
  supabaseStorageAccess: "https://supabase.com/docs/guides/storage/security/access-control",
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

async function fetchPublic(path, options = {}) {
  const base = publicUrl();
  if (!base) {
    return { ok: false, status: 0, text: "", headers: new Headers(), error: "PUBLIC_BASE_URL is not a valid URL." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 3500);
  try {
    const response = await fetch(`${base}${path}`, {
      method: options.method || "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    const text = options.readText === false ? "" : await response.text().catch(() => "");
    return {
      ok: response.ok,
      status: response.status,
      text,
      headers: response.headers,
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: "",
      headers: new Headers(),
      error: error.name === "AbortError" ? "Timed out while checking public URL." : error.message || "Public URL check failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSupabaseRest(path, authHeader, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 4500);

  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: authHeader,
        accept: "application/json",
        "content-type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const text = options.readText === false ? "" : await response.text().catch(() => "");
    return {
      ok: response.ok,
      status: response.status,
      text,
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: "",
      error: error.name === "AbortError" ? "Timed out while checking Supabase." : error.message || "Supabase check failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSupabaseStorage(path, authHeader, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 4500);

  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: authHeader,
        accept: "application/json",
        "content-type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const text = options.readText === false ? "" : await response.text().catch(() => "");
    let json = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {}
    }
    return {
      ok: response.ok,
      status: response.status,
      text,
      json,
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: "",
      json: null,
      error: error.name === "AbortError" ? "Timed out while checking Supabase Storage." : error.message || "Storage check failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function accountBackendItems(authHeader) {
  const [profileRpc, verificationRpc, adminProfileRead] = await Promise.all([
    fetchSupabaseRest("/rest/v1/rpc/get_my_account_profile", authHeader, {
      method: "POST",
      body: {},
    }),
    fetchSupabaseRest("/rest/v1/rpc/list_my_identity_verification_requests", authHeader, {
      method: "POST",
      body: {},
    }),
    fetchSupabaseRest("/rest/v1/account_profiles?select=user_id&limit=1", authHeader, {
      readText: false,
    }),
  ]);

  return [
    item(
      "account_profile_read_rpc",
      "Account profile read RPC",
      profileRpc.ok ? "ready" : "warning",
      profileRpc.ok
        ? "get_my_account_profile responded through Supabase REST for the signed-in admin session."
        : `Profile RPC check returned ${profileRpc.status || profileRpc.error}.`,
      profileRpc.ok
        ? "Users can land in account home while profile details load through the safe RPC path."
        : "Apply the get_my_account_profile RPC migration and grants before onboarding more users.",
      profileRpc.ok ? [] : ["get_my_account_profile"],
      {
        docs_url: DOCS.supabaseApiSecurity,
        priority: 11,
        owner: "Founder/Supabase admin",
      },
    ),
    item(
      "identity_queue_read_rpc",
      "Identity queue read RPC",
      verificationRpc.ok ? "ready" : "warning",
      verificationRpc.ok
        ? "list_my_identity_verification_requests responded for the signed-in admin session."
        : `Identity queue RPC check returned ${verificationRpc.status || verificationRpc.error}.`,
      verificationRpc.ok
        ? "Signed-in users can see verification request status without founder manual lookup."
        : "Apply identity verification queue RPC migrations and grants before relying on provider-led verification.",
      verificationRpc.ok ? [] : ["list_my_identity_verification_requests"],
      {
        docs_url: DOCS.supabaseRls,
        priority: 15,
        owner: "Founder/Supabase admin",
      },
    ),
    item(
      "admin_profile_read_policy",
      "Admin account profile read policy",
      adminProfileRead.ok ? "ready" : "warning",
      adminProfileRead.ok
        ? "The admin session can reach account_profiles through RLS without exposing profile rows in this report."
        : `Account profile policy check returned ${adminProfileRead.status || adminProfileRead.error}.`,
      adminProfileRead.ok
        ? "Admin tools can inspect onboarding and verification status when needed."
        : "Check account_profiles grants plus admin read RLS policy.",
      adminProfileRead.ok ? [] : ["account_profiles select policy"],
      {
        docs_url: DOCS.supabaseApiSecurity,
        priority: 16,
        owner: "Founder/Supabase admin",
      },
    ),
  ];
}

async function storageBackendItems(user, authHeader) {
  const safeUserId = encodeURIComponent(user.id || "admin");
  const [bucket, listProbe] = await Promise.all([
    fetchSupabaseStorage(`/storage/v1/bucket/${PROOF_BUCKET_ID}`, authHeader),
    fetchSupabaseStorage(`/storage/v1/object/list/${PROOF_BUCKET_ID}`, authHeader, {
      method: "POST",
      body: {
        prefix: `${safeUserId}/account-profile`,
        limit: 1,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      },
    }),
  ]);

  const bucketJson = bucket.json || {};
  const bucketPrivate = bucket.ok && bucketJson.public === false;
  const allowedTypes = Array.isArray(bucketJson.allowed_mime_types) ? bucketJson.allowed_mime_types : [];
  const expectedMimeTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf"];
  const missingMimeTypes = expectedMimeTypes.filter((type) => !allowedTypes.includes(type));
  const sizeLimit = Number(bucketJson.file_size_limit || 0);
  const hasReasonableSizeLimit = sizeLimit >= 6 * 1024 * 1024;

  return [
    item(
      "private_proof_media_bucket",
      "Private proof/profile media bucket",
      bucketPrivate && missingMimeTypes.length === 0 && hasReasonableSizeLimit ? "ready" : bucket.ok ? "warning" : "missing",
      bucket.ok
        ? `${PROOF_BUCKET_ID} bucket responded through Supabase Storage and is ${bucketPrivate ? "private" : "not private"}.`
        : `Storage bucket check returned ${bucket.status || bucket.error}.`,
      bucketPrivate && missingMimeTypes.length === 0 && hasReasonableSizeLimit
        ? "Client proof, receiver profile photos, and proof samples can share the private user-folder storage path."
        : "Keep the bucket private, allow profile/proof MIME types, and keep the 6MB launch upload limit active.",
      [
        ...(bucketPrivate ? [] : ["private bucket"]),
        ...missingMimeTypes,
        ...(hasReasonableSizeLimit ? [] : ["6MB file size limit"]),
      ],
      {
        docs_url: DOCS.supabaseStorage,
        priority: 17,
        owner: "Founder/Supabase admin",
      },
    ),
    item(
      "storage_read_policy_probe",
      "Storage read policy probe",
      listProbe.ok ? "ready" : "warning",
      listProbe.ok
        ? "The signed-in admin session can list its own account-profile folder through Storage policies."
        : `Storage object list probe returned ${listProbe.status || listProbe.error}.`,
      listProbe.ok
        ? "This proves the private bucket read path is reachable; uploads still depend on the per-user INSERT policy."
        : "Check storage.objects SELECT policy for user-owned folders and admin access.",
      listProbe.ok ? [] : ["storage.objects SELECT policy"],
      {
        docs_url: DOCS.supabaseStorageAccess,
        priority: 18,
        owner: "Founder/Supabase admin",
      },
    ),
  ];
}

async function siteTrustItems() {
  const [home, portal, security, privacy, terms, robots, sitemap, adminReadiness] = await Promise.all([
    fetchPublic("/", { readText: false }),
    fetchPublic("/portal"),
    fetchPublic("/.well-known/security.txt"),
    fetchPublic("/privacy"),
    fetchPublic("/terms"),
    fetchPublic("/robots.txt"),
    fetchPublic("/sitemap.xml"),
    fetchPublic("/admin-readiness", { readText: false }),
  ]);

  const requiredSecurityHeaders = [
    "content-security-policy",
    "strict-transport-security",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
  ];
  const missingSecurityHeaders = requiredSecurityHeaders.filter((header) => !home.headers.get(header));
  const legalMissing = [
    privacy.ok && /Global Corridor Concierge/i.test(privacy.text) ? "" : "privacy",
    terms.ok && /Global Corridor Concierge/i.test(terms.text) ? "" : "terms",
  ].filter(Boolean);
  const securityTxtMissing = [
    security.ok && /Contact:\s*mailto:/i.test(security.text) ? "" : "Contact",
    security.ok && /Canonical:\s*https:\/\/swadakta\.com\/\.well-known\/security\.txt/i.test(security.text) ? "" : "Canonical",
    security.ok && /Expires:/i.test(security.text) ? "" : "Expires",
  ].filter(Boolean);
  const publicFilesMissing = [
    robots.ok ? "" : "robots.txt",
    sitemap.ok && /<urlset/i.test(sitemap.text) ? "" : "sitemap.xml",
  ].filter(Boolean);
  const adminNoindex = String(adminReadiness.headers.get("x-robots-tag") || "");
  const portalBundleMissing = [
    portal.ok && portal.text.includes(EXPECTED_APP_DATA_REF) ? "" : EXPECTED_APP_DATA_REF,
    portal.ok && portal.text.includes(EXPECTED_PORTAL_SCRIPT_REF) ? "" : EXPECTED_PORTAL_SCRIPT_REF,
  ].filter(Boolean);

  return [
    item(
      "account_portal_bundle",
      "Account portal bundle",
      portal.ok && portalBundleMissing.length === 0 ? "ready" : "warning",
      portal.ok
        ? "Live account portal was checked for the current account data and Stitch portal scripts."
        : `Could not check live account portal: ${portal.error || portal.status}.`,
      portalBundleMissing.length
        ? "Redeploy or invalidate cache before showing sign-in/account flow to users."
        : "Live account portal is serving the expected account home/sign-in bundle.",
      portalBundleMissing,
      {
        copy_value: `${publicUrl() || "https://swadakta.com"}/portal`,
        priority: 13,
        owner: "Founder/Vercel admin",
      },
    ),
    item(
      "live_security_headers",
      "Live security headers",
      home.ok && missingSecurityHeaders.length === 0 ? "ready" : "warning",
      home.ok
        ? "Public homepage responds and was checked for CSP, HSTS, nosniff, referrer policy, and permissions policy."
        : `Could not check public homepage: ${home.error || home.status}.`,
      missingSecurityHeaders.length
        ? "Keep Vercel security headers active for the public domain before paid traffic."
        : "Security headers are present on the public domain.",
      missingSecurityHeaders,
      {
        docs_url: DOCS.vercelHeaders,
        priority: 14,
        owner: "Founder/Vercel admin",
      },
    ),
    item(
      "security_txt",
      "Security contact file",
      securityTxtMissing.length ? "warning" : "ready",
      security.ok
        ? "security.txt is reachable at the well-known URL and exposes vulnerability-reporting contact metadata."
        : `security.txt check failed: ${security.error || security.status}.`,
      "Keep Contact, Canonical, and Expires current so researchers know how to report issues safely.",
      securityTxtMissing,
      {
        docs_url: DOCS.securityTxt,
        copy_value: `${publicUrl() || "https://swadakta.com"}/.well-known/security.txt`,
        priority: 16,
        owner: "Founder/security contact",
      },
    ),
    item(
      "legal_trust_pages",
      "Terms and privacy pages",
      legalMissing.length ? "warning" : "ready",
      "Public trust pages should describe the global corridor model, identity checks, provider-held payments, restricted goods, and privacy boundaries.",
      legalMissing.length
        ? "Publish updated global Terms and Privacy before wider launch."
        : "Terms and Privacy are reachable and use global corridor language.",
      legalMissing,
      {
        priority: 17,
        owner: "Founder/legal reviewer",
      },
    ),
    item(
      "search_files",
      "Robots and sitemap",
      publicFilesMissing.length ? "warning" : "ready",
      "robots.txt and sitemap.xml help the public site be discoverable while admin surfaces stay hidden.",
      publicFilesMissing.length ? "Publish robots.txt and sitemap.xml at the domain root." : "robots.txt and sitemap.xml are reachable.",
      publicFilesMissing,
      {
        copy_value: `${publicUrl() || "https://swadakta.com"}/sitemap.xml`,
        priority: 55,
        owner: "Founder/Vercel admin",
      },
    ),
    item(
      "admin_noindex",
      "Admin noindex protection",
      /noindex/i.test(adminNoindex) ? "ready" : "warning",
      /noindex/i.test(adminNoindex)
        ? "Admin readiness page returns an X-Robots-Tag noindex header."
        : "Admin readiness page did not expose an X-Robots-Tag noindex signal in the public check.",
      "Keep admin, auth, and readiness pages out of search indexes.",
      /noindex/i.test(adminNoindex) ? [] : ["X-Robots-Tag"],
      {
        docs_url: DOCS.vercelHeaders,
        priority: 18,
        owner: "Founder/Vercel admin",
      },
    ),
  ];
}

async function readinessReport(user, authHeader) {
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
      id: "public_trust",
      label: "Public trust and domain safety",
      items: await siteTrustItems(),
    },
    {
      id: "account_onboarding",
      label: "Account onboarding backend",
      items: await accountBackendItems(authHeader),
    },
    {
      id: "storage_media",
      label: "Private media and proof storage",
      items: await storageBackendItems(user, authHeader),
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
    sendJson(res, 200, await readinessReport(user, req.headers.authorization));
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Could not load operations readiness.",
    });
  }
};
