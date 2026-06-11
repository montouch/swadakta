(function () {
  const statusCard = document.querySelector("#auth-status-card");
  const message = document.querySelector("#auth-message");
  const continueLink = document.querySelector("#auth-continue");

  function safeNextPath() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("next") || "/portal";

    try {
      const target = new URL(raw, window.location.origin);
      if (target.origin !== window.location.origin) {
        return "/portal";
      }
      if (!["/", "/index.html", "/portal", "/portal.html", "/admin", "/admin.html"].includes(target.pathname)) {
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

  async function checkSession(attempt = 1) {
    const nextPath = safeNextPath();
    const nextUrl = new URL(nextPath, window.location.origin).href;
    continueLink.href = nextUrl;

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const error = hash.get("error_description") || hash.get("error") || "";
    if (error) {
      setStatus("Sign-in link failed", error, "is-error");
      message.textContent = "Request a fresh magic link from the portal or admin page.";
      return;
    }

    try {
      const result = await window.SwadaktaData.getSession();
      const email = result.session?.user?.email || "";

      if (email) {
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

      setStatus("No active session found", "Open the latest Swadakta email link in this browser, or request a new link.", "is-warning");
      message.textContent = "If you requested the link from a local preview, the email should still open swadakta.com instead of localhost.";
    } catch (sessionError) {
      setStatus("Could not check the session", sessionError.message || "Try requesting a fresh magic link.", "is-error");
      message.textContent = "The safest next step is to return to the portal and request a new link.";
    }
  }

  checkSession();
})();
