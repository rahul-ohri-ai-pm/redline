-- Profiles and red lines. Run by hand in the Supabase SQL editor.
-- Optional profile columns are nullable on purpose: null means "not
-- provided", which is different from false ("no").

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state text not null check (state ~ '^[A-Z]{2}$'),
  pets boolean,
  joint_lease boolean,
  renter_type text check (renter_type is null or char_length(renter_type) <= 40),
  updated_at timestamptz not null default now()
);

create table if not exists public.red_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 300),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now()
);

create index if not exists red_lines_user_position_idx
  on public.red_lines (user_id, position);

alter table public.profiles enable row level security;
alter table public.red_lines enable row level security;

-- A signed-in user can touch only rows whose user_id is their own id.
-- Nothing is granted to the anon role, so signed-out requests read nothing.

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists red_lines_select_own on public.red_lines;
create policy red_lines_select_own on public.red_lines
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists red_lines_insert_own on public.red_lines;
create policy red_lines_insert_own on public.red_lines
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists red_lines_update_own on public.red_lines;
create policy red_lines_update_own on public.red_lines
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists red_lines_delete_own on public.red_lines;
create policy red_lines_delete_own on public.red_lines
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.profiles from anon;
revoke all on public.red_lines from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.red_lines to authenticated;
