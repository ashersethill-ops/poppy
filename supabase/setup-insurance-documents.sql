-- Insurance policy documents — stored separately from medical documents
-- to keep insurance records and medical records cleanly distinct.
-- Run once in Supabase SQL Editor.

create table if not exists public.insurance_documents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  name           text not null,
  extracted_text text,
  size_bytes     integer,
  uploaded_at    timestamptz default now()
);

alter table public.insurance_documents enable row level security;

drop policy if exists "Users manage own insurance docs" on public.insurance_documents;
create policy "Users manage own insurance docs"
  on public.insurance_documents for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
