(function () {
  const data = window.SwadaktaData;
  if (!data) return;

  const authPanel = document.querySelector("#admin-auth-panel");
  const loginForm = document.querySelector("#admin-login-form");
  const emailInput = document.querySelector("#admin-email");
  const passwordInput = document.querySelector("#admin-password");
  const loginStatus = document.querySelector("#admin-login-status");
  const signOutButtons = document.querySelectorAll(".admin-sign-out-control");
  const refreshButton = document.querySelector("#refresh-ops");
  const opsMode = document.querySelector("#ops-mode");
  const opsStatus = document.querySelector("#ops-status");
  const opsList = document.querySelector("#ops-list");
  const filterButtons = document.querySelectorAll(".ops-filter");

  let currentFilter = "exceptions";
  let currentRequests = [];

  const closedStatuses = new Set(["completed", "cancelled"]);
  const paidStatuses = new Set(["paid", "deposit_paid"]);
  const riskyCompliance = new Set(["needs_admin_review", "restricted", "permit_required", "prohibited"]);

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
    );
  }

  function formatStatus(value) {
    return String(value || "unknown")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatDate(value) {
    if (!value) return "No date";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }

  function margin(request) {
    const quote = Number(request.quote_amount || 0);
    const costs =
      Number(request.operator_payout || 0) +
      Number(request.field_costs || 0) +
      Number(request.payment_processing_fee || 0);
    return quote - costs;
  }

  function formatMoney(amount, currency = "AUD") {
    const value = Number(amount || 0);
    if (!value) return `${currency} 0`;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${currency} ${value}`;
    }
  }

  function isOverdue(value) {
    if (!value) return false;
    const due = new Date(value);
    if (Number.isNaN(due.getTime())) return false;
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  }

  function routeLabel(request) {
    return [request.origin_country, request.destination_country].filter(Boolean).join(" to ") || "Route not set";
  }

  function taskLabel(request) {
    return request.task_location || request.kenya_location || request.service_package || "Request";
  }

  function requestFlags(request) {
    const flags = [];
    const requestMargin = margin(request);

    if (request.admin_review_required) flags.push(["Founder review", "admin"]);
    if (request.route_status && request.route_status !== "active") flags.push([`Route ${formatStatus(request.route_status)}`, "route"]);
    if (riskyCompliance.has(request.compliance_status)) flags.push([formatStatus(request.compliance_status), "compliance"]);
    if (request.identity_verification_required && request.verification_status !== "verified") {
      flags.push([`ID ${formatStatus(request.verification_status || "required")}`, "identity"]);
    }
    if (!paidStatuses.has(request.payment_status) && request.quote_amount) flags.push(["Payment pending", "payment"]);
    if (isOverdue(request.payment_due_at) && !paidStatuses.has(request.payment_status)) flags.push(["Payment overdue", "payment"]);
    if (request.funds_status === "disputed" || request.funds_status === "refund_pending") {
      flags.push([formatStatus(request.funds_status), "money"]);
    }
    if (request.quote_amount && requestMargin <= 0) flags.push(["Margin risk", "margin"]);
    if (request.status === "in_progress" && !request.assigned_partner_id) flags.push(["No receiver assigned", "assignment"]);
    if (request.sensitive_documents_expected) flags.push(["Sensitive documents", "identity"]);

    return flags;
  }

  function nextAction(request, flags) {
    const kinds = new Set(flags.map(([, kind]) => kind));
    if (kinds.has("money") || kinds.has("margin")) return "Review protected money state, costs, and milestone release conditions before any payout.";
    if (kinds.has("payment")) return "Confirm quote, send or regenerate payment route, and do not start paid work until provider evidence exists.";
    if (kinds.has("identity")) return "Send or review provider ID verification before paid, sensitive, or receiver work continues.";
    if (kinds.has("compliance") || kinds.has("route")) return "Check corridor legality, restricted goods, route coverage, and proof plan before assignment.";
    if (kinds.has("assignment")) return "Assign only a vetted, ID-verified receiver with matching coverage.";
    return "Monitor normally; AI/autopilot can handle routine follow-up unless a protected decision appears.";
  }

  function setStatus(message, tone = "text-on-surface-variant") {
    opsStatus.textContent = message;
    opsStatus.className = `mt-4 min-h-6 text-sm ${tone}`.trim();
  }

  function setLoginStatus(message, tone = "text-on-surface-variant") {
    loginStatus.textContent = message;
    loginStatus.className = `min-h-6 text-sm ${tone}`.trim();
  }

  function isLocalHost() {
    return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  }

  function showAuth(show) {
    authPanel.hidden = !show;
  }

  function setStat(id, value) {
    const node = document.querySelector(id);
    if (node) node.textContent = String(value);
  }

  function openRequests() {
    return currentRequests.filter((request) => !closedStatuses.has(request.status));
  }

  function paymentRequests() {
    return openRequests().filter(
      (request) =>
        (!paidStatuses.has(request.payment_status) && request.quote_amount) ||
        (isOverdue(request.payment_due_at) && !paidStatuses.has(request.payment_status)),
    );
  }

  function exceptionRequests() {
    return openRequests().filter((request) => requestFlags(request).length > 0);
  }

  function updateFilterUi() {
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === currentFilter;
      button.className = active
        ? "ops-filter rounded-full bg-on-surface px-4 py-2 font-label text-sm font-bold text-white"
        : "ops-filter rounded-full border border-outline-variant/50 bg-white/70 px-4 py-2 font-label text-sm font-bold text-on-surface-variant";
    });
  }

  function copyQuoteText(request, flags) {
    return [
      `Swadakta request ${request.request_code}`,
      `Client: ${request.client_name || "Client"}`,
      `Route: ${routeLabel(request)}`,
      `Task: ${taskLabel(request)}`,
      `Status: ${formatStatus(request.status)} / payment ${formatStatus(request.payment_status)}`,
      `Quote: ${formatMoney(request.quote_amount, request.quote_currency || request.preferred_currency || "AUD")}`,
      `Funds guard: ${formatStatus(request.funds_status || "not_collected")}`,
      `Founder note: ${nextAction(request, flags)}`,
      "Protected decisions are not delegated to AI: paid status, ID approval, assignment, and payout release require provider evidence or founder/admin approval.",
    ].join("\n");
  }

  function renderRequest(request) {
    const flags = requestFlags(request);
    const requestMargin = margin(request);
    const currency = request.quote_currency || request.preferred_currency || "AUD";
    const flagBadges = flags.length
      ? flags
          .map(
            ([label, kind]) =>
              `<span class="rounded-full px-3 py-1 font-label text-xs ${
                kind === "payment" || kind === "margin" || kind === "money"
                  ? "bg-amber-400/20 text-amber-800"
                  : kind === "identity" || kind === "compliance"
                    ? "bg-error-container text-on-error-container"
                    : "bg-primary/10 text-primary"
              }">${escapeHtml(label)}</span>`,
          )
          .join("")
      : `<span class="rounded-full bg-emerald-500/10 px-3 py-1 font-label text-xs text-emerald-700">Routine</span>`;

    return `
      <article class="rounded-3xl border border-outline-variant/30 bg-white/62 p-5">
        <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <strong class="font-display text-2xl">${escapeHtml(request.request_code || "Request")}</strong>
              ${flagBadges}
            </div>
            <p class="mt-2 text-sm leading-6 text-on-surface-variant">
              ${escapeHtml(request.client_name || "Client")} / ${escapeHtml(routeLabel(request))} / ${escapeHtml(taskLabel(request))}
            </p>
            <p class="mt-3 text-sm leading-6 text-on-surface-variant">${escapeHtml(nextAction(request, flags))}</p>
          </div>
          <div class="grid gap-2 text-sm text-on-surface-variant sm:grid-cols-2 lg:min-w-[22rem]">
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Status</strong>${escapeHtml(formatStatus(request.status))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Payment</strong>${escapeHtml(formatStatus(request.payment_status))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Quote</strong>${escapeHtml(formatMoney(request.quote_amount, currency))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Margin</strong>${escapeHtml(formatMoney(requestMargin, currency))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Due</strong>${escapeHtml(formatDate(request.payment_due_at))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Funds</strong>${escapeHtml(formatStatus(request.funds_status))}</span>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button class="copy-request rounded-full border border-outline-variant/50 bg-white/72 px-4 py-2 font-label text-sm font-bold text-primary" data-request-id="${escapeHtml(request.id)}" type="button">Copy founder brief</button>
          <a class="rounded-full border border-outline-variant/50 bg-white/72 px-4 py-2 font-label text-sm font-bold text-on-surface-variant" href="tracking.html">Open tracking</a>
          <a class="rounded-full bg-primary px-4 py-2 font-label text-sm font-bold text-white" href="assistant.html">Ask AI</a>
        </div>
      </article>
    `;
  }

  function renderQueue() {
    updateFilterUi();
    const open = openRequests();
    const exceptions = exceptionRequests();
    const payments = paymentRequests();
    const marginRisk = open.filter((request) => request.quote_amount && margin(request) <= 0);
    setStat("#stat-open", open.length);
    setStat("#stat-exceptions", exceptions.length);
    setStat("#stat-payments", payments.length);
    setStat("#stat-margin", marginRisk.length);

    const visible =
      currentFilter === "all" ? open : currentFilter === "payments" ? payments : exceptions.length ? exceptions : open;

    if (!visible.length) {
      opsList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No live requests matched this filter. Routine work can stay with AI/autopilot until a protected decision appears.</div>`;
      return;
    }

    opsList.innerHTML = visible.map(renderRequest).join("");
  }

  async function loadOps() {
    showAuth(false);
    opsMode.textContent = "Loading operations";
    opsList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">Loading live requests...</div>`;

    try {
      const sessionResult = await data.getSession();
      if (!sessionResult.session && sessionResult.mode !== "local") {
        emailInput.value = window.SWADAKTA_CONFIG?.adminEmail || "";
        showAuth(true);
        opsMode.textContent = "Sign in needed";
        setStatus("Sign in as a Swadakta admin to view live operations.");
        opsList.innerHTML = "";
        return;
      }

      try {
        await data.getOperationsReadiness();
      } catch (readinessError) {
        if (!isLocalHost()) {
          throw readinessError;
        }
        setStatus("Local static mode cannot call the Vercel readiness API; loading requests through Supabase/RLS instead.");
      }

      const result = await data.listRequests();
      currentRequests = result.data || [];
      opsMode.textContent = result.mode === "local" ? "Local demo requests" : "Live production requests";
      setStatus(`Updated ${new Date().toLocaleString()}. Showing protected-decision exceptions first.`);
      renderQueue();
    } catch (error) {
      const message = error.message || "Could not load operations.";
      if (/admin/i.test(message)) {
        opsMode.textContent = "Admin permission required";
        opsList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">This account is signed in, but it is not listed as a Swadakta admin yet.</div>`;
        return;
      }
      showAuth(true);
      opsMode.textContent = "Needs attention";
      setStatus(message, "text-on-error-container");
      opsList.innerHTML = "";
    }
  }

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setLoginStatus("Enter the admin email and password.", "text-on-error-container");
      return;
    }

    setLoginStatus("Signing in...");
    try {
      await data.signInWithPassword(email, password);
      passwordInput.value = "";
      setLoginStatus("Signed in. Loading operations.", "text-primary");
      await loadOps();
    } catch (error) {
      setLoginStatus(error.message || "Sign-in failed.", "text-on-error-container");
    }
  });

  signOutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await data.signOut();
      await loadOps();
    });
  });

  refreshButton?.addEventListener("click", loadOps);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter || "exceptions";
      renderQueue();
    });
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-request");
    if (!button) return;
    const request = currentRequests.find((item) => item.id === button.dataset.requestId);
    if (!request) return;
    const flags = requestFlags(request);
    try {
      await navigator.clipboard.writeText(copyQuoteText(request, flags));
      setStatus(`Copied founder brief for ${request.request_code}.`, "text-primary");
    } catch {
      setStatus("Could not copy. Open the request and copy manually.", "text-on-error-container");
    }
  });

  loadOps();
})();
