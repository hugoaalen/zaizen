update public.custom_categories
set name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
where name is distinct from btrim(regexp_replace(name, '\s+', ' ', 'g'));

with duplicates as (
  select id,
    row_number() over (
      partition by user_id, type, lower(btrim(name))
      order by id
    ) as duplicate_number
  from public.custom_categories
)
delete from public.custom_categories
where id in (
  select id
  from duplicates
  where duplicate_number > 1
);

create unique index if not exists custom_categories_user_type_name_unique
  on public.custom_categories (user_id, type, lower(btrim(name)));
