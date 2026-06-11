create table if not exists public.resolution_cases (
  id uuid primary key default gen_random_uuid(),
  resolution_code text not null unique default ('RC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  service_request_id uuid references public.service_requests(id) on delete set null,
  request_code text not null,
  created_by uuid references auth.users(id) on delete set null,
  reporter_role text not null default 'client',
  reporter_name text,
  reporter_contact text not null,
  issue_type text not null,
  desired_outcome text not null,
  severity text not null default 'normal',
  status text not null default 'ai_triage',
  payment_action_requested text not null default 'none',
  provider_reference text,
  amount_in_dispute integer,
  evidence_links text[] not null default array[]::text[],
  summary text not null,
  ai_triage text not null,
  founder_review_required boolean not null default false,
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resolution_cases add column if not exists resolution_code text not null default ('RC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));
alter table public.resolution_cases add column if not exists service_request_id uuid references public.service_requests(id) on delete set null;
alter table public.resolution_cases add column if not exists request_code text not null default '';
alter table public.resolution_cases add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.resolution_cases add column if not exists reporter_role text not null default 'client';
alter table public.resolution_cases add column if not exists reporter_name text;
alter table public.resolution_cases add column if not exists reporter_contact text not null default '';
alter table public.resolution_cases add column if not exists issue_type text not null default 'other';
alter table public.resolution_cases add column if not exists desired_outcome text not null default 'explain_status';
alter table public.resolution_cases add column if not exists severity text not null default 'normal';
alter table public.resolution_cases add column if not exists status text not null default 'ai_triage';
alter table public.resolution_cases add column if not exists payment_action_requested text not null default 'none';
alter table public.resolution_cases add column if not exists provider_reference text;
alter table public.resolution_cases add column if not exists amount_in_dispute integer;
alter table public.resolution_cases add column if not exists evidence_links text[] not null default array[]::text[];
alter table public.resolution_cases add column if not exists summary text not null default '';
alter table public.resolution_cases add column if not exists ai_triage text not null default '';
alter table public.resolution_cases add column if not exists founder_review_required boolean not null default false;
alter table public.resolution_cases add column if not exists admin_notes text;
alter table public.resolution_cases add column if not exists resolved_at timestamptz;
alter table public.resolution_cases add column if not exists created_at timestamptz not null default now();
alter table public.resolution_cases add column if not exists updated_at timestamptz not null default now();

create unique index if not exists resolution_cases_resolution_code_key
  on public.resolution_cases (resolution_code);
create index if not exists resolution_cases_request_idx
  on public.resolution_cases (service_request_id, created_at desc);
create index if not exists resolution_cases_status_idx
  on public.resolution_cases (status, founder_review_required, updated_at desc);
create index if not exists resolution_cases_created_by_idx
  on public.resolution_cases (created_by, updated_at desc);

alter table public.resolution_cases drop constraint if exists resolution_cases_reporter_role_check;
alter table public.resolution_cases
  add constraint resolution_cases_reporter_role_check
  check (reporter_role in ('client', 'receiver', 'local_contact', 'admin', 'other'));

alter table public.resolution_cases drop constraint if exists resolution_cases_issue_type_check;
alter table public.resolution_cases
  add constraint resolution_cases_issue_type_check
  check (
    issue_type in (
      'proof_missing',
      'poor_quality',
      'delay',
      'payment_refund',
      'payment_dispute',
      'receiver_safety',
      'restricted_item',
      'wrong_item',
      'communication',
      'other'
    )
  );

alter table public.resolution_cases drop constraint if exists resolution_cases_desired_outcome_check;
alter table public.resolution_cases
  add constraint resolution_cases_desired_outcome_check
  check (
    desired_outcome in (
      'explain_status',
      'pause_job',
      'redo_work',
      'partial_refund',
      'full_refund',
      'release_milestone',
      'replace_receiver',
      'legal_compliance_review',
      'other'
    )
  );

alter table public.resolution_cases drop constraint if exists resolution_cases_severity_check;
alter table public.resolution_cases
  add constraint resolution_cases_severity_check
  check (severity in ('normal', 'urgent', 'safety', 'legal', 'payment'));

alter table public.resolution_cases drop constraint if exists resolution_cases_status_check;
alter table public.resolution_cases
  add constraint resolution_cases_status_check
  check (status in ('ai_triage', 'needs_evidence', 'founder_review', 'waiting_party', 'provider_review', 'resolved', 'closed'));

alter table public.resolution_cases drop constraint if exists resolution_cases_payment_action_check;
alter table public.resolution_cases
  add constraint resolution_cases_payment_action_check
  check (payment_action_requested in ('none', 'pause_release', 'partial_refund', 'full_refund', 'provider_dispute', 'mpesa_reversal', 'chargeback_evidence'));

alter table public.resolution_cases drop constraint if exists resolution_cases_amount_check;
alter table public.resolution_cases
  add constraint resolution_cases_amount_check
  check (amount_in_dispute is null or amount_in_dispute >= 0);

drop trigger if exists resolution_cases_set_updated_at on public.resolution_cases;
create trigger resolution_cases_set_updated_at
before update on public.resolution_cases
for each row
execute function app_private.set_updated_at();

alter table public.resolution_cases enable row level security;

drop policy if exists "Admins can read resolution cases" on public.resolution_cases;
create policy "Admins can read resolution cases"
on public.resolution_cases
for select
to authenticated
using ((select app_private.is_admin()));

drop policy if exists "Users can read own resolution cases" on public.resolution_cases;
create policy "Users can read own resolution cases"
on public.resolution_cases
for select
to authenticated
using (created_by = (select auth.uid()));

drop policy if exists "Admins can update resolution cases" on public.resolution_cases;
create policy "Admins can update resolution cases"
on public.resolution_cases
for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create or replace function app_private.resolution_founder_required(
  input_issue_type text,
  input_desired_outcome text,
  input_severity text,
  input_payment_action text
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    input_severity in ('safety', 'legal', 'payment')
    or input_issue_type in ('payment_refund', 'payment_dispute', 'receiver_safety', 'restricted_item')
    or input_desired_outcome in ('partial_refund', 'full_refund', 'release_milestone', 'replace_receiver', 'legal_compliance_review')
    or input_payment_action <> 'none';
$$;

create or replace function app_private.resolution_ai_triage(
  input_issue_type text,
  input_desired_outcome text,
  input_severity text,
  input_founder_required boolean
)
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select concat_ws(
    ' ',
    case
      when input_severity = 'safety' then 'Safety issue: pause risky activity, preserve proof, and request founder review.'
      when input_severity = 'legal' then 'Legal/compliance issue: pause quoting, buying, shipping, or release until human review.'
      when input_severity = 'payment' then 'Payment issue: freeze milestone release until provider evidence is checked.'
      else 'Routine issue: ask for missing proof, timeline, and preferred outcome before escalation.'
    end,
    case
      when input_issue_type in ('proof_missing', 'poor_quality') then 'Ask both sides for dated photos, receipts, location notes, or provider records.'
      when input_issue_type in ('payment_refund', 'payment_dispute') then 'Collect provider reference, amount, payment rail, and exact disputed milestone.'
      when input_issue_type = 'restricted_item' then 'Check item legality and courier/postal acceptance before any movement.'
      when input_issue_type = 'delay' then 'Request the blocker, next checkpoint, and revised ETA.'
      else 'Summarize facts, evidence gaps, and the next safe message.'
    end,
    case
      when input_founder_required then 'Protected decision: AI may draft and summarize, but cannot refund, release money, mark payment paid, replace a receiver, approve ID, or clear legal/import risk.'
      else 'AI may draft the next message and checklist; admin review is only needed if evidence or risk changes.'
    end,
    concat('Requested outcome:', replace(input_desired_outcome, '_', ' ') || '.')
  );
$$;

create or replace function app_private.create_resolution_case(
  lookup_code text,
  lookup_contact text,
  input_reporter_role text default 'client',
  input_reporter_name text default '',
  input_issue_type text default 'other',
  input_desired_outcome text default 'explain_status',
  input_severity text default 'normal',
  input_summary text default '',
  input_evidence_links text[] default array[]::text[],
  input_provider_reference text default '',
  input_amount_in_dispute integer default null,
  input_payment_action_requested text default 'none'
)
returns table (
  id uuid,
  resolution_code text,
  request_code text,
  status text,
  founder_review_required boolean,
  ai_triage text,
  created_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  target_request public.service_requests%rowtype;
  clean_role text := lower(btrim(coalesce(input_reporter_role, 'client')));
  clean_issue text := lower(btrim(coalesce(input_issue_type, 'other')));
  clean_outcome text := lower(btrim(coalesce(input_desired_outcome, 'explain_status')));
  clean_severity text := lower(btrim(coalesce(input_severity, 'normal')));
  clean_payment_action text := lower(btrim(coalesce(input_payment_action_requested, 'none')));
  clean_summary text := left(btrim(coalesce(input_summary, '')), 2400);
  clean_name text := left(btrim(coalesce(input_reporter_name, '')), 180);
  clean_contact text := left(btrim(coalesce(lookup_contact, '')), 220);
  clean_reference text := left(btrim(coalesce(input_provider_reference, '')), 240);
  clean_links text[] := coalesce(input_evidence_links, array[]::text[]);
  needs_founder boolean;
  triage_text text;
  inserted_case public.resolution_cases%rowtype;
begin
  if clean_role not in ('client', 'receiver', 'local_contact', 'admin', 'other') then
    clean_role := 'client';
  end if;
  if clean_issue not in ('proof_missing', 'poor_quality', 'delay', 'payment_refund', 'payment_dispute', 'receiver_safety', 'restricted_item', 'wrong_item', 'communication', 'other') then
    clean_issue := 'other';
  end if;
  if clean_outcome not in ('explain_status', 'pause_job', 'redo_work', 'partial_refund', 'full_refund', 'release_milestone', 'replace_receiver', 'legal_compliance_review', 'other') then
    clean_outcome := 'explain_status';
  end if;
  if clean_severity not in ('normal', 'urgent', 'safety', 'legal', 'payment') then
    clean_severity := 'normal';
  end if;
  if clean_payment_action not in ('none', 'pause_release', 'partial_refund', 'full_refund', 'provider_dispute', 'mpesa_reversal', 'chargeback_evidence') then
    clean_payment_action := 'none';
  end if;
  if clean_summary = '' then
    raise exception 'Describe the issue before opening a resolution case.';
  end if;
  if array_length(clean_links, 1) > 12 then
    raise exception 'Add up to 12 evidence links for one resolution case.';
  end if;
  if exists (select 1 from unnest(clean_links) as link where link !~* '^https?://') then
    raise exception 'Evidence links must start with http:// or https://.';
  end if;

  select *
  into target_request
  from public.service_requests sr
  where upper(btrim(sr.request_code)) = upper(btrim(lookup_code))
    and (
      lower(btrim(coalesce(sr.email, ''))) = lower(btrim(lookup_contact))
      or regexp_replace(coalesce(sr.whatsapp, ''), '\D', '', 'g') = regexp_replace(coalesce(lookup_contact, ''), '\D', '', 'g')
    )
  limit 1;

  if target_request.id is null then
    raise exception 'No matching request found.';
  end if;

  needs_founder := app_private.resolution_founder_required(
    clean_issue,
    clean_outcome,
    clean_severity,
    clean_payment_action
  );
  triage_text := app_private.resolution_ai_triage(clean_issue, clean_outcome, clean_severity, needs_founder);

  insert into public.resolution_cases (
    service_request_id,
    request_code,
    created_by,
    reporter_role,
    reporter_name,
    reporter_contact,
    issue_type,
    desired_outcome,
    severity,
    status,
    payment_action_requested,
    provider_reference,
    amount_in_dispute,
    evidence_links,
    summary,
    ai_triage,
    founder_review_required
  )
  values (
    target_request.id,
    target_request.request_code,
    auth.uid(),
    clean_role,
    nullif(clean_name, ''),
    clean_contact,
    clean_issue,
    clean_outcome,
    clean_severity,
    case when needs_founder then 'founder_review' else 'ai_triage' end,
    clean_payment_action,
    nullif(clean_reference, ''),
    input_amount_in_dispute,
    clean_links,
    clean_summary,
    triage_text,
    needs_founder
  )
  returning * into inserted_case;

  id := inserted_case.id;
  resolution_code := inserted_case.resolution_code;
  request_code := inserted_case.request_code;
  status := inserted_case.status;
  founder_review_required := inserted_case.founder_review_required;
  ai_triage := inserted_case.ai_triage;
  created_at := inserted_case.created_at;
  return next;
end;
$$;

revoke all on function app_private.create_resolution_case(text, text, text, text, text, text, text, text, text[], text, integer, text) from public;
grant execute on function app_private.create_resolution_case(text, text, text, text, text, text, text, text, text[], text, integer, text) to anon, authenticated;

create or replace function public.create_resolution_case(
  lookup_code text,
  lookup_contact text,
  input_reporter_role text default 'client',
  input_reporter_name text default '',
  input_issue_type text default 'other',
  input_desired_outcome text default 'explain_status',
  input_severity text default 'normal',
  input_summary text default '',
  input_evidence_links text[] default array[]::text[],
  input_provider_reference text default '',
  input_amount_in_dispute integer default null,
  input_payment_action_requested text default 'none'
)
returns table (
  id uuid,
  resolution_code text,
  request_code text,
  status text,
  founder_review_required boolean,
  ai_triage text,
  created_at timestamptz
)
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.create_resolution_case(
    lookup_code,
    lookup_contact,
    input_reporter_role,
    input_reporter_name,
    input_issue_type,
    input_desired_outcome,
    input_severity,
    input_summary,
    input_evidence_links,
    input_provider_reference,
    input_amount_in_dispute,
    input_payment_action_requested
  );
$$;

revoke all on function public.create_resolution_case(text, text, text, text, text, text, text, text, text[], text, integer, text) from public;
grant execute on function public.create_resolution_case(text, text, text, text, text, text, text, text, text[], text, integer, text) to anon, authenticated;

create or replace function app_private.list_request_resolution_cases(
  lookup_code text,
  lookup_contact text
)
returns table (
  resolution_code text,
  request_code text,
  issue_type text,
  desired_outcome text,
  severity text,
  status text,
  founder_review_required boolean,
  ai_triage text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, app_private
as $$
declare
  target_request public.service_requests%rowtype;
begin
  select *
  into target_request
  from public.service_requests sr
  where upper(btrim(sr.request_code)) = upper(btrim(lookup_code))
    and (
      lower(btrim(coalesce(sr.email, ''))) = lower(btrim(lookup_contact))
      or regexp_replace(coalesce(sr.whatsapp, ''), '\D', '', 'g') = regexp_replace(coalesce(lookup_contact, ''), '\D', '', 'g')
    )
  limit 1;

  if target_request.id is null then
    raise exception 'No matching request found.';
  end if;

  return query
    select
      rc.resolution_code,
      rc.request_code,
      rc.issue_type,
      rc.desired_outcome,
      rc.severity,
      rc.status,
      rc.founder_review_required,
      rc.ai_triage,
      rc.created_at,
      rc.updated_at
    from public.resolution_cases rc
    where rc.service_request_id = target_request.id
    order by rc.created_at desc;
end;
$$;

revoke all on function app_private.list_request_resolution_cases(text, text) from public;
grant execute on function app_private.list_request_resolution_cases(text, text) to anon, authenticated;

create or replace function public.list_request_resolution_cases(
  lookup_code text,
  lookup_contact text
)
returns table (
  resolution_code text,
  request_code text,
  issue_type text,
  desired_outcome text,
  severity text,
  status text,
  founder_review_required boolean,
  ai_triage text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_request_resolution_cases(lookup_code, lookup_contact);
$$;

revoke all on function public.list_request_resolution_cases(text, text) from public;
grant execute on function public.list_request_resolution_cases(text, text) to anon, authenticated;

create or replace function app_private.list_resolution_cases()
returns table (
  id uuid,
  resolution_code text,
  request_code text,
  reporter_role text,
  reporter_name text,
  reporter_contact text,
  issue_type text,
  desired_outcome text,
  severity text,
  status text,
  payment_action_requested text,
  provider_reference text,
  amount_in_dispute integer,
  evidence_links text[],
  summary text,
  ai_triage text,
  founder_review_required boolean,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, app_private
as $$
begin
  if not app_private.is_admin() then
    raise exception 'Admin access required.';
  end if;

  return query
    select
      rc.id,
      rc.resolution_code,
      rc.request_code,
      rc.reporter_role,
      rc.reporter_name,
      rc.reporter_contact,
      rc.issue_type,
      rc.desired_outcome,
      rc.severity,
      rc.status,
      rc.payment_action_requested,
      rc.provider_reference,
      rc.amount_in_dispute,
      rc.evidence_links,
      rc.summary,
      rc.ai_triage,
      rc.founder_review_required,
      rc.admin_notes,
      rc.created_at,
      rc.updated_at,
      rc.resolved_at
    from public.resolution_cases rc
    order by
      case when rc.status in ('founder_review', 'provider_review', 'needs_evidence') then 0 else 1 end,
      rc.updated_at desc;
end;
$$;

revoke all on function app_private.list_resolution_cases() from public;
grant execute on function app_private.list_resolution_cases() to authenticated;

create or replace function public.list_resolution_cases()
returns table (
  id uuid,
  resolution_code text,
  request_code text,
  reporter_role text,
  reporter_name text,
  reporter_contact text,
  issue_type text,
  desired_outcome text,
  severity text,
  status text,
  payment_action_requested text,
  provider_reference text,
  amount_in_dispute integer,
  evidence_links text[],
  summary text,
  ai_triage text,
  founder_review_required boolean,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_resolution_cases();
$$;

revoke all on function public.list_resolution_cases() from public;
grant execute on function public.list_resolution_cases() to authenticated;

create or replace function app_private.update_resolution_case(
  input_resolution_code text,
  input_status text,
  input_admin_notes text default ''
)
returns public.resolution_cases
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  clean_status text := lower(btrim(coalesce(input_status, 'ai_triage')));
  updated_case public.resolution_cases%rowtype;
begin
  if not app_private.is_admin() then
    raise exception 'Admin access required.';
  end if;

  if clean_status not in ('ai_triage', 'needs_evidence', 'founder_review', 'waiting_party', 'provider_review', 'resolved', 'closed') then
    raise exception 'Unsupported resolution status.';
  end if;

  update public.resolution_cases
  set
    status = clean_status,
    admin_notes = left(btrim(coalesce(input_admin_notes, '')), 2400),
    resolved_at = case when clean_status in ('resolved', 'closed') then coalesce(resolved_at, now()) else null end
  where upper(btrim(resolution_code)) = upper(btrim(input_resolution_code))
  returning * into updated_case;

  if updated_case.id is null then
    raise exception 'No matching resolution case found.';
  end if;

  return updated_case;
end;
$$;

revoke all on function app_private.update_resolution_case(text, text, text) from public;
grant execute on function app_private.update_resolution_case(text, text, text) to authenticated;

create or replace function public.update_resolution_case(
  input_resolution_code text,
  input_status text,
  input_admin_notes text default ''
)
returns public.resolution_cases
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.update_resolution_case(input_resolution_code, input_status, input_admin_notes);
$$;

revoke all on function public.update_resolution_case(text, text, text) from public;
grant execute on function public.update_resolution_case(text, text, text) to authenticated;

grant usage on schema public to anon, authenticated;
grant usage on schema app_private to anon, authenticated;
grant select on public.resolution_cases to authenticated;
grant update (
  status,
  admin_notes,
  resolved_at
) on public.resolution_cases to authenticated;
revoke insert, delete, truncate, references, trigger on table public.resolution_cases from anon, authenticated;
