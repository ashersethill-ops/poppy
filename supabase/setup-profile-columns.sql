-- Ensures all profile columns used by the app exist.
-- Safe to run multiple times (uses IF NOT EXISTS).

alter table public.profiles
  add column if not exists is_custodian  boolean not null default false,
  add column if not exists patient_name  text,
  add column if not exists location      text,
  add column if not exists phone         text,
  add column if not exists date_of_birth date,
  add column if not exists name          text;
