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
  const copyProviderPackButtons = document.querySelectorAll("#copy-provider-pack, #copy-provider-pack-mobile");
  const readinessMode = document.querySelector("#readiness-mode");
  const readinessStatus = document.querySelector("#readiness-status");
  const nextActionsList = document.querySelector("#next-actions-list");
  const nextActionsCount = document.querySelector("#next-actions-count");
  const categories = document.querySelector("#readiness-categories");
  const providerPackList = document.querySelector("#provider-pack-list");
  const protectedActions = document.querySelector("#protected-actions");
  const launchGateSummary = document.querySelector("#launch-gate-summary");
  const launchGateLabel = document.querySelector("#launch-gate-label");
  const launchPublicSite = document.querySelector("#launch-public-site");
  const launchPaidJobs = document.querySelector("#launch-paid-jobs");
  const launchFounderLoad = document.querySelector("#launch-founder-load");
  const launchBlockersList = document.querySelector("#launch-blockers-list");
  const launchEvidenceList = document.querySelector("#launch-evidence-list");
  const copyLaunchGateButton = document.querySelector("#copy-launch-gate");

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

  function actionableCategoryItems(category = {}) {
    const items = Array.isArray(category.items) ? category.items : [];
    return items.filter((entry) => entry.status !== "ready" || entry.copy_value || entry.docs_url);
  }

  function categoryStatusSummary(category = {}) {
    const items = Array.isArray(category.items) ? category.items : [];
    const counts = items.reduce(
      (summary, entry) => {
        summary[entry.status] = (summary[entry.status] || 0) + 1;
        return summary;
      },
      { ready: 0, warning: 0, missing: 0, manual: 0 },
    );
    return `${counts.ready || 0} ready / ${counts.warning || 0} check / ${counts.missing || 0} missing / ${counts.manual || 0} manual`;
  }

  function launchStatusTone(status) {
    if (status === "launch_ready" || status === "ready" || status === "low") return "text-emerald-700";
    if (status === "paid_launch_blocked" || status === "blocked" || status === "high") return "text-on-error-container";
    return "text-amber-800";
  }

  function launchValueLabel(value) {
    return String(value || "checking").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function launchGateBrief(report = latestReport) {
    const gate = report?.launch_gate || {};
    const blockers = Array.isArray(gate.blockers) ? gate.blockers : [];
    const checks = Array.isArray(gate.checks) ? gate.checks : [];
    const evidence = Array.isArray(gate.evidence) ? gate.evidence : [];
    return [
      "Swadakta public launch gate",
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      `Gate: ${gate.label || "Checking"}`,
      `Public site: ${launchValueLabel(gate.public_site)}`,
      `Paid jobs: ${launchValueLabel(gate.paid_jobs)}`,
      `Founder load: ${launchValueLabel(gate.founder_load)}`,
      "",
      "Summary:",
      gate.summary || "No launch gate summary returned.",
      "",
      "Blockers:",
      ...(blockers.length
        ? blockers.map((entry) => `- ${entry.category}: ${entry.label}. ${entry.next || "Review setup."}`)
        : ["- No blocking items returned."]),
      "",
      "Checks:",
      ...(checks.length
        ? checks.map((entry) => `- [${statusLabel(entry.status)}] ${entry.category}: ${entry.label}. ${entry.next || "Review setup."}`)
        : ["- No manual/warning checks returned."]),
      "",
      "Evidence:",
      ...(evidence.length ? evidence.map((entry) => `- ${entry}`) : ["- No evidence notes returned."]),
      "",
      "Founder rule: do not accept paid work unless payment evidence, ID/provider evidence, route rules, proof requirements, and payout gates are clear.",
    ].join("\n");
  }

  function renderLaunchGate(report = latestReport) {
    const gate = report?.launch_gate || {};
    const blockers = Array.isArray(gate.blockers) ? gate.blockers : [];
    const evidence = Array.isArray(gate.evidence) ? gate.evidence : [];

    if (launchGateSummary) {
      launchGateSummary.textContent = gate.summary || "Launch gate has not loaded yet.";
    }
    if (launchGateLabel) {
      launchGateLabel.textContent = gate.label || "Checking";
      launchGateLabel.className = `mt-2 block font-display text-2xl ${launchStatusTone(gate.status)}`.trim();
    }
    if (launchPublicSite) {
      launchPublicSite.textContent = launchValueLabel(gate.public_site);
      launchPublicSite.className = `mt-2 block font-display text-2xl ${launchStatusTone(gate.public_site)}`.trim();
    }
    if (launchPaidJobs) {
      launchPaidJobs.textContent = launchValueLabel(gate.paid_jobs);
      launchPaidJobs.className = `mt-2 block font-display text-2xl ${launchStatusTone(gate.paid_jobs)}`.trim();
    }
    if (launchFounderLoad) {
      launchFounderLoad.textContent = launchValueLabel(gate.founder_load);
      launchFounderLoad.className = `mt-2 block font-display text-2xl ${launchStatusTone(gate.founder_load)}`.trim();
    }
    if (launchBlockersList) {
      launchBlockersList.innerHTML = blockers.length
        ? blockers
            .map(
              (entry) => `
                <li class="rounded-2xl bg-white/70 p-3">
                  <strong class="block text-on-surface">${escapeHtml(entry.label || "Launch blocker")}</strong>
                  <span class="mt-1 block text-xs leading-5">${escapeHtml(entry.category || "Readiness")} / ${escapeHtml(entry.owner || "Founder/admin")}</span>
                  <span class="mt-2 block text-xs leading-5">${escapeHtml(entry.next || "Review setup.")}</span>
                </li>
              `,
            )
            .join("")
        : `<li class="rounded-2xl bg-white/70 p-3">No paid-launch blockers returned by the readiness API.</li>`;
    }
    if (launchEvidenceList) {
      launchEvidenceList.innerHTML = evidence.length
        ? evidence.map((entry) => `<li class="rounded-2xl bg-white/70 p-3">${escapeHtml(entry)}</li>`).join("")
        : `<li class="rounded-2xl bg-white/70 p-3">No evidence notes returned yet.</li>`;
    }
  }

  function providerPackCategoryText(category = {}, report = latestReport) {
    const safeValues = Object.entries(report?.safe_copy_values || {});
    const categoryItems = actionableCategoryItems(category);
    const lines = [
      `Swadakta provider setup pack: ${category.label || category.id || "Readiness"}`,
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      `Environment: ${report?.environment?.vercel_env || "unknown"} / ${report?.environment?.public_base_url || "domain unknown"}`,
      `Status: ${categoryStatusSummary(category)}`,
      "",
      "Setup actions:",
      ...(categoryItems.length
        ? categoryItems.map((entry, index) => {
            const missing = entry.missing?.length ? ` Missing env/settings: ${entry.missing.join(", ")}.` : "";
            const docs = entry.docs_url ? ` Docs: ${entry.docs_url}.` : "";
            const safeValue = entry.copy_value ? ` Safe copy value: ${entry.copy_value}.` : "";
            return `${index + 1}. [${statusLabel(entry.status)}] ${entry.label}: ${entry.next || entry.detail || "Review setup."}${missing}${safeValue}${docs} Owner: ${entry.owner || "Founder/admin"}.`;
          })
        : ["1. No non-ready setup items in this category."]),
      "",
      "Global safe callback values:",
      ...(safeValues.length ? safeValues.map(([key, value]) => `${key}: ${value}`) : ["No safe callback values returned."]),
      "",
      "Boundary:",
      "Do not paste secret keys into chat, email, screenshots, support tickets, or client-visible pages.",
      "AI can help draft setup notes, but provider dashboards and founder/admin approval control secrets, money, identity, assignment, and release decisions.",
    ];

    return lines.join("\n");
  }

  function buildProviderPack(report = latestReport) {
    if (!report) return "";
    return [
      "Swadakta provider setup pack",
      "Use this to configure Stripe, PayPal, M-Pesa/Daraja, Wise fallback, Supabase, Vercel, AI, and ID-provider dashboards.",
      "",
      ...(report.categories || []).map((category) => providerPackCategoryText(category, report)),
    ].join("\n\n---\n\n");
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

  function renderProviderPacks(report) {
    if (!providerPackList) return;
    const categories = Array.isArray(report?.categories) ? report.categories : [];

    providerPackList.innerHTML = categories.length
      ? categories
          .map((category) => {
            const items = actionableCategoryItems(category);
            const copyCount = items.filter((entry) => entry.copy_value).length;
            const docsCount = items.filter((entry) => entry.docs_url).length;
            return `
              <article class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="font-label text-xs uppercase tracking-[0.16em] text-secondary">${escapeHtml(category.id || "provider")}</p>
                    <h3 class="mt-1 font-display text-xl font-extrabold">${escapeHtml(category.label || "Provider setup")}</h3>
                    <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(categoryStatusSummary(category))}</p>
                    <p class="mt-2 text-xs text-secondary">${escapeHtml(String(items.length))} action lines, ${escapeHtml(String(copyCount))} safe values, ${escapeHtml(String(docsCount))} docs links.</p>
                  </div>
                  <button class="copy-category-pack inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" data-copy-category-pack="${escapeHtml(category.id || "")}" type="button">Copy pack</button>
                </div>
              </article>
            `;
          })
          .join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No provider packs returned by the readiness API.</div>`;
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
    renderLaunchGate(report);
    nextActionsCount.textContent = `${nextActions.length} priorit${nextActions.length === 1 ? "y" : "ies"}`;
    nextActionsList.innerHTML = nextActions.length
      ? nextActions.map(renderAction).join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No missing setup actions returned by the readiness API.</div>`;
    categories.innerHTML = (report.categories || []).map(renderCategory).join("");
    renderProviderPacks(report);
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
    if (providerPackList) {
      providerPackList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    }
    renderLaunchGate({});
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

  copyProviderPackButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await copyText(buildProviderPack(), "Provider setup pack copied.");
    });
  });

  copyLaunchGateButton?.addEventListener("click", async () => {
    await copyText(launchGateBrief(), "Launch gate brief copied.");
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-value");
    if (button) {
      await copyText(button.dataset.copyValue, "Safe value copied.");
      return;
    }

    const categoryButton = event.target.closest(".copy-category-pack");
    if (categoryButton) {
      const category = (latestReport?.categories || []).find((entry) => entry.id === categoryButton.dataset.copyCategoryPack);
      await copyText(providerPackCategoryText(category, latestReport), "Category provider pack copied.");
    }
  });

  loadReadiness();
})();
