# Swadakta Actualization Plan

This turns the prototype into an operating MVP.

## 1. Create the backend

Project created:

- Supabase project: `swadakta`
- Project ref: `srwkoulknropnwwyqslj`
- API URL: `https://srwkoulknropnwwyqslj.supabase.co`

Completed:

- Supabase project created.
- `supabase/schema.sql` applied as migrations.
- Supabase security advisors show one remaining launch hardening item: enable leaked-password protection in Auth.
- Public client intake insert was verified with the publishable key.
- Quote, payment-link, client tracking, and proof-link fields were added to Supabase.
- Required client permission, scope, terms, and privacy consent fields were added to Supabase and enforced by RLS.

Admin activation status:

- Magic link sent to `swadakta111@gmail.com`.
- Supabase auth user created.
- Admin user added as `owner`.
- Remaining step: open the magic link from the email inbox, then return to `admin.html`.

Important: use the Supabase publishable key in the browser. Never put a secret/service-role key in `app-config.js`.

## 2. Configure the site

Edit `app-config.js`:

```js
window.SWADAKTA_CONFIG = {
  brandName: "Swadakta",
  adminEmail: "swadakta111@gmail.com",
  supabaseUrl: "https://srwkoulknropnwwyqslj.supabase.co",
  supabasePublishableKey: "sb_publishable_braRDOvu_VbLc6PItbElmg_3hK-Zg51",
  whatsappNumber: "+61431455174",
  paymentLinks: {
    quick: "",
    site: "",
    registry: "",
    virtual: "",
    paypal: "",
    stripe: "",
    wise: "",
  },
};
```

The site works in demo mode when Supabase keys are blank. It writes to Supabase when the keys are filled.

## 3. Deploy

Deploy the folder to Vercel as a static project. The included `vercel.json` sets clean URLs, asset caching, and basic hardening headers.

Minimum production checklist:

- Supabase schema installed
- Admin user added
- `app-config.js` filled with publishable key only
- WhatsApp number filled
- First request submitted from the live URL
- Admin dashboard can see and update the request
- Admin can add quote amount, payment link, report link, and proof links
- Public intake requires client permission, scope, terms, and privacy consent
- Client tracking can find a request by request code plus original email/WhatsApp
- Privacy, terms, robots, sitemap, and security-contact files are live
- Admin routes are blocked from search indexing

## 4. Pilot operations

Run the first 10 jobs manually before automating more.

Use these statuses:

- `new`: request received
- `quoted`: price confirmed with client
- `paid`: client has paid or deposit is confirmed
- `in_progress`: Kenya-side execution has started
- `waiting_client`: blocked by client response or documents
- `completed`: report delivered
- `cancelled`: no longer active

For every job, capture:

- Client brief
- Stored client consent status
- Location and deadline
- Agreed fee
- Proof requirements
- Operator notes
- Receipts/media links
- Final client report

## 5. Next upgrades

After the pilot:

- Add file uploads for documents and proof media
- Connect Stripe, PayPal, Wise, or bank-transfer payment links
- Add automated email notifications
- Add custom email addresses for `swadakta.com`
- Add runner mobile upload workflow
- Add analytics for lead source, revenue, turnaround time, and repeat clients

See [LAUNCH_RUNBOOK.md](LAUNCH_RUNBOOK.md) for the domain, payments, privacy, and go-live checklist.
