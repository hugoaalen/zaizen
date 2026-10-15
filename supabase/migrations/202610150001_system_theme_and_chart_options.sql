begin;

alter table public.user_preferences
  drop constraint if exists user_preferences_theme_check,
  add constraint user_preferences_theme_check check (theme in ('light', 'dark', 'system')),
  alter column theme set default 'system',
  drop constraint if exists user_preferences_monthly_chart_check,
  add constraint user_preferences_monthly_chart_check
    check (monthly_chart in ('circular', 'barras', 'mosaico', 'ranking', 'balance'));

commit;
