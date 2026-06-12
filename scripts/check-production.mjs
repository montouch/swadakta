import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (process.env.SWADAKTA_BASE_URL || "https://swadakta.com").replace(/\/+$/, "");
const cacheBust = Date.now();
const localBaseHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const htmlFiles = [
  "admin.html",
  "admin-ops.html",
  "admin-readiness.html",
  "admin-verification.html",
  "assistant.html",
  "auth.html",
  "brief.html",
  "corridor.html",
  "index.html",
  "messages.html",
  "payments.html",
  "portal.html",
  "privacy.html",
  "resolution.html",
  "rules.html",
  "terms.html",
  "trust.html",
  "tracking.html",
  "verification.html",
];

const requiredPages = [
  "/",
  "/portal",
  "/auth",
  "/brief",
  "/corridor",
  "/tracking",
  "/messages",
  "/verification",
  "/trust",
  "/payments",
  "/resolution",
  "/rules",
  "/admin-ops",
  "/admin-verification",
];
const paymentProviderEndpoints = [
  "/api/payments/stripe-webhook",
  "/api/payments/mpesa-callback",
  "/api/payments/paypal-capture",
  "/api/payments/paystack-webhook",
  "/api/payments/flutterwave-webhook",
];
const requiredSecurityHeaders = [
  ["strict-transport-security", "max-age="],
  ["content-security-policy", "default-src 'self'"],
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["permissions-policy", "camera=(self)"],
];
const privateNoStorePages = [
  "/admin-ops",
  "/admin-readiness",
  "/admin-verification",
  "/auth",
  "/portal",
  "/brief",
  "/tracking",
  "/verification",
  "/assistant",
  "/messages",
  "/resolution",
];
const requiredAppDataMarkers = [
  "assertPaidPostingAllowed",
  "get_my_account_profile",
  "createMpesaStkPush",
  "createResolutionCase",
  "exchangeAuthCodeForSession",
  "uploadAccountMedia",
  "coverage_scopes",
  "missingColumn",
  "listMarketplaceJobs",
  "submitJobOffer",
  "listMyJobOffers",
  "listJobOffersForAdmin",
  "updateJobOfferStatus",
  "withTimeout",
  "createSupabaseClient",
];
const requiredPortalMarkers = [
  "setSignedInShell",
  "redirectToAccountHome",
  "recoverAccountHomeFromSession",
  "rememberAccountHome",
  "normalizePortalHomeHash",
  "forceAccountHomeRoute",
  "showContinueHomeButton",
  "renderPaymentReturnPanel",
  "renderAccountHomeVerification",
  "renderAccountHomeDashboard",
  "accountHomeNextStep",
  "Provider verification unlocks paid posting",
  "Payment returned successfully",
  "Account is open. Verification is only required before paid posting",
  "Verified gate ready",
  "Coverage on file",
  "receiverApplicationPayload",
  "renderReceiverApplications",
  "receiverApplicationCoverageScopes",
  "Africa-to-Africa coverage",
  "Cross-border lawful-goods check",
  "saveReceiverProfileSetup",
  "renderAccountSetupChecklist",
  "renderAccountHomeAutopilot",
  "automationReadinessScore",
  "AI can draft and triage",
  "receiverProfileScore",
  "Base change check needed",
  "Photo uploaded privately",
  "scrollAccountHomeAnchor",
  "handleAccountHomeAnchorClick",
  "renderMarketplaceJobs",
  "renderMyJobOffers",
  "refreshMarketplace",
  "Lowest price does not automatically win",
];
const requiredPortalHtmlMarkers = [
  "quick-action-card",
  'aria-label="Find jobs"',
  "Set up once, then get matched to suitable work",
  "find-job-step",
  "find-job-step-action",
  'href="#receiver-profile-setup"',
  'href="verification.html?reason=receiver_work"',
  'href="#jobs-board"',
  'id="jobs-board"',
  "cursor: pointer",
  "workspace-link",
  "pointer-events: none",
  'id="marketplace-job-list"',
  'id="marketplace-offer-form"',
  "Controlled offers",
  "Make an offer without racing to the bottom",
  "Lowest price does not automatically win",
];
const requiredVerificationMarkers = [
  "providerActionCopy",
  "renderVerificationTimeline",
  "verificationTimeline",
  "verification-country-options",
  "Paid actions unlock",
  "Automation boundary",
  "release money, assign paid work",
  "Checking your signed-in Swadakta account",
  "Back to account home",
  "Session check failed",
];
const requiredAssistantMarkers = [
  "applyQueryContext",
  "Resolve an issue",
  "Issue context loaded",
  "assistant-quick-action",
  "assistant-message-list",
  "assistant-form",
  "chat-composer",
  "Workflow-aware guide",
  "renderActionLinks",
  "renderConversation",
];
const requiredDockMarkers = [
  "swadakta-ai-dock",
  "collectPageContext",
  "inferSafeIntent",
  "protectedIntentPattern",
  "routeKeyFromPrompt",
  "safeActionMap",
  "open_visible_link",
  "explain_screen",
  "findVisibleSafeLink",
  "findVisibleSection",
  "performSafeAction",
  "swadakta-site-polish-style",
  "syncAccountCtas",
  "storedSupabaseSessionEmail",
  "Protected actions stay gated",
];
const requiredAiPreferenceMarkers = ["SwadaktaAiPreference", "dataset.aiMode", "swadakta_ai_mode"];
const requiredBriefHtmlMarkers = [
  "brief-freeform",
  "Ask AI to organize",
  "brief-place-intelligence",
  "brief-place-checks",
  "brief-service-direction",
  "brief-route-guidance",
  "brief-route-shortcuts",
  "In-country Africa job",
  "brief-budget",
  "Budget and quote safety",
];
const requiredBriefScriptMarkers = [
  "brief-ai-organize",
  "loadPlaceIntelligence",
  "placeOperationalChecks",
  "locationLooksSpecific",
  "populateBriefCountryLists",
  "applyAfricaCountryBrief",
  "syncBriefRoutePlan",
  "Africa-to-Africa brief route",
  "routePlanSummary",
  "renderQuoteSafety",
  "quoteSafetySummary",
  "budgetRange",
];
const requiredTrackingMarkers = [
  "renderPaymentRailPlan",
  "Wise stays hidden as a fallback rail",
  "AI can explain and draft updates",
  "tracking-resolution-link",
  "renderResolutionCases",
  "tracking-resolution-cases",
  "renderPaymentReturnHint",
  "renderWorkflowControl",
  "tracking-job-control-panel",
];
const requiredResolutionPageMarkers = [
  "Resolution Center",
  "Protected decision: AI cannot refund, release money",
  "Stripe / PayPal / M-Pesa / Wise provider evidence",
];
const requiredResolutionScriptMarkers = [
  "createResolutionCase",
  "listRequestResolutionCases",
  "Founder review is required",
  "task",
  "source",
];
const requiredMessagesMarkers = [
  "submitLiveReceiverUpdate",
  "uploadProofFiles",
  "Live proof submit is only for the assigned verified receiver",
];
const requiredTrustMarkers = [
  "Trust & Safety Center",
  "Swadakta is not currently a licensed escrow provider",
  "AI cannot mark ID verified, release money, assign paid work",
  "Receiver provenance starts at 25%",
  "Restricted goods",
];
const requiredPaymentsMarkers = [
  "Payments & Pricing",
  "Estimate a launch quote",
  "Swadakta's service fee is built into each quote",
  "A quote is not one single bucket of money",
  "Service and operating reserve",
  "Quote safety guardrail",
  "marginTarget",
  "quoteFloor",
  "Re-quote before sending",
  "Wise stays hidden as fallback",
  "Africa payment expansion planner",
  "paymentExpansionRail",
  "Paystack",
  "Flutterwave",
  "Swadakta is not currently a licensed escrow provider",
];
const requiredRulesMarkers = [
  "Item & Corridor Rules",
  "Restricted goods cannot be cleared by AI",
  "Batteries, perfume, medicines, food, plants, valuables, and documents",
  "UPU international mail baseline",
  "postal or courier acceptance",
  "rules_precheck",
  "rules-use-corridor-link",
  "corridorStorageKey",
];
const requiredCorridorMarkers = [
  "Launch lanes",
  "Route intelligence",
  "corridor-preset",
  "Africa to Africa",
  "In-country Africa",
  "corridor-africa-country",
  "Choose any African country",
];
const requiredCorridorScriptMarkers = [
  "routeReadiness",
  "supportedRegion",
  "africaCountryOptions",
  "populateAfricaQuickSelect",
  "applyAfricaCountry",
  "applyCorridorQueryParams",
  "brief_route_planner",
  "Active Africa-to-Africa lane",
  "Active Africa in-country lane",
  "Active Africa-wide corridor",
  "Pilot corridor - founder quote approval required",
  "review_reason",
  "rules_precheck",
  "rememberImportedRulesContext",
  "rulesContextMatchesCurrent",
];
const requiredAdminOpsMarkers = [
  "requestFlags",
  "renderResolutionCases",
  "handlePaymentRoute",
  "payment-route",
  "createStripeCheckoutSession",
  "createPayPalOrder",
  "createMpesaStkPush",
  "createWisePaymentRequest",
  "quoteEconomics",
  "founder-economics-guard",
  "Confidential founder economics",
  "Minimum safe quote",
  "Payment rails pause when internal economics are below floor",
  "Payment route paused by internal economics guard",
  "Payment buttons are locked by the internal economics guard",
  "renderOpsAutopilot",
  "opsAutopilotPrompt",
  "Swadakta daily operations autopilot brief",
  "renderMatchRecommendations",
  "Autopilot match suggestions",
  "AI does not assign receivers",
  "renderOfferMarket",
  "offer-status-button",
  "updateJobOfferStatus",
  "Receiver offer market",
  "Lowest price does not automatically win",
  "coverage_scopes",
  "Protected decisions are not delegated to AI",
  "Local static mode cannot call the Vercel readiness API",
];
const requiredAdminVerificationMarkers = [
  "providerHandoffPack",
  "copy-provider-pack",
  "copy-user-message",
  "Provider handoff pack",
  "Provider docs",
];
const requiredAdminReadinessMarkers = [
  "buildProviderPack",
  "providerPackCategoryText",
  "renderProviderPacks",
  "renderLaunchGate",
  "launchGateBrief",
  "Swadakta public launch gate",
  "copy-provider-pack",
  "copy-category-pack",
  "Provider setup pack copied",
  "Do not paste secret keys",
];
const requiredReadinessApiMarkers = [
  "accountBackendItems",
  "storageBackendItems",
  "account_onboarding",
  "storage_media",
  "get_my_account_profile",
  "list_my_identity_verification_requests",
  "private_proof_media_bucket",
  "storage_read_policy_probe",
  "swadakta-proof",
  "stitch-portal.js?v=31",
  "authSecurityItems",
  "supabase_auth_redirect_urls",
  "supabase_leaked_password_protection",
  "supabase_auth_attack_protection",
  "password-strength-and-leaked-password-protection",
  "buildLaunchGate",
  "launch_gate",
  "paid_launch_blocked",
  "ownerLaunchItems",
  "owner_legal",
  "SWADAKTA_OWNER_INSURANCE_ACTIVE",
  "SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED",
  "SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED",
  "paystack_africa_pilot",
  "flutterwave_africa_pilot",
  "africa_payment_expansion",
  "paymentExpansionRailItem",
  "PAYSTACK_MERCHANT_APPROVED",
  "PAYSTACK_WEBHOOK_ENDPOINT_READY",
  "PAYSTACK_PROVIDER_EVIDENCE_MAPPED",
  "FLUTTERWAVE_MERCHANT_APPROVED",
  "FLUTTERWAVE_WEBHOOK_ENDPOINT_READY",
  "FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED",
  "paystack_webhook_url",
  "flutterwave_webhook_url",
  "PAYSTACK_WEBHOOK_SECRET",
  "FLUTTERWAVE_WEBHOOK_SECRET",
];
const requiredPaystackWebhookMarkers = [
  "x-paystack-signature",
  "verifyPaystackSignature",
  "verifyPaystackTransaction",
  "/transaction/verify/",
  "Paystack webhook and transaction verification confirmed",
  "Founder/admin must still review milestone proof before any receiver release",
  "bodyParser: false",
];
const requiredFlutterwaveWebhookMarkers = [
  "verif-hash",
  "verifyFlutterwaveSignature",
  "verifyFlutterwaveTransaction",
  "/transactions/",
  "/verify",
  "Flutterwave webhook and transaction verification confirmed",
  "Founder/admin must still review milestone proof before any receiver release",
];
const requiredPaymentReconciliationMarkers = [
  "paymentReconciliationPayload",
  "REQUEST_SELECT_FIELDS",
  "provider evidence matched quote amount/currency",
  "Treat as deposit only",
  "does not match quote currency",
  'funds_status: "disputed"',
  'payment_status: "deposit_paid"',
];
const requiredRobotsMarkers = [
  "Disallow: /admin",
  "Disallow: /admin-ops",
  "Disallow: /admin-readiness",
  "Disallow: /admin-verification",
  "Disallow: /auth",
  "Disallow: /resolution",
];
const requiredFaviconMarkers = ['rel="icon" href="/favicon.svg"', 'rel="manifest" href="/site.webmanifest"'];
const requiredEnvExampleKeys = [
  "PUBLIC_BASE_URL",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PAYPAL_ENVIRONMENT",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "MPESA_ENVIRONMENT",
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_SHORTCODE",
  "MPESA_PASSKEY",
  "MPESA_CALLBACK_TOKEN",
  "PAYSTACK_SECRET_KEY",
  "PAYSTACK_WEBHOOK_SECRET",
  "PAYSTACK_SETTLEMENT_CURRENCIES",
  "PAYSTACK_MERCHANT_APPROVED",
  "PAYSTACK_WEBHOOK_ENDPOINT_READY",
  "PAYSTACK_PROVIDER_EVIDENCE_MAPPED",
  "PAYSTACK_BASE_URL",
  "FLUTTERWAVE_SECRET_KEY",
  "FLUTTERWAVE_WEBHOOK_SECRET",
  "FLUTTERWAVE_SETTLEMENT_CURRENCIES",
  "FLUTTERWAVE_MERCHANT_APPROVED",
  "FLUTTERWAVE_WEBHOOK_ENDPOINT_READY",
  "FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED",
  "FLUTTERWAVE_BASE_URL",
  "WISE_PAYMENT_LINK_URL",
  "WISE_PAYMENT_REQUEST_URL",
  "WISE_RECEIVE_DETAILS_URL",
  "SMILE_ID_API_KEY",
  "SMILE_ID_PARTNER_ID",
  "SWADAKTA_OWNER_BUSINESS_REGISTERED",
  "SWADAKTA_OWNER_TAX_REVIEWED",
  "SWADAKTA_OWNER_INSURANCE_ACTIVE",
  "SWADAKTA_OWNER_LEGAL_REVIEWED",
  "SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED",
  "SWADAKTA_OWNER_CONTRACTOR_TERMS_READY",
  "SWADAKTA_OWNER_PRIVACY_REVIEWED",
  "SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED",
  "SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED",
  "SWADAKTA_OWNER_KENYA_SETUP_REVIEWED",
];
const requiredSecretScanMarkers = [
  "openai_api_key",
  "stripe_secret_key",
  "stripe_webhook_secret",
  "github_token",
  "jwt_like_secret",
  "sensitive_assignment",
  "swadakta-secret-scan",
];

