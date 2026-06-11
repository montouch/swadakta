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

const servicePackageLabels = {
  quote_first: "Quote-first service",
  quick_errand: "Quick Errand",
  site_visit: "Site Visit",
  registry_errand: "Registry/Document Run",
  family_support: "Family Support Run",
  monthly_retainer: "Monthly Retainer",
  business_ops: "Business Ops Support",
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

function formatCurrency(amount, currency = "AUD") {
  if (!amount) {
    return "Quote pending";
  }

  return `${currency} ${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(amount)}`;
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

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
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

  trackingResult.className = "tracking-result is-success";
  trackingResult.innerHTML = `
    <strong>${escapeHtml(request.request_code)}</strong>
    <span>Status: ${escapeHtml(statusLabels[request.status] || request.status)}</span>
    <span>Payment: ${escapeHtml(paymentLabels[request.payment_status] || request.payment_status)}</span>
    <span>Quote: ${escapeHtml(formatCurrency(request.quote_amount, request.quote_currency))}</span>
    ${paymentLink ? `<p><a href="${escapeHtml(paymentLink)}" target="_blank" rel="noreferrer">Open payment link</a></p>` : ""}
    ${request.client_report ? `<p>${escapeHtml(request.client_report)}</p>` : ""}
    ${reportLink ? `<p><a href="${escapeHtml(reportLink)}" target="_blank" rel="noreferrer">Open client report</a></p>` : ""}
    ${proofList}
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

function renderClientAccount(email, requests) {
  if (!clientAccountPanel) {
    return;
  }

  if (!requests.length) {
    clientAccountPanel.innerHTML = `
      <strong>Signed in as ${escapeHtml(email)}</strong>
      <span>No client requests are linked to this email yet.</span>
    `;
    return;
  }

  const items = requests
    .map((request) => {
      const paymentLink = safeHttpUrl(request.payment_link);
      return `
        <article>
          <strong>${escapeHtml(request.request_code)}</strong>
          <span>${escapeHtml(servicePackageLabels[request.service_package] || request.service_package || "Quote-first service")} in ${escapeHtml(request.kenya_location || "Kenya")}</span>
          <span>Status: ${escapeHtml(statusLabels[request.status] || request.status)}. Payment: ${escapeHtml(paymentLabels[request.payment_status] || request.payment_status)}.</span>
          <span>Quote: ${escapeHtml(formatCurrency(request.quote_amount, request.quote_currency))}</span>
          ${paymentLink ? `<a href="${escapeHtml(paymentLink)}" target="_blank" rel="noreferrer">Open payment link</a>` : ""}
          <small>Updated ${escapeHtml(formatDate(request.updated_at))}</small>
        </article>
      `;
    })
    .join("");

  clientAccountPanel.innerHTML = `
    <strong>Signed in as ${escapeHtml(email)}</strong>
    <div class="account-list">${items}</div>
  `;
}

function renderPartnerAccount(email, applications) {
  if (!partnerAccountPanel) {
    return;
  }

  if (!applications.length) {
    partnerAccountPanel.innerHTML = `
      <strong>Signed in as ${escapeHtml(email)}</strong>
      <span>No receiver applications are linked to this email yet.</span>
    `;
    return;
  }

  const items = applications
    .map((application) => {
      const categories = Array.isArray(application.service_categories)
        ? application.service_categories.map((category) => partnerCategoryLabels[category] || category).join(", ")
        : "Not specified";
      return `
        <article>
          <strong>${escapeHtml(application.partner_code)}</strong>
          <span>${escapeHtml(application.kenya_base || "Kenya")} - ${escapeHtml(categories)}</span>
          <span>Status: ${escapeHtml(partnerStatusLabels[application.status] || application.status)}.</span>
          <span>Coverage: ${escapeHtml(application.service_regions || "Not specified")}</span>
          <small>Updated ${escapeHtml(formatDate(application.updated_at))}</small>
        </article>
      `;
    })
    .join("");

  partnerAccountPanel.innerHTML = `
    <strong>Signed in as ${escapeHtml(email)}</strong>
    <div class="account-list">${items}</div>
  `;
}

async function loadAccountPanels() {
  try {
    const sessionResult = await window.SwadaktaData.getSession();
    const email = sessionResult.session?.user?.email || "";

    if (!email) {
      return;
    }

    const [clientResult, partnerResult] = await Promise.all([
      window.SwadaktaData.listMyRequests(),
      window.SwadaktaData.listMyPartnerApplications(),
    ]);

    renderClientAccount(email, clientResult.data || []);
    renderPartnerAccount(email, partnerResult.data || []);
  } catch (error) {
    const message = escapeHtml(error.message || "Could not load account details.");
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
      ? "Magic link sent. Open it in this browser to continue."
      : "Demo mode does not require sign-in.";
}

trackingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  trackingResult.className = "tracking-result";
  trackingResult.textContent = "Checking request...";

  try {
    const code = document.querySelector("#portal-tracking-code").value;
    const contact = document.querySelector("#portal-tracking-contact").value;
    const result = await window.SwadaktaData.trackRequest(code, contact);
    renderTrackingResult(result.data);
  } catch (error) {
    trackingResult.className = "tracking-result is-error";
    trackingResult.textContent = error.message || "Could not check request.";
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
      <span>Partner application ID: ${escapeHtml(result.data.partner_code)}. Swadakta will review before assigning any client work.</span>
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
        ? "Magic link sent. Open it in this browser to enter the admin desk."
        : "Demo mode does not require sign-in. Open the admin dashboard.";
  } catch (error) {
    adminStatus.className = "tracking-result is-error";
    adminStatus.textContent = error.message || "Could not send magic link.";
  }
});

loadAccountPanels();
