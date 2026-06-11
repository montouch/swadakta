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
  const STORAGE_KEY = "swadakta_corridor_context";
  const riskyGoods = new Set(["food_plant_animal", "medicine_health", "cosmetics", "electronics", "valuable_items", "restricted_or_unsure"]);
  const highRiskGoods = new Set(["food_plant_animal", "medicine_health", "valuable_items", "restricted_or_unsure"]);
  const physicalModes = new Set(["local_delivery", "postal_courier", "pickup_hold", "supplier_direct", "airport_handoff"]);
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
    "central african republic",
    "chad",
    "comoros",
    "congo",
    "democratic republic of congo",
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
    "ivory coast",
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

  function sameCountry(a, b) {
    return a && b && a.toLowerCase() === b.toLowerCase();
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
        title: "Local launch lane",
        copy: "Local work inside a supported launch country can be triaged by AI, with ID, payment, proof, and receiver checks still enforced.",
        pill: "Active",
        pillTone: "bg-emerald-100 text-emerald-700",
        flags: ["Active local launch corridor"],
        checks: ["Confirm local receiver coverage, address/permission, proof plan, and payment route before assignment"],
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

  function restoreContext() {
    try {
      const context = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (context.origin_country) field("#corridor-origin").value = context.origin_country;
      if (context.destination_country) field("#corridor-destination").value = context.destination_country;
      if (context.task_location) field("#corridor-location").value = context.task_location;
      if (context.service_direction) field("#corridor-direction").value = context.service_direction;
      if (context.service_type) field("#corridor-service").value = context.service_type;
      if (context.logistics_mode) field("#corridor-logistics").value = context.logistics_mode;
      if (context.goods_category) field("#corridor-goods").value = context.goods_category;
      if (complianceAck) complianceAck.checked = Boolean(context.compliance_acknowledged);
      if (context.notes) field("#corridor-notes").value = context.notes;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setNextCopy();
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

  restoreContext();
})();
