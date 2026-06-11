import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Role = "admin" | "client" | "receiver";

type AssistPayload = {
  role?: Role;
  task?: string;
  context?: Record<string, unknown>;
  draft?: string;
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
    "You are Swadakta Ops AI for a diaspora-to-Kenya concierge and virtual assistant business.",
    "The product should run on deterministic workflow rails first; AI assists only with wording, triage, risk review, exception summaries, and next-step recommendations.",
    "Be concise, practical, warm, and operations-focused.",
    "Never claim Swadakta is a licensed escrow provider, bank, law firm, tax advisor, title office, or identity verification provider.",
    "For high-value funds, recommend a regulated escrow/payment provider or staged milestone controls plus founder approval.",
    "You may draft replies, quote follow-ups, receiver briefs, proof-review notes, risk summaries, checklists, and safe admin note suggestions.",
    "Never state or imply that you performed an external action outside this response.",
    "Protected actions always require founder/admin approval: releasing/refunding money, marking payment paid, marking ID verified, vetting/rejecting/assigning receivers, changing provenance manually, sending WhatsApp/email messages, or giving legal/tax/title/financial advice.",
    "When a protected action is needed, write 'Founder approval required' and name the exact decision.",
    "Return plain text ready for human review. Do not include JSON unless explicitly asked.",
    `Current app role: ${role}.`,
  ].join(" ");
}

function userPrompt(payload: AssistPayload, role: Role, user: SupabaseUser) {
  const task = safeText(payload.task || "draft next step", 240);
  const draft = safeText(payload.draft, 4000);
  const context = safeText(JSON.stringify(safeContext(payload.context), null, 2), 12000);

  return [
    `Role policy: ${rolePolicies[role].label}.`,
    `Signed-in user: ${user.email || user.id || "unknown"}.`,
    `Task: ${task}`,
    draft ? `Existing draft:\n${draft}` : "",
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

  let payload: AssistPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const role = safeRole(payload.role);
  const authHeader = req.headers.get("authorization");

  try {
    const user = await verifiedUser(authHeader);

    if (rolePolicies[role].requireAdmin) {
      await assertAdmin(authHeader || "", user.id || "");
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
            inputMessage("user", userPrompt(payload, role, user)),
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
        "founder_approval_for_money_identity_assignment_and_messages",
        "no_legal_tax_title_or_financial_advice",
      ],
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
