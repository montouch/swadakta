# Swadakta Launch Runbook

This is the practical go-live checklist for turning the current MVP into a paid operating service.

For the owner-only real-world setup sequence, use [FOUNDER_ACTION_PACK.md](FOUNDER_ACTION_PACK.md), then rehearse the first paid job with [PILOT_TEST_SCRIPT.md](PILOT_TEST_SCRIPT.md) alongside the live admin readiness page at `https://swadakta.com/admin-readiness`.

## 0. Launch Mode and Owner-Only Actions

Launch Swadakta first as a quote-first concierge/marketplace pilot, not as a bank, remittance business, law firm, or unlicensed escrow provider. The app can collect requests, create accounts, run ID-verification handoff, prepare quotes, track proof, and show provider-held payment status. It should not publicly promise licensed escrow, money transfer, legal advice, tax advice, immigration advice, customs brokerage, or guaranteed delivery until those licences/providers are in place.

### What Codex/product can drive

- Keep the website, workflow, account home, AI helper, admin tools, tracking, proof, and launch checks working.
- Keep protected actions gated: AI can draft and triage, but cannot verify ID, release/refund money, assign paid work, mark funds paid, or send external messages by itself.
- Keep AI optional. When AI mode is off, Swadakta must hide AI-only shortcuts and keep the manual queues, provider checks, verification flow, messages, tracking, and payments usable.
- Keep Stripe, PayPal, Wise fallback, M-Pesa/Daraja, Paystack, and Flutterwave code paths provider-ready without exposing unfinished rails as public defaults.
- Keep public pages client-safe: quotes show scope, service fee, payment rail, proof, release conditions, and protected-funds boundaries without exposing founder economics.
- Keep the receiver offer market controlled: job seekers can compete on eligible jobs, accepted offers can auto-select an already vetted/verified receiver, and work still cannot start until protected funds, route, compliance, and milestone controls are clear.
- Keep testing scripts and browser audits current before every deploy.

### What the owner must do before public paid launch

- Choose the legal home of the business. If operating from Australia, start with an ABN and business structure decision; register the business name if trading as Swadakta. Official Australian registration guidance starts at business.gov.au and the Business Registration Service: https://business.gov.au/registrations and https://register.business.gov.au/
- Get accounting/tax advice on GST, income tax, record keeping, contractor payments, cross-border income, and whether/when GST registration applies. Business.gov.au and the ATO explain GST registration here: https://business.gov.au/registrations/register-for-taxes/register-for-goods-and-services-tax-gst and https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst
- Get legal advice on whether any part of the operating model becomes a regulated financial service, non-cash payment facility, remittance service, or escrow/trust-money service. If Swadakta starts transferring money for clients rather than using regulated payment providers, AUSTRAC/ASIC advice is required before launch. AUSTRAC says remittance providers must register, and ASIC says financial-services businesses generally need AFS authorisation: https://www.austrac.gov.au/enrol-and-register-remittance and https://www.asic.gov.au/for-finance-professionals/afs-licensees/do-you-need-an-afs-licence/
- Buy insurance before taking real paid field jobs: public liability, professional indemnity/errors and omissions, cyber/privacy, business equipment, and any courier/goods-in-transit cover that matches the actual tasks. Business.gov.au explains business insurance types here: https://business.gov.au/risk-management/insurance/types-of-business-insurance
- Have the terms, privacy policy, refund/dispute wording, contractor agreement, receiver code of conduct, and payment wording reviewed. Australian consumer-law guidance says services must meet consumer guarantees and remedies can include repair, replacement, refund, cancellation, or compensation depending on the problem: https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought
- Decide how receivers are engaged. If using contractors, document scope, independence, tax responsibility, insurance, proof obligations, safety rules, and payment timing. Fair Work explains that contractors are different from employees, and business.gov.au recommends checking employee-vs-contractor obligations: https://www.fairwork.gov.au/find-help-for/independent-contractors and https://business.gov.au/people/contractors/employee-or-contractor
- Treat privacy as launch-critical because the app handles identity documents, photos, addresses, family contacts, payment references, and proof media. OAIC has a small-business privacy checklist, and Kenya's ODPC is the official data-protection regulator for Kenya: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business and https://www.odpc.go.ke/
- For Kenya operations, decide whether Swadakta needs a Kenyan company/business registration, KRA PIN/tax setup, ODPC data-controller/processor registration, and Safaricom/M-Pesa business approval. Official starting points: BRS https://brs.go.ke/, KRA PIN registration https://www.kra.go.ke/business/companies-partnerships/companies-partnerships-pin-taxes/companies-partnerships-pin-registration, ODPC https://www.odpc.go.ke/, and Safaricom Daraja https://developer.safaricom.co.ke/
- Open and verify the provider accounts under the chosen legal entity: Stripe, PayPal Business, Wise Business fallback, ID verification provider, Supabase, Vercel, OpenAI, and later M-Pesa/Daraja, Paystack, or Flutterwave.
- Rotate any secret key that was ever pasted into chat or a browser field, then add the new value only as a Vercel/Supabase server-side secret.
- Run `scripts/secret-scan.mjs` before every paid launch/demo deploy. It scans committed and unignored local files for high-confidence OpenAI, Stripe, Paystack, Flutterwave, GitHub, JWT/service-role, private-key, and sensitive env assignment leaks. If it fails, remove the value and rotate the exposed key before continuing.

