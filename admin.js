const requestBoard = document.querySelector("#request-board");
const authCard = document.querySelector("#auth-card");
const authForm = document.querySelector("#auth-form");
const authStatus = document.querySelector("#auth-status");
const modeBadge = document.querySelector("#mode-badge");
const refreshRequests = document.querySelector("#refresh-requests");
const signOutButton = document.querySelector("#sign-out");
const statusFilter = document.querySelector("#status-filter");
const paymentFilter = document.querySelector("#payment-filter");
const sensitiveFilter = document.querySelector("#sensitive-filter");
const searchRequests = document.querySelector("#search-requests");
const partnerBoard = document.querySelector("#partner-board");

let requests = [];
let partnerApplications = [];
let backendMode = "local";

const taskLabels = {
  quick: "Quick errand",
  site: "Property or site visit",
  registry: "Registry or legal errand",
  virtual: "Virtual assistant support",
};

const statusLabels = {
  new: "New",
  quoted: "Quoted",
  paid: "Paid",
  in_progress: "In progress",
  waiting_client: "Waiting client",
  completed: "Completed",
  cancelled: "Cancelled",
};

const paymentLabels = {
  unquoted: "Unquoted",
  invoice_sent: "Invoice sent",
  deposit_paid: "Deposit paid",
  paid: "Paid",
  refunded: "Refunded",
};

const paymentMethodLabels = {
  discuss: "Recommend after quote",
  card: "Card or Stripe link",
  paypal: "PayPal invoice or link",
  wise: "Wise transfer",
  bank: "Bank or mobile money transfer",
};

const servicePackageLabels = {
  quote_first: "Help me choose the right package",
  quick_errand: "Quick Errand - from AUD 85",
  site_visit: "Site Visit - from AUD 180",
  registry_errand: "Registry/Document Run - from AUD 150",
  family_support: "Family Support Run - from AUD 120",
  monthly_retainer: "Monthly Retainer - from AUD 450/mo",
  business_ops: "Business Ops Support - quoted monthly",
};

const budgetRangeLabels = {
  unsure: "Not sure yet",
  under_100: "Under AUD 100",
  "100_250": "AUD 100-250",
  "250_500": "AUD 250-500",
  "500_plus": "AUD 500+",
  retainer: "Monthly retainer",
};

const proofPriorityLabels = {
  balanced: "Balanced proof pack",
  speed: "Fast confirmation",
  detailed_media: "Detailed photo/video",
  receipts: "Receipts and reference numbers",
  debrief: "Debrief call",
};

const referralSourceLabels = {
  not_sure: "Not sure",
  facebook_instagram: "Facebook or Instagram",
  whatsapp_group: "WhatsApp or community group",
  friend_referral: "Friend or referral",
  search: "Search",
  community_event: "Community event",
  other: "Other",
};

const partnerStatusLabels = {
  new: "New",
  reviewing: "Reviewing",
  vetted: "Vetted",
  on_hold: "On hold",
  rejected: "Rejected",
};

