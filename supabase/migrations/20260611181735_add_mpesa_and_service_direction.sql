alter table public.service_requests
  add column if not exists origin_country text not null default 'Australia';

alter table public.service_requests
  add column if not exists destination_country text not null default 'Kenya';

alter table public.service_requests
  add column if not exists service_direction text not null default 'origin_to_destination';

alter table public.service_requests
  add column if not exists task_location text;

alter table public.service_requests
  add column if not exists logistics_mode text not null default 'not_needed';

alter table public.service_requests
  add column if not exists goods_category text not null default 'none';

alter table public.service_requests
  add column if not exists logistics_notes text;

alter table public.service_requests
  add column if not exists compliance_acknowledged boolean not null default false;

alter table public.service_requests
  add column if not exists compliance_status text not null default 'needs_ai_review';

alter table public.service_requests
  add column if not exists compliance_risk_level text not null default 'standard';

alter table public.service_requests
  add column if not exists automation_status text not null default 'ai_triage';

alter table public.service_requests
  add column if not exists admin_review_required boolean not null default false;

alter table public.service_requests
  add column if not exists admin_review_reason text;

update public.service_requests
set task_location = kenya_location
where task_location is null
  and kenya_location is not null;

update public.service_requests
set service_direction = 'origin_to_destination'
where service_direction in ('to_kenya', 'to_australia')
   or service_direction is null
   or btrim(service_direction) = '';

alter table public.service_requests
  alter column service_direction set default 'origin_to_destination';

alter table public.service_requests
  alter column service_direction set not null;

alter table public.service_requests
  drop constraint if exists service_requests_service_direction_check;

alter table public.service_requests
  add constraint service_requests_service_direction_check
  check (service_direction in ('origin_to_destination', 'destination_to_origin', 'two_way', 'local_in_country', 'digital_global'));

alter table public.service_requests
  drop constraint if exists service_requests_service_package_check;

alter table public.service_requests
  add constraint service_requests_service_package_check
  check (service_package in ('quote_first', 'quick_errand', 'site_visit', 'registry_errand', 'family_support', 'shopping_sourcing', 'monthly_retainer', 'business_ops'));

alter table public.service_requests
  drop constraint if exists service_requests_task_type_check;

alter table public.service_requests
  add constraint service_requests_task_type_check
  check (task_type in ('quick', 'shopping', 'site', 'registry', 'virtual'));

alter table public.service_requests
  drop constraint if exists service_requests_logistics_mode_check;

alter table public.service_requests
  add constraint service_requests_logistics_mode_check
  check (logistics_mode in ('not_needed', 'local_delivery', 'postal_courier', 'pickup_hold', 'supplier_direct', 'airport_handoff', 'digital_only'));

alter table public.service_requests
  drop constraint if exists service_requests_goods_category_check;

alter table public.service_requests
  add constraint service_requests_goods_category_check
  check (goods_category in ('none', 'general_goods', 'clothing_household', 'electronics', 'cosmetics', 'food_plant_animal', 'medicine_health', 'documents', 'valuable_items', 'restricted_or_unsure'));

alter table public.service_requests
  drop constraint if exists service_requests_compliance_status_check;

alter table public.service_requests
  add constraint service_requests_compliance_status_check
  check (compliance_status in ('not_applicable', 'needs_ai_review', 'needs_admin_review', 'cleared', 'restricted', 'permit_required', 'prohibited'));

alter table public.service_requests
  drop constraint if exists service_requests_compliance_risk_level_check;

alter table public.service_requests
  add constraint service_requests_compliance_risk_level_check
  check (compliance_risk_level in ('standard', 'medium', 'high', 'blocked'));

alter table public.service_requests
  drop constraint if exists service_requests_automation_status_check;

alter table public.service_requests
  add constraint service_requests_automation_status_check
  check (automation_status in ('ai_triage', 'self_service', 'receiver_routed', 'admin_review', 'founder_approval', 'blocked'));

alter table public.service_requests
  drop constraint if exists service_requests_payment_method_preference_check;

alter table public.service_requests
  add constraint service_requests_payment_method_preference_check
  check (payment_method_preference in ('discuss', 'card', 'paypal', 'wise', 'mpesa', 'bank'));

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
  and btrim(origin_country) <> ''
  and btrim(destination_country) <> ''
  and btrim(kenya_location) <> ''
  and btrim(coalesce(task_location, kenya_location, '')) <> ''
  and btrim(notes) <> ''
  and service_direction in ('origin_to_destination', 'destination_to_origin', 'two_way', 'local_in_country', 'digital_global')
  and logistics_mode in ('not_needed', 'local_delivery', 'postal_courier', 'pickup_hold', 'supplier_direct', 'airport_handoff', 'digital_only')
  and goods_category in ('none', 'general_goods', 'clothing_household', 'electronics', 'cosmetics', 'food_plant_animal', 'medicine_health', 'documents', 'valuable_items', 'restricted_or_unsure')
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
  and preferred_currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES')
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

grant insert (
  origin_country,
  destination_country,
  service_direction,
  task_location,
  logistics_mode,
  goods_category,
  logistics_notes,
  compliance_acknowledged,
  compliance_status,
  compliance_risk_level,
  automation_status,
  admin_review_required,
  admin_review_reason
) on public.service_requests to anon, authenticated;

grant update (
  origin_country,
  destination_country,
  service_direction,
  task_location,
  logistics_mode,
  goods_category,
  logistics_notes,
  compliance_acknowledged,
  compliance_status,
  compliance_risk_level,
  automation_status,
  admin_review_required,
  admin_review_reason
) on public.service_requests to authenticated;
