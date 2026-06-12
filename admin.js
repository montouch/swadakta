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
let operationsReadiness = null;
let backendMode = "local";
let actionFilter = "all";

const taskLabels = {
  quick: "Quick errand",
  shopping: "Shopping or sourcing",
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
  wise: "Wise fallback transfer",
  mpesa: "M-Pesa STK or Paybill",
  bank: "Bank transfer or manual receipt",
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
  shopping_sourcing: "Shopping and sourcing - quoted per item",
  monthly_retainer: "Monthly Retainer - from AUD 450/mo",
  business_ops: "Business Ops Support - quoted monthly",
};

const serviceDirectionLabels = {
  origin_to_destination: "Origin to destination",
  destination_to_origin: "Destination to origin",
  two_way: "Two-way corridor",
  local_in_country: "Local in one country",
  digital_global: "Digital/global support",
};

const routeStatusLabels = {
  active: "Active lane",
  pilot: "Pilot lane",
  unsupported: "Founder approval lane",
  blocked: "Blocked",
};

const logisticsModeLabels = {
  not_needed: "No physical delivery",
  local_delivery: "Local delivery or errand",
  postal_courier: "Post or courier shipment",
  pickup_hold: "Pickup and hold",
  supplier_direct: "Supplier ships directly",
  airport_handoff: "Airport/traveller handoff",
  digital_only: "Digital/documents only",
};

const goodsCategoryLabels = {
  none: "No physical goods",
  general_goods: "General goods",
  clothing_household: "Clothing or household items",
  electronics: "Electronics",
  cosmetics: "Cosmetics or personal care",
  food_plant_animal: "Food, plant, or animal product",
  medicine_health: "Medicine or health product",
  documents: "Documents",
  valuable_items: "Valuable items",
  restricted_or_unsure: "Restricted or not sure",
};

const complianceStatusLabels = {
  not_applicable: "Not applicable",
  needs_ai_review: "Needs AI review",
  needs_admin_review: "Needs founder review",
  cleared: "Cleared",
  restricted: "Restricted",
  permit_required: "Permit required",
  prohibited: "Prohibited",
};

const complianceRiskLabels = {
  standard: "Standard",
  medium: "Medium",
  high: "High",
  blocked: "Blocked",
};

const automationStatusLabels = {
  ai_triage: "AI triage",
  self_service: "Self-service",
  receiver_routed: "Receiver routed",
  admin_review: "Founder review",
  founder_approval: "Founder approval",
  blocked: "Blocked",
};

