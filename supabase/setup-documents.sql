-- ============================================================
-- Poppy — Documents Table Setup
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run multiple times.
-- ============================================================

-- 1. Create the documents table
create table if not exists documents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  extracted_text text,
  size_bytes     integer,
  uploaded_at    timestamptz default now()
);

-- 2. If the table was created previously with a file_path column, drop it
alter table documents drop column if exists file_path;

-- 3. Enable Row Level Security
alter table documents enable row level security;

-- 4. Drop existing policies before recreating (safe to re-run)
drop policy if exists "users_select_own_documents" on documents;
drop policy if exists "users_insert_own_documents" on documents;
drop policy if exists "users_delete_own_documents" on documents;

-- 5. RLS policies — each user sees and modifies only their own rows
create policy "users_select_own_documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "users_insert_own_documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "users_delete_own_documents"
  on documents for delete
  using (auth.uid() = user_id);
