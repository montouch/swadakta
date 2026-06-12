import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const maxFileBytes = 1_500_000;

const directDetectors = [
  {
    id: "openai_api_key",
    label: "OpenAI API key",
    pattern: /\b(?:sk-(?:proj|svcacct)-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,})\b/g,
  },
  {
    id: "stripe_secret_key",
    label: "Stripe secret or restricted key",
    pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
  },
  {
    id: "stripe_webhook_secret",
    label: "Stripe webhook signing secret",
    pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/g,
  },
  {
    id: "paystack_secret_key",
    label: "Paystack secret key",
    pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
  },
  {
    id: "flutterwave_secret_key",
    label: "Flutterwave secret key",
    pattern: /\bFLWSECK-[A-Za-z0-9-]{20,}\b/g,
  },
  {
    id: "github_token",
    label: "GitHub token",
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{20,}_[A-Za-z0-9_]{40,})\b/g,
  },
  {
    id: "google_api_key",
    label: "Google API key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    id: "jwt_like_secret",
    label: "JWT-like service credential",
    pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    id: "private_key",
    label: "Private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
];

const assignmentDetector =
  /\b([A-Z][A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSKEY|PRIVATE_KEY|WEBHOOK_SECRET|SERVICE_ROLE_KEY)[A-Z0-9_]*)[ \t]*[:=][ \t]*["']?([^"'\s,;`<>#]+)["']?/g;

function trackedAndUnignoredFiles() {
  const output = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "buffer",
  });
  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((file) => !file.startsWith(".git/") && !file.includes("/node_modules/"));
}

function lineNumberFor(text, index) {
  let line = 1;
  for (let offset = 0; offset < index; offset += 1) {
    if (text.charCodeAt(offset) === 10) line += 1;
  }
  return line;
}

function looksPlaceholder(value = "") {
  const normalized = value.trim().replace(/[.)\]}]+$/g, "").toLowerCase();
  if (!normalized) return true;
  if (/^(true|false|null|undefined|0|1|yes|no|on|off)$/.test(normalized)) return true;
  if (normalized.includes("your_") || normalized.includes("example") || normalized.includes("placeholder")) return true;
  if (normalized.includes("replace") || normalized.includes("todo") || normalized.includes("changeme")) return true;
  if (normalized.startsWith("process.env.")) return true;
  if (/^[A-Z0-9_]+$/.test(value) && value.length < 32) return true;
  return false;
}

function redacted(value = "") {
  if (value.length <= 12) return "[redacted]";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function scanFile(file) {
  const absolute = path.join(root, file);
  const stats = statSync(absolute);
  if (!stats.isFile() || stats.size > maxFileBytes) return [];

  const buffer = readFileSync(absolute);
  if (buffer.includes(0)) return [];
  const text = buffer.toString("utf8");
  const findings = [];

  for (const detector of directDetectors) {
    detector.pattern.lastIndex = 0;
    for (const match of text.matchAll(detector.pattern)) {
      const lineText = text.slice(text.lastIndexOf("\n", match.index) + 1, text.indexOf("\n", match.index) === -1 ? text.length : text.indexOf("\n", match.index));
      if (/swadakta-secret-scan:\s*allow/i.test(lineText)) continue;
      findings.push({
        file,
        line: lineNumberFor(text, match.index),
        id: detector.id,
        label: detector.label,
        value: redacted(match[0]),
      });
    }
  }

  assignmentDetector.lastIndex = 0;
  for (const match of text.matchAll(assignmentDetector)) {
    const name = match[1] || "";
    const value = match[2] || "";
    const lineText = text.slice(text.lastIndexOf("\n", match.index) + 1, text.indexOf("\n", match.index) === -1 ? text.length : text.indexOf("\n", match.index));
    if (/swadakta-secret-scan:\s*allow/i.test(lineText) || looksPlaceholder(value)) continue;
    findings.push({
      file,
      line: lineNumberFor(text, match.index),
      id: "sensitive_assignment",
      label: `${name} has a committed value`,
      value: redacted(value),
    });
  }

  return findings;
}

const findings = trackedAndUnignoredFiles().flatMap(scanFile);

if (findings.length) {
  console.error("Swadakta secret scan failed. Remove committed credentials and rotate any exposed keys.");
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} ${finding.id} ${finding.label} (${finding.value})`);
  }
  process.exit(1);
}

console.log("Swadakta secret scan passed: no high-confidence committed secrets found.");
