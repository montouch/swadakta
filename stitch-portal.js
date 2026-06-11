(function () {
  const form = document.querySelector("#client-login-form");
  const status = document.querySelector("#client-login-status");
  const submit = document.querySelector("#client-login-submit");
  const phoneGroup = document.querySelector("#account-backup-phone-group");
  const phoneInput = document.querySelector("#account-backup-phone");
  const googleButton = document.querySelector("#account-google-sign-in");
  const resetButton = document.querySelector("#account-password-reset");
  const profileCard = document.querySelector("#account-profile-card");
  const nextActions = document.querySelector("#account-next-actions");
  const signOutButton = document.querySelector("#account-sign-out");
  const verificationForm = document.querySelector("#account-verification-form");
  const verificationStatus = document.querySelector("#account-verification-status");
  const verificationPill = document.querySelector("#verification-pill");
  const verificationList = document.querySelector("#verification-request-list");
  const accountWorkspace = document.querySelector("#work");
  const accountHome = document.querySelector("#home");
  const accountHomeEmail = document.querySelector("#account-home-email");
  const accountHomeVerificationPill = document.querySelector("#account-home-verification-pill");
  const accountHomeSignOutButton = document.querySelector("#account-home-sign-out");
  const accountHomeRequestCount = document.querySelector("#account-home-request-count");
  const accountHomeRequestCopy = document.querySelector("#account-home-request-copy");
  const accountHomeJobCount = document.querySelector("#account-home-job-count");
  const accountHomeJobCopy = document.querySelector("#account-home-job-copy");
  const accountHomeVerificationCount = document.querySelector("#account-home-verification-count");
  const accountHomeNextCopy = document.querySelector("#account-home-next-copy");
  const authShell = form.closest("main");

  if (!form || !window.SwadaktaData) return;

  let signedInEmail = "";
  let accountProviderTouched = false;
  const USER_SELECTABLE_PROVIDERS = new Set(["smile_id", "sumsub", "youverify"]);
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
  const YOUVERIFY_COUNTRIES = new Set(["nigeria", "ghana"]);

  function authMode() {
    return form.querySelector('input[name="account-auth-mode"]:checked')?.value || "sign_in";
  }

  function roleIntent() {
    return form.querySelector('input[name="accountRole"]:checked')?.value || "client";
  }

  function accountRedirect() {
    return new URL("portal.html#home", window.location.href).href;
  }

  function accountHomeUrl() {
    return new URL("portal.html#home", window.location.href).href;
  }

  function openAccountHome() {
    if (!accountHome) {
      openAccountWorkspace();
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.hash = "home";
    window.history.replaceState(null, "", nextUrl);
    window.setTimeout(() => {
      accountHome.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  function openAccountWorkspace() {
    if (!accountWorkspace) return;

    const nextUrl = new URL(window.location.href);
    nextUrl.hash = "work";
    window.history.replaceState(null, "", nextUrl);
    window.setTimeout(() => {
      accountWorkspace.scrollIntoView({ behavior: "smooth", block: "start" });
      field("#account-full-name")?.focus({ preventScroll: true });
    }, 60);
  }

  function setSignedInShell(email = "", profile = {}) {
    form.hidden = true;
    if (authShell) {
      authShell.hidden = true;
    }
    if (accountHome) accountHome.hidden = false;
    renderAccountHome(profile, { email });

    if (profileCard) {
      profileCard.hidden = false;
      profileCard.className = "mt-0 glass-panel p-6 rounded-3xl";
      profileCard.innerHTML = `
        <div class="flex items-start gap-4">
          <span class="material-symbols-outlined text-primary text-4xl">account_circle</span>
          <div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface">Account open</h2>
            <p class="font-body-md text-on-surface-variant">${escapeHtml(email || profile.email || "Signed in")}</p>
            <p class="font-label-sm text-secondary mt-2">You can manage your account now. Verification is only required before posting paid work or receiving jobs.</p>
          </div>
        </div>`;
    }

    if (nextActions) nextActions.hidden = false;
  }

  function setSignedOutShell() {
    form.hidden = false;
    if (authShell) {
      authShell.hidden = false;
    }
    if (accountHome) accountHome.hidden = true;
  }

  function setStatus(message, tone = "") {
    status.textContent = message;
    status.className = `font-label-md text-label-md min-h-6 ${tone}`.trim();
  }

  function updateMode() {
    const creating = authMode() === "create";
    phoneGroup.hidden = !creating;
    phoneInput.disabled = !creating;
    phoneInput.required = creating;
    document.querySelector("#client-login-password").autocomplete = creating ? "new-password" : "current-password";
    submit.firstChild.textContent = creating ? "Create account " : "Sign in ";
  }

  function field(id) {
    return document.querySelector(id);
  }

  function setVerificationStatus(message, tone = "") {
    if (!verificationStatus) return;
    verificationStatus.textContent = message;
    verificationStatus.className = `md:col-span-2 font-label-md text-label-md min-h-6 ${tone}`.trim();
  }

  function setVerificationPill(label, tone = "bg-primary-container/10 text-primary") {
    if (!verificationPill) return;
    verificationPill.textContent = label;
    verificationPill.className = `inline-flex min-h-10 px-4 items-center justify-center rounded-full font-label-md ${tone}`.trim();
  }

  function setHomeVerificationPill(label, tone = "bg-primary-container/10 text-primary") {
    if (!accountHomeVerificationPill) return;
    accountHomeVerificationPill.textContent = label;
    accountHomeVerificationPill.className = `inline-flex min-h-10 px-4 items-center justify-center rounded-full font-label-md ${tone}`.trim();
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

  function normalizeCountry(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function recommendedProviderForCountry(country) {
    const normalized = normalizeCountry(country);
    if (YOUVERIFY_COUNTRIES.has(normalized)) return "youverify";
    if (AFRICA_COUNTRIES.has(normalized)) return "smile_id";
    return "sumsub";
  }

  function safeProvider(value, fallback = "sumsub") {
    return USER_SELECTABLE_PROVIDERS.has(value) ? value : fallback;
  }

  function updateAccountProviderRoute({ force = false } = {}) {
    const provider = field("#account-verification-provider");
    if (!provider || (accountProviderTouched && !force)) return;
    provider.value = recommendedProviderForCountry(field("#account-country")?.value || "");
  }

  function syncRoleInputs(role = "client") {
    const safeRole = ["client", "receiver", "both"].includes(role) ? role : "client";
    const roleMap = { client: "#client", receiver: "#seeker", both: "#both" };
    const roleRadio = field(roleMap[safeRole]);
    if (roleRadio) roleRadio.checked = true;
    const workRole = field("#account-work-role");
    if (workRole) workRole.value = safeRole;
  }

  function signedInDestination() {
    return window.location.hash === "#work" ? "work" : "home";
  }

  function openSignedInDestination() {
    if (signedInDestination() === "work") {
      openAccountWorkspace();
    } else {
      openAccountHome();
    }
  }

  function renderAccountHome(profile = {}, { email = "" } = {}) {
    if (!accountHome) return;
    const displayEmail = email || profile.email || signedInEmail || "your account";
    const verificationStatus = profile.identity_verification_status || "not_started";
    const verified = verificationStatus === "verified";

    if (accountHomeEmail) accountHomeEmail.textContent = displayEmail;
    setHomeVerificationPill(
      verified ? "Verified account" : `${formatStatus(verificationStatus)} verification`,
      verified ? "bg-emerald-100 text-emerald-700" : "bg-primary-container/10 text-primary",
    );

    if (accountHomeNextCopy) {
      accountHomeNextCopy.textContent = verified
        ? "You can post eligible paid jobs and receive paid work where your profile fits."
        : "Your account is open. Verify ID before posting paid jobs, receiving work, or handling sensitive tasks.";
    }
  }

  async function refreshAccountHome(profile = {}) {
    if (!accountHome) return;
    renderAccountHome(profile);

    const [requestsResult, jobsResult, verificationResult] = await Promise.allSettled([
      window.SwadaktaData.listMyRequests(),
      window.SwadaktaData.listMyAssignedJobs(),
      window.SwadaktaData.listMyIdentityVerificationRequests(),
    ]);

    const requests = requestsResult.status === "fulfilled" ? requestsResult.value.data || [] : [];
    const jobs = jobsResult.status === "fulfilled" ? jobsResult.value.data || [] : [];
    const verifications = verificationResult.status === "fulfilled" ? verificationResult.value.data || [] : [];

    if (accountHomeRequestCount) accountHomeRequestCount.textContent = String(requests.length);
    if (accountHomeRequestCopy) {
      accountHomeRequestCopy.textContent = requests.length
        ? "Open tracking to view proof, payments, and milestone progress."
        : "Start by choosing a corridor and creating your first paid brief.";
    }
    if (accountHomeJobCount) accountHomeJobCount.textContent = String(jobs.length);
    if (accountHomeJobCopy) {
      accountHomeJobCopy.textContent = jobs.length
        ? "Open your assigned jobs from the receiver side and submit proof updates."
        : "Verify ID and set coverage before accepting paid receiver work.";
    }
    if (accountHomeVerificationCount) accountHomeVerificationCount.textContent = String(verifications.length);
  }

  function setVerificationEnabled(enabled) {
    if (!verificationForm) return;
    verificationForm.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = !enabled;
    });
  }

  function profilePayload() {
    const selectedRole = field("#account-work-role")?.value || roleIntent();
    return {
      account_role: selectedRole,
      full_name: field("#account-full-name")?.value.trim() || "",
      whatsapp: field("#account-work-phone")?.value.trim() || phoneInput.value.trim(),
      country: field("#account-country")?.value.trim() || "",
      kenya_base: field("#account-kenya-base")?.value.trim() || "",
      preferred_currency: field("#account-preferred-currency")?.value || "AUD",
      profile_notes: field("#account-verification-notes")?.value.trim() || "",
      identity_verification_provider: safeProvider(field("#account-verification-provider")?.value, "sumsub"),
      onboarding_status: selectedRole === "client" ? "profile_complete" : "needs_review",
    };
  }

  function populateVerificationProfile(profile = {}) {
    if (!verificationForm) return;
    field("#account-full-name").value = profile.full_name || "";
    field("#account-work-phone").value = profile.whatsapp || "";
    field("#account-country").value = profile.country || "";
    field("#account-kenya-base").value = profile.kenya_base || "";
    field("#account-preferred-currency").value = profile.preferred_currency || "AUD";
    field("#account-verification-provider").value = safeProvider(
      profile.identity_verification_provider,
      recommendedProviderForCountry(profile.country || ""),
    );
    field("#account-verification-notes").value = profile.profile_notes || "";
    syncRoleInputs(profile.account_role || roleIntent());
    updateAccountProviderRoute();
  }

  function renderVerificationRequests(requests = []) {
    if (!verificationList) return;
    if (!requests.length) {
      verificationList.innerHTML = `
        <article class="rounded-2xl border border-outline-variant/30 bg-white/60 p-4">
          <p class="font-label-md text-on-surface">No verification request yet</p>
          <p class="font-body-md text-on-surface-variant text-sm mt-1">Save your profile and request verification when you are ready.</p>
        </article>`;
      return;
    }

    verificationList.innerHTML = requests
      .map(
        (request) => `
          <article class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <strong class="font-label-md text-on-surface">${escapeHtml(request.request_code || "Verification")}</strong>
                <span class="rounded-full bg-primary-container/10 px-3 py-1 text-primary font-label-sm">${escapeHtml(formatStatus(request.status))}</span>
              </div>
              <p class="font-body-md text-on-surface-variant text-sm mt-2">${escapeHtml(formatStatus(request.reason))} via ${escapeHtml(formatStatus(request.provider))}</p>
              ${request.admin_notes ? `<p class="font-body-md text-on-surface text-sm mt-2">${escapeHtml(request.admin_notes)}</p>` : ""}
              ${request.provider_link ? `<a class="inline-flex mt-3 text-primary font-label-md underline" href="${escapeHtml(request.provider_link)}" target="_blank" rel="noopener">Open verification link</a>` : ""}
            </div>
            <span class="font-label-sm text-on-surface-variant">${escapeHtml(request.updated_at ? new Date(request.updated_at).toLocaleDateString() : "")}</span>
          </article>`,
      )
      .join("");
  }

  async function refreshVerificationWorkspace(profile = null) {
    if (!verificationForm) return;
    try {
      const sessionResult = await window.SwadaktaData.getSession();
      signedInEmail = sessionResult.session?.user?.email || "";
      if (!signedInEmail) {
        setVerificationEnabled(false);
        setVerificationPill("Sign in required", "bg-error-container text-on-error-container");
        setVerificationStatus("Sign in or create an account before requesting verification.");
        renderVerificationRequests([]);
        return;
      }

      setVerificationEnabled(true);
      const currentProfile = profile || (await window.SwadaktaData.getAccountProfile()).data || {};
      populateVerificationProfile(currentProfile);
      const statusLabel = formatStatus(currentProfile.identity_verification_status || "not_started");
      setVerificationPill(statusLabel, currentProfile.identity_verification_status === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-primary-container/10 text-primary");
      setVerificationStatus("Profile loaded. The provider route handles verification; manual review is only an exception fallback.", "text-primary");
      const requests = await window.SwadaktaData.listMyIdentityVerificationRequests();
      renderVerificationRequests(requests.data || []);
    } catch (error) {
      setVerificationStatus(error.message || "Could not load verification workspace.", "text-error");
    }
  }

  async function showCurrentAccount({ autoOpen = false } = {}) {
    let email = "";
    try {
      const sessionResult = await window.SwadaktaData.getSession();
      email = sessionResult.session?.user?.email || "";
      if (!email) {
        setSignedOutShell();
        await refreshVerificationWorkspace(null);
        return;
      }

      setSignedInShell(email, {});
      if (autoOpen || window.location.hash === "#work" || window.location.hash === "#home") {
        openSignedInDestination();
      }

      let profile = {};
      try {
        const profileResult = await window.SwadaktaData.getAccountProfile();
        profile = profileResult.data || {};
      } catch (profileError) {
        setVerificationEnabled(true);
        setVerificationPill("Profile needs saving", "bg-primary-container/10 text-primary");
        setVerificationStatus("Account is open. Save your profile details below if they did not load automatically.", "text-primary");
      }

      profileCard.hidden = false;
      profileCard.className = "mt-0 glass-panel p-6 rounded-3xl";
      profileCard.innerHTML = `
        <div class="flex items-start gap-4">
          <span class="material-symbols-outlined text-primary text-4xl">verified_user</span>
          <div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface">Account open</h2>
            <p class="font-body-md text-on-surface-variant">${email || profile.email}</p>
            <p class="font-label-sm text-secondary mt-2">Mode: ${(profile.account_role || roleIntent()).replaceAll("_", " ")}. Verification is required only before paid posting, paid receiver work, or sensitive/high-value tasks.</p>
          </div>
        </div>`;
      if (nextActions) nextActions.hidden = false;
      populateVerificationProfile(profile);
      await Promise.allSettled([refreshAccountHome(profile), refreshVerificationWorkspace(profile)]);
      if (autoOpen || window.location.hash === "#work" || window.location.hash === "#home") {
        openSignedInDestination();
      }
    } catch (error) {
      if (email) {
        setSignedInShell(email, {});
        if (autoOpen || window.location.hash === "#work" || window.location.hash === "#home") openSignedInDestination();
        setVerificationEnabled(true);
        setVerificationStatus("Account is open. Some profile details could not load yet, but you can save them below.", "text-primary");
      }
    }
  }

  form.addEventListener("change", updateMode);
  if (field("#account-work-role")) {
    field("#account-work-role").addEventListener("change", (event) => syncRoleInputs(event.target.value));
  }
  if (field("#account-country")) {
    field("#account-country").addEventListener("input", () => updateAccountProviderRoute());
  }
  if (field("#account-verification-provider")) {
    field("#account-verification-provider").addEventListener("change", () => {
      accountProviderTouched = true;
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.querySelector("#client-login-email").value.trim();
    const password = document.querySelector("#client-login-password").value;
    const backupPhone = phoneInput.value.trim();
    const accountRole = roleIntent();
    const creating = authMode() === "create";

    submit.disabled = true;
    setStatus(creating ? "Creating account..." : "Signing in...");

    try {
      let result;
      let shouldOpenWorkspace = true;
      if (creating) {
        result = await window.SwadaktaData.signUpAccount(email, password, accountRedirect());
        shouldOpenWorkspace = !result.needsConfirmation;
        if (!result.needsConfirmation) {
          setSignedInShell(email, { account_role: accountRole });
          openAccountHome();
          try {
            await window.SwadaktaData.saveAccountProfile({
              email,
              account_role: accountRole,
              backup_phone: backupPhone,
              whatsapp: backupPhone,
              onboarding_status: "started",
              identity_verification_status: "not_started",
            });
          } catch (profileError) {
            setVerificationStatus("Account is open. Save your profile details below if they did not load automatically.", "text-primary");
          }
        }
        setStatus(
          result.needsConfirmation
            ? "Account created. Check your email, then return here to sign in."
            : "Account created and ready.",
          "text-primary",
        );
      } else {
        await window.SwadaktaData.signInWithPassword(email, password);
        setSignedInShell(email, { account_role: accountRole });
        openAccountHome();
        window.SwadaktaData.saveAccountProfile({
            email,
            account_role: accountRole,
            onboarding_status: "started",
          }).catch(() => {});
        setStatus("Signed in. Your Swadakta account is ready.", "text-primary");
        window.location.replace(accountHomeUrl());
        return;
      }
      if (shouldOpenWorkspace) {
        setSignedInShell(email, { account_role: accountRole });
        openAccountHome();
      }
      await showCurrentAccount({ autoOpen: shouldOpenWorkspace });
    } catch (error) {
      setStatus(error.message || "Account action failed.", "text-error");
    } finally {
      submit.disabled = false;
      updateMode();
    }
  });

  if (verificationForm) {
    verificationForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.submitter || verificationForm.querySelector('button[type="submit"]');
      const action = button?.dataset.action || "request";
      const original = button?.textContent || "";

      if (button) {
        button.disabled = true;
        button.textContent = action === "request" ? "Requesting..." : "Saving...";
      }
      setVerificationStatus(action === "request" ? "Saving profile and queuing verification..." : "Saving profile...");

      try {
        const saved = await window.SwadaktaData.saveAccountProfile(profilePayload());
        syncRoleInputs(saved.data?.account_role || profilePayload().account_role);
        if (action === "request") {
          await window.SwadaktaData.requestAccountIdentityVerification({
            reason: field("#account-verification-reason")?.value || "account_required",
            provider: safeProvider(field("#account-verification-provider")?.value, "sumsub"),
            user_notes: field("#account-verification-notes")?.value || "",
          });
          setVerificationStatus("Verification request saved. Swadakta will show the provider check or provider instructions when ready.", "text-primary");
        } else {
          setVerificationStatus("Profile saved.", "text-primary");
        }
        await showCurrentAccount({ autoOpen: true });
      } catch (error) {
        setVerificationStatus(error.message || "Could not save account details.", "text-error");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = original;
        }
      }
    });
  }

  if (googleButton) {
    const enabled = Boolean(window.SWADAKTA_CONFIG?.authProviders?.google);
    googleButton.hidden = !enabled;
    googleButton.addEventListener("click", async () => {
      setStatus("Opening Google sign-in...");
      try {
        await window.SwadaktaData.signInWithProvider("google", accountRedirect());
      } catch (error) {
        setStatus(error.message || "Google sign-in is not available yet.", "text-error");
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", async () => {
      const email = document.querySelector("#client-login-email").value.trim();
      if (!email) {
        setStatus("Enter your email first.", "text-error");
        return;
      }
      setStatus("Sending password reset...");
      try {
        await window.SwadaktaData.resetAccountPassword(email, accountRedirect());
        setStatus("Password reset email sent.", "text-primary");
      } catch (error) {
        setStatus(error.message || "Could not send reset email.", "text-error");
      }
    });
  }

  async function signOutCurrentAccount(button) {
    if (button) button.disabled = true;
      try {
        await window.SwadaktaData.signOut();
        signedInEmail = "";
        if (profileCard) profileCard.hidden = true;
        if (nextActions) nextActions.hidden = true;
        setSignedOutShell();
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        setStatus("Signed out.", "text-primary");
        await refreshVerificationWorkspace(null);
      } catch (error) {
        setStatus(error.message || "Could not sign out.", "text-error");
      } finally {
        if (button) button.disabled = false;
      }
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", () => signOutCurrentAccount(signOutButton));
  }

  if (accountHomeSignOutButton) {
    accountHomeSignOutButton.addEventListener("click", () => signOutCurrentAccount(accountHomeSignOutButton));
  }

  updateMode();
  setVerificationEnabled(false);
  showCurrentAccount({ autoOpen: true });
})();
