-- Minimal fix — safe to run multiple times
-- Stores patient name directly in the consent row (no auth.users join needed)

-- 1. Add patient_name to the consent table
alter table public.patient_doctor_consents
  add column if not exists patient_name text;

-- 2. Drop old function (must drop before recreating with different return columns)
drop function if exists public.get_my_patients();
drop function if exists public.get_patient_for_doctor(uuid);

-- 3. Simple new get_my_patients — reads patient_name from consent row
create function public.get_my_patients()
returns table (
  consent_id         uuid,
  patient_id         uuid,
  patient_name       text,
  patient_conditions text[],
  granted_at         timestamptz,
  is_custodian       boolean,
  carer_name         text
)
language sql security definer stable as $$
  select
    c.id                                                  as consent_id,
    c.patient_id,
    coalesce(c.patient_name, p.name, 'Unnamed patient')   as patient_name,
    p.conditions                                          as patient_conditions,
    c.granted_at,
    coalesce(p.is_custodian, false)                       as is_custodian,
    case when coalesce(p.is_custodian, false) then p.name else null end as carer_name
  from public.patient_doctor_consents c
  left join public.profiles p on p.id = c.patient_id
  where c.status       = 'active'
    and c.doctor_email = (select email from auth.users where id = auth.uid())
  order by c.granted_at desc;
$$;
