(function () {
  const form = document.querySelector("#client-brief-form");
  const status = document.querySelector("#brief-status");
  const submitButton = document.querySelector("#brief-submit");
  const gateTitle = document.querySelector("#brief-gate-title");
  const gateCopy = document.querySelector("#brief-gate-copy");
  const aiOrganizeButton = document.querySelector("#brief-ai-organize");
  const corridorSummary = document.querySelector("#brief-corridor-summary");
  const corridorRoute = document.querySelector("#brief-corridor-route");
  const corridorCopy = document.querySelector("#brief-corridor-copy");
  const corridorLocation = document.querySelector("#brief-corridor-location");
  const corridorLogistics = document.querySelector("#brief-corridor-logistics");
  const corridorRisk = document.querySelector("#brief-corridor-risk");
  const corridorChecks = document.querySelector("#brief-corridor-checks");
  const placePanel = document.querySelector("#brief-place-intelligence");
  const placeTitle = document.querySelector("#brief-place-title");
  const placeCopy = document.querySelector("#brief-place-copy");
  const placeWeather = document.querySelector("#brief-place-weather");
  const placeRisk = document.querySelector("#brief-place-risk");
  const placeAlertLink = document.querySelector("#brief-place-alert-link");
  const placeUpdated = document.querySelector("#brief-place-updated");
  const placeRefreshButton = document.querySelector("#brief-place-refresh");
  const corridorStorageKey = "swadakta_corridor_context";

  if (!form || !window.SwadaktaData) return;

  let accountCanPost = false;
  let corridorContext = {};
  let placeIntelligence = null;
  let placeTimer = 0;
  let placeRequestId = 0;
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

  function weatherCodeLabel(code) {
    const numericCode = Number(code);
    if (numericCode === 0) return "Clear";
    if ([1, 2, 3].includes(numericCode)) return "Cloudy";
    if ([45, 48].includes(numericCode)) return "Fog";
    if ([51, 53, 55, 56, 57].includes(numericCode)) return "Drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(numericCode)) return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(numericCode)) return "Snow";
    if ([95, 96, 99].includes(numericCode)) return "Storm risk";
    return "Weather";
  }

  function placeSearchQuery() {
    const location = value("#brief-location");
    const destination = value("#brief-destination-country");
    if (!location || /^(remote|online|digital|virtual)$/i.test(location)) return "";
    return [location, destination].filter(Boolean).join(", ");
  }

  function weatherPlanningNotes({ temperature, wind, precipitationChance, weatherCode } = {}) {
    const notes = [];
    if (Number(precipitationChance) >= 60 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(Number(weatherCode))) {
      notes.push("Rain or storms may slow travel, outdoor proof, loading, or delivery.");
    }
    if (Number(wind) >= 35) notes.push("High wind: ask for safer timing and clearer media proof.");
    if (Number(temperature) >= 32) notes.push("Heat planning: allow water, shade, and realistic field timing.");
    if (Number(temperature) <= 5) notes.push("Cold weather: confirm travel, opening hours, and receiver safety.");
    if (!notes.length) {
      notes.push("Normal field conditions from the current forecast. Still confirm local access, opening hours, and receiver safety.");
    }
    return notes;
  }

  function renderPlaceIntelligence(data = null, state = "ready") {
    if (!placePanel) return;
    const query = placeSearchQuery();

    if (!query) {
      placeIntelligence = null;
      if (placeTitle) placeTitle.textContent = "Enter a physical task location";
      if (placeCopy) placeCopy.textContent = "Weather and alert guidance is useful for site visits, shopping, pickup, delivery, and outdoor proof. Digital-only work can skip this.";
      if (placeWeather) placeWeather.textContent = "Not needed yet";
      if (placeRisk) placeRisk.textContent = "No field note yet";
      if (placeAlertLink) {
        placeAlertLink.href = "rules.html";
        placeAlertLink.textContent = "Check item rules";
        placeAlertLink.removeAttribute("target");
        placeAlertLink.removeAttribute("rel");
      }
      if (placeUpdated) placeUpdated.textContent = "Enter a city or town to load place intelligence.";
      return;
    }

    if (state === "loading") {
      if (placeTitle) placeTitle.textContent = `Checking ${query}`;
      if (placeWeather) placeWeather.textContent = "Loading forecast...";
      if (placeRisk) placeRisk.textContent = "Checking field conditions";
      if (placeUpdated) placeUpdated.textContent = "Using Open-Meteo geocoding and forecast data.";
      return;
    }

    if (!data) {
      if (placeTitle) placeTitle.textContent = `Place brief for ${query}`;
      if (placeCopy) placeCopy.textContent = "Forecast could not be loaded yet. Keep the job flexible and confirm local conditions before assigning receiver work.";
      if (placeWeather) placeWeather.textContent = "Forecast unavailable";
      if (placeRisk) placeRisk.textContent = "Manual local check needed";
      if (placeAlertLink) {
        placeAlertLink.href = `https://www.google.com/search?q=${encodeURIComponent(`${query} official weather alerts`)}`;
        placeAlertLink.textContent = "Search official alerts";
        placeAlertLink.target = "_blank";
        placeAlertLink.rel = "noopener";
      }
      if (placeUpdated) placeUpdated.textContent = "Weather lookup can be retried before posting.";
      return;
    }

    const temp = Number(data.temperature);
    const wind = Number(data.wind);
    const rain = Number(data.precipitationChance);
    const weather = weatherCodeLabel(data.weatherCode);
    const notes = weatherPlanningNotes({
      temperature: temp,
      wind,
      precipitationChance: rain,
      weatherCode: data.weatherCode,
    });

    if (placeTitle) placeTitle.textContent = `${data.name}, ${data.country}`;
    if (placeCopy) placeCopy.textContent = "Use this as a rough field brief before assigning work. The receiver still confirms access, safety, and official local alerts.";
    if (placeWeather) placeWeather.textContent = `${Math.round(temp)}C, ${weather}, ${Math.round(wind)} km/h wind`;
    if (placeRisk) placeRisk.textContent = `${rain || 0}% rain risk. ${notes[0]}`;
    if (placeAlertLink) {
      placeAlertLink.href = `https://www.google.com/search?q=${encodeURIComponent(`${data.name} ${data.country} official alerts weather travel`)}`;
      placeAlertLink.textContent = "Search official alerts";
      placeAlertLink.target = "_blank";
      placeAlertLink.rel = "noopener";
    }
    if (placeUpdated) {
      placeUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Forecast is a planning aid, not a legal or safety clearance.`;
    }
  }

  function placeIntelligenceSummary() {
    if (!placeIntelligence) return "";
    const notes = weatherPlanningNotes({
      temperature: placeIntelligence.temperature,
      wind: placeIntelligence.wind,
      precipitationChance: placeIntelligence.precipitationChance,
      weatherCode: placeIntelligence.weatherCode,
    });
    return [
      `Place intelligence: ${placeIntelligence.name}, ${placeIntelligence.country}`,
      `Weather now: ${Math.round(Number(placeIntelligence.temperature))}C, ${weatherCodeLabel(placeIntelligence.weatherCode)}, ${Math.round(Number(placeIntelligence.wind))} km/h wind, ${Number(placeIntelligence.precipitationChance) || 0}% daily rain probability.`,
      `Planning note: ${notes.join(" ")}`,
      "Receiver must still check official local alerts, access, opening hours, and safety before field work.",
    ].join("\n");
  }

  async function loadPlaceIntelligence() {
    const query = placeSearchQuery();
    const requestId = ++placeRequestId;
    if (!query) {
      renderPlaceIntelligence(null);
      return;
    }

    renderPlaceIntelligence(null, "loading");

    try {
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
      const geocodeResponse = await fetch(geocodeUrl);
      if (!geocodeResponse.ok) throw new Error("Location lookup failed.");
      const geocode = await geocodeResponse.json();
      const match = geocode.results?.[0];
      if (!match || requestId !== placeRequestId) {
        renderPlaceIntelligence(null);
        return;
      }

      const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
      forecastUrl.searchParams.set("latitude", match.latitude);
      forecastUrl.searchParams.set("longitude", match.longitude);
      forecastUrl.searchParams.set("current", "temperature_2m,precipitation,weather_code,wind_speed_10m");
      forecastUrl.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
      forecastUrl.searchParams.set("timezone", "auto");
      const forecastResponse = await fetch(forecastUrl.toString());
      if (!forecastResponse.ok) throw new Error("Forecast lookup failed.");
      const forecast = await forecastResponse.json();
      if (requestId !== placeRequestId) return;

      placeIntelligence = {
        name: match.name || value("#brief-location"),
        country: match.country || value("#brief-destination-country") || "",
        latitude: match.latitude,
        longitude: match.longitude,
        timezone: match.timezone || forecast.timezone || "",
        temperature: forecast.current?.temperature_2m ?? forecast.daily?.temperature_2m_max?.[0] ?? 0,
        wind: forecast.current?.wind_speed_10m ?? 0,
        weatherCode: forecast.current?.weather_code ?? forecast.daily?.weather_code?.[0] ?? 0,
        precipitation: forecast.current?.precipitation ?? 0,
        precipitationChance: forecast.daily?.precipitation_probability_max?.[0] ?? 0,
      };
      renderPlaceIntelligence(placeIntelligence);
    } catch (error) {
      if (requestId === placeRequestId) {
        placeIntelligence = null;
        renderPlaceIntelligence(null);
      }
    }
  }

  function schedulePlaceIntelligence() {
    window.clearTimeout(placeTimer);
    placeTimer = window.setTimeout(loadPlaceIntelligence, 650);
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
    const freeformBrief = value("#brief-freeform");
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
        notes: [freeformBrief, selectedService, proof, placeIntelligenceSummary(), corridorContext.notes].filter(Boolean).join("\n\n"),
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
  loadPlaceIntelligence();
  refreshPostingGate();

  ["#brief-location", "#brief-destination-country"].forEach((selector) => {
    const input = document.querySelector(selector);
    input?.addEventListener("input", schedulePlaceIntelligence);
    input?.addEventListener("change", loadPlaceIntelligence);
  });

  placeRefreshButton?.addEventListener("click", loadPlaceIntelligence);

  if (aiOrganizeButton) {
    aiOrganizeButton.addEventListener("click", () => {
      const freeformBrief = value("#brief-freeform");
      const route = [value("#brief-origin-country"), value("#brief-destination-country")].filter(Boolean).join(" to ");
      const context = [
        freeformBrief,
        route ? `Route: ${route}` : "",
        value("#brief-location") ? `Location: ${value("#brief-location")}` : "",
        placeIntelligenceSummary(),
        value("#brief-items") ? `Items: ${value("#brief-items")}` : "",
        value("#brief-proof") ? `Proof: ${value("#brief-proof")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const prompt = context || "Help me create a Swadakta job brief. Ask for route, task, proof, media, payment, lawful-goods checks, timeline, and receiver fit.";
      const url = new URL("assistant.html", window.location.href);
      url.searchParams.set("context", "brief");
      url.searchParams.set("task", "Improve my paid brief");
      url.searchParams.set("links", "brief,corridor,rules,payments");
      url.searchParams.set("prompt", prompt.slice(0, 1800));
      window.location.href = url.toString();
    });
  }
})();
