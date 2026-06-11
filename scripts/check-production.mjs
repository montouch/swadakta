import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (process.env.SWADAKTA_BASE_URL || "https://swadakta.com").replace(/\/+$/, "");
const cacheBust = Date.now();

const htmlFiles = [
  "admin-readiness.html",
  "admin-verification.html",
  "assistant.html",
  "auth.html",
  "brief.html",
  "portal.html",
  "tracking.html",
  "verification.html",
];

const requiredPages = ["/", "/portal", "/auth", "/brief", "/tracking", "/verification"];
const requiredAppDataMarkers = [
  "assertPaidPostingAllowed",
  "get_my_account_profile",
  "createMpesaStkPush",
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

if (uniqueVersions.length !== 1) {
  fail(failures, `Expected one app-data version across pages, found: ${uniqueVersions.join(", ") || "none"}`);
} else {
  pass(`Local pages use app-data.js?v=${uniqueVersions[0]}`);
}

const expectedVersion = uniqueVersions[0];
const localAppData = await readLocal("app-data.js");
for (const marker of requiredAppDataMarkers) {
  if (!localAppData.includes(marker)) {
    fail(failures, `Local app-data.js is missing marker ${marker}`);
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

if (failures.length) {
  console.error(`\nHealth check failed for ${baseUrl}`);
  process.exitCode = 1;
} else {
  console.log(`\nHealth check passed for ${baseUrl}`);
}
