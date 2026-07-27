begin;

create table if not exists public.hub_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null
    check (entry_type in ('ecosistema', 'servizio', 'progetto', 'idea')),
  name text not null
    check (length(btrim(name)) between 2 and 160),
  customer_need text not null
    check (length(btrim(customer_need)) > 0),
  objective text not null
    check (length(btrim(objective)) > 0),
  dna_link text not null
    check (length(btrim(dna_link)) > 0),
  revenue_model text not null
    check (length(btrim(revenue_model)) > 0),
  expected_costs numeric(14, 2) not null default 0
    check (expected_costs >= 0),
  responsible text not null default 'Sotto controllo CEO'
    check (length(btrim(responsible)) > 0),
  time_horizon_days integer not null
    check (time_horizon_days between 1 and 3650),
  risks text not null
    check (length(btrim(risks)) > 0),
  status text not null default 'Da valutare'
    check (status in (
      'Da valutare',
      'Valutazione',
      'Approvato',
      'Progettazione',
      'Test',
      'Operativo',
      'Sospeso',
      'Chiuso',
      'Archiviato'
    )),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists hub_entries_status_idx
  on public.hub_entries (status);

create index if not exists hub_entries_type_idx
  on public.hub_entries (entry_type);

create index if not exists hub_entries_created_at_idx
  on public.hub_entries (created_at desc);

create or replace function public.hub_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hub_entries_set_updated_at on public.hub_entries;
create trigger hub_entries_set_updated_at
before update on public.hub_entries
for each row execute function public.hub_set_updated_at();

alter table public.hub_entries enable row level security;

revoke all on table public.hub_entries from anon;
revoke all on table public.hub_entries from authenticated;
grant select, insert, update on table public.hub_entries to authenticated;

drop policy if exists "hub_entries_ceo_read" on public.hub_entries;
create policy "hub_entries_ceo_read"
on public.hub_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  )
);

drop policy if exists "hub_entries_ceo_create" on public.hub_entries;
create policy "hub_entries_ceo_create"
on public.hub_entries
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  )
);

drop policy if exists "hub_entries_ceo_update" on public.hub_entries;
create policy "hub_entries_ceo_update"
on public.hub_entries
for update
to authenticated
using (
  exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  )
)
with check (
  exists (
    select 1
    from public.hub_profiles profile
    where profile.user_id = auth.uid()
      and profile.active = true
      and profile.role = 'ceo'
  )
);

comment on table public.hub_entries is
  'New entry ECCOMI HUB e relativo percorso di governo. Nessuna cancellazione diretta è consentita.';

commit;

select
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'hub_entries';
