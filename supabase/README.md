# Swadakta Supabase Setup

Run `schema.sql` in the Supabase SQL Editor.

Current production project:

- Project name: `swadakta`
- Project ref: `srwkoulknropnwwyqslj`
- API URL: `https://srwkoulknropnwwyqslj.supabase.co`

The schema creates:

- `service_requests`: public intake requests
- `admin_users`: approved admin users
- `account_profiles`: signed-in client/receiver profile records linked to Supabase Auth users, including account-level ID verification status
- `field_updates`: receiver-submitted proof/update notes for assigned jobs
- `fund_milestones`: admin-controlled funds-protection and staged release records
- private `swadakta-proof` Storage bucket for receiver proof uploads
- receiver ID verification fields on `partner_applications`, defaulting to Smile ID
- Consent fields for local-contact permission, professional-scope acceptance, terms acceptance, and privacy acceptance
- Contact preference, contact window, supporting links, and sensitive-document flags
- RLS policies:
  - anonymous users can insert new service requests only with required consent fields
  - only approved authenticated admins can read and update requests
- Public request tracking:
  - clients can look up limited status/report/payment details with request code plus original email or WhatsApp
  - clients can see safe funds-protection and milestone release status only
- Email magic-link account access:
  - Supabase Auth creates or opens an account from the client, receiver, or admin email form
  - client and receiver account summaries are matched by authenticated email
  - account profile rows are matched by `auth.uid()` and protected with own-row RLS
- Account verification gates:
  - every saved account profile has provider/status/link/reference fields
  - users can save ordinary profile fields but cannot self-mark ID verification as complete
  - admins update account ID status through `update_account_identity_verification`
  - new public service requests require client ID-verification consent and default to request verification status `required`
- Receiver verification gates:
  - a receiver cannot be marked `Vetted` unless ID consent is true and ID status is `verified`
  - a service request cannot be assigned to a receiver unless that receiver is vetted and ID-verified
  - receiver assigned-job functions only return work for vetted and ID-verified receivers
- Proof upload gates:
  - signed-in receivers can upload photos, short videos, and PDF receipts to `swadakta-proof`
  - the bucket is private, capped at 6MB per file for standard uploads, and stores files under the user's auth ID folder
  - admins can read proof files through RLS; public clients only see client-safe proof links/reports exposed by admin
- private helper functions under `app_private`

Admin activation:

- Magic link sent to `swadakta111@gmail.com`.
- Supabase auth user added to `public.admin_users` as `owner`.
- Open the magic link from the inbox, then return to `admin.html`.

Auth redirect setup:

- Set the Supabase Site URL to `https://swadakta.com`.
- Redirect URLs must cover `https://swadakta.com/auth` and `https://swadakta.com/auth.html`.
  The current dashboard wildcard `https://swadakta.com/**` covers this; exact callbacks are the stricter production option.
- If using wildcards for Vercel previews, keep them in addition to production coverage.
- Swadakta sends client, receiver, and admin magic links to `/auth?next=...`; the callback page checks the session and then routes users to `/portal` or `/admin`.
