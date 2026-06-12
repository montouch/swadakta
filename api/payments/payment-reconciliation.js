const REQUEST_SELECT_FIELDS =
  "id,request_code,payment_reference,quote_amount,quote_currency,payment_status,funds_status";

function normalizeCurrency(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function wholeMoneyAmount(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
}

function quotedAmount(request) {
  return wholeMoneyAmount(request?.quote_amount);
}

function moneyLabel(currency, amount) {
  const cleanCurrency = normalizeCurrency(currency) || "unknown";
  return `${cleanCurrency} ${wholeMoneyAmount(amount)}`;
}

function paymentReconciliationPayload({ amount, currency, paymentReference, providerName, request, successNotePrefix }) {
  const providerAmount = wholeMoneyAmount(amount);
  const providerCurrency = normalizeCurrency(currency);
  const quoteAmount = quotedAmount(request);
  const quoteCurrency = normalizeCurrency(request?.quote_currency);
  const notePrefix = successNotePrefix || `${providerName || "Provider"} payment confirmation received`;
  const basePayload = {
    protected_amount: providerAmount,
    payment_reference: paymentReference,
  };

  if (quoteCurrency && quoteCurrency !== providerCurrency) {
    return {
      ...basePayload,
      funds_status: "disputed",
      release_notes: `${notePrefix}, but provider evidence currency ${providerCurrency || "unknown"} does not match quote currency ${quoteCurrency}. Founder/admin must reconcile before treating funds as paid or releasing money.`,
    };
  }

  if (!quoteAmount) {
    return {
      ...basePayload,
      payment_status: "deposit_paid",
      funds_status: "deposit_confirmed",
      release_notes: `${notePrefix}; provider evidence confirmed ${moneyLabel(providerCurrency, providerAmount)}. Treat as deposit only because no quote amount is recorded. Founder/admin must reconcile the request before any receiver release.`,
    };
  }

  if (providerAmount < quoteAmount) {
    return {
      ...basePayload,
      payment_status: "deposit_paid",
      funds_status: "deposit_confirmed",
      release_notes: `${notePrefix}; provider evidence confirmed ${moneyLabel(providerCurrency, providerAmount)}, below quote ${moneyLabel(quoteCurrency || providerCurrency, quoteAmount)}. Treat as deposit only until the balance is reconciled. Founder/admin must still review milestone proof before any receiver release.`,
    };
  }

  return {
    ...basePayload,
    payment_status: "paid",
    funds_status: "deposit_confirmed",
    release_notes: `${notePrefix}; provider evidence matched quote amount/currency for ${moneyLabel(quoteCurrency || providerCurrency, quoteAmount)}. Founder/admin must still review milestone proof before any receiver release.`,
  };
}

module.exports = {
  REQUEST_SELECT_FIELDS,
  normalizeCurrency,
  paymentReconciliationPayload,
  wholeMoneyAmount,
};
