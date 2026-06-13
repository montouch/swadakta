(function () {
  const form = document.querySelector("#assistant-form");
  const task = document.querySelector("#assistant-task");
  const prompt = document.querySelector("#assistant-prompt");
  const run = document.querySelector("#assistant-run");
  const output = document.querySelector("#assistant-output");
  const quickActions = document.querySelectorAll(".assistant-quick-action");
  const actionLinks = document.querySelector("#assistant-action-links");
  const contextTitle = document.querySelector("#assistant-context-title");
  const contextCopy = document.querySelector("#assistant-context-copy");
  const contextPill = document.querySelector("#assistant-context-pill");
  const toolButtons = document.querySelectorAll("[data-assistant-tool]");
  const params = new URLSearchParams(window.location.search);
  const workflowGuideLabel = "Workflow-aware guide";
  const chatShellMarkers = ["assistant-message-list", "assistant-form", "chat-composer"];
  const welcomeCopy =
    "Tell me what you want to do: give a job, apply for work, improve a brief, write a reply, check payment, upload proof, or predict blockers. I will keep the flow simple and route you to the right Swadakta tool.";
  const linkTargets = {
    portal: ["Account home", "portal.html#home"],
    corridor: ["Choose corridor", "corridor.html"],
    brief: ["Paid brief", "brief.html"],
    verification: ["Verification", "verification.html"],
    tracking: ["Track request", "tracking.html"],
    messages: ["Messages", "messages.html"],
    notifications: ["Notifications", "notifications.html"],
    payments: ["Payments", "payments.html"],
    rules: ["Item rules", "rules.html"],
    resolution: ["Resolution", "resolution.html"],
    trust: ["Trust", "trust.html"],
  };
  const conversation = [
    {
      id: "welcome",
      role: "assistant",
      text: welcomeCopy,
      time: messageTime(),
    },
  ];

  function messageTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function setTaskByLabel(label) {
    if (!task) return;
    const wanted = String(label || "").trim().toLowerCase();
    const option = [...task.options].find((item) => item.textContent.trim().toLowerCase() === wanted);
    if (option) task.value = option.value;
  }

  function renderActionLinks(keys = []) {
    if (!actionLinks) return;
    const unique = [...new Set(keys.filter(Boolean))].filter((key) => linkTargets[key]);
    const fallback = unique.length ? unique : ["portal", "corridor", "verification"];

    actionLinks.innerHTML = fallback
      .map((key) => {
        const [label, href] = linkTargets[key];
        return `<a class="rounded-2xl border border-outline-variant/40 bg-white/76 px-4 py-3 text-center font-label text-sm text-primary hover:border-primary" href="${href}">${label}</a>`;
      })
      .join("");
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

  function answerToHtml(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function bubbleFor(message) {
    const isUser = message.role === "user";
    const isThinking = message.tone === "thinking";
    const bubbleClass = isUser
      ? "rounded-[1.25rem] rounded-br-sm bg-primary px-4 py-3 text-white shadow-[0_14px_32px_rgba(16,26,58,0.20)]"
      : "rounded-[1.25rem] rounded-bl-sm border border-outline-variant/30 bg-white/82 px-4 py-3 text-on-surface shadow-[0_14px_32px_rgba(48,52,150,0.08)]";
    const wrapperClass = isUser ? "ml-auto flex max-w-[86%] justify-end" : "mr-auto flex max-w-[88%] items-end gap-2";
    const status = isThinking
      ? `<span class="inline-flex items-center gap-1 text-xs opacity-75"><span class="h-1.5 w-1.5 rounded-full bg-current"></span><span class="h-1.5 w-1.5 rounded-full bg-current"></span><span class="h-1.5 w-1.5 rounded-full bg-current"></span></span>`
      : "";

    if (isUser) {
      return `
        <article class="${wrapperClass}" data-message-role="user" data-message-id="${message.id}">
          <div class="${bubbleClass}">
            <p class="whitespace-pre-wrap text-sm leading-6">${answerToHtml(message.text)}</p>
            <p class="mt-1 text-right text-[11px] text-white/72">${escapeHtml(message.time)}</p>
          </div>
        </article>`;
    }

    return `
      <article class="${wrapperClass}" data-message-role="assistant" data-message-id="${message.id}">
        <span class="mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">AI</span>
        <div class="${bubbleClass} ${isThinking ? "opacity-75" : ""}">
          <p class="whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">${status || answerToHtml(message.text)}</p>
          ${isThinking ? "" : `<p class="mt-1 text-[11px] text-on-surface-variant/70">${escapeHtml(message.time)}</p>`}
        </div>
      </article>`;
  }

  function renderConversation() {
    if (!output) return;
    output.innerHTML = conversation.map(bubbleFor).join("");
    output.scrollTop = output.scrollHeight;
  }

  function addMessage(role, text, options = {}) {
    const message = {
      id: options.id || `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      text,
      tone: options.tone || "",
      time: options.time || messageTime(),
    };
    conversation.push(message);
    renderConversation();
    return message.id;
  }

  function updateMessage(id, text, options = {}) {
    const message = conversation.find((item) => item.id === id);
    if (!message) return;
    message.text = text;
    message.tone = options.tone || "";
    message.time = options.time || messageTime();
    renderConversation();
  }

  function renderAssistantMessage(message, tone = "normal") {
    addMessage("assistant", message, { tone: tone === "thinking" ? "thinking" : "" });
  }

  function contextLabel() {
    const source = String(params.get("source") || params.get("context") || "").toLowerCase();
    if (source.includes("verification")) return ["Verification guidance", "Provider-led ID checks unlock paid posting, paid work, and sensitive/high-value tasks.", "ID route"];
    if (source.includes("payment")) return ["Payment guidance", "Use provider rails where possible. AI can draft payment wording, but provider evidence controls paid status and release decisions.", "Money safe"];
    if (source.includes("resolution") || source.includes("issue")) return ["Issue guidance", "Keep request code, contact, provider reference, proof, and timeline together before asking for refund, release, or receiver changes.", "Evidence first"];
    if (source.includes("corridor") || source.includes("brief")) return ["Brief guidance", "Route, item legality, proof standards, payment rail, and receiver coverage should be clear before paid work starts.", "Quote ready"];
    return ["Start from where you are.", "Choose a quick action or describe the job, payment, proof, verification, message, or blocker.", "Safe guidance"];
  }

  function updateContextCard() {
    const [title, copy, pill] = contextLabel();
    if (contextTitle) contextTitle.textContent = title;
    if (contextCopy) contextCopy.textContent = copy;
    if (contextPill) contextPill.textContent = pill;
  }

  function withTimeout(promise, ms = 9000) {
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = window.setTimeout(() => reject(new Error("AI response timed out.")), ms);
    });

    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
  }

  function fallbackAnswer(sourceText = "") {
    const selected = task.value;
    const text = `${selected} ${sourceText} ${prompt.value}`;
    if (selected.includes("verification")) {
      return [
        "After verification is requested:",
        "",
        "1. Your account stays open. Verification is only the gate for paid posting, paid work, sensitive jobs, and higher-value money flow.",
        "2. Swadakta chooses the provider route from your country: Smile ID for eligible Africa-first checks, Youverify for selected West African checks, and Sumsub as the broad global route.",
        "3. The provider check is prepared or attached to your verification page.",
        "4. You complete ID and selfie/liveness with the provider, not with a founder manually inspecting documents.",
        "5. The provider result updates your account status.",
        "6. Once verified, paid posting and paid work unlock.",
        "",
        "Manual review is only an exception: provider outage, unsupported country/document, mismatch, suspected fraud, legal uncertainty, or a high-value/sensitive job that needs extra controls.",
      ].join("\n");
    }
    if (selected.includes("message")) {
      return messageDraftAnswer();
    }
    if (selected.includes("issue") || /resolution|refund|dispute|proof|delay|receiver|payment/i.test(text)) {
      return [
        "Here is the safe issue flow:",
        "",
        "1. Keep the request code, contact, provider reference, proof links, and timeline together in the Resolution Center.",
        "2. AI can summarize facts, spot missing evidence, and draft the next message to the client or receiver.",
        "3. Payment, refund, release, restricted item, safety, legal, receiver replacement, and ID decisions are protected actions.",
        "4. Protected actions need provider/system evidence or founder review before the app changes money, identity, or assignment state.",
        "5. If proof is missing, ask for dated photos, receipts, location notes, video/voice context, or provider records before escalation.",
      ].join("\n");
    }
    if (selected.includes("brief") || /brief|quote|corridor|route|customs|item|goods/i.test(text)) {
      return [
        "Brief readiness checklist:",
        "",
        "1. Confirm origin, destination, direction, task city, and whether the lane is active, pilot, or founder-review.",
        "2. Describe the item or task clearly: photos, links, model numbers, value, deadline, recipient, and local contact.",
        "3. Name the proof needed: timestamped photos, video, receipt, delivery confirmation, site note, document reference, or voice explanation.",
        "4. For physical goods, check carrier, customs, tax/duty owner, restricted items, and whether a courier or postal service will accept it.",
        "5. Choose payment preference, but wait for Swadakta to quote time, receiver payout, field costs, provider fees, and founder margin.",
        "6. High-value or sensitive work needs milestone controls or a regulated escrow/payment provider before receiver payout.",
        "",
        "AI can improve the brief and predict blockers. Founder/provider evidence is still required for restricted goods, paid status, ID approval, assignment, refunds, or payout release.",
      ].join("\n");
    }
    if (selected.includes("blockers") || /blocker|risk|stuck|law|customs|restricted/i.test(text)) {
      return [
        "Likely blockers to check:",
        "",
        "- ID verification: account can open first, but paid posting and paid work stay locked until provider evidence is recorded.",
        "- Money: provider confirmation is needed before funds count as provider-confirmed; AI cannot mark paid or approve provider payout.",
        "- Corridor: pilot or unsupported lanes need founder approval before quote, purchase, shipping, or assignment.",
        "- Goods: batteries, perfume/liquids, medicines, food, plants, animal-origin goods, valuables, and controlled documents need rules checks.",
        "- Proof: every job needs clear proof requirements before receiver work starts.",
        "- Receiver fit: paid jobs need a vetted, ID-verified receiver matched to the route and category.",
      ].join("\n");
    }
    if (/draft|reply|message|whatsapp|email/i.test(text)) {
      return messageDraftAnswer();
    }
    return "Create or sign in to your account, choose the action you need from Account Home, and use verification only when you are ready to post paid work or take jobs. AI can explain the flow, draft messages, improve briefs, and predict blockers. Protected actions still need provider/system signals: ID approval, provider-payout approval, refunds, operator assignment, and sensitive task approval cannot be done by AI alone.";
  }

  function messageDraftAnswer() {
    return [
      "Message draft structure:",
      "",
      "Hi, thanks for the update. To keep this job safe, please send the request code, current status, clear proof photos or video, any receipt or provider reference, and what you need Swadakta to do next.",
      "",
      "Important: payment release, refunds, ID approval, receiver replacement, and restricted-item decisions can only happen after provider/system evidence or founder review.",
    ].join("\n");
  }

  function applyQueryContext() {
    const incomingPrompt = params.get("prompt");
    const incomingTask = params.get("task");

    if (incomingPrompt && !prompt.value.trim()) {
      prompt.value = incomingPrompt.slice(0, 2400);
      syncPromptHeight();
    }

    if (incomingTask) {
      setTaskByLabel(incomingTask);
    } else if (incomingPrompt && /resolve|issue|refund|dispute|proof|delay|payment/i.test(incomingPrompt)) {
      setTaskByLabel("Resolve an issue");
    }

    if (incomingPrompt) {
      renderAssistantMessage("Issue context loaded. Ask AI when you are ready for a draft, checklist, or next safe step.");
    }
    renderActionLinks((params.get("links") || "").split(","));
  }

  function selectedLinkKeys(sourceText = "") {
    if (!task) return ["portal", "corridor", "verification"];
    const selected = task.value.toLowerCase();
    const text = `${selected} ${sourceText} ${prompt.value}`.toLowerCase();
    if (selected.includes("message")) return ["messages", "tracking", "resolution"];
    if (selected.includes("issue")) return ["resolution", "tracking", "messages"];
    if (selected.includes("blockers")) return ["rules", "payments", "trust"];
    if (selected.includes("brief")) return ["corridor", "brief", "rules"];
    if (/issue|refund|dispute|delay|safety|resolve/.test(text)) return ["resolution", "tracking", "messages"];
    if (/blocker|risk|stuck|law|restricted/.test(text)) return ["rules", "payments", "trust"];
    if (/verification|id|provider/.test(text)) return ["verification", "portal", "trust"];
    if (/brief|quote|corridor|route|customs|goods|item/.test(text)) return ["corridor", "brief", "rules"];
    if (/payment|money|milestone|escrow|stripe|paypal|mpesa|wise/.test(text)) return ["payments", "tracking", "trust"];
    if (/message|reply|receiver|proof|voice|media/.test(text)) return ["messages", "tracking", "resolution"];
    return ["portal", "corridor", "verification"];
  }

  function syncPromptHeight() {
    if (!prompt) return;
    prompt.style.height = "auto";
    prompt.style.height = `${Math.min(prompt.scrollHeight, 144)}px`;
  }

  function focusPrompt() {
    prompt?.focus({ preventScroll: true });
  }

  function setComposerDisabled(disabled) {
    if (run) run.disabled = disabled;
    if (prompt) prompt.disabled = disabled;
  }

  async function sendMessage() {
    if (!prompt || !task) return;
    const userPrompt = prompt.value.trim() || task.value;
    if (!userPrompt) return;

    if (window.SwadaktaAiPreference && !window.SwadaktaAiPreference.enabled()) {
      renderAssistantMessage("AI is off. Use the normal Swadakta tools from the side rail, or turn AI on when you want help drafting, sorting, or checking the next step.");
      renderActionLinks(selectedLinkKeys(userPrompt));
      return;
    }

    prompt.value = "";
    syncPromptHeight();
    setComposerDisabled(true);
    addMessage("user", userPrompt);
    const thinkingId = addMessage("assistant", "Typing...", { tone: "thinking" });
    renderActionLinks(selectedLinkKeys(userPrompt));

    try {
      const session = await window.SwadaktaData?.getSession?.();
      if (!session?.session?.access_token) {
        updateMessage(thinkingId, `${fallbackAnswer(userPrompt)}\n\nSign in for live protected AI.`);
        return;
      }
      const result = await withTimeout(
        window.SwadaktaData.assist({
          role: "client",
          task: task.value,
          draft: userPrompt,
          context: { page: "assistant", source: params.get("source") || params.get("context") || "" },
        }),
      );
      updateMessage(thinkingId, result.data?.output || fallbackAnswer(userPrompt));
    } catch (error) {
      updateMessage(
        thinkingId,
        `${fallbackAnswer(userPrompt)}\n\nLive AI did not respond quickly, so this safe guide stayed local. Try again after checking the account session or admin AI readiness.`,
      );
    } finally {
      setComposerDisabled(false);
      focusPrompt();
    }
  }

  quickActions.forEach((button) => {
    button.addEventListener("click", () => {
      setTaskByLabel(button.dataset.task);
      prompt.value = button.dataset.prompt || "";
      syncPromptHeight();
      renderAssistantMessage("Quick action loaded. Edit the message below, then send it like a normal chat.");
      renderActionLinks((button.dataset.links || "").split(","));
      focusPrompt();
    });
  });

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.assistantTool;
      const copy =
        type === "media"
          ? "Media upload belongs inside Messages or Tracking after a job exists. Tell me what proof you need and I can help format the request."
          : type === "voice"
            ? "Voice notes belong inside job messages once both sides are connected. Tell me the update and I can turn it into a clean written summary."
            : "Video calls should be used only after a job exists and both sides are verified where needed. Tell me the call purpose and I can draft the agenda.";
      renderAssistantMessage(copy);
      renderActionLinks(["messages", "tracking", "verification"]);
    });
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });

  prompt?.addEventListener("input", syncPromptHeight);
  prompt?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form?.requestSubmit();
    }
  });

  updateContextCard();
  renderConversation();
  applyQueryContext();
  if (!params.get("links")) renderActionLinks(selectedLinkKeys());
})();
