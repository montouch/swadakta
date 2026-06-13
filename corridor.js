(function () {
  const form = document.querySelector("#corridor-form");
  const nextCopy = document.querySelector("#corridor-next-copy");
  const riskTitle = document.querySelector("#corridor-risk-title");
  const riskCopy = document.querySelector("#corridor-risk-copy");
  const checksList = document.querySelector("#corridor-required-checks");
  const complianceAck = document.querySelector("#corridor-compliance-ack");
  const routeTitle = document.querySelector("#corridor-route-title");
  const routeCopy = document.querySelector("#corridor-route-copy");
  const routePill = document.querySelector("#corridor-route-pill");
  const placeTitle = document.querySelector("#corridor-place-title");
  const placeCopy = document.querySelector("#corridor-place-copy");
  const placeWeather = document.querySelector("#corridor-place-weather");
  const placeRisk = document.querySelector("#corridor-place-risk");
  const placeChecks = document.querySelector("#corridor-place-checks");
  const placeAlertLink = document.querySelector("#corridor-place-alert-link");
  const placeUpdated = document.querySelector("#corridor-place-updated");
  const placeRefresh = document.querySelector("#corridor-place-refresh");
  const presetButtons = document.querySelectorAll(".corridor-preset");
  const africaQuickStart = document.querySelector("#corridor-africa-country");
  const STORAGE_KEY = "swadakta_corridor_context";
  const RULES_STORAGE_KEY = "swadakta_rules_context";
  const riskyGoods = new Set(["food_plant_animal", "medicine_health", "cosmetics", "electronics", "valuable_items", "restricted_or_unsure"]);
  const highRiskGoods = new Set(["food_plant_animal", "medicine_health", "valuable_items", "restricted_or_unsure"]);
  const physicalModes = new Set(["local_delivery", "postal_courier", "pickup_hold", "supplier_direct", "airport_handoff"]);
  const alertSources = [
    {
      label: "Australia Bureau of Meteorology warnings",
      url: "https://www.bom.gov.au/weather-and-climate/warnings-and-alerts",
      matches: ["australia", "adelaide", "sydney", "melbourne", "brisbane", "perth"],
    },
    {
      label: "US National Weather Service alerts",
      url: "https://www.weather.gov/alerts",
      matches: ["united states", "usa", "us", "america"],
    },
    {
      label: "UK Met Office weather warnings",
      url: "https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings",
      matches: ["united kingdom", "uk", "england", "scotland", "wales", "northern ireland", "london"],
    },
    {
      label: "Kenya Meteorological Department warnings",
      url: "https://meteo.go.ke/weather-warnings/",
      matches: ["kenya", "nairobi", "mombasa", "kisumu", "nakuru"],
    },
    {
      label: "Meteoalarm European warnings",
      url: "https://www.meteoalarm.org/",
      matches: ["europe", "germany", "france", "italy", "spain", "netherlands", "belgium", "sweden", "norway", "denmark", "finland", "poland", "portugal", "switzerland", "austria"],
    },
    {
      label: "China Meteorological Administration weather",
      url: "https://en.weather.com.cn/",
      matches: ["china", "mainland china", "hong kong", "guangzhou", "shenzhen", "beijing", "shanghai"],
    },
  ];
  let importedRulesContext = {};
  let placeIntelligence = null;
  let placeRequestId = 0;
  let placeTimer = 0;
  const africaCountryOptions = [
    "Algeria",
    "Angola",
    "Benin",
    "Botswana",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cameroon",
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
    "Sahrawi Arab Democratic Republic",
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
  const africaCountries = new Set([
    "africa",
    "algeria",
    "angola",
    "benin",
    "botswana",
    "burkina faso",
    "burundi",
    "cameroon",
    "cape verde",
    "cabo verde",
    "central african republic",
    "central africa",
    "chad",
    "comoros",
    "congo",
    "republic of congo",
    "republic of the congo",
    "democratic republic of congo",
    "democratic republic of the congo",
    "dr congo",
    "drc",
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
    "guinea bissau",
    "ivory coast",
    "cote d ivoire",
    "cote divoire",
    "cote d'ivoire",
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
    "sahrawi arab democratic republic",
    "saharawi arab democratic republic",
    "western sahara",
    "sao tome and principe",
    "sao tome principe",
    "sao tome",
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
  const europeCountries = new Set([
    "europe",
    "united kingdom",
    "uk",
    "england",
    "ireland",
    "germany",
    "france",
    "italy",
    "spain",
    "netherlands",
    "belgium",
    "sweden",
    "norway",
    "denmark",
    "finland",
    "poland",
    "portugal",
    "switzerland",
    "austria",
  ]);

  if (!form) return;

  function field(id) {
    return document.querySelector(id);
  }

  function value(id) {
    return String(field(id)?.value || "").trim();
  }

  function setNextCopy() {
    const direction = value("#corridor-direction");
    const destination = value("#corridor-destination");
    const location = value("#corridor-location");
    const triage = corridorTriage();
    const physical = triage.physical;
    nextCopy.textContent = physical
      ? `Next: create a paid brief for ${location || destination || "this corridor"}. The brief stays locked until verification and route checks are complete.`
      : "Next: create a digital/virtual brief. Paid work still requires account verification before posting or assignment.";
    renderRisk(triage);
  }

  function ensureCountryOptions() {
    const list = document.querySelector("#corridor-country-options");
    if (!list) return;
    const existing = new Set([...list.querySelectorAll("option")].map((option) => option.value));
    const globalOptions = ["Australia", "United States", "United Kingdom", "Germany", "France", "China"];

    [...africaCountryOptions, ...globalOptions].forEach((country) => {
      if (existing.has(country)) return;
      const option = document.createElement("option");
      option.value = country;
      list.append(option);
      existing.add(country);
    });
  }

  function populateAfricaQuickSelect() {
    if (!africaQuickStart) return;
    const existing = new Set([...africaQuickStart.querySelectorAll("option")].map((option) => option.value));

    africaCountryOptions.forEach((country) => {
      if (existing.has(country)) return;
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      africaQuickStart.append(option);
      existing.add(country);
    });
  }

  function applyAfricaCountry(country) {
    const selectedCountry = String(country || "").trim();
    if (!selectedCountry) return;

    field("#corridor-origin").value = selectedCountry;
    field("#corridor-destination").value = selectedCountry;
    field("#corridor-location").value = `${selectedCountry} city, town, or remote`;
    field("#corridor-direction").value = "local_in_country";
    field("#corridor-logistics").value = "local_delivery";
    field("#corridor-goods").value = "none";
    if (complianceAck) complianceAck.checked = false;
    setNextCopy();
  }

  function sameCountry(a, b) {
    return Boolean(a && b && normalizeCountry(a) === normalizeCountry(b));
  }

  function normalizeCountry(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ");
  }

  function supportedRegion(country) {
    const normalized = normalizeCountry(country);
    if (!normalized) return "";
    if (africaCountries.has(normalized)) return "Africa";
    if (["australia", "au"].includes(normalized)) return "Australia";
    if (["united states", "usa", "us", "america"].includes(normalized)) return "USA";
    if (europeCountries.has(normalized)) return "Europe";
    if (["china", "mainland china", "hong kong", "guangzhou", "shenzhen"].includes(normalized)) return "China";
    return "";
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

  function locationLooksRemote(location) {
    return /^(remote|online|digital|virtual)$/i.test(String(location || "").trim());
  }

  function locationLooksSpecific(location, destination) {
    const cleanLocation = normalizeCountry(location);
    const cleanDestination = normalizeCountry(destination);
    if (!cleanLocation || !cleanDestination) return Boolean(cleanLocation);
    return cleanLocation.includes(cleanDestination) || String(location || "").includes(",");
  }

  function placeSearchQuery() {
    const location = value("#corridor-location");
    const destination = value("#corridor-destination");
    const logisticsMode = value("#corridor-logistics");
    const direction = value("#corridor-direction");
    if (!location || locationLooksRemote(location) || logisticsMode === "digital_only" || direction === "digital_global") return "";
    if (locationLooksSpecific(location, destination)) return location;
    return [location, destination].filter(Boolean).join(", ");
  }

  function weatherPlanningNotes({ temperature, wind, precipitationChance, weatherCode } = {}) {
    const notes = [];
    if (Number(precipitationChance) >= 60 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(Number(weatherCode))) {
      notes.push("Rain or storms may slow travel, outdoor proof, loading, delivery, or site access.");
    }
    if (Number(wind) >= 35) notes.push("High wind: avoid exposed proof tasks unless the receiver confirms safe timing.");
    if (Number(temperature) >= 32) notes.push("Heat planning: allow water, shade, phone battery, and realistic travel windows.");
    if (Number(temperature) <= 5) notes.push("Cold weather: confirm travel, opening hours, access, and receiver safety.");
    if (!notes.length) notes.push("Normal field conditions from the current forecast. Still confirm local access, opening hours, and receiver safety.");
    return notes;
  }

  function placeOperationalChecks({ temperature, wind, precipitationChance, weatherCode } = {}) {
    const checks = ["Confirm access, opening hours, route, phone signal, and receiver safety before assignment."];
    if (Number(precipitationChance) >= 60 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(Number(weatherCode))) {
      checks.push("Ask for waterproof proof, backup timing, and safer transport if the job is outdoors.");
    }
    if (Number(wind) >= 35) checks.push("Avoid exposed roof, loading, drone, or road-risk proof unless the receiver confirms it is safe.");
    if (Number(temperature) >= 32) checks.push("Plan heat-safe timing, water, shade, and realistic travel windows.");
    if (Number(temperature) <= 5) checks.push("Confirm cold-weather travel, site access, and phone battery before dispatch.");
    return checks;
  }

  function officialAlertSource({ country = "", name = "" } = {}) {
    const haystack = normalizeCountry(`${name} ${country} ${value("#corridor-location")} ${value("#corridor-destination")}`);
    const haystackTokens = new Set(haystack.split(" ").filter(Boolean));
    const matched = alertSources.find((source) =>
      source.matches.some((match) => {
        const cleanMatch = normalizeCountry(match);
        return cleanMatch.length <= 3 ? haystackTokens.has(cleanMatch) : haystack.includes(cleanMatch);
      }),
    );
    if (matched) return matched;

    const region = supportedRegion(country || value("#corridor-destination"));
    if (region === "Europe") {
      return {
        label: "Meteoalarm European warnings",
        url: "https://www.meteoalarm.org/",
      };
    }
    if (region === "Africa") {
      return {
        label: "WMO Severe Weather Information Centre",
        url: "https://severeweather.wmo.int/",
      };
    }
    return {
      label: "Search official local alerts",
      url: `https://www.google.com/search?q=${encodeURIComponent(`${value("#corridor-location") || country} official weather alerts`)}`,
    };
  }

  function renderPlaceIntelligence(data = null, state = "ready") {
    const query = placeSearchQuery();

    if (!query) {
      placeIntelligence = null;
      if (placeTitle) placeTitle.textContent = "Enter a physical work location";
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
      const alertSource = officialAlertSource({ country: value("#corridor-destination"), name: value("#corridor-location") });
      if (placeTitle) placeTitle.textContent = `Place brief for ${query}`;
      if (placeCopy) placeCopy.textContent = "Forecast could not be loaded yet. Keep the job flexible and confirm local conditions before assigning receiver work.";
      if (placeWeather) placeWeather.textContent = "Forecast unavailable";
      if (placeRisk) placeRisk.textContent = "Manual local check needed";
      if (placeChecks) placeChecks.textContent = "Ask receiver to confirm access, hours, route, phone signal, and safety.";
      if (placeAlertLink) {
        placeAlertLink.href = alertSource.url;
        placeAlertLink.textContent = alertSource.label;
        placeAlertLink.target = "_blank";
        placeAlertLink.rel = "noopener";
      }
      if (placeUpdated) placeUpdated.textContent = "Weather lookup can be retried before opening the paid brief.";
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
    const alertSource = officialAlertSource(data);

    if (placeTitle) placeTitle.textContent = `${data.name}, ${data.country}`;
    if (placeCopy) placeCopy.textContent = "Use this as a rough field brief before quoting or assignment. The receiver still confirms access, safety, and official local alerts.";
    if (placeWeather) placeWeather.textContent = `${Math.round(temp)}C, ${weather}, ${Math.round(wind)} km/h wind`;
    if (placeRisk) placeRisk.textContent = `${rain || 0}% rain risk. ${notes[0]}`;
    if (placeChecks) placeChecks.textContent = checks[0];
    if (placeAlertLink) {
      placeAlertLink.href = alertSource.url;
      placeAlertLink.textContent = alertSource.label;
      placeAlertLink.target = "_blank";
      placeAlertLink.rel = "noopener";
    }
    if (placeUpdated) {
      placeUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Forecast is a planning aid, not a legal or safety clearance.`;
    }
  }

  function placeReferenceLinks() {
    if (!placeSearchQuery()) return [];
    const links = [
      {
        label: "Open-Meteo forecast data",
        url: "https://open-meteo.com/en/docs",
      },
    ];
    const alertSource = officialAlertSource(placeIntelligence || { country: value("#corridor-destination"), name: value("#corridor-location") });
    if (alertSource?.url) links.push(alertSource);
    return normalizeReferenceLinks(links);
  }

  function placeRequiredChecks() {
    if (!placeSearchQuery()) return [];
    if (!placeIntelligence) {
      return ["Manual local weather, safety, access, route, and official-alert check before quoting or assignment"];
    }
    return placeOperationalChecks({
      temperature: placeIntelligence.temperature,
      wind: placeIntelligence.wind,
      precipitationChance: placeIntelligence.precipitationChance,
      weatherCode: placeIntelligence.weatherCode,
    });
  }

  function placeIntelligenceSummary() {
    if (!placeSearchQuery()) return "";
    if (!placeIntelligence) {
      return `Place intelligence pending for ${placeSearchQuery()}. Confirm official alerts, access, opening hours, route, phone signal, and receiver safety before quoting or assignment.`;
    }
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
      forecastUrl.searchParams.set("forecast_days", "1");
      forecastUrl.searchParams.set("temperature_unit", "celsius");
      forecastUrl.searchParams.set("wind_speed_unit", "kmh");
      forecastUrl.searchParams.set("precipitation_unit", "mm");
      const forecastResponse = await fetch(forecastUrl.toString());
      if (!forecastResponse.ok) throw new Error("Forecast lookup failed.");
      const forecast = await forecastResponse.json();
      if (requestId !== placeRequestId) return;

      placeIntelligence = {
        name: match.name || value("#corridor-location"),
        country: match.country || value("#corridor-destination") || "",
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

  function routeReadiness(origin, destination, direction) {
    const originRegion = supportedRegion(origin);
    const destinationRegion = supportedRegion(destination);
    const regions = new Set([originRegion, destinationRegion].filter(Boolean));

    if (direction === "digital_global") {
      return {
        route_status: "pilot",
        automation_status: "admin_review",
        riskLevel: "medium",
        title: "Digital pilot lane",
        copy: "Digital work can move globally, but privacy, access, documents, and account-control boundaries still need review.",
        pill: "Pilot",
        pillTone: "bg-primary-container/10 text-primary",
        flags: ["Digital global lane"],
        checks: ["Confirm privacy, account-access, document, and data-retention boundaries before work starts"],
        admin_review_required: true,
        admin_review_reason: "Digital global lane needs privacy and account-access review before quoting or assignment.",
      };
    }

    if (!origin || !destination) {
      return {
        route_status: "unsupported",
        automation_status: "founder_approval",
        riskLevel: "standard",
        title: "Choose a route",
        copy: "Swadakta checks whether the lane is active, pilot, or founder-review before a paid brief moves forward.",
        pill: "Pending",
        pillTone: "bg-white/80 text-on-surface-variant",
        flags: [],
        checks: [],
        admin_review_required: true,
        admin_review_reason: "Route has not been selected yet.",
      };
    }

    if (!originRegion || !destinationRegion) {
      return {
        route_status: "unsupported",
        automation_status: "founder_approval",
        riskLevel: "high",
        title: "Founder-review lane",
        copy: "One or both countries are outside the current launch regions. Swadakta can still review it, but no quote, purchase, shipment, or assignment should happen automatically.",
        pill: "Founder review",
        pillTone: "bg-error/10 text-error",
        flags: ["Unsupported corridor - founder approval required"],
        checks: ["Founder approves whether Swadakta can support this lane before any quote, purchase, payment, shipment, or assignment"],
        admin_review_required: true,
        admin_review_reason: "Route is outside the current launch regions and needs founder approval.",
      };
    }

    if (sameCountry(origin, destination)) {
      return {
        route_status: "active",
        automation_status: "ai_triage",
        riskLevel: "standard",
        title: originRegion === "Africa" ? "Active Africa in-country lane" : "Local launch lane",
        copy:
          originRegion === "Africa"
            ? "In-country work inside any African country can be triaged by Swadakta, with local receiver coverage, ID, payment, proof, and safety checks still enforced."
            : "Local work inside a supported launch country can be triaged by AI, with ID, payment, proof, and receiver checks still enforced.",
        pill: "Active",
        pillTone: "bg-emerald-100 text-emerald-700",
        flags: [originRegion === "Africa" ? "Active Africa in-country corridor" : "Active local launch corridor"],
        checks: ["Confirm local receiver coverage, address/permission, proof plan, payment route, and local safety before assignment"],
        admin_review_required: false,
        admin_review_reason: "",
      };
    }

    if (originRegion === "Africa" && destinationRegion === "Africa") {
      return {
        route_status: "active",
        automation_status: "ai_triage",
        riskLevel: "standard",
        title: "Active Africa-to-Africa lane",
        copy: "Swadakta can intake work between African countries and inside African countries. Cross-border goods still need carrier, customs, tax/duty, and lawful-path checks before spending money or assigning work.",
        pill: "Africa active",
        pillTone: "bg-emerald-100 text-emerald-700",
        flags: ["Active Africa-wide corridor"],
        checks: [
          "Confirm receiver coverage in both countries or the destination country before assignment",
          "For cross-border goods, confirm carrier acceptance, customs, duties/taxes owner, restricted categories, and proof plan",
        ],
        admin_review_required: false,
        admin_review_reason: "",
      };
    }

    if (regions.has("Africa") && regions.has("Australia")) {
      return {
        route_status: "active",
        automation_status: "ai_triage",
        riskLevel: "standard",
        title: "Active launch lane",
        copy: "Africa and Australia lanes are the primary launch corridor. AI can triage routine work while protected decisions stay gated.",
        pill: "Active",
        pillTone: "bg-emerald-100 text-emerald-700",
        flags: ["Active Africa-Australia corridor"],
        checks: ["Confirm receiver coverage, payment route, item rules, and proof plan before assignment"],
        admin_review_required: false,
        admin_review_reason: "",
      };
    }

    if (regions.has("Africa") && (regions.has("USA") || regions.has("Europe") || regions.has("China"))) {
      const otherRegion = ["USA", "Europe", "China"].find((region) => regions.has(region)) || "global";
      return {
        route_status: "pilot",
        automation_status: "admin_review",
        riskLevel: "medium",
        title: `${otherRegion}-Africa pilot lane`,
        copy: "This is inside the launch map, but Swadakta should confirm receiver coverage, lawful path, payment rail, and proof standards before quoting.",
        pill: "Pilot",
        pillTone: "bg-primary-container/10 text-primary",
        flags: ["Pilot corridor - founder quote approval required"],
        checks: ["Founder confirms receiver coverage, payment route, lawful path, taxes/duties owner, and proof plan before quote or assignment"],
        admin_review_required: true,
        admin_review_reason: "Pilot corridor: AI can triage, but founder approval is required before quoting or assigning.",
      };
    }

    return {
      route_status: "unsupported",
      automation_status: "founder_approval",
      riskLevel: "high",
      title: "Custom founder-review lane",
      copy: "This corridor is not part of the launch operating map yet. Keep it founder-reviewed until a safe route, receiver pool, and payment path are clear.",
      pill: "Founder review",
      pillTone: "bg-error/10 text-error",
      flags: ["Unsupported corridor - founder approval required"],
      checks: ["Founder approves whether Swadakta can support this lane before any quote, purchase, payment, shipment, or assignment"],
      admin_review_required: true,
      admin_review_reason: "Non-Africa or non-launch corridor requested; keep in founder review until the lane is activated.",
    };
  }

  function corridorTriage() {
    const origin = value("#corridor-origin");
    const destination = value("#corridor-destination");
    const direction = value("#corridor-direction");
    const logisticsMode = value("#corridor-logistics");
    const goodsCategory = value("#corridor-goods");
    const crossBorder = Boolean(origin && destination && !sameCountry(origin, destination));
    const physical = physicalModes.has(logisticsMode) || (goodsCategory && goodsCategory !== "none");
    const route = routeReadiness(origin, destination, direction);
    const checks = ["Signed-in account before paid posting", "Provider ID verification before payment or assignment"];
    const flags = [...route.flags];
    let status = route.route_status === "active" ? "not_applicable" : route.route_status === "pilot" ? "needs_ai_review" : "needs_admin_review";
    let riskLevel = route.riskLevel;
    let title = route.title;
    let copy = route.copy;

    checks.push(...route.checks);

    if (physical) {
      checks.push("Confirm item details, courier rules, delivery proof, and recipient permission");
      flags.push("physical_item_or_delivery");
      status = "needs_ai_review";
      riskLevel = "medium";
      title = "Route check needed";
      copy = "Physical errands, parcels, purchases, or handoffs need a route check before quoting.";
    }

    if (crossBorder && physical) {
      checks.push("Check origin, destination, carrier, customs, taxes, and import/export restrictions");
      flags.push("cross_border_physical_goods");
      status = "needs_ai_review";
      riskLevel = "medium";
      title = "Customs-aware route";
      copy = "Cross-border physical items need customs and carrier checks before anyone spends money.";
    }

    if (riskyGoods.has(goodsCategory)) {
      checks.push("Founder approval before quote, pickup, purchase, shipment, or operator assignment");
      flags.push(`goods_${goodsCategory}`);
      status = "needs_admin_review";
      riskLevel = highRiskGoods.has(goodsCategory) ? "high" : "medium";
      title = riskLevel === "high" ? "Founder approval route" : "Restricted-item check";
      copy = "This category can be restricted, regulated, fragile, valuable, or carrier-limited. Swadakta must confirm the lawful path first.";
    }

    if (direction === "digital_global" || logisticsMode === "digital_only") {
      checks.push("Confirm data, document, privacy, and account-access boundaries");
      flags.push("digital_or_document_work");
    }

    const importedRulesActive = rulesContextMatchesCurrent();
    if (importedRulesActive) {
      const importedChecks = Array.isArray(importedRulesContext.required_checks) ? importedRulesContext.required_checks : [];
      const importedFlags = Array.isArray(importedRulesContext.compliance_flags) ? importedRulesContext.compliance_flags : [];
      checks.push(...importedChecks);
      flags.push(...importedFlags);

      const importedRisk = importedRulesContext.compliance_risk_level || "";
      const importedStatus = importedRulesContext.compliance_status || "";
      if (importedStatus === "prohibited") status = "prohibited";
      if (importedStatus === "needs_admin_review" && status !== "prohibited") status = "needs_admin_review";
      if (importedRisk === "high") riskLevel = "high";
      if (importedRisk === "medium" && riskLevel === "standard") riskLevel = "medium";
    }

    const adminReviewRequired =
      route.admin_review_required ||
      status === "needs_admin_review" ||
      status === "prohibited" ||
      riskLevel === "high" ||
      Boolean(importedRulesActive && importedRulesContext.admin_review_required);
    const adminReviewReason = adminReviewRequired
      ? (importedRulesActive ? importedRulesContext.admin_review_reason : "") ||
        route.admin_review_reason ||
        "Founder approval is required because this route, item, or compliance risk cannot be cleared by AI alone."
      : "";

    return {
      physical,
      crossBorder,
      status,
      riskLevel,
      title,
      copy,
      route,
      adminReviewRequired,
      adminReviewReason,
      checks: [...new Set(checks)],
      flags: [...new Set(flags)],
    };
  }

  function renderRisk(triage) {
    if (routeTitle) routeTitle.textContent = triage.route.title;
    if (routeCopy) routeCopy.textContent = triage.route.copy;
    if (routePill) {
      routePill.textContent = triage.route.pill;
      routePill.className = `inline-flex min-h-10 items-center rounded-full px-4 font-label text-sm ${triage.route.pillTone}`;
    }
    if (riskTitle) riskTitle.textContent = triage.title;
    if (riskCopy) riskCopy.textContent = triage.copy;
    if (checksList) {
      checksList.innerHTML = triage.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("");
    }
    if (complianceAck) {
      complianceAck.required = triage.physical || triage.riskLevel !== "standard";
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function saveContext() {
    const triage = corridorTriage();
    const importedRulesActive = rulesContextMatchesCurrent();
    const rulesCompliancePack = importedRulesActive ? rulesPackFromContext(importedRulesContext) : {};
    const placeChecks = placeRequiredChecks();
    const requiredChecks = [...new Set([...triage.checks, ...placeChecks])];
    const officialReferenceLinks = normalizeReferenceLinks([
      ...(rulesCompliancePack.official_reference_links || []),
      ...placeReferenceLinks(),
    ]);
    const context = {
      origin_country: value("#corridor-origin"),
      destination_country: value("#corridor-destination"),
      task_location: value("#corridor-location"),
      service_direction: value("#corridor-direction"),
      service_type: value("#corridor-service"),
      logistics_mode: value("#corridor-logistics"),
      goods_category: value("#corridor-goods"),
      compliance_acknowledged: Boolean(complianceAck?.checked),
      compliance_status: triage.status,
      compliance_risk_level: triage.riskLevel,
      route_status: triage.route.route_status,
      automation_status: triage.route.automation_status,
      admin_review_required: triage.adminReviewRequired,
      admin_review_reason: triage.adminReviewReason,
      compliance_flags: triage.flags,
      required_checks: requiredChecks,
      official_reference_links: officialReferenceLinks,
      rules_compliance_pack: rulesCompliancePack,
      place_intelligence: placeIntelligence
        ? {
            name: placeIntelligence.name,
            country: placeIntelligence.country,
            latitude: placeIntelligence.latitude,
            longitude: placeIntelligence.longitude,
            timezone: placeIntelligence.timezone,
            temperature: placeIntelligence.temperature,
            wind: placeIntelligence.wind,
            weatherCode: placeIntelligence.weatherCode,
            precipitationChance: placeIntelligence.precipitationChance,
          }
        : null,
      place_intelligence_summary: placeIntelligenceSummary(),
      notes: value("#corridor-notes"),
      imported_from: importedRulesActive ? importedRulesContext.imported_from : "",
      imported_at: importedRulesActive ? importedRulesContext.imported_at : "",
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    if (rulesCompliancePack.source) {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rulesCompliancePack));
    }
    return context;
  }

  function applyContext(context = {}) {
    rememberImportedRulesContext(context);
    if (context.origin_country) field("#corridor-origin").value = context.origin_country;
    if (context.destination_country) field("#corridor-destination").value = context.destination_country;
    if (context.task_location) field("#corridor-location").value = context.task_location;
    if (context.service_direction) field("#corridor-direction").value = context.service_direction;
    if (context.service_type) field("#corridor-service").value = context.service_type;
    if (context.logistics_mode) field("#corridor-logistics").value = context.logistics_mode;
    if (context.goods_category) field("#corridor-goods").value = context.goods_category;
    if (africaQuickStart && context.origin_country && sameCountry(context.origin_country, context.destination_country)) {
      africaQuickStart.value = africaCountryOptions.includes(context.origin_country) ? context.origin_country : "";
    }
    if (typeof context.compliance_acknowledged === "boolean" && complianceAck) {
      complianceAck.checked = context.compliance_acknowledged;
    }
    if (context.notes) field("#corridor-notes").value = context.notes;
  }

  function rememberImportedRulesContext(context = {}) {
    importedRulesContext =
      context.imported_from === "rules_precheck"
        ? {
            origin_country: context.origin_country || "",
            destination_country: context.destination_country || "",
            logistics_mode: context.logistics_mode || "",
            goods_category: context.goods_category || "",
            compliance_status: context.compliance_status || "",
            compliance_risk_level: context.compliance_risk_level || "",
            admin_review_required: Boolean(context.admin_review_required),
            admin_review_reason: context.admin_review_reason || "",
            compliance_flags: Array.isArray(context.compliance_flags) ? context.compliance_flags : [],
            required_checks: Array.isArray(context.required_checks) ? context.required_checks : [],
            official_reference_links: normalizeReferenceLinks(context.official_reference_links),
            rules_compliance_pack: rulesPackFromContext(context),
            imported_from: context.imported_from,
            imported_at: context.imported_at || "",
          }
        : {};
  }

  function normalizeReferenceLinks(value = []) {
    if (!Array.isArray(value)) return [];
    return value
      .map((reference) => ({
        label: String(reference?.label || "").trim().slice(0, 80),
        url: String(reference?.url || "").trim().slice(0, 260),
      }))
      .filter((reference) => reference.label && /^https?:\/\//i.test(reference.url))
      .slice(0, 6);
  }

  function flagValue(flags = [], prefix = "") {
    const match = flags.find((flag) => String(flag || "").startsWith(prefix));
    return match ? match.slice(prefix.length) : "";
  }

  function packNextAction(context = {}) {
    if (context.compliance_status === "prohibited") {
      return "Do not quote or assign until a lawful specialist route is proven.";
    }
    if (context.admin_review_required || context.compliance_status === "needs_admin_review") {
      return "Hold for founder/provider review before quote, payment, purchase, pickup, or assignment.";
    }
    if (context.compliance_risk_level === "medium") {
      return "Proceed only after route, carrier, packaging, proof, and payment checks are recorded.";
    }
    return "Proceed with normal route, proof, value, and receipt checks.";
  }

  function rulesPackFromContext(context = {}) {
    if (context.rules_compliance_pack?.source === "rules_precheck") {
      return {
        ...context.rules_compliance_pack,
        official_reference_links: normalizeReferenceLinks(context.rules_compliance_pack.official_reference_links),
      };
    }

    const flags = Array.isArray(context.compliance_flags) ? context.compliance_flags : [];
    if (context.imported_from !== "rules_precheck" && !flags.includes("rules_precheck")) return {};

    return {
      source: "rules_precheck",
      created_at: context.imported_at || context.created_at || new Date().toISOString(),
      route_label: [context.origin_country || "Origin", context.destination_country || "destination"].join(" to "),
      origin_country: context.origin_country || "",
      destination_country: context.destination_country || "",
      item_type: flagValue(flags, "rules_item_"),
      movement_mode: flagValue(flags, "rules_mode_"),
      value_band: flagValue(flags, "rules_value_"),
      cross_border: flags.includes("rules_cross_border"),
      compliance_status: context.compliance_status || "",
      compliance_risk_level: context.compliance_risk_level || "",
      admin_review_required: Boolean(context.admin_review_required),
      admin_review_reason: context.admin_review_reason || "",
      compliance_flags: flags,
      required_checks: Array.isArray(context.required_checks) ? context.required_checks : [],
      official_reference_links: normalizeReferenceLinks(context.official_reference_links),
      next_action: packNextAction(context),
    };
  }

  function rulesContextMatchesCurrent() {
    if (importedRulesContext.imported_from !== "rules_precheck") return false;

    const sameOrigin =
      !importedRulesContext.origin_country ||
      normalizeCountry(importedRulesContext.origin_country) === normalizeCountry(value("#corridor-origin"));
    const sameDestination =
      !importedRulesContext.destination_country ||
      normalizeCountry(importedRulesContext.destination_country) === normalizeCountry(value("#corridor-destination"));
    const sameLogistics =
      !importedRulesContext.logistics_mode || importedRulesContext.logistics_mode === value("#corridor-logistics");
    const sameGoods = !importedRulesContext.goods_category || importedRulesContext.goods_category === value("#corridor-goods");

    return sameOrigin && sameDestination && sameLogistics && sameGoods;
  }

  function nonEmptyContext(context = {}) {
    return Object.fromEntries(
      Object.entries(context).filter(([, value]) =>
        Array.isArray(value) ? value.length : value !== "" && value !== null && value !== undefined,
      ),
    );
  }

  function readStoredContext() {
    try {
      const context = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (Object.keys(context).length) return context;
      const rulesPack = JSON.parse(localStorage.getItem(RULES_STORAGE_KEY) || "{}");
      if (rulesPack?.source !== "rules_precheck") return {};
      return {
        origin_country: rulesPack.origin_country || "",
        destination_country: rulesPack.destination_country || "",
        task_location: rulesPack.destination_country || rulesPack.origin_country || "",
        compliance_status: rulesPack.compliance_status || "",
        compliance_risk_level: rulesPack.compliance_risk_level || "",
        admin_review_required: Boolean(rulesPack.admin_review_required),
        admin_review_reason: rulesPack.admin_review_reason || "",
        compliance_flags: Array.isArray(rulesPack.compliance_flags) ? rulesPack.compliance_flags : [],
        required_checks: Array.isArray(rulesPack.required_checks) ? rulesPack.required_checks : [],
        official_reference_links: normalizeReferenceLinks(rulesPack.official_reference_links),
        rules_compliance_pack: rulesPack,
        imported_from: "rules_precheck",
        imported_at: rulesPack.created_at || "",
      };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
  }

  function restoreContext() {
    applyContext(readStoredContext());
    setNextCopy();
    loadPlaceIntelligence();
  }

  function applyCorridorQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const hasRouteContext = [
      "origin",
      "origin_country",
      "destination",
      "destination_country",
      "location",
      "task_location",
      "direction",
      "service_direction",
      "logistics",
      "logistics_mode",
      "goods",
      "goods_category",
      "service",
      "service_type",
      "review_reason",
      "flags",
      "checks",
      "notes",
    ].some((key) => params.has(key));

    if (!hasRouteContext) return;

    const queryContext = nonEmptyContext({
      origin_country: params.get("origin") || params.get("origin_country") || "",
      destination_country: params.get("destination") || params.get("destination_country") || "",
      task_location: params.get("location") || params.get("task_location") || "",
      service_direction: params.get("direction") || params.get("service_direction") || "",
      service_type: params.get("service") || params.get("service_type") || "",
      logistics_mode: params.get("logistics") || params.get("logistics_mode") || "",
      goods_category: params.get("goods") || params.get("goods_category") || "",
      compliance_status: params.get("compliance") || "",
      compliance_risk_level: params.get("risk") || "",
      route_status: params.get("route") || "",
      automation_status: params.get("automation") || "",
      admin_review_required: params.get("review") === "yes",
      admin_review_reason: params.get("review_reason") || "",
      compliance_acknowledged: params.has("ack") ? params.get("ack") === "yes" : undefined,
      compliance_flags: (params.get("flags") || "").split("|").filter(Boolean),
      required_checks: (params.get("checks") || "").split("|").filter(Boolean),
      notes: params.get("notes") || "",
      imported_from: params.get("source") === "rules_precheck" ? "rules_precheck" : "brief_route_planner",
      imported_at: new Date().toISOString(),
    });

    const mergedContext = { ...readStoredContext(), ...queryContext };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedContext));
    applyContext(mergedContext);
    setNextCopy();
    loadPlaceIntelligence();
  }

  function applyInitialQueryDefaults() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;
    if (!params.has("origin") && !params.has("origin_country")) return;
    if (!params.has("destination") && !params.has("destination_country")) return;
    const notice = document.querySelector("#corridor-next-copy");
    if (notice) {
      notice.textContent = "Route details were imported from the brief. Review the checks, then continue back to the paid brief.";
    }
  }

  function handleFormChange(event) {
    setNextCopy();
    if (
      !event ||
      ["corridor-location", "corridor-destination", "corridor-logistics", "corridor-direction"].includes(event.target?.id)
    ) {
      schedulePlaceIntelligence();
    }
  }

  form.addEventListener("input", handleFormChange);
  form.addEventListener("change", handleFormChange);
  placeRefresh?.addEventListener("click", loadPlaceIntelligence);
  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      field("#corridor-origin").value = button.dataset.origin || "";
      field("#corridor-destination").value = button.dataset.destination || "";
      field("#corridor-location").value = button.dataset.location || "";
      field("#corridor-direction").value = button.dataset.direction || "origin_to_destination";
      field("#corridor-logistics").value = button.dataset.logistics || "not_needed";
      field("#corridor-goods").value = button.dataset.goods || "none";
      if (complianceAck) complianceAck.checked = false;
      setNextCopy();
      loadPlaceIntelligence();
    });
  });
  africaQuickStart?.addEventListener("change", () => {
    applyAfricaCountry(africaQuickStart.value);
    loadPlaceIntelligence();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const context = saveContext();
    const params = new URLSearchParams({
      origin: context.origin_country,
      destination: context.destination_country,
      location: context.task_location,
      direction: context.service_direction,
      logistics: context.logistics_mode,
      goods: context.goods_category,
      compliance: context.compliance_status,
      risk: context.compliance_risk_level,
      route: context.route_status,
      automation: context.automation_status,
      review: context.admin_review_required ? "yes" : "no",
      review_reason: context.admin_review_reason,
      ack: context.compliance_acknowledged ? "yes" : "no",
      flags: context.compliance_flags.join("|"),
      checks: context.required_checks.join("|"),
      source: context.imported_from || "",
    });
    window.location.href = `brief.html?${params.toString()}`;
  });

  ensureCountryOptions();
  populateAfricaQuickSelect();
  restoreContext();
  applyCorridorQueryParams();
  applyInitialQueryDefaults();
})();
