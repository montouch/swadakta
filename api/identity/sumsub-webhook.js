const crypto = require("crypto");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const SUPABASE_SERVER_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SWADAKTA_SUPABASE_SERVICE_ROLE_KEY;

const REQUEST_SELECT =
  "id,user_id,request_code,provider,status,provider_link,provider_reference,admin_notes";

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function safeCompare(first, second) {
  const firstBuffer = Buffer.from(String(first || ""));
  const secondBuffer = Buffer.from(String(second || ""));
  if (firstBuffer.length !== secondBuffer.length || firstBuffer.length === 0) return false;
  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function expectedDigest(rawBody, algorithm, secret) {
  const hmac = crypto.createHmac(algorithm, secret).update(rawBody, "utf8");
  return {
    hex: hmac.digest("hex"),
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

function requestReference(event) {
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

function reviewDecision(event) {
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

function serviceHeaders() {
  if (!SUPABASE_SERVER_KEY) {
    const error = new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is not configured.");
    error.statusCode = 503;
    throw error;
  }

  return {
    apikey: SUPABASE_SERVER_KEY,
    authorization: `Bearer ${SUPABASE_SERVER_KEY}`,
    accept: "application/json",
    "content-type": "application/json",
    prefer: "return=representation",
  };
}

async function findIdentityRequest(reference) {
  if (!reference) return null;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/identity_verification_requests?provider_reference=eq.${encodeURIComponent(reference)}&select=${REQUEST_SELECT}&limit=1`,
    { headers: serviceHeaders() },
  );
  const data = await response.json().catch(() => []);

  if (!response.ok) {
    const error = new Error(data?.message || "Could not find Sumsub identity verification request.");
    error.statusCode = 502;
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

async function patchIdentityResult({ request, event, decision, reference }) {
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
      headers: serviceHeaders(),
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
      headers: serviceHeaders(),
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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    verifySumsubSignature(rawBody, req.headers || {});

    const event = JSON.parse(rawBody);
    const reference = requestReference(event);
    const request = await findIdentityRequest(reference);

    if (!request) {
      sendJson(res, 200, {
        received: true,
        updated: false,
        reason: "No Swadakta identity request matched the Sumsub external user reference.",
      });
      return;
    }

    const decision = reviewDecision(event);
    const result = await patchIdentityResult({ request, event, decision, reference });
    sendJson(res, 200, { received: true, result });
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || "Sumsub webhook failed." });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