The admin readiness cockpit also tracks these owner-only steps as non-secret Vercel flags. Leave each flag `false` until the step is genuinely complete, then set it to `true`: `SWADAKTA_OWNER_BUSINESS_REGISTERED`, `SWADAKTA_OWNER_TAX_REVIEWED`, `SWADAKTA_OWNER_INSURANCE_ACTIVE`, `SWADAKTA_OWNER_LEGAL_REVIEWED`, `SWADAKTA_OWNER_FINANCIAL_SERVICES_REVIEWED`, `SWADAKTA_OWNER_CONTRACTOR_TERMS_READY`, `SWADAKTA_OWNER_PRIVACY_REVIEWED`, `SWADAKTA_OWNER_PROVIDER_ACCOUNTS_APPROVED`, `SWADAKTA_OWNER_SECRET_ROTATION_CONFIRMED`, and `SWADAKTA_OWNER_KENYA_SETUP_REVIEWED`.

Africa expansion payment rails have their own non-secret readiness flags. Keep `PAYSTACK_MERCHANT_APPROVED`, `PAYSTACK_WEBHOOK_ENDPOINT_READY`, `PAYSTACK_PROVIDER_EVIDENCE_MAPPED`, `FLUTTERWAVE_MERCHANT_APPROVED`, `FLUTTERWAVE_WEBHOOK_ENDPOINT_READY`, and `FLUTTERWAVE_PROVIDER_EVIDENCE_MAPPED` set to `false` until merchant approval, settlement currencies, webhook signature checks, and server-side transaction evidence mapping are actually tested.

### Practical public-launch rule

Until the owner-only steps above are complete, Swadakta can be shown as a live pilot and can collect non-sensitive test requests. Real paid jobs should stay founder-approved, provider-paid, ID-gated, and low-value, with written scope and no informal escrow.

## 1. Domain and Vercel

- `swadakta.com` is purchased in Cloudflare under `swadakta111@gmail.com`.
- Vercel project `swadakta` is live and connected to GitHub repo `montouch/swadakta`.
- Vercel auto-deploys new pushes to `main`.
- `swadakta.com` and `www.swadakta.com` are valid in Vercel.
- `www.swadakta.com` redirects to the apex domain through `vercel.json`.
- Cloudflare Domain Connect added the current Vercel DNS and verification records. If DNS is ever reset, follow the exact records Vercel shows in the project Domains screen. Vercel's docs explain that the dashboard displays required DNS values after the domain is added: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Remember Vercel does not provide email hosting. Add MX records through Google Workspace, Microsoft 365, Zoho, or another email host if you want addresses like `hello@swadakta.com`: https://vercel.com/docs/domains/managing-dns-records
- After DNS settles, verify:
  - `https://swadakta.com/`
  - `https://swadakta.com/portal`
  - `https://swadakta.com/privacy`
  - `https://swadakta.com/terms`
  - `https://swadakta.com/sitemap.xml`
  - `https://swadakta.com/.well-known/security.txt`
- See [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) for the latest local/Vercel project status.

## 2. Supabase Auth URL Configuration

These hosted Supabase settings are required for Supabase Auth emails and OAuth redirects to leave local development and open the live app:

- Auth Site URL: `https://swadakta.com`
- Auth Redirect URLs: `https://swadakta.com/**`
- URL configuration page: `https://supabase.com/dashboard/project/srwkoulknropnwwyqslj/auth/url-configuration`
- If an auth email contains `redirect_to=http://localhost:3000`, the Supabase Auth URL configuration has drifted or the email was sent before the setting changed. Send a fresh email after correcting the setting.

## 3. Payments

Start with quote-based payment links, then automate later.

### Provider accounts to open now

