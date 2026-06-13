create or replace function app_private.sync_partner_identity_from_account_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_email text := lower(btrim(coalesce(new.email, '')));
  clean_provider text := lower(btrim(coalesce(new.identity_verification_provider, 'sumsub')));
  clean_status text := lower(btrim(coalesce(new.identity_verification_status, 'not_started')));
  clean_reference text := nullif(btrim(coalesce(new.identity_verification_reference, '')), '');
  clean_link text := nullif(btrim(coalesce(new.identity_verification_link, '')), '');
  clean_notes text := left(
    btrim(
      concat_ws(
        E'\n',
        nullif(new.identity_verification_notes, ''),
        'Account-level provider ID evidence synced to this receiver profile. Receiver vetting remains a separate Swadakta review.'
      )
    ),
    1200
  );
begin
  if clean_email = '' or clean_provider not in ('smile_id', 'sumsub', 'youverify', 'manual') then
    return new;
  end if;

  if clean_status = 'verified' then
    update public.partner_applications
    set
      identity_verification_provider = clean_provider,
      identity_verification_status = 'verified',
      identity_verification_link = clean_link,
      identity_verification_reference = clean_reference,
      identity_verified_at = coalesce(new.identity_verified_at, identity_verified_at, now()),
      identity_verification_notes = clean_notes
    where lower(btrim(coalesce(email, ''))) = clean_email
      and (
        identity_verification_status <> 'verified'
        or identity_verification_reference is null
        or clean_reference is null
        or identity_verification_reference = clean_reference
      );
  elsif clean_status in ('link_sent', 'submitted', 'manual_review') then
    update public.partner_applications
    set
      identity_verification_provider = clean_provider,
      identity_verification_status = clean_status,
      identity_verification_link = clean_link,
      identity_verification_reference = clean_reference,
      identity_verification_notes = clean_notes
    where lower(btrim(coalesce(email, ''))) = clean_email
      and identity_verification_status <> 'verified';
  elsif clean_status in ('failed', 'expired') then
    update public.partner_applications
    set
      identity_verification_provider = clean_provider,
      identity_verification_status = clean_status,
      identity_verification_link = clean_link,
      identity_verification_reference = clean_reference,
      identity_verified_at = null,
      identity_verification_notes = clean_notes
    where lower(btrim(coalesce(email, ''))) = clean_email
      and (
        identity_verification_status <> 'verified'
        or (clean_reference is not null and identity_verification_reference = clean_reference)
      );
  end if;

  return new;
end;
$$;

drop trigger if exists account_profiles_sync_partner_identity on public.account_profiles;
create trigger account_profiles_sync_partner_identity
after insert or update of
  email,
  identity_verification_provider,
  identity_verification_status,
  identity_verification_link,
  identity_verification_reference,
  identity_verified_at,
  identity_verification_notes
on public.account_profiles
for each row
execute function app_private.sync_partner_identity_from_account_profile();
