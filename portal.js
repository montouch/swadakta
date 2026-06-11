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
  site: "Property or site visit",
  registry: "Registry or legal errand",
  virtual: "Virtual assistant support",
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

  trackingResult.className = "tracking-result is-success";
  trackingResult.innerHTML = `
    <strong>${escapeHtml(request.request_code)}</strong>
    <span>Status: ${escapeHtml(statusLabels[request.status] || request.status)}</span>
    <span>Payment: ${escapeHtml(paymentLabels[request.payment_status] || request.payment_status)}</span>
    <span>Quote: ${escapeHtml(formatCurrency(request.quote_amount, request.quote_currency))}</span>
    <span>Funds: ${escapeHtml(fundsStatus)}</span>
    <span>Protected amount: ${escapeHtml(formatAmount(request.protected_amount, request.quote_currency))}</span>
    ${request.identity_verification_required ? `<span>ID verification: ${escapeHtml(verificationStatus)}</span>` : ""}
    ${request.release_condition ? `<p>${escapeHtml(request.release_condition)}</p>` : ""}
    ${renderMilestones(request)}
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
      const fundsStatus = fundsStatusLabels[request.funds_status] || request.funds_status || "Not collected";
      return `
        <article>
          <strong>${escapeHtml(request.request_code)}</strong>
          <span>${escapeHtml(servicePackageLabels[request.service_package] || request.service_package || "Quote-first service")} in ${escapeHtml(request.kenya_location || "Kenya")}</span>
          <span>Status: ${escapeHtml(statusLabels[request.status] || request.status)}. Payment: ${escapeHtml(paymentLabels[request.payment_status] || request.payment_status)}.</span>
          <span>Quote: ${escapeHtml(formatCurrency(request.quote_amount, request.quote_currency))}</span>
          <span>Funds: ${escapeHtml(fundsStatus)}. Protected: ${escapeHtml(formatAmount(request.protected_amount, request.quote_currency))}.</span>
          ${renderMilestones(request)}
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

  const jobItems = jobs
    .map((job) => {
      const supportingLinks = Array.isArray(job.supporting_links)
        ? job.supporting_links.map(safeHttpUrl).filter(Boolean)
        : [];
      const proofLinks = Array.isArray(job.proof_links) ? job.proof_links.map(safeHttpUrl).filter(Boolean) : [];
      const localContact = [job.local_contact_name, job.local_contact_phone].filter(Boolean).join(" / ") || "Not provided";

      return `
        <article>
          <strong>${escapeHtml(job.request_code)}</strong>
          <span>${escapeHtml(servicePackageLabels[job.service_package] || job.service_package || "Quote-first service")} - ${escapeHtml(taskLabels[job.task_type] || job.task_type || "Task")} in ${escapeHtml(job.kenya_location || "Kenya")}</span>
          <span>Status: ${escapeHtml(statusLabels[job.status] || job.status)}. Urgency: ${escapeHtml(job.urgency || "standard")}.</span>
          <span>Deadline: ${escapeHtml(job.deadline || "Flexible")}. Local contact: ${escapeHtml(localContact)}.</span>
          <span>Proof needed: ${escapeHtml(Array.isArray(job.report_pack) && job.report_pack.length ? job.report_pack.join(", ") : "Basic update")}.</span>
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
      setAccountStatus({ mode: sessionResult.mode });
      return;
    }

    const [clientResult, partnerResult, assignedJobsResult] = await Promise.all([
      window.SwadaktaData.listMyRequests(),
      window.SwadaktaData.listMyPartnerApplications(),
      window.SwadaktaData.listMyAssignedJobs(),
    ]);

    renderClientAccount(email, clientResult.data || []);
    renderPartnerAccount(email, partnerResult.data || [], assignedJobsResult.data || []);
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
      ? "Account link sent. Open it in this browser to create or open your account."
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

if (portalSignOut) {
  portalSignOut.addEventListener("click", async () => {
    portalSignOut.textContent = "Signing out...";
    await window.SwadaktaData.signOut();
    if (clientAccountPanel) {
      clientAccountPanel.innerHTML = "";
    }
    if (partnerAccountPanel) {
      partnerAccountPanel.innerHTML = "";
    }
    setAccountStatus();
    portalSignOut.textContent = "Sign out";
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
