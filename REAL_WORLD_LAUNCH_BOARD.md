# Swadakta Real-World Launch Board

Last updated: June 13, 2026

This is the founder-side action board for turning Swadakta from a working website into a real operating business. Treat it as the checklist to work through in Chrome with the provider dashboards open.

Use [FOUNDER_EVIDENCE_REGISTER.md](FOUNDER_EVIDENCE_REGISTER.md) as the evidence standard before any launch flag is set to `true`. A dashboard flag should never be ahead of the private proof folder, provider dashboard, or adviser confirmation.

## Launch Stance

Launch Swadakta as a quote-first verified concierge marketplace.

Do not describe Swadakta as a bank, remittance company, licensed escrow company, law firm, customs broker, immigration adviser, tax adviser, or guaranteed courier. The app can track funds, milestones, proof, and release decisions, but money should stay inside licensed provider rails unless a lawyer confirms that Swadakta can hold or move money directly.

Best first paid offer:

- Low-value errands, site checks, family support runs, document collection support, sourcing checks, and virtual assistant work.
- No high-value land, title, construction, vehicle, medical, legal, immigration, or restricted-goods work until the legal and insurance setup is reviewed.
- Every paid job needs written scope, provider payment evidence, ID verification, proof requirements, and a dispute/refund path.
- Receiver selection and work permission are separate. A vetted receiver can be selected after a controlled offer is accepted, but work must stay locked until protected funds, route, compliance, and sensitive-document checks are clear.

## Founder Decisions To Make First

1. Choose the first legal home.
   - Australia-first is clean if the founder is operating from Australia and collecting global clients.
   - Kenya setup is still needed once Kenyan receivers, M-Pesa, local contracting, or Kenya operating records become serious.

2. Choose the first launch corridor.
   - Recommended first: Australia to Kenya and Kenya in-country errands.
   - Keep wider Africa, USA, Europe, and China active as pilot corridors, but founder-approved until receivers, payment rails, compliance, and proof standards are proven.

3. Choose the first payment posture.
   - Stripe/PayPal for global client deposits where supported.
   - M-Pesa for Kenya KES only after Safaricom/Daraja business approval.
   - Wise hidden as admin fallback, not a public default.
   - True escrow only through a regulated escrow/payment provider or after legal advice.

4. Choose the first ID verification posture.
   - Sumsub for global users.
   - Smile ID for Africa-first coverage.
   - Manual review only as a rare exception when the provider cannot support the document/country.

## Real-Life Setup Checklist

### 1. Register and Structure

- Apply for or confirm the right business structure and ABN if operating from Australia.
- Register the Swadakta business name if trading under that name.
- Decide whether a Kenyan business, KRA setup, ODPC registration, or local contracts are required before Kenyan operations scale.

Official starting points:

- Australia business registrations: https://business.gov.au/registrations
- ABN application: https://www.abr.gov.au/business-super-funds-charities/applying-abn
- ASIC business name registration: https://www.asic.gov.au/for-business-and-companies/business-names/register-a-business-name/
- Kenya BRS: https://brs.go.ke/
- Kenya KRA business PIN/tax registration: https://www.kra.go.ke/business/companies-partnerships/companies-partnerships-pin-taxes/companies-partnerships-pin-registration

### 2. Get Legal and Tax Review

Ask a lawyer/accountant to review:

- Whether Swadakta can hold client funds, or whether all money must stay in Stripe/PayPal/M-Pesa/escrow provider accounts.
- Whether any part of the model becomes remittance, financial services, stored value, escrow, trust money, or payment facilitation.
- GST, income tax, contractor payments, refunds, international income, record keeping, and provider fees.
- Terms, privacy, refund/dispute wording, receiver agreement, prohibited-goods rules, and service limitations.

Useful references:

- AUSTRAC remittance registration: https://www.austrac.gov.au/enrol-and-register-remittance
- ASIC AFS licence guidance: https://www.asic.gov.au/for-finance-professionals/afs-licensees/do-you-need-an-afs-licence/
- ATO GST registration: https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst
- ACCC consumer service remedies: https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought

### 3. Buy Insurance Before Field Jobs

Ask a broker for cover that matches the actual work:

- Public liability.
- Professional indemnity or errors and omissions.
- Cyber/privacy liability.
- Goods-in-transit or courier cover if Swadakta touches physical goods.
- Equipment cover if receivers use phones/cameras/laptops for work.

