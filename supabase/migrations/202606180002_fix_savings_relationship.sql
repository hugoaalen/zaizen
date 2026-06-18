begin;

-- The composite relationship already guarantees both goal ownership and cascade
-- deletion. Keeping the old goal_id-only FK makes PostgREST embeds ambiguous.
alter table public.savings_contributions
  drop constraint if exists savings_contributions_goal_id_fkey;

notify pgrst, 'reload schema';

commit;
