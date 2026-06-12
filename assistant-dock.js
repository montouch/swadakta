(function () {
  if (window.SwadaktaAssistantDock) return;

  const DOCK_VERSION = "10";
  const rootId = "swadakta-ai-dock";
  const protectedBoundary =
    "Protected actions stay gated: AI cannot verify ID, release or refund money, assign paid work, mark payment received, or send external messages without provider/system evidence or founder approval.";
  const protectedIntentPattern =
    /\b(release\s+(money|funds)|refund|mark\s+.*(paid|verified)|approve\s+.*(id|identity|receiver|job)|assign\s+.*(receiver|job|paid)|send\s+.*(message|email|whatsapp)|submit\s+.*(payment|refund)|pay\s*out|payout)\b/i;
  const routeMap = {
    home: ["Account home", "portal.html#home"],
    post_job: ["Post a job", "corridor.html"],
    brief: ["Create brief", "brief.html"],
    find_work: ["Find work", "portal.html#receiver"],
    tracking: ["Track jobs", "tracking.html"],
    messages: ["Messages", "messages.html"],
    notifications: ["Notifications", "notifications.html"],
    verification: ["Verify ID", "verification.html"],
    payments: ["Payments", "payments.html"],
    rules: ["Item rules", "rules.html"],
    resolution: ["Resolve issue", "resolution.html"],
    trust: ["Trust center", "trust.html"],
    full_ai: ["Full AI chat", "assistant.html"],
  };
  const safeActionMap = {
    navigate: "Open a Swadakta page or tool.",
    open_visible_link: "Open a safe visible link on the current page.",
    focus_next_field: "Focus the next empty visible field.",
    focus_section: "Scroll to a matching section on this page.",
    apply_to_notes: "Place the last AI draft into an editable notes field.",
    open_full_ai: "Open the full Ask AI page with this page as context.",
    explain_screen: "Explain the current screen and next safe step.",
  };
  const state = {
    open: false,
    busy: false,
    lastAssistantText: "",
    messages: [],
  };
  const authCtaLabels = new Set([
    "sign in",
    "get started",
    "create account",
    "open account",
    "open account first",
    "sign in to verify",
  ]);

  function aiDockEnabled() {
    if (window.SwadaktaAiPreference?.enabled) return window.SwadaktaAiPreference.enabled();
    try {
      return localStorage.getItem("swadakta_ai_mode") !== "off";
    } catch {
      return true;
    }
  }

  function injectStyles() {
    if (document.querySelector("#swadakta-ai-dock-style")) return;
    const style = document.createElement("style");
    style.id = "swadakta-ai-dock-style";
    style.textContent = `
      #${rootId} { position: fixed; inset: auto 18px 18px auto; z-index: 9998; font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #131b2e; }
      #${rootId}, #${rootId} * { box-sizing: border-box; }
      .sw-ai-fab { display: inline-flex; align-items: center; gap: 9px; min-height: 52px; padding: 0 16px; border: 1px solid rgba(255,255,255,.72); border-radius: 999px; background: linear-gradient(135deg, rgba(70,72,212,.94), rgba(129,39,207,.88)); color: #fff; box-shadow: 0 22px 50px rgba(48,52,150,.27); cursor: pointer; font-weight: 800; letter-spacing: 0; }
      .sw-ai-fab-dot { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 999px; background: rgba(255,255,255,.18); }
      .sw-ai-panel { position: absolute; right: 0; bottom: 66px; width: min(390px, calc(100vw - 24px)); max-height: min(720px, calc(100vh - 96px)); display: none; overflow: hidden; border-radius: 24px; border: 1px solid rgba(255,255,255,.62); background: rgba(250,248,255,.88); backdrop-filter: blur(24px); box-shadow: 0 34px 90px rgba(35,42,105,.24); }
      .sw-ai-open .sw-ai-panel { display: flex; flex-direction: column; }
      .sw-ai-header { padding: 16px; border-bottom: 1px solid rgba(199,196,215,.42); background: rgba(255,255,255,.48); }
      .sw-ai-title-row { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
      .sw-ai-eyebrow { margin: 0 0 4px; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #4648d4; }
      .sw-ai-title { margin: 0; font: 800 20px/1.1 Manrope, Inter, sans-serif; color: #131b2e; }
      .sw-ai-page { margin: 6px 0 0; font-size: 12px; line-height: 1.5; color: #464554; }
      .sw-ai-icon-button { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid rgba(199,196,215,.54); border-radius: 999px; background: rgba(255,255,255,.72); color: #4648d4; cursor: pointer; font-weight: 900; }
      .sw-ai-quick { display: flex; gap: 8px; overflow-x: auto; padding: 12px 16px 10px; border-bottom: 1px solid rgba(199,196,215,.32); }
      .sw-ai-chip { flex: 0 0 auto; min-height: 34px; padding: 0 12px; border: 1px solid rgba(199,196,215,.52); border-radius: 999px; background: rgba(255,255,255,.7); color: #131b2e; cursor: pointer; font-size: 12px; font-weight: 800; }
      .sw-ai-messages { min-height: 190px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 14px; }
      .sw-ai-message { max-width: 88%; padding: 11px 13px; border-radius: 18px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
      .sw-ai-message.ai { align-self: flex-start; border-bottom-left-radius: 6px; border: 1px solid rgba(199,196,215,.38); background: rgba(255,255,255,.82); color: #464554; }
      .sw-ai-message.user { align-self: flex-end; border-bottom-right-radius: 6px; background: #4648d4; color: #fff; box-shadow: 0 14px 32px rgba(70,72,212,.18); }
      .sw-ai-actions { display: flex; flex-wrap: wrap; gap: 7px; padding: 0 14px 12px; }
      .sw-ai-action { min-height: 34px; padding: 0 11px; border: 1px solid rgba(70,72,212,.28); border-radius: 999px; background: rgba(255,255,255,.78); color: #4648d4; cursor: pointer; font-size: 12px; font-weight: 800; }
      .sw-ai-composer { padding: 12px; border-top: 1px solid rgba(199,196,215,.38); background: rgba(255,255,255,.54); }
      .sw-ai-compose-box { display: flex; align-items: end; gap: 8px; border: 1px solid rgba(199,196,215,.52); border-radius: 18px; background: rgba(255,255,255,.86); padding: 8px; }
      .sw-ai-input { flex: 1; min-height: 38px; max-height: 110px; resize: none; border: 0; outline: 0; background: transparent; color: #131b2e; font: 500 13px/1.45 Inter, system-ui, sans-serif; }
      .sw-ai-send { display: grid; place-items: center; width: 38px; height: 38px; border: 0; border-radius: 999px; background: #4648d4; color: #fff; cursor: pointer; font-weight: 900; }
      .sw-ai-send:disabled { opacity: .58; cursor: not-allowed; }
      .sw-ai-note { margin: 8px 2px 0; font-size: 11px; line-height: 1.4; color: #464554; }
      @media (max-width: 640px) {
        #${rootId} { left: auto; right: 12px; bottom: max(72px, calc(env(safe-area-inset-bottom) + 72px)); width: auto; }
        .sw-ai-fab { justify-content: center; width: 50px; min-height: 50px; padding: 0; border-radius: 18px; }
        .sw-ai-fab > span:last-child { display: none; }
        .sw-ai-fab-dot { width: 30px; height: 30px; font-size: 12px; }
        .sw-ai-panel { position: fixed; left: 12px; right: 12px; bottom: max(132px, calc(env(safe-area-inset-bottom) + 132px)); width: auto; max-width: calc(100vw - 24px); max-height: min(720px, calc(100dvh - 172px)); border-radius: 22px; }
      }
    `;
    document.head.append(style);
  }

  function injectSitePolishStyles() {
    if (document.querySelector("#swadakta-site-polish-style")) return;
    const style = document.createElement("style");
    style.id = "swadakta-site-polish-style";
    style.textContent = `
      html, body { max-width: 100%; overflow-x: clip; }
      body [hidden] { display: none !important; }
      body header, body nav, body main, body section, body article, body form, body aside, body footer, body .glass-panel, body .glass-card { min-width: 0; }
      body .grid > *, body .flex > * { min-width: 0; }
      body a, body button, body label, body summary { overflow-wrap: anywhere; }
      body .material-symbols-outlined {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1em;
        max-width: 1.35em;
        overflow: hidden;
        white-space: nowrap;
        line-height: 1;
        letter-spacing: 0;
      }
      body a[class*="inline-flex"], body button[class*="inline-flex"], body a[class*="flex"], body button[class*="flex"], body .button, body .header-action {
        min-width: 0;
        max-width: 100%;
        white-space: normal;
        text-align: center;
        line-height: 1.15;
        text-wrap: balance;
      }
      body main a[class*="inline-flex"], body main button[class*="inline-flex"], body main a[class*="flex"], body main button[class*="flex"],
      body section a[class*="inline-flex"], body section button[class*="inline-flex"], body section a[class*="flex"], body section button[class*="flex"] {
        flex-shrink: 1;
      }
      body main .flex-wrap > a[class*="inline-flex"], body main .flex-wrap > button[class*="inline-flex"],
      body section .flex-wrap > a[class*="inline-flex"], body section .flex-wrap > button[class*="inline-flex"] {
        flex: 0 1 auto;
        min-width: 0;
      }
      body button, body a, body label { -webkit-tap-highlight-color: transparent; }
      body header a, body header button {
        flex-shrink: 1;
        min-width: 0;
        max-width: 100%;
      }
      body header nav {
        min-width: 0;
        overflow: hidden;
      }
      body header nav a {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      body [class*="grid-cols-2"] > *, body [class*="grid-cols-3"] > *, body [class*="grid-cols-4"] > * {
        min-width: 0;
      }
      body [class*="rounded"] strong, body [class*="rounded"] span, body [class*="rounded"] p {
        max-width: 100%;
      }
      body .swadakta-auth-cta {
        white-space: nowrap;
      }
      body.swadakta-session-signed-in .swadakta-auth-cta {
        background: rgba(255,255,255,.76);
        color: #4648d4;
        border: 1px solid rgba(199,196,215,.58);
      }
      @media (max-width: 900px) {
        body header {
          padding-left: 16px !important;
          padding-right: 16px !important;
          gap: 12px !important;
        }
        body header nav {
          gap: 14px !important;
        }
        body header .font-display-lg, body header .font-display, body header .brand {
          flex: 0 0 auto;
        }
      }
      @media (max-width: 640px) {
        body [class*="tracking-"] {
          letter-spacing: 0 !important;
        }
        body a[class*="px-8"], body button[class*="px-8"] {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        body a[class*="px-6"], body button[class*="px-6"] {
          padding-left: .9rem !important;
          padding-right: .9rem !important;
        }
        body header nav {
          display: none !important;
        }
        body header a[href*="portal"], body header a[href*="/portal"] {
          max-width: 48vw;
        }
        body main div[class*="flex"][class*="gap-"]:not(.sw-ai-compose-box):not(.sw-ai-title-row):not(.sw-ai-quick),
        body section div[class*="flex"][class*="gap-"]:not(.sw-ai-compose-box):not(.sw-ai-title-row):not(.sw-ai-quick) {
          flex-wrap: wrap;
        }
        body main a[class*="inline-flex"], body main button[class*="inline-flex"], body section a[class*="inline-flex"], body section button[class*="inline-flex"],
        body main a[class*="flex"], body main button[class*="flex"], body section a[class*="flex"], body section button[class*="flex"] {
          min-width: 0;
        }
      }
    `;
    document.head.append(style);
  }

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

  function visibleText(node) {
    return String(node?.innerText || node?.textContent || "").trim().replace(/\s+/g, " ");
  }

  function normalizedText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractEmailFromSessionLike(value) {
    if (!value) return "";
    if (typeof value === "string") {
      try {
        return extractEmailFromSessionLike(JSON.parse(value));
      } catch {
        return /\S+@\S+\.\S+/.test(value) ? value : "";
      }
    }

    if (typeof value !== "object") return "";
    return (
      value.user?.email ||
      value.session?.user?.email ||
      value.currentSession?.user?.email ||
      value.current_session?.user?.email ||
      value.data?.session?.user?.email ||
      value.data?.user?.email ||
      ""
    );
  }

  function storedSupabaseSessionEmail() {
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index) || "";
        if (!/^sb-.+-auth-token$/.test(key) && !key.includes("supabase.auth.token")) continue;
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw || "{}");
        const expiresAt = Number(parsed.expires_at || parsed.currentSession?.expires_at || parsed.session?.expires_at || 0);
        if (expiresAt && expiresAt * 1000 < Date.now()) continue;
        const email = extractEmailFromSessionLike(parsed);
        if (email) return email;
      }
    } catch {
      return "";
    }
    return "";
  }

  function rememberedAccountEmail() {
    try {
      const openUntil = Number(sessionStorage.getItem("swadakta_account_home_open_until") || 0);
      if (openUntil && openUntil > Date.now()) return sessionStorage.getItem("swadakta_account_home_email") || "";
    } catch {
      return "";
    }
    return "";
  }

  async function currentAccountSession() {
    try {
      if (window.SwadaktaData?.getSession) {
        const result = await window.SwadaktaData.getSession();
        const email = result.session?.user?.email || "";
        if (email) return { signedIn: true, email };
      }
    } catch {
      // Fall back to browser storage below.
    }

    const email = storedSupabaseSessionEmail() || rememberedAccountEmail();
    return { signedIn: Boolean(email), email };
  }

  function isAccountCta(node) {
    if (!node || node.closest(`#${rootId}`)) return false;
    if (node.closest("form") && !node.closest("header")) return false;
    const href = node.getAttribute?.("href") || "";
    const label = normalizedText(visibleText(node) || node.getAttribute?.("aria-label") || "");
    if (!authCtaLabels.has(label)) return false;
    return node.closest("header") || /portal|auth/i.test(href);
  }

  function replaceElementLabel(node, label) {
    if (!node) return;
    if (node.textContent === label) return;
    node.textContent = label;
  }

  function setAttributeIfChanged(node, name, value) {
    if (!node || node.getAttribute(name) === value) return;
    node.setAttribute(name, value);
  }

  function accountHomeHref() {
    return location.pathname.includes("portal") ? "#home" : "portal.html#home";
  }

  function syncAccountCtas({ signedIn, email } = {}) {
    document.body.classList.toggle("swadakta-session-signed-in", Boolean(signedIn));
    document.body.classList.toggle("swadakta-session-signed-out", !signedIn);

    [...document.querySelectorAll("a[href], button")]
      .filter(isAccountCta)
      .forEach((node) => {
        if (!node.dataset.swadaktaOriginalText) node.dataset.swadaktaOriginalText = visibleText(node) || node.textContent || "";
        if (!node.dataset.swadaktaOriginalHref && node.getAttribute("href")) {
          node.dataset.swadaktaOriginalHref = node.getAttribute("href") || "";
        }
        node.classList.add("swadakta-auth-cta");

        if (signedIn) {
          replaceElementLabel(node, node.closest("header") ? "Account home" : "Open account");
          if (node.tagName === "A") setAttributeIfChanged(node, "href", accountHomeHref());
          setAttributeIfChanged(node, "aria-label", email ? `Open account home for ${email}` : "Open account home");
          setAttributeIfChanged(node, "data-swadakta-auth-state", "signed-in");
        } else {
          replaceElementLabel(node, node.dataset.swadaktaOriginalText || "Sign in");
          if (node.tagName === "A" && node.dataset.swadaktaOriginalHref) {
            setAttributeIfChanged(node, "href", node.dataset.swadaktaOriginalHref);
          }
          node.removeAttribute("data-swadakta-auth-state");
        }
      });
  }

  async function refreshAccountCtas() {
    const session = await currentAccountSession();
    syncAccountCtas(session);
    return session;
  }

  function bindAccountCtaRefresh() {
    window.addEventListener("storage", (event) => {
      if (/auth|swadakta_account_home/i.test(event.key || "")) refreshAccountCtas();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshAccountCtas();
    });
    if (window.SwadaktaData?.onAuthStateChange) {
      Promise.resolve(window.SwadaktaData.onAuthStateChange(() => refreshAccountCtas())).catch(() => {});
    }
    const observer = new MutationObserver(() => {
      window.clearTimeout(observer.refreshTimer);
      observer.refreshTimer = window.setTimeout(refreshAccountCtas, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    [0, 500, 1800].forEach((delay) => window.setTimeout(refreshAccountCtas, delay));
  }

  function actionTokens(value) {
    const stopWords = new Set([
      "a",
      "an",
      "and",
      "at",
      "best",
      "button",
      "click",
      "for",
      "go",
      "here",
      "in",
      "me",
      "on",
      "open",
      "place",
      "please",
      "show",
      "take",
      "the",
      "this",
      "to",
      "tool",
    ]);
    return normalizedText(value)
      .split(" ")
      .filter((token) => token.length > 2 && !stopWords.has(token));
  }

  function isVisible(node) {
    if (!node || node.closest("[hidden], [aria-hidden='true']")) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function humanizeFieldName(value) {
    return String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function fieldLabel(node) {
    const escapedId = node.id
      ? window.CSS?.escape
        ? CSS.escape(node.id)
        : String(node.id).replace(/["\\]/g, "\\$&")
      : "";
    const id = escapedId ? document.querySelector(`label[for="${escapedId}"]`) : null;
    const label = id || node.closest("label");
    return (
      visibleText(label) ||
      node.getAttribute("aria-label") ||
      humanizeFieldName(node.name || node.id) ||
      String(node.placeholder || "").slice(0, 80) ||
      "Field"
    );
  }

  function safeFieldValue(node) {
    if (node.type === "password" || node.type === "hidden") return "";
    if (node.type === "file") return node.files?.length ? `${node.files.length} file selected` : "";
    if (node.type === "checkbox" || node.type === "radio") return node.checked ? "checked" : "";
    return String(node.value || "").trim().slice(0, 160);
  }

  function isEditableField(node) {
    return (
      isVisible(node) &&
      !node.disabled &&
      !node.readOnly &&
      node.type !== "hidden" &&
      node.type !== "password" &&
      node.type !== "file"
    );
  }

  function collectVisibleFields() {
    return [...document.querySelectorAll("input, select, textarea")]
      .filter(isEditableField)
      .slice(0, 14)
      .map((node) => ({
        label: fieldLabel(node).slice(0, 80),
        value: safeFieldValue(node),
        required: Boolean(node.required),
      }));
  }

  function collectPageContext() {
    const headings = [...document.querySelectorAll("h1, h2")]
      .filter(isVisible)
      .map(visibleText)
      .filter(Boolean)
      .slice(0, 8);
    const actions = [...document.querySelectorAll("a, button")]
      .filter(isVisible)
      .map(visibleText)
      .filter(Boolean)
      .filter((text) => text.length <= 60)
      .slice(0, 16);
    return {
      page: document.title || "Swadakta",
      path: `${location.pathname}${location.hash || ""}`,
      main_heading: headings[0] || "",
      visible_headings: headings,
      visible_actions: actions,
      visible_fields: collectVisibleFields(),
      ai_mode: window.SwadaktaAiPreference?.enabled?.() === false ? "off" : "on",
    };
  }

  function visibleActionLabel(node) {
    return (
      visibleText(node) ||
      node.getAttribute("aria-label") ||
      node.getAttribute("title") ||
      node.getAttribute("href") ||
      ""
    );
  }

  function sameSiteHref(node) {
    const rawHref = node?.getAttribute?.("href") || "";
    if (!rawHref || rawHref.startsWith("javascript:") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
      return "";
    }

    try {
      const url = new URL(rawHref, window.location.href);
      if (!["http:", "https:"].includes(url.protocol)) return "";
      if (url.origin !== window.location.origin) return "";
      if (!location.pathname.includes("admin") && /^\/admin/i.test(url.pathname)) return "";
      return url.href;
    } catch {
      return "";
    }
  }

  function isProtectedActionText(label = "") {
    return (
      protectedIntentPattern.test(label) ||
      /\b(admin|founder|ops|sign\s*out|logout|delete|remove|capture|webhook|callback|autopilot|submit|send|save|approve|reject|decline|assign|release|refund|paid|verified)\b/i.test(
        label,
      )
    );
  }

  function tokenOverlapScore(prompt, label) {
    const promptTokens = actionTokens(prompt);
    const labelTokens = actionTokens(label);
    if (!promptTokens.length || !labelTokens.length) return 0;

    return labelTokens.reduce((score, token) => {
      if (promptTokens.includes(token)) return score + 2;
      if (promptTokens.some((promptToken) => promptToken.startsWith(token) || token.startsWith(promptToken))) return score + 1;
      return score;
    }, 0);
  }

  function findVisibleSafeLink(prompt) {
    const candidates = [...document.querySelectorAll("a[href]")]
      .filter((node) => isVisible(node) && !node.closest(`#${rootId}`))
      .map((node) => {
        const label = visibleActionLabel(node);
        const href = sameSiteHref(node);
        return {
          node,
          label,
          href,
          score: href && !isProtectedActionText(label) ? tokenOverlapScore(prompt, label) : 0,
        };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || a.label.length - b.label.length);

    return candidates[0] || null;
  }

  function findVisibleSection(prompt) {
    const sections = [...document.querySelectorAll("section[id], article[id], main[id], [data-section-label]")]
      .filter((node) => isVisible(node) && !node.closest(`#${rootId}`))
      .map((node) => {
        const heading = [...node.querySelectorAll("h1, h2, h3")]
          .filter(isVisible)
          .map(visibleText)
          .find(Boolean);
        const label = node.getAttribute("data-section-label") || heading || humanizeFieldName(node.id);
        return {
          node,
          label,
          score: tokenOverlapScore(prompt, label),
        };
      })
      .filter((section) => section.score > 0)
      .sort((a, b) => b.score - a.score || a.label.length - b.label.length);

    return sections[0] || null;
  }

  function contextSummary(context) {
    const fields = context.visible_fields
      .filter((field) => field.required || !field.value)
      .slice(0, 4)
      .map((field) => field.label)
      .join(", ");
    return `${context.main_heading || context.page}${fields ? ` | next fields: ${fields}` : ""}`;
  }

  function routeKeysForText(text = "") {
    const lower = text.toLowerCase();
    if (/verify|id|identity|kyc/.test(lower)) return ["verification", "trust", "full_ai"];
    if (/post|give|create|brief|request|job/.test(lower)) return ["post_job", "brief", "rules"];
    if (/find work|job seeker|receiver|apply|earn/.test(lower)) return ["find_work", "verification", "messages"];
    if (/pay|payment|money|mpesa|stripe|paypal|wise|escrow|milestone/.test(lower)) return ["payments", "trust", "tracking"];
    if (/message|chat|media|photo|voice|call|proof/.test(lower)) return ["messages", "tracking", "resolution"];
    if (/issue|refund|dispute|delay|resolve|resolution|problem/.test(lower)) return ["resolution", "tracking", "messages"];
    if (/rule|restricted|customs|law|ship|postal|courier/.test(lower)) return ["rules", "trust", "post_job"];
    return ["home", "post_job", "find_work", "verification"];
  }

  function routeKeyFromPrompt(text = "") {
    const lower = text.toLowerCase();
    if (/full\s+(ai|chat)|ask\s+ai\s+page|bigger\s+chat|assistant\s+page/.test(lower)) return "full_ai";
    if (/verify|identity|kyc|id\s+check/.test(lower)) return "verification";
    if (/payment|pay|money|mpesa|stripe|paypal|wise|escrow|milestone|price|pricing/.test(lower)) return "payments";
    if (/message|chat|media|photo|voice|call|proof|upload/.test(lower)) return "messages";
    if (/issue|refund|dispute|delay|resolve|resolution|problem|case/.test(lower)) return "resolution";
    if (/track|status|my\s+jobs|request\s+status|progress/.test(lower)) return "tracking";
    if (/rule|restricted|customs|law|ship|postal|courier|allowed/.test(lower)) return "rules";
    if (/trust|safety|provenance|score|seal/.test(lower)) return "trust";
    if (/find\s+work|job\s+seeker|receiver|apply|earn|get\s+a\s+job/.test(lower)) return "find_work";
    if (/post|give|create|start|new\s+(job|request)|brief/.test(lower)) return "post_job";
    if (/home|account|dashboard|portal/.test(lower)) return "home";
    return "";
  }

  function directActionVerb(text = "") {
    return /\b(open|go\s+to|take\s+me|show\s+me|start|launch|navigate|bring\s+me|send\s+me\s+to|move\s+me|find|focus|use|apply|put|insert)\b/i.test(
      text,
    );
  }

  function inferSafeIntent(prompt, context) {
    const text = String(prompt || "").trim();
    const lower = text.toLowerCase();

    if (!text) return null;

    if (protectedIntentPattern.test(text)) {
      const routes = /refund|release|money|paid|payment|payout/.test(lower)
        ? ["payments", "resolution", "trust"]
        : /id|identity|verified|verify/.test(lower)
          ? ["verification", "trust", "resolution"]
          : ["resolution", "tracking", "messages"];
      return {
        blocked: true,
        routes,
        message: `${protectedBoundary}\n\nI can route you to the right page and help prepare the evidence, but I will not perform that protected action directly.`,
      };
    }

    if (/\b(next|empty|required|missing|focus|find|show)\b.*\b(field|input|box|form)\b/i.test(text)) {
      return { action: "focus_next_field", label: "Find next field" };
    }

    if (/\b(explain|summarize|what\s+is\s+this|what\s+can\s+i\s+do|next\s+step)\b/i.test(text)) {
      return { action: "explain_screen", label: "Explain screen" };
    }

    if (/\b(apply|use|put|insert|place)\b.*\b(draft|answer|response|notes|field|box)\b/i.test(text)) {
      return { action: "apply_to_notes", label: "Use draft here" };
    }

    if (/full\s+(ai|chat)|ask\s+ai\s+page|bigger\s+chat|assistant\s+page/i.test(text)) {
      return { action: "open_full_ai", label: "Open full chat" };
    }

    const routeKey = routeKeyFromPrompt(text);
    if (routeKey && directActionVerb(text)) {
      return {
        action: "navigate",
        key: routeKey,
        label: routeMap[routeKey]?.[0] || "Open tool",
        message: `Opening ${routeMap[routeKey]?.[0] || "the right Swadakta tool"} now.`,
      };
    }

    if (/\b(open|click|go\s+to|take\s+me|show\s+me)\b/i.test(text)) {
      const safeLink = findVisibleSafeLink(text);
      if (safeLink) {
        return {
          action: "open_visible_link",
          href: safeLink.href,
          label: safeLink.label,
          message: `Opening ${safeLink.label} now.`,
        };
      }
    }

    if (/\b(show|scroll|take\s+me|go\s+to|find)\b/i.test(text)) {
      const section = findVisibleSection(text);
      if (section) {
        return {
          action: "focus_section",
          node: section.node,
          label: section.label,
          message: `I moved the page to: ${section.label}.`,
        };
      }
    }

    return null;
  }

  function deterministicAnswer(prompt, context) {
    const text = String(prompt || "").trim();
    const lower = text.toLowerCase();
    const lines = [];

    lines.push(`I can see you are on ${context.main_heading || context.page}.`);

    if (context.visible_fields.some((field) => !field.value && field.required)) {
      const missing = context.visible_fields
        .filter((field) => !field.value && field.required)
        .map((field) => field.label)
        .slice(0, 5);
      lines.push(`The next empty required field I can help you find is: ${missing.join(", ")}.`);
    }

    if (/do it|take me|open|go to|start|post|verify|pay|message|resolve|work/.test(lower)) {
      lines.push("I can move you to the right Swadakta tool, focus the next field, or open the full chat. Use the action buttons below, or say things like 'open payments' or 'find the next field'.");
    } else {
      lines.push("Ask me what to do next, or use a quick action. I can route you, focus fields, draft text, and explain what is blocked.");
    }

    lines.push(protectedBoundary);
    return lines.join("\n\n");
  }

  function addMessage(role, text) {
    state.messages.push({ role, text });
    state.lastAssistantText = role === "ai" ? text : state.lastAssistantText;
    renderMessages();
  }

  function setBusy(isBusy) {
    state.busy = isBusy;
    const button = document.querySelector("#sw-ai-send");
    if (button) button.disabled = isBusy;
  }

  function renderMessages() {
    const list = document.querySelector("#sw-ai-messages");
    if (!list) return;
    list.innerHTML = state.messages
      .map((message) => `<article class="sw-ai-message ${message.role}">${escapeHtml(message.text)}</article>`)
      .join("");
    list.scrollTop = list.scrollHeight;
  }

  function renderActions(keys = []) {
    const holder = document.querySelector("#sw-ai-actions");
    if (!holder) return;
    const unique = [...new Set(keys)].filter((key) => routeMap[key]);
    const actionHtml = unique
      .map((key) => {
        const [label] = routeMap[key];
        return `<button class="sw-ai-action" type="button" data-sw-ai-action="navigate" data-sw-ai-key="${key}">${escapeHtml(label)}</button>`;
      })
      .join("");
    holder.innerHTML = `
      ${actionHtml}
      <button class="sw-ai-action" type="button" data-sw-ai-action="explain_screen">Explain screen</button>
      <button class="sw-ai-action" type="button" data-sw-ai-action="focus_next_field">Find next field</button>
      <button class="sw-ai-action" type="button" data-sw-ai-action="apply_to_notes">Use draft here</button>
      <button class="sw-ai-action" type="button" data-sw-ai-action="open_full_ai">Open full chat</button>
    `;
  }

  function setOpen(open) {
    state.open = open;
    const root = document.querySelector(`#${rootId}`);
    if (!root) return;
    root.classList.toggle("sw-ai-open", open);
    root.querySelector(".sw-ai-fab")?.setAttribute("aria-expanded", String(open));
    if (open) {
      root.querySelector("#sw-ai-input")?.focus({ preventScroll: true });
      const context = collectPageContext();
      root.querySelector("#sw-ai-page")?.replaceChildren(document.createTextNode(contextSummary(context)));
    }
  }

  function focusNextField() {
    const field = [...document.querySelectorAll("input, select, textarea")].find(
      (node) => isEditableField(node) && !safeFieldValue(node),
    );
    if (!field) {
      addMessage("ai", "I do not see an empty editable field on this screen.");
      return;
    }
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => field.focus({ preventScroll: true }), 280);
    addMessage("ai", `I moved you to: ${fieldLabel(field)}.`);
  }

  function applyToNotes() {
    const target =
      document.activeElement?.matches?.("textarea, input[type='text'], input[type='email'], input[type='tel'], input:not([type])")
        ? document.activeElement
        : [...document.querySelectorAll("textarea, input[type='text'], input[type='email'], input[type='tel'], input:not([type])")].find(
            (node) => isVisible(node) && !node.disabled && !node.readOnly,
          );

    if (!target) {
      addMessage("ai", "I do not see an editable notes or text field on this screen.");
      return;
    }

    const draft = state.lastAssistantText.trim();
    if (!draft) {
      addMessage("ai", "Ask me for a draft first, then I can place it into the open field.");
      return;
    }

    target.value = target.value.trim() ? `${target.value.trim()}\n\n${draft}` : draft;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus({ preventScroll: true });
    addMessage("ai", `I added the draft to: ${fieldLabel(target)}.`);
  }

  function openFullAi() {
    const context = collectPageContext();
    const url = new URL("assistant.html", location.href);
    url.searchParams.set("context", context.path.replace(/[^a-z0-9#/_-]+/gi, "-").slice(0, 80));
    url.searchParams.set("prompt", `I am on ${context.main_heading || context.page}. Help me with the next safe step here.`);
    location.href = url.href;
  }

  function navigateToKey(key) {
    const route = routeMap[key];
    if (!route) return;
    location.href = route[1];
  }

  function explainScreen() {
    const context = collectPageContext();
    const missing = context.visible_fields
      .filter((field) => !field.value)
      .slice(0, 4)
      .map((field) => field.label);
    const actions = context.visible_actions.slice(0, 5).join(", ");
    addMessage(
      "ai",
      [
        `You are on ${context.main_heading || context.page}.`,
        missing.length ? `Useful next fields: ${missing.join(", ")}.` : "I do not see an empty required field right now.",
        actions ? `Visible actions include: ${actions}.` : "",
        "I can open safe Swadakta links, focus fields, draft text, or open the full assistant. Protected money, identity, assignment, refund, and outbound-message decisions stay gated.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
    renderActions(routeKeysForText(`${context.main_heading} ${context.visible_actions.join(" ")}`));
  }

  function openVisibleLink(href, label = "that link") {
    if (!href) {
      addMessage("ai", "I could not find a safe in-app link to open from this screen.");
      return;
    }
    addMessage("ai", `Opening ${label}.`);
    location.href = href;
  }

  function focusSection(node, label = "that section") {
    if (!node) {
      addMessage("ai", "I could not find that section on this screen.");
      return;
    }
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "-1");
    window.setTimeout(() => node.focus({ preventScroll: true }), 280);
    addMessage("ai", `I moved you to: ${label}.`);
  }

  function performSafeAction(action, key, options = {}) {
    if (action === "navigate") return navigateToKey(key);
    if (action === "open_visible_link") return openVisibleLink(options.href, options.label);
    if (action === "focus_next_field") return focusNextField();
    if (action === "focus_section") return focusSection(options.node, options.label);
    if (action === "apply_to_notes") return applyToNotes();
    if (action === "open_full_ai") return openFullAi();
    if (action === "explain_screen") return explainScreen();
  }

  function performInferredIntent(intent) {
    if (!intent) return false;

    if (intent.blocked) {
      addMessage("ai", intent.message);
      renderActions(intent.routes || ["resolution", "trust", "tracking"]);
      return true;
    }

    if (intent.action === "navigate") {
      addMessage("ai", intent.message || `Opening ${intent.label || "the right Swadakta tool"} now.`);
      window.setTimeout(() => performSafeAction(intent.action, intent.key), 500);
      return true;
    }

    if (intent.action === "open_full_ai") {
      addMessage("ai", "Opening the full Ask AI chat with this screen as context.");
      window.setTimeout(() => performSafeAction(intent.action, intent.key), 500);
      return true;
    }

    if (intent.action === "open_visible_link") {
      addMessage("ai", intent.message || `Opening ${intent.label || "that Swadakta link"} now.`);
      window.setTimeout(() => performSafeAction(intent.action, intent.key, { href: intent.href, label: intent.label }), 500);
      return true;
    }

    if (intent.action === "focus_section") {
      focusSection(intent.node, intent.label);
      return true;
    }

    if (intent.action) {
      performSafeAction(intent.action, intent.key);
      return true;
    }

    return false;
  }

  async function askAi(promptText) {
    const prompt = promptText.trim();
    if (!prompt) return;

    const context = collectPageContext();
    addMessage("user", prompt);
    renderActions(routeKeysForText(prompt));

    const inferredIntent = inferSafeIntent(prompt, context);
    if (performInferredIntent(inferredIntent)) {
      return;
    }

    if (window.SwadaktaAiPreference?.enabled?.() === false) {
      addMessage("ai", `AI is off. I can still help navigate and focus the screen.\n\n${deterministicAnswer(prompt, context)}`);
      return;
    }

    setBusy(true);
    addMessage("ai", "Reading this screen...");
    const thinkingIndex = state.messages.length - 1;

    try {
      if (!window.SwadaktaData?.assist) throw new Error("Live assistant not loaded on this page.");
      const result = await window.SwadaktaData.assist({
        role: location.pathname.includes("admin") ? "admin" : "client",
        task: "Sitewide screen assistant",
        draft: prompt,
        context: {
          ...context,
          boundary: protectedBoundary,
          safe_actions: safeActionMap,
        },
      });
      const output = String(result.data?.output || "").trim() || deterministicAnswer(prompt, context);
      state.messages[thinkingIndex] = { role: "ai", text: output };
      state.lastAssistantText = output;
    } catch (error) {
      const fallback = deterministicAnswer(prompt, context);
      state.messages[thinkingIndex] = {
        role: "ai",
        text: `${fallback}\n\nLive AI was not available here, so I stayed in safe on-page mode.`,
      };
      state.lastAssistantText = state.messages[thinkingIndex].text;
    } finally {
      setBusy(false);
      renderMessages();
    }
  }

  function buildDock() {
    if (!aiDockEnabled()) {
      removeDock();
      return;
    }
    if (document.querySelector(`#${rootId}`)) return;
    if (/\/assistant(?:\.html)?$/i.test(location.pathname)) return;
    injectStyles();
    const context = collectPageContext();
    const root = document.createElement("section");
    root.id = rootId;
    root.dataset.version = DOCK_VERSION;
    root.innerHTML = `
      <aside class="sw-ai-panel" role="dialog" aria-modal="false" aria-label="Swadakta AI screen assistant">
        <header class="sw-ai-header">
          <div class="sw-ai-title-row">
            <div>
              <p class="sw-ai-eyebrow">Swadakta AI</p>
              <h2 class="sw-ai-title">Screen assistant</h2>
              <p class="sw-ai-page" id="sw-ai-page">${escapeHtml(contextSummary(context))}</p>
            </div>
            <button class="sw-ai-icon-button" type="button" data-sw-ai-close aria-label="Close AI assistant">x</button>
          </div>
        </header>
        <div class="sw-ai-quick" aria-label="AI quick actions">
          <button class="sw-ai-chip" type="button" data-sw-ai-prompt="Explain this screen and tell me the next safe step.">Explain</button>
          <button class="sw-ai-chip" type="button" data-sw-ai-prompt="What should I do next on this screen?">Next step</button>
          <button class="sw-ai-chip" type="button" data-sw-ai-prompt="Open the best place to post a job.">Post job</button>
          <button class="sw-ai-chip" type="button" data-sw-ai-prompt="Open the receiver work area.">Find work</button>
          <button class="sw-ai-chip" type="button" data-sw-ai-prompt="Open ID verification.">Verify</button>
          <button class="sw-ai-chip" type="button" data-sw-ai-prompt="Open the resolution center.">Resolve</button>
        </div>
        <div class="sw-ai-messages" id="sw-ai-messages" aria-live="polite"></div>
        <div class="sw-ai-actions" id="sw-ai-actions" aria-label="Safe AI actions"></div>
        <form class="sw-ai-composer" id="sw-ai-form">
          <div class="sw-ai-compose-box">
            <textarea class="sw-ai-input" id="sw-ai-input" rows="1" placeholder="Ask AI to guide, draft, focus, or open a tool..."></textarea>
            <button class="sw-ai-send" id="sw-ai-send" type="submit" aria-label="Ask AI">Send</button>
          </div>
          <p class="sw-ai-note">${escapeHtml(protectedBoundary)} Try: open payments, explain this screen, find the next field. Shortcut: Ctrl/Command + K.</p>
        </form>
      </aside>
      <button class="sw-ai-fab" type="button" aria-controls="${rootId}" aria-expanded="false">
        <span class="sw-ai-fab-dot">AI</span>
        <span>Help</span>
      </button>
    `;
    document.body.append(root);
    state.messages = [
      {
        role: "ai",
        text: `I can see this page and help you move through it.\n\n${protectedBoundary}`,
      },
    ];
    renderMessages();
    renderActions(routeKeysForText(location.pathname));
  }

  function removeDock() {
    state.open = false;
    document.querySelector(`#${rootId}`)?.remove();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const root = document.querySelector(`#${rootId}`);
      if (!root) return;
      if (event.target.closest(".sw-ai-fab")) {
        event.preventDefault();
        setOpen(!state.open);
        return;
      }
      if (event.target.closest("[data-sw-ai-close]")) {
        event.preventDefault();
        setOpen(false);
        return;
      }
      const promptButton = event.target.closest("[data-sw-ai-prompt]");
      if (promptButton) {
        event.preventDefault();
        setOpen(true);
        askAi(promptButton.dataset.swAiPrompt || "");
        return;
      }
      const actionButton = event.target.closest("[data-sw-ai-action]");
      if (actionButton) {
        event.preventDefault();
        performSafeAction(actionButton.dataset.swAiAction, actionButton.dataset.swAiKey);
      }
    });

    document.addEventListener("submit", (event) => {
      if (!event.target.matches("#sw-ai-form")) return;
      event.preventDefault();
      const input = document.querySelector("#sw-ai-input");
      const value = input?.value || "";
      if (input) input.value = "";
      askAi(value);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.open) setOpen(false);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!aiDockEnabled()) return;
        setOpen(!state.open);
      }
    });

    window.addEventListener("swadakta:ai-mode-change", (event) => {
      if (event.detail?.enabled === false) {
        removeDock();
      } else {
        buildDock();
      }
    });
  }

  function init() {
    document.documentElement.dataset.swadaktaDockVersion = DOCK_VERSION;
    injectSitePolishStyles();
    buildDock();
    bindEvents();
    bindAccountCtaRefresh();
  }

  window.SwadaktaAssistantDock = {
    version: DOCK_VERSION,
    collectPageContext,
    inferSafeIntent,
    performSafeAction,
    safeActionMap,
    findVisibleSafeLink,
    findVisibleSection,
    protectedBoundary,
    open: () => setOpen(true),
    close: () => setOpen(false),
    syncMode: () => (aiDockEnabled() ? buildDock() : removeDock()),
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
