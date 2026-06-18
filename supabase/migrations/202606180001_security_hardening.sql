begin;

-- Keep privileged functions isolated from objects that could shadow their names.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  requesting_user uuid := auth.uid();
  last_login timestamptz;
begin
  if requesting_user is null then
    raise exception 'Authentication required';
  end if;

  select users.last_sign_in_at
    into last_login
  from auth.users as users
  where users.id = requesting_user;

  if last_login is null or last_login < pg_catalog.now() - interval '15 minutes' then
    raise exception 'Recent authentication required';
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
$function$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

alter default privileges in schema public revoke execute on functions from public, anon;

revoke create on schema public from public;
revoke usage on schema public from anon;
grant usage on schema public to authenticated;

alter default privileges in schema public
  revoke all privileges on tables from public, anon;
alter default privileges in schema public
  revoke all privileges on sequences from public, anon;

-- A contribution must belong to the same user as its parent goal.
create unique index if not exists savings_goals_id_user_unique
  on public.savings_goals (id, user_id);

alter table public.savings_contributions
  drop constraint if exists savings_contributions_goal_user_fkey,
  add constraint savings_contributions_goal_user_fkey
    foreign key (goal_id, user_id)
    references public.savings_goals (id, user_id)
    on delete cascade
    not valid;

drop policy if exists "zaizen_savings_contributions_owner" on public.savings_contributions;
drop policy if exists "zaizen_savings_contributions_select" on public.savings_contributions;
drop policy if exists "zaizen_savings_contributions_insert" on public.savings_contributions;
drop policy if exists "zaizen_savings_contributions_update" on public.savings_contributions;
drop policy if exists "zaizen_savings_contributions_delete" on public.savings_contributions;

create policy "zaizen_savings_contributions_select"
  on public.savings_contributions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "zaizen_savings_contributions_insert"
  on public.savings_contributions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.savings_goals
      where savings_goals.id = goal_id
        and savings_goals.user_id = (select auth.uid())
    )
  );

create policy "zaizen_savings_contributions_update"
  on public.savings_contributions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.savings_goals
      where savings_goals.id = goal_id
        and savings_goals.user_id = (select auth.uid())
    )
  );

create policy "zaizen_savings_contributions_delete"
  on public.savings_contributions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit table privileges: the browser never needs anonymous database access.
revoke all privileges on table
  public.transactions,
  public.subscriptions,
  public.custom_categories,
  public.budgets,
  public.categorization_rules,
  public.savings_goals,
  public.savings_contributions
from public, anon;

grant select, insert, update, delete on table
  public.transactions,
  public.subscriptions,
  public.custom_categories,
  public.budgets,
  public.categorization_rules,
  public.savings_goals,
  public.savings_contributions
to authenticated;

revoke all privileges on all sequences in schema public from public, anon;
grant usage, select on all sequences in schema public to authenticated;

-- New rows receive defense-in-depth validation even if a client bypasses the UI.
alter table public.transactions
  drop constraint if exists transactions_amount_secure_check,
  drop constraint if exists transactions_type_secure_check,
  drop constraint if exists transactions_description_secure_check,
  drop constraint if exists transactions_category_secure_check,
  drop constraint if exists transactions_date_secure_check,
  add constraint transactions_amount_secure_check
    check (amount > 0 and amount <= 9999999999.99) not valid,
  add constraint transactions_type_secure_check
    check (type in ('expense', 'income')) not valid,
  add constraint transactions_description_secure_check
    check (char_length(btrim(description)) between 1 and 500) not valid,
  add constraint transactions_category_secure_check
    check (char_length(btrim(category)) between 1 and 80) not valid,
  add constraint transactions_date_secure_check
    check (date between date '1900-01-01' and date '2200-12-31') not valid;

