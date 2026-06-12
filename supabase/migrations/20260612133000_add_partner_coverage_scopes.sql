alter table public.partner_applications
  add column if not exists coverage_scopes text[] not null default array[]::text[];

alter table public.partner_applications drop constraint if exists partner_applications_categories_check;
alter table public.partner_applications
  add constraint partner_applications_categories_check
  check (
    coalesce(array_length(service_categories, 1), 0) between 1 and 6
    and service_categories <@ array[
      'property_checks',
      'documents',
      'shopping_delivery',
      'sourcing',
      'family_support',
      'business_support',
      'site_visits',
      'registry_errands',
      'family_logistics',
      'deliveries',
      'virtual_ops'
    ]::text[]
  );

alter table public.partner_applications drop constraint if exists partner_applications_coverage_scopes_check;
alter table public.partner_applications
  add constraint partner_applications_coverage_scopes_check
  check (
    coalesce(array_length(coverage_scopes, 1), 0) between 0 and 6
    and coverage_scopes <@ array[
      'local_in_country',
      'africa_to_africa',
      'diaspora_to_africa',
      'africa_to_diaspora',
      'postal_courier_ready',
      'digital_remote'
    ]::text[]
  );

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
  and service_categories <@ array[
    'property_checks',
    'documents',
    'shopping_delivery',
    'sourcing',
    'family_support',
    'business_support',
    'site_visits',
    'registry_errands',
    'family_logistics',
    'deliveries',
    'virtual_ops'
  ]::text[]
  and coalesce(array_length(coverage_scopes, 1), 0) between 1 and 6
  and coverage_scopes <@ array[
    'local_in_country',
    'africa_to_africa',
    'diaspora_to_africa',
    'africa_to_diaspora',
    'postal_courier_ready',
    'digital_remote'
  ]::text[]
  and availability in ('weekdays', 'weekends', 'evenings', 'flexible', 'case_by_case')
  and transport_access in ('public_transport', 'motorbike', 'car', 'ride_hailing', 'mixed')
  and id_verification_consent = true
  and proof_standard_consent = true
  and status = 'new'
);

grant insert (coverage_scopes) on public.partner_applications to anon, authenticated;

drop function if exists public.list_my_partner_applications();
drop function if exists app_private.list_my_partner_applications();

create or replace function app_private.list_my_partner_applications()
returns table (
  id uuid,
  partner_code text,
  email text,
  kenya_base text,
  service_regions text,
  service_categories text[],
  coverage_scopes text[],
  availability text,
  transport_access text,
  status text,
  identity_verification_provider text,
  identity_verification_status text,
  identity_verification_link text,
  identity_verification_reference text,
  identity_verified_at timestamptz,
  provenance_score integer,
  provenance_notes text,
  provenance_reviewed_at timestamptz,
  notes text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pa.id,
    pa.partner_code,
    pa.email,
    pa.kenya_base,
    pa.service_regions,
    pa.service_categories,
    pa.coverage_scopes,
    pa.availability,
    pa.transport_access,
    pa.status,
    pa.identity_verification_provider,
    pa.identity_verification_status,
    pa.identity_verification_link,
    pa.identity_verification_reference,
    pa.identity_verified_at,
    pa.provenance_score,
    pa.provenance_notes,
    pa.provenance_reviewed_at,
    pa.notes,
    pa.updated_at
  from public.partner_applications pa
  where lower(btrim(coalesce(pa.email, ''))) = lower(btrim(app_private.current_auth_email()))
    and btrim(coalesce(pa.email, '')) <> ''
  order by pa.created_at desc
  limit 50;
$$;

revoke all on function app_private.list_my_partner_applications() from public;
revoke all on function app_private.list_my_partner_applications() from anon;
grant execute on function app_private.list_my_partner_applications() to authenticated;

create or replace function public.list_my_partner_applications()
returns table (
  id uuid,
  partner_code text,
  email text,
  kenya_base text,
  service_regions text,
  service_categories text[],
  coverage_scopes text[],
  availability text,
  transport_access text,
  status text,
  identity_verification_provider text,
  identity_verification_status text,
  identity_verification_link text,
  identity_verification_reference text,
  identity_verified_at timestamptz,
  provenance_score integer,
  provenance_notes text,
  provenance_reviewed_at timestamptz,
  notes text,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_my_partner_applications();
$$;

revoke all on function public.list_my_partner_applications() from public;
grant execute on function public.list_my_partner_applications() to authenticated;
