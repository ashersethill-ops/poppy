-- ── 1. Extend profiles with role + email ─────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'health_advisor', 'master_admin'));

alter table public.profiles
  add column if not exists email text;

-- ── 2. Security-definer helpers ────────────────────────────────────────────────
create or replace function public.is_master_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'master_admin'
  );
$$;

create or replace function public.is_health_advisor()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('health_advisor', 'master_admin')
  );
$$;

-- ── 3. Admin user listing (joins auth.users for email + created_at) ───────────
create or replace function public.admin_get_all_users()
returns table (
  id          uuid,
  email       text,
  name        text,
  role        text,
  conditions  text[],
  created_at  timestamptz
)
language sql security definer stable as $$
  select
    u.id,
    coalesce(p.email, u.email)       as email,
    p.name,
    coalesce(p.role, 'user')         as role,
    p.conditions,
    u.created_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  where public.is_master_admin()
  order by u.created_at desc;
$$;

-- ── 4. Profiles RLS – allow master_admin to read/write all rows ────────────────
drop policy if exists "Users can view own profile"    on public.profiles;
drop policy if exists "Users can update own profile"  on public.profiles;
drop policy if exists "Users manage own profile"      on public.profiles;
drop policy if exists "Profile access"                on public.profiles;

create policy "Profile access"
  on public.profiles for all
  using  (id = auth.uid() or public.is_master_admin())
  with check (id = auth.uid() or public.is_master_admin());

-- ── 5. Condition assignments ───────────────────────────────────────────────────
create table if not exists public.condition_assignments (
  id             uuid primary key default gen_random_uuid(),
  condition_name text not null unique,
  advisor_id     uuid references auth.users not null,
  advisor_name   text,
  advisor_email  text,
  assigned_at    timestamptz default now(),
  assigned_by    uuid references auth.users not null
);

alter table public.condition_assignments enable row level security;

drop policy if exists "Admin manages assignments"         on public.condition_assignments;
drop policy if exists "Authenticated view assignments"    on public.condition_assignments;

create policy "Admin manages assignments"
  on public.condition_assignments for all
  using  (public.is_master_admin())
  with check (public.is_master_admin());

create policy "Authenticated view assignments"
  on public.condition_assignments for select
  using (auth.uid() is not null);

-- ── 6. Advisor notes / verifications ──────────────────────────────────────────
create table if not exists public.advisor_notes (
  id             uuid primary key default gen_random_uuid(),
  condition_name text not null,
  advisor_id     uuid references auth.users not null,
  note_type      text not null check (note_type in ('verified', 'warning', 'guideline')),
  title          text not null,
  description    text,
  url            text,
  status         text not null default 'active' check (status in ('active', 'archived')),
  created_at     timestamptz default now()
);

alter table public.advisor_notes enable row level security;

drop policy if exists "Advisors manage own notes"  on public.advisor_notes;
drop policy if exists "Authenticated view notes"   on public.advisor_notes;

create policy "Advisors manage own notes"
  on public.advisor_notes for all
  using  (public.is_master_admin() or (public.is_health_advisor() and advisor_id = auth.uid()))
  with check (public.is_master_admin() or (public.is_health_advisor() and advisor_id = auth.uid()));

create policy "Authenticated view notes"
  on public.advisor_notes for select
  using (auth.uid() is not null and status = 'active');

-- ── HOW TO SET THE FIRST MASTER ADMIN ─────────────────────────────────────────
-- Run this in the Supabase SQL editor, replacing the email:
--
--   update public.profiles
--   set role = 'master_admin'
--   where id = (select id from auth.users where email = 'your@email.com');
