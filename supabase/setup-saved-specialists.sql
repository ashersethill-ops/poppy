create table if not exists saved_specialists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  specialist_email text not null,
  specialist jsonb not null,
  saved_at timestamptz default now(),
  unique(user_id, specialist_email)
);

alter table saved_specialists enable row level security;

drop policy if exists "Users can manage their saved specialists" on saved_specialists;

create policy "Users can manage their saved specialists"
  on saved_specialists
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
