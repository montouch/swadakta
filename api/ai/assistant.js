const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.SWADAKTA_SUPABASE_URL ||
  "https://srwkoulknropnwwyqslj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SWADAKTA_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_braRDOvu_VbLc6PItbElmg_3hK-Zg51";

const ROLE_POLICIES = {
  admin: {
    requireAdmin: true,
    label: "Founder/admin operations",
  },
  client: {
    requireAdmin: false,
    label: "Client guidance",
  },
  receiver: {
    requireAdmin: false,
    label: "Receiver guidance",
  },
};
const MAX_JSON_BODY_BYTES = 64 * 1024;
const SAFE_ASSIST_ONLY_PATTERN =
  /\b(draft|write|summari[sz]e|summary|explain|how|what|why|where|when|guide|steps|instructions|checklist|template|reply|message draft|review|risk|recommend|suggest|prepare|outline|question|yes\/no|need evidence|help me understand)\b/i;
const DIRECT_ACTION_PATTERN =
  /\b(do it|apply|approve|mark|set|release|refund|pay out|payout|verify|vet|assign|select|award|send|email|whatsapp|sms|text|notify|delete|remove|add admin|promote|override|bypass|clear)\b/i;
const PROTECTED_ACTION_POLICIES = [
  {
    id: "money_movement",
    label: "money movement or payment-state change",
    patterns: [
      /\b(release|refund|pay out|payout|move|transfer|capture)\b.{0,48}\b(funds?|money|payment|milestone|receiver|operator)\b/i,
      /\b(mark|set|confirm|clear)\b.{0,48}\b(payment|deposit|funds?)\b.{0,48}\b(paid|released|confirmed|refunded|reconciled)\b/i,
    ],
    founderDecision: "Founder/provider approval is required before payment state or milestone funds change.",
    safeAssist: "I can draft a payment note, reconciliation checklist, or founder yes/no prompt.",
  },
  {
    id: "identity_approval",
    label: "identity verification approval",
    patterns: [
      /\b(mark|set|approve|pass|verify|clear)\b.{0,48}\b(id|identity|kyc|verification|document|selfie|liveness)\b/i,
      /\b(id|identity|kyc|verification)\b.{0,48}\b(verified|approved|passed|cleared)\b/i,
    ],
    founderDecision: "Provider evidence or documented exception review is required before identity status changes.",
    safeAssist: "I can draft retry guidance, readiness steps, or an exception-review prompt.",
  },
  {
    id: "receiver_assignment",
    label: "receiver vetting, rejection, or assignment",
    patterns: [
      /\b(assign|select|award|give|vet|approve|reject|ban|shortlist)\b.{0,56}\b(receiver|runner|worker|operator|job seeker|concierge)\b/i,
      /\b(receiver|runner|worker|operator|job seeker|concierge)\b.{0,56}\b(assigned|vetted|rejected|selected|approved)\b/i,
    ],
    founderDecision: "Receiver decisions require verified/vetted status, route fit, proof standards, and founder/admin confirmation.",
    safeAssist: "I can compare offers, summarize provenance, or prepare a selection prompt.",
  },
  {
    id: "external_message",
    label: "external WhatsApp, email, SMS, or client/receiver message sending",
    patterns: [
      /\b(send|email|whatsapp|sms|text|notify|message)\b.{0,64}\b(client|customer|receiver|runner|worker|operator|founder|steward|family|supplier)\b/i,
      /\b(send it|send now|notify them|message them)\b/i,
    ],
    founderDecision: "External messages require a human/admin send action after reviewing the draft.",
    safeAssist: "I can draft the message and list the evidence that should be attached.",
  },
  {
    id: "provenance_change",
    label: "provenance score or trust-seal change",
    patterns: [
      /\b(change|set|raise|lower|adjust|increase|decrease|reset)\b.{0,48}\b(provenance|trust score|seal|rating|score)\b/i,
      /\b(provenance|trust score|seal)\b.{0,48}\b(100|green|approved|boost|penalty)\b/i,
    ],
    founderDecision: "Provenance changes must come from reviews, completed jobs, disputes, verification, and admin-visible evidence.",
    safeAssist: "I can explain why the seal moved or draft a review note.",
  },
  {
    id: "admin_access",
    label: "admin access or permission change",
    patterns: [
      /\b(add|remove|promote|demote|grant|revoke)\b.{0,48}\b(admin|founder|permission|role|access)\b/i,
      /\b(admin|founder)\b.{0,48}\b(access granted|role changed|permission changed)\b/i,
    ],
    founderDecision: "Admin access changes require authenticated owner action outside AI.",
    safeAssist: "I can draft the access checklist and audit note.",
  },
  {
    id: "legal_financial_customs_advice",
    label: "legal, tax, customs, title, or financial advice",
    patterns: [
      /\b(give|provide|confirm|guarantee|clear)\b.{0,48}\b(legal advice|tax advice|customs advice|title advice|financial advice)\b/i,
      /\b(clear|approve|guarantee)\b.{0,48}\b(restricted goods|customs|title|land|property transfer|remittance)\b/i,
    ],
    founderDecision: "Legal, tax, customs, title, and financial-service questions require qualified professional/provider review.",
    safeAssist: "I can prepare questions for the lawyer, accountant, customs provider, or payment provider.",
  },
  {
    id: "secret_or_credential",
    label: "secret, password, token, or API-key exposure",
    patterns: [
      /\b(show|reveal|send|paste|share|print|return)\b.{0,48}\b(api key|secret key|password|token|service role|webhook secret)\b/i,
      /\b(api key|secret key|password|token|service role|webhook secret)\b.{0,48}\b(show|reveal|send|paste|share|print|return)\b/i,
    ],
    founderDecision: "Secrets must stay in provider dashboards, Vercel, or Supabase server-side secrets, never model prompts or browser pages.",
    safeAssist: "I can explain where to rotate and store secrets without exposing values.",
  },
];

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function parseJson(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw httpError("Request body must be valid JSON.", 400);
  }
}

