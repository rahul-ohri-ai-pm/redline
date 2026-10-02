-- Saved documents. Run by hand in the Supabase SQL editor after 0001.
-- Only extracted text is stored. There is no column for the original file,
-- and no file name either: the title is the only name a document has.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  extracted_text text not null check (char_length(extracted_text) > 0),
  -- The Section[] the parser produced; unreadable sections carry text: null.
  sections jsonb not null,
  -- The RenterProfile the analysis actually ran against.
  profile_snapshot jsonb not null,
  -- The Report exactly as the engine returned it.
  report jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_created_idx
  on public.documents (user_id, created_at desc);

alter table public.documents enable row level security;

drop policy if exists documents_select_own on public.documents;
create policy documents_select_own on public.documents
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists documents_insert_own on public.documents;
create policy documents_insert_own on public.documents
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists documents_update_own on public.documents;
create policy documents_update_own on public.documents
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists documents_delete_own on public.documents;
create policy documents_delete_own on public.documents
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.documents from anon;
grant select, insert, update, delete on public.documents to authenticated;
