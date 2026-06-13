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
const EXPECTED_APP_DATA_REF = "app-data.js?v=62";
const EXPECTED_PORTAL_SCRIPT_REF = "stitch-portal.js?v=36";
const EXPECTED_FINAL_UX_THEME_REF = "final-ux-theme.css?v=3";
const FINAL_UX_THEME_MARKERS = [
  "--sw-primary: #000105",
  "final-ux-sitewide-shell-v2",
  'body:not([data-admin-theme="dark"])',
  ".primary-glass-button",
  "overflow-wrap: anywhere",
];
const FINAL_UX_PORTAL_MARKERS = ["account-home-workflow-first-final-ux", "What do you want to do?"];
const LEGACY_PURPLE_UI_MARKERS = ["#4648d4", "#8127cf", "rgba(70,72,212", "rgba(70, 72, 212"];
const PROOF_BUCKET_ID = "swadakta-proof";
const PUBLIC_SITEMAP_URLS = [
  "https://swadakta.com/",
  "https://swadakta.com/corridor",
  "https://swadakta.com/trust",
  "https://swadakta.com/payments",
  "https://swadakta.com/rules",
  "https://swadakta.com/privacy",
  "https://swadakta.com/terms",
];
const PRIVATE_SITEMAP_MARKERS = [
  "/admin",
  "/auth",
  "/login",
  "/portal",
  "/brief",
  "/tracking",
  "/verification",
  "/assistant",
  "/messages",
  "/notifications",
  "/resolution",
];
const EXPECTED_SITEMAP_LASTMOD = "2026-06-13";

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

