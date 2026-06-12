(function () {
  const form = document.querySelector("#client-login-form");
  const status = document.querySelector("#client-login-status");
  const submit = document.querySelector("#client-login-submit");
  const phoneGroup = document.querySelector("#account-backup-phone-group");
  const phoneInput = document.querySelector("#account-backup-phone");
  const googleButton = document.querySelector("#account-google-sign-in");
  const resetButton = document.querySelector("#account-password-reset");
  const continueHomeButton = document.querySelector("#account-continue-home");
  const paymentReturnPanel = document.querySelector("#payment-return-panel");
  const paymentReturnIcon = document.querySelector("#payment-return-icon");
  const paymentReturnEyebrow = document.querySelector("#payment-return-eyebrow");
  const paymentReturnTitle = document.querySelector("#payment-return-title");
  const paymentReturnCopy = document.querySelector("#payment-return-copy");
  const paymentReturnReference = document.querySelector("#payment-return-reference");
  const paymentReturnTrackingLink = document.querySelector("#payment-return-tracking-link");
  const paymentReturnMessagesLink = document.querySelector("#payment-return-messages-link");
  const paymentReturnResolutionLink = document.querySelector("#payment-return-resolution-link");
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
  const accountHomeVerificationSummary = document.querySelector("#account-home-verification-summary");
  const accountHomeVerificationAction = document.querySelector("#account-home-verification-action");
  const accountHomeModeTitle = document.querySelector("#account-home-mode-title");
  const accountHomeModeCopy = document.querySelector("#account-home-mode-copy");
  const accountHomeModePill = document.querySelector("#account-home-mode-pill");
  const accountHomeRouteTitle = document.querySelector("#account-home-route-title");
  const accountHomeRouteCopy = document.querySelector("#account-home-route-copy");
  const accountHomeRoutePill = document.querySelector("#account-home-route-pill");
  const accountHomeNextStepTitle = document.querySelector("#account-home-next-step-title");
  const accountHomeNextStepCopy = document.querySelector("#account-home-next-step-copy");
  const accountHomeNextStepAction = document.querySelector("#account-home-next-step-action");
  const accountHomeGateAccount = document.querySelector("#account-home-gate-account");
  const accountHomeGatePosting = document.querySelector("#account-home-gate-posting");
  const accountHomeGateWork = document.querySelector("#account-home-gate-work");
  const accountHomeGateSensitive = document.querySelector("#account-home-gate-sensitive");
  const accountHomeAutopilotProgress = document.querySelector("#account-home-autopilot-progress");
  const accountHomeAutopilotSummary = document.querySelector("#account-home-autopilot-summary");
  const accountHomeAutopilotList = document.querySelector("#account-home-autopilot-list");
  const accountHomeAiSafeList = document.querySelector("#account-home-ai-safe-list");
  const accountHomeProtectedList = document.querySelector("#account-home-protected-list");
  const accountSetupProgress = document.querySelector("#account-setup-progress");
  const accountSetupProfile = document.querySelector("#account-setup-profile");
  const accountSetupVerification = document.querySelector("#account-setup-verification");
  const accountSetupClient = document.querySelector("#account-setup-client");
  const accountSetupReceiver = document.querySelector("#account-setup-receiver");
  const accountSetupNext = document.querySelector("#account-setup-next");
  const receiverApplicationForm = document.querySelector("#receiver-application-form");
  const receiverApplicationStatus = document.querySelector("#receiver-application-status");
  const receiverApplicationList = document.querySelector("#receiver-application-list");
  const receiverApplicationSummary = document.querySelector("#receiver-application-summary");
  const receiverProfileForm = document.querySelector("#receiver-profile-form");
  const receiverProfilePhotoInput = document.querySelector("#receiver-profile-photo");
  const receiverProofSampleInput = document.querySelector("#receiver-profile-proof-sample");
  const receiverProofSampleName = document.querySelector("#receiver-proof-sample-name");
  const receiverProfilePreview = document.querySelector("#receiver-profile-preview");
  const receiverProfileStatus = document.querySelector("#receiver-profile-status");
  const receiverProfileStrength = document.querySelector("#receiver-profile-strength");
  const receiverPublicPhoto = document.querySelector("#receiver-public-photo");
  const receiverPublicName = document.querySelector("#receiver-public-name");
  const receiverPublicHeadline = document.querySelector("#receiver-public-headline");
  const receiverPublicLocation = document.querySelector("#receiver-public-location");
  const receiverPublicLanguages = document.querySelector("#receiver-public-languages");
  const receiverPublicProof = document.querySelector("#receiver-public-proof");
  const receiverPublicAbout = document.querySelector("#receiver-public-about");
  const receiverPublicVerification = document.querySelector("#receiver-public-verification");
  const marketplaceJobList = document.querySelector("#marketplace-job-list");
  const marketplaceOfferForm = document.querySelector("#marketplace-offer-form");
  const marketplaceOfferRequest = document.querySelector("#marketplace-offer-request");
  const marketplaceOfferCurrency = document.querySelector("#marketplace-offer-currency");
  const marketplaceOfferAmount = document.querySelector("#marketplace-offer-amount");
  const marketplaceOfferTimeline = document.querySelector("#marketplace-offer-timeline");
  const marketplaceOfferProofPlan = document.querySelector("#marketplace-offer-proof-plan");
  const marketplaceOfferMessage = document.querySelector("#marketplace-offer-message");
  const marketplaceOfferStatus = document.querySelector("#marketplace-offer-status");
  const myJobOffersList = document.querySelector("#my-job-offers-list");
  const authShell = form.closest("main");

  if (!form || !window.SwadaktaData) return;

  let signedInEmail = "";
  let accountProviderTouched = false;
  let accountRenderVersion = 0;
  let accountHomeForceToken = 0;
  let signOutRequested = false;
  const ACCOUNT_HOME_PATH = "/portal.html#home";
  const ACCOUNT_HOME_OPEN_KEY = "swadakta_account_home_open_until";
  const ACCOUNT_HOME_EMAIL_KEY = "swadakta_account_home_email";
  const RECEIVER_PROFILE_SETUP_KEY = "swadakta_receiver_profile_setup";
  const USER_SELECTABLE_PROVIDERS = new Set(["smile_id", "sumsub", "youverify"]);
  const PROVIDER_LABELS = {
    smile_id: "Smile ID",
    sumsub: "Sumsub",
    youverify: "Youverify",
    manual: "Manual exception",
  };
  const RECEIVER_CATEGORY_LABELS = {
    property_checks: "Property and site checks",
    documents: "Documents and government errands",
    shopping_delivery: "Shopping and delivery",
    sourcing: "Sourcing and supplier quotes",
    family_support: "Family support errands",
    business_support: "Business support",
  };
  const RECEIVER_COVERAGE_LABELS = {
    local_in_country: "In-country work",
    africa_to_africa: "Africa-to-Africa coverage",
    diaspora_to_africa: "Diaspora-to-Africa support",
    africa_to_diaspora: "Africa-to-diaspora support",
    postal_courier_ready: "Postal or courier coordination",
    digital_remote: "Digital or remote tasks",
  };
  const RECEIVER_GENERATED_NOTE_PREFIXES = ["Coverage scope:", "Coverage route:", "Coverage safety:"];
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
  const PAYMENT_RETURN_STATES = {
    success: {
      icon: "verified",
      eyebrow: "Stripe checkout",
      title: "Payment returned successfully",
      copy:
        "Stripe sent you back to Swadakta. Funds are treated as protected only after the provider confirmation and webhook evidence finish, then milestone release still follows proof review.",
      tone: "text-primary",
    },
    cancelled: {
      icon: "undo",
      eyebrow: "Stripe checkout",
      title: "Payment was not completed",
      copy:
        "Stripe checkout was cancelled or closed. The job can stay open while you retry the quote link or ask Swadakta to refresh the payment instructions.",
      tone: "text-tertiary",
    },
    "paypal-success": {
      icon: "verified",
      eyebrow: "PayPal order",
      title: "PayPal approval returned",
      copy:
        "PayPal sent approval back to Swadakta. The order still needs provider capture/confirmation before funds are treated as protected for milestone work.",
      tone: "text-primary",
    },
    "paypal-cancelled": {
      icon: "undo",
      eyebrow: "PayPal order",
      title: "PayPal was not completed",
      copy:
        "PayPal approval was cancelled or closed. The request can stay active while you retry PayPal or use another payment rail.",
      tone: "text-tertiary",
    },
  };

  function authMode() {
    return form.querySelector('input[name="account-auth-mode"]:checked')?.value || "sign_in";
  }

  function roleIntent() {
    return form.querySelector('input[name="accountRole"]:checked')?.value || "client";
  }

  function accountRedirect() {
    return new URL(ACCOUNT_HOME_PATH, window.location.origin).href;
  }

  function accountHomeUrl() {
    return new URL(ACCOUNT_HOME_PATH, window.location.origin).href;
  }

  function redirectToAccountHome(email = "") {
    rememberAccountHome(email || signedInEmail);
    const homeUrl = accountHomeUrl();

    if (window.location.href !== homeUrl) {
      window.location.replace(homeUrl);
      return;
    }

    window.location.reload();
  }

  function normalizePortalHomeHash() {
    const params = new URLSearchParams(window.location.search);
    if (window.location.hash !== "#work" || params.get("view") === "work") return;

    const nextUrl = new URL(window.location.href);
    nextUrl.hash = "home";
    window.history.replaceState(null, "", nextUrl);
  }

  function addReturnParams(url, code, contact, paymentState) {
    if (code) url.searchParams.set("code", code);
    if (contact) url.searchParams.set("contact", contact);
    if (paymentState) {
      url.searchParams.set("source", "payment_return");
      url.searchParams.set("payment", paymentState);
    }
    return url.href;
  }

  function renderPaymentReturnPanel() {
    if (!paymentReturnPanel) return;

    const params = new URLSearchParams(window.location.search);
    const state = String(params.get("payment") || "").trim().toLowerCase();
    const details = PAYMENT_RETURN_STATES[state];

    if (!details) {
      paymentReturnPanel.hidden = true;
      return;
    }

    const requestCode = String(params.get("request_code") || params.get("code") || "")
      .trim()
      .toUpperCase();
    const contact = String(params.get("contact") || "").trim();
    const providerReference = String(params.get("session_id") || params.get("token") || params.get("order_id") || "")
      .trim();
    const referenceParts = [];

    if (requestCode) referenceParts.push(`Request ${requestCode}`);
    if (providerReference) referenceParts.push(`Provider reference ${providerReference}`);

    paymentReturnPanel.hidden = false;
    if (paymentReturnIcon) {
      paymentReturnIcon.textContent = details.icon;
      paymentReturnIcon.className = `material-symbols-outlined ${details.tone} text-4xl`;
    }
    if (paymentReturnEyebrow) paymentReturnEyebrow.textContent = details.eyebrow;
    if (paymentReturnTitle) paymentReturnTitle.textContent = details.title;
    if (paymentReturnCopy) paymentReturnCopy.textContent = details.copy;
    if (paymentReturnReference) {
      paymentReturnReference.textContent = referenceParts.length
        ? referenceParts.join(" - ")
        : "Keep your request code handy if Swadakta sent one separately.";
    }

    if (paymentReturnTrackingLink) {
      paymentReturnTrackingLink.href = addReturnParams(
        new URL("tracking.html", window.location.href),
        requestCode,
        contact,
        state,
      );
    }
    if (paymentReturnMessagesLink) {
      paymentReturnMessagesLink.href = addReturnParams(
        new URL("messages.html", window.location.href),
        requestCode,
        contact,
        state,
      );
    }
    if (paymentReturnResolutionLink) {
      paymentReturnResolutionLink.href = addReturnParams(
        new URL("resolution.html", window.location.href),
        requestCode,
        contact,
        state,
      );
    }
  }

  function isAccountHomeOpen() {
    return Boolean(
      accountHome &&
        !accountHome.hidden &&
        document.body.classList.contains("is-account-signed-in") &&
        getComputedStyle(accountHome).display !== "none",
    );
  }

  function forceAccountHomeRoute(email = "") {
    rememberAccountHome(email);
    normalizePortalHomeHash();
    const forceToken = ++accountHomeForceToken;

    [250, 1200, 3000, 5200].forEach((delay) => {
      window.setTimeout(() => {
        if (forceToken !== accountHomeForceToken || signOutRequested || isAccountHomeOpen()) {
          return;
        }

        if (accountHome) {
          setSignedInShell(email || signedInEmail, {});
          openAccountHome();
          return;
        }

        const homeUrl = accountHomeUrl();
        window.location.replace(homeUrl);
      }, delay);
    });
  }

  async function recoverAccountHomeFromSession() {
    try {
      if (signOutRequested || isAccountHomeOpen()) return;
      const sessionResult = await window.SwadaktaData.getSession();
      const email = sessionResult.session?.user?.email || rememberedAccountHomeEmail();

      if (!email) return;

      const renderVersion = nextAccountRenderVersion();
      signedInEmail = email;
      setSignedInShell(email, {});
      openAccountHome();
      showContinueHomeButton(true, email);
      forceAccountHomeRoute(email);
      showCurrentAccount({
        autoOpen: true,
        fallbackEmail: email,
        renderVersion,
      }).catch(() => {});
    } catch {}
  }

  function rememberAccountHome(email = "") {
    try {
      sessionStorage.setItem(ACCOUNT_HOME_OPEN_KEY, String(Date.now() + 2 * 60 * 1000));
      if (email) sessionStorage.setItem(ACCOUNT_HOME_EMAIL_KEY, email);
    } catch {}
  }

  function clearRememberedAccountHome() {
    try {
      sessionStorage.removeItem(ACCOUNT_HOME_OPEN_KEY);
      sessionStorage.removeItem(ACCOUNT_HOME_EMAIL_KEY);
    } catch {}
  }

  function shouldOpenRememberedAccountHome() {
    try {
      return Number(sessionStorage.getItem(ACCOUNT_HOME_OPEN_KEY) || 0) > Date.now();
    } catch {
      return false;
    }
  }

  function rememberedAccountHomeEmail() {
    try {
      return sessionStorage.getItem(ACCOUNT_HOME_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  }

  function setAccountState(state) {
    document.body.dataset.accountState = state;
    document.body.classList.toggle("is-account-signed-in", state === "signed-in");
    document.body.classList.toggle("is-account-signed-out", state !== "signed-in");
  }

  function nextAccountRenderVersion() {
    accountRenderVersion += 1;
    return accountRenderVersion;
  }

  function isCurrentAccountRender(version) {
    return version === accountRenderVersion;
  }

  function openAccountHome() {
    if (!accountHome) {
      openAccountWorkspace();
      return;
    }

    form.hidden = true;
    if (authShell) {
      authShell.hidden = true;
    }
    accountHome.hidden = false;
    accountHome.removeAttribute("hidden");
    setAccountState("signed-in");

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

  function scrollAccountHomeAnchor(targetId = "", options = {}) {
    const cleanTargetId = String(targetId || "").replace(/^#/, "").trim();
    if (!cleanTargetId || !document.body.classList.contains("is-account-signed-in")) {
      return false;
    }

    if (cleanTargetId === "work") {
      openAccountWorkspace();
      return true;
    }

    const target =
      cleanTargetId === "home" || cleanTargetId === "dashboard"
        ? accountHome
        : document.getElementById(cleanTargetId);

    if (!target || (accountHome && target !== accountHome && !accountHome.contains(target))) {
      return false;
    }

    if (accountHome) {
      accountHome.hidden = false;
      accountHome.removeAttribute("hidden");
    }

    const nextHash = cleanTargetId === "dashboard" ? "home" : cleanTargetId;
    if (options.updateHash !== false && window.location.hash !== `#${nextHash}`) {
      const nextUrl = new URL(window.location.href);
      nextUrl.hash = nextHash;
      const method = options.replace ? "replaceState" : "pushState";
      window.history[method](null, "", nextUrl);
    }

    window.setTimeout(() => {
      target.scrollIntoView({
        behavior: options.instant ? "auto" : "smooth",
        block: "start",
      });
    }, options.delay ?? 70);
    return true;
  }

  function handleAccountHomeAnchorClick(event) {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || !accountHome?.contains(link)) return;

    const targetId = link.getAttribute("href")?.slice(1) || "";
    if (!targetId) return;

    if (scrollAccountHomeAnchor(targetId)) {
      event.preventDefault();
    }
  }

  function setSignedInShell(email = "", profile = {}) {
    setAccountState("signed-in");
    signedInEmail = email || profile.email || signedInEmail;
    rememberAccountHome(signedInEmail);
    form.hidden = true;
    if (authShell) {
      authShell.hidden = true;
    }
    if (accountHome) {
      accountHome.hidden = false;
      accountHome.removeAttribute("hidden");
    }
    renderAccountHome(profile, { email });
    setVerificationEnabled(true);
    setVerificationPill("Account open", "bg-primary-container/10 text-primary");
    setVerificationStatus(
      "Account is open. Verification is only required before paid posting, paid work, or sensitive/high-value tasks.",
      "text-primary",
    );

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
    if (!signOutRequested && shouldOpenRememberedAccountHome()) {
      const rememberedEmail = signedInEmail || rememberedAccountHomeEmail();
      if (rememberedEmail) {
        setSignedInShell(rememberedEmail, {});
        openAccountHome();
        setStatus("Account home is opening. Profile details can finish loading in the background.", "text-primary");
        return;
      }
    }

    setAccountState("signed-out");
    showContinueHomeButton(false);
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

  function showContinueHomeButton(show, email = "") {
    if (!continueHomeButton) return;
    continueHomeButton.hidden = !show;
    if (email) {
      continueHomeButton.dataset.email = email;
    }
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

  function formatShortDate(value) {
    if (!value) return "Flexible";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }

  function providerLabel(value) {
    return PROVIDER_LABELS[value] || formatStatus(value || "sumsub");
  }

  function latestVerificationRequest(requests = []) {
    return [...requests].sort((first, second) => {
      const secondTime = new Date(second.updated_at || second.created_at || 0).getTime();
      const firstTime = new Date(first.updated_at || first.created_at || 0).getTime();
      return secondTime - firstTime;
    })[0] || null;
  }

  function verificationDisplayStatus(profile = {}, request = null) {
    const profileStatus = profile.identity_verification_status || "not_started";
    return request?.status || profileStatus;
  }

  function accountIsVerified(profile = {}, request = null) {
    return profile.identity_verification_status === "verified" || request?.status === "verified";
  }

  function verificationPillTone(status, verified) {
    if (verified) return "bg-emerald-100 text-emerald-700";
    if (["failed", "expired", "rejected"].includes(status)) return "bg-error-container text-on-error-container";
    if (["requested", "link_sent", "submitted", "manual_review"].includes(status)) {
      return "bg-primary-container/10 text-primary";
    }
    return "bg-white/70 text-on-surface-variant";
  }

  function setAccountHomeGate(element, label, tone = "text-primary") {
    if (!element) return;
    element.textContent = label;
    element.className = `block font-label-md mt-1 ${tone}`.trim();
  }

  function setupCardState(card, state = "idle", copy = "") {
    if (!card) return;
    const tones = {
      done: "rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4",
      active: "rounded-2xl bg-primary-container/10 border border-primary/20 p-4",
      blocked: "rounded-2xl bg-amber-50/80 border border-amber-200 p-4",
      idle: "rounded-2xl bg-white/66 border border-outline-variant/30 p-4",
    };
    card.className = tones[state] || tones.idle;
    const copyNode = card.querySelector("[data-setup-copy]");
    if (copyNode && copy) copyNode.textContent = copy;
  }

  function accountRole(profile = {}) {
    const role = profile.account_role || roleIntent();
    return ["client", "receiver", "both"].includes(role) ? role : "client";
  }

  function accountRoleLabel(role) {
    return (
      {
        client: "Client",
        receiver: "Job seeker",
        both: "Client + job seeker",
      }[role] || "Client"
    );
  }

  function hasProfileBasics(profile = {}) {
    return Boolean(profile.full_name && (profile.whatsapp || phoneInput?.value) && (profile.country || profile.kenya_base));
  }

  function uniqueList(values = []) {
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
  }

  function profileRouteText(profile = {}) {
    const country = String(profile.country || "").trim();
    const base = String(profile.kenya_base || "").trim();
    if (country && base) return `${country} / ${base}`;
    return country || base || "";
  }

  function accountHomeNextStep(profile = {}, context = {}) {
    const role = accountRole(profile);
    const requests = context.requests || [];
    const jobs = context.jobs || [];
    const applications = context.applications || [];
    const latestRequest = latestVerificationRequest(context.verifications || []);
    const verified = accountIsVerified(profile, latestRequest);
    const canGiveJobs = role === "client" || role === "both";
    const canReceiveJobs = role === "receiver" || role === "both";

    if (!hasProfileBasics(profile)) {
      return {
        title: "Save profile basics",
        copy: "Add legal name, mobile, current country, and operating base so Swadakta can route work properly.",
        href: "#work",
        label: "Save profile",
      };
    }

    if (!verified && latestRequest?.provider_link) {
      return {
        title: "Finish provider verification",
        copy: "Your provider link is ready. Complete ID, document, and selfie/liveness checks before paid actions unlock.",
        href: latestRequest.provider_link,
        label: "Open provider",
        external: true,
      };
    }

    if (!verified) {
      return {
        title: latestRequest ? "Wait for verification result" : "Request verification",
        copy: latestRequest
          ? "Verification is queued. You can still prepare briefs, profile, and messages while Swadakta waits for provider evidence."
          : "Verification is not needed to hold an account, but it is required before paid posting, paid work, or sensitive jobs.",
        href: "verification.html?reason=account_required",
        label: "Open verification",
      };
    }

    if (jobs.length) {
      return {
        title: "Update assigned work",
        copy: "Open tracking to submit proof, photos, notes, receipts, milestones, or issue updates for assigned jobs.",
        href: "tracking.html",
        label: "Track jobs",
      };
    }

    if (canGiveJobs && !requests.length) {
      return {
        title: "Create your first brief",
        copy: "Choose a route, describe the task, upload helpful media, and let Swadakta shape it into a quote-ready job.",
        href: "corridor.html",
        label: "Give a job",
      };
    }

    if (canReceiveJobs && !applications.length) {
      return {
        title: "Set job coverage",
        copy: "Tell Swadakta where you can work, what proof tools you can use, and which categories fit you.",
        href: "#find-work",
        label: "Apply for jobs",
      };
    }

    if (requests.length) {
      return {
        title: "Track active work",
        copy: "Open your jobs to check proof, payment route, messages, milestones, and any resolution cases.",
        href: "tracking.html",
        label: "Open tracking",
      };
    }

    return {
      title: "Keep route rules current",
      copy: "Review lawful-goods, proof, payment, and corridor rules before taking or giving cross-border work.",
      href: "rules.html",
      label: "Check rules",
    };
  }

  function automationStatusTone(status) {
    return (
      {
        ready: {
          label: "Ready",
          icon: "task_alt",
          card: "rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4",
          pill: "bg-emerald-100 text-emerald-700",
        },
        draft: {
          label: "Draft only",
          icon: "edit_note",
          card: "rounded-2xl bg-primary-container/10 border border-primary/20 p-4",
          pill: "bg-primary-container/10 text-primary",
        },
        waiting: {
          label: "Waiting",
          icon: "pending",
          card: "rounded-2xl bg-white/72 border border-outline-variant/30 p-4",
          pill: "bg-white/70 text-on-surface-variant",
        },
        action: {
          label: "Needs setup",
          icon: "add_task",
          card: "rounded-2xl bg-amber-50/80 border border-amber-200 p-4",
          pill: "bg-amber-50 text-amber-700",
        },
        optional: {
          label: "Optional",
          icon: "tune",
          card: "rounded-2xl bg-white/66 border border-outline-variant/30 p-4",
          pill: "bg-white/70 text-on-surface-variant",
        },
        protected: {
          label: "Protected",
          icon: "lock",
          card: "rounded-2xl bg-white/66 border border-outline-variant/30 p-4",
          pill: "bg-tertiary/10 text-tertiary",
        },
        blocked: {
          label: "Blocked",
          icon: "block",
          card: "rounded-2xl bg-error-container/70 border border-error/20 p-4",
          pill: "bg-error-container text-on-error-container",
        },
      }[status] || {
        label: "Checking",
        icon: "radio_button_unchecked",
        card: "rounded-2xl bg-white/66 border border-outline-variant/30 p-4",
        pill: "bg-white/70 text-on-surface-variant",
      }
    );
  }

  function automationReadinessScore(items = []) {
    const scoringItems = items.filter((item) => item.key !== "money");
    if (!scoringItems.length) return 25;
    const weights = {
      ready: 1,
      draft: 0.65,
      waiting: 0.45,
      action: 0.25,
      optional: 0.25,
      blocked: 0.15,
      protected: 0.1,
    };
    const total = scoringItems.reduce((sum, item) => sum + (weights[item.status] ?? 0.2), 0);
    return Math.max(25, Math.round((total / scoringItems.length) * 100));
  }

  function accountHomeAutopilotItems(profile = {}, context = {}) {
    const role = accountRole(profile);
    const requests = context.requests || [];
    const jobs = context.jobs || [];
    const verifications = context.verifications || [];
    const applications = context.applications || [];
    const latestRequest = latestVerificationRequest(verifications);
    const verified = accountIsVerified(profile, latestRequest);
    const hasProfile = hasProfileBasics(profile);
    const canGiveJobs = role === "client" || role === "both";
    const canReceiveJobs = role === "receiver" || role === "both";
    const receiverSetup = readReceiverProfileSetup();
    const hasReceiverCoverage = Boolean(
      applications.length || receiverSetup.location || receiverSetup.headline || receiverSetup.proof_tools,
    );

    return [
      {
        key: "profile",
        title: "Profile routing",
        status: hasProfile ? "ready" : "action",
        copy: hasProfile
          ? "AI can use your country, base, mobile backup, and role to guide routes."
          : "Save legal name, mobile, current country, and base so the system can route work.",
      },
      {
        key: "verification",
        title: "ID provider gate",
        status: verified ? "ready" : latestRequest ? "waiting" : "action",
        copy: verified
          ? "Provider evidence is recorded. Job-specific gates still apply."
          : latestRequest?.provider_link
            ? "Open the provider link to finish ID, document, and selfie/liveness checks."
            : latestRequest
              ? "Verification is queued. Paid actions wait for provider evidence."
              : "Request provider verification before paid posting, paid work, or sensitive jobs.",
      },
      {
        key: "brief",
        title: "Give jobs",
        status: canGiveJobs ? (verified ? "ready" : "draft") : "optional",
        copy: canGiveJobs
          ? verified
            ? requests.length
              ? "AI can triage new briefs and help track existing requests."
              : "You can create a paid brief after the corridor, proof, and payment checks pass."
            : "AI can draft and organize briefs now; posting and payment stay gated."
          : "Client mode is optional. You can add it later from this same account.",
      },
      {
        key: "receiver",
        title: "Get jobs",
        status: canReceiveJobs ? (verified && hasReceiverCoverage ? "ready" : hasReceiverCoverage ? "waiting" : "action") : "optional",
        copy: canReceiveJobs
          ? verified && hasReceiverCoverage
            ? jobs.length
              ? "AI can help prepare updates, proof summaries, and next steps for assigned jobs."
              : "Your coverage can be considered for eligible lawful jobs."
            : hasReceiverCoverage
              ? "Coverage is started. Paid matching waits for verified ID/selfie evidence."
              : "Add coverage, categories, proof tools, and availability before matching."
          : "Receiver mode is optional. You can add it later from this same account.",
      },
      {
        key: "money",
        title: "Money release",
        status: "protected",
        copy: "AI can prepare quote, margin, milestone, and proof notes. It cannot release, refund, or mark funds protected.",
      },
    ];
  }

  function renderAccountHomeAutopilot(profile = {}, context = {}) {
    const items = accountHomeAutopilotItems(profile, context);
    const score = automationReadinessScore(items);
    const latestRequest = latestVerificationRequest(context.verifications || []);
    const verified = accountIsVerified(profile, latestRequest);
    const hasProfile = hasProfileBasics(profile);

    if (accountHomeAutopilotProgress) {
      accountHomeAutopilotProgress.textContent = `${score}% automation ready`;
      accountHomeAutopilotProgress.className = `inline-flex min-h-10 px-4 items-center justify-center rounded-full font-label-md ${
        score >= 80
          ? "bg-emerald-50 text-emerald-700"
          : score >= 50
            ? "bg-primary-container/10 text-primary"
            : "bg-amber-50 text-amber-700"
      }`.trim();
    }

    if (accountHomeAutopilotSummary) {
      accountHomeAutopilotSummary.textContent = !hasProfile
        ? "Save profile basics first. Until then, AI can explain the system and draft work, but it has limited routing context."
        : verified
          ? "AI can triage briefs, route checks, proof plans, messages, and milestone summaries. Protected decisions still require provider, payment, route, and proof evidence."
          : "AI can draft and triage routine work now. Provider ID verification is still required before paid posting, paid matching, sensitive work, or money movement.";
    }

    if (accountHomeAutopilotList) {
      accountHomeAutopilotList.innerHTML = items
        .map((item) => {
          const tone = automationStatusTone(item.status);
          return `
            <article class="${tone.card}">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-label-md text-on-surface">${escapeHtml(item.title)}</p>
                  <span class="mt-2 inline-flex min-h-7 px-3 items-center justify-center rounded-full font-label-sm ${tone.pill}">${escapeHtml(tone.label)}</span>
                </div>
                <span class="material-symbols-outlined text-primary">${escapeHtml(tone.icon)}</span>
              </div>
              <p class="font-body-md text-on-surface-variant text-sm mt-3">${escapeHtml(item.copy)}</p>
            </article>
          `;
        })
        .join("");
    }

    if (accountHomeAiSafeList) {
      accountHomeAiSafeList.innerHTML = [
        "Draft briefs, replies, updates, receiver instructions, and friendly client messages.",
        "Suggest corridor, proof, weather, media, lawful-goods, and payment milestone checks.",
        "Prepare quote notes, founder margin guardrails, and missing-evidence summaries.",
        "Flag likely blockers early and send the user to the right tool without forcing AI usage.",
      ]
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
    }

    if (accountHomeProtectedList) {
      accountHomeProtectedList.innerHTML = [
        "AI cannot mark ID verified, release or refund money, override provider evidence, or assign paid work by itself.",
        "Restricted goods, legal authority, tax, customs, high-value property, and dispute exceptions need provider or founder evidence.",
        "Receiver public trust only improves after verified identity, real proof, completed jobs, and honest reviews.",
        "Wise stays a fallback path only when primary automatic payment rails fail.",
      ]
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
    }
  }

  function renderAccountHomeDashboard(profile = {}, context = {}) {
    const role = accountRole(profile);
    const latestRequest = latestVerificationRequest(context.verifications || []);
    const verified = accountIsVerified(profile, latestRequest);
    const applications = context.applications || [];
    const receiverSetup = readReceiverProfileSetup();
    const coverageLabels = uniqueList(applications.flatMap((application) => receiverApplicationCoverageLabels(application)));
    const routeText = profileRouteText(profile) || receiverSetup.location || "";
    const nextStep = accountHomeNextStep(profile, context);

    if (accountHomeModeTitle) accountHomeModeTitle.textContent = accountRoleLabel(role);
    if (accountHomeModeCopy) {
      accountHomeModeCopy.textContent =
        role === "both"
          ? "You can give jobs and receive matched work from this same account."
          : role === "receiver"
            ? "This account is set up for paid work. You can still create client briefs later."
            : "This account is set up to give jobs. You can add job-seeker coverage later.";
    }
    if (accountHomeModePill) {
      accountHomeModePill.textContent = verified ? "Verified gate ready" : "Account open";
      accountHomeModePill.className = `inline-flex min-h-8 px-3 items-center justify-center rounded-full font-label-sm mt-4 ${
        verified ? "bg-emerald-50 text-emerald-700" : "bg-primary-container/10 text-primary"
      }`.trim();
    }

    if (accountHomeRouteTitle) {
      accountHomeRouteTitle.textContent = coverageLabels.length ? "Coverage on file" : routeText ? "Route context" : "Set your corridor";
    }
    if (accountHomeRouteCopy) {
      accountHomeRouteCopy.textContent = coverageLabels.length
        ? `Coverage: ${coverageLabels.slice(0, 3).join(", ")}${coverageLabels.length > 3 ? "..." : ""}.`
        : routeText
          ? `Current route context is ${routeText}. Choose a corridor per job before money or assignment.`
          : "Add country, base, and coverage so Swadakta can match lawful work properly.";
    }
    if (accountHomeRoutePill) {
      accountHomeRoutePill.textContent = coverageLabels.length
        ? `${coverageLabels.length} coverage lane${coverageLabels.length === 1 ? "" : "s"}`
        : routeText || "No route yet";
      accountHomeRoutePill.className = `inline-flex min-h-8 px-3 items-center justify-center rounded-full font-label-sm mt-4 ${
        coverageLabels.length || routeText
          ? "bg-primary-container/10 text-primary"
          : "bg-white/70 border border-outline-variant/40 text-on-surface-variant"
      }`.trim();
    }

    if (accountHomeNextStepTitle) accountHomeNextStepTitle.textContent = nextStep.title;
    if (accountHomeNextStepCopy) accountHomeNextStepCopy.textContent = nextStep.copy;
    if (accountHomeNextStepAction) {
      accountHomeNextStepAction.href = nextStep.href;
      accountHomeNextStepAction.textContent = nextStep.label;
      if (nextStep.external) {
        accountHomeNextStepAction.target = "_blank";
        accountHomeNextStepAction.rel = "noopener";
      } else {
        accountHomeNextStepAction.removeAttribute("target");
        accountHomeNextStepAction.removeAttribute("rel");
      }
    }
  }

  function renderAccountSetupChecklist(profile = {}, context = {}) {
    const verifications = context.verifications || [];
    const applications = context.applications || [];
    const requests = context.requests || [];
    const latestRequest = latestVerificationRequest(verifications);
    const verified = accountIsVerified(profile, latestRequest);
    const hasProfile = hasProfileBasics(profile);
    const receiverSetup = readReceiverProfileSetup();
    const hasReceiverProfile = Boolean(receiverSetup.headline && receiverSetup.location && (receiverSetup.photo_data_url || receiverSetup.proof_tools));
    const hasApplication = applications.length > 0;
    const hasClientTrail = requests.length > 0;
    const readyCount = [hasProfile, verified, hasClientTrail, hasReceiverProfile || hasApplication].filter(Boolean).length;
    const progress = Math.max(25, Math.round((readyCount / 4) * 100));

    if (accountSetupProgress) {
      accountSetupProgress.textContent = `${progress}% setup ready`;
      accountSetupProgress.className = `inline-flex min-h-10 px-4 items-center justify-center rounded-full font-label-md ${
        progress >= 80
          ? "bg-emerald-50 text-emerald-700"
          : progress >= 50
            ? "bg-primary-container/10 text-primary"
            : "bg-amber-50 text-amber-700"
      }`.trim();
    }

    setupCardState(
      accountSetupProfile,
      hasProfile ? "done" : "active",
      hasProfile ? "Profile basics saved." : "Add legal name, mobile, current country, and corridor base.",
    );
    setupCardState(
      accountSetupVerification,
      verified ? "done" : latestRequest ? "active" : "idle",
      verified
        ? "Provider evidence is recorded."
        : latestRequest?.provider_link
          ? "Open the provider link to finish ID, document, and selfie checks."
          : latestRequest
            ? "Verification is queued; wait for provider evidence."
            : "Provider ID, document, selfie, and liveness checks unlock paid actions.",
    );
    setupCardState(
      accountSetupClient,
      hasClientTrail ? "done" : verified ? "active" : "idle",
      hasClientTrail
        ? "Client job history has started."
        : "Choose a corridor, upload media, define proof, and keep funds milestone-ready.",
    );
    setupCardState(
      accountSetupReceiver,
      hasApplication || hasReceiverProfile ? "done" : verified ? "active" : "idle",
      hasApplication
        ? "Receiver application saved."
        : hasReceiverProfile
          ? "Receiver profile is taking shape."
          : "Build a real work profile with face photo, base, proof tools, and coverage.",
    );

    if (!accountSetupNext) return;
    if (!hasProfile) {
      accountSetupNext.textContent = "Next: save legal name, mobile, current country, and corridor base.";
    } else if (!verified) {
      accountSetupNext.textContent = latestRequest?.provider_link
        ? "Next: open the provider check and finish ID, document, and selfie/liveness steps."
        : "Next: request provider verification before paid posting, paid work, or sensitive tasks.";
    } else if (!hasClientTrail && !hasReceiverProfile && !hasApplication) {
      accountSetupNext.textContent = "Next: choose whether to give a job, find jobs, or do both from this same account.";
    } else if (!hasReceiverProfile && !hasApplication) {
      accountSetupNext.textContent = "Next: add a real receiver profile if you want to be matched to work.";
    } else {
      accountSetupNext.textContent = "Next: keep proof, payment, corridor rules, and receiver availability current for each job.";
    }
  }

  function renderAccountHomeVerification(profile = {}, requests = []) {
    const request = latestVerificationRequest(requests);
    const status = verificationDisplayStatus(profile, request);
    const verified = accountIsVerified(profile, request);
    const provider = request?.provider || profile.identity_verification_provider || recommendedProviderForCountry(profile.country || "");
    const providerName = providerLabel(provider);

    setHomeVerificationPill(
      verified ? "Verified account" : `${formatStatus(status)} verification`,
      verificationPillTone(status, verified),
    );

    if (accountHomeVerificationSummary) {
      if (verified) {
        accountHomeVerificationSummary.textContent =
          "Your provider evidence is recorded. Eligible paid posting, receiver work, and sensitive workflows can unlock when each corridor also passes payment, proof, and rules checks.";
      } else if (request?.provider_link) {
        accountHomeVerificationSummary.textContent = `${providerName} is ready. Open the provider check and complete the ID, document, and selfie or liveness steps there.`;
      } else if (request) {
        accountHomeVerificationSummary.textContent = `Your ${providerName} verification request is saved as ${formatStatus(status)}. Swadakta waits for provider evidence before unlocking paid actions; manual review is only an exception fallback.`;
      } else {
        accountHomeVerificationSummary.textContent =
          "Provider verification unlocks paid posting, paid work, and sensitive jobs. You can still explore, save your profile, and prepare briefs now.";
      }
    }

    if (accountHomeVerificationAction) {
      const href = request?.provider_link || `verification.html?provider=${encodeURIComponent(provider)}&reason=account_required`;
      accountHomeVerificationAction.href = href;
      accountHomeVerificationAction.textContent = request?.provider_link ? "Open provider check" : "Open verification";
      if (request?.provider_link) {
        accountHomeVerificationAction.target = "_blank";
        accountHomeVerificationAction.rel = "noopener";
      } else {
        accountHomeVerificationAction.removeAttribute("target");
        accountHomeVerificationAction.removeAttribute("rel");
      }
    }

    setAccountHomeGate(accountHomeGateAccount, "Open", "text-primary");
    setAccountHomeGate(accountHomeGatePosting, verified ? "Unlocked" : "Verify ID", verified ? "text-emerald-700" : "text-primary");
    setAccountHomeGate(accountHomeGateWork, verified ? "Unlocked" : "Verify ID", verified ? "text-emerald-700" : "text-primary");
    setAccountHomeGate(accountHomeGateSensitive, verified ? "Eligible by ID" : "Verify ID", verified ? "text-emerald-700" : "text-primary");
  }

  function receiverApplicationCategories() {
    if (!receiverApplicationForm) return [];
    return Array.from(receiverApplicationForm.querySelectorAll('input[name="receiver_category"]:checked')).map(
      (input) => input.value,
    );
  }

  function receiverApplicationCoverageScopes() {
    if (!receiverApplicationForm) return [];
    return Array.from(receiverApplicationForm.querySelectorAll('input[name="receiver_coverage_scope"]:checked')).map(
      (input) => input.value,
    );
  }

  function stripGeneratedReceiverApplicationNotes(notes = "") {
    return String(notes || "")
      .split(/\n/)
      .filter((line) => {
        const trimmed = line.trim();
        return !RECEIVER_GENERATED_NOTE_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function receiverCoverageNote({ scopes = [], base = "", serviceRegions = "" } = {}) {
    const labels = scopes.map((scope) => RECEIVER_COVERAGE_LABELS[scope]).filter(Boolean);
    const crossBorder = scopes.some((scope) =>
      ["africa_to_africa", "diaspora_to_africa", "africa_to_diaspora", "postal_courier_ready"].includes(scope),
    );
    const lines = [
      labels.length ? `Coverage scope: ${labels.join(", ")}` : "",
      base || serviceRegions ? `Coverage route: base ${base || "not set"}; areas ${serviceRegions || "not set"}` : "",
      crossBorder
        ? "Coverage safety: Cross-border lawful-goods check, customs, courier, duties, and proof requirements apply before assignment."
        : "Coverage safety: Local proof standard and location check apply before assignment.",
    ].filter(Boolean);
    return lines.join("\n");
  }

  function receiverCoverageScopesFromNotes(notes = "") {
    const scopeLine = String(notes || "").match(/Coverage scope:\s*([^\n]+)/i)?.[1] || "";
    const normalized = scopeLine.toLowerCase();
    if (!normalized) return [];
    return Object.entries(RECEIVER_COVERAGE_LABELS)
      .filter(([scope, label]) => {
        const readableScope = scope.replace(/_/g, " ");
        return normalized.includes(label.toLowerCase()) || normalized.includes(readableScope);
      })
      .map(([scope]) => scope);
  }

  function receiverApplicationCoverageLabels(application = {}) {
    const storedScopes = Array.isArray(application.coverage_scopes) ? application.coverage_scopes : [];
    const noteScopes = receiverCoverageScopesFromNotes(application.notes);
    const inferredScopes = [];
    const coverageText = `${application.kenya_base || ""} ${application.service_regions || ""} ${application.notes || ""}`.toLowerCase();

    if (!storedScopes.length && !noteScopes.length) {
      if (coverageText.includes("africa")) inferredScopes.push("africa_to_africa");
      if (/(remote|digital|online|virtual)/.test(coverageText)) inferredScopes.push("digital_remote");
      if (/(postal|courier|shipping|delivery)/.test(coverageText)) inferredScopes.push("postal_courier_ready");
    }

    return [...new Set([...storedScopes, ...noteScopes, ...inferredScopes])]
      .map((scope) => RECEIVER_COVERAGE_LABELS[scope])
      .filter(Boolean);
  }

  function renderReceiverCoverageChips(labels = []) {
    const visibleLabels = labels.length ? labels : ["Coverage scope pending"];
    return visibleLabels
      .map((label) => `<span class="rounded-full bg-white px-3 py-1">${escapeHtml(label)}</span>`)
      .join("");
  }

  function setReceiverApplicationStatus(message, tone = "") {
    if (!receiverApplicationStatus) return;
    receiverApplicationStatus.textContent = message;
    receiverApplicationStatus.className = `md:col-span-2 font-label-md text-label-md min-h-6 ${tone || "text-on-surface-variant"}`.trim();
  }

  function setReceiverProfileStatus(message, tone = "") {
    if (!receiverProfileStatus) return;
    receiverProfileStatus.textContent = message;
    receiverProfileStatus.className = `md:col-span-2 font-label-md text-label-md min-h-6 ${tone || "text-on-surface-variant"}`.trim();
  }

  function receiverProfileInitials(profile = {}) {
    const name = profile.full_name || field("#receiver-full-name")?.value || signedInEmail || "Swadakta";
    return String(name)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "SW";
  }

  function readReceiverProfileSetup() {
    try {
      return JSON.parse(localStorage.getItem(RECEIVER_PROFILE_SETUP_KEY) || "{}");
    } catch {
      localStorage.removeItem(RECEIVER_PROFILE_SETUP_KEY);
      return {};
    }
  }

  function writeReceiverProfileSetup(setup = {}) {
    const next = { ...readReceiverProfileSetup(), ...setup, updated_at: new Date().toISOString() };
    localStorage.setItem(RECEIVER_PROFILE_SETUP_KEY, JSON.stringify(next));
    return next;
  }

  function renderReceiverProfileAvatar(node, setup = {}, profile = {}) {
    if (!node) return;
    const photoSource = setup.photo_data_url || setup.photo_signed_url || "";
    if (photoSource) {
      node.innerHTML = `<img alt="" class="h-full w-full object-cover" src="${escapeHtml(photoSource)}"/>`;
      return;
    }
    node.textContent = receiverProfileInitials(profile);
  }

  function receiverProfileSetupFromForm() {
    return {
      headline: field("#receiver-profile-headline")?.value.trim() || "",
      location: field("#receiver-profile-location")?.value.trim() || "",
      bio: field("#receiver-profile-bio")?.value.trim() || "",
      languages: field("#receiver-profile-languages")?.value.trim() || "",
      proof_tools: field("#receiver-profile-tools")?.value.trim() || "",
    };
  }

  function receiverProfileSetupNote(setup = {}) {
    const lines = [
      setup.headline ? `Receiver headline: ${setup.headline}` : "",
      setup.location ? `Receiver current base: ${setup.location}` : "",
      setup.languages ? `Languages: ${setup.languages}` : "",
      setup.proof_tools ? `Proof tools: ${setup.proof_tools}` : "",
      setup.photo_path ? `Profile photo uploaded privately: ${setup.photo_path}` : "",
      setup.proof_sample_name ? `Proof sample attached for private review: ${setup.proof_sample_name}` : "",
      setup.proof_sample_path ? `Proof sample uploaded privately: ${setup.proof_sample_path}` : "",
      setup.bio ? `Receiver work bio: ${setup.bio}` : "",
      "Receiver profile photo must match provider ID/selfie verification before paid public trust signals unlock.",
      "Current base changes should trigger provider or Swadakta safety re-check before assignment.",
    ].filter(Boolean);
    return lines.join("\n");
  }

  function receiverProfileScore(profile = {}, setup = {}) {
    const name = field("#receiver-full-name")?.value.trim() || profile.full_name || signedInEmail;
    const verified = profile.identity_verification_status === "verified";
    let score = 25;
    if (name) score += 5;
    if (setup.headline) score += 10;
    if (setup.location) score += 10;
    if (setup.bio) score += 10;
    if (setup.languages) score += 5;
    if (setup.proof_tools) score += 5;
    if (setup.photo_data_url || setup.photo_path) score += 10;
    if (setup.proof_sample_name || setup.proof_sample_path) score += 5;
    if (verified) score += 30;
    return Math.min(100, score);
  }

  function receiverProvenanceTone(score) {
    if (score >= 80) return "bg-emerald-50 text-emerald-700";
    if (score >= 55) return "bg-primary-container/10 text-primary";
    return "bg-amber-50 text-amber-700";
  }

  function baseChangedFromVerifiedProfile(profile = {}, setup = {}) {
    const verifiedBase = String(profile.kenya_base || profile.country || "").trim().toLowerCase();
    const currentBase = String(setup.location || "").trim().toLowerCase();
    return Boolean(verifiedBase && currentBase && verifiedBase !== currentBase);
  }

  function fillReceiverProfileSetup(profile = {}) {
    if (!receiverProfileForm) return;
    const setup = readReceiverProfileSetup();
    const headline = field("#receiver-profile-headline");
    const location = field("#receiver-profile-location");
    const bio = field("#receiver-profile-bio");
    const languages = field("#receiver-profile-languages");
    const proofTools = field("#receiver-profile-tools");
    if (headline && !headline.value) headline.value = setup.headline || "";
    if (location && !location.value) location.value = setup.location || profile.kenya_base || profile.country || "";
    if (bio && !bio.value) bio.value = setup.bio || "";
    if (languages && !languages.value) languages.value = setup.languages || "";
    if (proofTools && !proofTools.value) proofTools.value = setup.proof_tools || "Photos, video, voice notes, receipts";
    if (receiverProofSampleName && setup.proof_sample_name) {
      receiverProofSampleName.textContent = setup.proof_sample_path
        ? `${setup.proof_sample_name} uploaded privately. Review comes before public trust use.`
        : `${setup.proof_sample_name} ready for private upload and review before public trust use.`;
    }
    renderReceiverProfileSetup(profile);
  }

  function renderReceiverProfileSetup(profile = {}) {
    if (!receiverProfileForm) return;
    const setup = { ...readReceiverProfileSetup(), ...receiverProfileSetupFromForm() };
    const name = field("#receiver-full-name")?.value.trim() || profile.full_name || signedInEmail || "Your public profile";
    const verified = profile.identity_verification_status === "verified";
    const score = receiverProfileScore(profile, setup);
    const baseChanged = baseChangedFromVerifiedProfile(profile, setup);

    renderReceiverProfileAvatar(receiverProfilePreview, setup, { ...profile, full_name: name });
    renderReceiverProfileAvatar(receiverPublicPhoto, setup, { ...profile, full_name: name });
    if (receiverPublicName) receiverPublicName.textContent = name;
    if (receiverPublicHeadline) receiverPublicHeadline.textContent = setup.headline || "Add headline and proof tools";
    if (receiverPublicLocation) receiverPublicLocation.textContent = setup.location || profile.kenya_base || profile.country || "Not set";
    if (receiverPublicLanguages) receiverPublicLanguages.textContent = setup.languages || "Not set";
    if (receiverPublicProof) receiverPublicProof.textContent = setup.proof_tools || "Photos, video, receipts";
    if (receiverPublicAbout) receiverPublicAbout.textContent = setup.bio || "Save a short work bio so clients can understand your reliability before assignment.";
    if (receiverPublicVerification) {
      receiverPublicVerification.textContent = baseChanged
        ? "Base change check needed before paid assignment"
        : verified
          ? "ID/selfie verification recorded. Job-specific gates still apply."
          : "ID/selfie verification required before paid jobs";
    }
    if (receiverProfileStrength) {
      receiverProfileStrength.textContent = `${score}% ${score >= 80 ? "high-trust" : verified ? "verified" : "starter"} provenance`;
      receiverProfileStrength.className = `inline-flex min-h-10 px-4 items-center justify-center rounded-full font-label-md ${receiverProvenanceTone(score)}`.trim();
    }
  }

  async function saveReceiverProfileSetup(event) {
    event?.preventDefault();
    const setup = writeReceiverProfileSetup(receiverProfileSetupFromForm());
    renderReceiverProfileSetup({});
    renderAccountSetupChecklist({});
    setReceiverProfileStatus("Profile setup saved. Verification is still required before paid work unlocks.", "text-primary");

    if (!signedInEmail) return;
    const receiverNotes = field("#receiver-notes")?.value.trim() || "";
    const profileNotes = [receiverNotes, receiverProfileSetupNote(setup)].filter(Boolean).join("\n\n");
    try {
      const payload = {
        account_role: roleIntent() === "client" ? "both" : roleIntent(),
        profile_notes: profileNotes,
        onboarding_status: "profile_started",
      };
      if (setup.location) {
        payload.country = setup.location;
        payload.kenya_base = setup.location;
      }
      await window.SwadaktaData.saveAccountProfile(payload);
      setReceiverProfileStatus("Profile setup saved to your account. Complete provider ID/selfie verification before paid work.", "text-primary");
    } catch (error) {
      setReceiverProfileStatus("Profile saved locally. Account sync can retry after the connection settles.", "text-primary");
    }
  }

  function handleReceiverProfilePhoto(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setReceiverProfileStatus("Choose an image file for the profile photo.", "text-error");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setReceiverProfileStatus("Use a smaller photo for this upload. Larger media can be added as proof links during the job.", "text-error");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      writeReceiverProfileSetup({ photo_data_url: String(reader.result || "") });
      renderReceiverProfileSetup({});
      setReceiverProfileStatus("Photo preview saved. It must match ID/selfie verification before clients rely on it.", "text-primary");
    });
    reader.readAsDataURL(file);

    if (signedInEmail && window.SwadaktaData.uploadAccountMedia) {
      window.SwadaktaData.uploadAccountMedia("receiver-profile-photo", file)
        .then((result) => {
          const media = result.data || {};
          writeReceiverProfileSetup({
            photo_name: media.name || file.name,
            photo_path: media.path || "",
            photo_signed_url: media.signed_url || "",
            photo_uploaded_at: media.uploaded_at || new Date().toISOString(),
          });
          renderReceiverProfileSetup({});
          setReceiverProfileStatus("Photo uploaded privately. Provider ID/selfie matching is still required before paid jobs.", "text-primary");
        })
        .catch(() => {
          setReceiverProfileStatus("Photo preview is saved on this device. Private upload can retry after the account session refreshes.", "text-primary");
        });
    }
  }

  function handleReceiverProofSample(file) {
    if (!file) return;
    const allowedTypes = ["image/", "video/", "application/pdf"];
    if (!allowedTypes.some((type) => file.type.startsWith(type) || file.type === type)) {
      setReceiverProfileStatus("Choose an image, video, or PDF proof sample.", "text-error");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setReceiverProfileStatus("Use a smaller proof sample for this upload. Larger evidence can be added as proof links during the job.", "text-error");
      return;
    }
    writeReceiverProfileSetup({
      proof_sample_name: file.name,
      proof_sample_type: file.type,
      proof_sample_size: file.size,
    });
    if (receiverProofSampleName) {
      receiverProofSampleName.textContent = `${file.name} ready for private upload and review before clients rely on it.`;
    }
    renderReceiverProfileSetup({});
    setReceiverProfileStatus("Proof sample noted for review. Real provenance rises only after reviewed work and verified identity.", "text-primary");

    if (signedInEmail && window.SwadaktaData.uploadAccountMedia) {
      window.SwadaktaData.uploadAccountMedia("receiver-proof-sample", file)
        .then((result) => {
          const media = result.data || {};
          writeReceiverProfileSetup({
            proof_sample_name: media.name || file.name,
            proof_sample_path: media.path || "",
            proof_sample_signed_url: media.signed_url || "",
            proof_sample_uploaded_at: media.uploaded_at || new Date().toISOString(),
          });
          if (receiverProofSampleName) {
            receiverProofSampleName.textContent = `${media.name || file.name} uploaded privately. Review comes before public trust use.`;
          }
          renderReceiverProfileSetup({});
          setReceiverProfileStatus("Proof sample uploaded privately. It still needs review before it raises public trust.", "text-primary");
        })
        .catch(() => {
          setReceiverProfileStatus("Proof sample is saved on this device. Private upload can retry after the account session refreshes.", "text-primary");
        });
    }
  }

  function populateReceiverApplication(profile = {}) {
    if (!receiverApplicationForm) return;
    const notes = profile.profile_notes || "";
    const coverageScopes = receiverCoverageScopesFromNotes(notes);
    field("#receiver-full-name").value = profile.full_name || "";
    field("#receiver-whatsapp").value = profile.whatsapp || "";
    field("#receiver-base").value = profile.kenya_base || profile.country || "";
    field("#receiver-regions").value = profile.kenya_base || profile.country || "";
    field("#receiver-notes").value = stripGeneratedReceiverApplicationNotes(notes);
    receiverApplicationForm.querySelectorAll('input[name="receiver_coverage_scope"]').forEach((input) => {
      input.checked = coverageScopes.includes(input.value);
    });
    fillReceiverProfileSetup(profile);
  }

  function receiverApplicationPayload() {
    const categories = receiverApplicationCategories();
    const coverageScopes = receiverApplicationCoverageScopes();
    const base = field("#receiver-base")?.value.trim() || "";
    const serviceRegions = field("#receiver-regions")?.value.trim() || "";
    const rawNotes = stripGeneratedReceiverApplicationNotes(field("#receiver-notes")?.value.trim() || "");
    const coverageNote = receiverCoverageNote({ scopes: coverageScopes, base, serviceRegions });
    return {
      full_name: field("#receiver-full-name")?.value.trim() || "",
      email: signedInEmail,
      whatsapp: field("#receiver-whatsapp")?.value.trim() || "",
      kenya_base: base,
      service_regions: serviceRegions,
      service_categories: categories,
      coverage_scopes: coverageScopes,
      availability: field("#receiver-availability")?.value || "flexible",
      transport_access: field("#receiver-transport")?.value || "mixed",
      notes: [rawNotes, coverageNote].filter(Boolean).join("\n\n"),
      id_verification_consent: Boolean(field("#receiver-id-consent")?.checked),
      proof_standard_consent: Boolean(field("#receiver-proof-consent")?.checked),
    };
  }

  function renderReceiverApplications(applications = [], jobs = []) {
    if (!receiverApplicationList) return;

    if (receiverApplicationSummary) {
      receiverApplicationSummary.textContent = applications.length
        ? `${applications.length} receiver application${applications.length === 1 ? "" : "s"}`
        : "No application yet";
    }

    if (!applications.length) {
      receiverApplicationList.innerHTML = `
        <article class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4">
          <p class="font-label-md text-on-surface">No receiver application yet</p>
          <p class="font-body-md text-on-surface-variant text-sm mt-1">Apply once your coverage and proof standards are clear. Verification and vetting still happen before paid jobs.</p>
        </article>`;
      return;
    }

    receiverApplicationList.innerHTML = applications
      .map((application) => {
        const categories = Array.isArray(application.service_categories)
          ? application.service_categories.map((category) => RECEIVER_CATEGORY_LABELS[category] || category).join(", ")
          : application.service_categories || "Coverage categories pending";
        const coverageLabels = receiverApplicationCoverageLabels(application);
        const score = Number(application.provenance_score ?? 25);
        const scoreTone = score >= 80 ? "text-emerald-700" : score >= 55 ? "text-primary" : "text-amber-700";
        const assignedCount = jobs.filter((job) => job.assigned_partner_id === application.id).length;
        return `
          <article class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong class="font-label-md text-on-surface">${escapeHtml(application.partner_code || "Receiver application")}</strong>
                <p class="font-body-md text-on-surface-variant text-sm mt-1">${escapeHtml(application.kenya_base || "Base pending")} - ${escapeHtml(categories)}</p>
                <p class="font-body-md text-on-surface-variant text-sm mt-1">Covers: ${escapeHtml(application.service_regions || "Areas pending")}</p>
              </div>
              <span class="rounded-full bg-primary-container/10 px-3 py-1 text-primary font-label-sm">${escapeHtml(formatStatus(application.status || "new"))}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2 text-sm text-on-surface-variant">
              ${renderReceiverCoverageChips(coverageLabels)}
            </div>
            <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
              <span><strong class="${scoreTone}">${escapeHtml(score)}%</strong><br/><small class="text-on-surface-variant">Provenance</small></span>
              <span><strong class="text-on-surface">${escapeHtml(formatStatus(application.identity_verification_status || "not_started"))}</strong><br/><small class="text-on-surface-variant">ID status</small></span>
              <span><strong class="text-on-surface">${escapeHtml(assignedCount)}</strong><br/><small class="text-on-surface-variant">Assigned</small></span>
            </div>
            <p class="font-body-md text-on-surface-variant text-sm mt-4">Next: complete provider verification, keep proof consent current, and let Swadakta match only lawful routes your coverage supports.</p>
          </article>`;
      })
      .join("");
  }

  function setMarketplaceOfferStatus(message, tone = "") {
    if (!marketplaceOfferStatus) return;
    marketplaceOfferStatus.textContent = message;
    marketplaceOfferStatus.className = `font-label-md text-label-md min-h-6 ${tone || "text-on-surface-variant"}`.trim();
  }

  function marketplaceRouteLabel(job = {}) {
    return [job.origin_country, job.destination_country].filter(Boolean).join(" to ") || "Route pending";
  }

  function marketplaceJobTitle(job = {}) {
    const packageLabel = formatStatus(job.service_package || job.task_type || "job");
    const place = job.task_location || job.kenya_location || job.destination_country || "location pending";
    return `${packageLabel} / ${place}`;
  }

  function marketplaceJobTone(job = {}) {
    const risk = String(job.compliance_risk_level || "standard").toLowerCase();
    if (risk === "medium") return "bg-amber-50 text-amber-700";
    return "bg-primary-container/10 text-primary";
  }

  function renderMarketplaceJobs(jobs = []) {
    if (!marketplaceJobList) return;

    if (marketplaceOfferRequest) {
      const selected = marketplaceOfferRequest.value;
      marketplaceOfferRequest.innerHTML = [
        '<option value="">Choose an open job</option>',
        ...jobs.map(
          (job) =>
            `<option value="${escapeHtml(job.request_code)}" data-currency="${escapeHtml(job.quote_currency || "AUD")}">${escapeHtml(job.request_code)} - ${escapeHtml(marketplaceJobTitle(job))}</option>`,
        ),
      ].join("");
      if (selected && jobs.some((job) => job.request_code === selected)) {
        marketplaceOfferRequest.value = selected;
      }
    }

    if (!jobs.length) {
      marketplaceJobList.innerHTML = `
        <article class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4">
          <p class="font-label-md text-on-surface">No open marketplace jobs yet</p>
          <p class="font-body-md text-on-surface-variant text-sm mt-1">Open jobs appear after client briefs pass basic route, payment, and safety checks. Save your receiver profile so Swadakta can match you when work opens.</p>
        </article>`;
      return;
    }

    marketplaceJobList.innerHTML = jobs
      .map((job) => {
        const proof = Array.isArray(job.proof_requirements) && job.proof_requirements.length
          ? job.proof_requirements.slice(0, 4).join(", ")
          : "Proof plan required";
        const quote = Number(job.quote_amount || 0)
          ? formatMoney(job.quote_amount, job.quote_currency || "AUD")
          : formatStatus(job.budget_range || "quote first");
        return `
          <article class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <strong class="font-label-md text-on-surface">${escapeHtml(job.request_code || "Open job")}</strong>
                  <span class="rounded-full px-3 py-1 font-label-sm ${marketplaceJobTone(job)}">${escapeHtml(formatStatus(job.compliance_risk_level || "standard"))}</span>
                  <span class="rounded-full bg-white px-3 py-1 font-label-sm text-on-surface-variant">${escapeHtml(job.offer_count || 0)} offer${Number(job.offer_count || 0) === 1 ? "" : "s"}</span>
                </div>
                <p class="font-body-md text-on-surface text-sm mt-2">${escapeHtml(marketplaceJobTitle(job))}</p>
                <p class="font-body-md text-on-surface-variant text-sm mt-1">${escapeHtml(marketplaceRouteLabel(job))} / due ${escapeHtml(formatShortDate(job.deadline))}</p>
                <p class="font-body-md text-on-surface-variant text-sm mt-2">Proof: ${escapeHtml(proof)}</p>
              </div>
              <div class="grid gap-2 md:min-w-[12rem]">
                <span class="rounded-2xl bg-white/72 p-3 text-sm"><strong class="block text-on-surface">Guide price</strong>${escapeHtml(quote)}</span>
                <button class="marketplace-offer-prefill inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 font-label-md text-sm font-bold text-white" data-marketplace-request="${escapeHtml(job.request_code)}" data-marketplace-currency="${escapeHtml(job.quote_currency || "AUD")}" type="button">Make offer</button>
              </div>
            </div>
          </article>`;
      })
      .join("");
  }

  function renderMyJobOffers(offers = []) {
    if (!myJobOffersList) return;

    if (!offers.length) {
      myJobOffersList.innerHTML = `<div class="rounded-2xl bg-white/66 p-4 text-sm text-on-surface-variant">Your offers will appear here after you submit them. Compete on clarity, proof, timing, and trust, not just a low price.</div>`;
      return;
    }

    myJobOffersList.innerHTML = offers
      .map((offer) => {
        const flags = Array.isArray(offer.safety_flags) ? offer.safety_flags : [];
        const statusTone =
          offer.status === "accepted"
            ? "bg-emerald-50 text-emerald-700"
            : flags.length
              ? "bg-amber-50 text-amber-700"
              : "bg-primary-container/10 text-primary";
        return `
          <article class="rounded-2xl border border-outline-variant/30 bg-white/68 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong class="font-label-md text-on-surface">${escapeHtml(offer.offer_code || "Offer")}</strong>
                <p class="font-body-md text-on-surface-variant text-sm mt-1">${escapeHtml(offer.request_code || "Job")} / ${escapeHtml(formatMoney(offer.amount, offer.currency || "AUD"))} / ${escapeHtml(offer.timeline_days || 1)} day${Number(offer.timeline_days || 1) === 1 ? "" : "s"}</p>
              </div>
              <span class="rounded-full px-3 py-1 font-label-sm ${statusTone}">${escapeHtml(formatStatus(offer.status || "submitted"))}</span>
            </div>
            <p class="font-body-md text-on-surface-variant text-sm mt-3">${escapeHtml(offer.proof_plan || "Proof plan pending.")}</p>
            ${
              flags.length
                ? `<p class="font-label-sm text-amber-700 mt-3">Blocked before acceptance: ${escapeHtml(flags.map(formatStatus).join(", "))}</p>`
                : `<p class="font-label-sm text-primary mt-3">Eligible for review. Assignment and payout remain protected.</p>`
            }
          </article>`;
      })
      .join("");
  }

  async function refreshMarketplace() {
    const [jobsResult, offersResult] = await Promise.allSettled([
      window.SwadaktaData.listMarketplaceJobs(),
      window.SwadaktaData.listMyJobOffers(),
    ]);

    const jobs = jobsResult.status === "fulfilled" ? jobsResult.value.data || [] : [];
    const offers = offersResult.status === "fulfilled" ? offersResult.value.data || [] : [];
    renderMarketplaceJobs(jobs);
    renderMyJobOffers(offers);

    if (jobsResult.status === "rejected") {
      if (marketplaceJobList) {
        marketplaceJobList.innerHTML = `<article class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4 text-sm text-on-surface-variant">${escapeHtml(jobsResult.reason?.message || "Could not load open jobs.")}</article>`;
      }
    }
    if (offersResult.status === "rejected") {
      renderMyJobOffers([]);
      setMarketplaceOfferStatus(offersResult.reason?.message || "Could not load your offers yet.", "text-on-surface-variant");
    }
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
    const params = new URLSearchParams(window.location.search);
    return params.get("view") === "work" ? "work" : "home";
  }

  function openSignedInDestination() {
    if (signedInDestination() === "work") {
      openAccountWorkspace();
    } else {
      openAccountHome();
    }
  }

  function handOffToAccountHome(email, profile = {}, renderVersion = nextAccountRenderVersion()) {
    rememberAccountHome(email);
    showContinueHomeButton(true, email);
    setSignedInShell(email, profile);
    openAccountHome();
    setStatus("Signed in. Opening your account home.", "text-primary");

    window.setTimeout(() => {
      showCurrentAccount({
        autoOpen: true,
        fallbackEmail: email,
        renderVersion,
      }).catch(() => {
        setVerificationEnabled(true);
        setVerificationStatus(
          "Account is open. Profile details can finish loading in the background.",
          "text-primary",
        );
      });
    }, 0);
  }

  function renderAccountHome(profile = {}, { email = "" } = {}) {
    if (!accountHome) return;
    const displayEmail = email || profile.email || signedInEmail || "your account";
    const verified = profile.identity_verification_status === "verified";

    if (accountHomeEmail) accountHomeEmail.textContent = displayEmail;
    renderAccountHomeVerification(profile, []);
    renderAccountSetupChecklist(profile);
    renderAccountHomeDashboard(profile);
    renderAccountHomeAutopilot(profile);

    if (accountHomeNextCopy) {
      accountHomeNextCopy.textContent = verified
        ? "You can post eligible paid jobs and receive paid work where your profile fits."
        : "Your account is open. Verify ID before posting paid jobs, receiving work, or handling sensitive tasks.";
    }
  }

  async function refreshAccountHome(profile = {}) {
    if (!accountHome) return;
    renderAccountHome(profile);

    const [requestsResult, jobsResult, verificationResult, applicationsResult] = await Promise.allSettled([
      window.SwadaktaData.listMyRequests(),
      window.SwadaktaData.listMyAssignedJobs(),
      window.SwadaktaData.listMyIdentityVerificationRequests(),
      window.SwadaktaData.listMyPartnerApplications(),
      refreshMarketplace(),
    ]);

    const requests = requestsResult.status === "fulfilled" ? requestsResult.value.data || [] : [];
    const jobs = jobsResult.status === "fulfilled" ? jobsResult.value.data || [] : [];
    const verifications = verificationResult.status === "fulfilled" ? verificationResult.value.data || [] : [];
    const applications = applicationsResult.status === "fulfilled" ? applicationsResult.value.data || [] : [];

    if (accountHomeRequestCount) accountHomeRequestCount.textContent = String(requests.length);
    if (accountHomeRequestCopy) {
      accountHomeRequestCopy.textContent = requests.length
        ? "Open tracking to view proof, payments, and milestone progress."
        : "Start by choosing a corridor and creating your first paid brief.";
    }
    if (accountHomeJobCount) accountHomeJobCount.textContent = String(jobs.length);
    if (accountHomeJobCopy) {
      accountHomeJobCopy.textContent = jobs.length
        ? "Open your assigned jobs from the work side and submit proof updates."
        : "Verify ID and set coverage before accepting paid work.";
    }
    if (accountHomeVerificationCount) accountHomeVerificationCount.textContent = String(verifications.length);
    renderAccountHomeVerification(profile, verifications);
    renderAccountSetupChecklist(profile, { requests, jobs, verifications, applications });
    renderAccountHomeDashboard(profile, { requests, jobs, verifications, applications });
    renderAccountHomeAutopilot(profile, { requests, jobs, verifications, applications });
    if (accountHomeNextCopy) {
      const latestRequest = latestVerificationRequest(verifications);
      const verified = accountIsVerified(profile, latestRequest);
      accountHomeNextCopy.textContent = verified
        ? "ID is approved. Payment, proof, corridor rules, and receiver vetting still apply per job."
        : latestRequest?.provider_link
          ? "Open the provider check to finish ID, document, and selfie/liveness steps."
          : latestRequest
            ? "Verification is queued. Watch for the provider link or provider result before paid actions unlock."
            : "Create your account profile, then request verification when you are ready to transact.";
    }
    renderReceiverApplications(applications, jobs);
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

  async function showCurrentAccount({ autoOpen = false, fallbackEmail = "", renderVersion = nextAccountRenderVersion() } = {}) {
    let email = "";
    try {
      if (shouldOpenRememberedAccountHome()) {
        const rememberedEmail = rememberedAccountHomeEmail();
        if (rememberedEmail) {
          setSignedInShell(rememberedEmail, {});
          openAccountHome();
        }
      }

      const sessionResult = await window.SwadaktaData.getSession();
      email = sessionResult.session?.user?.email || "";
      if (!isCurrentAccountRender(renderVersion)) {
        return;
      }
      if (!email) {
        if (fallbackEmail) {
          setSignedInShell(fallbackEmail, {});
          if (autoOpen || window.location.hash === "#work" || window.location.hash === "#home") {
            openSignedInDestination();
          }
          setVerificationEnabled(true);
          setVerificationPill("Account open", "bg-primary-container/10 text-primary");
          setVerificationStatus("Account is open. Reload if profile details do not appear immediately.", "text-primary");
          return;
        }
        if (shouldOpenRememberedAccountHome()) {
          const rememberedEmail = rememberedAccountHomeEmail();
          if (rememberedEmail) {
            setSignedInShell(rememberedEmail, {});
            openAccountHome();
            setVerificationEnabled(true);
            setVerificationPill("Account opening", "bg-primary-container/10 text-primary");
            setVerificationStatus("Account home is open while the secure session finishes loading.", "text-primary");
            return;
          }
        }
        setSignedOutShell();
        await refreshVerificationWorkspace(null);
        return;
      }

      showContinueHomeButton(true, email);
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
            <p class="font-label-sm text-secondary mt-2">Mode: ${(profile.account_role || roleIntent()).replaceAll("_", " ")}. Verification is required only before paid posting, paid work, or sensitive/high-value tasks.</p>
          </div>
        </div>`;
      if (nextActions) nextActions.hidden = false;
      populateVerificationProfile(profile);
      populateReceiverApplication(profile);
      await Promise.allSettled([refreshAccountHome(profile), refreshVerificationWorkspace(profile)]);
      if (!isCurrentAccountRender(renderVersion)) {
        return;
      }
      if (autoOpen || window.location.hash === "#work" || window.location.hash === "#home") {
        openSignedInDestination();
      }
    } catch (error) {
      const displayEmail = email || fallbackEmail || rememberedAccountHomeEmail();
      if (displayEmail && isCurrentAccountRender(renderVersion)) {
        setSignedInShell(displayEmail, {});
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
    const submitRenderVersion = nextAccountRenderVersion();

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
        const signInResult = await window.SwadaktaData.signInWithPassword(email, password);
        const signedInUserEmail = signInResult.user?.email || signInResult.session?.user?.email || email;
        signedInEmail = signedInUserEmail;
        rememberAccountHome(signedInUserEmail);
        const signedInRenderVersion = nextAccountRenderVersion();
        handOffToAccountHome(signedInUserEmail, { account_role: accountRole }, signedInRenderVersion);
        window.SwadaktaData.saveAccountProfile({
          email: signedInUserEmail,
          account_role: accountRole,
          onboarding_status: "started",
        }).catch(() => {});
        setStatus("Signed in. Taking you to your account home now.", "text-primary");
        forceAccountHomeRoute(signedInUserEmail);
        window.setTimeout(() => redirectToAccountHome(signedInUserEmail), 650);
        return;
      }
      if (shouldOpenWorkspace) {
        const createdRenderVersion = nextAccountRenderVersion();
        setSignedInShell(email, { account_role: accountRole });
        openAccountHome();
        await showCurrentAccount({
          autoOpen: true,
          fallbackEmail: email,
          renderVersion: createdRenderVersion,
        });
        return;
      }
      await showCurrentAccount({
        autoOpen: shouldOpenWorkspace,
        fallbackEmail: shouldOpenWorkspace ? email : "",
        renderVersion: submitRenderVersion,
      });
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
          const requestResult = await window.SwadaktaData.requestAccountIdentityVerification({
            reason: field("#account-verification-reason")?.value || "account_required",
            provider: safeProvider(field("#account-verification-provider")?.value, "sumsub"),
            user_notes: field("#account-verification-notes")?.value || "",
          });
          try {
            const request = requestResult.data || {};
            const handoff = await window.SwadaktaData.startIdentityVerificationSession({
              request_id: request.id,
              request_code: request.request_code,
              reason: request.reason || field("#account-verification-reason")?.value || "account_required",
              provider: safeProvider(request.provider || field("#account-verification-provider")?.value, "sumsub"),
            });
            setVerificationStatus(
              handoff.data?.provider_link
                ? "Verification link is ready. Open the provider check and complete the ID steps; paid actions unlock only after provider evidence is verified."
                : handoff.data?.message ||
                    "Verification request saved. Your account stays open while the provider route prepares; paid posting and receiver work unlock only after provider evidence is verified.",
              "text-primary",
            );
          } catch (handoffError) {
            setVerificationStatus(
              `Verification request saved. Provider handoff needs setup or a retry: ${handoffError.message || "try again shortly."}`,
              "text-primary",
            );
          }
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

  if (continueHomeButton) {
    continueHomeButton.addEventListener("click", () => {
      const email = signedInEmail || continueHomeButton.dataset.email || field("#client-login-email")?.value.trim() || "";
      const renderVersion = nextAccountRenderVersion();
      setSignedInShell(email, { account_role: roleIntent() });
      openAccountHome();
      showCurrentAccount({
        autoOpen: true,
        fallbackEmail: email,
        renderVersion,
      }).catch(() => {
        setVerificationStatus("Account home is open. Profile details can finish loading in the background.", "text-primary");
      });
    });
  }

  if (receiverProfileForm) {
    receiverProfileForm.addEventListener("submit", saveReceiverProfileSetup);
    receiverProfileForm.querySelectorAll("input, textarea").forEach((input) => {
      if (input.type !== "file") input.addEventListener("input", () => renderReceiverProfileSetup({}));
    });
    fillReceiverProfileSetup({});
  }

  receiverProfilePhotoInput?.addEventListener("change", () => {
    handleReceiverProfilePhoto(receiverProfilePhotoInput.files?.[0]);
  });

  receiverProofSampleInput?.addEventListener("change", () => {
    handleReceiverProofSample(receiverProofSampleInput.files?.[0]);
  });

  if (receiverApplicationForm) {
    receiverApplicationForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = receiverApplicationPayload();

      if (!signedInEmail) {
        setReceiverApplicationStatus("Sign in before applying for receiver work.", "text-error");
        return;
      }
      if (!payload.service_categories.length) {
        setReceiverApplicationStatus("Choose at least one work category.", "text-error");
        return;
      }
      if (!payload.coverage_scopes.length) {
        setReceiverApplicationStatus("Choose at least one coverage scope so the system can match the right route.", "text-error");
        return;
      }
      if (!payload.id_verification_consent || !payload.proof_standard_consent) {
        setReceiverApplicationStatus("Accept ID verification and proof standards before applying.", "text-error");
        return;
      }

      const button = receiverApplicationForm.querySelector('button[type="submit"]');
      const original = button?.textContent || "";
      if (button) {
        button.disabled = true;
        button.textContent = "Submitting...";
      }
      setReceiverApplicationStatus("Submitting receiver application...");

      try {
        await window.SwadaktaData.saveAccountProfile({
          account_role: "both",
          full_name: payload.full_name,
          whatsapp: payload.whatsapp,
          country: payload.kenya_base,
          kenya_base: payload.kenya_base,
          profile_notes: payload.notes,
          onboarding_status: "needs_review",
        }).catch(() => {});
        const result = await window.SwadaktaData.createPartnerApplication(payload);
        setReceiverApplicationStatus(
          `Receiver application ${result.data?.partner_code || ""} saved. Complete verification before paid jobs can be assigned.`,
          "text-primary",
        );
        const [applicationsResult, jobsResult] = await Promise.allSettled([
          window.SwadaktaData.listMyPartnerApplications(),
          window.SwadaktaData.listMyAssignedJobs(),
        ]);
        renderReceiverApplications(
          applicationsResult.status === "fulfilled" ? applicationsResult.value.data || [] : [result.data],
          jobsResult.status === "fulfilled" ? jobsResult.value.data || [] : [],
        );
      } catch (error) {
        setReceiverApplicationStatus(error.message || "Could not save receiver application.", "text-error");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = original;
        }
      }
    });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".marketplace-offer-prefill");
    if (!button || !marketplaceOfferForm) return;
    const requestCode = button.dataset.marketplaceRequest || "";
    if (marketplaceOfferRequest) marketplaceOfferRequest.value = requestCode;
    if (marketplaceOfferCurrency && button.dataset.marketplaceCurrency) {
      marketplaceOfferCurrency.value = button.dataset.marketplaceCurrency;
    }
    setMarketplaceOfferStatus(`Offer form ready for ${requestCode}. Add your price, timing, and proof plan.`, "text-primary");
    marketplaceOfferForm.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => marketplaceOfferAmount?.focus({ preventScroll: true }), 300);
  });

  marketplaceOfferRequest?.addEventListener("change", () => {
    const option = marketplaceOfferRequest.selectedOptions[0];
    const currency = option?.dataset.currency || "";
    if (currency && marketplaceOfferCurrency) marketplaceOfferCurrency.value = currency;
  });

  marketplaceOfferForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const requestCode = marketplaceOfferRequest?.value || "";
    const button = marketplaceOfferForm.querySelector('button[type="submit"]');
    const original = button?.innerHTML || "";

    if (!signedInEmail) {
      setMarketplaceOfferStatus("Sign in and save a job seeker profile before making an offer.", "text-error");
      return;
    }

    if (button) {
      button.disabled = true;
      button.innerHTML = "Submitting offer...";
    }
    setMarketplaceOfferStatus("Submitting offer. Swadakta will still check verification, route fit, and payment protection.");

    try {
      const result = await window.SwadaktaData.submitJobOffer(requestCode, {
        amount: marketplaceOfferAmount?.value || 0,
        currency: marketplaceOfferCurrency?.value || "AUD",
        timeline_days: marketplaceOfferTimeline?.value || 3,
        proof_plan: marketplaceOfferProofPlan?.value || "",
        message: marketplaceOfferMessage?.value || "",
      });
      setMarketplaceOfferStatus(
        `Offer ${result.data?.offer_code || ""} submitted. Lowest price does not automatically win; proof quality and trust still matter.`,
        "text-primary",
      );
      if (marketplaceOfferProofPlan) marketplaceOfferProofPlan.value = "";
      if (marketplaceOfferMessage) marketplaceOfferMessage.value = "";
      await refreshMarketplace();
    } catch (error) {
      setMarketplaceOfferStatus(error.message || "Could not submit this offer.", "text-error");
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = original;
      }
    }
  });

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
    signOutRequested = true;
    accountHomeForceToken += 1;
    nextAccountRenderVersion();
    try {
      await window.SwadaktaData.signOut();
      signedInEmail = "";
      clearRememberedAccountHome();
      if (profileCard) profileCard.hidden = true;
      if (nextActions) nextActions.hidden = true;
      setSignedOutShell();
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setStatus("Signed out.", "text-primary");
      await refreshVerificationWorkspace(null);
    } catch (error) {
      setStatus(error.message || "Could not sign out.", "text-error");
    } finally {
      signOutRequested = false;
      if (button) button.disabled = false;
    }
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", () => signOutCurrentAccount(signOutButton));
  }

  if (accountHomeSignOutButton) {
    accountHomeSignOutButton.addEventListener("click", () => signOutCurrentAccount(accountHomeSignOutButton));
  }

  document.addEventListener("click", handleAccountHomeAnchorClick);
  window.addEventListener("hashchange", () => {
    scrollAccountHomeAnchor(window.location.hash, {
      updateHash: false,
      instant: true,
      delay: 0,
    });
  });

  renderPaymentReturnPanel();
  normalizePortalHomeHash();
  updateMode();
  setVerificationEnabled(false);
  setAccountState("checking");
  if (window.SwadaktaData.onAuthStateChange) {
    window.SwadaktaData.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (!signOutRequested && signedInEmail) {
          return;
        }
        nextAccountRenderVersion();
        signedInEmail = "";
        setSignedOutShell();
        return;
      }

      if (session?.user?.email) {
        const authRenderVersion = nextAccountRenderVersion();
        showContinueHomeButton(true, session.user.email);
        setSignedInShell(session.user.email, {});
        openAccountHome();
        showCurrentAccount({
          autoOpen: true,
          fallbackEmail: session.user.email,
          renderVersion: authRenderVersion,
        }).catch(() => {});
      }
    }).catch(() => {});
  }
  showCurrentAccount({ autoOpen: true });
  [1200, 3600].forEach((delay) => {
    window.setTimeout(() => {
      if (document.body.classList.contains("is-account-signed-in")) {
        refreshMarketplace().catch(() => {});
      }
    }, delay);
  });
  [900, 2400].forEach((delay) => window.setTimeout(recoverAccountHomeFromSession, delay));
})();
