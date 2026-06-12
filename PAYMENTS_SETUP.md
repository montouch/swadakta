# Swadakta Payments Setup

Last updated: June 12, 2026

Swadakta should stay quote-first at launch. Each request can vary by travel, access, risk, urgency, corridor, compliance, and proof requirements, so the autopilot should classify the request and the founder console should create or approve a client-specific payment link before money moves.

## Recommended Launch Stack

1. Stripe Payment Links for card payments and deposits.
2. PayPal invoices for clients who prefer PayPal or need a familiar invoice workflow.
3. M-Pesa through Safaricom Daraja for KES collections once Swadakta has the right Kenya business setup, PayBill/Till details, API credentials, and callback handling.
4. Paystack or Flutterwave as Africa expansion candidates after merchant approval, settlement-currency checks, webhook verification, and provider-evidence mapping.
5. Bank transfer or manual payment references only when the client and operator have a clear receipt trail.
6. Wise Business payment links or account details only as an admin fallback when Stripe, PayPal, M-Pesa, Paystack/Flutterwave, or normal bank transfer is unsuitable or has failed.
7. A true escrow provider for high-value property, construction, title, or supplier jobs where regulated escrow is required.

## Funds Protection and Milestones

Swadakta should not present itself as a licensed escrow company unless that legal and payment setup exists. Use the admin ledger to run escrow-style controls:

- Set `Funds status` to show whether funds are not collected, authorized, held by provider, deposit confirmed, partially released, released, refunded, or disputed.
- Set `Protected amount` to the amount currently held, authorized, or confirmed through the provider.
- Add one milestone per release event: deposit, travel/access, media proof, document submission, final report, receiver payout, refund, or dispute hold.
- Release receiver money bit by bit only after admin reviews receiver proof and updates the milestone.
- Keep provider references for Stripe PaymentIntent/Checkout, PayPal authorization/invoice, Wise transfer, M-Pesa receipt, bank reference, or escrow transaction ID.
- Client tracking can show safe milestone status, but internal notes and founder economics stay in admin.
- Require ID verification for high-value, title/document, local-authority, family-authority, or sensitive-document jobs before funds are released.

## Africa Expansion Rail Readiness

Paystack and Flutterwave should stay expansion pilots until the readiness cockpit says the full evidence chain is complete. Do not expose either as a normal public payment option just because an API key exists.

For each provider, confirm all of these before client use:

- Merchant account is approved for the legal entity and the target countries/currencies.
- Settlement currencies and payout route are known.
- Webhook/callback endpoint exists and signature verification is configured.
- Server-side transaction verification maps provider reference, amount, currency, customer, and status into the Swadakta request.
- A low-value sandbox/live test proves the provider evidence trail without releasing funds automatically.

Use these non-secret Vercel flags only after the step is genuinely complete: `PAYSTACK_MERCHANT_APPROVED`, `PAYSTACK_WEBHOOK_ENDPOINT_READY`, `PAYSTACK_PROVIDER_EVIDENCE_MAPPED`, `FLUTTERWAVE_MERCHANT_APPROVED`, `FLUTTERWAVE_WEBHOOK_ENDPOINT_READY`, and `FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED`.

## Stripe

Use Stripe Payment Links for standard deposits, card payments, and repeatable packages. Stripe says Payment Links can create a payment page in a few clicks and be shared without code:

- https://docs.stripe.com/payment-links
- https://docs.stripe.com/payment-links/create
- https://docs.stripe.com/api/checkout/sessions/create

Suggested first links:

- Quick errand deposit
- Site visit deposit
- Registry/document errand deposit
- Family support run deposit
- Virtual assistant retainer
- Business operations support retainer
- Custom balance payment

For one-off jobs, create a new link after quoting, paste it into the admin `Payment link` field, set `Payment` to `Invoice sent`, and set a payment due date.
Use the intake `Service package` field to choose the right reusable deposit or retainer link before creating a custom link.
Use the intake budget comfort field as a guide, not as a binding price cap; the final quote should still reflect travel, access, urgency, and proof requirements.
Use the admin `Copy quote` action to send a consistent quote message that includes the amount, payment link, due date, proof plan, scope boundary, and card-data safety warning.

