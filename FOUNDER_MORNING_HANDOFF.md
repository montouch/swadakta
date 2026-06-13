# Swadakta Morning Handoff

Last updated: June 14, 2026

## Live Status

- Domain: `https://swadakta.com` is live on Vercel.
- Latest production commit verified: `7833c95` (`Polish AI and admin visual fit`).
- Production health: `scripts/check-production.mjs` passes against `https://swadakta.com`.
- Visual QA: `SWADAKTA_VISUAL_BASE_URL=https://swadakta.com scripts/check-visual-fit.mjs` passes.
- Normal sign-in: `scripts/check-production-auth-flow.mjs` passes; signed-in users land at `/portal#home` and can open `/verification`.
- Admin sign-in: `scripts/check-production-admin-flow.mjs` passes; admin users reach `/admin-ops`.
- Supabase project `srwkoulknropnwwyqslj` is `ACTIVE_HEALTHY`; security advisors return zero lints, including no leaked-password warning.
- Supabase performance advisors: informational unused-index notes and an Auth connection-allocation scale note only. Keep them until real traffic exists.
- Supabase Edge AI: `swadakta-assistant` is deployed as version 6 with JWT verification on; unauthenticated live calls are rejected.

## What Is Usable Now

- Public site and trust/payment/rules pages can be shown for demos and interest capture.
- Users can create/open an account, save profile details, choose whether they give jobs, find jobs, or do both, and request verification.
- Clients can prepare quote-first briefs with corridor, goods, proof, weather/place context, and compliance prompts.
- Receivers can apply for work, accept proof/code-of-conduct terms, and later bid/offer for jobs.
- Admin can review requests, readiness, verification state, receiver offers, payment gates, founder economics, and AI/manual operating packs.
- AI is structured for safe assistance: it can draft, summarize, triage, and guide, but it cannot move money, verify ID, assign receivers, send external messages, change admin access, or expose secrets.

## Do Not Do Yet

- Do not take paid customer jobs yet.
- Do not claim Swadakta holds escrow or client money. Provider rails, banks, regulated escrow providers, suppliers, or named recipients handle custody.
- Do not expose Wise as a normal public option. It remains an admin fallback only.
- Do not turn on M-Pesa/Daraja until `MPESA_CALLBACK_TOKEN` is set in Vercel and the tokenized callback URL is registered with Safaricom.
- Do not mark ID verified, money paid, receiver vetted, or receiver assigned from AI output, screenshots, or chat messages alone.

## Top Founder Actions

1. Rotate any exposed API keys, especially any key pasted into chat, then store fresh keys only in Vercel/Supabase/provider secret stores.
2. Choose and register the legal/business structure and trading name.
3. Get tax/accounting review for cross-border income, provider fees, refunds, receiver payouts, and founder margin.
4. Buy or confirm insurance before real field, courier, property, or proof jobs.
5. Have terms, privacy, refund/dispute wording, payment wording, receiver terms, and AI/protected-action boundaries reviewed.
6. Confirm the financial-services boundary so Swadakta stays inside provider-held payment and concierge/marketplace work.
7. Configure production Auth email delivery with custom SMTP or a reviewed sender, SPF/DKIM/DMARC, no auth-link rewriting, and one confirmation plus password-reset test.
8. Open/approve provider accounts under the chosen entity: Stripe, PayPal, Sumsub/Smile ID, and later M-Pesa/Paystack/Flutterwave only where the corridor requires them.

## Daily Command Pack

Run from `C:\Users\brown\Documents\GitHub\swadakta`:

```powershell
$node='C:\Users\brown\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node scripts/deployment-state.mjs
& $node scripts/check-production.mjs
$env:SWADAKTA_VISUAL_BASE_URL='https://swadakta.com'
& $node scripts/check-visual-fit.mjs
Remove-Item Env:\SWADAKTA_VISUAL_BASE_URL
& $node scripts/live-readiness-summary.mjs
```

`scripts/live-readiness-summary.mjs` needs the admin test email/password in environment variables. Do not commit those values.

## Admin Entry

- Admin console: `https://swadakta.com/admin` or `https://swadakta.com/admin-ops`
- Readiness desk: `https://swadakta.com/admin-readiness`
- Verification desk: `https://swadakta.com/admin-verification`
