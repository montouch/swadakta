(function () {
  const task = document.querySelector("#assistant-task");
  const prompt = document.querySelector("#assistant-prompt");
  const run = document.querySelector("#assistant-run");
  const output = document.querySelector("#assistant-output");

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
    return "Create or sign in to your account, choose the action you need from Account Home, and use verification only when you are ready to post paid work or receive jobs. AI can explain the flow, draft messages, improve briefs, and predict blockers. Protected actions still need provider/system signals: ID approval, money release, refunds, receiver assignment, and sensitive task approval cannot be done by AI alone.";
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
        context: { page: "assistant" },
      });
      output.textContent = result.data?.output || fallbackAnswer();
    } catch (error) {
      output.textContent = fallbackAnswer();
    } finally {
      run.disabled = false;
    }
  });
})();
