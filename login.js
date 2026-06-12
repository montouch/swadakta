(function () {
  const form = document.querySelector("#swadakta-login-form");
  const emailInput = document.querySelector("#login-email");
  const passwordInput = document.querySelector("#login-password");
  const phoneInput = document.querySelector("#login-phone");
  const status = document.querySelector("#login-status");
  const submit = document.querySelector("#login-submit");
  const signInModeButton = document.querySelector("#login-mode-signin");
  const createModeButton = document.querySelector("#login-mode-create");
  const createInlineButton = document.querySelector("#login-create-inline");
  const googleButton = document.querySelector("#login-google");
  const resetButton = document.querySelector("#login-reset");
  const createOnlyFields = document.querySelectorAll("[data-login-create-only]");
  let mode = "signin";

  if (!form || !window.SwadaktaData) return;

  function safeNextPath() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("next") || "/portal.html#home";

    try {
      const target = new URL(raw, window.location.origin);
      const allowedPaths = new Set([
        "/",
        "/index.html",
        "/portal",
        "/portal.html",
        "/brief",
        "/brief.html",
        "/tracking",
        "/tracking.html",
        "/messages",
        "/messages.html",
        "/notifications",
        "/notifications.html",
        "/verification",
        "/verification.html",
        "/payments",
        "/payments.html",
        "/assistant",
        "/assistant.html",
      ]);

      if (target.origin !== window.location.origin || !allowedPaths.has(target.pathname)) {
        return "/portal.html#home";
      }

      if (target.pathname === "/portal") {
        target.pathname = "/portal.html";
      }
      if ((target.pathname === "/portal.html" || target.pathname === "/portal") && !target.hash) {
        target.hash = "home";
      }

      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return "/portal.html#home";
    }
  }

  function redirectUrl() {
    return new URL(safeNextPath(), window.location.origin).href;
  }

  function setStatus(message, tone = "neutral") {
    status.textContent = message || "";
    status.classList.remove("text-error", "text-primary", "text-on-surface-variant");
    status.classList.add(tone === "error" ? "text-error" : tone === "success" ? "text-primary" : "text-on-surface-variant");
  }

  function selectedRole() {
    return document.querySelector('input[name="account_type"]:checked')?.value || "both";
  }

  function rememberIntent() {
    const role = selectedRole();
    const phone = String(phoneInput?.value || "").trim();
    window.localStorage.setItem("swadakta_preferred_account_role", role);
    if (phone) {
      window.localStorage.setItem("swadakta_pending_backup_phone", phone);
    }
  }

  function renderSubmitLabel() {
    submit.textContent = mode === "create" ? "Create Account" : "Sign In";
  }

  function setMode(nextMode) {
    mode = nextMode === "create" ? "create" : "signin";
    document.body.dataset.loginMode = mode;
    createOnlyFields.forEach((field) => {
      field.hidden = mode !== "create";
    });
    if (passwordInput) {
      passwordInput.autocomplete = mode === "create" ? "new-password" : "current-password";
    }
    signInModeButton.className =
      mode === "signin"
        ? "flex-1 py-2 text-label-md font-label-md rounded-lg transition-all-300 bg-white text-primary shadow-sm"
        : "flex-1 py-2 text-label-md font-label-md rounded-lg transition-all-300 text-on-surface-variant hover:text-on-surface";
    createModeButton.className =
      mode === "create"
        ? "flex-1 py-2 text-label-md font-label-md rounded-lg transition-all-300 bg-white text-primary shadow-sm"
        : "flex-1 py-2 text-label-md font-label-md rounded-lg transition-all-300 text-on-surface-variant hover:text-on-surface";
    renderSubmitLabel();
    setStatus(
      mode === "create"
        ? "Create one account. You can give jobs, find jobs, or do both."
        : "Sign in with your Swadakta password.",
    );
  }

  async function continueIfAlreadySignedIn() {
    try {
      const result = await window.SwadaktaData.getSession();
      if (result.session?.user?.email) {
        setStatus("You are already signed in. Opening your account...", "success");
        window.location.replace(redirectUrl());
      }
    } catch {
      setStatus("Sign in or create an account to continue.");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = String(emailInput.value || "").trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password || password.length < 8) {
      setStatus("Enter your email and a password with at least 8 characters.", "error");
      return;
    }

    rememberIntent();
    submit.disabled = true;
    setStatus(mode === "create" ? "Creating your account..." : "Signing you in...");

    try {
      if (mode === "create") {
        const result = await window.SwadaktaData.signUpAccount(email, password, redirectUrl());
        if (result.session?.user?.email || result.mode === "local") {
          setStatus("Account created. Opening your home...", "success");
          window.location.replace(safeNextPath());
          return;
        }
        setStatus("Check your email to confirm the account, then Swadakta will open your home.", "success");
        return;
      }

      await window.SwadaktaData.signInWithPassword(email, password);
      setStatus("Signed in. Opening your account...", "success");
      window.location.replace(safeNextPath());
    } catch (error) {
      const message = error?.message || "Sign-in failed. Check your details and try again.";
      setStatus(message, "error");
    } finally {
      submit.disabled = false;
    }
  });

  signInModeButton.addEventListener("click", () => setMode("signin"));
  createModeButton.addEventListener("click", () => setMode("create"));
  createInlineButton?.addEventListener("click", () => setMode("create"));

  resetButton.addEventListener("click", async () => {
    const email = String(emailInput.value || "").trim().toLowerCase();
    if (!email) {
      setStatus("Enter your email first, then request a reset link.", "error");
      emailInput.focus();
      return;
    }

    resetButton.disabled = true;
    setStatus("Sending password reset...");
    try {
      await window.SwadaktaData.resetAccountPassword(email, redirectUrl());
      setStatus("Password reset sent. Open the email in this browser.", "success");
    } catch (error) {
      setStatus(error?.message || "Could not send reset email.", "error");
    } finally {
      resetButton.disabled = false;
    }
  });

  googleButton.addEventListener("click", async () => {
    rememberIntent();
    googleButton.disabled = true;
    setStatus("Opening Google sign-in...");
    try {
      await window.SwadaktaData.signInWithProvider("google", redirectUrl());
    } catch (error) {
      setStatus(error?.message || "Google sign-in is not available yet.", "error");
      googleButton.disabled = false;
    }
  });

  setMode("signin");
  continueIfAlreadySignedIn();
})();