## Stripe Checkout Automation

The admin app now includes a server-side Stripe Checkout handoff at:

- `POST /api/payments/stripe-checkout`

The endpoint:

- Requires a signed-in Supabase admin session.
- Verifies the user exists in `admin_users`.
- Calls Stripe from the Vercel Function, never from browser JavaScript.
- Adds `request_code`, payment kind, service package, value band, and funds preference to Stripe metadata.
- Returns the Checkout URL to the admin card.
- Sets the form fields to `Payment: Invoice sent`, `Funds: Payment link sent`, and provider reference.
- Does not mark money paid, does not assign receivers, and does not release funds.

Required Vercel environment variables:

- `STRIPE_SECRET_KEY`: Stripe secret key for the active Stripe account.
- `STRIPE_WEBHOOK_SECRET`: Stripe endpoint signing secret for `/api/payments/stripe-webhook`.
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`: server-only Supabase key used by the webhook to update request records.
- `PUBLIC_BASE_URL`: `https://swadakta.com`.

Optional Vercel environment variables:

- `SUPABASE_URL`: defaults to the current Swadakta Supabase URL if absent.
- `SUPABASE_PUBLISHABLE_KEY`: defaults to the current publishable key if absent.

Admin workflow:

1. Quote the request in admin with amount and currency.
2. Click `Generate Stripe checkout`.
3. Review the generated payment link and provider reference.
4. Click `Save update`.
5. Use `Copy quote` to send the client the approved payment message.

Stripe Checkout is currently enabled for `AUD`, `USD`, `GBP`, and `EUR` quotes. Use PayPal, Wise, bank, or manual M-Pesa references for other currencies until the Stripe account/currency support is confirmed.

Webhook automation endpoint:

- `POST /api/payments/stripe-webhook`

The webhook:

