create table if not exists public.identity_verification_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique default ('IV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  account_role text not null default 'client',
  provider text not null default 'smile_id',
  status text not null default 'requested',
  reason text not null default 'account_required',
  country text,
  kenya_base text,
  whatsapp text,
  user_notes text,
  admin_notes text,
  provider_link text,
  provider_reference text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.identity_verification_requests add column if not exists request_code text not null default ('IV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));
alter table public.identity_verification_requests add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.identity_verification_requests add column if not exists email text;
alter table public.identity_verification_requests add column if not exists account_role text not null default 'client';
alter table public.identity_verification_requests add column if not exists provider text not null default 'smile_id';
alter table public.identity_verification_requests add column if not exists status text not null default 'requested';
alter table public.identity_verification_requests add column if not exists reason text not null default 'account_required';
alter table public.identity_verification_requests add column if not exists country text;
alter table public.identity_verification_requests add column if not exists kenya_base text;
alter table public.identity_verification_requests add column if not exists whatsapp text;
alter table public.identity_verification_requests add column if not exists user_notes text;
alter table public.identity_verification_requests add column if not exists admin_notes text;
alter table public.identity_verification_requests add column if not exists provider_link text;
alter table public.identity_verification_requests add column if not exists provider_reference text;
alter table public.identity_verification_requests add column if not exists resolved_at timestamptz;
alter table public.identity_verification_requests add column if not exists created_at timestamptz not null default now();
alter table public.identity_verification_requests add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'identity_verification_requests_code_check') then
    alter table public.identity_verification_requests
      add constraint identity_verification_requests_code_check
      check (request_code like 'IV-%' and length(request_code) between 6 and 24);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'identity_verification_requests_email_check') then
    alter table public.identity_verification_requests
      add constraint identity_verification_requests_email_check
      check (email is null or position('@' in email) > 1);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'identity_verification_requests_account_role_check') then
    alter table public.identity_verification_requests
      add constraint identity_verification_requests_account_role_check
      check (account_role in ('client', 'receiver', 'both'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'identity_verification_requests_provider_check') then
    alter table public.identity_verification_requests
      add constraint identity_verification_requests_provider_check
      check (provider in ('smile_id', 'sumsub', 'youverify', 'manual'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'identity_verification_requests_status_check') then
    alter table public.identity_verification_requests
      add constraint identity_verification_requests_status_check
      check (status in ('requested', 'link_sent', 'submitted', 'verified', 'failed', 'expired', 'cancelled', 'manual_review'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'identity_verification_requests_reason_check') then
    alter table public.identity_verification_requests
      add constraint identity_verification_requests_reason_check
      check (reason in ('account_required', 'paid_work', 'receiver_work', 'sensitive_job', 'high_value_job', 'manual_review', 'other'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'identity_verification_requests_provider_link_check') then
    alter table public.identity_verification_requests
      add constraint identity_verification_requests_provider_link_check
      check (provider_link is null or provider_link = '' or provider_link ~* '^https?://');
  end if;
end
$$;

create index if not exists identity_verification_requests_user_idx
  on public.identity_verification_requests (user_id, updated_at desc);

create index if not exists identity_verification_requests_status_idx
  on public.identity_verification_requests (status, updated_at desc);

drop trigger if exists identity_verification_requests_set_updated_at on public.identity_verification_requests;
create trigger identity_verification_requests_set_updated_at
before update on public.identity_verification_requests
for each row
execute function app_private.set_updated_at();

alter table public.identity_verification_requests enable row level security;

drop policy if exists "Users and admins can read identity verification requests" on public.identity_verification_requests;
create policy "Users and admins can read identity verification requests"
on public.identity_verification_requests
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select app_private.is_admin())
);

drop policy if exists "Users can create own identity verification requests" on public.identity_verification_requests;
create policy "Users can create own identity verification requests"
on public.identity_verification_requests
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and lower(btrim(coalesce(email, ''))) = lower(btrim((select app_private.current_auth_email())))
  and status = 'requested'
);

drop policy if exists "Admins can update identity verification requests" on public.identity_verification_requests;
create policy "Admins can update identity verification requests"
on public.identity_verification_requests
for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

revoke all privileges on table public.identity_verification_requests from anon;
grant select, insert, update on public.identity_verification_requests to authenticated;
revoke delete, truncate, references, trigger on table public.identity_verification_requests from authenticated;

create or replace function app_private.list_identity_verification_requests()
returns table (
  id uuid,
  request_code text,
  user_id uuid,
  email text,
  account_role text,
  full_name text,
  whatsapp text,
  country text,
  kenya_base text,
  provider text,
  status text,
  reason text,
  user_notes text,
  admin_notes text,
  provider_link text,
  provider_reference text,
  resolved_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, app_private
as $$
begin
  if not app_private.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
    select
      ivr.id,
      ivr.request_code,
      ivr.user_id,
      ivr.email,
      coalesce(ap.account_role, ivr.account_role) as account_role,
      ap.full_name,
      coalesce(ap.whatsapp, ivr.whatsapp) as whatsapp,
      coalesce(ap.country, ivr.country) as country,
      coalesce(ap.kenya_base, ivr.kenya_base) as kenya_base,
      ivr.provider,
      ivr.status,
      ivr.reason,
      ivr.user_notes,
      ivr.admin_notes,
      ivr.provider_link,
      ivr.provider_reference,
      ivr.resolved_at,
      ivr.created_at,
      ivr.updated_at
    from public.identity_verification_requests ivr
    left join public.account_profiles ap on ap.user_id = ivr.user_id
    order by
      case when ivr.status in ('requested', 'manual_review', 'submitted') then 0 else 1 end,
      ivr.updated_at desc
    limit 200;
end;
$$;

revoke all on function app_private.list_identity_verification_requests() from public;
revoke all on function app_private.list_identity_verification_requests() from anon;
grant execute on function app_private.list_identity_verification_requests() to authenticated;

create or replace function public.list_identity_verification_requests()
returns table (
  id uuid,
  request_code text,
  user_id uuid,
  email text,
  account_role text,
  full_name text,
  whatsapp text,
  country text,
  kenya_base text,
  provider text,
  status text,
  reason text,
  user_notes text,
  admin_notes text,
  provider_link text,
  provider_reference text,
  resolved_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_identity_verification_requests();
$$;

revoke all on function public.list_identity_verification_requests() from public;
grant execute on function public.list_identity_verification_requests() to authenticated;

create or replace function app_private.update_identity_verification_request(
  input_id uuid,
  input_status text,
  input_provider text,
  input_link text default null,
  input_reference text default null,
  input_admin_notes text default null
)
returns public.identity_verification_requests
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  updated_request public.identity_verification_requests%rowtype;
  clean_status text := lower(btrim(coalesce(input_status, '')));
  clean_provider text := lower(btrim(coalesce(input_provider, '')));
  clean_link text := nullif(btrim(coalesce(input_link, '')), '');
  clean_reference text := nullif(btrim(coalesce(input_reference, '')), '');
  clean_notes text := nullif(left(btrim(coalesce(input_admin_notes, '')), 1200), '');
  account_status text;
begin
  if not app_private.is_admin() then
    raise exception 'Admin access required';
  end if;

  if clean_status not in ('requested', 'link_sent', 'submitted', 'verified', 'failed', 'expired', 'cancelled', 'manual_review') then
    raise exception 'Invalid identity verification request status';
  end if;

  if clean_provider not in ('smile_id', 'sumsub', 'youverify', 'manual') then
    raise exception 'Invalid identity verification provider';
  end if;

  if clean_link is not null and clean_link !~* '^https?://' then
    raise exception 'Verification link must be HTTP or HTTPS';
  end if;

  update public.identity_verification_requests
  set
    status = clean_status,
    provider = clean_provider,
    provider_link = clean_link,
    provider_reference = clean_reference,
    admin_notes = clean_notes,
    resolved_at = case
      when clean_status in ('verified', 'failed', 'expired', 'cancelled') then coalesce(resolved_at, now())
      else null
    end
  where id = input_id
  returning * into updated_request;

  if not found then
    raise exception 'Identity verification request not found';
  end if;

  account_status := case
    when clean_status = 'requested' then 'manual_review'
    when clean_status = 'cancelled' then 'not_started'
    else clean_status
  end;

  update public.account_profiles
  set
    identity_verification_provider = clean_provider,
    identity_verification_status = account_status,
    identity_verification_link = clean_link,
    identity_verification_reference = clean_reference,
    identity_verified_at = case
      when account_status = 'verified' then coalesce(identity_verified_at, now())
      else null
    end,
    identity_verification_notes = clean_notes
  where user_id = updated_request.user_id;

  return updated_request;
end;
$$;

revoke all on function app_private.update_identity_verification_request(uuid, text, text, text, text, text) from public;
revoke all on function app_private.update_identity_verification_request(uuid, text, text, text, text, text) from anon;
grant execute on function app_private.update_identity_verification_request(uuid, text, text, text, text, text) to authenticated;

create or replace function public.update_identity_verification_request(
  input_id uuid,
  input_status text,
  input_provider text,
  input_link text default null,
  input_reference text default null,
  input_admin_notes text default null
)
returns public.identity_verification_requests
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.update_identity_verification_request(
    input_id,
    input_status,
    input_provider,
    input_link,
    input_reference,
    input_admin_notes
  );
$$;

revoke all on function public.update_identity_verification_request(uuid, text, text, text, text, text) from public;
grant execute on function public.update_identity_verification_request(uuid, text, text, text, text, text) to authenticated;
