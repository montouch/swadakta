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
  australia_location text,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
using (user_id = auth.uid());

drop policy if exists "Anyone can submit service requests" on public.service_requests;
create policy "Anyone can submit service requests"
on public.service_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read service requests" on public.service_requests;
create policy "Admins can read service requests"
on public.service_requests
for select
to authenticated
using (app_private.is_admin());

drop policy if exists "Admins can update service requests" on public.service_requests;
create policy "Admins can update service requests"
on public.service_requests
for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

grant usage on schema public to anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_admin() to authenticated;

grant insert (
  id,
  request_code,
  client_name,
  email,
  whatsapp,
  australia_location,
  task_type,
  kenya_location,
  urgency,
  report_pack,
  hours_estimate,
  estimate_aud,
  notes
) on public.service_requests to anon, authenticated;

grant select on public.service_requests to authenticated;
grant update (
  status,
  payment_status,
  assigned_to,
  operator_notes,
  client_report
) on public.service_requests to authenticated;
grant select on public.admin_users to authenticated;

-- After your first admin user signs in once, replace the UUID below with their
-- auth.users.id value from Supabase Authentication > Users.
--
-- insert into public.admin_users (user_id, role)
-- values ('00000000-0000-0000-0000-000000000000', 'owner')
-- on conflict (user_id) do update set role = excluded.role;
