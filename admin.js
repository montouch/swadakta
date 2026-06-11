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
const accountBoard = document.querySelector("#account-board");
const partnerBoard = document.querySelector("#partner-board");
const founderCommand = document.querySelector("#founder-command");

let requests = [];
let accountProfiles = [];
let partnerApplications = [];
let fieldUpdates = [];
let fundMilestones = [];
let backendMode = "local";
let actionFilter = "all";

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

const fieldUpdateStatusLabels = {
  progress: "Progress",
  blocked: "Blocked",
  completed: "Completed",
  needs_admin: "Needs admin",
  safety_issue: "Safety issue",
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

const milestoneProviderLabels = {
  manual: "Manual record",
  stripe: "Stripe",
  paypal: "PayPal",
  wise: "Wise",
  escrow_com: "Escrow.com",
  bank: "Bank",
  mpesa: "M-Pesa",
  other: "Other",
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
  client: "Client",
  receiver: "Receiver",
  both: "Client and receiver",
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

function formatSignedMoney(amount, currency = "AUD") {
  const number = Number(amount || 0);
  const absolute = Math.abs(Number.isFinite(number) ? number : 0);
  const prefix = number < 0 ? "-" : "";
  return `${prefix}${currency} ${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(absolute)}`;
}

function formatDateTimeInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
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

  const amount = formatSignedMoney(margin.amount, currency);
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
    request.identity_verification_consent &&
    request.terms_accepted_at &&
    request.privacy_accepted_at;

  if (hasConsent) {
    return "Complete";
  }

  if (
    request.contact_permission ||
    request.professional_boundary_accepted ||
    request.identity_verification_consent ||
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

function getFundMilestonesForRequest(request) {
  return fundMilestones.filter((milestone) => milestone.service_request_id === request.id);
}

function renderClientMilestoneLine(milestone) {
  const amount = formatMoney(milestone.amount, milestone.currency || "AUD");
  const released = formatMoney(milestone.released_amount, milestone.currency || "AUD");
  const status = milestoneStatusLabels[milestone.release_status] || milestone.release_status || "Planned";
  return `${milestone.title || "Milestone"} - ${status} - ${released} of ${amount}`;
}

function renderFundMilestones(request) {
  const milestones = getFundMilestonesForRequest(request);
  const totalPlanned = milestones.reduce((sum, item) => sum + toMoneyNumber(item.amount), 0);
  const totalReleased = milestones.reduce((sum, item) => sum + toMoneyNumber(item.released_amount), 0);
  const currency = request.quote_currency || request.preferred_currency || "AUD";

  const milestoneItems = milestones
    .map((milestone) => {
      const status = milestoneStatusLabels[milestone.release_status] || milestone.release_status || "Planned";
      const provider = milestoneProviderLabels[milestone.provider] || milestone.provider || "Manual record";
      return `
        <article class="milestone-item" data-milestone-id="${escapeHtml(milestone.id)}">
          <header>
            <div>
              <span class="request-code">${escapeHtml(milestone.milestone_code || "Milestone")}</span>
              <strong>${escapeHtml(milestone.title || "Untitled milestone")}</strong>
            </div>
            <span class="status-pill status-${escapeHtml(milestone.release_status || "planned")}">${escapeHtml(status)}</span>
          </header>
          <p>${escapeHtml(renderClientMilestoneLine(milestone))}</p>
          <p>${escapeHtml(milestone.release_trigger || "Admin verifies milestone proof before release.")}</p>
          <form class="milestone-update-form">
            <div class="field-row">
              <label class="field-group">
                Title
                <input name="title" type="text" value="${escapeHtml(milestone.title || "")}" required />
              </label>
              <label class="field-group">
                Status
                <select name="release_status">${milestoneStatusOptions(milestone.release_status || "planned")}</select>
              </label>
              <label class="field-group">
                Provider
                <select name="provider">${milestoneProviderOptions(milestone.provider || "manual")}</select>
              </label>
            </div>
            <div class="field-row">
              <label class="field-group">
                Amount
                <input name="amount" type="number" min="0" step="1" value="${escapeHtml(milestone.amount || "")}" />
              </label>
              <label class="field-group">
                Released
                <input name="released_amount" type="number" min="0" step="1" value="${escapeHtml(milestone.released_amount || "")}" />
              </label>
              <label class="field-group">
                Currency
                <select name="currency">${currencyOptions(milestone.currency || currency)}</select>
              </label>
            </div>
            <div class="field-row">
              <label class="field-group">
                Due
                <input name="due_at" type="date" value="${escapeHtml(milestone.due_at || "")}" />
              </label>
              <label class="field-group">
                Released at
                <input name="released_at" type="datetime-local" value="${escapeHtml(formatDateTimeInput(milestone.released_at))}" />
              </label>
              <label class="field-group">
                Provider ref
                <input name="provider_reference" type="text" value="${escapeHtml(milestone.provider_reference || "")}" placeholder="Stripe, PayPal, M-Pesa, bank ref" />
              </label>
            </div>
            <label class="field-group">
              Release trigger
              <input name="release_trigger" type="text" value="${escapeHtml(milestone.release_trigger || "")}" />
            </label>
            <label class="field-group">
              Internal notes
              <textarea name="internal_notes" rows="2">${escapeHtml(milestone.internal_notes || "")}</textarea>
            </label>
            <label class="single-check">
              <input name="client_visible" type="checkbox" ${milestone.client_visible !== false ? "checked" : ""} />
              Show safe milestone status to client
            </label>
            <div class="form-actions">
              <button class="button button-secondary" type="submit">Save milestone</button>
              <span class="copy-status" role="status"></span>
            </div>
          </form>
        </article>
      `;
    })
    .join("");

  return `
    <section class="milestone-list" aria-label="Funds protection milestones">
      <div class="field-update-list-header">
        <span class="request-code">Funds protection</span>
        <strong>${escapeHtml(formatMoney(totalReleased, currency))}</strong>
      </div>
      <p class="form-note">Released ${escapeHtml(formatMoney(totalReleased, currency))} of ${escapeHtml(formatMoney(totalPlanned, currency))}. Use provider references for Stripe, PayPal, Wise, M-Pesa, bank, or escrow records.</p>
      ${milestoneItems || `<p class="form-note">No milestones yet. Add the first release milestone below.</p>`}
      <form class="milestone-create-form">
        <div class="field-row">
          <label class="field-group">
            New milestone
            <input name="title" type="text" placeholder="Deposit, site media, final report..." required />
          </label>
          <label class="field-group">
            Amount
            <input name="amount" type="number" min="0" step="1" placeholder="0" />
          </label>
          <label class="field-group">
            Currency
            <select name="currency">${currencyOptions(currency)}</select>
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Status
            <select name="release_status">${milestoneStatusOptions("planned")}</select>
          </label>
          <label class="field-group">
            Provider
            <select name="provider">${milestoneProviderOptions("manual")}</select>
          </label>
          <label class="field-group">
            Due
            <input name="due_at" type="date" />
          </label>
        </div>
        <label class="field-group">
          Release trigger
          <input name="release_trigger" type="text" value="Admin verifies milestone proof before release." />
        </label>
        <div class="form-actions">
          <button class="button button-secondary" type="submit">Add milestone</button>
          <span class="copy-status" role="status"></span>
        </div>
      </form>
    </section>
  `;
}

function getFieldUpdatesForRequest(request) {
  return fieldUpdates.filter(
    (update) =>
      update.service_request_id === request.id ||
      (update.request_code &&
        String(update.request_code || "").toUpperCase() === String(request.request_code || "").toUpperCase()),
  );
}

function fieldUpdatePartnerLabel(update) {
  const partner = getPartnerById(update.partner_application_id);
  return partner ? `${partner.full_name} (${partner.partner_code})` : "Assigned receiver";
}

function renderFieldUpdateProofLinks(update) {
  const links = Array.isArray(update.proof_links) ? update.proof_links.map(safeHttpUrl).filter(Boolean) : [];

  if (!links.length) {
    return "";
  }

  return `
    <ul class="request-links">
      ${links
        .map(
          (link, index) =>
            `<li><a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Field proof ${index + 1}</a></li>`,
        )
        .join("")}
    </ul>
  `;
}

function renderFieldUpdates(request) {
  const updates = getFieldUpdatesForRequest(request);

  if (!updates.length) {
    return "";
  }

  const items = updates
    .map((update) => {
      const statusLabel = fieldUpdateStatusLabels[update.field_status] || update.field_status || "Progress";
      return `
        <article class="field-update-item">
          <header>
            <div>
              <span class="request-code">${escapeHtml(update.update_code || "Field update")}</span>
              <strong>${escapeHtml(fieldUpdatePartnerLabel(update))}</strong>
            </div>
            <span class="status-pill status-${escapeHtml(update.field_status || "progress")}">${escapeHtml(statusLabel)}</span>
          </header>
          <p>${escapeHtml(update.update_text || "")}</p>
          ${renderFieldUpdateProofLinks(update)}
          <small>${escapeHtml(formatDate(update.created_at))}</small>
        </article>
      `;
    })
    .join("");

  return `
    <section class="field-update-list" aria-label="Receiver field updates">
      <div class="field-update-list-header">
        <span class="request-code">Receiver updates</span>
        <strong>${updates.length}</strong>
      </div>
      ${items}
    </section>
  `;
}

function isClosedRequest(request) {
  return ["completed", "cancelled"].includes(request.status);
}

function isPaymentOpen(request) {
  return !["deposit_paid", "paid", "refunded"].includes(request.payment_status);
}

function isPaymentOverdue(request) {
  if (!request.payment_due_at || !isPaymentOpen(request) || request.status === "cancelled") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${request.payment_due_at}T00:00:00`);
  return dueDate < today;
}

function needsQuoteOrPaymentLink(request) {
  if (isClosedRequest(request)) {
    return false;
  }

  return (
    request.status === "new" ||
    request.payment_status === "unquoted" ||
    (request.status === "quoted" && (!toMoneyNumber(request.quote_amount) || !request.payment_link))
  );
}

function hasClearedOrProtectedFunds(request) {
  return (
    ["deposit_paid", "paid"].includes(request.payment_status) ||
    ["authorized", "held_by_provider", "deposit_confirmed", "partially_released"].includes(request.funds_status)
  );
}

function isReadyToAssign(request) {
  return !isClosedRequest(request) && hasClearedOrProtectedFunds(request) && !request.assigned_partner_id;
}

function needsProofReview(request) {
  return !isClosedRequest(request) && getFieldUpdatesForRequest(request).length > 0;
}

function needsReleaseDecision(request) {
  return (
    !isClosedRequest(request) &&
    getFundMilestonesForRequest(request).some((milestone) =>
      ["ready_to_release", "refund_pending", "disputed"].includes(milestone.release_status),
    )
  );
}

function needsIdVerification(request) {
  return (
    request.identity_verification_required &&
    !["verified", "not_required"].includes(request.verification_status) &&
    request.status !== "cancelled"
  );
}

function hasMarginRisk(request) {
  const margin = calculateFounderMargin(request);
  return margin.revenue > 0 && margin.percent < 30 && request.status !== "cancelled";
}

function matchesActionFilter(request, selectedAction) {
  if (selectedAction === "all") {
    return true;
  }

  const checks = {
    quote: needsQuoteOrPaymentLink,
    overdue: isPaymentOverdue,
    assign: isReadyToAssign,
    proof: needsProofReview,
    release: needsReleaseDecision,
    id: needsIdVerification,
    margin: hasMarginRisk,
  };

  return checks[selectedAction] ? checks[selectedAction](request) : true;
}

function sumRequests(items, getter) {
  return items.reduce((sum, item) => sum + toMoneyNumber(getter(item)), 0);
}

function sumMilestones(items, getter) {
  return items.reduce((sum, item) => sum + toMoneyNumber(getter(item)), 0);
}

function renderFounderCommand() {
  if (!founderCommand) {
    return;
  }

  const openRequests = requests.filter((request) => request.status !== "cancelled");
  const quotedRequests = openRequests.filter((request) => toMoneyNumber(request.quote_amount) > 0);
  const outstandingRequests = quotedRequests.filter((request) => isPaymentOpen(request));
  const totalRevenue = sumRequests(quotedRequests, (request) => request.quote_amount);
  const totalMargin = quotedRequests.reduce((sum, request) => sum + calculateFounderMargin(request).amount, 0);
  const protectedTotal = sumRequests(openRequests, (request) => request.protected_amount);
  const outstandingTotal = sumRequests(outstandingRequests, (request) => request.quote_amount);
  const readyReleaseTotal = sumMilestones(
    fundMilestones.filter((milestone) => milestone.release_status === "ready_to_release"),
    (milestone) => toMoneyNumber(milestone.amount) - toMoneyNumber(milestone.released_amount),
  );
  const actionCounts = {
    all: requests.length,
    quote: requests.filter(needsQuoteOrPaymentLink).length,
    overdue: requests.filter(isPaymentOverdue).length,
    assign: requests.filter(isReadyToAssign).length,
    proof: requests.filter(needsProofReview).length,
    release: requests.filter(needsReleaseDecision).length,
    id: requests.filter(needsIdVerification).length,
    margin: requests.filter(hasMarginRisk).length,
  };
  const actionTotal =
    actionCounts.quote +
    actionCounts.overdue +
    actionCounts.assign +
    actionCounts.proof +
    actionCounts.release +
    actionCounts.id +
    actionCounts.margin;

  const summaryCards = [
    ["Quoted revenue", formatMoney(totalRevenue, "AUD"), "Open quoted pipeline"],
    ["Founder margin", formatSignedMoney(totalMargin, "AUD"), "After receiver, field, and payment costs"],
    ["Protected funds", formatMoney(protectedTotal, "AUD"), "Held, authorized, or confirmed"],
    ["To collect", formatMoney(outstandingTotal, "AUD"), "Quoted but not paid/deposited"],
    ["Ready release", formatMoney(readyReleaseTotal, "AUD"), "Milestones waiting for payout decision"],
    ["Action items", String(actionTotal), "Open money, trust, or delivery blockers"],
  ];
  const actions = [
    ["all", "All jobs", "Full queue"],
    ["quote", "Quote/pay link", "Make client money ask"],
    ["overdue", "Overdue pay", "Chase payment"],
    ["assign", "Assign receiver", "Paid/protected, no receiver"],
    ["proof", "Review proof", "Receiver update waiting"],
    ["release", "Release decision", "Pay/refund/dispute milestone"],
    ["id", "ID check", "Verification not done"],
    ["margin", "Margin risk", "Below 30%"],
  ];

  founderCommand.innerHTML = `
    <div class="founder-command-header">
      <div>
        <p class="eyebrow">Founder desk</p>
        <h2>Money, trust, and delivery control.</h2>
      </div>
      <span class="mode-badge">${escapeHtml(actionFilter === "all" ? "All action queues" : "Action filter active")}</span>
    </div>
    <div class="founder-command-grid">
      ${summaryCards
        .map(
          ([label, value, note]) => `
            <article>
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
              <small>${escapeHtml(note)}</small>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="command-filter-row" aria-label="Founder action filters">
      ${actions
        .map(
          ([value, label, note]) => `
            <button class="command-filter ${actionFilter === value ? "is-active" : ""}" type="button" data-action-filter="${escapeHtml(value)}">
              <strong>${escapeHtml(String(actionCounts[value]))}</strong>
              <span>${escapeHtml(label)}</span>
              <small>${escapeHtml(note)}</small>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
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
    const matchesAction = matchesActionFilter(request, actionFilter);
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
      fundsStatusLabels[request.funds_status] || request.funds_status,
      request.protected_amount,
      request.release_condition,
      request.payment_reference,
      request.release_notes,
      verificationStatusLabels[request.verification_status] || request.verification_status,
      request.verification_reason,
      request.operator_payout,
      request.field_costs,
      request.payment_processing_fee,
      Array.isArray(request.supporting_links) ? request.supporting_links.join(" ") : "",
      getFundMilestonesForRequest(request)
        .map((milestone) =>
          [
            milestone.milestone_code,
            milestone.title,
            milestone.release_status,
            milestone.provider,
            milestone.provider_reference,
            milestone.release_trigger,
            milestone.internal_notes,
          ].join(" "),
        )
        .join(" "),
      getFieldUpdatesForRequest(request)
        .map((update) => [update.update_code, update.field_status, update.update_text, update.proof_links].join(" "))
        .join(" "),
      request.notes,
    ]
      .join(" ")
      .toLowerCase();
    return matchesStatus && matchesPayment && matchesSensitive && matchesAction && (!query || searchable.includes(query));
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

function fundsStatusOptions(current) {
  return Object.entries(fundsStatusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function verificationStatusOptions(current) {
  return Object.entries(verificationStatusLabels)
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

function milestoneStatusOptions(current) {
  return Object.entries(milestoneStatusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function milestoneProviderOptions(current) {
  return Object.entries(milestoneProviderLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
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

function identityProviderOptions(current) {
  return Object.entries(identityProviderLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function identityStatusOptions(current) {
  return Object.entries(identityStatusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function isVerifiedReceiver(application) {
  return (
    application &&
    application.status === "vetted" &&
    application.id_verification_consent === true &&
    application.identity_verification_status === "verified"
  );
}

function formatPartnerLabel(application) {
  if (!application) {
    return "Unassigned";
  }

  const categories = Array.isArray(application.service_categories)
    ? application.service_categories.map((category) => partnerCategoryLabels[category] || category).join(", ")
    : "No categories";
  const identityStatus =
    identityStatusLabels[application.identity_verification_status] ||
    application.identity_verification_status ||
    "Not started";

  return `${application.full_name} (${application.partner_code}) - ${application.kenya_base || "Kenya"} - ${partnerStatusLabels[application.status] || application.status} - ID ${identityStatus} - ${categories}`;
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
    .filter((application) => isVerifiedReceiver(application) || application.id === current)
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
          <p>${escapeHtml(taskLabels[request.task_type] || request.task_type)} - ${escapeHtml(request.kenya_location)}, Kenya</p>
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
  const fundsStatus = fundsStatusLabels[request.funds_status] || request.funds_status || "Not collected";
  const protectedAmount = formatMoney(request.protected_amount, quoteCurrency);
  const verificationStatus =
    verificationStatusLabels[request.verification_status] || request.verification_status || "Not required";
  const verificationRequired = request.identity_verification_required ? "Required" : "Not required";

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
        <div><dt>Funds</dt><dd>${escapeHtml(fundsStatus)}</dd></div>
        <div><dt>Protected</dt><dd>${escapeHtml(protectedAmount)}</dd></div>
        <div><dt>ID check</dt><dd>${escapeHtml(`${verificationRequired} - ${verificationStatus}`)}</dd></div>
        <div><dt>ID consent</dt><dd>${request.identity_verification_consent ? "Yes" : "No"}</dd></div>
        <div><dt>Payment due</dt><dd>${escapeHtml(request.payment_due_at || "Not set")}</dd></div>
        <div><dt>Consent</dt><dd>${escapeHtml(consentStatus)}</dd></div>
        <div><dt>Created</dt><dd>${formatDate(request.created_at)}</dd></div>
      </dl>

      <p class="request-notes">${escapeHtml(request.notes)}</p>
      ${supportingLinks}
      ${renderFundMilestones(request)}
      ${renderFieldUpdates(request)}

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
            Funds status
            <select name="funds_status">${fundsStatusOptions(request.funds_status || "not_collected")}</select>
          </label>
          <label class="field-group">
            Protected amount
            <input name="protected_amount" type="number" min="0" step="1" value="${escapeHtml(request.protected_amount || "")}" placeholder="Amount held/authorized" />
          </label>
          <label class="field-group">
            Payment/provider ref
            <input name="payment_reference" type="text" value="${escapeHtml(request.payment_reference || "")}" placeholder="Stripe PI, PayPal auth, M-Pesa receipt..." />
          </label>
        </div>
        <label class="field-group">
          Release condition
          <input name="release_condition" type="text" value="${escapeHtml(request.release_condition || "Admin verifies proof and client-safe report before receiver payout.")}" />
        </label>
        <label class="field-group">
          Funds release notes
          <textarea name="release_notes" rows="2">${escapeHtml(request.release_notes || "")}</textarea>
        </label>
        <div class="field-row">
          <label class="field-group">
            ID verification
            <select name="verification_status">${verificationStatusOptions(request.verification_status || "not_required")}</select>
          </label>
          <label class="field-group">
            Verification reason
            <input name="verification_reason" type="text" value="${escapeHtml(request.verification_reason || "")}" placeholder="High amount, title docs, family authority..." />
          </label>
          <label class="field-group">
            Verified at
            <input name="verified_at" type="datetime-local" value="${escapeHtml(formatDateTimeInput(request.verified_at))}" />
          </label>
        </div>
        <label class="single-check">
          <input name="identity_verification_required" type="checkbox" ${request.identity_verification_required ? "checked" : ""} />
          Require ID verification before release or sensitive work
        </label>
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
  renderFounderCommand();
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
  const identityProvider =
    identityProviderLabels[application.identity_verification_provider] ||
    application.identity_verification_provider ||
    "Smile ID";
  const identityStatus =
    identityStatusLabels[application.identity_verification_status] ||
    application.identity_verification_status ||
    "Not started";
  const identityLink = safeHttpUrl(application.identity_verification_link);
  const identityReference = application.identity_verification_reference || "Not recorded";

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
        <div><dt>ID provider</dt><dd>${escapeHtml(identityProvider)}</dd></div>
        <div><dt>ID status</dt><dd>${escapeHtml(identityStatus)}</dd></div>
        <div><dt>ID reference</dt><dd>${escapeHtml(identityReference)}</dd></div>
        <div><dt>ID verified</dt><dd>${application.identity_verified_at ? formatDate(application.identity_verified_at) : "Not verified"}</dd></div>
        <div><dt>Proof consent</dt><dd>${application.proof_standard_consent ? "Yes" : "No"}</dd></div>
        <div><dt>Applied</dt><dd>${formatDate(application.created_at)}</dd></div>
      </dl>

      <div class="verification-panel">
        <span class="status-pill status-${escapeHtml(application.identity_verification_status || "not_started")}">${escapeHtml(identityStatus)}</span>
        <p>Every Kenya-side receiver must complete ID verification before Swadakta can mark them vetted or assign paid work.</p>
        ${
          identityLink
            ? `<a href="${escapeHtml(identityLink)}" target="_blank" rel="noreferrer">Open verification link</a>`
            : "<span>No verification link recorded yet.</span>"
        }
      </div>

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
        <div class="field-row">
          <label class="field-group">
            ID provider
            <select name="identity_verification_provider">${identityProviderOptions(application.identity_verification_provider || "smile_id")}</select>
          </label>
          <label class="field-group">
            ID status
            <select name="identity_verification_status">${identityStatusOptions(application.identity_verification_status || "not_started")}</select>
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Verification link
            <input name="identity_verification_link" type="url" value="${escapeHtml(application.identity_verification_link || "")}" placeholder="https://..." />
          </label>
          <label class="field-group">
            Provider reference
            <input name="identity_verification_reference" type="text" value="${escapeHtml(application.identity_verification_reference || "")}" placeholder="Smile ID job/reference" />
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Verified at
            <input name="identity_verified_at" type="datetime-local" value="${escapeHtml(formatDateTimeInput(application.identity_verified_at))}" />
          </label>
          <label class="field-group">
            Verification notes
            <input name="identity_verification_notes" type="text" value="${escapeHtml(application.identity_verification_notes || "")}" placeholder="Document type, manual review, exception notes" />
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

function renderAccountProfileCard(profile) {
  const identityProvider =
    identityProviderLabels[profile.identity_verification_provider] ||
    profile.identity_verification_provider ||
    "Smile ID";
  const identityStatus =
    identityStatusLabels[profile.identity_verification_status] ||
    profile.identity_verification_status ||
    "Not started";
  const identityLink = safeHttpUrl(profile.identity_verification_link);
  const role = accountRoleLabels[profile.account_role] || profile.account_role || "Client";

  return `
    <article class="request-card account-card" data-user-id="${escapeHtml(profile.user_id)}">
      <header class="request-card-header">
        <div>
          <span class="request-code">${escapeHtml(role)}</span>
          <h2>${escapeHtml(profile.full_name || profile.email)}</h2>
          <p>${escapeHtml(profile.email)} - ${escapeHtml(profile.country || "Country not set")}</p>
        </div>
        <span class="status-pill status-${escapeHtml(profile.identity_verification_status || "not_started")}">${escapeHtml(identityStatus)}</span>
      </header>

      <dl class="request-details">
        <div><dt>WhatsApp</dt><dd>${escapeHtml(profile.whatsapp || "Not provided")}</dd></div>
        <div><dt>Kenya base</dt><dd>${escapeHtml(profile.kenya_base || "Not provided")}</dd></div>
        <div><dt>Currency</dt><dd>${escapeHtml(profile.preferred_currency || "AUD")}</dd></div>
        <div><dt>ID provider</dt><dd>${escapeHtml(identityProvider)}</dd></div>
        <div><dt>ID reference</dt><dd>${escapeHtml(profile.identity_verification_reference || "Not recorded")}</dd></div>
        <div><dt>ID verified</dt><dd>${profile.identity_verified_at ? formatDate(profile.identity_verified_at) : "Not verified"}</dd></div>
        <div><dt>Onboarding</dt><dd>${escapeHtml(profile.onboarding_status || "started")}</dd></div>
        <div><dt>Updated</dt><dd>${formatDate(profile.updated_at)}</dd></div>
      </dl>

      <div class="verification-panel">
        <span class="status-pill status-${escapeHtml(profile.identity_verification_status || "not_started")}">${escapeHtml(identityStatus)}</span>
        <p>Every Swadakta user should verify ID before paid work, milestone releases, or sensitive tasks proceed.</p>
        ${
          identityLink
            ? `<a href="${escapeHtml(identityLink)}" target="_blank" rel="noreferrer">Open account verification link</a>`
            : "<span>No account verification link recorded yet.</span>"
        }
      </div>

      <p class="request-notes">${escapeHtml(profile.profile_notes || "No account notes provided.")}</p>

      <form class="account-verification-form">
        <div class="field-row">
          <label class="field-group">
            ID provider
            <select name="identity_verification_provider">${identityProviderOptions(profile.identity_verification_provider || "smile_id")}</select>
          </label>
          <label class="field-group">
            ID status
            <select name="identity_verification_status">${identityStatusOptions(profile.identity_verification_status || "not_started")}</select>
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Verification link
            <input name="identity_verification_link" type="url" value="${escapeHtml(profile.identity_verification_link || "")}" placeholder="https://..." />
          </label>
          <label class="field-group">
            Provider reference
            <input name="identity_verification_reference" type="text" value="${escapeHtml(profile.identity_verification_reference || "")}" placeholder="Provider job/reference" />
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Verified at
            <input name="identity_verified_at" type="datetime-local" value="${escapeHtml(formatDateTimeInput(profile.identity_verified_at))}" />
          </label>
          <label class="field-group">
            Verification notes
            <input name="identity_verification_notes" type="text" value="${escapeHtml(profile.identity_verification_notes || "")}" placeholder="Document type, review outcome, exception notes" />
          </label>
        </div>
        <div class="form-actions">
          <button class="button button-primary" type="submit">Save account ID</button>
          <span class="copy-status" role="status"></span>
        </div>
      </form>
    </article>
  `;
}

function renderAccountProfiles() {
  if (!accountBoard) {
    return;
  }

  if (!accountProfiles.length) {
    accountBoard.innerHTML = `
      <div class="empty-state">
        <h2>No account profiles yet</h2>
        <p>Signed-in clients and receivers appear here after saving a portal profile.</p>
      </div>
    `;
    return;
  }

  accountBoard.innerHTML = accountProfiles.map(renderAccountProfileCard).join("");
}

async function loadAccountProfiles({ renderPanel = true } = {}) {
  if (!accountBoard) {
    return;
  }

  if (renderPanel) {
    accountBoard.innerHTML = `<div class="empty-state"><h2>Loading account profiles...</h2></div>`;
  }

  try {
    const result = await window.SwadaktaData.listAccountProfiles();
    accountProfiles = result.data || [];
    if (renderPanel) {
      renderAccountProfiles();
    }
  } catch (error) {
    if (renderPanel) {
      accountBoard.innerHTML = `
        <div class="empty-state is-error">
          <h2>Could not load account profiles</h2>
          <p>${escapeHtml(error.message || "Check account profile policies and admin access.")}</p>
        </div>
      `;
    }
  }
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

async function loadFieldUpdates() {
  try {
    const result = await window.SwadaktaData.listFieldUpdates();
    fieldUpdates = result.data || [];
  } catch (error) {
    fieldUpdates = [];
    throw error;
  }
}

async function loadFundMilestones() {
  try {
    const result = await window.SwadaktaData.listFundMilestones();
    fundMilestones = result.data || [];
  } catch (error) {
    fundMilestones = [];
    throw error;
  }
}

function getPartnerApplicationByCard(card) {
  return partnerApplications.find((application) => application.id === card.dataset.id);
}

function getAccountProfileByCard(card) {
  return accountProfiles.find((profile) => profile.user_id === card.dataset.userId);
}

function accountVerificationPayload(form) {
  const formData = new FormData(form);
  const identityStatus = formData.get("identity_verification_status");
  const verifiedAt = formData.get("identity_verified_at");

  return {
    identity_verification_provider: formData.get("identity_verification_provider"),
    identity_verification_status: identityStatus,
    identity_verification_link: safeHttpUrl(formData.get("identity_verification_link")),
    identity_verification_reference: formData.get("identity_verification_reference"),
    identity_verified_at: identityStatus === "verified" ? verifiedAt || new Date().toISOString() : verifiedAt || null,
    identity_verification_notes: formData.get("identity_verification_notes"),
  };
}

function partnerFormPayload(form) {
  const formData = new FormData(form);
  const identityStatus = formData.get("identity_verification_status");
  const verifiedAt = formData.get("identity_verified_at");

  return {
    status: formData.get("status"),
    internal_notes: formData.get("internal_notes"),
    identity_verification_provider: formData.get("identity_verification_provider"),
    identity_verification_status: identityStatus,
    identity_verification_link: safeHttpUrl(formData.get("identity_verification_link")),
    identity_verification_reference: formData.get("identity_verification_reference"),
    identity_verified_at: identityStatus === "verified" ? verifiedAt || new Date().toISOString() : verifiedAt || null,
    identity_verification_notes: formData.get("identity_verification_notes"),
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
      if (accountBoard) {
        accountBoard.innerHTML = `
          <div class="empty-state">
            <h2>Sign in to view account verification</h2>
          </div>
        `;
      }
      if (founderCommand) {
        founderCommand.innerHTML = `
          <div class="empty-state">
            <h2>Sign in to view founder controls</h2>
            <p>Money, release, and margin queues stay behind admin access.</p>
          </div>
        `;
      }
      fieldUpdates = [];
      fundMilestones = [];
      accountProfiles = [];
      return;
    }

    authCard.hidden = true;
    signOutButton.hidden = backendMode !== "supabase";
    const [requestResult] = await Promise.all([
      window.SwadaktaData.listRequests(),
      loadAccountProfiles({ renderPanel: false }),
      loadPartnerApplications({ renderPanel: false }),
      loadFieldUpdates(),
      loadFundMilestones(),
    ]);
    backendMode = requestResult.mode;
    requests = requestResult.data || [];
    renderRequests();
    renderAccountProfiles();
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
    if (accountBoard) {
      accountBoard.innerHTML = "";
    }
    if (founderCommand) {
      founderCommand.innerHTML = `
        <div class="empty-state is-error">
          <h2>Founder controls unavailable</h2>
          <p>${escapeHtml(error.message || "Could not load money and action queues.")}</p>
        </div>
      `;
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
    funds_status: formData.get("funds_status"),
    protected_amount: toMoneyNumber(formData.get("protected_amount")),
    release_condition:
      String(formData.get("release_condition") || "").trim() ||
      "Admin verifies proof and client-safe report before receiver payout.",
    payment_reference: formData.get("payment_reference"),
    release_notes: formData.get("release_notes"),
    identity_verification_required: Boolean(formData.get("identity_verification_required")),
    verification_status: formData.get("verification_status"),
    verification_reason: formData.get("verification_reason"),
    verified_at: formData.get("verified_at") || null,
    operator_payout: toMoneyNumber(formData.get("operator_payout")),
    field_costs: toMoneyNumber(formData.get("field_costs")),
    payment_processing_fee: toMoneyNumber(formData.get("payment_processing_fee")),
    client_report_url: safeHttpUrl(formData.get("client_report_url")),
    proof_links: proofLinks,
  };
}

function milestonePayload(form, request) {
  const formData = new FormData(form);
  const amount = toMoneyNumber(formData.get("amount"));
  const releasedAmount = toMoneyNumber(formData.get("released_amount"));

  return {
    service_request_id: request.id,
    title: String(formData.get("title") || "").trim(),
    amount,
    currency: formData.get("currency") || request.quote_currency || request.preferred_currency || "AUD",
    release_status: formData.get("release_status") || "planned",
    release_trigger:
      String(formData.get("release_trigger") || "").trim() ||
      "Admin verifies milestone proof before release.",
    due_at: formData.get("due_at") || null,
    released_amount: Math.min(releasedAmount, amount),
    released_at: formData.get("released_at") || null,
    provider: formData.get("provider") || "manual",
    provider_reference: formData.get("provider_reference") || "",
    internal_notes: formData.get("internal_notes") || "",
    client_visible: Boolean(formData.get("client_visible")) || form.classList.contains("milestone-create-form"),
  };
}

function buildMilestoneSummary(request) {
  const milestones = getFundMilestonesForRequest(request).filter((milestone) => milestone.client_visible !== false);

  if (!milestones.length) {
    return [];
  }

  return ["Milestone release plan:", ...milestones.map((milestone) => `- ${renderClientMilestoneLine(milestone)}`)];
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
  const fundsLine = `Funds protection: ${fundsStatusLabels[payload.funds_status] || payload.funds_status}; protected amount ${formatMoney(payload.protected_amount, payload.quote_currency)}.`;
  const reportUrlLine = payload.client_report_url ? `Report link: ${payload.client_report_url}` : "";
  const proofLines = payload.proof_links.length ? [`Proof links:`, ...payload.proof_links.map((link) => `- ${link}`)] : [];

  return [
    `Swadakta update for ${request.request_code}`,
    `Status: ${statusLabels[payload.status] || payload.status}`,
    `Payment: ${paymentLabels[payload.payment_status] || payload.payment_status}`,
    quoteLine,
    paymentLine,
    dueLine,
    fundsLine,
    payload.client_report ? `Report: ${payload.client_report}` : "Report: Update pending.",
    reportUrlLine,
    ...buildMilestoneSummary(request),
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
  const fundsLine =
    payload.protected_amount > 0
      ? `Funds protection: ${formatMoney(payload.protected_amount, payload.quote_currency)} will be tracked against milestone release conditions.`
      : "Funds protection: Swadakta will confirm the payment hold/deposit and milestone release process before field work starts.";
  const verificationLine = payload.identity_verification_required
    ? "ID verification may be required before release or sensitive work starts."
    : "ID verification may be requested for higher-risk, high-value, title/document, or authority-sensitive jobs.";

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
    fundsLine,
    verificationLine,
    ...buildMilestoneSummary(request),
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
  const milestoneSummary = getFundMilestonesForRequest(request)
    .map((milestone) => `- ${renderClientMilestoneLine(milestone)}; provider ${milestoneProviderLabels[milestone.provider] || milestone.provider}; trigger: ${milestone.release_trigger}`)
    .join("\n");
  const verificationStatus = verificationStatusLabels[payload.verification_status] || payload.verification_status || "Not required";

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
    `Funds status: ${fundsStatusLabels[payload.funds_status] || payload.funds_status}; protected amount ${formatMoney(payload.protected_amount, payload.quote_currency)}; reference ${payload.payment_reference || "not set"}.`,
    `Release condition: ${payload.release_condition}`,
    `ID verification: ${payload.identity_verification_required ? "required" : "not required"}; status ${verificationStatus}; reason ${payload.verification_reason || "not set"}.`,
    `Founder economics: ${founderMargin}; operator payout ${formatMoney(payload.operator_payout, payload.quote_currency)}; field costs ${formatMoney(payload.field_costs, payload.quote_currency)}; payment fees ${formatMoney(payload.payment_processing_fee, payload.quote_currency)}.`,
    "",
    "Milestone ledger:",
    milestoneSummary || "No milestones set yet.",
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
        ? `Magic link sent. It will open ${new URL(result.redirectTo).origin}.`
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
  const milestoneCreateForm = event.target.closest(".milestone-create-form");
  const milestoneUpdateForm = event.target.closest(".milestone-update-form");
  const card = event.target.closest(".request-card");
  const request = getRequestByCard(card);

  if ((milestoneCreateForm || milestoneUpdateForm) && request) {
    const form = milestoneCreateForm || milestoneUpdateForm;
    const statusElement = form.querySelector(".copy-status");
    const milestoneCard = form.closest(".milestone-item");
    statusElement.textContent = "Saving milestone...";

    try {
      if (milestoneCreateForm) {
        await window.SwadaktaData.createFundMilestone(milestonePayload(form, request));
      } else {
        await window.SwadaktaData.updateFundMilestone(
          milestoneCard.dataset.milestoneId,
          milestonePayload(form, request),
        );
      }
      statusElement.textContent = "Milestone saved.";
      await loadRequests();
    } catch (error) {
      statusElement.textContent = error.message || "Could not save milestone.";
    }
    return;
  }

  const form = event.target.closest(".request-update-form");

  if (!form || !request) {
    return;
  }

  const statusElement = form.querySelector(".copy-status");
  statusElement.textContent = "Saving...";

  try {
    await window.SwadaktaData.updateRequest(request.id, formPayload(form));
    statusElement.textContent = "Saved.";
    await loadRequests();
  } catch (error) {
    statusElement.textContent = error.message || "Could not save.";
  }
});

if (accountBoard) {
  accountBoard.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target.closest(".account-verification-form");
    const card = event.target.closest(".account-card");
    const statusElement = form.querySelector(".copy-status");
    const profile = getAccountProfileByCard(card);

    if (!profile) {
      return;
    }

    statusElement.textContent = "Saving account ID...";

    try {
      await window.SwadaktaData.updateAccountIdentityVerification(
        profile.user_id,
        accountVerificationPayload(form),
      );
      statusElement.textContent = "Account ID saved.";
      await loadAccountProfiles();
    } catch (error) {
      statusElement.textContent = error.message || "Could not save account ID.";
    }
  });
}

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
      const payload = partnerFormPayload(form);
      if (payload.status === "vetted" && !application.id_verification_consent) {
        statusElement.textContent = "Receiver must consent to ID checks before vetting.";
        return;
      }

      if (payload.status === "vetted" && payload.identity_verification_status !== "verified") {
        statusElement.textContent = "Set ID status to Verified before marking receiver as vetted.";
        return;
      }

      await window.SwadaktaData.updatePartnerApplication(application.id, payload);
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
if (founderCommand) {
  founderCommand.addEventListener("click", (event) => {
    const button = event.target.closest(".command-filter");
    if (!button) {
      return;
    }

    actionFilter = button.dataset.actionFilter || "all";
    renderRequests();
  });
}

loadRequests();
