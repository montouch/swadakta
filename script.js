const tabButtons = document.querySelectorAll("[data-tab]");
const tabPanels = document.querySelectorAll("[data-panel]");
const form = document.querySelector("#intake-form");
const taskType = document.querySelector("#task-type");
const urgency = document.querySelector("#urgency");
const hours = document.querySelector("#hours");
const hoursOutput = document.querySelector("#hours-output");
const estimateOutput = document.querySelector("#estimate-output");
const copyBrief = document.querySelector("#copy-brief");
const submitRequest = document.querySelector("#submit-request");
const submissionStatus = document.querySelector("#submission-status");
const briefStatus = document.querySelector("#brief-status");
const copyLaunch = document.querySelector("#copy-launch");
const launchStatus = document.querySelector("#launch-status");
const trackingForm = document.querySelector("#tracking-form");
const trackingResult = document.querySelector("#tracking-result");
const draftClientBrief = document.querySelector("#draft-client-brief");
const useClientDraft = document.querySelector("#use-client-draft");
const copyClientDraft = document.querySelector("#copy-client-draft");
const clientAssistantDraft = document.querySelector("#client-assistant-draft");
const clientAssistantStatus = document.querySelector("#client-assistant-status");

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

const paymentMethodLabels = {
  discuss: "Recommend after quote",
  card: "Card or Stripe link",
  paypal: "PayPal invoice or link",
  wise: "Wise transfer",
  mpesa: "M-Pesa STK or Paybill",
  bank: "Bank transfer or manual receipt",
};