alter table public.subscriptions
  drop constraint if exists subscriptions_amount_secure_check,
  drop constraint if exists subscriptions_type_secure_check,
  drop constraint if exists subscriptions_description_secure_check,
  drop constraint if exists subscriptions_category_secure_check,
  add constraint subscriptions_amount_secure_check
    check (amount > 0 and amount <= 9999999999.99) not valid,
  add constraint subscriptions_type_secure_check
    check (type in ('expense', 'income')) not valid,
  add constraint subscriptions_description_secure_check
    check (char_length(btrim(description)) between 1 and 500) not valid,
  add constraint subscriptions_category_secure_check
    check (char_length(btrim(category)) between 1 and 80) not valid;

alter table public.custom_categories
  drop constraint if exists custom_categories_name_secure_check,
  drop constraint if exists custom_categories_type_secure_check,
  add constraint custom_categories_name_secure_check
    check (char_length(btrim(name)) between 1 and 80) not valid,
  add constraint custom_categories_type_secure_check
    check (type in ('expense', 'income')) not valid;

alter table public.budgets
  drop constraint if exists budgets_category_secure_check,
  drop constraint if exists budgets_amount_secure_check,
  add constraint budgets_category_secure_check
    check (char_length(btrim(category)) between 1 and 80) not valid,
  add constraint budgets_amount_secure_check
    check (amount > 0 and amount <= 9999999999.99) not valid;

alter table public.categorization_rules
  drop constraint if exists categorization_rules_pattern_secure_check,
  drop constraint if exists categorization_rules_category_secure_check,
  add constraint categorization_rules_pattern_secure_check
    check (char_length(btrim(pattern)) between 1 and 120) not valid,
  add constraint categorization_rules_category_secure_check
    check (char_length(btrim(category)) between 1 and 80) not valid;

alter table public.savings_goals
  drop constraint if exists savings_goals_name_secure_check,
  drop constraint if exists savings_goals_amount_secure_check,
  add constraint savings_goals_name_secure_check
    check (char_length(btrim(name)) between 1 and 120) not valid,
  add constraint savings_goals_amount_secure_check
    check (target_amount > 0 and target_amount <= 9999999999.99) not valid;

alter table public.savings_contributions
  drop constraint if exists savings_contributions_amount_secure_check,
  add constraint savings_contributions_amount_secure_check
    check (amount > 0 and amount <= 9999999999.99) not valid;

create index if not exists savings_contributions_user_idx
  on public.savings_contributions (user_id);

-- Refuse to finish with historical rows that violate the new guarantees.
alter table public.savings_contributions
  validate constraint savings_contributions_goal_user_fkey;
alter table public.savings_contributions
  validate constraint savings_contributions_amount_secure_check;

alter table public.transactions
  validate constraint transactions_amount_secure_check;
alter table public.transactions
  validate constraint transactions_type_secure_check;
alter table public.transactions
  validate constraint transactions_description_secure_check;
alter table public.transactions
  validate constraint transactions_category_secure_check;
alter table public.transactions
  validate constraint transactions_date_secure_check;

alter table public.subscriptions
  validate constraint subscriptions_amount_secure_check;
alter table public.subscriptions
  validate constraint subscriptions_type_secure_check;
alter table public.subscriptions
  validate constraint subscriptions_description_secure_check;
alter table public.subscriptions
  validate constraint subscriptions_category_secure_check;

alter table public.custom_categories
  validate constraint custom_categories_name_secure_check;
alter table public.custom_categories
  validate constraint custom_categories_type_secure_check;

alter table public.budgets
  validate constraint budgets_category_secure_check;
alter table public.budgets
  validate constraint budgets_amount_secure_check;

alter table public.categorization_rules
  validate constraint categorization_rules_pattern_secure_check;
alter table public.categorization_rules
  validate constraint categorization_rules_category_secure_check;

alter table public.savings_goals
  validate constraint savings_goals_name_secure_check;
alter table public.savings_goals
  validate constraint savings_goals_amount_secure_check;

commit;
