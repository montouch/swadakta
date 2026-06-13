import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (process.env.SWADAKTA_BASE_URL || "https://swadakta.com").replace(/\/+$/, "");
const githubRepo = process.env.SWADAKTA_GITHUB_REPO || "montouch/swadakta";
const args = new Set(process.argv.slice(2));

function git(argsList, fallback = "") {
  try {
    return execFileSync("git", argsList, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return fallback;
  }
}

function numberGit(argsList) {
  const value = Number(git(argsList, "0"));
  return Number.isFinite(value) ? value : 0;
}

async function readJson(file) {
  return JSON.parse(await readFile(path.join(root, file), "utf8"));
}

async function fetchJson(url, fallback = null) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "cache-control": "no-cache",
        "user-agent": "swadakta-deployment-state",
      },
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      json: text ? JSON.parse(text) : null,
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      json: fallback,
      error: error.message || "Fetch failed",
    };
  }
}

function shortSha(sha) {
  return String(sha || "").slice(0, 7);
}

function statusSummary(statusJson) {
  const latest = Array.isArray(statusJson?.statuses) ? statusJson.statuses[0] || null : null;
  return {
    state: statusJson?.state || "unknown",
    description: latest?.description || "",
    target_url: latest?.target_url || "",
    context: latest?.context || "",
  };
}

function isRateLimited(summary) {
  const haystack = `${summary.description} ${summary.target_url}`.toLowerCase();
  return haystack.includes("rate limited") || haystack.includes("build-rate-limit") || haystack.includes("retry in 24 hours");
}

function decideState({ ahead, behind, localReleaseId, productionReleaseId, githubStatus }) {
  if (ahead > 0 && isRateLimited(githubStatus)) return "local_hold_rate_limited";
  if (ahead > 0) return "local_ahead";
  if (isRateLimited(githubStatus)) return "deployment_rate_limited";
  if (githubStatus.state === "failure" || githubStatus.state === "error") return "deployment_failed";
  if (githubStatus.state === "pending") return "deployment_pending";
  if (behind > 0) return "local_behind_origin";
  if (localReleaseId && productionReleaseId && localReleaseId !== productionReleaseId) return "production_stale";
  if (githubStatus.state === "success" && localReleaseId === productionReleaseId) return "production_current";
  return "needs_review";
}

function recommendedAction(state) {
  return {
    local_hold_rate_limited:
      "Hold pushes. Keep working locally, batch changes, and retry one clean push after the Vercel deployment window resets.",
    local_ahead:
      "Local commits are not on GitHub yet. Run targeted local checks, then push one batch when deployment capacity is available.",
    deployment_rate_limited:
      "Vercel is rate-limiting deployments. Wait for the reset window or upgrade the Vercel plan before pushing again.",
    deployment_failed:
      "Open the Vercel deployment target URL, inspect logs, fix forward locally, and run targeted checks before the next push.",
    deployment_pending:
      "Wait for Vercel to finish, then run scripts/check-production.mjs against swadakta.com.",
    local_behind_origin:
      "Pull/rebase the latest origin/main before making more changes.",
    production_stale:
      "Production release.json is stale. Check Vercel deployment status, then redeploy or wait for the current deployment.",
    production_current:
      "Production matches local release and GitHub reports success. Run full health before demos or paid pilots.",
    needs_review:
      "Review GitHub status, production release.json, and the Vercel dashboard before acting.",
  }[state];
}

const localRelease = await readJson("release.json");
const headSha = git(["rev-parse", "HEAD"]);
const originMainSha = git(["rev-parse", "origin/main"], headSha);
const ahead = numberGit(["rev-list", "--count", "origin/main..HEAD"]);
const behind = numberGit(["rev-list", "--count", "HEAD..origin/main"]);
const statusSha = ahead > 0 ? originMainSha : headSha;
const githubStatusResponse = await fetchJson(
  `https://api.github.com/repos/${githubRepo}/commits/${encodeURIComponent(statusSha)}/status`,
);
const githubStatus = statusSummary(githubStatusResponse.json);
const productionReleaseResponse = await fetchJson(`${baseUrl}/release.json?deployment_state=${Date.now()}`);
const productionRelease = productionReleaseResponse.json || {};
const state = decideState({
  ahead,
  behind,
  localReleaseId: localRelease.release_id,
  productionReleaseId: productionRelease.release_id,
  githubStatus,
});

const report = {
  state,
  recommended_action: recommendedAction(state),
  local: {
    head: headSha,
    head_short: shortSha(headSha),
    origin_main: originMainSha,
    origin_main_short: shortSha(originMainSha),
    ahead,
    behind,
    release_id: localRelease.release_id,
  },
  github: {
    repo: githubRepo,
    checked_sha: statusSha,
    checked_sha_short: shortSha(statusSha),
    status: githubStatus,
    status_api_ok: githubStatusResponse.ok,
    status_api_error: githubStatusResponse.error,
  },
  production: {
    base_url: baseUrl,
    release_id: productionRelease.release_id || "",
    release_name: productionRelease.release_name || "",
    release_api_ok: productionReleaseResponse.ok,
    release_api_status: productionReleaseResponse.status,
    release_api_error: productionReleaseResponse.error,
  },
};

if (args.has("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Swadakta deployment state: ${report.state}`);
  console.log(`Action: ${report.recommended_action}`);
  console.log(`Local HEAD: ${report.local.head_short} (${ahead} ahead, ${behind} behind origin/main)`);
  console.log(`Local release: ${report.local.release_id}`);
  console.log(`Checked GitHub SHA: ${report.github.checked_sha_short}`);
  console.log(`GitHub/Vercel: ${report.github.status.state} - ${report.github.status.description || "No description"}`);
  console.log(`Production release: ${report.production.release_id || "unavailable"}`);
  if (report.github.status.target_url) console.log(`Vercel target: ${report.github.status.target_url}`);
}

if (args.has("--strict") && report.state !== "production_current") {
  process.exitCode = 1;
}
