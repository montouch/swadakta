# Swadakta Payments Setup

Last updated: June 11, 2026

Swadakta should stay quote-first at launch. Each request can vary by travel, access, risk, urgency, and proof requirements, so the admin desk should create a client-specific payment link after reviewing the brief.

## Recommended Launch Stack

1. Stripe Payment Links for card payments and deposits.
2. PayPal invoices for clients who prefer PayPal or need a familiar invoice workflow.
3. Wise Business payment links or account details for international transfers where card fees or currency conversion matter.
4. Bank transfer or mobile money only when the client and operator have a clear receipt trail.

## Stripe

Use Stripe Payment Links for standard deposits, card payments, and repeatable packages. Stripe says Payment Links can create a payment page in a few clicks and be shared without code:

- https://docs.stripe.com/payment-links
- https://docs.stripe.com/payment-links/create

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

## PayPal

Use PayPal invoices when the client prefers PayPal or when a formal invoice link is easier to share. PayPal documents creating invoices from `Pay & Get Paid > Create an Invoice`, and PayPal invoice links can be copied and shared by email, text, or messaging app:

- https://www.paypal.com/us/cshelp/article/how-do-i-create-and-send-an-invoice-help319
- https://developer.paypal.com/docs/invoicing/

In the admin desk, paste the invoice link into `Payment link` and mention PayPal in the client update.

## Wise

Use Wise when a diaspora client wants international transfer, local account details, or lower-friction multi-currency handling. Wise documents Business payment links and payment requests:

- https://wise.com/help/articles/4qr3kkvIQlHNiD8BegEB4u/getting-paid-to-your-wise-business-by-payment-link
- https://wise.com/us/business/receive-money

Use Wise for larger site visits, supplier deposits, or monthly retainers where bank-style settlement may be preferred.

## Operating Rules

- Do not hold client construction or family-support funds as an informal escrow.
- Keep payment links HTTP/HTTPS only; Supabase rejects unsafe links.
- Mark `Payment` as `Invoice sent` when a link is issued, `Deposit paid` when partial payment is confirmed, and `Paid` only when the agreed amount is cleared.
- Send quote/payment messages from the admin `Copy quote` template so every client receives the same safety and scope wording.
- Record operator payout, field costs, and payment fees in admin before marking a job profitable; the founder margin should stay visible on every quoted request.
- Do not assign a job to a receiver partner until their application is reviewed and marked `Vetted` in admin.
- Store receipts, payment screenshots, or processor confirmations in the proof/report pack, not in public tracking text.
- For refunds, update `Payment` to `Refunded` and add a short internal note explaining the reason, amount, and date.
