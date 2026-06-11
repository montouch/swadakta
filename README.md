# Swadakta Corridor Concierge

A launch-ready MVP for a global corridor concierge, virtual assistant, sourcing, logistics, and proof-of-work service across Africa, Australia, the USA, Europe, and China launch regions.

## What is included

- Client-facing landing page and real intake form
- Portal page at `portal.html` with client, receiver-partner, and admin entrances
- Client and receiver magic-link portal access with sanitized account summaries
- Email magic-link account creation/opening for clients, receivers, and admins
- Portal account status and sign-out controls
- Signed-in account profiles for role, name, WhatsApp, country/base, Kenya coverage, and preferred currency
- Account-level ID verification tracking for all clients, receivers, and mixed-role users
- Global corridor intake for origin country, destination country, service direction, task location, logistics mode, goods category, and compliance acknowledgement
- Receiver portal assigned-job view for vetted partners
- Receiver field-update submissions with proof links for assigned jobs
- Client post-completion reviews that feed receiver provenance scoring
- Receiver provenance seal from 25% starter trust to 100% green trust, with low-review penalties
- Subtle client seal for job-giving accounts based on ID, funded work, and completion history
- Local demo persistence before backend setup
- Supabase-ready production persistence
- Admin operations dashboard at `admin.html`
- Receiver/field partner application pipeline for people in Kenya who want jobs
- Vetted receiver assignment from admin to client requests
- Mandatory receiver ID verification before a corridor counterpart can be vetted or assigned
- Mandatory client ID-verification consent on every new public request
- Admin receiver-update review trail per request before client report publishing
- Admin metrics and filters for status, payment state, due dates, and sensitive-document jobs
- Copy-ready client updates and field operator briefs
- Request status, payment status, operator notes, and client report workflow
- HTTP/HTTPS-only validation for supporting, payment, report, and proof links
- Quote amount, payment link, due date, report URL, and proof-link workflow
- Admin quote-message generator for payment links, proof scope, and payment safety wording
- Founder margin tracking for quote revenue, operator payout, field costs, and payment fees
- Funds-protection controls for held/authorized/deposit/released/refunded/disputed payments
- Milestone release ledger for staged receiver payouts and client-visible release status
- Provider reference tracking for Stripe, PayPal, Wise, M-Pesa, bank, or escrow records
- Admin-only Stripe Checkout session generation through a Vercel Function
- Stripe webhook payment confirmation that updates request payment state without releasing funds
- Admin-only PayPal order generation through a Vercel Function
- Admin-only PayPal capture that confirms paid funds without releasing receiver payouts
- Admin-only M-Pesa STK Push for KES collections through Safaricom Daraja
- M-Pesa callback confirmation that records receipts without releasing receiver payouts
- Guarded Swadakta Ops AI through Supabase Edge Function plus Vercel Function fallback
- Founder-only AI operations drafts with protected-action guardrails for funds, ID, receiver assignment, cross-border compliance, and external messages
- Autopilot route classification for active lanes, pilot lanes, unsupported corridors, physical-item logistics, and founder escalation
- ID verification gates for higher-value, sensitive-document, title, family-authority, or risky jobs
- Required client permission, scope, terms, and privacy consent capture
- Service package intent, contact preference, payment preference, budget comfort, proof priority, lead source, contact window, sensitive-document flag, and supporting-link capture
- Client-safe request tracking by request code plus email/WhatsApp
- Copy-ready client updates and WhatsApp draft
- Generated hero image in `assets/diaspora-concierge-hero.png`
- Swadakta SVG brand mark in `assets/swadakta-brand-mark.svg`
- Corridor operating model in `CORRIDOR_OPERATIONS.md`
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
- Founder console: `http://localhost:4173/admin.html`

## Go live

See [ACTUALIZATION.md](ACTUALIZATION.md), [LAUNCH_RUNBOOK.md](LAUNCH_RUNBOOK.md), [CORRIDOR_OPERATIONS.md](CORRIDOR_OPERATIONS.md), and [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) for the Supabase, founder console, Vercel, payments, domain, corridor, and pilot launch checklist.

See [PAYMENTS_SETUP.md](PAYMENTS_SETUP.md) for the Stripe, PayPal, Wise, and bank-transfer launch workflow.

See [IDENTITY_VERIFICATION.md](IDENTITY_VERIFICATION.md) for the Smile ID-first Africa verification workflow plus wider global verification options.
