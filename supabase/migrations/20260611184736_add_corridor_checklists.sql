alter table public.service_requests
  add column if not exists route_status text not null default 'active';

alter table public.service_requests
  add column if not exists compliance_flags text[] not null default array[]::text[];

alter table public.service_requests
  add column if not exists required_checks text[] not null default array[]::text[];

alter table public.service_requests
  add column if not exists proof_requirements text[] not null default array[]::text[];

update public.service_requests
set route_status = 'pilot'
where admin_review_reason ilike '%pilot corridor%'
  and route_status = 'active';

update public.service_requests
set route_status = 'unsupported'
where (
    admin_review_reason ilike '%outside the launch regions%'
    or admin_review_reason ilike '%non-africa corridor%'
  )
  and route_status = 'active';

update public.service_requests
set compliance_flags = array_remove(array[
    case when route_status = 'active' then 'Active launch corridor' end,
    case when route_status = 'pilot' then 'Pilot corridor - founder quote approval required' end,
    case when route_status = 'unsupported' then 'Unsupported corridor - founder approval required' end,
    case when logistics_mode <> 'not_needed' or goods_category <> 'none' then 'Physical item or handoff involved' end,
    case when goods_category in ('food_plant_animal', 'medicine_health', 'cosmetics', 'valuable_items', 'restricted_or_unsure') then 'Restricted or regulated item risk' end,
    case when sensitive_documents_expected then 'Sensitive documents expected' end,
    case when job_value_band in ('2000_10000', '10000_plus') then 'High-value job' end
  ]::text[], null)
where coalesce(array_length(compliance_flags, 1), 0) = 0;

update public.service_requests
set required_checks = array_remove(array[
    case when route_status <> 'active' then 'Founder confirms receiver coverage, payment route, and legal path before quote or assignment.' end,
    'Confirm client ID status before paid, high-value, or sensitive work starts.',
    'Confirm provider payment reference before assigning any receiver or releasing any milestone.',
    'Confirm receiver is vetted, ID-verified, and matched to the route/category before assignment.',
    case when logistics_mode <> 'not_needed' or goods_category <> 'none' then 'Check origin/export and destination/import rules before buying, posting, carrying, or receiving the item.' end,
    case when logistics_mode <> 'not_needed' or goods_category <> 'none' then 'Confirm courier/postal method, recipient details, declared value, duties/taxes owner, and tracking plan.' end,
    case when goods_category in ('food_plant_animal', 'medicine_health', 'cosmetics', 'valuable_items', 'restricted_or_unsure') then 'Founder checks whether permits, customs clearance, carrier restrictions, or a refusal are required.' end,
    case when sensitive_documents_expected then 'Use secure links and minimum necessary access for documents; avoid raw document exchange by WhatsApp.' end,
    case when job_value_band in ('2000_10000', '10000_plus') then 'Founder reviews payment protection, milestone release plan, refund/dispute path, and margin before start.' end
  ]::text[], null)
where coalesce(array_length(required_checks, 1), 0) = 0;

update public.service_requests
set proof_requirements = array_remove(array[
    case when logistics_mode <> 'not_needed' or goods_category <> 'none' then 'Pre-handoff item photos, purchase receipt, courier/postal tracking, and delivery confirmation.' end,
    case when goods_category in ('food_plant_animal', 'medicine_health', 'cosmetics', 'valuable_items', 'restricted_or_unsure') then 'Compliance decision note, receipt/reference, and carrier/customs evidence where legally allowed.' end,
    case when sensitive_documents_expected then 'Document chain-of-custody note and redacted proof where possible.' end,
    case when task_type = 'site' then 'Timestamped photos/video, location summary, contractor/contact notes, and visible progress markers.' end,
    case when task_type = 'registry' then 'Office/reference number, receipt where available, submitted/picked-up document status, and next-step note.' end,
    case when task_type = 'shopping' then 'Quote comparison or store link, purchase receipt, item condition photos, and handoff/delivery confirmation.' end,
    case when task_type = 'virtual' then 'Work log, deliverable link or summary, open questions, and next action.' end,
    case when task_type = 'quick' then 'Timestamped update, receipt/reference where applicable, and short completion summary.' end
  ]::text[], null)
where coalesce(array_length(proof_requirements, 1), 0) = 0;

alter table public.service_requests
  drop constraint if exists service_requests_route_status_check;

alter table public.service_requests
  add constraint service_requests_route_status_check
  check (route_status in ('active', 'pilot', 'unsupported', 'blocked'));

alter table public.service_requests
  drop constraint if exists service_requests_compliance_arrays_check;

alter table public.service_requests
  add constraint service_requests_compliance_arrays_check
  check (
    coalesce(array_length(compliance_flags, 1), 0) <= 20
    and coalesce(array_length(required_checks, 1), 0) <= 20
    and coalesce(array_length(proof_requirements, 1), 0) <= 20
  );

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
  route_status,
  compliance_flags,
  required_checks,
  proof_requirements
) on public.service_requests to anon, authenticated;

