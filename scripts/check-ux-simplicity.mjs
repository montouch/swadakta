import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const portal = readFileSync(path.join(root, "portal.html"), "utf8");
const brief = readFileSync(path.join(root, "brief.html"), "utf8");
const stitchPortal = readFileSync(path.join(root, "stitch-portal.js"), "utf8");
const failures = [];

function fail(message) {
  failures.push(message);
}

function assertIncludes(source, marker, label) {
  try {
    assert.ok(source.includes(marker), `${label} is missing ${marker}`);
  } catch (error) {
    fail(error.message);
  }
}

function visibleText(html = "") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sliceBetween(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) {
    fail(`${label} is missing start marker ${startMarker}`);
    return "";
  }
  const end = source.indexOf(endMarker, start);
  if (end < 0) {
    fail(`${label} is missing end marker ${endMarker}`);
    return source.slice(start);
  }
  return source.slice(start, end);
}

function checkParagraphBudget({ label, html, maxChars, allowed = [] }) {
  const paragraphs = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => visibleText(match[1]))
    .filter(Boolean)
    .filter((text) => !allowed.some((marker) => text.includes(marker)));

  const overBudget = paragraphs.filter((text) => text.length > maxChars);
  if (overBudget.length) {
    fail(
      `${label} has paragraph copy over ${maxChars} characters: ${overBudget
        .map((text) => `"${text.slice(0, 140)}${text.length > 140 ? "..." : ""}" (${text.length})`)
        .join("; ")}`,
    );
  }
}

assertIncludes(portal, "account-visual-status-grid", "portal account home");
assertIncludes(portal, "account-mini-visual-card", "portal account home");
assertIncludes(portal, "Post, apply, track proof, and message from one account.", "portal account home");
assertIncludes(portal, "Brief + media", "portal main actions");
assertIncludes(portal, "Browse + offer", "portal main actions");
assertIncludes(portal, "Proof timeline", "portal main actions");
assertIncludes(portal, "grid-template-columns: repeat(3, minmax(0, 1fr))", "portal main action grid");

assertIncludes(brief, "<div class=\"brief-flow-step\"><strong><span>1</span> Need</strong></div>", "brief flow");
assertIncludes(brief, "<div class=\"brief-flow-step\"><strong><span>2</span> Route</strong></div>", "brief flow");
assertIncludes(brief, "<div class=\"brief-flow-step\"><strong><span>3</span> Proof + quote</strong></div>", "brief flow");
assertIncludes(brief, "brief-workflow-card", "brief workflow lanes");
assertIncludes(brief, "Local / in-country", "brief workflow lanes");
assertIncludes(brief, "International corridor", "brief workflow lanes");
assertIncludes(brief, "Virtual / remote", "brief workflow lanes");
const briefStepCount = (brief.match(/class="brief-flow-step"/g) || []).length;
if (briefStepCount !== 3) fail(`brief flow should stay at 3 visible steps; found ${briefStepCount}`);

assertIncludes(stitchPortal, "Add name, mobile, country, and base.", "dynamic account copy");
assertIncludes(stitchPortal, "Describe it once. Swadakta shapes the quote.", "dynamic account copy");
assertIncludes(stitchPortal, "Give jobs and take jobs here.", "dynamic account copy");

checkParagraphBudget({
  label: "account home hero",
  html: sliceBetween(portal, '<section class="account-dashboard-hero"', '<section class="account-action-grid"', "account home hero"),
  maxChars: 130,
});
checkParagraphBudget({
  label: "find jobs summary",
  html: sliceBetween(portal, '<section class="glass-panel rounded-[1.5rem] p-5 md:p-6" id="find-work"', '<details class="portal-details', "find jobs summary"),
  maxChars: 150,
});
checkParagraphBudget({
  label: "brief header",
  html: sliceBetween(brief, "<!-- Header Section -->", '<section class="glass-panel rounded-3xl p-6 md:p-8 mb-8" id="brief-verification-gate"', "brief header"),
  maxChars: 145,
});
checkParagraphBudget({
  label: "brief visual flow",
  html: sliceBetween(brief, '<form class="brief-simple-form', '<!-- Section 5: Submission -->', "brief visual flow"),
  maxChars: 190,
  allowed: ["Swadakta does not hold client money"],
});

if (failures.length) {
  console.error(`UX simplicity guard failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("UX simplicity guard passed: home, brief, and find jobs remain visual-first and low-copy.");
}
