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
        "1. Swadakta saves your account profile and chooses the best provider route.",
        "2. Smile ID, Sumsub, or Youverify should handle the ID check depending on your country and document coverage.",
        "3. You complete the provider check with ID and selfie/liveness.",
        "4. The provider result updates the account status.",
        "5. Once verified, paid posting, paid receiver work, and sensitive tasks unlock.",
        "",
        "Manual review should only be an exception: provider outage, unsupported country/document, mismatch, fraud risk, or high-value/sensitive job."
      ].join("\n");
    }
    return "Create or sign in to your account, choose the action you need from Account Home, and use verification only when you are ready to post paid work or receive jobs. AI can draft, explain, and predict blockers, but protected actions still need verified system/provider signals.";
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
