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

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (req.body && typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
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
    "You are Swadakta Ops AI for a diaspora-to-Kenya concierge and virtual assistant business.",
    "The product should run on deterministic workflow rails first; AI assists only with wording, triage, risk review, exception summaries, and next-step recommendations.",
    "Be concise, practical, warm, and operations-focused.",
    "Never claim Swadakta is a licensed escrow provider, bank, law firm, tax advisor, title office, or identity verification provider.",
    "For high-value funds, recommend a regulated escrow/payment provider or staged milestone controls plus founder approval.",
    "For Wise or bank-transfer payments, you may prepare payment wording and reconciliation checklists, but you must not mark funds paid unless provider-grade evidence or founder approval is already present in the app context.",
    "You may draft replies, quote follow-ups, receiver briefs, proof-review notes, risk summaries, checklists, and safe admin note suggestions.",
    "Never state or imply that you performed an external action outside this response.",
    "Protected actions always require founder/admin approval: releasing/refunding money, marking payment paid, marking ID verified, vetting/rejecting/assigning receivers, changing provenance manually, sending WhatsApp/email messages, or giving legal/tax/title/financial advice.",
    "When a protected action is needed, write 'Founder approval required' and name the exact decision.",
    "Return plain text ready for human review. Do not include JSON unless explicitly asked.",
    `Current app role: ${role}.`,
  ].join(" ");
}

function userPrompt(payload, role, user) {
  const task = safeText(payload.task || "draft next step", 240);
  const draft = safeText(payload.draft, 4000);
  const context = safeText(JSON.stringify(safeContext(payload.context), null, 2), 12000);

  return [
    `Role policy: ${ROLE_POLICIES[role].label}.`,
    `Signed-in user: ${user.email || user.id || "unknown"}.`,
    `Task: ${task}`,
    draft ? `Existing draft:\n${draft}` : "",
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

async function callOpenAI(payload, role, user) {
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
            content: [{ type: "input_text", text: userPrompt(payload, role, user) }],
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
      "founder_approval_for_money_identity_assignment_and_messages",
      "wise_and_bank_transfer_require_verified_receipt_or_statement",
      "no_legal_tax_title_or_financial_advice",
    ],
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
    const payload = await readJsonBody(req);
    const role = safeRole(payload.role);
    const user = await verifiedUser(req.headers.authorization);

    if (ROLE_POLICIES[role].requireAdmin) {
      await assertAdmin(req.headers.authorization, user.id);
    }

    const result = await callOpenAI(payload, role, user);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "Could not run Swadakta AI.",
    });
  }
};