const serviceDirectionLabels = {
  origin_to_destination: "Origin to destination",
  destination_to_origin: "Destination to origin",
  two_way: "Two-way corridor",
  local_in_country: "Local in one country",
  digital_global: "Digital/global support",
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

const baseRates = {
  quick: 85,
  shopping: 110,
  site: 180,
  registry: 150,
  virtual: 120,
};

const hourlyRates = {
  quick: 20,
  shopping: 25,
  site: 35,
  registry: 30,
  virtual: 40,
};

const urgencyMultipliers = {
  standard: 1,
  priority: 1.25,
  "same-day": 1.55,
};

function formatAud(amount) {
  return `AUD ${new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

function getReportItems() {
  return Array.from(form.querySelectorAll('input[name="report"]:checked')).map((item) => item.value);
}

function isHttpLink(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSupportingLinks() {
  return document
    .querySelector("#supporting-links")
    .value.split(/\r?\n/)
    .map((link) => link.trim())
    .filter((link) => link && isHttpLink(link))
    .slice(0, 10);
}

function calculateEstimate() {
  const type = taskType.value;
  const selectedHours = Number(hours.value);
  const reportPremium = Math.max(0, getReportItems().length - 2) * 15;
  const subtotal = baseRates[type] + selectedHours * hourlyRates[type] + reportPremium;
  return Math.ceil((subtotal * urgencyMultipliers[urgency.value]) / 5) * 5;
}

function updateEstimate() {
  const estimate = calculateEstimate();
  hoursOutput.textContent = `${hours.value} ${Number(hours.value) === 1 ? "hr" : "hrs"}`;
  estimateOutput.textContent = formatAud(estimate);
  estimateOutput.dataset.amount = String(estimate);
}

function buildBrief() {
  const clientName = document.querySelector("#client-name").value.trim() || "Not specified";
  const whatsapp = document.querySelector("#whatsapp").value.trim() || "Not specified";
  const email = document.querySelector("#email").value.trim() || "Not specified";
  const diasporaLocation = document.querySelector("#diaspora-location").value.trim() || "Not specified";
  const originCountry = document.querySelector("#origin-country").value;
  const destinationCountry = document.querySelector("#destination-country").value;
  const serviceDirection = document.querySelector("#service-direction").value;
  const logisticsMode = document.querySelector("#logistics-mode").value;
  const goodsCategory = document.querySelector("#goods-category").value;
  const logisticsNotes = document.querySelector("#logistics-notes").value.trim() || "Not provided";
  const deadline = document.querySelector("#deadline").value.trim() || "Flexible";
  const preferredCurrency = document.querySelector("#preferred-currency").value;
  const servicePackage = document.querySelector("#service-package").value;
  const paymentMethodPreference = document.querySelector("#payment-method-preference").value;
  const jobValueBand = document.querySelector("#job-value-band").value;
  const fundsProtectionPreference = document.querySelector("#funds-protection-preference").value;
  const budgetRange = document.querySelector("#budget-range").value;
  const proofPriority = document.querySelector("#proof-priority").value;
  const referralSource = document.querySelector("#referral-source").value;
  const location = document.querySelector("#location").value.trim() || "Not specified";
  const localContactName = document.querySelector("#local-contact-name").value.trim() || "Not provided";
  const localContactPhone = document.querySelector("#local-contact-phone").value.trim() || "Not provided";
  const contactPreference = document.querySelector("#contact-preference").value;
  const contactWindow = document.querySelector("#contact-window").value.trim() || "Not specified";
  const supportingLinks = getSupportingLinks();
  const sensitiveDocuments = document.querySelector("#sensitive-documents").checked ? "yes" : "no";
  const complianceAcknowledged = document.querySelector("#compliance-acknowledged").checked ? "yes" : "no";
  const notes = document.querySelector("#notes").value.trim() || "No notes added.";
  const selectedTask = taskType.options[taskType.selectedIndex].text;
  const selectedUrgency = urgency.options[urgency.selectedIndex].text;
  const reports = getReportItems().join(", ") || "basic written update";
  const permissions = [
    document.querySelector("#permission-contact").checked ? "local contact permission confirmed" : "local contact permission pending",
    document.querySelector("#scope-acceptance").checked ? "service scope accepted" : "service scope pending",
    document.querySelector("#client-id-consent").checked ? "client ID verification consent confirmed" : "client ID verification consent pending",
    document.querySelector("#terms-acceptance").checked ? "terms and privacy accepted" : "terms and privacy pending",
  ].join(", ");

  return [
    "Swadakta Corridor Concierge Brief",
    `Client: ${clientName}`,
    `WhatsApp: ${whatsapp}`,
    `Email: ${email}`,
    `Client base: ${diasporaLocation}`,
    `Origin: ${originCountry}`,
    `Destination: ${destinationCountry}`,
    `Direction: ${serviceDirectionLabels[serviceDirection] || serviceDirection}`,
    `Logistics: ${logisticsModeLabels[logisticsMode] || logisticsMode}`,
    `Goods category: ${goodsCategoryLabels[goodsCategory] || goodsCategory}`,
    `Preferred quote currency: ${preferredCurrency}`,
    `Service package: ${servicePackageLabels[servicePackage] || servicePackage}`,
    `Preferred payment method: ${paymentMethodLabels[paymentMethodPreference] || paymentMethodPreference}`,
    `Approx value involved: ${jobValueBandLabels[jobValueBand] || jobValueBand}`,
    `Funds protection preference: ${fundsProtectionLabels[fundsProtectionPreference] || fundsProtectionPreference}`,
    `Budget comfort: ${budgetRangeLabels[budgetRange] || budgetRange}`,
    `Proof priority: ${proofPriorityLabels[proofPriority] || proofPriority}`,
    `Lead source: ${referralSourceLabels[referralSource] || referralSource}`,
    `Task: ${selectedTask}`,
    `Task location: ${location}`,
    `Ideal deadline: ${deadline}`,
    `Task-side contact: ${localContactName} (${localContactPhone})`,
    `Preferred contact: ${contactPreference}`,
    `Best contact window: ${contactWindow}`,
    `Urgency: ${selectedUrgency}`,
    `Estimated hours: ${hours.value}`,
    `Report pack: ${reports}`,
    `Supporting links: ${supportingLinks.join(", ") || "None provided"}`,
    `Logistics notes: ${logisticsNotes}`,
    `Sensitive documents expected: ${sensitiveDocuments}`,
    `Compliance acknowledgement: ${complianceAcknowledged}`,
    `AUD planning estimate: ${estimateOutput.textContent}`,
    `Permissions: ${permissions}`,
    `Notes: ${notes}`,
  ].join("\n");
}

function supportedRegion(country) {
  const value = String(country || "").trim().toLowerCase();
  if (!value) {
    return "";
  }

  if (value.includes("australia")) {
    return "Australia";
  }

  if (value.includes("united states") || value === "usa" || value === "us" || value.includes("america")) {
    return "USA";
  }

  if (value.includes("china")) {
    return "China";
  }

  const europeMarkers = [
    "europe",
    "uk",
    "united kingdom",
    "england",
    "scotland",
    "wales",
    "ireland",
    "france",
    "germany",
    "italy",
    "spain",
    "netherlands",
    "sweden",
    "norway",
    "denmark",
    "belgium",
    "switzerland",
    "poland",
    "portugal",
    "greece",
  ];
  if (europeMarkers.some((marker) => value.includes(marker))) {
    return "Europe";
  }

  const africaMarkers = [
    "africa",
    "kenya",
    "uganda",
    "tanzania",
    "rwanda",
    "ethiopia",
    "somalia",
    "south africa",
    "nigeria",
    "ghana",
    "zambia",
    "zimbabwe",
    "malawi",
    "botswana",
    "namibia",
    "cameroon",
    "senegal",
    "morocco",
    "egypt",
  ];
  if (africaMarkers.some((marker) => value.includes(marker))) {
    return "Africa";
  }

  return "Founder review";
}

function corridorStatus(originCountry, destinationCountry) {
  const originRegion = supportedRegion(originCountry);
  const destinationRegion = supportedRegion(destinationCountry);

  if (!originRegion || !destinationRegion || originRegion === "Founder review" || destinationRegion === "Founder review") {
    return {
      automation_status: "founder_approval",
      admin_review_required: true,
      admin_review_reason: "Route is outside the launch regions and needs founder approval.",
    };
  }

  const involvesAfrica = originRegion === "Africa" || destinationRegion === "Africa";
  const involvesAustralia = originRegion === "Australia" || destinationRegion === "Australia";

  if (involvesAfrica && involvesAustralia) {
    return {
      automation_status: "ai_triage",
      admin_review_required: false,
      admin_review_reason: "",
    };
  }

  if (involvesAfrica && ["USA", "Europe", "China"].includes(originRegion === "Africa" ? destinationRegion : originRegion)) {
    return {
      automation_status: "admin_review",
      admin_review_required: true,
      admin_review_reason: "Pilot corridor: AI can triage, but founder approval is required before quoting or assigning.",
    };
  }

  return {
    automation_status: "founder_approval",
    admin_review_required: true,
    admin_review_reason: "Non-Africa corridor requested; keep in founder review until the lane is activated.",
  };
}

function complianceTriage({ logisticsMode, goodsCategory, sensitiveDocuments, jobValueBand, originCountry, destinationCountry }) {
  const riskyGoods = ["food_plant_animal", "medicine_health", "cosmetics", "valuable_items", "restricted_or_unsure"];
  const physical = !["not_needed", "digital_only"].includes(logisticsMode) || goodsCategory !== "none";
  const route = corridorStatus(originCountry, destinationCountry);

  if (riskyGoods.includes(goodsCategory)) {
    return {
      ...route,
      compliance_status: "needs_admin_review",
      compliance_risk_level: "high",
      automation_status: "founder_approval",
      admin_review_required: true,
      admin_review_reason: "Restricted, regulated, high-value, health, food, plant, animal, cosmetic, or uncertain goods need legal/import-export review before action.",
    };
  }

  if (physical || sensitiveDocuments || ["2000_10000", "10000_plus"].includes(jobValueBand)) {
    return {
      ...route,
      compliance_status: "needs_ai_review",
      compliance_risk_level: "medium",
      admin_review_required: route.admin_review_required,
    };
  }

  return {
    ...route,
    compliance_status: "not_applicable",
    compliance_risk_level: "standard",
    automation_status: route.admin_review_required ? route.automation_status : "self_service",
  };
}

function buildPayload() {
  const acceptedAt = new Date().toISOString();
  const contactPermission = document.querySelector("#permission-contact").checked;
  const professionalBoundaryAccepted = document.querySelector("#scope-acceptance").checked;
  const identityVerificationConsent = document.querySelector("#client-id-consent").checked;
  const termsAccepted = document.querySelector("#terms-acceptance").checked;
  const originCountry = document.querySelector("#origin-country").value;
  const destinationCountry = document.querySelector("#destination-country").value;
  const serviceDirection = document.querySelector("#service-direction").value;
  const logisticsMode = document.querySelector("#logistics-mode").value;
  const goodsCategory = document.querySelector("#goods-category").value;
  const sensitiveDocuments = document.querySelector("#sensitive-documents").checked;
  const taskLocation = document.querySelector("#location").value.trim();
  const triage = complianceTriage({
    logisticsMode,
    goodsCategory,
    sensitiveDocuments,
    jobValueBand: document.querySelector("#job-value-band").value,
    originCountry,
    destinationCountry,
  });

  return {
    client_name: document.querySelector("#client-name").value.trim(),
    email: document.querySelector("#email").value.trim(),
    whatsapp: document.querySelector("#whatsapp").value.trim(),
    client_base: document.querySelector("#diaspora-location").value.trim(),
    australia_location: document.querySelector("#diaspora-location").value.trim(),
    origin_country: originCountry,
    destination_country: destinationCountry,
    service_direction: serviceDirection,
    task_location: taskLocation,
    logistics_mode: logisticsMode,
    goods_category: goodsCategory,
    logistics_notes: document.querySelector("#logistics-notes").value.trim(),
    compliance_acknowledged: document.querySelector("#compliance-acknowledged").checked,
    compliance_status: triage.compliance_status,
    compliance_risk_level: triage.compliance_risk_level,
    automation_status: triage.automation_status,
    admin_review_required: triage.admin_review_required,
    admin_review_reason: triage.admin_review_reason,
    deadline: document.querySelector("#deadline").value || null,
    local_contact_name: document.querySelector("#local-contact-name").value.trim(),
    local_contact_phone: document.querySelector("#local-contact-phone").value.trim(),
    contact_preference: document.querySelector("#contact-preference").value,
    contact_window: document.querySelector("#contact-window").value.trim(),
    supporting_links: getSupportingLinks(),
    sensitive_documents_expected: sensitiveDocuments,
    preferred_currency: document.querySelector("#preferred-currency").value,
    service_package: document.querySelector("#service-package").value,
    payment_method_preference: document.querySelector("#payment-method-preference").value,
    job_value_band: document.querySelector("#job-value-band").value,
    funds_protection_preference: document.querySelector("#funds-protection-preference").value,
    budget_range: document.querySelector("#budget-range").value,
    proof_priority: document.querySelector("#proof-priority").value,
    referral_source: document.querySelector("#referral-source").value,
    task_type: taskType.value,
    kenya_location: taskLocation,
    urgency: urgency.value,
    report_pack: getReportItems(),
    hours_estimate: Number(hours.value),
    estimate_aud: Number(estimateOutput.dataset.amount || calculateEstimate()),
    notes: document.querySelector("#notes").value.trim(),
    identity_verification_required: true,
    verification_status: "required",
    identity_verification_consent: identityVerificationConsent,
    contact_permission: contactPermission,
    professional_boundary_accepted: professionalBoundaryAccepted,
    terms_accepted_at: termsAccepted ? acceptedAt : null,
    privacy_accepted_at: termsAccepted ? acceptedAt : null,
  };
}

function buildClientAssistantDraft() {
  const task = taskType.options[taskType.selectedIndex].text;
  const location = document.querySelector("#location").value.trim() || "the task location I listed";
  const originCountry = document.querySelector("#origin-country").value;
  const destinationCountry = document.querySelector("#destination-country").value;
  const serviceDirection =
    serviceDirectionLabels[document.querySelector("#service-direction").value] || "the selected direction";
  const logisticsMode = logisticsModeLabels[document.querySelector("#logistics-mode").value] || "the selected logistics mode";
  const goodsCategory = goodsCategoryLabels[document.querySelector("#goods-category").value] || "the selected goods category";
  const logisticsNotes = document.querySelector("#logistics-notes").value.trim();
  const deadline = document.querySelector("#deadline").value || "a flexible date";
  const localContact = [document.querySelector("#local-contact-name").value.trim(), document.querySelector("#local-contact-phone").value.trim()]
    .filter(Boolean)
    .join(" / ");
  const reports = getReportItems().join(", ") || "a written update";
  const valueBand = jobValueBandLabels[document.querySelector("#job-value-band").value] || "Not sure yet";
  const fundsPreference =
    fundsProtectionLabels[document.querySelector("#funds-protection-preference").value] || "Quote first, then decide";
  const sensitiveLine = document.querySelector("#sensitive-documents").checked
    ? "This may involve sensitive documents, so please advise on ID verification and safe document handling before work starts."
    : "I do not expect to send sensitive documents at this stage.";
  const contactLine = localContact
    ? `The task-side contact is ${localContact}.`
    : "I will confirm the task-side contact if one is needed.";
  const logisticsLine = logisticsNotes
    ? `Logistics notes: ${logisticsNotes}.`
    : `Logistics route: ${logisticsMode}; goods category: ${goodsCategory}. Please advise what customs, courier, packing, duties, or legal checks are needed.`;

  return [
    `I need Swadakta to help with ${task.toLowerCase()} in ${location}.`,
    `Route: ${originCountry} to ${destinationCountry}; direction: ${serviceDirection}.`,
    `My ideal deadline is ${deadline}, but please confirm what is realistic before quoting.`,
    contactLine,
    logisticsLine,
    `I would like proof by ${reports}.`,
    `Approximate value involved: ${valueBand}. Funds preference: ${fundsPreference}.`,
    sensitiveLine,
    "Please quote the work first, confirm the payment/protection route, and tell me what information is missing before anyone starts.",
  ].join(" ");
}

function buildWhatsappLink(requestCode) {
  const number = window.SWADAKTA_CONFIG?.whatsappNumber || "";
  if (!number) {
    return "";
  }

  const message = `Hi Swadakta, I submitted request ${requestCode}. ${buildBrief()}`;
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

function showSubmissionSuccess(result) {
  const code = result.data.request_code;
  const modeText =
    result.mode === "supabase"
      ? "Your request has been submitted."
      : "Demo mode: this request is saved in this browser until Supabase keys are added.";
  const whatsappLink = buildWhatsappLink(code);

  submissionStatus.className = "submission-status is-success";
  submissionStatus.innerHTML = `
    <strong>${modeText}</strong>
    <span>Tracking ID: ${code}</span>
    <span>AUD planning estimate: ${estimateOutput.textContent}. Final quote follows review in the preferred quote currency.</span>
    <a class="status-link" href="#tracking">Track this request</a>
    ${
      whatsappLink
        ? `<a class="status-link" href="${whatsappLink}" target="_blank" rel="noreferrer">Send WhatsApp follow-up</a>`
        : `<a class="status-link" href="admin.html">Open admin dashboard</a>`
    }
  `;
}

function showSubmissionError(error) {
  submissionStatus.className = "submission-status is-error";
  submissionStatus.textContent = `Could not submit request: ${error.message || "check configuration."}`;
}

async function copyText(text, statusElement, successMessage) {
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
  }, 2600);
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    tabButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });

    tabPanels.forEach((panel) => {
      const isActive = panel.dataset.panel === target;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  });
});

form.addEventListener("input", updateEstimate);
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  submitRequest.disabled = true;
  submitRequest.textContent = "Submitting...";
  submissionStatus.className = "submission-status";
  submissionStatus.textContent = "Saving request...";

  try {
    const result = await window.SwadaktaData.createRequest(buildPayload());
    showSubmissionSuccess(result);
    form.reset();
    form.querySelector('input[value="photos"]').checked = true;
    form.querySelector('input[value="video"]').checked = true;
    form.querySelector('input[value="receipts"]').checked = true;
    updateEstimate();
  } catch (error) {
    showSubmissionError(error);
  } finally {
    submitRequest.disabled = false;
    submitRequest.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
      Submit request
    `;
  }
});
copyBrief.addEventListener("click", () => copyText(buildBrief(), briefStatus, "Brief copied."));
if (draftClientBrief && clientAssistantDraft) {
  draftClientBrief.addEventListener("click", () => {
    clientAssistantDraft.value = buildClientAssistantDraft();
    clientAssistantStatus.textContent = "Draft ready.";
  });
}
if (useClientDraft && clientAssistantDraft) {
  useClientDraft.addEventListener("click", () => {
    const notes = document.querySelector("#notes");
    notes.value = clientAssistantDraft.value || buildClientAssistantDraft();
    clientAssistantStatus.textContent = "Draft added to notes.";
  });
}
if (copyClientDraft && clientAssistantDraft) {
  copyClientDraft.addEventListener("click", () =>
    copyText(clientAssistantDraft.value || buildClientAssistantDraft(), clientAssistantStatus, "Draft copied."),
  );
}
copyLaunch.addEventListener("click", () => {
  const launchCopy = document.querySelector("#launch-copy").textContent.trim().replace(/\s+/g, " ");
  copyText(launchCopy, launchStatus, "WhatsApp draft copied.");
});

