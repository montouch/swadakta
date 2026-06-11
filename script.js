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

const baseRates = {
  quick: 85,
  site: 180,
  registry: 150,
  virtual: 120,
};

const hourlyRates = {
  quick: 20,
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
  const deadline = document.querySelector("#deadline").value.trim() || "Flexible";
  const preferredCurrency = document.querySelector("#preferred-currency").value;
  const location = document.querySelector("#location").value.trim() || "Not specified";
  const localContactName = document.querySelector("#local-contact-name").value.trim() || "Not provided";
  const localContactPhone = document.querySelector("#local-contact-phone").value.trim() || "Not provided";
  const contactPreference = document.querySelector("#contact-preference").value;
  const contactWindow = document.querySelector("#contact-window").value.trim() || "Not specified";
  const supportingLinks = getSupportingLinks();
  const sensitiveDocuments = document.querySelector("#sensitive-documents").checked ? "yes" : "no";
  const notes = document.querySelector("#notes").value.trim() || "No notes added.";
  const selectedTask = taskType.options[taskType.selectedIndex].text;
  const selectedUrgency = urgency.options[urgency.selectedIndex].text;
  const reports = getReportItems().join(", ") || "basic written update";
  const permissions = [
    document.querySelector("#permission-contact").checked ? "local contact permission confirmed" : "local contact permission pending",
    document.querySelector("#scope-acceptance").checked ? "service scope accepted" : "service scope pending",
    document.querySelector("#terms-acceptance").checked ? "terms and privacy accepted" : "terms and privacy pending",
  ].join(", ");

  return [
    "Swadakta Diaspora Concierge Brief",
    `Client: ${clientName}`,
    `WhatsApp: ${whatsapp}`,
    `Email: ${email}`,
    `Client base: ${diasporaLocation}`,
    `Preferred quote currency: ${preferredCurrency}`,
    `Task: ${selectedTask}`,
    `Location: ${location}, Kenya`,
    `Ideal deadline: ${deadline}`,
    `Kenya contact: ${localContactName} (${localContactPhone})`,
    `Preferred contact: ${contactPreference}`,
    `Best contact window: ${contactWindow}`,
    `Urgency: ${selectedUrgency}`,
    `Estimated hours: ${hours.value}`,
    `Report pack: ${reports}`,
    `Supporting links: ${supportingLinks.join(", ") || "None provided"}`,
    `Sensitive documents expected: ${sensitiveDocuments}`,
    `Estimated fee: ${estimateOutput.textContent}`,
    `Permissions: ${permissions}`,
    `Notes: ${notes}`,
  ].join("\n");
}

function buildPayload() {
  const acceptedAt = new Date().toISOString();
  const contactPermission = document.querySelector("#permission-contact").checked;
  const professionalBoundaryAccepted = document.querySelector("#scope-acceptance").checked;
  const termsAccepted = document.querySelector("#terms-acceptance").checked;

  return {
    client_name: document.querySelector("#client-name").value.trim(),
    email: document.querySelector("#email").value.trim(),
    whatsapp: document.querySelector("#whatsapp").value.trim(),
    client_base: document.querySelector("#diaspora-location").value.trim(),
    australia_location: document.querySelector("#diaspora-location").value.trim(),
    deadline: document.querySelector("#deadline").value || null,
    local_contact_name: document.querySelector("#local-contact-name").value.trim(),
    local_contact_phone: document.querySelector("#local-contact-phone").value.trim(),
    contact_preference: document.querySelector("#contact-preference").value,
    contact_window: document.querySelector("#contact-window").value.trim(),
    supporting_links: getSupportingLinks(),
    sensitive_documents_expected: document.querySelector("#sensitive-documents").checked,
    preferred_currency: document.querySelector("#preferred-currency").value,
    task_type: taskType.value,
    kenya_location: document.querySelector("#location").value.trim(),
    urgency: urgency.value,
    report_pack: getReportItems(),
    hours_estimate: Number(hours.value),
    estimate_aud: Number(estimateOutput.dataset.amount || calculateEstimate()),
    notes: document.querySelector("#notes").value.trim(),
    contact_permission: contactPermission,
    professional_boundary_accepted: professionalBoundaryAccepted,
    terms_accepted_at: termsAccepted ? acceptedAt : null,
    privacy_accepted_at: termsAccepted ? acceptedAt : null,
  };
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
    <span>Planning estimate: ${estimateOutput.textContent}. Final quote follows review.</span>
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

  trackingResult.className = "tracking-result is-success";
  trackingResult.innerHTML = `
    <strong>${escapeHtml(request.request_code)}</strong>
    <span>Status: ${escapeHtml(statusLabels[request.status] || request.status)}</span>
    <span>Payment: ${escapeHtml(paymentLabels[request.payment_status] || request.payment_status)}</span>
    <span>Quote: ${escapeHtml(formatTrackedMoney(request.quote_amount, request.quote_currency))}</span>
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
