const crypto = require("crypto");

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
const SUMSUB_BASE_URL = (process.env.SUMSUB_BASE_URL || "https://api.sumsub.com").replace(/\/+$/, "");
const SUMSUB_LINK_TTL_SECONDS = Number(process.env.SUMSUB_WEBSDK_LINK_TTL_SECONDS || 1800);

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
const PROVIDER_NATIVE_REQUIRED_ENV = {
  smile_id: ["SMILE_ID_API_KEY", "SMILE_ID_PARTNER_ID"],
  sumsub: ["SUMSUB_APP_TOKEN", "SUMSUB_SECRET_KEY", "SUMSUB_LEVEL_NAME"],
  youverify: ["YOUVERIFY_API_KEY"],
};
const ALLOWED_PROVIDERS = new Set(Object.keys(PROVIDER_LABELS));
const OPEN_REQUEST_STATUSES = ["requested", "link_sent", "submitted", "manual_review"];
const IDENTITY_REQUEST_SELECT =
  "id,user_id,request_code,provider,status,provider_link,provider_reference,admin_notes";

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

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;
  if (req.body && typeof req.body === "object") return JSON.stringify(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
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

function missingEnv(names = []) {
  return names.filter((name) => !String(process.env[name] || "").trim());
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : fallback;
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

function providerSetup(provider, configuredLink) {
  const nativeRequired = PROVIDER_NATIVE_REQUIRED_ENV[provider] || [];
  const nativeMissing = missingEnv(nativeRequired);
  const handoffMissing = configuredLink.value ? [] : PROVIDER_LINK_ENV[provider] || [];
  const nativeReady = nativeRequired.length > 0 && nativeMissing.length === 0;

  return {
    provider,
    native_ready: nativeReady,
    native_required_env: nativeRequired,
    native_missing_env: nativeMissing,
    handoff_ready: Boolean(configuredLink.value),
    handoff_env_used: configuredLink.value ? configuredLink.name : "",
    handoff_missing_env: handoffMissing,
  };
}

function providerCallbackUrl(provider) {
  const path =
    {
      sumsub: "/api/identity/sumsub-webhook",
    }[provider] || "/verification";
  return new URL(path, publicOrigin()).href;
}

function signedSumsubHeaders(method, pathWithQuery, body) {
  const appToken = String(process.env.SUMSUB_APP_TOKEN || "").trim();
  const secretKey = String(process.env.SUMSUB_SECRET_KEY || "").trim();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(`${timestamp}${method.toUpperCase()}${pathWithQuery}${body || ""}`)
    .digest("hex");

  return {
    "content-type": "application/json",
    "x-app-token": appToken,
    "x-app-access-ts": timestamp,
    "x-app-access-sig": signature,
  };
}

async function createSumsubWebsdkLink({ reference, reason, user }) {
  const missing = missingEnv(PROVIDER_NATIVE_REQUIRED_ENV.sumsub);
  if (missing.length) {
    return {
      ready: false,
      missing,
      reason: `Missing Sumsub environment values: ${missing.join(", ")}.`,
    };
  }

  const pathWithQuery = "/resources/sdkIntegrations/levels/-/websdkLink";
  const successUrl = new URL("/verification", publicOrigin());
  successUrl.searchParams.set("status", "provider_return");
  successUrl.searchParams.set("provider", "sumsub");
  successUrl.searchParams.set("reference", reference);

  const rejectUrl = new URL("/verification", publicOrigin());
  rejectUrl.searchParams.set("status", "provider_rejected");
  rejectUrl.searchParams.set("provider", "sumsub");
  rejectUrl.searchParams.set("reference", reference);

  const ttlInSecs = positiveInteger(SUMSUB_LINK_TTL_SECONDS, 1800);
  const bodyPayload = {
    levelName: String(process.env.SUMSUB_LEVEL_NAME || "").trim(),
    userId: reference,
    applicantIdentifiers: {
      email: String(user.email || "").trim(),
    },
    redirect: {
      successUrl: successUrl.href,
      rejectUrl: rejectUrl.href,
    },
    ttlInSecs,
  };

  const body = JSON.stringify(bodyPayload);
  const response = await fetch(`${SUMSUB_BASE_URL}${pathWithQuery}`, {
    method: "POST",
    headers: signedSumsubHeaders("POST", pathWithQuery, body),
    body,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.url) {
    const error = new Error(
      data.description || data.message || `Sumsub WebSDK link creation failed with ${response.status}.`,
    );
    error.statusCode = response.status || 502;
    error.provider = "sumsub";
    throw error;
  }

  return {
    ready: true,
    url: data.url,
    ttl_in_seconds: ttlInSecs,
    mode: "sumsub_websdk_link",
  };
}

function safeCompare(first, second) {
  const firstBuffer = Buffer.from(String(first || ""));
  const secondBuffer = Buffer.from(String(second || ""));
  if (firstBuffer.length !== secondBuffer.length || firstBuffer.length === 0) return false;
  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function expectedDigest(rawBody, algorithm, secret) {
  return {
    hex: crypto.createHmac(algorithm, secret).update(rawBody, "utf8").digest("hex"),
    base64: crypto.createHmac(algorithm, secret).update(rawBody, "utf8").digest("base64"),
  };
}

function digestAlgorithm(header) {
  const clean = String(header || "HMAC_SHA256_HEX").toUpperCase();
  if (clean.includes("512")) return "sha512";
  if (clean.includes("1") && !clean.includes("256") && !clean.includes("512")) return "sha1";
  return "sha256";
}

function verifySumsubSignature(rawBody, headers) {
  const secret = String(process.env.SUMSUB_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    const error = new Error("SUMSUB_WEBHOOK_SECRET is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const providedDigest = String(headers["x-payload-digest"] || "").trim();
  if (!providedDigest) {
    const error = new Error("Missing Sumsub x-payload-digest header.");
    error.statusCode = 401;
    throw error;
  }

  const algorithm = digestAlgorithm(headers["x-payload-digest-alg"]);
  const expected = expectedDigest(rawBody, algorithm, secret);
  if (!safeCompare(providedDigest, expected.hex) && !safeCompare(providedDigest, expected.base64)) {
    const error = new Error("Sumsub webhook signature verification failed.");
    error.statusCode = 401;
    throw error;
  }
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

function requireServiceHeaders() {
  const headers = serviceHeaders();
  if (!headers) {
    const error = new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
    error.statusCode = 503;
    throw error;
  }
  return headers;
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

function sumsubRequestReference(event) {
  return String(
    event.externalUserId ||
      event.external_user_id ||
      event.userId ||
      event.user_id ||
      event.correlationId ||
      event.applicantId ||
      "",
  ).trim();
}

function sumsubReviewDecision(event) {
  const reviewAnswer = String(event.reviewResult?.reviewAnswer || "").toUpperCase();
  const reviewStatus = String(event.reviewStatus || event.review_status || "").toLowerCase();
  const eventType = String(event.type || "").toLowerCase();
  const rejectType = String(event.reviewResult?.reviewRejectType || "").toUpperCase();

  if (reviewAnswer === "GREEN") return { status: "verified", terminal: true };
  if (reviewAnswer === "RED") {
    return rejectType === "RETRY"
      ? { status: "manual_review", terminal: false }
      : { status: "failed", terminal: true };
  }
  if (eventType.includes("pending") || reviewStatus === "pending") return { status: "submitted", terminal: false };
  if (eventType.includes("onhold") || reviewStatus === "onhold") return { status: "manual_review", terminal: false };
  return { status: "submitted", terminal: false };
}

async function findIdentityRequestByReference(reference) {
  if (!reference) return null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/identity_verification_requests?provider_reference=eq.${encodeURIComponent(reference)}&select=${IDENTITY_REQUEST_SELECT}&limit=1`,
    { headers: requireServiceHeaders() },
  );
  const data = await response.json().catch(() => []);

  if (!response.ok) {
    const error = new Error(data?.message || "Could not find Sumsub identity verification request.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function patchSumsubIdentityResult({ request, event, decision, reference }) {
  const providerReference = reference || request.provider_reference;
  const eventType = String(event.type || "sumsub_webhook");
  const applicantId = String(event.applicantId || "");
  const reviewAnswer = String(event.reviewResult?.reviewAnswer || "pending");
  const reviewStatus = String(event.reviewStatus || "pending");
  const adminNotes = [
    `Sumsub webhook ${eventType} recorded.`,
    applicantId ? `Applicant: ${applicantId}.` : "",
    `Review: ${reviewStatus}/${reviewAnswer}.`,
    "Provider evidence decides verification; AI cannot override this result.",
  ]
    .filter(Boolean)
    .join(" ");

  const requestPayload = {
    provider: "sumsub",
    status: decision.status,
    provider_reference: providerReference,
    admin_notes: adminNotes,
    resolved_at: decision.terminal ? new Date().toISOString() : null,
  };
  const requestResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/identity_verification_requests?id=eq.${encodeURIComponent(request.id)}`,
    {
      method: "PATCH",
      headers: requireServiceHeaders(),
      body: JSON.stringify(requestPayload),
    },
  );
  const requestRows = await requestResponse.json().catch(() => []);

  if (!requestResponse.ok) {
    const error = new Error(requestRows?.message || "Could not update Sumsub identity verification request.");
    error.statusCode = 502;
    throw error;
  }

  const profilePayload = {
    identity_verification_provider: "sumsub",
    identity_verification_status: decision.status,
    identity_verification_reference: providerReference,
    identity_verification_notes: adminNotes,
  };
  if (decision.status === "verified") {
    profilePayload.identity_verified_at = new Date().toISOString();
  } else if (decision.status === "failed") {
    profilePayload.identity_verified_at = null;
  }

  const profileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/account_profiles?user_id=eq.${encodeURIComponent(request.user_id)}`,
    {
      method: "PATCH",
      headers: requireServiceHeaders(),
      body: JSON.stringify(profilePayload),
    },
  );
  const profileRows = await profileResponse.json().catch(() => []);

  if (!profileResponse.ok) {
    const error = new Error(profileRows?.message || "Could not update Sumsub account profile result.");
    error.statusCode = 502;
    throw error;
  }

  return {
    updated: true,
    request_code: requestRows[0]?.request_code || request.request_code,
    status: decision.status,
    provider_reference: providerReference,
  };
}

async function handleSumsubWebhook(req, res) {
  try {
    const rawBody = await readRawBody(req);
    verifySumsubSignature(rawBody, req.headers || {});

    const event = JSON.parse(rawBody);
    const reference = sumsubRequestReference(event);
    const request = await findIdentityRequestByReference(reference);

    if (!request) {
      sendJson(res, 200, {
        received: true,
        updated: false,
        reason: "No Swadakta identity request matched the Sumsub external user reference.",
      });
      return;
    }

    const decision = sumsubReviewDecision(event);
    const result = await patchSumsubIdentityResult({ request, event, decision, reference });
    sendJson(res, 200, { received: true, result });
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || "Sumsub webhook failed." });
  }
}

function providerDocs(provider) {
  return {
    smile_id: "https://docs.usesmileid.com/integration-options/web-mobile-web/web-integration",
    sumsub: "https://docs.sumsub.com/reference/generate-websdk-external-link",
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
  const setup = providerSetup(provider, configuredLink);
  let providerLink = configuredLink.value ? buildProviderLink(configuredLink.value, { reference, provider, reason }) : "";
  let providerMode = providerLink ? "configured_provider_link" : "queued_for_provider_setup";
  let providerSession = null;

  if (provider === "sumsub" && setup.native_ready) {
    providerSession = await createSumsubWebsdkLink({ reference, reason, user });
    if (providerSession.ready) {
      providerLink = providerSession.url;
      providerMode = providerSession.mode;
    }
  }

  const status = providerLink ? "link_sent" : "requested";
  const providerLabel = PROVIDER_LABELS[provider] || "Provider";
  const adminNotes = providerLink
    ? `${providerLabel} verification link prepared by /api/identity/start-verification using ${providerMode}. Provider evidence still decides verification; AI and users cannot mark ID verified.`
    : `${providerLabel} verification requested. Configure ${configuredLink.name || "provider verification URL"} or missing native provider env values before automated links can be issued.`;
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
    provider_mode: providerMode,
    provider_link: providerLink,
    provider_reference: reference,
    provider_callback_url: providerCallbackUrl(provider),
    provider_setup: setup,
    provider_session: providerSession
      ? {
          mode: providerSession.mode,
          ttl_in_seconds: providerSession.ttl_in_seconds,
        }
      : null,
    docs_url: providerDocs(provider),
    database_updated: updated.updated,
    database_note: updated.reason || "Verification request/profile updated.",
    message: providerLink
      ? `${providerLabel} verification is ready. Open the provider check and complete the ID, document, selfie, and liveness steps.`
      : `${providerLabel} verification is queued. The provider account/link is not configured yet, so paid posting and paid work remain locked until provider evidence is attached.`,
    next: providerLink
      ? "Open the provider link from this page. Swadakta will wait for provider evidence before any paid unlock."
      : `Founder/admin should configure ${configuredLink.name || "the provider verification link"} or missing native provider env values before relying on automated ID handoff.`,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.headers["x-payload-digest"]) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      sendJson(res, 405, { error: "Method not allowed." });
      return;
    }

    await handleSumsubWebhook(req, res);
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
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

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
