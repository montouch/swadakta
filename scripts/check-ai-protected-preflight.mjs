import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const handler = require("../api/ai/assistant.js");
const originalFetch = global.fetch;
const openAiKeyName = ["OPENAI", "API", "KEY"].join("_");
const originalOpenAiKey = process.env[openAiKeyName];
let openAiCalls = 0;

function responseJson(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

function callAssistant(body) {
  return new Promise((resolve) => {
    const req = {
      method: "POST",
      headers: { authorization: "Bearer test-session" },
      body,
    };
    const res = {
      statusCode: 0,
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value;
      },
      end(raw) {
        resolve({
          statusCode: this.statusCode,
          body: raw ? JSON.parse(raw) : {},
        });
      },
    };

    handler(req, res);
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

global.fetch = async (url) => {
  const href = String(url);
  if (href.includes("/auth/v1/user")) {
    return responseJson({ id: "test-admin-user", email: "admin@example.com" });
  }
  if (href.includes("/rest/v1/admin_users")) {
    return responseJson([{ user_id: "test-admin-user" }]);
  }
  if (href.includes("api.openai.com")) {
    openAiCalls += 1;
    return responseJson({
      id: "resp_mock",
      model: "mock-model",
      output_text: "model guidance",
    });
  }
  throw new Error(`Unexpected fetch in AI preflight test: ${href}`);
};

try {
  process.env[openAiKeyName] = "test-key";

  const directMoney = await callAssistant({
    role: "admin",
    task: "release funds to the receiver now",
  });
  assert(directMoney.statusCode === 200, "direct protected money request should return 200 with a safe answer");
  assert(directMoney.body.model === "deterministic-guardrail", "direct protected money request should not call OpenAI");
  assert(directMoney.body.protected_action_review?.direct_action === true, "direct protected money request should be flagged");
  assert(openAiCalls === 0, "direct protected money request called OpenAI unexpectedly");

  const directIdentity = await callAssistant({
    role: "admin",
    task: "mark this user's ID verification as verified",
  });
  assert(directIdentity.body.model === "deterministic-guardrail", "direct ID approval request should not call OpenAI");
  assert(
    directIdentity.body.protected_action_review?.matches?.some((entry) => entry.id === "identity_approval"),
    "direct ID approval request should identify identity_approval",
  );
  assert(openAiCalls === 0, "direct ID approval request called OpenAI unexpectedly");

  const safeGuidance = await callAssistant({
    role: "client",
    task: "How do I verify ID before taking jobs?",
  });
  assert(safeGuidance.statusCode === 200, "safe ID guidance prompt should return 200");
  assert(safeGuidance.body.model === "mock-model", "safe ID guidance prompt should be allowed to reach the model path");
  assert(safeGuidance.body.protected_action_review?.required === true, "safe ID guidance should still carry warning context");
  assert(safeGuidance.body.protected_action_review?.direct_action === false, "safe ID guidance should not be treated as direct action");
  assert(openAiCalls === 1, "safe ID guidance should call OpenAI exactly once");

  const safeDraft = await callAssistant({
    role: "admin",
    task: "draft a WhatsApp message to the client about missing proof",
  });
  assert(safeDraft.body.model === "mock-model", "draft-only external-message prompt should be allowed to reach model path");
  assert(safeDraft.body.protected_action_review?.direct_action === false, "draft-only message prompt should not be direct action");
  assert(openAiCalls === 2, "draft-only message prompt should call OpenAI exactly once more");

  console.log("AI protected-action preflight checks passed.");
} finally {
  global.fetch = originalFetch;
  if (originalOpenAiKey === undefined) {
    delete process.env[openAiKeyName];
  } else {
    process.env[openAiKeyName] = originalOpenAiKey;
  }
}
