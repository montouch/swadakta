import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Role = "admin" | "client" | "receiver";

type AssistPayload = {
  role?: Role;
  task?: string;
  context?: Record<string, unknown>;
  draft?: string;
  action?: string;
  intent?: string;
};

type SupabaseUser = {
  id?: string;
  email?: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabasePublishableKey =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

const rolePolicies: Record<Role, { requireAdmin: boolean; label: string }> = {
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const maxJsonBodyBytes = 64 * 1024;
const safeAssistOnlyPattern =
  /\b(draft|write|summari[sz]e|summary|explain|how|what|why|where|when|guide|steps|instructions|checklist|template|reply|message draft|review|risk|recommend|suggest|prepare|outline|question|yes\/no|need evidence|help me understand)\b/i;
const directActionPattern =
  /\b(do it|apply|approve|mark|set|release|refund|pay out|payout|verify|vet|assign|select|award|send|email|whatsapp|sms|text|notify|delete|remove|add admin|promote|override|bypass|clear)\b/i;
const protectedActionPolicies = [
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
] as const;

class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Connection": "keep-alive",
    },
  });
}

function safeRole(value: unknown): Role {
  return value === "admin" || value === "client" || value === "receiver" ? value : "client";
}

function safeText(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}

function safeContext(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

async function readJsonBody(req: Request): Promise<AssistPayload> {
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > maxJsonBodyBytes) {
    throw new HttpError("AI request is too large. Keep drafts and context under 64KB.", 413);
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > maxJsonBodyBytes) {
    throw new HttpError("AI request is too large. Keep drafts and context under 64KB.", 413);
  }

  try {
    return raw ? (JSON.parse(raw) as AssistPayload) : {};
  } catch {
    throw new HttpError("Invalid JSON body.", 400);
  }
}

function protectedActionReview(payload: AssistPayload) {
  const text = [payload.task, payload.draft, payload.action, payload.intent]
    .map((value) => safeText(value, 4000))
    .filter(Boolean)
    .join("\n");
  if (!text) {
    return { required: false, direct_action: false, matches: [] };
  }

  const matches = protectedActionPolicies
    .filter((policy) => policy.patterns.some((pattern) => pattern.test(text)))
    .map((policy) => ({
      id: policy.id,
      label: policy.label,
      founder_decision: policy.founderDecision,
      safe_assist: policy.safeAssist,
    }));
  const directAction = matches.length > 0 && directActionPattern.test(text) && !safeAssistOnlyPattern.test(text);

  return {
    required: matches.length > 0,
    direct_action: directAction,
    matches,
  };
}

type ProtectedActionReview = ReturnType<typeof protectedActionReview>;

function protectedActionInstruction(review: ProtectedActionReview) {
  if (!review.required) return "";
  return [
    "Protected action preflight:",
    ...review.matches.map((match) => {
      return `- ${match.label}: ${match.founder_decision} Safe assist path: ${match.safe_assist}`;
    }),
    "If the user asked you to perform the protected action, refuse to perform it and provide a founder/admin approval prompt instead.",
  ].join("\n");
}

function protectedActionOutput(role: Role, review: ProtectedActionReview) {
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

async function verifiedUser(authHeader: string | null) {
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new HttpError("Sign in before using Swadakta AI.", 401);
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new HttpError("Supabase auth environment is not configured.", 503);
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      "apikey": supabasePublishableKey,
      "authorization": authHeader,
    },
  });

  if (!response.ok) {
    throw new HttpError("Could not verify Supabase session.", 401);
  }

  const user = (await response.json()) as SupabaseUser;
  if (!user?.id) {
    throw new HttpError("Supabase session did not include a user id.", 401);
  }

  return user;
}

async function assertAdmin(authHeader: string, userId: string) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(userId)}&select=user_id`,
    {
      headers: {
        "apikey": supabasePublishableKey,
        "authorization": authHeader,
        "accept": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new HttpError("Could not verify admin access.", 403);
  }

  const admins = (await response.json()) as unknown;
  if (!Array.isArray(admins) || admins.length === 0) {
    throw new HttpError("Only Swadakta admins can run founder operations AI.", 403);
  }
}

function systemPrompt(role: Role) {
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

function userPrompt(payload: AssistPayload, role: Role, user: SupabaseUser, review: ProtectedActionReview) {
  const task = safeText(payload.task || "draft next step", 240);
  const draft = safeText(payload.draft, 4000);
  const context = safeText(JSON.stringify(safeContext(payload.context), null, 2), 12000);
  const protectedInstruction = protectedActionInstruction(review);

  return [
    `Role policy: ${rolePolicies[role].label}.`,
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

function inputMessage(role: "developer" | "user", text: string) {
  return {
    role,
    content: [{ type: "input_text", text }],
  };
}

function extractOutputText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const output = Array.isArray(data.output) ? data.output : [];
  const message = output.find((item) => {
    return Boolean(
      item &&
        typeof item === "object" &&
        "type" in item &&
        (item as { type?: unknown }).type === "message" &&
        "content" in item &&
        Array.isArray((item as { content?: unknown }).content),
    );
  }) as { content?: Array<{ text?: unknown }> } | undefined;

  const textPart = message?.content?.find((item) => typeof item.text === "string");
  return typeof textPart?.text === "string" ? textPart.text : "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const payload = await readJsonBody(req);
    const role = safeRole(payload.role);
    const authHeader = req.headers.get("authorization");
    const user = await verifiedUser(authHeader);
    const review = protectedActionReview(payload);

    if (rolePolicies[role].requireAdmin) {
      await assertAdmin(authHeader || "", user.id || "");
    }

    if (review.direct_action) {
      return jsonResponse({
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
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        {
          error: "OPENAI_API_KEY is not configured.",
          fallback: "Use the hardwired Swadakta assistant drafts until the server-side key is added.",
        },
        503,
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    let response: Response | null = null;
    let data: Record<string, unknown> = {};

    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: Deno.env.get("OPENAI_MODEL") || "gpt-5.5",
          reasoning: { effort: "low" },
          text: { verbosity: "low" },
          input: [
            inputMessage("developer", systemPrompt(role)),
            inputMessage("user", userPrompt(payload, role, user, review)),
          ],
        }),
      });
      data = await response.json().catch(() => ({}));
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response || !response.ok) {
      return jsonResponse(
        {
          error: "OpenAI request failed.",
          status: response?.status || 502,
          detail:
            typeof data.error === "object" && data.error && "message" in data.error
              ? String((data.error as { message?: unknown }).message || "No detail returned.")
              : "No detail returned.",
        },
        502,
      );
    }

    return jsonResponse({
      role,
      output: extractOutputText(data),
      response_id: data.id || null,
      model: data.model || Deno.env.get("OPENAI_MODEL") || "gpt-5.5",
      guardrails: [
        "draft_only",
        "protected_action_preflight",
        "founder_approval_for_money_identity_assignment_and_messages",
        "wise_and_bank_transfer_require_verified_receipt_or_statement",
        "no_legal_tax_title_or_financial_advice",
      ],
      protected_action_review: review,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ error: error.message }, error.statusCode);
    }

    return jsonResponse(
      {
        error: "AI request could not be completed.",
        detail: error instanceof Error ? error.message : "Unknown error.",
      },
      502,
    );
  }
});