- Verifies the Stripe signature using the raw body and `STRIPE_WEBHOOK_SECRET`.
- Handles `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
- Reads `request_code` from Checkout metadata/client reference.
- Sets `payment_status` to `paid`.
- Sets `funds_status` to `deposit_confirmed`.
- Sets `protected_amount` from Stripe `amount_total`.
- Stores the Checkout Session/PaymentIntent reference.
- Adds a release note saying founder proof review is still required.
- Does not release funds, assign receivers, or mark milestones released.

Stripe's webhook docs require raw-body signature verification:

- https://docs.stripe.com/webhooks
- https://docs.stripe.com/webhooks/signature

Supabase server keys must never go into browser JavaScript. Supabase documents service-role/secret keys as server-side only and warns that they bypass Row Level Security:

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/functions/secrets

## PayPal

Use PayPal invoices when the client prefers PayPal or when a formal invoice link is easier to share. PayPal documents creating invoices from `Pay & Get Paid > Create an Invoice`, and PayPal invoice links can be copied and shared by email, text, or messaging app:

- https://www.paypal.com/us/cshelp/article/how-do-i-create-and-send-an-invoice-help319
- https://developer.paypal.com/docs/invoicing/
- https://developer.paypal.com/docs/api/orders/v2/
- https://developer.paypal.com/api/rest/authentication/

In the founder console, paste the invoice link into `Payment link` and mention PayPal in the client update.

## PayPal Order Automation

The admin app now includes a server-side PayPal order handoff at:

- `POST /api/payments/paypal-order`

The endpoint:

- Requires a signed-in Supabase admin session.
- Verifies the user exists in `admin_users`.
- Exchanges `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` for a PayPal OAuth access token server-side.
- Creates a PayPal Orders v2 order with `request_code` as `reference_id`, `custom_id`, and `invoice_id`.
- Returns the PayPal approval URL to the admin card.
- Sets the form fields to `Payment: Invoice sent`, `Funds: Payment link sent`, and provider reference.
- Does not capture PayPal payment, mark money paid, assign receivers, or release funds.

PayPal capture endpoint:

- `POST /api/payments/paypal-capture`

The capture endpoint:

- Requires a signed-in Supabase admin session.
- Captures an approved PayPal order using the order ID stored in `Payment/provider ref`.
- Updates the Swadakta request record to `Payment: Paid` and `Funds: Deposit confirmed`.
- Stores the PayPal order/capture reference.
- Sets `Protected amount` from the captured amount.
- Adds a release note saying founder proof review is still required.
- Does not release funds, assign receivers, or mark milestones released.

Required Vercel environment variables:

- `PAYPAL_CLIENT_ID`: PayPal REST app client ID.
- `PAYPAL_CLIENT_SECRET`: PayPal REST app client secret.

Optional Vercel environment variables:

- `PAYPAL_ENVIRONMENT`: `live` or `sandbox`; defaults to `live`.
- `PAYPAL_BASE_URL`: explicit override for unusual testing environments.

Admin workflow:

1. Quote the request in admin with amount and currency.
2. Click `Generate PayPal order`.
3. Review the generated approval link and provider reference.
4. Click `Save update`.
5. Use `Copy quote` to send the client the approved payment message.
6. After the client approves/pays through PayPal, click `Capture PayPal order`.
7. Confirm the request now shows paid/protected funds before assigning or continuing work.

PayPal order creation is currently enabled for `AUD`, `USD`, `GBP`, and `EUR` quotes. Keep `KES` jobs on M-Pesa, bank transfer, Wise, or manual PayPal invoice until account/currency support is confirmed.

## Wise

Use Wise only as a back-office fallback when the lower-labour options fail or do not fit the client: Stripe card checkout, PayPal order/invoice, M-Pesa for KES, or normal bank transfer. Do not present Wise as a normal public payment preference because it adds manual reconciliation work. Wise documents Business payment links and payment requests:

- https://wise.com/help/articles/4qr3kkvIQlHNiD8BegEB4u/getting-paid-to-your-wise-business-by-payment-link
- https://wise.com/us/business/receive-money

Wise's public API does not create Wise payment links for online checkout. Wise's own platform support page says payment links should still be created in the Wise.com interface, while the API can be used for payout workflows and statement-style reconciliation:

- https://docs.wise.com/guides/product/partner/business-account-support
- https://docs.wise.com/api-reference/balance-statement

Swadakta therefore uses Wise as a prepared fallback payment-request/reference rail:

- `POST /api/payments/wise-payment-request`

The endpoint:

- Requires a signed-in Supabase admin session.
- Verifies the user exists in `admin_users`.
- Requires a positive quote amount.
- Uses a Wise Business payment link or receive-details URL configured in Vercel only when admin intentionally opens the fallback route.
- Generates a Swadakta Wise provider reference such as `WISE-SW-123ABC-20260611190000`.
- Sets the admin form to `Payment: Invoice sent` and `Funds: Payment link sent`.
- Copies a client-ready Wise message with amount, link, and reference.
- Does not mark money paid, assign receivers, or release milestones.

Required Vercel environment variable:

- `WISE_PAYMENT_LINK_URL` or `WISE_PAYMENT_REQUEST_URL`: a Wise Business single-use or reusable payment link created inside Wise.

Optional Vercel environment variables:

- `WISE_RECEIVE_DETAILS_URL`: fallback link to Wise receive/account-details instructions if no payment-link variable is set.
- `WISE_SETTLEMENT_CURRENCIES`: comma-separated quote currencies allowed for Wise prep, for example `AUD,USD,GBP,EUR`.
- `WISE_ALLOW_KES`: set to `true` only if the Wise account and operating model explicitly support KES settlement for the job type.

Admin workflow:

1. Create or reuse a Wise Business payment link in Wise.
2. Add that link to Vercel as `WISE_PAYMENT_LINK_URL` or `WISE_PAYMENT_REQUEST_URL`.
3. Quote the request in an allowed Wise settlement currency.
4. In admin, click `Fallback Wise request` only if the request is already on a bank/manual-transfer fallback route or is a legacy Wise request.
5. Review the payment link and provider reference populated in admin.
6. Click `Save update`.
7. Send the copied Wise message to the client.
8. Mark funds paid only after a Wise receipt, statement line, or bank-side confirmation matches the amount, sender, date, and Swadakta reference.

Use Wise for larger site visits, supplier deposits, monthly retainers, or cross-border clients only when the normal rails are a bad fit. Use Stripe or PayPal when the client can pay through checkout, M-Pesa for KES phone-prompt collections, and bank transfer when a normal receipt trail is simpler.

AI boundary:

- AI can recommend Wise only as a fallback after simpler rails are unsuitable, unavailable, failed, or too costly for the specific job.
- After admin intentionally invokes the fallback, AI can help prepare the Wise client message and reconciliation checklist.
- AI can compare uploaded receipt text against the request amount, currency, payer, date, and Swadakta reference once file upload/receipt parsing exists.
- The admin fallback workflow can save the Wise link/reference as `Invoice sent` and write internal reconciliation notes.
- Admin can click `AI receipt check`, paste Wise/bank receipt or statement text, and let the system draft matched/missing/suspicious evidence into release notes.
- AI cannot mark Wise funds as paid, assign a receiver because of a Wise receipt, or release any milestone without provider-grade evidence or founder approval.
- Wise payment status should stay `Invoice sent` / `Payment link sent` until a receipt, statement line, or bank-side confirmation has been reviewed.

## M-Pesa

M-Pesa should be planned through Safaricom Daraja, not improvised through personal numbers. Safaricom describes Daraja as the developer platform for Safaricom and M-PESA APIs, and M-Pesa's developer portal lists C2B, reversals, and transaction status query APIs for receiving and managing payments:

- https://developer.safaricom.co.ke/
- https://developer.safaricom.co.ke/apis
- https://business.m-pesa.com/developers/

Swadakta now includes an admin-only M-Pesa STK Push handoff at:

- `POST /api/payments/mpesa-stk`

The endpoint:

- Requires a signed-in Supabase admin session.
- Verifies the user exists in `admin_users`.
- Requires the quote currency to be `KES`.
- Matches the public intake `M-Pesa STK or Paybill` payment preference.
- Exchanges `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` for a Daraja access token server-side.
- Sends an STK Push through the configured Paybill/Till shortcode.
- Records the `MerchantRequestID` and `CheckoutRequestID` in `Payment/provider ref`.
- Sets `Payment: Invoice sent` and `Funds: Payment link sent` while waiting for callback confirmation.
- Does not mark money paid, release funds, assign receivers, or mark milestones released.

Callback endpoint:

- `POST /api/payments/mpesa-callback`

The callback endpoint:

- Receives the Daraja STK callback.
- Finds the request by `CheckoutRequestID` in `Payment/provider ref`.
- On successful `ResultCode: 0`, sets `Payment: Paid`, `Funds: Deposit confirmed`, stores the M-Pesa receipt, and records the protected amount.
- On failed/cancelled STK, records the callback result in release notes without marking funds paid.
- Does not release receiver payouts.

Required Vercel environment variables:

- `MPESA_CONSUMER_KEY`: Daraja app consumer key.
- `MPESA_CONSUMER_SECRET`: Daraja app consumer secret.
- `MPESA_SHORTCODE`: Paybill/Till/shortcode used for collection.
- `MPESA_PASSKEY`: Lipa na M-Pesa Online passkey.
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`: server-only Supabase key used by the callback to update request records.
- `PUBLIC_BASE_URL`: `https://swadakta.com`.

