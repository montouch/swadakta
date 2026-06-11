const trackingForm = document.querySelector("#portal-tracking-form");
const trackingResult = document.querySelector("#portal-tracking-result");
const clientLoginForm = document.querySelector("#client-login-form");
const clientLoginStatus = document.querySelector("#client-login-status");
const clientAccountPanel = document.querySelector("#client-account-panel");
const partnerForm = document.querySelector("#partner-form");
const partnerStatus = document.querySelector("#partner-status");
const partnerLoginForm = document.querySelector("#partner-login-form");
const partnerLoginStatus = document.querySelector("#partner-login-status");
const partnerAccountPanel = document.querySelector("#partner-account-panel");
const adminForm = document.querySelector("#portal-admin-form");
const adminStatus = document.querySelector("#portal-admin-status");
const accountStatusTitle = document.querySelector("#account-status-title");
const accountStatusDetail = document.querySelector("#account-status-detail");
const portalSignOut = document.querySelector("#portal-sign-out");
const accountProfileCard = document.querySelector("#account-profile-card");
const draftReceiverProfile = document.querySelector("#draft-receiver-profile");
const useReceiverDraft = document.querySelector("#use-receiver-draft");
const copyReceiverDraft = document.querySelector("#copy-receiver-draft");
const receiverAssistantDraft = document.querySelector("#receiver-assistant-draft");
const receiverAssistantStatus = document.querySelector("#receiver-assistant-status");

let assignedJobs = [];
let lastTrackedCode = "";
let lastTrackedContact = "";
let lastTrackedRequest = null;
let currentPortalContext = {
  email: "",
  profile: null,
  requests: [],
  applications: [],
  jobs: [],
};

const statusLabels = {
  new: "New",
  quoted: "Quoted",
  paid: "Paid",
  in_progress: "In progress",
  waiting_client: "Waiting on client",
  completed: "Completed",
  cancelled: "Cancelled",
};

const paymentLabels = {
  unquoted: "Quote pending",
  invoice_sent: "Payment link sent",
  deposit_paid: "Deposit paid",
  paid: "Paid",
  refunded: "Refunded",
};

const fundsStatusLabels = {
  not_collected: "Not collected",
  payment_link_sent: "Payment link sent",
  authorized: "Authorized",
  held_by_provider: "Held by provider",
  deposit_confirmed: "Deposit confirmed",
  partially_released: "Partially released",
  released: "Released",
  refund_pending: "Refund pending",
  refunded: "Refunded",
  disputed: "Disputed",
};

const verificationStatusLabels = {
  not_required: "Not required",
  required: "Required",
  requested: "Requested",
  submitted: "Submitted",
  verified: "Verified",
  rejected: "Rejected",
  expired: "Expired",
};

const milestoneStatusLabels = {
  planned: "Planned",
  funded: "Funded",
  authorized: "Authorized",
  held_by_provider: "Held by provider",
  ready_to_release: "Ready to release",
  partially_released: "Partially released",
  released: "Released",
  refund_pending: "Refund pending",
  refunded: "Refunded",
  disputed: "Disputed",
  cancelled: "Cancelled",
};

const taskLabels = {
  quick: "Quick errand",
  shopping: "Shopping or sourcing",
  site: "Property or site visit",
  registry: "Registry or legal errand",
  virtual: "Virtual assistant support",
};

const routeStatusLabels = {
  active: "Active lane",
  pilot: "Pilot lane",
  unsupported: "Founder approval lane",
  blocked: "Blocked",
};

const servicePackageLabels = {
  quote_first: "Quote-first service",
  quick_errand: "Quick Errand",
  site_visit: "Site Visit",
  registry_errand: "Registry/Document Run",
  family_support: "Family Support Run",
  shopping_sourcing: "Shopping and sourcing",
  monthly_retainer: "Monthly Retainer",
  business_ops: "Business Ops Support",
};

const jobValueBandLabels = {
  unsure: "Not sure yet",
  under_500: "Under AUD 500",
  "500_2000": "AUD 500-2,000",
  "2000_10000": "AUD 2,000-10,000",
  "10000_plus": "AUD 10,000+",
};

const fundsProtectionLabels = {
  quote_first: "Quote first, then decide",
  deposit_milestones: "Deposit plus staged milestones",
  regulated_escrow: "Regulated escrow for high-value work",
  not_sure: "Not sure, advise me",
};

const partnerStatusLabels = {
  new: "New",
  reviewing: "Reviewing",
  vetted: "Vetted",
  on_hold: "On hold",
  rejected: "Rejected",
};

const identityProviderLabels = {
  smile_id: "Smile ID",
  sumsub: "Sumsub",
  youverify: "Youverify",
  manual: "Manual check",
};

const identityStatusLabels = {
  not_started: "Not started",
  link_sent: "Link sent",
  submitted: "Submitted",
  verified: "Verified",
  failed: "Failed",
  expired: "Expired",
  manual_review: "Manual review",
};

const fieldStatusLabels = {
  progress: "Progress",
  blocked: "Blocked",
  completed: "Completed",
  needs_admin: "Needs admin",
  safety_issue: "Safety issue",
};

const partnerCategoryLabels = {
  site_visits: "Site visits",
  registry_errands: "Registry/document errands",
  family_logistics: "Family support",
  deliveries: "Deliveries",
  sourcing: "Supplier sourcing",
  virtual_ops: "Virtual operations",
};

const accountRoleLabels = {
  client: "Client - I need jobs done in Kenya",
  receiver: "Receiver - I want jobs in Kenya",
  both: "Both client and receiver",
};

const currencyLabels = {
  AUD: "AUD",
  USD: "USD",
  GBP: "GBP",
  EUR: "EUR",
  KES: "KES",
};

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 25;
  }

  return Math.max(0, Math.min(100, Math.round(number)));
}

function provenanceBand(score) {
  if (score >= 90) {
    return "green";
  }
  if (score >= 75) {
    return "mint";
  }
  if (score >= 60) {
    return "blue";
  }
  if (score >= 45) {
    return "amber";
  }
  if (score >= 25) {
    return "orange";
  }
  return "red";
}

