create schema if not exists app_private;

create or replace function app_private.get_my_account_profile()
returns public.account_profiles
language plpgsql
stable
security definer
set search_path = public, app_private
as $$
declare
  current_user_id uuid := auth.uid();
  profile public.account_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'Sign in before loading your account profile.';
  end if;

  select *
  into profile
  from public.account_profiles
  where user_id = current_user_id;

  return profile;
end;
$$;

revoke all on function app_private.get_my_account_profile() from public;
revoke all on function app_private.get_my_account_profile() from anon;
grant execute on function app_private.get_my_account_profile() to authenticated;

create or replace function public.get_my_account_profile()
returns public.account_profiles
language sql
stable
security invoker
set search_path = public, app_private
as $$
  select * from app_private.get_my_account_profile();
$$;

revoke all on function public.get_my_account_profile() from public;
revoke all on function public.get_my_account_profile() from anon;
grant execute on function public.get_my_account_profile() to authenticated;

grant usage on schema public to anon, authenticated;
grant usage on schema app_private to authenticated;
grant select on public.account_profiles to authenticated;
