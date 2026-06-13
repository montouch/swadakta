# Supabase Production Status

Last confirmed: June 14, 2026

Project: `swadakta` (`srwkoulknropnwwyqslj`)  
Region: `us-west-2`  
Database: Postgres `17.6.1.127`

## Confirmed Applied

- Public RLS is enabled on the launch-critical tables checked for accounts, service requests, partner applications, field updates, fund milestones, reviews, notifications, and resolution cases.
- `account_profiles` access is routed through authenticated RPCs so signed-in users can open their account without direct-table permission failures.
- Receiver code-of-conduct gating is applied:
  - `partner_applications.code_of_conduct_consent`
  - `partner_applications.code_of_conduct_accepted_at`
  - vetted receiver constraint requires ID consent, proof consent, code-of-conduct consent, and verified identity.
- Work-start and resolution safety gates are applied:
  - offer acceptance can select a receiver, but active work remains locked until route, compliance, payment-provider evidence, and proof gates pass.
  - `app_private.resolution_ai_triage(...)` exists for dispute/safety-pause triage.
- Private proof storage is configured:
  - bucket `swadakta-proof`
  - private access
  - 6MB file limit
  - images, PDFs, short video, and supported audio proof MIME types
  - authenticated users can read/insert/delete their own folder; admins can read through `app_private.is_admin()`.
- Edge functions are deployed:
  - `swadakta-assistant` version 6, `verify_jwt=true`
  - `noop`
- `swadakta-assistant` rejects unauthenticated live calls with `401 Missing authorization header`.
- The deployed AI Edge Function includes the same protected-action preflight, Wise/bank-transfer guardrail, and 64KB AI request-body limit as the Vercel fallback.
- Auth leaked-password protection is enabled for the Email provider.
- Supabase security advisors returned zero security warnings after the Auth setting was saved.
- Duplicate permissive `SELECT` policies on `job_offers` and `resolution_cases` were consolidated into one visible-row policy per table without changing the access model.

## Watch Items

- Keep Auth leaked-password protection enabled in the Supabase dashboard.
- Keep `swadakta-assistant` deployed with `verify_jwt=true` after every Edge Function redeploy.
- AI model calls still require a fresh, rotated `OPENAI_API_KEY` stored only as a Supabase/Vercel server-side secret. Do not reuse any key that was pasted into chat or a browser field.
- Auth email deliverability is not cleared until custom SMTP or a reviewed production sender is configured, the sender domain has SPF/DKIM/DMARC evidence, link tracking does not rewrite auth links, and one confirmation plus one password reset are tested on `https://swadakta.com`.
- Keep the non-secret Vercel flag `SWADAKTA_OWNER_LEAKED_PASSWORD_PROTECTION_ENABLED=true` aligned with the dashboard setting after advisors are clean.
- Before paid launch, complete a live sign-up/password-change test using a deliberately weak/leaked test password and confirm Supabase rejects it.
- Supabase performance advisors currently show only informational unused-index notes for new workflow tables plus the Auth connection-allocation scale note. Keep the indexes until real traffic proves they are unnecessary.
