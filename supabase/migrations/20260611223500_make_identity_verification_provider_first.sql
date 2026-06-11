create or replace function app_private.request_account_identity_verification(
  input_reason text default 'account_required',
  input_user_notes text default '',
  input_provider text default null
)
returns public.identity_verification_requests
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := app_private.current_auth_email();
  profile public.account_profiles%rowtype;
  open_request public.identity_verification_requests%rowtype;
  updated_request public.identity_verification_requests%rowtype;
  clean_reason text := lower(btrim(coalesce(input_reason, 'account_required')));
  clean_notes text := left(btrim(coalesce(input_user_notes, '')), 1200);
  clean_provider text;
begin
  if current_user_id is null or btrim(coalesce(current_email, '')) = '' then
    raise exception 'Sign in before requesting identity verification.';
  end if;

  select * into profile from public.account_profiles where user_id = current_user_id;
  clean_provider := lower(btrim(coalesce(input_provider, profile.identity_verification_provider, 'sumsub')));

  if clean_provider not in ('smile_id', 'sumsub', 'youverify') then
    clean_provider := 'sumsub';
  end if;

  if clean_reason not in ('account_required', 'paid_work', 'receiver_work', 'sensitive_job', 'high_value_job', 'manual_review', 'other') then
    clean_reason := 'account_required';
  end if;

  if profile.user_id is null then
    insert into public.account_profiles (
      user_id,
      email,
      account_role,
      identity_verification_provider,
      identity_verification_status,
      identity_verification_notes
    )
    values (
      current_user_id,
      current_email,
      'client',
      clean_provider,
      'submitted',
      'User requested automated identity verification.'
    )
    returning * into profile;
  else
    update public.account_profiles
    set
      identity_verification_provider = clean_provider,
      identity_verification_status = case
        when identity_verification_status = 'verified' then identity_verification_status
        when identity_verification_status in ('submitted', 'link_sent') then identity_verification_status
        else 'submitted'
      end,
      identity_verification_notes = left(
        btrim(concat_ws(E'\n', nullif(identity_verification_notes, ''), 'User requested automated identity verification.')),
        1200
      )
    where user_id = current_user_id
    returning * into profile;
  end if;

  select * into open_request
  from public.identity_verification_requests
  where user_id = current_user_id
    and status in ('requested', 'link_sent', 'submitted', 'manual_review')
  order by updated_at desc
  limit 1;

  if open_request.id is null then
    insert into public.identity_verification_requests (
      user_id,
      email,
      account_role,
      provider,
      status,
      reason,
      country,
      kenya_base,
      whatsapp,
      user_notes
    ) values (
      current_user_id,
      current_email,
      coalesce(profile.account_role, 'client'),
      clean_provider,
      'requested',
      clean_reason,
      nullif(profile.country, ''),
      nullif(profile.kenya_base, ''),
      nullif(profile.whatsapp, ''),
      nullif(clean_notes, '')
    ) returning * into updated_request;
  else
    update public.identity_verification_requests
    set
      email = current_email,
      account_role = coalesce(profile.account_role, 'client'),
      provider = clean_provider,
      reason = clean_reason,
      country = nullif(profile.country, ''),
      kenya_base = nullif(profile.kenya_base, ''),
      whatsapp = nullif(profile.whatsapp, ''),
      user_notes = nullif(clean_notes, ''),
      updated_at = now()
    where id = open_request.id
    returning * into updated_request;
  end if;

  return updated_request;
end;
$$;

revoke all on function app_private.request_account_identity_verification(text, text, text) from public;
revoke all on function app_private.request_account_identity_verification(text, text, text) from anon;
grant execute on function app_private.request_account_identity_verification(text, text, text) to authenticated;

create or replace function public.request_account_identity_verification(
  input_reason text default 'account_required',
  input_user_notes text default '',
  input_provider text default null
)
returns public.identity_verification_requests
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.request_account_identity_verification(
    input_reason,
    input_user_notes,
    input_provider
  );
$$;

revoke all on function public.request_account_identity_verification(text, text, text) from public;
grant execute on function public.request_account_identity_verification(text, text, text) to authenticated;
