import assert from "node:assert/strict";
import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

function headerMap(entry) {
  return new Map((entry?.headers || []).map((header) => [String(header.key || "").toLowerCase(), String(header.value || "")]));
}

function requireHeader(headers, key) {
  const value = headers.get(key.toLowerCase());
  assert.ok(value, `${key} header is required`);
  return value;
}

function findHeaderEntry(source) {
  return (config.headers || []).find((entry) => entry.source === source);
}

function assertIncludes(value, expected, label) {
  assert.ok(value.includes(expected), `${label} must include ${expected}`);
}

assert.equal(config.cleanUrls, true, "cleanUrls should stay enabled for canonical paths");

assert.ok(
  (config.redirects || []).some(
    (redirect) =>
      redirect.source === "/(.*)" &&
      redirect.destination === "https://swadakta.com/$1" &&
      redirect.permanent === true &&
      (redirect.has || []).some((condition) => condition.type === "host" && condition.value === "www.swadakta.com"),
  ),
  "www.swadakta.com must permanently redirect to the apex domain",
);

assert.ok(
  (config.rewrites || []).some(
    (rewrite) => rewrite.source === "/api/identity/sumsub-webhook" && rewrite.destination === "/api/identity/start-verification",
  ),
  "Sumsub webhook rewrite must stay folded into the existing identity function",
);

const globalHeaders = headerMap(findHeaderEntry("/(.*)"));
assert.equal(requireHeader(globalHeaders, "X-Content-Type-Options"), "nosniff");
assert.equal(requireHeader(globalHeaders, "X-Frame-Options"), "DENY");
assert.equal(requireHeader(globalHeaders, "Referrer-Policy"), "strict-origin-when-cross-origin");

const hsts = requireHeader(globalHeaders, "Strict-Transport-Security");
const maxAge = Number((hsts.match(/max-age=(\d+)/i) || [])[1] || 0);
assert.ok(maxAge >= 31536000, "Strict-Transport-Security max-age must be at least one year");
assertIncludes(hsts, "includeSubDomains", "Strict-Transport-Security");

const permissions = requireHeader(globalHeaders, "Permissions-Policy");
for (const directive of ["camera=(self)", "microphone=(self)", "geolocation=()", "payment=()", "usb=()"]) {
  assertIncludes(permissions, directive, "Permissions-Policy");
}

const csp = requireHeader(globalHeaders, "Content-Security-Policy");
for (const directive of [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "https://cdn.tailwindcss.com",
  "connect-src 'self'",
  "https://srwkoulknropnwwyqslj.supabase.co",
  "wss://srwkoulknropnwwyqslj.supabase.co",
  "https://geocoding-api.open-meteo.com",
  "https://api.open-meteo.com",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "upgrade-insecure-requests",
]) {
  assertIncludes(csp, directive, "Content-Security-Policy");
}

for (const source of [
  "/admin(.*)",
  "/admin-verification(.*)",
  "/admin-readiness(.*)",
  "/auth(.*)",
  "/login(.*)",
  "/portal(.*)",
  "/brief(.*)",
  "/tracking(.*)",
  "/verification(.*)",
  "/assistant(.*)",
  "/messages(.*)",
  "/notifications(.*)",
  "/resolution(.*)",
]) {
  const headers = headerMap(findHeaderEntry(source));
  assert.equal(requireHeader(headers, "Cache-Control"), "no-store", `${source} must be no-store`);
  assert.equal(requireHeader(headers, "X-Robots-Tag"), "noindex, nofollow", `${source} must stay noindex`);
}

for (const source of ["/", "/index.html", "/release.json", "/:file.js", "/:file.css"]) {
  const headers = headerMap(findHeaderEntry(source));
  assert.equal(requireHeader(headers, "Cache-Control"), "no-store", `${source} must be no-store`);
}

console.log("Vercel security header checks passed.");
