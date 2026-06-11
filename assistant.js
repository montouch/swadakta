(function () {
  const task = document.querySelector("#assistant-task");
  const prompt = document.querySelector("#assistant-prompt");
  const run = document.querySelector("#assistant-run");
  const output = document.querySelector("#assistant-output");
  const params = new URLSearchParams(window.location.search);

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
    return "Create or sign in to your account, choose the action you need from Account Home, and use verification only when you are ready to post paid work or receive jobs. AI can explain the flow, draft messages, improve briefs, and predict blockers. Protected actions still need provider/system signals: ID approval, money release, refunds, receiver assignment, and sensitive task approval cannot be done by AI alone.";
  }

  function applyQueryContext() {
    const incomingPrompt = params.get("prompt");
    const incomingTask = params.get("task");

    if (incomingPrompt && !prompt.value.trim()) {
      prompt.value = incomingPrompt.slice(0, 2400);
    }

    if (incomingTask) {
      const wanted = incomingTask.toLowerCase();
      const option = [...task.options].find((item) => item.textContent.trim().toLowerCase() === wanted);
      if (option) task.value = option.value;
    } else if (incomingPrompt && /resolve|issue|refund|dispute|proof|delay|payment/i.test(incomingPrompt)) {
      const option = [...task.options].find((item) => item.textContent.trim() === "Resolve an issue");
      if (option) task.value = option.value;
    }

    if (incomingPrompt) {
      output.textContent = "Issue context loaded. Ask AI when you are ready for a draft, checklist, or next safe step.";
    }
  }

  run.addEventListener("click", async () => {
    run.disabled = true;
    output.textContent = "Thinking...";
    try {
      const session = await window.SwadaktaData.getSession();
      if (!session.session?.access_token) {
        output.textContent = `${fallbackAnswer()}\n\nSign in for live protected AI.`;
        return;
      }
      const result = await window.SwadaktaData.assist({
        role: "client",
        task: task.value,
        draft: prompt.value,
        context: { page: "assistant", source: params.get("source") || "" },
      });
      output.textContent = result.data?.output || fallbackAnswer();
    } catch (error) {
      output.textContent = fallbackAnswer();
    } finally {
      run.disabled = false;
    }
  });

  applyQueryContext();
})();
