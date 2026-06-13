import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function migrationText() {
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
const migrations = migrationText();
const sql = `${schema}\n${migrations}`;
const appData = read("app-data.js");

assertIncludes(sql, "alter table public.account_profiles enable row level security;", "account_profiles RLS");
assertIncludes(sql, 'create policy "Authenticated users can read permitted account profiles"', "account_profiles read policy");
assertRegex(
  sql,
  /create policy "Authenticated users can read permitted account profiles"[\s\S]*?for select[\s\S]*?to authenticated[\s\S]*?user_id = \(select auth\.uid\(\)\)[\s\S]*?app_private\.is_admin\(\)/,
  "account_profiles read policy",
);

assertIncludes(sql, 'create policy "Users can create own account profile"', "account_profiles insert policy");
assertRegex(
  sql,
  /create policy "Users can create own account profile"[\s\S]*?for insert[\s\S]*?to authenticated[\s\S]*?with check[\s\S]*?user_id = \(select auth\.uid\(\)\)[\s\S]*?app_private\.current_auth_email\(\)/,
  "account_profiles insert policy",
);

assertIncludes(sql, 'create policy "Users can update own account profile"', "account_profiles update policy");
assertRegex(
  sql,
  /create policy "Users can update own account profile"[\s\S]*?for update[\s\S]*?to authenticated[\s\S]*?using \(user_id = \(select auth\.uid\(\)\)\)[\s\S]*?with check[\s\S]*?user_id = \(select auth\.uid\(\)\)[\s\S]*?app_private\.current_auth_email\(\)/,
  "account_profiles update policy",
);

assertIncludes(sql, "revoke all privileges on table public.account_profiles from anon;", "account_profiles anon lock");
assertIncludes(
  sql,
  "revoke insert, update, delete, truncate, references, trigger on table public.account_profiles from authenticated;",
  "account_profiles authenticated table lock",
);
assertIncludes(sql, "grant select on public.account_profiles to authenticated;", "account_profiles select grant");
assertRegex(
  sql,
  /grant insert \([\s\S]*?user_id[\s\S]*?email[\s\S]*?account_role[\s\S]*?identity_verification_provider[\s\S]*?on public\.account_profiles to authenticated;/,
  "account_profiles insert column grant",
);
assertRegex(
  sql,
  /grant update \([\s\S]*?email[\s\S]*?account_role[\s\S]*?identity_verification_provider[\s\S]*?on public\.account_profiles to authenticated;/,
  "account_profiles update column grant",
);

assert.ok(
  !/grant\s+(?:select,\s*)?insert(?:,\s*update)?\s+on\s+public\.account_profiles\s+to\s+authenticated/i.test(sql),
  "account_profiles must not grant broad table-level insert/update to authenticated",
);
assert.ok(
  !/grant\s+.*\s+on\s+public\.account_profiles\s+to\s+anon/i.test(sql),
  "account_profiles must not grant anon table privileges",
);

for (const marker of [
  "create or replace function app_private.save_account_profile(",
  "security definer",
  "grant execute on function app_private.save_account_profile(text, text, text, text, text, text, text, text, text) to authenticated;",
  "create or replace function public.save_account_profile(",
  "grant execute on function public.save_account_profile(text, text, text, text, text, text, text, text, text) to authenticated;",
  "create or replace function app_private.get_my_account_profile()",
  "grant execute on function app_private.get_my_account_profile() to authenticated;",
  "create or replace function public.get_my_account_profile()",
  "grant execute on function public.get_my_account_profile() to authenticated;",
]) {
  assertIncludes(sql, marker, "account profile RPC coverage");
}

const readRpcIndex = appData.indexOf('supabase.rpc("get_my_account_profile")');
const directSelectIndex = appData.indexOf('.from("account_profiles")');
assert.ok(readRpcIndex !== -1, "app-data.js must call get_my_account_profile");
assert.ok(directSelectIndex !== -1, "app-data.js must keep a direct table fallback for old deployments");
assert.ok(readRpcIndex < directSelectIndex, "get_my_account_profile RPC should be attempted before direct account_profiles select");

for (const marker of [
  "missingFunction(profileRpc.error)",
  "permissionDenied(profileRpc.error)",
  "minimalAccountProfile(",
  "paid posting and paid work stay locked",
  'supabase.rpc("save_account_profile"',
  ".upsert(toAccountProfileDatabasePayload(profile), { onConflict: \"user_id\" })",
  "accountProfileStorageError(error)",
]) {
  assertIncludes(appData, marker, "account profile client fallback");
}

console.log("Account profile access checks passed.");
