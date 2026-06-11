# Swadakta Payments Setup

Last updated: June 11, 2026

Swadakta should stay quote-first at launch. Each request can vary by travel, access, risk, urgency, and proof requirements, so the admin desk should create a client-specific payment link after reviewing the brief.

## Recommended Launch Stack

1. Stripe Payment Links for card payments and deposits.
2. PayPal invoices for clients who prefer PayPal or need a familiar invoice workflow.
3. Wise Business payment links or account details for international transfers where card fees or currency conversion matter.
4. Bank transfer or mobile money only when the client and operator have a clear receipt trail.
5. M-Pesa through Safaricom Daraja later, once Swadakta has the right Kenya business setup, PayBill/Till details, API credentials, and callback handling.
6. A true escrow provider for high-value property, construction, title, or supplier jobs where regulated escrow is required.

## Funds Protection and Milestones

Swadakta should not present itself as a licensed escrow company unless that legal and payment setup exists. Use the admin ledger to run escrow-style controls:

- Set `Funds status` to show whether funds are not collected, authorized, held by provider, deposit confirmed, partially released, released, refunded, or disputed.
- Set `Protected amount` to the amount currently held, authorized, or confirmed through the provider.
- Add one milestone per release event: deposit, travel/access, media proof, document submission, final report, receiver payout, refund, or dispute hold.
- Release receiver money bit by bit only after admin reviews receiver proof and updates the milestone.
- Keep provider references for Stripe PaymentIntent/Checkout, PayPal authorization/invoice, Wise transfer, M-Pesa receipt, bank reference, or escrow transaction ID.
- Client tracking can show safe milestone status, but internal notes and founder economics stay in admin.
- Require ID verification for high-value, title/document, local-authority, family-authority, or sensitive-document jobs before funds are released.

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

In the admin desk, paste the invoice link into `Payment link` and mention PayPal in the client update.

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

PayPal order creation is currently enabled for `AUD`, `USD`, `GBP`, and `EUR` quotes. Keep `KES` jobs on M-Pesa, bank transfer, Wise, or manual PayPal invoice until account/currency support is confirmed.

## Wise

Use Wise when a diaspora client wants international transfer, local account details, or lower-friction multi-currency handling. Wise documents Business payment links and payment requests:

- https://wise.com/help/articles/4qr3kkvIQlHNiD8BegEB4u/getting-paid-to-your-wise-business-by-payment-link
- https://wise.com/us/business/receive-money

Use Wise for larger site visits, supplier deposits, or monthly retainers where bank-style settlement may be preferred.

## M-Pesa

M-Pesa should be planned through Safaricom Daraja, not improvised through personal numbers.

- Start manual: record M-Pesa receipt/reference numbers in `Payment/provider ref` and milestone provider references.
- Later: add Daraja STK Push/C2B for Kenya-side collections where appropriate.
- Later: add B2C payout workflows only after receiver vetting, payout limits, reversal/dispute process, and accounting are ready.
- Keep M-Pesa as one provider in the milestone ledger, not the only source of truth.

## Operating Rules

- Do not hold client construction or family-support funds as an informal escrow.
- Do not call funds "escrow" in client terms unless a regulated escrow/payment provider is actually holding them.
- Keep payment links HTTP/HTTPS only; Supabase rejects unsafe links.
- Mark `Payment` as `Invoice sent` when a link is issued, `Deposit paid` when partial payment is confirmed, and `Paid` only when the agreed amount is cleared.
- Send quote/payment messages from the admin `Copy quote` template so every client receives the same safety and scope wording.
- Record operator payout, field costs, and payment fees in admin before marking a job profitable; the founder margin should stay visible on every quoted request.
- Do not assign a job to a receiver partner until their application is reviewed and marked `Vetted` in admin.
- Store receipts, payment screenshots, or processor confirmations in the proof/report pack, not in public tracking text.
- For refunds, update `Payment` to `Refunded` and add a short internal note explaining the reason, amount, and date.
