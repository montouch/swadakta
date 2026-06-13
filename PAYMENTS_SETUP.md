# Swadakta Payments Setup

Last updated: June 13, 2026

Swadakta should stay quote-first at launch. Each request can vary by travel, access, risk, urgency, corridor, compliance, and proof requirements, so the autopilot should classify the request and the founder console should create or approve a client-specific payment link before money moves.

## Recommended Launch Stack

1. Stripe Payment Links for card payments and deposits.
2. PayPal invoices for clients who prefer PayPal or need a familiar invoice workflow.
3. M-Pesa through Safaricom Daraja for KES collections once Swadakta has the right Kenya business setup, PayBill/Till details, API credentials, and callback handling.
4. Paystack or Flutterwave as Africa expansion candidates after merchant approval, settlement-currency checks, webhook verification, and provider-evidence mapping.
5. Bank transfer or manual payment references only when the client and operator have a clear receipt trail.
6. Wise Business payment links or account details only as an admin fallback when Stripe, PayPal, M-Pesa, Paystack/Flutterwave, or normal bank transfer is unsuitable or has failed.
7. A true escrow provider for high-value property, construction, title, or supplier jobs where regulated escrow is required.

## Launch Rail Visibility Matrix

The public site should keep payment choices simple. The admin/readiness layer decides whether a rail is visible, hidden, or fallback-only.

| Rail | Public visibility | Must be true first | Evidence before funds count as protected |
| --- | --- | --- | --- |
| Stripe / card | Show for supported global checkout currencies after setup | Live Stripe account, server secret, return URLs, webhook signing secret, idempotency key, and a low-value test | Checkout Session or PaymentIntent matched to request code, amount, and currency |
| PayPal order/invoice | Show when payer prefers PayPal and quote currency is supported | REST app credentials, order creation, `PayPal-Request-Id`, capture workflow, and saved provider reference | Order/capture ID, payer status, amount, currency, and request-code reconciliation |
| M-Pesa Daraja | Show for Kenya KES only after business setup | Safaricom shortcode/Till/Paybill, Daraja credentials, callback URL, STK duplicate guard, and receipt mapping | MerchantRequestID, CheckoutRequestID, M-Pesa receipt, payer phone, KES amount, and request code |
| Paystack / Flutterwave | Keep hidden as expansion pilot until approved | Merchant approval, country/currency support, settlement account, webhook verification, and test payment | Provider transaction ID plus verified webhook or server-side transaction lookup matched to amount/currency/customer |
| Bank / Wise | Fallback-only, not normal self-serve checkout | Simpler rails are unsuitable, unavailable, failed, or genuinely less clean than bank evidence | Receipt or statement line matched to sender, date, amount, currency, and Swadakta reference |
| Regulated escrow/provider-held funds | Use only for high-value or legally sensitive jobs | Provider/escrow account, written milestone terms, release authority, dispute path, and proof pack | Provider contract/reference, milestone status, release authority, proof review, and dispute status |

Client-visible rail gate rule: no payment rail becomes a normal public choice until the readiness cockpit proves provider setup, evidence reconciliation, and milestone-release boundaries. Provider confirmation never releases receiver money by itself.

Corridor rail rule: even when a provider is ready, the corridor can still stay hidden or founder-gated. Admin Readiness now separates outside-Africa-to-Africa, Africa in-country, Africa-to-global, non-Africa global, China/sourcing, and high-value/sensitive routes so payment, ID, payout, customs/legal, and proof gates are checked together before a quote is sent. The public Payments page mirrors this at a client-safe level with a route-payment fit checker that explains likely rails and hard stops without exposing founder economics or internal provider flags.

## Server-side Payment Launch Gate

All admin payment route endpoints now run a shared launch gate before creating real provider payment routes:

- `POST /api/payments/stripe-checkout`
- `POST /api/payments/paypal-order`
- `POST /api/payments/mpesa-stk`
- `POST /api/payments/wise-payment-request`

The gate blocks route creation with HTTP `423` until the owner and provider evidence flags are ready. This is deliberate: even an admin should not accidentally send a real checkout link, PayPal order, M-Pesa STK prompt, or Wise fallback request before Swadakta is legally and operationally ready to collect money.

Required owner confirmations before payment route creation:

