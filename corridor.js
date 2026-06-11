(function () {
  const form = document.querySelector("#corridor-form");
  const nextCopy = document.querySelector("#corridor-next-copy");
  const STORAGE_KEY = "swadakta_corridor_context";

  if (!form) return;

  function field(id) {
    return document.querySelector(id);
  }

  function value(id) {
    return String(field(id)?.value || "").trim();
  }

  function setNextCopy() {
    const direction = value("#corridor-direction");
    const destination = value("#corridor-destination");
    const location = value("#corridor-location");
    const physical = direction !== "digital_global";
    nextCopy.textContent = physical
      ? `Next: create a paid brief for ${location || destination || "this corridor"}. The brief stays locked until your account is verified.`
      : "Next: create a digital/virtual brief. Paid work still requires account verification before posting or assignment.";
  }

  function saveContext() {
    const context = {
      origin_country: value("#corridor-origin"),
      destination_country: value("#corridor-destination"),
      task_location: value("#corridor-location"),
      service_direction: value("#corridor-direction"),
      service_type: value("#corridor-service"),
      notes: value("#corridor-notes"),
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    return context;
  }

  function restoreContext() {
    try {
      const context = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (context.origin_country) field("#corridor-origin").value = context.origin_country;
      if (context.destination_country) field("#corridor-destination").value = context.destination_country;
      if (context.task_location) field("#corridor-location").value = context.task_location;
      if (context.service_direction) field("#corridor-direction").value = context.service_direction;
      if (context.service_type) field("#corridor-service").value = context.service_type;
      if (context.notes) field("#corridor-notes").value = context.notes;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setNextCopy();
  }

  form.addEventListener("input", setNextCopy);
  form.addEventListener("change", setNextCopy);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const context = saveContext();
    const params = new URLSearchParams({
      origin: context.origin_country,
      destination: context.destination_country,
      location: context.task_location,
    });
    window.location.href = `brief.html?${params.toString()}`;
  });

  restoreContext();
})();
