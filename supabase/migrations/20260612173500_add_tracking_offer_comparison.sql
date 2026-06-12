create or replace function app_private.list_tracking_job_offers(
  lookup_code text,
  lookup_contact text
)
returns table (
  offer_code text,
  request_code text,
  amount integer,
  currency text,
  timeline_days integer,
  proof_plan text,
  status text,
  safety_flags text[],
  provenance_score integer,
  verification_status text,
  partner_status text,
  receiver_base text,
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
  clean_code text := upper(btrim(coalesce(lookup_code, '')));
  clean_contact text := lower(btrim(coalesce(lookup_contact, '')));
  contact_digits text := regexp_replace(coalesce(lookup_contact, ''), '\D', '', 'g');
begin
  if clean_code = '' or clean_contact = '' then
    return;
  end if;

  select sr.*
  into target_request
  from public.service_requests sr
  where upper(sr.request_code) = clean_code
    and (
      lower(btrim(sr.email)) = clean_contact
      or (
        contact_digits <> ''
        and regexp_replace(coalesce(sr.whatsapp, ''), '\D', '', 'g') = contact_digits
      )
    )
  limit 1;

  if target_request.id is null then
    return;
  end if;

  return query
  select
    jo.offer_code,
    target_request.request_code,
    jo.amount,
    jo.currency,
    jo.timeline_days,
    jo.proof_plan,
    jo.status,
    coalesce(jo.safety_flags, array[]::text[]) as safety_flags,
    greatest(25, least(100, coalesce(pa.provenance_score, 25)))::integer as provenance_score,
    coalesce(pa.identity_verification_status, 'not_started') as verification_status,
    coalesce(pa.status, 'submitted') as partner_status,
    nullif(btrim(coalesce(pa.kenya_base, '')), '') as receiver_base,
    jo.created_at,
    jo.updated_at
  from public.job_offers jo
  left join public.partner_applications pa on pa.id = jo.partner_application_id
  where jo.service_request_id = target_request.id
    and jo.status in ('submitted', 'shortlisted', 'accepted', 'declined', 'blocked')
  order by
    case jo.status
      when 'accepted' then 0
      when 'shortlisted' then 1
      when 'submitted' then 2
      when 'declined' then 3
      else 4
    end,
    coalesce(pa.provenance_score, 25) desc,
    jo.amount asc,
    jo.updated_at desc
  limit 25;
end;
$$;

revoke all on function app_private.list_tracking_job_offers(text, text) from public;
revoke all on function app_private.list_tracking_job_offers(text, text) from anon;
grant execute on function app_private.list_tracking_job_offers(text, text) to anon, authenticated;

create or replace function public.list_tracking_job_offers(
  lookup_code text,
  lookup_contact text
)
returns table (
  offer_code text,
  request_code text,
  amount integer,
  currency text,
  timeline_days integer,
  proof_plan text,
  status text,
  safety_flags text[],
  provenance_score integer,
  verification_status text,
  partner_status text,
  receiver_base text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_tracking_job_offers(lookup_code, lookup_contact);
$$;

revoke all on function public.list_tracking_job_offers(text, text) from public;
grant execute on function public.list_tracking_job_offers(text, text) to anon, authenticated;
