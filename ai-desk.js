(function () {
  const pageRole = document.body.classList.contains("admin-body")
    ? "admin"
    : document.body.classList.contains("portal-body")
      ? "client"
      : "client";

  const pageName = document.body.classList.contains("admin-body")
    ? "Founder console"
    : document.body.classList.contains("portal-body")
      ? "Portal"
      : "Public website";

  function fieldValue(selector) {
    const node = document.querySelector(selector);
    if (!node) {
      return "";
    }
    if (node.type === "checkbox") {
      return node.checked ? "yes" : "no";
    }
    return String(node.value || "").trim();
  }

  function selectedValues(selector) {
    return Array.from(document.querySelectorAll(selector))
      .filter((node) => node.checked)
      .map((node) => node.value);
  }

  function publicContext() {
    return {
      page: pageName,
      route: {
        origin_country: fieldValue("#origin-country"),
        destination_country: fieldValue("#destination-country"),
        service_direction: fieldValue("#service-direction"),
        logistics_mode: fieldValue("#logistics-mode"),
        goods_category: fieldValue("#goods-category"),
      },
      job: {
        service_package: fieldValue("#service-package"),
        task_type: fieldValue("#task-type"),
        task_location: fieldValue("#location"),
        urgency: fieldValue("#urgency"),
        deadline: fieldValue("#deadline"),
        value_band: fieldValue("#job-value-band"),
        funds_protection: fieldValue("#funds-protection-preference"),
        proof_priority: fieldValue("#proof-priority"),
        report_pack: selectedValues('input[name="report"]'),
      },
      client: {
        based_in: fieldValue("#diaspora-location"),
        preferred_currency: fieldValue("#preferred-currency"),
        contact_preference: fieldValue("#contact-preference"),
      },
      draft_notes: fieldValue("#notes"),
    };
  }

  function currentContext() {
    if (typeof window.SwadaktaAdminContext === "function") {
      return window.SwadaktaAdminContext();
    }

    if (typeof window.SwadaktaPortalContext === "function") {
      return window.SwadaktaPortalContext();
    }

    return publicContext();
  }

  function countMissingPublicFields(context) {
    const missing = [];
    if (!fieldValue("#client-name")) missing.push("client name");
    if (!fieldValue("#whatsapp")) missing.push("WhatsApp");
    if (!context.client.based_in) missing.push("where the client is based");
    if (!context.job.task_location) missing.push("task location");
    if (!context.draft_notes) missing.push("job notes");
    if (context.route.logistics_mode !== "not_needed" && !fieldValue("#logistics-notes")) {
      missing.push("logistics notes");
    }
    return missing;
  }

  function deterministicAnswer(task, prompt, context) {
    const lines = [];
    const lowerTask = String(task || "").toLowerCase();
    const adminSummary = context?.summary || {};
    const isAdmin = pageRole === "admin";
    const isPortal = pageName === "Portal";

    lines.push("AI Desk guidance");

    if (isAdmin) {
      lines.push(
        `Queue: ${adminSummary.total_requests || 0} requests, ${adminSummary.open_requests || 0} open, ${adminSummary.payment_gaps || 0} payment gaps, ${adminSummary.id_gaps || 0} ID gaps, ${adminSummary.release_decisions || 0} release decisions.`,
      );
      lines.push("Next move: clear payment, ID, compliance, proof, and release blockers before chasing growth.");
      lines.push("Prediction: the next founder load will usually come from quote approvals, ID verification links, payment reconciliation, receiver assignment, or milestone-release decisions.");
    } else if (isPortal) {
      const account = context?.account || {};
      const requests = context?.client_requests || [];
      const applications = context?.receiver_applications || [];
      const jobs = context?.assigned_jobs || [];
      lines.push(
        `Account view: ${account.email || "not signed in"}, ${requests.length} client request(s), ${applications.length} receiver application(s), ${jobs.length} assigned job(s).`,
      );
      if (!account.email) {
        lines.push("Next move: sign in with email, save a profile, then use the client or receiver path.");
      } else if (account.identity_verification_status !== "verified") {
        lines.push("Prediction: ID verification will be the next gate before paid, sensitive, or receiver work proceeds.");
      } else {
        lines.push("Next move: open the relevant request or receiver application and add the missing proof, update, or message.");
      }
    } else {
      const missing = countMissingPublicFields(context);
      const route = [context.route.origin_country, context.route.destination_country].filter(Boolean).join(" to ");
      lines.push(`Route: ${route || "not selected yet"}.`);
      lines.push(
        missing.length
          ? `Missing before a useful quote: ${missing.join(", ")}.`
          : "The brief has enough basics for Swadakta to start quote triage.",
      );

      if (["2000_10000", "10000_plus"].includes(context.job.value_band)) {
        lines.push("Prediction: high-value work will need ID verification, milestone controls, and founder approval before money or receiver assignment.");
      }
      if (context.route.logistics_mode !== "not_needed" || context.route.goods_category !== "none") {
        lines.push("Prediction: physical goods will need item photos, purchase proof, courier/customs checks, and handoff confirmation.");
      }
      if (context.route.goods_category === "restricted_or_unsure") {
        lines.push("Founder approval required: restricted or uncertain goods must be checked before buying, sending, or receiving.");
      }
    }

    if (lowerTask.includes("payment") || lowerTask.includes("money") || lowerTask.includes("milestone")) {
      lines.push("Payment rule: quote first, then use Stripe, PayPal, M-Pesa, or bank where appropriate. Wise stays a hidden fallback. True escrow must use a regulated provider.");
    }

    if (prompt) {
      lines.push(`Draft direction: ${prompt}`);
    }

    lines.push("Boundary: AI can draft, predict, summarize, and recommend. Founder/admin approval is still required for money release, refunds, ID verification, receiver vetting, assignment, and external messages.");
    return lines.join("\n\n");
  }

  function taskOptions() {
    if (pageRole === "admin") {
      return [
        "Predict founder workload",
        "Summarize exception queue",
        "Draft client follow-up",
        "Review money and ID guardrails",
        "List what AI can safely automate",
      ];
    }

    if (pageName === "Portal") {
      return [
        "Explain my next step",
        "Draft a message to Swadakta",
        "Predict blockers",
        "Improve my receiver update",
        "List missing information",
      ];
    }

    return [
      "Choose the right starting path",
      "Draft my first job brief",
      "Predict missing information",
      "Explain payments and milestones",
      "Check if this needs founder review",
    ];
  }

  function createOptionList(options) {
    return options.map((item) => `<option value="${item}">${item}</option>`).join("");
  }

  function createDesk() {
    const shell = document.createElement("section");
    shell.className = "ai-desk";
    shell.id = "ai-desk";
    shell.hidden = true;
    shell.innerHTML = `
      <div class="ai-desk-backdrop" data-ai-desk-close></div>
      <aside class="ai-desk-panel" aria-labelledby="ai-desk-title" role="dialog" aria-modal="true">
        <header class="ai-desk-header">
          <div>
            <p class="eyebrow">Swadakta AI Desk</p>
            <h2 id="ai-desk-title">Ask, predict, draft, route.</h2>
          </div>
          <button class="ai-desk-close" type="button" data-ai-desk-close aria-label="Close AI Desk">Close</button>
        </header>
        <div class="ai-desk-status" id="ai-desk-status">Website guide ready.</div>
        <div class="ai-desk-context" aria-label="AI Desk operating rules">
          <article>
            <strong>Can do</strong>
            <span>Draft replies, improve briefs, summarize requests, predict blockers, and suggest safe next steps.</span>
          </article>
          <article>
            <strong>Cannot do alone</strong>
            <span>Release/refund money, mark ID verified, approve receivers, assign jobs, or send external messages.</span>
          </article>
        </div>
        <label class="field-group" for="ai-desk-task">
          Task
          <select id="ai-desk-task">${createOptionList(taskOptions())}</select>
        </label>
        <label class="field-group" for="ai-desk-prompt">
          What should Swadakta AI help with?
          <textarea id="ai-desk-prompt" rows="4" placeholder="Ask about the current brief, account, receiver application, payment, proof, or next step."></textarea>
        </label>
        <textarea class="ai-desk-output" id="ai-desk-output" rows="10" readonly placeholder="AI Desk output appears here."></textarea>
        <div class="form-actions ai-desk-actions">
          <button class="button button-primary" type="button" id="ai-desk-run">Ask AI Desk</button>
          <button class="button button-secondary" type="button" id="ai-desk-apply">Use in notes</button>
          <button class="button button-secondary" type="button" id="ai-desk-copy">Copy</button>
        </div>
        <p class="form-note">Signed-in users can use the protected AI endpoint. Public visitors still get safe website guidance.</p>
      </aside>
    `;
    document.body.append(shell);
    return shell;
  }

  function setDeskOpen(shell, isOpen) {
    shell.hidden = false;
    shell.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("ai-desk-open", isOpen);
    if (!isOpen) {
      window.setTimeout(() => {
        if (!shell.classList.contains("is-open")) {
          shell.hidden = true;
        }
      }, 180);
    }
  }

  async function copyText(text, status) {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Copied.";
    } catch {
      status.textContent = "Copy unavailable.";
    }
    window.setTimeout(() => {
      status.textContent = "Website guide ready.";
    }, 2200);
  }

  function applyOutput(output, status) {
    const target =
      document.querySelector("#notes") ||
      document.querySelector("#partner-notes") ||
      document.querySelector('textarea[name="profile_notes"]');

    if (!target || target.readOnly || target.disabled) {
      status.textContent = "No editable notes field is open on this page.";
      return;
    }

    const text = output.value.trim();
    if (!text) {
      status.textContent = "Ask AI Desk first.";
      return;
    }

    target.value = target.value.trim() ? `${target.value.trim()}\n\n${text}` : text;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    status.textContent = "Added to notes.";
  }

  async function runDesk(shell) {
    const status = shell.querySelector("#ai-desk-status");
    const output = shell.querySelector("#ai-desk-output");
    const task = shell.querySelector("#ai-desk-task").value;
    const prompt = shell.querySelector("#ai-desk-prompt").value.trim();
    const context = currentContext();
    const fallback = deterministicAnswer(task, prompt, context);
    const role = pageRole === "admin" ? "admin" : task.toLowerCase().includes("receiver") ? "receiver" : "client";

    status.textContent = "Thinking...";
    output.value = "";

    try {
      if (!window.SwadaktaData?.assist) {
        throw new Error("AI endpoint not available on this page.");
      }

      const result = await window.SwadaktaData.assist({
        role,
        task,
        draft: prompt,
        context,
      });
      const text = String(result.data?.output || "").trim();
      output.value = text || fallback;
      status.textContent = text ? `Protected AI used (${result.mode || "assistant"}).` : "Website guide fallback used.";
    } catch (error) {
      output.value = fallback;
      status.textContent = error?.message?.includes("Sign in")
        ? "Sign in for live AI. Website guide used for now."
        : "Website guide fallback used.";
    }
  }

  function init() {
    const shell = createDesk();
    const triggers = document.querySelectorAll("[data-ai-desk-open]");
    const status = shell.querySelector("#ai-desk-status");
    const output = shell.querySelector("#ai-desk-output");

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => setDeskOpen(shell, true));
    });

    shell.querySelectorAll("[data-ai-desk-close]").forEach((trigger) => {
      trigger.addEventListener("click", () => setDeskOpen(shell, false));
    });

    shell.querySelector("#ai-desk-run").addEventListener("click", () => runDesk(shell));
    shell.querySelector("#ai-desk-copy").addEventListener("click", () => copyText(output.value, status));
    shell.querySelector("#ai-desk-apply").addEventListener("click", () => applyOutput(output, status));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && shell.classList.contains("is-open")) {
        setDeskOpen(shell, false);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
