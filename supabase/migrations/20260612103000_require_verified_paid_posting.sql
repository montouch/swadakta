create schema if not exists app_private;

create or replace function app_private.can_submit_paid_service_request(input_email text)
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    auth.uid() is not null
    and lower(btrim(coalesce(input_email, ''))) = lower(btrim(app_private.current_auth_email()))
    and exists (
      select 1
      from public.account_profiles profile
      where profile.user_id = auth.uid()
        and lower(btrim(profile.email)) = lower(btrim(app_private.current_auth_email()))
        and profile.identity_verification_status = 'verified'
    );
$$;

revoke all on function app_private.can_submit_paid_service_request(text) from public;
revoke all on function app_private.can_submit_paid_service_request(text) from anon;
grant execute on function app_private.can_submit_paid_service_request(text) to authenticated;

alter table public.service_requests enable row level security;

drop policy if exists "Anyone can submit service requests" on public.service_requests;
drop policy if exists "Verified accounts can submit service requests" on public.service_requests;
create policy "Verified accounts can submit service requests"
on public.service_requests
for insert
to authenticated
with check (
  request_code like 'SW-%'
  and length(request_code) between 6 and 24
  and (select app_private.can_submit_paid_service_request(email))
  and btrim(client_name) <> ''
  and btrim(whatsapp) <> ''
  and btrim(coalesce(client_base, australia_location, '')) <> ''
  and btrim(origin_country) <> ''
  and btrim(destination_country) <> ''
  and btrim(kenya_location) <> ''
  and btrim(coalesce(task_location, kenya_location, '')) <> ''
  and btrim(notes) <> ''
  and service_direction in ('origin_to_destination', 'destination_to_origin', 'two_way', 'local_in_country', 'digital_global')
  and route_status in ('active', 'pilot', 'unsupported', 'blocked')
  and logistics_mode in ('not_needed', 'local_delivery', 'postal_courier', 'pickup_hold', 'supplier_direct', 'airport_handoff', 'digital_only')
  and goods_category in ('none', 'general_goods', 'clothing_household', 'electronics', 'cosmetics', 'food_plant_animal', 'medicine_health', 'documents', 'valuable_items', 'restricted_or_unsure')
  and coalesce(array_length(compliance_flags, 1), 0) <= 20
  and coalesce(array_length(required_checks, 1), 0) <= 20
  and coalesce(array_length(proof_requirements, 1), 0) <= 20
  and compliance_acknowledged = true
  and compliance_status in ('not_applicable', 'needs_ai_review', 'needs_admin_review', 'cleared', 'restricted', 'permit_required', 'prohibited')
  and compliance_risk_level in ('standard', 'medium', 'high', 'blocked')
  and automation_status in ('ai_triage', 'self_service', 'receiver_routed', 'admin_review', 'founder_approval', 'blocked')
  and contact_preference in ('whatsapp', 'email', 'either')
  and coalesce(array_length(supporting_links, 1), 0) <= 10
  and (
    coalesce(array_length(supporting_links, 1), 0) = 0
    or array_to_string(supporting_links, E'\n') ~* '^https?://[^\n]+(\nhttps?://[^\n]+)*$'
  )
  and preferred_currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES', 'CNY')
  and service_package in ('quote_first', 'quick_errand', 'site_visit', 'registry_errand', 'family_support', 'shopping_sourcing', 'monthly_retainer', 'business_ops')
  and payment_method_preference in ('discuss', 'card', 'paypal', 'wise', 'mpesa', 'bank')
  and job_value_band in ('unsure', 'under_500', '500_2000', '2000_10000', '10000_plus')
  and funds_protection_preference in ('quote_first', 'deposit_milestones', 'regulated_escrow', 'not_sure')
  and budget_range in ('unsure', 'under_100', '100_250', '250_500', '500_plus', 'retainer')
  and proof_priority in ('balanced', 'speed', 'detailed_media', 'receipts', 'debrief')
  and referral_source in ('not_sure', 'facebook_instagram', 'whatsapp_group', 'friend_referral', 'search', 'community_event', 'other')
  and task_type in ('quick', 'shopping', 'site', 'registry', 'virtual')
  and urgency in ('standard', 'priority', 'same-day')
  and hours_estimate between 1 and 80
  and estimate_aud >= 0
  and contact_permission = true
  and professional_boundary_accepted = true
  and identity_verification_required = true
  and verification_status = 'required'
  and identity_verification_consent = true
  and terms_accepted_at is not null
  and privacy_accepted_at is not null
  and status = 'new'
  and payment_status = 'unquoted'
);

revoke insert on public.service_requests from anon;
grant insert (
  id,
  request_code,
  client_name,
  email,
  whatsapp,
  client_base,
  australia_location,
  origin_country,
  destination_country,
  service_direction,
  task_location,
  logistics_mode,
  goods_category,
  logistics_notes,
  route_status,
  compliance_flags,
  required_checks,
  proof_requirements,
  compliance_acknowledged,
  compliance_status,
  compliance_risk_level,
  automation_status,
  admin_review_required,
  admin_review_reason,
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
  job_value_band,
  funds_protection_preference,
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
  identity_verification_required,
  verification_status,
  identity_verification_consent,
  terms_accepted_at,
  privacy_accepted_at
) on public.service_requests to authenticated;
