-- Forest Pomodoro: cloud sync for profiles and focus sessions.
-- This app shares the habit-tracker-app Supabase project, so every object it creates is
-- prefixed with `pomodoro_` and nothing here touches existing tables.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.pomodoro_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  coins integer not null default 0 check (coins between 0 and 1000000),
  selected_species text not null default 'oak'
    check (selected_species in ('oak', 'pine', 'cherry', 'maple')),
  unlocked_species text[] not null default array['oak']::text[]
    check (unlocked_species <@ array['oak', 'pine', 'cherry', 'maple']::text[]),
  focus_streak integer not null default 0 check (focus_streak between 0 and 1000),
  settings jsonb not null default '{}'::jsonb
    check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 4096),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pomodoro_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  planned_seconds integer not null check (planned_seconds between 60 and 10800),
  actual_seconds integer not null check (actual_seconds between 0 and planned_seconds),
  tag text not null check (tag in ('study', 'coding', 'work', 'reading')),
  species_id text not null check (species_id in ('oak', 'pine', 'cherry', 'maple')),
  status text not null check (status in ('completed', 'withered')),
  reason text check (reason is null or reason in ('gave_up', 'left_app')),
  coins_earned integer not null default 0 check (coins_earned between 0 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pomodoro_sessions_time_order check (ended_at >= started_at),
  constraint pomodoro_sessions_withered_has_no_coins check (status = 'completed' or coins_earned = 0)
);

create index pomodoro_sessions_user_ended_idx on public.pomodoro_sessions (user_id, ended_at desc);

-- ---------------------------------------------------------------------------
-- updated_at bookkeeping (SECURITY INVOKER, pinned search_path)
-- ---------------------------------------------------------------------------

create function public.pomodoro_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger pomodoro_profiles_touch
  before update on public.pomodoro_profiles
  for each row execute function public.pomodoro_touch_updated_at();

create trigger pomodoro_sessions_touch
  before update on public.pomodoro_sessions
  for each row execute function public.pomodoro_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: every row belongs to exactly one user
-- ---------------------------------------------------------------------------

alter table public.pomodoro_profiles enable row level security;
alter table public.pomodoro_sessions enable row level security;

create policy pomodoro_profiles_select_own on public.pomodoro_profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy pomodoro_profiles_insert_own on public.pomodoro_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy pomodoro_profiles_update_own on public.pomodoro_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy pomodoro_profiles_delete_own on public.pomodoro_profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy pomodoro_sessions_select_own on public.pomodoro_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy pomodoro_sessions_insert_own on public.pomodoro_sessions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy pomodoro_sessions_update_own on public.pomodoro_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy pomodoro_sessions_delete_own on public.pomodoro_sessions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Signed-out (anon) clients get no access at all; signed-in users only through the policies above.
revoke all on table public.pomodoro_profiles from anon;
revoke all on table public.pomodoro_sessions from anon;
grant select, insert, update, delete on table public.pomodoro_profiles to authenticated;
grant select, insert, update, delete on table public.pomodoro_sessions to authenticated;
