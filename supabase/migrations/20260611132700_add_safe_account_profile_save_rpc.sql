create schema if not exists app_private;

create or replace function app_private.save_account_profile(
  input_account_role text default 'client',
  input_full_name text default '',
  input_whatsapp text default '',
  input_country text default '',
  input_kenya_base text default '',
  input_preferred_currency text default 'AUD',
  input_profile_notes text default '',
  input_provider text default 'smile_id',
  input_onboarding_status text default 'started'
)
returns public.account_profiles
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := app_private.current_auth_email();
  clean_role text := lower(btrim(coalesce(input_account_role, 'client')));
  clean_currency text := upper(btrim(coalesce(input_preferred_currency, 'AUD')));
  clean_provider text := lower(btrim(coalesce(input_provider, 'smile_id')));
  clean_status text := lower(btrim(coalesce(input_onboarding_status, 'started')));
  updated_profile public.account_profiles%rowtype;
begin
  if current_user_id is null or btrim(coalesce(current_email, '')) = '' then
    raise exception 'Sign in before saving your account profile.';
  end if;

  if clean_role not in ('client', 'receiver', 'both') then
    clean_role := 'client';
  end if;

  if clean_currency not in ('AUD', 'USD', 'GBP', 'EUR', 'KES', 'CNY') then
    clean_currency := 'AUD';
  end if;

  if clean_provider not in ('smile_id', 'sumsub', 'youverify', 'manual') then
    clean_provider := 'smile_id';
  end if;

  if clean_status not in ('started', 'account_created', 'signed_in', 'profile_complete', 'needs_review', 'verification_requested', 'verified') then
    clean_status := 'started';
  end if;

  insert into public.account_profiles (
    user_id,
    email,
    account_role,
    full_name,
    whatsapp,
    country,
    kenya_base,
    preferred_currency,
    profile_notes,
    onboarding_status,
    identity_verification_provider
  )
  values (
    current_user_id,
    lower(btrim(current_email)),
    clean_role,
    left(btrim(coalesce(input_full_name, '')), 160),
    left(btrim(coalesce(input_whatsapp, '')), 80),
    left(btrim(coalesce(input_country, '')), 80),
    left(btrim(coalesce(input_kenya_base, '')), 120),
    clean_currency,
    left(btrim(coalesce(input_profile_notes, '')), 1200),
    clean_status,
    clean_provider
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    account_role = excluded.account_role,
    full_name = excluded.full_name,
    whatsapp = excluded.whatsapp,
    country = excluded.country,
    kenya_base = excluded.kenya_base,
    preferred_currency = excluded.preferred_currency,
    profile_notes = excluded.profile_notes,
    onboarding_status = excluded.onboarding_status,
    identity_verification_provider = excluded.identity_verification_provider
  returning * into updated_profile;

  return updated_profile;
end;
$$;

revoke all on function app_private.save_account_profile(text, text, text, text, text, text, text, text, text) from public;
revoke all on function app_private.save_account_profile(text, text, text, text, text, text, text, text, text) from anon;
grant execute on function app_private.save_account_profile(text, text, text, text, text, text, text, text, text) to authenticated;

create or replace function public.save_account_profile(
  input_account_role text default 'client',
  input_full_name text default '',
  input_whatsapp text default '',
  input_country text default '',
  input_kenya_base text default '',
  input_preferred_currency text default 'AUD',
  input_profile_notes text default '',
  input_provider text default 'smile_id',
  input_onboarding_status text default 'started'
)
returns public.account_profiles
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.save_account_profile(
    input_account_role,
    input_full_name,
    input_whatsapp,
    input_country,
    input_kenya_base,
    input_preferred_currency,
    input_profile_notes,
    input_provider,
    input_onboarding_status
  );
$$;

revoke all on function public.save_account_profile(text, text, text, text, text, text, text, text, text) from public;
revoke all on function public.save_account_profile(text, text, text, text, text, text, text, text, text) from anon;
grant execute on function public.save_account_profile(text, text, text, text, text, text, text, text, text) to authenticated;
