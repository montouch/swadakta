alter table public.partner_applications
  add column if not exists code_of_conduct_consent boolean not null default false,
  add column if not exists code_of_conduct_accepted_at timestamptz;

alter table public.partner_applications
  drop constraint if exists partner_applications_vetted_requires_verified_identity_check;

alter table public.partner_applications
  add constraint partner_applications_vetted_requires_verified_identity_check check (
    status <> 'vetted'
    or (
      id_verification_consent is true
      and proof_standard_consent is true
      and code_of_conduct_consent is true
      and identity_verification_status = 'verified'
    )
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
  and code_of_conduct_consent = true
  and status = 'new'
);

grant insert (
  code_of_conduct_consent,
  code_of_conduct_accepted_at
) on public.partner_applications to anon, authenticated;

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
  code_of_conduct_consent boolean,
  code_of_conduct_accepted_at timestamptz,
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
    pa.code_of_conduct_consent,
    pa.code_of_conduct_accepted_at,
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
  code_of_conduct_consent boolean,
  code_of_conduct_accepted_at timestamptz,
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
  target_request public.service_requests%rowtype;
  receiver_application public.partner_applications%rowtype;
begin
  if not app_private.is_admin() then
    raise exception 'Admin access required.';
  end if;

  if clean_status not in ('submitted', 'shortlisted', 'accepted', 'declined', 'withdrawn', 'blocked') then
    raise exception 'Unsupported offer status.';
  end if;

  select *
  into updated_offer
  from public.job_offers
  where offer_code = clean_code
  for update;

  if not found then
    raise exception 'Offer not found.';
  end if;

  select *
  into target_request
  from public.service_requests
  where id = updated_offer.service_request_id
  for update;

  if not found then
    raise exception 'Linked request was not found.';
  end if;

  select *
  into receiver_application
  from public.partner_applications
  where id = updated_offer.partner_application_id
  for update;

  if not found then
    raise exception 'Receiver profile was not found.';
  end if;

  if clean_status = 'accepted' then
    if target_request.assigned_partner_id is not null
      and target_request.assigned_partner_id <> updated_offer.partner_application_id then
      raise exception 'This request already has another receiver assigned.';
    end if;

    if target_request.route_status not in ('active', 'pilot') then
      raise exception 'This route is not approved for receiver assignment.';
    end if;

    if target_request.compliance_status in ('restricted', 'prohibited')
      or target_request.compliance_risk_level in ('high', 'blocked')
      or target_request.admin_review_required is true then
      raise exception 'Clear compliance/admin review before accepting a receiver offer.';
    end if;

    if target_request.sensitive_documents_expected is true
      and target_request.verification_status <> 'verified' then
      raise exception 'Verify the client before accepting sensitive-document work.';
    end if;

    if receiver_application.status <> 'vetted'
      or receiver_application.identity_verification_status <> 'verified'
      or receiver_application.id_verification_consent is not true
      or receiver_application.proof_standard_consent is not true
      or receiver_application.code_of_conduct_consent is not true then
      raise exception 'Shortlist only: receiver must be vetted, ID verified, proof standards accepted, and receiver code of conduct accepted before acceptance.';
    end if;

    if coalesce(array_length(updated_offer.safety_flags, 1), 0) > 0 then
      raise exception 'Clear offer safety flags before accepting this offer.';
    end if;
  end if;

  update public.job_offers
  set
    status = clean_status,
    admin_notes = nullif(clean_notes, '')
  where id = updated_offer.id
  returning * into updated_offer;

  if clean_status = 'accepted' then
    update public.job_offers
    set status = 'declined',
        admin_notes = coalesce(admin_notes, 'Another verified receiver offer was accepted for this request.')
    where service_request_id = updated_offer.service_request_id
      and id <> updated_offer.id
      and status in ('submitted', 'shortlisted');

    update public.service_requests
    set
      assigned_partner_id = updated_offer.partner_application_id,
      automation_status = 'receiver_routed',
      operator_notes = concat_ws(
        E'\n',
        nullif(operator_notes, ''),
        concat(
          'Offer ',
          updated_offer.offer_code,
          ' accepted and receiver assigned. Work start remains locked until protected payment, route, compliance, proof, and receiver-conduct gates pass.'
        )
      )
    where id = updated_offer.service_request_id;
  end if;

  return updated_offer;
end;
$$;

revoke all on function app_private.update_job_offer_status(text, text, text) from public;
revoke all on function app_private.update_job_offer_status(text, text, text) from anon;
grant execute on function app_private.update_job_offer_status(text, text, text) to authenticated;
