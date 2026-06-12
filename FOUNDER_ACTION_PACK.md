# Swadakta Founder Action Pack

This is the real-world setup checklist for making Swadakta usable as a paid service. The website can run the workflow, but the founder must complete these items before scaling paid jobs.

## Launch Position

Use Swadakta first as a quote-first concierge and verified-operator marketplace. Do not market it as a bank, remittance provider, legal service, customs broker, licensed escrow service, or guaranteed delivery company.

The safe launch rule is simple: show the live site now, collect non-sensitive pilot interest, and take only low-value paid jobs after legal, insurance, payment-evidence, and ID-verification gates are ready.

## 1. Legal Home

- Choose the first operating legal home: Australia first, Kenya first, or both.
- If Australia-first, start with ABN/business registration guidance and ASIC business-name setup:
  - https://business.gov.au/registrations
  - https://www.abr.gov.au/business-super-funds-charities/applying-abn
  - https://www.asic.gov.au/for-business-and-companies/business-names/register-a-business-name/
- If Kenya will collect payments, contract local receivers, or hold local operating records, review BRS/KRA/ODPC/Safaricom setup:
  - https://brs.go.ke/
  - https://www.kra.go.ke/business/companies-partnerships/companies-partnerships-pin-taxes/companies-partnerships-pin-registration
  - https://www.odpc.go.ke/
  - https://developer.safaricom.co.ke/

When done, set `SWADAKTA_OWNER_BUSINESS_REGISTERED=true` and `SWADAKTA_OWNER_KENYA_SETUP_REVIEWED=true` in Vercel only if those statements are genuinely true.

## 2. Tax, Insurance, and Legal Review

- Ask an accountant to confirm GST position, income-tax record keeping, contractor payment records, refunds, provider fees, and founder margin tracking:
  - https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst
- Buy insurance before real field jobs: public liability, professional indemnity/errors and omissions, cyber/privacy, equipment, and any courier/goods-in-transit cover that matches the work:
  - https://business.gov.au/risk-management/insurance/types-of-business-insurance
- Have terms, privacy, refund/dispute wording, receiver agreement, prohibited goods rules, and payment wording reviewed:
  - https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought
  - https://www.fairwork.gov.au/find-help-for/independent-contractors
  - https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business
- Get legal/compliance advice before holding or moving client money outside regulated provider rails:
  - https://www.austrac.gov.au/enrol-and-register-remittance
  - https://www.asic.gov.au/for-finance-professionals/afs-licensees/do-you-need-an-afs-licence/

Do not set the owner flags to `true` until advice or cover is actually in place.

## 3. Provider Accounts

Open provider accounts under the chosen legal entity, not as random personal accounts where avoidable.

- Stripe for card checkout and payment links:
  - https://dashboard.stripe.com/register
  - https://docs.stripe.com/payment-links
  - Webhook URL: `https://swadakta.com/api/payments/stripe-webhook`
- PayPal Business as a client payment backup:
  - https://developer.paypal.com/home/
  - https://www.paypal.com/ke/business
- Sumsub for global ID verification:
  - https://sumsub.com/
  - https://docs.sumsub.com/reference/generate-websdk-external-link
  - Webhook URL: `https://swadakta.com/api/identity/sumsub-webhook`
- Safaricom Daraja/M-Pesa after Kenya setup:
  - https://developer.safaricom.co.ke/
  - Callback URL: `https://swadakta.com/api/payments/mpesa-callback`
- Wise Business as hidden fallback only, not a public default:
  - https://wise.com/business/

Secrets belong only in Vercel or Supabase secrets. Do not paste live API keys into chat, email, docs, screenshots, client pages, or repo files.

## 4. First Paid Pilot

Accept only jobs that are clear, legal, low-value, and easy to prove. Before work begins, each paid pilot should have:

- client account created
- client ID consent recorded
- receiver/operator ID verified where needed
- written scope
- legal/restricted-goods check
- quote and service fee recorded
- provider payment link or checkout
- provider evidence recorded before work starts
- milestone release conditions
- proof plan
- final report/review path

AI can draft, sort, summarize, and prompt admin decisions. AI must not approve ID, mark money as paid, release/refund funds, assign a receiver, or make legal/customs promises.

## 5. Daily Founder Rhythm

- Open `https://swadakta.com/admin-readiness` before demos or paid work.
- Copy the founder pack and provider pack from the readiness page.
- Fix missing items in the order shown.
- Run a low-value test for each provider before exposing it publicly.
- Keep Paystack/Flutterwave as expansion rails until merchant approval, settlement currencies, webhooks, and provider-evidence mapping are confirmed.