- `SWADAKTA_OWNER_BUSINESS_REGISTERED`
- `SWADAKTA_OWNER_TAX_REVIEWED`
- `SWADAKTA_OWNER_INSURANCE_ACTIVE`
- `SWADAKTA_OWNER_LEGAL_REVIEWED`
- `SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED`
- `SWADAKTA_OWNER_PRIVACY_REVIEWED`
- `SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED`
- `SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED`

The gate also requires at least one ID-provider evidence route, such as a provider handoff URL or native Sumsub credentials. Provider-specific evidence is required per rail: Stripe webhook plus server Supabase key, PayPal REST credentials, M-Pesa live/Kenya/callback controls, or a Wise fallback link. High-value, property, title, construction, supplier-deposit, or sensitive-funds work additionally requires `SWADAKTA_OWNER_REGULATED_ESCROW_READY`.

If the gate blocks a route, the admin UI shows the missing flag names and points the founder back to Admin Readiness. Do not bypass this by adding fake `true` values. Set those flags only after the real provider, legal, insurance, tax, privacy, and evidence steps are actually complete.

## Per-job Payment Acceptance Gate

Payment route endpoints also check the specific job before creating a real payment link, PayPal order, M-Pesa STK prompt, or Wise fallback request. The browser warning is not the only guard.

The server blocks payment route creation when the request carries any of these unresolved states:

- `JOB_ACCEPTANCE_REFUSE`
- `JOB_ACCEPTANCE_FOUNDER_REVIEW_REQUIRED`
- `JOB_ROUTE_EVIDENCE_REQUIRED`
- `JOB_COMPLIANCE_PROHIBITED`
- `JOB_COMPLIANCE_RESTRICTED`
- `JOB_ADMIN_REVIEW_REQUIRED`
- `JOB_HIGH_RISK_REVIEW_REQUIRED`
- `JOB_SENSITIVE_DOCUMENTS_REVIEW_REQUIRED`
- `JOB_GOODS_RESTRICTED_OR_UNSURE`
- `JOB_ROUTE_NOT_SUPPORTED`

This protects against accidental payment collection for restricted goods, unclear customs routes, sensitive documents, high-risk work, unsupported routes, or requests that require founder/provider evidence before quote. To proceed, correct the request so the job is genuinely quote-eligible, record the needed evidence, and keep the payment route inside provider-held funds. Do not clear these flags just to make checkout work.

## Server-side Founder Economics Gate

Payment route endpoints also enforce the internal quote floor on the server, not only in the admin browser. Stripe, PayPal, M-Pesa, and Wise route creation stays locked when:

- `QUOTE_ECONOMICS_NOT_PRICED`: no saved client quote exists.
- `QUOTE_ECONOMICS_COST_PLAN_MISSING`: quote exists, but operator payout, field costs, and payment/FX fees are all missing.
- `QUOTE_ECONOMICS_MARGIN_LOSS`: direct costs exceed or equal the quote.
- `QUOTE_ECONOMICS_BELOW_FLOOR`: quote does not clear the confidential founder reserve and margin floor.

The floor uses the saved Swadakta request, not the browser payload. It checks `quote_amount`, `quote_currency`, `operator_payout`, `field_costs`, and `payment_processing_fee` before any checkout session, PayPal order, M-Pesa STK prompt, or Wise fallback request is created.

This keeps founder economics private while still protecting the business. Client-facing quote messages should stay simple; internal payout, field-cost, processor-fee, reserve, and margin assumptions stay in admin only.

## Stored Request Authority

Before a payment route is created, Stripe, PayPal, M-Pesa, and Wise endpoints now reload the saved Swadakta `service_requests` row by `request_code` using the signed-in admin session. The stored row is the authority for quote amount, quote currency, operator payout, field costs, payment/FX fees, compliance flags, review status, route status, goods category, sensitive-document state, and payment evidence context.

This means a stale browser page or edited client payload cannot soften a risky request into a normal checkout, and it cannot create a payment route for a job that loses money or lacks a cost plan. If the saved request is missing, the saved quote amount/currency is not ready, the posted amount/currency does not match the saved row, or the founder economics floor is not clear, the payment route is refused. Save the quote, save the cost plan, and clear the real evidence gates first.

