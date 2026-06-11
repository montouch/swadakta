import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (process.env.SWADAKTA_BASE_URL || "https://swadakta.com").replace(/\/+$/, "");
const cacheBust = Date.now();
const localBaseHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const htmlFiles = [
  "admin-ops.html",
  "admin-readiness.html",
  "admin-verification.html",
  "assistant.html",
  "auth.html",
  "brief.html",
  "portal.html",
  "tracking.html",
  "verification.html",
];

const requiredPages = ["/", "/portal", "/auth", "/brief", "/tracking", "/verification", "/admin-ops"];
const requiredAppDataMarkers = [
  "assertPaidPostingAllowed",
  "get_my_account_profile",
  "createMpesaStkPush",
];
const requiredPortalMarkers = [
  "setSignedInShell",
  "rememberAccountHome",
  "Account is open. Verification is only required before paid posting",
  "receiverApplicationPayload",
  "renderReceiverApplications",
];
const requiredVerificationMarkers = [
  "providerActionCopy",
  "Automation boundary",
  "release money, assign paid work",
];
const requiredAdminOpsMarkers = [
  "requestFlags",
  "Protected decisions are not delegated to AI",
  "Local static mode cannot call the Vercel readiness API",
];
const requiredRobotsMarkers = [
  "Disallow: /admin",
  "Disallow: /admin-ops",
  "Disallow: /admin-readiness",
  "Disallow: /admin-verification",
  "Disallow: /auth",
];
const requiredEnvExampleKeys = [
  "PUBLIC_BASE_URL",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PAYPAL_ENVIRONMENT",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "MPESA_ENVIRONMENT",
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_SHORTCODE",
  "MPESA_PASSKEY",
  "MPESA_CALLBACK_TOKEN",
  "WISE_PAYMENT_LINK_URL",
  "WISE_PAYMENT_REQUEST_URL",
  "WISE_RECEIVE_DETAILS_URL",
  "SMILE_ID_API_KEY",
  "SMILE_ID_PARTNER_ID",
];

