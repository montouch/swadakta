drop policy if exists "Admins can read job offers" on public.job_offers;
drop policy if exists "Receivers can read own job offers" on public.job_offers;
drop policy if exists "Clients can read offers on own requests" on public.job_offers;

create policy "Authenticated can read visible job offers"
on public.job_offers
for select
to authenticated
using (
  (select app_private.is_admin())
  or receiver_user_id = (select auth.uid())
  or lower(btrim(receiver_email)) = lower(btrim((select app_private.current_auth_email())))
  or exists (
    select 1
    from public.service_requests sr
    where sr.id = job_offers.service_request_id
      and lower(btrim(coalesce(sr.email, ''))) = lower(btrim((select app_private.current_auth_email())))
  )
);

drop policy if exists "Admins can read resolution cases" on public.resolution_cases;
drop policy if exists "Users can read own resolution cases" on public.resolution_cases;

create policy "Authenticated can read visible resolution cases"
on public.resolution_cases
for select
to authenticated
using (
  (select app_private.is_admin())
  or created_by = (select auth.uid())
);
