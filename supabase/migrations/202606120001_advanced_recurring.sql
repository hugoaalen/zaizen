alter table public.subscriptions
  add column if not exists frequency text,
  add column if not exists charge_day smallint,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists active boolean;

update public.subscriptions
set
  frequency = coalesce(
    frequency,
    case when month is null then 'monthly' else 'yearly' end
  ),
  charge_day = coalesce(charge_day, 1),
  start_date = coalesce(
    start_date,
    case
      when month is null then date '2000-01-01'
      else make_date(2000, month, 1)
    end
  ),
  active = coalesce(active, true);

alter table public.subscriptions
  alter column frequency set default 'monthly',
  alter column frequency set not null,
  alter column charge_day set default 1,
  alter column charge_day set not null,
  alter column start_date set default current_date,
  alter column start_date set not null,
  alter column active set default true,
  alter column active set not null;

alter table public.subscriptions
  drop constraint if exists subscriptions_frequency_check,
  add constraint subscriptions_frequency_check
    check (frequency in ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly')),
  drop constraint if exists subscriptions_charge_day_check,
  add constraint subscriptions_charge_day_check
    check (charge_day between 1 and 31),
  drop constraint if exists subscriptions_date_range_check,
  add constraint subscriptions_date_range_check
    check (end_date is null or end_date >= start_date);

create index if not exists subscriptions_user_active_idx
  on public.subscriptions (user_id, active);
