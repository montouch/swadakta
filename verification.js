(function () {
  const form = document.querySelector("#verification-form");
  const formStatus = document.querySelector("#verification-form-status");
  const summaryCopy = document.querySelector("#verification-summary-copy");
  const statusPill = document.querySelector("#verification-status-pill");
  const signInLink = document.querySelector("#verification-sign-in");
  const providerLink = document.querySelector("#verification-provider-link");
  const requestList = document.querySelector("#verification-request-list");
  const modeLabel = document.querySelector("#verification-mode-label");
  const routeCopy = document.querySelector("#verification-route-copy");
  const requirementsList = document.querySelector("#verification-requirements-list");

  if (!form || !window.SwadaktaData) return;

  const params = new URLSearchParams(window.location.search);
  const AFRICA_COUNTRIES = new Set([
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
  const GLOBAL_STANDARD_COUNTRIES = new Set([
    "australia",
    "austria",
    "belgium",
    "canada",
    "china",
    "denmark",
    "finland",
    "france",
    "germany",
    "greece",
    "ireland",
    "italy",
    "japan",
    "netherlands",
    "new zealand",
    "norway",
    "poland",
    "portugal",
    "singapore",
    "south korea",
    "spain",
    "sweden",
    "switzerland",
    "united arab emirates",
    "united kingdom",
    "uk",
    "usa",
    "united states",
    "united states of america",
  ]);
  const YOUVERIFY_COUNTRIES = new Set(["nigeria", "ghana"]);
  const USER_SELECTABLE_PROVIDERS = new Set(["smile_id", "sumsub", "youverify"]);
  let providerTouched = USER_SELECTABLE_PROVIDERS.has(params.get("provider") || "");

  function field(selector) {
    return document.querySelector(selector);
  }

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
    if (value === "manual_review") return "Exception Review";
    return String(value || "not_started")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function setFormStatus(message, tone = "") {
    formStatus.textContent = message;
    formStatus.className = `md:col-span-2 min-h-6 text-sm font-label ${tone || "text-on-surface-variant"}`.trim();
  }

  function setPill(label, tone = "bg-primary/10 text-primary") {
    statusPill.textContent = label;
    statusPill.className = `inline-flex min-h-10 px-4 items-center justify-center rounded-full font-label text-sm ${tone}`.trim();
  }

  function setEnabled(enabled) {
    form.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = !enabled;
    });
    modeLabel.textContent = enabled ? "Profile editable" : "Profile locked until sign-in";
  }

  function normalizeCountry(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function providerRoute(country, reason) {
    const normalized = normalizeCountry(country);
    const sensitive = ["high_value_job", "sensitive_job"].includes(reason);
    const requirements = ["Government photo ID", "Selfie or liveness check", "Mobile backup for urgent issues"];

    if (sensitive) {
      requirements.push("Proof of address or residence where required");
      requirements.push("Founder/admin review before money, assignment, or milestone release");
    }

    if (!normalized) {
      return {
        provider: "sumsub",
        copy: "Enter your current country so Swadakta can choose the best route. Sumsub is the broad default until a country-specific route is clear.",
        requirements,
      };
    }

    if (YOUVERIFY_COUNTRIES.has(normalized)) {
      return {
        provider: "youverify",
        copy: "Recommended: Youverify for selected West African identity checks. If the provider cannot complete the check, Swadakta escalates it as an exception.",
        requirements,
      };
    }

    if (AFRICA_COUNTRIES.has(normalized)) {
      return {
        provider: "smile_id",
        copy: "Recommended: Smile ID for Africa-first identity coverage across eligible African corridor work.",
        requirements,
      };
    }

    if (GLOBAL_STANDARD_COUNTRIES.has(normalized)) {
      return {
        provider: "sumsub",
        copy: "Recommended: Sumsub for wider international coverage across Australia, USA, Europe, China, and other global corridors.",
        requirements,
      };
    }

    requirements.push("Provider coverage check before accepting paid receiver work");
    return {
      provider: "sumsub",
      copy: "Recommended: Sumsub as the global fallback route. Manual review is only used if provider coverage, local law, or document mismatch blocks automation.",
      requirements,
    };
  }

  function safeProvider(value, fallback = "sumsub") {
    return USER_SELECTABLE_PROVIDERS.has(value) ? value : fallback;
  }

  function updateProviderRoute({ setProvider = false } = {}) {
    const route = providerRoute(field("#verify-country").value, field("#verify-reason").value);
    if (routeCopy) routeCopy.textContent = route.copy;
    if (requirementsList) {
      requirementsList.innerHTML = route.requirements.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    }
    if (setProvider && !providerTouched) {
      field("#verify-provider").value = route.provider;
    }
  }

  function initialReason() {
    const value = params.get("reason") || "account_required";
    return ["account_required", "paid_work", "receiver_work", "sensitive_job", "high_value_job"].includes(value)
      ? value
      : "account_required";
  }

  function initialRole() {
    const value = params.get("role") || "";
    if (["client", "receiver", "both"].includes(value)) return value;
    if (initialReason() === "receiver_work" || initialReason() === "paid_work") return "receiver";
    return "client";
  }

  function populate(profile = {}) {
    field("#verify-full-name").value = profile.full_name || "";
    field("#verify-phone").value = profile.whatsapp || "";
    field("#verify-country").value = profile.country || "";
    field("#verify-base").value = profile.kenya_base || "";
    field("#verify-role").value = profile.account_role || initialRole();
    field("#verify-currency").value = profile.preferred_currency || "AUD";
    field("#verify-provider").value = safeProvider(profile.identity_verification_provider || params.get("provider"), "sumsub");
    field("#verify-reason").value = initialReason();
    field("#verify-notes").value = profile.profile_notes || "";
    updateProviderRoute({ setProvider: true });
  }

  function profilePayload() {
    const role = field("#verify-role").value || "client";
    return {
      account_role: role,
      full_name: field("#verify-full-name").value.trim(),
      whatsapp: field("#verify-phone").value.trim(),
      country: field("#verify-country").value.trim(),
      kenya_base: field("#verify-base").value.trim(),
      preferred_currency: field("#verify-currency").value || "AUD",
      identity_verification_provider: safeProvider(field("#verify-provider").value, "sumsub"),
      profile_notes: field("#verify-notes").value.trim(),
      onboarding_status: role === "client" ? "profile_complete" : "needs_review",
    };
  }

  function latestRequest(requests = []) {
    return [...requests].sort((first, second) => new Date(second.updated_at || 0) - new Date(first.updated_at || 0))[0] || null;
  }

  function renderRequests(requests = []) {
    if (!requests.length) {
      requestList.innerHTML = `
        <article class="rounded-2xl bg-white/64 border border-outline-variant/30 p-4">
          <p class="font-label text-on-surface">No request yet</p>
          <p class="mt-1 text-sm text-on-surface-variant">Save your profile and request verification to create the first request.</p>
        </article>`;
      return;
    }

    requestList.innerHTML = requests
      .map(
        (request) => `
          <article class="rounded-2xl bg-white/72 border border-outline-variant/30 p-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div class="flex flex-wrap gap-2 items-center">
                <strong class="font-label text-on-surface">${escapeHtml(request.request_code || "Verification")}</strong>
                <span class="rounded-full bg-primary/10 px-3 py-1 text-primary font-label text-xs">${escapeHtml(formatStatus(request.status))}</span>
              </div>
              <p class="mt-2 text-sm text-on-surface-variant">${escapeHtml(formatStatus(request.reason))} via ${escapeHtml(formatStatus(request.provider))}</p>
              ${request.provider_reference ? `<p class="mt-1 text-xs text-on-surface-variant">Reference: ${escapeHtml(request.provider_reference)}</p>` : ""}
              ${request.admin_notes ? `<p class="mt-2 text-sm text-on-surface">${escapeHtml(request.admin_notes)}</p>` : ""}
              ${
                request.provider_link
                  ? `<a class="inline-flex mt-3 text-primary font-label underline" href="${escapeHtml(request.provider_link)}" target="_blank" rel="noopener">Open provider verification</a>`
                  : ""
              }
            </div>
            <span class="text-xs font-label text-on-surface-variant">${escapeHtml(request.updated_at ? new Date(request.updated_at).toLocaleString() : "")}</span>
          </article>`,
      )
      .join("");
  }

  function renderSummary(profile, requests) {
    const request = latestRequest(requests);
    const profileStatus = profile?.identity_verification_status || "not_started";
    const displayStatus = request?.status || profileStatus;
    const isVerified = profileStatus === "verified" || request?.status === "verified";

    setPill(
      formatStatus(displayStatus),
      isVerified ? "bg-emerald-100 text-emerald-700" : displayStatus === "requested" ? "bg-primary/10 text-primary" : "bg-white/76 text-on-surface-variant",
    );

    if (isVerified) {
      summaryCopy.textContent = "Your account is verified. Swadakta can use this status for eligible client and receiver workflows.";
    } else if (request?.provider_link) {
      summaryCopy.textContent = "Your provider check is ready. Open it and complete the ID and selfie/liveness steps there.";
    } else if (request) {
      summaryCopy.textContent = "Your verification request is saved. Swadakta is preparing the provider route; manual review is only an exception fallback.";
    } else {
      summaryCopy.textContent = "No verification request has been created yet.";
    }

    if (request?.provider_link) {
      providerLink.hidden = false;
      providerLink.href = request.provider_link;
    } else {
      providerLink.hidden = true;
      providerLink.removeAttribute("href");
    }
  }

  async function refresh() {
    try {
      const sessionResult = await window.SwadaktaData.getSession();
      const email = sessionResult.session?.user?.email || "";
      if (!email) {
        setEnabled(false);
        populate({});
        setPill("Sign in required", "bg-error-container text-on-error-container");
        summaryCopy.textContent = "Sign in or create an account before requesting verification.";
        signInLink.href = `portal.html#home`;
        renderRequests([]);
        return;
      }

      setEnabled(true);
      signInLink.href = "portal.html#home";
      const profileResult = await window.SwadaktaData.getAccountProfile();
      const profile = profileResult.data || {};
      populate(profile);
      const requestsResult = await window.SwadaktaData.listMyIdentityVerificationRequests();
      const requests = requestsResult.data || [];
      renderSummary(profile, requests);
      renderRequests(requests);
      setFormStatus(
        profile._load_warning || requestsResult.warning
          ? "Account is open. Profile or verification history storage still needs the Supabase grant/RPC applied, but you can continue the demo and save once it is active."
          : "Account loaded. Verification is handled by the selected provider route; manual review is only an exception fallback.",
        "text-primary",
      );
    } catch (error) {
      setFormStatus(error.message || "Could not load verification.", "text-error");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.submitter || form.querySelector('button[type="submit"]');
    const action = button?.dataset.action || "request";
    const original = button?.textContent || "";

    if (button) {
      button.disabled = true;
      button.textContent = action === "request" ? "Requesting..." : "Saving...";
    }
    setFormStatus(action === "request" ? "Saving profile and requesting verification..." : "Saving profile...");

    try {
      await window.SwadaktaData.saveAccountProfile(profilePayload());
      if (action === "request") {
        await window.SwadaktaData.requestAccountIdentityVerification({
          reason: field("#verify-reason").value || "account_required",
          provider: safeProvider(field("#verify-provider").value, "sumsub"),
          user_notes: field("#verify-notes").value || "",
        });
        setFormStatus("Verification request saved. This page will show the provider check or provider instructions when ready.", "text-primary");
      } else {
        setFormStatus("Profile saved.", "text-primary");
      }
      await refresh();
    } catch (error) {
      setFormStatus(error.message || "Could not save verification request.", "text-error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    }
  });

  field("#verify-country").addEventListener("input", () => updateProviderRoute({ setProvider: true }));
  field("#verify-reason").addEventListener("change", () => updateProviderRoute({ setProvider: true }));
  field("#verify-provider").addEventListener("change", () => {
    providerTouched = true;
    updateProviderRoute({ setProvider: false });
  });

  setEnabled(false);
  populate({});
  refresh();
})();
