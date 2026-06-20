begin;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark'
    check (theme in ('light', 'dark')),
  monthly_chart text not null default 'circular'
    check (monthly_chart in ('circular', 'barras', 'mosaico')),
  yearly_chart text not null default 'barras'
    check (yearly_chart in ('barras', 'lineas', 'area')),
  chart_palette text not null default 'normal'
    check (chart_palette in ('normal', 'pastel', 'vibrante')),
  accent_color text not null default 'purple'
    check (accent_color in ('purple', 'blue', 'green', 'rose', 'orange')),
  density text not null default 'normal'
    check (density in ('compact', 'normal', 'comfortable')),
  initial_view text not null default 'monthly'
    check (initial_view in ('monthly', 'yearly')),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "zaizen_user_preferences_select" on public.user_preferences;
drop policy if exists "zaizen_user_preferences_insert" on public.user_preferences;
drop policy if exists "zaizen_user_preferences_update" on public.user_preferences;
drop policy if exists "zaizen_user_preferences_delete" on public.user_preferences;

create policy "zaizen_user_preferences_select"
  on public.user_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "zaizen_user_preferences_insert"
  on public.user_preferences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "zaizen_user_preferences_update"
  on public.user_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "zaizen_user_preferences_delete"
  on public.user_preferences
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all privileges on table public.user_preferences from public, anon;
grant select, insert, update, delete on table public.user_preferences to authenticated;

commit;
