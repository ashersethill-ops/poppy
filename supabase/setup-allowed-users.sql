-- Allowlist for private beta access.
-- Add rows with the email addresses that are permitted to sign in.

create table if not exists public.allowed_users (
  email text primary key
);

alter table public.allowed_users enable row level security;

-- Authenticated users may only check whether their own email is in the list.
drop policy if exists "Users can check their own allowlist entry" on public.allowed_users;
create policy "Users can check their own allowlist entry"
  on public.allowed_users for select
  to authenticated
  using (email = auth.email());