- Stripe: create/verify the business account, then add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to Vercel. Webhook URL: `https://swadakta.com/api/payments/stripe-webhook`.
- PayPal Business: create a REST app, then add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_ENVIRONMENT` to Vercel.
- Safaricom Daraja/M-Pesa: complete Kenya business setup first, create/approve the Daraja app, then add `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, and eventually `MPESA_ENVIRONMENT=live`. Callback URL: `https://swadakta.com/api/payments/mpesa-callback`.
- Paystack and Flutterwave: open only as Africa expansion merchant accounts. Keep them hidden until merchant approval, settlement currencies, webhook signature checks, and provider-evidence mapping have all been tested.
- Wise Business: open as fallback only, not the public default rail. Add `WISE_PAYMENT_LINK_URL` or `WISE_PAYMENT_REQUEST_URL` only after the account is approved and you are ready to manually reconcile receipts.

- Stripe Payment Links are a strong launch fit because Stripe says they can be created without code and shared with clients: https://docs.stripe.com/payment-links
- Create reusable Stripe links for common deposits:
  - Quick errand deposit
  - Site visit deposit
  - Registry/document errand deposit
  - Family support run deposit
  - Virtual assistant monthly retainer
  - Business operations support retainer
- Keep custom quote jobs as one-off payment links until pricing stabilizes.
- Add PayPal Business as a backup option for clients who prefer PayPal or cards through PayPal. PayPal's Kenya business page describes online payments for businesses: https://www.paypal.com/ke/business
- Keep bank transfer available for clients who need transfer rails; keep Wise hidden as an admin fallback after simpler payment routes are unsuitable or fail.
- Never request card numbers through WhatsApp, email, or the intake form.
- In admin, paste the final payment URL into the request's payment link field before sending the client update.
- For Wise fallback, create or reuse the Wise Business payment link in Wise, add it to Vercel as `WISE_PAYMENT_LINK_URL` or `WISE_PAYMENT_REQUEST_URL`, then use the admin `Fallback Wise request` button only on manual-transfer fallback jobs. AI may draft the Wise message and reconciliation checklist, but it must not mark Wise funds paid or release milestones.

Automation later:

- Configure `STRIPE_SECRET_KEY` and `PUBLIC_BASE_URL` in Vercel, then use the admin `Generate Stripe checkout` button for quoted `AUD`, `USD`, `GBP`, and `EUR` jobs.
- Configure `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and optionally `PAYPAL_ENVIRONMENT`, then use the admin `Generate PayPal order` and `Capture PayPal order` buttons when PayPal is the better client payment route.
- Configure `WISE_PAYMENT_LINK_URL` or `WISE_PAYMENT_REQUEST_URL`, then use the admin `Fallback Wise request` button only when other payment routes are not suitable.
- Configure Stripe to send successful Checkout events to `https://swadakta.com/api/payments/stripe-webhook`, with `STRIPE_WEBHOOK_SECRET` and a server-only Supabase key stored in Vercel.
- Store provider transaction IDs on the request record after payment confirmation.
- Treat Paystack and Flutterwave as Africa expansion candidates only after merchant approval, settlement-currency checks, webhook verification, and provider-evidence mapping. The public Payments page has an Africa payment expansion planner, and admin readiness tracks `PAYSTACK_*` and `FLUTTERWAVE_*` placeholders without making them public default rails.

## 3A. Identity Verification Provider Setup

Open and approve at least one ID provider before paid work goes public.

- Sumsub is the fastest global route to automate now. Create the Sumsub account, create a verification level, then add `SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY`, `SUMSUB_LEVEL_NAME`, and `SUMSUB_WEBHOOK_SECRET` to Vercel. Webhook URL: `https://swadakta.com/api/identity/sumsub-webhook`.
- Smile ID remains the Africa-first route. Open the Smile ID account under the business, confirm the exact countries/documents needed, then add `SMILE_ID_API_KEY`, `SMILE_ID_PARTNER_ID`, and either a provider-approved `SMILE_ID_VERIFICATION_URL` or the later native Smile ID SDK integration.
- Youverify can be evaluated for selected African checks. Add `YOUVERIFY_API_KEY` and a provider-approved `YOUVERIFY_VERIFICATION_URL` only after the account and coverage are confirmed.
- ID provider results must be the source of truth. Users, receivers, screenshots, and AI cannot mark an account verified.
- If the provider webhook is not configured, admin may record the provider result as an exception fallback, but paid posting and paid work should stay locked until a clear provider reference exists.

## 4. Privacy and Compliance

Swadakta handles names, contact details, task notes, local contacts, documents, receipts, photos, and report links. Treat the business as a privacy-sensitive operations desk from day one.