function provenanceLabel(score) {
  const labels = {
    green: "Green",
    mint: "Strong",
    blue: "Building",
    amber: "Watch",
    orange: "Starter",
    red: "Risk",
  };

  return labels[provenanceBand(score)];
}

function receiverProvenance(application, jobs = []) {
  const base = clampScore(application.provenance_score ?? 25);
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const cancelledJobs = jobs.filter((job) => job.status === "cancelled").length;
  const reviewedJobs = jobs.filter((job) => Number(job.client_review_score || 0) > 0);
  const lowReviewJobs = reviewedJobs.filter((job) => Number(job.client_review_score || 0) <= 2).length;
  const averageReview =
    reviewedJobs.length > 0
      ? reviewedJobs.reduce((sum, job) => sum + Number(job.client_review_score || 0), 0) / reviewedJobs.length
      : null;
  const identityBonus = application.identity_verification_status === "verified" ? 20 : 0;
  const vettedBonus = application.status === "vetted" ? 10 : 0;
  const proofBonus = application.proof_standard_consent ? 5 : 0;
  const completionBonus = Math.min(completedJobs * 5, 25);
  const reviewBonus = averageReview ? Math.round((averageReview - 3) * 10) : 0;
  const penalties = cancelledJobs * 15 + lowReviewJobs * 12;
  const score = clampScore(base + identityBonus + vettedBonus + proofBonus + completionBonus + reviewBonus - penalties);

  return {
    score,
    band: provenanceBand(score),
    label: provenanceLabel(score),
    summary: [
      `${completedJobs} completed job${completedJobs === 1 ? "" : "s"}`,
      `base ${base}%`,
      averageReview ? `client rating ${averageReview.toFixed(1)}/5` : "no client ratings",
      lowReviewJobs ? `${lowReviewJobs} low review${lowReviewJobs === 1 ? "" : "s"}` : "no low reviews",
    ].join(" / "),
  };
}

function clientProvenance(profile, requests = []) {
  const completedRequests = requests.filter((request) => request.status === "completed").length;
  const fundedRequests = requests.filter((request) => ["deposit_paid", "paid"].includes(request.payment_status)).length;
  const cancelledRequests = requests.filter((request) => request.status === "cancelled").length;
  const identityBonus = profile?.identity_verification_status === "verified" ? 20 : 0;
  const profileBonus =
    profile?.onboarding_status === "profile_complete" || profile?.onboarding_status === "verified" ? 10 : 0;
  const score = clampScore(
    25 +
      identityBonus +
      profileBonus +
      Math.min(completedRequests * 5, 20) +
      Math.min(fundedRequests * 5, 20) -
      cancelledRequests * 8,
  );

  return {
    score,
    band: provenanceBand(score),
    label: provenanceLabel(score),
    summary: `${requests.length} request${requests.length === 1 ? "" : "s"} / ${fundedRequests} funded`,
  };
}

function renderProvenanceSeal(provenance, { subtle = false, title = "Provenance Seal" } = {}) {
  return `
    <div class="provenance-seal ${subtle ? "is-subtle" : ""} provenance-${escapeHtml(provenance.band)}" aria-label="${escapeHtml(title)} ${escapeHtml(provenance.score)} percent">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(provenance.score)}%</strong>
      <small>${escapeHtml(provenance.label)}</small>
      <div class="provenance-bar"><i style="width:${escapeHtml(provenance.score)}%"></i></div>
    </div>
  `;
}

function reviewScoreOptions(current = "5") {
  const options = [
    ["5", "5 - Excellent"],
    ["4", "4 - Good"],
    ["3", "3 - Acceptable"],
    ["2", "2 - Problematic"],
    ["1", "1 - Serious issue"],
  ];

  return options
    .map(([value, label]) => `<option value="${value}" ${String(current) === value ? "selected" : ""}>${label}</option>`)
    .join("");
}

