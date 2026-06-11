create schema if not exists app_private;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

create or replace function app_private.current_auth_email()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((select auth.jwt()) ->> 'email', '');
$$;

alter table public.account_profiles enable row level security;

alter table public.account_profiles drop constraint if exists account_profiles_preferred_currency_check;
alter table public.account_profiles
  add constraint account_profiles_preferred_currency_check
  check (preferred_currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES', 'CNY'));

alter table public.account_profiles drop constraint if exists account_profiles_onboarding_status_check;
alter table public.account_profiles
  add constraint account_profiles_onboarding_status_check
  check (
    onboarding_status in (
      'started',
      'account_created',
      'signed_in',
      'profile_complete',
      'needs_review',
      'verification_requested',
      'verified'
    )
  );

alter table public.service_requests drop constraint if exists service_requests_preferred_currency_check;
alter table public.service_requests
  add constraint service_requests_preferred_currency_check
  check (preferred_currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES', 'CNY'));

alter table public.service_requests drop constraint if exists service_requests_quote_currency_check;
alter table public.service_requests
  add constraint service_requests_quote_currency_check
  check (quote_currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES', 'CNY'));

drop policy if exists "Users can read own account profile" on public.account_profiles;
drop policy if exists "Admins can read account profiles" on public.account_profiles;
drop policy if exists "Authenticated users can read permitted account profiles" on public.account_profiles;
create policy "Authenticated users can read permitted account profiles"
on public.account_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select app_private.is_admin())
);

drop policy if exists "Users can create own account profile" on public.account_profiles;
create policy "Users can create own account profile"
on public.account_profiles
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and lower(btrim(email)) = lower(btrim((select app_private.current_auth_email())))
  and identity_verification_status in ('not_started', 'manual_review')
  and coalesce(identity_verification_link, '') = ''
  and coalesce(identity_verification_reference, '') = ''
  and identity_verified_at is null
);

drop policy if exists "Users can update own account profile" on public.account_profiles;
create policy "Users can update own account profile"
on public.account_profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and lower(btrim(email)) = lower(btrim((select app_private.current_auth_email())))
);

grant usage on schema public to anon, authenticated;
grant usage on schema app_private to authenticated;
revoke all on function app_private.is_admin() from public;
grant execute on function app_private.is_admin() to authenticated;
revoke all on function app_private.current_auth_email() from public;
grant execute on function app_private.current_auth_email() to authenticated;

revoke all privileges on table public.account_profiles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.account_profiles from authenticated;

grant select on public.account_profiles to authenticated;
grant insert (
  user_id,
  email,
  account_role,
  full_name,
  whatsapp,
  country,
  kenya_base,
  preferred_currency,
  identity_verification_provider,
  profile_notes,
  onboarding_status
) on public.account_profiles to authenticated;
grant update (
  email,
  account_role,
  full_name,
  whatsapp,
  country,
  kenya_base,
  preferred_currency,
  identity_verification_provider,
  profile_notes,
  onboarding_status
) on public.account_profiles to authenticated;
