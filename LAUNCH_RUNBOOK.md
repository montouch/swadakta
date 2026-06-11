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

## 2. Payments

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

Automation later:

- Move from manual links to Stripe Checkout sessions when the app has a server layer.
- Add payment webhooks only when there is a backend route that can verify Stripe webhook signatures.
- Store provider transaction IDs on the request record after payment confirmation.

## 3. Privacy and Compliance

Swadakta handles names, contact details, task notes, Kenya local contacts, documents, receipts, photos, and report links. Treat the business as a privacy-sensitive operations desk from day one.

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

## 4. First Paid Job Workflow

1. Client submits the public intake form.
2. Admin confirms consent status is `Complete`.
3. Admin reviews the service package, supporting links, contact preference, and sensitive-document flag.
4. Admin reviews budget comfort, proof priority, and lead source, then confirms missing details by WhatsApp or email.
5. Admin sets status to `quoted`, adds quote amount, currency, due date, and payment link.
6. Admin uses `Copy quote` to send the client the amount, secure payment link, due date, proof plan, and safety wording.
7. Admin records operator payout, field costs, and payment fees to confirm the founder margin before work starts.
8. Client pays through the agreed provider.
9. Admin sets status to `paid` after confirmation.
10. Admin assigns only a vetted Kenya-side receiver/operator, then copies the operator brief.
11. Kenya-side operator executes the task.
12. Admin adds proof links, report URL, and final notes.
13. Admin sets status to `completed`.
14. Client tracks status with request code plus original email or WhatsApp.

## 5. Launch Readiness Checklist

- `swadakta.com` connected to Vercel.
- `www.swadakta.com` redirects to the apex domain.
- `app-config.js` has only the Supabase publishable key, never a service-role key.
- Intake consent is required and visible as `Complete` in admin for new requests.
- Intake captures service package, budget comfort, proof priority, and lead source for quoting and early marketing feedback.
- `/portal` exposes client access, receiver-partner applications, and admin access.
- Receiver partners can apply from the portal and must be marked `Vetted` before getting client jobs.
- Admin tracks founder margin per quoted job, including operator payout, field costs, and payment fees.
- Supabase leaked-password protection is enabled.
- Admin magic link works for `swadakta111@gmail.com`.
- Stripe and PayPal accounts are created and verified.
- First payment links are pasted into `app-config.js` or directly into admin request records.
- Privacy and terms are reviewed before heavy document collection.
- A real end-to-end request is tested from live intake to admin update to public tracking.
