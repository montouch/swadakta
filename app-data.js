(function () {
  const STORAGE_KEY = "swadakta_service_requests";
  const PARTNER_STORAGE_KEY = "swadakta_partner_applications";
  let supabaseClientPromise = null;

  function config() {
    return window.SWADAKTA_CONFIG || {};
  }

  function isSupabaseConfigured() {
    const current = config();
    return Boolean(current.supabaseUrl && current.supabasePublishableKey);
  }

  function createLocalCode() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SW-${token}`;
  }

  function createPartnerCode() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SP-${token}`;
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
      operator_payout: 0,
      field_costs: 0,
      payment_processing_fee: 0,
      client_report_url: "",
      proof_links: [],
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
      notes: "",
      created_at: now,
      updated_at: now,
      ...payload,
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
      service_package: updates.service_package,
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

  async function updatePartnerApplication(id, updates) {
    const updatePayload = {
      status: updates.status,
      internal_notes: updates.internal_notes,
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

    return {
      request_code: request.request_code,
      status: request.status,
      payment_status: request.payment_status,
      quote_amount: request.quote_amount,
      quote_currency: request.quote_currency,
      payment_link: request.payment_link,
      client_report: request.client_report,
      client_report_url: request.client_report_url,
      proof_links: request.proof_links || [],
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

  async function listMyRequests() {
    const supabase = await getSupabase();

    if (!supabase) {
      return { data: readLocalRequests(), mode: "local" };
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

  async function signInWithEmail(email, redirectTo = window.location.href.split("#")[0]) {
    const supabase = await getSupabase();

    if (!supabase) {
      return { mode: "local" };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    return { mode: "supabase" };
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
    listMyRequests,
    createPartnerApplication,
    listPartnerApplications,
    listMyPartnerApplications,
    listMyAssignedJobs,
    updatePartnerApplication,
    signInAdmin,
    signInPortal,
    getSession,
    signOut,
  };
})();
