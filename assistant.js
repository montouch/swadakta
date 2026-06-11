(function () {
  const task = document.querySelector("#assistant-task");
  const prompt = document.querySelector("#assistant-prompt");
  const run = document.querySelector("#assistant-run");
  const output = document.querySelector("#assistant-output");
  const quickActions = document.querySelectorAll(".assistant-quick-action");
  const actionLinks = document.querySelector("#assistant-action-links");
  const contextTitle = document.querySelector("#assistant-context-title");
  const contextCopy = document.querySelector("#assistant-context-copy");
  const contextPill = document.querySelector("#assistant-context-pill");
  const params = new URLSearchParams(window.location.search);
  const workflowGuideLabel = "Workflow-aware guide";
  const linkTargets = {
    portal: ["Account home", "portal.html#home"],
    corridor: ["Choose corridor", "corridor.html"],
    brief: ["Paid brief", "brief.html"],
    verification: ["Verification", "verification.html"],
    tracking: ["Track request", "tracking.html"],
    messages: ["Messages", "messages.html"],
    payments: ["Payments", "payments.html"],
    rules: ["Item rules", "rules.html"],
    resolution: ["Resolution", "resolution.html"],
    trust: ["Trust", "trust.html"],
  };

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

  function renderAssistantMessage(message, tone = "normal") {
    if (!output) return;
    const toneClass = tone === "thinking" ? "opacity-70" : "";
    output.innerHTML = `
      <article class="max-w-[760px] rounded-3xl rounded-tl-md bg-white/78 border border-outline-variant/30 p-4 ${toneClass}">
        <div class="flex items-start gap-3">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-white text-xs font-bold">AI</span>
          <p class="text-sm leading-6 text-on-surface-variant">${answerToHtml(message)}</p>
        </div>
      </article>`;
    output.scrollTop = output.scrollHeight;
  }

  function renderConversation(userMessage, assistantMessage) {
    if (!output) return;
    output.innerHTML = `
      <article class="ml-auto max-w-[720px] rounded-3xl rounded-tr-md bg-primary text-white p-4">
        <p class="text-sm leading-6">${answerToHtml(userMessage || task.value)}</p>
      </article>
      <article class="max-w-[760px] rounded-3xl rounded-tl-md bg-white/78 border border-outline-variant/30 p-4">
        <div class="flex items-start gap-3">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-white text-xs font-bold">AI</span>
          <p class="text-sm leading-6 text-on-surface-variant">${answerToHtml(assistantMessage)}</p>
        </div>
      </article>`;
    output.scrollTop = output.scrollHeight;
  }

  function contextLabel() {
    const source = String(params.get("source") || params.get("context") || "").toLowerCase();
    if (source.includes("verification")) return ["Verification guidance", "Provider-led ID checks unlock paid posting, paid receiver work, and sensitive/high-value tasks.", "ID route"];
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

  function fallbackAnswer() {
    const selected = task.value;
    if (selected.includes("verification")) {
      return [
        "After verification is requested:",
        "",
        "1. Your account stays open. Verification is only the gate for paid posting, paid receiver work, sensitive jobs, and higher-value money flow.",
        "2. Swadakta chooses the provider route from your country: Smile ID for eligible Africa-first checks, Youverify for selected West African checks, and Sumsub as the broad global route.",
        "3. The provider check is prepared or attached to your verification page.",
        "4. You complete ID and selfie/liveness with the provider, not with a founder manually inspecting documents.",
        "5. The provider result updates your account status.",
        "6. Once verified, paid posting and paid receiver work unlock.",
        "",
        "Manual review is only an exception: provider outage, unsupported country/document, mismatch, suspected fraud, legal uncertainty, or a high-value/sensitive job that needs extra controls."
      ].join("\n");
    }
    if (selected.includes("blockers") || /blocker|risk|stuck|law|customs|restricted/i.test(prompt.value)) {
      return [
        "Likely blockers to check:",
        "",
        "- ID verification: account can open first, but paid posting and paid receiver work stay locked until provider evidence is recorded.",
        "- Money: provider confirmation is needed before funds count as protected; AI cannot mark paid or release money.",
        "- Corridor: pilot or unsupported lanes need founder approval before quote, purchase, shipping, or assignment.",
        "- Goods: batteries, perfume/liquids, medicines, food, plants, animal-origin goods, valuables, and controlled documents need rules checks.",
        "- Proof: every job needs clear proof requirements before receiver work starts.",
        "- Receiver fit: paid jobs need a vetted, ID-verified receiver matched to the route and category.",
      ].join("\n");
    }
    if (selected.includes("brief") || /brief|quote|corridor|route|customs|item|goods/i.test(prompt.value)) {
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
    if (selected.includes("issue") || /resolution|refund|dispute|proof|delay|receiver|payment/i.test(prompt.value)) {
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
    if (selected.includes("message") || /draft|reply|message|whatsapp|email/i.test(prompt.value)) {
      return [
        "Message draft structure:",
        "",
        "Hi, thanks for the update. To keep this job safe, please send the request code, current status, clear proof photos or video, any receipt or provider reference, and what you need Swadakta to do next.",
        "",
        "Important: payment release, refunds, ID approval, receiver replacement, and restricted-item decisions can only happen after provider/system evidence or founder review.",
      ].join("\n");
    }
    return "Create or sign in to your account, choose the action you need from Account Home, and use verification only when you are ready to post paid work or receive jobs. AI can explain the flow, draft messages, improve briefs, and predict blockers. Protected actions still need provider/system signals: ID approval, money release, refunds, receiver assignment, and sensitive task approval cannot be done by AI alone.";
  }

  function applyQueryContext() {
    const incomingPrompt = params.get("prompt");
    const incomingTask = params.get("task");

    if (incomingPrompt && !prompt.value.trim()) {
      prompt.value = incomingPrompt.slice(0, 2400);
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

  function selectedLinkKeys() {
    if (!task) return ["portal", "corridor", "verification"];
    const selected = task.value.toLowerCase();
    const text = `${selected} ${prompt.value}`.toLowerCase();
    if (/blocker|risk|stuck|law|restricted/.test(text)) return ["rules", "payments", "trust"];
    if (/verification|id|provider/.test(text)) return ["verification", "portal", "trust"];
    if (/brief|quote|corridor|route|customs|goods|item/.test(text)) return ["corridor", "brief", "rules"];
    if (/payment|money|milestone|escrow|stripe|paypal|mpesa|wise/.test(text)) return ["payments", "tracking", "trust"];
    if (/message|reply|receiver|proof|voice|media/.test(text)) return ["messages", "tracking", "resolution"];
    if (/issue|refund|dispute|delay|safety/.test(text)) return ["resolution", "tracking", "messages"];
    return ["portal", "corridor", "verification"];
  }

  quickActions.forEach((button) => {
    button.addEventListener("click", () => {
      setTaskByLabel(button.dataset.task);
      prompt.value = button.dataset.prompt || "";
      renderAssistantMessage("Quick action loaded. Ask AI for a draft, checklist, or next safe step.");
      renderActionLinks((button.dataset.links || "").split(","));
    });
  });

  run?.addEventListener("click", async () => {
    run.disabled = true;
    const userPrompt = prompt.value.trim() || task.value;
    renderConversation(userPrompt, "Thinking...");
    renderActionLinks(selectedLinkKeys());
    try {
      const session = await window.SwadaktaData.getSession();
      if (!session.session?.access_token) {
        renderConversation(userPrompt, `${fallbackAnswer()}\n\nSign in for live protected AI.`);
        return;
      }
      const result = await withTimeout(
        window.SwadaktaData.assist({
          role: "client",
          task: task.value,
          draft: prompt.value,
          context: { page: "assistant", source: params.get("source") || params.get("context") || "" },
        }),
      );
      renderConversation(userPrompt, result.data?.output || fallbackAnswer());
    } catch (error) {
      renderConversation(
        userPrompt,
        `${fallbackAnswer()}\n\nLive AI did not respond quickly, so this safe guide stayed local. Try again after checking the account session or admin AI readiness.`,
      );
    } finally {
      run.disabled = false;
    }
  });

  updateContextCard();
  applyQueryContext();
  if (!params.get("links")) renderActionLinks(selectedLinkKeys());
})();
