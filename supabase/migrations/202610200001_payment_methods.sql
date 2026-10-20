begin;

alter table public.user_preferences add column if not exists payment_methods text not null default 'off'
  check (payment_methods in ('on', 'off'));

alter table public.transactions add column if not exists payment_method text
  check (payment_method in ('cash', 'card', 'bizum', 'transfer', 'direct_debit', 'other'));
alter table public.subscriptions add column if not exists payment_method text
  check (payment_method in ('cash', 'card', 'bizum', 'transfer', 'direct_debit', 'other'));

commit;
