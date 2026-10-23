create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  category text not null default 'Personal' check (char_length(category) between 1 and 40),
  icon text not null default 'leaf' check (char_length(icon) <= 40),
  color text not null default 'green' check (char_length(color) <= 30),
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  target_minutes integer check (target_minutes is null or target_minutes between 1 and 1440),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists habits_owner_created_idx on public.habits(owner_id, created_at desc);
create index if not exists habits_owner_active_idx on public.habits(owner_id, archived);
create trigger habits_set_updated_at before update on public.habits
  for each row execute procedure public.set_updated_at();

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  completed_on date not null,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (owner_id, habit_id, completed_on)
);
create index if not exists habit_completions_owner_date_idx on public.habit_completions(owner_id, completed_on desc);
create index if not exists habit_completions_habit_date_idx on public.habit_completions(habit_id, completed_on desc);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  subject text check (subject is null or char_length(subject) <= 80),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds between 1 and 604800),
  session_date date not null,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  check (ended_at >= started_at)
);
create index if not exists study_sessions_owner_date_idx on public.study_sessions(owner_id, session_date desc);

create table if not exists public.coding_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (char_length(trim(platform)) between 1 and 60),
  problem_name text not null check (char_length(trim(problem_name)) between 1 and 160),
  problem_url text check (problem_url is null or (char_length(problem_url) <= 2048 and problem_url ~ '^https?://')),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  topic text check (topic is null or char_length(topic) <= 80),
  language text check (language is null or char_length(language) <= 80),
  time_spent_minutes integer check (time_spent_minutes is null or time_spent_minutes between 1 and 1440),
  solved_on date not null default current_date,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists coding_entries_owner_solved_idx on public.coding_entries(owner_id, solved_on desc);
create index if not exists coding_entries_owner_platform_idx on public.coding_entries(owner_id, platform);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null check (char_length(code) between 1 and 80),
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) between 1 and 300),
  earned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  unique (owner_id, code)
);
create index if not exists achievements_owner_earned_idx on public.achievements(owner_id, earned_at desc);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.study_sessions enable row level security;
alter table public.coding_entries enable row level security;
alter table public.achievements enable row level security;

create policy "Users can read their profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users can update their profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own habits" on public.habits
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage own habit completions" on public.habit_completions
  for all to authenticated using (
    auth.uid() = owner_id and exists (
      select 1 from public.habits h where h.id = habit_id and h.owner_id = auth.uid()
    )
  ) with check (
    auth.uid() = owner_id and exists (
      select 1 from public.habits h where h.id = habit_id and h.owner_id = auth.uid()
    )
  );
create policy "Users manage own study sessions" on public.study_sessions
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage own coding entries" on public.coding_entries
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage own achievements" on public.achievements
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.habits, public.habit_completions,
  public.study_sessions, public.coding_entries, public.achievements to authenticated;
