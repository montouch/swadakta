# Swadakta Launch Runbook

This is the practical go-live checklist for turning the current MVP into a paid operating service.

## 1. Domain and Vercel

- `swadakta.com` is purchased in Cloudflare under `swadakta111@gmail.com`.
- Vercel is logged in, but project import is waiting on the **Continue with GitHub** authorization step.
- In Vercel, open the Swadakta project, go to Settings, then Domains, and add `swadakta.com`.
- Add `www.swadakta.com` as a second domain and redirect it to the apex domain.
- Follow the DNS records Vercel shows for the registrar. Vercel's domain docs explain that the dashboard displays the required DNS values after the domain is added: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Remember Vercel does not provide email hosting. Add MX records through Google Workspace, Microsoft 365, Zoho, or another email host if you want addresses like `hello@swadakta.com`: https://vercel.com/docs/domains/managing-dns-records
- If Vercel import remains blocked, Cloudflare Pages can direct-upload the static files and attach `swadakta.com`, but that Pages project cannot later switch to Git integration.
- After DNS settles, verify:
  - `https://swadakta.com/`
  - `https://swadakta.com/privacy`
  - `https://swadakta.com/terms`
  - `https://swadakta.com/sitemap.xml`
- See [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) for the latest local/Vercel project status.

## 2. Payments

Start with quote-based payment links, then automate later.

- Stripe Payment Links are a strong launch fit because Stripe says they can be created without code and shared with clients: https://docs.stripe.com/payment-links
- Create reusable Stripe links for common deposits:
  - Quick errand deposit
  - Site visit deposit
  - Registry/document errand deposit
  - Virtual assistant monthly retainer
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
3. Admin reviews the request, supporting links, contact preference, and sensitive-document flag.
4. Admin confirms missing details by WhatsApp or email.
5. Admin sets status to `quoted`, adds quote amount, currency, due date, and payment link.
6. Client pays through the agreed provider.
7. Admin sets status to `paid` after confirmation.
8. Admin copies the operator brief and sends it to the assigned Kenya-side operator.
9. Kenya-side operator executes the task.
10. Admin adds proof links, report URL, and final notes.
11. Admin sets status to `completed`.
12. Client tracks status with request code plus original email or WhatsApp.

## 5. Launch Readiness Checklist

- `swadakta.com` connected to Vercel.
- `www.swadakta.com` redirects to the apex domain.
- `app-config.js` has only the Supabase publishable key, never a service-role key.
- Intake consent is required and visible as `Complete` in admin for new requests.
- Supabase leaked-password protection is enabled.
- Admin magic link works for `swadakta111@gmail.com`.
- Stripe and PayPal accounts are created and verified.
- First payment links are pasted into `app-config.js` or directly into admin request records.
- Privacy and terms are reviewed before heavy document collection.
- A real end-to-end request is tested from live intake to admin update to public tracking.
