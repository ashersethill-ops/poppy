-- ── 1. Add patient_name column ────────────────────────────────────────────────

alter table public.profiles
  add column if not exists patient_name text;

-- ── 2. Backfill: set profiles.name from auth metadata for any user who never
--       saved their profile page (the most common cause of "Unnamed patient") ──

update public.profiles p
set name = coalesce(
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name',
  u.email
)
from auth.users u
where u.id = p.id
  and p.name is null;

-- ── 3. Trigger: auto-populate profiles.name whenever a new user signs up ──────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.email
    )
  )
  on conflict (id) do update
    set name = coalesce(profiles.name, excluded.name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 4. Updated get_my_patients() — resolves name from auth.users as fallback ──

create or replace function public.get_my_patients()
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
    c.id          as consent_id,
    c.patient_id,
    case
      when coalesce(p.is_custodian, false) then p.patient_name
      else coalesce(
        p.name,
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        u.email
      )
    end           as patient_name,
    p.conditions  as patient_conditions,
    c.granted_at,
    coalesce(p.is_custodian, false) as is_custodian,
    case
      when coalesce(p.is_custodian, false) then coalesce(
        p.name,
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        u.email
      )
      else null
    end           as carer_name
  from public.patient_doctor_consents c
  left join public.profiles p on p.id = c.patient_id
  left join auth.users u       on u.id = c.patient_id
  where c.status = 'active'
    and c.doctor_email = (select email from auth.users where id = auth.uid())
  order by c.granted_at desc;
$$;

-- ── 5. get_patient_for_doctor() — returns full profile with resolved name ──────
--    Used by the patient detail API so it can also resolve names via auth.users

create or replace function public.get_patient_for_doctor(p_patient_id uuid)
returns jsonb language plpgsql security definer stable as $$
declare
  v_has_consent boolean;
  v_result      jsonb;
begin
  select public.has_patient_consent(p_patient_id) into v_has_consent;
  if not v_has_consent then
    raise exception 'Forbidden';
  end if;

  select jsonb_build_object(
    'id',           p.id,
    'name', case
      when coalesce(p.is_custodian, false) then p.patient_name
      else coalesce(
        p.name,
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        u.email
      )
    end,
    'carer_name', case
      when coalesce(p.is_custodian, false) then coalesce(
        p.name,
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        u.email
      )
      else null
    end,
    'is_custodian', coalesce(p.is_custodian, false),
    'conditions',   p.conditions,
    'date_of_birth', p.date_of_birth,
    'email',        p.email
  )
  into v_result
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = p_patient_id;

  return v_result;
end;
$$;
