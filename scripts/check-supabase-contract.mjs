import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function readMigrations() {
  const dir = path.join(root, "supabase", "migrations");
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => `\n-- ${file}\n${fs.readFileSync(path.join(dir, file), "utf8")}`)
    .join("\n");
}

function assertIncludes(text, marker, label) {
  assert.ok(text.includes(marker), `${label} must include: ${marker}`);
}

function assertRegex(text, pattern, label) {
  assert.ok(pattern.test(text), `${label} is missing expected SQL pattern ${pattern}`);
}

const schema = read("supabase/schema.sql");
const migrations = readMigrations();
const sql = `${schema}\n${migrations}`;
const appData = read("app-data.js");
const runtimeBoundary = [
  appData,
  read("admin-ops.js"),
  read("api/identity/start-verification.js"),
  read("api/ops/readiness.js"),
].join("\n");

const requiredTables = [
  "admin_users",
  "account_profiles",
  "service_requests",
  "partner_applications",
  "field_updates",
  "fund_milestones",
  "identity_verification_requests",
  "resolution_cases",
  "job_offers",
  "account_notifications",
];

for (const table of requiredTables) {
  assertRegex(sql, new RegExp(`create table if not exists public\\.${table}\\b`, "i"), `${table} table`);
  assertIncludes(sql, `alter table public.${table} enable row level security;`, `${table} RLS`);
}

const requiredPolicies = [
  "Admins can read own admin profile",
  "Authenticated users can read permitted account profiles",
  "Users can create own account profile",
  "Users can update own account profile",
  "Verified accounts can submit service requests",
  "Admins can read service requests",
  "Admins can update service requests",
  "Anyone can apply as partner",
  "Admins can read partner applications",
  "Admins can update partner applications",
  "Admins can read field updates",
  "Admins can read fund milestones",
  "Admins can create fund milestones",
  "Admins can update fund milestones",
  "Users and admins can read identity verification requests",
  "Users can create own identity verification requests",
  "Admins can update identity verification requests",
  "Authenticated can read visible resolution cases",
  "Admins can update resolution cases",
  "Authenticated can read visible job offers",
  "Admins can update job offers",
  "Users can read own account notifications",
];

for (const policy of requiredPolicies) {
  assertIncludes(sql, `create policy "${policy}"`, `policy ${policy}`);
}

for (const marker of [
  'drop policy if exists "Admins can read job offers"',
  'drop policy if exists "Receivers can read own job offers"',
  'drop policy if exists "Clients can read offers on own requests"',
  'create policy "Authenticated can read visible job offers"',
  'drop policy if exists "Admins can read resolution cases"',
  'drop policy if exists "Users can read own resolution cases"',
  'create policy "Authenticated can read visible resolution cases"',
]) {
  assertIncludes(migrations, marker, "consolidated visible-row policy migration");
}

for (const marker of [
  "insert into storage.buckets",
  "'swadakta-proof'",
  "false",
  "6291456",
  "'image/jpeg'",
  "'image/png'",
  "'image/webp'",
  "'video/mp4'",
  "'application/pdf'",
  "'audio/webm'",
  "'audio/mpeg'",
  "Swadakta proof uploaders can read own files",
  "Swadakta proof uploaders can insert own files",
  "Swadakta proof uploaders can delete own files",
  "(storage.foldername(name))[1] = (select auth.uid())::text",
]) {
  assertIncludes(sql, marker, "proof storage contract");
}

const requiredPublicRpcs = [
  "save_account_profile",
  "get_my_account_profile",
  "track_service_request",
  "list_my_service_requests",
  "submit_service_review",
  "update_account_identity_verification",
  "list_my_partner_applications",
  "list_my_assigned_jobs",
  "submit_assigned_job_update",
  "request_account_identity_verification",
  "list_my_identity_verification_requests",
  "list_identity_verification_requests",
  "update_identity_verification_request",
  "create_resolution_case",
  "list_request_resolution_cases",
  "list_resolution_cases",
  "update_resolution_case",
  "list_marketplace_jobs",
  "submit_job_offer",
  "list_my_job_offers",
  "list_job_offers_for_admin",
  "update_job_offer_status",
  "list_tracking_job_offers",
  "list_my_notifications",
  "mark_my_notification",
  "create_account_notification",
];

for (const rpc of requiredPublicRpcs) {
  assertRegex(sql, new RegExp(`create or replace function public\\.${rpc}\\b`, "i"), `public RPC ${rpc}`);
  assertRegex(sql, new RegExp(`grant execute on function public\\.${rpc}[\\s\\S]*? to (?:anon, authenticated|authenticated);`, "i"), `public RPC grant ${rpc}`);
  assertIncludes(appData, `supabase.rpc("${rpc}"`, `app-data RPC call ${rpc}`);
}

for (const marker of [
  "app_private.is_admin()",
  "security definer",
  "revoke all on function public.save_account_profile",
  "revoke all on function public.get_my_account_profile",
]) {
  assertIncludes(sql, marker, "protected backend boundary");
}

for (const marker of [
  "AI and users cannot mark ID verified",
  "Receiver assignment is blocked unless the receiver is vetted and ID-verified",
  "Work start remains locked until",
]) {
  assertIncludes(runtimeBoundary, marker, "runtime backend boundary");
}

console.log("Supabase contract checks passed.");
