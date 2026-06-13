import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registerPath = "FOUNDER_EVIDENCE_REGISTER.md";

const ownerFlagPattern = /\bSWADAKTA_OWNER_[A-Z0-9_]+\b/g;
const expansionFlagPattern = /\b(?:PAYSTACK|FLUTTERWAVE)_(?:MERCHANT_APPROVED|WEBHOOK_ENDPOINT_READY|PROVIDER_EVIDENCE_MAPPED)\b/g;

const requiredSections = [
  "## Evidence Rules",
  "## Owner Launch Flags",
  "## Africa Expansion Payment Flags",
  "## Reference Directory",
  "## Review Rhythm",
];

const requiredUrls = [
  "https://business.gov.au/registrations",
  "https://www.abr.gov.au/business-super-funds-charities/applying-abn",
  "https://www.asic.gov.au/for-business-and-companies/business-names/register-a-business-name/",
  "https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst",
  "https://www.austrac.gov.au/enrol-and-register-remittance",
  "https://www.asic.gov.au/for-finance-professionals/afs-licensees/do-you-need-an-afs-licence/",
  "https://business.gov.au/risk-management/insurance/types-of-business-insurance",
  "https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought",
  "https://www.fairwork.gov.au/find-help-for/independent-contractors",
  "https://business.gov.au/people/contractors/employee-or-contractor",
  "https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business",
  "https://brs.go.ke/",
  "https://www.kra.go.ke/business/companies-partnerships/companies-partnerships-pin-taxes/companies-partnerships-pin-registration",
  "https://www.odpc.go.ke/",
  "https://developer.safaricom.co.ke/",
  "https://docs.stripe.com/payment-links",
  "https://docs.stripe.com/webhooks/signature",
  "https://developer.paypal.com/api/rest/webhooks/",
  "https://docs.sumsub.com/reference/generate-websdk-external-link",
  "https://docs.wise.com/guides",
  "https://paystack.com/docs/payments/webhooks/",
  "https://paystack.com/docs/payments/verify-payments/",
  "https://developer.flutterwave.com/docs/webhooks",
  "https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection",
];

async function readProjectFile(file) {
  return readFile(path.join(root, file), "utf8");
}

function uniqueMatches(text, pattern) {
  return [...new Set(text.match(pattern) || [])].sort();
}

function missingFromRegister(flags, register) {
  return flags.filter((flag) => !register.includes(`\`${flag}\``));
}

function fail(message, details = []) {
  console.error(`Founder evidence register check failed: ${message}`);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(1);
}

const [envExample, readiness, register] = await Promise.all([
  readProjectFile(".env.example"),
  readProjectFile("api/ops/readiness.js"),
  readProjectFile(registerPath),
]);

const ownerFlags = uniqueMatches(`${envExample}\n${readiness}`, ownerFlagPattern);
const expansionFlags = uniqueMatches(`${envExample}\n${readiness}`, expansionFlagPattern);

const missingSections = requiredSections.filter((section) => !register.includes(section));
if (missingSections.length) fail("missing required sections", missingSections);

const missingOwnerFlags = missingFromRegister(ownerFlags, register);
if (missingOwnerFlags.length) fail("missing owner launch flags", missingOwnerFlags);

const missingExpansionFlags = missingFromRegister(expansionFlags, register);
if (missingExpansionFlags.length) fail("missing Africa expansion payment flags", missingExpansionFlags);

const missingUrls = requiredUrls.filter((url) => !register.includes(url));
if (missingUrls.length) fail("missing official/provider references", missingUrls);

const requiredPhrases = [
  "Provider dashboards and signed provider webhooks are the authority",
  "AI, users, screenshots",
  "Do not set true if",
  "High-value property",
  "A Vercel flag is only a mirror of the evidence",
  "Revoke or rotate it before paid launch",
];

const missingPhrases = requiredPhrases.filter((phrase) => !register.includes(phrase));
if (missingPhrases.length) fail("missing required control language", missingPhrases);

console.log(
  `Founder evidence register check passed: ${ownerFlags.length} owner flags and ${expansionFlags.length} expansion flags covered.`,
);
