const PAYMENT_REQUEST_SELECT_FIELDS = [
  "id",
  "request_code",
  "client_name",
  "email",
  "whatsapp",
  "local_contact_phone",
  "service_package",
  "quote_amount",
  "quote_currency",
  "preferred_currency",
  "funds_protection_preference",
  "job_value_band",
  "operator_payout",
  "field_costs",
  "payment_processing_fee",
  "compliance_status",
  "compliance_risk_level",
  "admin_review_required",
  "admin_review_reason",
  "compliance_flags",
  "required_checks",
  "goods_category",
  "logistics_mode",
  "route_status",
  "task_type",
  "service_direction",
  "sensitive_documents_expected",
  "payment_status",
  "funds_status",
  "payment_reference",
  "release_notes",
  "notes",
].join(",");

function paymentRouteRequestCode(payload = {}) {
  const requestCode = String(payload.request_code || "")
    .trim()
    .toUpperCase();
  if (!requestCode) {
    const error = new Error("Request code is required before creating a payment route.");
    error.statusCode = 400;
    throw error;
  }

  return requestCode;
}

function sameMoney(left, right) {
  const leftAmount = Number(left);
  const rightAmount = Number(right);
  return Number.isFinite(leftAmount) && Number.isFinite(rightAmount) && Math.round(leftAmount) === Math.round(rightAmount);
}

function assertStoredQuoteReady(payload = {}, storedRequest = {}) {
  const storedAmount = Number(storedRequest.quote_amount);
  if (!Number.isFinite(storedAmount) || storedAmount <= 0) {
    const error = new Error("Save a positive quote amount on the stored Swadakta request before creating a payment route.");
    error.statusCode = 409;
    throw error;
  }

  const storedCurrency = String(storedRequest.quote_currency || "").trim().toUpperCase();
  if (!storedCurrency) {
    const error = new Error("Save a quote currency on the stored Swadakta request before creating a payment route.");
    error.statusCode = 409;
    throw error;
  }

  if (payload.quote_amount !== undefined && payload.quote_amount !== null && !sameMoney(payload.quote_amount, storedAmount)) {
    const error = new Error("Payment route quote amount must match the saved Swadakta request. Save the quote first, then try again.");
    error.statusCode = 409;
    throw error;
  }

  const payloadCurrency = String(payload.quote_currency || payload.preferred_currency || "").trim().toUpperCase();
  if (payloadCurrency && payloadCurrency !== storedCurrency) {
    const error = new Error("Payment route quote currency must match the saved Swadakta request. Save the quote first, then try again.");
    error.statusCode = 409;
    throw error;
  }
}

function mergeStoredPaymentPayload(payload = {}, storedRequest = {}) {
  assertStoredQuoteReady(payload, storedRequest);

  return {
    ...payload,
    request_code: storedRequest.request_code || paymentRouteRequestCode(payload),
    client_name: storedRequest.client_name || payload.client_name,
    email: storedRequest.email || payload.email,
    whatsapp: storedRequest.whatsapp || payload.whatsapp,
    phone_number: payload.phone_number || storedRequest.local_contact_phone || storedRequest.whatsapp,
    service_package: storedRequest.service_package || payload.service_package,
    quote_amount: storedRequest.quote_amount,
    quote_currency: storedRequest.quote_currency || storedRequest.preferred_currency || payload.quote_currency,
    preferred_currency: storedRequest.preferred_currency || payload.preferred_currency,
    funds_protection_preference: storedRequest.funds_protection_preference || payload.funds_protection_preference,
    job_value_band: storedRequest.job_value_band || payload.job_value_band,
    operator_payout: storedRequest.operator_payout || payload.operator_payout || 0,
    field_costs: storedRequest.field_costs || payload.field_costs || 0,
    payment_processing_fee: storedRequest.payment_processing_fee || payload.payment_processing_fee || 0,
    job_acceptance_status: storedRequest.job_acceptance_status || payload.job_acceptance_status,
    compliance_status: storedRequest.compliance_status || payload.compliance_status,
    compliance_risk_level: storedRequest.compliance_risk_level || payload.compliance_risk_level,
    admin_review_required: storedRequest.admin_review_required === true,
    admin_review_reason: storedRequest.admin_review_reason || payload.admin_review_reason,
    compliance_flags: Array.isArray(storedRequest.compliance_flags)
      ? storedRequest.compliance_flags
      : Array.isArray(payload.compliance_flags)
        ? payload.compliance_flags
        : [],
    required_checks: Array.isArray(storedRequest.required_checks)
      ? storedRequest.required_checks
      : Array.isArray(payload.required_checks)
        ? payload.required_checks
        : [],
    goods_category: storedRequest.goods_category || payload.goods_category,
    logistics_mode: storedRequest.logistics_mode || payload.logistics_mode,
    route_status: storedRequest.route_status || payload.route_status,
    task_type: storedRequest.task_type || payload.task_type,
    service_direction: storedRequest.service_direction || payload.service_direction,
    sensitive_documents_expected: storedRequest.sensitive_documents_expected === true,
    stored_request_id: storedRequest.id || "",
    stored_payment_status: storedRequest.payment_status || "",
    stored_funds_status: storedRequest.funds_status || "",
    notes: storedRequest.notes || payload.notes || "",
  };
}

async function fetchStoredPaymentRequest(authHeader, requestCode, options = {}) {
  const supabaseUrl = String(options.supabaseUrl || "").replace(/\/$/, "");
  const supabasePublishableKey = options.supabasePublishableKey;
  if (!supabaseUrl || !supabasePublishableKey) {
    const error = new Error("Supabase payment request lookup is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/service_requests?request_code=eq.${encodeURIComponent(requestCode)}&select=${PAYMENT_REQUEST_SELECT_FIELDS}&limit=1`,
    {
      headers: {
        apikey: supabasePublishableKey,
        authorization: authHeader,
        accept: "application/json",
      },
    },
  );

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    const error = new Error(data?.message || "Could not load the stored Swadakta request before creating a payment route.");
    error.statusCode = response.status || 502;
    throw error;
  }

  const storedRequest = Array.isArray(data) ? data[0] || null : null;
  if (!storedRequest) {
    const error = new Error("Create and save the Swadakta request before creating a payment route.");
    error.statusCode = 404;
    throw error;
  }

  return storedRequest;
}

async function paymentRoutePayloadFromStoredRequest(authHeader, payload = {}, options = {}) {
  const requestCode = paymentRouteRequestCode(payload);
  const storedRequest = await fetchStoredPaymentRequest(authHeader, requestCode, options);
  return {
    payload: mergeStoredPaymentPayload(payload, storedRequest),
    storedRequest,
  };
}

module.exports = {
  PAYMENT_REQUEST_SELECT_FIELDS,
  assertStoredQuoteReady,
  fetchStoredPaymentRequest,
  mergeStoredPaymentPayload,
  paymentRoutePayloadFromStoredRequest,
  paymentRouteRequestCode,
};
