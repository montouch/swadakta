(function () {
  const card = document.querySelector("#message-context-card");
  const codeEl = document.querySelector("#message-request-code");
  const contactEl = document.querySelector("#message-contact-copy");
  const trackingLink = document.querySelector("#message-tracking-link");

  if (!card) return;

  const params = new URLSearchParams(window.location.search);
  const code = String(params.get("code") || "").trim().toUpperCase();
  const contact = String(params.get("contact") || "").trim();

  if (!code && !contact) return;

  card.hidden = false;
  if (codeEl) codeEl.textContent = code || "Request code pending";
  if (contactEl) {
    contactEl.textContent = contact
      ? `Connected to ${contact}. Keep proof, calls, and updates tied to this request.`
      : "Keep proof, calls, and updates tied to this request.";
  }

  if (trackingLink) {
    const url = new URL("tracking.html", window.location.href);
    if (code) url.searchParams.set("code", code);
    if (contact) url.searchParams.set("contact", contact);
    trackingLink.href = `${url.pathname}${url.search}`;
  }
})();
