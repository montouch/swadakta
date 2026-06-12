(function () {
  const data = window.SwadaktaData;
  if (!data) return;

  const authPanel = document.querySelector("#admin-auth-panel");
  const loginForm = document.querySelector("#admin-login-form");
  const emailInput = document.querySelector("#admin-email");
  const passwordInput = document.querySelector("#admin-password");
  const loginStatus = document.querySelector("#admin-login-status");
  const signOutButtons = document.querySelectorAll(".admin-sign-out-control");
  const refreshButton = document.querySelector("#refresh-ops");
  const opsMode = document.querySelector("#ops-mode");
  const opsStatus = document.querySelector("#ops-status");
  const opsList = document.querySelector("#ops-list");
  const opsAutopilotSummary = document.querySelector("#ops-autopilot-summary");
  const opsAutopilotList = document.querySelector("#ops-autopilot-list");
  const copyOpsAutopilotButton = document.querySelector("#copy-ops-autopilot");
  const resolutionList = document.querySelector("#ops-resolution-list");
  const filterButtons = document.querySelectorAll(".ops-filter");

  let currentFilter = "exceptions";
  let currentRequests = [];
  let currentPartners = [];
  let currentResolutionCases = [];

  const closedStatuses = new Set(["completed", "cancelled"]);
  const paidStatuses = new Set(["paid", "deposit_paid"]);
  const riskyCompliance = new Set(["needs_admin_review", "restricted", "permit_required", "prohibited"]);
  const checkoutCurrencies = new Set(["AUD", "USD", "GBP", "EUR"]);

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

  function formatStatus(value) {
    return String(value || "unknown")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatDate(value) {
    if (!value) return "No date";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }

  function formatDateTime(value) {
    if (!value) return "No date";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function margin(request) {
    const quote = Number(request.quote_amount || 0);
    const costs =
      Number(request.operator_payout || 0) +
      Number(request.field_costs || 0) +
      Number(request.payment_processing_fee || 0);
    return quote - costs;
  }

  function formatMoney(amount, currency = "AUD") {
    const value = Number(amount || 0);
    if (!value) return `${currency} 0`;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${currency} ${value}`;
    }
  }

  function normalizeCurrency(value, fallback = "AUD") {
    return String(value || fallback).trim().toUpperCase() || fallback;
  }

  function paymentRailLabel(rail) {
    return {
      stripe: "Stripe checkout",
      paypal: "PayPal order",
      mpesa: "M-Pesa STK",
      wise: "Wise fallback",
    }[rail] || formatStatus(rail);
  }

  function preferredPaymentRail(request) {
    const preference = String(request.payment_method_preference || "").toLowerCase();
    const currency = normalizeCurrency(request.quote_currency || request.preferred_currency);

    if (preference === "mpesa" || currency === "KES") return "mpesa";
    if (preference === "paypal") return "paypal";
    if (preference === "wise" || preference === "bank") return "wise";
    if (checkoutCurrencies.has(currency)) return "stripe";
    return "wise";
  }

  function paymentRailNote(request) {
    const rail = preferredPaymentRail(request);
    const currency = normalizeCurrency(request.quote_currency || request.preferred_currency);
    if (!Number(request.quote_amount || 0)) {
      return "Add a quote amount before creating any payment route.";
    }
    if (rail === "mpesa") {
      return "Best fit for KES collection. Callback evidence must confirm payment before funds count as protected.";
    }
    if (rail === "paypal") {
      return "Best fit when the client prefers PayPal approval. Capture/confirmation still controls paid status.";
    }
    if (rail === "wise") {
      return "Fallback only after easier rails fail or are unsuitable. Reconcile receipt, sender, amount, date, and reference before marking paid.";
    }
    return `Best fit for ${currency} card checkout. Stripe webhook evidence still controls paid status.`;
  }

  function railEnabled(request, rail) {
    const currency = normalizeCurrency(request.quote_currency || request.preferred_currency);
    const hasQuote = Number(request.quote_amount || 0) > 0;
    if (!hasQuote) return false;
    if (rail === "stripe" || rail === "paypal") return checkoutCurrencies.has(currency);
    if (rail === "mpesa") return currency === "KES";
    return true;
  }

  function isOverdue(value) {
    if (!value) return false;
    const due = new Date(value);
    if (Number.isNaN(due.getTime())) return false;
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  }

  function routeLabel(request) {
    return [request.origin_country, request.destination_country].filter(Boolean).join(" to ") || "Route not set";
  }

  function taskLabel(request) {
    return request.task_location || request.kenya_location || request.service_package || "Request";
  }

  function requestFlags(request) {
    const flags = [];
    const requestMargin = margin(request);

    if (request.admin_review_required) flags.push(["Founder review", "admin"]);
    if (request.route_status && request.route_status !== "active") flags.push([`Route ${formatStatus(request.route_status)}`, "route"]);
    if (riskyCompliance.has(request.compliance_status)) flags.push([formatStatus(request.compliance_status), "compliance"]);
    if (request.identity_verification_required && request.verification_status !== "verified") {
      flags.push([`ID ${formatStatus(request.verification_status || "required")}`, "identity"]);
    }
    if (!paidStatuses.has(request.payment_status) && request.quote_amount) flags.push(["Payment pending", "payment"]);
    if (isOverdue(request.payment_due_at) && !paidStatuses.has(request.payment_status)) flags.push(["Payment overdue", "payment"]);
    if (request.funds_status === "disputed" || request.funds_status === "refund_pending") {
      flags.push([formatStatus(request.funds_status), "money"]);
    }
    if (request.quote_amount && requestMargin <= 0) flags.push(["Margin risk", "margin"]);
    if (request.status === "in_progress" && !request.assigned_partner_id) flags.push(["No receiver assigned", "assignment"]);
    if (request.sensitive_documents_expected) flags.push(["Sensitive documents", "identity"]);

    return flags;
  }

  function nextAction(request, flags) {
    const kinds = new Set(flags.map(([, kind]) => kind));
    if (kinds.has("money") || kinds.has("margin")) return "Review protected money state, costs, and milestone release conditions before any payout.";
    if (kinds.has("payment")) return "Confirm quote, send or regenerate payment route, and do not start paid work until provider evidence exists.";
    if (kinds.has("identity")) return "Send or review provider ID verification before paid, sensitive, or receiver work continues.";
    if (kinds.has("compliance") || kinds.has("route")) return "Check corridor legality, restricted goods, route coverage, and proof plan before assignment.";
    if (kinds.has("assignment")) return "Assign only a vetted, ID-verified receiver with matching coverage.";
    return "Monitor normally; AI/autopilot can handle routine follow-up unless a protected decision appears.";
  }

  function requestFlagKinds(request) {
    return new Set(requestFlags(request).map(([, kind]) => kind));
  }

  function automationLane(request) {
    const kinds = requestFlagKinds(request);
    if (
      request.admin_review_required ||
      request.sensitive_documents_expected ||
      kinds.has("money") ||
      kinds.has("margin") ||
      kinds.has("admin") ||
      kinds.has("compliance") ||
      kinds.has("route") ||
      kinds.has("assignment")
    ) {
      return "founder_gate";
    }
    if (kinds.has("identity") || kinds.has("payment")) return "provider_evidence";
    return "ai_routine";
  }

  function automationLaneMeta(lane) {
    return (
      {
        ai_routine: {
          title: "AI routine lane",
          badge: "AI can run",
          tone: "bg-emerald-500/10 text-emerald-700",
          copy:
            "AI can draft updates, reminders, proof checklists, receiver instructions, and next-step summaries. No protected decision is needed yet.",
        },
        provider_evidence: {
          title: "Provider evidence lane",
          badge: "Wait for provider",
          tone: "bg-primary/10 text-primary",
          copy:
            "AI can chase missing evidence and summarize status. Stripe webhook, PayPal capture, M-Pesa callback, bank/Wise receipt, or ID-provider evidence must decide the gate.",
        },
        founder_gate: {
          title: "Founder gate lane",
          badge: "Human/provider stop",
          tone: "bg-amber-400/20 text-amber-800",
          copy:
            "AI can brief the founder, but money release, refunds, ID approval, paid assignment, restricted goods, legal authority, customs, tax, and high-value exceptions stay gated.",
        },
      }[lane] || {
        title: "Operations lane",
        badge: "Review",
        tone: "bg-white/70 text-on-surface-variant",
        copy: "Review this work queue.",
      }
    );
  }

  function laneNextStep(lane, request) {
    if (lane === "ai_routine") {
      return "AI drafts the next client/receiver update and asks for proof only if the job stage needs it.";
    }
    if (lane === "provider_evidence") {
      if (!paidStatuses.has(request.payment_status) && request.quote_amount) {
        return `${paymentRailLabel(preferredPaymentRail(request))}: wait for provider confirmation before paid status.`;
      }
      return "Wait for provider ID/selfie/liveness evidence before paid posting or receiver work unlocks.";
    }
    return nextAction(request, requestFlags(request));
  }

  function groupedAutomationRequests() {
    return openRequests().reduce(
      (groups, request) => {
        groups[automationLane(request)].push(request);
        return groups;
      },
      { ai_routine: [], provider_evidence: [], founder_gate: [] },
    );
  }

  function renderAutomationLane(lane, requests) {
    const meta = automationLaneMeta(lane);
    const examples = requests
      .slice(0, 3)
      .map(
        (request) => `
          <li class="rounded-2xl bg-white/70 p-3">
            <strong class="block text-on-surface">${escapeHtml(request.request_code || "Request")}</strong>
            <span class="mt-1 block text-xs leading-5 text-on-surface-variant">${escapeHtml(routeLabel(request))} / ${escapeHtml(taskLabel(request))}</span>
            <span class="mt-2 block text-xs leading-5 text-on-surface-variant">${escapeHtml(laneNextStep(lane, request))}</span>
          </li>
        `,
      )
      .join("");

    return `
      <article class="rounded-3xl border border-outline-variant/30 bg-white/62 p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-label text-xs uppercase tracking-[0.18em] text-secondary">${escapeHtml(meta.title)}</p>
            <strong class="mt-1 block font-display text-4xl">${requests.length}</strong>
          </div>
          <span class="rounded-full px-3 py-1 font-label text-xs ${meta.tone}">${escapeHtml(meta.badge)}</span>
        </div>
        <p class="mt-3 text-sm leading-6 text-on-surface-variant">${escapeHtml(meta.copy)}</p>
        <ul class="mt-4 grid gap-2 text-sm text-on-surface-variant">
          ${examples || `<li class="rounded-2xl bg-white/70 p-3">No requests in this lane right now.</li>`}
        </ul>
      </article>
    `;
  }

  function renderOpsAutopilot() {
    if (!opsAutopilotList && !opsAutopilotSummary) return;
    const groups = groupedAutomationRequests();
    const open = openRequests();
    const unresolvedCases = currentResolutionCases.filter((item) => !["resolved", "closed"].includes(String(item.status || "").toLowerCase()));

    if (opsAutopilotSummary) {
      opsAutopilotSummary.textContent = open.length
        ? `${groups.ai_routine.length} routine request${groups.ai_routine.length === 1 ? "" : "s"} can stay with AI, ${groups.provider_evidence.length} need provider evidence, and ${groups.founder_gate.length} need founder/provider gates. ${unresolvedCases.length} user issue${unresolvedCases.length === 1 ? "" : "s"} are unresolved.`
        : "No open requests right now. AI can stay ready for intake, message drafting, route checks, and proof templates.";
    }

    if (opsAutopilotList) {
      opsAutopilotList.innerHTML = ["ai_routine", "provider_evidence", "founder_gate"]
        .map((lane) => renderAutomationLane(lane, groups[lane]))
        .join("");
    }
  }

  function opsAutopilotPrompt() {
    const groups = groupedAutomationRequests();
    const unresolvedCases = currentResolutionCases.filter((item) => !["resolved", "closed"].includes(String(item.status || "").toLowerCase()));
    const lines = [
      "Swadakta daily operations autopilot brief",
      `AI routine lane: ${groups.ai_routine.length}`,
      `Provider evidence lane: ${groups.provider_evidence.length}`,
      `Founder gate lane: ${groups.founder_gate.length}`,
      `Unresolved user issues: ${unresolvedCases.length}`,
      "",
      "AI may draft messages, summaries, proof checklists, receiver instructions, route checks, and payment reminders.",
      "AI must not mark funds paid, approve ID, assign paid work, release payouts, issue refunds, or clear restricted/legal/customs/tax/high-value exceptions.",
      "",
    ];

    ["founder_gate", "provider_evidence", "ai_routine"].forEach((lane) => {
      const meta = automationLaneMeta(lane);
      lines.push(`${meta.title}:`);
      groups[lane].slice(0, 6).forEach((request) => {
        lines.push(
          `- ${request.request_code || "Request"} | ${routeLabel(request)} | ${taskLabel(request)} | ${laneNextStep(lane, request)}`,
        );
      });
      if (!groups[lane].length) lines.push("- None");
      lines.push("");
    });

    if (unresolvedCases.length) {
      lines.push("Unresolved cases:");
      unresolvedCases.slice(0, 6).forEach((item) => {
        lines.push(`- ${item.resolution_code || "Case"} | ${item.request_code || "No request"} | ${formatStatus(item.issue_type)} | ${formatStatus(item.status)}`);
      });
    }

    return lines.join("\n");
  }

  function normalizedText(...values) {
    return values
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function partnerCoverageText(partner) {
    return normalizedText(
      partner.kenya_base,
      partner.service_regions,
      Array.isArray(partner.coverage_scopes) ? partner.coverage_scopes.join(" ") : "",
      partner.notes,
      partner.provenance_notes,
    );
  }

  function requestCoverageText(request) {
    return normalizedText(
      request.origin_country,
      request.destination_country,
      request.task_location,
      request.kenya_location,
      request.service_direction,
      request.logistics_mode,
      request.goods_category,
      request.notes,
    );
  }

  function requestCategoryHints(request) {
    const task = String(request.task_type || "").toLowerCase();
    const logistics = String(request.logistics_mode || "").toLowerCase();
    const goods = String(request.goods_category || "").toLowerCase();
    const hints = new Set();

    if (task.includes("site") || task.includes("inspection")) {
      hints.add("property_checks");
      hints.add("site_visits");
    }
    if (task.includes("registry") || task.includes("legal") || goods.includes("documents")) {
      hints.add("documents");
      hints.add("registry_errands");
    }
    if (task.includes("shopping") || logistics.includes("delivery") || logistics.includes("courier")) {
      hints.add("shopping_delivery");
      hints.add("deliveries");
    }
    if (task.includes("virtual") || task.includes("research")) {
      hints.add("sourcing");
      hints.add("virtual_ops");
    }
    if (task.includes("quick")) {
      hints.add("family_support");
      hints.add("family_logistics");
    }
    if (!hints.size) hints.add("business_support");

    return hints;
  }

  function partnerEligibility(partner) {
    const vetted = partner.status === "vetted";
    const verified = partner.identity_verification_status === "verified";
    if (vetted && verified) return { eligible: true, label: "Eligible" };
    if (!verified && !vetted) return { eligible: false, label: "Needs ID and vetting" };
    if (!verified) return { eligible: false, label: "Needs ID verification" };
    return { eligible: false, label: "Needs vetting" };
  }

  function matchScore(request, partner) {
    const reasons = [];
    const blockers = [];
    const eligibility = partnerEligibility(partner);
    const coverage = partnerCoverageText(partner);
    const requestText = requestCoverageText(request);
    const taskLocation = normalizedText(request.task_location || request.kenya_location);
    const destination = normalizedText(request.destination_country);
    const origin = normalizedText(request.origin_country);
    const categories = new Set(Array.isArray(partner.service_categories) ? partner.service_categories : []);
    const hints = requestCategoryHints(request);
    let score = 0;

    if (eligibility.eligible) {
      score += 30;
      reasons.push("ID verified and vetted");
    } else {
      blockers.push(eligibility.label);
      score += partner.identity_verification_status === "verified" ? 10 : 0;
      score += partner.status === "vetted" ? 10 : 0;
    }

    if ([...hints].some((hint) => categories.has(hint))) {
      score += 20;
      reasons.push("Category fit");
    }

    if (taskLocation && coverage.includes(taskLocation)) {
      score += 18;
      reasons.push("Task location coverage");
    } else if (destination && coverage.includes(destination)) {
      score += 14;
      reasons.push("Destination coverage");
    } else if (origin && coverage.includes(origin)) {
      score += 8;
      reasons.push("Origin coverage");
    }

    if (requestText.includes("africa") && coverage.includes("africa")) {
      score += 10;
      reasons.push("Africa route coverage");
    }

    if (requestText.includes("remote") || requestText.includes("digital")) {
      if (coverage.includes("remote") || coverage.includes("digital")) {
        score += 12;
        reasons.push("Digital work coverage");
      }
    }

    if (["car", "motorbike", "ride_hailing", "mixed"].includes(partner.transport_access)) {
      score += 5;
      reasons.push("Transport access recorded");
    }

    score += Math.min(15, Math.round(Number(partner.provenance_score || 25) / 7));

    return {
      partner,
      score: Math.min(100, score),
      reasons: reasons.length ? reasons : ["Coverage needs review"],
      blockers,
      eligible: eligibility.eligible,
      eligibilityLabel: eligibility.label,
    };
  }

  function matchRecommendations(request) {
    return currentPartners
      .map((partner) => matchScore(request, partner))
      .sort((left, right) => {
        if (left.eligible !== right.eligible) return left.eligible ? -1 : 1;
        return right.score - left.score;
      })
      .slice(0, 3);
  }

  function renderMatchRecommendations(request) {
    const recommendations = matchRecommendations(request);
    const route = routeLabel(request);

    if (!recommendations.length) {
      return `
        <section class="mt-5 rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
          <p class="font-label text-xs uppercase tracking-[0.18em] text-tertiary">Autopilot match suggestions</p>
          <p class="mt-2 text-sm leading-6 text-on-surface-variant">No field-partner applications are loaded yet. AI can draft outreach, but it cannot assign receivers without vetted, ID-verified coverage.</p>
        </section>
      `;
    }

    const cards = recommendations
      .map(({ partner, score, reasons, blockers, eligible, eligibilityLabel }) => {
        const tone = eligible ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-400/20 text-amber-800";
        return `
          <article class="rounded-2xl border border-outline-variant/30 bg-white/72 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <strong class="font-label text-on-surface">${escapeHtml(partner.partner_code || partner.full_name || "Partner")}</strong>
              <span class="rounded-full px-3 py-1 font-label text-xs ${tone}">${escapeHtml(score)}% ${escapeHtml(eligibilityLabel)}</span>
            </div>
            <p class="mt-2 text-xs leading-5 text-on-surface-variant">${escapeHtml(partner.kenya_base || "Base pending")} / ${escapeHtml(partner.service_regions || "Coverage pending")}</p>
            <p class="mt-2 text-xs leading-5 text-on-surface-variant">${escapeHtml(reasons.join(" / "))}</p>
            ${blockers.length ? `<p class="mt-2 text-xs font-bold text-amber-800">Blocked: ${escapeHtml(blockers.join(", "))}</p>` : ""}
          </article>
        `;
      })
      .join("");

    return `
      <section class="mt-5 rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
        <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="font-label text-xs uppercase tracking-[0.18em] text-tertiary">Autopilot match suggestions</p>
            <h3 class="mt-1 font-display text-xl font-extrabold">Best field-partner fit for ${escapeHtml(route)}</h3>
            <p class="mt-2 text-sm leading-6 text-on-surface-variant">AI can rank and draft assignment notes. AI does not assign receivers, approve ID, or clear legal/customs risk without provider evidence or founder approval.</p>
          </div>
          <a class="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" href="admin-verification.html">Open vetting</a>
        </div>
        <div class="mt-4 grid gap-3 lg:grid-cols-3">
          ${cards}
        </div>
      </section>
    `;
  }

  function setStatus(message, tone = "text-on-surface-variant") {
    opsStatus.textContent = message;
    opsStatus.className = `mt-4 min-h-6 text-sm ${tone}`.trim();
  }

  function setLoginStatus(message, tone = "text-on-surface-variant") {
    loginStatus.textContent = message;
    loginStatus.className = `min-h-6 text-sm ${tone}`.trim();
  }

  function isLocalHost() {
    return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  }

  function showAuth(show) {
    authPanel.hidden = !show;
  }

  function setStat(id, value) {
    const node = document.querySelector(id);
    if (node) node.textContent = String(value);
  }

  function openRequests() {
    return currentRequests.filter((request) => !closedStatuses.has(request.status));
  }

  function paymentRequests() {
    return openRequests().filter(
      (request) =>
        (!paidStatuses.has(request.payment_status) && request.quote_amount) ||
        (isOverdue(request.payment_due_at) && !paidStatuses.has(request.payment_status)),
    );
  }

  function exceptionRequests() {
    return openRequests().filter((request) => requestFlags(request).length > 0);
  }

  function updateFilterUi() {
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === currentFilter;
      button.className = active
        ? "ops-filter rounded-full bg-on-surface px-4 py-2 font-label text-sm font-bold text-white"
        : "ops-filter rounded-full border border-outline-variant/50 bg-white/70 px-4 py-2 font-label text-sm font-bold text-on-surface-variant";
    });
  }

  function copyQuoteText(request, flags) {
    const topMatch = matchRecommendations(request)[0];
    return [
      `Swadakta request ${request.request_code}`,
      `Client: ${request.client_name || "Client"}`,
      `Route: ${routeLabel(request)}`,
      `Task: ${taskLabel(request)}`,
      `Status: ${formatStatus(request.status)} / payment ${formatStatus(request.payment_status)}`,
      `Quote: ${formatMoney(request.quote_amount, request.quote_currency || request.preferred_currency || "AUD")}`,
      `Funds guard: ${formatStatus(request.funds_status || "not_collected")}`,
      topMatch
        ? `Top match: ${topMatch.partner.partner_code || topMatch.partner.full_name || "Partner"} (${topMatch.score}%, ${topMatch.eligibilityLabel}) - ${topMatch.reasons.join("; ")}`
        : "Top match: no partner applications loaded yet",
      `Founder note: ${nextAction(request, flags)}`,
      "Protected decisions are not delegated to AI: paid status, ID approval, assignment, and payout release require provider evidence or founder/admin approval.",
    ].join("\n");
  }

  function paymentResultMessage(rail, result) {
    const payload = result?.data || {};
    const link = payload.url ? ` Link: ${payload.url}` : "";
    const reference = payload.provider_reference || payload.checkout_request_id || payload.id || "";
    return `${paymentRailLabel(rail)} prepared.${reference ? ` Reference: ${reference}.` : ""}${link} Provider confirmation is still required before funds are marked paid or released.`;
  }

  function renderPaymentRoutePanel(request) {
    const preferredRail = preferredPaymentRail(request);
    const currency = normalizeCurrency(request.quote_currency || request.preferred_currency);
    const rails = ["stripe", "paypal", "mpesa", "wise"];
    const buttons = rails
      .map((rail) => {
        const enabled = railEnabled(request, rail);
        const preferred = rail === preferredRail;
        const classes = enabled
          ? preferred
            ? "bg-primary text-white shadow-[0_14px_30px_rgba(70,72,212,0.18)]"
            : "border border-outline-variant/50 bg-white/72 text-primary"
          : "border border-outline-variant/40 bg-white/40 text-on-surface-variant opacity-60";
        return `<button class="payment-route rounded-full px-4 py-2 font-label text-sm font-bold ${classes}" data-rail="${rail}" type="button" ${enabled ? "" : "disabled"}>${escapeHtml(paymentRailLabel(rail))}</button>`;
      })
      .join("");

    return `
      <section class="mt-5 rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
        <div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p class="font-label text-xs uppercase tracking-[0.18em] text-primary">Payment route</p>
            <h3 class="mt-1 font-display text-xl font-extrabold">${escapeHtml(paymentRailLabel(preferredRail))}</h3>
            <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(paymentRailNote(request))}</p>
            <p class="mt-2 text-xs text-on-surface-variant">Quote ${escapeHtml(formatMoney(request.quote_amount, currency))}. AI can draft payment wording, but it cannot mark funds paid, refund, release, or override provider evidence.</p>
          </div>
          <label class="grid gap-2 font-label text-sm text-on-surface-variant lg:min-w-[18rem]">
            M-Pesa phone
            <input class="payment-mpesa-phone glass-input h-11 rounded-2xl px-4 font-body text-on-surface" type="tel" value="${escapeHtml(request.local_contact_phone || request.whatsapp || "")}" placeholder="+2547..." />
          </label>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          ${buttons}
        </div>
        <p class="payment-route-status mt-3 min-h-6 text-sm text-on-surface-variant" role="status"></p>
      </section>
    `;
  }

  function renderRequest(request) {
    const flags = requestFlags(request);
    const requestMargin = margin(request);
    const currency = request.quote_currency || request.preferred_currency || "AUD";
    const flagBadges = flags.length
      ? flags
          .map(
            ([label, kind]) =>
              `<span class="rounded-full px-3 py-1 font-label text-xs ${
                kind === "payment" || kind === "margin" || kind === "money"
                  ? "bg-amber-400/20 text-amber-800"
                  : kind === "identity" || kind === "compliance"
                    ? "bg-error-container text-on-error-container"
                    : "bg-primary/10 text-primary"
              }">${escapeHtml(label)}</span>`,
          )
          .join("")
      : `<span class="rounded-full bg-emerald-500/10 px-3 py-1 font-label text-xs text-emerald-700">Routine</span>`;

    return `
      <article class="rounded-3xl border border-outline-variant/30 bg-white/62 p-5" data-request-id="${escapeHtml(request.id)}">
        <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <strong class="font-display text-2xl">${escapeHtml(request.request_code || "Request")}</strong>
              ${flagBadges}
            </div>
            <p class="mt-2 text-sm leading-6 text-on-surface-variant">
              ${escapeHtml(request.client_name || "Client")} / ${escapeHtml(routeLabel(request))} / ${escapeHtml(taskLabel(request))}
            </p>
            <p class="mt-3 text-sm leading-6 text-on-surface-variant">${escapeHtml(nextAction(request, flags))}</p>
          </div>
          <div class="grid gap-2 text-sm text-on-surface-variant sm:grid-cols-2 lg:min-w-[22rem]">
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Status</strong>${escapeHtml(formatStatus(request.status))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Payment</strong>${escapeHtml(formatStatus(request.payment_status))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Quote</strong>${escapeHtml(formatMoney(request.quote_amount, currency))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Margin</strong>${escapeHtml(formatMoney(requestMargin, currency))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Due</strong>${escapeHtml(formatDate(request.payment_due_at))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Funds</strong>${escapeHtml(formatStatus(request.funds_status))}</span>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button class="copy-request rounded-full border border-outline-variant/50 bg-white/72 px-4 py-2 font-label text-sm font-bold text-primary" data-request-id="${escapeHtml(request.id)}" type="button">Copy founder brief</button>
          <a class="rounded-full border border-outline-variant/50 bg-white/72 px-4 py-2 font-label text-sm font-bold text-on-surface-variant" href="tracking.html">Open tracking</a>
          <a class="rounded-full bg-primary px-4 py-2 font-label text-sm font-bold text-white" href="assistant.html">Ask AI</a>
        </div>
        ${renderMatchRecommendations(request)}
        ${renderPaymentRoutePanel(request)}
      </article>
    `;
  }

  function renderQueue() {
    updateFilterUi();
    const open = openRequests();
    const exceptions = exceptionRequests();
    const payments = paymentRequests();
    const marginRisk = open.filter((request) => request.quote_amount && margin(request) <= 0);
    setStat("#stat-open", open.length);
    setStat("#stat-exceptions", exceptions.length);
    setStat("#stat-payments", payments.length);
    setStat("#stat-margin", marginRisk.length);
    renderOpsAutopilot();

    const visible =
      currentFilter === "all" ? open : currentFilter === "payments" ? payments : exceptions.length ? exceptions : open;

    if (!visible.length) {
      opsList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No live requests matched this filter. Routine work can stay with AI/autopilot until a protected decision appears.</div>`;
      return;
    }

    opsList.innerHTML = visible.map(renderRequest).join("");
  }

  function resolutionTone(item) {
    const issue = String(item.issue_type || "").toLowerCase();
    const status = String(item.status || "").toLowerCase();
    if (status === "resolved" || status === "closed") return "bg-emerald-500/10 text-emerald-700";
    if (["payment_refund", "payment_dispute"].includes(issue)) return "bg-amber-400/20 text-amber-800";
    if (["receiver_safety", "restricted_item"].includes(issue) || item.severity === "safety" || item.severity === "legal") {
      return "bg-error-container text-on-error-container";
    }
    return "bg-primary/10 text-primary";
  }

  function renderResolutionCase(item) {
    const statusOptions = [
      ["needs_evidence", "Needs evidence"],
      ["waiting_party", "Waiting party"],
      ["provider_review", "Provider review"],
      ["founder_review", "Founder review"],
      ["resolved", "Resolved"],
      ["closed", "Closed"],
    ];
    const statusButtons = statusOptions
      .map(
        ([status, label]) =>
          `<button class="resolution-status-button rounded-full border border-outline-variant/50 bg-white/72 px-3 py-1.5 font-label text-xs font-bold text-primary" data-resolution-code="${escapeHtml(item.resolution_code)}" data-resolution-status="${status}" type="button">${escapeHtml(label)}</button>`,
      )
      .join("");

    return `
      <article class="rounded-3xl border border-outline-variant/30 bg-white/62 p-5">
        <div class="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <strong class="font-display text-2xl">${escapeHtml(item.resolution_code || "Resolution")}</strong>
              <span class="rounded-full px-3 py-1 font-label text-xs ${resolutionTone(item)}">${escapeHtml(formatStatus(item.status))}</span>
              ${
                item.founder_review_required
                  ? '<span class="rounded-full bg-tertiary/10 px-3 py-1 font-label text-xs text-tertiary">Founder review required</span>'
                  : '<span class="rounded-full bg-primary/10 px-3 py-1 font-label text-xs text-primary">AI triage first</span>'
              }
            </div>
            <p class="mt-2 text-sm leading-6 text-on-surface-variant">
              ${escapeHtml(item.request_code)} / ${escapeHtml(formatStatus(item.issue_type))} / ${escapeHtml(formatStatus(item.desired_outcome))}
            </p>
            <p class="mt-3 text-sm leading-6 text-on-surface-variant">${escapeHtml(item.ai_triage || "Triage pending.")}</p>
          </div>
          <div class="grid gap-2 text-sm text-on-surface-variant lg:min-w-[17rem]">
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Severity</strong>${escapeHtml(formatStatus(item.severity))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Payment action</strong>${escapeHtml(formatStatus(item.payment_action_requested || "none"))}</span>
            <span class="rounded-2xl bg-white/70 p-3"><strong class="block text-on-surface">Updated</strong>${escapeHtml(formatDateTime(item.updated_at))}</span>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          ${statusButtons}
          <a class="rounded-full bg-primary px-3 py-1.5 font-label text-xs font-bold text-white" href="assistant.html">Ask AI</a>
        </div>
      </article>
    `;
  }

  function renderResolutionCases() {
    if (!resolutionList) return;

    if (!currentResolutionCases.length) {
      resolutionList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No resolution cases yet. User issues will appear here after they are opened from tracking or Account Home.</div>`;
      renderOpsAutopilot();
      return;
    }

    resolutionList.innerHTML = currentResolutionCases.map(renderResolutionCase).join("");
    renderOpsAutopilot();
  }

  async function loadOps() {
    showAuth(false);
    opsMode.textContent = "Loading operations";
    opsList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">Loading live requests...</div>`;

    try {
      const sessionResult = await data.getSession();
      if (!sessionResult.session && sessionResult.mode !== "local") {
        emailInput.value = window.SWADAKTA_CONFIG?.adminEmail || "";
        showAuth(true);
        opsMode.textContent = "Sign in needed";
        setStatus("Sign in as a Swadakta admin to view live operations.");
        opsList.innerHTML = "";
        return;
      }

      try {
        await data.getOperationsReadiness();
      } catch (readinessError) {
        if (!isLocalHost()) {
          throw readinessError;
        }
        setStatus("Local static mode cannot call the Vercel readiness API; loading requests through Supabase/RLS instead.");
      }

      const [requestResult, partnerResult, resolutionResult] = await Promise.all([
        data.listRequests(),
        data.listPartnerApplications().catch((error) => ({ data: [], error })),
        data.listResolutionCases().catch((error) => ({ data: [], error })),
      ]);
      currentRequests = requestResult.data || [];
      currentPartners = partnerResult.data || [];
      currentResolutionCases = resolutionResult.data || [];
      opsMode.textContent = requestResult.mode === "local" ? "Local demo requests" : "Live production requests";
      setStatus(`Updated ${new Date().toLocaleString()}. Showing protected-decision exceptions first.`);
      renderQueue();
      renderResolutionCases();
      if (partnerResult.error) {
        setStatus(`Updated ${new Date().toLocaleString()}. Partner matching is limited: ${partnerResult.error.message || "could not load partner applications"}.`, "text-on-surface-variant");
      }
      if (resolutionResult.error && resolutionList) {
        resolutionList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(resolutionResult.error.message || "Could not load resolution cases.")}</div>`;
      }
    } catch (error) {
      const message = error.message || "Could not load operations.";
      if (/admin/i.test(message)) {
        opsMode.textContent = "Admin permission required";
        opsList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">This account is signed in, but it is not listed as a Swadakta admin yet.</div>`;
        return;
      }
      showAuth(true);
      opsMode.textContent = "Needs attention";
      setStatus(message, "text-on-error-container");
      opsList.innerHTML = "";
      if (resolutionList) resolutionList.innerHTML = "";
    }
  }

  async function handlePaymentRoute(button) {
    const article = button.closest("[data-request-id]");
    const request = currentRequests.find((item) => item.id === article?.dataset.requestId);
    const rail = button.dataset.rail || "";
    const status = article?.querySelector(".payment-route-status");
    const original = button.textContent;

    if (!request || !rail) return;

    button.disabled = true;
    button.textContent = "Preparing...";
    if (status) {
      status.textContent = `Preparing ${paymentRailLabel(rail)}. This does not mark funds paid or release money.`;
      status.className = "payment-route-status mt-3 min-h-6 text-sm text-primary";
    }

    try {
      const updates = {
        mpesa_phone: article.querySelector(".payment-mpesa-phone")?.value.trim() || "",
      };
      let result;

      if (rail === "stripe") {
        result = await data.createStripeCheckoutSession(request, updates);
      } else if (rail === "paypal") {
        result = await data.createPayPalOrder(request, updates);
      } else if (rail === "mpesa") {
        result = await data.createMpesaStkPush(request, updates);
      } else if (rail === "wise") {
        result = await data.createWisePaymentRequest(request, updates);
      } else {
        throw new Error("Unknown payment rail.");
      }

      const payload = result.data || {};
      if (rail !== "mpesa") {
        await data.updateRequest(request.id, {
          payment_status: payload.payment_status || "invoice_sent",
          funds_status: payload.funds_status || "payment_link_sent",
          payment_link: payload.url || request.payment_link || "",
          payment_reference: payload.provider_reference || payload.id || request.payment_reference || "",
          release_notes:
            payload.release_notes ||
            `${paymentRailLabel(rail)} prepared. Provider confirmation is required before funds are marked paid or released.`,
        });
      }

      const message = paymentResultMessage(rail, result);
      setStatus(message, "text-primary");
      if (status) status.textContent = message;
      await loadOps();
    } catch (error) {
      const message = error.message || `Could not prepare ${paymentRailLabel(rail)}.`;
      if (status) {
        status.textContent = message;
        status.className = "payment-route-status mt-3 min-h-6 text-sm text-on-error-container";
      }
      setStatus(message, "text-on-error-container");
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setLoginStatus("Enter the admin email and password.", "text-on-error-container");
      return;
    }

    setLoginStatus("Signing in...");
    try {
      await data.signInWithPassword(email, password);
      passwordInput.value = "";
      setLoginStatus("Signed in. Loading operations.", "text-primary");
      await loadOps();
    } catch (error) {
      setLoginStatus(error.message || "Sign-in failed.", "text-on-error-container");
    }
  });

  signOutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await data.signOut();
      await loadOps();
    });
  });

  refreshButton?.addEventListener("click", loadOps);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter || "exceptions";
      renderQueue();
    });
  });

  copyOpsAutopilotButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(opsAutopilotPrompt());
      setStatus("Copied daily AI operations brief.", "text-primary");
    } catch {
      setStatus("Could not copy the daily operations brief.", "text-on-error-container");
    }
  });

  document.addEventListener("click", async (event) => {
    const paymentButton = event.target.closest(".payment-route");
    if (paymentButton) {
      await handlePaymentRoute(paymentButton);
      return;
    }

    const button = event.target.closest(".copy-request");
    if (!button) return;
    const request = currentRequests.find((item) => item.id === button.dataset.requestId);
    if (!request) return;
    const flags = requestFlags(request);
    try {
      await navigator.clipboard.writeText(copyQuoteText(request, flags));
      setStatus(`Copied founder brief for ${request.request_code}.`, "text-primary");
    } catch {
      setStatus("Could not copy. Open the request and copy manually.", "text-on-error-container");
    }
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".resolution-status-button");
    if (!button) return;
    const resolutionCode = button.dataset.resolutionCode || "";
    const status = button.dataset.resolutionStatus || "";
    if (!resolutionCode || !status) return;

    button.disabled = true;
    try {
      await data.updateResolutionCase(resolutionCode, {
        status,
        admin_notes: `Founder ops set status to ${formatStatus(status)} at ${new Date().toISOString()}.`,
      });
      setStatus(`Updated resolution case ${resolutionCode}.`, "text-primary");
      const result = await data.listResolutionCases();
      currentResolutionCases = result.data || [];
      renderResolutionCases();
    } catch (error) {
      setStatus(error.message || "Could not update resolution case.", "text-on-error-container");
    } finally {
      button.disabled = false;
    }
  });

  loadOps();
})();