grant update (
  route_status,
  compliance_flags,
  required_checks,
  proof_requirements
) on public.service_requests to authenticated;

drop function if exists public.track_service_request(text, text);
drop function if exists app_private.track_service_request(text, text);

create or replace function app_private.track_service_request(
  lookup_code text,
  lookup_contact text
)
returns table (
  request_code text,
  origin_country text,
  destination_country text,
  service_direction text,
  task_location text,
  route_status text,
  logistics_mode text,
  goods_category text,
  compliance_status text,
  compliance_risk_level text,
  automation_status text,
  required_checks text[],
  proof_requirements text[],
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  job_value_band text,
  funds_protection_preference text,
  funds_status text,
  protected_amount integer,
  release_condition text,
  identity_verification_required boolean,
  verification_status text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
  client_review_score integer,
  client_review_note text,
  client_reviewed_at timestamptz,
  milestones jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sr.request_code,
    sr.origin_country,
    sr.destination_country,
    sr.service_direction,
    coalesce(sr.task_location, sr.kenya_location) as task_location,
    sr.route_status,
    sr.logistics_mode,
    sr.goods_category,
    sr.compliance_status,
    sr.compliance_risk_level,
    sr.automation_status,
    sr.required_checks,
    sr.proof_requirements,
    sr.status,
    sr.payment_status,
    sr.quote_amount,
    sr.quote_currency,
    sr.job_value_band,
    sr.funds_protection_preference,
    sr.funds_status,
    sr.protected_amount,
    sr.release_condition,
    sr.identity_verification_required,
    sr.verification_status,
    sr.payment_link,
    sr.client_report,
    sr.client_report_url,
    sr.proof_links,
    sr.client_review_score,
    sr.client_review_note,
    sr.client_reviewed_at,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'milestone_code', fm.milestone_code,
            'title', fm.title,
            'amount', fm.amount,
            'currency', fm.currency,
            'release_status', fm.release_status,
            'release_trigger', fm.release_trigger,
            'due_at', fm.due_at,
            'released_amount', fm.released_amount,
            'released_at', fm.released_at
          )
          order by fm.created_at asc
        ),
        '[]'::jsonb
      )
      from public.fund_milestones fm
      where fm.service_request_id = sr.id
        and fm.client_visible = true
    ) as milestones,
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
  origin_country text,
  destination_country text,
  service_direction text,
  task_location text,
  route_status text,
  logistics_mode text,
  goods_category text,
  compliance_status text,
  compliance_risk_level text,
  automation_status text,
  required_checks text[],
  proof_requirements text[],
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  job_value_band text,
  funds_protection_preference text,
  funds_status text,
  protected_amount integer,
  release_condition text,
  identity_verification_required boolean,
  verification_status text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
  client_review_score integer,
  client_review_note text,
  client_reviewed_at timestamptz,
  milestones jsonb,
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

drop function if exists public.list_my_service_requests();
drop function if exists app_private.list_my_service_requests();

create or replace function app_private.list_my_service_requests()
returns table (
  request_code text,
  origin_country text,
  destination_country text,
  service_direction text,
  task_location text,
  route_status text,
  logistics_mode text,
  goods_category text,
  compliance_status text,
  compliance_risk_level text,
  automation_status text,
  required_checks text[],
  proof_requirements text[],
  service_package text,
  kenya_location text,
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  job_value_band text,
  funds_protection_preference text,
  funds_status text,
  protected_amount integer,
  release_condition text,
  identity_verification_required boolean,
  verification_status text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
  client_review_score integer,
  client_review_note text,
  client_reviewed_at timestamptz,
  milestones jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sr.request_code,
    sr.origin_country,
    sr.destination_country,
    sr.service_direction,
    coalesce(sr.task_location, sr.kenya_location) as task_location,
    sr.route_status,
    sr.logistics_mode,
    sr.goods_category,
    sr.compliance_status,
    sr.compliance_risk_level,
    sr.automation_status,
    sr.required_checks,
    sr.proof_requirements,
    sr.service_package,
    sr.kenya_location,
    sr.status,
    sr.payment_status,
    sr.quote_amount,
    sr.quote_currency,
    sr.job_value_band,
    sr.funds_protection_preference,
    sr.funds_status,
    sr.protected_amount,
    sr.release_condition,
    sr.identity_verification_required,
    sr.verification_status,
    sr.payment_link,
    sr.client_report,
    sr.client_report_url,
    sr.proof_links,
    sr.client_review_score,
    sr.client_review_note,
    sr.client_reviewed_at,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'milestone_code', fm.milestone_code,
            'title', fm.title,
            'amount', fm.amount,
            'currency', fm.currency,
            'release_status', fm.release_status,
            'release_trigger', fm.release_trigger,
            'due_at', fm.due_at,
            'released_amount', fm.released_amount,
            'released_at', fm.released_at
          )
          order by fm.created_at asc
        ),
        '[]'::jsonb
      )
      from public.fund_milestones fm
      where fm.service_request_id = sr.id
        and fm.client_visible = true
    ) as milestones,
    sr.updated_at
  from public.service_requests sr
  where lower(btrim(coalesce(sr.email, ''))) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    and btrim(coalesce(sr.email, '')) <> ''
  order by sr.created_at desc
  limit 50;