async function readJsonBody(req) {
  const contentLength = Number(req.headers?.["content-length"] || 0);
  if (contentLength > MAX_JSON_BODY_BYTES) {
    throw httpError("AI request is too large. Keep drafts and context under 64KB.", 413);
  }

  if (req.body && typeof req.body === "object") {
    const estimated = Buffer.byteLength(JSON.stringify(req.body), "utf8");
    if (estimated > MAX_JSON_BODY_BYTES) {
      throw httpError("AI request is too large. Keep drafts and context under 64KB.", 413);
    }
    return req.body;
  }

  if (req.body && typeof req.body === "string") {
    if (Buffer.byteLength(req.body, "utf8") > MAX_JSON_BODY_BYTES) {
      throw httpError("AI request is too large. Keep drafts and context under 64KB.", 413);
    }
    return parseJson(req.body);
  }

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      throw httpError("AI request is too large. Keep drafts and context under 64KB.", 413);
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return parseJson(raw);
}

function safeRole(value) {
  return ROLE_POLICIES[value] ? value : "client";
}

function safeText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function safeContext(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return JSON.parse(JSON.stringify(value));
}

function protectedActionReview(payload) {
  const text = [payload.task, payload.draft, payload.action, payload.intent]
    .map((value) => safeText(value, 4000))
    .filter(Boolean)
    .join("\n");
  if (!text) {
    return { required: false, direct_action: false, matches: [] };
  }

  const matches = PROTECTED_ACTION_POLICIES.filter((policy) => policy.patterns.some((pattern) => pattern.test(text))).map(
    (policy) => ({
      id: policy.id,
      label: policy.label,
      founder_decision: policy.founderDecision,
      safe_assist: policy.safeAssist,
    }),
  );
  const directAction = matches.length > 0 && DIRECT_ACTION_PATTERN.test(text) && !SAFE_ASSIST_ONLY_PATTERN.test(text);

  return {
    required: matches.length > 0,
    direct_action: directAction,
    matches,
  };
}

function protectedActionInstruction(review) {
  if (!review?.required) return "";
  return [
    "Protected action preflight:",
    ...review.matches.map(
      (match) =>
        `- ${match.label}: ${match.founder_decision} Safe assist path: ${match.safe_assist}`,
    ),
    "If the user asked you to perform the protected action, refuse to perform it and provide a founder/admin approval prompt instead.",
  ].join("\n");
}

function protectedActionOutput(role, review) {
  const decisions = review.matches.map((match) => `- ${match.label}: ${match.founder_decision}`).join("\n");
  const safePaths = review.matches.map((match) => `- ${match.safe_assist}`).join("\n");
  return [
    "Founder approval required.",
    "",
    "I cannot perform that protected action from AI.",
    "",
    "Decision gate:",
    decisions,
    "",
    "What I can do now:",
    safePaths,
    "",
    role === "admin"
      ? "Use this as a Yes / No / Need evidence admin prompt. Apply the actual change only after the provider evidence or founder/admin confirmation exists in Swadakta."
      : "Open the relevant Swadakta page and wait for provider evidence or founder/admin review before the protected state changes.",
  ].join("\n");
}

