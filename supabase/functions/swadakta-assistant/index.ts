import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type AssistPayload = {
  role?: "admin" | "client" | "receiver";
  task?: string;
  context?: Record<string, unknown>;
  draft?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function safeRole(value: unknown): AssistPayload["role"] {
  return value === "admin" || value === "client" || value === "receiver" ? value : "client";
}

function systemPrompt(role: AssistPayload["role"]) {
  return [
    "You are Swadakta Ops AI for a diaspora-to-Kenya concierge business.",
    "The app should run through deterministic workflow rules first; you assist only where language, triage, risk review, and exception handling need judgment.",
    "Be practical, concise, warm, and operations-focused.",
    "Never claim Swadakta is a licensed escrow provider.",
    "For high-value funds, recommend a regulated escrow or payment provider and founder approval.",
    "You may draft replies, summarize missing information, classify risk, prepare checklists, suggest safe admin field values, and write internal notes.",
    "Never state or imply that you performed an external action outside this response.",
    "Protected actions always require a human founder/admin: releasing or refunding money, marking payment as paid, marking ID verified, vetting/rejecting/assigning a receiver, sending WhatsApp/email messages, or giving legal/tax/title/financial advice.",
    "If a protected action is needed, clearly say 'Founder approval required' and give the exact decision needed.",
    "Drafts must be ready for a human founder/admin, client, or receiver to review before sending or applying.",
    `Current user role: ${role}.`,
  ].join(" ");
}

function userPrompt(payload: AssistPayload) {
  return [
    `Task: ${payload.task || "draft next step"}`,
    payload.draft ? `Existing draft:\n${payload.draft}` : "",
    "Context JSON:",
    JSON.stringify(payload.context || {}, null, 2),
  ]
    .filter(Boolean)
    .join("\n\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
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

  let payload: AssistPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const role = safeRole(payload.role);

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
          { role: "system", content: systemPrompt(role) },
          { role: "user", content: userPrompt(payload) },
        ],
      }),
    });
    data = await response.json();
  } catch (error) {
    return jsonResponse(
      {
        error: "AI request could not be completed.",
        detail: error instanceof Error ? error.message : "Unknown error.",
      },
      502,
    );
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
    output: data.output_text || "",
    response_id: data.id || null,
  });
});
