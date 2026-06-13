# Swadakta Founder Evidence Register

Last updated: June 13, 2026

This register defines the proof required before any owner-only readiness flag or Africa expansion payment flag can be set to `true` in Vercel. It is an operating control, not legal advice.

## Evidence Rules

- Keep every flag `false` until the evidence exists outside chat, screenshots, and memory.
- Store proof in a private founder evidence folder, provider dashboard, signed document, or adviser email. Do not commit private IDs, policies, tax records, provider keys, receipts, or customer data to this repo.
- Provider dashboards and signed provider webhooks are the authority for money and ID evidence. AI, users, screenshots, and unsourced notes cannot approve ID, mark funds paid, release funds, or clear disputes.
- A Vercel flag is only a mirror of the evidence. If evidence is missing, unclear, expired, or belongs to the wrong legal entity, set the flag back to `false`.
- Treat any OpenAI, Supabase, Vercel, payment, identity, email, or webhook key pasted into chat, browser fields, screenshots, or support tools as exposed. Revoke or rotate it before paid launch, even if it was never committed to Git.
- High-value property, construction, title, vehicle, supplier-deposit, legal, medical, immigration, restricted-goods, or sensitive-funds jobs stay blocked until a lawyer or regulated provider confirms the operating path.
- Official government/provider dashboards are the evidence source for registration, privacy, AUSTRAC, ID, payment, and M-Pesa setup. Third-party emails, unofficial letters, screenshots without dashboard context, and AI summaries are not enough to set owner flags true.

## Owner Launch Flags