async function readLocal(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function findAppDataVersions(files) {
  const versions = new Map();

  for (const [file, content] of files) {
    const matches = [...content.matchAll(/app-data\.js\?v=(\d+)/g)].map((match) => match[1]);
    if (matches.length) versions.set(file, matches);
  }

  return versions;
}

function findStitchPortalVersions(files) {
  const versions = new Map();

  for (const [file, content] of files) {
    const matches = [...content.matchAll(/stitch-portal\.js\?v=(\d+)/g)].map((match) => match[1]);
    if (matches.length) versions.set(file, matches);
  }

  return versions;
}

async function fetchText(urlPath) {
  const separator = urlPath.includes("?") ? "&" : "?";
  const response = await fetch(`${baseUrl}${urlPath}${separator}health=${cacheBust}`, {
    headers: {
      "cache-control": "no-cache",
      "user-agent": "swadakta-production-health",
    },
    redirect: "manual",
  });

  const text = await response.text();
  return { response, text };
}

async function fetchPage(urlPath) {
  const result = await fetchText(urlPath);
  if (result.response.status !== 404 || urlPath === "/" || urlPath.endsWith(".html")) {
    return { ...result, urlPath };
  }

  const fallback = await fetchText(`${urlPath}.html`);
  return { ...fallback, urlPath: `${urlPath}.html`, originalStatus: result.response.status };
}

async function fetchRedirectChain(urlPath, maxHops = 4) {
  const chain = [];
  let current = urlPath;

  for (let hop = 0; hop < maxHops; hop += 1) {
    const { response } = await fetchText(current);
    const location = response.headers.get("location") || "";
    chain.push({ urlPath: current, status: response.status, location });

    if (![301, 302, 303, 307, 308].includes(response.status) || !location) {
      return chain;
    }

    const next = new URL(location, baseUrl);
    current = `${next.pathname}${next.search}${next.hash}`;
  }

  return chain;
}

function isLocalBaseUrl() {
  try {
    return localBaseHosts.has(new URL(baseUrl).hostname);
  } catch {
    return false;
  }
}

function fail(failures, message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function pass(message) {
  console.log(`OK   ${message}`);
}

const failures = [];
const localHtml = await Promise.all(htmlFiles.map(async (file) => [file, await readLocal(file)]));
const versions = findAppDataVersions(localHtml);
const uniqueVersions = [...new Set([...versions.values()].flat())];
const stitchPortalVersions = findStitchPortalVersions(localHtml);
const uniqueStitchPortalVersions = [...new Set([...stitchPortalVersions.values()].flat())];

if (uniqueVersions.length !== 1) {
  fail(failures, `Expected one app-data version across pages, found: ${uniqueVersions.join(", ") || "none"}`);
} else {
  pass(`Local pages use app-data.js?v=${uniqueVersions[0]}`);
}

const expectedVersion = uniqueVersions[0];
const expectedStitchPortalVersion = uniqueStitchPortalVersions[0];
const localAppData = await readLocal("app-data.js");
for (const marker of requiredAppDataMarkers) {
  if (!localAppData.includes(marker)) {
    fail(failures, `Local app-data.js is missing marker ${marker}`);
  }
}

if (uniqueStitchPortalVersions.length !== 1) {
  fail(
    failures,
    `Expected one stitch-portal version across pages, found: ${uniqueStitchPortalVersions.join(", ") || "none"}`,
  );
} else {
  pass(`Local pages use stitch-portal.js?v=${expectedStitchPortalVersion}`);
}

const localStitchPortal = await readLocal("stitch-portal.js");
for (const marker of requiredPortalMarkers) {
  if (!localStitchPortal.includes(marker)) {
    fail(failures, `Local stitch-portal.js is missing marker ${marker}`);
  }
}

const localVerification = await readLocal("verification.js");
const localVerificationHtml = await readLocal("verification.html");
for (const marker of requiredVerificationMarkers) {
  if (!localVerification.includes(marker) && !localVerificationHtml.includes(marker)) {
    fail(failures, `Local verification flow is missing marker ${marker}`);
  }
}

const localAdminOps = await readLocal("admin-ops.js");
for (const marker of requiredAdminOpsMarkers) {
  if (!localAdminOps.includes(marker)) {
    fail(failures, `Local admin-ops.js is missing marker ${marker}`);
  }
}

const envExample = await readLocal(".env.example");
for (const key of requiredEnvExampleKeys) {
  if (!new RegExp(`^${key}=`, "m").test(envExample)) {
    fail(failures, `.env.example is missing ${key}`);
  }
}

const robots = await readLocal("robots.txt");
for (const marker of requiredRobotsMarkers) {
  if (!robots.includes(marker)) {
    fail(failures, `Local robots.txt is missing marker ${marker}`);
  }
}

for (const page of requiredPages) {
  const { response, text, urlPath } = await fetchPage(page);
  if (response.status !== 200) {
    fail(failures, `${page} returned ${response.status}`);
    continue;
  }

  pass(`${urlPath} returned 200`);
  if (page !== "/" && page !== "/auth" && expectedVersion && !text.includes(`app-data.js?v=${expectedVersion}`)) {
    fail(failures, `${page} does not reference app-data.js?v=${expectedVersion}`);
  }
  if (page === "/portal" && expectedStitchPortalVersion && !text.includes(`stitch-portal.js?v=${expectedStitchPortalVersion}`)) {
    fail(failures, `${page} does not reference stitch-portal.js?v=${expectedStitchPortalVersion}`);
  }
  if (page === "/portal" && !text.includes("receiver-application-form")) {
    fail(failures, `${page} does not include receiver application form`);
  }
  if (page === "/admin-ops" && !text.includes("admin-ops.js?v=1")) {
    fail(failures, `${page} does not reference admin-ops.js?v=1`);
  }
  if (page === "/verification" && !text.includes("verification.js?v=4")) {
    fail(failures, `${page} does not reference verification.js?v=4`);
  }
}

const { response: robotsResponse, text: robotsText } = await fetchText("/robots.txt");
if (robotsResponse.status !== 200) {
  fail(failures, `robots.txt returned ${robotsResponse.status}`);
} else {
  pass("robots.txt returned 200");
}

for (const marker of requiredRobotsMarkers) {
  if (!robotsText.includes(marker)) {
    fail(failures, `Production robots.txt is missing marker ${marker}`);
  } else {
    pass(`Production robots.txt contains ${marker}`);
  }
}

if (isLocalBaseUrl()) {
  pass("Skipping hosted /admin redirect check for local static server");
} else {
  for (const adminEntry of ["/admin", "/admin.html"]) {
    const chain = await fetchRedirectChain(adminEntry);
    const final = chain[chain.length - 1] || {};
    const reachedAdminOps =
      chain.some((entry) => entry.location.startsWith("/admin-ops")) ||
      String(final.urlPath || "").startsWith("/admin-ops");

    if (!reachedAdminOps || final.status !== 200) {
      const summary = chain
        .map((entry) => `${entry.urlPath} -> ${entry.status}${entry.location ? ` ${entry.location}` : ""}`)
        .join(" | ");
      fail(failures, `${adminEntry} should end at /admin-ops, got ${summary}`);
    } else {
      pass(`${adminEntry} reaches ${final.urlPath}`);
    }
  }
}

if (expectedVersion) {
  const { response, text } = await fetchText(`/app-data.js?v=${expectedVersion}`);
  if (response.status !== 200) {
    fail(failures, `app-data.js?v=${expectedVersion} returned ${response.status}`);
  } else {
    pass(`app-data.js?v=${expectedVersion} returned 200`);
  }

  for (const marker of requiredAppDataMarkers) {
    if (!text.includes(marker)) {
      fail(failures, `Production app-data.js?v=${expectedVersion} is missing marker ${marker}`);
    } else {
      pass(`Production app-data.js contains ${marker}`);
    }
  }
}

if (expectedStitchPortalVersion) {
  const { response, text } = await fetchText(`/stitch-portal.js?v=${expectedStitchPortalVersion}`);
  if (response.status !== 200) {
    fail(failures, `stitch-portal.js?v=${expectedStitchPortalVersion} returned ${response.status}`);
  } else {
    pass(`stitch-portal.js?v=${expectedStitchPortalVersion} returned 200`);
  }

  for (const marker of requiredPortalMarkers) {
    if (!text.includes(marker)) {
      fail(failures, `Production stitch-portal.js?v=${expectedStitchPortalVersion} is missing marker ${marker}`);
    } else {
      pass(`Production stitch-portal.js contains ${marker}`);
    }
  }
}

const { response: adminOpsResponse, text: adminOpsText } = await fetchText("/admin-ops.js?v=1");
if (adminOpsResponse.status !== 200) {
  fail(failures, `admin-ops.js?v=1 returned ${adminOpsResponse.status}`);
} else {
  pass("admin-ops.js?v=1 returned 200");
}

for (const marker of requiredAdminOpsMarkers) {
  if (!adminOpsText.includes(marker)) {
    fail(failures, `Production admin-ops.js is missing marker ${marker}`);
  } else {
    pass(`Production admin-ops.js contains ${marker}`);
  }
}

if (failures.length) {
  console.error(`\nHealth check failed for ${baseUrl}`);
  process.exitCode = 1;
} else {
  console.log(`\nHealth check passed for ${baseUrl}`);
}
