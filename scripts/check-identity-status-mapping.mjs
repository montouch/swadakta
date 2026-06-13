import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const identityRoute = require("../api/identity/start-verification.js");

const {
  accountProfileStatusFromIdentityRequestStatus,
  monotonicSumsubDecision,
  sumsubReviewDecision,
} = identityRoute._internal;

assert.equal(accountProfileStatusFromIdentityRequestStatus("verified"), "verified");
assert.equal(accountProfileStatusFromIdentityRequestStatus("failed"), "failed");
assert.equal(accountProfileStatusFromIdentityRequestStatus("expired"), "expired");
assert.equal(accountProfileStatusFromIdentityRequestStatus("manual_review"), "manual_review");
assert.equal(accountProfileStatusFromIdentityRequestStatus("link_sent"), "link_sent");
assert.equal(accountProfileStatusFromIdentityRequestStatus("submitted"), "submitted");
assert.equal(accountProfileStatusFromIdentityRequestStatus("requested"), "submitted");
assert.equal(accountProfileStatusFromIdentityRequestStatus("cancelled"), "not_started");
assert.equal(accountProfileStatusFromIdentityRequestStatus("unexpected_provider_state"), "manual_review");

const cancelledPreserved = monotonicSumsubDecision(
  { status: "cancelled" },
  { status: "submitted", terminal: false },
);
assert.equal(cancelledPreserved.status, "cancelled");
assert.equal(cancelledPreserved.preserved_terminal_status, true);
assert.equal(accountProfileStatusFromIdentityRequestStatus(cancelledPreserved.status), "not_started");

const verifiedDecision = sumsubReviewDecision({
  reviewResult: { reviewAnswer: "GREEN" },
  reviewStatus: "completed",
  type: "applicantReviewed",
});
assert.equal(verifiedDecision.status, "verified");
assert.equal(verifiedDecision.terminal, true);

const retryDecision = sumsubReviewDecision({
  reviewResult: { reviewAnswer: "RED", reviewRejectType: "RETRY" },
  reviewStatus: "completed",
  type: "applicantReviewed",
});
assert.equal(retryDecision.status, "manual_review");
assert.equal(retryDecision.terminal, false);

console.log("Identity status mapping checks passed.");
