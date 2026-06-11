# Swadakta Supabase Setup

Run `schema.sql` in the Supabase SQL Editor.

Current production project:

- Project name: `swadakta`
- Project ref: `srwkoulknropnwwyqslj`
- API URL: `https://srwkoulknropnwwyqslj.supabase.co`

The schema creates:

- `service_requests`: public intake requests
- `admin_users`: approved admin users
- RLS policies:
  - anonymous users can insert new service requests
  - only approved authenticated admins can read and update requests
- Public request tracking:
  - clients can look up limited status/report/payment details with request code plus original email or WhatsApp
- private helper functions under `app_private`

Admin activation:

- Magic link sent to `swadakta111@gmail.com`.
- Supabase auth user added to `public.admin_users` as `owner`.
- Open the magic link from the inbox, then return to `admin.html`.
