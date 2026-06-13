# Swadakta Corridor Concierge

A launch-ready MVP for a global corridor concierge, virtual assistant, sourcing, logistics, and proof-of-work service across Africa, Australia, the USA, Europe, and China launch regions.

## What is included

- Client-facing landing page and real intake form
- Public Payments & Pricing page with a launch quote estimator, provider-rail order, client-safe service-fee wording, Wise fallback boundary, and escrow disclaimer
- Public Item & Corridor Rules page with a postal/courier/customs pre-check for batteries, perfume, medicines, food, plants, valuables, documents, and restricted goods
- Inline brief goods-safety selector that carries item category, handoff mode, compliance checks, risk level, and official reference links into quote/admin triage
- Portal page at `portal.html` with client, receiver-partner, and admin entrances
- Account-first flow blueprint in `FLOW_BLUEPRINT.md` for the Google Stitch rebuild
- One account flow for client, job seeker, or both account modes
- Email/password account access with sanitized account summaries
- Account creation/opening for clients, job seekers, and mixed-role users, with social sign-in hooks ready for Google/Apple
- Mobile/WhatsApp backup number captured during account creation for urgent support, proof, verification, and payment coordination
- Social sign-in provider buttons are config-gated so they only appear after Supabase OAuth credentials are connected
- Portal account status and sign-out controls
- Signed-in account profiles for role, name, WhatsApp, country/base, service coverage, and preferred currency
- Role-aware client and receiver onboarding checklists inside the portal
- Account-level ID verification tracking for all clients, receivers, and mixed-role users
- Global corridor intake for origin country, destination country, service direction, task location, logistics mode, goods category, and compliance acknowledgement
- Open-Meteo-backed place intelligence on the brief page for rough weather, field-work timing, and local safety planning before receiver assignment
- Africa-wide active intake for all African countries, including same-country in-country work and Africa-to-Africa work with customs/carrier checks for cross-border goods
- Persisted route status, compliance flags, required checks, and proof requirements for each request
- Receiver portal assigned-job view for vetted partners
- Receiver field-update submissions with proof links for assigned jobs
- Client post-completion reviews that feed receiver provenance scoring
- Receiver provenance seal from 25% starter trust to 100% green trust, with low-review penalties
- Subtle client seal for job-giving accounts based on ID, funded work, and completion history
- Local demo persistence before backend setup
- Supabase-ready production persistence
- Admin operations entry at `admin.html` redirects to the founder exceptions desk at `admin-ops.html`
- Receiver/field partner application pipeline for people in supported countries who want jobs
- Vetted receiver assignment from admin to client requests
- Mandatory receiver ID verification before a corridor counterpart can be vetted or assigned
- Mandatory client ID-verification consent on every new public request
- Server-side identity handoff at `/api/identity/start-verification` for provider links/references without exposing provider secrets in browser code
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
- Admin-only Wise fallback request preparation for cases where card, PayPal, M-Pesa, or normal bank transfer is unsuitable
- Wise payment references stay invoice-sent until receipt or statement reconciliation confirms cleared funds
- Admin-only M-Pesa STK Push for KES collections through Safaricom Daraja
- M-Pesa callback confirmation that records receipts without releasing receiver payouts
- Guarded Swadakta Ops AI through Supabase Edge Function plus Vercel Function fallback
- Founder-only AI operations drafts with protected-action guardrails for funds, ID, receiver assignment, cross-border compliance, and external messages
- Safe autopilot action in admin for routine triage, payment-request prep, quote readiness, due dates, proof checklists, and internal notes
- Admin-only founder operations desk for live exceptions, payment follow-up, margin risk, ID/compliance blockers, and protected-decision review
- Admin-only operations readiness desk for domain/auth, payment rails, AI fallback, and ID-provider setup
- AI receipt check for Wise/bank-transfer evidence that writes an internal reconciliation note without changing money status
- 90/10 operations boundary: AI/autopilot handles routine work, founder/admin approves protected money, identity, assignment, legal/customs, dispute, and outbound-message decisions
- Autopilot route classification for active lanes, pilot lanes, unsupported corridors, physical-item logistics, and founder escalation
- Client and receiver portals show client-safe required checks and proof requirements so delivery expectations are visible
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
- Local secret scanner that fails on high-confidence OpenAI, Stripe, Paystack, Flutterwave, GitHub, JWT/service-role, private-key, or sensitive env assignments before deploy

