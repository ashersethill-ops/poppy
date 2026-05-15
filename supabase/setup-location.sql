-- Add location field to profiles
alter table public.profiles
  add column if not exists location text;
