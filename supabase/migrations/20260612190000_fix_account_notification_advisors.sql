create index if not exists account_notifications_related_request_id_idx
  on public.account_notifications (related_request_id)
  where related_request_id is not null;

drop index if exists public.account_notifications_code_key;

drop policy if exists "Users can read own account notifications" on public.account_notifications;
create policy "Users can read own account notifications"
on public.account_notifications
for select
to authenticated
using (user_id = (select auth.uid()) or (select app_private.is_admin()));
