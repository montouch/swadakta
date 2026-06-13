import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const baseUrl = (process.env.SWADAKTA_E2E_BASE_URL || process.env.SWADAKTA_BASE_URL || "https://swadakta.com").replace(/\/+$/, "");
const email = process.env.SWADAKTA_E2E_ADMIN_EMAIL || process.env.SWADAKTA_E2E_EMAIL;
const password = process.env.SWADAKTA_E2E_ADMIN_PASSWORD || process.env.SWADAKTA_E2E_PASSWORD;
const bundledNodeModules =
  process.env.SWADAKTA_NODE_MODULES ||
  "C:/Users/brown/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function playwrightPackageJson() {
  const direct = path.join(bundledNodeModules, "playwright", "package.json");
  if (fs.existsSync(direct) && fs.existsSync(path.join(bundledNodeModules, "playwright-core"))) return direct;
  const pnpmDir = path.join(bundledNodeModules, ".pnpm");
  const match = fs
    .readdirSync(pnpmDir)
    .find((name) => name.startsWith("playwright@") && fs.existsSync(path.join(pnpmDir, name, "node_modules", "playwright", "package.json")));
  assert.ok(match, "Could not locate bundled Playwright package");
  return path.join(pnpmDir, match, "node_modules", "playwright", "package.json");
}

function scrubUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}${url.hash || ""}`;
  } catch {
    return String(value || "");
  }
}

if (!email || !password) {
  console.error(
    "Set SWADAKTA_E2E_ADMIN_EMAIL and SWADAKTA_E2E_ADMIN_PASSWORD, or SWADAKTA_E2E_EMAIL and SWADAKTA_E2E_PASSWORD, to run the production admin-flow check.",
  );
  process.exit(1);
}

const requireFromPlaywright = createRequire(playwrightPackageJson());
const { chromium } = requireFromPlaywright("playwright");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

try {
  await page.goto(`${baseUrl}/admin-ops.html`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill("#admin-email", email);
  await page.fill("#admin-password", password);
  await page.click('#admin-login-form button[type="submit"]');
  await page.waitForFunction(
    async () => {
      try {
        const result = await window.SwadaktaData?.getSession?.();
        return Boolean(result?.session?.access_token);
      } catch {
        return false;
      }
    },
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(1200);

  const result = await page.evaluate(async () => {
    const session = await window.SwadaktaData.getSession();
    const response = await fetch("/api/ops/readiness", {
      headers: { authorization: `Bearer ${session.session.access_token}` },
    });
    const report = await response.json().catch(() => ({}));

    return {
      href: location.href,
      sessionEmail: session.session.user.email,
      readinessStatus: response.status,
      readinessOk: response.ok,
      authPanelHidden: document.querySelector("#admin-auth-panel")?.hidden ?? false,
      opsMode: document.querySelector("#ops-mode")?.textContent?.trim() || "",
      hasLaunchGroups: Array.isArray(report.groups) || Array.isArray(report.sections),
    };
  });

  assert.ok(/\/admin-ops(?:\.html)?/.test(result.href), `Expected admin ops URL, got ${scrubUrl(result.href)}`);
  assert.ok(result.sessionEmail, "No signed-in Supabase session was available after admin sign-in.");
  assert.equal(result.authPanelHidden, true, "Admin auth panel remained visible after sign-in.");
  assert.equal(result.readinessOk, true, `Admin readiness API returned ${result.readinessStatus}.`);

  console.log(
    JSON.stringify({
      ok: true,
      baseUrl,
      adminEmail: result.sessionEmail,
      adminDestination: scrubUrl(result.href),
      adminReadinessStatus: result.readinessStatus,
      opsMode: result.opsMode,
      consoleErrorCount: consoleErrors.length,
    }),
  );
} finally {
  await browser.close();
}
