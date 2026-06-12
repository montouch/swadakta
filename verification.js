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
  const routeName = document.querySelector("#verification-route-name");
  const routeAction = document.querySelector("#verification-route-action");
  const requirementsList = document.querySelector("#verification-requirements-list");
  const fallbackList = document.querySelector("#verification-fallback-list");
  const boundaryCopy = document.querySelector("#verification-boundary-copy");
  const countryOptions = document.querySelector("#verification-country-options");
  const timelineSummary = document.querySelector("#verification-timeline-summary");
  const timelineList = document.querySelector("#verification-timeline-list");
  const accountGate = document.querySelector("#verification-account-gate");
  const postingGate = document.querySelector("#verification-posting-gate");
  const workGate = document.querySelector("#verification-work-gate");

  if (!form || !window.SwadaktaData) return;

  const params = new URLSearchParams(window.location.search);
  const PROVIDER_LABELS = {
    smile_id: "Smile ID",
    sumsub: "Sumsub",
    youverify: "Youverify",
  };
  const AFRICA_COUNTRY_OPTIONS = [
    "Algeria",
    "Angola",
    "Benin",
    "Botswana",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cameroon",
    "Central African Republic",
    "Chad",
    "Comoros",
    "Congo",
    "Democratic Republic of Congo",
    "Djibouti",
    "Egypt",
    "Equatorial Guinea",
    "Eritrea",
    "Eswatini",
    "Ethiopia",
    "Gabon",
    "Gambia",
    "Ghana",
    "Guinea",
    "Guinea-Bissau",
    "Ivory Coast",
    "Kenya",
    "Lesotho",
    "Liberia",
    "Libya",
    "Madagascar",
    "Malawi",
    "Mali",
    "Mauritania",
    "Mauritius",
    "Morocco",
    "Mozambique",
    "Namibia",
    "Niger",
    "Nigeria",
    "Rwanda",
    "Sao Tome and Principe",
    "Senegal",
    "Seychelles",
    "Sierra Leone",
    "Somalia",
    "South Africa",
    "South Sudan",
    "Sudan",
    "Tanzania",
    "Togo",
    "Tunisia",
    "Uganda",
    "Zambia",
    "Zimbabwe",
  ];
  const GLOBAL_STANDARD_OPTIONS = [
    "Australia",
    "Austria",
    "Belgium",
    "Canada",
    "China",
    "Denmark",
    "Finland",
    "France",
    "Germany",
    "Greece",
    "Ireland",
    "Italy",
    "Japan",
    "Netherlands",
    "New Zealand",
    "Norway",
    "Poland",
    "Portugal",
    "Singapore",
    "South Korea",
    "Spain",
    "Sweden",
    "Switzerland",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
  ];
  const AFRICA_COUNTRIES = new Set([
    ...AFRICA_COUNTRY_OPTIONS.map((country) => country.toLowerCase()),
    "africa",
    "cape verde",
    "drc",
    "dr congo",
    "republic of congo",
    "republic of the congo",
    "cote d ivoire",
    "cote divoire",
    "cote d'ivoire",
    "guinea bissau",
    "sao tome",
    "sao tome principe",
  ]);
  const GLOBAL_STANDARD_COUNTRIES = new Set([
    ...GLOBAL_STANDARD_OPTIONS.map((country) => country.toLowerCase()),
    "uk",
    "usa",
    "us",
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

  function setGate(element, label, tone = "text-on-surface-variant") {
    if (!element) return;
    element.textContent = label;
    element.className = `mt-2 block font-label ${tone}`.trim();
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

  function populateCountryOptions() {
    if (!countryOptions) return;
    const countries = [...AFRICA_COUNTRY_OPTIONS, ...GLOBAL_STANDARD_OPTIONS].sort((first, second) =>
      first.localeCompare(second),
    );
    countryOptions.innerHTML = countries.map((country) => `<option value="${escapeHtml(country)}"></option>`).join("");
  }

  function highRiskReason(reason) {
    return ["high_value_job", "sensitive_job"].includes(reason);
  }

  function providerFallbacks(primaryProvider, country, reason) {
    const normalized = normalizeCountry(country);
    const sensitive = highRiskReason(reason);
    const primaryName = PROVIDER_LABELS[primaryProvider] || formatStatus(primaryProvider);
    const fallbacks = [
      `${primaryName}: create the provider check first and wait for provider evidence before paid access unlocks.`,
    ];

    if (primaryProvider === "youverify") {
      fallbacks.push("Smile ID: use as the Africa-first backup if the Youverify route cannot support the document or country.");
      fallbacks.push("Sumsub: use as the wider global backup if Africa-specific checks are not enough.");
    } else if (primaryProvider === "smile_id") {
      fallbacks.push("Sumsub: use as the broader global backup if the Smile ID route cannot support the document, country, or user location.");
      if (["nigeria", "ghana"].includes(normalized)) {
        fallbacks.push("Youverify: optional country-specific backup for Nigeria or Ghana when that workflow is better.");
      }
    } else {
      fallbacks.push("Smile ID: use as Africa-first backup when the user presents African ID or the job needs Africa-specific verification.");
      fallbacks.push("Provider coverage check: confirm the selected document/country inside the provider dashboard before unlocking paid receiver work.");
    }

    if (sensitive) {
      fallbacks.push("Founder/admin gate: high-value or sensitive work needs provider result plus admin review before money, assignment, or release.");
    }

    fallbacks.push("Exception review: only use manual review when provider outage, unsupported documents, mismatch, suspected fraud, local-law issue, or safety risk blocks the provider path.");
    return fallbacks;
  }

  function providerRoute(country, reason) {
    const normalized = normalizeCountry(country);
    const sensitive = highRiskReason(reason);
    const requirements = ["Government photo ID", "Selfie or liveness check", "Mobile backup for urgent issues"];

    if (sensitive) {
      requirements.push("Proof of address or residence where required");
      requirements.push("Founder/admin review before money, assignment, or milestone release");
    }

    if (!normalized) {
      return {
        provider: "sumsub",
        name: "Country needed",
        copy: "Enter your current country so Swadakta can choose the best route. Sumsub is the broad default until a country-specific route is clear.",
        requirements,
        fallbackPlan: providerFallbacks("sumsub", country, reason),
      };
    }

    if (YOUVERIFY_COUNTRIES.has(normalized)) {
      return {
        provider: "youverify",
        name: "Youverify selected Africa route",
        copy: "Recommended: Youverify for selected West African identity checks. If the provider cannot complete the check, Swadakta escalates it as an exception.",
        requirements,
        fallbackPlan: providerFallbacks("youverify", country, reason),
      };
    }

    if (AFRICA_COUNTRIES.has(normalized)) {
      return {
        provider: "smile_id",
        name: "Smile ID Africa-first route",
        copy: "Recommended: Smile ID for Africa-first identity coverage across eligible African corridor work.",
        requirements,
        fallbackPlan: providerFallbacks("smile_id", country, reason),
      };
    }

    if (GLOBAL_STANDARD_COUNTRIES.has(normalized)) {
      return {
        provider: "sumsub",
        name: "Sumsub global route",
        copy: "Recommended: Sumsub for wider international coverage across Australia, USA, Europe, China, and other global corridors.",
        requirements,
        fallbackPlan: providerFallbacks("sumsub", country, reason),
      };
    }

    requirements.push("Provider coverage check before accepting paid receiver work");
    return {
      provider: "sumsub",
      name: "Sumsub fallback route",
      copy: "Recommended: Sumsub as the global fallback route. Manual review is only used if provider coverage, local law, or document mismatch blocks automation.",
      requirements,
      fallbackPlan: providerFallbacks("sumsub", country, reason),
    };
  }

  function safeProvider(value, fallback = "sumsub") {
    return USER_SELECTABLE_PROVIDERS.has(value) ? value : fallback;
  }

  function providerActionCopy(request = null) {
    if (!request) return "Save your profile and request verification to prepare the provider check.";
    if (request.status === "verified") return "Provider evidence is recorded. Paid posting and eligible receiver work can unlock.";
    if (request.provider_link) return "Open the provider link and complete the ID, document, and selfie/liveness steps.";
    if (request.status === "submitted") return "The check is with the provider. Swadakta waits for the provider result before unlocking access.";
    if (request.status === "manual_review") return "Exception review is active. A provider route should still be tried unless coverage or law blocks it.";
    if (request.status === "failed" || request.status === "expired") return "Retry with clear ID images and matching details, or switch provider only if coverage failed.";
    return "Request saved. Swadakta prepares or attaches the provider link next.";
  }

  function renderGates(profile = {}, request = null, signedIn = true) {
    const status = request?.status || profile?.identity_verification_status || "not_started";
    const verified = status === "verified" || profile?.identity_verification_status === "verified";

    if (!signedIn) {
      setGate(accountGate, "Sign in first", "text-on-surface-variant");
      setGate(postingGate, "Locked", "text-on-surface-variant");
      setGate(workGate, "Locked", "text-on-surface-variant");
      return;
    }

    setGate(accountGate, "Open", "text-primary");
    setGate(postingGate, verified ? "Unlocked" : "Verify ID", verified ? "text-emerald-700" : "text-primary");
    setGate(workGate, verified ? "Unlocked" : "Verify ID", verified ? "text-emerald-700" : "text-primary");
  }

  function updateProviderRoute({ setProvider = false, request = null } = {}) {
    const route = providerRoute(field("#verify-country").value, field("#verify-reason").value);
    if (setProvider && !providerTouched) {
      field("#verify-provider").value = route.provider;
    }
    const selectedProvider = safeProvider(field("#verify-provider").value || route.provider, route.provider);
    const providerName = PROVIDER_LABELS[selectedProvider] || formatStatus(selectedProvider);
    if (routeCopy) routeCopy.textContent = route.copy;
    if (routeName) {
      routeName.textContent =
        selectedProvider === route.provider
          ? route.name
          : `${providerName} selected; recommended route is ${PROVIDER_LABELS[route.provider] || formatStatus(route.provider)}`;
    }
    if (routeAction) routeAction.textContent = providerActionCopy(request);
    if (boundaryCopy) {
      boundaryCopy.textContent =
        "AI can explain next steps and draft friendly messages. It cannot mark an ID verified, release money, assign paid work, or override provider evidence.";
    }
    if (requirementsList) {
      requirementsList.innerHTML = route.requirements.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    }
    if (fallbackList) {
      fallbackList.innerHTML = (route.fallbackPlan || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    }
  }

  function profileHasBasics(profile = {}) {
    return Boolean(profile.full_name && profile.whatsapp && (profile.country || profile.kenya_base));
  }

  function timelineTone(status) {
    if (status === "done") return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (status === "active") return "bg-primary/10 border-primary/20 text-primary";
    if (status === "blocked") return "bg-error-container border-error/20 text-on-error-container";
    return "bg-white/70 border-outline-variant/30 text-on-surface-variant";
  }

  function verificationTimeline(profile = {}, request = null, signedIn = false) {
    const status = request?.status || profile.identity_verification_status || "not_started";
    const verified = profile.identity_verification_status === "verified" || request?.status === "verified";
    const failed = ["failed", "rejected", "expired"].includes(status);
    const hasBasics = profileHasBasics(profile);
    const hasRoute = Boolean((request?.provider || profile.identity_verification_provider) && (profile.country || request));
    const hasProviderLink = Boolean(request?.provider_link);
    const submitted = ["submitted", "manual_review", "verified"].includes(status);

    return [
      {
        label: "Account opens",
        detail: signedIn ? "You can use the portal, prepare briefs, and save profile details." : "Sign in or create an account first.",
        status: signedIn ? "done" : "active",
      },
      {
        label: "Profile basics",
        detail: hasBasics ? "Name, mobile, and route context are saved." : "Save legal name, mobile backup, country, and corridor base.",
        status: hasBasics ? "done" : signedIn ? "active" : "idle",
      },
      {
        label: "Provider route",
        detail: hasRoute ? "Swadakta has a provider route selected for your country and reason." : "The app recommends Smile ID, Sumsub, or Youverify from your country.",
        status: hasRoute ? "done" : hasBasics ? "active" : "idle",
      },
      {
        label: "Provider check",
        detail: hasProviderLink
          ? "Open the provider link and finish ID, document, selfie, and liveness steps."
          : request
            ? "Request saved. Swadakta prepares or attaches the provider check."
            : "Request verification when you are ready to unlock paid actions.",
        status: hasProviderLink ? "active" : request ? "active" : hasRoute ? "active" : "idle",
      },
      {
        label: "Provider result",
        detail: verified
          ? "Provider evidence is recorded."
          : failed
            ? "Provider check needs retry, correction, or exception handling."
            : submitted
              ? "Provider result is being reviewed before access unlocks."
              : "Paid actions wait for provider evidence.",
        status: verified ? "done" : failed ? "blocked" : submitted ? "active" : "idle",
      },
      {
        label: "Paid actions unlock",
        detail: verified
          ? "Eligible paid posting and receiver work can proceed subject to job-level rules, payment, and proof."
          : "Posting paid jobs, receiving paid jobs, and sensitive work stay locked until verified.",
        status: verified ? "done" : "idle",
      },
    ];
  }

  function renderVerificationTimeline(profile = {}, requests = [], signedIn = false) {
    const request = latestRequest(requests);
    const steps = verificationTimeline(profile, request, signedIn);
    const active = steps.find((step) => step.status === "active") || steps.find((step) => step.status === "blocked");
    const doneCount = steps.filter((step) => step.status === "done").length;

    if (timelineSummary) {
      timelineSummary.textContent = signedIn
        ? `${doneCount}/${steps.length} verification stages are complete. Next: ${active?.label || "keep provider evidence current"}.`
        : "Sign in to see where your verification is in the flow.";
    }

    if (!timelineList) return;
    timelineList.innerHTML = steps
      .map(
        (step, index) => `
          <li class="rounded-2xl border p-3 ${timelineTone(step.status)}">
            <span class="font-label text-xs uppercase tracking-[0.14em]">${index + 1}. ${escapeHtml(formatStatus(step.status))}</span>
            <strong class="mt-1 block font-label">${escapeHtml(step.label)}</strong>
            <p class="mt-1 text-xs">${escapeHtml(step.detail)}</p>
          </li>`,
      )
      .join("");
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

    renderGates(profile, request, true);
    updateProviderRoute({ request });
    renderVerificationTimeline(profile, requests, true);
  }

  async function refresh() {
    try {
      setPill("Checking account", "bg-primary/10 text-primary");
      summaryCopy.textContent = "Checking your signed-in Swadakta account before opening verification.";
      const sessionResult = await window.SwadaktaData.getSession();
      const email = sessionResult.session?.user?.email || "";
      if (!email) {
        setEnabled(false);
        populate({});
        setPill("Sign in required", "bg-error-container text-on-error-container");
        summaryCopy.textContent = "Sign in or create an account before requesting verification.";
        signInLink.href = "/portal.html#home";
        signInLink.textContent = "Sign in to verify";
        signInLink.removeAttribute("data-swadakta-auth-state");
        renderRequests([]);
        renderGates({}, null, false);
        renderVerificationTimeline({}, [], false);
        return;
      }

      setEnabled(true);
      signInLink.href = "/portal.html#home";
      signInLink.textContent = "Back to account home";
      signInLink.setAttribute("data-swadakta-auth-state", "signed-in");
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
      setPill("Session check failed", "bg-error-container text-on-error-container");
      summaryCopy.textContent =
        "Swadakta could not confirm the signed-in session on this page. Refresh once, or return to Account Home and open verification again.";
      signInLink.href = "/portal.html#home";
      signInLink.textContent = "Back to account home";
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
        const requestResult = await window.SwadaktaData.requestAccountIdentityVerification({
          reason: field("#verify-reason").value || "account_required",
          provider: safeProvider(field("#verify-provider").value, "sumsub"),
          user_notes: field("#verify-notes").value || "",
        });
        try {
          const request = requestResult.data || {};
          const handoff = await window.SwadaktaData.startIdentityVerificationSession({
            request_id: request.id,
            request_code: request.request_code,
            reason: request.reason || field("#verify-reason").value || "account_required",
            provider: safeProvider(request.provider || field("#verify-provider").value, "sumsub"),
          });
          setFormStatus(
            handoff.data?.provider_link
              ? "Verification link is ready. Open the provider check from this page and complete the ID steps."
              : handoff.data?.message || "Verification request saved. Provider setup is queued before paid actions unlock.",
            "text-primary",
          );
        } catch (handoffError) {
          setFormStatus(
            `Verification request saved. Provider handoff needs setup or a retry: ${handoffError.message || "try again shortly."}`,
            "text-primary",
          );
        }
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

  populateCountryOptions();
  setEnabled(false);
  populate({});
  setPill("Checking account", "bg-primary/10 text-primary");
  summaryCopy.textContent = "Checking your signed-in Swadakta account before opening verification.";
  renderVerificationTimeline({}, [], false);
  refresh();
})();
