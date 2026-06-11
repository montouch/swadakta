(function () {
  const form = document.querySelector("#client-brief-form");
  const status = document.querySelector("#brief-status");
  const submitButton = document.querySelector("#brief-submit");
  const gateTitle = document.querySelector("#brief-gate-title");
  const gateCopy = document.querySelector("#brief-gate-copy");
  const corridorSummary = document.querySelector("#brief-corridor-summary");
  const corridorRoute = document.querySelector("#brief-corridor-route");
  const corridorCopy = document.querySelector("#brief-corridor-copy");
  const corridorLocation = document.querySelector("#brief-corridor-location");
  const corridorLogistics = document.querySelector("#brief-corridor-logistics");
  const corridorRisk = document.querySelector("#brief-corridor-risk");
  const corridorChecks = document.querySelector("#brief-corridor-checks");
  const corridorStorageKey = "swadakta_corridor_context";

  if (!form || !window.SwadaktaData) return;

  let accountCanPost = false;
  let corridorContext = {};
  const directionLabels = {
    origin_to_destination: "From client country to work country",
    destination_to_origin: "From work country back to client country",
    two_way: "Both ways",
    local_in_country: "Local work inside one country",
    digital_global: "Digital / virtual only",
  };
  const logisticsLabels = {
    not_needed: "No physical delivery",
    local_delivery: "Local delivery or errand",
    postal_courier: "Post or courier shipment",
    pickup_hold: "Pickup and hold",
    supplier_direct: "Supplier ships directly",
    airport_handoff: "Airport or traveller handoff",
    digital_only: "Digital/documents only",
  };
  const goodsLabels = {
    none: "No physical goods",
    general_goods: "General goods",
    clothing_household: "Clothing or household items",
    electronics: "Electronics or batteries",
    cosmetics: "Cosmetics, perfume, or liquids",
    food_plant_animal: "Food, plant, or animal product",
    medicine_health: "Medicine or health product",
    documents: "Documents or certificates",
    valuable_items: "Valuable items or jewellery",
    restricted_or_unsure: "Restricted or not sure",
  };

  function value(selector) {
    return String(document.querySelector(selector)?.value || "").trim();
  }

  function paymentMethod(raw) {
    const value = raw.toLowerCase();
    if (["card", "paypal", "mpesa", "bank", "discuss"].includes(value)) return value;
    if (value.includes("mobile")) return "mpesa";
    if (value.includes("paypal")) return "paypal";
    if (value.includes("stripe") || value.includes("card")) return "card";
    if (value.includes("bank")) return "bank";
    return "discuss";
  }

  function escrowPreference(raw) {
    const value = raw.toLowerCase();
    if (["quote_first", "deposit_milestones", "regulated_escrow", "not_sure"].includes(value)) return value;
    if (value.includes("50") || value.includes("milestone") || value.includes("custom")) {
      return "deposit_milestones";
    }
    if (value.includes("regulated") || value.includes("escrow")) return "regulated_escrow";
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

  function labelFromMap(map, value, fallback = "Not set") {
    return map[value] || formatStatus(value) || fallback;
  }

  function renderCorridorSummary() {
    if (!corridorSummary) return;
    const origin = corridorContext.origin_country || "";
    const destination = corridorContext.destination_country || "";
    const location = corridorContext.task_location || "";
    const hasContext = Boolean(origin || destination || location);
    corridorSummary.hidden = !hasContext;
    if (!hasContext) return;

    const route = [origin || "Origin not set", destination || "Destination not set"].join(" to ");
    const logistics = labelFromMap(logisticsLabels, corridorContext.logistics_mode, "No physical delivery");
    const goods = labelFromMap(goodsLabels, corridorContext.goods_category, "No physical goods");
    const direction = labelFromMap(directionLabels, corridorContext.service_direction, "Corridor direction not set");
    const risk = formatStatus(corridorContext.compliance_risk_level || "standard");
    const checks = corridorRequiredChecks(corridorContext.goods_category || corridorContext.logistics_mode);

    if (corridorRoute) corridorRoute.textContent = route;
    if (corridorCopy) corridorCopy.textContent = `${direction}. ${goods}.`;
    if (corridorLocation) corridorLocation.textContent = location || destination || "Not set";
    if (corridorLogistics) corridorLogistics.textContent = logistics;
    if (corridorRisk) corridorRisk.textContent = risk;
    if (corridorChecks) {
      corridorChecks.innerHTML = checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("");
    }
  }

  function applyCorridorContext() {
    const params = new URLSearchParams(window.location.search);
    const paramContext = cleanContext({
      origin_country: params.get("origin") || "",
      destination_country: params.get("destination") || "",
      task_location: params.get("location") || "",
      service_direction: params.get("direction") || "",
      logistics_mode: params.get("logistics") || "",
      goods_category: params.get("goods") || "",
      compliance_status: params.get("compliance") || "",
      compliance_risk_level: params.get("risk") || "",
      route_status: params.get("route") || "",
      automation_status: params.get("automation") || "",
      admin_review_required: params.get("review") === "yes",
      admin_review_reason: params.get("review_reason") || "",
      compliance_acknowledged: params.get("ack") === "yes",
      compliance_flags: (params.get("flags") || "").split("|").filter(Boolean),
      required_checks: (params.get("checks") || "").split("|").filter(Boolean),
    }, params.has("ack"));

    try {
      corridorContext = {
        ...JSON.parse(localStorage.getItem(corridorStorageKey) || "{}"),
        ...paramContext,
      };
      setValue("#brief-origin-country", corridorContext.origin_country);
      setValue("#brief-destination-country", corridorContext.destination_country);
      setValue("#brief-location", corridorContext.task_location);
      setValue("#brief-service-type", corridorContext.service_type);
    } catch {
      corridorContext = paramContext;
      localStorage.removeItem(corridorStorageKey);
    }

    setValue("#brief-origin-country", corridorContext.origin_country);
    setValue("#brief-destination-country", corridorContext.destination_country);
    setValue("#brief-location", corridorContext.task_location);
    renderCorridorSummary();
  }

  function cleanContext(context, hasAckParam) {
    return Object.entries(context).reduce((cleaned, [key, value]) => {
      if (Array.isArray(value)) {
        if (value.length) cleaned[key] = value;
        return cleaned;
      }
      if (key === "compliance_acknowledged") {
        if (hasAckParam) cleaned[key] = value;
        return cleaned;
      }
      if (value) cleaned[key] = value;
      return cleaned;
    }, {});
  }

  function uniqueList(values = []) {
    return [...new Set(values.filter(Boolean))];
  }

  function corridorRequiredChecks(items) {
    const checks = Array.isArray(corridorContext.required_checks) ? corridorContext.required_checks : [];
    const fallback = ["ID verification before paid work"];
    if (items || corridorContext.logistics_mode || corridorContext.goods_category) {
      fallback.push("Compliance check before shipping, purchase, pickup, delivery, or restricted goods");
    }
    return uniqueList([...checks, ...fallback]);
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
    const requiredChecks = corridorRequiredChecks(items);
    const complianceFlags = Array.isArray(corridorContext.compliance_flags) ? corridorContext.compliance_flags : [];
    const logisticsMode = corridorContext.logistics_mode || (items ? "postal_courier" : "not_needed");
    const goodsCategory = corridorContext.goods_category || (items ? "general_goods" : "none");

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
        service_direction: corridorContext.service_direction || "origin_to_destination",
        task_location: location,
        kenya_location: location,
        task_type: serviceType(selectedService),
        service_package: "quote_first",
        payment_method_preference: paymentMethod(value("#brief-payment")),
        funds_protection_preference: escrowPreference(value("#brief-escrow")),
        logistics_mode: logisticsMode,
        goods_category: goodsCategory,
        logistics_notes: items,
        notes: [selectedService, proof, corridorContext.notes].filter(Boolean).join("\n\n"),
        proof_requirements: proof ? [proof] : ["Photo/video proof", "Receipt or reference where available"],
        required_checks: requiredChecks,
        compliance_flags: complianceFlags,
        route_status: corridorContext.route_status || "active",
        automation_status:
          corridorContext.automation_status ||
          (corridorContext.route_status === "pilot" ? "admin_review" : corridorContext.route_status === "unsupported" ? "founder_approval" : "ai_triage"),
        admin_review_required: Boolean(corridorContext.admin_review_required),
        admin_review_reason: corridorContext.admin_review_reason || "",
        compliance_status: corridorContext.compliance_status || (complianceFlags.length ? "needs_ai_review" : "not_applicable"),
        compliance_risk_level: corridorContext.compliance_risk_level || "standard",
        compliance_acknowledged: Boolean(document.querySelector("#compliance")?.checked || corridorContext.compliance_acknowledged),
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