function renderServiceReview(request, contact = "") {
  if (request.status !== "completed") {
    return "";
  }

  if (request.client_review_score) {
    return `
      <div class="service-review service-review-complete">
        <strong>Your review: ${escapeHtml(request.client_review_score)}/5</strong>
        ${request.client_review_note ? `<p>${escapeHtml(request.client_review_note)}</p>` : "<p>Review received. Thank you.</p>"}
        ${request.client_reviewed_at ? `<small>Submitted ${escapeHtml(formatDate(request.client_reviewed_at))}</small>` : ""}
      </div>
    `;
  }

  return `
    <form class="service-review service-review-form" data-request-code="${escapeHtml(request.request_code)}" data-contact="${escapeHtml(contact)}">
      <strong>Review this completed job</strong>
      <div class="field-row">
        <label class="field-group">
          Rating
          <select name="review_score" required>${reviewScoreOptions()}</select>
        </label>
        <label class="field-group">
          Short note
          <textarea name="review_note" rows="2" maxlength="1200" placeholder="What went well, what failed, or what Swadakta should check next."></textarea>
        </label>
      </div>
      <div class="form-actions">
        <button class="button button-primary" type="submit">Send review</button>
        <span class="copy-status" role="status"></span>
      </div>
    </form>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(amount, currency = "AUD") {
  if (!amount) {
    return "Quote pending";
  }

  return `${currency} ${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(amount)}`;
}

function formatAmount(amount, currency = "AUD") {
  return `${currency} ${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(Number(amount || 0))}`;
}

function formatDate(value) {
  if (!value) {
    return "No update yet";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function optionList(labels, current) {
  return Object.entries(labels)
    .map(([value, label]) => `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`)
    .join("");
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function parseProofLinks(value) {
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .map(safeHttpUrl)
    .filter(Boolean);
}

async function copyText(text, statusElement, successMessage = "Copied.") {
  try {
    await navigator.clipboard.writeText(text);
    statusElement.textContent = successMessage;
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.top = "-1000px";
    document.body.appendChild(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    statusElement.textContent = copied ? successMessage : "Copy unavailable.";
  }

  window.setTimeout(() => {
    statusElement.textContent = "";
  }, 2400);
}

function buildReceiverProfileDraft() {
  const name = document.querySelector("#partner-name").value.trim() || "I";
  const base = document.querySelector("#partner-base").value.trim() || "my Kenya base";
  const regions = document.querySelector("#partner-regions").value.trim() || "the areas I listed";
  const categories = selectedPartnerCategories()
    .map((category) => partnerCategoryLabels[category] || category)
    .join(", ");
  const availability = document.querySelector("#partner-availability").value.replaceAll("_", " ");
  const transport = document.querySelector("#partner-transport").value.replaceAll("_", " ");

  return [
    `${name} can support Swadakta receiver work from ${base}, covering ${regions}.`,
    `Preferred categories: ${categories || "to be confirmed"}.`,
    `Availability: ${availability}. Transport access: ${transport}.`,
    "I can provide timestamped photos/video where allowed, receipts, reference numbers, and short written updates after each task.",
    "I understand paid jobs require ID verification, reference checks, and admin approval before assignment.",
  ].join(" ");
}

function buildReceiverUpdateDraft(form, job) {
  const status = form.querySelector('[name="field_status"]').value;
  const statusLabel = fieldStatusLabels[status] || status;
  const proofNeeded = Array.isArray(job.proof_requirements) && job.proof_requirements.length
    ? job.proof_requirements.join("; ")
    : Array.isArray(job.report_pack) && job.report_pack.length
      ? job.report_pack.join(", ")
      : "basic proof";
  const taskLocation = job.task_location || job.kenya_location || "the assigned location";
  return [
    `${statusLabel} update for ${job.request_code}:`,
    `I worked on ${servicePackageLabels[job.service_package] || job.service_package || "the assigned task"} in ${taskLocation}.`,
    `Proof expected: ${proofNeeded}.`,
    "Current progress:",
    "Blockers or references:",
    "Next step or completion note:",
  ].join("\n");
}

function compactRequestForGuide(request) {
  return {
    request_code: request.request_code,
    origin_country: request.origin_country,
    destination_country: request.destination_country,
    route_status: request.route_status,
    service_package: request.service_package,
    task_type: request.task_type,
    task_location: request.task_location || request.kenya_location,
    kenya_location: request.kenya_location,
    status: request.status,
    payment_status: request.payment_status,
    funds_status: request.funds_status,
    quote_currency: request.quote_currency,
    quote_amount: request.quote_amount,
    required_checks: request.required_checks,
    proof_requirements: request.proof_requirements,
    verification_status: request.verification_status,
    updated_at: request.updated_at,
  };
}

function compactApplicationForGuide(application) {
  return {
    partner_code: application.partner_code,
    status: application.status,
    kenya_base: application.kenya_base,
    service_regions: application.service_regions,
    service_categories: application.service_categories,
    identity_verification_status: application.identity_verification_status,
    provenance_score: application.provenance_score,
    updated_at: application.updated_at,
  };
}

function compactJobForGuide(job) {
  return {
    request_code: job.request_code,
    service_package: job.service_package,
    task_type: job.task_type,
    kenya_location: job.kenya_location,
    status: job.status,
    urgency: job.urgency,
    deadline: job.deadline,
    report_pack: job.report_pack,
    notes: job.notes,
    client_review_score: job.client_review_score,
    updated_at: job.updated_at,
  };
}

function portalGuideContext() {
  return {
    account: {
      email: currentPortalContext.email,
      role: currentPortalContext.profile?.account_role || "client",
      identity_verification_status:
        currentPortalContext.profile?.identity_verification_status || "not_started",
      country: currentPortalContext.profile?.country || "",
      kenya_base: currentPortalContext.profile?.kenya_base || "",
      preferred_currency: currentPortalContext.profile?.preferred_currency || "AUD",
    },
    client_requests: currentPortalContext.requests.slice(0, 5).map(compactRequestForGuide),
    receiver_applications: currentPortalContext.applications.slice(0, 5).map(compactApplicationForGuide),
    assigned_jobs: currentPortalContext.jobs.slice(0, 5).map(compactJobForGuide),
  };
}

window.SwadaktaPortalContext = portalGuideContext;

async function askSwadaktaGuide(payload, fallbackText = "") {
  try {
    const result = await window.SwadaktaData.assist(payload);
    const output = String(result.data?.output || "").trim();
    return {
      text: output || fallbackText,
      mode: result.mode || "ai",
      usedAi: Boolean(output),
    };
  } catch (error) {
    return {
      text: fallbackText,
      mode: "fallback",
      usedAi: false,
      error,
    };
  }
}

function fieldStatusOptions(current = "progress") {
  return Object.entries(fieldStatusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function renderMilestones(request) {
  const milestones = Array.isArray(request.milestones) ? request.milestones : [];

  if (!milestones.length) {
    return "";
  }

  return `
    <div class="milestone-client-list">
      ${milestones
        .map(
          (milestone) => `
            <article>
              <strong>${escapeHtml(milestone.title || milestone.milestone_code || "Milestone")}</strong>
              <span>${escapeHtml(milestoneStatusLabels[milestone.release_status] || milestone.release_status || "Planned")}</span>
              <span>${escapeHtml(formatAmount(milestone.released_amount, milestone.currency))} released of ${escapeHtml(formatAmount(milestone.amount, milestone.currency))}</span>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderChecklist(title, items) {
  const list = Array.isArray(items) ? items.map((item) => String(item || "").trim()).filter(Boolean) : [];
  if (!list.length) {
    return "";
  }

  return `
    <div class="tracking-checklist">
      <strong>${escapeHtml(title)}</strong>
      <ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function selectedPartnerCategories() {
  return Array.from(partnerForm.querySelectorAll('input[name="category"]:checked')).map((item) => item.value);
}

function renderTrackingResult(request) {
  if (!request) {
    trackingResult.className = "tracking-result is-error";
    trackingResult.innerHTML = "<strong>No matching request found.</strong><span>Check the request code and original email or WhatsApp.</span>";
    return;
  }

  const proofLinks = Array.isArray(request.proof_links) ? request.proof_links.map(safeHttpUrl).filter(Boolean) : [];
  const proofList = proofLinks.length
    ? `<p>${proofLinks.map((link, index) => `<a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Proof link ${index + 1}</a>`).join(" ")}</p>`
    : "";
  const paymentLink = safeHttpUrl(request.payment_link);
  const reportLink = safeHttpUrl(request.client_report_url);
  const fundsStatus = fundsStatusLabels[request.funds_status] || request.funds_status || "Not collected";
  const verificationStatus =
    verificationStatusLabels[request.verification_status] || request.verification_status || "Not required";
  const valueBand = jobValueBandLabels[request.job_value_band] || request.job_value_band || "Not sure yet";
  const fundsPreference =
    fundsProtectionLabels[request.funds_protection_preference] ||
    request.funds_protection_preference ||
    "Quote first, then decide";
  const route = [request.origin_country, request.destination_country].filter(Boolean).join(" to ");
  const routeStatus = routeStatusLabels[request.route_status] || request.route_status || "";

  trackingResult.className = "tracking-result is-success";
  trackingResult.innerHTML = `
    <strong>${escapeHtml(request.request_code)}</strong>
    ${route ? `<span>Route: ${escapeHtml(route)}</span>` : ""}
    ${routeStatus ? `<span>Route status: ${escapeHtml(routeStatus)}</span>` : ""}
    <span>Status: ${escapeHtml(statusLabels[request.status] || request.status)}</span>
    <span>Payment: ${escapeHtml(paymentLabels[request.payment_status] || request.payment_status)}</span>
    <span>Quote: ${escapeHtml(formatCurrency(request.quote_amount, request.quote_currency))}</span>
    <span>Value involved: ${escapeHtml(valueBand)}</span>
    <span>Funds plan: ${escapeHtml(fundsPreference)}</span>
    <span>Funds: ${escapeHtml(fundsStatus)}</span>
    <span>Protected amount: ${escapeHtml(formatAmount(request.protected_amount, request.quote_currency))}</span>
    ${request.identity_verification_required ? `<span>ID verification: ${escapeHtml(verificationStatus)}</span>` : ""}
    ${renderChecklist("Required checks", request.required_checks)}
    ${renderChecklist("Proof requirements", request.proof_requirements)}
    ${request.release_condition ? `<p>${escapeHtml(request.release_condition)}</p>` : ""}
    ${renderMilestones(request)}
    ${paymentLink ? `<p><a href="${escapeHtml(paymentLink)}" target="_blank" rel="noreferrer">Open payment link</a></p>` : ""}
    ${request.client_report ? `<p>${escapeHtml(request.client_report)}</p>` : ""}
    ${reportLink ? `<p><a href="${escapeHtml(reportLink)}" target="_blank" rel="noreferrer">Open client report</a></p>` : ""}
    ${proofList}
    ${renderServiceReview(request, lastTrackedContact)}
  `;
}

function buildPartnerPayload() {
  return {
    full_name: document.querySelector("#partner-name").value.trim(),
    email: document.querySelector("#partner-email").value.trim(),
    whatsapp: document.querySelector("#partner-whatsapp").value.trim(),
    kenya_base: document.querySelector("#partner-base").value.trim(),
    service_regions: document.querySelector("#partner-regions").value.trim(),
    service_categories: selectedPartnerCategories(),
    availability: document.querySelector("#partner-availability").value,
    transport_access: document.querySelector("#partner-transport").value,
    notes: document.querySelector("#partner-notes").value.trim(),
    id_verification_consent: document.querySelector("#partner-id-consent").checked,
    proof_standard_consent: document.querySelector("#partner-proof-consent").checked,
  };
}

function setAccountStatus({ email = "", mode = "supabase", clientCount = 0, receiverCount = 0, jobCount = 0 } = {}) {
  if (!accountStatusTitle || !accountStatusDetail || !portalSignOut) {
    return;
  }

  if (!email) {
    accountStatusTitle.textContent = mode === "local" ? "Demo account mode" : "Not signed in";
    accountStatusDetail.textContent =
      mode === "local"
        ? "Local demo data is available without email sign-in."
        : "Use your email to create or open a client or receiver account.";
    portalSignOut.hidden = true;
    return;
  }

  accountStatusTitle.textContent = `Signed in as ${email}`;
  accountStatusDetail.textContent = `${clientCount} client request${clientCount === 1 ? "" : "s"}; ${receiverCount} receiver application${receiverCount === 1 ? "" : "s"}; ${jobCount} assigned job${jobCount === 1 ? "" : "s"}.`;
  portalSignOut.hidden = false;
}

function renderAccountProfile(email, profile) {
  if (!accountProfileCard) {
    return;
  }

  const current = profile || {};
  const role = current.account_role || "client";
  const currency = current.preferred_currency || "AUD";
  const identityProvider =
    identityProviderLabels[current.identity_verification_provider] ||
    current.identity_verification_provider ||
    "Smile ID";
  const identityStatus =
    identityStatusLabels[current.identity_verification_status] ||
    current.identity_verification_status ||
    "Not started";
  const identityLink = safeHttpUrl(current.identity_verification_link);
  accountProfileCard.hidden = false;
  accountProfileCard.innerHTML = `
    <div>
      <p class="eyebrow">Account profile</p>
      <h2>Save your Swadakta identity.</h2>
      <p>This profile helps Swadakta match requests, receiver applications, and admin follow-up to the right person.</p>
      <div class="verification-panel">
        <span class="status-pill status-${escapeHtml(current.identity_verification_status || "not_started")}">${escapeHtml(identityStatus)}</span>
        <p>Identity verification is required for every Swadakta account before paid or sensitive work starts.</p>
        <span>Provider: ${escapeHtml(identityProvider)}</span>
        ${
          identityLink
            ? `<a href="${escapeHtml(identityLink)}" target="_blank" rel="noreferrer">Start ID verification</a>`
            : "<span>Verification link pending.</span>"
        }
      </div>
    </div>
    <div class="account-profile-stack">
      <form class="account-profile-form" id="account-profile-form">
        <div class="field-row">
          <label class="field-group">
            Email
            <input type="email" value="${escapeHtml(email)}" disabled />
          </label>
          <label class="field-group">
            Account type
            <select name="account_role">${optionList(accountRoleLabels, role)}</select>
          </label>
          <label class="field-group">
            Preferred currency
            <select name="preferred_currency">${optionList(currencyLabels, currency)}</select>
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Full name
            <input name="full_name" type="text" value="${escapeHtml(current.full_name || "")}" autocomplete="name" />
          </label>
          <label class="field-group">
            WhatsApp
            <input name="whatsapp" type="tel" value="${escapeHtml(current.whatsapp || "")}" autocomplete="tel" />
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Country or diaspora base
            <input name="country" type="text" value="${escapeHtml(current.country || "")}" placeholder="Australia, UK, USA..." />
          </label>
          <label class="field-group">
            Kenya base or coverage
            <input name="kenya_base" type="text" value="${escapeHtml(current.kenya_base || "")}" placeholder="Nairobi, Kisumu, Mombasa..." />
          </label>
        </div>
        <label class="field-group">
          Notes for Swadakta
          <textarea name="profile_notes" rows="3" placeholder="Family region, work categories, preferred contact window, or anything useful.">${escapeHtml(current.profile_notes || "")}</textarea>
        </label>
        <div class="form-actions">
          <button class="button button-primary" type="submit">Save account profile</button>
          <span class="copy-status" role="status"></span>
        </div>
      </form>
      <section class="assistant-panel portal-guide-panel" aria-label="Swadakta Guide">
        <div>
          <p class="eyebrow">Swadakta Guide</p>
          <h3>Ask for help</h3>
        </div>
        <div class="field-row">
          <label class="field-group">
            Side
            <select name="guide_role">
              <option value="client" ${role === "receiver" ? "" : "selected"}>Client</option>
              <option value="receiver" ${role === "receiver" ? "selected" : ""}>Receiver</option>
            </select>
          </label>
          <label class="field-group">
            Task
            <select name="guide_task">
              <option value="Explain my next step">Explain my next step</option>
              <option value="Draft a message to Swadakta">Draft a message to Swadakta</option>
              <option value="Improve my request or update">Improve my request or update</option>
              <option value="List missing information">List missing information</option>
            </select>
          </label>
        </div>
        <label class="field-group">
          Prompt
          <textarea name="guide_prompt" rows="3" placeholder="Ask about your request, receiver application, assigned job, proof, review, or next step."></textarea>
        </label>
        <textarea class="portal-guide-output" rows="5" readonly placeholder="Guide answer appears here."></textarea>
        <div class="form-actions">
          <button class="button button-secondary ask-portal-guide" type="button">Ask guide</button>
          <button class="button button-secondary copy-portal-guide" type="button">Copy answer</button>
          <span class="copy-status" role="status"></span>
        </div>
      </section>
    </div>
  `;
}

function profilePayload(form) {
  const formData = new FormData(form);
  const fullName = String(formData.get("full_name") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const kenyaBase = String(formData.get("kenya_base") || "").trim();

  return {
    account_role: formData.get("account_role") || "client",
    full_name: fullName,
    whatsapp,
    country,
    kenya_base: kenyaBase,
    preferred_currency: formData.get("preferred_currency") || "AUD",
    profile_notes: String(formData.get("profile_notes") || "").trim(),
    onboarding_status: fullName && (country || kenyaBase || whatsapp) ? "profile_complete" : "started",
  };
}

function renderClientAccount(email, requests, profile) {
  if (!clientAccountPanel) {
    return;
  }

  if (!requests.length) {
    clientAccountPanel.innerHTML = `
      <strong>Signed in as ${escapeHtml(email)}</strong>
      ${renderProvenanceSeal(clientProvenance(profile, requests), { subtle: true, title: "Client Seal" })}
      <span>No client requests are linked to this email yet.</span>
    `;
    return;
  }

  const provenance = clientProvenance(profile, requests);
  const items = requests
    .map((request) => {
      const paymentLink = safeHttpUrl(request.payment_link);
      const fundsStatus = fundsStatusLabels[request.funds_status] || request.funds_status || "Not collected";
      const valueBand = jobValueBandLabels[request.job_value_band] || request.job_value_band || "Not sure yet";
      const fundsPreference =
        fundsProtectionLabels[request.funds_protection_preference] ||
        request.funds_protection_preference ||
        "Quote first, then decide";
      const reviewSummary = request.client_review_score
        ? `Review: ${request.client_review_score}/5`
        : request.status === "completed"
          ? "Review pending"
          : "";
      return `
        <article>
          <strong>${escapeHtml(request.request_code)}</strong>
          <span>${escapeHtml(servicePackageLabels[request.service_package] || request.service_package || "Quote-first service")} in ${escapeHtml(request.kenya_location || "Kenya")}</span>
          <span>Status: ${escapeHtml(statusLabels[request.status] || request.status)}. Payment: ${escapeHtml(paymentLabels[request.payment_status] || request.payment_status)}.</span>
          <span>Quote: ${escapeHtml(formatCurrency(request.quote_amount, request.quote_currency))}</span>
          <span>Value involved: ${escapeHtml(valueBand)}. Funds plan: ${escapeHtml(fundsPreference)}.</span>
          <span>Funds: ${escapeHtml(fundsStatus)}. Protected: ${escapeHtml(formatAmount(request.protected_amount, request.quote_currency))}.</span>
          ${renderMilestones(request)}
          ${reviewSummary ? `<span>${escapeHtml(reviewSummary)}</span>` : ""}
          ${renderServiceReview(request, email)}
          ${paymentLink ? `<a href="${escapeHtml(paymentLink)}" target="_blank" rel="noreferrer">Open payment link</a>` : ""}
          <small>Updated ${escapeHtml(formatDate(request.updated_at))}</small>
        </article>
      `;
    })
    .join("");

  clientAccountPanel.innerHTML = `
    <strong>Signed in as ${escapeHtml(email)}</strong>
    ${renderProvenanceSeal(provenance, { subtle: true, title: "Client Seal" })}
    <div class="account-list">${items}</div>
  `;
}

function renderPartnerAccount(email, applications, jobs = []) {
  if (!partnerAccountPanel) {
    return;
  }

  if (!applications.length && !jobs.length) {
    partnerAccountPanel.innerHTML = `
      <strong>Signed in as ${escapeHtml(email)}</strong>
      <span>No receiver applications or assigned jobs are linked to this email yet.</span>
    `;
    return;
  }

  const applicationItems = applications
    .map((application) => {
      const provenance = receiverProvenance(application, jobs);
      const categories = Array.isArray(application.service_categories)
        ? application.service_categories.map((category) => partnerCategoryLabels[category] || category).join(", ")
        : "Not specified";
      const identityProvider =
        identityProviderLabels[application.identity_verification_provider] ||
        application.identity_verification_provider ||
        "Smile ID";
      const identityStatus =
        identityStatusLabels[application.identity_verification_status] ||
        application.identity_verification_status ||
        "Not started";
      const identityLink = safeHttpUrl(application.identity_verification_link);
      const identityReference = application.identity_verification_reference
        ? `Reference: ${application.identity_verification_reference}`
        : "Reference pending";
      return `
        <article>
          <strong>${escapeHtml(application.partner_code)}</strong>
          ${renderProvenanceSeal(provenance)}
          <span>${escapeHtml(application.kenya_base || "Kenya")} - ${escapeHtml(categories)}</span>
          <span>Status: ${escapeHtml(partnerStatusLabels[application.status] || application.status)}.</span>
          <span>Provenance: ${escapeHtml(provenance.summary)}.</span>
          <span>ID verification: ${escapeHtml(identityStatus)} via ${escapeHtml(identityProvider)}.</span>
          <span>${escapeHtml(identityReference)}</span>
          ${application.provenance_notes ? `<span>Review note: ${escapeHtml(application.provenance_notes)}</span>` : ""}
          ${application.identity_verified_at ? `<span>Verified: ${escapeHtml(formatDate(application.identity_verified_at))}</span>` : ""}
          ${
            identityLink
              ? `<a href="${escapeHtml(identityLink)}" target="_blank" rel="noreferrer">Start ID verification</a>`
              : "<small>Swadakta will send the ID verification link before any paid job is assigned.</small>"
          }
          <span>Coverage: ${escapeHtml(application.service_regions || "Not specified")}</span>
          <small>Updated ${escapeHtml(formatDate(application.updated_at))}</small>
        </article>
      `;
    })
    .join("");

  const jobItems = jobs
    .map((job) => {
      const supportingLinks = Array.isArray(job.supporting_links)
        ? job.supporting_links.map(safeHttpUrl).filter(Boolean)
        : [];
      const proofLinks = Array.isArray(job.proof_links) ? job.proof_links.map(safeHttpUrl).filter(Boolean) : [];
      const localContact = [job.local_contact_name, job.local_contact_phone].filter(Boolean).join(" / ") || "Not provided";
      const route = [job.origin_country, job.destination_country].filter(Boolean).join(" to ");
      const taskLocation = job.task_location || job.kenya_location || "the task location";
      const routeStatus = routeStatusLabels[job.route_status] || job.route_status || "";

      return `
        <article>
          <strong>${escapeHtml(job.request_code)}</strong>
          <span>${escapeHtml(servicePackageLabels[job.service_package] || job.service_package || "Quote-first service")} - ${escapeHtml(taskLabels[job.task_type] || job.task_type || "Task")} in ${escapeHtml(taskLocation)}</span>
          ${route ? `<span>Route: ${escapeHtml(route)}${routeStatus ? ` (${escapeHtml(routeStatus)})` : ""}</span>` : ""}
          <span>Status: ${escapeHtml(statusLabels[job.status] || job.status)}. Urgency: ${escapeHtml(job.urgency || "standard")}.</span>
          <span>Deadline: ${escapeHtml(job.deadline || "Flexible")}. Local contact: ${escapeHtml(localContact)}.</span>
          <span>Proof needed: ${escapeHtml(Array.isArray(job.report_pack) && job.report_pack.length ? job.report_pack.join(", ") : "Basic update")}.</span>
          ${renderChecklist("Required checks", job.required_checks)}
          ${renderChecklist("Proof requirements", job.proof_requirements)}
          ${
            job.client_review_score
              ? `<span>Client review: ${escapeHtml(job.client_review_score)}/5${job.client_review_note ? ` - ${escapeHtml(job.client_review_note)}` : ""}</span>`
              : job.status === "completed"
                ? "<span>Client review pending.</span>"
                : ""
          }
          <p>${escapeHtml(job.notes || "No job notes provided.")}</p>
          ${supportingLinks.length ? `<p>${supportingLinks.map((link, index) => `<a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Supporting link ${index + 1}</a>`).join(" ")}</p>` : ""}
          ${job.client_report ? `<p>Admin report note: ${escapeHtml(job.client_report)}</p>` : ""}
          ${proofLinks.length ? `<p>${proofLinks.map((link, index) => `<a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Proof link ${index + 1}</a>`).join(" ")}</p>` : ""}
          <form class="field-update-form" data-request-code="${escapeHtml(job.request_code)}">
            <div class="field-row">
              <label class="field-group">
                Field status
                <select name="field_status">${fieldStatusOptions()}</select>
              </label>
              <label class="field-group">
                Proof links
                <textarea name="proof_links" rows="2" placeholder="One proof link per line"></textarea>
              </label>
            </div>
            <label class="field-group">
              Field update
              <textarea name="update_text" rows="3" placeholder="Progress, blocker, reference number, receipt note, or completion summary" required></textarea>
            </label>
            <div class="form-actions">
              <button class="button button-secondary draft-field-update" type="button">Draft update</button>
              <button class="button button-primary" type="submit">Send field update</button>
              <span class="copy-status" role="status"></span>
            </div>
          </form>
          <small>Updated ${escapeHtml(formatDate(job.updated_at))}</small>
        </article>
      `;
    })
    .join("");

  partnerAccountPanel.innerHTML = `
    <strong>Signed in as ${escapeHtml(email)}</strong>
    ${
      applications.length
        ? `<span>Receiver application status</span><div class="account-list">${applicationItems}</div>`
        : ""
    }
    ${jobs.length ? `<span>Assigned jobs</span><div class="account-list">${jobItems}</div>` : ""}
  `;
}

async function loadAccountPanels() {
  try {
    const sessionResult = await window.SwadaktaData.getSession();
    const email = sessionResult.session?.user?.email || "";

    if (!email) {
      currentPortalContext = {
        email: "",
        profile: null,
        requests: [],
        applications: [],
        jobs: [],
      };
      setAccountStatus({ mode: sessionResult.mode });
      if (accountProfileCard) {
        accountProfileCard.hidden = true;
        accountProfileCard.innerHTML = "";
      }
      return;
    }

    const [clientResult, partnerResult, assignedJobsResult, profileResult] = await Promise.all([
      window.SwadaktaData.listMyRequests(),
      window.SwadaktaData.listMyPartnerApplications(),
      window.SwadaktaData.listMyAssignedJobs(),
      window.SwadaktaData.getAccountProfile(),
    ]);

    assignedJobs = assignedJobsResult.data || [];
    currentPortalContext = {
      email,
      profile: profileResult.data || null,
      requests: clientResult.data || [],
      applications: partnerResult.data || [],
      jobs: assignedJobs,
    };
    renderClientAccount(email, currentPortalContext.requests, currentPortalContext.profile);
    renderPartnerAccount(email, currentPortalContext.applications, currentPortalContext.jobs);
    renderAccountProfile(email, currentPortalContext.profile);
    setAccountStatus({
      email,
      mode: sessionResult.mode,
      clientCount: (clientResult.data || []).length,
      receiverCount: (partnerResult.data || []).length,
      jobCount: (assignedJobsResult.data || []).length,
    });
  } catch (error) {
    const message = escapeHtml(error.message || "Could not load account details.");
    if (accountStatusTitle && accountStatusDetail) {
      accountStatusTitle.textContent = "Account unavailable";
      accountStatusDetail.textContent = error.message || "Could not load account details.";
    }
    if (clientAccountPanel) {
      clientAccountPanel.innerHTML = `<span>${message}</span>`;
    }
    if (partnerAccountPanel) {
      partnerAccountPanel.innerHTML = `<span>${message}</span>`;
    }
  }
}

async function sendPortalMagicLink(email, hash, statusElement) {
  statusElement.textContent = "Sending magic link...";
  const redirectTo = new URL(`portal.html${hash}`, window.location.href).href;
  const result = await window.SwadaktaData.signInPortal(email, redirectTo);
  statusElement.textContent =
    result.mode === "supabase"
      ? `Account link sent. It will open ${new URL(result.redirectTo).origin}.`
      : "Demo mode does not require sign-in.";
  if (result.mode === "local") {
    await loadAccountPanels();
  }
}

trackingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  trackingResult.className = "tracking-result";
  trackingResult.textContent = "Checking request...";

  try {
    const code = document.querySelector("#portal-tracking-code").value;
    const contact = document.querySelector("#portal-tracking-contact").value;
    lastTrackedCode = String(code || "").trim().toUpperCase();
    lastTrackedContact = String(contact || "").trim();
    const result = await window.SwadaktaData.trackRequest(code, contact);
    lastTrackedRequest = result.data || null;
    renderTrackingResult(result.data);
  } catch (error) {
    lastTrackedRequest = null;
    trackingResult.className = "tracking-result is-error";
    trackingResult.textContent = error.message || "Could not check request.";
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest(".service-review-form");
  if (!form) {
    return;
  }

  event.preventDefault();
  const statusElement = form.querySelector(".copy-status");
  const code = form.dataset.requestCode || lastTrackedCode;
  const contact = form.dataset.contact || lastTrackedContact;
  const formData = new FormData(form);
  statusElement.textContent = "Sending review...";

  try {
    const result = await window.SwadaktaData.submitServiceReview(
      code,
      contact,
      formData.get("review_score"),
      formData.get("review_note"),
    );
    statusElement.textContent = "Review saved.";

    if (trackingResult.contains(form) && lastTrackedRequest) {
      lastTrackedRequest = {
        ...lastTrackedRequest,
        ...result.data,
      };
      renderTrackingResult(lastTrackedRequest);
      return;
    }

    await loadAccountPanels();
  } catch (error) {
    statusElement.textContent = error.message || "Could not save review.";
  }
});

clientLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const email = document.querySelector("#client-login-email").value.trim();
    await sendPortalMagicLink(email, "#client", clientLoginStatus);
  } catch (error) {
    clientLoginStatus.textContent = error.message || "Could not send client magic link.";
  }
});

