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

let requests = [];
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

function renderSupportingLinks(request) {
  const links = Array.isArray(request.supporting_links)
    ? request.supporting_links.map((link) => String(link || "").trim()).filter(Boolean)
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
        <div><dt>Client base</dt><dd>${escapeHtml(request.australia_location || "Not specified")}</dd></div>
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
  const consentStatus = formatConsentStatus(request);
  const contactPreference = request.contact_preference || "whatsapp";
  const sensitiveDocuments = request.sensitive_documents_expected ? "Yes" : "No";
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
        <div><dt>Contact window</dt><dd>${escapeHtml(request.contact_window || "Not specified")}</dd></div>
        <div><dt>Sensitive docs</dt><dd>${escapeHtml(sensitiveDocuments)}</dd></div>
        <div><dt>Reports</dt><dd>${escapeHtml(reports || "Basic update")}</dd></div>
        <div><dt>Estimate</dt><dd>${formatCurrency(request.estimate_aud)}</dd></div>
        <div><dt>Quote</dt><dd>${escapeHtml(formatCurrency(request.quote_amount, quoteCurrency))}</dd></div>
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
      return;
    }

    authCard.hidden = true;
    signOutButton.hidden = backendMode !== "supabase";
    const result = await window.SwadaktaData.listRequests();
    backendMode = result.mode;
    requests = result.data || [];
    renderRequests();
  } catch (error) {
    requestBoard.innerHTML = `
      <div class="empty-state is-error">
        <h2>Could not load requests</h2>
        <p>${escapeHtml(error.message || "Check Supabase keys, RLS policies, and admin access.")}</p>
      </div>
    `;
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
    .filter(Boolean);

  return {
    status: formData.get("status"),
    payment_status: formData.get("payment_status"),
    assigned_to: formData.get("assigned_to"),
    operator_notes: formData.get("operator_notes"),
    client_report: formData.get("client_report"),
    quote_amount: quoteAmount ? Number(quoteAmount) : null,
    quote_currency: formData.get("quote_currency"),
    payment_link: formData.get("payment_link"),
    payment_due_at: formData.get("payment_due_at") || null,
    client_report_url: formData.get("client_report_url"),
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

requestBoard.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy-update");
  if (!button) {
    return;
  }

  const form = button.closest(".request-update-form");
  const card = button.closest(".request-card");
  const request = getRequestByCard(card);
  const statusElement = form.querySelector(".copy-status");

  if (request) {
    await copyText(buildClientUpdate(request, form), statusElement);
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
