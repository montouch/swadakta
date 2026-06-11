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
  client_report_url text,
  proof_links text[] not null default array[]::text[],
  contact_permission boolean not null default false,
  professional_boundary_accepted boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
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
alter table public.service_requests add column if not exists quote_amount integer;
alter table public.service_requests add column if not exists quote_currency text not null default 'AUD';
alter table public.service_requests add column if not exists payment_link text;
alter table public.service_requests add column if not exists payment_due_at date;
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
    select 1 from pg_constraint where conname = 'service_requests_payment_link_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_payment_link_check check (coalesce(payment_link, '') = '' or payment_link ~* '^https?://[^[:space:]]+$');
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
end
$$;

create index if not exists service_requests_status_idx on public.service_requests (status);
create index if not exists service_requests_created_at_idx on public.service_requests (created_at desc);

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

alter table public.admin_users enable row level security;
alter table public.service_requests enable row level security;

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

grant usage on schema public to anon, authenticated;
grant usage on schema app_private to anon, authenticated;
grant execute on function app_private.is_admin() to authenticated;

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
  quote_amount,
  quote_currency,
  payment_link,
  payment_due_at,
  client_report_url,
  proof_links
) on public.service_requests to authenticated;
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
grant execute on function app_private.track_service_request(text, text) to anon, authenticated;

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
security invoker
set search_path = public, app_private
as $$
  select * from app_private.track_service_request(lookup_code, lookup_contact);
$$;

revoke all on function public.track_service_request(text, text) from public;
grant execute on function public.track_service_request(text, text) to anon, authenticated;

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