| Flag | Evidence required before `true` | Who confirms | Where evidence lives | References | Do not set true if |
| --- | --- | --- | --- | --- | --- |
| `SWADAKTA_OWNER_BUSINESS_REGISTERED` | Chosen legal home, ABN/company or local entity record where required, Swadakta trading/business-name record where required, and owner note naming the operating entity used for provider accounts. | Founder, accountant, or business registration adviser | Private registration folder and provider onboarding records | `AU_REG`, `ABN`, `ASIC_NAME`, `BRS` | The entity is not chosen, records are personal-only when business onboarding is needed, or Swadakta is trading under an unregistered required name. |
| `SWADAKTA_OWNER_TAX_REVIEWED` | Accountant/tax adviser note covering GST or local tax position, income records, provider fees, refunds, contractor payments, cross-border income, and founder margin records. | Accountant or tax adviser | Private tax folder | `ATO_GST`, `KRA_PIN` | Tax treatment is guessed, GST/local obligations are unknown, or paid jobs rely on undocumented personal records. |
| `SWADAKTA_OWNER_INSURANCE_ACTIVE` | Active policy schedule or broker confirmation for public liability, professional indemnity/errors and omissions, cyber/privacy, equipment, and goods/courier cover where the job type needs it. Exclusions are saved. | Founder and insurance broker | Private insurance folder | `AU_INSURANCE` | Cover is only quoted, excludes the intended work, has expired, or the job type needs goods-in-transit/courier cover that is missing. |
| `SWADAKTA_OWNER_LEGAL_REVIEWED` | Reviewed terms, privacy, refunds/disputes, service limits, consumer guarantee wording, receiver agreement, prohibited-goods wording, payment wording, and AI/protected-action boundaries. | Lawyer or qualified compliance adviser | Private legal folder and live `/terms` `/privacy` change record | `ACCC_REMEDIES`, `FAIR_WORK_CONTRACTORS`, `EMPLOYEE_CONTRACTOR` | The public site promises escrow, remittance, legal/customs/tax advice, guaranteed delivery, or unrestricted high-risk jobs without reviewed wording. |
| `SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED` | Written legal/compliance position confirming Swadakta stays inside provider-held funds and concierge/marketplace boundaries, or confirming any required AFSL, remittance, escrow, stored-value, or trust-money path. | Lawyer or financial-services compliance adviser | Private financial-services folder | `AUSTRAC_REMITTANCE`, `ASIC_AFSL` | Swadakta holds, pools, transfers, remits, stores, or releases client money directly without a confirmed regulated route. |
| `SWADAKTA_OWNER_CONTRACTOR_TERMS_READY` | Receiver/contractor agreement, code of conduct, proof standards, safety rules, tax responsibility, insurance responsibility, payment timing, dispute path, and country/corridor availability rules. | Lawyer or founder after adviser review | Private contractor folder and receiver onboarding pack | `FAIR_WORK_CONTRACTORS`, `EMPLOYEE_CONTRACTOR` | Receivers look like employees, proof obligations are vague, safety rules are missing, or payment timing conflicts with provider evidence gates. |
| `SWADAKTA_OWNER_PRIVACY_REVIEWED` | Privacy policy, consent wording, ID/media retention rules, deletion/access process, role-based access, data breach process, Kenya/Australia data obligations, and provider data-processing records. | Privacy adviser or lawyer | Private privacy folder and live policy change record | `OAIC_SMALL_BUSINESS`, `ODPC` | ID documents, addresses, family contacts, payment references, or proof media are collected without retention/access controls. |
| `SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED` | Stripe, PayPal, Wise fallback, Sumsub or chosen ID provider, Supabase, Vercel, OpenAI, and corridor payment provider accounts are approved under the right entity where possible. Dashboard screenshots may prove approval but must not include secrets. | Founder | Private provider folder and provider dashboards | `STRIPE_LINKS`, `STRIPE_WEBHOOKS`, `PAYPAL_WEBHOOKS`, `SUMSUB_WEBSDK`, `WISE_DOCS`, `DARAJA` | A provider is still pending, personal-only where business approval is needed, missing settlement route, or missing webhook/evidence configuration. |
| `SWADAKTA_OWNER_AUTH_EMAIL_DELIVERABILITY_REVIEWED` | Supabase Auth Site URL and Redirect URLs point to `https://swadakta.com`, email confirmation/password-reset templates use production links, custom SMTP or reviewed sender is configured, the default Supabase SMTP is not relied on for public launch, sending domain has SPF/DKIM/DMARC evidence, link tracking does not rewrite auth links, and one confirmation plus one password-reset email have been tested from a normal user account. | Founder or Supabase/email admin | Private auth/email evidence folder and Supabase/email-provider dashboards | `SUPABASE_REDIRECTS`, `SUPABASE_SMTP`, `EMAIL_DOMAIN_AUTH` | Emails still point to localhost, sender is the default/unreviewed setup for public launch, SPF/DKIM/DMARC is missing, link tracking rewrites Supabase auth links, or reset/confirmation links fail in Chrome. |
| `SWADAKTA_OWNER_LEAKED_PASSWORD_PROTECTION_ENABLED` | Supabase Auth leaked-password protection is enabled in the production dashboard, security advisors show no remaining auth warning for it, one normal password sign-in still works after the change, and one controlled test proves a known leaked password is rejected. | Founder or Supabase admin | Supabase Auth settings, security-advisor evidence, and private auth-test note | `SUPABASE_PASSWORD_SECURITY` | The setting is disabled, only enabled on a non-production project, sign-in has not been tested after the change, or no rejected leaked-password test has been saved. |
| `SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED` | Any key pasted into chat, browser, email, screenshots, or local files has been revoked or rotated. Fresh values exist only in Vercel/Supabase/provider secret stores. `scripts/secret-scan.mjs` passes after rotation. | Founder or technical owner | Private security log and provider dashboards | `VERCEL_ENV`, `SUPABASE_SECRETS` | Any live secret remains exposed, committed, reused after exposure, or stored in browser-visible JavaScript. |
| `SWADAKTA_OWNER_KENYA_SETUP_REVIEWED` | Adviser/provider confirmation for Kenya registration/tax/ODPC needs, local receiver contracts, Safaricom/M-Pesa eligibility, KRA setup if needed, and Kenya record-keeping before Kenya payments or local operations scale. | Founder, Kenya accountant/lawyer, or provider onboarding team | Private Kenya operations folder | `BRS`, `KRA_PIN`, `ODPC`, `DARAJA` | Kenya operations are treated as covered by Australia-only setup, M-Pesa is live without approval, or ODPC/tax duties are unknown. |
| `SWADAKTA_OWNER_FIRST_PAID_PILOT_PASSED` | Completed low-value friendly-client pilot with account, brief, ID handoff/evidence, quote, provider payment evidence, vetted receiver, proof plan, tracking, final report, review, and no unresolved dispute. | Founder | Pilot evidence folder and saved Swadakta request record | `PILOT_SCRIPT` | Anything felt improvised, payment/ID/proof records are incomplete, receiver was not vetted, or any dispute/refund remains unresolved. |
| `SWADAKTA_OWNER_REGULATED_ESCROW_READY` | Regulated escrow/provider-held funds agreement or written legal confirmation for high-value/sensitive-funds operating model, including milestone authority, dispute path, refunds, and release controls. | Lawyer or regulated provider | Private escrow/financial-services folder | `ASIC_AFSL`, `AUSTRAC_REMITTANCE` | Swadakta is relying on informal escrow, personal accounts, manual trust, or AI/admin discretion to hold or release high-value funds. |

## Africa Expansion Payment Flags