if (portalSignOut) {
  portalSignOut.addEventListener("click", async () => {
    portalSignOut.textContent = "Signing out...";
    await window.SwadaktaData.signOut();
    currentPortalContext = {
      email: "",
      profile: null,
      requests: [],
      applications: [],
      jobs: [],
    };
    if (clientAccountPanel) {
      clientAccountPanel.innerHTML = "";
    }
    if (partnerAccountPanel) {
      partnerAccountPanel.innerHTML = "";
    }
    if (accountProfileCard) {
      accountProfileCard.hidden = true;
      accountProfileCard.innerHTML = "";
    }
    setAccountStatus();
    portalSignOut.textContent = "Sign out";
  });
}

if (accountProfileCard) {
  accountProfileCard.addEventListener("submit", async (event) => {
    const form = event.target.closest(".account-profile-form");
    if (!form) {
      return;
    }

    event.preventDefault();
    const statusElement = form.querySelector(".copy-status");
    statusElement.textContent = "Saving profile...";

    try {
      const result = await window.SwadaktaData.saveAccountProfile(profilePayload(form));
      statusElement.textContent = "Profile saved.";
      const sessionResult = await window.SwadaktaData.getSession();
      const email = sessionResult.session?.user?.email || result.data?.email || "";
      currentPortalContext = {
        ...currentPortalContext,
        email,
        profile: result.data || currentPortalContext.profile,
      };
      renderAccountProfile(email, currentPortalContext.profile);
    } catch (error) {
      statusElement.textContent = error.message || "Could not save profile.";
    }
  });

  accountProfileCard.addEventListener("click", async (event) => {
    const askButton = event.target.closest(".ask-portal-guide");
    const copyButton = event.target.closest(".copy-portal-guide");

    if (!askButton && !copyButton) {
      return;
    }

    const panel = event.target.closest(".portal-guide-panel");
    const output = panel.querySelector(".portal-guide-output");
    const statusElement = panel.querySelector(".copy-status");

    if (copyButton) {
      await copyText(output.value, statusElement, "Answer copied.");
      return;
    }

    const role = panel.querySelector('[name="guide_role"]').value;
    const task = panel.querySelector('[name="guide_task"]').value;
    const prompt = panel.querySelector('[name="guide_prompt"]').value.trim();

    if (!prompt) {
      statusElement.textContent = "Add a prompt first.";
      return;
    }

    askButton.disabled = true;
    statusElement.textContent = "Asking guide...";

    const result = await askSwadaktaGuide({
      role,
      task,
      draft: prompt,
      context: portalGuideContext(),
    });

    output.value =
      result.text ||
      "Guide unavailable. Save your profile, check your request status, or contact Swadakta with your request code.";
    statusElement.textContent = result.usedAi ? "Guide ready." : "Fallback ready.";
    askButton.disabled = false;
  });
}

partnerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const categories = selectedPartnerCategories();

  if (!categories.length) {
    partnerStatus.className = "submission-status is-error";
    partnerStatus.textContent = "Choose at least one work category.";
    return;
  }

  partnerStatus.className = "submission-status";
  partnerStatus.textContent = "Submitting partner application...";

  try {
    const result = await window.SwadaktaData.createPartnerApplication(buildPartnerPayload());
    partnerStatus.className = "submission-status is-success";
    partnerStatus.innerHTML = `
      <strong>Application submitted.</strong>
      <span>Partner application ID: ${escapeHtml(result.data.partner_code)}. Swadakta will review your profile and send ID verification before assigning any client work.</span>
    `;
    partnerForm.reset();
  } catch (error) {
    partnerStatus.className = "submission-status is-error";
    partnerStatus.textContent = error.message || "Could not submit partner application.";
  }
});

partnerLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const email = document.querySelector("#partner-login-email").value.trim();
    await sendPortalMagicLink(email, "#partner", partnerLoginStatus);
  } catch (error) {
    partnerLoginStatus.textContent = error.message || "Could not send receiver magic link.";
  }
});

if (draftReceiverProfile && receiverAssistantDraft) {
  draftReceiverProfile.addEventListener("click", async () => {
    const fallback = buildReceiverProfileDraft();
    receiverAssistantStatus.textContent = "Drafting...";
    draftReceiverProfile.disabled = true;

    const result = await askSwadaktaGuide(
      {
        role: "receiver",
        task: "Draft a concise receiver application profile",
        draft: fallback,
        context: {
          partner_application: buildPartnerPayload(),
        },
      },
      fallback,
    );

    receiverAssistantDraft.value = result.text || fallback;
    receiverAssistantStatus.textContent = result.usedAi ? "AI draft ready." : "Draft ready.";
    draftReceiverProfile.disabled = false;
  });
}

