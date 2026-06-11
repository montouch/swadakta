(function () {
  const statusCard = document.querySelector("#auth-status-card");
  const message = document.querySelector("#auth-message");
  const continueLink = document.querySelector("#auth-continue");
  const passwordResetForm = document.querySelector("#password-reset-form");
  const passwordResetStatus = document.querySelector("#password-reset-status");

  function safeNextPath() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("next") || "/portal";

    try {
      const target = new URL(raw, window.location.origin);
      if (target.origin !== window.location.origin) {
        return "/portal";
      }
      const allowedPaths = new Set([
        "/",
        "/index.html",
        "/portal",
        "/portal.html",
        "/verification",
        "/verification.html",
        "/brief",
        "/brief.html",
        "/tracking",
        "/tracking.html",
        "/admin",
        "/admin.html",
        "/admin-verification",
        "/admin-verification.html",
      ]);
      if (!allowedPaths.has(target.pathname)) {
        return "/portal";
      }
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return "/portal";
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
      const result = await window.SwadaktaData.getSession();
      const email = result.session?.user?.email || "";

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
