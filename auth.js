(function () {
  const statusCard = document.querySelector("#auth-status-card");
  const message = document.querySelector("#auth-message");
  const continueLink = document.querySelector("#auth-continue");
  const passwordResetForm = document.querySelector("#password-reset-form");
  const passwordResetStatus = document.querySelector("#password-reset-status");
  let authCodeHandled = false;

  function safeNextPath() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("next") || "/portal.html#home";

    try {
      const target = new URL(raw, window.location.origin);
      if (target.origin !== window.location.origin) {
        return "/portal.html#home";
      }
      const allowedPaths = new Set([
        "/",
        "/index.html",
        "/portal",
        "/portal.html",
        "/assistant",
        "/assistant.html",
        "/corridor",
        "/corridor.html",
        "/messages",
        "/messages.html",
        "/notifications",
        "/notifications.html",
        "/verification",
        "/verification.html",
        "/brief",
        "/brief.html",
        "/tracking",
        "/tracking.html",
        "/admin",
        "/admin.html",
        "/admin-ops",
        "/admin-ops.html",
        "/admin-readiness",
        "/admin-readiness.html",
        "/admin-verification",
        "/admin-verification.html",
      ]);
      if (!allowedPaths.has(target.pathname)) {
        return "/portal.html#home";
      }
      if (target.pathname === "/portal") {
        target.pathname = "/portal.html";
      }
      if ((target.pathname === "/portal" || target.pathname === "/portal.html") && !target.hash) {
        target.hash = "home";
      }
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return "/portal.html#home";
    }
  }

  function setStatus(title, detail, tone = "") {
    statusCard.className = `auth-status-card ${tone}`.trim();
    statusCard.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
  }

  function isPasswordRecovery() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    return hash.get("type") === "recovery" || query.get("type") === "recovery";
  }

  function authCode() {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return query.get("code") || hash.get("code") || "";
  }

  function clearAuthCodeFromUrl() {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("code");
    nextUrl.searchParams.delete("state");
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    hash.delete("code");
    hash.delete("state");
    const cleanHash = hash.toString();
    nextUrl.hash = cleanHash ? `#${cleanHash}` : "";
    window.history.replaceState(null, "", nextUrl);
  }

  async function ensureAuthCodeSession() {
    const code = authCode();
    if (!code || authCodeHandled || !window.SwadaktaData.exchangeAuthCodeForSession) {
      return null;
    }

    authCodeHandled = true;
    setStatus("Confirming secure link", "Creating your browser session now.", "is-success");
    const exchanged = await window.SwadaktaData.exchangeAuthCodeForSession(code);
    clearAuthCodeFromUrl();
    return exchanged.session || null;
  }

  async function checkSession(attempt = 1) {
    const nextPath = safeNextPath();
    const nextUrl = new URL(nextPath, window.location.origin).href;
    continueLink.href = nextUrl;

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const error = hash.get("error_description") || hash.get("error") || "";
    if (error) {
      setStatus("Sign-in failed", error, "is-error");
      message.textContent = "Return to the account page and try signing in again.";
      return;
    }

    try {
      let exchangedSession = null;
      try {
        exchangedSession = await ensureAuthCodeSession();
      } catch (codeError) {
        const existing = await window.SwadaktaData.getSession().catch(() => ({ session: null }));
        if (!existing.session?.user?.email) {
          throw codeError;
        }
        exchangedSession = existing.session;
        clearAuthCodeFromUrl();
      }
      const result = await window.SwadaktaData.getSession();
      const email = result.session?.user?.email || exchangedSession?.user?.email || "";

      if (email) {
        if (isPasswordRecovery() && passwordResetForm) {
          passwordResetForm.hidden = false;
          setStatus("Set a new password", `Account confirmed for ${email}. Choose a new password to continue.`, "is-success");
          message.textContent = "Create a password you can remember. It must be at least 8 characters.";
          return;
        }

        setStatus("Signed in", `Account confirmed for ${email}. Continuing now.`, "is-success");
        message.textContent = "You can now continue to the selected Swadakta workspace.";
        window.setTimeout(() => {
          window.location.replace(nextUrl);
        }, 900);
        return;
      }

      if (attempt < 3) {
        window.setTimeout(() => checkSession(attempt + 1), 700);
        return;
      }

      setStatus("No active session found", "Open the latest Swadakta confirmation email in this browser, or sign in again.", "is-warning");
      message.textContent = "If you started from a local preview, the confirmation should still open swadakta.com instead of localhost.";
    } catch (sessionError) {
      setStatus("Could not check the session", sessionError.message || "Try signing in again.", "is-error");
      message.textContent = "The safest next step is to return to the account page and sign in again.";
    }
  }

  if (passwordResetForm) {
    passwordResetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = document.querySelector("#new-password").value;
      passwordResetStatus.textContent = "Saving password...";

      try {
        await window.SwadaktaData.updateAccountPassword(password);
        passwordResetStatus.textContent = "Password updated. Continuing...";
        window.setTimeout(() => {
          window.location.replace(continueLink.href);
        }, 900);
      } catch (error) {
        passwordResetStatus.textContent = error.message || "Could not update password.";
      }
    });
  }

  checkSession();
})();