const budgetRangeLabels = {
  unsure: "Not sure yet",
  under_100: "Under AUD 100",
  "100_250": "AUD 100-250",
  "250_500": "AUD 250-500",
  "500_plus": "AUD 500+",
  retainer: "Monthly retainer",
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

function formatDateInput(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
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

function fundsGuardrailLevel(request) {
  const preference = request.funds_protection_preference || "quote_first";
  const valueBand = request.job_value_band || "unsure";

  if (preference === "regulated_escrow" || valueBand === "10000_plus") {
    return "regulated_escrow";
  }

  if (preference === "deposit_milestones" || valueBand === "2000_10000") {
    return "milestone_control";
  }

  return "standard";
}

function needsFundsPlanReview(request) {
  return !isClosedRequest(request) && fundsGuardrailLevel(request) !== "standard";
}

function fundsGuardrailLines(request) {
  const level = fundsGuardrailLevel(request);
  const lines = [];

  if (level === "regulated_escrow") {
    lines.push(
      "Funds guardrail: use a regulated escrow or payment provider for client funds before high-value property, title, supplier, or construction work. Do not hold informal client funds.",
    );
  } else if (level === "milestone_control") {
    lines.push(
      "Funds guardrail: create staged milestones and release receiver money only after Swadakta reviews proof for each milestone.",
    );
  } else {
    lines.push("Funds guardrail: quote first and collect only through a confirmed provider link or recorded transfer.");
  }

  if (request.sensitive_documents_expected) {
    lines.push("Sensitive-doc guardrail: complete client ID verification before paid work, release decisions, or document handling.");
  }

  return lines;
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

function isManualTransferFallback(request) {
  const preference = String(request.payment_method_preference || "").toLowerCase();
  const reference = String(request.payment_reference || "").toLowerCase();
  const link = String(request.payment_link || "").toLowerCase();

  return (
    preference === "bank" ||
    preference === "wise" ||
    reference.includes("wise-") ||
    link.includes("wise.com")
  );
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

function needsComplianceReview(request) {
  return (
    !isClosedRequest(request) &&
    (request.admin_review_required ||
      ["pilot", "unsupported", "blocked"].includes(request.route_status) ||
      ["needs_admin_review", "restricted", "permit_required", "prohibited"].includes(request.compliance_status) ||
      ["high", "blocked"].includes(request.compliance_risk_level))
  );
}

function hasMarginRisk(request) {
  const margin = calculateFounderMargin(request);
  return margin.revenue > 0 && margin.percent < 30 && request.status !== "cancelled";
}

function hasReceiverProvenanceRisk(request) {
  const partner = getPartnerById(request.assigned_partner_id);
  return Boolean(partner && !isClosedRequest(request) && receiverProvenance(partner).score < 45);
}

function buildOpsAiItems() {
  const items = [];

  requests.forEach((request) => {
    if (request.status === "cancelled") {
      return;
    }

    if (needsFundsPlanReview(request)) {
      items.push({
        priority: 95,
        type: "Funds guardrail",
        request,
        action: "Confirm regulated escrow or milestone controls before quoting or starting work.",
        reason: fundsGuardrailLines(request).join(" "),
      });
    }

    if (needsQuoteOrPaymentLink(request)) {
      items.push({
        priority: 85,
        type: "Quote needed",
        request,
        action: "Review scope, price the work, choose payment route, and send a quote.",
        reason: "The request is new, unquoted, or missing a payment link.",
      });
    }

    if (needsIdVerification(request)) {
      items.push({
        priority: 80,
        type: "ID check",
        request,
        action: "Send or review identity verification before paid or sensitive work proceeds.",
        reason: `Current ID status is ${verificationStatusLabels[request.verification_status] || request.verification_status || "not set"}.`,
      });
    }

    if (needsComplianceReview(request)) {
      items.push({
        priority: 78,
        type: "Compliance gate",
        request,
        action: "Review corridor legality, item/shipping rules, required checks, and proof plan before quote, assignment, purchase, or release.",
        reason: [
          routeStatusLabels[request.route_status] || request.route_status || "Route status not set",
          complianceStatusLabels[request.compliance_status] || request.compliance_status || "Compliance not set",
          request.admin_review_reason || "Founder review flag is active.",
        ].join(" - "),
      });
    }

    if (isPaymentOverdue(request)) {
      items.push({
        priority: 75,
        type: "Payment follow-up",
        request,
        action: "Send a polite payment reminder or reset the quote/payment window.",
        reason: `Payment due date ${request.payment_due_at} has passed while payment is still open.`,
      });
    }

    if (hasMarginRisk(request)) {
      items.push({
        priority: 70,
        type: "Margin review",
        request,
        action: "Adjust price, operator payout, field cost, or scope before committing delivery.",
        reason: `Founder margin is ${formatFounderMargin(request)}.`,
      });
    }

    if (hasReceiverProvenanceRisk(request)) {
      const partner = getPartnerById(request.assigned_partner_id);
      const provenance = receiverProvenance(partner);
      items.push({
        priority: 68,
        type: "Receiver seal risk",
        request,
        action: "Review receiver performance before continuing; pause or reassign if the proof trail is weak.",
        reason: `${partner.full_name} has a ${provenance.score}% provenance seal. ${provenance.summary}.`,
      });
    }

    if (isReadyToAssign(request)) {
      items.push({
        priority: 65,
        type: "Assign receiver",
        request,
        action: "Assign a vetted and ID-verified Kenya-side receiver.",
        reason: "Funds are protected or paid, but no receiver is assigned.",
      });
    }

    if (needsProofReview(request)) {
      items.push({
        priority: 60,
        type: "Proof review",
        request,
        action: "Review receiver updates and decide what can be shared with the client.",
        reason: "Receiver updates exist and need admin review before client-facing reporting.",
      });
    }

    if (needsReleaseDecision(request)) {
      items.push({
        priority: 55,
        type: "Release decision",
        request,
        action: "Review milestone proof, then approve release, partial release, refund, or dispute hold.",
        reason: "One or more milestones are waiting for a payout/refund/dispute decision.",
      });
    }
  });

  return items.sort((first, second) => second.priority - first.priority).slice(0, 8);
}

function buildOpsAiPrompt(item) {
  const request = item.request;
  const currency = request.quote_currency || request.preferred_currency || "AUD";
  const assignedPartner = getPartnerById(request.assigned_partner_id);
  const route = `${request.origin_country || "Australia"} to ${request.destination_country || "Kenya"}`;
  const taskLocation = request.task_location || request.kenya_location || "Not specified";
  const receiverLine = assignedPartner
    ? `${assignedPartner.full_name} (${assignedPartner.partner_code}) - seal ${receiverProvenance(assignedPartner).score}%`
    : "Unassigned";

  return [
    "Swadakta Ops AI founder prompt",
    `Request: ${request.request_code}`,
    `Client: ${request.client_name}`,
    `Action needed: ${item.type}`,
    `Recommended next step: ${item.action}`,
    `Reason: ${item.reason}`,
    `Route: ${route}`,
    `Route status: ${routeStatusLabels[request.route_status] || request.route_status || "Active lane"}`,
    `Direction: ${serviceDirectionLabels[request.service_direction] || request.service_direction || "Origin to destination"}`,
    `Task: ${taskLabels[request.task_type] || request.task_type} in ${taskLocation}`,
    `Logistics: ${logisticsModeLabels[request.logistics_mode] || request.logistics_mode || "No physical delivery"}`,
    `Goods: ${goodsCategoryLabels[request.goods_category] || request.goods_category || "No physical goods"}`,
    `Compliance: ${complianceStatusLabels[request.compliance_status] || request.compliance_status || "Needs AI review"}; risk ${complianceRiskLabels[request.compliance_risk_level] || request.compliance_risk_level || "standard"}`,
    `Compliance flags: ${normalizeChecklist(request.compliance_flags).join("; ") || "None"}`,
    `Required checks: ${normalizeChecklist(request.required_checks).join("; ") || "None"}`,
    `Proof requirements: ${normalizeChecklist(request.proof_requirements).join("; ") || "Standard proof"}`,
    `Automation: ${automationStatusLabels[request.automation_status] || request.automation_status || "AI triage"}`,
    `Founder review reason: ${request.admin_review_reason || "None"}`,
    `Quote: ${request.quote_amount ? formatMoney(request.quote_amount, currency) : "not quoted"}`,
    `Payment: ${paymentLabels[request.payment_status] || request.payment_status}; funds ${fundsStatusLabels[request.funds_status] || request.funds_status}`,
    `Receiver: ${receiverLine}`,
    `Value involved: ${jobValueBandLabels[request.job_value_band] || request.job_value_band || "not sure"}`,
    `Funds plan: ${fundsProtectionLabels[request.funds_protection_preference] || request.funds_protection_preference || "quote first"}`,
    `ID status: ${verificationStatusLabels[request.verification_status] || request.verification_status || "not set"}`,
    "",
    "Draft the next safe system action. Let self-serve or receiver-routing continue only if the route, item, money, ID, and proof risks are acceptable. AI/autopilot may prepare payment requests, checklists, quote wording, proof review summaries, and admin notes. Escalate to founder for legal/import-export uncertainty, unsupported corridors, ID issues, disputes, manual payment confirmation, receiver assignment, high-value funds, release decisions, or prohibited/restricted goods.",
  ].join("\n");
}

function matchesActionFilter(request, selectedAction) {
  if (selectedAction === "all") {
    return true;
  }

  const checks = {
    quote: needsQuoteOrPaymentLink,
    funds: needsFundsPlanReview,
    overdue: isPaymentOverdue,
    assign: isReadyToAssign,
    proof: needsProofReview,
    release: needsReleaseDecision,
    id: needsIdVerification,
    compliance: needsComplianceReview,
    margin: hasMarginRisk,
    receiver_risk: hasReceiverProvenanceRisk,
  };

  return checks[selectedAction] ? checks[selectedAction](request) : true;
}

function sumRequests(items, getter) {
  return items.reduce((sum, item) => sum + toMoneyNumber(getter(item)), 0);
}

function sumMilestones(items, getter) {
  return items.reduce((sum, item) => sum + toMoneyNumber(getter(item)), 0);
}

function readinessStatusLabel(status) {
  const labels = {
    ready: "Ready",
    warning: "Check",
    missing: "Missing",
    manual: "Manual",
    blocked: "Blocked",
    pending: "Pending",
  };

  return labels[status] || status || "Unknown";
}

function renderReadinessItem(entry) {
  const missing =
    Array.isArray(entry.missing) && entry.missing.length
      ? `<small>Missing: ${escapeHtml(entry.missing.join(", "))}</small>`
      : "";
  const docsLink = entry.docs_url
    ? `<a class="readiness-link" href="${escapeHtml(entry.docs_url)}" target="_blank" rel="noopener">Open setup docs</a>`
    : "";
  const copyButton = entry.copy_value
    ? `<button class="readiness-copy" type="button" data-copy-readiness="${escapeHtml(entry.id || "")}">Copy value</button>`
    : "";

  return `
    <article class="readiness-item readiness-${escapeHtml(entry.status || "pending")}">
      <header>
        <span>${escapeHtml(readinessStatusLabel(entry.status))}</span>
        <strong>${escapeHtml(entry.label || "Readiness item")}</strong>
      </header>
      <p>${escapeHtml(entry.detail || "No detail provided.")}</p>
      ${entry.next ? `<small>${escapeHtml(entry.next)}</small>` : ""}
      ${missing}
      ${docsLink || copyButton ? `<div class="readiness-actions">${docsLink}${copyButton}</div>` : ""}
    </article>
  `;
}

function flattenReadinessItems() {
  if (!operationsReadiness || operationsReadiness.error) {
    return [];
  }

  return (operationsReadiness.categories || []).flatMap((category) =>
    (category.items || []).map((entry) => ({
      ...entry,
      category: category.label || "Readiness",
    })),
  );
}

function buildReadinessChecklist() {
  if (!operationsReadiness || operationsReadiness.error) {
    return "";
  }

  const counts = operationsReadiness.counts || {};
  const environment = operationsReadiness.environment || {};
  const nextActions = Array.isArray(operationsReadiness.next_actions)
    ? operationsReadiness.next_actions
    : [];
  const safeCopyValues = operationsReadiness.safe_copy_values || {};
  const lines = [
    "Swadakta launch readiness checklist",
    `Generated: ${operationsReadiness.generated_at || new Date().toISOString()}`,
    `Environment: ${environment.vercel_env || "unknown"} / ${environment.public_base_url || "domain unknown"}`,
    `Counts: ${counts.ready || 0} ready, ${counts.warning || 0} check, ${counts.missing || 0} missing, ${counts.manual || 0} manual`,
    "",
    "Next setup actions:",
    ...(nextActions.length
      ? nextActions.map((entry, index) => {
          const missing = Array.isArray(entry.missing) && entry.missing.length ? ` Missing: ${entry.missing.join(", ")}.` : "";
          return `${index + 1}. [${readinessStatusLabel(entry.status)}] ${entry.label}: ${entry.next || "Review setup."}${missing}`;
        })
      : ["1. No missing setup actions returned by the readiness API."]),
    "",
    "Safe callback URLs:",
    ...Object.entries(safeCopyValues).map(([key, value]) => `${key}: ${value}`),
    "",
    "Protected decisions:",
    ...(operationsReadiness.protected_actions || []).map((action) => `- ${action}`),
  ];

  return lines.join("\n");
}

function renderReadinessAction(entry, index) {
  const missing = Array.isArray(entry.missing) && entry.missing.length ? entry.missing.join(", ") : "";
  const docsLink = entry.docs_url
    ? `<a class="readiness-link" href="${escapeHtml(entry.docs_url)}" target="_blank" rel="noopener">Docs</a>`
    : "";
  const copyButton = entry.copy_value
    ? `<button class="readiness-copy" type="button" data-copy-readiness="${escapeHtml(entry.id || "")}">Copy</button>`
    : "";

  return `
    <article class="readiness-next-item readiness-${escapeHtml(entry.status || "pending")}">
      <span>${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
      <div>
        <strong>${escapeHtml(entry.label || "Setup action")}</strong>
        <p>${escapeHtml(entry.next || "Review this setup item.")}</p>
        ${missing ? `<small>Missing: ${escapeHtml(missing)}</small>` : ""}
      </div>
      <div class="readiness-actions">${docsLink}${copyButton}</div>
    </article>
  `;
}

function renderOperationsReadiness() {
  if (!operationsReadiness) {
    return `
      <section class="readiness-panel" aria-label="Operations readiness">
        <div class="founder-command-header">
          <div>
            <p class="eyebrow">Operations readiness</p>
            <h2>Checking payment, AI, domain, and verification setup.</h2>
          </div>
          <span class="mode-badge">Loading</span>
        </div>
        <p class="form-note">The readiness desk loads after admin access is confirmed.</p>
      </section>
    `;
  }

  if (operationsReadiness.error) {
    return `
      <section class="readiness-panel" aria-label="Operations readiness">
        <div class="founder-command-header">
          <div>
            <p class="eyebrow">Operations readiness</p>
            <h2>Readiness check needs attention.</h2>
          </div>
          <span class="mode-badge">Unavailable</span>
        </div>
        <p class="form-note">${escapeHtml(operationsReadiness.error)}</p>
      </section>
    `;
  }

  const counts = operationsReadiness.counts || {};
  const categories = Array.isArray(operationsReadiness.categories) ? operationsReadiness.categories : [];
  const protectedActions = Array.isArray(operationsReadiness.protected_actions)
    ? operationsReadiness.protected_actions
    : [];
  const nextActions = Array.isArray(operationsReadiness.next_actions)
    ? operationsReadiness.next_actions
    : [];
  const generatedAt = operationsReadiness.generated_at ? formatDate(operationsReadiness.generated_at) : "just now";
  const environment = operationsReadiness.environment || {};
  const categoryHtml = categories
    .map(
      (category) => `
        <section class="readiness-category">
          <div class="readiness-category-header">
            <strong>${escapeHtml(category.label || "Readiness")}</strong>
            <span>${escapeHtml(String((category.items || []).length))} checks</span>
          </div>
          <div class="readiness-list">
            ${(category.items || []).map(renderReadinessItem).join("")}
          </div>
        </section>
      `,
    )
    .join("");

  return `
    <section class="readiness-panel" aria-label="Operations readiness">
      <div class="founder-command-header">
        <div>
          <p class="eyebrow">Operations readiness</p>
          <h2>What is ready to make money safely.</h2>
          <p class="form-note">Updated ${escapeHtml(generatedAt)}. Environment: ${escapeHtml(environment.vercel_env || "unknown")} / ${escapeHtml(environment.public_base_url || "domain unknown")}.</p>
        </div>
        <div class="readiness-header-actions">
          <span class="mode-badge">${escapeHtml((counts.missing || 0) ? `${counts.missing} missing` : "Launch rails checked")}</span>
          <button class="button button-secondary" type="button" data-copy-readiness-checklist>Copy launch checklist</button>
        </div>
      </div>
      <div class="readiness-summary" aria-label="Readiness summary">
        <article class="readiness-ready"><strong>${escapeHtml(String(counts.ready || 0))}</strong><span>Ready</span></article>
        <article class="readiness-warning"><strong>${escapeHtml(String(counts.warning || 0))}</strong><span>Check</span></article>
        <article class="readiness-missing"><strong>${escapeHtml(String(counts.missing || 0))}</strong><span>Missing</span></article>
        <article class="readiness-manual"><strong>${escapeHtml(String(counts.manual || 0))}</strong><span>Manual rails</span></article>
      </div>
      ${
        nextActions.length
          ? `<section class="readiness-next" aria-label="Next setup actions">
              <div class="readiness-category-header">
                <strong>Next setup actions</strong>
                <span>${escapeHtml(String(nextActions.length))} priorities</span>
              </div>
              <div class="readiness-next-list">
                ${nextActions.map(renderReadinessAction).join("")}
              </div>
            </section>`
          : ""
      }
      ${categoryHtml}
      ${
        protectedActions.length
          ? `<div class="protected-actions"><strong>Protected decisions</strong><ul>${protectedActions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul></div>`
          : ""
      }
      <span class="copy-status" id="readiness-status" role="status"></span>
    </section>
  `;
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
    funds: requests.filter(needsFundsPlanReview).length,
    overdue: requests.filter(isPaymentOverdue).length,
    assign: requests.filter(isReadyToAssign).length,
    proof: requests.filter(needsProofReview).length,
    release: requests.filter(needsReleaseDecision).length,
    id: requests.filter(needsIdVerification).length,
    compliance: requests.filter(needsComplianceReview).length,
    margin: requests.filter(hasMarginRisk).length,
    receiver_risk: requests.filter(hasReceiverProvenanceRisk).length,
  };
  const actionTotal =
    actionCounts.quote +
    actionCounts.funds +
    actionCounts.overdue +
    actionCounts.assign +
    actionCounts.proof +
    actionCounts.release +
    actionCounts.id +
    actionCounts.compliance +
    actionCounts.margin +
    actionCounts.receiver_risk;

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
    ["funds", "Funds plan", "Escrow or milestone guardrail"],
    ["overdue", "Overdue pay", "Chase payment"],
    ["assign", "Assign receiver", "Paid/protected, no receiver"],
    ["proof", "Review proof", "Receiver update waiting"],
    ["release", "Release decision", "Pay/refund/dispute milestone"],
    ["id", "ID check", "Verification not done"],
    ["compliance", "Compliance", "Route or legal gate"],
    ["margin", "Margin risk", "Below 30%"],
    ["receiver_risk", "Seal risk", "Assigned receiver below 45%"],
  ];
  const opsAiItems = buildOpsAiItems();
  const opsAiList = opsAiItems
    .map(
      (item, index) => `
        <article class="ops-ai-item">
          <header>
            <span class="request-code">${escapeHtml(item.type)}</span>
            <strong>${escapeHtml(item.request.request_code)} - ${escapeHtml(item.request.client_name || "Client")}</strong>
          </header>
          <p>${escapeHtml(item.action)}</p>
          <small>${escapeHtml(item.reason)}</small>
          <div class="form-actions">
            <button class="button button-secondary" type="button" data-copy-ops-ai="${index}">Copy founder prompt</button>
            <button class="button button-secondary" type="button" data-run-ops-ai="${index}">Ask AI for draft</button>
            <button class="button button-secondary" type="button" data-save-ops-ai="${index}">Save draft to notes</button>
          </div>
          <textarea class="ops-ai-output" rows="4" readonly placeholder="AI draft appears here after founder/admin asks."></textarea>
        </article>
      `,
    )
    .join("");

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
    ${renderOperationsReadiness()}
    <section class="ops-ai-panel" aria-label="Swadakta Ops AI">
      <div class="founder-command-header">
        <div>
          <p class="eyebrow">Swadakta Ops AI</p>
          <h2>Founder prompts that reduce manual load.</h2>
        </div>
        <span class="mode-badge">${escapeHtml(opsAiItems.length ? `${opsAiItems.length} prompts` : "Clear")}</span>
      </div>
      <p class="form-note">Hardwired triage drafts the next admin prompt. It does not contact clients, assign receivers, or release funds without founder approval.</p>
      <p class="form-note">Use per-request safe autopilot to let the system save routine triage, quote readiness, payment-request prep, due dates, proof checklists, and internal notes. Protected decisions remain locked to founder/admin approval.</p>
      <div class="ops-ai-list">
        ${opsAiList || `<p class="form-note">No urgent prompts right now. New requests, payment gaps, ID checks, proof reviews, and release decisions will appear here.</p>`}
      </div>
      <span class="copy-status" id="ops-ai-status" role="status"></span>
    </section>
  `;
  founderCommand.dataset.readinessItems = JSON.stringify(
    flattenReadinessItems()
      .filter((entry) => entry.copy_value)
      .map((entry) => ({
        id: entry.id,
        label: entry.label,
        copy_value: entry.copy_value,
      })),
  );
  founderCommand.dataset.readinessChecklist = buildReadinessChecklist();
  founderCommand.dataset.opsAiItems = JSON.stringify(
    opsAiItems.map((item) => ({
      requestId: item.request.id,
      type: item.type,
      requestCode: item.request.request_code,
      prompt: buildOpsAiPrompt(item),
      payload: {
        role: "admin",
        task: item.action,
        context: {
          type: item.type,
          request_code: item.request.request_code,
          client_name: item.request.client_name,
          origin_country: item.request.origin_country,
          destination_country: item.request.destination_country,
          service_direction: item.request.service_direction,
          route_status: item.request.route_status,
          task_type: item.request.task_type,
          task_location: item.request.task_location || item.request.kenya_location,
          kenya_location: item.request.kenya_location,
          logistics_mode: item.request.logistics_mode,
          goods_category: item.request.goods_category,
          compliance_flags: item.request.compliance_flags,
          required_checks: item.request.required_checks,
          proof_requirements: item.request.proof_requirements,
          compliance_status: item.request.compliance_status,
          compliance_risk_level: item.request.compliance_risk_level,
          automation_status: item.request.automation_status,
          admin_review_required: item.request.admin_review_required,
          admin_review_reason: item.request.admin_review_reason,
          status: item.request.status,
          payment_status: item.request.payment_status,
          quote_amount: item.request.quote_amount,
          quote_currency: item.request.quote_currency,
          funds_status: item.request.funds_status,
          job_value_band: item.request.job_value_band,
          funds_protection_preference: item.request.funds_protection_preference,
          verification_status: item.request.verification_status,
          assigned_receiver: assignedPartnerLabel(item.request),
          reason: item.reason,
        },
      },
    })),
  );
}

function compactAdminRequest(request) {
  return {
    request_code: request.request_code,
    client_name: request.client_name,
    origin_country: request.origin_country,
    destination_country: request.destination_country,
    task_type: request.task_type,
    task_location: request.task_location || request.kenya_location,
    status: request.status,
    payment_status: request.payment_status,
    funds_status: request.funds_status,
    quote_amount: request.quote_amount,
    quote_currency: request.quote_currency,
    job_value_band: request.job_value_band,
    funds_protection_preference: request.funds_protection_preference,
    verification_status: request.verification_status,
    compliance_status: request.compliance_status,
    compliance_risk_level: request.compliance_risk_level,
    automation_status: request.automation_status,
    assigned_receiver: assignedPartnerLabel(request),
    updated_at: request.updated_at,
  };
}

window.SwadaktaAdminContext = function swadaktaAdminContext() {
  const openRequests = requests.filter((request) => request.status !== "cancelled");
  const opsItems = buildOpsAiItems();

  return {
    page: "Founder console",
    summary: {
      total_requests: requests.length,
      open_requests: openRequests.length,
      payment_gaps: requests.filter(needsQuoteOrPaymentLink).length + requests.filter(isPaymentOverdue).length,
      id_gaps: requests.filter(needsIdVerification).length,
      proof_gaps: requests.filter(needsProofReview).length,
      release_decisions: requests.filter(needsReleaseDecision).length,
      receiver_applications: partnerApplications.length,
      account_profiles: accountProfiles.length,
      field_updates: fieldUpdates.length,
      fund_milestones: fundMilestones.length,
    },
    urgent_prompts: opsItems.slice(0, 6).map((item) => ({
      type: item.type,
      request_code: item.request.request_code,
      action: item.action,
      reason: item.reason,
    })),
    recent_requests: requests.slice(0, 6).map(compactAdminRequest),
    receiver_pipeline: partnerApplications.slice(0, 6).map((application) => ({
      partner_code: application.partner_code,
      status: application.status,
      identity_verification_status: application.identity_verification_status,
      provenance_score: application.provenance_score,
      service_regions: application.service_regions,
      updated_at: application.updated_at,
    })),
  };
};

async function saveOpsAiDraftToNotes(item, draft) {
  const request = requests.find(
    (candidate) => candidate.id === item.requestId || candidate.request_code === item.requestCode,
  );
  const cleanDraft = String(draft || "").trim();

  if (!request) {
    throw new Error("Request not found for this AI draft.");
  }

  if (!cleanDraft) {
    throw new Error("Ask AI for a draft first.");
  }

  const savedAt = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const existingNotes = String(request.operator_notes || "").trim();
  const aiNote = [
    `[AI ops note saved ${savedAt}]`,
    `Queue: ${item.type}`,
    `Request: ${item.requestCode}`,
    cleanDraft,
  ].join("\n");

  await window.SwadaktaData.updateRequest(request.id, {
    ...request,
    operator_notes: existingNotes ? `${existingNotes}\n\n${aiNote}` : aiNote,
  });

  await loadRequests();
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
      request.origin_country,
      request.destination_country,
      serviceDirectionLabels[request.service_direction] || request.service_direction,
      routeStatusLabels[request.route_status] || request.route_status,
      request.task_location,
      request.kenya_location,
      request.client_base,
      request.australia_location,
      request.local_contact_name,
      request.local_contact_phone,
      request.contact_preference,
      request.contact_window,
      logisticsModeLabels[request.logistics_mode] || request.logistics_mode,
      goodsCategoryLabels[request.goods_category] || request.goods_category,
      complianceStatusLabels[request.compliance_status] || request.compliance_status,
      complianceRiskLabels[request.compliance_risk_level] || request.compliance_risk_level,
      automationStatusLabels[request.automation_status] || request.automation_status,
      normalizeChecklist(request.compliance_flags).join(" "),
      normalizeChecklist(request.required_checks).join(" "),
      normalizeChecklist(request.proof_requirements).join(" "),
      request.admin_review_reason,
      request.logistics_notes,
      assignedPartnerLabel(request),
      servicePackageLabels[request.service_package] || request.service_package,
      paymentMethodLabels[request.payment_method_preference] || request.payment_method_preference,
      jobValueBandLabels[request.job_value_band] || request.job_value_band,
      fundsProtectionLabels[request.funds_protection_preference] || request.funds_protection_preference,
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

function serviceDirectionOptions(current) {
  return Object.entries(serviceDirectionLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function routeStatusOptions(current) {
  return Object.entries(routeStatusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function logisticsModeOptions(current) {
  return Object.entries(logisticsModeLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function goodsCategoryOptions(current) {
  return Object.entries(goodsCategoryLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function complianceStatusOptions(current) {
  return Object.entries(complianceStatusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function complianceRiskOptions(current) {
  return Object.entries(complianceRiskLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function automationStatusOptions(current) {
  return Object.entries(automationStatusLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function jobValueBandOptions(current) {
  return Object.entries(jobValueBandLabels)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}

function fundsProtectionOptions(current) {
  return Object.entries(fundsProtectionLabels)
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

function requestIdsForPartner(application) {
  return new Set(
    requests
      .filter((request) => request.assigned_partner_id === application.id)
      .map((request) => request.id),
  );
}

function receiverProvenance(application) {
  const assignedRequests = requests.filter((request) => request.assigned_partner_id === application.id);
  const assignedIds = requestIdsForPartner(application);
  const updates = fieldUpdates.filter((update) => update.partner_application_id === application.id);
  const relatedMilestones = fundMilestones.filter((milestone) => assignedIds.has(milestone.service_request_id));
  const completedJobs = assignedRequests.filter((request) => request.status === "completed").length;
  const cancelledJobs = assignedRequests.filter((request) => request.status === "cancelled").length;
  const reviewedJobs = assignedRequests.filter((request) => Number(request.client_review_score || 0) > 0);
  const lowReviewJobs = reviewedJobs.filter((request) => Number(request.client_review_score || 0) <= 2).length;
  const averageReview =
    reviewedJobs.length > 0
      ? reviewedJobs.reduce((sum, request) => sum + Number(request.client_review_score || 0), 0) / reviewedJobs.length
      : null;
  const completedUpdates = updates.filter((update) => update.field_status === "completed").length;
  const blockedUpdates = updates.filter((update) => update.field_status === "blocked").length;
  const adminEscalations = updates.filter((update) => update.field_status === "needs_admin").length;
  const safetyIssues = updates.filter((update) => update.field_status === "safety_issue").length;
  const disputedMilestones = relatedMilestones.filter((milestone) =>
    ["disputed", "refund_pending", "refunded"].includes(milestone.release_status),
  ).length;

  const base = clampScore(application.provenance_score ?? 25);
  const identityBonus = application.identity_verification_status === "verified" ? 20 : 0;
  const vettedBonus = application.status === "vetted" ? 10 : 0;
  const proofBonus = application.proof_standard_consent ? 5 : 0;
  const completionBonus = Math.min(completedJobs * 5, 25);
  const updateBonus = Math.min(completedUpdates * 3, 15);
  const reviewBonus = averageReview ? Math.round((averageReview - 3) * 10) : 0;
  const lowReviewPenalty = lowReviewJobs * 12;
  const penalties =
    cancelledJobs * 15 +
    blockedUpdates * 10 +
    adminEscalations * 8 +
    safetyIssues * 22 +
    disputedMilestones * 18 +
    lowReviewPenalty;
  const score = clampScore(
    base + identityBonus + vettedBonus + proofBonus + completionBonus + updateBonus + reviewBonus - penalties,
  );

  return {
    score,
    base,
    band: provenanceBand(score),
    label: provenanceLabel(score),
    completedJobs,
    completedUpdates,
    blockedUpdates,
    adminEscalations,
    safetyIssues,
    disputedMilestones,
    averageReview,
    reviewedJobs: reviewedJobs.length,
    lowReviewJobs,
    summary: [
      `Base ${base}%`,
      identityBonus ? "ID +20" : "ID pending",
      vettedBonus ? "vetted +10" : "not vetted",
      completedJobs ? `${completedJobs} completed job${completedJobs === 1 ? "" : "s"}` : "no completed jobs",
      averageReview ? `client rating ${averageReview.toFixed(1)}/5` : "no client ratings",
      lowReviewJobs ? `${lowReviewJobs} low review${lowReviewJobs === 1 ? "" : "s"}` : "no low reviews",
      penalties ? `issues -${penalties}` : "clean issue record",
    ].join(" / "),
  };
}

function clientProvenance(profile) {
  const profileEmail = String(profile.email || "").trim().toLowerCase();
  const clientRequests = requests.filter(
    (request) => String(request.email || "").trim().toLowerCase() === profileEmail && profileEmail,
  );
  const completedRequests = clientRequests.filter((request) => request.status === "completed").length;
  const fundedRequests = clientRequests.filter((request) =>
    ["deposit_paid", "paid"].includes(request.payment_status),
  ).length;
  const cancelledRequests = clientRequests.filter((request) => request.status === "cancelled").length;
  const refundedRequests = clientRequests.filter((request) => request.payment_status === "refunded").length;
  const disputedMilestones = fundMilestones.filter((milestone) => {
    const request = requests.find((item) => item.id === milestone.service_request_id);
    return (
      request &&
      String(request.email || "").trim().toLowerCase() === profileEmail &&
      ["disputed", "refund_pending", "refunded"].includes(milestone.release_status)
    );
  }).length;
  const identityBonus = profile.identity_verification_status === "verified" ? 20 : 0;
  const profileBonus = profile.onboarding_status === "profile_complete" || profile.onboarding_status === "verified" ? 10 : 0;
  const completionBonus = Math.min(completedRequests * 5, 20);
  const fundedBonus = Math.min(fundedRequests * 5, 20);
  const penalties = cancelledRequests * 8 + refundedRequests * 8 + disputedMilestones * 12;
  const score = clampScore(25 + identityBonus + profileBonus + completionBonus + fundedBonus - penalties);

  return {
    score,
    band: provenanceBand(score),
    label: provenanceLabel(score),
    summary: `${clientRequests.length} request${clientRequests.length === 1 ? "" : "s"} / ${fundedRequests} funded / ${completedRequests} completed`,
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
  const provenance = receiverProvenance(application);

  return `${application.full_name} (${application.partner_code}) - Seal ${provenance.score}% - ${application.kenya_base || "Kenya"} - ${partnerStatusLabels[application.status] || application.status} - ID ${identityStatus} - ${categories}`;
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
    .sort((first, second) => receiverProvenance(second).score - receiverProvenance(first).score)
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

function normalizeChecklist(items) {
  return Array.isArray(items) ? items.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

function checklistTextareaValue(items) {
  return normalizeChecklist(items).join("\n");
}

function parseChecklist(value) {
  return Array.from(new Set(
    String(value || "")
      .split(/\n/)
      .map((item) => item.trim())
      .filter(Boolean),
  )).slice(0, 20);
}

function renderChecklistBlock(title, items) {
  const list = normalizeChecklist(items);
  if (!list.length) {
    return "";
  }

  return `
    <div class="request-checklist">
      <strong>${escapeHtml(title)}</strong>
      <ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function renderRequestCard(request) {
  const reports = Array.isArray(request.report_pack) ? request.report_pack.join(", ") : "";
  const taskLocation = request.task_location || request.kenya_location || "Not specified";
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
  const originCountry = request.origin_country || "Australia";
  const destinationCountry = request.destination_country || "Kenya";
  const taskLocation = request.task_location || request.kenya_location || "Not specified";
  const serviceDirection =
    serviceDirectionLabels[request.service_direction] || request.service_direction || "Origin to destination";
  const routeStatus = routeStatusLabels[request.route_status] || request.route_status || "Active lane";
  const logisticsMode = logisticsModeLabels[request.logistics_mode] || request.logistics_mode || "No physical delivery";
  const goodsCategory = goodsCategoryLabels[request.goods_category] || request.goods_category || "No physical goods";
  const complianceStatus =
    complianceStatusLabels[request.compliance_status] || request.compliance_status || "Needs AI review";
  const complianceRisk =
    complianceRiskLabels[request.compliance_risk_level] || request.compliance_risk_level || "Standard";
  const automationStatus =
    automationStatusLabels[request.automation_status] || request.automation_status || "AI triage";
  const localContact = [request.local_contact_name, request.local_contact_phone].filter(Boolean).join(" / ") || "Not provided";
  const quoteCurrency = request.quote_currency || request.preferred_currency || "AUD";
  const servicePackage =
    servicePackageLabels[request.service_package] || request.service_package || "Help me choose the right package";
  const paymentMethod =
    paymentMethodLabels[request.payment_method_preference] || request.payment_method_preference || "Recommend after quote";
  const jobValueBand = jobValueBandLabels[request.job_value_band] || request.job_value_band || "Not sure yet";
  const fundsPreference =
    fundsProtectionLabels[request.funds_protection_preference] ||
    request.funds_protection_preference ||
    "Quote first, then decide";
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
  const clientReview = request.client_review_score
    ? `${request.client_review_score}/5${request.client_review_note ? ` - ${request.client_review_note}` : ""}`
    : "Not reviewed";
  const manualTransferFallback = isManualTransferFallback(request);
  const manualTransferActions = manualTransferFallback
    ? `
          <button class="button button-secondary create-wise-request" type="button">Fallback Wise request</button>
          <button class="button button-secondary reconcile-payment-receipt" type="button">AI receipt check</button>
        `
    : "";

  return `
    <article class="request-card" data-id="${escapeHtml(request.id)}">
      <header class="request-card-header">
        <div>
          <span class="request-code">${escapeHtml(request.request_code)}</span>
          <h2>${escapeHtml(request.client_name)}</h2>
          <p>${escapeHtml(originCountry)} to ${escapeHtml(destinationCountry)} - ${escapeHtml(taskLabels[request.task_type] || request.task_type)} in ${escapeHtml(taskLocation)}</p>
        </div>
        <span class="status-pill status-${escapeHtml(request.status)}">${escapeHtml(statusLabels[request.status] || request.status)}</span>
      </header>

      <dl class="request-details">
        <div><dt>WhatsApp</dt><dd>${escapeHtml(request.whatsapp)}</dd></div>
        <div><dt>Email</dt><dd>${escapeHtml(request.email || "Not provided")}</dd></div>
        <div><dt>Client base</dt><dd>${escapeHtml(clientBase)}</dd></div>
        <div><dt>Corridor</dt><dd>${escapeHtml(`${originCountry} -> ${destinationCountry}`)}</dd></div>
        <div><dt>Direction</dt><dd>${escapeHtml(serviceDirection)}</dd></div>
        <div><dt>Route status</dt><dd>${escapeHtml(routeStatus)}</dd></div>
        <div><dt>Task location</dt><dd>${escapeHtml(taskLocation)}</dd></div>
        <div><dt>Logistics</dt><dd>${escapeHtml(logisticsMode)}</dd></div>
        <div><dt>Goods</dt><dd>${escapeHtml(goodsCategory)}</dd></div>
        <div><dt>Automation</dt><dd>${escapeHtml(automationStatus)}</dd></div>
        <div><dt>Compliance</dt><dd>${escapeHtml(`${complianceStatus} - ${complianceRisk}`)}</dd></div>
        <div><dt>Urgency</dt><dd>${escapeHtml(request.urgency)}</dd></div>
        <div><dt>Deadline</dt><dd>${escapeHtml(request.deadline || "Flexible")}</dd></div>
        <div><dt>Task contact</dt><dd>${escapeHtml(localContact)}</dd></div>
        <div><dt>Contact pref</dt><dd>${escapeHtml(contactPreference)}</dd></div>
        <div><dt>Receiver</dt><dd>${escapeHtml(assignedPartner)}</dd></div>
        <div><dt>Package</dt><dd>${escapeHtml(servicePackage)}</dd></div>
        <div><dt>Pay method</dt><dd>${escapeHtml(paymentMethod)}</dd></div>
        <div><dt>Value involved</dt><dd>${escapeHtml(jobValueBand)}</dd></div>
        <div><dt>Funds plan</dt><dd>${escapeHtml(fundsPreference)}</dd></div>
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
        <div><dt>Client review</dt><dd>${escapeHtml(clientReview)}</dd></div>
        <div><dt>Payment due</dt><dd>${escapeHtml(request.payment_due_at || "Not set")}</dd></div>
        <div><dt>Consent</dt><dd>${escapeHtml(consentStatus)}</dd></div>
        <div><dt>Created</dt><dd>${formatDate(request.created_at)}</dd></div>
      </dl>

      <p class="request-notes">${escapeHtml(request.notes)}</p>
      ${request.logistics_notes ? `<p class="request-notes"><strong>Logistics:</strong> ${escapeHtml(request.logistics_notes)}</p>` : ""}
      ${renderChecklistBlock("Compliance flags", request.compliance_flags)}
      ${renderChecklistBlock("Required checks", request.required_checks)}
      ${renderChecklistBlock("Proof requirements", request.proof_requirements)}
      ${
        request.admin_review_required || request.admin_review_reason
          ? `<p class="request-notes"><strong>Founder review:</strong> ${escapeHtml(request.admin_review_reason || "Required by automation state.")}</p>`
          : ""
      }
      <div class="verification-panel">
        <span class="status-pill status-${escapeHtml(fundsGuardrailLevel(request))}">${escapeHtml(fundsGuardrailLevel(request) === "regulated_escrow" ? "Escrow review" : fundsGuardrailLevel(request) === "milestone_control" ? "Milestone control" : "Standard funds")}</span>
        ${fundsGuardrailLines(request).map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
      </div>
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
            Origin
            <input name="origin_country" type="text" value="${escapeHtml(originCountry)}" />
          </label>
          <label class="field-group">
            Destination
            <input name="destination_country" type="text" value="${escapeHtml(destinationCountry)}" />
          </label>
          <label class="field-group">
            Direction
            <select name="service_direction">${serviceDirectionOptions(request.service_direction || "origin_to_destination")}</select>
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Route status
            <select name="route_status">${routeStatusOptions(request.route_status || "active")}</select>
          </label>
          <label class="field-group">
            Logistics
            <select name="logistics_mode">${logisticsModeOptions(request.logistics_mode || "not_needed")}</select>
          </label>
          <label class="field-group">
            Goods category
            <select name="goods_category">${goodsCategoryOptions(request.goods_category || "none")}</select>
          </label>
          <label class="field-group">
            Automation
            <select name="automation_status">${automationStatusOptions(request.automation_status || "ai_triage")}</select>
          </label>
        </div>
        <div class="field-row">
          <label class="field-group">
            Compliance
            <select name="compliance_status">${complianceStatusOptions(request.compliance_status || "needs_ai_review")}</select>
          </label>
          <label class="field-group">
            Risk
            <select name="compliance_risk_level">${complianceRiskOptions(request.compliance_risk_level || "standard")}</select>
          </label>
          <label class="field-group">
            Task location
            <input name="task_location" type="text" value="${escapeHtml(taskLocation)}" />
          </label>
        </div>
        <label class="field-group">
          Logistics/compliance notes
          <textarea name="logistics_notes" rows="3">${escapeHtml(request.logistics_notes || "")}</textarea>
        </label>
        <div class="field-row">
          <label class="field-group">
            Compliance flags
            <textarea name="compliance_flags" rows="3" placeholder="One flag per line">${escapeHtml(checklistTextareaValue(request.compliance_flags))}</textarea>
          </label>
          <label class="field-group">
            Required checks
            <textarea name="required_checks" rows="3" placeholder="One required check per line">${escapeHtml(checklistTextareaValue(request.required_checks))}</textarea>
          </label>
        </div>
        <label class="field-group">
          Proof requirements
          <textarea name="proof_requirements" rows="3" placeholder="One proof requirement per line">${escapeHtml(checklistTextareaValue(request.proof_requirements))}</textarea>
        </label>
        <label class="field-group">
          Founder review reason
          <input name="admin_review_reason" type="text" value="${escapeHtml(request.admin_review_reason || "")}" />
        </label>
        <label class="single-check">
          <input name="admin_review_required" type="checkbox" ${request.admin_review_required ? "checked" : ""} />
          Founder review required before quoting, assigning, buying, shipping, or releasing funds
        </label>
        <div class="field-row">
          <label class="field-group">
            Service package
            <select name="service_package">${servicePackageOptions(request.service_package || "quote_first")}</select>
          </label>
          <label class="field-group">
            Value involved
            <select name="job_value_band">${jobValueBandOptions(request.job_value_band || "unsure")}</select>
          </label>
          <label class="field-group">
            Funds preference
            <select name="funds_protection_preference">${fundsProtectionOptions(request.funds_protection_preference || "quote_first")}</select>
          </label>
        </div>
        <div class="field-row">
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
          <button class="button button-secondary run-safe-autopilot" type="button">Run safe autopilot</button>
          <button class="button button-secondary create-stripe-checkout" type="button">Generate Stripe checkout</button>
          <button class="button button-secondary create-paypal-order" type="button">Generate PayPal order</button>
          ${manualTransferActions}
          <button class="button button-secondary capture-paypal-order" type="button">Capture PayPal order</button>
          <button class="button button-secondary create-mpesa-stk" type="button">Send M-Pesa STK</button>
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
  const provenance = receiverProvenance(application);

  return `
    <article class="request-card partner-card" data-id="${escapeHtml(application.id)}">
      <header class="request-card-header">
        <div>
          <span class="request-code">${escapeHtml(application.partner_code)}</span>
          <h2>${escapeHtml(application.full_name)}</h2>
          <p>${escapeHtml(application.kenya_base)} - ${escapeHtml(categories)}</p>
        </div>
        <div class="header-stack">
          <span class="status-pill status-${escapeHtml(application.status)}">${escapeHtml(partnerStatusLabels[application.status] || application.status)}</span>
          ${renderProvenanceSeal(provenance)}
        </div>
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
        <div><dt>Provenance</dt><dd>${escapeHtml(provenance.summary)}</dd></div>
        <div><dt>Seal reviewed</dt><dd>${application.provenance_reviewed_at ? formatDate(application.provenance_reviewed_at) : "Not reviewed"}</dd></div>
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

      <div class="provenance-panel provenance-${escapeHtml(provenance.band)}">
        <strong>Receiver provenance review</strong>
        <p>${escapeHtml(provenance.summary)}</p>
        <span>${escapeHtml(application.provenance_notes || "No manual provenance review notes yet.")}</span>
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
        <div class="field-row">
          <label class="field-group">
            Provenance base score
            <input name="provenance_score" type="number" min="0" max="100" step="1" value="${escapeHtml(application.provenance_score ?? 25)}" />
          </label>
          <label class="field-group">
            Provenance review notes
            <input name="provenance_notes" type="text" value="${escapeHtml(application.provenance_notes || "")}" placeholder="Clean delivery, late proof, client complaint, safety concern..." />
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

  partnerBoard.innerHTML = [...partnerApplications]
    .sort((first, second) => receiverProvenance(second).score - receiverProvenance(first).score)
    .map(renderPartnerApplication)
    .join("");
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
  const provenance = clientProvenance(profile);

  return `
    <article class="request-card account-card" data-user-id="${escapeHtml(profile.user_id)}">
      <header class="request-card-header">
        <div>
          <span class="request-code">${escapeHtml(role)}</span>
          <h2>${escapeHtml(profile.full_name || profile.email)}</h2>
          <p>${escapeHtml(profile.email)} - ${escapeHtml(profile.country || "Country not set")}</p>
        </div>
        <div class="header-stack">
          <span class="status-pill status-${escapeHtml(profile.identity_verification_status || "not_started")}">${escapeHtml(identityStatus)}</span>
          ${renderProvenanceSeal(provenance, { subtle: true, title: "Client Seal" })}
        </div>
      </header>

      <dl class="request-details">
        <div><dt>WhatsApp</dt><dd>${escapeHtml(profile.whatsapp || "Not provided")}</dd></div>
        <div><dt>Kenya base</dt><dd>${escapeHtml(profile.kenya_base || "Not provided")}</dd></div>
        <div><dt>Currency</dt><dd>${escapeHtml(profile.preferred_currency || "AUD")}</dd></div>
        <div><dt>ID provider</dt><dd>${escapeHtml(identityProvider)}</dd></div>
        <div><dt>ID reference</dt><dd>${escapeHtml(profile.identity_verification_reference || "Not recorded")}</dd></div>
        <div><dt>ID verified</dt><dd>${profile.identity_verified_at ? formatDate(profile.identity_verified_at) : "Not verified"}</dd></div>
        <div><dt>Onboarding</dt><dd>${escapeHtml(profile.onboarding_status || "started")}</dd></div>
        <div><dt>Client provenance</dt><dd>${escapeHtml(provenance.summary)}</dd></div>
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
    provenance_score: clampScore(formData.get("provenance_score") || 25),
    provenance_notes: formData.get("provenance_notes"),
    provenance_reviewed_at: new Date().toISOString(),
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
      operationsReadiness = null;
      return;
    }

    authCard.hidden = true;
    signOutButton.hidden = backendMode !== "supabase";
    const [requestResult, readinessResult] = await Promise.all([
      window.SwadaktaData.listRequests(),
      window.SwadaktaData.getOperationsReadiness().catch((error) => ({
        data: { error: error.message || "Could not load operations readiness." },
      })),
      loadAccountProfiles({ renderPanel: false }),
      loadPartnerApplications({ renderPanel: false }),
      loadFieldUpdates(),
      loadFundMilestones(),
    ]);
    backendMode = requestResult.mode;
    operationsReadiness = readinessResult.data || null;
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
    origin_country: String(formData.get("origin_country") || "").trim() || "Australia",
    destination_country: String(formData.get("destination_country") || "").trim() || "Kenya",
    service_direction: formData.get("service_direction") || "origin_to_destination",
    task_location: String(formData.get("task_location") || "").trim(),
    logistics_mode: formData.get("logistics_mode") || "not_needed",
    goods_category: formData.get("goods_category") || "none",
    logistics_notes: formData.get("logistics_notes") || "",
    route_status: formData.get("route_status") || "active",
    compliance_flags: parseChecklist(formData.get("compliance_flags")),
    required_checks: parseChecklist(formData.get("required_checks")),
    proof_requirements: parseChecklist(formData.get("proof_requirements")),
    compliance_acknowledged: true,
    compliance_status: formData.get("compliance_status") || "needs_ai_review",
    compliance_risk_level: formData.get("compliance_risk_level") || "standard",
    automation_status: formData.get("automation_status") || "ai_triage",
    admin_review_required: Boolean(formData.get("admin_review_required")),
    admin_review_reason: formData.get("admin_review_reason") || "",
    service_package: formData.get("service_package"),
    job_value_band: formData.get("job_value_band") || "unsure",
    funds_protection_preference: formData.get("funds_protection_preference") || "quote_first",
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

function applyPaymentLinkResult(form, result) {
  const checkoutUrl = result.data?.url || "";
  const reference = result.data?.provider_reference || result.data?.id || "";

  if (!checkoutUrl) {
    throw new Error("Payment provider did not return a checkout URL.");
  }

  const paymentLinkInput = form.querySelector('[name="payment_link"]');
  const paymentStatusSelect = form.querySelector('[name="payment_status"]');
  const fundsStatusSelect = form.querySelector('[name="funds_status"]');
  const paymentReferenceInput = form.querySelector('[name="payment_reference"]');

  if (paymentLinkInput) {
    paymentLinkInput.value = checkoutUrl;
  }

  if (paymentStatusSelect) {
    paymentStatusSelect.value = result.data?.payment_status || "invoice_sent";
  }

  if (fundsStatusSelect) {
    fundsStatusSelect.value = result.data?.funds_status || "payment_link_sent";
  }

  if (paymentReferenceInput && reference) {
    paymentReferenceInput.value = reference;
  }

  return checkoutUrl;
}

async function generateStripeCheckout(request, form, statusElement) {
  const payload = formPayload(form);

  if (!payload.quote_amount) {
    statusElement.textContent = "Add a quote amount before creating checkout.";
    return;
  }

  statusElement.textContent = "Creating Stripe checkout...";

  const result = await window.SwadaktaData.createStripeCheckoutSession(request, payload);
  const checkoutUrl = applyPaymentLinkResult(form, result);

  await copyText(checkoutUrl, statusElement);
  statusElement.textContent = "Stripe checkout ready. Review and save.";
}

async function generatePayPalOrder(request, form, statusElement) {
  const payload = formPayload(form);

  if (!payload.quote_amount) {
    statusElement.textContent = "Add a quote amount before creating a PayPal order.";
    return;
  }

  statusElement.textContent = "Creating PayPal order...";

  const result = await window.SwadaktaData.createPayPalOrder(request, payload);
  const checkoutUrl = applyPaymentLinkResult(form, result);

  await copyText(checkoutUrl, statusElement);
  statusElement.textContent = "PayPal order ready. Review and save.";
}

function applyWisePaymentRequestResult(form, result) {
  const wiseUrl = result.data?.url || "";
  const reference = result.data?.provider_reference || result.data?.id || "";

  if (!wiseUrl) {
    throw new Error("Wise did not return a payment URL.");
  }

  const paymentLinkInput = form.querySelector('[name="payment_link"]');
  const paymentStatusSelect = form.querySelector('[name="payment_status"]');
  const fundsStatusSelect = form.querySelector('[name="funds_status"]');
  const paymentReferenceInput = form.querySelector('[name="payment_reference"]');
  const releaseNotesInput = form.querySelector('[name="release_notes"]');

  if (paymentLinkInput) {
    paymentLinkInput.value = wiseUrl;
  }

  if (paymentStatusSelect) {
    paymentStatusSelect.value = result.data?.payment_status || "invoice_sent";
  }

  if (fundsStatusSelect) {
    fundsStatusSelect.value = result.data?.funds_status || "payment_link_sent";
  }

  if (paymentReferenceInput && reference) {
    paymentReferenceInput.value = reference;
  }

  if (releaseNotesInput && result.data?.release_notes) {
    releaseNotesInput.value = result.data.release_notes;
  }

  return result.data?.customer_message || `${wiseUrl}\nReference: ${reference}`;
}

async function generateWisePaymentRequest(request, form, statusElement) {
  const payload = formPayload(form);

  if (!payload.quote_amount) {
    statusElement.textContent = "Add a quote amount before preparing a Wise request.";
    return;
  }

  statusElement.textContent = "Preparing Wise request...";

  const result = await window.SwadaktaData.createWisePaymentRequest(request, payload);
  const clientMessage = applyWisePaymentRequestResult(form, result);

  await copyText(clientMessage, statusElement);
  statusElement.textContent = "Wise request ready. Client message copied; review and save.";
}

function applyFormPatch(form, updates) {
  Object.entries(updates).forEach(([name, value]) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (!field) {
      return;
    }

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
      return;
    }

    field.value = Array.isArray(value) ? value.join("\n") : value ?? "";
  });
}

function appendAutopilotNote(existing, lines) {
  const usefulLines = lines.filter(Boolean);
  if (!usefulLines.length) {
    return existing || "";
  }

  const stamp = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const block = [`[Autopilot ${stamp}]`, ...usefulLines.map((line) => `- ${line}`)].join("\n");

  return [String(existing || "").trim(), block].filter(Boolean).join("\n\n");
}

function appendInternalAuditBlock(existing, title, body) {
  const stamp = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const block = [`[${title} ${stamp}]`, String(body || "").trim()].filter(Boolean).join("\n");

  return [String(existing || "").trim(), block].filter(Boolean).join("\n\n");
}

function normalizedEvidenceText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactEvidenceKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function amountEvidenceNeedles(amount) {
  const numeric = Number(amount || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return [];
  }

  const rounded = Math.round(numeric);
  return [
    String(rounded),
    numeric.toFixed(2),
    new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(rounded),
    new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeric),
  ].map(compactEvidenceKey);
}

function evidenceIncludesAny(compactText, values) {
  return values.some((value) => {
    const key = compactEvidenceKey(value);
    return key && compactText.includes(key);
  });
}

function buildDeterministicReceiptCheck(request, payload, receiptText, aiError = "") {
  const compactText = compactEvidenceKey(receiptText);
  const readableText = normalizedEvidenceText(receiptText);
  const amountNeedles = amountEvidenceNeedles(payload.quote_amount);
  const checks = [
    {
      label: "Request code",
      passed: evidenceIncludesAny(compactText, [request.request_code]),
      detail: request.request_code || "not set",
    },
    {
      label: "Provider reference",
      passed: payload.payment_reference
        ? evidenceIncludesAny(compactText, [payload.payment_reference])
        : false,
      detail: payload.payment_reference || "not set",
    },
    {
      label: "Currency",
      passed: payload.quote_currency ? readableText.includes(String(payload.quote_currency).toLowerCase()) : false,
      detail: payload.quote_currency || "not set",
    },
    {
      label: "Amount",
      passed: amountNeedles.length ? amountNeedles.some((needle) => compactText.includes(needle)) : false,
      detail: payload.quote_amount ? formatMoney(payload.quote_amount, payload.quote_currency) : "not quoted",
    },
    {
      label: "Client/sender name",
      passed: evidenceIncludesAny(compactText, [request.client_name, request.email]),
      detail: request.client_name || request.email || "not set",
    },
    {
      label: "Dated evidence",
      passed: /\b20\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(readableText),
      detail: "receipt or statement date visible",
    },
  ];
  const matched = checks.filter((check) => check.passed);
  const missing = checks.filter((check) => !check.passed);
  const criticalMatches = checks
    .filter((check) => ["Request code", "Provider reference", "Currency", "Amount"].includes(check.label))
    .filter((check) => check.passed).length;
  const verdict =
    criticalMatches >= 3
      ? "Likely match, but founder/admin must still verify against Wise/bank statement before marking paid."
      : "Needs review; do not mark paid until the missing evidence is resolved.";

  return [
    "Receipt reconciliation draft",
    `Verdict: ${verdict}`,
    aiError ? `AI service fallback: ${aiError}` : "",
    "",
    "Matched evidence:",
    ...(matched.length ? matched.map((check) => `- ${check.label}: ${check.detail}`) : ["- None"]),
    "",
    "Missing or unclear evidence:",
    ...(missing.length ? missing.map((check) => `- ${check.label}: expected ${check.detail}`) : ["- None"]),
    "",
    "Founder approval required: marking payment paid, setting protected funds, assigning a receiver based on this receipt, or releasing any milestone.",
    "Store the receipt screenshot, Wise PDF, or bank statement line as a secure proof link before changing money status.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function isRoutineAutopilotClearable(request, payload) {
  const riskyGoods = !["none", "general_goods", "clothing_household"].includes(payload.goods_category);
  const riskyLogistics = ["postal_courier", "airport_handoff"].includes(payload.logistics_mode);
  const highValue = ["2000_10000", "10000_plus"].includes(payload.job_value_band);
  const blockedStatus = ["restricted", "permit_required", "prohibited"].includes(payload.compliance_status);

  return (
    payload.route_status === "active" &&
    !payload.admin_review_required &&
    !request.sensitive_documents_expected &&
    !riskyGoods &&
    !riskyLogistics &&
    !highValue &&
    !blockedStatus
  );
}

function buildSafeAutopilotPatch(request, payload, notes) {
  const patch = {};
  const merged = { ...request, ...payload };
  const quoteAmount = toMoneyNumber(payload.quote_amount);

  if (!payload.release_condition) {
    patch.release_condition = "Autopilot prepares the work, but founder/admin verifies proof before receiver payout.";
    notes.push("Added a protected milestone release condition.");
  }

  if (quoteAmount && !payload.payment_due_at && isPaymentOpen(payload)) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    patch.payment_due_at = formatDateInput(dueDate);
    notes.push("Set a 3-day payment window for the quote.");
  }

  if (isRoutineAutopilotClearable(request, payload)) {
    patch.compliance_status = payload.goods_category === "none" ? "not_applicable" : "cleared";
    patch.compliance_risk_level = "standard";
    patch.admin_review_required = false;
    patch.admin_review_reason = "";
    patch.automation_status = "self_service";
    notes.push("Cleared a routine active-lane request for self-service handling.");
  } else if (needsComplianceReview(merged)) {
    patch.admin_review_required = true;
    patch.automation_status =
      payload.route_status === "unsupported" || payload.compliance_risk_level === "blocked"
        ? "founder_approval"
        : "admin_review";
    patch.admin_review_reason =
      payload.admin_review_reason ||
      "Autopilot paused this request for founder/admin review because corridor, goods, ID, payment, value, or proof risk needs a human decision.";
    notes.push("Paused protected corridor/compliance decisions for founder/admin review.");
  }

  if (
    ["500_2000", "2000_10000"].includes(payload.job_value_band) &&
    payload.funds_protection_preference === "quote_first"
  ) {
    patch.funds_protection_preference = "deposit_milestones";
    notes.push("Selected deposit plus milestone controls for a funded job.");
  }

  if (payload.job_value_band === "10000_plus" && payload.funds_protection_preference !== "regulated_escrow") {
    patch.funds_protection_preference = "regulated_escrow";
    patch.admin_review_required = true;
    patch.automation_status = "founder_approval";
    patch.admin_review_reason =
      payload.admin_review_reason ||
      "High-value work needs founder review and regulated escrow or equivalent payment-provider controls.";
    notes.push("Escalated high-value work to founder approval and regulated escrow controls.");
  }

  if (["paid", "deposit_paid"].includes(payload.payment_status)) {
    notes.push(
      `Payment is already marked ${paymentLabels[payload.payment_status] || payload.payment_status}; founder/admin must verify provider evidence before release or protected amount changes.`,
    );
  }

  if (quoteAmount && payload.payment_link && payload.status === "new") {
    patch.status = "quoted";
    notes.push("Moved request to quoted because a quote and payment link are ready.");
  } else if (
    payload.assigned_partner_id &&
    ["paid", "in_progress"].includes(payload.status) &&
    payload.automation_status !== "receiver_routed"
  ) {
    patch.automation_status = "receiver_routed";
    notes.push("Marked the request as receiver-routed because a receiver is already assigned.");
  }

  if (payload.identity_verification_required && !["verified", "not_required"].includes(payload.verification_status)) {
    notes.push("Kept ID verification as a human/provider gate before sensitive work, assignment, or release.");
  }

  patch.operator_notes = appendAutopilotNote(payload.operator_notes, notes);

  return patch;
}

async function prepareAutopilotPaymentRoute(request, form, payload, notes) {
  const currency = payload.quote_currency || request.preferred_currency || "AUD";
  const method = request.payment_method_preference || "discuss";
  const stripeCurrencies = new Set(["AUD", "USD", "GBP", "EUR"]);
  let clientMessage = "";

  if (!toMoneyNumber(payload.quote_amount) || payload.payment_link) {
    return clientMessage;
  }

  if (method === "card" && stripeCurrencies.has(currency)) {
    const result = await window.SwadaktaData.createStripeCheckoutSession(request, payload);
    const checkoutUrl = applyPaymentLinkResult(form, result);
    notes.push("Generated a Stripe checkout link without marking funds paid.");
    return checkoutUrl;
  }

  if (method === "paypal" && stripeCurrencies.has(currency)) {
    const result = await window.SwadaktaData.createPayPalOrder(request, payload);
    const checkoutUrl = applyPaymentLinkResult(form, result);
    notes.push("Generated a PayPal order without capturing funds.");
    return checkoutUrl;
  }

  if (method === "wise") {
    notes.push("Left Wise as an intentional admin fallback; use it only after Stripe, PayPal, M-Pesa, or bank transfer is unsuitable or has failed.");
    return clientMessage;
  }

  if (method === "mpesa" && currency === "KES") {
    notes.push("Left M-Pesa STK for explicit admin action because it sends a phone prompt to the payer.");
    return clientMessage;
  }

  if (method === "bank") {
    notes.push("Left bank transfer as a manual receipt trail requiring founder/admin reconciliation.");
    return clientMessage;
  }

  notes.push("No automatic payment rail was selected; choose Stripe, PayPal, Wise, M-Pesa, or bank after reviewing the client preference.");
  return clientMessage;
}

async function runSafeAutopilot(request, form, statusElement) {
  statusElement.textContent = "Autopilot checking safe actions...";
  const notes = [];
  let copiedMessage = "";
  let payload = formPayload(form);

  try {
    copiedMessage = await prepareAutopilotPaymentRoute(request, form, payload, notes);
  } catch (error) {
    notes.push(error.message || "Payment-route preparation failed; founder/admin should choose the payment route manually.");
  }

  payload = formPayload(form);
  const patch = buildSafeAutopilotPatch(request, payload, notes);
  applyFormPatch(form, patch);

  await window.SwadaktaData.updateRequest(request.id, formPayload(form));

  if (copiedMessage) {
    await copyText(copiedMessage, statusElement);
  }

  statusElement.textContent = `Autopilot saved ${Math.max(notes.length, 1)} safe action${notes.length === 1 ? "" : "s"}. Protected decisions still need founder/admin approval.`;
  await loadRequests();
}

async function reconcilePaymentReceipt(request, form, statusElement) {
  const payload = formPayload(form);

  if (!payload.quote_amount) {
    statusElement.textContent = "Add a quote amount before checking receipt evidence.";
    return;
  }

  const receiptText = window.prompt(
    "Paste Wise/bank receipt text or statement line. Do not paste card numbers, passwords, PINs, or one-time codes.",
  );

  if (!receiptText) {
    statusElement.textContent = "Receipt check cancelled.";
    return;
  }

  statusElement.textContent = "Checking receipt evidence...";

  const context = {
    protected_action_boundary:
      "Draft only. Do not mark paid, set protected funds, assign a receiver, or release/refund money.",
    request_code: request.request_code,
    client_name: request.client_name,
    email: request.email,
    payment_method_preference: request.payment_method_preference,
    quote_amount: payload.quote_amount,
    quote_currency: payload.quote_currency,
    payment_status: payload.payment_status,
    funds_status: payload.funds_status,
    payment_reference: payload.payment_reference,
    payment_link: payload.payment_link,
    proof_links: payload.proof_links,
    release_notes: payload.release_notes,
  };

  let output = "";
  try {
    const result = await window.SwadaktaData.assist({
      role: "admin",
      task:
        "Reconcile this Wise or bank-transfer receipt/statement evidence against the Swadakta request. Return a concise checklist of matched, missing, and suspicious fields. End with Founder approval required for any paid status or release decision.",
      draft: receiptText,
      context,
    });
    output = result.data?.output || "";
  } catch (error) {
    output = buildDeterministicReceiptCheck(request, payload, receiptText, error.message || "AI unavailable.");
  }

  if (!output) {
    output = buildDeterministicReceiptCheck(request, payload, receiptText, "AI returned no text.");
  }

  const releaseNotesInput = form.querySelector('[name="release_notes"]');
  if (releaseNotesInput) {
    releaseNotesInput.value = appendInternalAuditBlock(
      payload.release_notes,
      "Receipt check",
      `${output}\n\nNo money status was changed by this check.`,
    );
  }

  statusElement.textContent = "Receipt check added to release notes. Review before saving.";
}

function applyMpesaStkResult(form, result) {
  const paymentStatusSelect = form.querySelector('[name="payment_status"]');
  const fundsStatusSelect = form.querySelector('[name="funds_status"]');
  const paymentReferenceInput = form.querySelector('[name="payment_reference"]');
  const releaseNotesInput = form.querySelector('[name="release_notes"]');

  if (paymentStatusSelect) {
    paymentStatusSelect.value = result.data?.payment_status || "invoice_sent";
  }

  if (fundsStatusSelect) {
    fundsStatusSelect.value = result.data?.funds_status || "payment_link_sent";
  }

  if (paymentReferenceInput && result.data?.provider_reference) {
    paymentReferenceInput.value = result.data.provider_reference;
  }

  if (releaseNotesInput && result.data?.release_notes) {
    releaseNotesInput.value = result.data.release_notes;
  }
}

async function generateMpesaStk(request, form, statusElement) {
  const payload = formPayload(form);

  if (!payload.quote_amount) {
    statusElement.textContent = "Add a quote amount before sending M-Pesa STK Push.";
    return;
  }

  if (payload.quote_currency !== "KES") {
    statusElement.textContent = "Set quote currency to KES before sending M-Pesa STK Push.";
    return;
  }

  const suggestedPhone = request.local_contact_phone || request.whatsapp || "";
  const mpesaPhone = window.prompt("Kenyan M-Pesa phone number for STK Push", suggestedPhone);

  if (!mpesaPhone) {
    statusElement.textContent = "M-Pesa STK Push cancelled.";
    return;
  }

  statusElement.textContent = "Sending M-Pesa STK Push...";

  const result = await window.SwadaktaData.createMpesaStkPush(request, {
    ...payload,
    mpesa_phone: mpesaPhone,
  });
  applyMpesaStkResult(form, result);
  statusElement.textContent = result.data?.customer_message || "M-Pesa STK Push sent. Review and save.";
  await loadRequests();
}

function applyPaymentCaptureResult(form, result) {
  const paymentStatusSelect = form.querySelector('[name="payment_status"]');
  const fundsStatusSelect = form.querySelector('[name="funds_status"]');
  const protectedAmountInput = form.querySelector('[name="protected_amount"]');
  const paymentReferenceInput = form.querySelector('[name="payment_reference"]');
  const releaseNotesInput = form.querySelector('[name="release_notes"]');

  if (paymentStatusSelect) {
    paymentStatusSelect.value = result.data?.payment_status || "paid";
  }

  if (fundsStatusSelect) {
    fundsStatusSelect.value = result.data?.funds_status || "deposit_confirmed";
  }

  if (protectedAmountInput && result.data?.protected_amount !== undefined) {
    protectedAmountInput.value = result.data.protected_amount;
  }

  if (paymentReferenceInput && result.data?.provider_reference) {
    paymentReferenceInput.value = result.data.provider_reference;
  }

  if (releaseNotesInput) {
    releaseNotesInput.value =
      "PayPal capture confirmed. Founder/admin must still review milestone proof before any receiver release.";
  }
}

async function capturePayPalOrder(request, form, statusElement) {
  const payload = formPayload(form);

  if (!payload.payment_reference) {
    statusElement.textContent = "Record the PayPal order ID/reference before capture.";
    return;
  }

  statusElement.textContent = "Capturing PayPal order...";

  const result = await window.SwadaktaData.capturePayPalOrder(request, payload);
  applyPaymentCaptureResult(form, result);
  statusElement.textContent = "PayPal captured and request updated.";
  await loadRequests();
}

function buildClientUpdate(request, form) {
  const payload = formPayload(form);
  const quoteLine = payload.quote_amount ? `Quote: ${formatCurrency(payload.quote_amount, payload.quote_currency)}` : "Quote: Pending.";
  const paymentLine = payload.payment_link ? `Payment link: ${payload.payment_link}` : "Payment link: Not issued yet.";
  const dueLine = payload.payment_due_at ? `Payment due: ${payload.payment_due_at}` : "";
  const valueLine = `Value involved: ${jobValueBandLabels[payload.job_value_band] || payload.job_value_band || "Not sure yet"}.`;
  const fundsPlanLine = `Funds plan: ${fundsProtectionLabels[payload.funds_protection_preference] || payload.funds_protection_preference || "Quote first, then decide"}.`;
  const fundsLine = `Funds protection: ${fundsStatusLabels[payload.funds_status] || payload.funds_status}; protected amount ${formatMoney(payload.protected_amount, payload.quote_currency)}.`;
  const reportUrlLine = payload.client_report_url ? `Report link: ${payload.client_report_url}` : "";
  const proofLines = payload.proof_links.length ? [`Proof links:`, ...payload.proof_links.map((link) => `- ${link}`)] : [];
  const requiredCheckLines = payload.required_checks.length
    ? ["Required checks before execution/release:", ...payload.required_checks.map((item) => `- ${item}`)]
    : [];
  const proofRequirementLines = payload.proof_requirements.length
    ? ["Proof requirements:", ...payload.proof_requirements.map((item) => `- ${item}`)]
    : [];

  return [
    `Swadakta update for ${request.request_code}`,
    `Status: ${statusLabels[payload.status] || payload.status}`,
    `Payment: ${paymentLabels[payload.payment_status] || payload.payment_status}`,
    quoteLine,
    paymentLine,
    dueLine,
    valueLine,
    fundsPlanLine,
    fundsLine,
    payload.client_report ? `Report: ${payload.client_report}` : "Report: Update pending.",
    reportUrlLine,
    ...requiredCheckLines,
    ...proofRequirementLines,
    ...buildMilestoneSummary(request),
    ...proofLines,
    "Thank you for trusting Swadakta Corridor Concierge.",
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
  const route = `${request.origin_country || "Australia"} to ${request.destination_country || "Kenya"}`;
  const taskLocation = request.task_location || request.kenya_location || "the task location";
  const logisticsMode =
    logisticsModeLabels[payload.logistics_mode || request.logistics_mode] ||
    payload.logistics_mode ||
    request.logistics_mode ||
    "No physical delivery";
  const goodsCategory =
    goodsCategoryLabels[payload.goods_category || request.goods_category] ||
    payload.goods_category ||
    request.goods_category ||
    "No physical goods";
  const valueBand = jobValueBandLabels[payload.job_value_band] || payload.job_value_band || "Not sure yet";
  const fundsPreference =
    fundsProtectionLabels[payload.funds_protection_preference] ||
    payload.funds_protection_preference ||
    "Quote first, then decide";
  const reports = Array.isArray(request.report_pack) ? request.report_pack.join(", ") : "photos, receipts, and written update";
  const fundsLine =
    payload.protected_amount > 0
      ? `Funds protection: ${formatMoney(payload.protected_amount, payload.quote_currency)} will be tracked against milestone release conditions.`
      : "Funds protection: Swadakta will confirm the payment hold/deposit and milestone release process before field work starts.";
  const verificationLine = payload.identity_verification_required
    ? "ID verification may be required before release or sensitive work starts."
    : "ID verification may be requested for higher-risk, high-value, title/document, or authority-sensitive jobs.";
  const requiredCheckLines = payload.required_checks.length
    ? ["Required checks before execution:", ...payload.required_checks.map((item) => `- ${item}`)]
    : [];
  const proofRequirementLines = payload.proof_requirements.length
    ? ["Proof requirements:", ...payload.proof_requirements.map((item) => `- ${item}`)]
    : [];

  return [
    `Hi ${request.client_name || "there"},`,
    "",
    `Swadakta quote for request ${request.request_code}: ${quoteLine}.`,
    `Package: ${servicePackage}.`,
    `Route: ${route}.`,
    `Task: ${taskLabels[request.task_type] || request.task_type} in ${taskLocation}.`,
    `Logistics: ${logisticsMode}. Goods category: ${goodsCategory}.`,
    `Preferred payment route: ${paymentMethod}.`,
    `Value involved: ${valueBand}. Funds plan: ${fundsPreference}.`,
    dueLine,
    paymentLine,
    "",
    fundsLine,
    verificationLine,
    ...requiredCheckLines,
    ...fundsGuardrailLines({ ...request, ...payload }),
    ...buildMilestoneSummary(request),
    "",
    `Proof plan: ${proofPriority}. Report pack: ${reports}.`,
    ...proofRequirementLines,
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
  const valueBand = jobValueBandLabels[payload.job_value_band] || payload.job_value_band || "Not sure yet";
  const fundsPreference =
    fundsProtectionLabels[payload.funds_protection_preference] ||
    payload.funds_protection_preference ||
    "Quote first, then decide";
  const proofPriority = proofPriorityLabels[request.proof_priority] || request.proof_priority || "Balanced proof pack";
  const route = `${request.origin_country || "Australia"} to ${request.destination_country || "Kenya"}`;
  const taskLocation = request.task_location || request.kenya_location || "Not specified";
  const logisticsMode =
    logisticsModeLabels[payload.logistics_mode || request.logistics_mode] ||
    payload.logistics_mode ||
    request.logistics_mode ||
    "No physical delivery";
  const goodsCategory =
    goodsCategoryLabels[payload.goods_category || request.goods_category] ||
    payload.goods_category ||
    request.goods_category ||
    "No physical goods";
  const complianceStatus =
    complianceStatusLabels[payload.compliance_status || request.compliance_status] ||
    payload.compliance_status ||
    request.compliance_status ||
    "Needs AI review";
  const referralSource = referralSourceLabels[request.referral_source] || request.referral_source || "Not sure";
  const milestoneSummary = getFundMilestonesForRequest(request)
    .map((milestone) => `- ${renderClientMilestoneLine(milestone)}; provider ${milestoneProviderLabels[milestone.provider] || milestone.provider}; trigger: ${milestone.release_trigger}`)
    .join("\n");
  const verificationStatus = verificationStatusLabels[payload.verification_status] || payload.verification_status || "Not required";
  const requiredCheckLines = payload.required_checks.length
    ? payload.required_checks.map((item) => `- ${item}`).join("\n")
    : "No additional route checks recorded.";
  const proofRequirementLines = payload.proof_requirements.length
    ? payload.proof_requirements.map((item) => `- ${item}`).join("\n")
    : "Use the standard report pack and receipt/reference trail.";

  return [
    `Swadakta operator brief: ${request.request_code}`,
    `Client: ${request.client_name}`,
    `Route: ${route}`,
    `Route status: ${routeStatusLabels[payload.route_status] || payload.route_status || "Active lane"}`,
    `Task: ${taskLabels[request.task_type] || request.task_type}`,
    `Task location: ${taskLocation}`,
    `Logistics: ${logisticsMode}`,
    `Goods category: ${goodsCategory}`,
    `Compliance: ${complianceStatus}`,
    `Founder review: ${payload.admin_review_required ? "Required" : "Not required"}${payload.admin_review_reason ? ` - ${payload.admin_review_reason}` : ""}`,
    `Client base: ${request.client_base || request.australia_location || "Not specified"}`,
    `Package: ${servicePackage}`,
    `Assigned receiver: ${assignedPartner}`,
    `Urgency: ${request.urgency}`,
    `Deadline: ${request.deadline || "Flexible"}`,
    `Local contact: ${localContact}`,
    `Client contact preference: ${request.contact_preference || "whatsapp"}`,
    `Preferred payment method: ${paymentMethod}`,
    `Value involved: ${valueBand}`,
    `Funds plan requested: ${fundsPreference}`,
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
    ...fundsGuardrailLines({ ...request, ...payload }),
    `ID verification: ${payload.identity_verification_required ? "required" : "not required"}; status ${verificationStatus}; reason ${payload.verification_reason || "not set"}.`,
    `Founder economics: ${founderMargin}; operator payout ${formatMoney(payload.operator_payout, payload.quote_currency)}; field costs ${formatMoney(payload.field_costs, payload.quote_currency)}; payment fees ${formatMoney(payload.payment_processing_fee, payload.quote_currency)}.`,
    "",
    "Milestone ledger:",
    milestoneSummary || "No milestones set yet.",
    "",
    "Required route/compliance checks:",
    requiredCheckLines,
    "",
    "Proof requirements:",
    proofRequirementLines,
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
    "- Keep receipts, queue tickets, names, tracking numbers, and reference numbers.",
    "- Record blockers, red flags, and next-step recommendations.",
    "- Do not handle extra money, documents, or instructions outside the approved brief without admin confirmation.",
    "",
    payload.operator_notes ? `Internal notes:\n${payload.operator_notes}` : "Internal notes: None yet.",
  ].join("\n");
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authStatus.textContent = "Sending secure sign-in email...";

  try {
    const email = document.querySelector("#admin-email").value.trim();
    const result = await window.SwadaktaData.signInAdmin(email);
    authStatus.textContent =
      result.mode === "supabase"
        ? `Sign-in email sent. It opens ${new URL(result.redirectTo).origin}/auth first, then returns here.`
        : "Demo mode does not require sign-in.";
    if (result.mode === "local") {
      await loadRequests();
    }
  } catch (error) {
    authStatus.textContent = error.message || "Could not send sign-in email.";
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
  const autopilotButton = event.target.closest(".run-safe-autopilot");
  if (autopilotButton) {
    const form = autopilotButton.closest(".request-update-form");
    const card = autopilotButton.closest(".request-card");
    const request = getRequestByCard(card);
    const statusElement = form.querySelector(".copy-status");

    if (!request) {
      return;
    }

    try {
      await runSafeAutopilot(request, form, statusElement);
    } catch (error) {
      statusElement.textContent = error.message || "Safe autopilot failed.";
    }
    return;
  }

  const checkoutButton = event.target.closest(".create-stripe-checkout");
  if (checkoutButton) {
    const form = checkoutButton.closest(".request-update-form");
    const card = checkoutButton.closest(".request-card");
    const request = getRequestByCard(card);
    const statusElement = form.querySelector(".copy-status");

    if (!request) {
      return;
    }

    try {
      await generateStripeCheckout(request, form, statusElement);
    } catch (error) {
      statusElement.textContent = error.message || "Stripe checkout failed.";
    }
    return;
  }

  const paypalButton = event.target.closest(".create-paypal-order");
  if (paypalButton) {
    const form = paypalButton.closest(".request-update-form");
    const card = paypalButton.closest(".request-card");
    const request = getRequestByCard(card);
    const statusElement = form.querySelector(".copy-status");

    if (!request) {
      return;
    }

    try {
      await generatePayPalOrder(request, form, statusElement);
    } catch (error) {
      statusElement.textContent = error.message || "PayPal order failed.";
    }
    return;
  }

  const paypalCaptureButton = event.target.closest(".capture-paypal-order");
  if (paypalCaptureButton) {
    const form = paypalCaptureButton.closest(".request-update-form");
    const card = paypalCaptureButton.closest(".request-card");
    const request = getRequestByCard(card);
    const statusElement = form.querySelector(".copy-status");

    if (!request) {
      return;
    }

    try {
      await capturePayPalOrder(request, form, statusElement);
    } catch (error) {
      statusElement.textContent = error.message || "PayPal capture failed.";
    }
    return;
  }

  const wiseButton = event.target.closest(".create-wise-request");
  if (wiseButton) {
    const form = wiseButton.closest(".request-update-form");
    const card = wiseButton.closest(".request-card");
    const request = getRequestByCard(card);
    const statusElement = form.querySelector(".copy-status");

    if (!request) {
      return;
    }

    try {
      await generateWisePaymentRequest(request, form, statusElement);
    } catch (error) {
      statusElement.textContent = error.message || "Wise request prep failed.";
    }
    return;
  }

  const receiptButton = event.target.closest(".reconcile-payment-receipt");
  if (receiptButton) {
    const form = receiptButton.closest(".request-update-form");
    const card = receiptButton.closest(".request-card");
    const request = getRequestByCard(card);
    const statusElement = form.querySelector(".copy-status");

    if (!request) {
      return;
    }

    try {
      await reconcilePaymentReceipt(request, form, statusElement);
    } catch (error) {
      statusElement.textContent = error.message || "Receipt check failed.";
    }
    return;
  }

  const mpesaButton = event.target.closest(".create-mpesa-stk");
  if (mpesaButton) {
    const form = mpesaButton.closest(".request-update-form");
    const card = mpesaButton.closest(".request-card");
    const request = getRequestByCard(card);
    const statusElement = form.querySelector(".copy-status");

    if (!request) {
      return;
    }

    try {
      await generateMpesaStk(request, form, statusElement);
    } catch (error) {
      statusElement.textContent = error.message || "M-Pesa STK Push failed.";
    }
    return;
  }

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
  founderCommand.addEventListener("click", async (event) => {
    const readinessCopyButton = event.target.closest("[data-copy-readiness]");
    if (readinessCopyButton) {
      const items = JSON.parse(founderCommand.dataset.readinessItems || "[]");
      const item = items.find((entry) => entry.id === readinessCopyButton.dataset.copyReadiness);
      const statusElement = founderCommand.querySelector("#readiness-status") || readinessCopyButton;
      if (item?.copy_value) {
        await copyText(item.copy_value, statusElement);
      }
      return;
    }

    const readinessChecklistButton = event.target.closest("[data-copy-readiness-checklist]");
    if (readinessChecklistButton) {
      const statusElement = founderCommand.querySelector("#readiness-status") || readinessChecklistButton;
      const checklist = founderCommand.dataset.readinessChecklist || buildReadinessChecklist();
      if (checklist) {
        await copyText(checklist, statusElement);
      }
      return;
    }

    const opsButton = event.target.closest("[data-copy-ops-ai]");
    if (opsButton) {
      const items = JSON.parse(founderCommand.dataset.opsAiItems || "[]");
      const item = items[Number(opsButton.dataset.copyOpsAi)];
      const statusElement = founderCommand.querySelector("#ops-ai-status") || opsButton;
      if (item?.prompt) {
        await copyText(item.prompt, statusElement);
      }
      return;
    }

    const runButton = event.target.closest("[data-run-ops-ai]");
    if (runButton) {
      const items = JSON.parse(founderCommand.dataset.opsAiItems || "[]");
      const item = items[Number(runButton.dataset.runOpsAi)];
      const card = runButton.closest(".ops-ai-item");
      const output = card.querySelector(".ops-ai-output");
      const statusElement = founderCommand.querySelector("#ops-ai-status") || runButton;

      if (!item?.payload || !output) {
        return;
      }

      statusElement.textContent = "Asking AI...";
      output.value = "";

      try {
        const result = await window.SwadaktaData.assist(item.payload);
        output.value = result.data?.output || "No AI output returned.";
        statusElement.textContent = "AI draft ready.";
      } catch (error) {
        statusElement.textContent = error.message || "AI draft failed.";
      }
      return;
    }

    const saveButton = event.target.closest("[data-save-ops-ai]");
    if (saveButton) {
      const items = JSON.parse(founderCommand.dataset.opsAiItems || "[]");
      const item = items[Number(saveButton.dataset.saveOpsAi)];
      const card = saveButton.closest(".ops-ai-item");
      const output = card.querySelector(".ops-ai-output");
      const statusElement = founderCommand.querySelector("#ops-ai-status") || saveButton;

      if (!item || !output) {
        return;
      }

      statusElement.textContent = "Saving AI note...";

      try {
        await saveOpsAiDraftToNotes(item, output.value);
        statusElement.textContent = "AI note saved.";
      } catch (error) {
        statusElement.textContent = error.message || "AI note failed to save.";
      }
      return;
    }

    const button = event.target.closest(".command-filter");
    if (button) {
      actionFilter = button.dataset.actionFilter || "all";
      renderRequests();
    }
  });
}

loadRequests();
