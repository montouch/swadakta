const CORE_OWNER_FLAGS = [
  "SWADAKTA_OWNER_BUSINESS_REGISTERED",
  "SWADAKTA_OWNER_TAX_REVIEWED",
  "SWADAKTA_OWNER_INSURANCE_ACTIVE",
  "SWADAKTA_OWNER_LEGAL_REVIEWED",
  "SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED",
  "SWADAKTA_OWNER_PRIVACY_REVIEWED",
  "SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED",
  "SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED",
];

const HIGH_VALUE_THRESHOLD_BY_CURRENCY = {
  AUD: 5000,
  USD: 5000,
  GBP: 4000,
  EUR: 4500,
  KES: 500000,
  CNY: 35000,
};

function confirmedEnv(name) {
  return ["1", "true", "yes", "ready", "confirmed", "done"].includes(
    String(process.env[name] || "")
      .trim()
      .toLowerCase(),
  );
}

function hasEnv(name) {
  return Boolean(String(process.env[name] || "").trim());
}

function anyEnv(names) {
  return names.some(hasEnv);
}

function missingConfirmed(names) {
  return names.filter((name) => !confirmedEnv(name));
}

function missingEnv(names) {
  return names.filter((name) => !hasEnv(name));
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function normalized(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function payloadFlags(payload = {}) {
  return Array.isArray(payload.compliance_flags)
    ? uniqueStrings(payload.compliance_flags)
    : uniqueStrings(
        String(payload.compliance_flags || "")
          .split(/[,\n|]+/)
          .map((flag) => flag.trim()),
      );
}

function flagValue(flags = [], prefix = "") {
  const match = flags.find((flag) => String(flag || "").startsWith(prefix));
  return match ? match.slice(prefix.length) : "";
}

function requestAcceptanceStatus(payload = {}) {
  const flags = payloadFlags(payload);
  const acceptanceFlags = {
    rules_acceptance_quote_eligible: "quote_eligible",
    rules_acceptance_evidence_before_quote: "evidence_before_quote",
    rules_acceptance_founder_review: "founder_review",
    rules_acceptance_refuse: "refuse",
  };
  const flag = flags.find((value) => acceptanceFlags[value]);
  if (flag) return acceptanceFlags[flag];

  const direct = normalized(payload.job_acceptance_status || flagValue(flags, "rules_acceptance_"));
  if (["quote_eligible", "evidence_before_quote", "founder_review", "refuse"].includes(direct)) return direct;
  return "";
}

function booleanish(value) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y"].includes(normalized(value));
}

function jobPaymentGatePayload(payload = {}) {
  const flags = payloadFlags(payload);
  const acceptance = requestAcceptanceStatus(payload);
  const complianceStatus = normalized(payload.compliance_status);
  const riskLevel = normalized(payload.compliance_risk_level);
  const goodsCategory = normalized(payload.goods_category);
  const logisticsMode = normalized(payload.logistics_mode);
  const routeStatus = normalized(payload.route_status);
  const blockers = [];
  const warnings = [];

  if (acceptance === "refuse") blockers.push("JOB_ACCEPTANCE_REFUSE");
  if (acceptance === "founder_review") blockers.push("JOB_ACCEPTANCE_FOUNDER_REVIEW_REQUIRED");
  if (acceptance === "evidence_before_quote") blockers.push("JOB_ROUTE_EVIDENCE_REQUIRED");
  if (["prohibited"].includes(complianceStatus)) blockers.push("JOB_COMPLIANCE_PROHIBITED");
  if (["restricted"].includes(complianceStatus)) blockers.push("JOB_COMPLIANCE_RESTRICTED");
  if (booleanish(payload.admin_review_required)) blockers.push("JOB_ADMIN_REVIEW_REQUIRED");
  if (riskLevel === "high") blockers.push("JOB_HIGH_RISK_REVIEW_REQUIRED");
  if (booleanish(payload.sensitive_documents_expected)) blockers.push("JOB_SENSITIVE_DOCUMENTS_REVIEW_REQUIRED");
  if (["restricted_or_unsure", "weapons_hazardous", "medicine_health", "valuable_items"].includes(goodsCategory)) {
    blockers.push("JOB_GOODS_RESTRICTED_OR_UNSURE");
  }
  if (["blocked", "unsupported"].includes(routeStatus)) blockers.push("JOB_ROUTE_NOT_SUPPORTED");

  if (["airport_handoff", "traveller_handoff"].includes(logisticsMode)) {
    warnings.push("JOB_TRAVELLER_HANDOFF_RULES_REQUIRED");
  }
  if (flags.includes("brief_cross_border_goods") || flags.includes("rules_cross_border")) {
    warnings.push("JOB_CROSS_BORDER_GOODS_RULES_REQUIRED");
  }

  return {
    status: blockers.length ? "locked" : warnings.length ? "evidence_sensitive" : "payment_route_eligible",
    acceptance_status: acceptance || "not_supplied",
    compliance_status: complianceStatus || "not_supplied",
    compliance_risk_level: riskLevel || "not_supplied",
    goods_category: goodsCategory || "not_supplied",
    logistics_mode: logisticsMode || "not_supplied",
    blockers: uniqueStrings(blockers),
    warnings: uniqueStrings(warnings),
    rule:
      "Payment routes require a quote-eligible job or a cleared normal-risk job. Refused, evidence-first, founder-review, restricted, prohibited, blocked-route, high-risk, and sensitive-document jobs stay locked until the request is corrected and evidence is recorded.",
  };
}

function serviceRoleConfigured() {
  return anyEnv(["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"]);
}

function sumsubNativeConfigured() {
  return ["SUMSUB_APP_TOKEN", "SUMSUB_SECRET_KEY", "SUMSUB_LEVEL_NAME"].every(hasEnv);
}

function identityRouteConfigured() {
  return (
    anyEnv([
      "SMILE_ID_VERIFICATION_URL",
      "SUMSUB_VERIFICATION_URL",
      "SUMSUB_WEBSDK_URL",
      "SUMSUB_APPLICANT_LINK_URL",
      "YOUVERIFY_VERIFICATION_URL",
      "YOUVERIFY_APPLICANT_LINK_URL",
    ]) || sumsubNativeConfigured()
  );
}

function providerEvidenceMissing(rail) {
  if (rail === "stripe") {
    return [
      ...missingEnv(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]),
      ...(serviceRoleConfigured() ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
    ];
  }

  if (rail === "paypal") {
    return missingEnv(["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]);
  }

  if (rail === "mpesa") {
    return [
      ...missingEnv(["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY"]),
      ...(serviceRoleConfigured() ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
      ...(hasEnv("MPESA_CALLBACK_TOKEN") ? [] : ["MPESA_CALLBACK_TOKEN"]),
      ...(confirmedEnv("SWADAKTA_OWNER_KENYA_SETUP_REVIEWED") ? [] : ["SWADAKTA_OWNER_KENYA_SETUP_REVIEWED"]),
    ];
  }

  if (rail === "wise") {
    return anyEnv(["WISE_PAYMENT_LINK_URL", "WISE_PAYMENT_REQUEST_URL", "WISE_RECEIVE_DETAILS_URL"])
      ? []
      : ["WISE_PAYMENT_LINK_URL"];
  }

  return [`UNKNOWN_PAYMENT_RAIL_${String(rail || "missing").toUpperCase()}`];
}

function normalizedCurrency(payload = {}) {
  return String(payload.quote_currency || payload.currency || payload.preferred_currency || "AUD")
    .trim()
    .toUpperCase();
}

function requiresRegulatedEscrow(payload = {}) {
  const currency = normalizedCurrency(payload);
  const quoteAmount = Number(payload.quote_amount || payload.amount || 0);
  const threshold = HIGH_VALUE_THRESHOLD_BY_CURRENCY[currency] || 5000;
  const valueBand = String(payload.job_value_band || payload.value_band || "").toLowerCase();
  const servicePackage = String(payload.service_package || "").toLowerCase();
  const fundsPlan = String(payload.funds_protection_preference || payload.payment_kind || "").toLowerCase();

  return (
    (Number.isFinite(quoteAmount) && quoteAmount >= threshold) ||
    ["high", "high_value", "very_high", "property", "title", "construction", "supplier_deposit"].includes(valueBand) ||
    /property|title|construction|supplier|vehicle|land/.test(servicePackage) ||
    /escrow|supplier_deposit|construction|title/.test(fundsPlan)
  );
}

function paymentLaunchGatePayload(rail, payload = {}) {
  const jobGate = jobPaymentGatePayload(payload);
  const missing = [
    ...jobGate.blockers,
    ...missingConfirmed(CORE_OWNER_FLAGS),
    ...(identityRouteConfigured() ? [] : ["ID_PROVIDER_EVIDENCE_ROUTE"]),
    ...providerEvidenceMissing(rail),
  ];
  const highValue = requiresRegulatedEscrow(payload);
  if (highValue && !confirmedEnv("SWADAKTA_OWNER_REGULATED_ESCROW_READY")) {
    missing.push("SWADAKTA_OWNER_REGULATED_ESCROW_READY");
  }

  return {
    status: missing.length ? "locked" : highValue ? "high_value_provider_gate" : "founder_reviewed_pilot",
    rail,
    missing: [...new Set(missing)],
    job_gate: jobGate,
    job_blockers: jobGate.blockers,
    high_value_or_sensitive: highValue,
    public_launch_mode: "founder_reviewed_pilot",
    hard_rule:
      "Provider evidence can prepare or confirm collection state only. It must not assign receivers, release milestones, refund money, approve ID, or clear legal/customs/high-value risk.",
    readiness_url: "https://swadakta.com/admin-readiness",
  };
}

function assertPaymentLaunchAllowed(rail, payload = {}) {
  const gate = paymentLaunchGatePayload(rail, payload);
  if (gate.missing.length) {
    const error = new Error(
      `Payment launch gate locked for ${rail}. Complete admin readiness before creating a real payment route. Missing: ${gate.missing.join(", ")}.`,
    );
    error.statusCode = 423;
    error.launchGate = gate;
    throw error;
  }

  return gate;
}

function paymentLaunchGateErrorBody(error, fallbackMessage) {
  if (error?.launchGate) {
    return {
      error: error.message,
      payment_launch_locked: true,
      launch_gate: error.launchGate,
      missing: error.launchGate.missing,
      job_gate: error.launchGate.job_gate,
      job_blockers: error.launchGate.job_blockers || [],
    };
  }

  return {
    error: error?.message || fallbackMessage || "Payment route failed.",
  };
}

module.exports = {
  assertPaymentLaunchAllowed,
  jobPaymentGatePayload,
  paymentLaunchGateErrorBody,
  paymentLaunchGatePayload,
  requiresRegulatedEscrow,
};