| Flag | Evidence required before `true` | Who confirms | Where evidence lives | References | Do not set true if |
| --- | --- | --- | --- | --- | --- |
| `PAYSTACK_MERCHANT_APPROVED` | Paystack merchant account is approved for the chosen legal entity, target countries, settlement account, and currencies. | Founder and Paystack dashboard/onboarding | Private Paystack folder and dashboard | `PAYSTACK_WEBHOOKS`, `PAYSTACK_VERIFY` | Account is pending, settlement country/currency is unknown, or approval belongs to the wrong entity. |
| `PAYSTACK_WEBHOOK_ENDPOINT_READY` | `https://swadakta.com/api/payments/paystack-webhook` is configured in Paystack, publicly reachable, signature verification is configured, and a sandbox/live test returns the expected HTTP status. | Technical owner | Provider dashboard and webhook test log | `PAYSTACK_WEBHOOKS` | The endpoint is localhost-only, signature header is not verified, callback retries fail, or no test event has been observed. |
| `PAYSTACK_PROVIDER_EVIDENCE_MAPPED` | Server-side transaction verification maps provider reference, amount, currency, status, customer, and Swadakta request code before funds count as protected. | Technical owner and founder | Test request record, provider dashboard, and reconciliation notes | `PAYSTACK_VERIFY`, `PAYSTACK_WEBHOOKS` | A webhook alone marks funds paid, amount/currency/request code are not matched, or receiver release can happen automatically. |
| `FLUTTERWAVE_MERCHANT_APPROVED` | Flutterwave merchant account is approved for the chosen legal entity, target countries, settlement account, and currencies. | Founder and Flutterwave dashboard/onboarding | Private Flutterwave folder and dashboard | `FLUTTERWAVE_WEBHOOKS` | Account is pending, settlement country/currency is unknown, or approval belongs to the wrong entity. |
| `FLUTTERWAVE_WEBHOOK_ENDPOINT_READY` | `https://swadakta.com/api/payments/flutterwave-webhook` is configured in Flutterwave, publicly reachable, `flutterwave-signature` or legacy approved hash path is configured, and a test event is observed. | Technical owner | Provider dashboard and webhook test log | `FLUTTERWAVE_WEBHOOKS` | The endpoint is localhost-only, signature/hash verification is not configured, response is not fast/2xx, or no test event has been observed. |
| `FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED` | Server-side transaction verification or provider lookup confirms status, amount, currency, reference, customer, and Swadakta request code before funds count as protected. | Technical owner and founder | Test request record, provider dashboard, and reconciliation notes | `FLUTTERWAVE_WEBHOOKS` | A webhook alone marks funds paid, amount/currency/request code are not matched, or receiver release can happen automatically. |

## Reference Directory

- `AU_REG`: https://business.gov.au/registrations
- `ABN`: https://www.abr.gov.au/business-super-funds-charities/applying-abn
- `ASIC_NAME`: https://www.asic.gov.au/for-business-and-companies/business-names/register-a-business-name/
- `ATO_GST`: https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst
- `AUSTRAC_REMITTANCE`: https://www.austrac.gov.au/enrol-and-register-remittance
- `ASIC_AFSL`: https://www.asic.gov.au/for-finance-professionals/afs-licensees/do-you-need-an-afs-licence/
- `AU_INSURANCE`: https://business.gov.au/risk-management/insurance/types-of-business-insurance
- `ACCC_REMEDIES`: https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought
- `FAIR_WORK_CONTRACTORS`: https://www.fairwork.gov.au/find-help-for/independent-contractors
- `EMPLOYEE_CONTRACTOR`: https://business.gov.au/people/contractors/employee-or-contractor
- `OAIC_SMALL_BUSINESS`: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business
- `BRS`: https://brs.go.ke/
- `KRA_PIN`: https://www.kra.go.ke/business/companies-partnerships/companies-partnerships-pin-taxes/companies-partnerships-pin-registration
- `ODPC`: https://www.odpc.go.ke/
- `DARAJA`: https://developer.safaricom.co.ke/
- `STRIPE_LINKS`: https://docs.stripe.com/payment-links
- `STRIPE_WEBHOOKS`: https://docs.stripe.com/webhooks/signature
- `PAYPAL_WEBHOOKS`: https://developer.paypal.com/api/rest/webhooks/
- `SUMSUB_WEBSDK`: https://docs.sumsub.com/reference/generate-websdk-external-link
- `WISE_DOCS`: https://docs.wise.com/guides
- `PAYSTACK_WEBHOOKS`: https://paystack.com/docs/payments/webhooks/
- `PAYSTACK_VERIFY`: https://paystack.com/docs/payments/verify-payments/
- `FLUTTERWAVE_WEBHOOKS`: https://developer.flutterwave.com/docs/webhooks
- `VERCEL_ENV`: https://vercel.com/docs/environment-variables
- `SUPABASE_SECRETS`: https://supabase.com/docs/guides/functions/secrets
- `SUPABASE_REDIRECTS`: https://supabase.com/docs/guides/auth/redirect-urls
- `SUPABASE_SMTP`: https://supabase.com/docs/guides/auth/auth-smtp
- `SUPABASE_PASSWORD_SECURITY`: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- `EMAIL_DOMAIN_AUTH`: https://supabase.com/docs/guides/auth/auth-smtp
- `PILOT_SCRIPT`: PILOT_TEST_SCRIPT.md

## Review Rhythm

- Before each demo or paid pilot, run `scripts/check-founder-evidence.mjs` and `scripts/deployment-state.mjs`.
- After an owner flag changes in Vercel, save the evidence note with date, confirmer, dashboard/adviser source, and exact flag name.
- Review this register whenever Swadakta adds a new country, provider, high-risk service, payment rail, ID provider, receiver class, or AI-protected action.
