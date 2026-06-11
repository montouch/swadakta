(function () {
  const form = document.querySelector("#corridor-form");
  const nextCopy = document.querySelector("#corridor-next-copy");
  const riskTitle = document.querySelector("#corridor-risk-title");
  const riskCopy = document.querySelector("#corridor-risk-copy");
  const checksList = document.querySelector("#corridor-required-checks");
  const complianceAck = document.querySelector("#corridor-compliance-ack");
  const STORAGE_KEY = "swadakta_corridor_context";
  const riskyGoods = new Set(["food_plant_animal", "medicine_health", "cosmetics", "electronics", "valuable_items", "restricted_or_unsure"]);
  const highRiskGoods = new Set(["food_plant_animal", "medicine_health", "valuable_items", "restricted_or_unsure"]);
  const physicalModes = new Set(["local_delivery", "postal_courier", "pickup_hold", "supplier_direct", "airport_handoff"]);

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

  function corridorTriage() {
    const origin = value("#corridor-origin");
    const destination = value("#corridor-destination");
    const direction = value("#corridor-direction");
    const logisticsMode = value("#corridor-logistics");
    const goodsCategory = value("#corridor-goods");
    const crossBorder = Boolean(origin && destination && !sameCountry(origin, destination));
    const physical = physicalModes.has(logisticsMode) || (goodsCategory && goodsCategory !== "none");
    const checks = ["Signed-in account before paid posting", "Provider ID verification before payment or assignment"];
    const flags = [];
    let status = "standard";
    let riskLevel = "standard";
    let title = "Standard route";
    let copy = "Swadakta will still check the route before payment or assignment.";

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

    return {
      physical,
      crossBorder,
      status,
      riskLevel,
      title,
      copy,
      checks: [...new Set(checks)],
      flags: [...new Set(flags)],
    };
  }

  function renderRisk(triage) {
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
      ack: context.compliance_acknowledged ? "yes" : "no",
      flags: context.compliance_flags.join("|"),
      checks: context.required_checks.join("|"),
    });
    window.location.href = `brief.html?${params.toString()}`;
  });

  restoreContext();
})();
