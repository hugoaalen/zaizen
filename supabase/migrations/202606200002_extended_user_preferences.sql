begin;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark',
  monthly_chart text not null default 'circular',
  yearly_chart text not null default 'barras',
  chart_palette text not null default 'normal',
  updated_at timestamptz not null default now()
);

alter table public.user_preferences
  add column if not exists accent_color text not null default 'purple',
  add column if not exists density text not null default 'normal',
  add column if not exists initial_view text not null default 'monthly';

alter table public.user_preferences
  drop constraint if exists user_preferences_theme_check,
  drop constraint if exists user_preferences_monthly_chart_check,
  drop constraint if exists user_preferences_yearly_chart_check,
  drop constraint if exists user_preferences_chart_palette_check,
  drop constraint if exists user_preferences_accent_color_check,
  drop constraint if exists user_preferences_density_check,
  drop constraint if exists user_preferences_initial_view_check,
  add constraint user_preferences_theme_check
    check (theme in ('light', 'dark')),
  add constraint user_preferences_monthly_chart_check
    check (monthly_chart in ('circular', 'barras', 'mosaico')),
  add constraint user_preferences_yearly_chart_check
    check (yearly_chart in ('barras', 'lineas', 'area')),
  add constraint user_preferences_chart_palette_check
    check (chart_palette in ('normal', 'pastel', 'vibrante')),
  add constraint user_preferences_accent_color_check
    check (accent_color in ('purple', 'blue', 'green', 'rose', 'orange')),
  add constraint user_preferences_density_check
    check (density in ('compact', 'normal', 'comfortable')),
  add constraint user_preferences_initial_view_check
    check (initial_view in ('monthly', 'yearly'));

alter table public.user_preferences enable row level security;

drop policy if exists "zaizen_user_preferences_select" on public.user_preferences;
drop policy if exists "zaizen_user_preferences_insert" on public.user_preferences;
drop policy if exists "zaizen_user_preferences_update" on public.user_preferences;
drop policy if exists "zaizen_user_preferences_delete" on public.user_preferences;

create policy "zaizen_user_preferences_select"
  on public.user_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "zaizen_user_preferences_insert"
  on public.user_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "zaizen_user_preferences_update"
  on public.user_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "zaizen_user_preferences_delete"
  on public.user_preferences for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all privileges on table public.user_preferences from public, anon;
grant select, insert, update, delete on table public.user_preferences to authenticated;

commit;
