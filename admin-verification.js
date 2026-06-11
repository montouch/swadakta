(function () {
  const data = window.SwadaktaData;
  if (!data) return;

  const authPanel = document.querySelector("#admin-auth-panel");
  const loginForm = document.querySelector("#admin-login-form");
  const emailInput = document.querySelector("#admin-email");
  const passwordInput = document.querySelector("#admin-password");
  const loginStatus = document.querySelector("#admin-login-status");
  const sendLinkButton = document.querySelector("#send-admin-link");
  const refreshButton = document.querySelector("#refresh-queue");
  const signOutButtons = document.querySelectorAll(".admin-sign-out-control");
  const list = document.querySelector("#verification-list");
  const queueMode = document.querySelector("#queue-mode");

  const providerLabels = {
    smile_id: "Smile ID",
    sumsub: "Sumsub",
    youverify: "Youverify",
    manual: "Manual fallback",
  };

  const statusLabels = {
    requested: "Requested",
    link_sent: "Provider link sent",
    submitted: "Submitted to provider",
    verified: "Verified",
    failed: "Failed",
    expired: "Expired",
    cancelled: "Cancelled",
    manual_review: "Exception review",
  };

  const roleLabels = {
    client: "Client",
    receiver: "Job seeker",
    both: "Client and job seeker",
  };

  const openStatuses = new Set(["requested", "link_sent", "submitted", "manual_review"]);
  const exceptionStatuses = new Set(["manual_review", "failed", "expired"]);

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

  function formatDate(value) {
    if (!value) return "Not recorded";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function nice(value, fallback = "Not recorded") {
    return String(value || "").trim() || fallback;
  }

  function statusTone(status) {
    if (status === "verified") return "bg-emerald-500/10 text-emerald-700";
    if (status === "failed" || status === "expired") return "bg-error-container text-on-error-container";
    if (status === "manual_review") return "bg-amber-400/20 text-amber-800";
    if (status === "submitted" || status === "link_sent") return "bg-primary/10 text-primary";
    return "bg-surface-container text-secondary";
  }

  function suggestedProvider(request) {
    const country = String(request.country || "").trim().toLowerCase();
    if (["nigeria", "ghana"].includes(country)) return "youverify";

    const africa = new Set([
      "algeria",
      "angola",
      "benin",
      "botswana",
      "burkina faso",
      "burundi",
      "cameroon",
      "cape verde",
      "central african republic",
      "chad",
      "comoros",
      "congo",
      "democratic republic of congo",
      "djibouti",
      "egypt",
      "equatorial guinea",
      "eritrea",
      "eswatini",
      "ethiopia",
      "gabon",
      "gambia",
      "ghana",
      "guinea",
      "guinea-bissau",
      "ivory coast",
      "kenya",
      "lesotho",
      "liberia",
      "libya",
      "madagascar",
      "malawi",
      "mali",
      "mauritania",
      "mauritius",
      "morocco",
      "mozambique",
      "namibia",
      "niger",
      "nigeria",
      "rwanda",
      "senegal",
      "seychelles",
      "sierra leone",
      "somalia",
      "south africa",
      "south sudan",
      "sudan",
      "tanzania",
      "togo",
      "tunisia",
      "uganda",
      "zambia",
      "zimbabwe",
    ]);

    if (africa.has(country)) return "smile_id";
    if (country) return "sumsub";
    return "manual";
  }

  function aiBrief(request) {
    const provider = request.provider || suggestedProvider(request);
    const suggested = suggestedProvider(request);
    const name = nice(request.full_name || request.email, "this user");
    const pieces = [];

    if (request.status === "verified") {
      pieces.push(`${name} is verified. Keep them moving; no extra admin action unless the job itself is high risk.`);
    } else if (request.status === "submitted") {
      pieces.push(`Wait for the ${providerLabels[provider] || provider} result. Do not mark verified until the provider outcome or trusted evidence is recorded.`);
    } else if (request.status === "link_sent") {
      pieces.push(`The user has the provider link. If they stall, send a friendly reminder and keep the status here.`);
    } else if (request.status === "failed" || request.status === "expired") {
      pieces.push(`Ask for a retry with a clear ID photo, liveness/selfie, and matching account details. Switch provider only if coverage failed.`);
    } else if (request.status === "manual_review") {
      pieces.push(`This should be an exception. Try ${providerLabels[suggested] || "a provider route"} first unless the country/document is unsupported.`);
    } else if (provider === "manual") {
      pieces.push(`Pick the best provider route first. AI suggests ${providerLabels[suggested] || "manual fallback"} from the current country.`);
    } else {
      pieces.push(`Create or attach a ${providerLabels[provider] || provider} link, then mark this as provider link sent.`);
    }

    if (["paid_work", "receiver_work", "high_value_job", "sensitive_job"].includes(request.reason)) {
      pieces.push("Keep paid work, receiver assignment, and milestone release locked until ID is verified.");
    }

    if (provider !== suggested && suggested !== "manual" && request.status !== "verified") {
      pieces.push(`Provider route looks mismatched. Suggested route: ${providerLabels[suggested]}.`);
    }

    return pieces.join(" ");
  }

  function userMessageDraft(request) {
    const provider = providerLabels[request.provider || suggestedProvider(request)] || "the verification provider";
    if (request.status === "link_sent" && request.provider_link) {
      return `Hi ${nice(request.full_name, "there")}, your Swadakta verification link is ready. Open it when you have a clear photo ID and a quiet minute for the selfie check. Once it is done, we will update your account here.`;
    }
    if (request.status === "failed" || request.status === "expired") {
      return `Hi ${nice(request.full_name, "there")}, the ID check did not go through cleanly. Please retry with a clear original ID photo, matching account details, and good lighting for the selfie check.`;
    }
    if (request.status === "submitted") {
      return `Hi ${nice(request.full_name, "there")}, thanks. Your ID check is with ${provider}. We will update your Swadakta access as soon as the provider result is confirmed.`;
    }
    return `Hi ${nice(request.full_name, "there")}, Swadakta uses ID verification to keep both clients and job seekers safer. We will route you through ${provider}; keep your photo ID and mobile number ready.`;
  }

  function optionTags(options, selected) {
    return options
      .map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`)
      .join("");
  }

  function updateStats(requests) {
    const open = requests.filter((request) => openStatuses.has(request.status)).length;
    const providerReady = requests.filter((request) => request.provider !== "manual").length;
    const exceptions = requests.filter((request) => exceptionStatuses.has(request.status) || request.provider === "manual").length;
    const verified = requests.filter((request) => request.status === "verified").length;

    document.querySelector("#stat-open").textContent = open;
    document.querySelector("#stat-provider").textContent = providerReady;
    document.querySelector("#stat-exception").textContent = exceptions;
    document.querySelector("#stat-verified").textContent = verified;
  }

  function renderEmpty(message) {
    list.innerHTML = `
      <div class="glass-panel rounded-[2rem] p-8 text-center">
        <span class="material-symbols-outlined text-5xl text-primary">verified_user</span>
        <h2 class="mt-3 font-display text-2xl font-extrabold">No verification work right now</h2>
        <p class="mx-auto mt-2 max-w-xl text-on-surface-variant">${escapeHtml(message)}</p>
      </div>
    `;
  }

  function renderRequests(requests) {
    updateStats(requests);
    if (!requests.length) {
      renderEmpty("When users request ID checks, the queue will appear here with provider routing and AI next steps.");
      return;
    }

    list.innerHTML = requests
      .map((request) => {
        const provider = request.provider || suggestedProvider(request);
        const status = request.status || "requested";
        const suggested = suggestedProvider(request);
        const providerMismatch = provider !== suggested && suggested !== "manual" && status !== "verified";
        return `
          <article class="glass-panel rounded-[2rem] p-5 md:p-6" data-request-id="${escapeHtml(request.id)}">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full bg-primary/10 px-3 py-1 font-label text-xs text-primary">${escapeHtml(request.request_code)}</span>
                  <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(status)}">${escapeHtml(statusLabels[status] || status)}</span>
                  <span class="rounded-full bg-white/70 px-3 py-1 font-label text-xs text-secondary">${escapeHtml(providerLabels[provider] || provider)}</span>
                  ${providerMismatch ? `<span class="rounded-full bg-amber-400/20 px-3 py-1 font-label text-xs text-amber-800">AI suggests ${escapeHtml(providerLabels[suggested])}</span>` : ""}
                </div>
                <div>
                  <h3 class="font-display text-2xl font-extrabold">${escapeHtml(nice(request.full_name || request.email, "Unnamed user"))}</h3>
                  <p class="mt-1 text-sm text-on-surface-variant">${escapeHtml(nice(request.email))} · ${escapeHtml(nice(request.whatsapp))}</p>
                </div>
                <dl class="grid gap-3 text-sm text-on-surface-variant sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt class="font-label text-xs uppercase tracking-[0.14em] text-secondary">Role</dt><dd>${escapeHtml(roleLabels[request.account_role] || request.account_role || "Client")}</dd></div>
                  <div><dt class="font-label text-xs uppercase tracking-[0.14em] text-secondary">Country</dt><dd>${escapeHtml(nice(request.country))}</dd></div>
                  <div><dt class="font-label text-xs uppercase tracking-[0.14em] text-secondary">Base</dt><dd>${escapeHtml(nice(request.kenya_base))}</dd></div>
                  <div><dt class="font-label text-xs uppercase tracking-[0.14em] text-secondary">Updated</dt><dd>${escapeHtml(formatDate(request.updated_at))}</dd></div>
                </dl>
              </div>
              ${request.provider_link ? `<a class="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 font-label font-bold text-white" href="${escapeHtml(request.provider_link)}" target="_blank" rel="noopener">Open provider</a>` : ""}
            </div>

            <div class="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <section class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <p class="font-label text-xs uppercase tracking-[0.18em] text-primary">AI next best action</p>
                <p class="mt-3 text-sm leading-6 text-on-surface-variant">${escapeHtml(aiBrief(request))}</p>
                <div class="mt-4 rounded-2xl bg-surface-container-low/70 p-4">
                  <p class="font-label text-xs uppercase tracking-[0.16em] text-secondary">Friendly message draft</p>
                  <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(userMessageDraft(request))}</p>
                </div>
              </section>

              <form class="verification-update-form grid gap-3 rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="grid gap-2 font-label text-sm">
                    Status
                    <select class="glass-input h-12 rounded-2xl px-4 font-body" name="status">
                      ${optionTags(Object.entries(statusLabels), status)}
                    </select>
                  </label>
                  <label class="grid gap-2 font-label text-sm">
                    Provider
                    <select class="glass-input h-12 rounded-2xl px-4 font-body" name="provider">
                      ${optionTags(Object.entries(providerLabels), provider)}
                    </select>
                  </label>
                </div>
                <label class="grid gap-2 font-label text-sm">
                  Provider link
                  <input class="glass-input h-12 rounded-2xl px-4 font-body" name="provider_link" type="url" value="${escapeHtml(request.provider_link || "")}" placeholder="https://provider.example/check" />
                </label>
                <label class="grid gap-2 font-label text-sm">
                  Provider reference
                  <input class="glass-input h-12 rounded-2xl px-4 font-body" name="provider_reference" type="text" value="${escapeHtml(request.provider_reference || "")}" placeholder="Provider applicant, job, or report ID" />
                </label>
                <label class="grid gap-2 font-label text-sm">
                  Internal notes
                  <textarea class="glass-input min-h-24 rounded-2xl px-4 py-3 font-body" name="admin_notes" placeholder="Provider result, missing document, retry note, or exception reason">${escapeHtml(request.admin_notes || "")}</textarea>
                </label>
                <div class="flex flex-col gap-3 sm:flex-row">
                  <button class="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-primary px-5 font-label font-bold text-white" type="submit">Save state</button>
                  <button class="quick-state inline-flex h-12 flex-1 items-center justify-center rounded-full border border-outline-variant/60 bg-white/70 px-5 font-label font-bold text-primary" data-status="link_sent" type="button">Mark link sent</button>
                  <button class="quick-state inline-flex h-12 flex-1 items-center justify-center rounded-full border border-outline-variant/60 bg-white/70 px-5 font-label font-bold text-primary" data-status="submitted" type="button">Provider submitted</button>
                </div>
                <p class="request-status min-h-6 text-sm text-on-surface-variant" role="status"></p>
              </form>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function setLoginStatus(message, tone = "text-on-surface-variant") {
    loginStatus.textContent = message;
    loginStatus.className = `min-h-6 text-sm ${tone}`.trim();
  }

  function showAuth(show) {
    authPanel.hidden = !show;
  }

  async function loadQueue() {
    queueMode.textContent = "Loading queue";
    showAuth(false);
    list.innerHTML = `<div class="glass-panel rounded-[2rem] p-8 text-center text-on-surface-variant">Loading verification queue...</div>`;

    try {
      const sessionResult = await data.getSession();
      if (!sessionResult.session && sessionResult.mode !== "local") {
        emailInput.value = window.SWADAKTA_CONFIG?.adminEmail || "";
        showAuth(true);
        queueMode.textContent = "Sign in needed";
        renderEmpty("Sign in as a Swadakta admin to view provider-led verification requests.");
        return;
      }

      const result = await data.listIdentityVerificationRequests();
      queueMode.textContent = result.mode === "supabase" ? "Live Supabase queue" : "Local demo queue";
      renderRequests(result.data || []);
    } catch (error) {
      const message = error.message || "Could not load verification queue.";
      if (/admin access/i.test(message)) {
        showAuth(false);
        queueMode.textContent = "Admin permission required";
        renderEmpty("This account is signed in, but it is not listed as a Swadakta admin yet.");
        return;
      }

      showAuth(true);
      queueMode.textContent = "Needs attention";
      renderEmpty(message);
    }
  }

  async function saveRequest(article, override = {}) {
    const form = article.querySelector(".verification-update-form");
    const status = article.querySelector(".request-status");
    const formData = new FormData(form);
    const id = article.dataset.requestId;
    const payload = {
      status: override.status || formData.get("status"),
      provider: formData.get("provider"),
      provider_link: formData.get("provider_link"),
      provider_reference: formData.get("provider_reference"),
      admin_notes: formData.get("admin_notes"),
    };

    if (override.status) {
      payload.status = override.status;
      form.elements.status.value = override.status;
    }

    status.textContent = "Saving...";
    try {
      await data.updateIdentityVerificationRequest(id, payload);
      status.textContent = "Saved. The user's verification status has been updated.";
      await loadQueue();
    } catch (error) {
      status.textContent = error.message || "Could not save this verification request.";
      status.className = "request-status min-h-6 text-sm text-on-error-container";
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
      setLoginStatus("Signed in. Loading verification queue.", "text-primary");
      await loadQueue();
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
      await data.signInAdmin(email, "admin-verification.html");
      setLoginStatus("Backup link sent. Open it in this browser, then return here.", "text-primary");
    } catch (error) {
      setLoginStatus(error.message || "Could not send backup link.", "text-on-error-container");
    }
  });

  signOutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await data.signOut();
      await loadQueue();
    });
  });

  refreshButton?.addEventListener("click", loadQueue);

  list?.addEventListener("submit", async (event) => {
    const form = event.target.closest(".verification-update-form");
    if (!form) return;
    event.preventDefault();
    await saveRequest(form.closest("[data-request-id]"));
  });

  list?.addEventListener("click", async (event) => {
    const button = event.target.closest(".quick-state");
    if (!button) return;
    await saveRequest(button.closest("[data-request-id]"), { status: button.dataset.status });
  });

  loadQueue();
})();