function supabaseProjectRef() {
  const host = supabaseHost();
  return host.endsWith(".supabase.co") ? host.replace(".supabase.co", "") : "";
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

function sitemapMissingItems(text = "") {
  const lastmods = [...String(text || "").matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
  return [
    /<urlset\b/i.test(text) ? "" : "urlset",
    ...PUBLIC_SITEMAP_URLS.map((url) => (text.includes(`<loc>${url}</loc>`) ? "" : url)),
    ...PRIVATE_SITEMAP_MARKERS.map((marker) => (text.includes(marker) ? `private ${marker}` : "")),
    lastmods.length === PUBLIC_SITEMAP_URLS.length ? "" : "lastmod count",
    ...lastmods.map((lastmod) => (lastmod === EXPECTED_SITEMAP_LASTMOD ? "" : `stale lastmod ${lastmod}`)),
  ].filter(Boolean);
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
  paystackPayments: "https://paystack.com/docs/payments/",
  paystackWebhooks: "https://paystack.com/docs/payments/webhooks/",
  paystackVerifyPayments: "https://paystack.com/docs/payments/verify-payments/",
  flutterwaveStandard: "https://developer.flutterwave.com/docs/flutterwave-standard",
  flutterwaveWebhooks: "https://developer.flutterwave.com/docs/webhooks",
  smileIdWeb: "https://docs.usesmileid.com/integration-options/web-mobile-web/web-integration",
  smileIdDocument: "https://docs.usesmileid.com/products/for-individuals-kyc/document-verification/document-verification",
  sumsubWebSdk: "https://docs.sumsub.com/docs/websdk",
  sumsubWebsdkLink: "https://docs.sumsub.com/reference/generate-websdk-external-link",
  sumsubWebhooks: "https://docs.sumsub.com/docs/webhook-manager",
  youverifyDocs: "https://doc.youverify.co/",
  wiseBusiness: "https://wise.com/help/articles/2ns36RddtM1kAb5vbWxGMx/getting-paid-to-your-wise-business-by-card-apple-pay-or-google-pay",
  securityTxt: "https://www.rfc-editor.org/info/rfc9116/",
  vercelHeaders: "https://vercel.com/docs/headers",
  supabaseApiSecurity: "https://supabase.com/docs/guides/api/securing-your-api",
  supabaseRedirectUrls: "https://supabase.com/docs/guides/auth/redirect-urls",
  supabaseAuthSmtp: "https://supabase.com/docs/guides/auth/auth-smtp",
  supabaseAuthEmailTemplates: "https://supabase.com/docs/guides/auth/auth-email-templates",
  supabasePasswordSecurity: "https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection",
  supabaseAuthRateLimits: "https://supabase.com/docs/guides/auth/rate-limits",
  supabaseAuthCaptcha: "https://supabase.com/docs/guides/auth/auth-captcha",
  supabaseRls: "https://supabase.com/docs/guides/database/postgres/row-level-security",
  supabaseStorage: "https://supabase.com/docs/guides/storage",
  supabaseStorageAccess: "https://supabase.com/docs/guides/storage/security/access-control",
  businessRegistration: "https://business.gov.au/registrations",
  businessRegistrationService: "https://register.business.gov.au/",
  abrAbn: "https://www.abr.gov.au/business-super-funds-charities/applying-abn",
  asicBusinessName: "https://www.asic.gov.au/for-business-and-companies/business-names/register-a-business-name/",
  atoGst: "https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst",
  austracRemittance: "https://www.austrac.gov.au/enrol-and-register-remittance",
  asicAfs: "https://www.asic.gov.au/for-finance-professionals/afs-licensees/do-you-need-an-afs-licence/",
  businessInsurance: "https://business.gov.au/risk-management/insurance/types-of-business-insurance",
  acccConsumerGuarantees: "https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought",
  fairWorkContractors: "https://www.fairwork.gov.au/find-help-for/independent-contractors",
  oaicSmallBusiness: "https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business",
  brsKenya: "https://brs.go.ke/",
  kraPin: "https://www.kra.go.ke/business/companies-partnerships/companies-partnerships-pin-taxes/companies-partnerships-pin-registration",
  odpcKenya: "https://www.odpc.go.ke/",
  stripeRegister: "https://dashboard.stripe.com/register",
  stripeConnect: "https://docs.stripe.com/connect",
  stripePaymentLinks: "https://docs.stripe.com/payment-links",
  paypalDeveloper: "https://developer.paypal.com/home/",
  paypalBusinessKe: "https://www.paypal.com/ke/business",
  sumsubHome: "https://sumsub.com/",
  wiseBusinessHome: "https://wise.com/business/",
};

function confirmedEnv(name) {
  return ["1", "true", "yes", "ready", "confirmed", "done"].includes(
    String(process.env[name] || "")
      .trim()
      .toLowerCase(),
  );
}

function csvEnv(name) {
  return String(process.env[name] || "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}

function ownerFlagItem(id, label, envName, detail, next, options = {}) {
  const ready = confirmedEnv(envName);
  return item(id, label, ready ? "ready" : "missing", detail, ready ? options.ready_next || "Owner confirmation is recorded." : next, ready ? [] : [envName], {
    priority: options.priority,
    owner: options.owner || "Founder/owner",
    docs_url: options.docs_url || "",
    copy_value: envName,
  });
}

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

function paymentExpansionRailItem(options) {
  const callbackUrl = `${publicUrl() || "https://swadakta.com"}${options.callbackPath}`;
  const missingSecrets = missingEnv(options.requiredEnv);
  const settlementCurrencies = csvEnv(options.settlementEnv);
  const merchantApproved = confirmedEnv(options.merchantEnv);
  const endpointReady = confirmedEnv(options.endpointEnv);
  const evidenceMapped = confirmedEnv(options.evidenceEnv);
  const missing = [
    ...missingSecrets,
    ...(settlementCurrencies.length ? [] : [options.settlementEnv]),
    ...(merchantApproved ? [] : [options.merchantEnv]),
    ...(endpointReady ? [] : [options.endpointEnv]),
    ...(evidenceMapped ? [] : [options.evidenceEnv]),
  ];
  const ready = missing.length === 0;
  const settlementCopy = settlementCurrencies.length ? settlementCurrencies.join(", ") : "not set";

  return item(
    options.id,
    options.label,
    ready ? "ready" : "manual",
    ready
      ? `${options.provider} is approved for pilot use. Webhook, verification, settlement, and Swadakta provider-evidence mapping are confirmed.`
      : `${options.provider} remains an Africa expansion pilot. Callback candidate: ${callbackUrl}. Settlement currencies: ${settlementCopy}.`,
    ready
      ? `Run one low-value sandbox/live test, confirm webhook signature, verify transaction amount/currency/reference server-side, then keep milestone release founder-gated.`
      : `Keep ${options.provider} hidden from normal users until merchant approval, webhook endpoint, signature secret, settlement currencies, and evidence mapping are all confirmed.`,
    missing,
    {
      docs_url: options.docs_url,
      copy_value: callbackUrl,
      priority: options.priority,
      owner: options.owner,
    },
  );
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

function buildLaunchGate(categories) {
  const flatItems = categories.flatMap((category) =>
    (category.items || []).map((entry) => ({
      ...entry,
      category: category.label,
      category_id: category.id,
    })),
  );
  const launchRelevant = flatItems.filter((entry) => (entry.priority || 50) <= 40);
  const blockers = launchRelevant.filter((entry) => entry.status === "missing");
  const checks = launchRelevant.filter((entry) => entry.status === "warning" || entry.status === "manual");
  const paymentItems = flatItems.filter((entry) => entry.category_id === "payments");
  const livePaymentReady = paymentItems.some((entry) =>
    ["stripe_checkout", "paypal_orders", "mpesa_stk"].includes(entry.id) && entry.status === "ready",
  );
  const providerEvidenceReady = paymentItems.some((entry) =>
    ["stripe_webhook", "mpesa_callback"].includes(entry.id) && entry.status === "ready",
  );
  const publicTrustItems = flatItems.filter((entry) => entry.category_id === "public_trust");
  const publicTrustReady = publicTrustItems.every((entry) => entry.status === "ready");
  const africaExpansionItems = flatItems.filter((entry) => entry.category_id === "africa_payment_expansion");
  const africaExpansionReady =
    africaExpansionItems.length > 0 && africaExpansionItems.every((entry) => entry.status === "ready");
  const aiManualFallbackReady =
    flatItems.some((entry) => entry.id === "ai_manual_mode_boundary" && entry.status === "ready") &&
    flatItems.some((entry) => entry.id === "admin_ai_prompt_boundaries" && entry.status === "ready");

  const status = blockers.length
    ? "paid_launch_blocked"
    : checks.length
      ? "soft_launch_with_checks"
      : "launch_ready";
  const label = {
    paid_launch_blocked: "Paid launch blocked",
    soft_launch_with_checks: "Soft launch with checks",
    launch_ready: "Launch ready",
  }[status];
  const summary = blockers.length
    ? "The public site can be reviewed, but do not take paid customer jobs until the listed blockers are fixed."
    : checks.length
      ? "Public demos and limited pilots are reasonable, but founder/admin should watch the manual checks before scaling paid traffic."
      : "The readiness report did not find launch blockers in the checked rails.";

  return {
    status,
    label,
    summary,
    public_site: publicTrustReady ? "ready" : "check",
    paid_jobs: blockers.length || !livePaymentReady ? "blocked" : providerEvidenceReady ? "ready" : "check",
    founder_load: blockers.length ? "high" : checks.length ? "medium" : "low",
    blockers: blockers.slice(0, 6).map((entry) => ({
      id: entry.id,
      category: entry.category,
      label: entry.label,
      next: entry.next,
      missing: entry.missing || [],
      owner: entry.owner || "Founder/admin",
    })),
    checks: checks.slice(0, 6).map((entry) => ({
      id: entry.id,
      category: entry.category,
      label: entry.label,
      next: entry.next,
      missing: entry.missing || [],
      owner: entry.owner || "Founder/admin",
      status: entry.status,
    })),
    evidence: [
      publicTrustReady ? "Public domain trust files and noindex checks are ready." : "Public domain trust files or noindex checks need attention.",
      livePaymentReady ? "At least one live primary payment rail is ready." : "No primary payment rail is fully ready yet.",
      providerEvidenceReady
        ? "At least one provider-confirmed payment evidence path is ready."
        : "Payment evidence confirmation is not fully ready; do not treat funds as protected manually.",
      africaExpansionReady
        ? "Africa expansion rails have explicit merchant, settlement, webhook, and provider-evidence confirmations."
        : "Paystack and Flutterwave remain expansion rails; do not expose them as default payment options until readiness confirms them.",
      aiManualFallbackReady
        ? "AI/manual mode fallback is ready; Swadakta can hide AI-only tools and keep manual operations running."
        : "AI/manual mode fallback needs attention before relying on AI-optional operations.",
      "AI can draft and triage, but protected decisions remain provider/founder gated.",
    ],
  };
}

function providerRailStatus(status, fallback = "Review") {
  return {
    ready: "Ready",
    missing: "Missing",
    manual: "Manual gate",
    warning: "Check",
  }[status] || fallback;
}

function providerLaunchRail(options) {
  return {
    id: options.id,
    label: options.label,
    type: options.type,
    status: options.status,
    status_label: providerRailStatus(options.status),
    activation_order: options.activation_order,
    launch_role: options.launch_role,
    public_visibility: options.public_visibility,
    next: options.next,
    founder_rule: options.founder_rule,
    missing: options.missing || [],
    docs_url: options.docs_url || "",
    safe_values: options.safe_values || [],
  };
}

function statusFromBlockers(blockers, fallbackReady = "ready") {
  return blockers.length ? "blocked" : fallbackReady;
}

function launchDecision(options) {
  return {
    id: options.id,
    label: options.label,
    status: options.status,
    status_label:
      {
        ready: "Allowed",
        controlled: "Controlled",
        blocked: "Blocked",
        manual: "Founder gate",
      }[options.status] || "Review",
    summary: options.summary,
    allowed_now: options.allowed_now,
    locked_until: options.locked_until || [],
    evidence_needed: options.evidence_needed || [],
    next: options.next,
    owner: options.owner || "Founder/admin",
    docs_url: options.docs_url || "",
    flags: options.flags || [],
    hard_rule: options.hard_rule || "",
  };
}

function buildLaunchDecisionRegister(context = {}) {
  const businessReady = confirmedEnv("SWADAKTA_OWNER_BUSINESS_REGISTERED");
  const taxReady = confirmedEnv("SWADAKTA_OWNER_TAX_REVIEWED");
  const insuranceReady = confirmedEnv("SWADAKTA_OWNER_INSURANCE_ACTIVE");
  const legalReady = confirmedEnv("SWADAKTA_OWNER_LEGAL_REVIEWED");
  const financialBoundaryReady = confirmedEnv("SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED");
  const privacyReady = confirmedEnv("SWADAKTA_OWNER_PRIVACY_REVIEWED");
  const contractorReady = confirmedEnv("SWADAKTA_OWNER_CONTRACTOR_TERMS_READY");
  const providerAccountsReady = confirmedEnv("SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED");
  const kenyaReady = confirmedEnv("SWADAKTA_OWNER_KENYA_SETUP_REVIEWED");
  const secretRotationReady = confirmedEnv("SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED");
  const firstPilotPassed = confirmedEnv("SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED");
  const regulatedEscrowReady = confirmedEnv("SWADAKTA_OWNER_REGULATED_ESCROW_READY");
  const serviceRoleReady = Boolean(context.serviceRoleConfigured);
  const stripeEvidenceReady = hasEnv("STRIPE_SECRET_KEY") && context.stripeWebhookMissing?.length === 0 && serviceRoleReady;
  const paypalReady = context.paypalMissing?.length === 0;
  const mpesaEvidenceReady =
    context.mpesaMissing?.length === 0 &&
    serviceRoleReady &&
    hasEnv("MPESA_CALLBACK_TOKEN") &&
    mpesaMode() === "live" &&
    kenyaReady;
  const paystackReady =
    context.paystackMissing?.length === 0 &&
    confirmedEnv("PAYSTACK_MERCHANT_APPROVED") &&
    confirmedEnv("PAYSTACK_WEBHOOK_ENDPOINT_READY") &&
    confirmedEnv("PAYSTACK_PROVIDER_EVIDENCE_MAPPED");
  const flutterwaveReady =
    context.flutterwaveMissing?.length === 0 &&
    confirmedEnv("FLUTTERWAVE_MERCHANT_APPROVED") &&
    confirmedEnv("FLUTTERWAVE_WEBHOOK_ENDPOINT_READY") &&
    confirmedEnv("FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED");
  const hostedIdentityReady = anyEnv([
    "SMILE_ID_VERIFICATION_URL",
    "SUMSUB_VERIFICATION_URL",
    "YOUVERIFY_VERIFICATION_URL",
  ]);
  const sumsubEvidenceReady =
    context.sumsubNativeMissing?.length === 0 && context.sumsubWebhookMissing?.length === 0 && serviceRoleReady;
  const identityEvidenceReady = hostedIdentityReady || sumsubEvidenceReady;
  const primaryPaymentReady = stripeEvidenceReady || paypalReady || mpesaEvidenceReady;
  const africaPaymentReady = mpesaEvidenceReady || paystackReady || flutterwaveReady;
  const ownerCoreMissing = [
    ...(businessReady ? [] : ["SWADAKTA_OWNER_BUSINESS_REGISTERED"]),
    ...(taxReady ? [] : ["SWADAKTA_OWNER_TAX_REVIEWED"]),
    ...(insuranceReady ? [] : ["SWADAKTA_OWNER_INSURANCE_ACTIVE"]),
    ...(legalReady ? [] : ["SWADAKTA_OWNER_LEGAL_REVIEWED"]),
    ...(financialBoundaryReady ? [] : ["SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED"]),
    ...(privacyReady ? [] : ["SWADAKTA_OWNER_PRIVACY_REVIEWED"]),
    ...(providerAccountsReady ? [] : ["SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED"]),
    ...(secretRotationReady ? [] : ["SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED"]),
  ];
  const paidPilotMissing = [
    ...ownerCoreMissing,
    ...(identityEvidenceReady ? [] : ["SUMSUB/SMILE/YOUVERIFY provider evidence route"]),
    ...(primaryPaymentReady ? [] : ["Stripe, PayPal, or M-Pesa provider evidence route"]),
  ];
  const publicPaidMissing = [
    ...paidPilotMissing,
    ...(contractorReady ? [] : ["SWADAKTA_OWNER_CONTRACTOR_TERMS_READY"]),
    ...(firstPilotPassed ? [] : ["SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED"]),
  ];
  const receiverMissing = [
    ...(contractorReady ? [] : ["SWADAKTA_OWNER_CONTRACTOR_TERMS_READY"]),
    ...(insuranceReady ? [] : ["SWADAKTA_OWNER_INSURANCE_ACTIVE"]),
    ...(identityEvidenceReady ? [] : ["ID provider evidence route"]),
    ...(providerAccountsReady ? [] : ["SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED"]),
  ];
  const africaMissing = [
    ...(businessReady ? [] : ["SWADAKTA_OWNER_BUSINESS_REGISTERED"]),
    ...(privacyReady ? [] : ["SWADAKTA_OWNER_PRIVACY_REVIEWED"]),
    ...(kenyaReady ? [] : ["SWADAKTA_OWNER_KENYA_SETUP_REVIEWED"]),
    ...(identityEvidenceReady ? [] : ["Africa-capable ID provider route"]),
    ...(africaPaymentReady ? [] : ["M-Pesa, Paystack, or Flutterwave provider evidence route"]),
  ];
  const highValueMissing = [
    ...(legalReady ? [] : ["SWADAKTA_OWNER_LEGAL_REVIEWED"]),
    ...(financialBoundaryReady ? [] : ["SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED"]),
    ...(insuranceReady ? [] : ["SWADAKTA_OWNER_INSURANCE_ACTIVE"]),
    ...(regulatedEscrowReady ? [] : ["SWADAKTA_OWNER_REGULATED_ESCROW_READY"]),
  ];

  return {
    title: "Founder go/no-go decision register",
    summary:
      "Use this register before demos, paid pilots, receiver onboarding, Africa expansion, or high-value work. It is an operating control, not legal advice.",
    decisions: [
      launchDecision({
        id: "public_demo_interest",
        label: "Public demo and interest capture",
        status: "ready",
        summary: "The public site can be shown and used to collect non-sensitive interest, questions, and pilot briefs.",
        allowed_now: "Show the site, collect non-sensitive briefs, explain the model, and invite friendly pilot users.",
        next: "Keep paid work in founder-reviewed pilot mode until the money, ID, legal, insurance, and provider evidence gates are clear.",
        docs_url: `${publicUrl() || "https://swadakta.com"}/trust`,
        evidence_needed: ["Live domain loads", "Trust/payment boundaries are visible", "Admin readiness keeps paid launch blocked"],
        hard_rule: "Do not imply Swadakta is a bank, escrow provider, remittance service, lawyer, customs broker, or insurer.",
      }),
      launchDecision({
        id: "first_low_risk_paid_pilot",
        label: "First low-risk paid pilot",
        status: statusFromBlockers(paidPilotMissing, "controlled"),
        summary:
          "One low-value friendly-client job can run only when the core owner, payment evidence, and ID provider gates are ready.",
        allowed_now: paidPilotMissing.length
          ? "Not yet. Collect the brief and keep it founder-reviewed without taking money."
          : "Run one low-risk paid pilot with written scope, provider-confirmed funds, ID route, proof plan, and founder closeout.",
        locked_until: paidPilotMissing,
        evidence_needed: [
          "Owner legal/tax/insurance/privacy/provider flags are true",
          "At least one payment provider can confirm amount, currency, and request reference",
          "At least one ID provider route can create or store provider evidence",
        ],
        next: paidPilotMissing.length
          ? "Finish the missing owner/provider flags, then run the first paid pilot script before ordinary public paid work."
          : "Run the first paid pilot script and set SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED=true only after closeout.",
        docs_url: `${publicUrl() || "https://swadakta.com"}/admin-readiness`,
        flags: ["SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED"],
        hard_rule: "The first pilot must avoid land/title, restricted goods, cash handling, legal advice, medical advice, and high-value purchases.",
      }),
      launchDecision({
        id: "normal_public_paid_jobs",
        label: "Normal public paid jobs",
        status: statusFromBlockers(publicPaidMissing, "controlled"),
        summary:
          "Ordinary paid work should stay locked until the first paid pilot has passed and receiver terms, provider evidence, and owner approvals are complete.",
        allowed_now: publicPaidMissing.length
          ? "No. Keep submitted paid jobs in founder-reviewed pilot mode."
          : "Open carefully to low-risk categories and keep high-risk jobs founder-gated.",
        locked_until: publicPaidMissing,
        evidence_needed: [
          "First paid pilot passed without unresolved dispute",
          "Receiver terms/code are approved",
          "Payment and ID evidence routes have test records",
          "Insurance and legal boundary records are saved",
        ],
        next: publicPaidMissing.length
          ? "Clear the missing flags before removing founder-reviewed pilot mode."
          : "Start with narrow low-risk categories and monitor refunds, disputes, receiver quality, and founder workload weekly.",
        docs_url: DOCS.businessInsurance,
        flags: [
          "SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED",
          "SWADAKTA_OWNER_CONTRACTOR_TERMS_READY",
        ],
        hard_rule: "Public paid launch does not authorize high-value or regulated jobs.",
      }),
      launchDecision({
        id: "receiver_marketplace_work",
        label: "Receiver marketplace and job applications",
        status: statusFromBlockers(receiverMissing, "controlled"),
        summary:
          "Receivers can create accounts and express interest now, but paid assignment requires vetted identity, terms, insurance, and founder/provider gates.",
        allowed_now: receiverMissing.length
          ? "Let receivers register interest and build profiles; do not assign paid work."
          : "Allow vetted receivers to make controlled offers on suitable low-risk jobs.",
        locked_until: receiverMissing,
        evidence_needed: [
          "Receiver/contractor terms ready",
          "ID provider route and status storage are working",
          "Insurance covers the accepted field-work categories",
          "Provider accounts and payout route are clear",
        ],
        next: receiverMissing.length
          ? "Keep job applications visible but assignment locked until receiver terms and ID/provider gates pass."
          : "Run small batches; score provenance after each job and keep lowest-price-only selection disabled.",
        docs_url: DOCS.fairWorkContractors,
        flags: ["SWADAKTA_OWNER_CONTRACTOR_TERMS_READY"],
        hard_rule: "AI may recommend matches, but it must not assign receivers or override identity/provenance gates.",
      }),
      launchDecision({
        id: "africa_incountry_and_expansion",
        label: "Africa in-country and cross-border expansion",
        status: statusFromBlockers(africaMissing, africaPaymentReady && identityEvidenceReady ? "controlled" : "blocked"),
        summary:
          "Africa-wide operations need country/payment/ID evidence per corridor. Kenya and wider Africa should not be treated as one compliance bucket.",
        allowed_now: africaMissing.length
          ? "Collect briefs and route them to founder review; do not promise execution or payment options."
          : "Pilot specific countries/corridors with named payment, ID, receiver, proof, and restricted-goods checks.",
        locked_until: africaMissing,
        evidence_needed: [
          "Country-specific receiver coverage",
          "Africa-capable ID evidence route",
          "M-Pesa/Paystack/Flutterwave provider evidence for the chosen country/currency",
          "Restricted-goods and logistics rules reviewed per corridor",
        ],
        next: africaMissing.length
          ? "Keep Africa corridors in pilot review until Kenya setup or an approved Africa payment rail is confirmed."
          : "Open one corridor at a time and review job evidence after every pilot.",
        docs_url: DOCS.daraja,
        flags: ["SWADAKTA_OWNER_KENYA_SETUP_REVIEWED"],
        hard_rule: "Do not treat provider coverage, postal acceptance, or legal permissions as global; verify per country and item.",
      }),
      launchDecision({
        id: "high_value_sensitive_jobs",
        label: "High-value, property, title, supplier, and sensitive jobs",
        status: statusFromBlockers(highValueMissing, "manual"),
        summary:
          "High-value work stays blocked unless a regulated escrow/provider-held funds model, insurance, and legal review are confirmed.",
        allowed_now: highValueMissing.length
          ? "No. Accept questions only; route to founder/legal review and do not collect client funds."
          : "Consider case-by-case only with written terms, regulated provider-held funds, proof pack, and founder approval.",
        locked_until: highValueMissing,
        evidence_needed: [
          "Regulated escrow/payment-provider agreement or legal confirmation",
          "Insurance that covers the exact job category",
          "Written milestone, dispute, refund, proof, and release rules",
        ],
        next: highValueMissing.length
          ? "Keep these jobs outside normal intake and mark them founder/legal review only."
          : "Use a separate high-value operating checklist before any quote is sent.",
        docs_url: DOCS.asicAfs,
        flags: ["SWADAKTA_OWNER_REGULATED_ESCROW_READY"],
        hard_rule: "Do not hold or move high-value client funds informally.",
      }),
      launchDecision({
        id: "ai_operations_mode",
        label: "AI operations mode",
        status: "controlled",
        summary:
          "AI can lower admin load by drafting, summarizing, classifying, explaining screens, and preparing checklists, but protected decisions stay gated.",
        allowed_now: "Use AI for drafts, triage, checklists, user guidance, and founder yes/no prompts.",
        locked_until: [],
        evidence_needed: [
          "Manual mode remains available",
          "Protected action boundaries are visible",
          "Admin/founder confirms before external messages, assignments, money release, refunds, or ID exceptions",
        ],
        next: "Keep improving autopilot prompts, but do not turn AI into the payment, identity, assignment, refund, or legal decision-maker.",
        docs_url: `${publicUrl() || "https://swadakta.com"}/assistant`,
        hard_rule: "AI is an assistant and workflow engine, not the authority for money, ID, legal, customs, or receiver assignment decisions.",
      }),
    ],
    policy_boundary: [
      "Allowed means the system can proceed within the stated limits.",
      "Controlled means founder/admin gates and provider evidence still decide before paid work scales.",
      "Blocked means collect interest only; do not take money, assign receivers, or promise execution.",
    ],
  };
}

function buildProviderLaunchMatrix(context) {
  const ownerProviderReady = confirmedEnv("SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED");
  const legalReady = confirmedEnv("SWADAKTA_OWNER_LEGAL_REVIEWED");
  const financialBoundaryReady = confirmedEnv("SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED");
  const kenyaReady = confirmedEnv("SWADAKTA_OWNER_KENYA_SETUP_REVIEWED");
  const stripeSecretMissing = missingEnv(["STRIPE_SECRET_KEY"]);
  const stripeMissing = [
    ...stripeSecretMissing,
    ...context.stripeWebhookMissing,
    ...(context.serviceRoleConfigured ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
  ];
  const stripeReady = stripeMissing.length === 0;
  const paypalReady = context.paypalMissing.length === 0;
  const mpesaCredentialReady = context.mpesaMissing.length === 0;
  const mpesaLiveReady =
    mpesaCredentialReady &&
    context.serviceRoleConfigured &&
    hasEnv("MPESA_CALLBACK_TOKEN") &&
    mpesaMode() === "live" &&
    kenyaReady;
  const sumsubReady =
    context.sumsubNativeMissing.length === 0 &&
    context.sumsubWebhookMissing.length === 0 &&
    context.serviceRoleConfigured;
  const smileLinkReady = anyEnv(["SMILE_ID_VERIFICATION_URL", "SMILE_ID_WEB_LINK_URL", "SMILE_ID_PORTAL_URL"]);
  const smileReady = context.smileIdConfigured || smileLinkReady;
  const paystackReady =
    context.paystackMissing.length === 0 &&
    confirmedEnv("PAYSTACK_MERCHANT_APPROVED") &&
    confirmedEnv("PAYSTACK_WEBHOOK_ENDPOINT_READY") &&
    confirmedEnv("PAYSTACK_PROVIDER_EVIDENCE_MAPPED");
  const flutterwaveReady =
    context.flutterwaveMissing.length === 0 &&
    confirmedEnv("FLUTTERWAVE_MERCHANT_APPROVED") &&
    confirmedEnv("FLUTTERWAVE_WEBHOOK_ENDPOINT_READY") &&
    confirmedEnv("FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED");
  const paidLaunchPrereqs = [
    ...(ownerProviderReady ? [] : ["SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED"]),
    ...(legalReady ? [] : ["SWADAKTA_OWNER_LEGAL_REVIEWED"]),
    ...(financialBoundaryReady ? [] : ["SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED"]),
  ];

  const rails = [
    providerLaunchRail({
      id: "sumsub_identity",
      label: "Sumsub global ID",
      type: "identity",
      status: sumsubReady ? "ready" : context.sumsubNativeMissing.length ? "missing" : "manual",
      activation_order: 1,
      launch_role: "Global identity verification for clients and receivers.",
      public_visibility: sumsubReady
        ? "Visible through the verification flow when a provider link is generated."
        : "Verification can queue, but paid actions stay locked until provider link/webhook evidence is configured.",
      next: sumsubReady
        ? "Run one low-risk test account and confirm the webhook updates Swadakta status."
        : "Create the Sumsub level, add app token, secret key, level name, webhook secret, and service-role key in Vercel.",
      founder_rule: "No user, screenshot, or AI can mark ID verified; only provider evidence or documented admin exception.",
      missing: [
        ...context.sumsubNativeMissing,
        ...context.sumsubWebhookMissing,
        ...(context.serviceRoleConfigured ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
      ],
      docs_url: DOCS.sumsubWebsdkLink,
      safe_values: [context.identityStartUrl, context.sumsubWebhookUrl],
    }),
    providerLaunchRail({
      id: "smile_id_africa",
      label: "Smile ID Africa KYC",
      type: "identity",
      status: smileReady ? "manual" : "missing",
      activation_order: 2,
      launch_role: "Africa-first KYC route, especially for African ID documents and low-bandwidth capture.",
      public_visibility: smileReady
        ? "Can be used as an Africa verification route after provider approval and a tested handoff link."
        : "Hidden as a live provider until Smile ID credentials or a provider-approved web link exist.",
      next: smileReady
        ? "Run one Africa test applicant and store the provider reference before paid receiver work."
        : "Open the Smile ID account, confirm countries/documents, then add Smile credentials or a Smile web-link URL.",
      founder_rule: "Smile ID is an identity evidence provider, not an automatic work-approval switch.",
      missing: smileReady ? [] : ["SMILE_ID_API_KEY or SMILE_ID_VERIFICATION_URL", "SMILE_ID_PARTNER_ID"],
      docs_url: DOCS.smileIdWeb,
      safe_values: [context.identityStartUrl],
    }),
    providerLaunchRail({
      id: "stripe_card_checkout",
      label: "Stripe card checkout",
      type: "payment",
      status: stripeReady ? "ready" : "missing",
      activation_order: 3,
      launch_role: "Primary card rail for AUD, USD, GBP, and EUR quotes.",
      public_visibility:
        stripeReady && paidLaunchPrereqs.length === 0
          ? "Can show for eligible quoted jobs after internal margin, route, and ID gates pass."
          : "Admin-only until Stripe secret, webhook evidence, service-role key, provider account, legal, and financial-boundary gates pass.",
      next: stripeReady
        ? "Run one low-value checkout and confirm provider reference, amount, currency, webhook, and request code."
        : "Add Stripe secret and webhook secret in Vercel, then register the webhook URL in Stripe.",
      founder_rule: "Stripe paid status is provider evidence only; it does not release receiver payouts.",
      missing: [...stripeMissing, ...paidLaunchPrereqs],
      docs_url: DOCS.stripeCheckout,
      safe_values: [context.stripeWebhookUrl],
    }),
    providerLaunchRail({
      id: "paypal_orders",
      label: "PayPal orders",
      type: "payment",
      status: paypalReady ? "ready" : "missing",
      activation_order: 4,
      launch_role: "Secondary global checkout rail when clients prefer PayPal approval.",
      public_visibility:
        paypalReady && paidLaunchPrereqs.length === 0
          ? "Can show as a client preference after quote, ID, and provider evidence gates pass."
          : "Admin-only until PayPal credentials and owner provider/legal gates pass.",
      next: paypalReady
        ? "Run one PayPal order/capture test and reconcile request code, amount, currency, and payer."
        : "Create a PayPal REST app, add client ID and secret, then test order creation and capture.",
      founder_rule: "PayPal capture can confirm funds; disputes, refunds, and payout release still stay founder/admin controlled.",
      missing: [...context.paypalMissing, ...paidLaunchPrereqs],
      docs_url: DOCS.paypalOrders,
      safe_values: [],
    }),
    providerLaunchRail({
      id: "mpesa_daraja",
      label: "M-Pesa Daraja",
      type: "payment",
      status: mpesaLiveReady ? "ready" : mpesaCredentialReady ? "manual" : "missing",
      activation_order: 5,
      launch_role: "Kenya KES collection rail after Kenya-side business/payment approval.",
      public_visibility: mpesaLiveReady
        ? "Can show for KES jobs after quote, callback evidence, and Kenya setup gates pass."
        : "Keep sandbox/admin-only until Safaricom approval, callback token, service-role key, and Kenya setup are confirmed.",
      next: mpesaLiveReady
        ? "Run one live low-value STK test and confirm callback reference before any receiver assignment."
        : "Use sandbox first. Add Daraja credentials, callback token, service-role key, and Kenya operating review before live use.",
      founder_rule: "A sent STK prompt is not payment. Only callback/provider evidence can move the funds state.",
      missing: [
        ...context.mpesaMissing,
        ...(context.serviceRoleConfigured ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
        ...(hasEnv("MPESA_CALLBACK_TOKEN") ? [] : ["MPESA_CALLBACK_TOKEN"]),
        ...(kenyaReady ? [] : ["SWADAKTA_OWNER_KENYA_SETUP_REVIEWED"]),
      ],
      docs_url: DOCS.daraja,
      safe_values: [context.mpesaWebhookUrl],
    }),
    providerLaunchRail({
      id: "wise_fallback",
      label: "Wise fallback",
      type: "payment",
      status: context.wiseConfigured ? "manual" : "missing",
      activation_order: 6,
      launch_role: "Hidden admin fallback for bank/receive-details situations after simpler rails fail.",
      public_visibility: "Never show as a normal public default; keep it behind admin reconciliation.",
      next: context.wiseConfigured
        ? "Use only with receipt reconciliation: sender, amount, currency, date, reference, and request code."
        : "Add a Wise receive/payment-request URL only after the legal/payment boundary is reviewed.",
      founder_rule: "AI cannot reconcile Wise. Founder/admin must match receipt evidence before funds count as protected.",
      missing: context.wiseConfigured ? [] : ["WISE_PAYMENT_LINK_URL or WISE_RECEIVE_DETAILS_URL"],
      docs_url: DOCS.wiseBusiness,
      safe_values: [],
    }),
    providerLaunchRail({
      id: "paystack_africa",
      label: "Paystack Africa expansion",
      type: "payment",
      status: paystackReady ? "ready" : "manual",
      activation_order: 7,
      launch_role: "Africa expansion merchant rail after settlement and webhook evidence are proven.",
      public_visibility: paystackReady
        ? "Can be considered for approved Africa corridors after one pilot payment verifies server-side."
        : "Hidden from normal users until merchant approval, settlement currencies, webhook, and evidence mapping are all complete.",
      next: paystackReady
        ? "Run one pilot payment and verify transaction reference, amount, currency, and customer server-side."
        : "Complete Paystack merchant approval, webhook secret, settlement currencies, and provider-evidence mapping.",
      founder_rule: "Expansion rails do not release money automatically; milestone proof still controls payout release.",
      missing: [
        ...context.paystackMissing,
        ...(confirmedEnv("PAYSTACK_MERCHANT_APPROVED") ? [] : ["PAYSTACK_MERCHANT_APPROVED"]),
        ...(confirmedEnv("PAYSTACK_WEBHOOK_ENDPOINT_READY") ? [] : ["PAYSTACK_WEBHOOK_ENDPOINT_READY"]),
        ...(confirmedEnv("PAYSTACK_PROVIDER_EVIDENCE_MAPPED") ? [] : ["PAYSTACK_PROVIDER_EVIDENCE_MAPPED"]),
      ],
      docs_url: DOCS.paystackWebhooks,
      safe_values: [context.paystackWebhookUrl],
    }),
    providerLaunchRail({
      id: "flutterwave_africa",
      label: "Flutterwave Africa expansion",
      type: "payment",
      status: flutterwaveReady ? "ready" : "manual",
      activation_order: 8,
      launch_role: "Africa expansion merchant rail after settlement and webhook evidence are proven.",
      public_visibility: flutterwaveReady
        ? "Can be considered for approved Africa corridors after one pilot payment verifies server-side."
        : "Hidden from normal users until merchant approval, settlement currencies, webhook, and evidence mapping are all complete.",
      next: flutterwaveReady
        ? "Run one pilot payment and verify transaction id/reference, amount, currency, and customer server-side."
        : "Complete Flutterwave merchant approval, webhook secret, settlement currencies, and provider-evidence mapping.",
      founder_rule: "Expansion rails do not release money automatically; milestone proof still controls payout release.",
      missing: [
        ...context.flutterwaveMissing,
        ...(confirmedEnv("FLUTTERWAVE_MERCHANT_APPROVED") ? [] : ["FLUTTERWAVE_MERCHANT_APPROVED"]),
        ...(confirmedEnv("FLUTTERWAVE_WEBHOOK_ENDPOINT_READY") ? [] : ["FLUTTERWAVE_WEBHOOK_ENDPOINT_READY"]),
        ...(confirmedEnv("FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED") ? [] : ["FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED"]),
      ],
      docs_url: DOCS.flutterwaveWebhooks,
      safe_values: [context.flutterwaveWebhookUrl],
    }),
  ];

  return {
    title: "Provider launch matrix",
    summary:
      "Use this order to activate real money and identity providers without exposing unfinished rails to users.",
    user_visibility_rule:
      "Public users should only see rails that have credentials, provider evidence, owner approval, and corridor/legal gates. Wise and Africa expansion rails stay hidden until explicitly ready.",
    activation_sequence: rails
      .slice()
      .sort((left, right) => left.activation_order - right.activation_order)
      .map((rail) => `${rail.activation_order}. ${rail.label}: ${rail.public_visibility}`),
    rails,
  };
}

function corridorRailPlan(options) {
  return {
    id: options.id,
    label: options.label,
    status: options.status,
    status_label: options.status_label || providerRailStatus(options.status),
    client_side: options.client_side,
    receiver_side: options.receiver_side,
    client_payment: options.client_payment,
    receiver_payout: options.receiver_payout,
    identity_route: options.identity_route,
    public_visibility: options.public_visibility,
    next: options.next,
    hard_stop: options.hard_stop,
    missing: options.missing || [],
    docs_url: options.docs_url || "",
    safe_values: options.safe_values || [],
  };
}

function buildCorridorRailPlanner(context = {}) {
  const ownerProviderReady = confirmedEnv("SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED");
  const legalReady = confirmedEnv("SWADAKTA_OWNER_LEGAL_REVIEWED");
  const financialBoundaryReady = confirmedEnv("SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED");
  const insuranceReady = confirmedEnv("SWADAKTA_OWNER_INSURANCE_ACTIVE");
  const kenyaReady = confirmedEnv("SWADAKTA_OWNER_KENYA_SETUP_REVIEWED");
  const regulatedEscrowReady = confirmedEnv("SWADAKTA_OWNER_REGULATED_ESCROW_READY");
  const paidPrereqs = [
    ...(ownerProviderReady ? [] : ["SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED"]),
    ...(legalReady ? [] : ["SWADAKTA_OWNER_LEGAL_REVIEWED"]),
    ...(financialBoundaryReady ? [] : ["SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED"]),
  ];
  const stripeReady =
    missingEnv(["STRIPE_SECRET_KEY"]).length === 0 &&
    context.stripeWebhookMissing?.length === 0 &&
    context.serviceRoleConfigured;
  const paypalReady = context.paypalMissing?.length === 0;
  const mpesaLiveReady =
    context.mpesaMissing?.length === 0 &&
    context.serviceRoleConfigured &&
    hasEnv("MPESA_CALLBACK_TOKEN") &&
    mpesaMode() === "live" &&
    kenyaReady;
  const paystackReady =
    context.paystackMissing?.length === 0 &&
    confirmedEnv("PAYSTACK_MERCHANT_APPROVED") &&
    confirmedEnv("PAYSTACK_WEBHOOK_ENDPOINT_READY") &&
    confirmedEnv("PAYSTACK_PROVIDER_EVIDENCE_MAPPED");
  const flutterwaveReady =
    context.flutterwaveMissing?.length === 0 &&
    confirmedEnv("FLUTTERWAVE_MERCHANT_APPROVED") &&
    confirmedEnv("FLUTTERWAVE_WEBHOOK_ENDPOINT_READY") &&
    confirmedEnv("FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED");
  const sumsubReady =
    context.sumsubNativeMissing?.length === 0 &&
    context.sumsubWebhookMissing?.length === 0 &&
    context.serviceRoleConfigured;
  const smileLinkReady = anyEnv(["SMILE_ID_VERIFICATION_URL", "SMILE_ID_WEB_LINK_URL", "SMILE_ID_PORTAL_URL"]);
  const smileReady = Boolean(context.smileIdConfigured || smileLinkReady);
  const primaryGlobalPaymentReady = (stripeReady || paypalReady) && paidPrereqs.length === 0;
  const africaPaymentReady = (mpesaLiveReady || paystackReady || flutterwaveReady) && paidPrereqs.length === 0;
  const globalIdReady = sumsubReady;
  const africaIdReady = smileReady || sumsubReady;
  const globalPaymentMissing = [
    ...(stripeReady || paypalReady ? [] : ["STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET or PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET"]),
    ...paidPrereqs,
  ];
  const africaPaymentMissing = [
    ...(mpesaLiveReady || paystackReady || flutterwaveReady
      ? []
      : ["M-Pesa live evidence or Paystack/Flutterwave approved evidence"]),
    ...paidPrereqs,
  ];
  const globalIdMissing = globalIdReady
    ? []
    : ["SUMSUB_APP_TOKEN", "SUMSUB_SECRET_KEY", "SUMSUB_LEVEL_NAME", "SUMSUB_WEBHOOK_SECRET"];
  const africaIdMissing = africaIdReady
    ? []
    : ["SMILE_ID_VERIFICATION_URL or SMILE_ID_API_KEY/SMILE_ID_PARTNER_ID", "or Sumsub native verification"];

  return {
    title: "Corridor rail planner",
    summary:
      "Use this planner before quoting a corridor. It separates what the client can pay with, how the receiver can be verified or paid, and when the route must stay founder-gated.",
    public_visibility_rule:
      "A corridor can be public only when payment evidence, ID evidence, legal/payment boundary, route rules, and proof requirements are all ready. Wise stays fallback-only.",
    route_classes: [
      corridorRailPlan({
        id: "global_to_africa",
        label: "Outside Africa to Africa",
        status: primaryGlobalPaymentReady && africaIdReady && globalIdReady ? "ready" : "manual",
        client_side: "Client may be in Australia, USA, Europe, China, Middle East, or another non-African country.",
        receiver_side: "Receiver/operator is in an African country and must be provider-verified before paid work.",
        client_payment: "Stripe or PayPal first. Use Wise only as admin fallback after easier rails fail.",
        receiver_payout: "Local payout stays founder/provider controlled after proof; Kenya can later use M-Pesa where approved.",
        identity_route: "Sumsub for the client; Smile ID or Sumsub for the African receiver depending on document coverage.",
        public_visibility: primaryGlobalPaymentReady && africaIdReady ? "Can be quoted publicly for low-risk work." : "Founder-reviewed pilot only.",
        next: "Start with Australia to Kenya and Kenya in-country pilots before opening broader Africa demand.",
        hard_stop: "Do not collect money if receiver ID, route rules, cost plan, or provider payment evidence is missing.",
        missing: [...globalPaymentMissing, ...globalIdMissing, ...africaIdMissing],
        docs_url: DOCS.sumsubWebsdkLink,
        safe_values: [context.identityStartUrl, context.sumsubWebhookUrl],
      }),
      corridorRailPlan({
        id: "africa_incountry",
        label: "Africa in-country work",
        status: africaPaymentReady && africaIdReady ? "ready" : "manual",
        client_side: "Client and receiver are in the same African country or region.",
        receiver_side: "Receiver must be verified and vetted for local errands, sourcing, document support, or field proof.",
        client_payment: "M-Pesa for Kenya KES after Daraja live approval; Paystack/Flutterwave only after expansion evidence is ready.",
        receiver_payout: "Local payout after milestone proof and founder/admin reconciliation.",
        identity_route: "Smile ID first where supported; Sumsub or approved local provider fallback.",
        public_visibility: africaPaymentReady ? "Can be piloted in approved countries." : "Keep hidden or quote-request only.",
        next: "Keep Kenya as the first in-country launch path; add other African countries after payment settlement and ID coverage are confirmed.",
        hard_stop: "Do not show Paystack, Flutterwave, or M-Pesa as normal choices until merchant, callback, settlement, and evidence mapping are proven.",
        missing: [...africaPaymentMissing, ...africaIdMissing],
        docs_url: DOCS.daraja,
        safe_values: [context.mpesaWebhookUrl, context.paystackWebhookUrl, context.flutterwaveWebhookUrl],
      }),
      corridorRailPlan({
        id: "africa_to_global",
        label: "Africa to overseas purchase or errand",
        status: africaPaymentReady && globalIdReady ? "manual" : "missing",
        client_side: "Client may be in Kenya or another African country asking someone abroad to buy, inspect, or coordinate.",
        receiver_side: "Receiver abroad must be verified and the item must pass local law, customs, carrier, and platform rules.",
        client_payment: "Use approved Africa rail first; global card/PayPal if the client can use it; Wise only as reconciled fallback.",
        receiver_payout: "Payout abroad stays manual/provider-controlled until proof and item legality are clear.",
        identity_route: "Smile ID or local provider for African client; Sumsub for receiver abroad.",
        public_visibility: "Founder-reviewed pilot only until customs and cross-border goods playbook is proven.",
        next: "Use low-value non-restricted shopping or inspection pilots before allowing parcel movement.",
        hard_stop: "Do not accept restricted goods, medicines, batteries, food, valuables, or customs-sensitive parcels without official carrier/customs checks.",
        missing: [...africaPaymentMissing, ...globalIdMissing],
        docs_url: DOCS.paystackWebhooks,
        safe_values: [context.identityStartUrl],
      }),
      corridorRailPlan({
        id: "global_non_africa",
        label: "Non-Africa global corridor",
        status: primaryGlobalPaymentReady && globalIdReady ? "ready" : "manual",
        client_side: "Client and receiver are outside Africa.",
        receiver_side: "Receiver uses global ID verification and job-specific proof requirements.",
        client_payment: "Stripe or PayPal for supported currencies; Wise stays hidden fallback.",
        receiver_payout: "Provider/bank payout after proof and milestone approval.",
        identity_route: "Sumsub first, then approved provider fallback if country/document coverage requires it.",
        public_visibility: primaryGlobalPaymentReady && globalIdReady ? "Can be quoted for low-risk service work." : "Quote-request only.",
        next: "Keep item movement and country-specific regulated tasks founder-reviewed until rules are documented.",
        hard_stop: "Do not promise customs, tax, legal, immigration, or regulated delivery outcomes.",
        missing: [...globalPaymentMissing, ...globalIdMissing],
        docs_url: DOCS.paypalOrders,
        safe_values: [context.stripeWebhookUrl],
      }),
      corridorRailPlan({
        id: "china_sourcing",
        label: "China sourcing or buying",
        status: "manual",
        client_side: "Client can be global or African; supplier/source may be in China.",
        receiver_side: "Receiver/sourcing helper needs strong identity, media proof, supplier verification, and item legality checks.",
        client_payment: "Stripe or PayPal quote deposit where supported; no public self-serve payment until supplier/item review is complete.",
        receiver_payout: "Milestone payout after supplier proof, inspection media, and shipping/legal checks.",
        identity_route: "Sumsub for global parties; local/provider exception only after admin review.",
        public_visibility: "Founder-reviewed quote only.",
        next: "Create a supplier/source verification checklist before allowing purchase deposits or shipping.",
        hard_stop: "No restricted goods, counterfeit goods, brand-infringing goods, batteries, medicines, food, weapons, or customs-sensitive goods without official proof.",
        missing: ["Supplier due-diligence checklist", "Customs/carrier evidence for item category"],
        docs_url: DOCS.stripeCheckout,
        safe_values: [],
      }),
      corridorRailPlan({
        id: "high_value_sensitive",
        label: "High-value, property, title, construction, or sensitive funds",
        status: regulatedEscrowReady && legalReady && financialBoundaryReady && insuranceReady ? "manual" : "missing",
        client_side: "Any country.",
        receiver_side: "Only specialist vetted operators with extra proof and legal/provider review.",
        client_payment: "Use regulated escrow/provider-held funds or written legal confirmation; do not rely on informal Swadakta-held money.",
        receiver_payout: "Milestone release only after provider evidence, proof review, dispute window, and founder/legal signoff.",
        identity_route: "Provider ID for all parties, plus enhanced review for authority, ownership, and sensitive documents.",
        public_visibility: "Blocked from normal public launch.",
        next: "Keep as collect-interest-only until escrow/legal/insurance evidence is complete.",
        hard_stop: "Do not take money, assign receivers, or promise execution for high-value/sensitive-funds jobs without regulated route approval.",
        missing: [
          ...(regulatedEscrowReady ? [] : ["SWADAKTA_OWNER_REGULATED_ESCROW_READY"]),
          ...(legalReady ? [] : ["SWADAKTA_OWNER_LEGAL_REVIEWED"]),
          ...(financialBoundaryReady ? [] : ["SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED"]),
          ...(insuranceReady ? [] : ["SWADAKTA_OWNER_INSURANCE_ACTIVE"]),
        ],
        docs_url: DOCS.asicAfs,
        safe_values: [],
      }),
    ],
    activation_notes: [
      "Default public launch: low-value, legal, quote-first service work only.",
      "First corridor to prove: Australia to Kenya plus Kenya in-country errands.",
      "Africa-wide and China/sourcing corridors can collect interest and quotes, but stay founder-reviewed until payment, ID, and rules evidence is complete.",
      "Payment rail readiness never overrides corridor legality, customs, insurance, ID, proof, or founder economics gates.",
    ],
  };
}

function founderStep(id, label, status, summary, action, options = {}) {
  return {
    id,
    label,
    status,
    summary,
    action,
    owner: options.owner || "Founder",
    docs_url: options.docs_url || "",
    safe_values: options.safe_values || [],
    done_when: options.done_when || "",
    flag: options.flag || "",
  };
}

function launchSessionStep(id, label, status, tab_url, action, evidence, options = {}) {
  return {
    id,
    label,
    status,
    tab_url,
    action,
    evidence,
    owner: options.owner || "Founder",
    flag: options.flag || "",
    stop_rule: options.stop_rule || "",
    supporting_tabs: options.supporting_tabs || [],
  };
}

function buildFounderLaunchSession() {
  const base = publicUrl() || "https://swadakta.com";
  const businessReady = confirmedEnv("SWADAKTA_OWNER_BUSINESS_REGISTERED");
  const taxReady = confirmedEnv("SWADAKTA_OWNER_TAX_REVIEWED");
  const insuranceReady = confirmedEnv("SWADAKTA_OWNER_INSURANCE_ACTIVE");
  const legalReady = confirmedEnv("SWADAKTA_OWNER_LEGAL_REVIEWED");
  const financialBoundaryReady = confirmedEnv("SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED");
  const privacyReady = confirmedEnv("SWADAKTA_OWNER_PRIVACY_REVIEWED");
  const contractorReady = confirmedEnv("SWADAKTA_OWNER_CONTRACTOR_TERMS_READY");
  const providerAccountsReady = confirmedEnv("SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED");
  const kenyaReady = confirmedEnv("SWADAKTA_OWNER_KENYA_SETUP_REVIEWED");
  const secretRotationReady = confirmedEnv("SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED");
  const firstPilotPassed = confirmedEnv("SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED");
  const stripeEvidenceReady = hasEnv("STRIPE_SECRET_KEY") && hasEnv("STRIPE_WEBHOOK_SECRET");
  const paypalReady = hasEnv("PAYPAL_CLIENT_ID") && hasEnv("PAYPAL_CLIENT_SECRET");
  const paymentEvidenceReady = stripeEvidenceReady || paypalReady || hasEnv("MPESA_CONSUMER_KEY");
  const sumsubReady =
    hasEnv("SUMSUB_APP_TOKEN") &&
    hasEnv("SUMSUB_SECRET_KEY") &&
    hasEnv("SUMSUB_LEVEL_NAME") &&
    hasEnv("SUMSUB_WEBHOOK_SECRET");
  const hostedIdentityReady = anyEnv(["SMILE_ID_VERIFICATION_URL", "SUMSUB_VERIFICATION_URL", "YOUVERIFY_VERIFICATION_URL"]);
  const identityEvidenceReady = sumsubReady || hostedIdentityReady;

  return {
    title: "Founder Chrome work session",
    summary:
      "Work these tabs in order before switching Swadakta from demo/interest capture to paid jobs. Each step names the evidence to save and the owner flag that may be set only after the evidence exists.",
    rule:
      "Do not paste secret keys into chat or client-visible pages. Provider dashboards, Vercel, Supabase, and signed provider webhooks remain the authority for money and ID evidence.",
    recommended_tabs: [
      { label: "Admin readiness", url: `${base}/admin-readiness`, purpose: "See live blockers, copy safe callback URLs, and confirm owner flags." },
      { label: "Admin verification", url: `${base}/admin-verification`, purpose: "Copy ID-provider handoff and fallback instructions." },
      { label: "Payments page", url: `${base}/payments`, purpose: "Check public payment wording and milestone boundaries." },
      { label: "Trust and rules", url: `${base}/trust`, purpose: "Review user-facing trust, goods, and proof limits." },
      { label: "Business registration", url: DOCS.businessRegistrationService, purpose: "Start Australian registration/ABN/business-name work." },
      { label: "AUSTRAC boundary", url: DOCS.austracRemittance, purpose: "Check whether money movement/remittance registration advice is needed." },
      { label: "Stripe", url: DOCS.stripeRegister, purpose: "Open the first global card payment rail." },
      { label: "PayPal developer", url: DOCS.paypalDeveloper, purpose: "Prepare PayPal order/capture backup." },
      { label: "Sumsub", url: DOCS.sumsubWebsdkLink, purpose: "Configure global ID WebSDK/session and webhook evidence." },
      { label: "Smile ID", url: DOCS.smileIdWeb, purpose: "Prepare Africa-first ID verification." },
      { label: "Safaricom Daraja", url: DOCS.daraja, purpose: "Prepare Kenya M-Pesa only after Kenya business/payment setup is real." },
      { label: "Wise Business", url: DOCS.wiseBusinessHome, purpose: "Keep Wise as hidden back-office fallback." },
    ],
    phases: [
      {
        id: "business_authority",
        label: "1. Business authority",
        steps: [
          launchSessionStep(
            "register_operating_entity",
            "Register the operating setup",
            businessReady ? "ready" : "missing",
            DOCS.businessRegistrationService,
            "Choose Australia-first, Kenya-first, or dual setup; save registration evidence and trading-name records.",
            "Business/legal structure records are saved and the founder knows which entity contracts with clients and providers.",
            {
              flag: "SWADAKTA_OWNER_BUSINESS_REGISTERED",
              supporting_tabs: [DOCS.businessRegistration, DOCS.abrAbn, DOCS.asicBusinessName, DOCS.brsKenya, DOCS.kraPin],
              stop_rule: "Do not open provider accounts in a mismatched name unless your accountant/lawyer approves the structure.",
            },
          ),
          launchSessionStep(
            "tax_and_records",
            "Set tax and bookkeeping rules",
            taxReady ? "ready" : "missing",
            DOCS.atoGst,
            "Ask an accountant to define GST/tax position, refund treatment, contractor payment records, provider fees, and founder margin tracking.",
            "Written accounting setup exists for invoices, refunds, provider fees, receiver payouts, and owner margin.",
            {
              owner: "Founder/accountant",
              flag: "SWADAKTA_OWNER_TAX_REVIEWED",
            },
          ),
          launchSessionStep(
            "insurance_boundary",
            "Buy the right insurance before field work",
            insuranceReady ? "ready" : "missing",
            DOCS.businessInsurance,
            "Ask a broker for public liability, professional indemnity/errors and omissions, cyber/privacy, equipment, and goods-in-transit cover where needed.",
            "Active policies are saved and exclusions are understood for the exact job categories Swadakta will accept.",
            {
              owner: "Founder/insurance broker",
              flag: "SWADAKTA_OWNER_INSURANCE_ACTIVE",
              stop_rule: "Do not accept paid property visits, courier-style errands, or document handling without coverage that matches the work.",
            },
          ),
        ],
      },
      {
        id: "legal_privacy_money",
        label: "2. Legal, privacy, and money boundary",
        steps: [
          launchSessionStep(
            "terms_privacy_disputes",
            "Review terms, privacy, refunds, and disputes",
            legalReady && privacyReady ? "ready" : "missing",
            `${base}/terms`,
            "Have terms, privacy, refund/dispute wording, prohibited-goods rules, receiver agreement, and service limitations reviewed.",
            "Reviewed documents are live on Swadakta and data handling duties are written down.",
            {
              owner: "Founder/legal/privacy reviewer",
              flag: "SWADAKTA_OWNER_LEGAL_REVIEWED / SWADAKTA_OWNER_PRIVACY_REVIEWED",
              supporting_tabs: [`${base}/privacy`, DOCS.oaicSmallBusiness, DOCS.odpcKenya, DOCS.acccConsumerGuarantees],
            },
          ),
          launchSessionStep(
            "escrow_remittance_boundary",
            "Confirm Swadakta is not acting as informal escrow",
            financialBoundaryReady ? "ready" : "missing",
            DOCS.austracRemittance,
            "Get advice on remittance, financial services, stored value, escrow/trust money, and payment facilitation boundaries before holding or moving client funds outside provider rails.",
            "Written operating boundary confirms Swadakta uses provider-held funds/payment links unless a regulated escrow/payment route is approved.",
            {
              owner: "Founder/legal reviewer",
              flag: "SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED",
              supporting_tabs: [DOCS.asicAfs, `${base}/payments`],
              stop_rule: "Do not describe Swadakta as a bank, remittance service, or licensed escrow company.",
            },
          ),
          launchSessionStep(
            "receiver_contracts",
            "Approve receiver terms before paid assignment",
            contractorReady ? "ready" : "missing",
            DOCS.fairWorkContractors,
            "Prepare receiver/contractor rules covering independence, ID, prohibited work, proof, safety, side deals, disputes, and payout timing.",
            "Receiver terms/code are approved before receivers can take paid jobs or access sensitive client details.",
            {
              owner: "Founder/legal reviewer",
              flag: "SWADAKTA_OWNER_CONTRACTOR_TERMS_READY",
            },
          ),
        ],
      },
      {
        id: "provider_activation",
        label: "3. Provider activation",
        steps: [
          launchSessionStep(
            "provider_accounts",
            "Open provider accounts under the legal entity",
            providerAccountsReady ? "ready" : "missing",
            DOCS.stripeRegister,
            "Open/verify Stripe, PayPal, Sumsub, Smile ID, Wise fallback, Vercel, Supabase, OpenAI, and later M-Pesa/Paystack/Flutterwave under the approved setup.",
            "Provider accounts are approved and their dashboards match the legal/trading setup.",
            {
              owner: "Founder/provider admins",
              flag: "SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED",
              supporting_tabs: [DOCS.paypalDeveloper, DOCS.sumsubHome, DOCS.smileIdWeb, DOCS.wiseBusinessHome, DOCS.daraja],
            },
          ),
          launchSessionStep(
            "payment_evidence",
            "Test one payment evidence rail",
            paymentEvidenceReady ? "ready" : "missing",
            DOCS.stripeWebhooks,
            "Configure Stripe first where possible, PayPal second, and M-Pesa only for Kenya KES after Daraja approval. Run a low-value test that reconciles request code, amount, currency, and provider reference.",
            "A provider confirmation can update collection state without assigning receivers or releasing milestones.",
            {
              owner: "Founder/payment admin",
              supporting_tabs: [DOCS.stripePaymentLinks, DOCS.paypalOrders, DOCS.daraja],
              stop_rule: "Do not set paid-launch owner flags from screenshots or unverified manual receipts.",
            },
          ),
          launchSessionStep(
            "identity_evidence",
            "Test one ID evidence rail",
            identityEvidenceReady ? "ready" : "missing",
            DOCS.sumsubWebsdkLink,
            "Configure Sumsub for global users and Smile ID for Africa-first routes. Run a test account and confirm provider reference/status returns to Swadakta.",
            "Provider evidence can mark an account verified; AI, users, and screenshots cannot.",
            {
              owner: "Founder/ID provider admin",
              supporting_tabs: [DOCS.sumsubWebhooks, DOCS.smileIdDocument, DOCS.youverifyDocs],
            },
          ),
          launchSessionStep(
            "kenya_payment_setup",
            "Keep Kenya/M-Pesa as a controlled rail",
            kenyaReady ? "manual" : "missing",
            DOCS.daraja,
            "Use Daraja sandbox first. Move to live only after Kenya setup, Safaricom approval, callback protection, settlement, tax, and evidence mapping are tested.",
            "M-Pesa can be used for Kenya KES without relying on personal phone numbers or unverifiable screenshots.",
            {
              owner: "Founder/Kenya payment admin",
              flag: "SWADAKTA_OWNER_KENYA_SETUP_REVIEWED",
            },
          ),
          launchSessionStep(
            "secret_rotation",
            "Rotate any exposed secrets",
            secretRotationReady ? "ready" : "missing",
            DOCS.vercelEnv,
            "Replace any API key ever pasted into chat, email, screenshots, docs, or browser-visible JavaScript, then store fresh keys only in Vercel/Supabase/provider dashboards.",
            "Fresh secrets are server-side only and old exposed keys have been revoked.",
            {
              owner: "Founder/security admin",
              flag: "SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED",
            },
          ),
        ],
      },
      {
        id: "pilot_go_live",
        label: "4. First paid pilot",
        steps: [
          launchSessionStep(
            "run_first_paid_pilot",
            "Run one low-value friendly-client pilot",
            firstPilotPassed ? "ready" : "manual",
            `${base}/admin-readiness`,
            "Use the first paid pilot script. Prove account, brief, ID handoff, quote, provider payment evidence, receiver gate, proof, tracking, and closeout.",
            "Pilot records show a completed low-risk job with no unresolved payment, proof, identity, or receiver issue.",
            {
              owner: "Founder/admin",
              flag: "SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED",
              stop_rule: "Do not set this flag if anything was improvised, manually patched, disputed, or unclear.",
            },
          ),
        ],
      },
    ],
  };
}

function buildFounderActionPack() {
  const base = publicUrl() || "https://swadakta.com";
  const stripeWebhookUrl = `${base}/api/payments/stripe-webhook`;
  const mpesaWebhookUrl = mpesaCallbackUrl();
  const sumsubWebhookUrl = `${base}/api/identity/sumsub-webhook`;
  const providerAccountsReady = confirmedEnv("SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED");
  const businessReady = confirmedEnv("SWADAKTA_OWNER_BUSINESS_REGISTERED");
  const taxReady = confirmedEnv("SWADAKTA_OWNER_TAX_REVIEWED");
  const insuranceReady = confirmedEnv("SWADAKTA_OWNER_INSURANCE_ACTIVE");
  const legalReady = confirmedEnv("SWADAKTA_OWNER_LEGAL_REVIEWED");
  const financialBoundaryReady = confirmedEnv("SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED");
  const privacyReady = confirmedEnv("SWADAKTA_OWNER_PRIVACY_REVIEWED");
  const contractorReady = confirmedEnv("SWADAKTA_OWNER_CONTRACTOR_TERMS_READY");
  const kenyaReady = confirmedEnv("SWADAKTA_OWNER_KENYA_SETUP_REVIEWED");
  const secretRotationReady = confirmedEnv("SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED");

  return {
    title: "Founder real-world launch pack",
    operating_rule:
      "Show the live site and collect non-sensitive pilot interest now. Take paid jobs only after the legal, insurance, provider, payment-evidence, and ID-verification gates are complete.",
    pilot_rule:
      "The first paid jobs should be low-value, provider-paid, ID-gated, written-scope jobs with proof requirements and milestone release conditions recorded before work starts.",
    phases: [
      {
        id: "legal_home",
        label: "1. Make Swadakta a real business",
        steps: [
          founderStep(
            "choose_legal_home",
            "Choose the legal home and trading setup",
            businessReady ? "ready" : "missing",
            "Decide whether the first operating entity is Australian, Kenyan, or both, then register the structure and trading name accordingly.",
            "If operating from Australia first, start with ABN/business structure guidance and ASIC business-name setup. If Kenya will contract receivers or collect M-Pesa directly, also review BRS/KRA setup.",
            {
              docs_url: DOCS.businessRegistration,
              safe_values: [DOCS.abrAbn, DOCS.asicBusinessName, DOCS.brsKenya, DOCS.kraPin],
              done_when: "Entity/trading setup is chosen, records are saved, and SWADAKTA_OWNER_BUSINESS_REGISTERED=true is set in Vercel.",
              flag: "SWADAKTA_OWNER_BUSINESS_REGISTERED",
            },
          ),
          founderStep(
            "tax_accounting",
            "Get tax and accounting advice",
            taxReady ? "ready" : "missing",
            "Cross-border income, GST, refunds, contractor payments, platform fees, and record keeping need an accountant's setup before paid scaling.",
            "Ask the accountant to confirm GST position, bookkeeping categories, invoice wording, contractor payment records, and owner margin tracking.",
            {
              docs_url: DOCS.atoGst,
              owner: "Founder/accountant",
              done_when: "Accounting workflow is written down and SWADAKTA_OWNER_TAX_REVIEWED=true is set.",
              flag: "SWADAKTA_OWNER_TAX_REVIEWED",
            },
          ),
          founderStep(
            "insurance",
            "Buy suitable insurance",
            insuranceReady ? "ready" : "missing",
            "Real errands, property visits, courier-style jobs, document handling, and advice-adjacent work carry liability.",
            "Confirm public liability, professional indemnity/errors and omissions, cyber/privacy, equipment, and any courier/goods-in-transit cover that matches the jobs you will actually accept.",
            {
              docs_url: DOCS.businessInsurance,
              owner: "Founder/insurance broker",
              done_when: "Policies are active, exclusions are understood, and SWADAKTA_OWNER_INSURANCE_ACTIVE=true is set.",
              flag: "SWADAKTA_OWNER_INSURANCE_ACTIVE",
            },
          ),
        ],
      },
      {
        id: "legal_safety",
        label: "2. Put boundaries around risk",
        steps: [
          founderStep(
            "legal_documents",
            "Review terms, privacy, refunds, and disputes",
            legalReady ? "ready" : "missing",
            "The public site can describe the model, but paid clients need clear terms, refund rules, proof standards, and dispute handling.",
            "Have a lawyer review the site terms, privacy policy, refund wording, prohibited goods rules, receiver agreement, and client service boundaries.",
            {
              docs_url: DOCS.acccConsumerGuarantees,
              owner: "Founder/legal reviewer",
              done_when: "Reviewed documents are live and SWADAKTA_OWNER_LEGAL_REVIEWED=true is set.",
              flag: "SWADAKTA_OWNER_LEGAL_REVIEWED",
            },
          ),
          founderStep(
            "financial_services_boundary",
            "Check escrow/remittance/financial-service boundaries",
            financialBoundaryReady ? "ready" : "missing",
            "Swadakta should avoid acting like an unlicensed bank, remittance provider, or informal escrow service.",
            "Use provider-held funds, payment links, and documented milestone gates. Get AUSTRAC/ASIC/legal advice before holding or moving client funds outside regulated provider rails.",
            {
              docs_url: DOCS.austracRemittance,
              safe_values: [DOCS.asicAfs],
              owner: "Founder/legal reviewer",
              done_when: "The operating model is confirmed and SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED=true is set.",
              flag: "SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED",
            },
          ),
          founderStep(
            "privacy_data",
            "Treat privacy and ID media as launch-critical",
            privacyReady ? "ready" : "missing",
            "The app handles IDs, addresses, family contacts, payment references, receipts, photos, and proof media across borders.",
            "Confirm what personal data is collected, where it is stored, retention/deletion periods, who can access it, and whether Kenya ODPC registration or obligations apply.",
            {
              docs_url: DOCS.oaicSmallBusiness,
              safe_values: [DOCS.odpcKenya],
              owner: "Founder/privacy reviewer",
              done_when: "Privacy controls are reviewed and SWADAKTA_OWNER_PRIVACY_REVIEWED=true is set.",
              flag: "SWADAKTA_OWNER_PRIVACY_REVIEWED",
            },
          ),
          founderStep(
            "receiver_terms",
            "Prepare receiver/contractor terms",
            contractorReady ? "ready" : "missing",
            "Receivers need clear rules before they see paid jobs, client details, proof requests, or payout expectations.",
            "Prepare contractor/receiver terms covering independence, ID verification, prohibited work, proof standards, safety, no direct side deals, disputes, and payout timing.",
            {
              docs_url: DOCS.fairWorkContractors,
              owner: "Founder/legal reviewer",
              done_when: "Receiver terms/code are approved and SWADAKTA_OWNER_CONTRACTOR_TERMS_READY=true is set.",
              flag: "SWADAKTA_OWNER_CONTRACTOR_TERMS_READY",
            },
          ),
        ],
      },
      {
        id: "providers",
        label: "3. Activate payment and ID providers",
        steps: [
          founderStep(
            "payment_accounts",
            "Open provider accounts under the legal entity",
            providerAccountsReady ? "ready" : "missing",
            "Stripe, PayPal, Sumsub, Wise fallback, Vercel, Supabase, OpenAI, and later M-Pesa/Paystack/Flutterwave should all match the chosen legal entity.",
            "Start with Stripe and PayPal for card/client payments, Sumsub for global ID verification, and Wise only as a hidden fallback. Add M-Pesa after Kenya setup is confirmed.",
            {
              docs_url: DOCS.stripeRegister,
              safe_values: [DOCS.paypalDeveloper, DOCS.sumsubHome, DOCS.wiseBusinessHome, DOCS.daraja],
              owner: "Founder/provider admins",
              done_when: "Provider accounts are approved and SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED=true is set.",
              flag: "SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED",
            },
          ),
          founderStep(
            "stripe_webhook",
            "Configure Stripe payment evidence",
            hasEnv("STRIPE_SECRET_KEY") && hasEnv("STRIPE_WEBHOOK_SECRET") ? "ready" : "missing",
            "Stripe can create checkout/payment links, but Swadakta should only treat funds as paid after provider evidence.",
            "Add Stripe server keys in Vercel, configure the webhook, then run a low-value test.",
            {
              docs_url: DOCS.stripeWebhooks,
              safe_values: [stripeWebhookUrl, DOCS.stripePaymentLinks, DOCS.stripeConnect],
              owner: "Founder/Stripe admin",
              done_when: "A test payment confirms through Stripe webhook without exposing secret values.",
            },
          ),
          founderStep(
            "sumsub_verification",
            "Configure Sumsub ID evidence",
            hasEnv("SUMSUB_APP_TOKEN") && hasEnv("SUMSUB_SECRET_KEY") && hasEnv("SUMSUB_LEVEL_NAME") && hasEnv("SUMSUB_WEBHOOK_SECRET")
              ? "ready"
              : "missing",
            "ID verification should come from the provider, not from screenshots, users, or AI.",
            "Create a Sumsub level, add token/secret/level/webhook secret in Vercel, paste the webhook URL into Sumsub, then run one test account.",
            {
              docs_url: DOCS.sumsubWebsdkLink,
              safe_values: [sumsubWebhookUrl, DOCS.sumsubWebhooks],
              owner: "Founder/Sumsub admin",
              done_when: "A test user can start verification and the signed webhook updates Swadakta status.",
            },
          ),
          founderStep(
            "mpesa_kenya",
            "Prepare M-Pesa only after Kenya setup",
            kenyaReady && hasEnv("MPESA_CONSUMER_KEY") && hasEnv("MPESA_CONSUMER_SECRET") ? "manual" : "missing",
            "M-Pesa is valuable for Kenya payments, but live Daraja access depends on Kenya-side business/payment setup.",
            "Use sandbox first. Do not enable live M-Pesa until Safaricom approval, callback protection, settlement, tax, and evidence mapping are tested.",
            {
              docs_url: DOCS.daraja,
              safe_values: [mpesaWebhookUrl],
              owner: "Founder/Kenya payment admin",
              done_when: "Daraja live approval and webhook evidence tests are complete.",
              flag: "SWADAKTA_OWNER_KENYA_SETUP_REVIEWED",
            },
          ),
          founderStep(
            "secret_rotation",
            "Rotate any exposed keys before launch",
            secretRotationReady ? "ready" : "missing",
            "Any API key pasted into chat, screenshots, browser fields, or support conversations should be treated as exposed.",
            "Create fresh keys, store them only in Vercel/Supabase secrets, and remove old keys from providers.",
            {
              docs_url: DOCS.vercelEnv,
              owner: "Founder/security admin",
              done_when: "Fresh keys are stored only as server-side secrets and SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED=true is set.",
              flag: "SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED",
            },
          ),
        ],
      },
      {
        id: "pilot",
        label: "4. Run the first paid pilot safely",
        steps: [
          founderStep(
            "first_jobs",
            "Start with low-risk jobs only",
            "manual",
            "The first live revenue should prove workflow, proof, payments, and receiver reliability without exposing the business to high-value or unclear legal risk.",
            "Accept only clear, legal, low-value tasks with written scope, confirmed ID where needed, provider-paid funds, proof plan, and milestone release notes.",
            {
              docs_url: `${base}/admin-readiness`,
              owner: "Founder/admin",
              done_when: "At least one end-to-end pilot completes with payment evidence, proof, review, and no unresolved dispute.",
            },
          ),
        ],
      },
    ],
  };
}

function pilotStep(id, label, status, screen, action, evidence, options = {}) {
  return {
    id,
    label,
    status,
    screen,
    action,
    evidence,
    owner: options.owner || "Founder/admin",
    route_url: options.route_url || "",
    hard_stop: options.hard_stop || "",
  };
}

function buildFirstPaidPilotScript() {
  const base = publicUrl() || "https://swadakta.com";
  const stripeEvidenceReady = hasEnv("STRIPE_SECRET_KEY") && hasEnv("STRIPE_WEBHOOK_SECRET");
  const paypalReady = hasEnv("PAYPAL_CLIENT_ID") && hasEnv("PAYPAL_CLIENT_SECRET");
  const mpesaReady = hasEnv("MPESA_CONSUMER_KEY") && hasEnv("MPESA_CONSUMER_SECRET") && hasEnv("MPESA_SHORTCODE");
  const paymentRailReady = stripeEvidenceReady || paypalReady || mpesaReady;
  const sumsubReady =
    hasEnv("SUMSUB_APP_TOKEN") &&
    hasEnv("SUMSUB_SECRET_KEY") &&
    hasEnv("SUMSUB_LEVEL_NAME") &&
    hasEnv("SUMSUB_WEBHOOK_SECRET");
  const hostedIdentityReady = anyEnv(["SMILE_ID_VERIFICATION_URL", "SUMSUB_VERIFICATION_URL", "YOUVERIFY_VERIFICATION_URL"]);
  const identityReady = sumsubReady || hostedIdentityReady;

  return {
    title: "First paid pilot rehearsal",
    rule:
      "Run this with a low-value internal or friendly-client job before accepting ordinary public paid work. The goal is to prove account, brief, identity, payment evidence, receiver offer, proof, tracking, and review without bypassing protected decisions.",
    target_job:
      "Use one simple, legal, low-risk concierge task such as a local site photo check, document pickup quote, supplier price check, or family-support errand. Avoid land/title, cash handling, medical/legal, restricted goods, or high-value purchases for the first run.",
    ready_summary: {
      identity_handoff: identityReady ? "ready" : "missing",
      payment_evidence: paymentRailReady ? "ready" : "missing",
      stripe_evidence: stripeEvidenceReady ? "ready" : "missing",
      paypal_orders: paypalReady ? "ready" : "missing",
      mpesa_stk: mpesaReady ? "ready" : "missing",
    },
    phases: [
      {
        id: "account_and_brief",
        label: "1. Account, profile, and request",
        steps: [
          pilotStep(
            "client_account",
            "Create or sign in as the client",
            "manual",
            "Portal / Account Home",
            "Create a normal user account, save profile basics, mobile backup, base country, preferred currency, and role choices.",
            "Account opens to the account home without staying stuck on sign-in. Profile data is saved and visible after refresh.",
            {
              route_url: `${base}/portal`,
              owner: "Founder/test client",
              hard_stop: "Do not continue if sign-in returns to the sign-in page or profile saves fail.",
            },
          ),
          pilotStep(
            "brief_submit",
            "Submit one low-risk brief",
            "manual",
            "Create brief",
            "Use the AI organizer or manual fields to create a simple active-lane task with origin, destination, task location, budget comfort, proof requirements, contact preference, and compliance acknowledgement.",
            "Admin can see request code, route, service package, proof priority, consent, and notes without needing private data in chat.",
            {
              route_url: `${base}/brief`,
              hard_stop: "Reject the pilot if the job involves illegal goods, unclear authority, high value, medical/legal advice, or customs uncertainty.",
            },
          ),
        ],
      },
      {
        id: "identity_and_payment",
        label: "2. Identity, quote, and provider payment",
        steps: [
          pilotStep(
            "identity_start",
            "Start ID verification",
            identityReady ? "ready" : "missing",
            "Verification Center / Account Home",
            "Trigger provider-led verification for the client, then for the receiver/operator if a receiver will touch the task.",
            "The request gets a provider reference/link or stays clearly queued with paid actions locked. No user, screenshot, or AI marks anyone verified.",
            {
              route_url: `${base}/verification`,
              hard_stop: "Do not accept paid or sensitive work until a provider route exists or a documented exception review is approved.",
            },
          ),
          pilotStep(
            "quote_and_milestones",
            "Quote and create milestone controls",
            "manual",
            "Founder Ops",
            "Set quote amount, currency, service fee wording, payment preference, protected amount, funds status, due date, release condition, and at least two milestones.",
            "Client-facing quote is clear; internal founder economics remain private; milestone release still requires proof review.",
            {
              route_url: `${base}/admin-ops`,
              owner: "Founder/admin",
              hard_stop: "Do not send a payment request if the internal economics guard says the quote is below floor.",
            },
          ),
          pilotStep(
            "payment_evidence",
            "Run one payment evidence test",
            paymentRailReady ? "ready" : "missing",
            "Founder Ops / Provider dashboard",
            "Use Stripe Checkout/Payment Link, PayPal order/invoice, or M-Pesa sandbox/live test according to the configured rail. Confirm provider reference, amount, currency, and request code.",
            "Payment status changes only from provider evidence or founder reconciliation. Receiver assignment and milestone release do not happen automatically.",
            {
              route_url: `${base}/payments`,
              owner: "Founder/payment admin",
              hard_stop: "If amount, currency, payer, or provider reference do not match, mark the funds disputed and pause the pilot.",
            },
          ),
        ],
      },
      {
        id: "receiver_and_proof",
        label: "3. Receiver, proof, tracking, and closeout",
        steps: [
          pilotStep(
            "receiver_offer",
            "Test receiver offer and assignment gates",
            "manual",
            "Account Home / Founder Ops",
            "Have a receiver profile apply or place an offer. Confirm unverified receivers cannot be assigned and that the lowest price does not automatically win.",
            "Admin sees offer quality, provenance, identity/vetting status, proof plan, and safety flags before choosing a preferred receiver for review.",
            {
              route_url: `${base}/portal#find-work`,
              hard_stop: "Do not assign anyone who is not vetted, ID-verified, and suitable for the route/task.",
            },
          ),
          pilotStep(
            "proof_messages",
            "Submit proof and communications",
            "manual",
            "Messages / Proof",
            "Send one text update, one photo/file proof link or upload, and one video/voice-call request note if relevant.",
            "Admin can review proof before it becomes client-facing. Sensitive documents are not copied into public messages.",
            {
              route_url: `${base}/messages`,
              hard_stop: "Pause if proof is missing, low quality, mismatched, or exposes unnecessary personal data.",
            },
          ),
          pilotStep(
            "tracking_closeout",
            "Track, close, review, and update provenance",
            "manual",
            "Tracking / Resolution",
            "Confirm the client can track request status, payment/funds status, milestones, proof/report links, and resolution path. Close the job only after final proof is accepted.",
            "Client review is captured, receiver provenance responds to performance, and no unresolved dispute remains.",
            {
              route_url: `${base}/tracking`,
              hard_stop: "Do not mark completed if payment, proof, client acceptance, or dispute status is unclear.",
            },
          ),
        ],
      },
    ],
    pass_conditions: [
      "Signed-in account reaches Account Home and stays signed in after refresh.",
      "Brief creates a request code and admin can see all route, proof, budget, and consent context.",
      "Identity handoff creates provider evidence or a clear queued state; paid actions stay locked when evidence is missing.",
      "Payment evidence records provider reference, amount, currency, and request code before funds are treated as protected.",
      "Receiver assignment is blocked unless the receiver is vetted and ID-verified.",
      "Proof and messages are reviewable by admin before client-facing closeout.",
      "Tracking shows safe status without exposing internal notes or founder economics.",
      "AI helps draft, organize, and summarize but does not approve ID, release/refund money, assign receivers, or send protected external commitments.",
    ],
  };
}

function authSecurityItems() {
  const projectRef = supabaseProjectRef();
  const projectBase = projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : "";
  const emailDeliveryReviewed = confirmedEnv("SWADAKTA_OWNER_AUTH_EMAIL_DELIVERABILITY_REVIEWED");

  return [
    item(
      "supabase_auth_redirect_urls",
      "Auth production redirects",
      "manual",
      "Supabase Auth Site URL and Redirect URLs must point at swadakta.com so email confirmation, password reset, and OAuth links do not send users back to localhost.",
      "Set Site URL to https://swadakta.com and allow https://swadakta.com/** before sharing sign-in links publicly.",
      ["Supabase Auth Site URL", "Supabase Auth Redirect URLs"],
      {
        docs_url: DOCS.supabaseRedirectUrls,
        copy_value: projectBase ? `${projectBase}/auth/url-configuration` : `${publicUrl() || "https://swadakta.com"}/auth`,
        priority: 11,
        owner: "Founder/Supabase admin",
      },
    ),
    item(
      "supabase_auth_email_delivery",
      "Auth email deliverability",
      emailDeliveryReviewed ? "ready" : "manual",
      "Password resets, email confirmations, and optional magic links need a production sender that does not send users back to localhost.",
      emailDeliveryReviewed
        ? "Auth email sender, domain authentication, templates, and a production sign-up/reset test are recorded."
        : "Configure custom SMTP or a reviewed sender in Supabase Auth, authenticate the sending domain with SPF/DKIM/DMARC, update templates to use swadakta.com redirects, then send one test confirmation and one password reset.",
      emailDeliveryReviewed ? [] : ["SWADAKTA_OWNER_AUTH_EMAIL_DELIVERABILITY_REVIEWED"],
      {
        docs_url: DOCS.supabaseAuthSmtp,
        copy_value: `${DOCS.supabaseAuthEmailTemplates} | ${DOCS.supabaseAuthSmtp}`,
        priority: 12,
        owner: "Founder/Supabase admin",
      },
    ),
    item(
      "supabase_leaked_password_protection",
      "Leaked-password protection",
      "manual",
      "Supabase Auth should reject known-compromised passwords before Swadakta opens paid work and identity upload flows to the public.",
      "Enable leaked-password protection in Supabase Auth password security settings, then re-run Supabase advisors.",
      ["Auth leaked-password protection advisor"],
      {
        docs_url: DOCS.supabasePasswordSecurity,
        copy_value: projectBase ? `${projectBase}/auth/security` : "",
        priority: 13,
        owner: "Founder/Supabase admin",
      },
    ),
    item(
      "supabase_auth_attack_protection",
      "Auth attack protection",
      "manual",
      "Sign-up, sign-in, password reset, and OTP flows should have rate-limit and bot-protection settings reviewed before paid campaigns.",
      "Review Supabase Auth rate limits and add CAPTCHA or Turnstile if sign-up spam or credential-stuffing risk appears.",
      ["Auth rate limits review", "CAPTCHA or Turnstile decision"],
      {
        docs_url: DOCS.supabaseAuthRateLimits,
        copy_value: DOCS.supabaseAuthCaptcha,
        priority: 14,
        owner: "Founder/Supabase admin",
      },
    ),
  ];
}

function ownerLaunchItems() {
  return [
    ownerFlagItem(
      "owner_business_registration",
      "Business registration and trading name",
      "SWADAKTA_OWNER_BUSINESS_REGISTERED",
      "The owner must choose the legal home, business structure, ABN/company setup, and trading name before public paid launch.",
      "Register or confirm the business/legal structure and trading name, then set SWADAKTA_OWNER_BUSINESS_REGISTERED=true in Vercel.",
      {
        docs_url: DOCS.businessRegistration,
        priority: 4,
      },
    ),
    ownerFlagItem(
      "owner_tax_accounting",
      "Tax and accounting review",
      "SWADAKTA_OWNER_TAX_REVIEWED",
      "Cross-border income, GST, contractor payments, records, refunds, and platform fees need an accountant/tax review.",
      "Get tax/accounting advice, then set SWADAKTA_OWNER_TAX_REVIEWED=true.",
      {
        docs_url: DOCS.atoGst,
        priority: 5,
        owner: "Founder/accountant",
      },
    ),
    ownerFlagItem(
      "owner_insurance_active",
      "Insurance active before real field jobs",
      "SWADAKTA_OWNER_INSURANCE_ACTIVE",
      "Swadakta should not take real paid field, courier, property, or proof jobs without suitable insurance.",
      "Buy/confirm public liability, professional indemnity, cyber/privacy, and any goods/courier cover, then set SWADAKTA_OWNER_INSURANCE_ACTIVE=true.",
      {
        docs_url: DOCS.businessInsurance,
        priority: 6,
      },
    ),
    ownerFlagItem(
      "owner_legal_review",
      "Terms, refund, and operating legal review",
      "SWADAKTA_OWNER_LEGAL_REVIEWED",
      "Terms, privacy, refund/dispute wording, payment wording, and service boundaries need legal review before paid scaling.",
      "Have the legal documents and operating model reviewed, then set SWADAKTA_OWNER_LEGAL_REVIEWED=true.",
      {
        docs_url: DOCS.acccConsumerGuarantees,
        priority: 7,
        owner: "Founder/legal reviewer",
      },
    ),
    ownerFlagItem(
      "owner_financial_boundary_review",
      "Financial services/remittance boundary review",
      "SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED",
      "If Swadakta transfers client money, acts like escrow, or controls payouts outside regulated provider rails, AUSTRAC/ASIC advice may be required.",
      "Get legal/compliance advice confirming Swadakta is staying inside provider-held payment and concierge boundaries, then set SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED=true.",
      {
        docs_url: DOCS.austracRemittance,
        priority: 8,
        owner: "Founder/legal reviewer",
      },
    ),
    ownerFlagItem(
      "owner_contractor_terms",
      "Receiver contractor terms and code of conduct",
      "SWADAKTA_OWNER_CONTRACTOR_TERMS_READY",
      "Receivers need clear contractor terms, proof obligations, safety rules, payout timing, prohibited tasks, and dispute consequences.",
      "Prepare receiver/contractor agreement and code of conduct, then set SWADAKTA_OWNER_CONTRACTOR_TERMS_READY=true.",
      {
        docs_url: DOCS.fairWorkContractors,
        priority: 9,
        owner: "Founder/legal reviewer",
      },
    ),
    ownerFlagItem(
      "owner_privacy_data_review",
      "Privacy and data registration review",
      "SWADAKTA_OWNER_PRIVACY_REVIEWED",
      "The app handles IDs, photos, family contacts, addresses, payment references, proof media, and cross-border data.",
      "Review Australian privacy obligations, Kenya ODPC/data-controller requirements, retention, deletion, and access controls; then set SWADAKTA_OWNER_PRIVACY_REVIEWED=true.",
      {
        docs_url: DOCS.oaicSmallBusiness,
        priority: 10,
        owner: "Founder/privacy reviewer",
      },
    ),
    ownerFlagItem(
      "owner_provider_accounts",
      "Provider accounts approved under legal entity",
      "SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED",
      "Stripe, PayPal Business, Wise Business fallback, ID verification, and later M-Pesa/Paystack/Flutterwave should be approved under the chosen legal entity.",
      "Open and verify provider accounts under the chosen legal entity, then set SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED=true.",
      {
        docs_url: DOCS.businessRegistrationService,
        priority: 12,
      },
    ),
    ownerFlagItem(
      "owner_secret_rotation",
      "Exposed secret rotation confirmed",
      "SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED",
      "Any API key pasted into chat, browser fields, screenshots, or support tools must be treated as exposed before launch.",
      "Rotate exposed keys, store fresh values only as server-side Vercel/Supabase secrets, then set SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED=true.",
      {
        docs_url: DOCS.vercelEnv,
        priority: 13,
        owner: "Founder/security admin",
      },
    ),
    ownerFlagItem(
      "owner_kenya_operating_review",
      "Kenya operating setup review",
      "SWADAKTA_OWNER_KENYA_SETUP_REVIEWED",
      "Kenya-side operations may need BRS/KRA/ODPC/Safaricom setup depending on entity structure, local collection, staffing, and data processing.",
      "Confirm Kenya business/tax/data/M-Pesa setup requirements with qualified advisors or provider onboarding, then set SWADAKTA_OWNER_KENYA_SETUP_REVIEWED=true.",
      {
        docs_url: DOCS.brsKenya,
        priority: 14,
        owner: "Founder/Kenya advisor",
      },
    ),
    ownerFlagItem(
      "owner_first_paid_pilot_passed",
      "First paid pilot passed",
      "SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED",
      "Public paid launch should wait until one low-risk friendly-client pilot proves account access, ID handoff, provider payment evidence, receiver/proof workflow, tracking, and closeout.",
      "Run the first paid pilot script, save the proof/payment/closeout notes, then set SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED=true only if there is no unresolved dispute.",
      {
        docs_url: `${publicUrl() || "https://swadakta.com"}/admin-readiness`,
        priority: 15,
        owner: "Founder/admin",
      },
    ),
    ownerFlagItem(
      "owner_regulated_escrow_ready",
      "Regulated escrow/high-value provider ready",
      "SWADAKTA_OWNER_REGULATED_ESCROW_READY",
      "High-value property, title, construction, supplier-deposit, or sensitive-funds jobs need a regulated escrow/payment-provider route or written legal confirmation before normal acceptance.",
      "Choose a regulated escrow/provider-held funds route or get legal confirmation for the high-value operating model, then set SWADAKTA_OWNER_REGULATED_ESCROW_READY=true.",
      {
        docs_url: DOCS.asicAfs,
        priority: 16,
        owner: "Founder/legal reviewer",
      },
    ),
  ];
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
  const [home, portal, finalUxTheme, security, privacy, terms, robots, sitemap, adminReadiness] = await Promise.all([
    fetchPublic("/", { readText: false }),
    fetchPublic("/portal"),
    fetchPublic(`/${EXPECTED_FINAL_UX_THEME_REF}`),
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
    security.ok && /Policy:\s*https:\/\/swadakta\.com\/trust/i.test(security.text) ? "" : "Policy",
    security.ok && /Canonical:\s*https:\/\/swadakta\.com\/\.well-known\/security\.txt/i.test(security.text) ? "" : "Canonical",
    security.ok && /Expires:/i.test(security.text) ? "" : "Expires",
  ].filter(Boolean);
  const publicFilesMissing = [
    robots.ok ? "" : "robots.txt",
    ...(sitemap.ok ? sitemapMissingItems(sitemap.text) : ["sitemap.xml"]),
  ].filter(Boolean);
  const adminNoindex = String(adminReadiness.headers.get("x-robots-tag") || "");
  const portalBundleMissing = [
    portal.ok && portal.text.includes(EXPECTED_APP_DATA_REF) ? "" : EXPECTED_APP_DATA_REF,
    portal.ok && portal.text.includes(EXPECTED_PORTAL_SCRIPT_REF) ? "" : EXPECTED_PORTAL_SCRIPT_REF,
  ].filter(Boolean);
  const finalUxCacheControl = String(finalUxTheme.headers.get("cache-control") || "");
  const finalUxMissing = [
    portal.ok && portal.text.includes(EXPECTED_FINAL_UX_THEME_REF) ? "" : EXPECTED_FINAL_UX_THEME_REF,
    ...FINAL_UX_PORTAL_MARKERS.map((marker) => (portal.ok && portal.text.includes(marker) ? "" : marker)),
    finalUxTheme.ok ? "" : EXPECTED_FINAL_UX_THEME_REF,
    ...FINAL_UX_THEME_MARKERS.map((marker) => (finalUxTheme.ok && finalUxTheme.text.includes(marker) ? "" : marker)),
    /no-store/i.test(finalUxCacheControl) ? "" : "final UX theme no-store cache header",
    LEGACY_PURPLE_UI_MARKERS.some(
      (marker) => (portal.ok && portal.text.includes(marker)) || (finalUxTheme.ok && finalUxTheme.text.includes(marker)),
    )
      ? "legacy purple UI marker"
      : "",
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
      "final_ux_live_freshness",
      "Final UX freshness",
      finalUxMissing.length === 0 ? "ready" : "warning",
      finalUxTheme.ok
        ? "Live portal and shared final UX theme were checked for workflow-first account home markers, no-store caching, and old purple UI markers."
        : `Could not check final UX theme: ${finalUxTheme.error || finalUxTheme.status}.`,
      finalUxMissing.length
        ? "Redeploy, clear stale cache, or relink the final UX theme before showing the signed-in home to users."
        : "Final UX is live on the account portal and the theme is freshness-protected.",
      finalUxMissing,
      {
        docs_url: DOCS.vercelHeaders,
        copy_value: `${publicUrl() || "https://swadakta.com"}/${EXPECTED_FINAL_UX_THEME_REF}`,
        priority: 12,
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
        ? "security.txt is reachable at the well-known URL and exposes vulnerability-reporting contact and policy metadata."
        : `security.txt check failed: ${security.error || security.status}.`,
      "Keep Contact, Policy, Canonical, and Expires current so researchers know how to report issues safely.",
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
      "robots.txt and sitemap.xml help the public site be discoverable while admin, auth, and account surfaces stay hidden.",
      publicFilesMissing.length
        ? "Publish a public-only sitemap with current lastmod dates, and keep robots.txt blocking admin/auth/private surfaces."
        : "robots.txt is reachable, and sitemap.xml is public-only with current launch-work dates.",
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
  const paystackMissing = missingEnv(["PAYSTACK_SECRET_KEY", "PAYSTACK_WEBHOOK_SECRET"]);
  const flutterwaveMissing = missingEnv(["FLUTTERWAVE_SECRET_KEY", "FLUTTERWAVE_WEBHOOK_SECRET"]);
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
  const sumsubNativeMissing = missingEnv(["SUMSUB_APP_TOKEN", "SUMSUB_SECRET_KEY", "SUMSUB_LEVEL_NAME"]);
  const sumsubWebhookMissing = missingEnv(["SUMSUB_WEBHOOK_SECRET"]);
  const stripeWebhookUrl = `${publicUrl() || "https://swadakta.com"}/api/payments/stripe-webhook`;
  const mpesaWebhookUrl = mpesaCallbackUrl();
  const paystackWebhookUrl = `${publicUrl() || "https://swadakta.com"}/api/payments/paystack-webhook`;
  const flutterwaveWebhookUrl = `${publicUrl() || "https://swadakta.com"}/api/payments/flutterwave-webhook`;
  const identityStartUrl = `${publicUrl() || "https://swadakta.com"}/api/identity/start-verification`;
  const sumsubWebhookUrl = `${publicUrl() || "https://swadakta.com"}/api/identity/sumsub-webhook`;
  const identityStartEndpoint = await fetchPublic("/api/identity/start-verification", { readText: false });
  const identityStartEndpointReady = identityStartEndpoint.status === 405;
  const identityProviderLinkReady = anyEnv([
    "SMILE_ID_VERIFICATION_URL",
    "SMILE_ID_WEB_LINK_URL",
    "SMILE_ID_PORTAL_URL",
    "SUMSUB_VERIFICATION_URL",
    "SUMSUB_WEBSDK_URL",
    "SUMSUB_APPLICANT_LINK_URL",
    "YOUVERIFY_VERIFICATION_URL",
    "YOUVERIFY_APPLICANT_LINK_URL",
  ]) || sumsubNativeMissing.length === 0;
  const identityProviderLinkMissing = missingEnv([
    "SMILE_ID_VERIFICATION_URL",
    "SUMSUB_VERIFICATION_URL",
    "YOUVERIFY_VERIFICATION_URL",
  ]);

  const categories = [
    {
      id: "owner_legal",
      label: "Owner legal and launch authority",
      items: ownerLaunchItems(),
    },
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
        ...authSecurityItems(),
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
      id: "africa_payment_expansion",
      label: "Africa payment expansion",
      items: [
        paymentExpansionRailItem({
          id: "paystack_africa_pilot",
          label: "Paystack Africa pilot",
          provider: "Paystack",
          requiredEnv: ["PAYSTACK_SECRET_KEY", "PAYSTACK_WEBHOOK_SECRET"],
          settlementEnv: "PAYSTACK_SETTLEMENT_CURRENCIES",
          merchantEnv: "PAYSTACK_MERCHANT_APPROVED",
          endpointEnv: "PAYSTACK_WEBHOOK_ENDPOINT_READY",
          evidenceEnv: "PAYSTACK_PROVIDER_EVIDENCE_MAPPED",
          callbackPath: "/api/payments/paystack-webhook",
          docs_url: DOCS.paystackWebhooks,
          priority: 54,
          owner: "Founder/Paystack admin",
        }),
        item(
          "paystack_transaction_verify",
          "Paystack transaction verification",
          paystackMissing.length || !confirmedEnv("PAYSTACK_PROVIDER_EVIDENCE_MAPPED") ? "manual" : "ready",
          "Paystack payments should be verified server-side by reference before Swadakta treats funds as protected.",
          "Map Paystack reference, amount, currency, customer, and status into the Swadakta request before any receiver assignment or milestone release.",
          [
            ...paystackMissing,
            ...(confirmedEnv("PAYSTACK_PROVIDER_EVIDENCE_MAPPED") ? [] : ["PAYSTACK_PROVIDER_EVIDENCE_MAPPED"]),
          ],
          {
            docs_url: DOCS.paystackVerifyPayments,
            copy_value: paystackWebhookUrl,
            priority: 55,
            owner: "Founder/Paystack admin",
          },
        ),
        paymentExpansionRailItem({
          id: "flutterwave_africa_pilot",
          label: "Flutterwave Africa pilot",
          provider: "Flutterwave",
          requiredEnv: ["FLUTTERWAVE_SECRET_KEY", "FLUTTERWAVE_WEBHOOK_SECRET"],
          settlementEnv: "FLUTTERWAVE_SETTLEMENT_CURRENCIES",
          merchantEnv: "FLUTTERWAVE_MERCHANT_APPROVED",
          endpointEnv: "FLUTTERWAVE_WEBHOOK_ENDPOINT_READY",
          evidenceEnv: "FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED",
          callbackPath: "/api/payments/flutterwave-webhook",
          docs_url: DOCS.flutterwaveWebhooks,
          priority: 56,
          owner: "Founder/Flutterwave admin",
        }),
        item(
          "flutterwave_transaction_verify",
          "Flutterwave transaction verification",
          flutterwaveMissing.length || !confirmedEnv("FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED") ? "manual" : "ready",
          "Flutterwave payments should be verified server-side by transaction/reference before Swadakta treats funds as protected.",
          "Map Flutterwave transaction id/reference, amount, currency, customer, and status into the Swadakta request before any receiver assignment or milestone release.",
          [
            ...flutterwaveMissing,
            ...(confirmedEnv("FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED") ? [] : ["FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED"]),
          ],
          {
            docs_url: DOCS.flutterwaveWebhooks,
            copy_value: flutterwaveWebhookUrl,
            priority: 57,
            owner: "Founder/Flutterwave admin",
          },
        ),
      ],
    },
    {
      id: "ai_identity",
      label: "AI and identity verification",
      items: [
        item(
          "ai_manual_mode_boundary",
          "AI/manual mode fallback",
          "ready",
          "The browser preference `swadakta_ai_mode` lets users and admins run Swadakta with AI on or off. Manual mode hides AI-only shortcuts and keeps queues, provider checks, payments, verification, messages, and tracking usable.",
          "Keep the manual fallback working on every page that depends on AI assistance, so Swadakta can operate even when AI is disabled, unavailable, or intentionally avoided.",
          [],
          { priority: 15, owner: "Founder/product" },
        ),
        item(
          "admin_ai_prompt_boundaries",
          "Admin AI approval prompts",
          "ready",
          "Admin operations can group work into routine AI prompts, provider-evidence gates, and founder-gated protected decisions using compact Yes/No/Need evidence prompts.",
          "Use AI for drafts, summaries, and checklists only; payment release, refunds, ID approval, receiver assignment, and external messages remain provider/founder gated.",
          [],
          { priority: 16, owner: "Founder/admin" },
        ),
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
          "Provider link storage",
          "ready",
          "Admin can store provider, status, verification link, reference, verified time, and notes for every account and receiver.",
          "Use this while provider API sessions are not automated.",
          [],
          { docs_url: DOCS.smileIdWeb, priority: 36, owner: "Founder/admin" },
        ),
        item(
          "identity_start_endpoint",
          "Identity start endpoint",
          identityStartEndpointReady ? "ready" : "warning",
          identityStartEndpointReady
            ? "/api/identity/start-verification is deployed and rejects unsafe GET requests with 405."
            : `Identity start endpoint check returned ${identityStartEndpoint.status || identityStartEndpoint.error}.`,
          identityStartEndpointReady
            ? "The existing Stitch verification forms can call the server-side provider handoff after the request queue is saved."
            : "Deploy the identity start endpoint before asking users to start provider-led verification from the app.",
          identityStartEndpointReady ? [] : ["api/identity/start-verification"],
          {
            docs_url: DOCS.vercelEnv,
            copy_value: identityStartUrl,
            priority: 30,
            owner: "Founder/Vercel admin",
          },
        ),
        item(
          "provider_handoff_links",
          "Provider handoff links",
          identityProviderLinkReady ? "ready" : "missing",
          identityProviderLinkReady
            ? "At least one provider handoff route or native Sumsub WebSDK link route is configured for the server-side verification start flow."
            : "The server endpoint can queue verification, but it cannot issue a provider link until Smile ID, Sumsub, or Youverify handoff URLs or Sumsub native credentials are configured.",
          identityProviderLinkReady
            ? "Run a low-risk test account and confirm the provider reference returns to Swadakta before unlocking paid actions."
            : "Add a provider-approved hosted verification URL or Sumsub native WebSDK credentials in Vercel, then keep provider evidence as the only source of verified status.",
          identityProviderLinkReady
            ? []
            : [...identityProviderLinkMissing, "or SUMSUB_APP_TOKEN/SUMSUB_SECRET_KEY/SUMSUB_LEVEL_NAME"],
          {
            docs_url: DOCS.sumsubWebsdkLink,
            copy_value: "SMILE_ID_VERIFICATION_URL / SUMSUB_APP_TOKEN+SUMSUB_SECRET_KEY+SUMSUB_LEVEL_NAME / YOUVERIFY_VERIFICATION_URL",
            priority: 31,
            owner: "Founder/ID provider admin",
          },
        ),
        item(
          "sumsub_websdk_link",
          "Sumsub WebSDK link automation",
          sumsubNativeMissing.length ? "missing" : "ready",
          sumsubNativeMissing.length
            ? "Sumsub native WebSDK link generation is not configured yet."
            : "Sumsub native WebSDK links can be generated server-side by /api/identity/start-verification.",
          sumsubNativeMissing.length
            ? "Create/approve the Sumsub account, choose the verification level name, then add the app token, secret key, and level name in Vercel."
            : "Run a low-risk account through Sumsub and confirm the external user reference matches the Swadakta verification request.",
          sumsubNativeMissing,
          {
            docs_url: DOCS.sumsubWebsdkLink,
            priority: 32,
            owner: "Founder/Sumsub admin",
          },
        ),
        item(
          "sumsub_webhook",
          "Sumsub signed webhook",
          sumsubWebhookMissing.length || !serviceRoleConfigured ? "missing" : "ready",
          sumsubWebhookMissing.length || !serviceRoleConfigured
            ? "Sumsub provider evidence cannot update Swadakta automatically until the webhook secret and server Supabase key are configured."
            : "Sumsub signed webhooks can update account verification status from provider evidence.",
          "Paste this endpoint into Sumsub Webhook Manager and set SUMSUB_WEBHOOK_SECRET in Vercel. The webhook can mark verified/failed/manual-review, but AI and users cannot approve ID.",
          [...sumsubWebhookMissing, ...(serviceRoleConfigured ? [] : ["SUPABASE_SERVICE_ROLE_KEY"])],
          {
            docs_url: DOCS.sumsubWebhooks,
            copy_value: sumsubWebhookUrl,
            priority: 33,
            owner: "Founder/Sumsub admin",
          },
        ),
        item(
          "smile_id_api",
          "Smile ID API sessions",
          smileIdConfigured ? "manual" : "missing",
          "Smile ID credentials can be tracked, but native Smile ID session creation still needs the provider-approved web/link route or Smile SDK wiring.",
          "Use Smile ID as the Africa-first provider route after the account is approved; store a Smile Links URL now, then add native session/webhook automation as the next ID rail.",
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
  const launchGate = buildLaunchGate(categories);
  const providerContext = {
    serviceRoleConfigured,
    stripeWebhookMissing,
    paypalMissing,
    paystackMissing,
    flutterwaveMissing,
    mpesaMissing,
    wiseConfigured,
    smileIdConfigured,
    sumsubNativeMissing,
    sumsubWebhookMissing,
    stripeWebhookUrl,
    mpesaWebhookUrl,
    paystackWebhookUrl,
    flutterwaveWebhookUrl,
    identityStartUrl,
    sumsubWebhookUrl,
  };
  const providerLaunchMatrix = buildProviderLaunchMatrix(providerContext);
  const corridorRailPlanner = buildCorridorRailPlanner(providerContext);
  const launchDecisionRegister = buildLaunchDecisionRegister(providerContext);
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
    launch_gate: launchGate,
    launch_decision_register: launchDecisionRegister,
    provider_launch_matrix: providerLaunchMatrix,
    corridor_rail_planner: corridorRailPlanner,
    founder_launch_session: buildFounderLaunchSession(),
    founder_action_pack: buildFounderActionPack(),
    first_paid_pilot_script: buildFirstPaidPilotScript(),
    categories,
    next_actions: buildNextActions(categories),
    safe_copy_values: {
      stripe_webhook_url: stripeWebhookUrl,
      mpesa_callback_url: mpesaWebhookUrl,
      paystack_webhook_url: paystackWebhookUrl,
      flutterwave_webhook_url: flutterwaveWebhookUrl,
      identity_start_url: identityStartUrl,
      sumsub_webhook_url: sumsubWebhookUrl,
      final_ux_theme_url: `${publicUrl() || "https://swadakta.com"}/${EXPECTED_FINAL_UX_THEME_REF}`,
    },
    protected_actions: [
      "Money release, refund, paid status, and milestone release stay founder/admin decisions.",
      "ID approval can only come from signed provider evidence or admin exception review; AI and users cannot approve ID.",
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
    res.setHeader("Allow", "GET, OPTIONS");
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
