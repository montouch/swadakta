import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (process.env.SWADAKTA_BASE_URL || "https://swadakta.com").replace(/\/+$/, "");
const cacheBust = Date.now();
const localBaseHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const vercelApiFunctionBudget = Number(process.env.SWADAKTA_VERCEL_FUNCTION_BUDGET || 12);

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
  "login.html",
  "messages.html",
  "notifications.html",
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
  "/login",
  "/brief",
  "/corridor",
  "/tracking",
  "/messages",
  "/notifications",
  "/verification",
  "/assistant",
  "/trust",
  "/payments",
  "/resolution",
  "/rules",
  "/admin-ops",
  "/admin-verification",
  "/admin-readiness",
];
const publicNoAdminLinkPages = new Set(["/", "/corridor", "/trust", "/payments", "/rules"]);
const forbiddenPublicAdminLinkMarkers = [
  'href="admin',
  'href="/admin',
  "admin-ops.html",
  "admin-readiness.html",
  "admin-verification.html",
];
const requiredSitemapUrls = [
  "https://swadakta.com/",
  "https://swadakta.com/corridor",
  "https://swadakta.com/trust",
  "https://swadakta.com/payments",
  "https://swadakta.com/rules",
  "https://swadakta.com/privacy",
  "https://swadakta.com/terms",
];
const forbiddenSitemapMarkers = [
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
const expectedSitemapLastmod = "2026-06-13";
const expectedBriefScriptRef = "stitch-brief.js?v=23";
const requiredStitchScreens = [
  {
    path: "/",
    file: "index.html",
    sources: ["swadakta_home_final_ux_refined"],
    integration: "public-links",
  },
  {
    path: "/auth",
    file: "auth.html",
    sources: ["support_auth_swadakta_final_ux_coverage"],
    integration: "support",
  },
  {
    path: "/login",
    file: "login.html",
    sources: ["welcome_swadakta_final_ux"],
    integration: "auth",
  },
  {
    path: "/portal",
    file: "portal.html",
    sources: [
      "dashboard_swadakta_signed_in",
      "dashboard_swadakta_mobile_signed_in",
      "account_setup_profile_swadakta_final_ux_coverage",
      "find_work_swadakta_final_ux",
    ],
    integration: "functional",
  },
  {
    path: "/assistant",
    file: "assistant.html",
    sources: ["ai_assistant_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/brief",
    file: "brief.html",
    sources: ["create_brief_swadakta_final_ux"],
    integration: "functional",
  },
  {
    path: "/corridor",
    file: "corridor.html",
    sources: ["corridor_place_intelligence_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/tracking",
    file: "tracking.html",
    sources: ["track_request_swadakta_final_ux_calm"],
    integration: "functional",
  },
  {
    path: "/messages",
    file: "messages.html",
    sources: ["messages_proof_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/notifications",
    file: "notifications.html",
    sources: ["notifications_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/verification",
    file: "verification.html",
    sources: ["verification_center_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/trust",
    file: "trust.html",
    sources: ["trust_rules_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/payments",
    file: "payments.html",
    sources: ["payment_milestones_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/resolution",
    file: "resolution.html",
    sources: ["dispute_resolution_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/rules",
    file: "rules.html",
    sources: ["trust_rules_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/admin-ops",
    file: "admin-ops.html",
    sources: ["admin_console_swadakta_final_ux_exception_cockpit"],
    integration: "functional",
  },
  {
    path: "/admin-verification",
    file: "admin-verification.html",
    sources: ["admin_verification_queue_swadakta_final_ux_coverage"],
    integration: "functional",
  },
  {
    path: "/admin-readiness",
    file: "admin-readiness.html",
    sources: ["admin_readiness_launch_gate_swadakta_final_ux_coverage"],
    integration: "functional",
  },
];
const requiredStitchScreenByPath = new Map(requiredStitchScreens.map((screen) => [screen.path, screen]));
const postOnlyApiEndpoints = [
  "/api/ai/assistant",
  "/api/identity/start-verification",
  "/api/identity/sumsub-webhook",
  "/api/payments/stripe-checkout",
  "/api/payments/paypal-order",
  "/api/payments/paypal-capture",
  "/api/payments/mpesa-stk",
  "/api/payments/wise-payment-request",
  "/api/payments/stripe-webhook",
  "/api/payments/mpesa-callback",
  "/api/payments/paystack-webhook",
  "/api/payments/flutterwave-webhook",
];
const requiredSecurityHeaders = [
  ["strict-transport-security", "max-age="],
  ["content-security-policy", "default-src 'self'"],
  ["content-security-policy", "https://geocoding-api.open-meteo.com"],
  ["content-security-policy", "https://api.open-meteo.com"],
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
const publicFreshHtmlPages = [
  "/",
  "/corridor",
  "/trust",
  "/payments",
  "/rules",
  "/privacy",
  "/terms",
];
const criticalNoStoreAssets = [
  "/release.json",
  "/app-data.js",
  "/admin-ops.js",
  "/admin-readiness.js",
  "/admin-verification.js",
  "/assistant-dock.js",
  "/admin-theme.css",
  "/final-ux-theme.css",
  "/stitch-brief.js",
  "/stitch-portal.js",
  "/stitch-tracking.js",
];
const requiredAppDataMarkers = [
  "assertPaidPostingAllowed",
  "applyRequestAcceptanceGate",
  "applyLaunchModeGate",
  "paidLaunchOpen",
  "requestAcceptanceStatus",
  "assertRequestAcknowledgements",
  "launch_mode_founder_review",
  "rules_acceptance_refuse",
  "acceptance_evidence_before_quote",
  "provider_evidence",
  "This job cannot be submitted through the normal Swadakta flow",
  "Confirm the funds boundary before submitting paid work",
  "get_my_account_profile",
  "createMpesaStkPush",
  "createResolutionCase",
  "exchangeAuthCodeForSession",
  "uploadAccountMedia",
  "coverage_scopes",
  "missingColumn",
  "listMarketplaceJobs",
  "submitJobOffer",
  "listTrackingJobOffers",
  "listMyNotifications",
  "markNotification",
  "listMyJobOffers",
  "listJobOffersForAdmin",
  "updateJobOfferStatus",
  "compactDefined",
  "syncLocalPartnerIdentityFromProfile",
  "Account-level provider ID evidence synced to this receiver profile",
  "workStartBlockers",
  "assertLocalWorkStartGate",
  "offerAcceptanceBlockers",
  "startIdentityVerificationSession",
  "/api/identity/start-verification",
  "providerRouteErrorMessage",
  "paymentRouteRiskPayload",
  "payment_launch_locked",
  "job_blockers",
  "Open Admin Readiness before creating a real payment route",
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
  "startIdentityVerificationSession",
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
  'data-stitch-source="dashboard_swadakta_signed_in dashboard_swadakta_mobile_signed_in account_setup_profile_swadakta_final_ux_coverage find_work_swadakta_final_ux"',
  'data-final-ux-polish="account_home_final_ux_polish"',
  "final-ux-account-home-polish",
  "account-home-find-work-before-profile",
  "account-home-workflow-first-final-ux",
  'data-signed-in-dashboard="dashboard_swadakta_signed_in"',
  "account-command-bar",
  "account-action-grid",
  "account-mobile-nav",
  "Home command center",
  "Post a brief",
  "Client / Receiver",
  "Wallet",
  "data-final-ux-shell=\"account-tools\"",
  'data-account-home="true"',
  "quick-action-card",
  'aria-label="Find jobs"',
  'aria-label="Post a job"',
  "data-ai-mode-status",
  "Manual mode",
  "What do you want to do first?",
  "Open verification steps",
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
  'id="account-google-sign-in" type="button" hidden',
  "Controlled offers",
  "Make an offer without racing to the bottom",
  "Lowest price does not automatically win",
  "Signed-in accounts upload it privately",
];
const requiredVerificationMarkers = [
  "providerActionCopy",
  "renderVerificationTimeline",
  "verificationTimeline",
  "startIdentityVerificationSession",
  "verification-country-options",
  "verification-fallback-list",
  "providerFallbacks",
  "Fallback ladder",
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
const requiredAssistantHtmlMarkers = [
  'data-stitch-source="ai_assistant_swadakta_final_ux_coverage"',
  "Manual mode shortcuts",
  "data-ai-disabled-when-off",
  "data-ai-mode-status",
  'href="brief.html"',
];
const requiredDockMarkers = [
  "swadakta-ai-dock",
  'const DOCK_VERSION = "15"',
  "collectPageContext",
  "inferSafeIntent",
  "protectedIntentPattern",
  "routeKeyFromPrompt",
  "safeActionMap",
  'find_work: ["Find jobs", "portal.html#find-work"]',
  "open_visible_link",
  "explain_screen",
  "findVisibleSafeLink",
  "findVisibleSection",
  "performSafeAction",
  "swadakta-site-polish-style",
  "Comfortable tap targets across final UX surfaces",
  "aiDockEnabled",
  "swadakta-manual-mode-chip",
  "buildManualModeChip",
  "data-sw-ai-enable",
  "enableAiMode",
  "removeDock",
  "swadakta:ai-mode-change",
  "syncAccountCtas",
  "storedSupabaseSessionEmail",
  "grid-template-columns: repeat(5, minmax(0, 1fr))",
  "Protected actions stay gated",
];
const requiredAiPreferenceMarkers = [
  "SwadaktaAiPreference",
  "dataset.aiMode",
  "swadakta_ai_mode",
  "data-ai-mode-status",
  "data-ai-disabled-when-off",
  "Manual mode is on",
  "body[data-ai-mode=\"off\"] [data-ai-only]",
  "swadakta:ai-mode-change",
];
const requiredBriefHtmlMarkers = [
  "brief-freeform",
  "Create a request.",
  "brief-flow-steps",
  "Request title",
  "Post a Job",
  "Ask AI to organize",
  "Fill manually",
  "data-ai-mode-status",
  "brief-place-intelligence",
  "brief-launch-mode",
  "Founder-reviewed pilot",
  "brief-place-checks",
  "brief-service-direction",
  "brief-route-guidance",
  "brief-route-shortcuts",
  "In-country Africa job",
  "brief-goods-safety",
  "Goods safety quick check",
  "brief-goods-category",
  "brief-logistics-mode",
  "brief-compliance-pack",
  "Compliance pack",
  "job acceptance gate",
  "brief-budget",
  "Budget and quote safety",
  "Payment and milestone preference",
  "Publish request",
  "provider-confirmed milestone protection",
  "funds-boundary",
  "not a licensed escrow provider unless a regulated payment or escrow provider is agreed",
];
const requiredBriefScriptMarkers = [
  "brief-ai-organize",
  "renderLaunchMode",
  "isPaidLaunchOpen",
  "launch_mode_founder_review",
  "loadPlaceIntelligence",
  "placeOperationalChecks",
  "locationLooksSpecific",
  "geocoding-api.open-meteo.com",
  "api.open-meteo.com",
  "forecast_days",
  "populateBriefCountryLists",
  "applyAfricaCountryBrief",
  "syncBriefRoutePlan",
  "Africa-to-Africa brief route",
  "routePlanSummary",
  "renderQuoteSafety",
  "quoteSafetySummary",
  "rulesPackFromContext",
  "compliancePackSummary",
  "renderCompliancePack",
  "officialGoodsReferences",
  "buildInlineGoodsSafetyPack",
  "brief_inline_goods_safety",
  "renderGoodsSafety",
  "Goods compliance pack carried forward",
  "job_acceptance_status",
  "This job cannot be posted normally",
  "Verified account; evidence first",
  "Verified account; founder review required",
  "fundsBoundaryAccepted",
  "Confirm the funds boundary before submitting",
  "Payment gate:",
  "Receiver gate:",
  "rulesStorageKey",
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
  "Video call request added with proof-safe agenda note",
];
const requiredNotificationPageMarkers = [
  "Swadakta notifications",
  "notification-list",
  "notification-template",
  "notifications.js?v=1",
];
const requiredNotificationScriptMarkers = [
  "listMyNotifications",
  "markNotification",
  "notification-filter",
  "includeDismissed",
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
  "Payment rails readiness matrix",
  "Client-visible rail gate",
  "Show a rail only after its evidence chain works",
  "Read trust rules",
  "Regulated escrow/provider-held funds",
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
  "rules_acceptance_",
  "rulesStorageKey",
  "officialReferences",
  "buildCompliancePack",
  "data-rules-acceptance-gate",
  "Job acceptance gate",
  "payment_gate",
  "receiver_gate",
  "data-rules-compliance-pack",
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
  "rulesPackFromContext",
  "RULES_STORAGE_KEY",
  "rules_compliance_pack",
  "official_reference_links",
];
const requiredAdminOpsMarkers = [
  "requestFlags",
  "acceptanceGate",
  "renderAcceptanceGatePanel",
  "rules_acceptance_",
  "Acceptance gate",
  "Payment gate",
  "Receiver gate",
  "Do not accept",
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
  "existingMpesaPrompt",
  "M-Pesa resend safety",
  "payment-mpesa-force-new",
  "Replace expired/failed prompt",
  "Reused CheckoutRequestID",
  "renderOpsAutopilot",
  "opsAutopilotPrompt",
  "Swadakta daily operations autopilot brief",
  "adminAiEnabled",
  "renderAdminAiDecisionDesk",
  "Swadakta admin AI prompt pack",
  "Swadakta manual admin checklist",
  "Copy manual checklist",
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
  "Work start remains locked until protected funds",
  "Receiver assignment is selected",
  "Local static mode cannot call the Vercel readiness API",
];
const requiredAdminVerificationMarkers = [
  "providerHandoffPack",
  "providerFallbackPlan",
  "Fallback ladder",
  "copy-provider-pack",
  "copy-user-message",
  "Provider handoff pack",
  "Provider docs",
];
const requiredAdminReadinessMarkers = [
  "buildProviderPack",
  "providerPackCategoryText",
  "renderProviderPacks",
  "buildFounderActionPack",
  "renderFounderActionPack",
  "Founder launch pack copied",
  "buildLaunchSessionPack",
  "renderLaunchSession",
  "Founder Chrome work session copied",
  "buildPilotScript",
  "renderPilotScript",
  "First paid pilot script copied",
  "renderLaunchGate",
  "launchGateBrief",
  "Swadakta public launch gate",
  "buildLaunchDecisionRegisterPack",
  "renderLaunchDecisionRegister",
  "Launch decision register copied",
  "buildProviderMatrixPack",
  "renderProviderMatrix",
  "provider_launch_matrix",
  "Provider launch matrix",
  "provider-matrix-list",
  "copy-provider-pack",
  "copy-provider-matrix",
  "copy-category-pack",
  "Provider setup pack copied",
  "Provider launch matrix copied",
  "Do not paste secret keys",
];
const requiredAdminReadinessHtmlMarkers = [
  "launch-decision-register-panel",
  "launch-decision-register-list",
  "Founder go/no-go register",
  "provider-matrix-panel",
  "provider-matrix-list",
  "Provider activation matrix",
  "Copy matrix",
  "launch-session-panel",
  "launch-session-tabs",
  "Founder Chrome work session",
  "Copy session",
];
const requiredAdminThemeMarkers = [
  '<html class="dark" lang="en">',
  'data-admin-theme="dark"',
  "admin-theme.css?v=1",
];
const requiredAdminThemeCssMarkers = [
  'body[data-admin-theme="dark"]',
  "rgba(12, 14, 27, 0.76)",
  ".bg-white\\/70",
];
const requiredFinalUxThemeCssMarkers = [
  "--sw-primary: #000105",
  "final-ux-sitewide-shell-v2",
  'body:not([data-admin-theme="dark"])',
  ".primary-glass-button",
  "overflow-wrap: anywhere",
  "linear-gradient(135deg, var(--sw-primary) 0%, var(--sw-tertiary) 100%)",
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
  "app-data.js?v=61",
  "stitch-portal.js?v=34",
  "final-ux-theme.css?v=3",
  "final_ux_live_freshness",
  "final_ux_theme_url",
  "account-home-workflow-first-final-ux",
  "legacy purple UI marker",
  "authSecurityItems",
  "supabase_auth_redirect_urls",
  "supabase_leaked_password_protection",
  "supabase_auth_attack_protection",
  "password-strength-and-leaked-password-protection",
  "Contact, Policy, Canonical, and Expires",
  "buildLaunchGate",
  "launch_gate",
  "paid_launch_blocked",
  "buildLaunchDecisionRegister",
  "launch_decision_register",
  "Founder go/no-go decision register",
  "SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED",
  "SWADAKTA_OWNER_REGULATED_ESCROW_READY",
  "normal_public_paid_jobs",
  "buildProviderLaunchMatrix",
  "provider_launch_matrix",
  "Provider launch matrix",
  "user_visibility_rule",
  "activation_sequence",
  "public_visibility",
  "buildFounderLaunchSession",
  "founder_launch_session",
  "Founder Chrome work session",
  "recommended_tabs",
  "SWADAKTA_OWNER_TAX_REVIEWED",
  "SWADAKTA_OWNER_PRIVACY_REVIEWED",
  "SWADAKTA_OWNER_CONTRACTOR_TERMS_READY",
  "Wise fallback",
  "ai_manual_mode_boundary",
  "AI/manual mode fallback",
  "admin_ai_prompt_boundaries",
  "Admin AI approval prompts",
  "swadakta_ai_mode",
  "AI/manual mode fallback is ready",
  "identity_start_endpoint",
  "provider_handoff_links",
  "sumsub_websdk_link",
  "sumsub_webhook",
  "sumsub_webhook_url",
  "/api/identity/start-verification",
  "/api/identity/sumsub-webhook",
  "SMILE_ID_VERIFICATION_URL",
  "SUMSUB_APP_TOKEN",
  "SUMSUB_SECRET_KEY",
  "SUMSUB_LEVEL_NAME",
  "SUMSUB_WEBHOOK_SECRET",
  "SUMSUB_VERIFICATION_URL",
  "YOUVERIFY_VERIFICATION_URL",
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
  "flutterwave-signature",
  "HMAC-SHA256",
  "verif-hash",
  "verifyFlutterwaveSignature",
  "verifyFlutterwaveTransaction",
  "/transactions/",
  "/verify",
  "Flutterwave webhook and transaction verification confirmed",
  "Founder/admin must still review milestone proof before any receiver release",
  "bodyParser: false",
];
const requiredPaymentReconciliationMarkers = [
  "paymentReconciliationPayload",
  "REQUEST_SELECT_FIELDS",
  "monotonicPaymentReconciliationPayload",
  "nonFinalPaymentCallbackPayload",
  "Existing payment status",
  "cannot clear a dispute/refund hold",
  "provider evidence matched quote amount/currency",
  "Treat as deposit only",
  "does not match quote currency",
  'funds_status: "disputed"',
  'payment_status: "deposit_paid"',
];
const requiredPaymentIdempotencyMarkers = [
  ["scripts/check-payment-reconciliation.mjs", "Payment reconciliation checks passed"],
  ["scripts/check-payment-reconciliation.mjs", "non-final callback cannot downgrade provider evidence"],
  ["api/payments/stripe-checkout.js", "stripeIdempotencyKey"],
  ["api/payments/stripe-checkout.js", '"idempotency-key": idempotencyKey'],
  ["api/payments/stripe-checkout.js", "swadakta-checkout"],
  ["api/payments/paypal-order.js", "paypalRequestId"],
  ["api/payments/paypal-order.js", '"PayPal-Request-Id": paypalRequestId'],
  ["api/payments/paypal-order.js", "swadakta-order"],
  ["api/payments/mpesa-stk.js", "activeMpesaPromptFromRequest"],
  ["api/payments/mpesa-stk.js", "force_new_stk"],
  ["api/payments/mpesa-stk.js", "Duplicate STK prompts are suppressed"],
  ["app-data.js", "force_new_stk: updates.force_new_stk === true"],
  ["admin-ops.js", "payment-mpesa-force-new"],
  ["PAYMENTS_SETUP.md", "Idempotency-Key"],
  ["PAYMENTS_SETUP.md", "PayPal-Request-Id"],
  ["PAYMENTS_SETUP.md", "force_new_stk"],
  ["PAYMENTS_SETUP.md", "returns the existing `CheckoutRequestID`"],
];
const requiredPaymentLaunchGateMarkers = [
  ["lib/payment-launch-gate.js", "assertPaymentLaunchAllowed"],
  ["lib/payment-launch-gate.js", "paymentLaunchGatePayload"],
  ["lib/payment-launch-gate.js", "jobPaymentGatePayload"],
  ["lib/payment-launch-gate.js", "acceptance gate: evidence first"],
  ["lib/payment-launch-gate.js", "JOB_ACCEPTANCE_FOUNDER_REVIEW_REQUIRED"],
  ["lib/payment-launch-gate.js", "JOB_ROUTE_EVIDENCE_REQUIRED"],
  ["lib/payment-launch-gate.js", "JOB_GOODS_RESTRICTED_OR_UNSURE"],
  ["lib/payment-launch-gate.js", "SWADAKTA_OWNER_REGULATED_ESCROW_READY"],
  ["lib/payment-launch-gate.js", "ID_PROVIDER_EVIDENCE_ROUTE"],
  ["lib/payment-launch-gate.js", "statusCode = 423"],
  ["lib/payment-request-context.js", "paymentRoutePayloadFromStoredRequest"],
  ["lib/payment-request-context.js", "PAYMENT_REQUEST_SELECT_FIELDS"],
  ["lib/payment-request-context.js", "Save a positive quote amount on the stored Swadakta request"],
  ["lib/payment-request-context.js", "Payment route quote amount must match the saved Swadakta request"],
  ["lib/payment-request-context.js", "Create and save the Swadakta request before creating a payment route"],
  ["api/payments/stripe-checkout.js", "assertPaymentLaunchAllowed(\"stripe\""],
  ["api/payments/paypal-order.js", "assertPaymentLaunchAllowed(\"paypal\""],
  ["api/payments/mpesa-stk.js", "assertPaymentLaunchAllowed(\"mpesa\""],
  ["api/payments/wise-payment-request.js", "assertPaymentLaunchAllowed(\"wise\""],
  ["api/payments/stripe-checkout.js", "paymentRoutePayloadFromStoredRequest"],
  ["api/payments/paypal-order.js", "paymentRoutePayloadFromStoredRequest"],
  ["api/payments/mpesa-stk.js", "paymentRoutePayloadFromStoredRequest"],
  ["api/payments/wise-payment-request.js", "paymentRoutePayloadFromStoredRequest"],
  ["api/payments/stripe-checkout.js", "paymentLaunchGateErrorBody"],
  ["api/payments/paypal-order.js", "paymentLaunchGateErrorBody"],
  ["api/payments/mpesa-stk.js", "paymentLaunchGateErrorBody"],
  ["api/payments/wise-payment-request.js", "paymentLaunchGateErrorBody"],
  ["PAYMENTS_SETUP.md", "Server-side Payment Launch Gate"],
  ["PAYMENTS_SETUP.md", "Per-job Payment Acceptance Gate"],
  ["PAYMENTS_SETUP.md", "Stored Request Authority"],
  [".env.example", "SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED"],
  [".env.example", "SWADAKTA_OWNER_REGULATED_ESCROW_READY"],
];
const requiredIdentityEndpointMarkers = [
  "startVerification",
  "assertUser",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SMILE_ID_VERIFICATION_URL",
  "SUMSUB_VERIFICATION_URL",
  "createSumsubWebsdkLink",
  "SUMSUB_LEVEL_NAME",
  "generate-websdk-external-link",
  "YOUVERIFY_VERIFICATION_URL",
  "provider_link",
  "accountProfileStatusFromIdentityRequestStatus",
  "AI and users cannot mark ID verified",
];
const requiredIdentityStatusMappingMarkers = [
  ["api/identity/start-verification.js", 'if (clean === "cancelled") return "not_started";'],
  ["api/identity/start-verification.js", "accountProfileStatusFromIdentityRequestStatus(effectiveDecision.status)"],
  ["scripts/check-identity-status-mapping.mjs", "Identity status mapping checks passed."],
  ["scripts/check-identity-status-mapping.mjs", 'accountProfileStatusFromIdentityRequestStatus("cancelled")'],
];
const requiredSumsubWebhookMarkers = [
  "verifySumsubSignature",
  "x-payload-digest",
  "SUMSUB_WEBHOOK_SECRET",
  "reviewAnswer",
  "Provider evidence",
  "requestPath",
  "/api/identity/sumsub-webhook",
  "monotonicSumsubDecision",
  "preserved_terminal_status",
  "non-final callback",
  "bodyParser: false",
];
const requiredRobotsMarkers = [
  "Disallow: /admin",
  "Disallow: /admin-ops",
  "Disallow: /admin-readiness",
  "Disallow: /admin-verification",
  "Disallow: /auth",
  "Disallow: /login",
  "Disallow: /notifications",
  "Disallow: /resolution",
];
const requiredSecurityTxtMarkers = [
  "Contact: mailto:swadakta111@gmail.com",
  "Policy: https://swadakta.com/trust",
  "Preferred-Languages: en",
  "Canonical: https://swadakta.com/.well-known/security.txt",
  "Expires:",
];
const requiredFaviconMarkers = ['rel="icon" href="/favicon.svg"', 'rel="manifest" href="/site.webmanifest"'];
const forbiddenLegacyPurpleMarkers = ["#4648d4", "#8127cf", "rgba(70,72,212", "rgba(70, 72, 212"];
const requiredLoginHtmlMarkers = [
  'data-stitch-source="welcome_swadakta_final_ux"',
  'id="swadakta-login-form"',
  'id="login-mode-signin"',
  'id="login-mode-create"',
  'id="login-submit"',
  'id="login-oauth-divider"',
  "Mobile / WhatsApp backup",
  "One account for giving and receiving work",
  "What do you want to do first?",
  "Give jobs",
  "Find jobs",
  "login.js?v=3",
];
const requiredFinalUxSupportPageMarkers = [
  ['auth.html', 'data-final-ux-shell="support-auth"'],
  ['auth.html', 'data-stitch-source="support_auth_swadakta_final_ux_coverage"'],
  ['auth.html', 'data-stitch-integration="support"'],
  ['auth.html', "styles.css?v=29"],
  ['admin.html', 'data-stitch-source="admin_console_swadakta_final_ux_exception_cockpit"'],
  ['admin.html', 'data-stitch-integration="redirect"'],
  ['admin.html', 'data-admin-theme="dark"'],
  ['privacy.html', 'data-final-ux-shell="support-policy"'],
  ['privacy.html', 'data-stitch-source="support_policy_swadakta_final_ux_coverage"'],
  ['privacy.html', "styles.css?v=29"],
  ['terms.html', 'data-final-ux-shell="support-policy"'],
  ['terms.html', 'data-stitch-source="support_terms_swadakta_final_ux_coverage"'],
  ['terms.html', "styles.css?v=29"],
];
const forbiddenUserFacingIncompleteMarkers = [
  ["login.html", "Trusted by 10k+ Caregivers"],
  ["login.html", "caregiving practice"],
  ["login.html", "+254"],
  ["login.html", "placeholder=\"••••••••\""],
  ["portal.html", "until proper storage is connected"],
  ["portal.html", "until secure storage is connected"],
  ["app-data.js", "database profile grant"],
  ["app-data.js", "identity verification RPC/grants"],
  ["app-data.js", "account_profiles grant"],
  ["app-data.js", "get_my_account_profile RPC"],
  ["stitch-portal.js", "Proper profile storage will handle larger files later"],
  ["stitch-portal.js", "Secure storage will handle larger proof later"],
  ["verification.js", "continue the demo"],
  ["verification.js", "Supabase grant/RPC applied"],
];
const requiredSupportCssMarkers = [
  "Website v29: final-UX support pages",
  ".final-ux-support",
  ".policy-body .site-header",
  ".auth-panel::after",
];
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
  "SMILE_ID_VERIFICATION_URL",
  "SMILE_ID_WEB_LINK_URL",
  "SUMSUB_VERIFICATION_URL",
  "SUMSUB_WEBSDK_URL",
  "SUMSUB_APP_TOKEN",
  "SUMSUB_SECRET_KEY",
  "YOUVERIFY_VERIFICATION_URL",
  "YOUVERIFY_API_KEY",
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
const requiredAiBoundaryDocMarkers = [
  "Swadakta AI Operating Boundaries",
  "AI on",
  "AI off",
  "User AI cannot command admin AI",
  "These decisions are never autonomous",
  "Manual mode must always work",
];
const requiredIdentityVerificationDocMarkers = [
  "Current app routing",
  "/api/identity/start-verification",
  "SMILE_ID_VERIFICATION_URL",
  "Provider coverage rule",
  "terminal identity result",
  "Do not promise that a provider will support a user",
  "Manual review is a fallback only",
];

async function readLocal(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function collectApiFunctionFiles(directory = path.join(root, "api")) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectApiFunctionFiles(absolutePath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path.relative(root, absolutePath).replaceAll(path.sep, "/"));
    }
  }

  return files.sort();
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

async function fetchText(urlPath, options = {}) {
  const separator = urlPath.includes("?") ? "&" : "?";
  const response = await fetch(`${baseUrl}${urlPath}${separator}health=${cacheBust}`, {
    method: options.method || "GET",
    headers: {
      "cache-control": "no-cache",
      "user-agent": "swadakta-production-health",
      ...(options.headers || {}),
    },
    body: options.body,
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

function stitchSourcesFromHtml(html) {
  const match = String(html || "").match(/\sdata-stitch-source="([^"]+)"/);
  if (!match) return [];
  return match[1].split(/\s+/).filter(Boolean);
}

function stitchIntegrationFromHtml(html) {
  return String(html || "").match(/\sdata-stitch-integration="([^"]+)"/)?.[1] || "";
}

function checkStitchScreenContract(failures, label, html, screen) {
  const actualSources = stitchSourcesFromHtml(html);
  for (const source of screen.sources) {
    if (!actualSources.includes(source)) {
      fail(failures, `${label} is missing Stitch source marker ${source}`);
    }
  }
  if (screen.integration && stitchIntegrationFromHtml(html) !== screen.integration) {
    fail(failures, `${label} is missing Stitch integration marker ${screen.integration}`);
  }
}

function checkSitemapContract(failures, label, text) {
  if (!/<urlset\b/i.test(text)) {
    fail(failures, `${label} is missing urlset`);
  }

  for (const url of requiredSitemapUrls) {
    if (!text.includes(`<loc>${url}</loc>`)) {
      fail(failures, `${label} is missing public URL ${url}`);
    }
  }

  for (const marker of forbiddenSitemapMarkers) {
    if (text.includes(marker)) {
      fail(failures, `${label} exposes private URL marker ${marker}`);
    }
  }

  const lastmods = [...text.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
  if (lastmods.length !== requiredSitemapUrls.length) {
    fail(failures, `${label} should have ${requiredSitemapUrls.length} lastmod entries, found ${lastmods.length}`);
  }
  for (const lastmod of lastmods) {
    if (lastmod !== expectedSitemapLastmod) {
      fail(failures, `${label} has stale lastmod ${lastmod}; expected ${expectedSitemapLastmod}`);
    }
  }
}

function fail(failures, message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function pass(message) {
  console.log(`OK   ${message}`);
}

function parseJson(text, label, failures) {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(failures, `${label} is not valid JSON: ${error.message}`);
    return null;
  }
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

function runLocalScript(failures, scriptPath, successLabel) {
  try {
    execFileSync(process.execPath, [path.join(root, scriptPath)], {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    });
    pass(successLabel);
  } catch (error) {
    const output = `${error.stdout || ""}${error.stderr || ""}`.trim();
    fail(failures, `${successLabel} failed${output ? `: ${output}` : ""}`);
  }
}

const failures = [];
const localApiFunctionFiles = await collectApiFunctionFiles();
if (localApiFunctionFiles.length > vercelApiFunctionBudget) {
  fail(
    failures,
    `Local Vercel API function budget exceeded: ${localApiFunctionFiles.length}/${vercelApiFunctionBudget}. Move shared helpers out of api/. Files: ${localApiFunctionFiles.join(", ")}`,
  );
} else {
  pass(`Local Vercel API function budget OK: ${localApiFunctionFiles.length}/${vercelApiFunctionBudget}`);
}
const localSecretScan = await readLocal("scripts/secret-scan.mjs");
for (const marker of requiredSecretScanMarkers) {
  if (!localSecretScan.includes(marker)) {
    fail(failures, `Local secret scanner is missing marker ${marker}`);
  }
}
runSecretScan(failures);
runLocalScript(failures, "scripts/check-identity-status-mapping.mjs", "Local identity status mapping check passed");
const localRelease = parseJson(await readLocal("release.json"), "Local release.json", failures);
if (localRelease?.release_id && localRelease?.sumsub_webhook_path) {
  pass(`Local release manifest is ${localRelease.release_id}`);
} else {
  fail(failures, "Local release.json is missing release_id or sumsub_webhook_path");
}
const localHtml = await Promise.all(htmlFiles.map(async (file) => [file, await readLocal(file)]));
const localHtmlByFile = new Map(localHtml);
const versions = findAppDataVersions(localHtml);
const uniqueVersions = [...new Set([...versions.values()].flat())];
const stitchPortalVersions = findStitchPortalVersions(localHtml);
const uniqueStitchPortalVersions = [...new Set([...stitchPortalVersions.values()].flat())];

for (const screen of requiredStitchScreens) {
  const html = localHtmlByFile.get(screen.file);
  if (!html) {
    fail(failures, `Local Stitch screen ${screen.file} is missing`);
    continue;
  }
  checkStitchScreenContract(failures, `Local ${screen.file}`, html, screen);
}

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
for (const marker of forbiddenLegacyPurpleMarkers) {
  if (localAssistantDock.toLowerCase().includes(marker.toLowerCase())) {
    fail(failures, `Local assistant dock still contains legacy purple UI marker ${marker}`);
  }
}
const localFinalUxTheme = await readLocal("final-ux-theme.css");
for (const marker of requiredFinalUxThemeCssMarkers) {
  if (!localFinalUxTheme.includes(marker)) {
    fail(failures, `Local final-ux-theme.css is missing marker ${marker}`);
  }
}
for (const marker of forbiddenLegacyPurpleMarkers) {
  if (localFinalUxTheme.toLowerCase().includes(marker.toLowerCase())) {
    fail(failures, `Local final-ux-theme.css still contains legacy purple UI marker ${marker}`);
  }
}
for (const [file, content] of localHtml) {
  if (!content.includes("assistant-dock.js?v=15")) {
    fail(failures, `${file} does not reference assistant-dock.js?v=15`);
  }
  if (file.startsWith("admin-")) {
    if (content.includes("final-ux-theme.css")) {
      fail(failures, `${file} should use admin-theme.css without final-ux-theme.css`);
    }
  } else if (file !== "admin.html" && !content.includes("final-ux-theme.css?v=3")) {
    fail(failures, `${file} does not reference final-ux-theme.css?v=3`);
  }
  for (const marker of forbiddenLegacyPurpleMarkers) {
    if (content.toLowerCase().includes(marker.toLowerCase())) {
      fail(failures, `${file} still contains legacy purple UI marker ${marker}`);
    }
  }
}
const localLoginHtml = await readLocal("login.html");
for (const marker of requiredLoginHtmlMarkers) {
  if (!localLoginHtml.includes(marker)) {
    fail(failures, `Local login.html is missing final Stitch login marker ${marker}`);
  }
}
for (const [file, marker] of requiredFinalUxSupportPageMarkers) {
  const html = await readLocal(file);
  if (!html.includes(marker)) {
    fail(failures, `Local ${file} is missing final UX support marker ${marker}`);
  }
}
const localStyles = await readLocal("styles.css");
for (const marker of requiredSupportCssMarkers) {
  if (!localStyles.includes(marker)) {
    fail(failures, `Local styles.css is missing final UX support marker ${marker}`);
  }
}
for (const [file, marker] of forbiddenUserFacingIncompleteMarkers) {
  const content = await readLocal(file);
  if (content.includes(marker)) {
    fail(failures, `Local ${file} still contains unfinished user-facing copy: ${marker}`);
  }
}
const localAiPreferences = await readLocal("ai-preferences.js");
for (const marker of requiredAiPreferenceMarkers) {
  if (!localAiPreferences.includes(marker)) {
    fail(failures, `Local ai-preferences.js is missing marker ${marker}`);
  }
}
const localAiBoundaryDoc = await readLocal("AI_OPERATING_BOUNDARIES.md");
for (const marker of requiredAiBoundaryDocMarkers) {
  if (!localAiBoundaryDoc.includes(marker)) {
    fail(failures, `AI operating boundary doc is missing marker ${marker}`);
  }
}
const localIdentityVerificationDoc = await readLocal("IDENTITY_VERIFICATION.md");
for (const marker of requiredIdentityVerificationDocMarkers) {
  if (!localIdentityVerificationDoc.includes(marker)) {
    fail(failures, `Identity verification guide is missing marker ${marker}`);
  }
}
const localSecurityTxt = await readLocal(".well-known/security.txt");
for (const marker of requiredSecurityTxtMarkers) {
  if (!localSecurityTxt.includes(marker)) {
    fail(failures, `Local security.txt is missing marker ${marker}`);
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
const localPaymentReconciliation = await readLocal("lib/payment-reconciliation.js");
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
for (const [file, marker] of requiredPaymentIdempotencyMarkers) {
  const content = await readLocal(file);
  if (!content.includes(marker)) {
    fail(failures, `Local ${file} is missing payment idempotency marker ${marker}`);
  }
}
for (const [file, marker] of requiredPaymentLaunchGateMarkers) {
  const content = await readLocal(file);
  if (!content.includes(marker)) {
    fail(failures, `Local ${file} is missing payment launch gate marker ${marker}`);
  }
}
const localIdentityEndpoint = await readLocal("api/identity/start-verification.js");
for (const marker of requiredIdentityEndpointMarkers) {
  if (!localIdentityEndpoint.includes(marker)) {
    fail(failures, `Local identity start endpoint is missing marker ${marker}`);
  }
}
for (const [file, marker] of requiredIdentityStatusMappingMarkers) {
  const content = await readLocal(file);
  if (!content.includes(marker)) {
    fail(failures, `Local ${file} is missing identity status mapping marker ${marker}`);
  }
}
const localSumsubWebhook = localIdentityEndpoint;
for (const marker of requiredSumsubWebhookMarkers) {
  if (!localSumsubWebhook.includes(marker)) {
    fail(failures, `Local Sumsub webhook is missing marker ${marker}`);
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

const localNotifications = await readLocal("notifications.js");
const localNotificationsHtml = await readLocal("notifications.html");
for (const marker of requiredNotificationPageMarkers) {
  if (!localNotificationsHtml.includes(marker)) {
    fail(failures, `Local notifications page is missing marker ${marker}`);
  }
}
for (const marker of requiredNotificationScriptMarkers) {
  if (!localNotifications.includes(marker)) {
    fail(failures, `Local notifications.js is missing marker ${marker}`);
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
const sitemap = await readLocal("sitemap.xml");
checkSitemapContract(failures, "Local sitemap.xml", sitemap);
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
  if (!text.includes("assistant-dock.js?v=15")) {
    fail(failures, `${page} does not reference assistant-dock.js?v=15`);
  }
  if (page.startsWith("/admin-")) {
    if (text.includes("final-ux-theme.css")) {
      fail(failures, `${page} should use admin-theme.css without final-ux-theme.css`);
    }
  } else if (!text.includes("final-ux-theme.css?v=3")) {
    fail(failures, `${page} does not reference final-ux-theme.css?v=3`);
  }
  for (const marker of forbiddenLegacyPurpleMarkers) {
    if (text.toLowerCase().includes(marker.toLowerCase())) {
      fail(failures, `${page} still contains legacy purple UI marker ${marker}`);
    }
  }
  if (publicNoAdminLinkPages.has(page)) {
    for (const marker of forbiddenPublicAdminLinkMarkers) {
      if (text.toLowerCase().includes(marker.toLowerCase())) {
        fail(failures, `${page} exposes admin-only link marker ${marker} on a public page`);
      }
    }
  }
  if (page === "/login") {
    for (const marker of requiredLoginHtmlMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing final Stitch login marker ${marker}`);
      }
    }
  }
  const stitchScreen = requiredStitchScreenByPath.get(page);
  if (stitchScreen) {
    checkStitchScreenContract(failures, page, text, stitchScreen);
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
  if (["/portal", "/assistant", "/brief", "/admin-ops"].includes(page) && !text.includes("ai-preferences.js?v=3")) {
    fail(failures, `${page} does not reference ai-preferences.js?v=3`);
  }
  if (["/admin-ops", "/admin-verification", "/admin-readiness"].includes(page)) {
    for (const marker of requiredAdminThemeMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing dark admin theme marker ${marker}`);
      }
    }
  }
  if (page === "/brief" && !text.includes(expectedBriefScriptRef)) {
    fail(failures, `${page} does not reference ${expectedBriefScriptRef}`);
  }
  if (page === "/brief") {
    for (const marker of requiredBriefHtmlMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing brief marker ${marker}`);
      }
    }
  }
  if (page === "/admin-ops" && !text.includes("admin-ops.js?v=10")) {
    fail(failures, `${page} does not reference admin-ops.js?v=10`);
  }
  if (page === "/admin-verification" && !text.includes("admin-verification.js?v=3")) {
    fail(failures, `${page} does not reference admin-verification.js?v=3`);
  }
  if (page === "/admin-readiness" && !text.includes("admin-readiness.js?v=9")) {
    fail(failures, `${page} does not reference admin-readiness.js?v=9`);
  }
  if (page === "/admin-readiness") {
    for (const marker of requiredAdminReadinessHtmlMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing provider matrix marker ${marker}`);
      }
    }
  }
  if (page === "/verification" && !text.includes("verification.js?v=10")) {
    fail(failures, `${page} does not reference verification.js?v=10`);
  }
  if (page === "/tracking" && !text.includes("stitch-tracking.js?v=10")) {
    fail(failures, `${page} does not reference stitch-tracking.js?v=10`);
  }
  if (page === "/assistant" && !text.includes("assistant.js?v=7")) {
    fail(failures, `${page} does not reference assistant.js?v=7`);
  }
  if (page === "/assistant") {
    for (const marker of requiredAssistantHtmlMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing assistant manual-mode marker ${marker}`);
      }
    }
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
  if (page === "/messages" && !text.includes("messages.js?v=4")) {
    fail(failures, `${page} does not reference messages.js?v=4`);
  }
  if (page === "/notifications") {
    for (const marker of requiredNotificationPageMarkers) {
      if (!text.includes(marker)) {
        fail(failures, `${page} is missing notification marker ${marker}`);
      }
    }
  }
  if (page === "/corridor" && !text.includes("corridor.js?v=9")) {
    fail(failures, `${page} does not reference corridor.js?v=9`);
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

const { response: sitemapResponse, text: sitemapText } = await fetchText("/sitemap.xml");
if (sitemapResponse.status !== 200) {
  fail(failures, `sitemap.xml returned ${sitemapResponse.status}`);
} else {
  pass("sitemap.xml returned 200");
  checkSitemapContract(failures, "Production sitemap.xml", sitemapText);
}

const { response: securityTxtResponse, text: securityTxtText } = await fetchText("/.well-known/security.txt");
if (securityTxtResponse.status !== 200) {
  fail(failures, `security.txt returned ${securityTxtResponse.status}`);
} else {
  pass("security.txt returned 200");
}
for (const marker of requiredSecurityTxtMarkers) {
  if (!securityTxtText.includes(marker)) {
    fail(failures, `Production security.txt is missing marker ${marker}`);
  } else {
    pass(`Production security.txt contains ${marker}`);
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

const { response: releaseResponse, text: releaseText } = await fetchText("/release.json");
if (releaseResponse.status !== 200) {
  fail(
    failures,
    `/release.json returned ${releaseResponse.status}; production is likely stale or missing the release manifest`,
  );
} else {
  pass("release.json returned 200");
  const productionRelease = parseJson(releaseText, "Production release.json", failures);
  if (productionRelease?.release_id !== localRelease?.release_id) {
    fail(
      failures,
      `Production release_id ${productionRelease?.release_id || "missing"} does not match local ${localRelease?.release_id || "missing"}. Redeploy the latest main commit before demo or launch.`,
    );
  } else {
    pass(`Production release_id matches ${productionRelease.release_id}`);
  }
  if (productionRelease?.sumsub_webhook_path !== localRelease?.sumsub_webhook_path) {
    fail(
      failures,
      `Production Sumsub webhook path ${productionRelease?.sumsub_webhook_path || "missing"} does not match local ${localRelease?.sumsub_webhook_path || "missing"}`,
    );
  } else {
    pass(`Production Sumsub webhook path matches ${productionRelease.sumsub_webhook_path}`);
  }
}

const { response: adminThemeResponse, text: adminThemeText } = await fetchText("/admin-theme.css?v=1");
if (adminThemeResponse.status !== 200) {
  fail(failures, `admin-theme.css?v=1 returned ${adminThemeResponse.status}`);
} else {
  pass("admin-theme.css?v=1 returned 200");
}
for (const marker of requiredAdminThemeCssMarkers) {
  if (!adminThemeText.includes(marker)) {
    fail(failures, `admin-theme.css?v=1 is missing marker ${marker}`);
  } else {
    pass(`admin-theme.css contains ${marker}`);
  }
}

const { response: finalUxThemeResponse, text: finalUxThemeText } = await fetchText("/final-ux-theme.css?v=3");
if (finalUxThemeResponse.status !== 200) {
  fail(failures, `final-ux-theme.css?v=3 returned ${finalUxThemeResponse.status}`);
} else {
  pass("final-ux-theme.css?v=3 returned 200");
}
for (const marker of requiredFinalUxThemeCssMarkers) {
  if (!finalUxThemeText.includes(marker)) {
    fail(failures, `final-ux-theme.css?v=3 is missing marker ${marker}`);
  } else {
    pass(`final-ux-theme.css contains ${marker}`);
  }
}
for (const marker of forbiddenLegacyPurpleMarkers) {
  if (finalUxThemeText.toLowerCase().includes(marker.toLowerCase())) {
    fail(failures, `final-ux-theme.css?v=3 still contains legacy purple UI marker ${marker}`);
  }
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

  for (const publicPage of publicFreshHtmlPages) {
    const { response } = await fetchText(publicPage);
    if (response.status !== 200) {
      fail(failures, `${publicPage} returned ${response.status} while checking public final-UX cache headers`);
      continue;
    }
    if (!headerIncludes(response, "cache-control", "no-store")) {
      fail(failures, `${publicPage} is missing Cache-Control: no-store for final UX refresh safety`);
    } else {
      pass(`${publicPage} includes Cache-Control: no-store`);
    }
  }

  for (const assetPath of criticalNoStoreAssets) {
    const { response } = await fetchText(assetPath);
    if (response.status !== 200) {
      fail(failures, `${assetPath} returned ${response.status} while checking asset cache headers`);
      continue;
    }
    if (!headerIncludes(response, "cache-control", "no-store")) {
      fail(failures, `${assetPath} is missing Cache-Control: no-store`);
    } else {
      pass(`${assetPath} includes Cache-Control: no-store`);
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

  for (const apiEndpoint of postOnlyApiEndpoints) {
    const { response } = await fetchText(apiEndpoint);
    if (response.status !== 405) {
      fail(failures, `${apiEndpoint} should reject GET with 405, got ${response.status}`);
    } else {
      pass(`${apiEndpoint} rejects GET with 405`);
    }
    if (!headerIncludes(response, "allow", "POST")) {
      fail(failures, `${apiEndpoint} 405 response is missing Allow: POST`);
    } else {
      pass(`${apiEndpoint} 405 response includes Allow: POST`);
    }
  }

  const { response: sumsubProbeResponse, text: sumsubProbeText } = await fetchText("/api/identity/sumsub-webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  if (![401, 503].includes(sumsubProbeResponse.status)) {
    fail(failures, `/api/identity/sumsub-webhook unsigned POST should stop at Sumsub verification/setup, got ${sumsubProbeResponse.status}`);
  } else if (/Sign in before starting identity verification/i.test(sumsubProbeText)) {
    fail(failures, "/api/identity/sumsub-webhook fell through to user sign-in flow instead of Sumsub webhook handling");
  } else if (!/SUMSUB_WEBHOOK_SECRET|Missing Sumsub x-payload-digest/i.test(sumsubProbeText)) {
    fail(failures, "/api/identity/sumsub-webhook did not return the expected Sumsub-specific setup/signature response");
  } else {
    pass("/api/identity/sumsub-webhook routes unsigned POST to Sumsub-specific handling");
  }

  const { response: readinessGetResponse } = await fetchText("/api/ops/readiness");
  if (readinessGetResponse.status !== 401) {
    fail(failures, `/api/ops/readiness should require admin auth with 401, got ${readinessGetResponse.status}`);
  } else {
    pass("/api/ops/readiness requires admin auth with 401");
  }

  const { response: readinessPostResponse } = await fetchText("/api/ops/readiness", { method: "POST" });
  if (readinessPostResponse.status !== 405) {
    fail(failures, `/api/ops/readiness should reject POST with 405, got ${readinessPostResponse.status}`);
  } else {
    pass("/api/ops/readiness rejects POST with 405");
  }
  if (!headerIncludes(readinessPostResponse, "allow", "GET")) {
    fail(failures, "/api/ops/readiness 405 response is missing Allow: GET");
  } else {
    pass("/api/ops/readiness 405 response includes Allow: GET");
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

const { response: adminOpsResponse, text: adminOpsText } = await fetchText("/admin-ops.js?v=10");
if (adminOpsResponse.status !== 200) {
  fail(failures, `admin-ops.js?v=10 returned ${adminOpsResponse.status}`);
} else {
  pass("admin-ops.js?v=10 returned 200");
}

for (const marker of requiredAdminOpsMarkers) {
  if (!adminOpsText.includes(marker)) {
    fail(failures, `Production admin-ops.js is missing marker ${marker}`);
  } else {
    pass(`Production admin-ops.js contains ${marker}`);
  }
}

const { response: adminVerificationResponse, text: adminVerificationText } = await fetchText("/admin-verification.js?v=3");
if (adminVerificationResponse.status !== 200) {
  fail(failures, `admin-verification.js?v=3 returned ${adminVerificationResponse.status}`);
} else {
  pass("admin-verification.js?v=3 returned 200");
}

for (const marker of requiredAdminVerificationMarkers) {
  if (!adminVerificationText.includes(marker)) {
    fail(failures, `Production admin-verification.js is missing marker ${marker}`);
  } else {
    pass(`Production admin-verification.js contains ${marker}`);
  }
}

const { response: adminReadinessResponse, text: adminReadinessText } = await fetchText("/admin-readiness.js?v=9");
if (adminReadinessResponse.status !== 200) {
  fail(failures, `admin-readiness.js?v=9 returned ${adminReadinessResponse.status}`);
} else {
  pass("admin-readiness.js?v=9 returned 200");
}

for (const marker of requiredAdminReadinessMarkers) {
  if (!adminReadinessText.includes(marker)) {
    fail(failures, `Production admin-readiness.js is missing marker ${marker}`);
  } else {
    pass(`Production admin-readiness.js contains ${marker}`);
  }
}

const { response: assistantResponse, text: assistantText } = await fetchText("/assistant.js?v=7");
if (assistantResponse.status !== 200) {
  fail(failures, `assistant.js?v=7 returned ${assistantResponse.status}`);
} else {
  pass("assistant.js?v=7 returned 200");
}

for (const marker of requiredAssistantMarkers) {
  if (!assistantText.includes(marker)) {
    fail(failures, `Production assistant.js is missing marker ${marker}`);
  } else {
    pass(`Production assistant.js contains ${marker}`);
  }
}

const { response: assistantDockResponse, text: assistantDockText } = await fetchText("/assistant-dock.js?v=15");
if (assistantDockResponse.status !== 200) {
  fail(failures, `assistant-dock.js?v=15 returned ${assistantDockResponse.status}`);
} else {
  pass("assistant-dock.js?v=15 returned 200");
}

for (const marker of requiredDockMarkers) {
  if (!assistantDockText.includes(marker)) {
    fail(failures, `Production assistant-dock.js is missing marker ${marker}`);
  } else {
    pass(`Production assistant-dock.js contains ${marker}`);
  }
}
for (const marker of forbiddenLegacyPurpleMarkers) {
  if (assistantDockText.toLowerCase().includes(marker.toLowerCase())) {
    fail(failures, `Production assistant-dock.js still contains legacy purple UI marker ${marker}`);
  }
}

const { response: aiPreferenceResponse, text: aiPreferenceText } = await fetchText("/ai-preferences.js?v=3");
if (aiPreferenceResponse.status !== 200) {
  fail(failures, `ai-preferences.js?v=3 returned ${aiPreferenceResponse.status}`);
} else {
  pass("ai-preferences.js?v=3 returned 200");
}
for (const marker of requiredAiPreferenceMarkers) {
  if (!aiPreferenceText.includes(marker)) {
    fail(failures, `Production ai-preferences.js is missing marker ${marker}`);
  } else {
    pass(`Production ai-preferences.js contains ${marker}`);
  }
}

const { response: briefScriptResponse, text: briefScriptText } = await fetchText(`/${expectedBriefScriptRef}`);
if (briefScriptResponse.status !== 200) {
  fail(failures, `${expectedBriefScriptRef} returned ${briefScriptResponse.status}`);
} else {
  pass(`${expectedBriefScriptRef} returned 200`);
}
for (const marker of requiredBriefScriptMarkers) {
  if (!briefScriptText.includes(marker)) {
    fail(failures, `Production brief flow is missing marker ${marker}`);
  } else {
    pass(`Production brief flow contains ${marker}`);
  }
}

const { response: trackingResponse, text: trackingText } = await fetchText("/stitch-tracking.js?v=10");
if (trackingResponse.status !== 200) {
  fail(failures, `stitch-tracking.js?v=10 returned ${trackingResponse.status}`);
} else {
  pass("stitch-tracking.js?v=10 returned 200");
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

const { response: messagesResponse, text: messagesText } = await fetchText("/messages.js?v=4");
if (messagesResponse.status !== 200) {
  fail(failures, `messages.js?v=4 returned ${messagesResponse.status}`);
} else {
  pass("messages.js?v=4 returned 200");
}

for (const marker of requiredMessagesMarkers) {
  if (!messagesText.includes(marker)) {
    fail(failures, `Production messages.js is missing marker ${marker}`);
  } else {
    pass(`Production messages.js contains ${marker}`);
  }
}

const { response: notificationsResponse, text: notificationsText } = await fetchText("/notifications.js?v=1");
if (notificationsResponse.status !== 200) {
  fail(failures, `notifications.js?v=1 returned ${notificationsResponse.status}`);
} else {
  pass("notifications.js?v=1 returned 200");
}

for (const marker of requiredNotificationScriptMarkers) {
  if (!notificationsText.includes(marker)) {
    fail(failures, `Production notifications.js is missing marker ${marker}`);
  } else {
    pass(`Production notifications.js contains ${marker}`);
  }
}

if (failures.length) {
  console.error(`\nHealth check failed for ${baseUrl}`);
  process.exitCode = 1;
} else {
  console.log(`\nHealth check passed for ${baseUrl}`);
}
