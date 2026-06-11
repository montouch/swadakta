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

  if (!form || !window.SwadaktaData) return;

  function authMode() {
    return form.querySelector('input[name="account-auth-mode"]:checked')?.value || "sign_in";
  }

  function roleIntent() {
    return form.querySelector('input[name="accountRole"]:checked')?.value || "client";
  }

  function accountRedirect() {
    const hash = roleIntent() === "receiver" ? "#work" : "";
    return new URL(`portal.html${hash}`, window.location.href).href;
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
    submit.firstChild.textContent = creating ? "Create account " : "Sign in ";
  }

  async function showCurrentAccount() {
    try {
      const sessionResult = await window.SwadaktaData.getSession();
      const email = sessionResult.session?.user?.email || "";
      const profileResult = await window.SwadaktaData.getAccountProfile();
      const profile = profileResult.data || {};
      if (!email && !profile.email) return;

      profileCard.hidden = false;
      profileCard.className = "mt-8 glass-panel p-6 rounded-3xl";
      profileCard.innerHTML = `
        <div class="flex items-start gap-4">
          <span class="material-symbols-outlined text-primary text-4xl">verified_user</span>
          <div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface">Account ready</h2>
            <p class="font-body-md text-on-surface-variant">${email || profile.email}</p>
            <p class="font-label-sm text-secondary mt-2">Mode: ${(profile.account_role || roleIntent()).replaceAll("_", " ")}. ID verification is required before paid or sensitive work.</p>
          </div>
        </div>`;
      if (nextActions) nextActions.hidden = false;
    } catch {
      // The account card is only a convenience; auth errors are shown on submit.
    }
  }

  form.addEventListener("change", updateMode);

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
      if (creating) {
        result = await window.SwadaktaData.signUpAccount(email, password, accountRedirect());
        if (!result.needsConfirmation) {
          await window.SwadaktaData.saveAccountProfile({
            email,
            account_role: accountRole,
            backup_phone: backupPhone,
            whatsapp: backupPhone,
            onboarding_status: "account_created",
            identity_verification_status: "not_started",
          });
        }
        setStatus(
          result.needsConfirmation
            ? "Account created. Check your email, then return here to sign in."
            : "Account created and ready.",
          "text-primary",
        );
      } else {
        await window.SwadaktaData.signInWithPassword(email, password);
        await window.SwadaktaData.saveAccountProfile({
          email,
          account_role: accountRole,
          onboarding_status: "signed_in",
        });
        setStatus("Signed in. Your Swadakta account is ready.", "text-primary");
      }
      await showCurrentAccount();
    } catch (error) {
      setStatus(error.message || "Account action failed.", "text-error");
    } finally {
      submit.disabled = false;
      updateMode();
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

  updateMode();
  showCurrentAccount();
})();
