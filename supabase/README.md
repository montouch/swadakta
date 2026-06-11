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
- private helper functions under `app_private`

After running the schema, sign in once from `admin.html`, copy your user ID from Supabase Authentication, then run the commented `insert into public.admin_users` statement at the bottom of `schema.sql`.
