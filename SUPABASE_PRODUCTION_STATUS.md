# Supabase Production Status

Last confirmed: June 13, 2026

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
  - `swadakta-assistant`
  - `noop`
- Auth leaked-password protection is enabled for the Email provider.
- Supabase security advisors returned zero security warnings after the Auth setting was saved.

## Watch Items

- Keep Auth leaked-password protection enabled in the Supabase dashboard.
- Before paid launch, complete a live sign-up/password-change test using a deliberately weak/leaked test password and confirm Supabase rejects it.
