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
  const location = document.querySelector("#location").value.trim() || "Not specified";
  const notes = document.querySelector("#notes").value.trim() || "No notes added.";
  const selectedTask = taskType.options[taskType.selectedIndex].text;
  const selectedUrgency = urgency.options[urgency.selectedIndex].text;
  const reports = getReportItems().join(", ") || "basic written update";

  return [
    "Swadakta Diaspora Concierge Brief",
    `Client: ${clientName}`,
    `WhatsApp: ${whatsapp}`,
    `Email: ${email}`,
    `Client base: ${diasporaLocation}`,
    `Task: ${selectedTask}`,
    `Location: ${location}, Kenya`,
    `Urgency: ${selectedUrgency}`,
    `Estimated hours: ${hours.value}`,
    `Report pack: ${reports}`,
    `Estimated fee: ${estimateOutput.textContent}`,
    `Notes: ${notes}`,
  ].join("\n");
}

function buildPayload() {
  return {
    client_name: document.querySelector("#client-name").value.trim(),
    email: document.querySelector("#email").value.trim(),
    whatsapp: document.querySelector("#whatsapp").value.trim(),
    australia_location: document.querySelector("#diaspora-location").value.trim(),
    task_type: taskType.value,
    kenya_location: document.querySelector("#location").value.trim(),
    urgency: urgency.value,
    report_pack: getReportItems(),
    hours_estimate: Number(hours.value),
    estimate_aud: Number(estimateOutput.dataset.amount || calculateEstimate()),
    notes: document.querySelector("#notes").value.trim(),
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
    <span>Estimated fee: ${estimateOutput.textContent}</span>
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

updateEstimate();
