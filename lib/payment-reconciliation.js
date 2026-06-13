const REQUEST_SELECT_FIELDS =
  "id,request_code,payment_reference,quote_amount,quote_currency,payment_status,funds_status,protected_amount,release_notes";

const PAYMENT_STATUS_RANK = {
  unquoted: 0,
  invoice_sent: 1,
  deposit_paid: 2,
  paid: 3,
  refunded: 4,
};

const FUNDS_STATUS_RANK = {
  not_collected: 0,
  payment_link_sent: 1,
  authorized: 2,
  held_by_provider: 3,
  deposit_confirmed: 3,
  partially_released: 4,
  refund_pending: 5,
  released: 6,
  refunded: 7,
  disputed: 8,
};

const TERMINAL_FUNDS_STATUSES = new Set(["released", "refunded"]);
const REVIEW_LOCKED_FUNDS_STATUSES = new Set(["disputed", "refund_pending"]);

function normalizeCurrency(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function wholeMoneyAmount(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
}

function moneyAmount(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0;
}

function moneyMinorUnits(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}

function moneyFromSmallestUnit(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) / 100 : 0;
}

function maxMoneyAmount(first, second) {
  return moneyMinorUnits(first) >= moneyMinorUnits(second) ? moneyAmount(first) : moneyAmount(second);
}

function quotedAmount(request) {
  return moneyAmount(request?.quote_amount);
}

function quotedMinorUnits(request) {
  return moneyMinorUnits(request?.quote_amount);
}

function moneyLabel(currency, amount) {
  const cleanCurrency = normalizeCurrency(currency) || "unknown";
  const cleanAmount = moneyAmount(amount);
  const amountText = Number.isInteger(cleanAmount) ? String(cleanAmount) : cleanAmount.toFixed(2);
  return `${cleanCurrency} ${amountText}`;
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function statusRank(map, value) {
  const status = normalizeStatus(value);
  return Object.prototype.hasOwnProperty.call(map, status) ? map[status] : -1;
}

function mergeReferences(currentReference, providerReference) {
  const parts = [currentReference, providerReference]
    .flatMap((value) => String(value || "").split(" / "))
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(parts)].join(" / ");
}

function monotonicPaymentReconciliationPayload(request = {}, proposedPayload = {}) {
  const currentPaymentStatus = normalizeStatus(request.payment_status);
  const currentFundsStatus = normalizeStatus(request.funds_status);
  const nextPaymentStatus = normalizeStatus(proposedPayload.payment_status);
  const nextFundsStatus = normalizeStatus(proposedPayload.funds_status);
  const preservedNotes = [];
  const payload = {
    ...proposedPayload,
    payment_reference: mergeReferences(request.payment_reference, proposedPayload.payment_reference),
    protected_amount: maxMoneyAmount(request.protected_amount, proposedPayload.protected_amount),
  };

  if (
    currentPaymentStatus &&
    nextPaymentStatus &&
    statusRank(PAYMENT_STATUS_RANK, currentPaymentStatus) > statusRank(PAYMENT_STATUS_RANK, nextPaymentStatus)
  ) {
    payload.payment_status = currentPaymentStatus;
    preservedNotes.push(
      `Existing payment status ${currentPaymentStatus} preserved; provider callbacks are monotonic and cannot downgrade paid/refunded evidence.`,
    );
  } else if (
    currentPaymentStatus &&
    !nextPaymentStatus &&
    nextFundsStatus &&
    statusRank(PAYMENT_STATUS_RANK, currentPaymentStatus) >= statusRank(PAYMENT_STATUS_RANK, "paid")
  ) {
    payload.payment_status = currentPaymentStatus;
    preservedNotes.push(
      `Existing payment status ${currentPaymentStatus} preserved while provider evidence is flagged for funds review.`,
    );
  }

  if (TERMINAL_FUNDS_STATUSES.has(currentFundsStatus) && nextFundsStatus && nextFundsStatus !== currentFundsStatus) {
    payload.funds_status = currentFundsStatus;
    preservedNotes.push(
      `Existing terminal funds status ${currentFundsStatus} preserved; provider evidence cannot reopen released/refunded funds automatically.`,
    );
  } else if (REVIEW_LOCKED_FUNDS_STATUSES.has(currentFundsStatus) && nextFundsStatus && nextFundsStatus !== currentFundsStatus) {
    payload.funds_status = currentFundsStatus;
    preservedNotes.push(
      `Existing ${currentFundsStatus} funds status preserved; a later callback cannot clear a dispute/refund hold without founder/admin reconciliation.`,
    );
  } else if (
    currentFundsStatus &&
    nextFundsStatus &&
    nextFundsStatus !== "disputed" &&
    statusRank(FUNDS_STATUS_RANK, currentFundsStatus) > statusRank(FUNDS_STATUS_RANK, nextFundsStatus)
  ) {
    payload.funds_status = currentFundsStatus;
    preservedNotes.push(
      `Existing funds status ${currentFundsStatus} preserved; duplicate or late provider callbacks cannot downgrade protected funds.`,
    );
  }

  payload.release_notes = [
    proposedPayload.release_notes,
    ...preservedNotes,
    "Payment reconciliation is monotonic: provider evidence can confirm collection or flag review, but it cannot release funds, assign receivers, refund money, or clear disputes automatically.",
  ]
    .filter(Boolean)
    .join(" ");

  return payload;
}

