-- Add location field to profiles
-- Stored as plain text (e.g. "London, UK") for use in AI prompts
alter table public.profiles
  add column if not exists location text;
