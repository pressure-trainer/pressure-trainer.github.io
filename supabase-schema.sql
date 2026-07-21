-- Pressure — Supabase schema
-- Run this once in the Supabase dashboard: Project -> SQL Editor -> New query -> paste -> Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  team text not null default '',
  role text not null default 'CB' check (role in ('CB', 'RB', 'LB')),
  theme text not null default 'cream' check (theme in ('cream', 'dark', 'hybrid')),
  approved boolean not null default false,
  streak_days integer not null default 1,
  total_hours numeric not null default 0,
  drills_completed integer not null default 0,
  created_at timestamptz not null default now()
);

-- If the table already existed without the approved column, add it now:
alter table public.profiles add column if not exists approved boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Approval gate: prevent users from approving themselves.
-- Users may update their own profile columns, but NOT the "approved" flag —
-- only you (via the Supabase dashboard, which uses the service role) can flip it.
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, team, role, theme, streak_days, total_hours, drills_completed)
  on public.profiles to authenticated;
