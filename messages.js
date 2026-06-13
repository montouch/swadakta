(function () {
  const card = document.querySelector("#message-context-card");
  const codeEl = document.querySelector("#message-request-code");
  const contactEl = document.querySelector("#message-contact-copy");
  const trackingLink = document.querySelector("#message-tracking-link");
  const draftForm = document.querySelector("#message-draft-form");
  const draftInput = document.querySelector("#message-draft");
  const fieldStatus = document.querySelector("#message-field-status");
  const mediaInput = document.querySelector("#message-media");
  const mediaList = document.querySelector("#message-media-list");
  const proofLinksInput = document.querySelector("#message-proof-links");
  const recordVoice = document.querySelector("#message-record-voice");
  const stopVoice = document.querySelector("#message-stop-voice");
  const voicePlayback = document.querySelector("#message-voice-playback");
  const videoCall = document.querySelector("#message-video-call");
  const draftStatus = document.querySelector("#message-draft-status");
  const submitButton = document.querySelector("#message-submit");
  const liveStatus = document.querySelector("#message-live-status");
  const safetyPreview = document.querySelector("#message-safety-preview");
  const safetyPill = document.querySelector("#message-safety-pill");
  const safetyStatus = document.querySelector("#message-safety-status");
  const buildAgenda = document.querySelector("#message-build-agenda");
  const buildProofRequest = document.querySelector("#message-build-proof-request");
  const buildRecap = document.querySelector("#message-build-recap");
  const applySafetyPack = document.querySelector("#message-apply-safety-pack");
  const copySafetyPack = document.querySelector("#message-copy-safety-pack");

  if (!card) return;

  const params = new URLSearchParams(window.location.search);
  const code = String(params.get("code") || "").trim().toUpperCase();
  const contact = String(params.get("contact") || "").trim();
  const storageKey = `swadakta_message_draft_${code || "general"}`;
  let recorder = null;
  let voiceChunks = [];
  let voiceBlob = null;
  let videoRequested = false;
  let safetyPackText = "";

  function setStatus(message, tone = "") {
    if (!draftStatus) return;
    draftStatus.textContent = message;
    draftStatus.className = `min-h-6 text-sm font-label ${tone || "text-on-surface-variant"}`.trim();
  }

  function setLiveStatus(message, tone = "") {
    if (!liveStatus) return;
    liveStatus.textContent = message;
    liveStatus.className = `mt-1 text-sm ${tone || "text-on-surface-variant"}`.trim();
  }

  function setSafetyStatus(message, tone = "") {
    if (!safetyStatus) return;
    safetyStatus.textContent = message;
    safetyStatus.className = `min-h-6 text-sm font-label sm:self-center ${tone || "text-on-surface-variant"}`.trim();
  }

  function readDraft() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "null");
    } catch {
      return null;
    }
  }

  function writeDraft(payload) {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }

  function fileSummary(file) {
    const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    return `${file.name} (${size})`;
  }

  function statusLabel(value) {
    return (
      {
        progress: "Progress update",
        blocked: "Blocked",
        completed: "Completed milestone",
        needs_admin: "Needs admin",
        safety_issue: "Safety issue",
      }[value] || "Progress update"
    );
  }

  function currentProofHints() {
    const files = [...(mediaInput?.files || [])].map((file) => fileSummary(file));
    const links = String(proofLinksInput?.value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const hints = [];

    if (files.length) hints.push(`Attached media: ${files.join(", ")}`);
    if (links.length) hints.push(`Existing proof links: ${links.slice(0, 5).join(", ")}${links.length > 5 ? "..." : ""}`);
    if (voiceBlob) hints.push("Voice note attached: yes, save a written summary with it.");
    if (videoRequested) hints.push("Video call requested: yes, capture agenda and recap in writing.");
    return hints;
  }

  function communicationBoundaryLines() {
    return [
      "This message or call does not approve payment release, refunds, ID verification, receiver assignment, restricted goods, or provenance changes.",
      "Protected decisions require Swadakta/provider evidence in tracking, payments, verification, or admin review.",
      "If safety, legal, payment, customs, or identity risk appears, pause the work and open a resolution case.",
    ];
  }

  function buildCommunicationSafetyPack(kind = "agenda") {
    const currentMessage = draftInput?.value.trim() || "";
    const updateStatus = statusLabel(fieldStatus?.value || "progress");
    const requestLabel = code || "request code pending";
    const contactLabel = contact || "contact not linked";
    const proofHints = currentProofHints();
    const boundaries = communicationBoundaryLines();
    const purpose =
      kind === "proof"
        ? "Ask for the missing proof needed before milestone review."
        : kind === "recap"
          ? "Record what was discussed so the job room has a written trail."
          : "Prepare a focused call without making protected decisions inside the call.";
    const tasks =
      kind === "proof"
        ? [
            "List the exact photo, receipt, document, location note, voice note, or video needed.",
            "Ask when the proof can be uploaded to this request.",
            "Confirm whether anything is blocked, unsafe, delayed, or different from the original scope.",
          ]
        : kind === "recap"
          ? [
              "Summarize the facts discussed on the call or voice note.",
              "List proof already received and proof still missing.",
              "State the next action, owner, and expected time without promising payment release.",
            ]
          : [
              "Confirm the job scope, location, receiver/client availability, and current blocker.",
              "Agree which proof will be uploaded after the call.",
              "End with a written recap in this job room before any milestone or issue decision.",
            ];

    return [
      "Swadakta job-room safety pack",
      `Request: ${requestLabel}`,
      `Contact: ${contactLabel}`,
      `Update type: ${updateStatus}`,
      `Purpose: ${purpose}`,
      "",
      "What to cover:",
      ...tasks.map((item) => `- ${item}`),
      "",
      "Current draft context:",
      currentMessage ? `- ${currentMessage}` : "- No typed message yet.",
      ...proofHints.map((item) => `- ${item}`),
      "",
      "Boundary:",
      ...boundaries.map((item) => `- ${item}`),
      "",
      "Written next step:",
      "- Save the proof, call recap, or blocker update in this job room so tracking and resolution can rely on the same evidence.",
    ].join("\n");
  }

  function renderSafetyPack(kind = "agenda") {
    safetyPackText = buildCommunicationSafetyPack(kind);
    if (safetyPreview) safetyPreview.textContent = safetyPackText;
    if (safetyPill) {
      safetyPill.textContent =
        kind === "proof" ? "Proof request ready" : kind === "recap" ? "Written recap ready" : "Call agenda ready";
      safetyPill.className = "inline-flex min-h-10 px-4 items-center justify-center rounded-full bg-primary-container/10 text-primary font-label text-sm";
    }
    try {
      writeDraft({ ...currentDraftPayload(), communication_safety_pack: safetyPackText });
    } catch {
      writeDraft({
        code,
        contact,
        field_status: fieldStatus?.value || "progress",
        message: draftInput?.value.trim() || "",
        communication_safety_pack: safetyPackText,
        updated_at: new Date().toISOString(),
      });
    }
    setSafetyStatus("Pack generated. Apply it to the update or copy it into a message.", "text-primary");
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function renderMediaList(files = []) {
    if (!mediaList) return;
    const items = [...files].map((file) => `<li>${fileSummary(file)}</li>`);
    if (voiceBlob) items.push(`<li>Voice note ready (${Math.max(1, Math.round(voiceBlob.size / 1024))} KB)</li>`);
    if (videoRequested) items.push("<li>Video call request added with proof-safe agenda note</li>");

    mediaList.innerHTML = items.length
      ? `<ul class="grid gap-2 rounded-2xl bg-white/72 border border-outline-variant/40 p-4 text-sm text-on-surface-variant">${items.join("")}</ul>`
      : "";
  }

  function safeProofLinks() {
    const lines = String(proofLinksInput?.value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line) => {
      const url = new URL(line, window.location.href);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Proof links must start with http:// or https://.");
      }
      return url.href;
    });
  }

  function voiceProofFile() {
    if (!voiceBlob) return null;
    const name = `voice-note-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
    try {
      return new File([voiceBlob], name, { type: voiceBlob.type || "audio/webm" });
    } catch {
      voiceBlob.name = name;
      return voiceBlob;
    }
  }

  function uploadableFiles() {
    const files = [...(mediaInput?.files || [])];
    const voiceFile = voiceProofFile();
    if (voiceFile) files.push(voiceFile);
    return files;
  }

  function currentDraftPayload() {
    const files = [...(mediaInput?.files || [])].map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    const proofLinks = safeProofLinks();

    return {
      code,
      contact,
      field_status: fieldStatus?.value || "progress",
      message: draftInput?.value.trim() || "",
      files,
      proof_links: proofLinks,
      has_voice_note: Boolean(voiceBlob),
      video_call_requested: videoRequested,
      communication_safety_pack: safetyPackText,
      updated_at: new Date().toISOString(),
    };
  }

  function updateTextForSubmit(payload, uploadedCount) {
    if (payload.communication_safety_pack && payload.video_call_requested && !payload.message) {
      return payload.communication_safety_pack;
    }
    if (payload.message) return payload.message;
    if (payload.video_call_requested && uploadedCount) return `Video call requested and ${uploadedCount} proof item${uploadedCount === 1 ? "" : "s"} attached.`;
    if (payload.video_call_requested) return "Video call requested from the job room.";
    if (uploadedCount) return `${uploadedCount} proof item${uploadedCount === 1 ? "" : "s"} attached from the job room.`;
    return "Job-room proof update submitted.";
  }

  async function submitLiveReceiverUpdate(payload) {
    if (!code) {
      throw new Error("A request code is required before live proof can be submitted.");
    }
    if (!window.SwadaktaData) {
      throw new Error("Live data helper is not loaded yet.");
    }

    const session = await window.SwadaktaData.getSession();
    if (!session.session?.user?.email) {
      throw new Error("Sign in as the assigned verified receiver before submitting live proof.");
    }

    const files = uploadableFiles();
    let uploadedLinks = [];
    if (files.length) {
      setStatus("Uploading proof files...");
      const uploads = await window.SwadaktaData.uploadProofFiles(code, files);
      uploadedLinks = (uploads.data || []).map((upload) => upload.signed_url).filter(Boolean);
    }

    const proofLinks = [...payload.proof_links, ...uploadedLinks];
    const updateText = updateTextForSubmit(payload, proofLinks.length);
    const result = await window.SwadaktaData.submitAssignedJobUpdate(code, {
      field_status: payload.field_status,
      update_text: updateText,
      proof_links: proofLinks,
    });

    return {
      result,
      proofLinks,
      uploadedCount: uploadedLinks.length,
    };
  }

  async function refreshLiveReadiness() {
    if (!window.SwadaktaData) {
      setLiveStatus("Live proof upload is unavailable on this page load. Drafts still save locally.");
      return;
    }

    try {
      const session = await window.SwadaktaData.getSession();
      const email = session.session?.user?.email || "";
      if (!email) {
        setLiveStatus("Sign in as the assigned verified receiver to submit proof directly. Drafts still save locally.");
        return;
      }

      if (!code) {
        setLiveStatus(`Signed in as ${email}. Add a request code to submit live receiver proof.`, "text-primary");
        return;
      }

      const jobs = await window.SwadaktaData.listMyAssignedJobs();
      const assigned = (jobs.data || []).some(
        (job) => String(job.request_code || "").toUpperCase() === code,
      );
      setLiveStatus(
        assigned
          ? `Signed in as ${email}. This request is available for receiver proof updates.`
          : `Signed in as ${email}. Live proof submit is only for the assigned verified receiver; this will save as a draft if you are not assigned.`,
        assigned ? "text-primary" : "text-on-surface-variant",
      );
    } catch (error) {
      setLiveStatus(error.message || "Could not check live receiver status. Drafts still save locally.");
    }
  }

  if (code || contact) {
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
  }

  const saved = readDraft();
  if (saved && draftInput) {
    draftInput.value = saved.message || "";
    if (fieldStatus && saved.field_status) fieldStatus.value = saved.field_status;
    if (proofLinksInput && Array.isArray(saved.proof_links)) proofLinksInput.value = saved.proof_links.join("\n");
    videoRequested = Boolean(saved.video_call_requested);
    safetyPackText = saved.communication_safety_pack || "";
    if (safetyPackText && safetyPreview) safetyPreview.textContent = safetyPackText;
    renderMediaList([]);
    if (saved.updated_at) setStatus(`Draft restored from ${new Date(saved.updated_at).toLocaleString()}.`);
  }

  if (mediaInput) {
    mediaInput.addEventListener("change", () => {
      renderMediaList(mediaInput.files || []);
      setStatus(mediaInput.files?.length ? "Media attached to draft." : "");
    });
  }

  if (recordVoice && stopVoice && voicePlayback) {
    recordVoice.addEventListener("click", async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setStatus("Voice recording is not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        voiceChunks = [];
        recorder = new MediaRecorder(stream);
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data?.size) voiceChunks.push(event.data);
        });
        recorder.addEventListener("stop", () => {
          voiceBlob = new Blob(voiceChunks, { type: recorder.mimeType || "audio/webm" });
          voicePlayback.src = URL.createObjectURL(voiceBlob);
          voicePlayback.hidden = false;
          stream.getTracks().forEach((track) => track.stop());
          renderMediaList(mediaInput?.files || []);
          setStatus("Voice note attached to draft.");
        });
        recorder.start();
        recordVoice.hidden = true;
        stopVoice.hidden = false;
        setStatus("Recording voice note...");
      } catch (error) {
        setStatus(error.message || "Could not start voice recording.");
      }
    });

    stopVoice.addEventListener("click", () => {
      if (recorder && recorder.state !== "inactive") recorder.stop();
      stopVoice.hidden = true;
      recordVoice.hidden = false;
    });
  }

  if (videoCall) {
    videoCall.addEventListener("click", () => {
      videoRequested = true;
      renderMediaList(mediaInput?.files || []);
      renderSafetyPack("agenda");
      setStatus("Video call request added. Keep scheduling inside the job room and do not make payment, release, ID, or assignment decisions on the call alone.");
    });
  }

  if (buildAgenda) {
    buildAgenda.addEventListener("click", () => {
      renderSafetyPack("agenda");
    });
  }

  if (buildProofRequest) {
    buildProofRequest.addEventListener("click", () => {
      renderSafetyPack("proof");
    });
  }

  if (buildRecap) {
    buildRecap.addEventListener("click", () => {
      renderSafetyPack("recap");
    });
  }

  if (applySafetyPack) {
    applySafetyPack.addEventListener("click", () => {
      if (!safetyPackText) renderSafetyPack("agenda");
      if (!draftInput) return;
      const current = draftInput.value.trim();
      draftInput.value = current ? `${current}\n\n${safetyPackText}` : safetyPackText;
      setSafetyStatus("Pack applied to the job update.", "text-primary");
    });
  }

  if (copySafetyPack) {
    copySafetyPack.addEventListener("click", async () => {
      try {
        if (!safetyPackText) renderSafetyPack("agenda");
        await copyText(safetyPackText);
        setSafetyStatus("Proof-safe communication pack copied.", "text-primary");
      } catch (error) {
        setSafetyStatus(error.message || "Could not copy the pack.");
      }
    });
  }

  if (draftForm) {
    draftForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      let payload;
      try {
        payload = currentDraftPayload();
        if (
          !payload.message &&
          !payload.files.length &&
          !payload.proof_links.length &&
          !payload.has_voice_note &&
          !payload.video_call_requested
        ) {
          setStatus("Add a message, file, proof link, voice note, or call request first.", "text-primary");
          return;
        }
      } catch (error) {
        setStatus(error.message || "Check the proof links and try again.", "text-primary");
        return;
      }

      if (submitButton) submitButton.disabled = true;
      writeDraft(payload);

      try {
        setStatus("Saving draft and attempting live receiver proof update...");
        const live = await submitLiveReceiverUpdate(payload);
        writeDraft({
          ...payload,
          proof_links: live.proofLinks,
          live_update_code: live.result.data?.update_code || "",
          live_saved_at: new Date().toISOString(),
        });
        setStatus(
          `Receiver proof update ${live.result.data?.update_code || ""} saved to Swadakta.`,
          "text-primary",
        );
        await refreshLiveReadiness();
      } catch (error) {
        writeDraft({
          ...payload,
          live_error: error.message || "Live receiver proof update unavailable.",
        });
        setStatus(
          `Draft saved locally. Live receiver proof was not submitted: ${error.message || "not available for this account."}`,
          "text-on-surface-variant",
        );
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  refreshLiveReadiness();
})();