const partnerCategoryLabels = {
  site_visits: "Site visits",
  registry_errands: "Registry/document errands",
  family_logistics: "Family support",
  deliveries: "Deliveries",
  sourcing: "Supplier sourcing",
  virtual_ops: "Virtual operations",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(amount, currency = "AUD") {
  if (!amount) {
    return "Not quoted";
  }

  return `${currency} ${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(amount)}`;
}

function toMoneyNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatMoney(amount, currency = "AUD") {
  return `${currency} ${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(toMoneyNumber(amount))}`;
}

function calculateFounderMargin(source) {
  const revenue = toMoneyNumber(source.quote_amount);
  const directCosts =
    toMoneyNumber(source.operator_payout) +
    toMoneyNumber(source.field_costs) +
    toMoneyNumber(source.payment_processing_fee);
  const amount = revenue - directCosts;
  const percent = revenue ? Math.round((amount / revenue) * 100) : null;

  return { amount, directCosts, percent, revenue };
}

function formatFounderMargin(source) {
  const currency = source.quote_currency || source.preferred_currency || "AUD";
  const margin = calculateFounderMargin(source);

  if (!margin.revenue) {
    return "Add quote";
  }

  const amount = `${currency} ${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(margin.amount)}`;
  const label =
    margin.percent < 0
      ? "loss"
      : margin.percent < 30
        ? "low"
        : margin.percent < 50
          ? "watch"
          : "strong";

  return `${amount} (${margin.percent}% ${label})`;
}

function formatConsentStatus(request) {
  const hasConsent =
    request.contact_permission &&
    request.professional_boundary_accepted &&
    request.terms_accepted_at &&
    request.privacy_accepted_at;

  if (hasConsent) {
    return "Complete";
  }

  if (
    request.contact_permission ||
    request.professional_boundary_accepted ||
    request.terms_accepted_at ||
    request.privacy_accepted_at
  ) {
    return "Partial";
  }

  return "Legacy or missing";
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function renderSupportingLinks(request) {
  const links = Array.isArray(request.supporting_links)
    ? request.supporting_links.map(safeHttpUrl).filter(Boolean)
    : [];

  if (!links.length) {
    return "";
  }

  const items = links
    .map(
      (link, index) =>
        `<li><a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Supporting link ${index + 1}</a></li>`,
    )
    .join("");

  return `<ul class="request-links">${items}</ul>`;
}

function getFilteredRequests() {
  const selectedStatus = statusFilter.value;
  const selectedPayment = paymentFilter.value;
  const selectedSensitive = sensitiveFilter.value;
  const query = searchRequests.value.trim().toLowerCase();

  return requests.filter((request) => {
    const matchesStatus = selectedStatus === "all" || request.status === selectedStatus;
    const matchesPayment = selectedPayment === "all" || request.payment_status === selectedPayment;
    const matchesSensitive =
      selectedSensitive === "all" ||
      (selectedSensitive === "sensitive" && request.sensitive_documents_expected) ||
      (selectedSensitive === "standard" && !request.sensitive_documents_expected);
    const searchable = [
      request.request_code,
      request.client_name,
      request.whatsapp,
      request.email,
      request.kenya_location,
      request.client_base,
      request.australia_location,
      request.local_contact_name,
      request.local_contact_phone,
      request.contact_preference,
      request.contact_window,
      assignedPartnerLabel(request),
      servicePackageLabels[request.service_package] || request.service_package,
      paymentMethodLabels[request.payment_method_preference] || request.payment_method_preference,
      budgetRangeLabels[request.budget_range] || request.budget_range,
      proofPriorityLabels[request.proof_priority] || request.proof_priority,
      referralSourceLabels[request.referral_source] || request.referral_source,
      request.operator_payout,
      request.field_costs,
      request.payment_processing_fee,
      Array.isArray(request.supporting_links) ? request.supporting_links.join(" ") : "",
      request.notes,
    ]
      .join(" ")
      .toLowerCase();
    return matchesStatus && matchesPayment && matchesSensitive && (!query || searchable.includes(query));
  });
}

function updateMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soon = new Date(today);
  soon.setDate(today.getDate() + 3);
  const activeRequests = requests.filter((item) =>
    ["quoted", "paid", "in_progress", "waiting_client"].includes(item.status),
  );

  document.querySelector("#metric-new").textContent = requests.filter((item) => item.status === "new").length;
  document.querySelector("#metric-active").textContent = activeRequests.length;
  document.querySelector("#metric-awaiting-payment").textContent = requests.filter((item) =>
    ["invoice_sent", "unquoted"].includes(item.payment_status) && ["new", "quoted"].includes(item.status),
  ).length;
  document.querySelector("#metric-due-soon").textContent = requests.filter((item) => {
    if (!item.payment_due_at || ["paid", "refunded"].includes(item.payment_status)) {
      return false;
    }

    const dueDate = new Date(`${item.payment_due_at}T00:00:00`);
    return dueDate >= today && dueDate <= soon;
  }).length;
  document.querySelector("#metric-sensitive").textContent = requests.filter((item) => item.sensitive_documents_expected).length;
  document.querySelector("#metric-margin-risk").textContent = requests.filter((item) => {
    const margin = calculateFounderMargin(item);
    return margin.revenue > 0 && margin.percent < 30;
  }).length;
  document.querySelector("#metric-completed").textContent = requests.filter((item) => item.status === "completed").length;
}

function statusOptions(current) {
  return Object.entries(statusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function paymentOptions(current) {
  return Object.entries(paymentLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function currencyOptions(current) {
  return ["AUD", "USD", "GBP", "EUR", "KES"]
    .map((currency) => `<option value="${currency}" ${currency === current ? "selected" : ""}>${currency}</option>`)
    .join("");
}

function servicePackageOptions(current) {
  return Object.entries(servicePackageLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function partnerStatusOptions(current) {
  return Object.entries(partnerStatusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function formatPartnerLabel(application) {
  if (!application) {
    return "Unassigned";
  }

  const categories = Array.isArray(application.service_categories)
    ? application.service_categories.map((category) => partnerCategoryLabels[category] || category).join(", ")
    : "No categories";

  return `${application.full_name} (${application.partner_code}) - ${application.kenya_base || "Kenya"} - ${partnerStatusLabels[application.status] || application.status} - ${categories}`;
}

function getPartnerById(id) {
  return partnerApplications.find((application) => application.id === id);
}

function assignedPartnerLabel(request) {
  return formatPartnerLabel(getPartnerById(request.assigned_partner_id));
}

function assignedPartnerOptions(current) {
  const currentPartner = getPartnerById(current);
  const options = partnerApplications
    .filter((application) => application.status === "vetted" || application.id === current)
    .map(
      (application) =>
        `<option value="${escapeHtml(application.id)}" ${application.id === current ? "selected" : ""}>${escapeHtml(formatPartnerLabel(application))}</option>`,
    )
    .join("");

  const fallback =
    current && !currentPartner
      ? `<option value="${escapeHtml(current)}" selected>Unknown assigned partner</option>`
      : "";

  return `<option value="">Unassigned</option>${fallback}${options}`;
}

function renderRequestCard(request) {
  const reports = Array.isArray(request.report_pack) ? request.report_pack.join(", ") : "";
  return `
    <article class="request-card" data-id="${escapeHtml(request.id)}">
      <header class="request-card-header">
        <div>
          <span class="request-code">${escapeHtml(request.request_code)}</span>
          <h2>${escapeHtml(request.client_name)}</h2>
          <p>${escapeHtml(taskLabels[request.task_type] || request.task_type)} · ${escapeHtml(request.kenya_location)}, Kenya</p>
        </div>
        <span class="status-pill status-${escapeHtml(request.status)}">${escapeHtml(statusLabels[request.status] || request.status)}</span>
      </header>

      <dl class="request-details">
        <div><dt>WhatsApp</dt><dd>${escapeHtml(request.whatsapp)}</dd></div>
        <div><dt>Email</dt><dd>${escapeHtml(request.email || "Not provided")}</dd></div>
        <div><dt>Client base</dt><dd>${escapeHtml(request.client_base || request.australia_location || "Not specified")}</dd></div>
        <div><dt>Urgency</dt><dd>${escapeHtml(request.urgency)}</dd></div>
        <div><dt>Reports</dt><dd>${escapeHtml(reports || "Basic update")}</dd></div>
        <div><dt>Estimate</dt><dd>${formatCurrency(request.estimate_aud)}</dd></div>
        <div><dt>Created</dt><dd>${formatDate(request.created_at)}</dd></div>
      </dl>

      <p class="request-notes">${escapeHtml(request.notes)}</p>

      <form class="request-update-form">
        <div class="field-row">
          <label class="field-group">
            Status
            <select name="status">${statusOptions(request.status)}</select>
          </label>
          <label class="field-group">
            Payment
            <select name="payment_status">${paymentOptions(request.payment_status)}</select>
          </label>
        </div>
        <label class="field-group">
          Assigned operator
          <input name="assigned_to" type="text" value="${escapeHtml(request.assigned_to || "")}" />
        </label>
        <label class="field-group">
          Internal notes
          <textarea name="operator_notes" rows="3">${escapeHtml(request.operator_notes || "")}</textarea>
        </label>
        <label class="field-group">
          Client report
          <textarea name="client_report" rows="4">${escapeHtml(request.client_report || "")}</textarea>
        </label>
        <div class="form-actions">
          <button class="button button-primary" type="submit">Save update</button>
          <button class="button button-secondary copy-update" type="button">Copy client update</button>
          <span class="copy-status" role="status"></span>
        </div>
      </form>
    </article>
  `;
}

function renderRequestCardV2(request) {
  const reports = Array.isArray(request.report_pack) ? request.report_pack.join(", ") : "";
  const proofLinks = Array.isArray(request.proof_links) ? request.proof_links.join("\n") : "";
  const clientBase = request.client_base || request.australia_location || "Not specified";
  const localContact = [request.local_contact_name, request.local_contact_phone].filter(Boolean).join(" / ") || "Not provided";
  const quoteCurrency = request.quote_currency || request.preferred_currency || "AUD";
  const servicePackage =
    servicePackageLabels[request.service_package] || request.service_package || "Help me choose the right package";
  const paymentMethod =
    paymentMethodLabels[request.payment_method_preference] || request.payment_method_preference || "Recommend after quote";
  const budgetRange = budgetRangeLabels[request.budget_range] || request.budget_range || "Not sure yet";
  const proofPriority = proofPriorityLabels[request.proof_priority] || request.proof_priority || "Balanced proof pack";
  const referralSource = referralSourceLabels[request.referral_source] || request.referral_source || "Not sure";
  const founderMargin = formatFounderMargin(request);
  const consentStatus = formatConsentStatus(request);
  const contactPreference = request.contact_preference || "whatsapp";
  const sensitiveDocuments = request.sensitive_documents_expected ? "Yes" : "No";
  const assignedPartner = assignedPartnerLabel(request);
  const supportingLinks = renderSupportingLinks(request);

  return `
    <article class="request-card" data-id="${escapeHtml(request.id)}">
      <header class="request-card-header">
        <div>
          <span class="request-code">${escapeHtml(request.request_code)}</span>
          <h2>${escapeHtml(request.client_name)}</h2>
          <p>${escapeHtml(taskLabels[request.task_type] || request.task_type)} - ${escapeHtml(request.kenya_location)}, Kenya</p>
        </div>
        <span class="status-pill status-${escapeHtml(request.status)}">${escapeHtml(statusLabels[request.status] || request.status)}</span>
      </header>

      <dl class="request-details">
        <div><dt>WhatsApp</dt><dd>${escapeHtml(request.whatsapp)}</dd></div>
        <div><dt>Email</dt><dd>${escapeHtml(request.email || "Not provided")}</dd></div>
        <div><dt>Client base</dt><dd>${escapeHtml(clientBase)}</dd></div>
        <div><dt>Urgency</dt><dd>${escapeHtml(request.urgency)}</dd></div>
        <div><dt>Deadline</dt><dd>${escapeHtml(request.deadline || "Flexible")}</dd></div>
        <div><dt>Kenya contact</dt><dd>${escapeHtml(localContact)}</dd></div>
        <div><dt>Contact pref</dt><dd>${escapeHtml(contactPreference)}</dd></div>
        <div><dt>Receiver</dt><dd>${escapeHtml(assignedPartner)}</dd></div>
        <div><dt>Package</dt><dd>${escapeHtml(servicePackage)}</dd></div>
        <div><dt>Pay method</dt><dd>${escapeHtml(paymentMethod)}</dd></div>
        <div><dt>Budget</dt><dd>${escapeHtml(budgetRange)}</dd></div>
        <div><dt>Proof focus</dt><dd>${escapeHtml(proofPriority)}</dd></div>
        <div><dt>Lead source</dt><dd>${escapeHtml(referralSource)}</dd></div>
        <div><dt>Contact window</dt><dd>${escapeHtml(request.contact_window || "Not specified")}</dd></div>
        <div><dt>Sensitive docs</dt><dd>${escapeHtml(sensitiveDocuments)}</dd></div>
        <div><dt>Reports</dt><dd>${escapeHtml(reports || "Basic update")}</dd></div>
        <div><dt>Estimate</dt><dd>${formatCurrency(request.estimate_aud)}</dd></div>
        <div><dt>Quote</dt><dd>${escapeHtml(formatCurrency(request.quote_amount, quoteCurrency))}</dd></div>
        <div><dt>Founder margin</dt><dd>${escapeHtml(founderMargin)}</dd></div>
        <div><dt>Payment due</dt><dd>${escapeHtml(request.payment_due_at || "Not set")}</dd></div>
        <div><dt>Consent</dt><dd>${escapeHtml(consentStatus)}</dd></div>
        <div><dt>Created</dt><dd>${formatDate(request.created_at)}</dd></div>
      </dl>

      <p class="request-notes">${escapeHtml(request.notes)}</p>
      ${supportingLinks}

      <form class="request-update-form">
        <div class="field-row">
          <label class="field-group">
            Status
            <select name="status">${statusOptions(request.status)}</select>
          </label>
          <label class="field-group">
            Payment
            <select name="payment_status">${paymentOptions(request.payment_status)}</select>
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Service package
            <select name="service_package">${servicePackageOptions(request.service_package || "quote_first")}</select>
          </label>
          <label class="field-group">
            Quote amount
            <input name="quote_amount" type="number" min="0" step="1" value="${escapeHtml(request.quote_amount || "")}" />
          </label>
          <label class="field-group">
            Quote currency
            <select name="quote_currency">${currencyOptions(quoteCurrency)}</select>
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Payment link
            <input name="payment_link" type="url" value="${escapeHtml(request.payment_link || "")}" placeholder="Stripe, PayPal, Wise, or invoice URL" />
          </label>
          <label class="field-group">
            Payment due
            <input name="payment_due_at" type="date" value="${escapeHtml(request.payment_due_at || "")}" />
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Operator payout
            <input name="operator_payout" type="number" min="0" step="1" value="${escapeHtml(request.operator_payout || "")}" placeholder="Same currency as quote" />
          </label>
          <label class="field-group">
            Field costs
            <input name="field_costs" type="number" min="0" step="1" value="${escapeHtml(request.field_costs || "")}" placeholder="Travel, fees, supplies" />
          </label>
          <label class="field-group">
            Payment fees
            <input name="payment_processing_fee" type="number" min="0" step="1" value="${escapeHtml(request.payment_processing_fee || "")}" placeholder="Processor or FX fees" />
          </label>
        </div>
        <label class="field-group">
          Assigned receiver
          <select name="assigned_partner_id">${assignedPartnerOptions(request.assigned_partner_id || "")}</select>
        </label>
        <label class="field-group">
          Manual operator note
          <input name="assigned_to" type="text" value="${escapeHtml(request.assigned_to || "")}" />
        </label>
        <label class="field-group">
          Internal notes
          <textarea name="operator_notes" rows="3">${escapeHtml(request.operator_notes || "")}</textarea>
        </label>
        <label class="field-group">
          Client report
          <textarea name="client_report" rows="4">${escapeHtml(request.client_report || "")}</textarea>
        </label>
        <label class="field-group">
          Client report URL
          <input name="client_report_url" type="url" value="${escapeHtml(request.client_report_url || "")}" placeholder="Shareable report link" />
        </label>
        <label class="field-group">
          Proof links
          <textarea name="proof_links" rows="3" placeholder="One proof/media link per line">${escapeHtml(proofLinks)}</textarea>
        </label>
        <div class="form-actions">
          <button class="button button-primary" type="submit">Save update</button>
          <button class="button button-secondary copy-update" type="button">Copy client update</button>
          <button class="button button-secondary copy-quote" type="button">Copy quote</button>
          <button class="button button-secondary copy-operator" type="button">Copy operator brief</button>
          <span class="copy-status" role="status"></span>
        </div>
      </form>
    </article>
  `;
}

function renderRequests() {
  updateMetrics();
  const visibleRequests = getFilteredRequests();

  if (!visibleRequests.length) {
    requestBoard.innerHTML = `
      <div class="empty-state">
        <h2>No requests found</h2>
        <p>New client submissions will appear here. In demo mode, submit a brief from the client intake page first.</p>
      </div>
    `;
    return;
  }

  requestBoard.innerHTML = visibleRequests.map(renderRequestCardV2).join("");
}

function renderPartnerApplication(application) {
  const categories = Array.isArray(application.service_categories)
    ? application.service_categories.map((category) => partnerCategoryLabels[category] || category).join(", ")
    : "Not specified";

  return `
    <article class="request-card partner-card" data-id="${escapeHtml(application.id)}">
      <header class="request-card-header">
        <div>
          <span class="request-code">${escapeHtml(application.partner_code)}</span>
          <h2>${escapeHtml(application.full_name)}</h2>
          <p>${escapeHtml(application.kenya_base)} - ${escapeHtml(categories)}</p>
        </div>
        <span class="status-pill status-${escapeHtml(application.status)}">${escapeHtml(partnerStatusLabels[application.status] || application.status)}</span>
      </header>

      <dl class="request-details">
        <div><dt>WhatsApp</dt><dd>${escapeHtml(application.whatsapp)}</dd></div>
        <div><dt>Email</dt><dd>${escapeHtml(application.email || "Not provided")}</dd></div>
        <div><dt>Coverage</dt><dd>${escapeHtml(application.service_regions || "Not specified")}</dd></div>
        <div><dt>Availability</dt><dd>${escapeHtml(application.availability || "Not specified")}</dd></div>
        <div><dt>Transport</dt><dd>${escapeHtml(application.transport_access || "Not specified")}</dd></div>
        <div><dt>ID consent</dt><dd>${application.id_verification_consent ? "Yes" : "No"}</dd></div>
        <div><dt>Proof consent</dt><dd>${application.proof_standard_consent ? "Yes" : "No"}</dd></div>
        <div><dt>Applied</dt><dd>${formatDate(application.created_at)}</dd></div>
      </dl>

      <p class="request-notes">${escapeHtml(application.notes || "No notes provided.")}</p>

      <form class="partner-update-form">
        <div class="field-row">
          <label class="field-group">
            Partner status
            <select name="status">${partnerStatusOptions(application.status || "new")}</select>
          </label>
          <label class="field-group">
            Internal notes
            <input name="internal_notes" type="text" value="${escapeHtml(application.internal_notes || "")}" placeholder="Checks, risk, next action" />
          </label>
        </div>
        <div class="form-actions">
          <button class="button button-primary" type="submit">Save partner</button>
          <span class="copy-status" role="status"></span>
        </div>
      </form>
    </article>
  `;
}

function renderPartnerApplications() {
  if (!partnerBoard) {
    return;
  }

  if (!partnerApplications.length) {
    partnerBoard.innerHTML = `
      <div class="empty-state">
        <h2>No partner applications yet</h2>
        <p>Receiver and field partner applications from the portal will appear here.</p>
      </div>
    `;
    return;
  }

  partnerBoard.innerHTML = partnerApplications.map(renderPartnerApplication).join("");
}

async function loadPartnerApplications({ renderPanel = true } = {}) {
  if (!partnerBoard) {
    return;
  }

  if (renderPanel) {
    partnerBoard.innerHTML = `<div class="empty-state"><h2>Loading partner applications...</h2></div>`;
  }

  try {
    const result = await window.SwadaktaData.listPartnerApplications();
    partnerApplications = result.data || [];
    if (renderPanel) {
      renderPartnerApplications();
    }
  } catch (error) {
    if (renderPanel) {
      partnerBoard.innerHTML = `
        <div class="empty-state is-error">
          <h2>Could not load partner applications</h2>
          <p>${escapeHtml(error.message || "Check Supabase partner application policies.")}</p>
        </div>
      `;
    }
  }
}

function getPartnerApplicationByCard(card) {
  return partnerApplications.find((application) => application.id === card.dataset.id);
}

function partnerFormPayload(form) {
  const formData = new FormData(form);

  return {
    status: formData.get("status"),
    internal_notes: formData.get("internal_notes"),
  };
}

async function loadRequests() {
  requestBoard.innerHTML = `<div class="empty-state"><h2>Loading requests...</h2></div>`;

  try {
    const sessionResult = await window.SwadaktaData.getSession();
    backendMode = sessionResult.mode;
    modeBadge.textContent =
      backendMode === "supabase" ? "Supabase mode: admin access required" : "Demo mode: browser storage";

    if (backendMode === "supabase" && !sessionResult.session) {
      authCard.hidden = false;
      signOutButton.hidden = true;
      requestBoard.innerHTML = `
        <div class="empty-state">
          <h2>Sign in to view requests</h2>
          <p>Only emails added to <code>admin_users</code> can read or update production requests.</p>
        </div>
      `;
      if (partnerBoard) {
        partnerBoard.innerHTML = `
          <div class="empty-state">
            <h2>Sign in to view partner applications</h2>
          </div>
        `;
      }
      return;
    }

    authCard.hidden = true;
    signOutButton.hidden = backendMode !== "supabase";
    const [requestResult] = await Promise.all([window.SwadaktaData.listRequests(), loadPartnerApplications({ renderPanel: false })]);
    backendMode = requestResult.mode;
    requests = requestResult.data || [];
    renderRequests();
    renderPartnerApplications();
  } catch (error) {
    requestBoard.innerHTML = `
      <div class="empty-state is-error">
        <h2>Could not load requests</h2>
        <p>${escapeHtml(error.message || "Check Supabase keys, RLS policies, and admin access.")}</p>
      </div>
    `;
    if (partnerBoard) {
      partnerBoard.innerHTML = "";
    }
  }
}

function getRequestByCard(card) {
  return requests.find((request) => request.id === card.dataset.id);
}

function formPayload(form) {
  const formData = new FormData(form);
  const quoteAmount = formData.get("quote_amount");
  const proofLinks = String(formData.get("proof_links") || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .map(safeHttpUrl)
    .filter(Boolean);

  return {
    status: formData.get("status"),
    payment_status: formData.get("payment_status"),
    service_package: formData.get("service_package"),
    assigned_partner_id: formData.get("assigned_partner_id") || null,
    assigned_to: formData.get("assigned_to"),
    operator_notes: formData.get("operator_notes"),
    client_report: formData.get("client_report"),
    quote_amount: quoteAmount ? Number(quoteAmount) : null,
    quote_currency: formData.get("quote_currency"),
    payment_link: safeHttpUrl(formData.get("payment_link")),
    payment_due_at: formData.get("payment_due_at") || null,
    operator_payout: toMoneyNumber(formData.get("operator_payout")),
    field_costs: toMoneyNumber(formData.get("field_costs")),
    payment_processing_fee: toMoneyNumber(formData.get("payment_processing_fee")),
    client_report_url: safeHttpUrl(formData.get("client_report_url")),
    proof_links: proofLinks,
  };
}

async function copyText(text, statusElement) {
  try {
    await navigator.clipboard.writeText(text);
    statusElement.textContent = "Copied.";
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
    statusElement.textContent = copied ? "Copied." : "Copy unavailable.";
  }

  window.setTimeout(() => {
    statusElement.textContent = "";
  }, 2400);
}

function buildClientUpdate(request, form) {
  const payload = formPayload(form);
  const quoteLine = payload.quote_amount ? `Quote: ${formatCurrency(payload.quote_amount, payload.quote_currency)}` : "Quote: Pending.";
  const paymentLine = payload.payment_link ? `Payment link: ${payload.payment_link}` : "Payment link: Not issued yet.";
  const dueLine = payload.payment_due_at ? `Payment due: ${payload.payment_due_at}` : "";
  const reportUrlLine = payload.client_report_url ? `Report link: ${payload.client_report_url}` : "";
  const proofLines = payload.proof_links.length ? [`Proof links:`, ...payload.proof_links.map((link) => `- ${link}`)] : [];

  return [
    `Swadakta update for ${request.request_code}`,
    `Status: ${statusLabels[payload.status] || payload.status}`,
    `Payment: ${paymentLabels[payload.payment_status] || payload.payment_status}`,
    quoteLine,
    paymentLine,
    dueLine,
    payload.client_report ? `Report: ${payload.client_report}` : "Report: Update pending.",
    reportUrlLine,
    ...proofLines,
    "Thank you for trusting Swadakta Diaspora Concierge.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildQuoteMessage(request, form) {
  const payload = formPayload(form);
  const quoteLine = payload.quote_amount ? formatCurrency(payload.quote_amount, payload.quote_currency) : "Quote pending";
  const paymentMethod =
    paymentMethodLabels[request.payment_method_preference] || request.payment_method_preference || "Secure payment link";
  const dueLine = payload.payment_due_at
    ? `Please pay by ${payload.payment_due_at} so we can reserve the Kenya-side work window.`
    : "We will confirm the payment window before work starts.";
  const paymentLine = payload.payment_link
    ? `Payment link: ${payload.payment_link}`
    : "Payment link: Not issued yet. We will send the secure link after confirming the quote.";
  const servicePackage = servicePackageLabels[payload.service_package] || payload.service_package || "Quote-first service";
  const proofPriority = proofPriorityLabels[request.proof_priority] || request.proof_priority || "Balanced proof pack";
  const reports = Array.isArray(request.report_pack) ? request.report_pack.join(", ") : "photos, receipts, and written update";

  return [
    `Hi ${request.client_name || "there"},`,
    "",
    `Swadakta quote for request ${request.request_code}: ${quoteLine}.`,
    `Package: ${servicePackage}.`,
    `Task: ${taskLabels[request.task_type] || request.task_type} in ${request.kenya_location}, Kenya.`,
    `Preferred payment route: ${paymentMethod}.`,
    dueLine,
    paymentLine,
    "",
    `Proof plan: ${proofPriority}. Report pack: ${reports}.`,
    "Please pay only through the link above or another channel confirmed by Swadakta. Do not send card numbers, PINs, passwords, or one-time codes by WhatsApp, email, or the intake form.",
    "The quote covers the approved brief only. Any extra travel, document fees, vendor costs, or scope changes will be confirmed before extra work starts.",
    "Terms: https://swadakta.com/terms",
  ].join("\n");
}

function buildOperatorBrief(request, form) {
  const payload = formPayload(form);
  const reports = Array.isArray(request.report_pack) ? request.report_pack.join(", ") : "Basic update";
  const supportingLinks = Array.isArray(request.supporting_links)
    ? request.supporting_links.map(safeHttpUrl).filter(Boolean).map((link) => `- ${link}`).join("\n")
    : "";
  const localContact = [request.local_contact_name, request.local_contact_phone].filter(Boolean).join(" / ") || "Not provided";
  const consentStatus = formatConsentStatus(request);
  const quoteLine = payload.quote_amount ? formatCurrency(payload.quote_amount, payload.quote_currency) : "Not quoted";
  const founderMargin = formatFounderMargin(payload);
  const paymentMethod =
    paymentMethodLabels[request.payment_method_preference] || request.payment_method_preference || "Recommend after quote";
  const servicePackage = servicePackageLabels[payload.service_package] || payload.service_package || "Quote-first service";
  const assignedPartner = assignedPartnerLabel({ assigned_partner_id: payload.assigned_partner_id });
  const budgetRange = budgetRangeLabels[request.budget_range] || request.budget_range || "Not sure yet";
  const proofPriority = proofPriorityLabels[request.proof_priority] || request.proof_priority || "Balanced proof pack";
  const referralSource = referralSourceLabels[request.referral_source] || request.referral_source || "Not sure";

  return [
    `Swadakta operator brief: ${request.request_code}`,
    `Client: ${request.client_name}`,
    `Task: ${taskLabels[request.task_type] || request.task_type}`,
    `Kenya location: ${request.kenya_location}`,
    `Client base: ${request.client_base || request.australia_location || "Not specified"}`,
    `Package: ${servicePackage}`,
    `Assigned receiver: ${assignedPartner}`,
    `Urgency: ${request.urgency}`,
    `Deadline: ${request.deadline || "Flexible"}`,
    `Local contact: ${localContact}`,
    `Client contact preference: ${request.contact_preference || "whatsapp"}`,
    `Preferred payment method: ${paymentMethod}`,
    `Budget comfort: ${budgetRange}`,
    `Proof priority: ${proofPriority}`,
    `Lead source: ${referralSource}`,
    `Best contact window: ${request.contact_window || "Not specified"}`,
    `Consent status: ${consentStatus}`,
    `Sensitive documents expected: ${request.sensitive_documents_expected ? "Yes" : "No"}`,
    `Report pack required: ${reports}`,
    `Quote: ${quoteLine}`,
    `Founder economics: ${founderMargin}; operator payout ${formatMoney(payload.operator_payout, payload.quote_currency)}; field costs ${formatMoney(payload.field_costs, payload.quote_currency)}; payment fees ${formatMoney(payload.payment_processing_fee, payload.quote_currency)}.`,
    "",
    "Client notes:",
    request.notes || "No notes provided.",
    "",
    "Supporting links:",
    supportingLinks || "None provided.",
    "",
    "Field checklist:",
    "- Confirm arrival/access before starting.",
    "- Capture timestamped photos or short video where allowed.",
    "- Keep receipts, queue tickets, names, and reference numbers.",
    "- Record blockers, red flags, and next-step recommendations.",
    "- Do not handle extra money, documents, or instructions outside the approved brief without admin confirmation.",
    "",
    payload.operator_notes ? `Internal notes:\n${payload.operator_notes}` : "Internal notes: None yet.",
  ].join("\n");
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authStatus.textContent = "Sending magic link...";

  try {
    const email = document.querySelector("#admin-email").value.trim();
    const result = await window.SwadaktaData.signInAdmin(email);
    authStatus.textContent =
      result.mode === "supabase"
        ? "Magic link sent. Open it in this browser to continue."
        : "Demo mode does not require sign-in.";
    if (result.mode === "local") {
      await loadRequests();
    }
  } catch (error) {
    authStatus.textContent = error.message || "Could not send magic link.";
  }
});

requestBoard.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target.closest(".request-update-form");
  const card = event.target.closest(".request-card");
  const statusElement = form.querySelector(".copy-status");
  const request = getRequestByCard(card);

  if (!request) {
    return;
  }

  statusElement.textContent = "Saving...";

  try {
    await window.SwadaktaData.updateRequest(request.id, formPayload(form));
    statusElement.textContent = "Saved.";
    await loadRequests();
  } catch (error) {
    statusElement.textContent = error.message || "Could not save.";
  }
});

if (partnerBoard) {
  partnerBoard.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target.closest(".partner-update-form");
    const card = event.target.closest(".partner-card");
    const statusElement = form.querySelector(".copy-status");
    const application = getPartnerApplicationByCard(card);

    if (!application) {
      return;
    }

    statusElement.textContent = "Saving...";

    try {
      await window.SwadaktaData.updatePartnerApplication(application.id, partnerFormPayload(form));
      statusElement.textContent = "Saved.";
      await loadPartnerApplications();
      renderRequests();
    } catch (error) {
      statusElement.textContent = error.message || "Could not save.";
    }
  });
}

requestBoard.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy-update, .copy-quote, .copy-operator");
  if (!button) {
    return;
  }

  const form = button.closest(".request-update-form");
  const card = button.closest(".request-card");
  const request = getRequestByCard(card);
  const statusElement = form.querySelector(".copy-status");

  if (request) {
    const text = button.classList.contains("copy-operator")
      ? buildOperatorBrief(request, form)
      : button.classList.contains("copy-quote")
        ? buildQuoteMessage(request, form)
        : buildClientUpdate(request, form);
    await copyText(text, statusElement);
  }
});

refreshRequests.addEventListener("click", loadRequests);
signOutButton.addEventListener("click", async () => {
  await window.SwadaktaData.signOut();
  await loadRequests();
});
statusFilter.addEventListener("change", renderRequests);
paymentFilter.addEventListener("change", renderRequests);
sensitiveFilter.addEventListener("change", renderRequests);
searchRequests.addEventListener("input", renderRequests);

loadRequests();
