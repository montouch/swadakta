(function () {
  const form = document.querySelector("#tracking-form");
  const resultEl = document.querySelector("#tracking-result");
  const codeInput = document.querySelector("#tracking-code");
  const contactInput = document.querySelector("#tracking-contact");
  const title = document.querySelector("#tracking-title");
  const codeLabel = document.querySelector("#tracking-code-label");
  const assignee = document.querySelector("#tracking-assignee");
  const messageLink = document.querySelector("#tracking-message-link");
  const resolutionLink = document.querySelector("#tracking-resolution-link");
  const paymentAnchor = document.querySelector("#tracking-payment-link");
  const securePaymentLink = document.querySelector("#tracking-secure-payment-link");
  const jobRoomLink = document.querySelector("#tracking-job-room-link");
  const quoteAmount = document.querySelector("#tracking-quote-amount");
  const fundsStatus = document.querySelector("#tracking-funds-status");
  const protectedAmount = document.querySelector("#tracking-protected-amount");
  const releaseCondition = document.querySelector("#tracking-release-condition");
  const paymentRail = document.querySelector("#tracking-payment-rail");
  const paymentRailCopy = document.querySelector("#tracking-payment-rail-copy");
  const paymentEvidence = document.querySelector("#tracking-payment-evidence");
  const paymentNextAction = document.querySelector("#tracking-payment-next-action");
  const paymentBoundary = document.querySelector("#tracking-payment-boundary");
  const paymentRisk = document.querySelector("#tracking-payment-risk");
  const milestonesEl = document.querySelector("#tracking-milestones");
  const proofChecklist = document.querySelector("#tracking-proof-checklist");
  const resolutionSummary = document.querySelector("#tracking-resolution-summary");
  const resolutionCases = document.querySelector("#tracking-resolution-cases");
  const resolutionOpenLink = document.querySelector("#tracking-resolution-open-link");
  const reportSummary = document.querySelector("#tracking-report-summary");
  const mediaLinks = document.querySelector("#tracking-media-links");
  const returnHint = document.querySelector("#tracking-return-hint");
  const returnIcon = document.querySelector("#tracking-return-icon");
  const returnEyebrow = document.querySelector("#tracking-return-eyebrow");
  const returnTitle = document.querySelector("#tracking-return-title");
  const returnCopy = document.querySelector("#tracking-return-copy");
  const returnPortalLink = document.querySelector("#tracking-return-portal-link");
  const controlPanel = document.querySelector("#tracking-job-control-panel");
  const controlTitle = document.querySelector("#tracking-control-title");
  const controlCopy = document.querySelector("#tracking-control-copy");
  const controlOwner = document.querySelector("#tracking-control-owner");
  const controlNext = document.querySelector("#tracking-control-next");
  const controlAi = document.querySelector("#tracking-control-ai");
  const controlStop = document.querySelector("#tracking-control-stop");
  const controlPlace = document.querySelector("#tracking-control-place");
  const controlPrimaryLink = document.querySelector("#tracking-control-primary-link");
  const controlAiLink = document.querySelector("#tracking-control-ai-link");

  if (!form || !window.SwadaktaData) return;

  const releasedStates = new Set(["released", "refunded", "completed"]);
  const activeStates = new Set([
    "ready",
    "quoted",
    "payment_link_sent",
    "invoice_sent",
    "authorized",
    "held_by_provider",
    "deposit_confirmed",
    "funded",
    "ready_to_release",
    "partially_released",
    "paid",
    "in_progress",
  ]);
  const alertStates = new Set(["disputed", "refund_pending", "cancelled", "rejected", "failed"]);
  const protectedFundStates = new Set([
    "authorized",
    "held_by_provider",
    "deposit_confirmed",
    "partially_released",
    "released",
  ]);
  const paymentReturnLabels = {
    success: { icon: "verified", eyebrow: "Stripe checkout", title: "Payment return received" },
    cancelled: { icon: "undo", eyebrow: "Stripe checkout", title: "Payment was not completed" },
    "paypal-success": { icon: "verified", eyebrow: "PayPal order", title: "PayPal approval returned" },
    "paypal-cancelled": { icon: "undo", eyebrow: "PayPal order", title: "PayPal was not completed" },
  };

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

  function setResult(message, tone = "") {
    resultEl.textContent = message;
    resultEl.className = `md:col-span-3 font-label-md text-label-md min-h-6 ${tone}`.trim();
  }

  function formatStatus(value, fallback = "new") {
    return String(value || fallback)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function numberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function formatMoney(amount, currency = "AUD", fallback = "Shown after quote") {
    const number = numberValue(amount);
    if (number <= 0) return fallback;
    return `${String(currency || "AUD").toUpperCase()} ${Math.round(number).toLocaleString()}`;
  }

  function safeHttpUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function setPaymentLink(href) {
    if (!securePaymentLink) return;
    if (!href) {
      securePaymentLink.classList.add("hidden");
      securePaymentLink.classList.remove("inline-flex");
      securePaymentLink.href = "#";
      return;
    }

    securePaymentLink.href = href;
    securePaymentLink.classList.remove("hidden");
    securePaymentLink.classList.add("inline-flex");
  }

  function inferPaymentRail(request) {
    const preference = String(request.payment_method_preference || "").toLowerCase();
    const reference = String(request.payment_reference || request.provider_reference || "").toLowerCase();
    const link = String(request.payment_link || "").toLowerCase();
    const currency = String(request.quote_currency || "").toUpperCase();

    if (preference && preference !== "discuss") return preference;
    if (reference.includes("stripe") || link.includes("stripe") || link.includes("checkout")) return "card";
    if (reference.includes("paypal") || link.includes("paypal")) return "paypal";
    if (reference.includes("mpesa") || reference.includes("m-pesa") || currency === "KES") return "mpesa";
    if (reference.includes("wise") || link.includes("wise")) return "wise";
    if (reference.includes("bank") || reference.includes("transfer")) return "bank";
    return "discuss";
  }

  function paymentRailCopyFor(method) {
    const rails = {
      card: {
        label: "Stripe / card checkout",
        copy: "Use the secure checkout link. Card details stay with the payment provider, not in Swadakta chat.",
        evidence: "Stripe session or PaymentIntent",
      },
      paypal: {
        label: "PayPal order or invoice",
        copy: "Use the PayPal approval or invoice link. Swadakta waits for provider confirmation before treating funds as protected.",
        evidence: "PayPal order, capture, or invoice ID",
      },
      mpesa: {
        label: "M-Pesa KES collection",
        copy: "Use the configured M-Pesa STK/Paybill route for KES jobs. Work should wait for callback or receipt confirmation.",
        evidence: "M-Pesa receipt or CheckoutRequestID",
      },
      wise: {
        label: "Wise fallback request",
        copy: "Wise is a back-office fallback after simpler rails are unsuitable or fail. It needs receipt or statement reconciliation before funds count as protected.",
        evidence: "Wise transfer reference",
      },
      bank: {
        label: "Bank transfer reference",
        copy: "Bank transfer is manual. Swadakta needs a matching receipt or statement line before work continues as funded.",
        evidence: "Bank receipt or statement line",
      },
      discuss: {
        label: "Quote-first rail selection",
        copy: "Swadakta chooses the payment rail after quote, corridor, currency, value, and compliance checks are clear.",
        evidence: "Provider reference pending",
      },
    };

    return rails[method] || rails.discuss;
  }

  function nextPaymentAction(request, method) {
    const funds = String(request.funds_status || "not_collected").toLowerCase();
    const payment = String(request.payment_status || "unquoted").toLowerCase();
    const hasQuote = numberValue(request.quote_amount) > 0;
    const hasLink = Boolean(safeHttpUrl(request.payment_link));
    const protectedFunds = protectedFundStates.has(funds);

    if (["disputed", "refund_pending", "refunded"].includes(funds) || payment === "refunded") {
      return "This is an exception case. Founder/admin review handles refunds, disputes, or reversals before any receiver payout.";
    }
    if (funds === "released" || request.status === "completed") {
      return "Funds are marked released or the job is complete. Review and proof history stay visible for the record.";
    }
    if (!hasQuote) {
      return "Wait for Swadakta to confirm scope, route legality, proof requirements, and a quote before paying.";
    }
    if (!protectedFunds && hasLink) {
      return method === "wise" || method === "bank"
        ? "Pay only if Swadakta has intentionally sent this fallback route, then keep the exact reference for reconciliation."
        : "Use the secure provider link, then wait for Swadakta to confirm the provider reference before receiver work starts.";
    }
    if (!protectedFunds) {
      return "Payment instructions are being prepared. Do not send money to a personal number unless Swadakta records it as the approved rail.";
    }
    if (funds === "partially_released") {
      return "Some milestone money has been released. Remaining releases still need proof review and client-safe reporting.";
    }
    return "Funds are protected or confirmed. Next is operator assignment, proof collection, and milestone review before any release.";
  }

  function paymentBoundaryCopy(request) {
    const funds = String(request.funds_status || "not_collected").toLowerCase();
    if (funds === "held_by_provider") {
      return "Funds may be held by a payment provider, but Swadakta still releases receiver payouts only after proof is reviewed.";
    }
    if (funds === "authorized") {
      return "Authorization is not the same as final payout. Work and release decisions stay gated by proof and risk checks.";
    }
    if (funds === "deposit_confirmed") {
      return "Deposit confirmed. Receiver payout is still staged by milestones, proof quality, and admin/founder approval.";
    }
    return request.release_condition || "Receiver payout happens only after proof review and milestone approval.";
  }

  function renderPaymentRailPlan(request = {}) {
    const method = inferPaymentRail(request);
    const rail = paymentRailCopyFor(method);
    const funds = String(request.funds_status || "not_collected").toLowerCase();
    const protectedFunds = protectedFundStates.has(funds);

    if (paymentRail) paymentRail.textContent = rail.label;
    if (paymentRailCopy) paymentRailCopy.textContent = rail.copy;
    if (paymentEvidence) {
      paymentEvidence.textContent = protectedFunds ? "Evidence recorded" : rail.evidence;
      paymentEvidence.className = `inline-flex min-h-10 px-4 items-center justify-center rounded-full font-label-md ${
        protectedFunds ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
      }`.trim();
    }
    if (paymentNextAction) paymentNextAction.textContent = nextPaymentAction(request, method);
    if (paymentBoundary) paymentBoundary.textContent = paymentBoundaryCopy(request);
    if (paymentRisk) {
      paymentRisk.textContent =
        method === "wise"
          ? "Wise stays hidden as a fallback rail because it adds manual reconciliation. AI can draft notes, but it cannot mark Wise funds paid or release milestones."
          : "AI can explain and draft updates, but it cannot mark money paid, assign a receiver, or release/refund funds.";
    }
  }

  function requestHasProof(request = {}) {
    return Boolean(
      request.client_report ||
        request.client_report_url ||
        (Array.isArray(request.proof_links) && request.proof_links.length),
    );
  }

  function extractPlaceIntelligence(request = {}) {
    const notes = String(request.notes || request.logistics_notes || "");
    if (!notes.includes("Place intelligence:") && !notes.includes("Weather now:")) return "";
    const lines = notes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) =>
        /^(Place intelligence|Weather now|Planning note|Receiver must still check)/i.test(line),
      );
    return lines.slice(0, 4).join(" ");
  }

  function workflowDecision(request = {}) {
    const status = String(request.status || "new").toLowerCase();
    const payment = String(request.payment_status || "unquoted").toLowerCase();
    const funds = String(request.funds_status || "not_collected").toLowerCase();
    const verification = String(request.verification_status || request.identity_verification_status || "required").toLowerCase();
    const compliance = String(request.compliance_status || "").toLowerCase();
    const hasQuote = numberValue(request.quote_amount) > 0;
    const hasPaymentLink = Boolean(safeHttpUrl(request.payment_link));
    const protectedFunds = protectedFundStates.has(funds) || payment === "paid";
    const hasProof = requestHasProof(request);
    const blockedCompliance = Boolean(request.admin_review_required) || ["needs_admin_review", "restricted", "permit_required", "prohibited", "needs_ai_review"].includes(compliance);

    if (["cancelled", "rejected"].includes(status) || ["cancelled", "failed", "refunded"].includes(payment) || ["cancelled", "failed", "refunded"].includes(funds)) {
      return {
        owner: "Founder review",
        ownerTone: "bg-error-container text-on-error-container",
        title: "Exception or cancelled request",
        copy: "Do not continue paid work until Swadakta resolves the payment, refund, or cancellation state.",
        next: "Open an issue or wait for Swadakta to confirm the next written decision.",
        ai: "AI can summarize the timeline and draft a calm client/receiver update.",
        stop: "No new spending, operator assignment, refund, or payout until provider evidence is reviewed.",
        link: resolutionLink?.href || "resolution.html",
        linkLabel: "Open issue",
      };
    }

    if (blockedCompliance) {
      return {
        owner: "Rules check",
        ownerTone: "bg-tertiary/10 text-tertiary",
        title: "Rules or corridor review needed",
        copy: "This job may involve restricted goods, sensitive documents, route uncertainty, or founder approval.",
        next: "Use the job room to add missing facts, documents, item details, official references, and safety constraints.",
        ai: "AI can organize the facts and produce a rules checklist, but it cannot clear restricted work.",
        stop: "Do not buy, ship, pick up, or release funds until compliance is cleared.",
        link: jobRoomLink?.href || "messages.html",
        linkLabel: "Add facts",
      };
    }

    if (!hasQuote) {
      return {
        owner: "Swadakta quote",
        ownerTone: "bg-primary/10 text-primary",
        title: "Quote and scope are being prepared",
        copy: "The request exists, but the cost, payment rail, proof requirements, and receiver fit still need to be settled.",
        next: "Keep the brief complete. Add photos, links, budget comfort, deadline, and proof expectations in the job room.",
        ai: "AI can turn messy details into a clean operator brief and client-safe quote notes.",
        stop: "Do not pay or assign a receiver until a quote and approved payment rail are recorded.",
        link: jobRoomLink?.href || "messages.html",
        linkLabel: "Open job room",
      };
    }

    if (!protectedFunds) {
      return {
        owner: "Client action",
        ownerTone: "bg-primary-container/10 text-primary",
        title: "Payment evidence is the next gate",
        copy: hasPaymentLink
          ? "A payment route is available. Work should still wait for provider confirmation."
          : "A quote exists, but payment instructions or provider evidence are not ready yet.",
        next: hasPaymentLink
          ? "Use only the secure payment link shown on this page, then return here for provider-confirmed status."
          : "Wait for Swadakta to prepare Stripe, PayPal, M-Pesa, bank, or fallback instructions.",
        ai: "AI can explain the rail and draft a payment-status message.",
        stop: "Never send funds to an unrecorded personal account or release work based on screenshots alone.",
        link: hasPaymentLink ? securePaymentHrefOrFallback(request) : paymentsLinkHref(),
        linkLabel: hasPaymentLink ? "Open payment" : "Payment guide",
      };
    }

    if (!["verified", "approved"].includes(verification)) {
      return {
        owner: "Verification",
        ownerTone: "bg-amber-50 text-amber-700",
        title: "Receiver or account verification must finish",
        copy: "Funds may be protected, but paid work and sensitive tasks still require verified identity.",
        next: "Complete the provider ID/selfie check or wait for Swadakta to assign a verified receiver.",
        ai: "AI can explain what happens after verification is requested and draft a reminder.",
        stop: "AI cannot approve identity, assign sensitive work, or override provider evidence.",
        link: "verification.html?reason=receiver_work",
        linkLabel: "Open verification",
      };
    }

    if (!hasProof) {
      return {
        owner: "Receiver proof",
        ownerTone: "bg-tertiary/10 text-tertiary",
        title: "Work can move into proof collection",
        copy: "The next useful action is receiver execution with photos, video, voice notes, receipts, or official references.",
        next: "Use the job room to submit proof updates and keep communication tied to this request.",
        ai: "AI can draft receiver instructions, proof questions, and client updates.",
        stop: "No milestone payout until proof is reviewed against the agreed condition.",
        link: jobRoomLink?.href || "messages.html",
        linkLabel: "Open job room",
      };
    }

    if (!["completed", "released"].includes(status) && funds !== "released") {
      return {
        owner: "Proof review",
        ownerTone: "bg-primary/10 text-primary",
        title: "Proof is ready for milestone review",
        copy: "Client-safe proof is available. Swadakta should compare it to the release condition before any payout.",
        next: "Review the report/proof links, request clarification if needed, or open an issue if something is wrong.",
        ai: "AI can summarize proof and draft approval or clarification wording.",
        stop: "AI cannot release funds, refund, or mark a milestone complete without protected decision evidence.",
        link: mediaLinks?.querySelector("a")?.href || jobRoomLink?.href || "messages.html",
        linkLabel: "Review proof",
      };
    }

    return {
      owner: "Complete",
      ownerTone: "bg-emerald-50 text-emerald-700",
      title: "Request is in the closeout stage",
      copy: "Proof, payment, and release history stay available for records and future trust scoring.",
      next: "Leave a review when available, save the report, and open an issue only if something needs correction.",
      ai: "AI can summarize the completed job and prepare a repeat-job brief.",
      stop: "Historical records should not be edited outside the approved correction flow.",
      link: jobRoomLink?.href || "messages.html",
      linkLabel: "Open record",
    };
  }

  function securePaymentHrefOrFallback(request = {}) {
    return safeHttpUrl(request.payment_link) || "#payment-state";
  }

  function paymentsLinkHref() {
    return "payments.html";
  }

  function renderWorkflowControl(request = null) {
    if (!controlPanel || !controlTitle) return;

    if (!request) {
      if (controlTitle) controlTitle.textContent = "Open a request to see the next safe step";
      if (controlCopy) controlCopy.textContent = "Swadakta will separate what AI can draft, what a receiver can do, what the client should do, and what stays blocked until provider evidence or founder review.";
      if (controlOwner) {
        controlOwner.textContent = "Waiting for lookup";
        controlOwner.className = "inline-flex min-h-10 px-4 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant font-label-md";
      }
      if (controlNext) controlNext.textContent = "Enter the request code and original email or WhatsApp.";
      if (controlAi) controlAi.textContent = "Explain status and draft updates.";
      if (controlStop) controlStop.textContent = "No money release or ID approval by AI.";
      if (controlPlace) controlPlace.textContent = "Location weather, official-alert reminders, and field risks appear when the brief includes place intelligence.";
      if (controlPrimaryLink) {
        controlPrimaryLink.href = "messages.html";
        controlPrimaryLink.innerHTML = '<span class="material-symbols-outlined text-[20px] mr-2">forum</span>Open job room';
      }
      if (controlAiLink) controlAiLink.href = "assistant.html?context=tracking";
      return;
    }

    const decision = workflowDecision(request);
    const place = extractPlaceIntelligence(request);
    if (controlTitle) controlTitle.textContent = decision.title;
    if (controlCopy) controlCopy.textContent = decision.copy;
    if (controlOwner) {
      controlOwner.textContent = decision.owner;
      controlOwner.className = `inline-flex min-h-10 px-4 items-center justify-center rounded-full font-label-md ${decision.ownerTone}`.trim();
    }
    if (controlNext) controlNext.textContent = decision.next;
    if (controlAi) controlAi.textContent = decision.ai;
    if (controlStop) controlStop.textContent = decision.stop;
    if (controlPlace) {
      controlPlace.textContent =
        place ||
        `${request.task_location || request.kenya_location || request.destination_country || "Task location"}: confirm local access, weather, transport, opening hours, and official alerts before field work.`;
    }
    if (controlPrimaryLink) {
      controlPrimaryLink.href = decision.link || "messages.html";
      controlPrimaryLink.innerHTML = `<span class="material-symbols-outlined text-[20px] mr-2">${
        decision.linkLabel === "Open payment" ? "lock" : decision.linkLabel === "Open issue" ? "gavel" : "forum"
      }</span>${escapeHtml(decision.linkLabel || "Open job room")}`;
    }
    if (controlAiLink) {
      const url = new URL("assistant.html", window.location.href);
      url.searchParams.set("context", "tracking");
      url.searchParams.set("task", "Explain this request status");
      url.searchParams.set("links", "tracking,messages,payments,resolution,verification");
      url.searchParams.set(
        "prompt",
        [
          `Request ${request.request_code || codeInput.value.trim().toUpperCase()}`,
          decision.title,
          decision.next,
          place,
        ]
          .filter(Boolean)
          .join("\n")
          .slice(0, 1600),
      );
      controlAiLink.href = `${url.pathname}${url.search}`;
    }
  }

  function updateJobRoomLinks(code = codeInput.value.trim(), contact = contactInput.value.trim()) {
    const url = new URL("messages.html", window.location.href);
    if (code) url.searchParams.set("code", code.toUpperCase());
    if (contact) url.searchParams.set("contact", contact);
    const href = `${url.pathname}${url.search}`;
    if (messageLink) messageLink.href = href;
    if (jobRoomLink) jobRoomLink.href = href;

    if (resolutionLink) {
      const resolutionUrl = new URL("resolution.html", window.location.href);
      if (code) resolutionUrl.searchParams.set("code", code.toUpperCase());
      if (contact) resolutionUrl.searchParams.set("contact", contact);
      resolutionLink.href = `${resolutionUrl.pathname}${resolutionUrl.search}`;
      if (resolutionOpenLink) resolutionOpenLink.href = resolutionLink.href;
    }
  }

  function renderPaymentReturnHint(params) {
    if (!returnHint) return;

    const source = String(params.get("source") || "").toLowerCase();
    const paymentState = String(params.get("payment") || "").toLowerCase();
    const details = paymentReturnLabels[paymentState];
    const code = String(params.get("code") || codeInput.value || "")
      .trim()
      .toUpperCase();
    const contact = String(params.get("contact") || contactInput.value || "").trim();

    if (source !== "payment_return" && !details) {
      returnHint.classList.add("hidden");
      return;
    }

    returnHint.classList.remove("hidden");
    if (returnIcon) returnIcon.textContent = details?.icon || "lock";
    if (returnEyebrow) returnEyebrow.textContent = details?.eyebrow || "Payment return";
    if (returnTitle) returnTitle.textContent = details?.title || "Unlock request tracking";
    if (returnCopy) {
      returnCopy.textContent = contact
        ? "Tracking will open automatically with the contact already provided. Provider confirmation still controls protected-funds status."
        : code
          ? "Request code is prefilled from the payment return. Enter the email or WhatsApp used on the brief, then open the request so payment and proof details stay private."
          : "Enter the request code and original email or WhatsApp from the brief to unlock tracking.";
    }
    if (returnPortalLink) {
      const portalUrl = new URL("portal.html", window.location.href);
      if (paymentState) portalUrl.searchParams.set("payment", paymentState);
      if (code) portalUrl.searchParams.set("request_code", code);
      if (contact) portalUrl.searchParams.set("contact", contact);
      returnPortalLink.href = `${portalUrl.pathname}${portalUrl.search}`;
    }
  }

  function renderResolutionCaseRow(item) {
    const needsFounder = Boolean(item.founder_review_required);
    const tone =
      needsFounder || ["payment", "legal", "safety"].includes(String(item.severity || "").toLowerCase())
        ? "bg-tertiary/10 text-tertiary"
        : "bg-primary/10 text-primary";
    const created = item.created_at ? new Date(item.created_at).toLocaleDateString() : "Just opened";

    return `
      <article class="rounded-xl bg-white/50 border border-white/40 p-4">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p class="font-label-sm text-on-surface-variant uppercase tracking-[0.14em]">${escapeHtml(item.resolution_code || "Resolution")}</p>
            <p class="font-label-md text-on-surface mt-1">${escapeHtml(formatStatus(item.issue_type || "issue"))}</p>
          </div>
          <span class="inline-flex min-h-8 px-3 items-center rounded-full ${tone} font-label-sm">${escapeHtml(formatStatus(item.status || "ai_triage"))}</span>
        </div>
        <p class="text-sm text-on-surface-variant mt-3">${escapeHtml(item.ai_triage || "AI triage pending.")}</p>
        <div class="mt-3 flex flex-wrap gap-3 text-xs text-on-surface-variant">
          <span>Outcome: ${escapeHtml(formatStatus(item.desired_outcome || "explain_status"))}</span>
          <span>${needsFounder ? "Founder review required" : "AI triage first"}</span>
          <span>${escapeHtml(created)}</span>
        </div>
      </article>
    `;
  }

  function renderResolutionCases(cases = [], message = "") {
    if (!resolutionCases || !resolutionSummary) return;

    if (!cases.length) {
      resolutionSummary.textContent = message || "No open issues are attached to this request yet.";
      resolutionCases.innerHTML = `<p class="rounded-xl bg-white/40 px-4 py-3 text-sm text-on-surface-variant">${
        message ? escapeHtml(message) : "If something is wrong, open an issue from here so proof, payment, and decisions stay tied to this request."
      }</p>`;
      return;
    }

    const founderCount = cases.filter((item) => item.founder_review_required).length;
    resolutionSummary.textContent = `${cases.length} resolution case${cases.length === 1 ? "" : "s"} on this request. ${
      founderCount ? `${founderCount} need founder review.` : "Routine cases can stay in AI triage first."
    }`;
    resolutionCases.innerHTML = cases.map(renderResolutionCaseRow).join("");
  }

  async function loadResolutionCases(code, contact) {
    if (!resolutionCases || !window.SwadaktaData.listRequestResolutionCases) return;
    if (!code || !contact) {
      renderResolutionCases([], "Enter the request code and contact to load issue history.");
      return;
    }

    resolutionSummary.textContent = "Loading resolution cases...";
    resolutionCases.innerHTML = `<p class="rounded-xl bg-white/40 px-4 py-3 text-sm text-on-surface-variant">Checking issue history...</p>`;

    try {
      const result = await window.SwadaktaData.listRequestResolutionCases(code, contact);
      renderResolutionCases(result.data || []);
    } catch (error) {
      renderResolutionCases([], error.message || "Could not load resolution cases.");
    }
  }

  function milestoneVisual(status) {
    const cleanStatus = String(status || "planned").toLowerCase();
    if (releasedStates.has(cleanStatus)) {
      return {
        icon: "check_circle",
        iconClass: "text-primary fill-icon",
        rowClass: "bg-white/40 border border-white/20",
        labelClass: "text-primary",
      };
    }
    if (alertStates.has(cleanStatus)) {
      return {
        icon: "warning",
        iconClass: "text-error",
        rowClass: "bg-error-container/30 border border-error/20",
        labelClass: "text-error",
      };
    }
    if (activeStates.has(cleanStatus)) {
      return {
        icon: "verified",
        iconClass: "text-primary-container",
        rowClass: "bg-white rounded-xl border-2 border-primary/20 shadow-sm",
        labelClass: "text-primary-container",
      };
    }
    return {
      icon: "schedule",
      iconClass: "text-outline",
      rowClass: "bg-white/40 border border-white/20",
      labelClass: "text-on-surface-variant",
    };
  }

  function milestoneAmount(milestone) {
    const amount = formatMoney(milestone.amount, milestone.currency, "");
    const released = formatMoney(milestone.released_amount, milestone.currency, "");
    if (amount && released && milestone.release_status !== "released") return `${released} of ${amount}`;
    return amount || "";
  }

  function renderMilestoneRow(milestone) {
    const visual = milestoneVisual(milestone.release_status);
    const amount = milestoneAmount(milestone);
    const trigger = milestone.release_trigger || milestone.release_condition || "";
    const dueDate = milestone.due_at ? `Due ${new Date(milestone.due_at).toLocaleDateString()}` : "";
    const detail = [amount, trigger, dueDate].filter(Boolean).join(" / ");

    return `
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl ${visual.rowClass}">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined ${visual.iconClass}">${visual.icon}</span>
          <div>
            <span class="font-body-md font-semibold">${escapeHtml(milestone.title || "Milestone")}</span>
            ${detail ? `<p class="text-xs text-on-surface-variant mt-1">${escapeHtml(detail)}</p>` : ""}
          </div>
        </div>
        <span class="font-label-md ${visual.labelClass}">${escapeHtml(formatStatus(milestone.release_status || "planned"))}</span>
      </div>
    `;
  }

  function defaultMilestones(request) {
    const paymentState = request.funds_status || request.payment_status || "not_collected";
    const proofReady = Boolean(request.client_report || request.client_report_url || (request.proof_links || []).length);

    return [
      {
        title: "Brief accepted and quote prepared",
        amount: request.quote_amount,
        currency: request.quote_currency,
        release_status: numberValue(request.quote_amount) > 0 ? "ready" : "planned",
        release_trigger: "Quote appears here before any work starts.",
      },
      {
        title: "Payment protected before work starts",
        amount: request.protected_amount || request.quote_amount,
        currency: request.quote_currency,
        release_status: paymentState,
        release_trigger: "Use the secure provider link or recorded provider reference.",
      },
      {
        title: "Proof review before receiver payout",
        amount: request.protected_amount,
        currency: request.quote_currency,
        release_status: proofReady ? "ready_to_release" : "planned",
        release_trigger: request.release_condition || "Client-safe proof is reviewed before any receiver payout.",
      },
    ];
  }

  function renderMilestones(request) {
    if (!milestonesEl) return;
    const milestones = Array.isArray(request.milestones) && request.milestones.length
      ? request.milestones
      : defaultMilestones(request);
    milestonesEl.innerHTML = milestones.map(renderMilestoneRow).join("");
  }

  function proofRows(request) {
    const requirements = Array.isArray(request.proof_requirements) ? request.proof_requirements : [];
    const proofLinks = Array.isArray(request.proof_links) ? request.proof_links : [];
    const rows = requirements.length
      ? requirements.map((item) => ({
          title: formatStatus(item, "Proof requirement"),
          detail: "Required for this corridor or task type.",
          done: proofLinks.length > 0 || Boolean(request.client_report || request.client_report_url),
        }))
      : [
          {
            title: "Location / presence proof",
            detail: "Photos, notes, timestamps, or provider evidence.",
            done: proofLinks.length > 0,
          },
          {
            title: "Receipt and document trail",
            detail: "Uploaded files or official references where available.",
            done: proofLinks.length > 1 || Boolean(request.client_report_url),
          },
          {
            title: "Milestone approval",
            detail: "Client-safe summary before any release action.",
            done: Boolean(request.client_report || request.client_report_url),
          },
        ];

    return rows;
  }

  function renderProofChecklist(request) {
    if (!proofChecklist) return;
    proofChecklist.innerHTML = proofRows(request)
      .map(
        (row, index, rows) => `
          <div class="flex items-center justify-between group cursor-default">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full ${row.done ? "bg-primary/10" : "bg-surface-variant/30"} flex items-center justify-center">
                <span class="material-symbols-outlined ${row.done ? "text-primary fill-icon" : "text-outline"}">${row.done ? "verified_user" : "pending"}</span>
              </div>
              <div>
                <p class="font-label-md">${escapeHtml(row.title)}</p>
                <p class="text-xs text-on-surface-variant">${escapeHtml(row.detail)}</p>
              </div>
            </div>
            <span class="material-symbols-outlined ${row.done ? "text-primary" : "text-outline"}">${row.done ? "done_all" : "schedule"}</span>
          </div>
          ${index < rows.length - 1 ? '<hr class="border-outline-variant/20"/>' : ""}
        `,
      )
      .join("");
  }

  function renderMediaLinks(request) {
    if (!mediaLinks || !reportSummary) return;
    const links = [];
    const reportUrl = safeHttpUrl(request.client_report_url);
    const proofLinks = Array.isArray(request.proof_links) ? request.proof_links : [];

    if (reportUrl) {
      links.push({ label: "Open client-safe report", href: reportUrl, icon: "article" });
    }

    proofLinks.forEach((link, index) => {
      const href = safeHttpUrl(link);
      if (href) {
        links.push({ label: `Open proof file ${index + 1}`, href, icon: "attach_file" });
      }
    });

    if (request.client_report && !reportUrl) {
      reportSummary.textContent = request.client_report;
    } else if (links.length) {
      reportSummary.textContent = `${links.length} proof/report item${links.length === 1 ? "" : "s"} available for this request.`;
    } else {
      reportSummary.textContent = "Proof media and client-safe reports appear here after receiver updates.";
    }

    mediaLinks.innerHTML = links.length
      ? links
          .map(
            (link) => `
              <a class="flex items-center gap-3 rounded-xl border border-white/40 bg-white/50 px-4 py-3 font-label-md text-primary hover:bg-white transition-colors" href="${escapeHtml(link.href)}" target="_blank" rel="noopener">
                <span class="material-symbols-outlined text-[20px]">${escapeHtml(link.icon)}</span>
                ${escapeHtml(link.label)}
              </a>
            `,
          )
          .join("")
      : `<p class="rounded-xl bg-white/40 px-4 py-3 text-sm text-on-surface-variant">No proof files attached yet. Use the job room for updates, photos, voice notes, and video-call requests.</p>`;
  }

  function renderRequest(request) {
    if (!request) {
      setResult("No matching request found. Check the code and contact used on the original brief.", "text-error");
      setPaymentLink("");
      renderPaymentRailPlan({});
      renderResolutionCases([], "No matching request found.");
      renderWorkflowControl(null);
      return;
    }

    const code = request.request_code || codeInput.value.trim().toUpperCase();
    const task = request.task_location || request.kenya_location || request.destination_country || "Global corridor request";
    const status = formatStatus(request.status);
    const payment = formatStatus(request.payment_status || request.funds_status || "not_collected");
    const securePaymentHref = safeHttpUrl(request.payment_link);

    updateJobRoomLinks(code, contactInput.value.trim());
    codeLabel.textContent = `Case #${code}`;
    title.textContent = task;
    assignee.textContent = request.assigned_to
      ? `Assigned to: ${request.assigned_to}`
      : "AI triage first; human review only when risk or compliance requires it";

    if (quoteAmount) {
      quoteAmount.textContent = formatMoney(request.quote_amount, request.quote_currency, "Quote pending");
    }
    if (fundsStatus) {
      fundsStatus.textContent = formatStatus(request.funds_status || request.payment_status || "not_collected");
    }
    if (protectedAmount) {
      protectedAmount.textContent = formatMoney(request.protected_amount, request.quote_currency, "Shown after quote");
    }
    if (releaseCondition) {
      releaseCondition.textContent = request.release_condition || "Proof is reviewed before receiver payout.";
    }
    if (paymentAnchor) {
      paymentAnchor.href = "#payment-state";
    }

    setPaymentLink(securePaymentHref);
    renderPaymentRailPlan(request);
    renderMilestones(request);
    renderProofChecklist(request);
    renderMediaLinks(request);
    renderWorkflowControl(request);
    setResult(
      `Status: ${status}. Payment: ${payment}. ID verification: ${formatStatus(request.verification_status || "required")}.`,
      "text-primary",
    );
  }

  async function lookup() {
    const code = codeInput.value.trim();
    const contact = contactInput.value.trim();
    if (!code || !contact) return;
    setResult("Opening request...");
    try {
      const result = await window.SwadaktaData.trackRequest(code, contact);
      renderRequest(result.data);
      if (result.data) {
        await loadResolutionCases(result.data.request_code || code, contact);
      }
    } catch (error) {
      setPaymentLink("");
      setResult(error.message || "Could not open request.", "text-error");
      renderResolutionCases([], error.message || "Could not open request.");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    lookup();
  });

  const params = new URLSearchParams(window.location.search);
  for (const input of [codeInput, contactInput]) {
    input.addEventListener("input", () => {
      updateJobRoomLinks();
      renderPaymentReturnHint(params);
    });
    input.addEventListener("change", () => {
      updateJobRoomLinks();
      renderPaymentReturnHint(params);
    });
  }

  if (params.get("code")) codeInput.value = params.get("code");
  if (params.get("contact")) contactInput.value = params.get("contact");
  renderPaymentReturnHint(params);
  updateJobRoomLinks();
  if (
    codeInput.value &&
    !contactInput.value &&
    String(params.get("source") || "").toLowerCase() === "payment_return"
  ) {
    setResult("Enter the email or WhatsApp used on the brief to unlock this payment return.", "text-primary");
  }
  if (codeInput.value && contactInput.value) lookup();
})();
