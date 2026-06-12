(function () {
  const key = "swadakta_ai_mode";
  const enabled = () => localStorage.getItem(key) !== "off";
  const onLabel = "AI mode on";
  const offLabel = "Manual mode";
  const onStatus =
    "AI mode is on. Swadakta can show assistant shortcuts, draft helpers, safe routing suggestions, and admin prompt packs.";
  const offStatus =
    "Manual mode is on. Swadakta hides AI-only shortcuts and keeps jobs, verification, messages, payments, tracking, and admin queues usable by hand.";

  const style = document.createElement("style");
  style.textContent = `
    body[data-ai-mode="off"] [data-ai-only] { display: none !important; }
    body[data-ai-mode="on"] [data-no-ai-copy] { display: none !important; }
  `;
  document.head.appendChild(style);

  function applyMode() {
    const isEnabled = enabled();
    document.documentElement.dataset.aiMode = isEnabled ? "on" : "off";
    document.body.dataset.aiMode = isEnabled ? "on" : "off";
    document.querySelectorAll("[data-ai-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(isEnabled));
      button.textContent = isEnabled
        ? button.dataset.aiOnLabel || onLabel
        : button.dataset.aiOffLabel || offLabel;
      button.title = isEnabled ? onStatus : offStatus;
    });
    document.querySelectorAll("[data-ai-only]").forEach((element) => {
      element.hidden = !isEnabled;
    });
    document.querySelectorAll("[data-no-ai-copy]").forEach((element) => {
      element.hidden = isEnabled;
    });
    document.querySelectorAll("[data-ai-mode-status]").forEach((element) => {
      element.textContent = isEnabled
        ? element.dataset.aiStatusOn || onStatus
        : element.dataset.aiStatusOff || offStatus;
    });
    document.querySelectorAll("[data-ai-disabled-when-off]").forEach((element) => {
      element.disabled = !isEnabled;
      element.setAttribute("aria-disabled", String(!isEnabled));
    });
    window.dispatchEvent(new CustomEvent("swadakta:ai-mode-change", { detail: { enabled: isEnabled } }));
  }

  window.SwadaktaAiPreference = {
    enabled,
    apply: applyMode,
    set(value) {
      localStorage.setItem(key, value ? "on" : "off");
      applyMode();
    },
    toggle() {
      this.set(!enabled());
    },
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ai-toggle]");
    if (!button) return;
    event.preventDefault();
    window.SwadaktaAiPreference.toggle();
  });

  applyMode();
})();
