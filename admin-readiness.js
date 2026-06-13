(function () {
  const data = window.SwadaktaData;
  if (!data) return;

  const authPanel = document.querySelector("#admin-auth-panel");
  const loginForm = document.querySelector("#admin-login-form");
  const emailInput = document.querySelector("#admin-email");
  const passwordInput = document.querySelector("#admin-password");
  const loginStatus = document.querySelector("#admin-login-status");
  const sendLinkButton = document.querySelector("#send-admin-link");
  const signOutButtons = document.querySelectorAll(".admin-sign-out-control");
  const refreshButton = document.querySelector("#refresh-readiness");
  const copyChecklistButton = document.querySelector("#copy-checklist");
  const copyDecisionRegisterButtons = document.querySelectorAll("#copy-decision-register, #copy-decision-register-mobile");
  const copyLaunchSessionButtons = document.querySelectorAll("#copy-launch-session, #copy-launch-session-mobile");
  const copyProviderPackButtons = document.querySelectorAll("#copy-provider-pack, #copy-provider-pack-mobile");
  const copyProviderMatrixButtons = document.querySelectorAll("#copy-provider-matrix, #copy-provider-matrix-mobile");
  const copyCorridorPlannerButtons = document.querySelectorAll("#copy-corridor-planner, #copy-corridor-planner-mobile");
  const copyFounderPackButtons = document.querySelectorAll("#copy-founder-pack, #copy-founder-pack-mobile");
  const copyPilotScriptButtons = document.querySelectorAll("#copy-pilot-script, #copy-pilot-script-mobile");
  const readinessMode = document.querySelector("#readiness-mode");
  const readinessStatus = document.querySelector("#readiness-status");
  const founderActionList = document.querySelector("#founder-action-list");
  const pilotScriptList = document.querySelector("#pilot-script-list");
  const pilotPassConditions = document.querySelector("#pilot-pass-conditions");
  const nextActionsList = document.querySelector("#next-actions-list");
  const nextActionsCount = document.querySelector("#next-actions-count");
  const categories = document.querySelector("#readiness-categories");
  const providerMatrixList = document.querySelector("#provider-matrix-list");
  const corridorRailPlannerSummary = document.querySelector("#corridor-rail-planner-summary");
  const corridorRailPlannerList = document.querySelector("#corridor-rail-planner-list");
  const providerPackList = document.querySelector("#provider-pack-list");
  const protectedActions = document.querySelector("#protected-actions");
  const launchGateSummary = document.querySelector("#launch-gate-summary");
  const launchGateLabel = document.querySelector("#launch-gate-label");
  const launchPublicSite = document.querySelector("#launch-public-site");
  const launchPaidJobs = document.querySelector("#launch-paid-jobs");
  const launchFounderLoad = document.querySelector("#launch-founder-load");
  const launchBlockersList = document.querySelector("#launch-blockers-list");
  const launchEvidenceList = document.querySelector("#launch-evidence-list");
  const copyLaunchGateButton = document.querySelector("#copy-launch-gate");
  const launchDecisionRegisterSummary = document.querySelector("#launch-decision-register-summary");
  const launchDecisionRegisterList = document.querySelector("#launch-decision-register-list");
  const launchSessionSummary = document.querySelector("#launch-session-summary");
  const launchSessionTabs = document.querySelector("#launch-session-tabs");
  const launchSessionList = document.querySelector("#launch-session-list");

  let latestReport = null;

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

  function statusLabel(status) {
    return {
      ready: "Ready",
      warning: "Check",
      missing: "Missing",
      manual: "Manual",
    }[status] || "Review";
  }

  function statusTone(status) {
    if (status === "ready") return "bg-emerald-500/10 text-emerald-700";
    if (status === "missing") return "bg-error-container text-on-error-container";
    if (status === "warning") return "bg-amber-400/20 text-amber-800";
    if (status === "manual") return "bg-sky-500/10 text-sky-800";
    return "bg-surface-container text-secondary";
  }

  function decisionStatusTone(status) {
    if (status === "ready") return "bg-emerald-500/10 text-emerald-700";
    if (status === "controlled" || status === "manual") return "bg-amber-400/20 text-amber-800";
    if (status === "blocked") return "bg-error-container text-on-error-container";
    return statusTone(status);
  }

  function decisionStatusLabel(status) {
    return {
      ready: "Allowed",
      controlled: "Controlled",
      blocked: "Blocked",
      manual: "Founder gate",
    }[status] || statusLabel(status);
  }

  function setLoginStatus(message, tone = "text-on-surface-variant") {
    loginStatus.textContent = message;
    loginStatus.className = `min-h-6 text-sm ${tone}`.trim();
  }

  function setReadinessStatus(message, tone = "text-on-surface-variant") {
    readinessStatus.textContent = message;
    readinessStatus.className = `mt-4 min-h-6 text-sm ${tone}`.trim();
  }

  function showAuth(show) {
    authPanel.hidden = !show;
  }

  async function copyText(text, successMessage = "Copied.") {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setReadinessStatus(successMessage, "text-primary");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setReadinessStatus(successMessage, "text-primary");
    }
  }

  function buildChecklist(report = latestReport) {
    if (!report) return "";
    const counts = report.counts || {};
    const environment = report.environment || {};
    const nextActions = report.next_actions || [];
    const copyValues = report.safe_copy_values || {};
    return [
      "Swadakta launch readiness checklist",
      `Generated: ${report.generated_at || new Date().toISOString()}`,
      `Environment: ${environment.vercel_env || "unknown"} / ${environment.public_base_url || "domain unknown"}`,
      `Counts: ${counts.ready || 0} ready, ${counts.warning || 0} check, ${counts.missing || 0} missing, ${counts.manual || 0} manual`,
      "",
      "Next setup actions:",
      ...(nextActions.length
        ? nextActions.map((entry, index) => {
            const missing = entry.missing?.length ? ` Missing: ${entry.missing.join(", ")}.` : "";
            return `${index + 1}. [${statusLabel(entry.status)}] ${entry.label}: ${entry.next || "Review setup."}${missing}`;
          })
        : ["1. No missing setup actions returned by the readiness API."]),
      "",
      "Safe copy values:",
      ...Object.entries(copyValues).map(([key, value]) => `${key}: ${value}`),
      "",
      "Protected decisions:",
      ...(report.protected_actions || []).map((action) => `- ${action}`),
    ].join("\n");
  }

  function actionableCategoryItems(category = {}) {
    const items = Array.isArray(category.items) ? category.items : [];
    return items.filter((entry) => entry.status !== "ready" || entry.copy_value || entry.docs_url);
  }

  function categoryStatusSummary(category = {}) {
    const items = Array.isArray(category.items) ? category.items : [];
    const counts = items.reduce(
      (summary, entry) => {
        summary[entry.status] = (summary[entry.status] || 0) + 1;
        return summary;
      },
      { ready: 0, warning: 0, missing: 0, manual: 0 },
    );
    return `${counts.ready || 0} ready / ${counts.warning || 0} check / ${counts.missing || 0} missing / ${counts.manual || 0} manual`;
  }

  function launchStatusTone(status) {
    if (status === "launch_ready" || status === "ready" || status === "low") return "text-emerald-700";
    if (status === "paid_launch_blocked" || status === "blocked" || status === "high") return "text-on-error-container";
    return "text-amber-800";
  }

  function launchValueLabel(value) {
    return String(value || "checking").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function launchGateBrief(report = latestReport) {
    const gate = report?.launch_gate || {};
    const blockers = Array.isArray(gate.blockers) ? gate.blockers : [];
    const checks = Array.isArray(gate.checks) ? gate.checks : [];
    const evidence = Array.isArray(gate.evidence) ? gate.evidence : [];
    return [
      "Swadakta public launch gate",
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      `Gate: ${gate.label || "Checking"}`,
      `Public site: ${launchValueLabel(gate.public_site)}`,
      `Paid jobs: ${launchValueLabel(gate.paid_jobs)}`,
      `Founder load: ${launchValueLabel(gate.founder_load)}`,
      "",
      "Summary:",
      gate.summary || "No launch gate summary returned.",
      "",
      "Blockers:",
      ...(blockers.length
        ? blockers.map((entry) => `- ${entry.category}: ${entry.label}. ${entry.next || "Review setup."}`)
        : ["- No blocking items returned."]),
      "",
      "Checks:",
      ...(checks.length
        ? checks.map((entry) => `- [${statusLabel(entry.status)}] ${entry.category}: ${entry.label}. ${entry.next || "Review setup."}`)
        : ["- No manual/warning checks returned."]),
      "",
      "Evidence:",
      ...(evidence.length ? evidence.map((entry) => `- ${entry}`) : ["- No evidence notes returned."]),
      "",
      "Founder rule: do not accept paid work unless payment evidence, ID/provider evidence, route rules, proof requirements, and payout gates are clear.",
    ].join("\n");
  }

  function buildLaunchDecisionRegisterPack(report = latestReport) {
    const register = report?.launch_decision_register || {};
    const decisions = Array.isArray(register.decisions) ? register.decisions : [];
    const boundaries = Array.isArray(register.policy_boundary) ? register.policy_boundary : [];

    return [
      register.title || "Swadakta founder go/no-go decision register",
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      "",
      register.summary || "Use this register before demos, paid pilots, receiver onboarding, Africa expansion, or high-value work.",
      "",
      "Decisions:",
      ...(decisions.length
        ? decisions.map((decision, index) => {
            const locked = decision.locked_until?.length ? ` Locked until: ${decision.locked_until.join(", ")}.` : "";
            const evidence = decision.evidence_needed?.length ? ` Evidence: ${decision.evidence_needed.join(" / ")}.` : "";
            const flags = decision.flags?.length ? ` Flags: ${decision.flags.join(", ")}.` : "";
            const docs = decision.docs_url ? ` Docs: ${decision.docs_url}.` : "";
            const hardRule = decision.hard_rule ? ` Hard rule: ${decision.hard_rule}` : "";
            return `${index + 1}. [${decisionStatusLabel(decision.status)}] ${decision.label || "Decision"}: ${decision.summary || ""} Allowed now: ${decision.allowed_now || ""} Next: ${decision.next || ""}${locked}${evidence}${flags}${docs}${hardRule}`;
          })
        : ["1. No launch decisions returned by the readiness API."]),
      "",
      "Policy boundary:",
      ...(boundaries.length ? boundaries.map((entry) => `- ${entry}`) : ["- Blocked means collect interest only."]),
      "",
      "Founder rule: when in doubt, keep the work in founder-reviewed pilot mode and do not take money.",
    ].join("\n");
  }

  function launchSessionStepText(step = {}, index = 0) {
    const supportingTabs = Array.isArray(step.supporting_tabs) ? step.supporting_tabs : [];
    return [
      `${index + 1}. [${statusLabel(step.status)}] ${step.label || "Founder work step"}`,
      `Owner: ${step.owner || "Founder"}`,
      `Open: ${step.tab_url || "Swadakta readiness"}`,
      `Action: ${step.action || "Complete this setup step."}`,
      `Evidence: ${step.evidence || "Save evidence before setting the readiness flag."}`,
      step.flag ? `Readiness flag: ${step.flag}` : "",
      step.stop_rule ? `Stop rule: ${step.stop_rule}` : "",
      ...(supportingTabs.length ? supportingTabs.map((tab) => `Supporting tab: ${tab}`) : []),
    ]
      .filter(Boolean)
      .join("\n");
  }

  function buildLaunchSessionPack(report = latestReport) {
    const session = report?.founder_launch_session || {};
    const tabs = Array.isArray(session.recommended_tabs) ? session.recommended_tabs : [];
    const phases = Array.isArray(session.phases) ? session.phases : [];
    return [
      session.title || "Swadakta founder Chrome work session",
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      "",
      session.summary || "Work the launch setup in order before accepting paid jobs.",
      "",
      `Rule: ${session.rule || "Do not paste secret keys into chat or public pages."}`,
      "",
      "Recommended tabs:",
      ...(tabs.length
        ? tabs.map((tab, index) => `${index + 1}. ${tab.label || "Setup tab"}: ${tab.url || ""} - ${tab.purpose || "Review setup."}`)
        : ["1. No recommended tabs returned by the readiness API."]),
      "",
      ...phases.flatMap((phase) => [
        phase.label || "Founder work phase",
        ...((phase.steps || []).map((step, index) => launchSessionStepText(step, index))),
        "",
      ]),
      "Boundary:",
      "Set owner flags only after evidence exists. If a step depends on legal, tax, insurance, payment, or ID-provider approval, the provider dashboard or written professional advice is the authority.",
    ].join("\n");
  }

  function renderLaunchGate(report = latestReport) {
    const gate = report?.launch_gate || {};
    const blockers = Array.isArray(gate.blockers) ? gate.blockers : [];
    const evidence = Array.isArray(gate.evidence) ? gate.evidence : [];

    if (launchGateSummary) {
      launchGateSummary.textContent = gate.summary || "Launch gate has not loaded yet.";
    }
    if (launchGateLabel) {
      launchGateLabel.textContent = gate.label || "Checking";
      launchGateLabel.className = `mt-2 block font-display text-2xl ${launchStatusTone(gate.status)}`.trim();
    }
    if (launchPublicSite) {
      launchPublicSite.textContent = launchValueLabel(gate.public_site);
      launchPublicSite.className = `mt-2 block font-display text-2xl ${launchStatusTone(gate.public_site)}`.trim();
    }
    if (launchPaidJobs) {
      launchPaidJobs.textContent = launchValueLabel(gate.paid_jobs);
      launchPaidJobs.className = `mt-2 block font-display text-2xl ${launchStatusTone(gate.paid_jobs)}`.trim();
    }
    if (launchFounderLoad) {
      launchFounderLoad.textContent = launchValueLabel(gate.founder_load);
      launchFounderLoad.className = `mt-2 block font-display text-2xl ${launchStatusTone(gate.founder_load)}`.trim();
    }
    if (launchBlockersList) {
      launchBlockersList.innerHTML = blockers.length
        ? blockers
            .map(
              (entry) => `
                <li class="rounded-2xl bg-white/70 p-3">
                  <strong class="block text-on-surface">${escapeHtml(entry.label || "Launch blocker")}</strong>
                  <span class="mt-1 block text-xs leading-5">${escapeHtml(entry.category || "Readiness")} / ${escapeHtml(entry.owner || "Founder/admin")}</span>
                  <span class="mt-2 block text-xs leading-5">${escapeHtml(entry.next || "Review setup.")}</span>
                </li>
              `,
            )
            .join("")
        : `<li class="rounded-2xl bg-white/70 p-3">No paid-launch blockers returned by the readiness API.</li>`;
    }
    if (launchEvidenceList) {
      launchEvidenceList.innerHTML = evidence.length
        ? evidence.map((entry) => `<li class="rounded-2xl bg-white/70 p-3">${escapeHtml(entry)}</li>`).join("")
        : `<li class="rounded-2xl bg-white/70 p-3">No evidence notes returned yet.</li>`;
    }
  }

  function renderLaunchDecisionRegister(report = latestReport) {
    const register = report?.launch_decision_register || {};
    const decisions = Array.isArray(register.decisions) ? register.decisions : [];

    if (launchDecisionRegisterSummary) {
      launchDecisionRegisterSummary.textContent =
        register.summary ||
        "Launch decision register has not loaded yet. Keep paid work in founder-reviewed pilot mode.";
    }
    if (!launchDecisionRegisterList) return;

    launchDecisionRegisterList.innerHTML = decisions.length
      ? decisions
          .map((decision) => {
            const locked = Array.isArray(decision.locked_until) ? decision.locked_until : [];
            const evidence = Array.isArray(decision.evidence_needed) ? decision.evidence_needed : [];
            const flags = Array.isArray(decision.flags) ? decision.flags : [];
            return `
              <article class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <strong class="font-display text-xl">${escapeHtml(decision.label || "Launch decision")}</strong>
                      <span class="rounded-full px-3 py-1 font-label text-xs ${decisionStatusTone(decision.status)}">${escapeHtml(decision.status_label || decisionStatusLabel(decision.status))}</span>
                    </div>
                    <p class="mt-3 text-sm leading-6 text-on-surface-variant">${escapeHtml(decision.summary || "")}</p>
                    <p class="mt-2 text-sm leading-6 text-on-surface-variant"><strong class="text-on-surface">Allowed now:</strong> ${escapeHtml(decision.allowed_now || "")}</p>
                    <p class="mt-2 text-sm leading-6 text-on-surface-variant"><strong class="text-on-surface">Next:</strong> ${escapeHtml(decision.next || "")}</p>
                    ${locked.length ? `<p class="mt-3 font-label text-xs uppercase tracking-[0.14em] text-secondary">Locked until: ${escapeHtml(locked.join(", "))}</p>` : ""}
                    ${
                      evidence.length
                        ? `<ul class="mt-3 grid gap-2 text-xs leading-5 text-secondary">${evidence
                            .map((entry) => `<li class="rounded-2xl bg-white/70 p-3">${escapeHtml(entry)}</li>`)
                            .join("")}</ul>`
                        : ""
                    }
                    ${flags.length ? `<p class="mt-3 font-label text-xs uppercase tracking-[0.14em] text-secondary">Flags: ${escapeHtml(flags.join(", "))}</p>` : ""}
                    ${decision.hard_rule ? `<p class="mt-3 text-xs leading-5 text-on-error-container">${escapeHtml(decision.hard_rule)}</p>` : ""}
                  </div>
                  <div class="flex shrink-0 flex-wrap gap-2">
                    ${
                      decision.docs_url
                        ? `<a class="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" href="${escapeHtml(decision.docs_url)}" target="_blank" rel="noopener">Open</a>`
                        : ""
                    }
                    ${
                      locked.length || flags.length
                        ? `<button class="copy-value inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-on-surface-variant" data-copy-value="${escapeHtml([...locked, ...flags].join("\n"))}" type="button">Copy gates</button>`
                        : ""
                    }
                  </div>
                </div>
              </article>
            `;
          })
          .join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No launch decision register returned by the readiness API.</div>`;
  }

  function providerPackCategoryText(category = {}, report = latestReport) {
    const safeValues = Object.entries(report?.safe_copy_values || {});
    const categoryItems = actionableCategoryItems(category);
    const lines = [
      `Swadakta provider setup pack: ${category.label || category.id || "Readiness"}`,
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      `Environment: ${report?.environment?.vercel_env || "unknown"} / ${report?.environment?.public_base_url || "domain unknown"}`,
      `Status: ${categoryStatusSummary(category)}`,
      "",
      "Setup actions:",
      ...(categoryItems.length
        ? categoryItems.map((entry, index) => {
            const missing = entry.missing?.length ? ` Missing env/settings: ${entry.missing.join(", ")}.` : "";
            const docs = entry.docs_url ? ` Docs: ${entry.docs_url}.` : "";
            const safeValue = entry.copy_value ? ` Safe copy value: ${entry.copy_value}.` : "";
            return `${index + 1}. [${statusLabel(entry.status)}] ${entry.label}: ${entry.next || entry.detail || "Review setup."}${missing}${safeValue}${docs} Owner: ${entry.owner || "Founder/admin"}.`;
          })
        : ["1. No non-ready setup items in this category."]),
      "",
      "Global safe callback values:",
      ...(safeValues.length ? safeValues.map(([key, value]) => `${key}: ${value}`) : ["No safe callback values returned."]),
      "",
      "Boundary:",
      "Do not paste secret keys into chat, email, screenshots, support tickets, or client-visible pages.",
      "AI can help draft setup notes, but provider dashboards and founder/admin approval control secrets, money, identity, assignment, and release decisions.",
    ];

    return lines.join("\n");
  }

  function buildProviderPack(report = latestReport) {
    if (!report) return "";
    return [
      "Swadakta provider setup pack",
      "Use this to configure Stripe, PayPal, M-Pesa/Daraja, Wise fallback, Supabase, Vercel, AI, and ID-provider dashboards.",
      "",
      ...(report.categories || []).map((category) => providerPackCategoryText(category, report)),
    ].join("\n\n---\n\n");
  }

  function buildProviderMatrixPack(report = latestReport) {
    const matrix = report?.provider_launch_matrix || {};
    const rails = Array.isArray(matrix.rails) ? matrix.rails.slice() : [];
    rails.sort((left, right) => Number(left.activation_order || 99) - Number(right.activation_order || 99));

    return [
      matrix.title || "Swadakta provider launch matrix",
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      "",
      matrix.summary || "Activate providers in order without exposing unfinished rails to users.",
      matrix.user_visibility_rule || "Keep unverified payment and ID rails hidden until provider evidence is tested.",
      "",
      "Activation sequence:",
      ...(matrix.activation_sequence?.length
        ? matrix.activation_sequence.map((entry) => `- ${entry}`)
        : rails.map((rail) => `- ${rail.activation_order || "?"}. ${rail.label || "Provider"}`)),
      "",
      "Provider rails:",
      ...(rails.length
        ? rails.map((rail) => {
            const missing = rail.missing?.length ? ` Missing: ${rail.missing.join(", ")}.` : "";
            const values = rail.safe_values?.length ? ` Safe values: ${rail.safe_values.join(" / ")}.` : "";
            const docs = rail.docs_url ? ` Docs: ${rail.docs_url}.` : "";
            return `${rail.activation_order || "?"}. [${statusLabel(rail.status)}] ${rail.label || "Provider"} (${rail.type || "rail"}): ${rail.launch_role || ""} Visibility: ${rail.public_visibility || ""} Next: ${rail.next || ""} Rule: ${rail.founder_rule || ""}${missing}${values}${docs}`;
          })
        : ["No provider rails returned by the readiness API."]),
      "",
      "Boundary:",
      "Do not paste secret keys into chat, email, docs, screenshots, or client-visible pages.",
      "AI can draft setup notes, but provider dashboards and founder/admin approval control money, identity, receiver assignment, refunds, and payout release.",
    ].join("\n");
  }

  function buildCorridorRailPlannerPack(report = latestReport) {
    const planner = report?.corridor_rail_planner || {};
    const routeClasses = Array.isArray(planner.route_classes) ? planner.route_classes : [];
    return [
      planner.title || "Swadakta corridor rail planner",
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      "",
      planner.summary || "Use route-specific payment, ID, payout, and hard-stop rules before quoting.",
      planner.public_visibility_rule || "Corridors should stay hidden or founder-gated until rails and evidence are ready.",
      "",
      "Route classes:",
      ...(routeClasses.length
        ? routeClasses.map((route) => {
            const missing = route.missing?.length ? ` Missing: ${route.missing.join(", ")}.` : "";
            const refs = route.safe_values?.length ? ` Safe refs: ${route.safe_values.join(" / ")}.` : "";
            const docs = route.docs_url ? ` Docs: ${route.docs_url}.` : "";
            return `[${route.status_label || statusLabel(route.status)}] ${route.label || "Corridor"}: Client side: ${route.client_side || ""} Receiver side: ${route.receiver_side || ""} Client payment: ${route.client_payment || ""} Receiver payout: ${route.receiver_payout || ""} ID route: ${route.identity_route || ""} Visibility: ${route.public_visibility || ""} Next: ${route.next || ""} Hard stop: ${route.hard_stop || ""}${missing}${refs}${docs}`;
          })
        : ["No corridor route classes returned by the readiness API."]),
      "",
      "Activation notes:",
      ...(planner.activation_notes?.length
        ? planner.activation_notes.map((entry) => `- ${entry}`)
        : ["- Keep launch quote-first and low-risk until corridor evidence is proven."]),
      "",
      "Boundary: Payment rail readiness never overrides corridor legality, customs, insurance, ID, proof, founder economics, or payout gates.",
    ].join("\n");
  }

  function founderStepText(step = {}, index = 0) {
    const safeValues = Array.isArray(step.safe_values) ? step.safe_values : [];
    return [
      `${index + 1}. [${statusLabel(step.status)}] ${step.label || "Founder action"}`,
      `Owner: ${step.owner || "Founder"}`,
      `Why: ${step.summary || "Review this setup item."}`,
      `Action: ${step.action || "Complete this setup item before paid launch."}`,
      step.done_when ? `Done when: ${step.done_when}` : "",
      step.flag ? `Readiness flag: ${step.flag}` : "",
      step.docs_url ? `Primary link: ${step.docs_url}` : "",
      ...(safeValues.length ? safeValues.map((value) => `Safe reference: ${value}`) : []),
    ]
      .filter(Boolean)
      .join("\n");
  }

  function buildFounderActionPack(report = latestReport) {
    const pack = report?.founder_action_pack || {};
    const phases = Array.isArray(pack.phases) ? pack.phases : [];
    return [
      pack.title || "Swadakta founder real-world launch pack",
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      "",
      `Operating rule: ${pack.operating_rule || "Do not take paid jobs until legal, insurance, payments, identity, and provider evidence are ready."}`,
      `Pilot rule: ${pack.pilot_rule || "Start with low-risk, written-scope, provider-paid, ID-gated jobs."}`,
      "",
      ...phases.flatMap((phase) => [
        phase.label || "Founder phase",
        ...((phase.steps || []).map((step, index) => founderStepText(step, index))),
        "",
      ]),
      "Boundary:",
      "Secret values belong only in Vercel/Supabase/provider dashboards. Do not paste live secrets into chat, email, screenshots, docs, or client-visible pages.",
      "AI can draft and triage, but provider/founder gates decide money, ID approval, receiver assignment, refunds, and external legal/payment commitments.",
    ].join("\n");
  }

  function pilotStepText(step = {}, index = 0) {
    return [
      `${index + 1}. [${statusLabel(step.status)}] ${step.label || "Pilot step"}`,
      `Screen: ${step.screen || "Swadakta"}`,
      `Owner: ${step.owner || "Founder/admin"}`,
      `Action: ${step.action || "Complete this step."}`,
      `Evidence: ${step.evidence || "Record the result."}`,
      step.hard_stop ? `Hard stop: ${step.hard_stop}` : "",
      step.route_url ? `Open: ${step.route_url}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function buildPilotScript(report = latestReport) {
    const script = report?.first_paid_pilot_script || {};
    const phases = Array.isArray(script.phases) ? script.phases : [];
    const passConditions = Array.isArray(script.pass_conditions) ? script.pass_conditions : [];
    const readySummary = script.ready_summary || {};
    return [
      script.title || "Swadakta first paid pilot rehearsal",
      `Generated: ${report?.generated_at || new Date().toISOString()}`,
      "",
      `Rule: ${script.rule || "Run a low-value internal/friendly-client job before normal paid launch."}`,
      `Target job: ${script.target_job || "Simple, legal, low-risk, easy to prove."}`,
      "",
      "Readiness summary:",
      ...Object.entries(readySummary).map(([key, value]) => `- ${key}: ${value}`),
      "",
      ...phases.flatMap((phase) => [
        phase.label || "Pilot phase",
        ...((phase.steps || []).map((step, index) => pilotStepText(step, index))),
        "",
      ]),
      "Pass conditions:",
      ...(passConditions.length ? passConditions.map((entry) => `- ${entry}`) : ["- No pass conditions returned."]),
      "",
      "Boundary: This pilot proves workflow. It does not authorize high-value, restricted, legal/customs, remittance, or informal-escrow work.",
    ].join("\n");
  }

  function updateStats(counts = {}) {
    document.querySelector("#stat-ready").textContent = counts.ready || 0;
    document.querySelector("#stat-warning").textContent = counts.warning || 0;
    document.querySelector("#stat-missing").textContent = counts.missing || 0;
    document.querySelector("#stat-manual").textContent = counts.manual || 0;
  }

  function actionButtons(entry) {
    const docs = entry.docs_url
      ? `<a class="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" href="${escapeHtml(entry.docs_url)}" target="_blank" rel="noopener">Docs</a>`
      : "";
    const copy = entry.copy_value
      ? `<button class="copy-value inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-on-surface-variant" data-copy-value="${escapeHtml(entry.copy_value)}" type="button">Copy value</button>`
      : "";
    return docs || copy ? `<div class="flex flex-wrap gap-2">${docs}${copy}</div>` : "";
  }

  function renderAction(entry, index) {
    const missing = entry.missing?.length ? entry.missing.join(", ") : "";
    return `
      <article class="grid gap-4 rounded-3xl border border-outline-variant/30 bg-white/58 p-5 md:grid-cols-[2.5rem_1fr_auto] md:items-start">
        <span class="grid h-10 w-10 place-items-center rounded-full bg-on-surface font-label text-sm font-bold text-white">${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <strong class="font-display text-xl">${escapeHtml(entry.label || "Setup action")}</strong>
            <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(entry.status)}">${escapeHtml(statusLabel(entry.status))}</span>
          </div>
          <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(entry.next || "Review this setup item.")}</p>
          ${missing ? `<p class="mt-2 font-label text-xs uppercase tracking-[0.14em] text-secondary">Missing: ${escapeHtml(missing)}</p>` : ""}
          ${entry.owner ? `<p class="mt-2 text-xs text-secondary">Owner: ${escapeHtml(entry.owner)}</p>` : ""}
        </div>
        ${actionButtons(entry)}
      </article>
    `;
  }

  function renderCategory(category) {
    return `
      <section class="glass-panel rounded-[2rem] p-6 md:p-8">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-label text-sm uppercase tracking-[0.18em] text-primary">${escapeHtml(category.id || "readiness")}</p>
            <h2 class="mt-1 font-display text-3xl font-extrabold">${escapeHtml(category.label || "Readiness")}</h2>
          </div>
          <span class="rounded-full bg-white/70 px-4 py-2 font-label text-sm text-secondary">${escapeHtml(String((category.items || []).length))} checks</span>
        </div>
        <div class="mt-6 grid gap-3">
          ${(category.items || [])
            .map(
              (entry) => `
                <article class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <strong class="font-display text-xl">${escapeHtml(entry.label || "Check")}</strong>
                        <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(entry.status)}">${escapeHtml(statusLabel(entry.status))}</span>
                      </div>
                      <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(entry.detail || "")}</p>
                      <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(entry.next || "")}</p>
                      ${entry.missing?.length ? `<p class="mt-2 font-label text-xs uppercase tracking-[0.14em] text-secondary">Missing: ${escapeHtml(entry.missing.join(", "))}</p>` : ""}
                    </div>
                    ${actionButtons(entry)}
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderProviderPacks(report) {
    if (!providerPackList) return;
    const categories = Array.isArray(report?.categories) ? report.categories : [];

    providerPackList.innerHTML = categories.length
      ? categories
          .map((category) => {
            const items = actionableCategoryItems(category);
            const copyCount = items.filter((entry) => entry.copy_value).length;
            const docsCount = items.filter((entry) => entry.docs_url).length;
            return `
              <article class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="font-label text-xs uppercase tracking-[0.16em] text-secondary">${escapeHtml(category.id || "provider")}</p>
                    <h3 class="mt-1 font-display text-xl font-extrabold">${escapeHtml(category.label || "Provider setup")}</h3>
                    <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(categoryStatusSummary(category))}</p>
                    <p class="mt-2 text-xs text-secondary">${escapeHtml(String(items.length))} action lines, ${escapeHtml(String(copyCount))} safe values, ${escapeHtml(String(docsCount))} docs links.</p>
                  </div>
                  <button class="copy-category-pack inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" data-copy-category-pack="${escapeHtml(category.id || "")}" type="button">Copy pack</button>
                </div>
              </article>
            `;
          })
          .join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No provider packs returned by the readiness API.</div>`;
  }

  function renderProviderMatrix(report) {
    if (!providerMatrixList) return;
    const matrix = report?.provider_launch_matrix || {};
    const rails = Array.isArray(matrix.rails) ? matrix.rails.slice() : [];
    rails.sort((left, right) => Number(left.activation_order || 99) - Number(right.activation_order || 99));

    providerMatrixList.innerHTML = rails.length
      ? rails
          .map((rail) => {
            const missing = Array.isArray(rail.missing) ? rail.missing : [];
            const safeValues = Array.isArray(rail.safe_values) ? rail.safe_values : [];
            return `
              <article class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="grid h-9 w-9 place-items-center rounded-full bg-on-surface font-label text-xs font-bold text-white">${escapeHtml(String(rail.activation_order || "?").padStart(2, "0"))}</span>
                      <strong class="font-display text-xl">${escapeHtml(rail.label || "Provider rail")}</strong>
                      <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(rail.status)}">${escapeHtml(rail.status_label || statusLabel(rail.status))}</span>
                      <span class="rounded-full bg-white/70 px-3 py-1 font-label text-xs text-secondary">${escapeHtml(rail.type || "rail")}</span>
                    </div>
                    <p class="mt-3 text-sm leading-6 text-on-surface-variant">${escapeHtml(rail.launch_role || "")}</p>
                    <p class="mt-2 text-sm leading-6 text-on-surface-variant"><strong class="text-on-surface">Visibility:</strong> ${escapeHtml(rail.public_visibility || "")}</p>
                    <p class="mt-2 text-sm leading-6 text-on-surface-variant"><strong class="text-on-surface">Next:</strong> ${escapeHtml(rail.next || "")}</p>
                    <p class="mt-2 text-xs leading-5 text-secondary">${escapeHtml(rail.founder_rule || "")}</p>
                    ${missing.length ? `<p class="mt-3 font-label text-xs uppercase tracking-[0.14em] text-secondary">Missing: ${escapeHtml(missing.join(", "))}</p>` : ""}
                  </div>
                  <div class="flex shrink-0 flex-wrap gap-2">
                    ${
                      rail.docs_url
                        ? `<a class="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" href="${escapeHtml(rail.docs_url)}" target="_blank" rel="noopener">Docs</a>`
                        : ""
                    }
                    ${
                      safeValues.length
                        ? `<button class="copy-value inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-on-surface-variant" data-copy-value="${escapeHtml(safeValues.join("\n"))}" type="button">Copy refs</button>`
                        : ""
                    }
                  </div>
                </div>
              </article>
            `;
          })
          .join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No provider launch matrix returned by the readiness API.</div>`;
  }

  function renderCorridorRailPlanner(report) {
    const planner = report?.corridor_rail_planner || {};
    const routeClasses = Array.isArray(planner.route_classes) ? planner.route_classes : [];
    if (corridorRailPlannerSummary) {
      corridorRailPlannerSummary.textContent =
        planner.summary ||
        "Corridor rail planner is unavailable until readiness checks load. Keep paid work quote-first and founder-reviewed.";
    }
    if (!corridorRailPlannerList) return;

    corridorRailPlannerList.innerHTML = routeClasses.length
      ? routeClasses
          .map((route) => {
            const missing = Array.isArray(route.missing) ? route.missing : [];
            const safeValues = Array.isArray(route.safe_values) ? route.safe_values : [];
            return `
              <article class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <strong class="font-display text-xl">${escapeHtml(route.label || "Corridor route")}</strong>
                      <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(route.status)}">${escapeHtml(route.status_label || statusLabel(route.status))}</span>
                    </div>
                    <div class="mt-3 grid gap-2 text-sm leading-6 text-on-surface-variant">
                      <p><strong class="text-on-surface">Client:</strong> ${escapeHtml(route.client_side || "")}</p>
                      <p><strong class="text-on-surface">Receiver:</strong> ${escapeHtml(route.receiver_side || "")}</p>
                      <p><strong class="text-on-surface">Client payment:</strong> ${escapeHtml(route.client_payment || "")}</p>
                      <p><strong class="text-on-surface">Receiver payout:</strong> ${escapeHtml(route.receiver_payout || "")}</p>
                      <p><strong class="text-on-surface">ID route:</strong> ${escapeHtml(route.identity_route || "")}</p>
                      <p><strong class="text-on-surface">Visibility:</strong> ${escapeHtml(route.public_visibility || "")}</p>
                      <p><strong class="text-on-surface">Next:</strong> ${escapeHtml(route.next || "")}</p>
                    </div>
                    <p class="mt-3 rounded-2xl bg-white/68 p-3 text-xs leading-5 text-secondary">${escapeHtml(route.hard_stop || "Keep protected actions founder-gated.")}</p>
                    ${missing.length ? `<p class="mt-3 font-label text-xs uppercase tracking-[0.14em] text-secondary">Missing: ${escapeHtml(missing.join(", "))}</p>` : ""}
                  </div>
                  <div class="flex shrink-0 flex-wrap gap-2">
                    ${
                      route.docs_url
                        ? `<a class="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" href="${escapeHtml(route.docs_url)}" target="_blank" rel="noopener">Docs</a>`
                        : ""
                    }
                    ${
                      safeValues.length
                        ? `<button class="copy-value inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-on-surface-variant" data-copy-value="${escapeHtml(safeValues.join("\n"))}" type="button">Copy refs</button>`
                        : ""
                    }
                  </div>
                </div>
              </article>
            `;
          })
          .join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No corridor rail planner returned by the readiness API.</div>`;
  }

  function renderLaunchSession(report) {
    const session = report?.founder_launch_session || {};
    const tabs = Array.isArray(session.recommended_tabs) ? session.recommended_tabs : [];
    const phases = Array.isArray(session.phases) ? session.phases : [];

    if (launchSessionSummary) {
      launchSessionSummary.textContent =
        session.summary ||
        "Founder work session is unavailable until readiness checks load. Keep paid work in founder-reviewed pilot mode.";
    }

    if (launchSessionTabs) {
      launchSessionTabs.innerHTML = tabs.length
        ? tabs
            .map(
              (tab) => `
                <a class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 transition hover:bg-white/78" href="${escapeHtml(tab.url || "#")}" target="_blank" rel="noopener">
                  <span class="font-label text-xs uppercase tracking-[0.16em] text-secondary">${escapeHtml(tab.label || "Setup tab")}</span>
                  <span class="mt-2 block text-sm leading-6 text-on-surface-variant">${escapeHtml(tab.purpose || "Review setup.")}</span>
                </a>
              `,
            )
            .join("")
        : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No recommended tabs returned by the readiness API.</div>`;
    }

    if (!launchSessionList) return;

    launchSessionList.innerHTML = phases.length
      ? phases
          .map(
            (phase) => `
              <section class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div class="min-w-0">
                    <p class="font-label text-xs uppercase tracking-[0.16em] text-secondary">${escapeHtml(phase.id || "launch-session")}</p>
                    <h3 class="mt-1 font-display text-2xl font-extrabold">${escapeHtml(phase.label || "Founder work phase")}</h3>
                  </div>
                  <span class="shrink-0 rounded-full bg-white/70 px-4 py-2 font-label text-xs text-secondary">${escapeHtml(String((phase.steps || []).length))} steps</span>
                </div>
                <div class="mt-4 grid gap-3">
                  ${(phase.steps || [])
                    .map((step) => {
                      const supportingTabs = Array.isArray(step.supporting_tabs) ? step.supporting_tabs : [];
                      return `
                        <article class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4">
                          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div class="min-w-0">
                              <div class="flex flex-wrap items-center gap-2">
                                <strong class="font-display text-xl">${escapeHtml(step.label || "Founder work step")}</strong>
                                <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(step.status)}">${escapeHtml(statusLabel(step.status))}</span>
                              </div>
                              <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(step.action || "")}</p>
                              <p class="mt-2 text-sm leading-6 text-on-surface-variant"><strong class="text-on-surface">Evidence:</strong> ${escapeHtml(step.evidence || "")}</p>
                              ${step.flag ? `<p class="mt-2 font-label text-xs uppercase tracking-[0.14em] text-secondary">Flag: ${escapeHtml(step.flag)}</p>` : ""}
                              ${step.stop_rule ? `<p class="mt-2 text-xs leading-5 text-on-error-container">${escapeHtml(step.stop_rule)}</p>` : ""}
                              ${
                                supportingTabs.length
                                  ? `<p class="mt-2 text-xs leading-5 text-secondary">Supporting: ${escapeHtml(supportingTabs.join(" / "))}</p>`
                                  : ""
                              }
                            </div>
                            ${
                              step.tab_url
                                ? `<a class="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" href="${escapeHtml(step.tab_url)}" target="_blank" rel="noopener">Open</a>`
                                : ""
                            }
                          </div>
                        </article>
                      `;
                    })
                    .join("")}
                </div>
              </section>
            `,
          )
          .join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No founder Chrome work session returned by the readiness API.</div>`;
  }

  function renderFounderActionPack(report) {
    if (!founderActionList) return;
    const pack = report?.founder_action_pack || {};
    const phases = Array.isArray(pack.phases) ? pack.phases : [];

    founderActionList.innerHTML = phases.length
      ? phases
          .map(
            (phase) => `
              <section class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div class="min-w-0">
                    <p class="font-label text-xs uppercase tracking-[0.16em] text-secondary">${escapeHtml(phase.id || "founder")}</p>
                    <h3 class="mt-1 font-display text-2xl font-extrabold">${escapeHtml(phase.label || "Founder phase")}</h3>
                  </div>
                  <span class="shrink-0 rounded-full bg-white/70 px-4 py-2 font-label text-xs text-secondary">${escapeHtml(String((phase.steps || []).length))} actions</span>
                </div>
                <div class="mt-4 grid gap-3">
                  ${(phase.steps || [])
                    .map((step) => {
                      const safeValues = Array.isArray(step.safe_values) ? step.safe_values : [];
                      return `
                        <article class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4">
                          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div class="min-w-0">
                              <div class="flex flex-wrap items-center gap-2">
                                <strong class="font-display text-xl">${escapeHtml(step.label || "Founder action")}</strong>
                                <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(step.status)}">${escapeHtml(statusLabel(step.status))}</span>
                              </div>
                              <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(step.summary || "")}</p>
                              <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(step.action || "")}</p>
                              ${step.done_when ? `<p class="mt-2 text-xs leading-5 text-secondary">${escapeHtml(step.done_when)}</p>` : ""}
                              ${step.flag ? `<p class="mt-2 font-label text-xs uppercase tracking-[0.14em] text-secondary">Flag: ${escapeHtml(step.flag)}</p>` : ""}
                            </div>
                            <div class="flex shrink-0 flex-wrap gap-2">
                              ${
                                step.docs_url
                                  ? `<a class="inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" href="${escapeHtml(step.docs_url)}" target="_blank" rel="noopener">Open</a>`
                                  : ""
                              }
                              ${
                                safeValues.length
                                  ? `<button class="copy-value inline-flex h-10 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-on-surface-variant" data-copy-value="${escapeHtml(safeValues.join("\n"))}" type="button">Copy refs</button>`
                                  : ""
                              }
                            </div>
                          </div>
                        </article>
                      `;
                    })
                    .join("")}
                </div>
              </section>
            `,
          )
          .join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No founder action pack returned by the readiness API.</div>`;
  }

  function renderPilotScript(report) {
    if (!pilotScriptList) return;
    const script = report?.first_paid_pilot_script || {};
    const phases = Array.isArray(script.phases) ? script.phases : [];
    const passConditions = Array.isArray(script.pass_conditions) ? script.pass_conditions : [];

    pilotScriptList.innerHTML = phases.length
      ? phases
          .map(
            (phase) => `
              <section class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div class="min-w-0">
                    <p class="font-label text-xs uppercase tracking-[0.16em] text-secondary">${escapeHtml(phase.id || "pilot")}</p>
                    <h3 class="mt-1 font-display text-2xl font-extrabold">${escapeHtml(phase.label || "Pilot phase")}</h3>
                  </div>
                  <span class="shrink-0 rounded-full bg-white/70 px-4 py-2 font-label text-xs text-secondary">${escapeHtml(String((phase.steps || []).length))} checks</span>
                </div>
                <div class="mt-4 grid gap-3">
                  ${(phase.steps || [])
                    .map(
                      (step) => `
                        <article class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4">
                          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div class="min-w-0">
                              <div class="flex flex-wrap items-center gap-2">
                                <strong class="font-display text-xl">${escapeHtml(step.label || "Pilot step")}</strong>
                                <span class="rounded-full px-3 py-1 font-label text-xs ${statusTone(step.status)}">${escapeHtml(statusLabel(step.status))}</span>
                              </div>
                              <p class="mt-2 font-label text-xs uppercase tracking-[0.14em] text-secondary">${escapeHtml(step.screen || "Swadakta")}</p>
                              <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(step.action || "")}</p>
                              <p class="mt-2 text-sm leading-6 text-on-surface-variant">${escapeHtml(step.evidence || "")}</p>
                              ${step.hard_stop ? `<p class="mt-2 text-xs leading-5 text-on-error-container">${escapeHtml(step.hard_stop)}</p>` : ""}
                            </div>
                            ${
                              step.route_url
                                ? `<a class="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/50 bg-white/72 px-4 font-label text-sm font-bold text-primary" href="${escapeHtml(step.route_url)}" target="_blank" rel="noopener">Open</a>`
                                : ""
                            }
                          </div>
                        </article>
                      `,
                    )
                    .join("")}
                </div>
              </section>
            `,
          )
          .join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No first-paid-pilot script returned by the readiness API.</div>`;

    if (pilotPassConditions) {
      pilotPassConditions.innerHTML = passConditions.length
        ? passConditions.map((entry) => `<li class="rounded-2xl bg-white/70 p-3">${escapeHtml(entry)}</li>`).join("")
        : `<li class="rounded-2xl bg-white/70 p-3">No pass conditions returned.</li>`;
    }
  }

  function renderReport(report, mode) {
    latestReport = report;
    const counts = report.counts || {};
    const nextActions = report.next_actions || [];
    readinessMode.textContent = mode === "vercel" ? "Live production checks" : "Local demo checks";
    setReadinessStatus(
      `Updated ${new Date(report.generated_at || Date.now()).toLocaleString()}. Safe callback values can be copied without exposing secrets.`,
      "text-on-surface-variant",
    );
    updateStats(counts);
    renderLaunchGate(report);
    renderLaunchDecisionRegister(report);
    renderLaunchSession(report);
    renderProviderMatrix(report);
    renderCorridorRailPlanner(report);
    renderFounderActionPack(report);
    renderPilotScript(report);
    nextActionsCount.textContent = `${nextActions.length} priorit${nextActions.length === 1 ? "y" : "ies"}`;
    nextActionsList.innerHTML = nextActions.length
      ? nextActions.map(renderAction).join("")
      : `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">No missing setup actions returned by the readiness API.</div>`;
    categories.innerHTML = (report.categories || []).map(renderCategory).join("");
    renderProviderPacks(report);
    protectedActions.innerHTML = (report.protected_actions || [])
      .map(
        (action) => `
          <li class="flex gap-3 rounded-3xl border border-outline-variant/30 bg-white/58 p-4">
            <span class="material-symbols-outlined text-primary">lock</span>
            <span>${escapeHtml(action)}</span>
          </li>
        `,
      )
      .join("");
  }

  function renderEmpty(message) {
    updateStats({});
    nextActionsCount.textContent = "0 priorities";
    nextActionsList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    categories.innerHTML = "";
    if (providerPackList) {
      providerPackList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    }
    if (providerMatrixList) {
      providerMatrixList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    }
    if (corridorRailPlannerSummary) {
      corridorRailPlannerSummary.textContent = "Corridor rail planner is unavailable until readiness checks load.";
    }
    if (corridorRailPlannerList) {
      corridorRailPlannerList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    }
    if (launchDecisionRegisterSummary) {
      launchDecisionRegisterSummary.textContent = "Launch decision register is unavailable until readiness checks load.";
    }
    if (launchDecisionRegisterList) {
      launchDecisionRegisterList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    }
    if (launchSessionSummary) {
      launchSessionSummary.textContent = "Founder Chrome work session is unavailable until readiness checks load.";
    }
    if (launchSessionTabs) {
      launchSessionTabs.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    }
    if (launchSessionList) {
      launchSessionList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    }
    if (founderActionList) {
      founderActionList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    }
    if (pilotScriptList) {
      pilotScriptList.innerHTML = `<div class="rounded-3xl border border-outline-variant/30 bg-white/58 p-5 text-on-surface-variant">${escapeHtml(message)}</div>`;
    }
    if (pilotPassConditions) {
      pilotPassConditions.innerHTML = "";
    }
    renderLaunchGate({});
    renderLaunchDecisionRegister({});
    renderLaunchSession({});
    protectedActions.innerHTML = "";
  }

  async function loadReadiness() {
    showAuth(false);
    readinessMode.textContent = "Loading readiness";
    renderEmpty("Loading readiness checks...");

    try {
      const sessionResult = await data.getSession();
      if (!sessionResult.session && sessionResult.mode !== "local") {
        emailInput.value = window.SWADAKTA_CONFIG?.adminEmail || "";
        showAuth(true);
        readinessMode.textContent = "Sign in needed";
        renderEmpty("Sign in as a Swadakta admin to view production setup checks.");
        return;
      }

      const result = await data.getOperationsReadiness();
      renderReport(result.data, result.mode);
    } catch (error) {
      const message = error.message || "Could not load readiness.";
      if (/admin/i.test(message)) {
        readinessMode.textContent = "Admin permission required";
        renderEmpty("This account is signed in, but it is not listed as a Swadakta admin yet.");
        return;
      }

      showAuth(true);
      readinessMode.textContent = "Needs attention";
      renderEmpty(message);
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
      setLoginStatus("Signed in. Loading readiness.", "text-primary");
      await loadReadiness();
    } catch (error) {
      setLoginStatus(error.message || "Sign-in failed.", "text-on-error-container");
    }
  });

  sendLinkButton?.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
      setLoginStatus("Enter the admin email first.", "text-on-error-container");
      return;
    }

    setLoginStatus("Sending backup link...");
    try {
      await data.signInAdmin(email, "admin-readiness.html");
      setLoginStatus("Backup link sent. Open it in this browser, then return here.", "text-primary");
    } catch (error) {
      setLoginStatus(error.message || "Could not send backup link.", "text-on-error-container");
    }
  });

  signOutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await data.signOut();
      await loadReadiness();
    });
  });

  refreshButton?.addEventListener("click", loadReadiness);

  copyChecklistButton?.addEventListener("click", async () => {
    await copyText(buildChecklist(), "Launch checklist copied.");
  });

  copyProviderPackButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await copyText(buildProviderPack(), "Provider setup pack copied.");
    });
  });

  copyProviderMatrixButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await copyText(buildProviderMatrixPack(), "Provider launch matrix copied.");
    });
  });

  copyCorridorPlannerButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await copyText(buildCorridorRailPlannerPack(), "Corridor rail planner copied.");
    });
  });

  copyDecisionRegisterButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await copyText(buildLaunchDecisionRegisterPack(), "Launch decision register copied.");
    });
  });

  copyLaunchSessionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await copyText(buildLaunchSessionPack(), "Founder Chrome work session copied.");
    });
  });

  copyFounderPackButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await copyText(buildFounderActionPack(), "Founder launch pack copied.");
    });
  });

  copyPilotScriptButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await copyText(buildPilotScript(), "First paid pilot script copied.");
    });
  });

  copyLaunchGateButton?.addEventListener("click", async () => {
    await copyText(launchGateBrief(), "Launch gate brief copied.");
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-value");
    if (button) {
      await copyText(button.dataset.copyValue, "Safe value copied.");
      return;
    }

    const categoryButton = event.target.closest(".copy-category-pack");
    if (categoryButton) {
      const category = (latestReport?.categories || []).find((entry) => entry.id === categoryButton.dataset.copyCategoryPack);
      await copyText(providerPackCategoryText(category, latestReport), "Category provider pack copied.");
    }
  });

  loadReadiness();
})();
