# Swadakta Diaspora Concierge

A launch-ready MVP for a global diaspora concierge and virtual assistant service for Kenya-bound errands, property checks, family logistics, and local business support.

## What is included

- Client-facing landing page and real intake form
- Portal page at `portal.html` with client, receiver-partner, and admin entrances
- Local demo persistence before backend setup
- Supabase-ready production persistence
- Admin operations dashboard at `admin.html`
- Receiver/field partner application pipeline for people in Kenya who want jobs
- Admin metrics and filters for status, payment state, due dates, and sensitive-document jobs
- Copy-ready client updates and field operator briefs
- Request status, payment status, operator notes, and client report workflow
- HTTP/HTTPS-only validation for supporting, payment, report, and proof links
- Quote amount, payment link, due date, report URL, and proof-link workflow
- Admin quote-message generator for payment links, proof scope, and payment safety wording
- Founder margin tracking for quote revenue, operator payout, field costs, and payment fees
- Required client permission, scope, terms, and privacy consent capture
- Service package intent, contact preference, payment preference, budget comfort, proof priority, lead source, contact window, sensitive-document flag, and supporting-link capture
- Client-safe request tracking by request code plus email/WhatsApp
- Copy-ready client updates and WhatsApp draft
- Generated hero image in `assets/diaspora-concierge-hero.png`
- Swadakta SVG brand mark in `assets/swadakta-brand-mark.svg`
- Privacy, terms, sitemap, robots, and security-contact files
- Vercel static deployment config plus Cloudflare Pages headers and redirects

## Run locally

From this folder:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m http.server 4173
```

Then open:

- Client site: `http://localhost:4173`
- Portal: `http://localhost:4173/portal.html`
- Admin desk: `http://localhost:4173/admin.html`

## Go live

See [ACTUALIZATION.md](ACTUALIZATION.md), [LAUNCH_RUNBOOK.md](LAUNCH_RUNBOOK.md), and [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) for the Supabase, admin, Vercel, payments, domain, and pilot launch checklist.

See [PAYMENTS_SETUP.md](PAYMENTS_SETUP.md) for the Stripe, PayPal, Wise, and bank-transfer launch workflow.