if (useReceiverDraft && receiverAssistantDraft) {
  useReceiverDraft.addEventListener("click", () => {
    document.querySelector("#partner-notes").value =
      receiverAssistantDraft.value || buildReceiverProfileDraft();
    receiverAssistantStatus.textContent = "Draft added.";
  });
}

if (copyReceiverDraft && receiverAssistantDraft) {
  copyReceiverDraft.addEventListener("click", () =>
    copyText(receiverAssistantDraft.value || buildReceiverProfileDraft(), receiverAssistantStatus, "Draft copied."),
  );
}

if (partnerAccountPanel) {
  partnerAccountPanel.addEventListener("click", async (event) => {
    const button = event.target.closest(".draft-field-update");
    if (!button) {
      return;
    }

    const form = button.closest(".field-update-form");
    const job = assignedJobs.find((item) => item.request_code === form.dataset.requestCode);
    const updateBox = form.querySelector('[name="update_text"]');
    const statusElement = form.querySelector(".copy-status");
    const fallback = buildReceiverUpdateDraft(form, job || { request_code: form.dataset.requestCode });

    button.disabled = true;
    statusElement.textContent = "Drafting update...";

    const result = await askSwadaktaGuide(
      {
        role: "receiver",
        task: "Draft a field update for an assigned Swadakta job",
        draft: fallback,
        context: {
          selected_field_status: form.querySelector('[name="field_status"]').value,
          job: compactJobForGuide(job || { request_code: form.dataset.requestCode }),
          account: portalGuideContext().account,
        },
      },
      fallback,
    );

    updateBox.value = result.text || fallback;
    statusElement.textContent = result.usedAi ? "AI draft ready." : "Draft ready.";
    button.disabled = false;
  });
}