$$;

revoke all on function app_private.list_my_service_requests() from public;
revoke all on function app_private.list_my_service_requests() from anon;
grant execute on function app_private.list_my_service_requests() to authenticated;

create or replace function public.list_my_service_requests()
returns table (
  request_code text,
  origin_country text,
  destination_country text,
  service_direction text,
  task_location text,
  route_status text,
  logistics_mode text,
  goods_category text,
  compliance_status text,
  compliance_risk_level text,
  automation_status text,
  required_checks text[],
  proof_requirements text[],
  service_package text,
  kenya_location text,
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  job_value_band text,
  funds_protection_preference text,
  funds_status text,
  protected_amount integer,
  release_condition text,
  identity_verification_required boolean,
  verification_status text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
  client_review_score integer,
  client_review_note text,
  client_reviewed_at timestamptz,
  milestones jsonb,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_my_service_requests();
$$;

revoke all on function public.list_my_service_requests() from public;
grant execute on function public.list_my_service_requests() to authenticated;

drop function if exists public.list_my_assigned_jobs();
drop function if exists app_private.list_my_assigned_jobs();

create or replace function app_private.list_my_assigned_jobs()
returns table (
  request_code text,
  origin_country text,
  destination_country text,
  service_direction text,
  task_location text,
  route_status text,
  logistics_mode text,
  goods_category text,
  required_checks text[],
  proof_requirements text[],
  service_package text,
  task_type text,
  kenya_location text,
  urgency text,
  deadline date,
  local_contact_name text,
  local_contact_phone text,
  contact_window text,
  proof_priority text,
  report_pack text[],
  supporting_links text[],
  notes text,
  status text,
  client_report text,
  client_report_url text,
  proof_links text[],
  client_review_score integer,
  client_review_note text,
  client_reviewed_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sr.request_code,
    sr.origin_country,
    sr.destination_country,
    sr.service_direction,
    coalesce(sr.task_location, sr.kenya_location) as task_location,
    sr.route_status,
    sr.logistics_mode,
    sr.goods_category,
    sr.required_checks,
    sr.proof_requirements,
    sr.service_package,
    sr.task_type,
    sr.kenya_location,
    sr.urgency,
    sr.deadline,
    sr.local_contact_name,
    sr.local_contact_phone,
    sr.contact_window,
    sr.proof_priority,
    sr.report_pack,
    sr.supporting_links,
    sr.notes,
    sr.status,
    sr.client_report,
    sr.client_report_url,
    sr.proof_links,
    sr.client_review_score,
    sr.client_review_note,
    sr.client_reviewed_at,
    sr.updated_at
  from public.service_requests sr
  join public.partner_applications pa on pa.id = sr.assigned_partner_id
  where lower(btrim(coalesce(pa.email, ''))) = lower(btrim(app_private.current_auth_email()))
    and btrim(coalesce(pa.email, '')) <> ''
    and pa.status = 'vetted'
    and pa.identity_verification_status = 'verified'
    and sr.status in ('paid', 'in_progress', 'waiting_client', 'completed')
  order by sr.updated_at desc
  limit 50;
$$;

revoke all on function app_private.list_my_assigned_jobs() from public;
revoke all on function app_private.list_my_assigned_jobs() from anon;
grant execute on function app_private.list_my_assigned_jobs() to authenticated;

create or replace function public.list_my_assigned_jobs()
returns table (
  request_code text,
  origin_country text,
  destination_country text,
  service_direction text,
  task_location text,
  route_status text,
  logistics_mode text,
  goods_category text,
  required_checks text[],
  proof_requirements text[],
  service_package text,
  task_type text,
  kenya_location text,
  urgency text,
  deadline date,
  local_contact_name text,
  local_contact_phone text,
  contact_window text,
  proof_priority text,
  report_pack text[],
  supporting_links text[],
  notes text,
  status text,
  client_report text,
  client_report_url text,
  proof_links text[],
  client_review_score integer,
  client_review_note text,
  client_reviewed_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_my_assigned_jobs();
$$;

revoke all on function public.list_my_assigned_jobs() from public;
grant execute on function public.list_my_assigned_jobs() to authenticated;
