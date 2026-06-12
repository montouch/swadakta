(function () {
  const STORAGE_KEY = "swadakta_service_requests";
  const PARTNER_STORAGE_KEY = "swadakta_partner_applications";
  const FIELD_UPDATE_STORAGE_KEY = "swadakta_field_updates";
  const FUND_MILESTONE_STORAGE_KEY = "swadakta_fund_milestones";
  const ACCOUNT_PROFILE_STORAGE_KEY = "swadakta_account_profile";
  const IDENTITY_VERIFICATION_STORAGE_KEY = "swadakta_identity_verification_requests";
  const RESOLUTION_CASE_STORAGE_KEY = "swadakta_resolution_cases";
  const PROOF_BUCKET = "swadakta-proof";
  const MAX_STANDARD_UPLOAD_BYTES = 6 * 1024 * 1024;
  let supabaseClientPromise = null;

  function config() {
    return window.SWADAKTA_CONFIG || {};
  }

  function isSupabaseConfigured() {
    const current = config();
    return Boolean(current.supabaseUrl && current.supabasePublishableKey);
  }

  function publicBaseUrl() {
    return String(config().publicBaseUrl || window.location.origin || "").replace(/\/+$/, "");
  }

  function isLocalOrigin(url) {
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  }

  function normalizeAuthRedirect(redirectTo = window.location.href.split("#")[0]) {
    const target = new URL(redirectTo, window.location.href);

    if (isLocalOrigin(target) && publicBaseUrl()) {
      return new URL(`${target.pathname}${target.search}${target.hash}`, publicBaseUrl()).href;
    }

    return target.href;
  }

  function authCallbackRedirect(redirectTo = window.location.href.split("#")[0]) {
    const target = new URL(normalizeAuthRedirect(redirectTo));
    const base = publicBaseUrl() || target.origin;
    const next = `${target.pathname}${target.search}${target.hash}` || "/portal";
    const callback = new URL("/auth", base);
    callback.searchParams.set("next", next);
    return callback.href;
  }

  function createLocalCode() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SW-${token}`;
  }

  function createPartnerCode() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SP-${token}`;
  }

  function createFieldUpdateCode() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `FU-${token}`;
  }

  function createFundMilestoneCode() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `FM-${token}`;
  }

  function createIdentityVerificationCode() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `IV-${token}`;
  }

  function createResolutionCode() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `RC-${token}`;
  }

  function safeStorageSegment(value, fallback = "file") {
    const clean = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    return clean || fallback;
  }

  function proofFileKind(file) {
    const type = String(file?.type || "").toLowerCase();

    if (type.startsWith("image/")) {
      return "photo";
    }
    if (type.startsWith("video/")) {
      return "video";
    }
    if (type === "application/pdf") {
      return "pdf";
    }

    return "file";
  }

  function createUuid() {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
      (
        Number(character) ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(character) / 4)))
      ).toString(16),
    );
  }

  function readLocalRequests() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeLocalRequests(requests) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }

  function readLocalPartnerApplications() {
    try {
      return JSON.parse(localStorage.getItem(PARTNER_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeLocalPartnerApplications(applications) {
    localStorage.setItem(PARTNER_STORAGE_KEY, JSON.stringify(applications));
  }

  function readLocalFieldUpdates() {
    try {
      return JSON.parse(localStorage.getItem(FIELD_UPDATE_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeLocalFieldUpdates(updates) {
    localStorage.setItem(FIELD_UPDATE_STORAGE_KEY, JSON.stringify(updates));
  }

  function readLocalFundMilestones() {
    try {
      return JSON.parse(localStorage.getItem(FUND_MILESTONE_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeLocalFundMilestones(milestones) {
    localStorage.setItem(FUND_MILESTONE_STORAGE_KEY, JSON.stringify(milestones));
  }

  function readLocalAccountProfile() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNT_PROFILE_STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function writeLocalAccountProfile(profile) {
    localStorage.setItem(ACCOUNT_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  function readLocalIdentityVerificationRequests() {
    try {
      return JSON.parse(localStorage.getItem(IDENTITY_VERIFICATION_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeLocalIdentityVerificationRequests(requests) {
    localStorage.setItem(IDENTITY_VERIFICATION_STORAGE_KEY, JSON.stringify(requests));
  }

  function readLocalResolutionCases() {
    try {
      return JSON.parse(localStorage.getItem(RESOLUTION_CASE_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeLocalResolutionCases(cases) {
    localStorage.setItem(RESOLUTION_CASE_STORAGE_KEY, JSON.stringify(cases));
  }

  function normalizeRequest(payload) {
    const now = new Date().toISOString();
    return {
      id: createUuid(),
      request_code: createLocalCode(),
      status: "new",
      payment_status: "unquoted",
      assigned_to: "",
      assigned_partner_id: null,
      operator_notes: "",
      client_report: "",
      quote_amount: null,
      quote_currency: "AUD",
      payment_link: "",
      payment_due_at: null,
      funds_status: "not_collected",
      protected_amount: 0,
      release_condition: "Admin verifies proof and client-safe report before receiver payout.",
      payment_reference: "",
      release_notes: "",
      identity_verification_required: true,
      verification_status: "required",
      verification_reason: "",
      verified_at: null,
      identity_verification_consent: false,
      operator_payout: 0,
      field_costs: 0,
      payment_processing_fee: 0,
      client_report_url: "",
      proof_links: [],
      client_review_score: null,
      client_review_note: "",
      client_reviewed_at: null,
      contact_permission: false,
      professional_boundary_accepted: false,
      terms_accepted_at: null,
      privacy_accepted_at: null,
      contact_preference: "whatsapp",
      contact_window: "",
      supporting_links: [],
      sensitive_documents_expected: false,
      origin_country: payload.origin_country || "Australia",
      destination_country: payload.destination_country || "Kenya",
      service_direction: payload.service_direction || "origin_to_destination",
      task_location: payload.task_location || payload.kenya_location || "",
      logistics_mode: payload.logistics_mode || "not_needed",
      goods_category: payload.goods_category || "none",
      logistics_notes: payload.logistics_notes || "",
      route_status: payload.route_status || "active",
      compliance_flags: Array.isArray(payload.compliance_flags) ? payload.compliance_flags : [],
      required_checks: Array.isArray(payload.required_checks) ? payload.required_checks : [],
      proof_requirements: Array.isArray(payload.proof_requirements) ? payload.proof_requirements : [],
      compliance_acknowledged: Boolean(payload.compliance_acknowledged),
      compliance_status: payload.compliance_status || "needs_ai_review",
      compliance_risk_level: payload.compliance_risk_level || "standard",
      automation_status: payload.automation_status || "ai_triage",
      admin_review_required: Boolean(payload.admin_review_required),
      admin_review_reason: payload.admin_review_reason || "",
      service_package: "quote_first",
      payment_method_preference: "discuss",
      job_value_band: "unsure",
      funds_protection_preference: "quote_first",
      budget_range: "unsure",
      proof_priority: "balanced",
      referral_source: "not_sure",
      created_at: now,
      updated_at: now,
      ...payload,
    };
  }

  async function getSupabase() {
    if (!isSupabaseConfigured()) {
      return null;
    }

    if (!supabaseClientPromise) {
      supabaseClientPromise = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(
        ({ createClient }) =>
          createClient(config().supabaseUrl, config().supabasePublishableKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
            },
          }),
      );
    }

    return supabaseClientPromise;
  }

  function toDatabasePayload(payload) {
    return {
      id: payload.id,
      request_code: payload.request_code,
      client_name: payload.client_name,
      email: payload.email,
      whatsapp: payload.whatsapp,
      client_base: payload.client_base,
      australia_location: payload.australia_location,
      origin_country: payload.origin_country,
      destination_country: payload.destination_country,
      service_direction: payload.service_direction,
      task_location: payload.task_location || payload.kenya_location,
      logistics_mode: payload.logistics_mode,
      goods_category: payload.goods_category,
      logistics_notes: payload.logistics_notes,
      route_status: payload.route_status,
      compliance_flags: payload.compliance_flags,
      required_checks: payload.required_checks,
      proof_requirements: payload.proof_requirements,
      compliance_acknowledged: payload.compliance_acknowledged,
      compliance_status: payload.compliance_status,
      compliance_risk_level: payload.compliance_risk_level,
      automation_status: payload.automation_status,
      admin_review_required: payload.admin_review_required,
      admin_review_reason: payload.admin_review_reason,
      deadline: payload.deadline,
      local_contact_name: payload.local_contact_name,
      local_contact_phone: payload.local_contact_phone,
      contact_preference: payload.contact_preference,
      contact_window: payload.contact_window,
      supporting_links: payload.supporting_links,
      sensitive_documents_expected: payload.sensitive_documents_expected,
      preferred_currency: payload.preferred_currency,
      service_package: payload.service_package,
      payment_method_preference: payload.payment_method_preference,
      job_value_band: payload.job_value_band,
      funds_protection_preference: payload.funds_protection_preference,
      budget_range: payload.budget_range,
      proof_priority: payload.proof_priority,
      referral_source: payload.referral_source,
      task_type: payload.task_type,
      kenya_location: payload.kenya_location,
      urgency: payload.urgency,
      report_pack: payload.report_pack,
      hours_estimate: payload.hours_estimate,
      estimate_aud: payload.estimate_aud,
      notes: payload.notes,
      identity_verification_required: payload.identity_verification_required,
      verification_status: payload.verification_status,
      identity_verification_consent: payload.identity_verification_consent,
      contact_permission: payload.contact_permission,
      professional_boundary_accepted: payload.professional_boundary_accepted,
      terms_accepted_at: payload.terms_accepted_at,
      privacy_accepted_at: payload.privacy_accepted_at,
    };
  }

  function toPartnerDatabasePayload(payload) {
    return {
      id: payload.id,
      partner_code: payload.partner_code,
      full_name: payload.full_name,
      email: payload.email,
      whatsapp: payload.whatsapp,
      kenya_base: payload.kenya_base,
      service_regions: payload.service_regions,
      service_categories: payload.service_categories,
      coverage_scopes: payload.coverage_scopes,
      availability: payload.availability,
      transport_access: payload.transport_access,
      notes: payload.notes,
      id_verification_consent: payload.id_verification_consent,
      proof_standard_consent: payload.proof_standard_consent,
    };
  }

  function normalizePartnerApplication(payload) {
    const now = new Date().toISOString();
    return {
      id: createUuid(),
      partner_code: createPartnerCode(),
      full_name: "",
      email: "",
      whatsapp: "",
      kenya_base: "",
      service_regions: "",
      service_categories: [],
      coverage_scopes: [],
      availability: "flexible",
      transport_access: "mixed",
      status: "new",
      internal_notes: "",
      id_verification_consent: false,
      proof_standard_consent: false,
      identity_verification_provider: "smile_id",
      identity_verification_status: "not_started",
      identity_verification_link: "",
      identity_verification_reference: "",
      identity_verified_at: null,
      identity_verification_notes: "",
      provenance_score: 25,
      provenance_notes: "",
      provenance_reviewed_at: null,
      notes: "",
      created_at: now,
      updated_at: now,
      ...payload,
    };
  }

  function normalizeFieldUpdate(payload) {
    return {
      id: createUuid(),
      update_code: createFieldUpdateCode(),
      service_request_id: "",
      partner_application_id: "",
      field_status: "progress",
      update_text: "",
      proof_links: [],
      created_at: new Date().toISOString(),
      ...payload,
    };
  }

  function normalizeFundMilestone(payload) {
    const now = new Date().toISOString();
    return {
      id: createUuid(),
      milestone_code: createFundMilestoneCode(),
      service_request_id: "",
      title: "",
      amount: 0,
      currency: "AUD",
      release_status: "planned",
      release_trigger: "Admin verifies milestone proof before release.",
      due_at: null,
      released_amount: 0,
      released_at: null,
      provider: "manual",
      provider_reference: "",
      internal_notes: "",
      client_visible: true,
      created_at: now,
      updated_at: now,
      ...payload,
    };
  }

  function normalizeAccountProfile(payload) {
    const now = new Date().toISOString();
    return {
      user_id: payload.user_id,
      email: payload.email,
      account_role: payload.account_role || "client",
      full_name: payload.full_name || "",
      whatsapp: payload.whatsapp || "",
      country: payload.country || "",
      kenya_base: payload.kenya_base || "",
      preferred_currency: payload.preferred_currency || "AUD",
      profile_notes: payload.profile_notes || "",
      onboarding_status: payload.onboarding_status || "started",
      identity_verification_provider: payload.identity_verification_provider || "smile_id",
      identity_verification_status: payload.identity_verification_status || "not_started",
      identity_verification_link: payload.identity_verification_link || "",
      identity_verification_reference: payload.identity_verification_reference || "",
      identity_verified_at: payload.identity_verified_at || null,
      identity_verification_notes: payload.identity_verification_notes || "",
      created_at: payload.created_at || now,
      updated_at: now,
    };
  }

  function permissionDenied(error) {
    const message = String(error?.message || "").toLowerCase();
    return error?.code === "42501" || message.includes("permission denied") || message.includes("insufficient privilege");
  }

  function missingFunction(error) {
    const message = String(error?.message || "").toLowerCase();
    return (
      error?.code === "42883" ||
      message.includes("could not find the function") ||
      (message.includes("function") && message.includes("does not exist")) ||
      (message.includes("function") && message.includes("schema cache"))
    );
  }

  function missingColumn(error, columnName) {
    const message = String(error?.message || "").toLowerCase();
    const column = String(columnName || "").toLowerCase();
    return (
      error?.code === "42703" ||
      (column && message.includes(column) && (message.includes("column") || message.includes("schema cache")))
    );
  }

  function accountProfileStorageError(error) {
    if (permissionDenied(error)) {
      return new Error("Account profile storage is not fully activated yet. Your sign-in is working; Swadakta needs the database profile grant or RPC applied before this can save.");
    }

    return error;
  }

  function identityVerificationStorageError(error) {
    if (permissionDenied(error) || missingFunction(error)) {
      return new Error("Verification storage is not fully activated yet. Your account is open; Swadakta needs the identity verification RPC/grants applied before this request can save.");
    }

    return error;
  }

  function minimalAccountProfile(user, warning = "") {
    return {
      user_id: user?.id || "",
      email: user?.email || "",
      account_role: "client",
      full_name: "",
      whatsapp: "",
      country: "",
      kenya_base: "",
      preferred_currency: "AUD",
      profile_notes: "",
      onboarding_status: "started",
      identity_verification_provider: "sumsub",
      identity_verification_status: "not_started",
      identity_verification_link: "",
      identity_verification_reference: "",
      identity_verified_at: null,
      identity_verification_notes: warning,
      _load_warning: warning,
    };
  }

  function normalizeIdentityVerificationRequest(payload) {
    const now = new Date().toISOString();
    return {
      id: payload.id || createUuid(),
      request_code: payload.request_code || createIdentityVerificationCode(),
      user_id: payload.user_id || "local-user",
      email: payload.email || "demo@swadakta.local",
      account_role: payload.account_role || "client",
      provider: payload.provider || "smile_id",
      status: payload.status || "requested",
      reason: payload.reason || "account_required",
      country: payload.country || "",
      kenya_base: payload.kenya_base || "",
      whatsapp: payload.whatsapp || "",
      user_notes: payload.user_notes || "",
      admin_notes: payload.admin_notes || "",
      provider_link: payload.provider_link || "",
      provider_reference: payload.provider_reference || "",
      resolved_at: payload.resolved_at || null,
      created_at: payload.created_at || now,
      updated_at: now,
    };
  }

  function toAccountProfileDatabasePayload(profile) {
    return {
      user_id: profile.user_id,
      email: profile.email,
      account_role: profile.account_role,
      full_name: profile.full_name,
      whatsapp: profile.whatsapp,
      country: profile.country,
      kenya_base: profile.kenya_base,
      preferred_currency: profile.preferred_currency,
      identity_verification_provider: profile.identity_verification_provider,
      profile_notes: profile.profile_notes,
      onboarding_status: profile.onboarding_status,
    };
  }

  function cleanEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function paidPostingStatus(profile) {
    return String(profile?.identity_verification_status || "not_started").trim().toLowerCase();
  }

  async function assertPaidPostingAllowed(payload) {
    const supabase = await getSupabase();

    if (!supabase) {
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const signedInEmail = cleanEmail(sessionData.session?.user?.email);
    if (!signedInEmail) {
      throw new Error("Sign in before posting paid work. You can keep drafting, but paid jobs require an account.");
    }

    const requestEmail = cleanEmail(payload.email);
    if (requestEmail && requestEmail !== signedInEmail) {
      throw new Error("Use the email on your signed-in Swadakta account before posting paid work.");
    }

    const profileResult = await getAccountProfile();
    const profile = profileResult.data || {};
    if (paidPostingStatus(profile) !== "verified") {
      throw new Error(
        `Verify your identity before posting paid work. Current status: ${formatStatus(paidPostingStatus(profile))}.`,
      );
    }
  }

  async function createRequest(payload) {
    const normalized = normalizeRequest(payload);
    const supabase = await getSupabase();

    if (!supabase) {
      const requests = [normalized, ...readLocalRequests()];
      writeLocalRequests(requests);
      return { data: normalized, mode: "local" };
    }

    await assertPaidPostingAllowed(normalized);

    const { error } = await supabase.from("service_requests").insert(toDatabasePayload(normalized));

    if (error) {
      throw error;
    }

    return { data: normalized, mode: "supabase" };
  }

  async function listRequests() {
    const supabase = await getSupabase();

    if (!supabase) {
      return { data: readLocalRequests(), mode: "local" };
    }

    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  async function updateRequest(id, updates) {
    const updatePayload = {
      status: updates.status,
      payment_status: updates.payment_status,
      assigned_to: updates.assigned_to,
      assigned_partner_id: updates.assigned_partner_id || null,
      operator_notes: updates.operator_notes,
      client_report: updates.client_report,
      quote_amount: updates.quote_amount,
      quote_currency: updates.quote_currency,
      payment_link: updates.payment_link,
      payment_due_at: updates.payment_due_at,
      funds_status: updates.funds_status,
      protected_amount: updates.protected_amount,
      release_condition: updates.release_condition,
      payment_reference: updates.payment_reference,
      release_notes: updates.release_notes,
      identity_verification_required: updates.identity_verification_required,
      verification_status: updates.verification_status,
      verification_reason: updates.verification_reason,
      verified_at: updates.verified_at,
      origin_country: updates.origin_country,
      destination_country: updates.destination_country,
      service_direction: updates.service_direction,
      task_location: updates.task_location || updates.kenya_location,
      logistics_mode: updates.logistics_mode,
      goods_category: updates.goods_category,
      logistics_notes: updates.logistics_notes,
      route_status: updates.route_status,
      compliance_flags: updates.compliance_flags,
      required_checks: updates.required_checks,
      proof_requirements: updates.proof_requirements,
      compliance_acknowledged: updates.compliance_acknowledged,
      compliance_status: updates.compliance_status,
      compliance_risk_level: updates.compliance_risk_level,
      automation_status: updates.automation_status,
      admin_review_required: updates.admin_review_required,
      admin_review_reason: updates.admin_review_reason,
      service_package: updates.service_package,
      job_value_band: updates.job_value_band,
      funds_protection_preference: updates.funds_protection_preference,
      operator_payout: updates.operator_payout,
      field_costs: updates.field_costs,
      payment_processing_fee: updates.payment_processing_fee,
      client_report_url: updates.client_report_url,
      proof_links: updates.proof_links,
    };
    const supabase = await getSupabase();

    if (!supabase) {
      const requests = readLocalRequests().map((request) =>
        request.id === id ? { ...request, ...updatePayload, updated_at: new Date().toISOString() } : request,
      );
      writeLocalRequests(requests);
      return { data: requests.find((request) => request.id === id), mode: "local" };
    }

    const { data, error } = await supabase
      .from("service_requests")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  async function createPartnerApplication(payload) {
    const normalized = normalizePartnerApplication(payload);
    const supabase = await getSupabase();

    if (!supabase) {
      const applications = [normalized, ...readLocalPartnerApplications()];
      writeLocalPartnerApplications(applications);
      return { data: normalized, mode: "local" };
    }

    let { error } = await supabase.from("partner_applications").insert(toPartnerDatabasePayload(normalized));

    if (error && missingColumn(error, "coverage_scopes")) {
      const legacyPayload = toPartnerDatabasePayload(normalized);
      delete legacyPayload.coverage_scopes;
      const legacyResult = await supabase.from("partner_applications").insert(legacyPayload);
      error = legacyResult.error;
    }

    if (error) {
      throw error;
    }

    return { data: normalized, mode: "supabase" };
  }

  async function listPartnerApplications() {
    const supabase = await getSupabase();

    if (!supabase) {
      return { data: readLocalPartnerApplications(), mode: "local" };
    }

    const { data, error } = await supabase
      .from("partner_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  async function listFieldUpdates() {
    const supabase = await getSupabase();

    if (!supabase) {
      return { data: readLocalFieldUpdates(), mode: "local" };
    }

    const { data, error } = await supabase
      .from("field_updates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  async function listFundMilestones() {
    const supabase = await getSupabase();

    if (!supabase) {
      return { data: readLocalFundMilestones(), mode: "local" };
    }

    const { data, error } = await supabase
      .from("fund_milestones")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  async function createFundMilestone(payload) {
    const normalized = normalizeFundMilestone(payload);
    const supabase = await getSupabase();

    if (!supabase) {
      const milestones = [...readLocalFundMilestones(), normalized];
      writeLocalFundMilestones(milestones);
      return { data: normalized, mode: "local" };
    }

    const { data, error } = await supabase
      .from("fund_milestones")
      .insert(normalized)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  async function updateFundMilestone(id, updates) {
    const updatePayload = {
      title: updates.title,
      amount: updates.amount,
      currency: updates.currency,
      release_status: updates.release_status,
      release_trigger: updates.release_trigger,
      due_at: updates.due_at,
      released_amount: updates.released_amount,
      released_at: updates.released_at,
      provider: updates.provider,
      provider_reference: updates.provider_reference,
      internal_notes: updates.internal_notes,
      client_visible: updates.client_visible,
    };
    const supabase = await getSupabase();

    if (!supabase) {
      const milestones = readLocalFundMilestones().map((milestone) =>
        milestone.id === id ? { ...milestone, ...updatePayload, updated_at: new Date().toISOString() } : milestone,
      );
      writeLocalFundMilestones(milestones);
      return { data: milestones.find((milestone) => milestone.id === id), mode: "local" };
    }

    const { data, error } = await supabase
      .from("fund_milestones")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  async function updatePartnerApplication(id, updates) {
    const updatePayload = {
      status: updates.status,
      internal_notes: updates.internal_notes,
      identity_verification_provider: updates.identity_verification_provider,
      identity_verification_status: updates.identity_verification_status,
      identity_verification_link: updates.identity_verification_link,
      identity_verification_reference: updates.identity_verification_reference,
      identity_verified_at: updates.identity_verified_at || null,
      identity_verification_notes: updates.identity_verification_notes,
      provenance_score: updates.provenance_score,
      provenance_notes: updates.provenance_notes,
      provenance_reviewed_at: updates.provenance_reviewed_at || null,
    };
    const supabase = await getSupabase();

    if (!supabase) {
      const applications = readLocalPartnerApplications().map((application) =>
        application.id === id ? { ...application, ...updatePayload, updated_at: new Date().toISOString() } : application,
      );
      writeLocalPartnerApplications(applications);
      return { data: applications.find((application) => application.id === id), mode: "local" };
    }

    const { data, error } = await supabase
      .from("partner_applications")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  function contactMatches(request, contact) {
    const normalizedContact = String(contact || "").trim().toLowerCase();
    const contactDigits = normalizedContact.replace(/\D/g, "");
    const email = String(request.email || "").trim().toLowerCase();
    const whatsappDigits = String(request.whatsapp || "").replace(/\D/g, "");

    return Boolean(
      normalizedContact &&
        ((email && email === normalizedContact) || (contactDigits && whatsappDigits && contactDigits === whatsappDigits)),
    );
  }

  function publicTrackingPayload(request) {
    if (!request) {
      return null;
    }

    const milestones = readLocalFundMilestones()
      .filter((milestone) => milestone.service_request_id === request.id && milestone.client_visible !== false)
      .map((milestone) => ({
        milestone_code: milestone.milestone_code,
        title: milestone.title,
        amount: milestone.amount,
        currency: milestone.currency,
        release_status: milestone.release_status,
        release_trigger: milestone.release_trigger,
        due_at: milestone.due_at,
        released_amount: milestone.released_amount,
        released_at: milestone.released_at,
      }));

    return {
      request_code: request.request_code,
      origin_country: request.origin_country,
      destination_country: request.destination_country,
      service_direction: request.service_direction,
      task_location: request.task_location || request.kenya_location,
      logistics_mode: request.logistics_mode,
      goods_category: request.goods_category,
      route_status: request.route_status,
      compliance_flags: request.compliance_flags || [],
      required_checks: request.required_checks || [],
      proof_requirements: request.proof_requirements || [],
      compliance_status: request.compliance_status,
      compliance_risk_level: request.compliance_risk_level,
      automation_status: request.automation_status,
      service_package: request.service_package,
      kenya_location: request.kenya_location,
      status: request.status,
      payment_status: request.payment_status,
      quote_amount: request.quote_amount,
      quote_currency: request.quote_currency,
      funds_status: request.funds_status || "not_collected",
      protected_amount: request.protected_amount || 0,
      release_condition: request.release_condition || "",
      identity_verification_required: Boolean(request.identity_verification_required),
      verification_status: request.verification_status || "not_required",
      payment_link: request.payment_link,
      client_report: request.client_report,
      client_report_url: request.client_report_url,
      proof_links: request.proof_links || [],
      client_review_score: request.client_review_score || null,
      client_review_note: request.client_review_note || "",
      client_reviewed_at: request.client_reviewed_at || null,
      milestones,
      updated_at: request.updated_at,
    };
  }

  async function trackRequest(code, contact) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    const supabase = await getSupabase();

    if (!supabase) {
      const request = readLocalRequests().find(
        (item) => String(item.request_code || "").toUpperCase() === normalizedCode && contactMatches(item, contact),
      );
      return { data: publicTrackingPayload(request), mode: "local" };
    }

    const { data, error } = await supabase.rpc("track_service_request", {
      lookup_code: normalizedCode,
      lookup_contact: contact,
    });

    if (error) {
      throw error;
    }

    return { data: Array.isArray(data) ? data[0] || null : data, mode: "supabase" };
  }

  async function submitServiceReview(code, contact, score, note) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    const normalizedScore = Number(score);

    if (!Number.isInteger(normalizedScore) || normalizedScore < 1 || normalizedScore > 5) {
      throw new Error("Choose a review score from 1 to 5.");
    }

    const supabase = await getSupabase();

    if (!supabase) {
      let reviewedRequest = null;
      const requests = readLocalRequests().map((request) => {
        if (String(request.request_code || "").toUpperCase() !== normalizedCode || !contactMatches(request, contact)) {
          return request;
        }

        if (request.status !== "completed") {
          throw new Error("Reviews open after the job is completed.");
        }

        reviewedRequest = {
          ...request,
          client_review_score: normalizedScore,
          client_review_note: String(note || "").trim().slice(0, 1200),
          client_reviewed_at: new Date().toISOString(),
        };
        return reviewedRequest;
      });

      if (!reviewedRequest) {
        throw new Error("No matching request found.");
      }

      writeLocalRequests(requests);
      return {
        data: {
          request_code: reviewedRequest.request_code,
          client_review_score: reviewedRequest.client_review_score,
          client_review_note: reviewedRequest.client_review_note,
          client_reviewed_at: reviewedRequest.client_reviewed_at,
        },
        mode: "local",
      };
    }

    const { data, error } = await supabase.rpc("submit_service_review", {
      lookup_code: normalizedCode,
      lookup_contact: contact,
      input_score: normalizedScore,
      input_note: String(note || "").trim().slice(0, 1200),
    });

    if (error) {
      throw error;
    }

    return { data: Array.isArray(data) ? data[0] || null : data, mode: "supabase" };
  }

  function resolutionFounderRequired(issueType, desiredOutcome, severity, paymentAction) {
    const cleanIssue = String(issueType || "").toLowerCase();
    const cleanOutcome = String(desiredOutcome || "").toLowerCase();
    const cleanSeverity = String(severity || "").toLowerCase();
    const cleanPaymentAction = String(paymentAction || "none").toLowerCase();

    return (
      ["safety", "legal", "payment"].includes(cleanSeverity) ||
      ["payment_refund", "payment_dispute", "receiver_safety", "restricted_item"].includes(cleanIssue) ||
      ["partial_refund", "full_refund", "release_milestone", "replace_receiver", "legal_compliance_review"].includes(
        cleanOutcome,
      ) ||
      cleanPaymentAction !== "none"
    );
  }

  function resolutionAiTriage(issueType, desiredOutcome, severity, founderRequired) {
    const cleanIssue = String(issueType || "other").toLowerCase();
    const cleanOutcome = String(desiredOutcome || "explain_status").toLowerCase();
    const cleanSeverity = String(severity || "normal").toLowerCase();

    const opening =
      cleanSeverity === "safety"
        ? "Safety issue: pause risky activity, preserve proof, and request founder review."
        : cleanSeverity === "legal"
          ? "Legal/compliance issue: pause quoting, buying, shipping, or release until human review."
          : cleanSeverity === "payment"
            ? "Payment issue: freeze milestone release until provider evidence is checked."
            : "Routine issue: ask for missing proof, timeline, and preferred outcome before escalation.";

    const evidence =
      cleanIssue === "proof_missing" || cleanIssue === "poor_quality"
        ? "Ask both sides for dated photos, receipts, location notes, or provider records."
        : cleanIssue === "payment_refund" || cleanIssue === "payment_dispute"
          ? "Collect provider reference, amount, payment rail, and exact disputed milestone."
          : cleanIssue === "restricted_item"
            ? "Check item legality and courier/postal acceptance before any movement."
            : cleanIssue === "delay"
              ? "Request the blocker, next checkpoint, and revised ETA."
              : "Summarize facts, evidence gaps, and the next safe message.";

    const boundary = founderRequired
      ? "Protected decision: AI may draft and summarize, but cannot refund, release money, mark payment paid, replace a receiver, approve ID, or clear legal/import risk."
      : "AI may draft the next message and checklist; admin review is only needed if evidence or risk changes.";

    return `${opening} ${evidence} ${boundary} Requested outcome: ${cleanOutcome.replaceAll("_", " ")}.`;
  }

  function cleanResolutionChoice(value, allowed, fallback) {
    const clean = String(value || fallback).trim().toLowerCase();
    return allowed.includes(clean) ? clean : fallback;
  }

  function normalizeResolutionEvidenceLinks(value) {
    const links = Array.isArray(value)
      ? value
      : String(value || "")
          .split(/[\n,]+/)
          .map((line) => line.trim());

    return links
      .map((link) => String(link || "").trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  function normalizeResolutionCase(payload = {}) {
    const now = new Date().toISOString();
    const issueType = cleanResolutionChoice(
      payload.issue_type,
      [
        "proof_missing",
        "poor_quality",
        "delay",
        "payment_refund",
        "payment_dispute",
        "receiver_safety",
        "restricted_item",
        "wrong_item",
        "communication",
        "other",
      ],
      "other",
    );
    const desiredOutcome = cleanResolutionChoice(
      payload.desired_outcome,
      [
        "explain_status",
        "pause_job",
        "redo_work",
        "partial_refund",
        "full_refund",
        "release_milestone",
        "replace_receiver",
        "legal_compliance_review",
        "other",
      ],
      "explain_status",
    );
    const severity = cleanResolutionChoice(payload.severity, ["normal", "urgent", "safety", "legal", "payment"], "normal");
    const paymentAction = cleanResolutionChoice(
      payload.payment_action_requested,
      [
        "none",
        "pause_release",
        "partial_refund",
        "full_refund",
        "provider_dispute",
        "mpesa_reversal",
        "chargeback_evidence",
      ],
      "none",
    );
    const founderRequired =
      typeof payload.founder_review_required === "boolean"
        ? payload.founder_review_required
        : resolutionFounderRequired(issueType, desiredOutcome, severity, paymentAction);
    const amount = Number(payload.amount_in_dispute);

    return {
      id: payload.id || createUuid(),
      resolution_code: payload.resolution_code || createResolutionCode(),
      service_request_id: payload.service_request_id || null,
      request_code: String(payload.request_code || "").trim().toUpperCase(),
      reporter_role: cleanResolutionChoice(payload.reporter_role, ["client", "receiver", "local_contact", "admin", "other"], "client"),
      reporter_name: String(payload.reporter_name || "").trim().slice(0, 180),
      reporter_contact: String(payload.reporter_contact || "").trim().slice(0, 220),
      issue_type: issueType,
      desired_outcome: desiredOutcome,
      severity,
      status: cleanResolutionChoice(
        payload.status,
        ["ai_triage", "needs_evidence", "founder_review", "waiting_party", "provider_review", "resolved", "closed"],
        founderRequired ? "founder_review" : "ai_triage",
      ),
      payment_action_requested: paymentAction,
      provider_reference: String(payload.provider_reference || "").trim().slice(0, 240),
      amount_in_dispute: Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null,
      evidence_links: normalizeResolutionEvidenceLinks(payload.evidence_links),
      summary: String(payload.summary || "").trim().slice(0, 2400),
      ai_triage:
        payload.ai_triage ||
        resolutionAiTriage(issueType, desiredOutcome, severity, founderRequired),
      founder_review_required: founderRequired,
      admin_notes: String(payload.admin_notes || "").trim().slice(0, 2400),
      resolved_at: payload.resolved_at || null,
      created_at: payload.created_at || now,
      updated_at: payload.updated_at || now,
    };
  }

  function validateResolutionSummary(casePayload) {
    if (!casePayload.summary) {
      throw new Error("Describe the issue before opening a resolution case.");
    }

    const invalidLink = casePayload.evidence_links.find((link) => !/^https?:\/\//i.test(link));
    if (invalidLink) {
      throw new Error("Evidence links must start with http:// or https://.");
    }
  }

  async function createResolutionCase(code, contact, payload = {}) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    const normalizedContact = String(contact || "").trim();
    const supabase = await getSupabase();

    const cleanPayload = normalizeResolutionCase({
      ...payload,
      request_code: normalizedCode,
      reporter_contact: normalizedContact,
    });
    validateResolutionSummary(cleanPayload);

    if (!supabase) {
      const request = readLocalRequests().find(
        (item) => String(item.request_code || "").toUpperCase() === normalizedCode && contactMatches(item, normalizedContact),
      );
      if (!request) {
        throw new Error("No matching request found.");
      }

      const localCase = normalizeResolutionCase({
        ...cleanPayload,
        service_request_id: request.id,
        request_code: request.request_code,
      });
      writeLocalResolutionCases([localCase, ...readLocalResolutionCases()]);
      return { data: localCase, mode: "local" };
    }

    const { data, error } = await supabase.rpc("create_resolution_case", {
      lookup_code: normalizedCode,
      lookup_contact: normalizedContact,
      input_reporter_role: cleanPayload.reporter_role,
      input_reporter_name: cleanPayload.reporter_name,
      input_issue_type: cleanPayload.issue_type,
      input_desired_outcome: cleanPayload.desired_outcome,
      input_severity: cleanPayload.severity,
      input_summary: cleanPayload.summary,
      input_evidence_links: cleanPayload.evidence_links,
      input_provider_reference: cleanPayload.provider_reference,
      input_amount_in_dispute: cleanPayload.amount_in_dispute,
      input_payment_action_requested: cleanPayload.payment_action_requested,
    });

    if (error) {
      throw error;
    }

    return { data: Array.isArray(data) ? data[0] || null : data, mode: "supabase" };
  }

  async function listRequestResolutionCases(code, contact) {
    const normalizedCode = String(code || "").trim().toUpperCase();
    const normalizedContact = String(contact || "").trim();
    const supabase = await getSupabase();

    if (!supabase) {
      const request = readLocalRequests().find(
        (item) => String(item.request_code || "").toUpperCase() === normalizedCode && contactMatches(item, normalizedContact),
      );
      if (!request) {
        throw new Error("No matching request found.");
      }

      return {
        data: readLocalResolutionCases()
          .filter(
            (item) =>
              item.service_request_id === request.id ||
              String(item.request_code || "").toUpperCase() === normalizedCode,
          )
          .sort((first, second) => new Date(second.updated_at || second.created_at) - new Date(first.updated_at || first.created_at)),
        mode: "local",
      };
    }

    const { data, error } = await supabase.rpc("list_request_resolution_cases", {
      lookup_code: normalizedCode,
      lookup_contact: normalizedContact,
    });

    if (error) {
      throw error;
    }

    return { data: data || [], mode: "supabase" };
  }

  async function listResolutionCases() {
    const supabase = await getSupabase();

    if (!supabase) {
      return {
        data: readLocalResolutionCases().sort(
          (first, second) => new Date(second.updated_at || second.created_at) - new Date(first.updated_at || first.created_at),
        ),
        mode: "local",
      };
    }

    const { data, error } = await supabase.rpc("list_resolution_cases");

    if (error) {
      throw error;
    }

    return { data: data || [], mode: "supabase" };
  }

  async function updateResolutionCase(resolutionCode, updates = {}) {
    const normalizedCode = String(resolutionCode || "").trim().toUpperCase();
    const status = cleanResolutionChoice(
      updates.status,
      ["ai_triage", "needs_evidence", "founder_review", "waiting_party", "provider_review", "resolved", "closed"],
      "ai_triage",
    );
    const adminNotes = String(updates.admin_notes || "").trim().slice(0, 2400);
    const supabase = await getSupabase();

    if (!supabase) {
      let updatedCase = null;
      const cases = readLocalResolutionCases().map((item) => {
        if (String(item.resolution_code || "").toUpperCase() !== normalizedCode) {
          return item;
        }

        updatedCase = normalizeResolutionCase({
          ...item,
          status,
          admin_notes: adminNotes,
          resolved_at: ["resolved", "closed"].includes(status) ? item.resolved_at || new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        });
        return updatedCase;
      });

      if (!updatedCase) {
        throw new Error("No matching resolution case found.");
      }

      writeLocalResolutionCases(cases);
      return { data: updatedCase, mode: "local" };
    }

    const { data, error } = await supabase.rpc("update_resolution_case", {
      input_resolution_code: normalizedCode,
      input_status: status,
      input_admin_notes: adminNotes,
    });

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  async function listMyRequests() {
    const supabase = await getSupabase();

    if (!supabase) {
      return { data: readLocalRequests().map(publicTrackingPayload), mode: "local" };
    }

    const { data, error } = await supabase.rpc("list_my_service_requests");

    if (error) {
      throw error;
    }

    return { data: data || [], mode: "supabase" };
  }

  async function listMyPartnerApplications() {
    const supabase = await getSupabase();

    if (!supabase) {
      return { data: readLocalPartnerApplications(), mode: "local" };
    }

    const { data, error } = await supabase.rpc("list_my_partner_applications");

    if (error) {
      throw error;
    }

    return { data: data || [], mode: "supabase" };
  }

  async function listMyAssignedJobs() {
    const supabase = await getSupabase();

    if (!supabase) {
      const partnerEmails = new Set(
        readLocalPartnerApplications()
          .filter((application) => application.status === "vetted")
          .map((application) => String(application.email || "").trim().toLowerCase())
          .filter(Boolean),
      );

      const jobs = readLocalRequests().filter((request) => {
        const assignedPartner = readLocalPartnerApplications().find(
          (application) => application.id === request.assigned_partner_id,
        );
        return assignedPartner && partnerEmails.has(String(assignedPartner.email || "").trim().toLowerCase());
      });

      return { data: jobs, mode: "local" };
    }

    const { data, error } = await supabase.rpc("list_my_assigned_jobs");

    if (error) {
      throw error;
    }

    return { data: data || [], mode: "supabase" };
  }

  async function submitAssignedJobUpdate(requestCode, payload) {
    const cleanPayload = {
      field_status: payload.field_status,
      update_text: String(payload.update_text || "").trim(),
      proof_links: Array.isArray(payload.proof_links) ? payload.proof_links : [],
    };
    const supabase = await getSupabase();

    if (!supabase) {
      const normalizedCode = String(requestCode || "").trim().toUpperCase();
      const request = readLocalRequests().find(
        (item) => String(item.request_code || "").toUpperCase() === normalizedCode,
      );
      const partner = request
        ? readLocalPartnerApplications().find((application) => application.id === request.assigned_partner_id)
        : null;

      if (!request || !partner || partner.status !== "vetted") {
        throw new Error("Assigned job not found or not available for receiver update.");
      }

      if (!cleanPayload.update_text) {
        throw new Error("Field update text is required.");
      }

      const update = normalizeFieldUpdate({
        service_request_id: request.id,
        partner_application_id: partner.id,
        field_status: cleanPayload.field_status || "progress",
        update_text: cleanPayload.update_text,
        proof_links: cleanPayload.proof_links,
        request_code: request.request_code,
      });
      writeLocalFieldUpdates([update, ...readLocalFieldUpdates()]);

      return {
        data: {
          update_code: update.update_code,
          request_code: request.request_code,
          field_status: update.field_status,
          created_at: update.created_at,
        },
        mode: "local",
      };
    }

    const { data, error } = await supabase.rpc("submit_assigned_job_update", {
      input_request_code: String(requestCode || "").trim().toUpperCase(),
      input_field_status: cleanPayload.field_status,
      input_update_text: cleanPayload.update_text,
      input_proof_links: cleanPayload.proof_links,
    });

    if (error) {
      throw error;
    }

    return { data: Array.isArray(data) ? data[0] || null : data, mode: "supabase" };
  }

  async function uploadProofFiles(requestCode, files = []) {
    const uploadFiles = Array.from(files || []).filter(Boolean);

    if (!uploadFiles.length) {
      return { data: [], mode: "none" };
    }

    const supabase = await getSupabase();
    if (!supabase) {
      throw new Error("Proof file upload requires the live Supabase-backed site. Add proof links in demo mode.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const user = sessionData.session?.user;
    if (!user?.id) {
      throw new Error("Sign in before uploading proof files.");
    }

    const oversized = uploadFiles.find((file) => file.size > MAX_STANDARD_UPLOAD_BYTES);
    if (oversized) {
      throw new Error(`${oversized.name} is larger than 6MB. Compress it or use a Drive/Dropbox link for now.`);
    }

    const normalizedCode = safeStorageSegment(requestCode || "request", "request");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const uploads = [];

    for (const file of uploadFiles) {
      const name = safeStorageSegment(file.name, "proof-file");
      const path = `${user.id}/${normalizedCode}/${timestamp}-${crypto.randomUUID()}-${name}`;
      const { data, error } = await supabase.storage.from(PROOF_BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

      if (error) {
        throw error;
      }

      const signed = await supabase.storage.from(PROOF_BUCKET).createSignedUrl(data.path, 60 * 60 * 24 * 7);
      if (signed.error) {
        throw signed.error;
      }

      uploads.push({
        name: file.name,
        kind: proofFileKind(file),
        path: data.path,
        signed_url: signed.data?.signedUrl || "",
        size: file.size,
      });
    }

    return { data: uploads, mode: "supabase" };
  }

  async function uploadAccountMedia(purpose, file) {
    if (!file) {
      return { data: null, mode: "none" };
    }

    const supabase = await getSupabase();
    if (!supabase) {
      throw new Error("Profile media upload requires the live Supabase-backed site. The preview can stay local for now.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const user = sessionData.session?.user;
    if (!user?.id) {
      throw new Error("Sign in before uploading account media.");
    }

    if (file.size > MAX_STANDARD_UPLOAD_BYTES) {
      throw new Error(`${file.name} is larger than 6MB. Compress it before uploading as profile media.`);
    }

    const kind = proofFileKind(file);
    if (kind === "file") {
      throw new Error("Profile media must be an image, video, or PDF.");
    }

    const safePurpose = safeStorageSegment(purpose || "profile-media", "profile-media");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const name = safeStorageSegment(file.name, "profile-media");
    const path = `${user.id}/account-profile/${safePurpose}/${timestamp}-${crypto.randomUUID()}-${name}`;
    const { data, error } = await supabase.storage.from(PROOF_BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      throw error;
    }

    const signed = await supabase.storage.from(PROOF_BUCKET).createSignedUrl(data.path, 60 * 60 * 24 * 7);
    if (signed.error) {
      throw signed.error;
    }

    return {
      data: {
        name: file.name,
        kind,
        path: data.path,
        signed_url: signed.data?.signedUrl || "",
        size: file.size,
        content_type: file.type || "application/octet-stream",
        uploaded_at: new Date().toISOString(),
      },
      mode: "supabase",
    };
  }

  async function getAccountProfile() {
    const supabase = await getSupabase();

    if (!supabase) {
      return { data: readLocalAccountProfile(), mode: "local" };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const user = sessionData.session?.user;
    if (!user) {
      return { data: null, mode: "supabase" };
    }

    const profileRpc = await supabase.rpc("get_my_account_profile");
    if (!profileRpc.error) {
      return { data: profileRpc.data || null, mode: "supabase" };
    }

    if (!missingFunction(profileRpc.error) && !permissionDenied(profileRpc.error)) {
      throw profileRpc.error;
    }

    const { data, error, status } = await supabase
      .from("account_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error && permissionDenied(error)) {
      return {
        data: minimalAccountProfile(
          user,
          "Profile storage is reachable only after the account_profiles grant or get_my_account_profile RPC is applied.",
        ),
        mode: "supabase",
        warning: error.message,
      };
    }

    if (error && status !== 406) {
      throw error;
    }

    return { data: data || null, mode: "supabase" };
  }

  async function saveAccountProfile(payload) {
    const supabase = await getSupabase();

    if (!supabase) {
      const current = readLocalAccountProfile() || {};
      const profile = normalizeAccountProfile({
        ...current,
        ...payload,
        user_id: current.user_id || "local-user",
        email: current.email || payload.email || "demo@swadakta.local",
      });
      writeLocalAccountProfile(profile);
      return { data: profile, mode: "local" };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const user = sessionData.session?.user;
    if (!user?.id || !user.email) {
      throw new Error("Sign in before saving your account profile.");
    }

    const profile = normalizeAccountProfile({
      ...payload,
      user_id: user.id,
      email: user.email,
      onboarding_status: payload.onboarding_status || "profile_complete",
    });

    const { data, error } = await supabase.rpc("save_account_profile", {
      input_account_role: profile.account_role,
      input_full_name: profile.full_name,
      input_whatsapp: profile.whatsapp,
      input_country: profile.country,
      input_kenya_base: profile.kenya_base,
      input_preferred_currency: profile.preferred_currency,
      input_profile_notes: profile.profile_notes,
      input_provider: profile.identity_verification_provider,
      input_onboarding_status: profile.onboarding_status,
    });

    if (error && missingFunction(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("account_profiles")
        .upsert(toAccountProfileDatabasePayload(profile), { onConflict: "user_id" })
        .select("*")
        .maybeSingle();

      if (fallbackError) {
        throw accountProfileStorageError(fallbackError);
      }

      return { data: fallbackData || profile, mode: "supabase" };
    }

    if (error) {
      throw accountProfileStorageError(error);
    }

    return { data, mode: "supabase" };
  }

  async function listAccountProfiles() {
    const supabase = await getSupabase();

    if (!supabase) {
      const profile = readLocalAccountProfile();
      return { data: profile ? [profile] : [], mode: "local" };
    }

    const { data, error } = await supabase
      .from("account_profiles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw accountProfileStorageError(error);
    }

    return { data: data || [], mode: "supabase" };
  }

  async function updateAccountIdentityVerification(userId, updates) {
    const supabase = await getSupabase();
    const payload = {
      identity_verification_provider: updates.identity_verification_provider,
      identity_verification_status: updates.identity_verification_status,
      identity_verification_link: updates.identity_verification_link,
      identity_verification_reference: updates.identity_verification_reference,
      identity_verified_at: updates.identity_verified_at || null,
      identity_verification_notes: updates.identity_verification_notes,
    };

    if (!supabase) {
      const current = readLocalAccountProfile();
      if (!current || current.user_id !== userId) {
        throw new Error("Account profile not found.");
      }
      const profile = normalizeAccountProfile({ ...current, ...payload });
      writeLocalAccountProfile(profile);
      return { data: profile, mode: "local" };
    }

    const { data, error } = await supabase.rpc("update_account_identity_verification", {
      input_user_id: userId,
      input_provider: payload.identity_verification_provider,
      input_status: payload.identity_verification_status,
      input_link: payload.identity_verification_link,
      input_reference: payload.identity_verification_reference,
      input_verified_at: payload.identity_verified_at,
      input_notes: payload.identity_verification_notes,
    });

    if (error) {
      throw accountProfileStorageError(error);
    }

    return { data, mode: "supabase" };
  }

  async function requestAccountIdentityVerification(payload = {}) {
    const provider = ["smile_id", "sumsub", "youverify"].includes(payload.provider)
      ? payload.provider
      : "sumsub";
    const cleanPayload = {
      reason: payload.reason || "account_required",
      user_notes: String(payload.user_notes || "").trim().slice(0, 1200),
      provider,
    };
    const supabase = await getSupabase();

    if (!supabase) {
      const current = readLocalAccountProfile() || {
        user_id: "local-user",
        email: "demo@swadakta.local",
        account_role: "client",
      };
      const profile = normalizeAccountProfile({
        ...current,
        identity_verification_provider: cleanPayload.provider,
        identity_verification_status:
          current.identity_verification_status === "verified"
            ? "verified"
            : "submitted",
        identity_verification_notes: "User requested automated identity verification.",
      });
      const requests = readLocalIdentityVerificationRequests();
      const openRequest = requests.find(
        (request) =>
          request.user_id === profile.user_id &&
          ["requested", "link_sent", "submitted", "manual_review"].includes(request.status),
      );
      const normalized = normalizeIdentityVerificationRequest({
        ...(openRequest || {}),
        user_id: profile.user_id,
        email: profile.email,
        account_role: profile.account_role,
        provider: cleanPayload.provider,
        status: openRequest?.status || "requested",
        reason: cleanPayload.reason,
        country: profile.country,
        kenya_base: profile.kenya_base,
        whatsapp: profile.whatsapp,
        user_notes: cleanPayload.user_notes,
      });
      const nextRequests = openRequest
        ? requests.map((request) => (request.id === openRequest.id ? normalized : request))
        : [normalized, ...requests];

      writeLocalAccountProfile(profile);
      writeLocalIdentityVerificationRequests(nextRequests);
      return { data: normalized, mode: "local" };
    }

    const { data, error } = await supabase.rpc("request_account_identity_verification", {
      input_reason: cleanPayload.reason,
      input_user_notes: cleanPayload.user_notes,
      input_provider: cleanPayload.provider,
    });

    if (error) {
      throw identityVerificationStorageError(error);
    }

    return { data, mode: "supabase" };
  }

  async function listMyIdentityVerificationRequests() {
    const supabase = await getSupabase();

    if (!supabase) {
      const profile = readLocalAccountProfile();
      const userId = profile?.user_id || "local-user";
      return {
        data: readLocalIdentityVerificationRequests()
          .filter((request) => request.user_id === userId)
          .sort((first, second) => new Date(second.updated_at) - new Date(first.updated_at)),
        mode: "local",
      };
    }

    const { data, error } = await supabase.rpc("list_my_identity_verification_requests");

    if (error && (permissionDenied(error) || missingFunction(error))) {
      return { data: [], mode: "supabase", warning: error.message };
    }

    if (error) {
      throw error;
    }

    return { data: data || [], mode: "supabase" };
  }

  async function listIdentityVerificationRequests() {
    const supabase = await getSupabase();

    if (!supabase) {
      return {
        data: readLocalIdentityVerificationRequests().sort(
          (first, second) => new Date(second.updated_at) - new Date(first.updated_at),
        ),
        mode: "local",
      };
    }

    const { data, error } = await supabase.rpc("list_identity_verification_requests");

    if (error) {
      throw error;
    }

    return { data: data || [], mode: "supabase" };
  }

  async function updateIdentityVerificationRequest(id, updates = {}) {
    const supabase = await getSupabase();
    const payload = {
      status: updates.status || "requested",
      provider: updates.provider || "smile_id",
      provider_link: updates.provider_link || "",
      provider_reference: updates.provider_reference || "",
      admin_notes: String(updates.admin_notes || "").trim().slice(0, 1200),
    };

    if (!supabase) {
      let updated = null;
      const requests = readLocalIdentityVerificationRequests().map((request) => {
        if (request.id !== id) {
          return request;
        }

        updated = normalizeIdentityVerificationRequest({
          ...request,
          ...payload,
          resolved_at: ["verified", "failed", "expired", "cancelled"].includes(payload.status)
            ? request.resolved_at || new Date().toISOString()
            : null,
        });
        return updated;
      });

      if (!updated) {
        throw new Error("Identity verification request not found.");
      }

      const current = readLocalAccountProfile();
      if (current && current.user_id === updated.user_id) {
        writeLocalAccountProfile(
          normalizeAccountProfile({
            ...current,
            identity_verification_provider: payload.provider,
            identity_verification_status:
              payload.status === "requested"
                ? "manual_review"
                : payload.status === "cancelled"
                  ? "not_started"
                  : payload.status,
            identity_verification_link: payload.provider_link,
            identity_verification_reference: payload.provider_reference,
            identity_verified_at:
              payload.status === "verified"
                ? current.identity_verified_at || new Date().toISOString()
                : null,
            identity_verification_notes: payload.admin_notes,
          }),
        );
      }

      writeLocalIdentityVerificationRequests(requests);
      return { data: updated, mode: "local" };
    }

    const { data, error } = await supabase.rpc("update_identity_verification_request", {
      input_id: id,
      input_status: payload.status,
      input_provider: payload.provider,
      input_link: payload.provider_link,
      input_reference: payload.provider_reference,
      input_admin_notes: payload.admin_notes,
    });

    if (error) {
      throw error;
    }

    return { data, mode: "supabase" };
  }

  async function assist(payload) {
    const supabase = await getSupabase();

    if (!supabase) {
      return {
        data: {
          output:
            "Swadakta AI is available after signing in on the live Supabase-backed app. Use the action queue draft as the safe manual fallback for now.",
          guardrails: ["local_demo_only", "no_external_actions"],
        },
        mode: "local",
      };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("Sign in before using Swadakta AI.");
    }

    const { data, error } = await supabase.functions.invoke("swadakta-assistant", {
      body: payload,
    });

    if (!error) {
      return { data, mode: "supabase" };
    }

    const response = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const fallbackData = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(fallbackData.error || error.message || "AI assistant unavailable.");
    }

    return { data: fallbackData, mode: "vercel" };
  }

  async function getOperationsReadiness() {
    const supabase = await getSupabase();

    if (!supabase) {
      return {
        data: {
          generated_at: new Date().toISOString(),
          environment: {
            vercel_env: "local-demo",
            public_base_url: publicBaseUrl() || window.location.origin,
            supabase_host: "not configured",
          },
          counts: { ready: 2, missing: 0, warning: 0, manual: 2 },
          categories: [
            {
              id: "local_demo",
              label: "Local demo mode",
              items: [
                {
                  id: "browser_storage",
                  label: "Browser demo storage",
                  status: "ready",
                  detail: "Requests and profiles can be tested locally without server secrets.",
                  next: "Use the live Supabase-backed site for real payments, AI, ID, and admin readiness.",
                  missing: [],
                  docs_url: "",
                  copy_value: "",
                  priority: 90,
                  owner: "Founder/admin",
                },
                {
                  id: "payment_rails",
                  label: "Payment rails",
                  status: "manual",
                  detail: "Stripe, PayPal, Wise, and M-Pesa require Vercel serverless functions and production env vars.",
                  next: "Sign in on swadakta.com/admin to view live payment readiness.",
                  missing: [],
                  docs_url: "https://vercel.com/docs/environment-variables",
                  copy_value: "https://swadakta.com/admin",
                  priority: 20,
                  owner: "Founder/Vercel admin",
                },
              ],
            },
          ],
          next_actions: [
            {
              id: "payment_rails",
              category: "Local demo mode",
              label: "Open live admin readiness",
              status: "manual",
              next: "Sign in on swadakta.com/admin to view production payment, AI, domain, and ID setup.",
              missing: [],
              docs_url: "https://vercel.com/docs/environment-variables",
              copy_value: "https://swadakta.com/admin",
              owner: "Founder/admin",
              priority: 20,
            },
          ],
          safe_copy_values: {},
          protected_actions: [
            "Local demo mode cannot confirm money, identity, receiver assignment, or provider callbacks.",
          ],
        },
        mode: "local",
      };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("Sign in as an admin before viewing operations readiness.");
    }

    const response = await fetch("/api/ops/readiness", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not load operations readiness.");
    }

    return { data, mode: "vercel" };
  }

  async function createStripeCheckoutSession(request, updates = {}) {
    const supabase = await getSupabase();

    if (!supabase) {
      throw new Error("Stripe checkout generation requires Supabase admin sign-in.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("Sign in as an admin before creating a checkout link.");
    }

    const response = await fetch("/api/payments/stripe-checkout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_code: request.request_code,
        client_name: request.client_name,
        email: request.email,
        service_package: updates.service_package || request.service_package,
        quote_amount: updates.quote_amount || request.quote_amount,
        quote_currency: updates.quote_currency || request.quote_currency || request.preferred_currency,
        funds_protection_preference:
          updates.funds_protection_preference || request.funds_protection_preference,
        job_value_band: updates.job_value_band || request.job_value_band,
        payment_kind: updates.funds_protection_preference === "deposit_milestones" ? "deposit_or_milestone" : "client_quote",
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not create Stripe checkout session.");
    }

    return { data, mode: "stripe" };
  }

  async function createPayPalOrder(request, updates = {}) {
    const supabase = await getSupabase();

    if (!supabase) {
      throw new Error("PayPal order generation requires Supabase admin sign-in.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("Sign in as an admin before creating a PayPal order.");
    }

    const response = await fetch("/api/payments/paypal-order", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_code: request.request_code,
        client_name: request.client_name,
        email: request.email,
        service_package: updates.service_package || request.service_package,
        quote_amount: updates.quote_amount || request.quote_amount,
        quote_currency: updates.quote_currency || request.quote_currency || request.preferred_currency,
        funds_protection_preference:
          updates.funds_protection_preference || request.funds_protection_preference,
        job_value_band: updates.job_value_band || request.job_value_band,
        payment_kind: "paypal_order",
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not create PayPal order.");
    }

    return { data, mode: "paypal" };
  }

  async function createWisePaymentRequest(request, updates = {}) {
    const supabase = await getSupabase();

    if (!supabase) {
      throw new Error("Wise payment request prep requires Supabase admin sign-in.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("Sign in as an admin before preparing a Wise payment request.");
    }

    const response = await fetch("/api/payments/wise-payment-request", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_code: request.request_code,
        client_name: request.client_name,
        email: request.email,
        service_package: updates.service_package || request.service_package,
        quote_amount: updates.quote_amount || request.quote_amount,
        quote_currency: updates.quote_currency || request.quote_currency || request.preferred_currency,
        funds_protection_preference:
          updates.funds_protection_preference || request.funds_protection_preference,
        job_value_band: updates.job_value_band || request.job_value_band,
        payment_kind: "wise_payment_request",
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not prepare Wise payment request.");
    }

    return { data, mode: "wise" };
  }

  async function capturePayPalOrder(request, updates = {}) {
    const supabase = await getSupabase();

    if (!supabase) {
      throw new Error("PayPal capture requires Supabase admin sign-in.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("Sign in as an admin before capturing a PayPal order.");
    }

    const response = await fetch("/api/payments/paypal-capture", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_code: request.request_code,
        paypal_order_id: updates.payment_reference || request.payment_reference,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not capture PayPal order.");
    }

    return { data, mode: "paypal" };
  }

  async function createMpesaStkPush(request, updates = {}) {
    const supabase = await getSupabase();

    if (!supabase) {
      throw new Error("M-Pesa STK Push requires Supabase admin sign-in.");
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error("Sign in as an admin before sending M-Pesa STK Push.");
    }

    const response = await fetch("/api/payments/mpesa-stk", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_code: request.request_code,
        client_name: request.client_name,
        whatsapp: request.whatsapp,
        phone_number: request.local_contact_phone || request.whatsapp,
        mpesa_phone: updates.mpesa_phone,
        service_package: updates.service_package || request.service_package,
        quote_amount: updates.quote_amount || request.quote_amount,
        quote_currency: updates.quote_currency || request.quote_currency || request.preferred_currency,
        funds_protection_preference:
          updates.funds_protection_preference || request.funds_protection_preference,
        job_value_band: updates.job_value_band || request.job_value_band,
        payment_kind: "mpesa_stk",
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Could not send M-Pesa STK Push.");
    }

    return { data, mode: "mpesa" };
  }

  async function signInWithEmail(email, redirectTo = window.location.href.split("#")[0]) {
    const supabase = await getSupabase();
    const finalRedirectTo = normalizeAuthRedirect(redirectTo);
    const emailRedirectTo = authCallbackRedirect(finalRedirectTo);

    if (!supabase) {
      return { mode: "local" };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo,
      },
    });

    if (error) {
      throw error;
    }

    return { mode: "supabase", redirectTo: emailRedirectTo, finalRedirectTo };
  }

  async function signUpAccount(email, password, redirectTo = window.location.href.split("#")[0]) {
    const supabase = await getSupabase();
    const finalRedirectTo = normalizeAuthRedirect(redirectTo);
    const emailRedirectTo = authCallbackRedirect(finalRedirectTo);

    if (!supabase) {
      return { mode: "local", needsConfirmation: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      throw error;
    }

    return {
      mode: "supabase",
      session: data.session || null,
      user: data.user || null,
      needsConfirmation: !data.session,
      redirectTo: emailRedirectTo,
      finalRedirectTo,
    };
  }

  async function signInWithPassword(email, password) {
    const supabase = await getSupabase();

    if (!supabase) {
      return { mode: "local" };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { mode: "supabase", session: data.session || null, user: data.user || null };
  }

  async function resetAccountPassword(email, redirectTo = window.location.href.split("#")[0]) {
    const supabase = await getSupabase();
    const finalRedirectTo = normalizeAuthRedirect(redirectTo);
    const emailRedirectTo = authCallbackRedirect(finalRedirectTo);

    if (!supabase) {
      return { mode: "local" };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: emailRedirectTo,
    });

    if (error) {
      throw error;
    }

    return { mode: "supabase", redirectTo: emailRedirectTo, finalRedirectTo };
  }

  async function updateAccountPassword(password) {
    const supabase = await getSupabase();

    if (!supabase) {
      return { mode: "local" };
    }

    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw error;
    }

    return { mode: "supabase", user: data.user || null };
  }

  async function exchangeAuthCodeForSession(code) {
    const supabase = await getSupabase();
    const cleanCode = String(code || "").trim();

    if (!supabase || !cleanCode) {
      return { mode: supabase ? "supabase" : "local", session: null, user: null };
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(cleanCode);
    if (error) {
      throw error;
    }

    return { mode: "supabase", session: data.session || null, user: data.user || null };
  }

  async function signInWithProvider(provider, redirectTo = window.location.href.split("#")[0]) {
    const supabase = await getSupabase();
    const finalRedirectTo = normalizeAuthRedirect(redirectTo);
    const emailRedirectTo = authCallbackRedirect(finalRedirectTo);

    if (!supabase) {
      return { mode: "local" };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: emailRedirectTo,
      },
    });

    if (error) {
      throw error;
    }

    return { mode: "supabase", data, redirectTo: emailRedirectTo, finalRedirectTo };
  }

  async function signInAdmin(email, redirectTo = window.location.href.split("#")[0]) {
    return signInWithEmail(email, redirectTo);
  }

  async function signInPortal(email, redirectTo = window.location.href.split("#")[0]) {
    return signInWithEmail(email, redirectTo);
  }

  async function getSession() {
    const supabase = await getSupabase();

    if (!supabase) {
      return { session: null, mode: "local" };
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }

    return { session: data.session, mode: "supabase" };
  }

  async function onAuthStateChange(callback) {
    const supabase = await getSupabase();

    if (!supabase) {
      return {
        mode: "local",
        subscription: {
          unsubscribe() {},
        },
      };
    }

    const { data } = supabase.auth.onAuthStateChange(callback);
    return { mode: "supabase", subscription: data.subscription };
  }

  async function signOut() {
    const supabase = await getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  window.SwadaktaData = {
    isSupabaseConfigured,
    createRequest,
    listRequests,
    updateRequest,
    trackRequest,
    submitServiceReview,
    createResolutionCase,
    listRequestResolutionCases,
    listResolutionCases,
    updateResolutionCase,
    listMyRequests,
    createPartnerApplication,
    listPartnerApplications,
    listMyPartnerApplications,
    listMyAssignedJobs,
    listFieldUpdates,
    listFundMilestones,
    createFundMilestone,
    updateFundMilestone,
    submitAssignedJobUpdate,
    uploadProofFiles,
    uploadAccountMedia,
    updatePartnerApplication,
    getAccountProfile,
    saveAccountProfile,
    listAccountProfiles,
    updateAccountIdentityVerification,
    requestAccountIdentityVerification,
    listMyIdentityVerificationRequests,
    listIdentityVerificationRequests,
    updateIdentityVerificationRequest,
    assist,
    getOperationsReadiness,
    createStripeCheckoutSession,
    createPayPalOrder,
    createWisePaymentRequest,
    capturePayPalOrder,
    createMpesaStkPush,
    signUpAccount,
    signInWithPassword,
    resetAccountPassword,
    updateAccountPassword,
    exchangeAuthCodeForSession,
    signInWithProvider,
    signInAdmin,
    signInPortal,
    getSession,
    onAuthStateChange,
    signOut,
  };
})();