if (partnerAccountPanel) {
  partnerAccountPanel.addEventListener("submit", async (event) => {
    const form = event.target.closest(".field-update-form");
    if (!form) {
      return;
    }

    event.preventDefault();
    const statusElement = form.querySelector(".copy-status");
    const formData = new FormData(form);
    const updateText = String(formData.get("update_text") || "").trim();

    if (!updateText) {
      statusElement.textContent = "Add a field update before sending.";
      return;
    }

    statusElement.textContent = "Sending update...";

    try {
      const result = await window.SwadaktaData.submitAssignedJobUpdate(form.dataset.requestCode, {
        field_status: formData.get("field_status"),
        update_text: updateText,
        proof_links: parseProofLinks(formData.get("proof_links")),
      });
      form.reset();
      statusElement.textContent = result.data?.update_code
        ? `Sent ${result.data.update_code}.`
        : "Field update sent.";
    } catch (error) {
      statusElement.textContent = error.message || "Could not send field update.";
    }
  });
}

adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminStatus.className = "tracking-result";
  adminStatus.textContent = "Sending admin magic link...";

  try {
    const email = document.querySelector("#portal-admin-email").value.trim();
    const redirectTo = new URL("admin.html", window.location.href).href;
    const result = await window.SwadaktaData.signInAdmin(email, redirectTo);
    adminStatus.className = "tracking-result is-success";
    adminStatus.textContent =
      result.mode === "supabase"
        ? "Admin account link sent. Open it in this browser to enter the admin desk."
        : "Demo mode does not require sign-in. Open the admin dashboard.";
  } catch (error) {
    adminStatus.className = "tracking-result is-error";
    adminStatus.textContent = error.message || "Could not send magic link.";
  }
});

loadAccountPanels();