## Offer Acceptance and Work-Start Gates

The receiver offer market now separates selection from permission to work.

- Accepting an offer is allowed only when the receiver is vetted, ID verified, has accepted ID/proof standards, and the offer has no safety flags.
- Acceptance selects the receiver on the request and declines competing submitted/shortlisted offers.
- Acceptance does not release funds, mark money paid, bypass compliance, or start the job.
- Database work-start locks block `in_progress`, `waiting_client`, and `completed` unless the request has an assigned receiver, active/pilot route, cleared compliance/admin review, sensitive-document verification where needed, protected amount, paid/deposit-paid status, and provider-held/confirmed funds state.

This is the safe operating model: Swadakta can choose a trusted receiver early, while the actual work remains locked until provider evidence and compliance conditions are real.

## Funds Protection and Milestones

Swadakta should not present itself as a licensed escrow company unless that legal and payment setup exists. Use the admin ledger to run escrow-style controls:

- Set `Funds status` to show whether funds are not collected, authorized, held by provider, deposit confirmed, partially released, released, refunded, or disputed.
- Set `Protected amount` to the amount currently held, authorized, or confirmed through the provider.
- Add one milestone per release event: deposit, travel/access, media proof, document submission, final report, receiver payout, refund, or dispute hold.
- Release receiver money bit by bit only after admin reviews receiver proof and updates the milestone.
- Keep provider references for Stripe PaymentIntent/Checkout, PayPal authorization/invoice, Wise transfer, M-Pesa receipt, bank reference, or escrow transaction ID.
- Client tracking can show safe milestone status, but internal notes and founder economics stay in admin.
- Require ID verification for high-value, title/document, local-authority, family-authority, or sensitive-document jobs before funds are released.

## Provider Evidence Reconciliation

Every automatic provider confirmation must be reconciled against the saved Swadakta quote before the request looks fully paid:

- If provider amount and currency match the quote, set `Payment` to `Paid` and `Funds` to `Deposit confirmed`.
- If the provider amount is below the quote, or no quote amount is recorded, set `Payment` to `Deposit paid` and keep the balance unresolved.
- If the provider currency does not match the quote currency, set `Funds` to `Disputed` and leave paid status unresolved until founder/admin reconciliation.
- Reconciliation is monotonic. A duplicate, retry, late partial callback, or non-final provider callback cannot downgrade an existing `Paid`, `Released`, `Refunded`, `Disputed`, or `Refund pending` state.
- A later matching callback cannot clear `Disputed` or `Refund pending`; founder/admin reconciliation must decide after checking the provider dashboard and proof pack.
- Provider references are merged rather than replaced so duplicate callbacks keep the original payment trail.
- In all cases, provider evidence only confirms collection state. It must not assign receivers, release milestones, refund money, or override proof review.

## Africa Expansion Rail Readiness

Paystack and Flutterwave should stay expansion pilots until the readiness cockpit says the full evidence chain is complete. Do not expose either as a normal public payment option just because an API key exists.

For each provider, confirm all of these before client use:

- Merchant account is approved for the legal entity and the target countries/currencies.
- Settlement currencies and payout route are known.
- Webhook/callback endpoint exists and signature verification is configured.
- Server-side transaction verification maps provider reference, amount, currency, customer, and status into the Swadakta request.
- A low-value sandbox/live test proves the provider evidence trail without releasing funds automatically.

Use these non-secret Vercel flags only after the step is genuinely complete: `PAYSTACK_MERCHANT_APPROVED`, `PAYSTACK_WEBHOOK_ENDPOINT_READY`, `PAYSTACK_PROVIDER_EVIDENCE_MAPPED`, `FLUTTERWAVE_MERCHANT_APPROVED`, `FLUTTERWAVE_WEBHOOK_ENDPOINT_READY`, and `FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED`.

Webhook endpoints are now reserved at:

- `POST /api/payments/paystack-webhook`
- `POST /api/payments/flutterwave-webhook`

