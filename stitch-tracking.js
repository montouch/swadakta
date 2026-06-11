(function () {
  const form = document.querySelector("#tracking-form");
  const resultEl = document.querySelector("#tracking-result");
  const codeInput = document.querySelector("#tracking-code");
  const contactInput = document.querySelector("#tracking-contact");
  const title = document.querySelector("#tracking-title");
  const codeLabel = document.querySelector("#tracking-code-label");
  const assignee = document.querySelector("#tracking-assignee");
  const messageLink = document.querySelector("#tracking-message-link");
  const jobRoomLink = document.querySelector("#tracking-job-room-link");

  if (!form || !window.SwadaktaData) return;

  function setResult(message, tone = "") {
    resultEl.textContent = message;
    resultEl.className = `md:col-span-3 font-label-md text-label-md min-h-6 ${tone}`.trim();
  }

  function formatStatus(value) {
    return String(value || "new")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function updateJobRoomLinks(code = codeInput.value.trim(), contact = contactInput.value.trim()) {
    const url = new URL("messages.html", window.location.href);
    if (code) url.searchParams.set("code", code.toUpperCase());
    if (contact) url.searchParams.set("contact", contact);
    const href = `${url.pathname}${url.search}`;
    if (messageLink) messageLink.href = href;
    if (jobRoomLink) jobRoomLink.href = href;
  }

  function renderRequest(request) {
    if (!request) {
      setResult("No matching request found. Check the code and contact used on the original brief.", "text-error");
      return;
    }

    const code = request.request_code || codeInput.value.trim().toUpperCase();
    updateJobRoomLinks(code, contactInput.value.trim());
    const task = request.task_location || request.kenya_location || request.destination_country || "Global corridor request";
    const status = formatStatus(request.status);
    const payment = formatStatus(request.payment_status || request.funds_status || "not_collected");

    codeLabel.textContent = `Case #${code}`;
    title.textContent = task;
    assignee.textContent = request.assigned_to
      ? `Assigned to: ${request.assigned_to}`
      : "AI triage first; human review only when risk or compliance requires it";
    setResult(`Status: ${status}. Payment: ${payment}. ID verification: ${formatStatus(request.verification_status || "required")}.`, "text-primary");
  }

  async function lookup() {
    const code = codeInput.value.trim();
    const contact = contactInput.value.trim();
    if (!code || !contact) return;
    setResult("Opening request...");
    try {
      const result = await window.SwadaktaData.trackRequest(code, contact);
      renderRequest(result.data);
    } catch (error) {
      setResult(error.message || "Could not open request.", "text-error");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    lookup();
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("code")) codeInput.value = params.get("code");
  if (params.get("contact")) contactInput.value = params.get("contact");
  updateJobRoomLinks();
  if (codeInput.value && contactInput.value) lookup();
})();