- Kenya's Office of the Data Protection Commissioner explains that personal data protection in Kenya is governed by the Data Protection Act, 2019: https://www.odpc.go.ke/wp-content/uploads/2024/02/PERSONAL-DATA-PROTECTION-HANDBOOK.pdf
- The live site now includes practical launch drafts at `/privacy` and `/terms`.
- Before scaling, have a qualified professional review the privacy policy, terms, refund wording, and data-retention process.
- Collect only the information needed for the job.
- Ask permission before contacting relatives, vendors, contractors, officials, or local contacts.
- Use the supporting-links field for Google Drive folders, photo albums, title packs, vendor quotes, or other client-provided references.
- Only use `https://` or `http://` links for supporting files, payment links, reports, and proof files.
- Keep sensitive documents out of WhatsApp where possible. Use secure links when file upload is added.
- Treat requests marked as involving sensitive documents as higher-risk jobs that need tighter access control.
- Delete or archive old proof packs on a defined schedule after accounting and dispute windows pass.

## 5. First Paid Job Workflow

1. Client submits the public intake form.
2. Autopilot classifies origin, destination, service direction, logistics mode, goods category, payment preference, compliance status, and founder-review need.
3. Founder reviews only if the lane is pilot/unsupported, the goods are risky, ID is missing, the value is high, or the legal/customs/payment path is unclear.
4. Admin confirms consent status is `Complete`, including client ID-verification consent.
5. Admin checks whether the client has a saved account profile and account-level ID verification status.
6. Admin reviews the service package, supporting links, contact preference, and sensitive-document flag.
7. Admin reviews budget comfort, proof priority, and lead source, then confirms missing details by WhatsApp or email.
8. Admin sends or records the client account verification link before paid or sensitive work proceeds.
9. Admin sets status to `quoted`, adds quote amount, currency, due date, and payment link.
10. Admin sets the funds status, protected amount, release condition, provider reference, and request ID verification status.
11. Admin creates one or more release milestones, for example deposit, travel/access confirmation, site media delivered, final report accepted, or receiver payout.
12. Admin uses `Copy quote` to send the client the amount, secure payment link, due date, proof plan, funds-protection wording, and safety wording.
13. Admin records operator payout, field costs, and payment fees to confirm the founder margin before work starts.
14. Client pays through the agreed provider.
15. Admin sets payment and funds statuses after confirmation.
16. Eligible vetted or pending job seekers can make controlled offers from Account Home, including amount, currency, delivery timeline, proof plan, and message.
17. Admin/AI compares offers by price, timing, proof quality, provenance, identity status, vetting status, and route fit. Lowest price does not automatically win.
18. Admin may shortlist or accept an offer. Acceptance is only allowed for a vetted, ID-verified receiver with proof standards accepted; the system then selects that receiver and declines competing submitted/shortlisted offers.
19. Work still cannot start after acceptance unless the request has an assigned receiver, active/pilot route, cleared compliance/admin review, client verification where sensitive documents are expected, protected amount, paid/deposit-paid status, and provider-held/confirmed funds state.
20. Admin confirms the receiver has completed Smile ID, Persona, Sumsub, Stripe Identity, or approved-provider identity verification, then copies the operator brief only after the work-start lock is clear.
21. Receiver-side operator executes the task and submits field updates/proof links from the receiver portal.
22. Admin reviews receiver updates, then updates release milestones bit by bit as proof is verified.
23. Admin adds approved proof links, report URL, and final client notes.
24. Admin sets status to `completed`.
25. Client tracks status, protected funds, milestone release status, and report links with request code plus original email or WhatsApp.
26. Client leaves a post-completion review from tracking or their client account.
27. Admin reviews the rating/note before assigning the same receiver again; low ratings reduce the receiver provenance seal.

## 6. Launch Readiness Checklist

