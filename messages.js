(function () {
  const card = document.querySelector("#message-context-card");
  const codeEl = document.querySelector("#message-request-code");
  const contactEl = document.querySelector("#message-contact-copy");
  const trackingLink = document.querySelector("#message-tracking-link");
  const draftForm = document.querySelector("#message-draft-form");
  const draftInput = document.querySelector("#message-draft");
  const mediaInput = document.querySelector("#message-media");
  const mediaList = document.querySelector("#message-media-list");
  const recordVoice = document.querySelector("#message-record-voice");
  const stopVoice = document.querySelector("#message-stop-voice");
  const voicePlayback = document.querySelector("#message-voice-playback");
  const videoCall = document.querySelector("#message-video-call");
  const draftStatus = document.querySelector("#message-draft-status");

  if (!card) return;

  const params = new URLSearchParams(window.location.search);
  const code = String(params.get("code") || "").trim().toUpperCase();
  const contact = String(params.get("contact") || "").trim();
  const storageKey = `swadakta_message_draft_${code || "general"}`;
  let recorder = null;
  let voiceChunks = [];
  let voiceBlob = null;
  let videoRequested = false;

  function setStatus(message) {
    if (draftStatus) draftStatus.textContent = message;
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

  function currentDraftPayload() {
    const files = [...(mediaInput?.files || [])].map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    return {
      code,
      contact,
      message: draftInput?.value.trim() || "",
      files,
      has_voice_note: Boolean(voiceBlob),
      video_call_requested: videoRequested,
      updated_at: new Date().toISOString(),
    };
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
    draftForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const payload = currentDraftPayload();
      if (!payload.message && !payload.files.length && !payload.has_voice_note && !payload.video_call_requested) {
        setStatus("Add a message, file, voice note, or call request first.");
        return;
      }

      writeDraft(payload);
      setStatus("Draft saved in this browser and tied to this request code.");
    });
  }
})();
