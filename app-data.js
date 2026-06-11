(function () {
  const STORAGE_KEY = "swadakta_service_requests";
  const PARTNER_STORAGE_KEY = "swadakta_partner_applications";
  const FIELD_UPDATE_STORAGE_KEY = "swadakta_field_updates";
  const FUND_MILESTONE_STORAGE_KEY = "swadakta_fund_milestones";
  const ACCOUNT_PROFILE_STORAGE_KEY = "swadakta_account_profile";
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
      profile_notes: profile.profile_notes,
      onboarding_status: profile.onboarding_status,
    };
  }

  async function createRequest(payload) {
    const normalized = normalizeRequest(payload);
    const supabase = await getSupabase();

    if (!supabase) {
      const requests = [normalized, ...readLocalRequests()];
      writeLocalRequests(requests);
      return { data: normalized, mode: "local" };
    }

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

    const { error } = await supabase.from("partner_applications").insert(toPartnerDatabasePayload(normalized));

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

    const { data, error, status } = await supabase
      .from("account_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

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

    const { data, error } = await supabase
      .from("account_profiles")
      .upsert(toAccountProfileDatabasePayload(profile), { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) {
      throw error;
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
      throw error;
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
    const emailRedirectTo = normalizeAuthRedirect(redirectTo);

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

    return { mode: "supabase", redirectTo: emailRedirectTo };
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
    updatePartnerApplication,
    getAccountProfile,
    saveAccountProfile,
    listAccountProfiles,
    updateAccountIdentityVerification,
    assist,
    createStripeCheckoutSession,
    createPayPalOrder,
    capturePayPalOrder,
    createMpesaStkPush,
    signInAdmin,
    signInPortal,
    getSession,
    signOut,
  };
})();
