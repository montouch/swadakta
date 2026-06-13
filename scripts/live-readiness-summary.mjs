const baseUrl = (process.env.SWADAKTA_E2E_BASE_URL || process.env.SWADAKTA_BASE_URL || "https://swadakta.com").replace(/\/+$/, "");
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SWADAKTA_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_braRDOvu_VbLc6PItbElmg_3hK-Zg51";
const email = process.env.SWADAKTA_E2E_ADMIN_EMAIL || process.env.SWADAKTA_E2E_EMAIL;
const password = process.env.SWADAKTA_E2E_ADMIN_PASSWORD || process.env.SWADAKTA_E2E_PASSWORD;
const args = new Set(process.argv.slice(2));
const asJson = args.has("--json");
const strict = args.has("--strict");

function requireCredentials() {
  if (!email || !password) {
    throw new Error(
      "Set SWADAKTA_E2E_ADMIN_EMAIL and SWADAKTA_E2E_ADMIN_PASSWORD, or SWADAKTA_E2E_EMAIL and SWADAKTA_E2E_PASSWORD.",
    );
  }
}

async function signIn() {
  requireCredentials();
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabasePublishableKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.access_token) {
    throw new Error(`Admin sign-in failed for ${email}: ${payload.error_description || payload.msg || response.status}`);
  }

  return payload;
}

async function readinessReport(accessToken) {
  const response = await fetch(`${baseUrl}/api/ops/readiness`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Readiness API failed with ${response.status}: ${payload.error || payload.message || "Unknown error"}`);
  }

  return payload;
}

function allItems(report) {
  return (report.categories || []).flatMap((category) =>
    (category.items || []).map((item) => ({
      ...item,
      category: item.category || category.label || category.title || category.id || "Uncategorized",
    })),
  );
}

function compactItem(item) {
  return {
    id: item.id || "",
    category: item.category || "",
    label: item.label || item.title || item.id || "Untitled item",
    status: item.status || "unknown",
    owner: item.owner || "",
    missing: item.missing || [],
    next: item.next || "",
    docs_url: item.docs_url || "",
  };
}

function summarize(report) {
  const items = allItems(report).map(compactItem);
  const blockers = (report.launch_gate?.blockers || []).map(compactItem);
  const missing = items.filter((item) => item.status === "missing");
  const warnings = items.filter((item) => item.status === "warning");
  const manual = items.filter((item) => item.status === "manual");

  return {
    generated_at: report.generated_at || "",
    environment: report.environment || {},
    launch_gate: {
      status: report.launch_gate?.status || "unknown",
      label: report.launch_gate?.label || "",
      paid_jobs: report.launch_gate?.paid_jobs || "",
      founder_load: report.launch_gate?.founder_load || "",
      summary: report.launch_gate?.summary || "",
    },
    counts: report.counts || {
      ready: items.filter((item) => item.status === "ready").length,
      missing: missing.length,
      warning: warnings.length,
      manual: manual.length,
    },
    blockers,
    warnings,
    manual,
    next_actions: report.next_actions || [],
  };
}

function printText(summary) {
  const lines = [
    "Swadakta live readiness summary",
    `Base: ${baseUrl}`,
    `Generated: ${summary.generated_at || "unknown"}`,
    `Launch gate: ${summary.launch_gate.label || summary.launch_gate.status}`,
    `Paid jobs: ${summary.launch_gate.paid_jobs || "unknown"}; founder load: ${summary.launch_gate.founder_load || "unknown"}`,
    `Counts: ready ${summary.counts.ready || 0}, missing ${summary.counts.missing || 0}, warning ${summary.counts.warning || 0}, manual ${summary.counts.manual || 0}`,
  ];

  if (summary.launch_gate.summary) {
    lines.push(`Summary: ${summary.launch_gate.summary}`);
  }

  lines.push("", "Top blockers:");
  for (const [index, item] of summary.blockers.slice(0, 8).entries()) {
    const missing = item.missing?.length ? ` Missing: ${item.missing.join(", ")}.` : "";
    lines.push(`${index + 1}. ${item.label} (${item.owner || "owner TBD"}) - ${item.next}${missing}`);
  }

  if (!summary.blockers.length) {
    lines.push("None reported by launch gate.");
  }

  if (summary.warnings.length) {
    lines.push("", "Warnings:");
    for (const [index, item] of summary.warnings.slice(0, 5).entries()) {
      lines.push(`${index + 1}. ${item.label} - ${item.next}`);
    }
  }

  if (summary.manual.length) {
    lines.push("", "Manual checks still tracked:");
    for (const [index, item] of summary.manual.slice(0, 8).entries()) {
      lines.push(`${index + 1}. ${item.label} - ${item.next}`);
    }
  }

  console.log(lines.join("\n"));
}

try {
  const session = await signIn();
  const report = await readinessReport(session.access_token);
  const summary = summarize(report);

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printText(summary);
  }

  if (strict && ((summary.counts.warning || 0) > 0 || summary.launch_gate.status === "paid_launch_blocked")) {
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
