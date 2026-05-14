-- ── 1. Role flags on profiles ─────────────────────────────────────────────────

alter table public.profiles
  add column if not exists is_doctor    boolean not null default false,
  add column if not exists is_custodian boolean not null default false;

-- ── 2. Patient-doctor consent table ──────────────────────────────────────────

create table if not exists public.patient_doctor_consents (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid references auth.users not null,
  doctor_email text not null,
  status       text not null default 'active' check (status in ('active', 'revoked')),
  granted_at   timestamptz default now(),
  revoked_at   timestamptz,
  unique(patient_id, doctor_email)
);

alter table public.patient_doctor_consents enable row level security;

drop policy if exists "Patients manage own consents" on public.patient_doctor_consents;
drop policy if exists "Doctors view their consents"  on public.patient_doctor_consents;

-- Patients can fully manage their own consent rows
create policy "Patients manage own consents"
  on public.patient_doctor_consents for all
  using  (patient_id = auth.uid())
  with check (patient_id = auth.uid());

-- ── 3. Helper: does current user have consent to access this patient? ─────────

create or replace function public.has_patient_consent(p_patient_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.patient_doctor_consents
    where patient_id  = p_patient_id
      and status      = 'active'
      and doctor_email = (select email from auth.users where id = auth.uid())
  );
$$;

-- Doctors can read consent rows where they are the doctor
create policy "Doctors view their consents"
  on public.patient_doctor_consents for select
  using (public.has_patient_consent(patient_id));

-- ── 4. Helper: return all patients who consented to current doctor ─────────────

create or replace function public.get_my_patients()
returns table (
  consent_id         uuid,
  patient_id         uuid,
  patient_name       text,
  patient_conditions text[],
  granted_at         timestamptz
)
language sql security definer stable as $$
  select
    c.id          as consent_id,
    c.patient_id,
    p.name        as patient_name,
    p.conditions  as patient_conditions,
    c.granted_at
  from public.patient_doctor_consents c
  left join public.profiles p on p.id = c.patient_id
  where c.status = 'active'
    and c.doctor_email = (select email from auth.users where id = auth.uid())
  order by c.granted_at desc;
$$;

-- ── 5. Extend RLS so doctors can read consented patients' profiles & documents ─

-- Profiles: add a permissive SELECT policy for consented doctors
drop policy if exists "Doctors read patient profiles" on public.profiles;
create policy "Doctors read patient profiles"
  on public.profiles for select
  using (public.has_patient_consent(id));

-- Documents: add a permissive SELECT policy for consented doctors
-- (existing policy covers the owner; this adds doctor read access)
drop policy if exists "Doctors read patient documents" on public.documents;
create policy "Doctors read patient documents"
  on public.documents for select
  using (public.has_patient_consent(user_id));