## Run locally

From this folder:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m http.server 4173
```

Then open:

- Client site: `http://localhost:4173`
- Portal: `http://localhost:4173/portal.html`
- Founder console: `http://localhost:4173/admin.html` opens `http://localhost:4173/admin-ops.html`
- Readiness cockpit: `http://localhost:4173/admin-readiness.html`

## Production health

Run a no-secret bundle check before demos or after Vercel deploys:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/check-production.mjs
```

Before pushing during a launch session, check whether GitHub/Vercel and production are ready for another deployment:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/deployment-state.mjs
```

Use `SWADAKTA_BASE_URL=http://127.0.0.1:4173` to check the local static server. The check verifies the shared `app-data.js` bundle, the account-home `stitch-portal.js` bundle, the founder ops bundle, the Vercel API function budget, the `release.json` freshness manifest, production admin routing/indexing guards, POST-only API method guards, `Allow` headers, and admin-readiness auth so stale sign-in, admin-entry, money, identity, AI, or deploy-shape code is caught before a demo. The same check is available as a manual GitHub Action named `Production Health`.

`release.json` is a no-secret production freshness marker. If production health says the release ID is missing or stale, redeploy the latest `main` commit in Vercel before demonstrating payment, identity, or admin readiness changes.

By default the Vercel function-budget guard allows 12 `api/**/*.js` files, matching the current deployed project shape. Keep shared helpers in `lib/` instead of `api/`; set `SWADAKTA_VERCEL_FUNCTION_BUDGET` only if the hosting plan or Vercel project limit is intentionally changed.

If Vercel reports `Deployment rate limited - retry in 24 hours`, do not keep pushing low-risk or cosmetic changes. Continue locally, run targeted checks, use `scripts/deployment-state.mjs` to confirm the state, and push one clean batch when the deployment window resets. Current Vercel limits are tracked in [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md).

Run the founder evidence register check before changing any owner launch flag, payment expansion flag, or paid-launch gate:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/check-founder-evidence.mjs
```

The register maps every owner-controlled Vercel flag and Paystack/Flutterwave expansion flag to the proof required before it can be set to `true`.

Run only the local secret scanner when changing env, payment, AI, provider, or webhook code:

```powershell
C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/secret-scan.mjs
```

The production health script runs this scanner automatically. If it fails, remove the committed value and rotate the exposed provider key before continuing.

## Environment setup

Use `.env.example` as the no-secret checklist for Vercel production variables. Real values belong in Vercel Project Settings or an ignored local env file such as `.env.local`; never commit provider secrets, API keys, service-role keys, or webhook tokens.

## Go live

See [REAL_WORLD_LAUNCH_BOARD.md](REAL_WORLD_LAUNCH_BOARD.md), [FOUNDER_ACTION_PACK.md](FOUNDER_ACTION_PACK.md), [FOUNDER_EVIDENCE_REGISTER.md](FOUNDER_EVIDENCE_REGISTER.md), [PILOT_TEST_SCRIPT.md](PILOT_TEST_SCRIPT.md), [ACTUALIZATION.md](ACTUALIZATION.md), [LAUNCH_RUNBOOK.md](LAUNCH_RUNBOOK.md), [CORRIDOR_OPERATIONS.md](CORRIDOR_OPERATIONS.md), and [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) for the real-world founder setup, first paid pilot rehearsal, Supabase, founder console, Vercel, payments, domain, corridor, and launch checklist.

See [PAYMENTS_SETUP.md](PAYMENTS_SETUP.md) for the Stripe, PayPal, M-Pesa, bank-transfer, and Wise fallback launch workflow.

See [IDENTITY_VERIFICATION.md](IDENTITY_VERIFICATION.md) for the Smile ID-first Africa verification workflow plus wider global verification options.

See [STITCH_UI_SOURCE.md](STITCH_UI_SOURCE.md) for the rule that Google Stitch owns the visible workflow UI and production code only layers in links, data, auth, payment, AI, and safety behavior.
