(function () {
  const form = document.querySelector("#resolution-form");
  const codeInput = document.querySelector("#resolution-code");
  const contactInput = document.querySelector("#resolution-contact");
  const roleInput = document.querySelector("#resolution-role");
  const nameInput = document.querySelector("#resolution-name");
  const issueInput = document.querySelector("#resolution-issue-type");
  const outcomeInput = document.querySelector("#resolution-desired-outcome");
  const severityInput = document.querySelector("#resolution-severity");
  const paymentActionInput = document.querySelector("#resolution-payment-action");
  const amountInput = document.querySelector("#resolution-amount");
  const providerReferenceInput = document.querySelector("#resolution-provider-reference");
  const evidenceInput = document.querySelector("#resolution-evidence-links");
  const summaryInput = document.querySelector("#resolution-summary");
  const statusEl = document.querySelector("#resolution-status");
  const listEl = document.querySelector("#resolution-list");
  const refreshButton = document.querySelector("#resolution-refresh");
  const submitButton = document.querySelector("#resolution-submit");
  const trackingLink = document.querySelector("#resolution-tracking-link");
  const messageLink = document.querySelector("#resolution-message-link");
  const assistantLink = document.querySelector("#resolution-assistant-link");

  if (!form || !window.SwadaktaData) return;

  const params = new URLSearchParams(window.location.search);

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

  function setStatus(message, tone = "") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `min-h-6 text-sm font-label ${tone || "text-on-surface-variant"}`.trim();
  }

  function formatLabel(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function currentCode() {
    return String(codeInput?.value || "").trim().toUpperCase();
  }

  function currentContact() {
    return String(contactInput?.value || "").trim();
  }

  function evidenceLinks() {
    return String(evidenceInput?.value || "")
      .split(/\r?\n|,/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  function updateContextLinks() {
    const code = currentCode();
    const contact = currentContact();

    for (const [link, target] of [
      [trackingLink, "tracking.html"],
      [messageLink, "messages.html"],
    ]) {
      if (!link) continue;
      const url = new URL(target, window.location.href);
      if (code) url.searchParams.set("code", code);
      if (contact) url.searchParams.set("contact", contact);
      link.href = `${url.pathname}${url.search}`;
    }

    if (assistantLink) {
      const prompt = code
        ? `Help me resolve request ${code}. Issue: ${formatLabel(issueInput?.value)}. Desired outcome: ${formatLabel(outcomeInput?.value)}.`
        : "Help me understand how Swadakta resolution works.";
      const url = new URL("assistant.html", window.location.href);
      url.searchParams.set("prompt", prompt);
      assistantLink.href = `${url.pathname}${url.search}`;
    }
  }

  function caseBadge(issue) {
    const clean = String(issue || "").toLowerCase();
    if (["payment_refund", "payment_dispute"].includes(clean)) return "text-tertiary bg-white/80";
    if (["receiver_safety", "restricted_item"].includes(clean)) return "text-error bg-white/80";
    return "text-primary bg-white/80";
  }

  function renderCases(cases = []) {
    if (!listEl) return;

    if (!cases.length) {
      listEl.innerHTML =
        '<p class="rounded-2xl bg-white/70 border border-outline-variant/40 p-4 text-sm text-on-surface-variant">No resolution cases found for this request yet.</p>';
      return;
    }

    listEl.innerHTML = cases
      .map((item) => {
        const founder = item.founder_review_required
          ? '<span class="inline-flex min-h-8 px-3 items-center rounded-full bg-tertiary/10 text-tertiary font-label text-xs">Founder review required</span>'
          : '<span class="inline-flex min-h-8 px-3 items-center rounded-full bg-primary/10 text-primary font-label text-xs">AI triage</span>';
        const created = item.created_at ? new Date(item.created_at).toLocaleString() : "Just now";
        return `
          <article class="rounded-2xl bg-white/72 border border-outline-variant/40 p-5">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p class="font-label text-xs uppercase tracking-[0.14em] text-on-surface-variant">${escapeHtml(item.resolution_code || "Resolution case")}</p>
                <h3 class="font-display text-xl font-bold mt-2">${escapeHtml(formatLabel(item.issue_type))}</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <span class="inline-flex min-h-8 px-3 items-center rounded-full ${caseBadge(item.issue_type)} font-label text-xs">${escapeHtml(formatLabel(item.status))}</span>
                ${founder}
              </div>
            </div>
            <p class="mt-3 text-sm text-on-surface-variant">${escapeHtml(item.ai_triage || "Triage pending.")}</p>
            <div class="mt-4 grid gap-2 text-xs text-on-surface-variant sm:grid-cols-3">
              <span>Outcome: ${escapeHtml(formatLabel(item.desired_outcome))}</span>
              <span>Severity: ${escapeHtml(formatLabel(item.severity))}</span>
              <span>Created: ${escapeHtml(created)}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function resolutionPayload() {
    const amount = Number(amountInput?.value || "");
    return {
      reporter_role: roleInput?.value || "client",
      reporter_name: nameInput?.value || "",
      issue_type: issueInput?.value || "other",
      desired_outcome: outcomeInput?.value || "explain_status",
      severity: severityInput?.value || "normal",
      payment_action_requested: paymentActionInput?.value || "none",
      amount_in_dispute: Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null,
      provider_reference: providerReferenceInput?.value || "",
      evidence_links: evidenceLinks(),
      summary: summaryInput?.value || "",
    };
  }

  async function loadCases() {
    const code = currentCode();
    const contact = currentContact();
    updateContextLinks();

    if (!code || !contact) {
      renderCases([]);
      return;
    }

    try {
      if (refreshButton) refreshButton.disabled = true;
      const result = await window.SwadaktaData.listRequestResolutionCases(code, contact);
      renderCases(result.data || []);
    } catch (error) {
      if (listEl) {
        listEl.innerHTML = `<p class="rounded-2xl bg-white/70 border border-outline-variant/40 p-4 text-sm text-on-surface-variant">${escapeHtml(error.message || "Could not load resolution cases.")}</p>`;
      }
    } finally {
      if (refreshButton) refreshButton.disabled = false;
    }
  }

  if (params.get("code")) codeInput.value = String(params.get("code") || "").toUpperCase();
  if (params.get("contact")) contactInput.value = params.get("contact") || "";

  updateContextLinks();
  if (currentCode() && currentContact()) {
    loadCases();
  }

  for (const input of [codeInput, contactInput, issueInput, outcomeInput]) {
    input?.addEventListener("input", updateContextLinks);
    input?.addEventListener("change", updateContextLinks);
  }

  refreshButton?.addEventListener("click", loadCases);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = currentCode();
    const contact = currentContact();

    if (!code || !contact) {
      setStatus("Add the request code and contact used on the brief.", "text-error");
      return;
    }

    try {
      setStatus("Opening resolution case...");
      if (submitButton) submitButton.disabled = true;
      const result = await window.SwadaktaData.createResolutionCase(code, contact, resolutionPayload());
      const data = result.data || {};
      setStatus(
        data.resolution_code
          ? `Issue opened as ${data.resolution_code}. ${data.founder_review_required ? "Founder review is required." : "AI triage can continue first."}`
          : "Issue opened.",
        "text-primary",
      );
      summaryInput.value = "";
      providerReferenceInput.value = "";
      amountInput.value = "";
      evidenceInput.value = "";
      await loadCases();
    } catch (error) {
      setStatus(error.message || "Could not open the issue.", "text-error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
})();
