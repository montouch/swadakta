create table if not exists public.job_offers (
  id uuid primary key default gen_random_uuid(),
  offer_code text not null unique default ('JO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  partner_application_id uuid not null references public.partner_applications(id) on delete cascade,
  receiver_user_id uuid references auth.users(id) on delete set null,
  receiver_email text not null,
  amount integer not null,
  currency text not null default 'AUD',
  timeline_days integer not null default 3,
  proof_plan text not null,
  message text,
  status text not null default 'submitted',
  safety_flags text[] not null default array[]::text[],
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_offers add column if not exists offer_code text not null default ('JO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));
alter table public.job_offers add column if not exists service_request_id uuid references public.service_requests(id) on delete cascade;
alter table public.job_offers add column if not exists partner_application_id uuid references public.partner_applications(id) on delete cascade;
alter table public.job_offers add column if not exists receiver_user_id uuid references auth.users(id) on delete set null;
alter table public.job_offers add column if not exists receiver_email text not null default '';
alter table public.job_offers add column if not exists amount integer not null default 0;
alter table public.job_offers add column if not exists currency text not null default 'AUD';
alter table public.job_offers add column if not exists timeline_days integer not null default 3;
alter table public.job_offers add column if not exists proof_plan text not null default '';
alter table public.job_offers add column if not exists message text;
alter table public.job_offers add column if not exists status text not null default 'submitted';
alter table public.job_offers add column if not exists safety_flags text[] not null default array[]::text[];
alter table public.job_offers add column if not exists admin_notes text;
alter table public.job_offers add column if not exists created_at timestamptz not null default now();
alter table public.job_offers add column if not exists updated_at timestamptz not null default now();

create unique index if not exists job_offers_offer_code_key
  on public.job_offers (offer_code);
create unique index if not exists job_offers_request_partner_key
  on public.job_offers (service_request_id, partner_application_id);
create index if not exists job_offers_request_status_idx
  on public.job_offers (service_request_id, status, updated_at desc);
create index if not exists job_offers_partner_idx
  on public.job_offers (partner_application_id, updated_at desc);
create index if not exists job_offers_receiver_email_idx
  on public.job_offers (lower(btrim(receiver_email)), updated_at desc);

alter table public.job_offers drop constraint if exists job_offers_amount_check;
alter table public.job_offers
  add constraint job_offers_amount_check check (amount >= 0);

alter table public.job_offers drop constraint if exists job_offers_currency_check;
alter table public.job_offers
  add constraint job_offers_currency_check check (currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES', 'CNY'));

alter table public.job_offers drop constraint if exists job_offers_timeline_days_check;
alter table public.job_offers
  add constraint job_offers_timeline_days_check check (timeline_days between 1 and 60);

alter table public.job_offers drop constraint if exists job_offers_proof_plan_check;
alter table public.job_offers
  add constraint job_offers_proof_plan_check check (btrim(proof_plan) <> '');

alter table public.job_offers drop constraint if exists job_offers_status_check;
alter table public.job_offers
  add constraint job_offers_status_check check (status in ('submitted', 'shortlisted', 'accepted', 'declined', 'withdrawn', 'blocked'));

drop trigger if exists job_offers_set_updated_at on public.job_offers;
create trigger job_offers_set_updated_at
before update on public.job_offers
for each row
execute function app_private.set_updated_at();

alter table public.job_offers enable row level security;

drop policy if exists "Admins can read job offers" on public.job_offers;
create policy "Admins can read job offers"
on public.job_offers
for select
to authenticated
using ((select app_private.is_admin()));

drop policy if exists "Receivers can read own job offers" on public.job_offers;
create policy "Receivers can read own job offers"
on public.job_offers
for select
to authenticated
using (
  receiver_user_id = (select auth.uid())
  or lower(btrim(receiver_email)) = lower(btrim((select app_private.current_auth_email())))
);

drop policy if exists "Clients can read offers on own requests" on public.job_offers;
create policy "Clients can read offers on own requests"
on public.job_offers
for select
to authenticated
using (
  exists (
    select 1
    from public.service_requests sr
    where sr.id = job_offers.service_request_id
      and lower(btrim(coalesce(sr.email, ''))) = lower(btrim((select app_private.current_auth_email())))
  )
);

drop policy if exists "Admins can update job offers" on public.job_offers;
create policy "Admins can update job offers"
on public.job_offers
for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

revoke all on table public.job_offers from anon, authenticated;
grant select on public.job_offers to authenticated;

create or replace function app_private.marketplace_job_is_open(target_request public.service_requests)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    target_request.assigned_partner_id is null
    and target_request.status in ('new', 'quoted', 'paid')
    and target_request.route_status in ('active', 'pilot')
    and target_request.compliance_status not in ('restricted', 'prohibited')
    and target_request.compliance_risk_level in ('standard', 'medium')
    and target_request.sensitive_documents_expected is false;
$$;

create or replace function app_private.list_marketplace_jobs()
returns table (
  id uuid,
  request_code text,
  origin_country text,
  destination_country text,
  service_direction text,
  task_location text,
  route_status text,
  logistics_mode text,
  goods_category text,
  service_package text,
  task_type text,
  urgency text,
  deadline date,
  budget_range text,
  proof_priority text,
  proof_requirements text[],
  compliance_risk_level text,
  funds_status text,
  quote_amount integer,
  quote_currency text,
  status text,
  offer_count integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    sr.id,
    sr.request_code,
    sr.origin_country,
    sr.destination_country,
    sr.service_direction,
    coalesce(sr.task_location, sr.kenya_location) as task_location,
    sr.route_status,
    sr.logistics_mode,
    sr.goods_category,
    sr.service_package,
    sr.task_type,
    sr.urgency,
    sr.deadline,
    sr.budget_range,
    sr.proof_priority,
    sr.proof_requirements,
    sr.compliance_risk_level,
    sr.funds_status,
    sr.quote_amount,
    sr.quote_currency,
    sr.status,
    count(jo.id)::integer as offer_count,
    sr.created_at
  from public.service_requests sr
  left join public.job_offers jo on jo.service_request_id = sr.id
  where app_private.marketplace_job_is_open(sr)
  group by sr.id
  order by sr.created_at desc
  limit 80;
$$;

revoke all on function app_private.list_marketplace_jobs() from public;
revoke all on function app_private.list_marketplace_jobs() from anon;
grant execute on function app_private.list_marketplace_jobs() to authenticated;

create or replace function public.list_marketplace_jobs()
returns table (
  id uuid,
  request_code text,
  origin_country text,
  destination_country text,
  service_direction text,
  task_location text,
  route_status text,
  logistics_mode text,
  goods_category text,
  service_package text,
  task_type text,
  urgency text,
  deadline date,
  budget_range text,
  proof_priority text,
  proof_requirements text[],
  compliance_risk_level text,
  funds_status text,
  quote_amount integer,
  quote_currency text,
  status text,
  offer_count integer,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_marketplace_jobs();
$$;

revoke all on function public.list_marketplace_jobs() from public;
revoke all on function public.list_marketplace_jobs() from anon;
grant execute on function public.list_marketplace_jobs() to authenticated;

create or replace function app_private.submit_job_offer(
  input_request_code text,
  input_amount integer,
  input_currency text default 'AUD',
  input_timeline_days integer default 3,
  input_proof_plan text default '',
  input_message text default ''
)
returns table (
  id uuid,
  offer_code text,
  request_code text,
  amount integer,
  currency text,
  timeline_days integer,
  status text,
  safety_flags text[],
  created_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(btrim(app_private.current_auth_email()));
  target_request public.service_requests%rowtype;
  receiver_application public.partner_applications%rowtype;
  clean_request_code text := upper(btrim(coalesce(input_request_code, '')));
  clean_currency text := upper(btrim(coalesce(input_currency, 'AUD')));
  clean_proof_plan text := left(btrim(coalesce(input_proof_plan, '')), 1400);
  clean_message text := left(btrim(coalesce(input_message, '')), 1400);
  clean_amount integer := coalesce(input_amount, 0);
  clean_timeline_days integer := coalesce(input_timeline_days, 3);
  flags text[] := array[]::text[];
  saved_offer public.job_offers%rowtype;
begin
  if current_user_id is null or current_email = '' then
    raise exception 'Sign in before making an offer.';
  end if;

  if clean_amount < 0 then
    raise exception 'Offer amount must be zero or higher.';
  end if;

  if clean_currency not in ('AUD', 'USD', 'GBP', 'EUR', 'KES', 'CNY') then
    raise exception 'Unsupported offer currency.';
  end if;

  if clean_timeline_days < 1 or clean_timeline_days > 60 then
    raise exception 'Timeline must be between 1 and 60 days.';
  end if;

  if clean_proof_plan = '' then
    raise exception 'Add a proof plan before making an offer.';
  end if;

  select *
  into target_request
  from public.service_requests sr
  where sr.request_code = clean_request_code;

  if not found or not app_private.marketplace_job_is_open(target_request) then
    raise exception 'This job is not open for offers.';
  end if;

  if lower(btrim(coalesce(target_request.email, ''))) = current_email then
    raise exception 'You cannot make an offer on your own job.';
  end if;

  select *
  into receiver_application
  from public.partner_applications pa
  where lower(btrim(coalesce(pa.email, ''))) = current_email
  order by
    case when pa.status = 'vetted' then 0 else 1 end,
    case when pa.identity_verification_status = 'verified' then 0 else 1 end,
    pa.updated_at desc
  limit 1;

  if not found then
    raise exception 'Save a job seeker profile before making an offer.';
  end if;

  if receiver_application.status <> 'vetted' then
    flags := array_append(flags, 'vetting_required_before_acceptance');
  end if;

  if receiver_application.identity_verification_status <> 'verified' then
    flags := array_append(flags, 'verification_required_before_acceptance');
  end if;

  if receiver_application.id_verification_consent is not true then
    flags := array_append(flags, 'id_consent_required');
  end if;

  if receiver_application.proof_standard_consent is not true then
    flags := array_append(flags, 'proof_standard_required');
  end if;

  insert into public.job_offers (
    service_request_id,
    partner_application_id,
    receiver_user_id,
    receiver_email,
    amount,
    currency,
    timeline_days,
    proof_plan,
    message,
    status,
    safety_flags
  )
  values (
    target_request.id,
    receiver_application.id,
    current_user_id,
    current_email,
    clean_amount,
    clean_currency,
    clean_timeline_days,
    clean_proof_plan,
    clean_message,
    'submitted',
    flags
  )
  on conflict (service_request_id, partner_application_id) do update
  set
    receiver_user_id = excluded.receiver_user_id,
    receiver_email = excluded.receiver_email,
    amount = excluded.amount,
    currency = excluded.currency,
    timeline_days = excluded.timeline_days,
    proof_plan = excluded.proof_plan,
    message = excluded.message,
    status = 'submitted',
    safety_flags = excluded.safety_flags,
    admin_notes = null
  returning * into saved_offer;

  return query
  select
    saved_offer.id,
    saved_offer.offer_code,
    target_request.request_code,
    saved_offer.amount,
    saved_offer.currency,
    saved_offer.timeline_days,
    saved_offer.status,
    saved_offer.safety_flags,
    saved_offer.created_at;
end;
$$;

revoke all on function app_private.submit_job_offer(text, integer, text, integer, text, text) from public;
revoke all on function app_private.submit_job_offer(text, integer, text, integer, text, text) from anon;
grant execute on function app_private.submit_job_offer(text, integer, text, integer, text, text) to authenticated;

create or replace function public.submit_job_offer(
  input_request_code text,
  input_amount integer,
  input_currency text default 'AUD',
  input_timeline_days integer default 3,
  input_proof_plan text default '',
  input_message text default ''
)
returns table (
  id uuid,
  offer_code text,
  request_code text,
  amount integer,
  currency text,
  timeline_days integer,
  status text,
  safety_flags text[],
  created_at timestamptz
)
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.submit_job_offer(
    input_request_code,
    input_amount,
    input_currency,
    input_timeline_days,
    input_proof_plan,
    input_message
  );
$$;

revoke all on function public.submit_job_offer(text, integer, text, integer, text, text) from public;
revoke all on function public.submit_job_offer(text, integer, text, integer, text, text) from anon;
grant execute on function public.submit_job_offer(text, integer, text, integer, text, text) to authenticated;

create or replace function app_private.list_my_job_offers()
returns table (
  offer_code text,
  request_code text,
  amount integer,
  currency text,
  timeline_days integer,
  proof_plan text,
  message text,
  status text,
  safety_flags text[],
  provenance_score integer,
  verification_status text,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    jo.offer_code,
    sr.request_code,
    jo.amount,
    jo.currency,
    jo.timeline_days,
    jo.proof_plan,
    jo.message,
    jo.status,
    jo.safety_flags,
    pa.provenance_score,
    pa.identity_verification_status as verification_status,
    jo.admin_notes,
    jo.created_at,
    jo.updated_at
  from public.job_offers jo
  join public.service_requests sr on sr.id = jo.service_request_id
  join public.partner_applications pa on pa.id = jo.partner_application_id
  where lower(btrim(jo.receiver_email)) = lower(btrim(app_private.current_auth_email()))
    and btrim(coalesce(jo.receiver_email, '')) <> ''
  order by jo.updated_at desc
  limit 80;
$$;

revoke all on function app_private.list_my_job_offers() from public;
revoke all on function app_private.list_my_job_offers() from anon;
grant execute on function app_private.list_my_job_offers() to authenticated;

create or replace function public.list_my_job_offers()
returns table (
  offer_code text,
  request_code text,
  amount integer,
  currency text,
  timeline_days integer,
  proof_plan text,
  message text,
  status text,
  safety_flags text[],
  provenance_score integer,
  verification_status text,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_my_job_offers();
$$;

revoke all on function public.list_my_job_offers() from public;
revoke all on function public.list_my_job_offers() from anon;
grant execute on function public.list_my_job_offers() to authenticated;

create or replace function app_private.list_job_offers_for_admin()
returns table (
  id uuid,
  offer_code text,
  request_code text,
  service_request_id uuid,
  partner_application_id uuid,
  partner_code text,
  receiver_name text,
  receiver_email text,
  receiver_base text,
  amount integer,
  currency text,
  timeline_days integer,
  proof_plan text,
  message text,
  status text,
  safety_flags text[],
  provenance_score integer,
  verification_status text,
  partner_status text,
  admin_notes text,
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
    raise exception 'Admin access required.';
  end if;

  return query
  select
    jo.id,
    jo.offer_code,
    sr.request_code,
    jo.service_request_id,
    jo.partner_application_id,
    pa.partner_code,
    pa.full_name as receiver_name,
    jo.receiver_email,
    pa.kenya_base as receiver_base,
    jo.amount,
    jo.currency,
    jo.timeline_days,
    jo.proof_plan,
    jo.message,
    jo.status,
    jo.safety_flags,
    pa.provenance_score,
    pa.identity_verification_status as verification_status,
    pa.status as partner_status,
    jo.admin_notes,
    jo.created_at,
    jo.updated_at
  from public.job_offers jo
  join public.service_requests sr on sr.id = jo.service_request_id
  join public.partner_applications pa on pa.id = jo.partner_application_id
  order by
    case jo.status when 'shortlisted' then 0 when 'submitted' then 1 when 'accepted' then 2 else 3 end,
    jo.updated_at desc
  limit 200;
end;
$$;

revoke all on function app_private.list_job_offers_for_admin() from public;
revoke all on function app_private.list_job_offers_for_admin() from anon;
grant execute on function app_private.list_job_offers_for_admin() to authenticated;

create or replace function public.list_job_offers_for_admin()
returns table (
  id uuid,
  offer_code text,
  request_code text,
  service_request_id uuid,
  partner_application_id uuid,
  partner_code text,
  receiver_name text,
  receiver_email text,
  receiver_base text,
  amount integer,
  currency text,
  timeline_days integer,
  proof_plan text,
  message text,
  status text,
  safety_flags text[],
  provenance_score integer,
  verification_status text,
  partner_status text,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_job_offers_for_admin();
$$;

revoke all on function public.list_job_offers_for_admin() from public;
revoke all on function public.list_job_offers_for_admin() from anon;
grant execute on function public.list_job_offers_for_admin() to authenticated;

create or replace function app_private.update_job_offer_status(
  input_offer_code text,
  input_status text,
  input_admin_notes text default ''
)
returns public.job_offers
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  clean_code text := upper(btrim(coalesce(input_offer_code, '')));
  clean_status text := lower(btrim(coalesce(input_status, 'submitted')));
  clean_notes text := left(btrim(coalesce(input_admin_notes, '')), 1400);
  updated_offer public.job_offers%rowtype;
begin
  if not app_private.is_admin() then
    raise exception 'Admin access required.';
  end if;

  if clean_status not in ('submitted', 'shortlisted', 'accepted', 'declined', 'withdrawn', 'blocked') then
    raise exception 'Unsupported offer status.';
  end if;

  update public.job_offers
  set
    status = clean_status,
    admin_notes = nullif(clean_notes, '')
  where offer_code = clean_code
  returning * into updated_offer;

  if not found then
    raise exception 'Offer not found.';
  end if;

  if clean_status = 'accepted' then
    update public.job_offers
    set status = 'declined',
        admin_notes = coalesce(admin_notes, 'Another offer was accepted for this request.')
    where service_request_id = updated_offer.service_request_id
      and id <> updated_offer.id
      and status in ('submitted', 'shortlisted');

    update public.service_requests
    set
      automation_status = 'receiver_routed',
      operator_notes = concat_ws(
        E'\n',
        nullif(operator_notes, ''),
        concat('Offer ', updated_offer.offer_code, ' accepted for receiver review. Assignment, funds protection, and payout release remain protected gates.')
      )
    where id = updated_offer.service_request_id;
  end if;

  return updated_offer;
end;
$$;

revoke all on function app_private.update_job_offer_status(text, text, text) from public;
revoke all on function app_private.update_job_offer_status(text, text, text) from anon;
grant execute on function app_private.update_job_offer_status(text, text, text) to authenticated;

create or replace function public.update_job_offer_status(
  input_offer_code text,
  input_status text,
  input_admin_notes text default ''
)
returns public.job_offers
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.update_job_offer_status(
    input_offer_code,
    input_status,
    input_admin_notes
  );
$$;

revoke all on function public.update_job_offer_status(text, text, text) from public;
revoke all on function public.update_job_offer_status(text, text, text) from anon;
grant execute on function public.update_job_offer_status(text, text, text) to authenticated;
