-- ── condition_data_sources: AI-generated items pending advisor review ──────────

create table if not exists public.condition_data_sources (
  id               uuid primary key default gen_random_uuid(),
  condition_name   text not null,
  source_type      text not null check (source_type in ('specialist', 'article', 'trial', 'community')),
  title            text not null,
  subtitle         text,
  data             jsonb not null,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by      uuid references auth.users,
  reviewed_at      timestamptz,
  generated_at     timestamptz default now()
);

alter table public.condition_data_sources enable row level security;

drop policy if exists "Advisors manage data sources"    on public.condition_data_sources;
drop policy if exists "Users see approved data sources" on public.condition_data_sources;

-- Health advisors and master_admin can read all statuses and write
create policy "Advisors manage data sources"
  on public.condition_data_sources for all
  using  (public.is_health_advisor())
  with check (public.is_health_advisor());

-- Regular authenticated users can only see approved items
create policy "Users see approved data sources"
  on public.condition_data_sources for select
  using (auth.uid() is not null and status = 'approved');
