-- =====================================================================
-- WORLD CUP TRACKER — SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =====================================================================

-- ---------- TEAMS ----------
create table if not exists public.teams (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  code        text not null unique,          -- e.g. 'POR', 'FRA'
  flag        text,                          -- emoji or URL
  group_name  text,                          -- e.g. 'Group A'
  created_at  timestamptz default now()
);

-- ---------- MATCHES ----------
-- Populated by you (or a sync job/edge function). The app reads from here.
create table if not exists public.matches (
  id            bigint generated always as identity primary key,
  ext_id        text unique,                 -- id from your data source (dedup on sync)
  home_team_id  bigint references public.teams(id),
  away_team_id  bigint references public.teams(id),
  home_score    int,
  away_score    int,
  kickoff       timestamptz not null,
  venue         text,
  stage         text,                        -- 'Group', 'Round of 16', etc.
  status        text default 'scheduled',    -- scheduled | live | finished
  minute        int,                         -- live clock
  home_label    text,                        -- e.g. 'Runner-up Group A' when team is TBD
  away_label    text,                        -- e.g. 'Winner Match 73' when team is TBD
  matchday      text,
  stats         jsonb default '{}'::jsonb,   -- possession, shots, etc.
  updated_at    timestamptz default now()
);

-- If upgrading an existing database, add the new columns:
alter table public.matches add column if not exists home_label text;
alter table public.matches add column if not exists away_label text;
alter table public.matches add column if not exists matchday text;

create index if not exists matches_kickoff_idx on public.matches (kickoff);
create index if not exists matches_home_idx on public.matches (home_team_id);
create index if not exists matches_away_idx on public.matches (away_team_id);

-- ---------- USER → TEAM FOLLOWS ----------
create table if not exists public.user_teams (
  user_id    uuid references auth.users(id) on delete cascade,
  team_id    bigint references public.teams(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, team_id)
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.teams       enable row level security;
alter table public.matches     enable row level security;
alter table public.user_teams  enable row level security;

-- Teams & matches: readable by any authenticated user
drop policy if exists "teams_read" on public.teams;
create policy "teams_read" on public.teams
  for select to authenticated using (true);

drop policy if exists "matches_read" on public.matches;
create policy "matches_read" on public.matches
  for select to authenticated using (true);

-- user_teams: each user manages only their own rows
drop policy if exists "ut_select" on public.user_teams;
create policy "ut_select" on public.user_teams
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "ut_insert" on public.user_teams;
create policy "ut_insert" on public.user_teams
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "ut_delete" on public.user_teams;
create policy "ut_delete" on public.user_teams
  for delete to authenticated using (auth.uid() = user_id);

-- =====================================================================
-- REALTIME (live scores) — add tables to the realtime publication
-- =====================================================================
do $$ begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null;
end $$;
-- =====================================================================
-- SEED: real World Cup 2026 groups (confirmed teams; TBD slots omitted).
-- This lets the team picker work before your first sync.js run.
-- sync.js will upsert official data over these (matched on `code`).
-- =====================================================================
insert into public.teams (name, code, flag, group_name) values
  ('Mexico','MEX','🇲🇽','Group A'),('South Africa','RSA','🇿🇦','Group A'),('South Korea','KOR','🇰🇷','Group A'),('Czech Republic','CZE','🇨🇿','Group A'),
  ('Canada','CAN','🇨🇦','Group B'),('Switzerland','SUI','🇨🇭','Group B'),('Qatar','QAT','🇶🇦','Group B'),('Bosnia and Herzegovina','BIH','🇧🇦','Group B'),
  ('Brazil','BRA','🇧🇷','Group C'),('Morocco','MAR','🇲🇦','Group C'),('Haiti','HAI','🇭🇹','Group C'),('Scotland','SCO','🏴󠁧󠁢󠁳󠁣󠁴󠁿','Group C'),
  ('USA','USA','🇺🇸','Group D'),('Paraguay','PAR','🇵🇾','Group D'),('Australia','AUS','🇦🇺','Group D'),('Turkiye','TUR','🇹🇷','Group D'),
  ('Germany','GER','🇩🇪','Group E'),('Curaçao','CUW','🇨🇼','Group E'),('Ivory Coast','CIV','🇨🇮','Group E'),('Ecuador','ECU','🇪🇨','Group E'),
  ('Netherlands','NED','🇳🇱','Group F'),('Japan','JPN','🇯🇵','Group F'),('Tunisia','TUN','🇹🇳','Group F'),('Sweden','SWE','🇸🇪','Group F'),
  ('Belgium','BEL','🇧🇪','Group G'),('Egypt','EGY','🇪🇬','Group G'),('Iran','IRN','🇮🇷','Group G'),('New Zealand','NZL','🇳🇿','Group G'),
  ('Spain','ESP','🇪🇸','Group H'),('Cape Verde','CPV','🇨🇻','Group H'),('Saudi Arabia','KSA','🇸🇦','Group H'),('Uruguay','URU','🇺🇾','Group H'),
  ('France','FRA','🇫🇷','Group I'),('Senegal','SEN','🇸🇳','Group I'),('Norway','NOR','🇳🇴','Group I'),('Iraq','IRQ','🇮🇶','Group I'),
  ('Argentina','ARG','🇦🇷','Group J'),('Algeria','ALG','🇩🇿','Group J'),('Austria','AUT','🇦🇹','Group J'),('Jordan','JOR','🇯🇴','Group J'),
  ('Portugal','POR','🇵🇹','Group K'),('Colombia','COL','🇨🇴','Group K'),('Uzbekistan','UZB','🇺🇿','Group K'),('DR Congo','COD','🇨🇩','Group K'),
  ('England','ENG','🏴󠁧󠁢󠁥󠁮󠁧󠁿','Group L'),('Croatia','CRO','🇭🇷','Group L'),('Ghana','GHA','🇬🇭','Group L'),('Panama','PAN','🇵🇦','Group L')
on conflict (code) do nothing;

-- No seed matches — run the sync (npm run sync) to load all 104 real fixtures.
