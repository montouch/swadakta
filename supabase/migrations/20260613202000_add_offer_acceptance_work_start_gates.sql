create or replace function app_private.ensure_work_start_is_protected()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('in_progress', 'waiting_client', 'completed') then
    if new.assigned_partner_id is null then
      raise exception 'Assign a verified receiver before work can start.';
    end if;

    if new.route_status not in ('active', 'pilot') then
      raise exception 'This route is not approved for active work.';
    end if;

    if new.compliance_status in ('restricted', 'prohibited')
      or new.compliance_risk_level in ('high', 'blocked')
      or new.admin_review_required is true then
      raise exception 'Compliance review must be cleared before work can start.';
    end if;

    if new.sensitive_documents_expected is true and new.verification_status <> 'verified' then
      raise exception 'Verify the client before starting sensitive-document work.';
    end if;

    if coalesce(new.protected_amount, 0) <= 0
      or new.payment_status not in ('deposit_paid', 'paid')
      or new.funds_status not in (
        'authorized',
        'held_by_provider',
        'deposit_confirmed',
        'partially_released',
        'released'
      ) then
      raise exception 'Protected payment evidence is required before work can start.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists service_requests_work_start_protected on public.service_requests;
create trigger service_requests_work_start_protected
before insert or update of
  status,
  assigned_partner_id,
  payment_status,
  funds_status,
  protected_amount,
  route_status,
  compliance_status,
  compliance_risk_level,
  admin_review_required,
  sensitive_documents_expected,
  verification_status
on public.service_requests
for each row
execute function app_private.ensure_work_start_is_protected();

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
      or receiver_application.proof_standard_consent is not true then
      raise exception 'Shortlist only: receiver must be vetted, ID verified, and proof standards accepted before acceptance.';
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
          ' accepted and receiver assigned. Work start remains locked until protected payment, route, and compliance gates pass.'
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