async function verifiedUser(authHeader) {
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    const error = new Error("Sign in before using Swadakta AI.");
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
    const error = new Error("Could not verify Supabase session.");
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

async function assertAdmin(authHeader, userId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(userId)}&select=user_id`,
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: authHeader,
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = new Error("Could not verify admin access.");
    error.statusCode = 403;
    throw error;
  }

  const admins = await response.json();
  if (!Array.isArray(admins) || admins.length === 0) {
    const error = new Error("Only Swadakta admins can run founder operations AI.");
    error.statusCode = 403;
    throw error;
  }
}

function systemPrompt(role) {
  return [
    "You are Swadakta Ops AI for a global corridor concierge and virtual assistant marketplace covering Africa, Australia, USA, Europe, China, and other supported routes.",
    "The product should run on deterministic workflow rails first; AI assists only with wording, triage, risk review, exception summaries, and next-step recommendations.",
    "Be concise, practical, warm, and operations-focused.",
    "Never claim Swadakta is a licensed escrow provider, bank, law firm, tax advisor, title office, or identity verification provider.",
    "For identity verification, route users to provider-based checks such as Smile ID, Sumsub, or Youverify. Manual review is only an exception for provider outage, unsupported country or document, mismatch, suspected fraud, legal uncertainty, or sensitive high-value work.",
    "For high-value funds, recommend a regulated escrow/payment provider or staged milestone controls plus founder approval.",
    "For Wise or bank-transfer payments, you may prepare payment wording and reconciliation checklists, but you must not mark funds paid unless provider-grade evidence or founder approval is already present in the app context.",
    "You may draft replies, quote follow-ups, receiver briefs, proof-review notes, risk summaries, checklists, and safe admin note suggestions.",
    "Never state or imply that you performed an external action outside this response.",
    "Protected actions always require system/provider evidence or founder/admin approval: releasing/refunding money, marking payment paid, marking ID verified, vetting/rejecting/assigning receivers, changing provenance manually, sending WhatsApp/email messages, or giving legal/tax/title/financial advice.",
    "When a protected action is needed, write 'Founder approval required' and name the exact decision.",
    "Return plain text ready for human review. Do not include JSON unless explicitly asked.",
    `Current app role: ${role}.`,
  ].join(" ");
}

function userPrompt(payload, role, user, review) {
  const task = safeText(payload.task || "draft next step", 240);
  const draft = safeText(payload.draft, 4000);
  const context = safeText(JSON.stringify(safeContext(payload.context), null, 2), 12000);
  const protectedInstruction = protectedActionInstruction(review);

  return [
    `Role policy: ${ROLE_POLICIES[role].label}.`,
    `Signed-in user: ${user.email || user.id || "unknown"}.`,
    `Task: ${task}`,
    draft ? `Existing draft:\n${draft}` : "",
    protectedInstruction,
    "Context JSON:",
    context || "{}",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function extractOutputText(data) {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  const message = Array.isArray(data?.output)
    ? data.output.find((item) => item.type === "message" && Array.isArray(item.content))
    : null;
  const textPart = message?.content?.find((item) => typeof item.text === "string");
  return textPart?.text || "";
}

async function callOpenAI(payload, role, user, review) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured in Vercel.");
    error.statusCode = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  let response;
  let data = {};

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        reasoning: { effort: "low" },
        text: { verbosity: "low" },
        input: [
          {
            role: "developer",
            content: [{ type: "input_text", text: systemPrompt(role) }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt(payload, role, user, review) }],
          },
        ],
      }),
    });
    data = await response.json().catch(() => ({}));
  } finally {
    clearTimeout(timeout);
  }

  if (!response?.ok) {
    const message = data?.error?.message || "OpenAI request failed.";
    const error = new Error(message);
    error.statusCode = response?.status || 502;
    throw error;
  }

  return {
    role,
    output: extractOutputText(data),
    response_id: data.id || null,
    model: data.model || process.env.OPENAI_MODEL || "gpt-5.5",
    guardrails: [
      "draft_only",
      "protected_action_preflight",
      "founder_approval_for_money_identity_assignment_and_messages",
      "wise_and_bank_transfer_require_verified_receipt_or_statement",
      "no_legal_tax_title_or_financial_advice",
    ],
    protected_action_review: review,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const role = safeRole(payload.role);
    const user = await verifiedUser(req.headers.authorization);
    const review = protectedActionReview(payload);

    if (ROLE_POLICIES[role].requireAdmin) {
      await assertAdmin(req.headers.authorization, user.id);
    }

    if (review.direct_action) {
      sendJson(res, 200, {
        role,
        output: protectedActionOutput(role, review),
        response_id: null,
        model: "deterministic-guardrail",
        guardrails: [
          "draft_only",
          "protected_action_preflight",
          "founder_approval_for_money_identity_assignment_and_messages",
          "wise_and_bank_transfer_require_verified_receipt_or_statement",
          "no_legal_tax_title_or_financial_advice",
        ],
        protected_action_review: review,
      });
      return;
    }

    const result = await callOpenAI(payload, role, user, review);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Could not run Swadakta AI.",
    });
  }
};
