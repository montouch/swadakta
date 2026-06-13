import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const cliBaseUrl = process.argv.find((arg, index) => index > 1 && /^https?:\/\//i.test(arg));
const baseUrl = (process.env.SWADAKTA_VISUAL_BASE_URL || cliBaseUrl || "http://127.0.0.1:4173").replace(/\/+$/, "");
const bundledNodeModules =
  process.env.SWADAKTA_NODE_MODULES ||
  "C:/Users/brown/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const pages = [
  "/",
  "/about.html",
  "/auth.html",
  "/login.html",
  "/portal.html#home",
  "/portal.html#give-work",
  "/portal.html#find-work",
  "/portal.html#profile",
  "/portal.html#money",
  "/brief.html",
  "/corridor.html",
  "/tracking.html",
  "/messages.html",
  "/notifications.html",
  "/assistant.html",
  "/verification.html",
  "/trust.html",
  "/payments.html",
  "/resolution.html",
  "/rules.html",
  "/privacy.html",
  "/terms.html",
  "/admin-ops.html",
  "/admin-verification.html",
  "/admin-readiness.html",
];
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

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

const requireFromPlaywright = createRequire(playwrightPackageJson());
const { chromium } = requireFromPlaywright("playwright");
const browser = await chromium.launch({ headless: true });
const failures = [];

function label(page, viewport) {
  return `${viewport.name} ${page}`;
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    for (const route of pages) {
      const target = `${baseUrl}${route}`;
      try {
        const response = await page.goto(target, { waitUntil: "networkidle", timeout: 25000 });
        if (!response) {
          const targetUrl = new URL(target);
          const currentUrl = new URL(page.url());
          if (currentUrl.origin !== targetUrl.origin || currentUrl.pathname !== targetUrl.pathname) {
            failures.push(`${label(route, viewport)} returned no response`);
            continue;
          }
        } else if (response.status() >= 400) {
          failures.push(`${label(route, viewport)} returned ${response.status()}`);
          continue;
        }

        const result = await page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth;
          const docOverflow = Math.max(
            0,
            document.documentElement.scrollWidth - viewportWidth,
            document.body.scrollWidth - viewportWidth,
          );
          const visible = (el) => {
            const style = getComputedStyle(el);
            const box = el.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
          };
          const text = (el) => (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ");
          const isMaterialIcon = (el) => el.classList?.contains("material-symbols-outlined");
          const isDecorative = (el) => {
            const style = getComputedStyle(el);
            return !text(el) && (style.position === "absolute" || el.getAttribute("aria-hidden") === "true");
          };
          const overflowElements = Array.from(document.querySelectorAll("body *"))
            .filter(visible)
            .map((el) => {
              if (isMaterialIcon(el) || isDecorative(el)) return null;
              const box = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              const textOverflow = Math.max(0, el.scrollWidth - Math.ceil(el.clientWidth || box.width));
              const rightOverflow = Math.max(0, box.right - viewportWidth);
              const leftOverflow = Math.max(0, -box.left);
              const hasMeaningfulText = text(el).length > 12;
              const clippedText =
                hasMeaningfulText &&
                textOverflow > 4 &&
                !["BODY", "HTML", "MAIN", "SECTION", "HEADER", "FOOTER"].includes(el.tagName) &&
                style.overflowX !== "visible";
              const offCanvas = text(el) && (rightOverflow > 2 || leftOverflow > 2) && box.width < viewportWidth * 1.5;
              if (!clippedText && !offCanvas) return null;
              return {
                tag: el.tagName.toLowerCase(),
                className: String(el.className || "").slice(0, 120),
                text: text(el).slice(0, 120),
                textOverflow,
                rightOverflow,
                leftOverflow,
                width: Math.round(box.width),
              };
            })
            .filter(Boolean)
            .slice(0, 12);

          const unlabeledIconControls = Array.from(document.querySelectorAll("button, a"))
            .filter(visible)
            .filter((el) => {
              const label =
                el.getAttribute("aria-label") ||
                el.getAttribute("title") ||
                text(el).replace(/(check|close|menu|arrow_forward|auto_awesome|forum|home|search|settings)/gi, "").trim();
              const box = el.getBoundingClientRect();
              const hasIcon = !!el.querySelector(".material-symbols-outlined, svg, img");
              return hasIcon && !label && box.width <= 64 && box.height <= 64;
            })
            .map((el) => ({
              tag: el.tagName.toLowerCase(),
              href: el.getAttribute("href"),
              className: String(el.className || "").slice(0, 120),
            }))
            .slice(0, 12);

          const clickTargetsTooSmall = Array.from(document.querySelectorAll("button, a, input, select, textarea"))
            .filter(visible)
            .map((el) => {
              if (["checkbox", "radio", "file"].includes(el.getAttribute("type") || "")) return null;
              if (el.classList?.contains("sr-only")) return null;
              const box = el.getBoundingClientRect();
              const controlText = text(el) || el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("placeholder") || "";
              const isInlineTextLink =
                el.tagName === "A" &&
                controlText &&
                !el.className.includes("inline-flex") &&
                !el.className.includes("rounded") &&
                box.width >= 24 &&
                box.height >= 16;
              if (!isInlineTextLink && (box.width < 34 || box.height < 34)) {
                return {
                  tag: el.tagName.toLowerCase(),
                  text: controlText.slice(0, 80),
                  className: String(el.className || "").slice(0, 120),
                  width: Math.round(box.width),
                  height: Math.round(box.height),
                };
              }
              return null;
            })
            .filter(Boolean)
            .slice(0, 12);

          return { docOverflow, overflowElements, unlabeledIconControls, clickTargetsTooSmall };
        });

        if (result.docOverflow > 2) failures.push(`${label(route, viewport)} has page horizontal overflow ${result.docOverflow}px`);
        if (result.overflowElements.length) {
          failures.push(`${label(route, viewport)} has overflowing elements: ${JSON.stringify(result.overflowElements, null, 2)}`);
        }
        if (result.unlabeledIconControls.length) {
          failures.push(`${label(route, viewport)} has unlabeled icon controls: ${JSON.stringify(result.unlabeledIconControls, null, 2)}`);
        }
        if (result.clickTargetsTooSmall.length) {
          failures.push(`${label(route, viewport)} has very small click targets: ${JSON.stringify(result.clickTargetsTooSmall, null, 2)}`);
        }
      } catch (error) {
        failures.push(`${label(route, viewport)} failed visual check: ${error.message}`);
      }
    }

    const relevantConsoleErrors = consoleErrors.filter(
      (message) =>
        !message.includes("favicon") &&
        !message.includes("Failed to load resource: the server responded with a status of 404") &&
        !message.includes("net::ERR_BLOCKED_BY_CLIENT"),
    );
    if (relevantConsoleErrors.length) {
      failures.push(`${viewport.name} console errors: ${JSON.stringify(relevantConsoleErrors.slice(0, 8), null, 2)}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n\n"));
  process.exitCode = 1;
} else {
  console.log("Visual fit checks passed.");
}