function formatTrackedMoney(amount, currency) {
  if (!amount) {
    return "Quote pending";
  }

  return `${currency || "AUD"} ${new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

function formatTrackedAmount(amount, currency) {
  return `${currency || "AUD"} ${new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))}`;
}

function renderTrackedMilestones(request) {
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
              <span>${escapeHtml(formatTrackedAmount(milestone.released_amount, milestone.currency))} released of ${escapeHtml(formatTrackedAmount(milestone.amount, milestone.currency))}</span>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTrackingResult(request) {
  const safePaymentLink = safeHttpUrl(request.payment_link);
  const safeReportLink = safeHttpUrl(request.client_report_url);
  const safeProofLinks = Array.isArray(request.proof_links)
    ? request.proof_links.map(safeHttpUrl).filter(Boolean)
    : [];
  const paymentLink = safePaymentLink
    ? `<a class="status-link" href="${escapeHtml(safePaymentLink)}" target="_blank" rel="noreferrer">Open secure payment link</a>`
    : "";
  const reportLink = safeReportLink
    ? `<a class="status-link" href="${escapeHtml(safeReportLink)}" target="_blank" rel="noreferrer">Open report</a>`
    : "";
  const proofLinks = safeProofLinks
    .map((link, index) => `<a class="status-link" href="${escapeHtml(link)}" target="_blank" rel="noreferrer">Proof file ${index + 1}</a>`)
    .join("");
  const fundsStatus = fundsStatusLabels[request.funds_status] || request.funds_status || "Not collected";
  const verificationStatus =
    verificationStatusLabels[request.verification_status] || request.verification_status || "Not required";
  const valueBand = jobValueBandLabels[request.job_value_band] || request.job_value_band || "Not sure yet";
  const fundsPreference =
    fundsProtectionLabels[request.funds_protection_preference] ||
    request.funds_protection_preference ||
    "Quote first, then decide";

  trackingResult.className = "tracking-result is-success";
  trackingResult.innerHTML = `
    <strong>${escapeHtml(request.request_code)}</strong>
    <span>Status: ${escapeHtml(statusLabels[request.status] || request.status)}</span>
    <span>Payment: ${escapeHtml(paymentLabels[request.payment_status] || request.payment_status)}</span>
    <span>Quote: ${escapeHtml(formatTrackedMoney(request.quote_amount, request.quote_currency))}</span>
    <span>Value involved: ${escapeHtml(valueBand)}</span>
    <span>Funds plan: ${escapeHtml(fundsPreference)}</span>
    <span>Funds: ${escapeHtml(fundsStatus)}</span>
    <span>Protected amount: ${escapeHtml(formatTrackedAmount(request.protected_amount, request.quote_currency))}</span>
    ${request.identity_verification_required ? `<span>ID verification: ${escapeHtml(verificationStatus)}</span>` : ""}
    ${request.release_condition ? `<p>${escapeHtml(request.release_condition)}</p>` : ""}
    ${renderTrackedMilestones(request)}
    ${request.client_report ? `<p>${escapeHtml(request.client_report)}</p>` : `<p>Client report will appear here after the Kenya desk updates the job.</p>`}
    ${paymentLink}
    ${reportLink}
    ${proofLinks}
  `;
}

if (trackingForm) {
  trackingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!trackingForm.reportValidity()) {
      return;
    }

    trackingResult.className = "tracking-result";
    trackingResult.textContent = "Checking request...";

    const code = document.querySelector("#tracking-code").value.trim();
    const contact = document.querySelector("#tracking-contact").value.trim();

    try {
      const result = await window.SwadaktaData.trackRequest(code, contact);
      if (!result.data) {
        trackingResult.className = "tracking-result is-error";
        trackingResult.textContent = "No matching request found. Check the code and use the same email or WhatsApp from the original brief.";
        return;
      }

      renderTrackingResult(result.data);
    } catch (error) {
      trackingResult.className = "tracking-result is-error";
      trackingResult.textContent = error.message || "Could not check this request.";
    }
  });
}

updateEstimate();