- `swadakta.com` connected to Vercel.
- `www.swadakta.com` redirects to the apex domain.
- Supabase Auth Site URL is `https://swadakta.com`, and Redirect URLs include `https://swadakta.com/**`.
- `app-config.js` has only the Supabase publishable key, never a service-role key.
- `scripts/secret-scan.mjs` passes locally, and `scripts/check-production.mjs` includes the secret scan before production checks.
- Social sign-in buttons stay hidden until `app-config.js` enables the provider and Supabase has real OAuth credentials configured.
- Intake consent is required and visible as `Complete` in admin for new requests.
- Intake captures service package, budget comfort, proof priority, and lead source for quoting and early marketing feedback.
- `/portal` exposes client access, receiver-partner applications, and admin access.
- Client and receiver account access uses normal email/password account login; the same account can request work, take jobs, or do both.
- Portal accounts show role-aware next-step checklists for profile, identity verification, request/application, payment, vetting, proof, and review readiness.
- Signed-in clients and receivers can save an account profile so Swadakta has their role, contact, base, and currency context.
- Every saved account profile has an account-level ID verification status, link, reference, and admin notes.
- Every new public client request requires client ID-verification consent.
- Intake captures origin country, destination country, service direction, task location, logistics mode, goods category, and compliance acknowledgement.
- Africa-wide intake is active for all African countries, including in-country work inside a single African country and Africa-to-Africa work between African countries.
- Africa-Australia is active; Africa-USA, Africa-Europe, and Africa-China stay pilot lanes until receiver coverage, payment rail, legal/customs path, and proof standards are confirmed.
- Non-Africa-to-non-Africa corridors require founder approval until coverage is proven.
- Cross-border physical goods inside Africa still require carrier, customs, tax/duty, restricted-item, and proof checks before purchase, shipment, payment release, or receiver assignment.
- Physical-item requests require legal/customs checks before buying, shipping, carrying, receiving, or releasing money.
- Client and receiver portal sessions return sanitized account summaries only; full internal notes and founder margin stay in admin.
- Receiver partners can apply from the portal and must complete ID verification before being marked `Vetted`.
- Account Home has a controlled offer board for eligible open jobs. Job seekers can compete by amount, timeline, and proof plan, while Swadakta ranks offers by trust and fit.
- Receiver offers with missing vetting, ID verification, consent, or proof standards carry safety flags before any acceptance or assignment decision.
- Admin Operations includes the receiver offer market, where offers can be shortlisted, declined, or marked accepted for protected receiver review.
- Accepting an offer auto-selects the receiver only when their receiver profile is vetted, ID verified, consented, and free of offer safety flags; otherwise the offer must stay shortlisted or blocked.
- Active work states are database-gated: `in_progress`, `waiting_client`, and `completed` require assigned receiver, safe route, cleared compliance/admin review, sensitive-document verification where needed, protected amount, paid/deposit-paid status, and provider-held/confirmed funds state.
- Only vetted and ID-verified receivers can be assigned to client jobs.
- Assigned vetted and ID-verified receivers can see their paid/in-progress jobs in the receiver portal without seeing client payment links or founder economics.
- Assigned vetted and ID-verified receivers can submit field updates and proof links for admin review before anything becomes client-facing.
- Completed clients can leave a 1-5 review that feeds the receiver provenance seal and future assignment sorting.
- Receiver provenance starts at 25%, can reach 100% green through verified identity and clean delivery, and can drop into risk bands after poor reviews, blocked updates, disputes, or safety issues.
- Client accounts show a quieter client seal based on ID status, funded requests, completions, and dispute history.
- Admin tracks protected funds, provider references, and milestone releases before paying receivers.
- Wise and bank-transfer receipts require receipt/statement review before the admin marks funds paid; AI can draft the checklist but cannot make the protected money decision.
- Use `Run safe autopilot` on request cards for routine admin work. It may prepare supported payment requests, save internal notes, set due dates, and route low-risk active-lane work forward; it still pauses at money confirmation, ID approval, receiver assignment, compliance/legal uncertainty, outbound messages, and milestone release.
- Review the admin Operations Readiness panel after every Vercel or provider setup change. It checks domain/auth, Stripe, PayPal, Wise, M-Pesa, OpenAI fallback, and ID-provider setup without exposing secret values.
- Use `AI receipt check` after a Wise/bank-transfer receipt is received. Paste the receipt or statement text, review the drafted evidence checklist, save the request, then change payment status only after founder/admin verification.
- ID verification is required for high-value, sensitive-document, title/legal-adjacent, authority-sensitive, or unusually risky jobs.
- Smile ID is the default Africa verification provider; Persona, Sumsub, or Stripe Identity can cover wider global verification after provider setup.
- M-Pesa/Daraja is now represented in the app as a Kenya payment rail; use sandbox/test mode until the business PayBill/Till/API access and callback URLs are approved for live collection.
- Paystack/Flutterwave are expansion rails for wider Africa only after merchant, settlement, webhook, and evidence checks are ready; they should not bypass milestone release controls.
- Admin tracks founder margin per quoted job, including operator payout, field costs, and payment fees.
- Supabase leaked-password protection is enabled.
- Admin secure email sign-in works for `swadakta111@gmail.com`.
- Stripe and PayPal accounts are created and verified.
- First payment links are pasted into `app-config.js` or directly into admin request records.
- Privacy and terms are reviewed before heavy document collection.
- A real end-to-end request is tested from live intake to admin update to public tracking.
