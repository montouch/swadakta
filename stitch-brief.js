(function () {
  const form = document.querySelector("#client-brief-form");
  const status = document.querySelector("#brief-status");
  const submitButton = document.querySelector("#brief-submit");
  const gateTitle = document.querySelector("#brief-gate-title");
  const gateCopy = document.querySelector("#brief-gate-copy");
  const corridorStorageKey = "swadakta_corridor_context";

  if (!form || !window.SwadaktaData) return;

  let accountCanPost = false;

  function value(selector) {
    return String(document.querySelector(selector)?.value || "").trim();
  }

  function paymentMethod(raw) {
    const value = raw.toLowerCase();
    if (value.includes("mobile")) return "mpesa";
    if (value.includes("stripe") || value.includes("card")) return "card";
    if (value.includes("bank")) return "bank";
    if (value.includes("crypto")) return "discuss";
    return "discuss";
  }

  function escrowPreference(raw) {
    const value = raw.toLowerCase();
    if (value.includes("50") || value.includes("milestone") || value.includes("custom")) {
      return "deposit_milestones";
    }
    return "quote_first";
  }

  function serviceType(raw) {
    const value = raw.toLowerCase();
    if (value.includes("delivery") || value.includes("logistics")) return "shopping";
    if (value.includes("verification") || value.includes("inspection")) return "site";
    if (value.includes("research")) return "virtual";
    if (value.includes("legal") || value.includes("compliance")) return "registry";
    return "quick";
  }

  function setStatus(message, tone = "") {
    status.textContent = message;
    status.className = `font-label-md text-label-md min-h-6 ${tone}`.trim();
  }

  function setGate(title, copy, canPost = false) {
    accountCanPost = canPost;
    if (gateTitle) gateTitle.textContent = title;
    if (gateCopy) gateCopy.textContent = copy;
    if (submitButton) submitButton.disabled = !canPost;
  }

  function setValue(selector, value) {
    const node = document.querySelector(selector);
    if (node && value && !node.value) node.value = value;
  }

  function applyCorridorContext() {
    try {
      const context = JSON.parse(localStorage.getItem(corridorStorageKey) || "{}");
      setValue("#brief-origin-country", context.origin_country);
      setValue("#brief-destination-country", context.destination_country);
      setValue("#brief-location", context.task_location);
      setValue("#brief-service-type", context.service_type);
      setValue("#brief-proof", context.notes);
    } catch {
      localStorage.removeItem(corridorStorageKey);
    }

    const params = new URLSearchParams(window.location.search);
    setValue("#brief-origin-country", params.get("origin"));
    setValue("#brief-destination-country", params.get("destination"));
    setValue("#brief-location", params.get("location"));
  }

  async function refreshPostingGate() {
    setGate("Checking account access", "You can draft the brief, but posting paid work requires a signed-in verified account.", false);

    try {
      const sessionResult = await window.SwadaktaData.getSession();
      const email = sessionResult.session?.user?.email || "";
      if (!email) {
        setGate("Account needed before posting", "Create or sign in to your account first. ID verification is not needed to hold an account, but it is required before paid jobs go live.", false);
        return;
      }

      setValue("#brief-email", email);
      const profileResult = await window.SwadaktaData.getAccountProfile();
      const profile = profileResult.data || {};
      setValue("#brief-client-name", profile.full_name);
      setValue("#brief-whatsapp", profile.whatsapp);
      setValue("#brief-client-base", profile.country || profile.kenya_base);

      if (profile.identity_verification_status === "verified") {
        setGate("Verified account ready", "You can submit this paid brief. Swadakta AI will triage compliance, proof, payment, and receiver routing after submission.", true);
        return;
      }

      setGate(
        "Verify before posting paid work",
        `Your account is open, but paid posting is locked until the automated ID provider verifies you. Current status: ${formatStatus(profile.identity_verification_status || "not_started")}.`,
        false,
      );
    } catch (error) {
      setGate("Account check needs attention", "Sign in again or open Verification. The app will not post paid work until verification is confirmed.", false);
    }
  }

  function formatStatus(value) {
    return String(value || "not_started")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!accountCanPost) {
      setStatus("Paid posting is locked until your account verification is complete.", "text-error");
      document.querySelector("#brief-verification-gate")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const button = submitButton || form.querySelector('button[type="submit"]');
    const original = button.innerHTML;
    const now = new Date().toISOString();
    const selectedService = value("#brief-service-type");
    const proof = value("#brief-proof");
    const items = value("#brief-items");
    const location = value("#brief-location");

    button.disabled = true;
    button.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Creating request...';
    setStatus("Creating request...");

    try {
      const payload = {
        client_name: value("#brief-client-name"),
        email: value("#brief-email"),
        whatsapp: value("#brief-whatsapp"),
        client_base: value("#brief-client-base"),
        australia_location: value("#brief-client-base"),
        origin_country: value("#brief-origin-country"),
        destination_country: value("#brief-destination-country"),
        task_location: location,
        kenya_location: location,
        task_type: serviceType(selectedService),
        service_package: "quote_first",
        payment_method_preference: paymentMethod(value("#brief-payment")),
        funds_protection_preference: escrowPreference(value("#brief-escrow")),
        logistics_mode: items ? "postal_courier" : "not_needed",
        goods_category: items ? "general_goods" : "none",
        logistics_notes: items,
        notes: [selectedService, proof].filter(Boolean).join("\n\n"),
        proof_requirements: proof ? [proof] : ["Photo/video proof", "Receipt or reference where available"],
        required_checks: ["ID verification before paid work", "Compliance check before shipping or restricted goods"],
        compliance_acknowledged: document.querySelector("#compliance")?.checked || false,
        identity_verification_required: true,
        identity_verification_consent: true,
        contact_permission: true,
        professional_boundary_accepted: true,
        terms_accepted_at: now,
        privacy_accepted_at: now,
      };

      if (!payload.origin_country || !payload.destination_country || !payload.task_location) {
        throw new Error("Choose a corridor and task location before submitting.");
      }

      const result = await window.SwadaktaData.createRequest(payload);
      const request = result.data;
      let uploadNote = "";
      const files = document.querySelector("#brief-files")?.files;
      if (files?.length) {
        try {
          await window.SwadaktaData.uploadProofFiles(request.request_code, files);
          uploadNote = " Files uploaded.";
        } catch (uploadError) {
          uploadNote = ` Request saved. File upload needs sign-in or smaller files: ${uploadError.message}`;
        }
      }

      const trackingUrl = `tracking.html?code=${encodeURIComponent(request.request_code)}&contact=${encodeURIComponent(payload.email || payload.whatsapp)}`;
      setStatus(`Request ${request.request_code} created.${uploadNote}`, "text-primary");
      button.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Brief submitted';
      window.setTimeout(() => {
        window.location.href = trackingUrl;
      }, 900);
    } catch (error) {
      setStatus(error.message || "Could not create request.", "text-error");
      button.innerHTML = original;
      button.disabled = false;
    }
  });

  applyCorridorContext();
  refreshPostingGate();
})();