async function readLocal(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function findAppDataVersions(files) {
  const versions = new Map();

  for (const [file, content] of files) {
    const matches = [...content.matchAll(/app-data\.js\?v=(\d+)/g)].map((match) => match[1]);
    if (matches.length) versions.set(file, matches);
  }

  return versions;
}

function findStitchPortalVersions(files) {
  const versions = new Map();

  for (const [file, content] of files) {
    const matches = [...content.matchAll(/stitch-portal\.js\?v=(\d+)/g)].map((match) => match[1]);
    if (matches.length) versions.set(file, matches);
  }

  return versions;
}

async function fetchText(urlPath) {
  const separator = urlPath.includes("?") ? "&" : "?";
  const response = await fetch(`${baseUrl}${urlPath}${separator}health=${cacheBust}`, {
    headers: {
      "cache-control": "no-cache",
      "user-agent": "swadakta-production-health",
    },
    redirect: "manual",
  });

  const text = await response.text();
  return { response, text };
}

async function fetchPage(urlPath) {
  const result = await fetchText(urlPath);
  if (result.response.status !== 404 || urlPath === "/" || urlPath.endsWith(".html")) {
    return { ...result, urlPath };
  }

  const fallback = await fetchText(`${urlPath}.html`);
  return { ...fallback, urlPath: `${urlPath}.html`, originalStatus: result.response.status };
}

async function fetchRedirectChain(urlPath, maxHops = 4) {
  const chain = [];
  let current = urlPath;

  for (let hop = 0; hop < maxHops; hop += 1) {
    const { response } = await fetchText(current);
    const location = response.headers.get("location") || "";
    chain.push({ urlPath: current, status: response.status, location });

    if (![301, 302, 303, 307, 308].includes(response.status) || !location) {
      return chain;
    }

    const next = new URL(location, baseUrl);
    current = `${next.pathname}${next.search}${next.hash}`;
  }

  return chain;
}

function isLocalBaseUrl() {
  try {
    return localBaseHosts.has(new URL(baseUrl).hostname);
  } catch {
    return false;
  }
}

function headerIncludes(response, name, expected) {
  return String(response.headers.get(name) || "")
    .toLowerCase()
    .includes(String(expected || "").toLowerCase());
}

function fail(failures, message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function pass(message) {
  console.log(`OK   ${message}`);
}

function runSecretScan(failures) {
  try {
    execFileSync(process.execPath, [path.join(root, "scripts", "secret-scan.mjs")], {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    });
    pass("Local secret scan passed");
  } catch (error) {
    const output = `${error.stdout || ""}${error.stderr || ""}`.trim();
    fail(failures, `Local secret scan failed${output ? `: ${output}` : ""}`);
  }
}

const failures = [];
const localSecretScan = await readLocal("scripts/secret-scan.mjs");
for (const marker of requiredSecretScanMarkers) {
  if (!localSecretScan.includes(marker)) {
    fail(failures, `Local secret scanner is missing marker ${marker}`);
  }
}
runSecretScan(failures);
const localHtml = await Promise.all(htmlFiles.map(async (file) => [file, await readLocal(file)]));
const versions = findAppDataVersions(localHtml);
const uniqueVersions = [...new Set([...versions.values()].flat())];
const stitchPortalVersions = findStitchPortalVersions(localHtml);
const uniqueStitchPortalVersions = [...new Set([...stitchPortalVersions.values()].flat())];

if (uniqueVersions.length !== 1) {
  fail(failures, `Expected one app-data version across pages, found: ${uniqueVersions.join(", ") || "none"}`);
} else {
  pass(`Local pages use app-data.js?v=${uniqueVersions[0]}`);
}

const expectedVersion = uniqueVersions[0];
const expectedStitchPortalVersion = uniqueStitchPortalVersions[0];
const localAppData = await readLocal("app-data.js");
for (const marker of requiredAppDataMarkers) {
  if (!localAppData.includes(marker)) {
    fail(failures, `Local app-data.js is missing marker ${marker}`);
  }
}

if (uniqueStitchPortalVersions.length !== 1) {
  fail(
    failures,
    `Expected one stitch-portal version across pages, found: ${uniqueStitchPortalVersions.join(", ") || "none"}`,
  );
} else {
  pass(`Local pages use stitch-portal.js?v=${expectedStitchPortalVersion}`);
}

const localStitchPortal = await readLocal("stitch-portal.js");
for (const marker of requiredPortalMarkers) {
  if (!localStitchPortal.includes(marker)) {
    fail(failures, `Local stitch-portal.js is missing marker ${marker}`);
  }
}
const localPortalHtml = await readLocal("portal.html");
for (const marker of requiredPortalHtmlMarkers) {
  if (!localPortalHtml.includes(marker)) {
    fail(failures, `Local portal.html is missing account-home UX marker ${marker}`);
  }
}

const localVerification = await readLocal("verification.js");
const localVerificationHtml = await readLocal("verification.html");
for (const marker of requiredVerificationMarkers) {
  if (!localVerification.includes(marker) && !localVerificationHtml.includes(marker)) {
    fail(failures, `Local verification flow is missing marker ${marker}`);
  }
}

const localAssistant = await readLocal("assistant.js");
const localAssistantHtml = await readLocal("assistant.html");
for (const marker of requiredAssistantMarkers) {
  if (!localAssistant.includes(marker) && !localAssistantHtml.includes(marker)) {
    fail(failures, `Local assistant flow is missing marker ${marker}`);
  }
}
const localAssistantDock = await readLocal("assistant-dock.js");
for (const marker of requiredDockMarkers) {
  if (!localAssistantDock.includes(marker)) {
    fail(failures, `Local assistant dock is missing marker ${marker}`);
  }
}
for (const [file, content] of localHtml) {
  if (!content.includes("assistant-dock.js?v=8")) {
    fail(failures, `${file} does not reference assistant-dock.js?v=8`);
  }
}
const localAiPreferences = await readLocal("ai-preferences.js");
for (const marker of requiredAiPreferenceMarkers) {
  if (!localAiPreferences.includes(marker)) {
    fail(failures, `Local ai-preferences.js is missing marker ${marker}`);
  }
}
const localBriefHtml = await readLocal("brief.html");
const localBriefScript = await readLocal("stitch-brief.js");
for (const marker of requiredBriefHtmlMarkers) {
  if (!localBriefHtml.includes(marker)) {
    fail(failures, `Local brief page is missing marker ${marker}`);
  }
}
for (const marker of requiredBriefScriptMarkers) {
  if (!localBriefScript.includes(marker)) {
    fail(failures, `Local brief flow is missing marker ${marker}`);
  }
}

const localReadinessApi = await readLocal("api/ops/readiness.js");
for (const marker of requiredReadinessApiMarkers) {
  if (!localReadinessApi.includes(marker)) {
    fail(failures, `Local readiness API is missing marker ${marker}`);
  }
}
const localPaystackWebhook = await readLocal("api/payments/paystack-webhook.js");
const localPaymentReconciliation = await readLocal("api/payments/payment-reconciliation.js");
for (const marker of requiredPaystackWebhookMarkers) {
  if (!`${localPaystackWebhook}\n${localPaymentReconciliation}`.includes(marker)) {
    fail(failures, `Local Paystack webhook is missing marker ${marker}`);
  }
}
const localFlutterwaveWebhook = await readLocal("api/payments/flutterwave-webhook.js");
for (const marker of requiredFlutterwaveWebhookMarkers) {
  if (!`${localFlutterwaveWebhook}\n${localPaymentReconciliation}`.includes(marker)) {
    fail(failures, `Local Flutterwave webhook is missing marker ${marker}`);
  }
}
for (const marker of requiredPaymentReconciliationMarkers) {
  if (!localPaymentReconciliation.includes(marker)) {
    fail(failures, `Local payment reconciliation helper is missing marker ${marker}`);
  }
}

const localTracking = await readLocal("stitch-tracking.js");
const localTrackingHtml = await readLocal("tracking.html");
for (const marker of requiredTrackingMarkers) {
  if (!localTracking.includes(marker) && !localTrackingHtml.includes(marker)) {
    fail(failures, `Local tracking flow is missing marker ${marker}`);
  }
}

const localResolution = await readLocal("resolution.js");
const localResolutionHtml = await readLocal("resolution.html");
for (const marker of requiredResolutionPageMarkers) {
  if (!localResolutionHtml.includes(marker)) {
    fail(failures, `Local resolution flow is missing marker ${marker}`);
  }
}
for (const marker of requiredResolutionScriptMarkers) {
  if (!localResolution.includes(marker)) {
    fail(failures, `Local resolution.js is missing marker ${marker}`);
  }
}

const localMessages = await readLocal("messages.js");
const localMessagesHtml = await readLocal("messages.html");
for (const marker of requiredMessagesMarkers) {
  if (!localMessages.includes(marker) && !localMessagesHtml.includes(marker)) {
    fail(failures, `Local messages flow is missing marker ${marker}`);
  }
}

const localTrustHtml = await readLocal("trust.html");
for (const marker of requiredTrustMarkers) {
  if (!localTrustHtml.includes(marker)) {
    fail(failures, `Local trust page is missing marker ${marker}`);
  }
}

const localPaymentsHtml = await readLocal("payments.html");
for (const marker of requiredPaymentsMarkers) {
  if (!localPaymentsHtml.includes(marker)) {
    fail(failures, `Local payments page is missing marker ${marker}`);
  }
}

const localRulesHtml = await readLocal("rules.html");
for (const marker of requiredRulesMarkers) {
  if (!localRulesHtml.includes(marker)) {
    fail(failures, `Local rules page is missing marker ${marker}`);
  }
}

const localCorridorHtml = await readLocal("corridor.html");
const localCorridorJs = await readLocal("corridor.js");
for (const marker of requiredCorridorMarkers) {
  if (!localCorridorHtml.includes(marker)) {
    fail(failures, `Local corridor page is missing marker ${marker}`);
  }
}
for (const marker of requiredCorridorScriptMarkers) {
  if (!localCorridorJs.includes(marker)) {
    fail(failures, `Local corridor.js is missing marker ${marker}`);
  }
}

const localAdminOps = await readLocal("admin-ops.js");
for (const marker of requiredAdminOpsMarkers) {
  if (!localAdminOps.includes(marker)) {
    fail(failures, `Local admin-ops.js is missing marker ${marker}`);
  }
}

const localAdminVerification = await readLocal("admin-verification.js");
for (const marker of requiredAdminVerificationMarkers) {
  if (!localAdminVerification.includes(marker)) {
    fail(failures, `Local admin-verification.js is missing marker ${marker}`);
  }
}

const envExample = await readLocal(".env.example");
for (const key of requiredEnvExampleKeys) {
  if (!new RegExp(`^${key}=`, "m").test(envExample)) {
    fail(failures, `.env.example is missing ${key}`);
  }
}

const robots = await readLocal("robots.txt");
for (const marker of requiredRobotsMarkers) {
  if (!robots.includes(marker)) {
    fail(failures, `Local robots.txt is missing marker ${marker}`);
  }
}
const favicon = await readLocal("favicon.svg");
if (!favicon.includes("Swadakta") || !favicon.includes("linearGradient")) {
  fail(failures, "Local favicon.svg is missing Swadakta mark metadata");
}
const manifest = await readLocal("site.webmanifest");
if (!manifest.includes('"name": "Swadakta"') || !manifest.includes("/favicon.svg")) {
  fail(failures, "Local site.webmanifest is missing favicon metadata");
}

for (const page of requiredPages) {
  const { response, text, urlPath } = await fetchPage(page);
  if (response.status !== 200) {
    fail(failures, `${page} returned ${response.status}`);
    continue;
  }

  pass(`${urlPath} returned 200`);
  for (const marker of requiredFaviconMarkers) {
    if (!text.includes(marker)) {
      fail(failures, `${page} does not include favicon marker ${marker}`);
    }
  }
  if (!text.includes("assistant-dock.js?v=8")) {
    fail(failures, `${page} does not reference assistant-dock.js?v=8`);
  }
  if (page !== "/" && page !== "/auth" && expectedVersion && !text.includes(`app-data.js?v=${expectedVersion}`)) {
    if (!["/corridor"].includes(page)) {
      fail(failures, `${page} does not reference app-data.js?v=${expectedVersion}`);
    }
  }
  if (page === "/portal" && expectedStitchPortalVersion && !text.includes(`stitch-portal.js?v=${expectedStitchPortalVersion}`)) {
    fail(failures, `${page} does not reference stitch-portal.js?v=${expectedStitchPortalVersion}`);
  }
  if (page === "/portal" && !text.includes("receiver-application-form")) {
    fail(failures, `${page} does not include receiver application form`);
  }
  if (page === "/portal") {
    for (const marker of requiredPortalHtmlMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing account-home UX marker ${marker}`);
      }
    }
  }
  if (["/portal", "/assistant", "/brief"].includes(page) && !text.includes("ai-preferences.js?v=1")) {
    fail(failures, `${page} does not reference ai-preferences.js?v=1`);
  }
  if (page === "/brief" && !text.includes("stitch-brief.js?v=12")) {
    fail(failures, `${page} does not reference stitch-brief.js?v=12`);
  }
  if (page === "/brief") {
    for (const marker of requiredBriefHtmlMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing brief marker ${marker}`);
      }
    }
  }
  if (page === "/admin-ops" && !text.includes("admin-ops.js?v=7")) {
    fail(failures, `${page} does not reference admin-ops.js?v=7`);
  }
  if (page === "/admin-verification" && !text.includes("admin-verification.js?v=2")) {
    fail(failures, `${page} does not reference admin-verification.js?v=2`);
  }
  if (page === "/admin-readiness" && !text.includes("admin-readiness.js?v=4")) {
    fail(failures, `${page} does not reference admin-readiness.js?v=4`);
  }
  if (page === "/verification" && !text.includes("verification.js?v=6")) {
    fail(failures, `${page} does not reference verification.js?v=6`);
  }
  if (page === "/tracking" && !text.includes("stitch-tracking.js?v=9")) {
    fail(failures, `${page} does not reference stitch-tracking.js?v=9`);
  }
  if (page === "/assistant" && !text.includes("assistant.js?v=5")) {
    fail(failures, `${page} does not reference assistant.js?v=5`);
  }
  if (page === "/resolution" && !text.includes("resolution.js?v=2")) {
    fail(failures, `${page} does not reference resolution.js?v=2`);
  }
  if (page === "/resolution") {
    for (const marker of requiredResolutionPageMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing marker ${marker}`);
      }
    }
  }
  if (page === "/messages" && !text.includes("messages.js?v=3")) {
    fail(failures, `${page} does not reference messages.js?v=3`);
  }
  if (page === "/corridor" && !text.includes("corridor.js?v=7")) {
    fail(failures, `${page} does not reference corridor.js?v=7`);
  }
  if (page === "/corridor") {
    for (const marker of requiredCorridorMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing marker ${marker}`);
      }
    }
  }
  if (page === "/trust") {
    for (const marker of requiredTrustMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing marker ${marker}`);
      }
    }
  }
  if (page === "/payments") {
    for (const marker of requiredPaymentsMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing marker ${marker}`);
      }
    }
  }
  if (page === "/rules") {
    for (const marker of requiredRulesMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing marker ${marker}`);
      }
    }
  }
  if (page === "/admin-verification" && !text.includes("Provider-led verification")) {
    fail(failures, `${page} is missing provider-led verification heading`);
  }
}

const { response: robotsResponse, text: robotsText } = await fetchText("/robots.txt");
if (robotsResponse.status !== 200) {
  fail(failures, `robots.txt returned ${robotsResponse.status}`);
} else {
  pass("robots.txt returned 200");
}

for (const marker of requiredRobotsMarkers) {
  if (!robotsText.includes(marker)) {
    fail(failures, `Production robots.txt is missing marker ${marker}`);
  } else {
    pass(`Production robots.txt contains ${marker}`);
  }
}

const { response: faviconResponse, text: faviconText } = await fetchText("/favicon.svg");
if (faviconResponse.status !== 200) {
  fail(failures, `favicon.svg returned ${faviconResponse.status}`);
} else {
  pass("favicon.svg returned 200");
}
if (!faviconText.includes("Swadakta") || !faviconText.includes("linearGradient")) {
  fail(failures, "Production favicon.svg is missing Swadakta mark metadata");
} else {
  pass("Production favicon.svg contains Swadakta mark metadata");
}

const { response: manifestResponse, text: manifestText } = await fetchText("/site.webmanifest");
if (manifestResponse.status !== 200) {
  fail(failures, `site.webmanifest returned ${manifestResponse.status}`);
} else {
  pass("site.webmanifest returned 200");
}
if (!manifestText.includes('"name": "Swadakta"') || !manifestText.includes("/favicon.svg")) {
  fail(failures, "Production site.webmanifest is missing favicon metadata");
} else {
  pass("Production site.webmanifest contains favicon metadata");
}

if (isLocalBaseUrl()) {
  pass("Skipping hosted /admin redirect check for local static server");
} else {
  const { response: rootHeaderResponse } = await fetchText("/");
  for (const [name, expected] of requiredSecurityHeaders) {
    if (!headerIncludes(rootHeaderResponse, name, expected)) {
      fail(failures, `/ is missing ${name} containing ${expected}`);
    } else {
      pass(`/ includes ${name}`);
    }
  }

  for (const privatePage of privateNoStorePages) {
    const { response } = await fetchText(privatePage);
    if (response.status !== 200) {
      fail(failures, `${privatePage} returned ${response.status} while checking private-page headers`);
      continue;
    }
    if (!headerIncludes(response, "cache-control", "no-store")) {
      fail(failures, `${privatePage} is missing Cache-Control: no-store`);
    } else {
      pass(`${privatePage} includes Cache-Control: no-store`);
    }
    if (!headerIncludes(response, "x-robots-tag", "noindex")) {
      fail(failures, `${privatePage} is missing X-Robots-Tag: noindex`);
    } else {
      pass(`${privatePage} includes X-Robots-Tag: noindex`);
    }
  }

  for (const adminEntry of ["/admin", "/admin.html"]) {
    const chain = await fetchRedirectChain(adminEntry);
    const final = chain[chain.length - 1] || {};
    const reachedAdminOps =
      chain.some((entry) => entry.location.startsWith("/admin-ops")) ||
      String(final.urlPath || "").startsWith("/admin-ops");

    if (!reachedAdminOps || final.status !== 200) {
      const summary = chain
        .map((entry) => `${entry.urlPath} -> ${entry.status}${entry.location ? ` ${entry.location}` : ""}`)
        .join(" | ");
      fail(failures, `${adminEntry} should end at /admin-ops, got ${summary}`);
    } else {
      pass(`${adminEntry} reaches ${final.urlPath}`);
    }
  }

  for (const paymentEndpoint of paymentProviderEndpoints) {
    const { response } = await fetchText(paymentEndpoint);
    if (response.status !== 405) {
      fail(failures, `${paymentEndpoint} should reject GET with 405, got ${response.status}`);
    } else {
      pass(`${paymentEndpoint} rejects GET with 405`);
    }
  }
}

if (expectedVersion) {
  const { response, text } = await fetchText(`/app-data.js?v=${expectedVersion}`);
  if (response.status !== 200) {
    fail(failures, `app-data.js?v=${expectedVersion} returned ${response.status}`);
  } else {
    pass(`app-data.js?v=${expectedVersion} returned 200`);
  }

  for (const marker of requiredAppDataMarkers) {
    if (!text.includes(marker)) {
      fail(failures, `Production app-data.js?v=${expectedVersion} is missing marker ${marker}`);
    } else {
      pass(`Production app-data.js contains ${marker}`);
    }
  }
}

if (expectedStitchPortalVersion) {
  const { response, text } = await fetchText(`/stitch-portal.js?v=${expectedStitchPortalVersion}`);
  if (response.status !== 200) {
    fail(failures, `stitch-portal.js?v=${expectedStitchPortalVersion} returned ${response.status}`);
  } else {
    pass(`stitch-portal.js?v=${expectedStitchPortalVersion} returned 200`);
  }

  for (const marker of requiredPortalMarkers) {
    if (!text.includes(marker)) {
      fail(failures, `Production stitch-portal.js?v=${expectedStitchPortalVersion} is missing marker ${marker}`);
    } else {
      pass(`Production stitch-portal.js contains ${marker}`);
    }
  }
}

const { response: adminOpsResponse, text: adminOpsText } = await fetchText("/admin-ops.js?v=7");
if (adminOpsResponse.status !== 200) {
  fail(failures, `admin-ops.js?v=7 returned ${adminOpsResponse.status}`);
} else {
  pass("admin-ops.js?v=7 returned 200");
}

for (const marker of requiredAdminOpsMarkers) {
  if (!adminOpsText.includes(marker)) {
    fail(failures, `Production admin-ops.js is missing marker ${marker}`);
  } else {
    pass(`Production admin-ops.js contains ${marker}`);
  }
}

const { response: adminVerificationResponse, text: adminVerificationText } = await fetchText("/admin-verification.js?v=2");
if (adminVerificationResponse.status !== 200) {
  fail(failures, `admin-verification.js?v=2 returned ${adminVerificationResponse.status}`);
} else {
  pass("admin-verification.js?v=2 returned 200");
}

for (const marker of requiredAdminVerificationMarkers) {
  if (!adminVerificationText.includes(marker)) {
    fail(failures, `Production admin-verification.js is missing marker ${marker}`);
  } else {
    pass(`Production admin-verification.js contains ${marker}`);
  }
}

const { response: adminReadinessResponse, text: adminReadinessText } = await fetchText("/admin-readiness.js?v=4");
if (adminReadinessResponse.status !== 200) {
  fail(failures, `admin-readiness.js?v=4 returned ${adminReadinessResponse.status}`);
} else {
  pass("admin-readiness.js?v=4 returned 200");
}

for (const marker of requiredAdminReadinessMarkers) {
  if (!adminReadinessText.includes(marker)) {
    fail(failures, `Production admin-readiness.js is missing marker ${marker}`);
  } else {
    pass(`Production admin-readiness.js contains ${marker}`);
  }
}

const { response: assistantResponse, text: assistantText } = await fetchText("/assistant.js?v=5");
if (assistantResponse.status !== 200) {
  fail(failures, `assistant.js?v=5 returned ${assistantResponse.status}`);
} else {
  pass("assistant.js?v=5 returned 200");
}

for (const marker of requiredAssistantMarkers) {
  if (!assistantText.includes(marker)) {
    fail(failures, `Production assistant.js is missing marker ${marker}`);
  } else {
    pass(`Production assistant.js contains ${marker}`);
  }
}

const { response: assistantDockResponse, text: assistantDockText } = await fetchText("/assistant-dock.js?v=8");
if (assistantDockResponse.status !== 200) {
  fail(failures, `assistant-dock.js?v=8 returned ${assistantDockResponse.status}`);
} else {
  pass("assistant-dock.js?v=8 returned 200");
}

for (const marker of requiredDockMarkers) {
  if (!assistantDockText.includes(marker)) {
    fail(failures, `Production assistant-dock.js is missing marker ${marker}`);
  } else {
    pass(`Production assistant-dock.js contains ${marker}`);
  }
}

const { response: aiPreferenceResponse, text: aiPreferenceText } = await fetchText("/ai-preferences.js?v=1");
if (aiPreferenceResponse.status !== 200) {
  fail(failures, `ai-preferences.js?v=1 returned ${aiPreferenceResponse.status}`);
} else {
  pass("ai-preferences.js?v=1 returned 200");
}
for (const marker of requiredAiPreferenceMarkers) {
  if (!aiPreferenceText.includes(marker)) {
    fail(failures, `Production ai-preferences.js is missing marker ${marker}`);
  } else {
    pass(`Production ai-preferences.js contains ${marker}`);
  }
}

const { response: briefScriptResponse, text: briefScriptText } = await fetchText("/stitch-brief.js?v=12");
if (briefScriptResponse.status !== 200) {
  fail(failures, `stitch-brief.js?v=12 returned ${briefScriptResponse.status}`);
} else {
  pass("stitch-brief.js?v=12 returned 200");
}
for (const marker of requiredBriefScriptMarkers) {
  if (!briefScriptText.includes(marker)) {
    fail(failures, `Production brief flow is missing marker ${marker}`);
  } else {
    pass(`Production brief flow contains ${marker}`);
  }
}

const { response: trackingResponse, text: trackingText } = await fetchText("/stitch-tracking.js?v=9");
if (trackingResponse.status !== 200) {
  fail(failures, `stitch-tracking.js?v=9 returned ${trackingResponse.status}`);
} else {
  pass("stitch-tracking.js?v=9 returned 200");
}

for (const marker of requiredTrackingMarkers) {
  if (!trackingText.includes(marker)) {
    fail(failures, `Production stitch-tracking.js is missing marker ${marker}`);
  } else {
    pass(`Production stitch-tracking.js contains ${marker}`);
  }
}

const { response: resolutionResponse, text: resolutionText } = await fetchText("/resolution.js?v=2");
if (resolutionResponse.status !== 200) {
  fail(failures, `resolution.js?v=2 returned ${resolutionResponse.status}`);
} else {
  pass("resolution.js?v=2 returned 200");
}

for (const marker of requiredResolutionScriptMarkers) {
  if (!resolutionText.includes(marker)) {
    fail(failures, `Production resolution.js is missing marker ${marker}`);
  } else {
    pass(`Production resolution.js contains ${marker}`);
  }
}

const { response: messagesResponse, text: messagesText } = await fetchText("/messages.js?v=3");
if (messagesResponse.status !== 200) {
  fail(failures, `messages.js?v=3 returned ${messagesResponse.status}`);
} else {
  pass("messages.js?v=3 returned 200");
}

for (const marker of requiredMessagesMarkers) {
  if (!messagesText.includes(marker)) {
    fail(failures, `Production messages.js is missing marker ${marker}`);
  } else {
    pass(`Production messages.js contains ${marker}`);
  }
}

if (failures.length) {
  console.error(`\nHealth check failed for ${baseUrl}`);
  process.exitCode = 1;
} else {
  console.log(`\nHealth check passed for ${baseUrl}`);
}
