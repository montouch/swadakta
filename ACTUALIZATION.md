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
- Security advisors are clean.
- Public client intake insert was verified with the publishable key.

Admin activation still required:

1. Open `admin.html`.
2. Send a magic link to `swadakta111@gmail.com`.
3. Open the magic link in the same browser.
4. In Supabase Authentication > Users, copy that user's UUID.
5. Run the admin insert shown at the bottom of `supabase/schema.sql`, replacing the placeholder UUID.

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
- Location and deadline
- Agreed fee
- Proof requirements
- Operator notes
- Receipts/media links
- Final client report

## 5. Next upgrades

After the pilot:

- Add file uploads for documents and proof media
- Add Stripe or manual payment links per package
- Add automated email notifications
- Add customer tracking page by request code
- Add runner mobile upload workflow
- Add analytics for lead source, revenue, turnaround time, and repeat clients
