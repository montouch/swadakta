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
  const presetButtons = document.querySelectorAll(".corridor-preset");
  const africaQuickStart = document.querySelector("#corridor-africa-country");
  const STORAGE_KEY = "swadakta_corridor_context";
  const riskyGoods = new Set(["food_plant_animal", "medicine_health", "cosmetics", "electronics", "valuable_items", "restricted_or_unsure"]);
  const highRiskGoods = new Set(["food_plant_animal", "medicine_health", "valuable_items", "restricted_or_unsure"]);
  const physicalModes = new Set(["local_delivery", "postal_courier", "pickup_hold", "supplier_direct", "airport_handoff"]);
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
      checks.push("Founder approval before quote, pickup, purchase, shipment, or receiver assignment");
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

    const adminReviewRequired = route.admin_review_required || status === "needs_admin_review" || riskLevel === "high";
    const adminReviewReason = adminReviewRequired
      ? route.admin_review_reason ||
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
      required_checks: triage.checks,
      notes: value("#corridor-notes"),
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    return context;
  }

  function applyContext(context = {}) {
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

  function nonEmptyContext(context = {}) {
    return Object.fromEntries(
      Object.entries(context).filter(([, value]) =>
        Array.isArray(value) ? value.length : value !== "" && value !== null && value !== undefined,
      ),
    );
  }

  function readStoredContext() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
  }

  function restoreContext() {
    applyContext(readStoredContext());
    setNextCopy();
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
      imported_from: "brief_route_planner",
      imported_at: new Date().toISOString(),
    });

    const mergedContext = { ...readStoredContext(), ...queryContext };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedContext));
    applyContext(mergedContext);
    setNextCopy();
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

  form.addEventListener("input", setNextCopy);
  form.addEventListener("change", setNextCopy);
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
    });
  });
  africaQuickStart?.addEventListener("change", () => applyAfricaCountry(africaQuickStart.value));
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
    });
    window.location.href = `brief.html?${params.toString()}`;
  });

  ensureCountryOptions();
  populateAfricaQuickSelect();
  restoreContext();
  applyCorridorQueryParams();
  applyInitialQueryDefaults();
})();
