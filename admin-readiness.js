(function () {
  const data = window.SwadaktaData;
  if (!data) return;

  const authPanel = document.querySelector("#admin-auth-panel");
  const loginForm = document.querySelector("#admin-login-form");
  const emailInput = document.querySelector("#admin-email");
  const passwordInput = document.querySelector("#admin-password");
  const loginStatus = document.querySelector("#admin-login-status");
  const sendLinkButton = document.querySelector("#send-admin-link");
  const signOutButtons = document.querySelectorAll(".admin-sign-out-control");
  const refreshButton = document.querySelector("#refresh-readiness");
  const copyChecklistButton = document.querySelector("#copy-checklist");
  const readinessMode = document.querySelector("#readiness-mode");
  const readinessStatus = document.querySelector("#readiness-status");
  const nextActionsList = document.querySelector("#next-actions-list");
  const nextActionsCount = document.querySelector("#next-actions-count");
  const categories = document.querySelector("#readiness-categories");
  const protectedActions = document.querySelector("#protected-actions");

  let latestReport = null;

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

  function statusLabel(status) {
    return {
      ready: "Ready",
      warning: "Check",
      missing: "Missing",
      manual: "Manual",
    }[status] || "Review";
  }

  function statusTone(status) {
    if (status === "ready") return "bg-emerald-500/10 text-emerald-700";
    if (status === "missing") return "bg-error-container text-on-error-container";
    if (status === "warning") return "bg-amber-400/20 text-amber-800";
    if (status === "manual") return "bg-sky-500/10 text-sky-800";
    return "bg-surface-container text-secondary";
  }

  function setLoginStatus(message, tone = "text-on-surface-variant") {
    loginStatus.textContent = message;
    loginStatus.className = `min-h-6 text-sm ${tone}`.trim();
  }

  function setReadinessStatus(message, tone = "text-on-surface-variant") {
    readinessStatus.textContent = message;
    readinessStatus.className = `mt-4 min-h-6 text-sm ${tone}`.trim();
  }

  function showAuth(show) {
    authPanel.hidden = !show;
  }

  async function copyText(text, successMessage = "Copied.") {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setReadinessStatus(successMessage, "text-primary");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setReadinessStatus(successMessage, "text-primary");
    }
  }

  function buildChecklist(report = latestReport) {
    if (!report) return "";
    const counts = report.counts || {};
    const environment = report.environment || {};
    const nextActions = report.next_actions || [];
    const copyValues = report.safe_copy_values || {};
    return [
      "Swadakta launch readiness checklist",
      `Generated: ${report.generated_at || new Date().toISOString()}`,
      `Environment: ${environment.vercel_env || "unknown"} / ${environment.public_base_url || "domain unknown"}`,
      `Counts: ${counts.ready || 0} ready, ${counts.warning || 0} check, ${counts.missing || 0} missing, ${counts.manual || 0} manual`,
      "",
      "Next setup actions:",
      ...(nextActions.length
        ? nextActions.map((entry, index) => {
            const missing = entry.missing?.length ? ` Missing: ${entry.missing.join(", ")}.` : "";
            return `${index + 1}. [${statusLabel(entry.status)}] ${entry.label}: ${entry.next || "Review setup."}${missing}`;
          })
        : ["1. No missing setup actions returned by the readiness API."]),
      "",
      "Safe copy values:",
      ...Object.entries(copyValues).map(([key, value]) => `${key}: ${value}`),
      "",
      "Protected decisions:",
      ...(report.protected_actions || []).map((action) => `- ${action}`),
    ].join("\n");
  }

  function updateStats(counts = {}) {
    document.querySelector("#stat-ready").textContent = counts.ready || 0;
    document.querySelector("#stat-warning").textContent = counts.warning || 0;
    document.querySelector("#stat-missing").textContent = counts.missing || 0;
    document.querySelector("#stat-manual").textContent = counts.manual || 0;
  }

  function actionButtons(entry) {
    const docs = entry.docs_url
      ? `<a class="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" href="${escapeHtml(entry.docs_url)}" target="_blank" rel="noopener">Docs</a>`
      : "";
    const copy = entry.copy_value
      ? `<button class="copy-value inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-on-surface-variant" data-copy-value="${escapeHtml(entry.copy_value)}" type="button">Copy value</button>`
      : "";
    return docs || copy ? `<div class="flex flex-wrap gap-2">${docs}${copy}</div>` : "";
  }

  function renderAction(entry, index) {
    const missing = entry.missing?.length ? entry.missing.join(", ") : "";
    return `
      <article class="grid gap-4 rounded-3xl border border-outline-variant/30 bg-white/58 p-5 md:grid-cols-[2.5rem_1fr_auto] md:items-start">
        <span class="grid h-10 w-10 place-items-center rounded-full bg-on-surface font-label text-sm font-bold text-white">${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <strong class="font-display text-xl">${escapeHtml(entry.label || "Setup action")}</strong>
            <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(entry.status)}">${escapeHtml(statusLabel(entry.status))}</span>
          </div>
          <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(entry.next || "Review this setup item.")}</p>
          ${missing ? `<p class="mt-2 font-label text-xs uppercase tracking-[0.14em] text-secondary">Missing: ${escapeHtml(missing)}</p>` : ""}
          ${entry.owner ? `<p class="mt-2 text-xs text-secondary">Owner: ${escapeHtml(entry.owner)}</p>` : ""}
        </div>
        ${actionButtons(entry)}
      </article>
    `;
  }

  function renderCategory(category) {
    return `
      <section class="glass-panel rounded-[2rem] p-6 md:p-8">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-label text-sm uppercase tracking-[0.18em] text-primary">${escapeHtml(category.id || "readiness")}</p>
            <h2 class="mt-1 font-display text-3xl font-extrabold">${escapeHtml(category.label || "Readiness")}</h2>
          </div>
          <span class="rounded-full bg-white/70 px-4 py-2 font-label text-sm text-secondary">${escapeHtml(String((category.items || []).length))} checks</span>
        </div>
        <div class="mt-6 grid gap-3">
          ${(category.items || [])
            .map(
              (entry) => `
                <article class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <strong class="font-display text-xl">${escapeHtml(entry.label || "Check")}</strong>
                        <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(entry.status)}">${escapeHtml(statusLabel(entry.status))}</span>
                      </div>
                      <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(entry.detail || "")}</p>
                      <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(entry.next || "")}</p>
                      ${entry.missing?.length ? `<p class="mt-2 font-label text-xs uppercase tracking-[0.14em] text-secondary">Missing: ${escapeHtml(entry.missing.join(", "))}</p>` : ""}
                    </div>
                    ${actionButtons(entry)}
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderReport(report, mode) {
    latestReport = report;
    const counts = report.counts || {};
    const nextActions = report.next_actions || [];
    readinessMode.textContent = mode === "vercel" ? "Live production checks" : "Local demo checks";
    setReadinessStatus(
      `Updated ${new Date(report.generated_at || Date.now()).toLocaleString()}. Safe callback values can be copied without exposing secrets.`,
      "text-on-surface-variant",
    );
    updateStats(counts);
    nextActionsCount.textContent = `${nextActions.length} priorit${nextActions.length === 1 ? "y" : "ies"}`;
    nextActionsList.innerHTML = nextActions.length
      ? nextActions.map(renderAction).join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No missing setup actions returned by the readiness API.</div>`;
    categories.innerHTML = (report.categories || []).map(renderCategory).join("");
    protectedActions.innerHTML = (report.protected_actions || [])
      .map(
        (action) => `
          <li class="flex gap-3 rounded-3xl border border-outline-variant/30 bg-white/58 p-4">
            <span class="material-symbols-outlined text-primary">lock</span>
            <span>${escapeHtml(action)}</span>
          </li>
        `,
      )
      .join("");
  }

  function renderEmpty(message) {
    updateStats({});
    nextActionsCount.textContent = "0 priorities";
    nextActionsList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    categories.innerHTML = "";
    protectedActions.innerHTML = "";
  }

  async function loadReadiness() {
    showAuth(false);
    readinessMode.textContent = "Loading readiness";
    renderEmpty("Loading readiness checks...");

    try {
      const sessionResult = await data.getSession();
      if (!sessionResult.session && sessionResult.mode !== "local") {
        emailInput.value = window.SWADAKTA_CONFIG?.adminEmail || "";
        showAuth(true);
        readinessMode.textContent = "Sign in needed";
        renderEmpty("Sign in as a Swadakta admin to view production setup checks.");
        return;
      }

      const result = await data.getOperationsReadiness();
      renderReport(result.data, result.mode);
    } catch (error) {
      const message = error.message || "Could not load readiness.";
      if (/admin/i.test(message)) {
        readinessMode.textContent = "Admin permission required";
        renderEmpty("This account is signed in, but it is not listed as a Swadakta admin yet.");
        return;
      }

      showAuth(true);
      readinessMode.textContent = "Needs attention";
      renderEmpty(message);
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
      setLoginStatus("Signed in. Loading readiness.", "text-primary");
      await loadReadiness();
    } catch (error) {
      setLoginStatus(error.message || "Sign-in failed.", "text-on-error-container");
    }
  });

  sendLinkButton?.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
      setLoginStatus("Enter the admin email first.", "text-on-error-container");
      return;
    }

    setLoginStatus("Sending backup link...");
    try {
      await data.signInAdmin(email, "admin-readiness.html");
      setLoginStatus("Backup link sent. Open it in this browser, then return here.", "text-primary");
    } catch (error) {
      setLoginStatus(error.message || "Could not send backup link.", "text-on-error-container");
    }
  });

  signOutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await data.signOut();
      await loadReadiness();
    });
  });

  refreshButton?.addEventListener("click", loadReadiness);

  copyChecklistButton?.addEventListener("click", async () => {
    await copyText(buildChecklist(), "Launch checklist copied.");
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-value");
    if (!button) return;
    await copyText(button.dataset.copyValue, "Safe value copied.");
  });

  loadReadiness();
})();
