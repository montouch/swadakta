(function () {
  const form = document.querySelector("#client-brief-form");
  const status = document.querySelector("#brief-status");
  const submitButton = document.querySelector("#brief-submit");
  const gateTitle = document.querySelector("#brief-gate-title");
  const gateCopy = document.querySelector("#brief-gate-copy");
  const launchModePanel = document.querySelector("#brief-launch-mode");
  const launchModeTitle = document.querySelector("#brief-launch-mode-title");
  const launchModeCopy = document.querySelector("#brief-launch-mode-copy");
  const aiOrganizeButton = document.querySelector("#brief-ai-organize");
  const corridorSummary = document.querySelector("#brief-corridor-summary");
  const corridorRoute = document.querySelector("#brief-corridor-route");
  const corridorCopy = document.querySelector("#brief-corridor-copy");
  const corridorLocation = document.querySelector("#brief-corridor-location");
  const corridorLogistics = document.querySelector("#brief-corridor-logistics");
  const corridorRisk = document.querySelector("#brief-corridor-risk");
  const corridorChecks = document.querySelector("#brief-corridor-checks");
  const compliancePackPanel = document.querySelector("#brief-compliance-pack");
  const compliancePackTitle = document.querySelector("#brief-compliance-pack-title");
  const compliancePackCopy = document.querySelector("#brief-compliance-pack-copy");
  const compliancePackRisk = document.querySelector("#brief-compliance-pack-risk");
  const compliancePackChecks = document.querySelector("#brief-compliance-pack-checks");
  const compliancePackLinks = document.querySelector("#brief-compliance-pack-links");
  const goodsCategorySelect = document.querySelector("#brief-goods-category");
  const logisticsModeSelect = document.querySelector("#brief-logistics-mode");
  const goodsSafetyTitle = document.querySelector("#brief-goods-safety-title");
  const goodsSafetyCopy = document.querySelector("#brief-goods-safety-copy");
  const goodsSafetyRisk = document.querySelector("#brief-goods-safety-risk");
  const goodsSafetyChecks = document.querySelector("#brief-goods-safety-checks");
  const goodsRulesLink = document.querySelector("#brief-goods-rules-link");
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
  const quoteSafetyTitle = document.querySelector("#brief-quote-safety-title");
  const quoteSafetyCopy = document.querySelector("#brief-quote-safety-copy");
  const quoteSafetyChecks = document.querySelector("#brief-quote-safety-checks");
  const corridorStorageKey = "swadakta_corridor_context";
  const rulesStorageKey = "swadakta_rules_context";

  if (!form || !window.SwadaktaData) return;

  let accountCanPost = false;
  let corridorContext = {};
  let placeIntelligence = null;
  let placeTimer = 0;
  let placeRequestId = 0;
  function launchModeConfig() {
    const mode = window.SWADAKTA_CONFIG?.launchMode || {};
    return {
      publicStatus: String(mode.publicStatus || "pilot").trim().toLowerCase(),
      paidJobs: String(mode.paidJobs || "pilot_with_founder_review").trim().toLowerCase(),
      label: mode.label || "Founder-reviewed pilot",
      summary:
        mode.summary ||
        "Swadakta can collect briefs and run controlled pilots, but public paid work stays founder-reviewed until legal, insurance, payment, ID, and provider evidence gates are complete.",
    };
  }

  function isPaidLaunchOpen() {
    return ["open", "live", "production"].includes(launchModeConfig().paidJobs);
  }

  function renderLaunchMode() {
    if (!launchModePanel) return;
    const mode = launchModeConfig();
    launchModePanel.hidden = false;
    if (launchModeTitle) launchModeTitle.textContent = mode.label;
    if (launchModeCopy) {
      launchModeCopy.textContent = isPaidLaunchOpen()
        ? mode.summary
        : `${mode.summary} Submitted briefs are routed to founder review before quote, payment, receiver assignment, buying, shipping, pickup, or payout.`;
    }
  }
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
  const officialGoodsReferences = [
    {
      label: "UPU dangerous goods",
      url: "https://www.upu.int/en/universal-postal-union/outreach-campaigns/dangerous-goods",
    },
    {
      label: "USPS international restrictions",
      url: "https://www.usps.com/international/shipping-restrictions.htm",
    },
    {
      label: "DHL restricted commodities",
      url: "https://www.dhl.com/discover/en-us/ship-with-dhl/start-shipping/restricted-commodities",
    },
  ];
  const goodsSafetyProfiles = {
    none: {
      title: "No physical goods selected",
      risk: "standard",
      status: "not_applicable",
      review: false,
      copy: "This looks like a service, visit, document upload, or digital workflow. Keep proof and permission clear.",
      checks: ["Confirm location, access permission, proof standard, and payment milestone before assignment."],
    },
    general_goods: {
      title: "General goods route",
      risk: "standard",
      status: "needs_ai_review",
      review: false,
      copy: "Ordinary goods can move only after description, value, receipt, route, and proof are clear.",
      checks: ["Record item description and value", "Keep receipt or purchase evidence", "Confirm carrier, pickup, or local handoff proof"],
    },
    clothing_household: {
      title: "Low-risk retail goods",
      risk: "standard",
      status: "needs_ai_review",
      review: false,
      copy: "Clothing and ordinary household items still need accurate value, condition proof, and delivery confirmation.",
      checks: ["Record item list and value", "Photograph condition before handoff", "Keep receipt and delivery proof"],
    },
    electronics: {
      title: "Electronics or battery check",
      risk: "medium",
      status: "needs_admin_review",
      review: true,
      copy: "Electronics can contain lithium batteries or data risk. Check carrier, airline, postal, customs, and destination rules before payment or dispatch.",
      checks: ["Confirm battery type and watt-hour where relevant", "Check carrier acceptance and packaging", "Remove or protect personal data where relevant"],
    },
    cosmetics: {
      title: "Perfume, aerosol, or liquid check",
      risk: "medium",
      status: "needs_admin_review",
      review: true,
      copy: "Perfume, aerosols, nail products, cosmetics, and liquids can be restricted as dangerous goods or refused by carriers.",
      checks: ["Confirm ingredients, volume, and packaging", "Check postal or courier acceptance", "Do not buy before route acceptance is proven"],
    },
    food_plant_animal: {
      title: "Biosecurity-sensitive goods",
      risk: "high",
      status: "needs_admin_review",
      review: true,
      copy: "Food, plants, seeds, wood, leather, and animal-origin goods can require permits, declarations, inspection, or refusal.",
      checks: ["Check origin and destination biosecurity rules", "Confirm permits and declarations", "Pause purchase or shipping until lawful route is proven"],
    },
    medicine_health: {
      title: "Medicine or health-product review",
      risk: "high",
      status: "needs_admin_review",
      review: true,
      copy: "Medicine, supplements, medical products, and controlled health items need legal, customs, and carrier checks before Swadakta touches them.",
      checks: ["Confirm prescription, permit, and import rules", "Do not accept controlled substances", "Use specialist provider only when lawful route is documented"],
    },
    documents: {
      title: "Document authority check",
      risk: "medium",
      status: "needs_admin_review",
      review: true,
      copy: "Documents, certificates, IDs, registry papers, and legal-adjacent errands need authority, privacy, and proof controls.",
      checks: ["Confirm requester authority", "Protect personal data", "Use receipt, chain-of-custody, and delivery proof"],
    },
    valuable_items: {
      title: "Valuable-item route review",
      risk: "high",
      status: "needs_admin_review",
      review: true,
      copy: "Cash-equivalent, jewellery, precious metals, valuables, and high-value goods need insured, lawful, provider-backed handling or refusal.",
      checks: ["Confirm declared value and insurance", "Avoid informal carriage", "Use provider-held funds and milestone release only after proof"],
    },
    restricted_or_unsure: {
      title: "Paused until lawful route is proven",
      risk: "high",
      status: "needs_admin_review",
      review: true,
      copy: "Restricted, controlled, hazardous, counterfeit, undeclared, or unclear goods must pause before quote, payment, purchase, pickup, dispatch, or assignment.",
      checks: ["Describe every item before quote", "Check official carrier and customs rules", "Founder/provider review required before any paid action"],
    },
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

  function servicePackage(raw, selectedService = "") {
    const clean = String(raw || "").trim().toLowerCase();
    if (
      [
        "quote_first",
        "quick_errand",
        "site_visit",
        "registry_errand",
        "family_support",
        "shopping_sourcing",
        "monthly_retainer",
        "business_ops",
      ].includes(clean)
    ) {
      return clean;
    }

    const service = String(selectedService || "").toLowerCase();
    if (service.includes("verification") || service.includes("inspection")) return "site_visit";
    if (service.includes("legal") || service.includes("compliance")) return "registry_errand";
    if (service.includes("shopping") || service.includes("sourcing") || service.includes("supplier")) {
      return "shopping_sourcing";
    }
    if (service.includes("assistant")) return "monthly_retainer";
    if (service.includes("business")) return "business_ops";
    return "quote_first";
  }

  function budgetRange(raw) {
    const clean = String(raw || "unsure").trim().toLowerCase();
    return ["unsure", "under_100", "100_250", "250_500", "500_plus", "retainer"].includes(clean) ? clean : "unsure";
  }

  function budgetRangeLabel(raw = budgetRange(value("#brief-budget"))) {
    return {
      unsure: "Budget not sure yet",
      under_100: "Under 100",
      "100_250": "100 to 250",
      "250_500": "250 to 500",
      "500_plus": "500 plus",
      retainer: "Monthly retainer",
    }[budgetRange(raw)];
  }

  function packageLabel(raw = servicePackage(value("#brief-service-package"), value("#brief-service-type"))) {
    return {
      quote_first: "Quote first",
      quick_errand: "Quick errand",
      site_visit: "Proof visit or site check",
      registry_errand: "Registry or document run",
      family_support: "Family support",
      shopping_sourcing: "Shopping or sourcing",
      monthly_retainer: "Monthly assistant retainer",
      business_ops: "Business operations support",
    }[servicePackage(raw)] || "Quote first";
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

  function compliancePackNextAction(context = {}) {
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

  function rulesPackFromContext(context = corridorContext) {
    if (context.rules_compliance_pack?.source === "rules_precheck") {
      return {
        ...context.rules_compliance_pack,
        compliance_status: context.compliance_status || context.rules_compliance_pack.compliance_status || "",
        compliance_risk_level: context.compliance_risk_level || context.rules_compliance_pack.compliance_risk_level || "",
        admin_review_required: Boolean(context.admin_review_required || context.rules_compliance_pack.admin_review_required),
        admin_review_reason: context.admin_review_reason || context.rules_compliance_pack.admin_review_reason || "",
        job_acceptance_status: context.job_acceptance_status || context.rules_compliance_pack.job_acceptance_status || "",
        job_acceptance_label: context.job_acceptance_label || context.rules_compliance_pack.job_acceptance_label || "",
        job_acceptance_title: context.job_acceptance_title || context.rules_compliance_pack.job_acceptance_title || "",
        job_acceptance_copy: context.job_acceptance_copy || context.rules_compliance_pack.job_acceptance_copy || "",
        payment_gate: context.payment_gate || context.rules_compliance_pack.payment_gate || "",
        receiver_gate: context.receiver_gate || context.rules_compliance_pack.receiver_gate || "",
        official_reference_links: normalizeReferenceLinks(context.rules_compliance_pack.official_reference_links),
      };
    }
    if (context.inline_goods_safety_pack?.source === "brief_inline_goods_safety") {
      return {
        ...context.inline_goods_safety_pack,
        official_reference_links: normalizeReferenceLinks(context.inline_goods_safety_pack.official_reference_links),
      };
    }

    const flags = Array.isArray(context.compliance_flags) ? context.compliance_flags : [];
    if (flags.includes("brief_inline_goods_safety")) {
      const pack = buildInlineGoodsSafetyPack();
      return {
        ...pack,
        official_reference_links: normalizeReferenceLinks(pack.official_reference_links),
      };
    }
    if (context.imported_from !== "rules_precheck" && !flags.includes("rules_precheck") && !context.job_acceptance_status) return {};

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
      job_acceptance_status: context.job_acceptance_status || flagValue(flags, "rules_acceptance_"),
      job_acceptance_label: context.job_acceptance_label || "",
      job_acceptance_title: context.job_acceptance_title || "",
      job_acceptance_copy: context.job_acceptance_copy || "",
      payment_gate: context.payment_gate || "",
      receiver_gate: context.receiver_gate || "",
      hard_stops: Array.isArray(context.hard_stops) ? context.hard_stops : [],
      compliance_flags: flags,
      required_checks: Array.isArray(context.required_checks) ? context.required_checks : [],
      official_reference_links: normalizeReferenceLinks(context.official_reference_links),
      next_action: compliancePackNextAction(context),
    };
  }

  function compliancePackSummary() {
    const pack = rulesPackFromContext();
    if (pack.source !== "rules_precheck") return "";

    const refs = normalizeReferenceLinks(pack.official_reference_links)
      .map((reference) => `${reference.label}: ${reference.url}`)
      .join(" | ");

    return [
      `Compliance pack: ${pack.route_label || "Rules pre-check"}`,
      `Status: ${formatStatus(pack.compliance_status || "not_applicable")}; risk: ${formatStatus(pack.compliance_risk_level || "standard")}`,
      pack.job_acceptance_label || pack.job_acceptance_status
        ? `Acceptance gate: ${pack.job_acceptance_label || formatStatus(pack.job_acceptance_status)}${pack.payment_gate ? `; payment: ${pack.payment_gate}` : ""}${pack.receiver_gate ? `; receiver: ${pack.receiver_gate}` : ""}`
        : "",
      pack.next_action ? `Next action: ${pack.next_action}` : "",
      pack.admin_review_reason ? `Review reason: ${pack.admin_review_reason}` : "",
      Array.isArray(pack.hard_stops) && pack.hard_stops.length ? `Hard stops: ${pack.hard_stops.join(" ")}` : "",
      refs ? `Official references: ${refs}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function quoteSafetyPlan() {
    const selectedPackage = servicePackage(value("#brief-service-package"), value("#brief-service-type"));
    const selectedBudget = budgetRange(value("#brief-budget"));
    const fundsPlan = escrowPreference(value("#brief-escrow"));
    const payment = paymentMethod(value("#brief-payment"));
    const logisticsMode = corridorContext.logistics_mode || (value("#brief-items") ? "postal_courier" : "not_needed");
    const goodsCategory = corridorContext.goods_category || (value("#brief-items") ? "general_goods" : "none");
    const hasPhysical = !["not_needed", "digital_only"].includes(logisticsMode) || goodsCategory !== "none";
    const highValue =
      selectedBudget === "500_plus" ||
      selectedBudget === "retainer" ||
      fundsPlan === "regulated_escrow" ||
      selectedPackage === "monthly_retainer" ||
      selectedPackage === "business_ops";
    const lowBudgetPhysical = selectedBudget === "under_100" && hasPhysical;
    const checks = [
      "Quote must cover receiver payout, field costs, provider fees, risk reserve, and operating reserve.",
      payment === "bank" || payment === "mpesa"
        ? "Provider receipt, callback, or statement evidence is required before funds count as protected."
        : "Provider checkout/order evidence is required before paid work starts.",
    ];

    if (hasPhysical) checks.push("Physical work needs route, item, delivery, access, and proof checks before purchase or dispatch.");
    if (fundsPlan === "deposit_milestones") checks.push("Split payment release into proof milestones before receiver payout.");
    if (highValue) checks.push("High-value or retainer work should use milestone controls and Swadakta/provider review before release.");
    if (lowBudgetPhysical) checks.push("Under-100 physical work may need a smaller scope, local-only route, or re-quote to protect the operating reserve.");
    const compliancePack = rulesPackFromContext();
    if (["rules_precheck", "brief_inline_goods_safety"].includes(compliancePack.source)) {
      checks.push(`Goods compliance pack carried forward: ${formatStatus(compliancePack.compliance_status || "not_applicable")} / ${formatStatus(compliancePack.compliance_risk_level || "standard")}.`);
      if (compliancePack.next_action) checks.push(compliancePack.next_action);
    }

    return {
      tone: highValue || lowBudgetPhysical || compliancePack.admin_review_required ? "review" : "standard",
      title: highValue
        ? "Quote safety: milestone review needed"
        : lowBudgetPhysical
          ? "Quote safety: budget may be tight"
          : "Budget and quote safety",
      copy: `${packageLabel(selectedPackage)}. ${budgetRangeLabel(selectedBudget)}. Swadakta will price the job after checking route, proof, receiver payout, field costs, provider fees, and operating reserve.`,
      checks,
    };
  }

  function quoteSafetySummary() {
    const plan = quoteSafetyPlan();
    return [
      `Quote safety: ${plan.title}`,
      `Package: ${packageLabel()}`,
      `Budget comfort: ${budgetRangeLabel()}`,
      `Quote checks: ${plan.checks.join(" ")}`,
    ].join("\n");
  }

  function renderQuoteSafety() {
    if (!quoteSafetyTitle || !quoteSafetyCopy || !quoteSafetyChecks) return;
    const plan = quoteSafetyPlan();
    quoteSafetyTitle.textContent = plan.title;
    quoteSafetyCopy.textContent = plan.copy;
    quoteSafetyChecks.innerHTML = plan.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("");
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
      ? "h-11 rounded-full bg-primary px-4 font-label-md text-white shadow-[0px_16px_32px_rgba(16,26,58,0.18)]"
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
      forecastUrl.searchParams.set("forecast_days", "1");
      forecastUrl.searchParams.set("temperature_unit", "celsius");
      forecastUrl.searchParams.set("wind_speed_unit", "kmh");
      forecastUrl.searchParams.set("precipitation_unit", "mm");
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

  function selectedGoodsCategory() {
    const raw = goodsCategorySelect?.value || corridorContext.goods_category || (value("#brief-items") ? "general_goods" : "none");
    if (raw === "none" && value("#brief-items")) return "general_goods";
    return goodsSafetyProfiles[raw] ? raw : "restricted_or_unsure";
  }

  function selectedLogisticsMode() {
    const raw = logisticsModeSelect?.value || corridorContext.logistics_mode || (value("#brief-items") ? "postal_courier" : "not_needed");
    if (raw === "not_needed" && value("#brief-items")) return "postal_courier";
    return logisticsLabels[raw] ? raw : "not_needed";
  }

  function routeIsCrossBorder() {
    const { origin, destination, mode } = resolveRouteFields();
    if (mode === "digital_global" || mode === "local_in_country") return false;
    if (!origin || !destination) return false;
    return origin.trim().toLowerCase() !== destination.trim().toLowerCase();
  }

  function buildInlineGoodsSafetyPack() {
    const goods = selectedGoodsCategory();
    const logistics = selectedLogisticsMode();
    const profile = goodsSafetyProfiles[goods] || goodsSafetyProfiles.restricted_or_unsure;
    const crossBorder = routeIsCrossBorder();
    const hasPhysical = goods !== "none" || !["not_needed", "digital_only"].includes(logistics);
    const requiredChecks = uniqueList([
      ...profile.checks,
      hasPhysical ? "Capture photos, receipts, serial/model details where relevant, and handoff proof" : "",
      crossBorder ? "Check origin, destination, transit, customs, tax/duty, and import restrictions" : "",
      logistics === "postal_courier" ? "Check postal/courier acceptance before buying or dispatching" : "",
      logistics === "airport_handoff" ? "Check airline and traveller handoff rules; avoid informal carriage for restricted or valuable goods" : "",
    ]);
    const complianceFlags = uniqueList([
      "brief_inline_goods_safety",
      `brief_goods_${goods}`,
      `brief_logistics_${logistics}`,
      crossBorder ? "brief_cross_border_goods" : "",
      profile.review ? "brief_goods_admin_review" : "",
    ]);

    return {
      source: "brief_inline_goods_safety",
      created_at: new Date().toISOString(),
      route_label: [value("#brief-origin-country") || "Origin", value("#brief-destination-country") || "destination"].join(" to "),
      goods_category: goods,
      logistics_mode: logistics,
      item_type: goods,
      movement_mode: logistics,
      cross_border: crossBorder,
      compliance_status: profile.status,
      compliance_risk_level: profile.risk,
      admin_review_required: Boolean(profile.review || crossBorder || logistics === "airport_handoff"),
      admin_review_reason: profile.review
        ? profile.title
        : crossBorder
          ? "Cross-border goods need carrier, customs, tax, and lawful-route checks"
          : "",
      compliance_flags: complianceFlags,
      required_checks: requiredChecks,
      official_reference_links: hasPhysical ? officialGoodsReferences : [],
      next_action: compliancePackNextAction({
        compliance_status: profile.status,
        compliance_risk_level: profile.risk,
        admin_review_required: Boolean(profile.review || crossBorder || logistics === "airport_handoff"),
      }),
      title: profile.title,
      copy: profile.copy,
    };
  }

  function applyInlineGoodsSafety() {
    if (!goodsCategorySelect || !logisticsModeSelect) return;
    const pack = buildInlineGoodsSafetyPack();
    const preservedRulesPack =
      corridorContext.rules_compliance_pack?.source === "rules_precheck" ? corridorContext.rules_compliance_pack : null;

    corridorContext = {
      ...corridorContext,
      goods_category: pack.goods_category,
      logistics_mode: pack.logistics_mode,
      compliance_status: pack.compliance_status,
      compliance_risk_level: pack.compliance_risk_level,
      admin_review_required: Boolean(pack.admin_review_required),
      admin_review_reason: pack.admin_review_reason,
      compliance_flags: uniqueList([
        ...(Array.isArray(corridorContext.compliance_flags) ? corridorContext.compliance_flags : []),
        ...pack.compliance_flags,
      ]),
      required_checks: uniqueList([
        ...(Array.isArray(corridorContext.required_checks) ? corridorContext.required_checks : []),
        ...pack.required_checks,
      ]),
      official_reference_links: normalizeReferenceLinks([
        ...(Array.isArray(corridorContext.official_reference_links) ? corridorContext.official_reference_links : []),
        ...pack.official_reference_links,
      ]),
      inline_goods_safety_pack: pack,
      imported_from: preservedRulesPack ? "rules_precheck" : "brief_inline_goods_safety",
      rules_compliance_pack: preservedRulesPack || corridorContext.rules_compliance_pack,
    };
  }

  function renderGoodsSafety() {
    if (!goodsCategorySelect || !logisticsModeSelect) return;
    applyInlineGoodsSafety();
    const pack = buildInlineGoodsSafetyPack();
    if (goodsCategorySelect.value !== pack.goods_category) goodsCategorySelect.value = pack.goods_category;
    if (logisticsModeSelect.value !== pack.logistics_mode) logisticsModeSelect.value = pack.logistics_mode;
    if (goodsSafetyTitle) goodsSafetyTitle.textContent = pack.title || "Goods safety quick check";
    if (goodsSafetyCopy) goodsSafetyCopy.textContent = pack.copy || "Choose the item type and route before quote or assignment.";
    if (goodsSafetyRisk) {
      goodsSafetyRisk.textContent = `${formatStatus(pack.compliance_risk_level)} risk`;
      goodsSafetyRisk.className = `inline-flex min-h-9 px-3 items-center justify-center rounded-full font-label-sm ${
        pack.compliance_risk_level === "high"
          ? "bg-error-container text-on-error-container"
          : pack.compliance_risk_level === "medium"
            ? "bg-amber-400/20 text-amber-800"
            : "bg-primary-container/10 text-primary"
      }`;
    }
    if (goodsSafetyChecks) {
      goodsSafetyChecks.innerHTML = pack.required_checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("");
    }
    if (goodsRulesLink) {
      const url = new URL("rules.html", window.location.href);
      const route = resolveRouteFields();
      if (route.origin) url.searchParams.set("origin", route.origin);
      if (route.destination) url.searchParams.set("destination", route.destination);
      url.searchParams.set("item", pack.goods_category);
      url.searchParams.set("mode", pack.logistics_mode);
      goodsRulesLink.href = url.toString();
    }
    renderCompliancePack();
    renderQuoteSafety();
    renderCorridorSummary();
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
    renderCompliancePack();
  }

  function renderCompliancePack() {
    if (!compliancePackPanel) return;
    const pack = rulesPackFromContext();
    const hasPack = ["rules_precheck", "brief_inline_goods_safety"].includes(pack.source);
    compliancePackPanel.hidden = !hasPack;
    if (!hasPack) return;

    const status = formatStatus(pack.compliance_status || "not_applicable");
    const risk = formatStatus(pack.compliance_risk_level || "standard");
    if (compliancePackTitle) {
      compliancePackTitle.textContent =
        pack.job_acceptance_title || pack.job_acceptance_label || pack.route_label || pack.title || "Rules pre-check carried forward";
    }
    if (compliancePackCopy) {
      compliancePackCopy.textContent = `${status}. ${risk} risk. ${
        pack.job_acceptance_copy || pack.next_action || "Keep the required checks with the brief before payment or assignment."
      }${pack.payment_gate ? ` Payment gate: ${pack.payment_gate}` : ""}${pack.receiver_gate ? ` Receiver gate: ${pack.receiver_gate}` : ""}`;
    }
    if (compliancePackRisk) {
      compliancePackRisk.textContent = risk;
      compliancePackRisk.className = `inline-flex min-h-9 items-center rounded-full px-3 font-label-sm ${
        pack.compliance_risk_level === "high"
          ? "bg-error-container text-on-error-container"
          : pack.compliance_risk_level === "medium"
            ? "bg-amber-400/20 text-amber-800"
            : "bg-white/80 text-primary"
      }`;
    }
    if (compliancePackChecks) {
      const checks = [...new Set([...(pack.required_checks || []), ...(corridorContext.required_checks || [])])].slice(0, 8);
      compliancePackChecks.innerHTML = checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("");
    }
    if (compliancePackLinks) {
      compliancePackLinks.innerHTML = normalizeReferenceLinks(pack.official_reference_links)
        .map(
          (reference) =>
            `<a class="inline-flex min-h-9 items-center rounded-full border border-outline-variant/45 bg-white/76 px-3 text-xs font-bold text-primary" href="${escapeHtml(reference.url)}" target="_blank" rel="noopener">${escapeHtml(reference.label)}</a>`,
        )
        .join("");
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
      job_acceptance_status: params.get("acceptance") || "",
      compliance_flags: (params.get("flags") || "").split("|").filter(Boolean),
      required_checks: (params.get("checks") || "").split("|").filter(Boolean),
      imported_from: params.get("source") === "rules_precheck" ? "rules_precheck" : "",
    }, params.has("ack"));

    try {
      const storedCorridor = JSON.parse(localStorage.getItem(corridorStorageKey) || "{}");
      const storedRules = JSON.parse(localStorage.getItem(rulesStorageKey) || "{}");
      corridorContext = {
        ...(storedRules?.source === "rules_precheck"
          ? {
              origin_country: storedRules.origin_country || "",
              destination_country: storedRules.destination_country || "",
              task_location: storedRules.destination_country || storedRules.origin_country || "",
              compliance_status: storedRules.compliance_status || "",
              compliance_risk_level: storedRules.compliance_risk_level || "",
              admin_review_required: Boolean(storedRules.admin_review_required),
              admin_review_reason: storedRules.admin_review_reason || "",
              job_acceptance_status: storedRules.job_acceptance_status || "",
              job_acceptance_label: storedRules.job_acceptance_label || "",
              job_acceptance_title: storedRules.job_acceptance_title || "",
              job_acceptance_copy: storedRules.job_acceptance_copy || "",
              payment_gate: storedRules.payment_gate || "",
              receiver_gate: storedRules.receiver_gate || "",
              hard_stops: Array.isArray(storedRules.hard_stops) ? storedRules.hard_stops : [],
              compliance_flags: Array.isArray(storedRules.compliance_flags) ? storedRules.compliance_flags : [],
              required_checks: Array.isArray(storedRules.required_checks) ? storedRules.required_checks : [],
              official_reference_links: normalizeReferenceLinks(storedRules.official_reference_links),
              rules_compliance_pack: storedRules,
              imported_from: "rules_precheck",
              imported_at: storedRules.created_at || "",
            }
          : {}),
        ...storedCorridor,
        ...paramContext,
      };
      if (corridorContext.rules_compliance_pack?.source === "rules_precheck") {
        corridorContext.official_reference_links = normalizeReferenceLinks(
          corridorContext.official_reference_links?.length
            ? corridorContext.official_reference_links
            : corridorContext.rules_compliance_pack.official_reference_links,
        );
      }
      setValue("#brief-origin-country", corridorContext.origin_country);
      setValue("#brief-destination-country", corridorContext.destination_country);
      setValue("#brief-location", corridorContext.task_location);
      setValue("#brief-service-type", corridorContext.service_type);
      setValue("#brief-service-direction", corridorContext.service_direction, { force: true });
      setValue("#brief-goods-category", corridorContext.goods_category, { force: true });
      setValue("#brief-logistics-mode", corridorContext.logistics_mode, { force: true });
    } catch {
      corridorContext = paramContext;
      localStorage.removeItem(corridorStorageKey);
    }

    setValue("#brief-origin-country", corridorContext.origin_country);
    setValue("#brief-destination-country", corridorContext.destination_country);
    setValue("#brief-location", corridorContext.task_location);
    setValue("#brief-service-direction", corridorContext.service_direction, { force: true });
    setValue("#brief-goods-category", corridorContext.goods_category, { force: true });
    setValue("#brief-logistics-mode", corridorContext.logistics_mode, { force: true });
    syncBriefRoutePlan();
    renderGoodsSafety();
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
      const acceptancePack = rulesPackFromContext();
      const directAcceptanceStatus = String(
        new URLSearchParams(window.location.search).get("acceptance") ||
          corridorContext.job_acceptance_status ||
          acceptancePack.job_acceptance_status ||
          "",
      )
        .trim()
        .toLowerCase();

      if (directAcceptanceStatus === "refuse") {
        setGate(
          "This job cannot be posted normally",
          "The rules pre-check says this route needs a lawful specialist route before Swadakta can quote, collect payment, buy, ship, pick up, or assign a receiver.",
          false,
        );
        return;
      }

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
        if (directAcceptanceStatus === "founder_review") {
          setGate(
            "Verified account; founder review required",
            "You can submit the brief into founder review, but Swadakta will not quote, collect payment, or assign a receiver until route, identity, lawful-use, and proof evidence are approved.",
            true,
          );
          return;
        }

        if (directAcceptanceStatus === "evidence_before_quote") {
          setGate(
            "Verified account; evidence first",
            "You can submit the brief for evidence collection, but Swadakta will not request payment or assign a receiver until the route, item, provider, and proof plan are clear.",
            true,
          );
          return;
        }

        if (!isPaidLaunchOpen()) {
          setGate(
            "Verified account; founder-reviewed pilot",
            "You can submit this brief, but Swadakta will route it to founder review before quote, payment, receiver assignment, buying, shipping, pickup, or payout.",
            true,
          );
          return;
        }

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
    const fundsBoundaryAccepted = Boolean(document.querySelector("#funds-boundary")?.checked);
    const paidLaunchOpen = isPaidLaunchOpen();
    syncBriefRoutePlan();
    applyInlineGoodsSafety();
    const routeFields = resolveRouteFields();
    const location = routeFields.location;
    const compliancePack = rulesPackFromContext();
    const requiredChecks = uniqueList([
      ...corridorRequiredChecks(items),
      ...(Array.isArray(compliancePack.required_checks) ? compliancePack.required_checks : []),
    ]);
    const complianceFlags = uniqueList([
      ...(Array.isArray(corridorContext.compliance_flags) ? corridorContext.compliance_flags : []),
      ...(Array.isArray(compliancePack.compliance_flags) ? compliancePack.compliance_flags : []),
    ]);
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
        service_package: servicePackage(value("#brief-service-package"), selectedService),
        payment_method_preference: paymentMethod(value("#brief-payment")),
        funds_protection_preference: escrowPreference(value("#brief-escrow")),
        budget_range: budgetRange(value("#brief-budget")),
        logistics_mode: logisticsMode,
        goods_category: goodsCategory,
        logistics_notes: items,
        notes: [freeformBrief, selectedService, routePlanSummary(), quoteSafetySummary(), compliancePackSummary(), proof, placeIntelligenceSummary(), corridorContext.notes].filter(Boolean).join("\n\n"),
        proof_requirements: proof ? [proof] : ["Photo/video proof", "Receipt or reference where available"],
        required_checks: requiredChecks,
        compliance_flags: complianceFlags,
        route_status: corridorContext.route_status || "active",
        automation_status:
          corridorContext.automation_status ||
          (corridorContext.route_status === "pilot" ? "admin_review" : corridorContext.route_status === "unsupported" ? "founder_approval" : "ai_triage"),
        admin_review_required: Boolean(corridorContext.admin_review_required || compliancePack.admin_review_required),
        admin_review_reason: corridorContext.admin_review_reason || compliancePack.admin_review_reason || "",
        compliance_status: corridorContext.compliance_status || compliancePack.compliance_status || (complianceFlags.length ? "needs_ai_review" : "not_applicable"),
        compliance_risk_level: corridorContext.compliance_risk_level || compliancePack.compliance_risk_level || "standard",
        compliance_acknowledged: Boolean(document.querySelector("#compliance")?.checked || corridorContext.compliance_acknowledged),
        identity_verification_required: true,
        identity_verification_consent: true,
        contact_permission: true,
        professional_boundary_accepted: fundsBoundaryAccepted,
        terms_accepted_at: now,
        privacy_accepted_at: now,
      };

      if (!paidLaunchOpen) {
        payload.route_status = payload.route_status === "unsupported" ? "unsupported" : "pilot";
        payload.automation_status = "founder_approval";
        payload.admin_review_required = true;
        payload.admin_review_reason =
          payload.admin_review_reason || "Launch mode requires founder review before quote, payment, assignment, buying, shipping, pickup, or payout.";
        payload.compliance_flags = uniqueList([...payload.compliance_flags, "launch_mode_pilot", "launch_mode_founder_review"]);
        payload.required_checks = uniqueList([
          ...payload.required_checks,
          "Founder approval before quote, payment, or receiver assignment",
          "Provider payment and ID readiness before paid work starts",
        ]);
      }

      if (!payload.origin_country || !payload.destination_country || !payload.task_location) {
        throw new Error("Choose a route type, origin, destination, and task location before submitting.");
      }

      if (!fundsBoundaryAccepted) {
        throw new Error("Confirm the funds boundary before submitting: Swadakta is not a licensed escrow provider unless a regulated provider is agreed in writing.");
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
  renderLaunchMode();
  applyCorridorContext();
  loadPlaceIntelligence();
  refreshPostingGate();

  ["#brief-location", "#brief-origin-country", "#brief-destination-country", "#brief-client-base"].forEach((selector) => {
    const input = document.querySelector(selector);
    input?.addEventListener("input", () => {
      syncBriefRoutePlan();
      renderGoodsSafety();
      if (selector === "#brief-location" || selector === "#brief-destination-country") schedulePlaceIntelligence();
    });
    input?.addEventListener("change", () => {
      syncBriefRoutePlan();
      renderGoodsSafety();
      if (selector === "#brief-location" || selector === "#brief-destination-country") loadPlaceIntelligence();
    });
  });

  routeModeSelect?.addEventListener("change", () => {
    syncBriefRoutePlan();
    renderGoodsSafety();
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

  ["#brief-goods-category", "#brief-logistics-mode"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", renderGoodsSafety);
    document.querySelector(selector)?.addEventListener("change", renderGoodsSafety);
  });

  ["#brief-service-package", "#brief-budget", "#brief-payment", "#brief-escrow"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("input", renderQuoteSafety);
    document.querySelector(selector)?.addEventListener("change", renderQuoteSafety);
  });
  document.querySelector("#brief-items")?.addEventListener("input", renderGoodsSafety);
  document.querySelector("#brief-items")?.addEventListener("change", renderGoodsSafety);

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

  renderQuoteSafety();
})();
