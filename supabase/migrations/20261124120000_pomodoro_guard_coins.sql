-- Security audit Finding #1 (CWE-602): a signed-in client could write any coin total and unlock
-- species for free. Coins are only earned by completed focus sessions and only spent by unlocking
-- species, so every profile must satisfy:
--
--     coins + cost(unlocked species) <= coins earned across the user's sessions
--
-- Shares the habit-tracker-app project: every object stays prefixed with `pomodoro_`.

-- ---------------------------------------------------------------------------
-- 1) Session earnings must match the session itself, so "earned" can't be inflated per row.
--    NOT VALID: rows written before this migration are not re-checked; every new or updated row is.
-- ---------------------------------------------------------------------------

alter table public.pomodoro_sessions
  add constraint pomodoro_sessions_completed_consistent
  check (status <> 'completed' or (actual_seconds = planned_seconds and coins_earned = planned_seconds / 60))
  not valid;

alter table public.pomodoro_sessions
  add constraint pomodoro_sessions_duration_fits
  check (extract(epoch from (ended_at - started_at)) + 1 >= actual_seconds)
  not valid;

-- ---------------------------------------------------------------------------
-- 2) Guard every profile write (SECURITY INVOKER: the session sum respects RLS for the caller).
-- ---------------------------------------------------------------------------

create function public.pomodoro_guard_coins()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  claimed bigint;
  previous bigint;
  earned bigint;
begin
  -- Species prices: keep in sync with SPECIES in src/lib/species.ts (sync.test.ts checks this file).
  claimed := new.coins
    + (case when 'pine' = any(new.unlocked_species) then 30 else 0 end)
    + (case when 'cherry' = any(new.unlocked_species) then 80 else 0 end)
    + (case when 'maple' = any(new.unlocked_species) then 150 else 0 end);

  -- Updates that don't raise the claimed total (spending, settings, streak) are always allowed.
  if tg_op = 'UPDATE' then
    previous := old.coins
      + (case when 'pine' = any(old.unlocked_species) then 30 else 0 end)
      + (case when 'cherry' = any(old.unlocked_species) then 80 else 0 end)
      + (case when 'maple' = any(old.unlocked_species) then 150 else 0 end);
    if claimed <= previous then
      return new;
    end if;
  end if;

  select coalesce(sum(s.coins_earned), 0) into earned
  from public.pomodoro_sessions s
  where s.user_id = new.user_id;

  if claimed > earned then
    raise exception 'pomodoro_profiles: % coins (balance plus unlocked species) exceed the % coins earned', claimed, earned
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger pomodoro_profiles_guard_coins
  before insert or update on public.pomodoro_profiles
  for each row execute function public.pomodoro_guard_coins();
