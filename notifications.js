(function () {
  const data = window.SwadaktaData;
  const state = {
    notifications: [],
    filter: "all",
    includeDismissed: false,
    session: null,
    mode: "checking",
  };

  const elements = {
    authPanel: document.querySelector("#notification-auth-panel"),
    list: document.querySelector("#notification-list"),
    empty: document.querySelector("#notification-empty"),
    status: document.querySelector("#notification-status"),
    refresh: document.querySelector("#notifications-refresh"),
    includeDismissed: document.querySelector("#notification-include-dismissed"),
    filters: Array.from(document.querySelectorAll(".notification-filter")),
    template: document.querySelector("#notification-template"),
    statUnread: document.querySelector("#notification-stat-unread"),
    statActive: document.querySelector("#notification-stat-active"),
    statMode: document.querySelector("#notification-stat-mode"),
  };

  const categoryMeta = {
    account: ["person", "Account"],
    payment: ["payments", "Payment"],
    verification: ["verified_user", "Verification"],
    message: ["forum", "Message"],
    proof: ["perm_media", "Proof"],
    dispute: ["gavel", "Issue"],
    ai_summary: ["auto_awesome", "AI summary"],
    milestone: ["flag", "Milestone"],
    system: ["settings", "System"],
  };

  const priorityLabel = {
    info: "Info",
    success: "Good",
    attention: "Needs action",
    urgent: "Urgent",
  };

  function setStatus(message, tone = "neutral") {
    if (!elements.status) return;
    elements.status.textContent = message || "";
    elements.status.className = `mt-3 min-h-6 text-sm font-label ${
      tone === "error" ? "text-[#93000a]" : tone === "success" ? "text-[#006c46]" : "text-on-surface-variant"
    }`;
  }

  function safeText(value, fallback = "") {
    return String(value || fallback).trim();
  }

  function formatTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function hrefIsSafe(href) {
    const clean = safeText(href);
    return Boolean(clean && !clean.startsWith("http:") && !clean.startsWith("https:") && !clean.startsWith("//"));
  }

  function filteredNotifications() {
    return state.notifications.filter((notification) => {
      if (!state.includeDismissed && notification.dismissed_at) return false;
      if (state.filter === "all") return true;
      if (state.filter === "attention") return ["attention", "urgent"].includes(notification.priority);
      return notification.category === state.filter;
    });
  }

  function updateStats() {
    const active = state.notifications.filter((notification) => !notification.dismissed_at);
    const unread = active.filter((notification) => !notification.read_at);
    if (elements.statUnread) elements.statUnread.textContent = String(unread.length);
    if (elements.statActive) elements.statActive.textContent = String(active.length);
    if (elements.statMode) elements.statMode.textContent = state.mode === "supabase" ? "Live" : state.mode === "local" ? "Local" : state.mode;
  }

  function paintFilters() {
    elements.filters.forEach((button) => {
      const active = button.dataset.filter === state.filter;
      button.className = active
        ? "notification-filter rounded-full bg-primary px-4 py-2 font-label text-sm font-bold text-white"
        : "notification-filter rounded-full bg-white/75 px-4 py-2 font-label text-sm font-bold text-on-surface-variant ring-1 ring-outline-variant/40";
    });
  }

  function renderNotification(notification) {
    const node = elements.template.content.firstElementChild.cloneNode(true);
    const meta = categoryMeta[notification.category] || categoryMeta.account;
    const isRead = Boolean(notification.read_at);
    const isDismissed = Boolean(notification.dismissed_at);

    node.dataset.notificationCode = notification.notification_code;
    node.classList.toggle("opacity-60", isDismissed);
    node.querySelector(".notification-icon .material-symbols-outlined").textContent = meta[0];
    node.querySelector(".notification-priority").textContent = priorityLabel[notification.priority] || "Info";
    node.querySelector(".notification-category").textContent = meta[1];
    node.querySelector(".notification-time").textContent = formatTime(notification.created_at);
    node.querySelector(".notification-title").textContent = safeText(notification.title, "Swadakta update");
    node.querySelector(".notification-body").textContent = safeText(notification.body, "Open the related page for details.");

    const request = node.querySelector(".notification-request");
    if (notification.request_code) {
      request.textContent = `Request ${notification.request_code}`;
      request.hidden = false;
    }

    const open = node.querySelector(".notification-open");
    if (hrefIsSafe(notification.action_href)) {
      open.href = notification.action_href;
      open.textContent = safeText(notification.action_label, "Open");
      open.hidden = false;
    }

    const mark = node.querySelector(".notification-mark");
    mark.textContent = isRead ? "Mark unread" : "Mark read";
    mark.dataset.action = isRead ? "unread" : "read";

    const dismiss = node.querySelector(".notification-dismiss");
    dismiss.textContent = isDismissed ? "Restore" : "Dismiss";
    dismiss.dataset.action = isDismissed ? "restore" : "dismiss";

    return node;
  }

  function render() {
    paintFilters();
    updateStats();
    const visible = filteredNotifications();
    elements.list.innerHTML = "";
    elements.empty.hidden = visible.length !== 0 || !state.session;
    visible.forEach((notification) => elements.list.append(renderNotification(notification)));
    if (state.session && visible.length) {
      setStatus(`${visible.length} notification${visible.length === 1 ? "" : "s"} shown.`, "success");
    } else if (state.session) {
      setStatus("No matching notifications.", "neutral");
    }
  }

  async function loadNotifications() {
    if (!data?.getSession || !data?.listMyNotifications) {
      setStatus("Notification tools are not loaded on this page.", "error");
      return;
    }

    setStatus("Loading notifications...");
    let sessionResult = null;
    try {
      sessionResult = await data.getSession();
    } catch (error) {
      state.session = null;
      state.mode = "sign in";
      state.notifications = [];
      elements.authPanel.hidden = false;
      updateStats();
      elements.list.innerHTML = "";
      elements.empty.hidden = true;
      setStatus(error.message || "Sign in to open your private notification center.", "error");
      return;
    }

    state.session = sessionResult?.session || null;
    elements.authPanel.hidden = Boolean(state.session);

    if (!state.session) {
      state.notifications = [];
      state.mode = "signed out";
      updateStats();
      elements.list.innerHTML = "";
      elements.empty.hidden = true;
      setStatus("Sign in to open your private notification center.");
      return;
    }

    const result = await data.listMyNotifications({ includeDismissed: state.includeDismissed });
    state.mode = result.mode || "live";
    state.notifications = Array.isArray(result.data) ? result.data : [];
    render();
  }

  async function updateNotification(code, action) {
    if (!data?.markNotification) return;
    setStatus("Updating notification...");
    const result = await data.markNotification(code, action);
    const updated = result?.data;
    if (updated?.notification_code) {
      state.notifications = state.notifications.map((notification) =>
        notification.notification_code === updated.notification_code ? updated : notification,
      );
    } else {
      await loadNotifications();
      return;
    }
    render();
  }

  elements.refresh?.addEventListener("click", () => {
    loadNotifications().catch((error) => setStatus(error.message || "Could not refresh notifications.", "error"));
  });

  elements.includeDismissed?.addEventListener("change", () => {
    state.includeDismissed = elements.includeDismissed.checked;
    loadNotifications().catch((error) => setStatus(error.message || "Could not load dismissed notifications.", "error"));
  });

  elements.filters.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter || "all";
      render();
    });
  });

  elements.list?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = button.closest("[data-notification-code]");
    const code = card?.dataset.notificationCode;
    const action = button.dataset.action;
    updateNotification(code, action).catch((error) => setStatus(error.message || "Could not update notification.", "error"));
  });

  loadNotifications().catch((error) => setStatus(error.message || "Could not load notifications.", "error"));
})();
