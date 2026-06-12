const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SWADAKTA_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_braRDOvu_VbLc6PItbElmg_3hK-Zg51";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SWADAKTA_SUPABASE_SERVICE_ROLE_KEY ||
  "";
const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  process.env.SWADAKTA_PUBLIC_BASE_URL ||
  "https://swadakta.com";

const PROVIDER_LABELS = {
  smile_id: "Smile ID",
  sumsub: "Sumsub",
  youverify: "Youverify",
  manual: "Manual exception",
};
const PROVIDER_LINK_ENV = {
  smile_id: ["SMILE_ID_VERIFICATION_URL", "SMILE_ID_WEB_LINK_URL", "SMILE_ID_PORTAL_URL"],
  sumsub: ["SUMSUB_VERIFICATION_URL", "SUMSUB_WEBSDK_URL", "SUMSUB_APPLICANT_LINK_URL"],
  youverify: ["YOUVERIFY_VERIFICATION_URL", "YOUVERIFY_APPLICANT_LINK_URL"],
};
const ALLOWED_PROVIDERS = new Set(Object.keys(PROVIDER_LABELS));
const OPEN_REQUEST_STATUSES = ["requested", "link_sent", "submitted", "manual_review"];

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function publicOrigin() {
  try {
    return new URL(PUBLIC_BASE_URL).origin;
  } catch {
    return "https://swadakta.com";
  }
}

function cleanProvider(value) {
  const provider = String(value || "sumsub").trim().toLowerCase();
  return ALLOWED_PROVIDERS.has(provider) ? provider : "sumsub";
}

function cleanReason(value) {
  const reason = String(value || "account_required").trim().toLowerCase();
  return ["account_required", "paid_work", "receiver_work", "sensitive_job", "high_value_job", "manual_review", "other"].includes(reason)
    ? reason
    : "account_required";
}

function envValue(names = []) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value) return { name, value };
  }
  return { name: names[0] || "", value: "" };
}

function compactReference(value, fallback) {
  const clean = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, "-")
    .slice(0, 80);
  return clean || fallback;
}

function providerReference({ provider, requestCode, userId }) {
  const base = compactReference(requestCode, `IV-${String(userId || "").replaceAll("-", "").slice(0, 10).toUpperCase()}`);
  return `${provider.toUpperCase()}-${base}`;
}

function buildProviderLink(baseLink, { reference, provider, reason }) {
  const url = new URL(baseLink);
  const returnUrl = new URL("/verification", publicOrigin());
  returnUrl.searchParams.set("status", "provider_return");
  returnUrl.searchParams.set("reference", reference);

  url.searchParams.set("swadakta_reference", reference);
  url.searchParams.set("provider", provider);
  url.searchParams.set("reason", reason);
  url.searchParams.set("return_url", returnUrl.href);
  return url.href;
}

async function assertUser(authHeader) {
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    const error = new Error("Sign in before starting identity verification.");
    error.statusCode = 401;
    throw error;
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      authorization: authHeader,
    },
  });

  if (!response.ok) {
    const error = new Error("Could not verify the signed-in account.");
    error.statusCode = 401;
    throw error;
  }

  const user = await response.json();
  if (!user?.id) {
    const error = new Error("Supabase session did not include a user id.");
    error.statusCode = 401;
    throw error;
  }

  return user;
}

function serviceHeaders() {
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    accept: "application/json",
    prefer: "return=representation",
  };
}

async function fetchOpenRequest({ userId, requestId }) {
  const headers = serviceHeaders();
  if (!headers) return null;

  const filters = requestId
    ? `id=eq.${encodeURIComponent(requestId)}&user_id=eq.${encodeURIComponent(userId)}`
    : `user_id=eq.${encodeURIComponent(userId)}&status=in.(${OPEN_REQUEST_STATUSES.join(",")})&order=updated_at.desc&limit=1`;
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/identity_verification_requests?${filters}&select=id,request_code,provider,status`,
    { headers },
  );

  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function patchSupabase({ userId, requestId, requestCode, provider, status, providerLink, reference, adminNotes }) {
  const headers = serviceHeaders();
  if (!headers) return { updated: false, reason: "SUPABASE_SERVICE_ROLE_KEY is not configured." };

  const request = await fetchOpenRequest({ userId, requestId });
  const updatePayload = {
    provider,
    status,
    provider_link: providerLink || null,
    provider_reference: reference,
    admin_notes: adminNotes,
  };

  if (request?.id) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/identity_verification_requests?id=eq.${encodeURIComponent(request.id)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(updatePayload),
      },
    );
    if (!response.ok) {
      return { updated: false, reason: `Identity request update failed with ${response.status}.` };
    }
  }

  const profilePayload = {
    identity_verification_provider: provider,
    identity_verification_status: status === "requested" ? "submitted" : status,
    identity_verification_link: providerLink || "",
    identity_verification_reference: reference,
    identity_verification_notes: adminNotes,
  };
  const profileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/account_profiles?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(profilePayload),
    },
  );

  return {
    updated: profileResponse.ok,
    reason: profileResponse.ok ? "" : `Account profile update failed with ${profileResponse.status}.`,
    request_code: request?.request_code || requestCode || "",
  };
}

function providerDocs(provider) {
  return {
    smile_id: "https://docs.usesmileid.com/integration-options/web-mobile-web/web-integration",
    sumsub: "https://docs.sumsub.com/docs/websdk",
    youverify: "https://doc.youverify.co/",
    manual: "https://swadakta.com/trust",
  }[provider];
}

async function startVerification(payload, user) {
  const provider = cleanProvider(payload.provider);
  const reason = cleanReason(payload.reason);
  const requestId = String(payload.request_id || payload.id || "").trim();
  const requestCode = compactReference(payload.request_code, "");
  const reference = providerReference({ provider, requestCode, userId: user.id });
  const configuredLink = envValue(PROVIDER_LINK_ENV[provider] || []);
  const providerLink = configuredLink.value
    ? buildProviderLink(configuredLink.value, { reference, provider, reason })
    : "";
  const status = providerLink ? "link_sent" : "requested";
  const providerLabel = PROVIDER_LABELS[provider] || "Provider";
  const adminNotes = providerLink
    ? `${providerLabel} handoff link prepared by /api/identity/start-verification. Provider evidence still decides verification; AI and users cannot mark ID verified.`
    : `${providerLabel} verification requested. Add ${configuredLink.name || "provider verification URL"} or provider API integration in Vercel/Supabase before automated links can be issued.`;
  const updated = await patchSupabase({
    userId: user.id,
    requestId,
    requestCode,
    provider,
    status,
    providerLink,
    reference,
    adminNotes,
  });

  return {
    status,
    provider,
    provider_label: providerLabel,
    provider_link: providerLink,
    provider_reference: reference,
    docs_url: providerDocs(provider),
    database_updated: updated.updated,
    database_note: updated.reason || "Verification request/profile updated.",
    message: providerLink
      ? `${providerLabel} verification is ready. Open the provider check and complete the ID, document, selfie, and liveness steps.`
      : `${providerLabel} verification is queued. The provider account/link is not configured yet, so paid posting and paid receiver work remain locked until provider evidence is attached.`,
    next: providerLink
      ? "Open the provider link from this page. Swadakta will wait for provider evidence before any paid unlock."
      : `Founder/admin should configure ${configuredLink.name || "the provider verification link"} or a provider API/webhook before relying on automated ID handoff.`,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const user = await assertUser(req.headers.authorization);
    const payload = await readJsonBody(req);
    sendJson(res, 200, await startVerification(payload, user));
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Could not start identity verification.",
    });
  }
};