Reference:

- Business insurance types: https://business.gov.au/risk-management/insurance/types-of-business-insurance

### 4. Open Provider Accounts

Open each account under the chosen legal entity where possible.

Payments:

- Stripe for card checkout/payment links: https://dashboard.stripe.com/register
- Stripe Payment Links: https://docs.stripe.com/payment-links
- PayPal developer/business setup: https://developer.paypal.com/docs/checkout/
- Safaricom Daraja/M-Pesa: https://developer.safaricom.co.ke/
- Wise Business fallback: https://wise.com/business/

ID verification:

- Sumsub global KYC: https://sumsub.com/
- Sumsub WebSDK external links: https://docs.sumsub.com/reference/generate-websdk-external-link
- Smile ID Africa KYC: https://smile.id/
- Smile ID docs: https://docs.usesmileid.com/

Privacy and data:

- Australian privacy guidance: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business
- Kenya ODPC: https://www.odpc.go.ke/

### 5. Configure The Site

Only after provider accounts are approved, add real secrets to Vercel/Supabase dashboards, never to code or chat.

Priority environment variables:

- `PUBLIC_BASE_URL=https://swadakta.com`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `SUMSUB_APP_TOKEN`
- `SUMSUB_SECRET_KEY`
- `SUMSUB_LEVEL_NAME`
- `SUMSUB_WEBHOOK_SECRET`

Later or corridor-specific:

- `SMILE_ID_API_KEY`
- `SMILE_ID_PARTNER_ID`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `WISE_PAYMENT_LINK_URL`
- `WISE_PAYMENT_REQUEST_URL`

## First Paid Pilot Rule

Run one low-value job before public marketing.

The pilot passes only if:

- Client can create/sign in to an account.
- Client can submit a brief.
- Identity handoff creates a provider reference or queued verification.
- Admin can quote.
- Client pays through a provider or a documented fallback.
- Payment evidence can be reconciled to request code, amount, and currency.
- Receiver is verified/vetted before offer acceptance can select them.
- One verified account can support both client and job-seeker use. Provider ID evidence can sync to a matching receiver application, but Swadakta still separately vets the receiver before they can take paid work.
- Active work cannot start unless the request has assigned receiver, protected amount, paid/deposit-paid status, provider-held/confirmed funds state, safe route, and cleared compliance/admin review.
- Receiver submits proof.
- Milestones can be updated without automatically releasing money.
- Client can track the job and receive a final report.

Use `PILOT_TEST_SCRIPT.md` for the exact rehearsal.

After this passes, set `SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED=true` in Vercel only if the proof, payment, identity, tracking, and closeout records are complete. Leave it false if anything felt improvised.

High-value property, title, construction, supplier-deposit, or sensitive-funds jobs stay blocked until a regulated escrow/provider-held funds route or written legal confirmation exists. Set `SWADAKTA_OWNER_REGULATED_ESCROW_READY=true` only after that route is real, documented, and usable.

Run `scripts/check-founder-evidence.mjs` before changing either flag so the register still covers the current owner and provider readiness gates.

## What The Founder Must Not Skip

- Do not take high-value jobs before legal/insurance review.
- Do not accept restricted goods, medicines, food, batteries, weapons, live plants/animals, valuables, or customs-sensitive parcels without official carrier/customs checks.
- Do not let AI approve IDs, mark funds paid, release/refund money, assign receivers, or make legal/customs promises.
- Do not put provider secrets in the repo, browser-visible JavaScript, screenshots, email, WhatsApp, or chat.
- Do not pay receivers from unverified receipts.
- Do not let a receiver work before ID verification, proof plan, scope, and payment evidence are clear.

## Chrome Work Session Order

Open these tabs and work through them in order:

1. Vercel deployments and environment variables.
2. Supabase Auth URL configuration and database policies.
3. Swadakta admin readiness.
4. Stripe account and webhook setup.
5. PayPal developer app setup.
6. Sumsub verification level and webhook setup.
7. Smile ID account/coverage review.
8. Safaricom Daraja account setup after Kenya business details are ready.
9. Business registration, tax, insurance, legal/privacy references.

The product can keep improving while these are handled, but public paid launch should wait until the first paid pilot passes and the owner-only legal/insurance/payment flags are true.