function paymentReconciliationPayload({ amount, currency, paymentReference, providerName, request, successNotePrefix }) {
  const providerAmount = moneyAmount(amount);
  const providerMinor = moneyMinorUnits(amount);
  const providerCurrency = normalizeCurrency(currency);
  const quoteAmount = quotedAmount(request);
  const quoteMinor = quotedMinorUnits(request);
  const quoteCurrency = normalizeCurrency(request?.quote_currency);
  const notePrefix = successNotePrefix || `${providerName || "Provider"} payment confirmation received`;
  const basePayload = {
    protected_amount: providerAmount,
    payment_reference: paymentReference,
  };

  if (quoteCurrency && quoteCurrency !== providerCurrency) {
    return monotonicPaymentReconciliationPayload(request, {
      ...basePayload,
      funds_status: "disputed",
      release_notes: `${notePrefix}, but provider evidence currency ${providerCurrency || "unknown"} does not match quote currency ${quoteCurrency}. Founder/admin must reconcile before treating funds as paid or releasing money.`,
    });
  }

  if (!quoteMinor) {
    return monotonicPaymentReconciliationPayload(request, {
      ...basePayload,
      payment_status: "deposit_paid",
      funds_status: "deposit_confirmed",
      release_notes: `${notePrefix}; provider evidence confirmed ${moneyLabel(providerCurrency, providerAmount)}. Treat as deposit only because no quote amount is recorded. Founder/admin must reconcile the request before any receiver release.`,
    });
  }

  if (providerMinor < quoteMinor) {
    return monotonicPaymentReconciliationPayload(request, {
      ...basePayload,
      payment_status: "deposit_paid",
      funds_status: "deposit_confirmed",
      release_notes: `${notePrefix}; provider evidence confirmed ${moneyLabel(providerCurrency, providerAmount)}, below quote ${moneyLabel(quoteCurrency || providerCurrency, quoteAmount)}. Treat as deposit only until the balance is reconciled. Founder/admin must still review milestone proof before any receiver release.`,
    });
  }

  return monotonicPaymentReconciliationPayload(request, {
    ...basePayload,
    payment_status: "paid",
    funds_status: "deposit_confirmed",
    release_notes: `${notePrefix}; provider evidence matched quote amount/currency for ${moneyLabel(quoteCurrency || providerCurrency, quoteAmount)}. Founder/admin must still review milestone proof before any receiver release.`,
  });
}

function nonFinalPaymentCallbackPayload({ providerName, request, reason, paymentReference }) {
  const currentPaymentStatus = normalizeStatus(request?.payment_status) || "unknown";
  const currentFundsStatus = normalizeStatus(request?.funds_status) || "unknown";
  return {
    payment_reference: mergeReferences(request?.payment_reference, paymentReference),
    release_notes: `${providerName || "Provider"} callback did not confirm final payment. ${reason || "No provider reason supplied."} Existing payment status ${currentPaymentStatus} and funds status ${currentFundsStatus} preserved; non-final callback cannot downgrade provider evidence or release/refund funds.`,
  };
}

module.exports = {
  REQUEST_SELECT_FIELDS,
  mergeReferences,
  moneyAmount,
  moneyFromSmallestUnit,
  moneyMinorUnits,
  monotonicPaymentReconciliationPayload,
  nonFinalPaymentCallbackPayload,
  normalizeCurrency,
  paymentReconciliationPayload,
  wholeMoneyAmount,
};
