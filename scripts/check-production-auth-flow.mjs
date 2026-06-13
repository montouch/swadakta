import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const baseUrl = (process.env.SWADAKTA_E2E_BASE_URL || process.env.SWADAKTA_BASE_URL || "https://swadakta.com").replace(/\/+$/, "");
const email = process.env.SWADAKTA_E2E_EMAIL;
const password = process.env.SWADAKTA_E2E_PASSWORD;
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

function redactEmail(value = "") {
  const [name = "", domain = ""] = String(value || "").split("@");
  if (!name || !domain) return "";
  const visible = name.length <= 2 ? `${name[0] || ""}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${visible}@${domain}`;
}

if (!email || !password) {
  console.error("Set SWADAKTA_E2E_EMAIL and SWADAKTA_E2E_PASSWORD to run the production auth-flow check.");
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
  await page.goto(`${baseUrl}/login?next=/portal.html%23home`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await Promise.all([
    page.waitForURL(/\/portal(?:\.html)?(?:[#?]|$)/, { timeout: 30000 }),
    page.click("#login-submit"),
  ]);
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForFunction(
    async () => {
      try {
        const result = await window.SwadaktaData?.getSession?.();
        return Boolean(result?.session?.user?.email);
      } catch {
        return false;
      }
    },
    null,
    { timeout: 15000 },
  );

  const homeResult = await page.evaluate(async () => {
    const session = await window.SwadaktaData.getSession();
    const profileResult = await window.SwadaktaData.getAccountProfile();
    const identityRequestsResult = await window.SwadaktaData.listMyIdentityVerificationRequests();

    return {
      href: location.href,
      sessionEmail: session?.session?.user?.email || "",
      hasLoginForm: Boolean(document.querySelector("#swadakta-login-form")),
      profileMode: profileResult?.mode || "",
      profileShape: profileResult?.data === null ? "null" : typeof profileResult?.data,
      profileWarning: profileResult?.warning || "",
      identityMode: identityRequestsResult?.mode || "",
      identityWarning: identityRequestsResult?.warning || "",
      identityRequestCount: Array.isArray(identityRequestsResult?.data) ? identityRequestsResult.data.length : -1,
      hasAccountHomeText:
        document.body.innerText.includes("Account is open") ||
        document.body.innerText.includes("Verified gate") ||
        document.body.innerText.includes("Give jobs") ||
        document.body.innerText.includes("Find jobs"),
    };
  });

  assert.ok(/\/portal(?:\.html)?/.test(homeResult.href), `Expected portal URL after sign-in, got ${scrubUrl(homeResult.href)}`);
  assert.ok(homeResult.sessionEmail, "No signed-in Supabase session was available after sign-in.");
  assert.equal(homeResult.hasLoginForm, false, "Login form was still visible after sign-in.");
  assert.equal(homeResult.profileMode, "supabase", "Account profile check did not use Supabase mode.");
  assert.ok(["object", "null"].includes(homeResult.profileShape), "Account profile RPC did not return object/null.");
  assert.equal(homeResult.profileWarning, "", `Account profile returned a warning: ${homeResult.profileWarning}`);
  assert.equal(homeResult.identityMode, "supabase", "Identity verification check did not use Supabase mode.");
  assert.equal(homeResult.identityWarning, "", `Identity verification RPC returned a warning: ${homeResult.identityWarning}`);
  assert.ok(homeResult.identityRequestCount >= 0, "Identity verification request RPC did not return an array.");
  assert.ok(homeResult.hasAccountHomeText, "Portal loaded but account-home text was not detected.");

  await page.goto(`${baseUrl}/verification.html?next=/portal.html%23home`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);

  const verificationResult = await page.evaluate(() => ({
    href: location.href,
    hasLoginForm: Boolean(document.querySelector("#swadakta-login-form")),
    hasVerificationText: /verification|verify|identity|provider/i.test(document.body.innerText),
  }));

  assert.equal(verificationResult.hasLoginForm, false, `Verification bounced back to login: ${scrubUrl(verificationResult.href)}`);
  assert.ok(verificationResult.hasVerificationText, "Verification page loaded but verification content was not detected.");

  console.log(
    JSON.stringify({
      ok: true,
      baseUrl,
      signedInDestination: scrubUrl(homeResult.href),
      verificationDestination: scrubUrl(verificationResult.href),
      signedInAccount: redactEmail(homeResult.sessionEmail),
      identityRequestCount: homeResult.identityRequestCount,
      consoleErrorCount: consoleErrors.length,
    }),
  );
} finally {
  await browser.close();
}
