create extension if not exists pgcrypto;

create schema if not exists app_private;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique default ('SW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  client_name text not null,
  email text,
  whatsapp text not null,
  client_base text,
  australia_location text,
  deadline date,
  local_contact_name text,
  local_contact_phone text,
  contact_preference text not null default 'whatsapp',
  contact_window text,
  supporting_links text[] not null default array[]::text[],
  sensitive_documents_expected boolean not null default false,
  preferred_currency text not null default 'AUD',
  service_package text not null default 'quote_first',
  payment_method_preference text not null default 'discuss',
  budget_range text not null default 'unsure',
  proof_priority text not null default 'balanced',
  referral_source text not null default 'not_sure',
  task_type text not null check (task_type in ('quick', 'site', 'registry', 'virtual')),
  kenya_location text not null,
  urgency text not null check (urgency in ('standard', 'priority', 'same-day')),
  report_pack text[] not null default array[]::text[],
  hours_estimate integer not null check (hours_estimate between 1 and 80),
  estimate_aud integer not null check (estimate_aud >= 0),
  notes text not null,
  status text not null default 'new' check (status in ('new', 'quoted', 'paid', 'in_progress', 'waiting_client', 'completed', 'cancelled')),
  payment_status text not null default 'unquoted' check (payment_status in ('unquoted', 'invoice_sent', 'deposit_paid', 'paid', 'refunded')),
  assigned_to text,
  operator_notes text,
  client_report text,
  quote_amount integer,
  quote_currency text not null default 'AUD',
  payment_link text,
  payment_due_at date,
  operator_payout integer not null default 0,
  field_costs integer not null default 0,
  payment_processing_fee integer not null default 0,
  client_report_url text,
  proof_links text[] not null default array[]::text[],
  contact_permission boolean not null default false,
  professional_boundary_accepted boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  partner_code text not null unique default ('SP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  full_name text not null,
  email text,
  whatsapp text not null,
  kenya_base text not null,
  service_regions text not null,
  service_categories text[] not null default array[]::text[],
  availability text not null default 'flexible',
  transport_access text not null default 'mixed',
  status text not null default 'new',
  internal_notes text,
  id_verification_consent boolean not null default false,
  proof_standard_consent boolean not null default false,
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_requests add column if not exists client_base text;
alter table public.service_requests add column if not exists deadline date;
alter table public.service_requests add column if not exists local_contact_name text;
alter table public.service_requests add column if not exists local_contact_phone text;
alter table public.service_requests add column if not exists contact_preference text not null default 'whatsapp';
alter table public.service_requests add column if not exists contact_window text;
alter table public.service_requests add column if not exists supporting_links text[] not null default array[]::text[];
alter table public.service_requests add column if not exists sensitive_documents_expected boolean not null default false;
alter table public.service_requests add column if not exists preferred_currency text not null default 'AUD';
alter table public.service_requests add column if not exists service_package text not null default 'quote_first';
alter table public.service_requests add column if not exists payment_method_preference text not null default 'discuss';
alter table public.service_requests add column if not exists budget_range text not null default 'unsure';
alter table public.service_requests add column if not exists proof_priority text not null default 'balanced';
alter table public.service_requests add column if not exists referral_source text not null default 'not_sure';
alter table public.service_requests add column if not exists quote_amount integer;
alter table public.service_requests add column if not exists quote_currency text not null default 'AUD';
alter table public.service_requests add column if not exists payment_link text;
alter table public.service_requests add column if not exists payment_due_at date;
alter table public.service_requests add column if not exists operator_payout integer not null default 0;
alter table public.service_requests add column if not exists field_costs integer not null default 0;
alter table public.service_requests add column if not exists payment_processing_fee integer not null default 0;
alter table public.service_requests add column if not exists client_report_url text;
alter table public.service_requests add column if not exists proof_links text[] not null default array[]::text[];
alter table public.service_requests add column if not exists contact_permission boolean not null default false;
alter table public.service_requests add column if not exists professional_boundary_accepted boolean not null default false;
alter table public.service_requests add column if not exists terms_accepted_at timestamptz;
alter table public.service_requests add column if not exists privacy_accepted_at timestamptz;

update public.service_requests
set client_base = australia_location
where client_base is null and australia_location is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_quote_amount_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_quote_amount_check check (quote_amount is null or quote_amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_contact_preference_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_contact_preference_check check (contact_preference in ('whatsapp', 'email', 'either'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_preferred_currency_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_preferred_currency_check check (preferred_currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_quote_currency_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_quote_currency_check check (quote_currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_service_package_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_service_package_check check (service_package in ('quote_first', 'quick_errand', 'site_visit', 'registry_errand', 'family_support', 'monthly_retainer', 'business_ops'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_payment_method_preference_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_payment_method_preference_check check (payment_method_preference in ('discuss', 'card', 'paypal', 'wise', 'bank'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_budget_range_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_budget_range_check check (budget_range in ('unsure', 'under_100', '100_250', '250_500', '500_plus', 'retainer'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_proof_priority_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_proof_priority_check check (proof_priority in ('balanced', 'speed', 'detailed_media', 'receipts', 'debrief'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_referral_source_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_referral_source_check check (referral_source in ('not_sure', 'facebook_instagram', 'whatsapp_group', 'friend_referral', 'search', 'community_event', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_payment_link_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_payment_link_check check (coalesce(payment_link, '') = '' or payment_link ~* '^https?://[^[:space:]]+$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_operator_payout_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_operator_payout_check check (operator_payout >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_field_costs_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_field_costs_check check (field_costs >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_payment_processing_fee_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_payment_processing_fee_check check (payment_processing_fee >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_client_report_url_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_client_report_url_check check (coalesce(client_report_url, '') = '' or client_report_url ~* '^https?://[^[:space:]]+$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_proof_links_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_proof_links_check check (
        coalesce(array_length(proof_links, 1), 0) <= 20
        and (
          coalesce(array_length(proof_links, 1), 0) = 0
          or array_to_string(proof_links, E'\n') ~* '^https?://[^\n]+(\nhttps?://[^\n]+)*$'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_supporting_links_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_supporting_links_check check (
        coalesce(array_length(supporting_links, 1), 0) <= 10
        and (
          coalesce(array_length(supporting_links, 1), 0) = 0
          or array_to_string(supporting_links, E'\n') ~* '^https?://[^\n]+(\nhttps?://[^\n]+)*$'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'partner_applications_partner_code_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_partner_code_check check (
        partner_code like 'SP-%' and length(partner_code) between 6 and 24
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'partner_applications_categories_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_categories_check check (
        coalesce(array_length(service_categories, 1), 0) between 1 and 6
        and service_categories <@ array['site_visits', 'registry_errands', 'family_logistics', 'deliveries', 'sourcing', 'virtual_ops']::text[]
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'partner_applications_availability_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_availability_check check (availability in ('weekdays', 'weekends', 'evenings', 'flexible', 'case_by_case'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'partner_applications_transport_access_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_transport_access_check check (transport_access in ('public_transport', 'motorbike', 'car', 'ride_hailing', 'mixed'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'partner_applications_status_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_status_check check (status in ('new', 'reviewing', 'vetted', 'on_hold', 'rejected'));
  end if;
end
$$;

create index if not exists service_requests_status_idx on public.service_requests (status);
create index if not exists service_requests_created_at_idx on public.service_requests (created_at desc);
create index if not exists partner_applications_status_idx on public.partner_applications (status);
create index if not exists partner_applications_created_at_idx on public.partner_applications (created_at desc);

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

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at
before update on public.service_requests
for each row
execute function app_private.set_updated_at();

drop trigger if exists partner_applications_set_updated_at on public.partner_applications;
create trigger partner_applications_set_updated_at
before update on public.partner_applications
for each row
execute function app_private.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.service_requests enable row level security;
alter table public.partner_applications enable row level security;

drop policy if exists "Admins can read own admin profile" on public.admin_users;
create policy "Admins can read own admin profile"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Anyone can submit service requests" on public.service_requests;
create policy "Anyone can submit service requests"
on public.service_requests
for insert
to anon, authenticated
with check (
  request_code like 'SW-%'
  and length(request_code) between 6 and 24
  and btrim(client_name) <> ''
  and btrim(whatsapp) <> ''
  and btrim(coalesce(client_base, australia_location, '')) <> ''
  and btrim(kenya_location) <> ''
  and btrim(notes) <> ''
  and contact_preference in ('whatsapp', 'email', 'either')
  and coalesce(array_length(supporting_links, 1), 0) <= 10
  and (
    coalesce(array_length(supporting_links, 1), 0) = 0
    or array_to_string(supporting_links, E'\n') ~* '^https?://[^\n]+(\nhttps?://[^\n]+)*$'
  )
  and preferred_currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES')
  and service_package in ('quote_first', 'quick_errand', 'site_visit', 'registry_errand', 'family_support', 'monthly_retainer', 'business_ops')
  and payment_method_preference in ('discuss', 'card', 'paypal', 'wise', 'bank')
  and budget_range in ('unsure', 'under_100', '100_250', '250_500', '500_plus', 'retainer')
  and proof_priority in ('balanced', 'speed', 'detailed_media', 'receipts', 'debrief')
  and referral_source in ('not_sure', 'facebook_instagram', 'whatsapp_group', 'friend_referral', 'search', 'community_event', 'other')
  and task_type in ('quick', 'site', 'registry', 'virtual')
  and urgency in ('standard', 'priority', 'same-day')
  and hours_estimate between 1 and 80
  and estimate_aud >= 0
  and contact_permission = true
  and professional_boundary_accepted = true
  and terms_accepted_at is not null
  and privacy_accepted_at is not null
  and status = 'new'
  and payment_status = 'unquoted'
);

drop policy if exists "Admins can read service requests" on public.service_requests;
create policy "Admins can read service requests"
on public.service_requests
for select
to authenticated
using ((select app_private.is_admin()));

drop policy if exists "Admins can update service requests" on public.service_requests;
create policy "Admins can update service requests"
on public.service_requests
for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

drop policy if exists "Anyone can apply as partner" on public.partner_applications;
create policy "Anyone can apply as partner"
on public.partner_applications
for insert
to anon, authenticated
with check (
  partner_code like 'SP-%'
  and length(partner_code) between 6 and 24
  and btrim(full_name) <> ''
  and btrim(whatsapp) <> ''
  and btrim(kenya_base) <> ''
  and btrim(service_regions) <> ''
  and btrim(notes) <> ''
  and coalesce(array_length(service_categories, 1), 0) between 1 and 6
  and service_categories <@ array['site_visits', 'registry_errands', 'family_logistics', 'deliveries', 'sourcing', 'virtual_ops']::text[]
  and availability in ('weekdays', 'weekends', 'evenings', 'flexible', 'case_by_case')
  and transport_access in ('public_transport', 'motorbike', 'car', 'ride_hailing', 'mixed')
  and id_verification_consent = true
  and proof_standard_consent = true
  and status = 'new'
);

drop policy if exists "Admins can read partner applications" on public.partner_applications;
create policy "Admins can read partner applications"
on public.partner_applications
for select
to authenticated
using ((select app_private.is_admin()));

drop policy if exists "Admins can update partner applications" on public.partner_applications;
create policy "Admins can update partner applications"
on public.partner_applications
for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

grant usage on schema public to anon, authenticated;
revoke usage on schema app_private from anon;
grant usage on schema app_private to authenticated;
revoke all on function app_private.is_admin() from public;
grant execute on function app_private.is_admin() to authenticated;

revoke truncate, references, trigger on table public.service_requests from anon, authenticated;
revoke truncate, references, trigger on table public.partner_applications from anon, authenticated;

grant insert (
  id,
  request_code,
  client_name,
  email,
  whatsapp,
  client_base,
  australia_location,
  deadline,
  local_contact_name,
  local_contact_phone,
  contact_preference,
  contact_window,
  supporting_links,
  sensitive_documents_expected,
  preferred_currency,
  service_package,
  payment_method_preference,
  budget_range,
  proof_priority,
  referral_source,
  task_type,
  kenya_location,
  urgency,
  report_pack,
  hours_estimate,
  estimate_aud,
  notes,
  contact_permission,
  professional_boundary_accepted,
  terms_accepted_at,
  privacy_accepted_at
) on public.service_requests to anon, authenticated;

grant select on public.service_requests to authenticated;
grant update (
  status,
  payment_status,
  assigned_to,
  operator_notes,
  client_report,
  service_package,
  quote_amount,
  quote_currency,
  payment_link,
  payment_due_at,
  operator_payout,
  field_costs,
  payment_processing_fee,
  client_report_url,
  proof_links
) on public.service_requests to authenticated;

grant insert (
  id,
  partner_code,
  full_name,
  email,
  whatsapp,
  kenya_base,
  service_regions,
  service_categories,
  availability,
  transport_access,
  notes,
  id_verification_consent,
  proof_standard_consent
) on public.partner_applications to anon, authenticated;

grant select on public.partner_applications to authenticated;
grant update (
  status,
  internal_notes
) on public.partner_applications to authenticated;
grant select on public.admin_users to authenticated;

create or replace function app_private.track_service_request(
  lookup_code text,
  lookup_contact text
)
returns table (
  request_code text,
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sr.request_code,
    sr.status,
    sr.payment_status,
    sr.quote_amount,
    sr.quote_currency,
    sr.payment_link,
    sr.client_report,
    sr.client_report_url,
    sr.proof_links,
    sr.updated_at
  from public.service_requests sr
  where upper(btrim(sr.request_code)) = upper(btrim(lookup_code))
    and (
      lower(btrim(coalesce(sr.email, ''))) = lower(btrim(lookup_contact))
      or regexp_replace(coalesce(sr.whatsapp, ''), '\D', '', 'g') = regexp_replace(coalesce(lookup_contact, ''), '\D', '', 'g')
    )
  limit 1;
$$;

revoke all on function app_private.track_service_request(text, text) from public;
revoke all on function app_private.track_service_request(text, text) from anon, authenticated;

create or replace function public.track_service_request(
  lookup_code text,
  lookup_contact text
)
returns table (
  request_code text,
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, app_private
as $$
  select * from app_private.track_service_request(lookup_code, lookup_contact);
$$;

revoke all on function public.track_service_request(text, text) from public;
grant execute on function public.track_service_request(text, text) to anon, authenticated;

create or replace function app_private.list_my_service_requests()
returns table (
  request_code text,
  service_package text,
  kenya_location text,
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sr.request_code,
    sr.service_package,
    sr.kenya_location,
    sr.status,
    sr.payment_status,
    sr.quote_amount,
    sr.quote_currency,
    sr.payment_link,
    sr.client_report,
    sr.client_report_url,
    sr.proof_links,
    sr.updated_at
  from public.service_requests sr
  where lower(btrim(coalesce(sr.email, ''))) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    and btrim(coalesce(sr.email, '')) <> ''
  order by sr.created_at desc
  limit 50;
$$;

revoke all on function app_private.list_my_service_requests() from public;
revoke all on function app_private.list_my_service_requests() from anon, authenticated;

create or replace function public.list_my_service_requests()
returns table (
  request_code text,
  service_package text,
  kenya_location text,
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, app_private
as $$
  select * from app_private.list_my_service_requests();
$$;

revoke all on function public.list_my_service_requests() from public;
grant execute on function public.list_my_service_requests() to authenticated;

create or replace function app_private.list_my_partner_applications()
returns table (
  partner_code text,
  kenya_base text,
  service_regions text,
  service_categories text[],
  availability text,
  transport_access text,
  status text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pa.partner_code,
    pa.kenya_base,
    pa.service_regions,
    pa.service_categories,
    pa.availability,
    pa.transport_access,
    pa.status,
    pa.updated_at
  from public.partner_applications pa
  where lower(btrim(coalesce(pa.email, ''))) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    and btrim(coalesce(pa.email, '')) <> ''
  order by pa.created_at desc
  limit 50;
$$;

revoke all on function app_private.list_my_partner_applications() from public;
revoke all on function app_private.list_my_partner_applications() from anon, authenticated;

create or replace function public.list_my_partner_applications()
returns table (
  partner_code text,
  kenya_base text,
  service_regions text,
  service_categories text[],
  availability text,
  transport_access text,
  status text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, app_private
as $$
  select * from app_private.list_my_partner_applications();
$$;

revoke all on function public.list_my_partner_applications() from public;
grant execute on function public.list_my_partner_applications() to authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
  end if;
end
$$;

-- After your first admin user signs in once, replace the UUID below with their
-- auth.users.id value from Supabase Authentication > Users.
--
-- insert into public.admin_users (user_id, role)
-- values ('00000000-0000-0000-0000-000000000000', 'owner')
-- on conflict (user_id) do update set role = excluded.role;
