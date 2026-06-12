create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requesting_user uuid := auth.uid();
begin
  if requesting_user is null then
    raise exception 'Authentication required';
  end if;

  delete from public.savings_contributions where user_id = requesting_user;
  delete from public.savings_goals where user_id = requesting_user;
  delete from public.categorization_rules where user_id = requesting_user;
  delete from public.budgets where user_id = requesting_user;
  delete from public.transactions where user_id = requesting_user;
  delete from public.subscriptions where user_id = requesting_user;
  delete from public.custom_categories where user_id = requesting_user;
  delete from auth.users where id = requesting_user;
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
