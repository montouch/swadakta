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
  const routeModeSelect = document.querySelector("#brief-service-direction");
  const routeTitle = document.querySelector("#brief-route-title");
  const routeCopy = document.querySelector("#brief-route-copy");
  const routePill = document.querySelector("#brief-route-pill");
  const routeChecks = document.querySelector("#brief-route-checks");
  const routePlannerLink = document.querySelector("#brief-route-planner-link");
  const routeShortcutButtons = Array.from(document.querySelectorAll("[data-brief-route-preset]"));
  const routeShortcutStatus = document.querySelector("#brief-route-shortcut-status");
  const africaCountryInput = document.querySelector("#brief-africa-country");
  const useAfricaCountryButton = document.querySelector("#brief-use-africa-country");
  const africaCountryOptions = document.querySelector("#brief-africa-country-options");
  const globalCountryOptions = document.querySelector("#brief-global-country-options");
  const placePanel = document.querySelector("#brief-place-intelligence");
  const placeTitle = document.querySelector("#brief-place-title");
  const placeCopy = document.querySelector("#brief-place-copy");
  const placeWeather = document.querySelector("#brief-place-weather");
  const placeRisk = document.querySelector("#brief-place-risk");
  const placeChecks = document.querySelector("#brief-place-checks");
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
  const AFRICA_COUNTRY_OPTIONS = [
    "Algeria",
    "Angola",
    "Benin",
    "Botswana",
    "Burkina Faso",
    "Burundi",
    "Cameroon",
    "Cape Verde",
    "Central African Republic",
    "Chad",
    "Comoros",
    "Congo",
    "Democratic Republic of Congo",
    "Djibouti",
    "Egypt",
    "Equatorial Guinea",
    "Eritrea",
    "Eswatini",
    "Ethiopia",
    "Gabon",
    "Gambia",
    "Ghana",
    "Guinea",
    "Guinea-Bissau",
    "Ivory Coast",
    "Kenya",
    "Lesotho",
    "Liberia",
    "Libya",
    "Madagascar",
    "Malawi",
    "Mali",
    "Mauritania",
    "Mauritius",
    "Morocco",
    "Mozambique",
    "Namibia",
    "Niger",
    "Nigeria",
    "Rwanda",
    "Sao Tome and Principe",
    "Senegal",
    "Seychelles",
    "Sierra Leone",
    "Somalia",
    "South Africa",
    "South Sudan",
    "Sudan",
    "Tanzania",
    "Togo",
    "Tunisia",
    "Uganda",
    "Zambia",
    "Zimbabwe",
  ];
  const GLOBAL_COUNTRY_OPTIONS = [
    ...AFRICA_COUNTRY_OPTIONS,
    "Australia",
    "Canada",
    "China",
    "France",
    "Germany",
    "India",
    "Ireland",
    "Italy",
    "Netherlands",
    "New Zealand",
    "Qatar",
    "Saudi Arabia",
    "Spain",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Remote",
  ];
  const directionLabels = {
    origin_to_destination: "From client country to work country",
    destination_to_origin: "From work country back to client country",
    two_way: "Both ways",
    local_in_country: "Local work inside one country",
    africa_to_africa: "Africa-to-Africa brief route",
    diaspora_to_africa: "Diaspora-to-Africa brief route",
    africa_to_diaspora: "Africa-to-diaspora brief route",
    digital_global: "Digital / virtual only",
  };
  const routeModeGuidance = {
    origin_to_destination: {
      title: "Client-to-work-country route",
      pill: "Outbound",
      copy: "Use this when money, instructions, shopping, or goods start with the client and the work happens in another country.",
      checks: ["Confirm destination law, courier or pickup method, proof requirements, and payment milestone before assignment."],
    },
    destination_to_origin: {
      title: "Work-country-to-client route",
      pill: "Return route",
      copy: "Use this when a field partner buys, collects, verifies, or ships something back to the client country.",
      checks: ["Check export rules, import rules, courier acceptance, receipts, and item condition before money is released."],
    },
    local_in_country: {
      title: "Local or in-country task",
      pill: "Local",
      copy: "Use this for jobs that happen within one country: errands, site visits, delivery, family support, documents, or local business work.",
      checks: ["Match a nearby verified field partner, confirm access, opening hours, local safety, and proof media."],
    },
    two_way: {
      title: "Two-way corridor",
      pill: "Two-way",
      copy: "Use this when the job may involve instructions, goods, proof, or follow-up moving in both directions.",
      checks: ["Split the work into milestones and check the lawful route in both directions before assignment."],
    },
    africa_to_africa: {
      title: "Africa-to-Africa route",
      pill: "Africa active",
      copy: "Use this for work between African countries or regional in-country operations across Africa.",
      checks: ["Confirm country-specific rules, customs or courier acceptance, duties, taxes, and field-partner coverage."],
    },
    diaspora_to_africa: {
      title: "Diaspora-to-Africa route",
      pill: "Diaspora",
      copy: "Use this when someone outside Africa needs a trusted person to do work inside Africa.",
      checks: ["Confirm client ID, destination country, local field partner coverage, proof media, and payment hold method."],
    },
    africa_to_diaspora: {
      title: "Africa-to-diaspora route",
      pill: "Reverse",
      copy: "Use this when someone in Africa needs help buying, collecting, checking, or shipping something from abroad.",
      checks: ["Confirm import rules, export rules, courier availability, product restrictions, receipts, and milestone release."],
    },
    digital_global: {
      title: "Digital or remote work",
      pill: "Remote",
      copy: "Use this when no physical location, local travel, goods, or handoff is needed.",
      checks: ["Confirm deliverables, access permissions, privacy, file proof, and acceptance criteria before payment release."],
    },
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

  function setValue(selector, value, options = {}) {
    const node = document.querySelector(selector);
    if (node && value && (options.force || !node.value)) node.value = value;
  }

  function populateBriefCountryLists() {
    const optionHtml = (countries) =>
      [...new Set(countries)]
        .map((country) => `<option value="${escapeHtml(country)}"></option>`)
        .join("");

    if (africaCountryOptions) {
      africaCountryOptions.innerHTML = optionHtml(AFRICA_COUNTRY_OPTIONS);
    }
    if (globalCountryOptions) {
      globalCountryOptions.innerHTML = optionHtml(GLOBAL_COUNTRY_OPTIONS);
    }
  }

  function routeShortcutClass(active = false) {
    return active
      ? "h-11 rounded-full bg-primary px-4 font-label-md text-white shadow-[0px_16px_32px_rgba(70,72,212,0.18)]"
      : "h-11 rounded-full bg-white/80 border border-outline-variant/40 px-4 font-label-md text-primary";
  }

  function renderRouteShortcuts() {
    const mode = selectedRouteMode();
    routeShortcutButtons.forEach((button) => {
      button.className = routeShortcutClass(button.dataset.briefRoutePreset === mode);
    });
    if (routeShortcutStatus) {
      routeShortcutStatus.textContent = labelFromMap(directionLabels, mode, "No quick lane selected");
    }
  }

  function setRouteMode(mode) {
    if (routeModeSelect && routeModeGuidance[mode]) {
      routeModeSelect.value = mode;
    }
    syncBriefRoutePlan();
    renderRouteShortcuts();
  }

  function applyAfricaCountryBrief(options = {}) {
    const country = String(africaCountryInput?.value || "").trim();
    if (!country) {
      if (options.focus !== false) africaCountryInput?.focus();
      if (routeShortcutStatus) routeShortcutStatus.textContent = "Choose an African country first";
      return false;
    }

    setRouteMode("local_in_country");
    setValue("#brief-origin-country", country, { force: true });
    setValue("#brief-destination-country", country, { force: true });

    const locationInput = document.querySelector("#brief-location");
    if (locationInput && !locationInput.value) {
      locationInput.placeholder = `${country} city, town, address, or area`;
    }

    syncBriefRoutePlan();
    schedulePlaceIntelligence();
    if (routeShortcutStatus) routeShortcutStatus.textContent = `In-country ${country} job`;
    return true;
  }

  function applyBriefRoutePreset(mode) {
    setRouteMode(mode);
    if (mode === "local_in_country") {
      applyAfricaCountryBrief({ focus: true });
      return;
    }
    if (mode === "africa_to_africa" && africaCountryInput?.value && !value("#brief-destination-country")) {
      setValue("#brief-destination-country", africaCountryInput.value, { force: true });
    }
    if (mode === "digital_global") {
      setValue("#brief-origin-country", "Remote", { force: true });
      setValue("#brief-destination-country", "Remote", { force: true });
      setValue("#brief-location", "Remote", { force: true });
      renderPlaceIntelligence(null);
    }
    syncBriefRoutePlan();
    schedulePlaceIntelligence();
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

  function normalizedPlaceText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function locationLooksSpecific(location, destination) {
    const cleanLocation = normalizedPlaceText(location);
    const cleanDestination = normalizedPlaceText(destination);
    if (!cleanLocation || !cleanDestination) return Boolean(cleanLocation);
    return cleanLocation.includes(cleanDestination) || String(location || "").includes(",");
  }

  function placeSearchQuery() {
    const location = value("#brief-location");
    const destination = value("#brief-destination-country");
    if (!location || /^(remote|online|digital|virtual)$/i.test(location)) return "";
    if (locationLooksSpecific(location, destination)) return location;
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

  function placeOperationalChecks({ temperature, wind, precipitationChance, weatherCode } = {}) {
    const checks = ["Confirm access, opening hours, route, and receiver safety before assignment."];
    if (Number(precipitationChance) >= 60 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(Number(weatherCode))) {
      checks.push("Ask for waterproof proof, backup timing, and safer transport if the job is outdoors.");
    }
    if (Number(wind) >= 35) checks.push("Avoid exposed roof, loading, drone, or road-risk proof unless the receiver confirms it is safe.");
    if (Number(temperature) >= 32) checks.push("Plan heat-safe timing, water, shade, and realistic travel windows.");
    if (Number(temperature) <= 5) checks.push("Confirm cold-weather travel, site access, and phone battery before dispatch.");
    return checks;
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
      if (placeChecks) placeChecks.textContent = "Access, hours, route, and safety";
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
      if (placeChecks) placeChecks.textContent = "Preparing local checks...";
      if (placeUpdated) placeUpdated.textContent = "Using Open-Meteo geocoding and forecast data.";
      return;
    }

    if (!data) {
      if (placeTitle) placeTitle.textContent = `Place brief for ${query}`;
      if (placeCopy) placeCopy.textContent = "Forecast could not be loaded yet. Keep the job flexible and confirm local conditions before assigning receiver work.";
      if (placeWeather) placeWeather.textContent = "Forecast unavailable";
      if (placeRisk) placeRisk.textContent = "Manual local check needed";
      if (placeChecks) placeChecks.textContent = "Ask receiver to confirm access, hours, route, phone signal, and safety.";
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
    const checks = placeOperationalChecks({
      temperature: temp,
      wind,
      precipitationChance: rain,
      weatherCode: data.weatherCode,
    });

    if (placeTitle) placeTitle.textContent = `${data.name}, ${data.country}`;
    if (placeCopy) placeCopy.textContent = "Use this as a rough field brief before assigning work. The receiver still confirms access, safety, and official local alerts.";
    if (placeWeather) placeWeather.textContent = `${Math.round(temp)}C, ${weather}, ${Math.round(wind)} km/h wind`;
    if (placeRisk) placeRisk.textContent = `${rain || 0}% rain risk. ${notes[0]}`;
    if (placeChecks) placeChecks.textContent = checks[0];
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
    const checks = placeOperationalChecks({
      temperature: placeIntelligence.temperature,
      wind: placeIntelligence.wind,
      precipitationChance: placeIntelligence.precipitationChance,
      weatherCode: placeIntelligence.weatherCode,
    });
    return [
      `Place intelligence: ${placeIntelligence.name}, ${placeIntelligence.country}`,
      `Weather now: ${Math.round(Number(placeIntelligence.temperature))}C, ${weatherCodeLabel(placeIntelligence.weatherCode)}, ${Math.round(Number(placeIntelligence.wind))} km/h wind, ${Number(placeIntelligence.precipitationChance) || 0}% daily rain probability.`,
      `Planning note: ${notes.join(" ")}`,
      `Local checks: ${checks.join(" ")}`,
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

  function selectedRouteMode() {
    return value("#brief-service-direction") || corridorContext.service_direction || "origin_to_destination";
  }

  function resolveRouteFields() {
    const mode = selectedRouteMode();
    const clientBase = value("#brief-client-base");
    let origin = value("#brief-origin-country");
    let destination = value("#brief-destination-country");
    let location = value("#brief-location");

    if (mode === "local_in_country") {
      const country = origin || destination;
      origin = origin || country;
      destination = destination || country;
    }

    if (mode === "digital_global") {
      origin = origin || clientBase || "Global";
      destination = destination || "Global";
      location = location || "Remote";
    }

    return { mode, origin, destination, location };
  }

  function routeModeChecks(mode = selectedRouteMode()) {
    return routeModeGuidance[mode]?.checks || routeModeGuidance.origin_to_destination.checks;
  }

  function routePlanSummary() {
    const { mode, origin, destination, location } = resolveRouteFields();
    const label = labelFromMap(directionLabels, mode, "Route not set");
    return [
      `Route type: ${label}`,
      origin || destination ? `Route countries: ${origin || "not set"} to ${destination || "not set"}` : "",
      location ? `Task location: ${location}` : "",
      `Route checks: ${routeModeChecks(mode).join(" ")}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function syncBriefRoutePlan() {
    if (!routeModeSelect) return;
    const { mode, origin, destination, location } = resolveRouteFields();
    const guidance = routeModeGuidance[mode] || routeModeGuidance.origin_to_destination;
    corridorContext.service_direction = mode;

    if (mode === "local_in_country") {
      if (origin && !value("#brief-destination-country")) {
        const node = document.querySelector("#brief-destination-country");
        if (node) node.value = origin;
      } else if (destination && !value("#brief-origin-country")) {
        const node = document.querySelector("#brief-origin-country");
        if (node) node.value = destination;
      }
    }

    if (mode === "digital_global" && !value("#brief-location")) {
      const node = document.querySelector("#brief-location");
      if (node) node.value = "Remote";
      renderPlaceIntelligence(null);
    }

    if (routeTitle) routeTitle.textContent = guidance.title;
    if (routeCopy) routeCopy.textContent = guidance.copy;
    if (routePill) routePill.textContent = guidance.pill;
    if (routeChecks) {
      routeChecks.innerHTML = routeModeChecks(mode).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
    }
    if (routePlannerLink) {
      const url = new URL("corridor.html", window.location.href);
      if (origin) url.searchParams.set("origin", origin);
      if (destination) url.searchParams.set("destination", destination);
      if (location) url.searchParams.set("location", location);
      url.searchParams.set("direction", mode);
      routePlannerLink.href = url.toString();
    }
    renderRouteShortcuts();
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
      setValue("#brief-service-direction", corridorContext.service_direction, { force: true });
    } catch {
      corridorContext = paramContext;
      localStorage.removeItem(corridorStorageKey);
    }

    setValue("#brief-origin-country", corridorContext.origin_country);
    setValue("#brief-destination-country", corridorContext.destination_country);
    setValue("#brief-location", corridorContext.task_location);
    setValue("#brief-service-direction", corridorContext.service_direction, { force: true });
    syncBriefRoutePlan();
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
    fallback.push(...routeModeChecks());
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
    syncBriefRoutePlan();
    const routeFields = resolveRouteFields();
    const location = routeFields.location;
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
        origin_country: routeFields.origin,
        destination_country: routeFields.destination,
        service_direction: routeFields.mode,
        task_location: location,
        kenya_location: location,
        task_type: serviceType(selectedService),
        service_package: "quote_first",
        payment_method_preference: paymentMethod(value("#brief-payment")),
        funds_protection_preference: escrowPreference(value("#brief-escrow")),
        logistics_mode: logisticsMode,
        goods_category: goodsCategory,
        logistics_notes: items,
        notes: [freeformBrief, selectedService, routePlanSummary(), proof, placeIntelligenceSummary(), corridorContext.notes].filter(Boolean).join("\n\n"),
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
        throw new Error("Choose a route type, origin, destination, and task location before submitting.");
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

  populateBriefCountryLists();
  applyCorridorContext();
  loadPlaceIntelligence();
  refreshPostingGate();

  ["#brief-location", "#brief-origin-country", "#brief-destination-country", "#brief-client-base"].forEach((selector) => {
    const input = document.querySelector(selector);
    input?.addEventListener("input", () => {
      syncBriefRoutePlan();
      if (selector === "#brief-location" || selector === "#brief-destination-country") schedulePlaceIntelligence();
    });
    input?.addEventListener("change", () => {
      syncBriefRoutePlan();
      if (selector === "#brief-location" || selector === "#brief-destination-country") loadPlaceIntelligence();
    });
  });

  routeModeSelect?.addEventListener("change", () => {
    syncBriefRoutePlan();
    if (selectedRouteMode() === "digital_global") {
      loadPlaceIntelligence();
    }
  });

  routeShortcutButtons.forEach((button) => {
    button.addEventListener("click", () => applyBriefRoutePreset(button.dataset.briefRoutePreset));
  });

  useAfricaCountryButton?.addEventListener("click", () => applyAfricaCountryBrief());
  africaCountryInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyAfricaCountryBrief();
    }
  });

  placeRefreshButton?.addEventListener("click", loadPlaceIntelligence);

  if (aiOrganizeButton) {
    aiOrganizeButton.addEventListener("click", () => {
      const freeformBrief = value("#brief-freeform");
      const route = [value("#brief-origin-country"), value("#brief-destination-country")].filter(Boolean).join(" to ");
      const routeMode = labelFromMap(directionLabels, selectedRouteMode(), "Route not set");
      const context = [
        freeformBrief,
        routeMode ? `Route type: ${routeMode}` : "",
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
