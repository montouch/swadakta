create extension if not exists pgcrypto;

create schema if not exists app_private;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.account_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  account_role text not null default 'client',
  full_name text,
  whatsapp text,
  country text,
  kenya_base text,
  preferred_currency text not null default 'AUD',
  profile_notes text,
  onboarding_status text not null default 'started',
  identity_verification_provider text not null default 'smile_id',
  identity_verification_status text not null default 'not_started',
  identity_verification_link text,
  identity_verification_reference text,
  identity_verified_at timestamptz,
  identity_verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  assigned_partner_id uuid,
  operator_notes text,
  client_report text,
  quote_amount integer,
  quote_currency text not null default 'AUD',
  payment_link text,
  payment_due_at date,
  funds_status text not null default 'not_collected',
  protected_amount integer not null default 0,
  release_condition text not null default 'Admin verifies proof and client-safe report before receiver payout.',
  payment_reference text,
  release_notes text,
  identity_verification_required boolean not null default true,
  verification_status text not null default 'required',
  verification_reason text,
  verified_at timestamptz,
  identity_verification_consent boolean not null default false,
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
  identity_verification_provider text not null default 'smile_id',
  identity_verification_status text not null default 'not_started',
  identity_verification_link text,
  identity_verification_reference text,
  identity_verified_at timestamptz,
  identity_verification_notes text,
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.field_updates (
  id uuid primary key default gen_random_uuid(),
  update_code text not null unique default ('FU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  partner_application_id uuid not null references public.partner_applications(id) on delete cascade,
  field_status text not null default 'progress',
  update_text text not null,
  proof_links text[] not null default array[]::text[],
  created_at timestamptz not null default now()
);

create table if not exists public.fund_milestones (
  id uuid primary key default gen_random_uuid(),
  milestone_code text not null unique default ('FM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  title text not null,
  amount integer not null default 0,
  currency text not null default 'AUD',
  release_status text not null default 'planned',
  release_trigger text not null default 'Admin verifies milestone proof before release.',
  due_at date,
  released_amount integer not null default 0,
  released_at timestamptz,
  provider text not null default 'manual',
  provider_reference text,
  internal_notes text,
  client_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_profiles add column if not exists email text;
alter table public.account_profiles add column if not exists account_role text not null default 'client';
alter table public.account_profiles add column if not exists full_name text;
alter table public.account_profiles add column if not exists whatsapp text;
alter table public.account_profiles add column if not exists country text;
alter table public.account_profiles add column if not exists kenya_base text;
alter table public.account_profiles add column if not exists preferred_currency text not null default 'AUD';
alter table public.account_profiles add column if not exists profile_notes text;
alter table public.account_profiles add column if not exists onboarding_status text not null default 'started';
alter table public.account_profiles add column if not exists identity_verification_provider text not null default 'smile_id';
alter table public.account_profiles add column if not exists identity_verification_status text not null default 'not_started';
alter table public.account_profiles add column if not exists identity_verification_link text;
alter table public.account_profiles add column if not exists identity_verification_reference text;
alter table public.account_profiles add column if not exists identity_verified_at timestamptz;
alter table public.account_profiles add column if not exists identity_verification_notes text;
alter table public.account_profiles add column if not exists created_at timestamptz not null default now();
alter table public.account_profiles add column if not exists updated_at timestamptz not null default now();

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
alter table public.service_requests add column if not exists assigned_partner_id uuid;
alter table public.service_requests add column if not exists quote_amount integer;
alter table public.service_requests add column if not exists quote_currency text not null default 'AUD';
alter table public.service_requests add column if not exists payment_link text;
alter table public.service_requests add column if not exists payment_due_at date;
alter table public.service_requests add column if not exists funds_status text not null default 'not_collected';
alter table public.service_requests add column if not exists protected_amount integer not null default 0;
alter table public.service_requests add column if not exists release_condition text not null default 'Admin verifies proof and client-safe report before receiver payout.';
alter table public.service_requests add column if not exists payment_reference text;
alter table public.service_requests add column if not exists release_notes text;
alter table public.service_requests add column if not exists identity_verification_required boolean not null default false;
alter table public.service_requests add column if not exists verification_status text not null default 'not_required';
alter table public.service_requests add column if not exists verification_reason text;
alter table public.service_requests add column if not exists verified_at timestamptz;
alter table public.service_requests add column if not exists identity_verification_consent boolean not null default false;
alter table public.service_requests add column if not exists operator_payout integer not null default 0;
alter table public.service_requests add column if not exists field_costs integer not null default 0;
alter table public.service_requests add column if not exists payment_processing_fee integer not null default 0;
alter table public.service_requests add column if not exists client_report_url text;
alter table public.service_requests add column if not exists proof_links text[] not null default array[]::text[];
alter table public.service_requests add column if not exists contact_permission boolean not null default false;
alter table public.service_requests add column if not exists professional_boundary_accepted boolean not null default false;
alter table public.service_requests add column if not exists terms_accepted_at timestamptz;
alter table public.service_requests add column if not exists privacy_accepted_at timestamptz;

alter table public.partner_applications add column if not exists identity_verification_provider text not null default 'smile_id';
alter table public.partner_applications add column if not exists identity_verification_status text not null default 'not_started';
alter table public.partner_applications add column if not exists identity_verification_link text;
alter table public.partner_applications add column if not exists identity_verification_reference text;
alter table public.partner_applications add column if not exists identity_verified_at timestamptz;
alter table public.partner_applications add column if not exists identity_verification_notes text;

update public.service_requests
set client_base = australia_location
where client_base is null and australia_location is not null;

alter table public.service_requests alter column identity_verification_required set default true;
alter table public.service_requests alter column verification_status set default 'required';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'account_profiles_email_check'
  ) then
    alter table public.account_profiles
      add constraint account_profiles_email_check check (position('@' in email) > 1);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'account_profiles_account_role_check'
  ) then
    alter table public.account_profiles
      add constraint account_profiles_account_role_check check (account_role in ('client', 'receiver', 'both'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'account_profiles_preferred_currency_check'
  ) then
    alter table public.account_profiles
      add constraint account_profiles_preferred_currency_check check (preferred_currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'account_profiles_onboarding_status_check'
  ) then
    alter table public.account_profiles
      add constraint account_profiles_onboarding_status_check check (
        onboarding_status in ('started', 'profile_complete', 'needs_review', 'verified')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'account_profiles_identity_provider_check'
  ) then
    alter table public.account_profiles
      add constraint account_profiles_identity_provider_check check (
        identity_verification_provider in ('smile_id', 'sumsub', 'youverify', 'manual')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'account_profiles_identity_status_check'
  ) then
    alter table public.account_profiles
      add constraint account_profiles_identity_status_check check (
        identity_verification_status in ('not_started', 'link_sent', 'submitted', 'verified', 'failed', 'expired', 'manual_review')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'account_profiles_identity_link_check'
  ) then
    alter table public.account_profiles
      add constraint account_profiles_identity_link_check check (
        identity_verification_link is null
        or identity_verification_link = ''
        or identity_verification_link ~* '^https?://'
      );
  end if;

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
    select 1 from pg_constraint where conname = 'service_requests_funds_status_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_funds_status_check check (
        funds_status in ('not_collected', 'payment_link_sent', 'authorized', 'held_by_provider', 'deposit_confirmed', 'partially_released', 'released', 'refund_pending', 'refunded', 'disputed')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_protected_amount_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_protected_amount_check check (protected_amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_release_condition_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_release_condition_check check (btrim(release_condition) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_verification_status_check'
  ) then
    alter table public.service_requests
      add constraint service_requests_verification_status_check check (
        verification_status in ('not_required', 'required', 'requested', 'submitted', 'verified', 'rejected', 'expired')
      );
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

  if not exists (
    select 1 from pg_constraint where conname = 'partner_applications_identity_provider_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_identity_provider_check check (
        identity_verification_provider in ('smile_id', 'sumsub', 'youverify', 'manual')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'partner_applications_identity_status_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_identity_status_check check (
        identity_verification_status in ('not_started', 'link_sent', 'submitted', 'verified', 'failed', 'expired', 'manual_review')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'partner_applications_identity_link_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_identity_link_check check (
        identity_verification_link is null
        or identity_verification_link = ''
        or identity_verification_link ~* '^https?://'
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'partner_applications_vetted_requires_verified_identity_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_vetted_requires_verified_identity_check check (
        status <> 'vetted'
        or (id_verification_consent is true and identity_verification_status = 'verified')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'service_requests_assigned_partner_id_fkey'
  ) then
    alter table public.service_requests
      add constraint service_requests_assigned_partner_id_fkey
      foreign key (assigned_partner_id) references public.partner_applications(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'field_updates_update_code_check'
  ) then
    alter table public.field_updates
      add constraint field_updates_update_code_check check (
        update_code like 'FU-%' and length(update_code) between 6 and 24
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'field_updates_field_status_check'
  ) then
    alter table public.field_updates
      add constraint field_updates_field_status_check check (
        field_status in ('progress', 'blocked', 'completed', 'needs_admin', 'safety_issue')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'field_updates_update_text_check'
  ) then
    alter table public.field_updates
      add constraint field_updates_update_text_check check (btrim(update_text) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'field_updates_proof_links_check'
  ) then
    alter table public.field_updates
      add constraint field_updates_proof_links_check check (
        coalesce(array_length(proof_links, 1), 0) <= 20
        and (
          coalesce(array_length(proof_links, 1), 0) = 0
          or array_to_string(proof_links, E'\n') ~* '^https?://[^\n]+(\nhttps?://[^\n]+)*$'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'fund_milestones_milestone_code_check'
  ) then
    alter table public.fund_milestones
      add constraint fund_milestones_milestone_code_check check (
        milestone_code like 'FM-%' and length(milestone_code) between 6 and 24
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'fund_milestones_title_check'
  ) then
    alter table public.fund_milestones
      add constraint fund_milestones_title_check check (btrim(title) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'fund_milestones_amount_check'
  ) then
    alter table public.fund_milestones
      add constraint fund_milestones_amount_check check (amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'fund_milestones_released_amount_check'
  ) then
    alter table public.fund_milestones
      add constraint fund_milestones_released_amount_check check (
        released_amount >= 0 and released_amount <= amount
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'fund_milestones_currency_check'
  ) then
    alter table public.fund_milestones
      add constraint fund_milestones_currency_check check (currency in ('AUD', 'USD', 'GBP', 'EUR', 'KES'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'fund_milestones_release_status_check'
  ) then
    alter table public.fund_milestones
      add constraint fund_milestones_release_status_check check (
        release_status in ('planned', 'funded', 'authorized', 'held_by_provider', 'ready_to_release', 'partially_released', 'released', 'refund_pending', 'refunded', 'disputed', 'cancelled')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'fund_milestones_release_trigger_check'
  ) then
    alter table public.fund_milestones
      add constraint fund_milestones_release_trigger_check check (btrim(release_trigger) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'fund_milestones_provider_check'
  ) then
    alter table public.fund_milestones
      add constraint fund_milestones_provider_check check (
        provider in ('manual', 'stripe', 'paypal', 'wise', 'escrow_com', 'bank', 'mpesa', 'other')
      );
  end if;
end
$$;

create index if not exists service_requests_status_idx on public.service_requests (status);
create index if not exists service_requests_created_at_idx on public.service_requests (created_at desc);
create index if not exists service_requests_assigned_partner_id_idx on public.service_requests (assigned_partner_id);
create index if not exists partner_applications_status_idx on public.partner_applications (status);
create index if not exists partner_applications_identity_status_idx on public.partner_applications (identity_verification_status);
create index if not exists partner_applications_created_at_idx on public.partner_applications (created_at desc);
create index if not exists field_updates_service_request_id_idx on public.field_updates (service_request_id, created_at desc);
create index if not exists field_updates_partner_application_id_idx on public.field_updates (partner_application_id, created_at desc);
create index if not exists fund_milestones_service_request_id_idx on public.fund_milestones (service_request_id, created_at asc);
create index if not exists fund_milestones_release_status_idx on public.fund_milestones (release_status);

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

create or replace function app_private.current_auth_email()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((select auth.jwt()) ->> 'email', '');
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

create or replace function app_private.ensure_assigned_partner_is_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_partner_id is not null and not exists (
    select 1
    from public.partner_applications pa
    where pa.id = new.assigned_partner_id
      and pa.status = 'vetted'
      and pa.id_verification_consent is true
      and pa.identity_verification_status = 'verified'
  ) then
    raise exception 'Assigned receiver must be vetted with verified ID';
  end if;

  return new;
end;
$$;

drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at
before update on public.service_requests
for each row
execute function app_private.set_updated_at();

drop trigger if exists service_requests_assigned_partner_verified on public.service_requests;
create trigger service_requests_assigned_partner_verified
before insert or update of assigned_partner_id on public.service_requests
for each row
execute function app_private.ensure_assigned_partner_is_verified();

drop trigger if exists partner_applications_set_updated_at on public.partner_applications;
create trigger partner_applications_set_updated_at
before update on public.partner_applications
for each row
execute function app_private.set_updated_at();

drop trigger if exists fund_milestones_set_updated_at on public.fund_milestones;
create trigger fund_milestones_set_updated_at
before update on public.fund_milestones
for each row
execute function app_private.set_updated_at();

drop trigger if exists account_profiles_set_updated_at on public.account_profiles;
create trigger account_profiles_set_updated_at
before update on public.account_profiles
for each row
execute function app_private.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.account_profiles enable row level security;
alter table public.service_requests enable row level security;
alter table public.partner_applications enable row level security;
alter table public.field_updates enable row level security;
alter table public.fund_milestones enable row level security;

drop policy if exists "Admins can read own admin profile" on public.admin_users;
create policy "Admins can read own admin profile"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can read own account profile" on public.account_profiles;
drop policy if exists "Admins can read account profiles" on public.account_profiles;
drop policy if exists "Authenticated users can read permitted account profiles" on public.account_profiles;
create policy "Authenticated users can read permitted account profiles"
on public.account_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select app_private.is_admin())
);

drop policy if exists "Users can create own account profile" on public.account_profiles;
create policy "Users can create own account profile"
on public.account_profiles
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and lower(btrim(email)) = lower(btrim((select app_private.current_auth_email())))
);

drop policy if exists "Users can update own account profile" on public.account_profiles;
create policy "Users can update own account profile"
on public.account_profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and lower(btrim(email)) = lower(btrim((select app_private.current_auth_email())))
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
  and identity_verification_required = true
  and verification_status = 'required'
  and identity_verification_consent = true
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

drop policy if exists "Admins can read field updates" on public.field_updates;
create policy "Admins can read field updates"
on public.field_updates
for select
to authenticated
using ((select app_private.is_admin()));

drop policy if exists "Admins can read fund milestones" on public.fund_milestones;
create policy "Admins can read fund milestones"
on public.fund_milestones
for select
to authenticated
using ((select app_private.is_admin()));

drop policy if exists "Admins can create fund milestones" on public.fund_milestones;
create policy "Admins can create fund milestones"
on public.fund_milestones
for insert
to authenticated
with check ((select app_private.is_admin()));

drop policy if exists "Admins can update fund milestones" on public.fund_milestones;
create policy "Admins can update fund milestones"
on public.fund_milestones
for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

grant usage on schema public to anon, authenticated;
grant usage on schema app_private to anon, authenticated;
revoke all on function app_private.is_admin() from public;
grant execute on function app_private.is_admin() to authenticated;
revoke all on function app_private.current_auth_email() from public;
grant execute on function app_private.current_auth_email() to authenticated;

revoke truncate, references, trigger on table public.service_requests from anon, authenticated;
revoke truncate, references, trigger on table public.partner_applications from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.field_updates from anon, authenticated;
revoke delete, truncate, references, trigger on table public.fund_milestones from anon, authenticated;
revoke delete, truncate, references, trigger on table public.account_profiles from anon, authenticated;

grant select on public.account_profiles to authenticated;
grant insert (
  user_id,
  email,
  account_role,
  full_name,
  whatsapp,
  country,
  kenya_base,
  preferred_currency,
  profile_notes,
  onboarding_status
) on public.account_profiles to authenticated;
grant update (
  email,
  account_role,
  full_name,
  whatsapp,
  country,
  kenya_base,
  preferred_currency,
  profile_notes,
  onboarding_status
) on public.account_profiles to authenticated;

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
  identity_verification_required,
  verification_status,
  identity_verification_consent,
  terms_accepted_at,
  privacy_accepted_at
) on public.service_requests to anon, authenticated;

grant select on public.service_requests to authenticated;
grant update (
  status,
  payment_status,
  assigned_to,
  assigned_partner_id,
  operator_notes,
  client_report,
  service_package,
  quote_amount,
  quote_currency,
  payment_link,
  payment_due_at,
  funds_status,
  protected_amount,
  release_condition,
  payment_reference,
  release_notes,
  identity_verification_required,
  verification_status,
  verification_reason,
  verified_at,
  identity_verification_consent,
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
  internal_notes,
  identity_verification_provider,
  identity_verification_status,
  identity_verification_link,
  identity_verification_reference,
  identity_verified_at,
  identity_verification_notes
) on public.partner_applications to authenticated;
grant select on public.admin_users to authenticated;
grant select on public.field_updates to authenticated;
grant select on public.fund_milestones to authenticated;
grant insert (
  id,
  milestone_code,
  service_request_id,
  title,
  amount,
  currency,
  release_status,
  release_trigger,
  due_at,
  released_amount,
  released_at,
  provider,
  provider_reference,
  internal_notes,
  client_visible
) on public.fund_milestones to authenticated;
grant update (
  title,
  amount,
  currency,
  release_status,
  release_trigger,
  due_at,
  released_amount,
  released_at,
  provider,
  provider_reference,
  internal_notes,
  client_visible
) on public.fund_milestones to authenticated;

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
  funds_status text,
  protected_amount integer,
  release_condition text,
  identity_verification_required boolean,
  verification_status text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
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
    sr.status,
    sr.payment_status,
    sr.quote_amount,
    sr.quote_currency,
    sr.funds_status,
    sr.protected_amount,
    sr.release_condition,
    sr.identity_verification_required,
    sr.verification_status,
    sr.payment_link,
    sr.client_report,
    sr.client_report_url,
    sr.proof_links,
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
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  funds_status text,
  protected_amount integer,
  release_condition text,
  identity_verification_required boolean,
  verification_status text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
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

create or replace function app_private.list_my_service_requests()
returns table (
  request_code text,
  service_package text,
  kenya_location text,
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  funds_status text,
  protected_amount integer,
  release_condition text,
  identity_verification_required boolean,
  verification_status text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
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
    sr.service_package,
    sr.kenya_location,
    sr.status,
    sr.payment_status,
    sr.quote_amount,
    sr.quote_currency,
    sr.funds_status,
    sr.protected_amount,
    sr.release_condition,
    sr.identity_verification_required,
    sr.verification_status,
    sr.payment_link,
    sr.client_report,
    sr.client_report_url,
    sr.proof_links,
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
  service_package text,
  kenya_location text,
  status text,
  payment_status text,
  quote_amount integer,
  quote_currency text,
  funds_status text,
  protected_amount integer,
  release_condition text,
  identity_verification_required boolean,
  verification_status text,
  payment_link text,
  client_report text,
  client_report_url text,
  proof_links text[],
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

create or replace function app_private.update_account_identity_verification(
  input_user_id uuid,
  input_provider text,
  input_status text,
  input_link text default null,
  input_reference text default null,
  input_verified_at timestamptz default null,
  input_notes text default null
)
returns public.account_profiles
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  updated_profile public.account_profiles%rowtype;
  clean_status text := lower(btrim(coalesce(input_status, '')));
  clean_provider text := lower(btrim(coalesce(input_provider, '')));
begin
  if not app_private.is_admin() then
    raise exception 'Admin access required';
  end if;

  if clean_provider not in ('smile_id', 'sumsub', 'youverify', 'manual') then
    raise exception 'Invalid identity verification provider';
  end if;

  if clean_status not in ('not_started', 'link_sent', 'submitted', 'verified', 'failed', 'expired', 'manual_review') then
    raise exception 'Invalid identity verification status';
  end if;

  update public.account_profiles
  set
    identity_verification_provider = clean_provider,
    identity_verification_status = clean_status,
    identity_verification_link = nullif(btrim(coalesce(input_link, '')), ''),
    identity_verification_reference = nullif(btrim(coalesce(input_reference, '')), ''),
    identity_verified_at = case
      when clean_status = 'verified' then coalesce(input_verified_at, now())
      else input_verified_at
    end,
    identity_verification_notes = nullif(btrim(coalesce(input_notes, '')), '')
  where user_id = input_user_id
  returning * into updated_profile;

  if not found then
    raise exception 'Account profile not found';
  end if;

  return updated_profile;
end;
$$;

revoke all on function app_private.update_account_identity_verification(uuid, text, text, text, text, timestamptz, text) from public;
revoke all on function app_private.update_account_identity_verification(uuid, text, text, text, text, timestamptz, text) from anon;
grant execute on function app_private.update_account_identity_verification(uuid, text, text, text, text, timestamptz, text) to authenticated;

create or replace function public.update_account_identity_verification(
  input_user_id uuid,
  input_provider text,
  input_status text,
  input_link text default null,
  input_reference text default null,
  input_verified_at timestamptz default null,
  input_notes text default null
)
returns public.account_profiles
language plpgsql
volatile
security invoker
set search_path = public, app_private
as $$
begin
  return app_private.update_account_identity_verification(
    input_user_id,
    input_provider,
    input_status,
    input_link,
    input_reference,
    input_verified_at,
    input_notes
  );
end;
$$;

revoke all on function public.update_account_identity_verification(uuid, text, text, text, text, timestamptz, text) from public;
grant execute on function public.update_account_identity_verification(uuid, text, text, text, text, timestamptz, text) to authenticated;

create or replace function app_private.list_my_partner_applications()
returns table (
  partner_code text,
  kenya_base text,
  service_regions text,
  service_categories text[],
  availability text,
  transport_access text,
  status text,
  identity_verification_provider text,
  identity_verification_status text,
  identity_verification_link text,
  identity_verification_reference text,
  identity_verified_at timestamptz,
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
    pa.identity_verification_provider,
    pa.identity_verification_status,
    pa.identity_verification_link,
    pa.identity_verification_reference,
    pa.identity_verified_at,
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
  partner_code text,
  kenya_base text,
  service_regions text,
  service_categories text[],
  availability text,
  transport_access text,
  status text,
  identity_verification_provider text,
  identity_verification_status text,
  identity_verification_link text,
  identity_verification_reference text,
  identity_verified_at timestamptz,
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

create or replace function app_private.list_my_assigned_jobs()
returns table (
  request_code text,
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

create or replace function app_private.submit_assigned_job_update(
  input_request_code text,
  input_field_status text,
  input_update_text text,
  input_proof_links text[] default array[]::text[]
)
returns table (
  update_code text,
  request_code text,
  field_status text,
  created_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  target_request_id uuid;
  target_request_code text;
  target_partner_id uuid;
  clean_status text := lower(btrim(coalesce(input_field_status, '')));
  clean_text text := btrim(coalesce(input_update_text, ''));
  clean_links text[] := array[]::text[];
  inserted_update public.field_updates%rowtype;
begin
  select coalesce(array_agg(link), array[]::text[])
  into clean_links
  from (
    select btrim(item) as link
    from unnest(coalesce(input_proof_links, array[]::text[])) as item
    where btrim(item) <> ''
  ) cleaned;

  select sr.id, sr.request_code, pa.id
  into target_request_id, target_request_code, target_partner_id
  from public.service_requests sr
  join public.partner_applications pa on pa.id = sr.assigned_partner_id
  where upper(btrim(sr.request_code)) = upper(btrim(coalesce(input_request_code, '')))
    and lower(btrim(coalesce(pa.email, ''))) = lower(btrim(app_private.current_auth_email()))
    and btrim(coalesce(pa.email, '')) <> ''
    and pa.status = 'vetted'
    and pa.identity_verification_status = 'verified'
    and sr.status in ('paid', 'in_progress', 'waiting_client', 'completed')
  limit 1;

  if target_request_id is null then
    raise exception 'Assigned job not found or not available for receiver update';
  end if;

  if clean_status not in ('progress', 'blocked', 'completed', 'needs_admin', 'safety_issue') then
    raise exception 'Invalid field update status';
  end if;

  if clean_text = '' then
    raise exception 'Field update text is required';
  end if;

  if coalesce(array_length(clean_links, 1), 0) > 20 then
    raise exception 'Too many proof links';
  end if;

  if coalesce(array_length(clean_links, 1), 0) > 0
    and array_to_string(clean_links, E'\n') !~* '^https?://[^\n]+(\nhttps?://[^\n]+)*$' then
    raise exception 'Proof links must be HTTP or HTTPS URLs';
  end if;

  insert into public.field_updates (
    service_request_id,
    partner_application_id,
    field_status,
    update_text,
    proof_links
  )
  values (
    target_request_id,
    target_partner_id,
    clean_status,
    clean_text,
    clean_links
  )
  returning * into inserted_update;

  return query
    select
      inserted_update.update_code,
      target_request_code,
      inserted_update.field_status,
      inserted_update.created_at;
end;
$$;

revoke all on function app_private.submit_assigned_job_update(text, text, text, text[]) from public;
revoke all on function app_private.submit_assigned_job_update(text, text, text, text[]) from anon;
grant execute on function app_private.submit_assigned_job_update(text, text, text, text[]) to authenticated;

create or replace function public.submit_assigned_job_update(
  input_request_code text,
  input_field_status text,
  input_update_text text,
  input_proof_links text[] default array[]::text[]
)
returns table (
  update_code text,
  request_code text,
  field_status text,
  created_at timestamptz
)
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.submit_assigned_job_update(
    input_request_code,
    input_field_status,
    input_update_text,
    input_proof_links
  );
$$;

revoke all on function public.submit_assigned_job_update(text, text, text, text[]) from public;
grant execute on function public.submit_assigned_job_update(text, text, text, text[]) to authenticated;

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
