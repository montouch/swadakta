(function () {
  const key = "swadakta_ai_mode";
  const enabled = () => localStorage.getItem(key) !== "off";

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
      button.textContent = isEnabled ? "AI on" : "AI off";
    });
    document.querySelectorAll("[data-ai-only]").forEach((element) => {
      element.hidden = !isEnabled;
    });
    document.querySelectorAll("[data-no-ai-copy]").forEach((element) => {
      element.hidden = isEnabled;
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
