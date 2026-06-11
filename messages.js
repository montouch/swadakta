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

  if (!card) return;

  const params = new URLSearchParams(window.location.search);
  const code = String(params.get("code") || "").trim().toUpperCase();
  const contact = String(params.get("contact") || "").trim();
  const storageKey = `swadakta_message_draft_${code || "general"}`;
  let recorder = null;
  let voiceChunks = [];
  let voiceBlob = null;
  let videoRequested = false;

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

  function renderMediaList(files = []) {
    if (!mediaList) return;
    const items = [...files].map((file) => `<li>${fileSummary(file)}</li>`);
    if (voiceBlob) items.push(`<li>Voice note ready (${Math.max(1, Math.round(voiceBlob.size / 1024))} KB)</li>`);
    if (videoRequested) items.push("<li>Video call request added</li>");

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
      updated_at: new Date().toISOString(),
    };
  }

  function updateTextForSubmit(payload, uploadedCount) {
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
      setStatus("Video call request added to draft.");
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
