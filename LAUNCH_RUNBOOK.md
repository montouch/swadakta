# Swadakta Launch Runbook

This is the practical go-live checklist for turning the current MVP into a paid operating service.

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

These hosted Supabase settings are required for magic links to leave local development and open the live app:

- Auth Site URL: `https://swadakta.com`
- Auth Redirect URLs: `https://swadakta.com/**`
- URL configuration page: `https://supabase.com/dashboard/project/srwkoulknropnwwyqslj/auth/url-configuration`
- If a magic-link email contains `redirect_to=http://localhost:3000`, the Supabase Auth URL configuration has drifted or the email was sent before the setting changed. Send a fresh link after correcting the setting.

## 3. Payments

Start with quote-based payment links, then automate later.

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
- Keep Wise or bank transfer available for clients who need local transfer rails.
- Never request card numbers through WhatsApp, email, or the intake form.
- In admin, paste the final payment URL into the request's payment link field before sending the client update.
- For Wise, create or reuse the Wise Business payment link in Wise, add it to Vercel as `WISE_PAYMENT_LINK_URL` or `WISE_PAYMENT_REQUEST_URL`, then use the admin `Prepare Wise request` button. AI may draft the Wise message and reconciliation checklist, but it must not mark Wise funds paid or release milestones.

Automation later:

- Configure `STRIPE_SECRET_KEY` and `PUBLIC_BASE_URL` in Vercel, then use the admin `Generate Stripe checkout` button for quoted `AUD`, `USD`, `GBP`, and `EUR` jobs.
- Configure `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and optionally `PAYPAL_ENVIRONMENT`, then use the admin `Generate PayPal order` and `Capture PayPal order` buttons when PayPal is the better client payment route.
- Configure `WISE_PAYMENT_LINK_URL` or `WISE_PAYMENT_REQUEST_URL`, then use the admin `Prepare Wise request` button for international transfer clients.
- Configure Stripe to send successful Checkout events to `https://swadakta.com/api/payments/stripe-webhook`, with `STRIPE_WEBHOOK_SECRET` and a server-only Supabase key stored in Vercel.
- Store provider transaction IDs on the request record after payment confirmation.

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
16. Admin confirms the receiver has completed Smile ID, Persona, Sumsub, Stripe Identity, or approved-provider identity verification.
17. Admin assigns only a vetted and ID-verified receiver/operator in the request card, then copies the operator brief.
18. Receiver-side operator executes the task and submits field updates/proof links from the receiver portal.
19. Admin reviews receiver updates, then updates release milestones bit by bit as proof is verified.
20. Admin adds approved proof links, report URL, and final client notes.
21. Admin sets status to `completed`.
22. Client tracks status, protected funds, milestone release status, and report links with request code plus original email or WhatsApp.
23. Client leaves a post-completion review from tracking or their client account.
24. Admin reviews the rating/note before assigning the same receiver again; low ratings reduce the receiver provenance seal.

## 6. Launch Readiness Checklist

- `swadakta.com` connected to Vercel.
- `www.swadakta.com` redirects to the apex domain.
- Supabase Auth Site URL is `https://swadakta.com`, and Redirect URLs include `https://swadakta.com/**`.
- `app-config.js` has only the Supabase publishable key, never a service-role key.
- Intake consent is required and visible as `Complete` in admin for new requests.
- Intake captures service package, budget comfort, proof priority, and lead source for quoting and early marketing feedback.
- `/portal` exposes client access, receiver-partner applications, and admin access.
- Client and receiver account access is email magic-link based; the same email creates the account if needed and opens it later.
- Signed-in clients and receivers can save an account profile so Swadakta has their role, contact, base, and currency context.
- Every saved account profile has an account-level ID verification status, link, reference, and admin notes.
- Every new public client request requires client ID-verification consent.
- Intake captures origin country, destination country, service direction, task location, logistics mode, goods category, and compliance acknowledgement.
- Africa-Australia is the first active corridor; Africa-USA, Africa-Europe, and Africa-China are pilot lanes; non-Africa corridors require founder approval until coverage is proven.
- Physical-item requests require legal/customs checks before buying, shipping, carrying, receiving, or releasing money.
- Client and receiver portal magic links return sanitized account summaries only; full internal notes and founder margin stay in admin.
- Receiver partners can apply from the portal and must complete ID verification before being marked `Vetted`.
- Only vetted and ID-verified receivers can be assigned to client jobs.
- Assigned vetted and ID-verified receivers can see their paid/in-progress jobs in the receiver portal without seeing client payment links or founder economics.
- Assigned vetted and ID-verified receivers can submit field updates and proof links for admin review before anything becomes client-facing.
- Completed clients can leave a 1-5 review that feeds the receiver provenance seal and future assignment sorting.
- Receiver provenance starts at 25%, can reach 100% green through verified identity and clean delivery, and can drop into risk bands after poor reviews, blocked updates, disputes, or safety issues.
- Client accounts show a quieter client seal based on ID status, funded requests, completions, and dispute history.
- Admin tracks protected funds, provider references, and milestone releases before paying receivers.
- Wise and bank-transfer receipts require receipt/statement review before the admin marks funds paid; AI can draft the checklist but cannot make the protected money decision.
- Use `Run safe autopilot` on request cards for routine admin work. It may prepare supported payment requests, save internal notes, set due dates, and route low-risk active-lane work forward; it still pauses at money confirmation, ID approval, receiver assignment, compliance/legal uncertainty, outbound messages, and milestone release.
- ID verification is required for high-value, sensitive-document, title/legal-adjacent, authority-sensitive, or unusually risky jobs.
- Smile ID is the default Africa verification provider; Persona, Sumsub, or Stripe Identity can cover wider global verification after provider setup.
- M-Pesa/Daraja is now represented in the app as a Kenya payment rail; use sandbox/test mode until the business PayBill/Till/API access and callback URLs are approved for live collection.
- Admin tracks founder margin per quoted job, including operator payout, field costs, and payment fees.
- Supabase leaked-password protection is enabled.
- Admin magic link works for `swadakta111@gmail.com`.
- Stripe and PayPal accounts are created and verified.
- First payment links are pasted into `app-config.js` or directly into admin request records.
- Privacy and terms are reviewed before heavy document collection.
- A real end-to-end request is tested from live intake to admin update to public tracking.