Optional Vercel environment variables:

- `MPESA_ENVIRONMENT`: `sandbox` or `live`; defaults to `sandbox`.
- `MPESA_BASE_URL`: explicit Daraja base URL override.
- `MPESA_TRANSACTION_TYPE`: defaults to `CustomerPayBillOnline`; set the Daraja-approved value for Till/Buy Goods if needed.
- `MPESA_CALLBACK_URL`: explicit callback URL if Safaricom needs a fixed URL.
- `MPESA_CALLBACK_TOKEN`: shared callback token. If set, the generated callback URL includes `?token=...` and the endpoint rejects callbacks without it.

Admin workflow:

1. Quote the request in `KES`.
2. Click `Send M-Pesa STK`.
3. Enter the Kenyan M-Pesa phone number that should receive the prompt.
4. Wait for the client/payer to approve on their phone.
5. The callback marks the request paid only after Safaricom confirms success.
6. Review the M-Pesa receipt and protected amount before assigning or releasing any receiver payout.

Manual M-Pesa fallback:

- Record M-Pesa receipt/reference numbers in `Payment/provider ref` and milestone provider references.
- Store receipt screenshots or statements in proof/report links where appropriate.
- Use manual references only when there is a clear receipt trail and admin has checked the amount, phone, request code, and date.