The Paystack endpoint verifies `x-paystack-signature`, then calls Paystack transaction verification by reference before updating a request. The Flutterwave endpoint prefers the current raw-body HMAC `flutterwave-signature` header and still accepts legacy `verif-hash` where an existing dashboard sends it, then calls Flutterwave transaction verification by transaction id before updating a request. Both endpoints reconcile provider amount and currency against the saved quote before marking a request fully paid, and neither endpoint can assign receivers, release milestones, refund money, or override founder/admin proof review.

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
- Sends a deterministic Stripe `Idempotency-Key` built from request code, currency, amount, payment kind, and service package, so a retry or double-click does not create a second Checkout Session for the same quote.
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
- Sets `payment_status` to `paid` only when Stripe amount/currency matches the saved quote.
- Sets `payment_status` to `deposit_paid` when amount is short or no quote amount is recorded.
- Sets `funds_status` to `disputed` when Stripe currency does not match the quote currency.
- Sets `protected_amount` from Stripe `amount_total`.
- Stores the Checkout Session/PaymentIntent reference.
- Adds a release note saying founder proof review is still required.
- Preserves stronger existing payment/funds states if Stripe retries a webhook or a late event would otherwise downgrade the record.
- Does not release funds, assign receivers, or mark milestones released.

Stripe's webhook docs require raw-body signature verification:

- https://docs.stripe.com/webhooks
- https://docs.stripe.com/webhooks/signature

Stripe recommends idempotency keys for POST retries so one operation is not created twice:

- https://docs.stripe.com/api/idempotent_requests
- https://docs.stripe.com/error-low-level#idempotency

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
- Sends `PayPal-Request-Id` with the request code, amount, and currency so retries are idempotent while revised quotes can create a new order.
- Returns the PayPal approval URL to the admin card.
- Sets the form fields to `Payment: Invoice sent`, `Funds: Payment link sent`, and provider reference.
- Does not capture PayPal payment, mark money paid, assign receivers, or release funds.

PayPal capture endpoint:

- `POST /api/payments/paypal-capture`

The capture endpoint:

- Requires a signed-in Supabase admin session.
- Captures an approved PayPal order using the order ID stored in `Payment/provider ref`.
- Updates the Swadakta request record to `Payment: Paid` and `Funds: Deposit confirmed` only when PayPal amount/currency matches the saved quote.
- Marks the request `Deposit paid` when amount is short or no quote amount is recorded.
- Marks funds `Disputed` when PayPal currency does not match the quote currency.
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

PayPal recommends `PayPal-Request-Id` for idempotent REST POST calls and repeated capture/execute calls after network timeouts:

- https://developer.paypal.com/api/rest/reference/idempotency/
- https://developer.paypal.com/api/rest/requests/

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
- Checks whether the same request already has an active `M-Pesa STK` provider reference for the same KES quote amount and `Payment link sent` funds state. If it does, it returns the existing `CheckoutRequestID` instead of sending a second phone prompt.
- Allows `force_new_stk` only after the previous prompt has expired, failed, or been confirmed by admin as safe to replace.
- Sets `Payment: Invoice sent` and `Funds: Payment link sent` while waiting for callback confirmation.
- Does not mark money paid, release funds, assign receivers, or mark milestones released.

Callback endpoint:

- `POST /api/payments/mpesa-callback`

The callback endpoint:

- Receives the Daraja STK callback.
- Finds the request by `CheckoutRequestID` in `Payment/provider ref`.
- On successful `ResultCode: 0`, reconciles the KES amount against the saved quote before marking `Payment: Paid`.
- Marks `Payment: Deposit paid` if the confirmed amount is short or the quote amount is missing.
- Marks `Funds: Disputed` if the request quote currency is not `KES`.
- Stores the M-Pesa receipt and protected amount either way, so founder/admin can reconcile safely.
- On failed/cancelled STK, records the callback result in release notes without marking funds paid.
- On failed/cancelled STK after a previous confirmed callback, preserves the existing payment/funds state and records the non-final result as evidence only.
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
4. Do not keep clicking if the payer says nothing happened. If the same quote already has an active STK prompt, Swadakta reuses the existing checkout reference instead of prompting the phone again.
5. Wait for the client/payer to approve on their phone.
6. The callback marks the request paid only after Safaricom confirms success.
7. Use `force_new_stk` only after confirming the previous prompt expired, failed, or was sent to the wrong number.
8. Review the M-Pesa receipt and protected amount before assigning or releasing any receiver payout.

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
