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

function assertOrdered(text, first, second, label) {
  const firstIndex = text.indexOf(first);
  const secondIndex = text.indexOf(second);
  assert.ok(firstIndex !== -1, `${label} is missing ${first}`);
  assert.ok(secondIndex !== -1, `${label} is missing ${second}`);
  assert.ok(firstIndex < secondIndex, `${label} must check ${first} before ${second}`);
}

const schema = read("supabase/schema.sql");
const migrations = migrationText();
const sql = `${schema}\n${migrations}`;
const appData = read("app-data.js");
const messages = read("messages.js");
const messagesHtml = read("messages.html");
const portalHtml = read("portal.html");

for (const marker of [
  "'swadakta-proof'",
  "false",
  "6291456",
  "'image/jpeg'",
  "'image/png'",
  "'image/webp'",
  "'image/heic'",
  "'image/heif'",
  "'video/mp4'",
  "'video/quicktime'",
  "'application/pdf'",
  "'audio/webm'",
  "'audio/mpeg'",
  "'audio/mp4'",
  "'audio/wav'",
  "'audio/x-wav'",
  "'audio/aac'",
  "'audio/ogg'",
  'create policy "Swadakta proof uploaders can read own files"',
  'create policy "Swadakta proof uploaders can insert own files"',
  'create policy "Swadakta proof uploaders can delete own files"',
  "(storage.foldername(name))[1] = (select auth.uid())::text",
  "app_private.is_admin()",
]) {
  assertIncludes(sql, marker, "proof storage SQL");
}

for (const marker of [
  "const EVIDENCE_MIME_TYPES = new Set",
  "const EVIDENCE_EXTENSION_TYPES = new Map",
  "const BLOCKED_STORAGE_EXTENSIONS = new Set",
  "const EVIDENCE_FILE_TYPE_COPY",
  "function validateEvidenceFile",
  "normalizedEvidenceContentType",
  '"audio"',
  '"svg"',
  '"exe"',
  '"js"',
  "allowAudio: true",
  "allowAudio: false",
  "contentType: evidence.contentType",
  "content_type: evidence.contentType",
  "validateEvidenceFile,",
]) {
  assertIncludes(appData, marker, "app-data proof media guard");
}

const proofUploadStart = appData.indexOf("async function uploadProofFiles");
const proofUploadEnd = appData.indexOf("async function uploadAccountMedia");
const proofUpload = appData.slice(proofUploadStart, proofUploadEnd);
assertOrdered(
  proofUpload,
  "validateEvidenceFile(file",
  "supabase.storage.from(PROOF_BUCKET).upload",
  "proof file upload",
);

const accountUploadStart = appData.indexOf("async function uploadAccountMedia");
const accountUploadEnd = appData.indexOf("async function getAccountProfile");
const accountUpload = appData.slice(accountUploadStart, accountUploadEnd);
assertOrdered(
  accountUpload,
  "validateEvidenceFile(file",
  "supabase.storage.from(PROOF_BUCKET).upload",
  "account media upload",
);

for (const marker of [
  "validateUploadableFiles",
  "window.SwadaktaData.validateEvidenceFile",
  "Supported: photos, PDFs, short video, and audio proof up to 6MB.",
  "mediaInput.value = \"\"",
]) {
  assertIncludes(messages, marker, "messages proof media guard");
}

const messageAcceptMatch = messagesHtml.match(/id="message-media"[^>]*accept="([^"]+)"/);
assert.ok(messageAcceptMatch, "messages.html must declare the message-media accept list");
const messageAccept = messageAcceptMatch[1];
for (const marker of ["audio/webm", "audio/mp4", "audio/ogg", "application/pdf", ".pdf", ".webm"]) {
  assertIncludes(messageAccept, marker, "message-media accept list");
}
assert.ok(!messageAccept.includes(".doc"), "message-media accept list must not advertise Word document uploads");
assertIncludes(messagesHtml, "messages.js?v=6", "messages cache bust");

for (const marker of [
  'id="receiver-profile-photo" type="file" accept="image/*"',
  'id="receiver-profile-proof-sample" type="file" accept="image/*,video/*,application/pdf"',
]) {
  assertIncludes(portalHtml, marker, "portal account media inputs");
}

console.log("Proof media guard checks passed.");
