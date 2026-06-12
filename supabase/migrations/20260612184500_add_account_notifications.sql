create table if not exists public.account_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_code text not null unique default ('NT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'account',
  priority text not null default 'info',
  title text not null,
  body text not null default '',
  action_label text not null default '',
  action_href text not null default '',
  request_code text not null default '',
  related_request_id uuid references public.service_requests(id) on delete set null,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_notifications add column if not exists notification_code text not null default ('NT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));
alter table public.account_notifications add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.account_notifications add column if not exists category text not null default 'account';
alter table public.account_notifications add column if not exists priority text not null default 'info';
alter table public.account_notifications add column if not exists title text not null default '';
alter table public.account_notifications add column if not exists body text not null default '';
alter table public.account_notifications add column if not exists action_label text not null default '';
alter table public.account_notifications add column if not exists action_href text not null default '';
alter table public.account_notifications add column if not exists request_code text not null default '';
alter table public.account_notifications add column if not exists related_request_id uuid references public.service_requests(id) on delete set null;
alter table public.account_notifications add column if not exists read_at timestamptz;
alter table public.account_notifications add column if not exists dismissed_at timestamptz;
alter table public.account_notifications add column if not exists created_at timestamptz not null default now();
alter table public.account_notifications add column if not exists updated_at timestamptz not null default now();

create unique index if not exists account_notifications_code_key
  on public.account_notifications (notification_code);
create index if not exists account_notifications_user_state_idx
  on public.account_notifications (user_id, dismissed_at, read_at, created_at desc);
create index if not exists account_notifications_request_idx
  on public.account_notifications (request_code, created_at desc)
  where request_code <> '';

alter table public.account_notifications drop constraint if exists account_notifications_category_check;
alter table public.account_notifications
  add constraint account_notifications_category_check
  check (category in ('account', 'payment', 'verification', 'message', 'proof', 'dispute', 'ai_summary', 'milestone', 'system'));

alter table public.account_notifications drop constraint if exists account_notifications_priority_check;
alter table public.account_notifications
  add constraint account_notifications_priority_check
  check (priority in ('info', 'success', 'attention', 'urgent'));

alter table public.account_notifications drop constraint if exists account_notifications_title_check;
alter table public.account_notifications
  add constraint account_notifications_title_check
  check (btrim(title) <> '' and length(title) <= 160);

alter table public.account_notifications drop constraint if exists account_notifications_body_check;
alter table public.account_notifications
  add constraint account_notifications_body_check
  check (length(body) <= 1200);

alter table public.account_notifications drop constraint if exists account_notifications_action_label_check;
alter table public.account_notifications
  add constraint account_notifications_action_label_check
  check (length(action_label) <= 80);

alter table public.account_notifications drop constraint if exists account_notifications_action_href_check;
alter table public.account_notifications
  add constraint account_notifications_action_href_check
  check (
    action_href = ''
    or action_href ~* '^[a-z0-9_-]+\.html([?#].*)?$'
    or action_href ~* '^/[a-z0-9_./?#=&%-]+$'
  );

drop trigger if exists account_notifications_set_updated_at on public.account_notifications;
create trigger account_notifications_set_updated_at
before update on public.account_notifications
for each row
execute function app_private.set_updated_at();

alter table public.account_notifications enable row level security;

drop policy if exists "Users can read own account notifications" on public.account_notifications;
create policy "Users can read own account notifications"
on public.account_notifications
for select
to authenticated
using (user_id = auth.uid() or (select app_private.is_admin()));

revoke all on table public.account_notifications from anon, authenticated;
grant select on public.account_notifications to authenticated;

create or replace function app_private.list_my_notifications(include_dismissed boolean default false)
returns table (
  notification_code text,
  category text,
  priority text,
  title text,
  body text,
  action_label text,
  action_href text,
  request_code text,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, app_private
as $$
  select
    n.notification_code,
    n.category,
    n.priority,
    n.title,
    n.body,
    n.action_label,
    n.action_href,
    n.request_code,
    n.read_at,
    n.dismissed_at,
    n.created_at,
    n.updated_at
  from public.account_notifications n
  where n.user_id = auth.uid()
    and (include_dismissed or n.dismissed_at is null)
  order by
    case when n.read_at is null then 0 else 1 end,
    n.created_at desc
  limit 100;
$$;

revoke all on function app_private.list_my_notifications(boolean) from public;
revoke all on function app_private.list_my_notifications(boolean) from anon;
grant execute on function app_private.list_my_notifications(boolean) to authenticated;

create or replace function public.list_my_notifications(include_dismissed boolean default false)
returns table (
  notification_code text,
  category text,
  priority text,
  title text,
  body text,
  action_label text,
  action_href text,
  request_code text,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.list_my_notifications(include_dismissed);
$$;

revoke all on function public.list_my_notifications(boolean) from public;
revoke all on function public.list_my_notifications(boolean) from anon;
grant execute on function public.list_my_notifications(boolean) to authenticated;

create or replace function app_private.mark_my_notification(
  input_notification_code text,
  input_action text
)
returns table (
  notification_code text,
  category text,
  priority text,
  title text,
  body text,
  action_label text,
  action_href text,
  request_code text,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  clean_code text := upper(btrim(coalesce(input_notification_code, '')));
  clean_action text := lower(btrim(coalesce(input_action, '')));
begin
  if auth.uid() is null then
    raise exception 'Sign in before updating notifications.';
  end if;

  if clean_action not in ('read', 'unread', 'dismiss', 'restore') then
    raise exception 'Unsupported notification action.';
  end if;

  return query
  update public.account_notifications n
  set
    read_at = case
      when clean_action = 'read' then coalesce(n.read_at, now())
      when clean_action = 'unread' then null
      else n.read_at
    end,
    dismissed_at = case
      when clean_action = 'dismiss' then coalesce(n.dismissed_at, now())
      when clean_action = 'restore' then null
      else n.dismissed_at
    end
  where upper(n.notification_code) = clean_code
    and n.user_id = auth.uid()
  returning
    n.notification_code,
    n.category,
    n.priority,
    n.title,
    n.body,
    n.action_label,
    n.action_href,
    n.request_code,
    n.read_at,
    n.dismissed_at,
    n.created_at,
    n.updated_at;

  if not found then
    raise exception 'No matching notification found.';
  end if;
end;
$$;

revoke all on function app_private.mark_my_notification(text, text) from public;
revoke all on function app_private.mark_my_notification(text, text) from anon;
grant execute on function app_private.mark_my_notification(text, text) to authenticated;

create or replace function public.mark_my_notification(
  input_notification_code text,
  input_action text
)
returns table (
  notification_code text,
  category text,
  priority text,
  title text,
  body text,
  action_label text,
  action_href text,
  request_code text,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.mark_my_notification(input_notification_code, input_action);
$$;

revoke all on function public.mark_my_notification(text, text) from public;
revoke all on function public.mark_my_notification(text, text) from anon;
grant execute on function public.mark_my_notification(text, text) to authenticated;

create or replace function app_private.create_account_notification(
  input_user_id uuid,
  input_category text,
  input_priority text,
  input_title text,
  input_body text default '',
  input_action_label text default '',
  input_action_href text default '',
  input_request_code text default ''
)
returns table (
  notification_code text,
  category text,
  priority text,
  title text,
  body text,
  action_label text,
  action_href text,
  request_code text,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public, app_private
as $$
declare
  clean_category text := lower(btrim(coalesce(input_category, 'account')));
  clean_priority text := lower(btrim(coalesce(input_priority, 'info')));
  clean_href text := btrim(coalesce(input_action_href, ''));
begin
  if not app_private.is_admin() then
    raise exception 'Admin access required to create account notifications.';
  end if;

  if input_user_id is null then
    raise exception 'Notification recipient is required.';
  end if;

  if clean_category not in ('account', 'payment', 'verification', 'message', 'proof', 'dispute', 'ai_summary', 'milestone', 'system') then
    clean_category := 'account';
  end if;

  if clean_priority not in ('info', 'success', 'attention', 'urgent') then
    clean_priority := 'info';
  end if;

  if clean_href <> ''
    and clean_href !~* '^[a-z0-9_-]+\.html([?#].*)?$'
    and clean_href !~* '^/[a-z0-9_./?#=&%-]+$' then
    clean_href := '';
  end if;

  return query
  insert into public.account_notifications (
    user_id,
    category,
    priority,
    title,
    body,
    action_label,
    action_href,
    request_code
  )
  values (
    input_user_id,
    clean_category,
    clean_priority,
    left(coalesce(nullif(btrim(input_title), ''), 'Swadakta update'), 160),
    left(btrim(coalesce(input_body, '')), 1200),
    left(btrim(coalesce(input_action_label, '')), 80),
    clean_href,
    upper(left(btrim(coalesce(input_request_code, '')), 32))
  )
  returning
    account_notifications.notification_code,
    account_notifications.category,
    account_notifications.priority,
    account_notifications.title,
    account_notifications.body,
    account_notifications.action_label,
    account_notifications.action_href,
    account_notifications.request_code,
    account_notifications.read_at,
    account_notifications.dismissed_at,
    account_notifications.created_at,
    account_notifications.updated_at;
end;
$$;

revoke all on function app_private.create_account_notification(uuid, text, text, text, text, text, text, text) from public;
revoke all on function app_private.create_account_notification(uuid, text, text, text, text, text, text, text) from anon;
grant execute on function app_private.create_account_notification(uuid, text, text, text, text, text, text, text) to authenticated;

create or replace function public.create_account_notification(
  input_user_id uuid,
  input_category text,
  input_priority text,
  input_title text,
  input_body text default '',
  input_action_label text default '',
  input_action_href text default '',
  input_request_code text default ''
)
returns table (
  notification_code text,
  category text,
  priority text,
  title text,
  body text,
  action_label text,
  action_href text,
  request_code text,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
volatile
security invoker
set search_path = public, app_private
as $$
  select * from app_private.create_account_notification(
    input_user_id,
    input_category,
    input_priority,
    input_title,
    input_body,
    input_action_label,
    input_action_href,
    input_request_code
  );
$$;

revoke all on function public.create_account_notification(uuid, text, text, text, text, text, text, text) from public;
revoke all on function public.create_account_notification(uuid, text, text, text, text, text, text, text) from anon;
grant execute on function public.create_account_notification(uuid, text, text, text, text, text, text, text) to authenticated;