Future Kenya payment work:

- Add C2B Paybill/Till confirmation and validation URLs for offline Paybill payments after Safaricom registration.
- Add transaction-status checks for cases where callbacks fail or are delayed.
- Evaluate Pesapal or Flutterwave as a secondary Kenya gateway if Swadakta needs one checkout flow for M-Pesa plus local/international cards before direct Daraja operations are approved.
- Add B2C payout workflows only after receiver vetting, payout limits, reversal/dispute process, tax/accounting handling, and founder approval controls are ready.
- Keep M-Pesa as one provider in the milestone ledger, not the only source of truth.

## Paystack and Flutterwave Africa Expansion

Paystack and Flutterwave should be treated as Africa expansion rails, not as public launch defaults. Use them when Swadakta needs a local African checkout route beyond Kenya M-Pesa, or when a country/currency combination is better served by an Africa-native processor than Stripe or PayPal.

Useful provider docs:

- Paystack payments documentation: https://paystack.com/docs/payments/
- Paystack transactions API: https://paystack.com/docs/api/transaction/
- Flutterwave Standard checkout: https://developer.flutterwave.com/docs/flutterwave-standard
- Flutterwave webhooks: https://developer.flutterwave.com/docs/webhooks

Readiness rules before either rail is client-facing:

- Merchant account is approved for the legal entity and country.
- Settlement currency and settlement account are confirmed for the job type.
- Webhook secret/signature verification is configured before any automated payment confirmation.
- Provider transaction IDs are written to `payment_reference` or milestone provider references.
- Callback evidence can mark funds as provider-confirmed, but it must not assign receivers, release funds, refund, or clear disputes.
- High-value or regulated jobs still use regulated escrow/payment-provider review or staged provider-held funds.

Environment placeholders:

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `PAYSTACK_SETTLEMENT_CURRENCIES`
- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_WEBHOOK_SECRET`
- `FLUTTERWAVE_SETTLEMENT_CURRENCIES`

Recommended order:

1. Keep Stripe/PayPal first for diaspora card payments in AUD, USD, GBP, and EUR.
2. Use M-Pesa/Daraja first for Kenya KES jobs after Safaricom setup.
3. Pilot Paystack for suitable Nigeria, Ghana, South Africa, or supported Africa-card routes after account approval.
4. Pilot Flutterwave for broader Africa local-currency coverage after account approval.
5. Fall back to bank/Wise only when simpler provider rails are unavailable, unsuitable, or have failed.

## Operating Rules

- Do not hold client construction or family-support funds as an informal escrow.
- Do not call funds "escrow" in client terms unless a regulated escrow/payment provider is actually holding them.
- Treat client payment confirmation and receiver payout release as separate protected decisions.
- Require founder review before any milestone release involving high-value goods, unsupported corridors, customs uncertainty, identity mismatch, or a dispute.
- Keep payment links HTTP/HTTPS only; Supabase rejects unsafe links.
- Use `AI receipt check` for Wise or bank-transfer evidence, then review the drafted note against the original secure receipt/statement before changing payment status.
- Mark `Payment` as `Invoice sent` when a link is issued, `Deposit paid` when partial payment is confirmed, and `Paid` only when the agreed amount is cleared.
- Send quote/payment messages from the admin `Copy quote` template so every client receives the same safety and scope wording.
- Record operator payout, field costs, and payment fees in admin before marking a job profitable; the founder margin should stay visible on every quoted request.
- Do not assign a job to a receiver partner until their application is reviewed and marked `Vetted` in admin.
- Store receipts, payment screenshots, or processor confirmations in the proof/report pack, not in public tracking text.
- For refunds, update `Payment` to `Refunded` and add a short internal note explaining the reason, amount, and date.
